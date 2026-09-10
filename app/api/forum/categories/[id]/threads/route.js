import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ForumThread from '@/models/ForumThread';
import ForumReply from '@/models/ForumReply';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  await connectDB();
  const { id } = params;

  try {
    const threads = await ForumThread.find({ category: id })
      .sort({ isPinned: -1, createdAt: -1 })
      .populate('author', 'username avatarUrl role trainerInfo.isVerified')
      .lean();
    
    // Add reply counts
    const threadsWithCounts = await Promise.all(threads.map(async (thread) => {
      const replyCount = await ForumReply.countDocuments({ thread: thread._id });
      return { ...thread, replyCount };
    }));

    return NextResponse.json({ threads: threadsWithCounts });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { id } = params;
  
  try {
    const { title, content } = await req.json();
    if (!title || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const newThread = await ForumThread.create({
      category: id,
      author: user._id,
      title,
      content,
    });

    await newThread.populate('author', 'username avatarUrl role trainerInfo.isVerified');
    
    return NextResponse.json({ success: true, thread: { ...newThread.toObject(), replyCount: 0 } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
  }
}
