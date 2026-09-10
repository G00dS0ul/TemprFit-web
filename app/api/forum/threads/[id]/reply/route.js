import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ForumThread from '@/models/ForumThread';
import ForumReply from '@/models/ForumReply';
import { getSessionUser } from '@/lib/auth';

export async function POST(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { id } = params;
  
  try {
    const thread = await ForumThread.findById(id);
    if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    if (thread.isLocked) return NextResponse.json({ error: 'Thread is locked' }, { status: 403 });

    const { content } = await req.json();
    if (!content) return NextResponse.json({ error: 'Missing content' }, { status: 400 });

    const reply = await ForumReply.create({
      thread: id,
      author: user._id,
      content,
    });

    await reply.populate('author', 'username avatarUrl role trainerInfo.isVerified');
    
    // Send Notification to thread author
    if (thread.author.toString() !== user._id.toString()) {
      const Notification = (await import('@/models/Notification')).default;
      await Notification.create({
        user: thread.author,
        title: 'New Forum Reply',
        message: `${user.username || 'Someone'} replied to your thread "${thread.title}"`,
        type: 'forum',
        link: `/forum/thread/${id}`
      });
    }

    return NextResponse.json({ success: true, reply }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to post reply' }, { status: 500 });
  }
}
