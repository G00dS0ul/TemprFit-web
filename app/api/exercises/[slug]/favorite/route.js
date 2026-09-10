import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Exercise from '@/models/Exercise'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  await connectDB()

  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  }

  const exercise = await Exercise.findOne({ slug: params.slug }).select('_id')
  if (!exercise) {
    return NextResponse.json({ error: 'Exercise not found.' }, { status: 404 })
  }

  const exerciseId = exercise._id.toString()
  const alreadyFavorited = user.favoriteExercises.some((id) => id.toString() === exerciseId)

  if (alreadyFavorited) {
    user.favoriteExercises = user.favoriteExercises.filter((id) => id.toString() !== exerciseId)
  } else {
    user.favoriteExercises.push(exercise._id)
  }

  await user.save()

  return NextResponse.json({ favorited: !alreadyFavorited })
}
