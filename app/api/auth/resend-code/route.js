import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { checkAuthRateLimit } from '@/lib/ratelimit'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = await checkAuthRateLimit(ip);
    
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email: email.toLowerCase() })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    if (user.isVerified) {
      return NextResponse.json({ error: 'User is already verified.' }, { status: 400 })
    }

    // Generate new 6-digit OTP
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    user.verificationCode = verificationCode;
    user.verificationCodeExpiresAt = verificationCodeExpiresAt;
    await user.save();

    // Send the email using our email module
    await sendVerificationEmail(user.email, verificationCode);

    return NextResponse.json({ message: 'Verification code resent.' }, { status: 200 })
  } catch (err) {
    console.error('Resend code error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
