import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Moment from '@/models/Moment';
import { getSessionUser } from '@/lib/auth';

export async function POST(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { id, commentId } = params;

  try {
    const { text } = await req.json();
    if (!text || !text.trim()) return NextResponse.json({ error: 'Reply text is required' }, { status: 400 });

    const moment = await Moment.findById(id);
    if (!moment) return NextResponse.json({ error: 'Moment not found' }, { status: 404 });

    const comment = moment.comments.id(commentId);
    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

    comment.replies.push({
      user: user._id,
      text: text.trim()
    });

    await moment.save();
    
    // Return updated comment so UI can patch it
    const updatedMoment = await Moment.findById(id)
      .populate('comments.user', 'username avatarUrl')
      .populate('comments.replies.user', 'username avatarUrl');
      
    const updatedComment = updatedMoment.comments.id(commentId);

    // Send notification to the comment owner
    if (comment.user.toString() !== user._id.toString()) {
      const Notification = (await import('@/models/Notification')).default;
      await Notification.create({
        user: comment.user,
        title: 'New Reply',
        message: `${user.username || 'Someone'} replied to your comment: "${text.trim().substring(0, 20)}..."`,
        type: 'social',
        link: '/moments'
      });
    }

    return NextResponse.json({ success: true, comment: updatedComment });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
