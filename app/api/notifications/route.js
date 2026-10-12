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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const notifications = await Notification.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const unreadCount = notifications.filter(n => !n.read).length;

  let unreadMessagesCount = 0;
  try {
    const userConvs = await Conversation.find({ participants: user._id }).select('_id').lean();
    if (userConvs.length > 0) {
      const convIds = userConvs.map(c => c._id);
      unreadMessagesCount = await Message.countDocuments({
        conversationId: { $in: convIds },
        sender: { $ne: user._id },
        readBy: { $nin: [user._id] }
      });
    }
  } catch (msgErr) {
    console.warn('Failed to calculate unreadMessagesCount:', msgErr);
  }

  return NextResponse.json({ notifications, unreadCount, unreadMessagesCount });
}

export async function PUT(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await Notification.updateMany({ user: user._id, read: false }, { $set: { read: true } });

  return NextResponse.json({ success: true });
}
