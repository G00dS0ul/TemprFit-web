import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Notification from '@/models/Notification';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)));

    const notifications = await Notification.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Accurate count across entire collection for user
    const unreadCount = await Notification.countDocuments({
      user: user._id,
      read: false,
    });

    let unreadMessagesCount = 0;
    try {
      const userConvs = await Conversation.find({ participants: user._id }).select('_id').lean();
      if (userConvs.length > 0) {
        const convIds = userConvs.map((c) => c._id);
        unreadMessagesCount = await Message.countDocuments({
          conversationId: { $in: convIds },
          sender: { $ne: user._id },
          readBy: { $nin: [user._id] },
        });
      }
    } catch (msgErr) {
      console.warn('Failed to calculate unreadMessagesCount:', msgErr);
    }

    return NextResponse.json({ notifications, unreadCount, unreadMessagesCount });
  } catch (err) {
    console.error('Failed to fetch v1 notifications:', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT() {
  await connectDB();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  try {
    await Notification.updateMany({ user: user._id, read: false }, { $set: { read: true } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to mark all notifications read:', err);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
