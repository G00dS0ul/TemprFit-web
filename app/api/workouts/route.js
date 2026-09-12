import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import WorkoutTemplate from '@/models/WorkoutTemplate'
import Exercise from '@/models/Exercise' // Required for populate
import WorkoutSession from '@/models/WorkoutSession'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await connectDB()
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

    const templates = await WorkoutTemplate.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate('exercises.exercise', 'name slug targetMuscles equipment media')
      .lean()

    const enrichedTemplates = await Promise.all(
      templates.map(async (t) => {
        const lastSession = await WorkoutSession.findOne({ 
          template: t._id, 
          status: 'completed' 
        })
        .sort({ completedAt: -1 })
        .lean()
        
        return {
          ...t,
          lastCompletedAt: lastSession ? lastSession.completedAt : null
        }
      })
    )

    return NextResponse.json({ items: enrichedTemplates })
  } catch (error) {
    console.error('Workouts GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const body = await request.json()
  const { name, goal, exercises } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Workout name is required.' }, { status: 400 })
  }
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return NextResponse.json({ error: 'Add at least one exercise.' }, { status: 400 })
  }

  const template = await WorkoutTemplate.create({
    user: user._id,
    name: name.trim(),
    goal: goal || '',
    exercises: exercises.map((ex, i) => ({
      exercise: ex.exercise,
      order: i,
      sets: ex.sets || [],
      notes: ex.notes || '',
    })),
    source: 'manual',
  })

  return NextResponse.json({ template }, { status: 201 })
}
