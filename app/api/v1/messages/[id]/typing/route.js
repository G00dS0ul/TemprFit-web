import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import { typingStore } from '@/lib/typing-store';
import { typingRequestSchema } from '@/lib/contracts/v1/messages';

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

// GET active typing state for conversation (excludes caller)
export async function GET(req, { params }) {
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

  try {
    const typingUsers = typingStore.getTypingUsers(id, user._id);
    return NextResponse.json({
      isTyping: typingUsers.length > 0,
      typingUsers,
    });
  } catch (err) {
    console.error('Failed to get typing status:', err);
    return NextResponse.json({ error: 'Failed to retrieve typing status' }, { status: 500 });
  }
}

// POST broadcast caller typing pulse in conversation
export async function POST(req, { params }) {
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
    body = typingRequestSchema.parse(raw);
  } catch (err) {
    return NextResponse.json(
      { error: err.errors?.[0]?.message || 'Invalid typing request' },
      { status: 400 }
    );
  }

  try {
    typingStore.setTyping(id, user._id, user.username, body.isTyping);
    return NextResponse.json({
      success: true,
      isTyping: body.isTyping,
    });
  } catch (err) {
    console.error('Failed to broadcast typing status:', err);
    return NextResponse.json({ error: 'Failed to broadcast typing status' }, { status: 500 });
  }
}
