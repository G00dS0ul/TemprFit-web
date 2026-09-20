import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { comparePassword, signToken, AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from '@/lib/auth'
import { checkAuthRateLimit } from '@/lib/ratelimit'

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = await checkAuthRateLimit(ip);
    
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    if (user.isBanned) {
      return NextResponse.json({ error: 'Your account has been banned. Please contact support.' }, { status: 403 })
    }

    if (user.isVerified === false) {
      return NextResponse.json({ requiresVerification: true, email: user.email, message: 'Please verify your email to log in.' }, { status: 403 })
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken({ userId: user._id.toString(), role: user.role })

    const response = NextResponse.json({ user: user.toSafeObject() })
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: '/',
    })
    
    // Async fire and forget the email alert
    import('@/lib/email').then(({ sendLoginAlert }) => {
      sendLoginAlert(user.email, user.username, ip);
    }).catch(console.error);

    return response
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
