import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import Notification from '@/models/Notification';

export const dynamic = 'force-dynamic';

// GET messages in conversation & mark as seen
export async function GET(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { id } = params;

  try {
    // Mark messages from other participants as seen
    await Message.updateMany(
      { 
        conversationId: id, 
        sender: { $ne: user._id }
      },
      { 
        $addToSet: { readBy: user._id },
        $set: { status: 'seen' }
      }
    );

    const messages = await Message.find({ conversationId: id })
      .populate('sender', 'username avatarUrl role plan activeColor activeBorder')
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST new message (with optional replyTo)
export async function POST(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { id } = params;

  try {
    const { text, replyTo } = await req.json();
    if (!text || !text.trim()) return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });

    const conversation = await Conversation.findById(id);
    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    
    const isParticipant = conversation.participants.some(p => String(p) === String(user._id));
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    const messageData = {
      conversationId: id,
      sender: user._id,
      text: text.trim(),
      readBy: [user._id],
      status: 'delivered' // sent to server and ready for recipient
    };

    if (replyTo && replyTo.messageId) {
      messageData.replyTo = replyTo;
    }

    const newMessage = await Message.create(messageData);

    conversation.lastMessage = newMessage._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    await newMessage.populate('sender', 'username avatarUrl role plan activeColor activeBorder');

    // Notify other participants
    const otherParticipantIds = conversation.participants.filter(p => p.toString() !== user._id.toString());
    for (const pId of otherParticipantIds) {
      try {
        await Notification.create({
          user: pId,
          title: `New message from @${user.username}`,
          message: text.trim().slice(0, 90),
          type: 'message',
          link: `/messages?convId=${id}`
        });
      } catch (notifErr) {
        console.warn('Failed to dispatch message notification:', notifErr?.message || notifErr);
      }
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// PATCH edit message text OR like/unlike message
export async function PATCH(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  try {
    const { messageId, text, action } = await req.json();
    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const msg = await Message.findById(messageId);
    if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    // Handle like / unlike
    if (action === 'like') {
      msg.likes = msg.likes || [];
      const hasLiked = msg.likes.some(l => String(l) === String(user._id));
      if (hasLiked) {
        msg.likes = msg.likes.filter(l => String(l) !== String(user._id));
      } else {
        msg.likes.push(user._id);
      }
      await msg.save();
      await msg.populate('sender', 'username avatarUrl role plan activeColor activeBorder');
      return NextResponse.json({ success: true, message: msg });
    }

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Message ID and text are required' }, { status: 400 });
    }

    if (String(msg.sender) !== String(user._id)) {
      return NextResponse.json({ error: 'You can only edit your own messages' }, { status: 403 });
    }

    msg.text = text.trim();
    msg.isEdited = true;
    msg.editedAt = new Date();
    await msg.save();
    await msg.populate('sender', 'username avatarUrl role plan activeColor activeBorder');

    return NextResponse.json({ success: true, message: msg });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to edit message' }, { status: 500 });
  }
}

// DELETE delete message
export async function DELETE(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('messageId');
    if (!messageId) return NextResponse.json({ error: 'Message ID required' }, { status: 400 });

    const msg = await Message.findById(messageId);
    if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    if (String(msg.sender) !== String(user._id)) {
      return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 });
    }

    await Message.findByIdAndDelete(messageId);
    return NextResponse.json({ success: true, deletedMessageId: messageId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
