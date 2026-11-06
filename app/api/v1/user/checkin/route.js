import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { userCheckInResponseSchema } from '@/lib/contracts/v1/user';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await connectDB();
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (user.lastCheckInDate === todayStr) {
      return NextResponse.json(
        { error: 'Already checked in today', xp: user.xp },
        { status: 400 }
      );
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (user.lastCheckInDate === yesterdayStr) {
      user.checkInStreak = (user.checkInStreak || 0) + 1;
      user.totalCheckInStreak = (user.totalCheckInStreak || 0) + 1;
    } else {
      if (user.inventory && user.inventory.streak_freeze > 0) {
        user.inventory.streak_freeze -= 1;
        user.checkInStreak = (user.checkInStreak || 0) + 1;
        user.totalCheckInStreak = (user.totalCheckInStreak || 0) + 1;
        user.markModified('inventory');
      } else {
        user.checkInStreak = 1;
        user.totalCheckInStreak = 1;
      }
    }

    if ((user.totalCheckInStreak || 1) > (user.longestCheckInStreak || 0)) {
      user.longestCheckInStreak = user.totalCheckInStreak;
    }

    if (user.checkInStreak > 7) {
      user.checkInStreak = 1;
    }

    let baseXP = 50;
    let multiplier = 1;
    if (user.checkInStreak === 4) multiplier = 2;
    if (user.checkInStreak === 7) multiplier = 4;

    const xpAward = baseXP * multiplier;
    user.xp = (user.xp || 0) + xpAward;
    user.lastCheckInDate = todayStr;

    await user.save();

    const responsePayload = {
      success: true,
      xp: user.xp,
      xpAward,
      lastCheckInDate: user.lastCheckInDate,
      checkInStreak: user.checkInStreak,
      totalCheckInStreak: user.totalCheckInStreak,
    };

    const validated = userCheckInResponseSchema.parse(responsePayload);
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/user/checkin] POST Error:', err);
    return NextResponse.json(
      { error: 'Failed to complete daily check-in.' },
      { status: 500 }
    );
  }
}
