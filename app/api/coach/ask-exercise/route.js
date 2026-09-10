import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import Exercise from '@/models/Exercise'
import { askGemini, GeminiConfigError, GeminiRequestError } from '@/lib/gemini'

export const dynamic = 'force-dynamic'

// Scoped, stateless Q&A about one exercise — deliberately NOT saved to the
// user's main CoachMessage thread. This is a quick "what about this move"
// lookup from the exercise detail page, not part of the ongoing coach chat.

export async function POST(request) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { exerciseSlug, question } = body

  if (!exerciseSlug || typeof question !== 'string' || !question.trim()) {
    return NextResponse.json({ error: 'Missing exercise or question.' }, { status: 400 })
  }

  const exercise = await Exercise.findOne({ slug: exerciseSlug })
    .select('name targetMuscles equipment category difficulty instructions safetyNotes commonMistakes formTips')
    .lean()

  if (!exercise) {
    return NextResponse.json({ error: 'Exercise not found.' }, { status: 404 })
  }

  const exerciseFacts = `Name: ${exercise.name}
Primary muscle: ${exercise.targetMuscles?.primary}
Secondary muscles: ${(exercise.targetMuscles?.secondary || []).join(', ') || 'none listed'}
Equipment: ${(exercise.equipment || []).join(', ')}
Difficulty: ${exercise.difficulty}
Category: ${exercise.category}
Instructions: ${(exercise.instructions || []).join(' ') || 'not provided'}
Known safety notes: ${(exercise.safetyNotes || []).join(' ') || 'none on file'}
Common mistakes: ${(exercise.commonMistakes || []).join(' ') || 'none on file'}
Form tips: ${(exercise.formTips || []).join(' ') || 'none on file'}`

  const systemPrompt = `You are REPForge's AI coach, answering a quick question about ONE specific exercise. Use the exercise data given below as ground truth — don't contradict it. If asked something the data doesn't cover, say so plainly rather than inventing details. Keep the answer to 2-4 sentences — this renders in a small inline panel, not a full chat. For anything about pain, injury, or a medical condition, give general guidance but recommend a doctor or physical therapist for anything specific to their body.

EXERCISE DATA:
${exerciseFacts}`

  try {
    const answer = await askGemini({ systemPrompt, history: [], userMessage: question.trim() })
    return NextResponse.json({ answer })
  } catch (err) {
    const status = err instanceof GeminiConfigError ? 500 : err instanceof GeminiRequestError ? 502 : 500
    return NextResponse.json({ error: err.message || 'Could not get an answer.' }, { status })
  }
}
