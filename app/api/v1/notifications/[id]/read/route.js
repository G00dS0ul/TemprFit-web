import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Notification from '@/models/Notification';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const { id } = params;

  try {
    const notification = await Notification.findOne({ _id: id, user: user._id });
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    notification.read = true;
    await notification.save();

    return NextResponse.json({ success: true, notification });
  } catch (err) {
    console.error('Failed to mark notification read:', err);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
