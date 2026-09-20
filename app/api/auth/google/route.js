import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { signToken, AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from '@/lib/auth'
import { randomAvatarUrl } from '@/lib/avatars'
import { OAuth2Client } from 'google-auth-library'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export async function POST(request) {
  try {
    const { credential } = await request.json()

    if (!credential) {
      return NextResponse.json({ error: 'Missing Google credential.' }, { status: 400 })
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload) {
      return NextResponse.json({ error: 'Invalid Google token.' }, { status: 400 })
    }

    const { email, name, picture, sub } = payload
    
    await connectDB()

    let user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      // Create new user if they don't exist
      const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '')
      let username = baseUsername
      
      // Ensure username is unique
      let usernameCounter = 1
      while (await User.findOne({ username })) {
        username = `${baseUsername}${usernameCounter}`
        usernameCounter++
      }

      user = await User.create({
        username,
        email: email.toLowerCase(),
        password: sub, // Dummy password for Google users
        isVerified: true, // Google accounts are implicitly verified
        role: 'user',
        avatarUrl: picture || randomAvatarUrl(username),
        firstLoginCompleted: false,
      })

      const { default: Notification } = await import('@/models/Notification')
      await Notification.create({
        user: user._id,
        title: 'Welcome to the Forge!',
        message: 'Your journey begins now. Check out the explore tab or generate your first workout.',
        type: 'system',
      })
    }

    if (user.isBanned) {
      return NextResponse.json({ error: 'Your account has been banned. Please contact support.' }, { status: 403 })
    }

    // Mark them as verified just in case they signed up with email but never verified
    if (!user.isVerified) {
      user.isVerified = true
    }
    
    user.lastLoginAt = new Date();
    await user.save()

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
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    import('@/lib/email').then(({ sendLoginAlert }) => {
      sendLoginAlert(user.email, user.username, ip);
    }).catch(console.error);

    return response
  } catch (err) {
    console.error('Google Auth error:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
