import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Moment from '@/models/Moment';
import { getSessionUser } from '@/lib/auth';

export async function POST(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { id } = params;
  if (!id) return NextResponse.json({ error: 'Moment ID required' }, { status: 400 });

  try {
    const { text } = await req.json();
    if (!text || !text.trim()) return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });

    const moment = await Moment.findByIdAndUpdate(
      id,
      {
        $push: {
          comments: { user: user._id, text: text.trim() }
        }
      },
      { new: true }
    ).populate('comments.user', 'username avatarUrl');

    if (!moment) return NextResponse.json({ error: 'Moment not found' }, { status: 404 });

    // Send notification if commenting on someone else's moment
    if (moment.user.toString() !== user._id.toString()) {
      const Notification = (await import('@/models/Notification')).default;
      await Notification.create({
        user: moment.user,
        title: 'New Comment',
        message: `${user.username || 'Someone'} commented on your moment: "${text.trim().substring(0, 20)}..."`,
        type: 'social',
        link: '/moments'
      });
    }

    return NextResponse.json({ success: true, comments: moment.comments });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
