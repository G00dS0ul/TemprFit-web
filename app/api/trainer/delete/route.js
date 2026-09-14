import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { verifyToken, signToken, AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from '@/lib/auth';

export async function DELETE(request) {
  try {
    const token = cookies().get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'trainer') {
      return NextResponse.json({ error: 'You are not a trainer' }, { status: 400 });
    }

    // Downgrade user back to a regular trainee
    user.role = 'user';
    user.trainerInfo = undefined;
    await user.save();

    // Sign a new token since the role changed
    const newToken = signToken({ userId: user._id.toString(), role: user.role });
    const response = NextResponse.json({ success: true, user: user.toSafeObject() }, { status: 200 });
    
    response.cookies.set(AUTH_COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Trainer deletion error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
