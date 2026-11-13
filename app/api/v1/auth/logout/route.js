import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import {
  revokeToken,
  verifyToken,
  isTokenRevoked,
  RevocationUnavailableError,
  AUTH_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
} from '@/lib/auth';
import {
  logoutRequestSchema,
  logoutResponseSchema,
} from '@/lib/contracts/v1/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  let response;
  try {
    let body = null;
    try {
      body = await request.json();
    } catch {
      // Empty body is acceptable
    }

    if (body) {
      const parsedBody = logoutRequestSchema.safeParse(body);
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

    const payload = token ? verifyToken(token) : null;
    if (payload?.userId && Number.isFinite(payload.exp) &&
        Number.isFinite(new Date(payload.exp * 1000).getTime())) {
      const revoked = await isTokenRevoked(token, { requireStorage: true });
      if (!revoked && payload.exp * 1000 > Date.now()) {
        await revokeToken(token, { reason: 'user_logout', requireStorage: true });
      }
    }

    const responsePayload = { ok: true };
    const parsedResponse = logoutResponseSchema.safeParse(responsePayload);
    if (!parsedResponse.success) {
      return NextResponse.json(
        { error: 'Internal server error: contract violation' },
        { status: 500 }
      );
    }

    response = NextResponse.json(parsedResponse.data, { status: 200 });
  } catch (err) {
    if (err instanceof RevocationUnavailableError) {
      response = NextResponse.json({ error: err.message }, { status: 503 });
    } else {
      console.error('Logout Error:', err);
      return NextResponse.json(
        { error: 'An unexpected error occurred during logout.' },
        { status: 500 }
      );
    }
  }
  // Cookie removal is independent of acknowledged server-side invalidation.
  for (const name of [AUTH_COOKIE_NAME, LEGACY_AUTH_COOKIE_NAME, 'admin_token']) {
    response.cookies.set({ name, value: '', maxAge: 0, path: '/' });
  }
  return response;
}
