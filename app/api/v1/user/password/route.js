import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import {
  userChangePasswordRequestSchema,
  userChangePasswordResponseSchema,
} from '@/lib/contracts/v1/user';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const parseResult = userChangePasswordRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid password details.',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parseResult.data;

    const user = await User.findById(sessionUser._id).select('+password');
    if (!user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'This account was created via social login and does not have a local password set.' },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect current password.' }, { status: 401 });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    const validated = userChangePasswordResponseSchema.parse({ success: true });
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/user/password] POST Error:', err);
    return NextResponse.json(
      { error: 'Failed to update password.' },
      { status: 500 }
    );
  }
}
