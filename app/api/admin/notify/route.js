import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Notification from '@/models/Notification';
import User from '@/models/User';

export async function POST(req) {
  await connectDB();
  const sessionUser = await getSessionUser();
  const { cookies } = await import('next/headers');
  if (!sessionUser || (sessionUser.role !== 'admin' && cookies().get('admin_token')?.value !== 'true')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { userId, title, message, link } = await req.json();
    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'userId, title, and message are required' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type: 'system',
      link: link || ''
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('Notify error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
