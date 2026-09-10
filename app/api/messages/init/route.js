import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Conversation from '@/models/Conversation';

export async function POST(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  try {
    const { targetUserId } = await req.json();
    if (!targetUserId) return NextResponse.json({ error: 'Target user required' }, { status: 400 });

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [user._id, targetUserId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [user._id, targetUserId]
      });
    }

    return NextResponse.json({ success: true, conversationId: conversation._id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to init conversation' }, { status: 500 });
  }
}
