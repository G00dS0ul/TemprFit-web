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

    // Determine reward via RNG
    const roll = Math.random() * 100;
    let reward = null;

    if (roll < 50) {
      // 50% chance for 500 XP
      user.xp = (user.xp || 0) + 500;
      reward = { type: 'xp', value: 500, name: '500 XP' };
    } else if (roll < 90) {
      // 40% chance for 1000 XP
      user.xp = (user.xp || 0) + 1000;
      reward = { type: 'xp', value: 1000, name: '1000 XP' };
    } else {
      // 10% chance for Streak Freeze
      if (!user.inventory) user.inventory = {};
      user.inventory.streak_freeze = (user.inventory.streak_freeze || 0) + 1;
      user.markModified('inventory');
      reward = { type: 'item', value: 'streak_freeze', name: '1x Streak Freeze' };
    }

    await user.save();

    return NextResponse.json({ success: true, reward });
  } catch (error) {
    console.error('Mystery Box error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
