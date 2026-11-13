import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import User from '@/models/User';
import {
  verifyToken,
  signToken,
  isTokenRevoked,
  revokeToken,
  RevocationUnavailableError,
  AUTH_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE,
} from '@/lib/auth';
import {
  refreshRequestSchema,
  refreshResponseSchema,
} from '@/lib/contracts/v1/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    let body = null;
    try {
      body = await request.json();
    } catch {
      // Empty body is acceptable
    }

    if (body) {
      const parsedBody = refreshRequestSchema.safeParse(body);
      if (!parsedBody.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: parsedBody.error.issues },
          { status: 400 }
        );
      }
      body = parsedBody.data;
    }

    const reqHeaders = headers();
    const reqCookies = cookies();

    let token = body?.token || null;
    if (!token) {
      const authHeader = reqHeaders.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      }
    }
    if (!token) {
      token = reqCookies.get(AUTH_COOKIE_NAME)?.value || reqCookies.get(LEGACY_AUTH_COOKIE_NAME)?.value || null;
    }

    if (!token) {
      return NextResponse.json(
        { error: 'No active session token provided.' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload?.userId || !Number.isFinite(payload.exp) ||
        !Number.isFinite(new Date(payload.exp * 1000).getTime())) {
      return NextResponse.json(
        { error: 'Invalid or expired session token.' },
        { status: 401 }
      );
    }

    const revoked = await isTokenRevoked(token, { requireStorage: true });
    if (revoked) {
      return NextResponse.json(
        { error: 'Token has been revoked. Please sign in again.' },
        { status: 401 }
      );
    }

    const user = await User.findById(payload.userId);
    if (!user || user.isBanned) {
      return NextResponse.json(
        { error: 'User not found or account suspended.' },
        { status: 401 }
      );
    }

    const newToken = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const safeUser = user.toSafeObject();

    const responsePayload = {
      user: safeUser,
      token: newToken,
    };

    const parsedResponse = refreshResponseSchema.safeParse(responsePayload);
    if (!parsedResponse.success) {
      console.error('Response contract violation in refresh:', parsedResponse.error.issues);
      return NextResponse.json(
        { error: 'Internal server error: contract violation' },
        { status: 500 }
      );
    }

    // Prepare the successor before claiming, but never release it to a losing caller.
    if (payload.exp * 1000 <= Date.now()) {
      return NextResponse.json({ error: 'Invalid or expired session token.' }, { status: 401 });
    }
    const claimed = await revokeToken(token, { reason: 'token_refresh', requireStorage: true });
    if (!claimed) {
      return NextResponse.json(
        { error: 'Token has been revoked. Please sign in again.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json(parsedResponse.data, { status: 200 });
    response.cookies.set(AUTH_COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (err) {
    if (err instanceof RevocationUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error('Refresh Error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during token refresh.' },
      { status: 500 }
    );
  }
}
