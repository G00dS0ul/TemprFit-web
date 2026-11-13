import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import User from '@/models/User';
import {
  searchUsersQuerySchema,
  searchUsersResponseSchema,
} from '@/lib/contracts/v1/community';

export const dynamic = 'force-dynamic';

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req) {
  try {
    await connectDB();
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsedQuery = searchUsersQuerySchema.safeParse({
      q: searchParams.get('q') || '',
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid search query parameters.', details: parsedQuery.error.flatten() },
        { status: 400 }
      );
    }

    const query = parsedQuery.data.q.trim();
    if (!query) {
      return NextResponse.json({ users: [] });
    }

    const escaped = escapeRegex(query);

    const users = await User.find({
      _id: { $ne: currentUser._id },
      'privacySettings.isProfileHidden': { $ne: true },
      $or: [
        { username: { $regex: escaped, $options: 'i' } },
        { name: { $regex: escaped, $options: 'i' } },
        { 'fitnessProfile.nickname': { $regex: escaped, $options: 'i' } },
      ],
    })
      .select('username name avatarUrl plan role activeColor activeBorder xp')
      .limit(10)
      .lean();

    const formattedUsers = users.map((u) => ({
      _id: u._id.toString(),
      username: u.username,
      name: u.name || null,
      avatarUrl: u.avatarUrl || null,
      plan: u.plan || 'free',
      role: u.role || 'trainee',
      activeColor: u.activeColor || null,
      activeBorder: u.activeBorder || null,
      xp: u.xp || 0,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('V1 User search error:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
