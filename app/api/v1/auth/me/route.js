import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import { getSessionUser, verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const safeUser = user.toSafeObject();
    safeUser.originalRole = safeUser.role;

    // Check admin token cookie for in-memory admin role elevation
    try {
      const adminToken = cookies().get('admin_token')?.value;
      if (adminToken) {
        if (adminToken === 'true') {
          // Legacy backward-compatibility
          safeUser.role = 'admin';
        } else {
          // Cryptographically verified admin token
          const adminPayload = verifyToken(adminToken);
          if (adminPayload?.role === 'admin' || adminPayload?.isAdmin) {
            safeUser.role = 'admin';
          }
        }
      }
    } catch {}

    return NextResponse.json({ user: safeUser }, { status: 200 });
  } catch (err) {
    console.error('v1 Me error:', err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
