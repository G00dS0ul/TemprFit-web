import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import WeightEntry from '@/models/WeightEntry'

export const dynamic = 'force-dynamic'

function startOfDay(date) {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export async function GET(request) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = Math.min(365, parseInt(searchParams.get('limit') || '90', 10))

  const entries = await WeightEntry.find({ user: user._id })
    .sort({ date: 1 })
    .limit(limit)

  return NextResponse.json({ entries })
}

export async function POST(request) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const weight = Number(body.weight)
  if (!Number.isFinite(weight) || weight <= 0 || weight > 2000) {
    return NextResponse.json({ error: 'Enter a valid weight.' }, { status: 400 })
  }

  const bodyFatPercent =
    body.bodyFatPercent === null || body.bodyFatPercent === undefined || body.bodyFatPercent === ''
      ? null
      : Number(body.bodyFatPercent)
  if (bodyFatPercent !== null && (!Number.isFinite(bodyFatPercent) || bodyFatPercent < 0 || bodyFatPercent > 75)) {
    return NextResponse.json({ error: 'Enter a valid body fat %.' }, { status: 400 })
  }

  const date = startOfDay(body.date || Date.now())
  const unit = body.unit === 'kg' ? 'kg' : user.weightUnit || 'lbs'

  const entry = await WeightEntry.findOneAndUpdate(
    { user: user._id, date },
    { $set: { weight, unit, bodyFatPercent } },
    { upsert: true, new: true }
  )

  return NextResponse.json({ entry }, { status: 201 })
}
