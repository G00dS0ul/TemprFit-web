import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  await connectDB();
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const user = await User.findById(sessionUser._id);
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  user.emailVerified = true;
  await user.save();

  return NextResponse.json({ success: true, user: user.toSafeObject() });
}
