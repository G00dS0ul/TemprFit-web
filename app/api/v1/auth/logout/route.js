import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { connectDB } from '@/lib/db';
import { revokeToken, AUTH_COOKIE_NAME } from '@/lib/auth';

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

    if (token) {
      await connectDB();
      await revokeToken({ token });
    }

    const response = NextResponse.json({ ok: true });

    // Clear session cookies
    response.cookies.set(AUTH_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('v1 Logout error:', err);
    return NextResponse.json({ error: 'Failed to process logout.' }, { status: 500 });
  }
}
