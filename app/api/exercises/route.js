import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Exercise from '@/models/Exercise'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 24

export async function GET(request) {
  await connectDB()

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const muscle = searchParams.get('muscle') // targetMuscles.primary
  const equipment = searchParams.get('equipment')
  const difficulty = searchParams.get('difficulty')
  const environment = searchParams.get('environment')
  const category = searchParams.get('category') // training style: calisthenics/bodybuilding/powerlifting/stretching/...
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))

  const filter = { publicationStatus: 'published' }
  if (q) filter.$text = { $search: q }
  if (muscle) filter['targetMuscles.primary'] = muscle
  if (equipment) filter.equipment = equipment
  if (difficulty) filter.difficulty = difficulty
  if (environment) filter.environment = environment
  if (category) filter.category = category

  const projection = { instructions: 0, safetyNotes: 0, commonMistakes: 0, formTips: 0, __v: 0 }
  if (q) projection.score = { $meta: 'textScore' }

  let query = Exercise.find(filter, projection)
  query = q ? query.sort({ score: { $meta: 'textScore' } }) : query.sort({ name: 1 })

  const [items, total] = await Promise.all([
    query.skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    Exercise.countDocuments(filter),
  ])

  return NextResponse.json({
    items,
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  })
}
