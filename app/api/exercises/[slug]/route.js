import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Exercise from '@/models/Exercise'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  await connectDB()

  const exercise = await Exercise.findOne({
    slug: params.slug,
    publicationStatus: 'published',
  })
    .populate('alternatives', 'name slug targetMuscles difficulty equipment')
    .lean()

  if (!exercise) {
    return NextResponse.json({ error: 'Exercise not found.' }, { status: 404 })
  }

  return NextResponse.json({ exercise })
}
