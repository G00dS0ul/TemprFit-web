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
    const moment = await Moment.findById(id);
    if (!moment) return NextResponse.json({ error: 'Moment not found' }, { status: 404 });

    const comment = moment.comments.id(commentId);
    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

    const userIdStr = user._id.toString();
    const hasLiked = comment.likes.some(uId => uId.toString() === userIdStr);

    if (hasLiked) {
      comment.likes = comment.likes.filter(uId => uId.toString() !== userIdStr);
    } else {
      comment.likes.push(user._id);
    }

    await moment.save();
    
    // Return updated comment so UI can patch it
    const updatedMoment = await Moment.findById(id)
      .populate('comments.user', 'username avatarUrl')
      .populate('comments.replies.user', 'username avatarUrl');
      
    const updatedComment = updatedMoment.comments.id(commentId);

    // Notification logic
    if (!hasLiked && comment.user.toString() !== user._id.toString()) {
      const Notification = (await import('@/models/Notification')).default;
      await Notification.create({
        user: comment.user,
        title: 'New Like',
        message: `${user.username || 'Someone'} liked your comment: "${comment.text.trim().substring(0, 20)}..."`,
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
