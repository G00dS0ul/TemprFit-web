import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import NutritionProfile from '@/models/NutritionProfile'

export const dynamic = 'force-dynamic'

const DIETARY_PATTERNS = ['none', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'mediterranean', 'halal', 'kosher']
const GOALS = ['lose_weight', 'maintain', 'gain_muscle', 'improve_health']

export async function GET() {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const profile = await NutritionProfile.findOne({ user: user._id }).lean()
  return NextResponse.json({ profile: profile || null })
}

export async function PUT(request) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))

  const update = {}
  if (body.dietaryPattern !== undefined) {
    if (!DIETARY_PATTERNS.includes(body.dietaryPattern)) {
      return NextResponse.json({ error: 'Invalid dietary pattern.' }, { status: 400 })
    }
    update.dietaryPattern = body.dietaryPattern
  }
  if (body.goal !== undefined) {
    if (!GOALS.includes(body.goal)) {
      return NextResponse.json({ error: 'Invalid goal.' }, { status: 400 })
    }
    update.goal = body.goal
  }
  if (Array.isArray(body.allergies)) {
    update.allergies = body.allergies.map((a) => String(a).trim()).filter(Boolean).slice(0, 25)
  }
  if (Array.isArray(body.exclusions)) {
    update.exclusions = body.exclusions.map((a) => String(a).trim()).filter(Boolean).slice(0, 25)
  }
  if (Array.isArray(body.pantry)) {
    update.pantry = body.pantry.map((a) => String(a).trim()).filter(Boolean).slice(0, 100)
  }
  for (const field of ['calorieTarget', 'proteinTarget', 'carbsTarget', 'fatTarget']) {
    if (body[field] !== undefined) {
      const n = body[field] === null || body[field] === '' ? null : Number(body[field])
      if (n !== null && (!Number.isFinite(n) || n < 0 || n > 10000)) {
        return NextResponse.json({ error: `Invalid ${field}.` }, { status: 400 })
      }
      update[field] = n
    }
  }
  if (body.mealsPerDay !== undefined) {
    const n = Number(body.mealsPerDay)
    if (!Number.isFinite(n) || n < 1 || n > 8) {
      return NextResponse.json({ error: 'Meals per day must be between 1 and 8.' }, { status: 400 })
    }
    update.mealsPerDay = n
  }

  const profile = await NutritionProfile.findOneAndUpdate(
    { user: user._id },
    { $set: update },
    { upsert: true, new: true }
  )

  return NextResponse.json({ profile })
}
