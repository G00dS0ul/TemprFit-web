import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { signToken, AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from '@/lib/auth'
import { checkAuthRateLimit } from '@/lib/ratelimit'

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = await checkAuthRateLimit(ip);
    
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and verification code are required.' }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    if (user.isVerified) {
      return NextResponse.json({ error: 'User is already verified.' }, { status: 400 })
    }

    if (user.verificationCode !== code) {
      return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 })
    }

    if (new Date() > user.verificationCodeExpiresAt) {
      return NextResponse.json({ error: 'Verification code has expired. Please register again or request a new code.' }, { status: 400 })
    }

    // Mark as verified
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiresAt = null;
    await user.save();

    // Issue JWT token
    const token = signToken({ userId: user._id.toString(), role: user.role })

    const response = NextResponse.json({ user: user.toSafeObject() })
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: '/',
    })
    return response
  } catch (err) {
    console.error('Verify error:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
