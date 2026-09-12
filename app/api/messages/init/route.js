import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Conversation from '@/models/Conversation';

export async function POST(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  try {
    const { targetUserId, targetUserIds } = await req.json();
    
    // Support either a single ID or an array of IDs
    const otherParticipants = targetUserIds || (targetUserId ? [targetUserId] : []);
    if (otherParticipants.length === 0) {
      return NextResponse.json({ error: 'Target user(s) required' }, { status: 400 });
    }

    const allParticipants = [user._id, ...otherParticipants];

    // Check if a conversation with EXACTLY these participants already exists
    let conversation = await Conversation.findOne({
      participants: { $all: allParticipants, $size: allParticipants.length }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: allParticipants
      });
    }

    return NextResponse.json({ success: true, conversationId: conversation._id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to init conversation' }, { status: 500 });
  }
}
