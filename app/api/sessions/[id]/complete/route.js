import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import WorkoutSession from '@/models/WorkoutSession'
import { computeVolume, detectAndRecordPRs } from '@/lib/workout-utils'
import { updateStreak } from '@/lib/streak'

export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const session = await WorkoutSession.findById(params.id)
  if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
  if (session.user.toString() !== user._id.toString()) {
    return NextResponse.json({ error: 'Not your session.' }, { status: 403 })
  }
  if (session.status !== 'in-progress') {
    return NextResponse.json({ error: 'Session already finalized.' }, { status: 409 })
  }

  const body = await request.json().catch(() => ({}))
  if (Array.isArray(body.exercises)) session.exercises = body.exercises

  const now = new Date()
  session.completedAt = now
  session.durationSeconds = Math.max(0, Math.round((now - session.startedAt) / 1000))
  session.totalVolume = computeVolume(session.exercises)
  session.prCount = await detectAndRecordPRs({
    userId: user._id,
    sessionId: session._id,
    exercises: session.exercises,
  })
  session.status = 'completed'

  // XP reward logic
  user.xp = (user.xp || 0) + 50

  await session.save()

  const streak = updateStreak(user, now)
  user.currentStreak = streak.currentStreak
  user.longestStreak = streak.longestStreak
  user.lastWorkoutDate = streak.lastWorkoutDate
  await user.save()

  // Update Pod Challenges
  const { default: Pod } = await import('@/models/Pod')
  const userPods = await Pod.find({ members: user._id })
  for (const pod of userPods) {
    if (pod.challenge && pod.challenge.expiresAt > now) {
      pod.challenge.currentVolume += session.totalVolume;
      await pod.save();
    }
  }

  return NextResponse.json({
    session,
    streak: { current: user.currentStreak, longest: user.longestStreak },
  })
}
