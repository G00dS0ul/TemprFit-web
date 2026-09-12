import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import WorkoutTemplate from '@/models/WorkoutTemplate'

export const dynamic = 'force-dynamic'

async function loadOwnedTemplate(id, userId) {
  const template = await WorkoutTemplate.findById(id)
  if (!template) return { error: NextResponse.json({ error: 'Workout not found.' }, { status: 404 }) }
  if (template.user.toString() !== userId.toString()) {
    return { error: NextResponse.json({ error: 'Not your workout.' }, { status: 403 }) }
  }
  return { template }
}

export async function GET(request, { params }) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const template = await WorkoutTemplate.findById(params.id)
    .populate('exercises.exercise', 'name slug targetMuscles equipment media category difficulty')
    .lean()

  if (!template) return NextResponse.json({ error: 'Workout not found.' }, { status: 404 })
  if (template.user.toString() !== user._id.toString()) {
    return NextResponse.json({ error: 'Not your workout.' }, { status: 403 })
  }

  return NextResponse.json({ template })
}

export async function PUT(request, { params }) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const { error, template } = await loadOwnedTemplate(params.id, user._id)
  if (error) return error

  const body = await request.json()
  if (body.name?.trim()) template.name = body.name.trim()
  if (body.goal !== undefined) template.goal = body.goal
  if (body.isFavorite !== undefined) template.isFavorite = body.isFavorite
  if (body.note !== undefined) template.note = body.note
  if (Array.isArray(body.exercises)) {
    template.exercises = body.exercises.map((ex, i) => ({
      exercise: ex.exercise,
      order: i,
      sets: ex.sets || [],
      notes: ex.notes || '',
    }))
  }
  await template.save()

  return NextResponse.json({ template })
}

export async function DELETE(request, { params }) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const { error, template } = await loadOwnedTemplate(params.id, user._id)
  if (error) return error

  await template.deleteOne()
  return NextResponse.json({ ok: true })
}
