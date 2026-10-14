import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q) {
      return NextResponse.json({ users: [] });
    }

    // Search users by username or nickname
    const users = await User.find({
      _id: { $ne: user._id },
      'privacySettings.isProfileHidden': { $ne: true },
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { 'fitnessProfile.nickname': { $regex: q, $options: 'i' } }
      ]
    })
      .select('username name avatarUrl plan role activeColor activeBorder xp privacySettings')
      .limit(10)
      .lean();

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
