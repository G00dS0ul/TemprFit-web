import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import {
  verifyToken,
  signToken,
  isTokenRevoked,
  revokeToken,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE,
} from '@/lib/auth';

export async function POST() {
  try {
    let token = null;

    // 1. Dual-read: check Authorization: Bearer <token>
    try {
      const authHeader = headers().get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      }
    } catch {}

    // 2. Dual-read: fall back to repily_token cookie
    if (!token) {
      try {
        token = cookies().get(AUTH_COOKIE_NAME)?.value;
      } catch {}
    }

    if (!token) {
      return NextResponse.json({ error: 'No active session token provided.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired session token.' }, { status: 401 });
    }

    await connectDB();

    const revoked = await isTokenRevoked({ jti: payload.jti, token });
    if (revoked) {
      return NextResponse.json({ error: 'Session token has been revoked.' }, { status: 401 });
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 401 });
    }

    if (user.isBanned) {
      return NextResponse.json({ error: 'User account is suspended.' }, { status: 403 });
    }

    // Invalidate old token on refresh to avoid token proliferation
    await revokeToken({ token, userId: user._id });

    // Issue fresh 30-day token
    const freshToken = signToken({ userId: user._id.toString(), role: user.role });

    const response = NextResponse.json({
      token: freshToken,
      user: user.toSafeObject(),
    });

    response.cookies.set(AUTH_COOKIE_NAME, freshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('v1 Refresh error:', err);
    return NextResponse.json({ error: 'Failed to refresh authentication session.' }, { status: 500 });
  }
}
