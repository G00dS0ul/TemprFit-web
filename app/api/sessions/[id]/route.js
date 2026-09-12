import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import WorkoutSession from '@/models/WorkoutSession'

export const dynamic = 'force-dynamic'

async function loadOwnedSession(id, userId) {
  const session = await WorkoutSession.findById(id)
  if (!session) return { error: NextResponse.json({ error: 'Session not found.' }, { status: 404 }) }
  if (session.user.toString() !== userId.toString()) {
    return { error: NextResponse.json({ error: 'Not your session.' }, { status: 403 }) }
  }
  return { session }
}

export async function GET(request, { params }) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const session = await WorkoutSession.findById(params.id)
    .populate('exercises.exercise', 'name slug targetMuscles equipment media category difficulty instructions alternatives')
    .lean()

  if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
  if (session.user.toString() !== user._id.toString()) {
    return NextResponse.json({ error: 'Not your session.' }, { status: 403 })
  }

  return NextResponse.json({ session })
}

export async function PATCH(request, { params }) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const { error, session } = await loadOwnedSession(params.id, user._id)
  if (error) return error

  // Historical records should not be overwritten — once completed, a
  // session is read-only.
  if (session.status !== 'in-progress') {
    return NextResponse.json({ error: 'This session is no longer editable.' }, { status: 409 })
  }

  const body = await request.json()
  if (Array.isArray(body.exercises)) session.exercises = body.exercises
  if (typeof body.notes === 'string') session.notes = body.notes
  await session.save()

  return NextResponse.json({ session })
}
