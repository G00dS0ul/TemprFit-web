import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Moment from '@/models/Moment';
import { getSessionUser } from '@/lib/auth';

export async function POST(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { id, commentId, replyId } = params;

  try {
    const moment = await Moment.findById(id);
    if (!moment) return NextResponse.json({ error: 'Moment not found' }, { status: 404 });

    const comment = moment.comments.id(commentId);
    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

    const reply = comment.replies.id(replyId);
    if (!reply) return NextResponse.json({ error: 'Reply not found' }, { status: 404 });

    const userIdStr = user._id.toString();
    const hasLiked = reply.likes.some(uId => uId.toString() === userIdStr);

    if (hasLiked) {
      reply.likes = reply.likes.filter(uId => uId.toString() !== userIdStr);
    } else {
      reply.likes.push(user._id);
    }

    await moment.save();
    
    // Return updated comment so UI can patch it
    const updatedMoment = await Moment.findById(id)
      .populate('comments.user', 'username avatarUrl')
      .populate('comments.replies.user', 'username avatarUrl');
      
    const updatedComment = updatedMoment.comments.id(commentId);

    // Notification logic
    if (!hasLiked && reply.user.toString() !== user._id.toString()) {
      const Notification = (await import('@/models/Notification')).default;
      await Notification.create({
        user: reply.user,
        title: 'New Like',
        message: `${user.username || 'Someone'} liked your reply: "${reply.text.trim().substring(0, 20)}..."`,
        type: 'social',
        link: '/moments'
      });
    }

    return NextResponse.json({ success: true, isLiked: !hasLiked, comment: updatedComment });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
