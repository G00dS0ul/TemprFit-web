import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  try {
    const rawConversations = await Conversation.find({ participants: user._id })
      .populate('participants', 'username name avatarUrl role plan activeColor activeBorder')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username name avatarUrl' },
      })
      .sort({ updatedAt: -1 })
      .lean();

    // Attach per-conversation unread count
    const conversations = await Promise.all(
      rawConversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          sender: { $ne: user._id },
          readBy: { $nin: [user._id] },
        });
        return {
          ...conv,
          unreadCount,
        };
      })
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Failed to fetch v1 conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
