import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  await connectDB()

  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  }

  await user.populate({
    path: 'favoriteExercises',
    select: 'name slug targetMuscles category difficulty equipment',
  })

  return NextResponse.json({ items: user.favoriteExercises })
}
