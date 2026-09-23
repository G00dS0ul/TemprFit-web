import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!code) {
      return NextResponse.json({ error: 'Verification code is required.' }, { status: 400 });
    }

    const user = await User.findById(sessionUser._id);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (user.emailVerified && user.isVerified) {
      return NextResponse.json({ success: true, message: 'Email is already verified.', user: user.toSafeObject() });
    }

    if (!user.verificationCode) {
      return NextResponse.json({ error: 'No verification code requested or already used.' }, { status: 400 });
    }

    if (user.verificationCodeExpiresAt && new Date() > user.verificationCodeExpiresAt) {
      return NextResponse.json({ error: 'Verification code has expired. Please request a new code.' }, { status: 400 });
    }

    if (user.verificationCode !== code) {
      return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 });
    }

    user.emailVerified = true;
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiresAt = null;
    await user.save();

    return NextResponse.json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    console.error('Email verification error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
