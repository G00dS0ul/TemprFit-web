import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { initConversationRequestSchema } from '@/lib/contracts/v1/messages';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  let body;
  try {
    const raw = await req.json();
    body = initConversationRequestSchema.parse(raw);
  } catch (err) {
    return NextResponse.json(
      { error: err?.errors?.[0]?.message || 'Invalid conversation init payload' },
      { status: 400 }
    );
  }

  const { targetUserId, confirmXpPayment } = body;

  if (String(targetUserId) === String(user._id)) {
    return NextResponse.json({ error: 'You cannot chat with yourself' }, { status: 400 });
  }

  try {
    const targetUser = await User.findById(targetUserId).select('username avatarUrl plan privacySettings xp');
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const allParticipants = [user._id, targetUser._id];

    // Check if a conversation between these two already exists
    let conversation = await Conversation.findOne({
      participants: { $all: allParticipants, $size: 2 },
    });

    const requiredXpFee =
      targetUser.plan === 'max' && (targetUser.privacySettings?.messageXpFee || 0) > 0
        ? targetUser.privacySettings.messageXpFee
        : 0;

    if (!conversation && requiredXpFee > 0) {
      const senderDoc = await User.findById(user._id);
      const senderXp = senderDoc?.xp || 0;
      const canAfford = senderXp >= requiredXpFee;

      if (!confirmXpPayment) {
        return NextResponse.json(
          {
            requiresXpFee: true,
            fee: requiredXpFee,
            recipientUsername: targetUser.username,
            senderXp,
            canAfford,
            message: `@${targetUser.username} requires a gift of ${requiredXpFee} XP before accepting direct messages.`,
          },
          { status: 402 }
        );
      }

      if (!canAfford) {
        return NextResponse.json(
          {
            error: `Insufficient XP. You need ${requiredXpFee} XP to message @${targetUser.username}, but only have ${senderXp} XP.`,
          },
          { status: 400 }
        );
      }

      // Deduct XP atomically
      senderDoc.xp = senderXp - requiredXpFee;
      targetUser.xp = (targetUser.xp || 0) + requiredXpFee;

      await senderDoc.save();
      await targetUser.save();

      // Dispatch XP gift notification
      await Notification.create({
        user: targetUser._id,
        type: 'xp_gift',
        title: 'XP Gift Received! 🎁',
        message: `@${user.username} sent you ${requiredXpFee} XP to unlock direct messaging.`,
        link: '/messages',
      });
    }

    if (!conversation) {
      conversation = await Conversation.create({
        participants: allParticipants,
      });
    }

    // Populate conversation participants for consumer
    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'username name avatarUrl role plan activeColor activeBorder')
      .populate('lastMessage')
      .lean();

    return NextResponse.json({
      success: true,
      conversationId: conversation._id.toString(),
      conversation: populated || conversation,
    });
  } catch (error) {
    console.error('Failed to init v1 conversation:', error);
    return NextResponse.json({ error: 'Failed to initialize conversation' }, { status: 500 });
  }
}
