import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { getSessionUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const auth = await getSessionUser();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    await connectDB();

    const user = auth;
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.role === 'trainer') {
      return NextResponse.json({ error: 'Already a trainer' }, { status: 400 });
    }

    user.role = 'trainer';
    user.trainerInfo = {
      bio: body.bio || '',
      specialties: body.specialties || [],
      pricePerSession: body.pricePerSession || 50,
      availableSpots: body.sessionsPerWeek || 10,
    };

    await user.save();

    // Notify admins
    const admins = await User.find({ role: 'admin' }).select('_id');
    if (admins.length > 0) {
      const adminNotifications = admins.map(admin => ({
        user: admin._id,
        title: 'New Trainer Joined',
        message: `${user.username} has become a trainer.`,
        type: 'system',
        link: '/admin'
      }));
      await Notification.insertMany(adminNotifications);
    }

    return NextResponse.json({ success: true, user: user.toSafeObject() });
  } catch (error) {
    console.error('Become trainer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
