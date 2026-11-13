import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Notification from '@/models/Notification';
import { sendMessageRequestSchema, patchMessageRequestSchema } from '@/lib/contracts/v1/messages';

export const dynamic = 'force-dynamic';

async function getAuthorizedConversation(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return { error: 'Conversation not found', status: 404 };
  }
  const isParticipant = conversation.participants.some(
    (p) => String(p) === String(userId)
  );
  if (!isParticipant) {
    return { error: 'Not authorized to access this conversation', status: 403 };
  }
  return { conversation };
}

// GET messages in conversation & mark unseen as seen
export async function GET(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const { id } = params;
  const { conversation, error, status } = await getAuthorizedConversation(id, user._id);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    // Mark messages from others as seen
    await Message.updateMany(
      {
        conversationId: id,
        sender: { $ne: user._id },
      },
      {
        $addToSet: { readBy: user._id },
        $set: { status: 'seen' },
      }
    );

    const { searchParams } = new URL(req.url);
    const since = searchParams.get('since');

    const filter = { conversationId: id };
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        filter.updatedAt = { $gt: sinceDate };
      }
    }

    const messages = await Message.find(filter)
      .populate('sender', 'username name avatarUrl role plan activeColor activeBorder')
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ messages });
  } catch (err) {
    console.error('Failed to fetch v1 messages:', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST new message in conversation
export async function POST(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const { id } = params;
  const { conversation, error, status } = await getAuthorizedConversation(id, user._id);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  let body;
  try {
    const raw = await req.json();
    body = sendMessageRequestSchema.parse(raw);
  } catch (err) {
    return NextResponse.json(
      { error: err?.errors?.[0]?.message || 'Invalid message payload' },
      { status: 400 }
    );
  }

  const { text, replyTo } = body;

  try {
    const messageData = {
      conversationId: id,
      sender: user._id,
      text: text.trim(),
      readBy: [user._id],
      status: 'delivered',
    };

    if (replyTo && replyTo.messageId) {
      messageData.replyTo = replyTo;
    }

    const newMessage = await Message.create(messageData);

    conversation.lastMessage = newMessage._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    await newMessage.populate('sender', 'username name avatarUrl role plan activeColor activeBorder');

    // Notify other participants
    const otherParticipantIds = conversation.participants.filter(
      (p) => String(p) !== String(user._id)
    );
    for (const pId of otherParticipantIds) {
      try {
        await Notification.create({
          user: pId,
          title: `New message from @${user.username}`,
          message: text.trim().slice(0, 90),
          type: 'message',
          link: `/messages?convId=${id}`,
        });
      } catch (notifErr) {
        console.warn('Failed to dispatch message notification:', notifErr?.message || notifErr);
      }
    }

    return NextResponse.json({ success: true, message: newMessage }, { status: 201 });
  } catch (err) {
    console.error('Failed to send v1 message:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// PATCH edit message text OR toggle like
export async function PATCH(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const { id } = params;
  const { error, status } = await getAuthorizedConversation(id, user._id);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  let body;
  try {
    const raw = await req.json();
    body = patchMessageRequestSchema.parse(raw);
  } catch (err) {
    return NextResponse.json(
      { error: err?.errors?.[0]?.message || 'Invalid patch message payload' },
      { status: 400 }
    );
  }

  const { messageId, text, action } = body;
  if (!messageId) {
    return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
  }

  try {
    const msg = await Message.findOne({ _id: messageId, conversationId: id });
    if (!msg) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (action === 'like') {
      msg.likes = msg.likes || [];
      const hasLiked = msg.likes.some((l) => String(l) === String(user._id));
      if (hasLiked) {
        msg.likes = msg.likes.filter((l) => String(l) !== String(user._id));
      } else {
        msg.likes.push(user._id);
      }
      await msg.save();
      await msg.populate('sender', 'username name avatarUrl role plan activeColor activeBorder');
      return NextResponse.json({ success: true, message: msg });
    }

    // Text edit
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text is required to edit message' }, { status: 400 });
    }

    if (String(msg.sender) !== String(user._id)) {
      return NextResponse.json({ error: 'You can only edit your own messages' }, { status: 403 });
    }

    msg.text = text.trim();
    msg.isEdited = true;
    msg.editedAt = new Date();
    await msg.save();
    await msg.populate('sender', 'username name avatarUrl role plan activeColor activeBorder');

    return NextResponse.json({ success: true, message: msg });
  } catch (err) {
    console.error('Failed to patch v1 message:', err);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

// DELETE own message
export async function DELETE(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const { id } = params;
  const { conversation, error, status } = await getAuthorizedConversation(id, user._id);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('messageId');
    if (!messageId) {
      return NextResponse.json({ error: 'messageId query parameter is required' }, { status: 400 });
    }

    const msg = await Message.findOne({ _id: messageId, conversationId: id });
    if (!msg) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (String(msg.sender) !== String(user._id)) {
      return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 });
    }

    await Message.findByIdAndDelete(messageId);

    // If deleted message was conversation.lastMessage, update with the latest remaining
    if (String(conversation.lastMessage) === String(messageId)) {
      const remainingLast = await Message.findOne({ conversationId: id })
        .sort({ createdAt: -1 })
        .select('_id');
      conversation.lastMessage = remainingLast ? remainingLast._id : null;
      await conversation.save();
    }

    return NextResponse.json({ success: true, deletedMessageId: messageId });
  } catch (err) {
    console.error('Failed to delete v1 message:', err);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
