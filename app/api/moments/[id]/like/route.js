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
    const moment = await Moment.findById(id);
    if (!moment) return NextResponse.json({ error: 'Moment not found' }, { status: 404 });

    const isLiked = moment.likes && moment.likes.some(l => l.toString() === user._id.toString());
    
    if (isLiked) {
      await Moment.findByIdAndUpdate(id, { $pull: { likes: user._id } });
      return NextResponse.json({ success: true, isLiked: false });
    } else {
      await Moment.findByIdAndUpdate(id, { $addToSet: { likes: user._id } });
      
      // Send notification if liking someone else's moment
      if (moment.user.toString() !== user._id.toString()) {
        const Notification = (await import('@/models/Notification')).default;
        await Notification.create({
          user: moment.user,
          title: 'New Like',
          message: `${user.username || 'Someone'} liked your moment!`,
          type: 'social',
          link: '/moments'
        });
      }

      return NextResponse.json({ success: true, isLiked: true });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
