import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(req) {
  try {
    await connectDB();
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (user.lastCheckInDate === todayStr) {
      return NextResponse.json({ error: 'Already checked in today', xp: user.xp }, { status: 400 });
    }

    // Determine yesterday's date to check if streak is alive
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (user.lastCheckInDate === yesterdayStr) {
      // Streak continues normally
      user.checkInStreak = (user.checkInStreak || 0) + 1;
      user.totalCheckInStreak = (user.totalCheckInStreak || 0) + 1;
    } else {
      // They missed yesterday (or more). Check if they have a Streak Freeze.
      if (user.inventory && user.inventory.streak_freeze > 0) {
        // Consume 1 Streak Freeze and continue the streak!
        user.inventory.streak_freeze -= 1;
        user.checkInStreak = (user.checkInStreak || 0) + 1;
        user.totalCheckInStreak = (user.totalCheckInStreak || 0) + 1;
        // Mark that a freeze was used so the frontend can show a special animation
        user.markModified('inventory');
      } else {
        // No freeze available, streak breaks / restarts
        user.checkInStreak = 1;
        user.totalCheckInStreak = 1;
      }
    }

    if ((user.totalCheckInStreak || 1) > (user.longestCheckInStreak || 0)) {
      user.longestCheckInStreak = user.totalCheckInStreak;
    }

    // Reset after 7 days
    if (user.checkInStreak > 7) {
      user.checkInStreak = 1;
    }

    user.lastCheckInDate = todayStr;
    
    // Base XP is 50. 
    // 4-day streak = double points (100)
    // 7-day streak (1 week) = 200 points
    let xpAward = 50;
    if (user.checkInStreak === 4) {
      xpAward = 100;
    } else if (user.checkInStreak === 7) {
      xpAward = 200;
    }
    
    user.xp = (user.xp || 0) + xpAward;
    await user.save();

    return NextResponse.json({ 
      success: true, 
      xp: user.xp, 
      xpAward,
      lastCheckInDate: user.lastCheckInDate,
      checkInStreak: user.checkInStreak,
      totalCheckInStreak: user.totalCheckInStreak
    });
  } catch (error) {
    console.error('Checkin error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
