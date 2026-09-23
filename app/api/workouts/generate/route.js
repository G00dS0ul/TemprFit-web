import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import Exercise from '@/models/Exercise'
import { prescribe } from '@/lib/prescription'
import { askGemini, GeminiConfigError, GeminiRequestError } from '@/lib/gemini'
import { buildUserContext } from '@/lib/coach-context'
import { checkAndIncrementAILimit } from '@/lib/aiLimit'

export const dynamic = 'force-dynamic'

// Two modes now:
//  - rules-based (default, always available): deterministic, prescribe()-driven.
//  - AI-assisted (useAI: true, needs GEMINI_API_KEY): Gemini picks/orders/adjusts
//    from the SAME real candidate pool below — it is only ever allowed to choose
//    exercises we already fetched from Mongo (by slug), never invent one. If the
//    model call fails or returns something we can't validate, this silently
//    falls back to the rules-based result rather than erroring the whole request.

const MINUTES_PER_EXERCISE = 8

function rulesBasedSelection(candidates, targetCount) {
  const byMuscle = new Map()
  for (const ex of candidates) {
    const m = ex.targetMuscles.primary
    if (!byMuscle.has(m)) byMuscle.set(m, [])
    byMuscle.get(m).push(ex)
  }
  const muscleGroups = [...byMuscle.keys()]
  for (const list of byMuscle.values()) list.sort(() => Math.random() - 0.5)

  const selected = []
  let round = 0
  while (selected.length < targetCount && selected.length < candidates.length) {
    const muscle = muscleGroups[round % muscleGroups.length]
    const pool = byMuscle.get(muscle)
    const pick = pool?.shift()
    if (pick) selected.push(pick)
    round += 1
    if (round > candidates.length * 2) break // safety valve
  }
  return selected
}

function parseJsonLoose(text) {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
  return JSON.parse(cleaned)
}

/**
 * Asks Gemini to pick `targetCount` exercises (by slug) from `candidates`,
 * with a short reasoning note. Returns { selected: [exercise docs, in AI's
 * chosen order], reasoning } or null if anything about the AI response is
 * unusable (caller falls back to rules-based selection).
 */
async function aiAssistedSelection({ candidates, targetCount, goal, user, notes, customEquipment, equipmentImages }) {
  const candidateList = candidates
    .map((ex) => `${ex.slug} | ${ex.name} | primary: ${ex.targetMuscles.primary} | equipment: ${ex.equipment} | difficulty: ${ex.difficulty}`)
    .join('\n')

  let userContext = ''
  try {
    userContext = await buildUserContext(user)
  } catch {
    userContext = '(user history unavailable this turn)'
  }

  let equipmentContext = ''
  if (customEquipment) {
    equipmentContext += `\nCUSTOM EQUIPMENT SPECIFIED BY USER: "${customEquipment}". Try to incorporate exercises that could use this.`
  }
  if (equipmentImages && equipmentImages.length > 0) {
    equipmentContext += `\nUSER UPLOADED ${equipmentImages.length} IMAGE(S) OF THEIR EQUIPMENT. Identify the equipment in the images and select exercises from the candidate list that can be performed with it.`
  }

  const systemPrompt = `You are REPForge's workout-generation assistant. You must choose exercises ONLY from the CANDIDATE LIST below by their exact "slug" value — never invent an exercise or slug that isn't listed. Pick exactly ${targetCount} exercises (fewer only if the list has fewer than that), ordered sensibly (e.g. compound/larger muscle groups before isolation/smaller ones, or a logical warmup-to-main progression). Respond with ONLY raw JSON, no markdown fences, no commentary outside the JSON, in exactly this shape:
{"exercises": [{"slug": "slug-one", "alternatives": ["alternative exercise 1", "alternative exercise 2"]}, {"slug": "slug-two", "alternatives": []}], "reasoning": "one or two sentences on why this selection fits the user"}`

  const userMessage = `GOAL: ${goal}
USER NOTES / CONSTRAINTS (e.g. injuries, preferences — respect these if present): ${notes || 'none given'}
${equipmentContext}

USER CONTEXT:
${userContext}

CANDIDATE LIST (slug | name | primary muscle | equipment | difficulty):
${candidateList}`

  const raw = await askGemini({ systemPrompt, history: [], userMessage, attachments: equipmentImages, responseMimeType: 'application/json' })

  let parsed
  try {
    parsed = parseJsonLoose(raw)
  } catch {
    return null
  }
  if (!Array.isArray(parsed?.exercises)) return null

  const bySlug = new Map(candidates.map((ex) => [ex.slug, ex]))
  const selected = parsed.exercises
    .map((item) => {
      const slug = typeof item === 'string' ? item : item.slug
      const ex = bySlug.get(slug)
      if (!ex) return null
      return { ...ex, alternatives: item.alternatives || [] }
    })
    .filter(Boolean)
    .slice(0, targetCount)

  if (selected.length === 0) return null

  return { selected, reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning.slice(0, 500) : '' }
}

export async function POST(request) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const body = await request.json()
  const {
    timeMinutes = 45,
    equipment = [],
    customEquipment = '',
    equipmentImages = [],
    muscles = [],
    goal = 'hypertrophy',
    useAI = false,
    notes = '',
  } = body

  if (useAI) {
    const limitCheck = await checkAndIncrementAILimit(user._id)
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.error }, { status: 429 })
    }
  }

  const targetCount = Math.max(3, Math.min(8, Math.round(timeMinutes / MINUTES_PER_EXERCISE)))

  const filter = { publicationStatus: 'published' }
  if (equipment.length > 0) filter.equipment = { $in: equipment }
  if (muscles.length > 0) filter['targetMuscles.primary'] = { $in: muscles }

  // Pull a generous candidate pool — this is the ONLY source either
  // selection mode is allowed to pick from.
  const candidates = await Exercise.find(filter)
    .select('name slug targetMuscles equipment category difficulty media')
    .limit(120)
    .lean()

  if (candidates.length === 0) {
    return NextResponse.json(
      { error: 'No exercises match those filters — try widening equipment or muscles.' },
      { status: 422 }
    )
  }

  let selected
  let generatedBy = 'rules'
  let aiReasoning = ''
  let aiFallbackReason = ''

  if (useAI) {
    try {
      const aiResult = await aiAssistedSelection({ candidates, targetCount, goal, user, notes, customEquipment, equipmentImages })
      if (aiResult) {
        selected = aiResult.selected
        aiReasoning = aiResult.reasoning
        generatedBy = 'ai'

        // Reward the user for using AI
        user.aiUsage.count = (user.aiUsage.count || 0) + 1;
        user.xp = (user.xp || 0) + 20;

        if (user.aiUsage.count >= 3) {
          const hasBadge = user.badges?.some(b => b.badgeId === 'ai_pioneer');
          if (!hasBadge) {
            user.badges = user.badges || [];
            user.badges.push({ badgeId: 'ai_pioneer' });
            user.xp += 50; // extra bonus for getting the badge
          }
        }
        await user.save();
      } else {
        aiFallbackReason = "The AI's response could not be validated against the real exercise list, so a rules-based workout was generated instead."
      }
    } catch (err) {
      aiFallbackReason =
        err instanceof GeminiConfigError
          ? 'AI generation needs GEMINI_API_KEY set — used the rules-based generator instead.'
          : `AI generation failed (${err.message}) — used the rules-based generator instead.`
    }
  }

  if (!selected) {
    selected = rulesBasedSelection(candidates, targetCount)
  }

  const exercises = selected.map((ex) => {
    const plan = prescribe(ex, { goal })
    const setCount = plan.sets
    const sets = Array.from({ length: setCount }, () => ({
      targetReps: plan.reps || '',
      targetWeight: 0,
      restSeconds: plan.restSeconds,
      tempo: '',
    }))
    return { exercise: ex._id, name: ex.name, slug: ex.slug, sets, targetMuscles: ex.targetMuscles, alternatives: ex.alternatives || [] }
  })

  return NextResponse.json({
    name: `${timeMinutes}-Minute ${goal.replace('-', ' ')} Workout`,
    goal,
    generatorInputs: { timeMinutes, equipment, muscles, goal, useAI, notes },
    generatedBy,
    aiReasoning,
    aiFallbackReason,
    exercises,
  })
}

