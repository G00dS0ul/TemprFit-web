import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  try {
    const conversations = await Conversation.find({ participants: user._id })
      .populate('participants', 'username avatarUrl role')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ conversations });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
