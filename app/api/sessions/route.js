import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import WorkoutSession from '@/models/WorkoutSession'
import WorkoutTemplate from '@/models/WorkoutTemplate'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') // optional: 'in-progress' | 'completed'

  const filter = { user: user._id }
  if (status) filter.status = status

  const sessions = await WorkoutSession.find(filter)
    .sort({ startedAt: -1 })
    .limit(100)
    .populate('exercises.exercise', 'name slug targetMuscles')
    .lean()

  return NextResponse.json({ items: sessions })
}

export async function POST(request) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const body = await request.json()
  const { templateId, name, exercises: adHocExercises } = body

  let name_ = name
  let exercises

  if (templateId) {
    const template = await WorkoutTemplate.findById(templateId).lean()
    if (!template || template.user.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Workout not found.' }, { status: 404 })
    }
    name_ = name_ || template.name
    exercises = template.exercises.map((ex, i) => ({
      exercise: ex.exercise,
      order: i,
      sets: (ex.sets || []).map((s, si) => ({
        setNumber: si + 1,
        targetReps: s.targetReps,
        reps: null,
        weight: s.targetWeight || 0,
        restSeconds: s.restSeconds || 60,
        completed: false,
      })),
      notes: ex.notes || '',
    }))
  } else if (Array.isArray(adHocExercises) && adHocExercises.length > 0) {
    exercises = adHocExercises.map((ex, i) => ({
      exercise: ex.exercise,
      order: i,
      sets: (ex.sets || []).map((s, si) => ({
        setNumber: si + 1,
        targetReps: s.targetReps || '',
        reps: null,
        weight: s.targetWeight || 0,
        restSeconds: s.restSeconds || 60,
        completed: false,
      })),
    }))
  } else {
    return NextResponse.json(
      { error: 'Provide a templateId or a list of exercises to start a session.' },
      { status: 400 }
    )
  }

  const session = await WorkoutSession.create({
    user: user._id,
    template: templateId || null,
    name: name_ || 'Workout',
    status: 'in-progress',
    exercises,
    startedAt: new Date(),
  })

  return NextResponse.json({ session }, { status: 201 })
}
