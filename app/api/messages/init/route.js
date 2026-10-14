import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import User from '@/models/User';
import Notification from '@/models/Notification';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  try {
    const { targetUserId, targetUserIds, confirmXpPayment } = await req.json();
    
    // Support either a single ID or an array of IDs
    const otherParticipants = targetUserIds || (targetUserId ? [targetUserId] : []);
    if (otherParticipants.length === 0) {
      return NextResponse.json({ error: 'Target user required' }, { status: 400 });
    }

    if (otherParticipants.length === 1 && String(otherParticipants[0]) === String(user._id)) {
      return NextResponse.json({ error: 'You cannot chat with yourself' }, { status: 400 });
    }

    const recipientId = otherParticipants[0];
    const targetUser = await User.findById(recipientId).select('username avatarUrl plan privacySettings xp');
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const allParticipants = [user._id, ...otherParticipants];

    // Check if a conversation with EXACTLY these participants already exists
    let conversation = await Conversation.findOne({
      participants: { $all: allParticipants, $size: allParticipants.length }
    });

    // Check XP fee requirement if target user is Max tier and has set a message fee
    const requiredXpFee = (targetUser.plan === 'max' && targetUser.privacySettings?.messageXpFee > 0)
      ? targetUser.privacySettings.messageXpFee
      : 0;

    if (!conversation && requiredXpFee > 0) {
      if (!confirmXpPayment) {
        return NextResponse.json({
          requiresXpFee: true,
          fee: requiredXpFee,
          recipientUsername: targetUser.username,
          senderXp: user.xp || 0,
          canAfford: (user.xp || 0) >= requiredXpFee,
          message: `@${targetUser.username} requires a gift of ${requiredXpFee} XP before accepting direct messages.`
        }, { status: 402 });
      }

      // User confirmed payment
      const currentUserDoc = await User.findById(user._id);
      if ((currentUserDoc.xp || 0) < requiredXpFee) {
        return NextResponse.json({
          error: `Insufficient XP. You need ${requiredXpFee} XP to message @${targetUser.username}, but only have ${currentUserDoc.xp || 0} XP.`
        }, { status: 400 });
      }

      // Deduct from sender and award to recipient
      currentUserDoc.xp = (currentUserDoc.xp || 0) - requiredXpFee;
      targetUser.xp = (targetUser.xp || 0) + requiredXpFee;

      await currentUserDoc.save();
      await targetUser.save();

      // Create notification for recipient
      await Notification.create({
        user: targetUser._id,
        type: 'xp_gift',
        title: 'XP Gift Received! 🎁',
        message: `@${user.username} sent you ${requiredXpFee} XP to unlock direct messaging.`,
        link: '/messages'
      });
    }

    if (!conversation) {
      conversation = await Conversation.create({
        participants: allParticipants
      });
    }

    return NextResponse.json({ success: true, conversationId: conversation._id });
  } catch (error) {
    console.error('Failed to init conversation:', error);
    return NextResponse.json({ error: 'Failed to initialize conversation' }, { status: 500 });
  }
}
