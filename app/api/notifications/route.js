import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Notification from '@/models/Notification';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const notifications = await Notification.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const unreadCount = notifications.filter(n => !n.read).length;

  return NextResponse.json({ notifications, unreadCount });
}

export async function PUT(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await Notification.updateMany({ user: user._id, read: false }, { $set: { read: true } });

  return NextResponse.json({ success: true });
}
