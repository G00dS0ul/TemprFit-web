import { NextResponse } from 'next/server';
import { getSessionUser, RevocationUnavailableError } from '@/lib/auth';
import {
  meResponseSchema,
} from '@/lib/contracts/v1/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sessionUser = await getSessionUser({ requireRevocation: true });

    let safeUser = null;
    if (sessionUser) {
      safeUser = sessionUser.toSafeObject();
      safeUser.originalRole = safeUser.role;
    }

    const responsePayload = { user: safeUser };
    const parsedResponse = meResponseSchema.safeParse(responsePayload);
    if (!parsedResponse.success) {
      console.error('Response contract violation in me:', parsedResponse.error.issues);
      return NextResponse.json(
        { error: 'Internal server error: contract violation' },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedResponse.data, { status: 200 });
  } catch (err) {
    if (err instanceof RevocationUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error('Session Me Error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching user profile.' },
      { status: 500 }
    );
  }
}
