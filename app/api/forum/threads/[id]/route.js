import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ForumThread from '@/models/ForumThread';
import ForumReply from '@/models/ForumReply';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  await connectDB();
  const { id } = params;

  try {
    const thread = await ForumThread.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true })
      .populate('author', 'username avatarUrl role trainerInfo.isVerified')
      .lean();
      
    if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 });

    const replies = await ForumReply.find({ thread: id })
      .sort({ createdAt: 1 })
      .populate('author', 'username avatarUrl role trainerInfo.isVerified')
      .lean();

    return NextResponse.json({ thread, replies });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 });
  }
}
