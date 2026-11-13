import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Notification from '@/models/Notification';

export const dynamic = 'force-dynamic';

export async function DELETE(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const { id } = params;

  try {
    const deleted = await Notification.findOneAndDelete({ _id: id, user: user._id });
    if (!deleted) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('Failed to delete notification:', err);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
