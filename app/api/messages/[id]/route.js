import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import Notification from '@/models/Notification';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { id } = params;

  try {
    const messages = await Message.find({ conversationId: id })
      .populate('sender', 'username avatarUrl')
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { id } = params;

  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });

    const conversation = await Conversation.findById(id);
    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    
    if (!conversation.participants.includes(user._id)) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    const newMessage = await Message.create({
      conversationId: id,
      sender: user._id,
      text,
      readBy: [user._id]
    });

    conversation.lastMessage = newMessage._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    await newMessage.populate('sender', 'username avatarUrl');

    // Notify other participants
    const otherParticipantIds = conversation.participants.filter(p => p.toString() !== user._id.toString());
    for (const pId of otherParticipantIds) {
      await Notification.create({
        user: pId,
        title: 'New Message',
        message: `${user.username} sent you a message`,
        type: 'message',
        link: `/messages`
      });
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
