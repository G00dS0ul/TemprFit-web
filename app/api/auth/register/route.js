import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import WeightEntry from '@/models/WeightEntry'
import { hashPassword, signToken, AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from '@/lib/auth'
import { randomAvatarUrl } from '@/lib/avatars'
import Notification from '@/models/Notification'

const USERNAME_PATTERN = /^[a-z0-9_.]{3,24}$/
const VALID_SEX_VALUES = ['male', 'female', 'other', 'prefer_not_to_say']

function startOfDay(date) {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export async function POST(request) {
  try {
    const {
      username, email, password, goal, experience,
      age, sex, heardAboutUs,
      weightUnit, startingWeight, heightCm,
    } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required.' },
        { status: 400 }
      )
    }

    const normalizedUsername = String(username).trim().toLowerCase()
    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      return NextResponse.json(
        {
          error:
            'Username must be 3-24 characters and can only contain lowercase letters, numbers, underscores, and periods.',
        },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      )
    }

    await connectDB()

    const existingEmail = await User.findOne({ email: email.toLowerCase() })
    if (existingEmail) {
      return NextResponse.json(
        { error: 'An account with that email already exists.' },
        { status: 409 }
      )
    }

    const existingUsername = await User.findOne({ username: normalizedUsername })
    if (existingUsername) {
      return NextResponse.json(
        { error: 'That username is already taken.' },
        { status: 409 }
      )
    }

    const resolvedWeightUnit = weightUnit === 'kg' ? 'kg' : 'lbs'
    const resolvedHeightCm =
      Number.isFinite(heightCm) && heightCm > 0 && heightCm < 300 ? heightCm : null

    const numericAge = Number(age)
    const resolvedAge =
      Number.isFinite(numericAge) && numericAge >= 13 && numericAge <= 120 ? numericAge : null
    const resolvedSex = VALID_SEX_VALUES.includes(sex) ? sex : ''
    const resolvedHeardAboutUs =
      typeof heardAboutUs === 'string' ? heardAboutUs.trim().slice(0, 60) : ''

    const hashedPassword = await hashPassword(password)
    
    let user;
    try {
      user = await User.create({
        username: normalizedUsername,
        email: email.toLowerCase(),
        password: hashedPassword,
        goal: goal || '',
        experience: experience || '',
        age: resolvedAge,
        sex: resolvedSex,
        heardAboutUs: resolvedHeardAboutUs,
        weightUnit: resolvedWeightUnit,
        heightCm: resolvedHeightCm,
        avatarUrl: randomAvatarUrl(normalizedUsername),
        firstLoginCompleted: false,
        role: 'user',
        trainerInfo: undefined,
      })

      // Insert welcome notification
      await Notification.create({
        user: user._id,
        title: 'Welcome to the Forge!',
        message: 'Your journey begins now. Check out the explore tab or generate your first workout.',
        type: 'system',
      })



      const resolvedWeight = Number(startingWeight)
      if (Number.isFinite(resolvedWeight) && resolvedWeight > 0 && resolvedWeight < 2000) {
        await WeightEntry.create({
          user: user._id,
          date: startOfDay(Date.now()),
          weight: resolvedWeight,
          unit: resolvedWeightUnit,
        })
      }
    } catch (createErr) {
      // If something fails after user creation, delete the ghost user
      if (user && user._id) {
        await User.findByIdAndDelete(user._id);
      }
      throw createErr;
    }

    const token = signToken({ userId: user._id.toString(), role: user.role })

    const response = NextResponse.json({ user: user.toSafeObject() }, { status: 201 })
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: '/',
    })
    return response
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
