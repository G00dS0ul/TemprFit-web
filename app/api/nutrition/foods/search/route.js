import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { searchFoods } from '@/lib/nutrition'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  if (!q) return NextResponse.json({ error: 'Query param "q" is required.' }, { status: 400 })
  if (q.length > 80) return NextResponse.json({ error: 'Search term is too long.' }, { status: 400 })

  try {
    const foods = await searchFoods(q)
    return NextResponse.json({ foods })
  } catch (err) {
    if (err.isSearchMiss) {
      return NextResponse.json({ foods: [] })
    }
    console.error('[nutrition/foods/search] error:', err.message)
    return NextResponse.json({ error: err.message || 'Food search failed.' }, { status: 502 })
  }
}
