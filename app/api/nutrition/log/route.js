import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import MealLog from '@/models/MealLog'
import Food from '@/models/Food'
import { scaleMacros } from '@/lib/nutrition'

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
  const date = startOfDay(searchParams.get('date') || Date.now())
  const nextDay = new Date(date)
  nextDay.setUTCDate(nextDay.getUTCDate() + 1)

  const logs = await MealLog.find({ user: user._id, date: { $gte: date, $lt: nextDay } })
    .populate('food', 'name imageUrl imageSource imageAttribution servingSize servingUnit')
    .sort({ createdAt: 1 })
    .lean()

  const totals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      protein: acc.protein + (log.protein || 0),
      carbs: acc.carbs + (log.carbs || 0),
      fat: acc.fat + (log.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  return NextResponse.json({ logs, totals })
}

export async function POST(request) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { foodId, mealType, servings, date } = body

  if (!foodId) return NextResponse.json({ error: 'foodId is required.' }, { status: 400 })
  if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
    return NextResponse.json({ error: 'Invalid mealType.' }, { status: 400 })
  }
  const servingsNum = Number(servings) || 1
  if (servingsNum <= 0 || servingsNum > 50) {
    return NextResponse.json({ error: 'Enter a valid number of servings.' }, { status: 400 })
  }

  const food = await Food.findById(foodId).lean()
  if (!food) return NextResponse.json({ error: 'Food not found.' }, { status: 404 })

  const macros = scaleMacros(food, servingsNum)

  const log = await MealLog.create({
    user: user._id,
    food: food._id,
    date: startOfDay(date || Date.now()),
    mealType,
    servings: servingsNum,
    ...macros,
  })

  const populated = await log.populate('food', 'name imageUrl imageSource imageAttribution')
  return NextResponse.json({ log: populated }, { status: 201 })
}

export async function DELETE(request) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Query param "id" is required.' }, { status: 400 })

  const result = await MealLog.deleteOne({ _id: id, user: user._id })
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'Log entry not found.' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
