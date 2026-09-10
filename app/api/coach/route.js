import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import CoachMessage from '@/models/CoachMessage'
import { askGemini, GeminiConfigError, GeminiRequestError } from '@/lib/gemini'
import { buildUserContext, COACH_SYSTEM_PROMPT_HEADER } from '@/lib/coach-context'

export const dynamic = 'force-dynamic'

const HISTORY_LIMIT = 30 // messages kept/returned — keeps free-tier token usage sane
const MAX_MESSAGE_LENGTH = 2000

export async function GET() {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const messages = await CoachMessage.find({ user: user._id })
    .sort({ createdAt: 1 })
    .limit(HISTORY_LIMIT)
    .select('role content createdAt')
    .lean()

  return NextResponse.json({ messages })
}

export async function POST(request) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const userMessage = typeof body.message === 'string' ? body.message.trim() : ''

  if (!userMessage) {
    return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 })
  }
  if (userMessage.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: 'Message is too long.' }, { status: 400 })
  }

  // Save the user's message up front so it's not lost if the Gemini call fails.
  await CoachMessage.create({ user: user._id, role: 'user', content: userMessage })

  const recentHistory = await CoachMessage.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(HISTORY_LIMIT)
    .select('role content')
    .lean()
  recentHistory.reverse()
  // Drop the message we just saved — askGemini takes it separately as userMessage.
  const historyForModel = recentHistory.slice(0, -1)

  let contextBlock
  try {
    contextBlock = await buildUserContext(user)
  } catch (err) {
    contextBlock = '(Could not load user data this turn.)'
  }

  const systemPrompt = `${COACH_SYSTEM_PROMPT_HEADER}\n\nREAL USER DATA:\n${contextBlock}`

  try {
    const reply = await askGemini({ systemPrompt, history: historyForModel, userMessage })
    const saved = await CoachMessage.create({ user: user._id, role: 'assistant', content: reply })
    return NextResponse.json({ message: { role: 'assistant', content: reply, createdAt: saved.createdAt } })
  } catch (err) {
    const status = err instanceof GeminiConfigError ? 500 : err instanceof GeminiRequestError ? 502 : 500
    return NextResponse.json({ error: err.message || 'The AI coach ran into an error.' }, { status })
  }
}
