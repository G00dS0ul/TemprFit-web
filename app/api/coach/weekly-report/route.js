import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import WorkoutSession from '@/models/WorkoutSession'
import PersonalRecord from '@/models/PersonalRecord'
import WeeklyReport from '@/models/WeeklyReport'
import { askGemini, GeminiConfigError, GeminiRequestError } from '@/lib/gemini'
import { displayName } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function mondayOf(date) {
  const d = new Date(date)
  const day = d.getUTCDay() // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function parseJsonLoose(text) {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
  return JSON.parse(cleaned)
}

async function gatherWeekData(user, weekStart) {
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
  const prevWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000)

  const sessions = await WorkoutSession.find({
    user: user._id,
    status: 'completed',
    completedAt: { $gte: weekStart, $lt: weekEnd },
  }).select('name completedAt durationSeconds totalVolume prCount').lean()

  const prevWeekSessions = await WorkoutSession.find({
    user: user._id,
    status: 'completed',
    completedAt: { $gte: prevWeekStart, $lt: weekStart },
  }).select('totalVolume').lean()

  const prs = await PersonalRecord.find({
    user: user._id,
    achievedAt: { $gte: weekStart, $lt: weekEnd },
  }).populate('exercise', 'name').select('weight reps estOneRepMax achievedAt').lean()

  const totalVolume = sessions.reduce((s, x) => s + (x.totalVolume || 0), 0)
  const prevVolume = prevWeekSessions.reduce((s, x) => s + (x.totalVolume || 0), 0)

  return { sessions, totalVolume, prevVolume, prs, weekEnd }
}

export async function GET() {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const weekStart = mondayOf(new Date())
  const report = await WeeklyReport.findOne({ user: user._id, weekStart }).lean()

  return NextResponse.json({ report: report || null, weekStart })
}

export async function POST() {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const weekStart = mondayOf(new Date())
  const { sessions, totalVolume, prevVolume, prs } = await gatherWeekData(user, weekStart)

  if (sessions.length === 0) {
    return NextResponse.json(
      { error: 'No completed workouts this week yet — finish a session first, then generate your report.' },
      { status: 422 }
    )
  }

  const volumeTrendPct = prevVolume > 0 ? Math.round(((totalVolume - prevVolume) / prevVolume) * 100) : null
  const sessionsGoal = user.goals?.weeklySessions ?? 4

  const sessionLines = sessions
    .map((s) => `- ${s.name}: ${Math.round((s.durationSeconds || 0) / 60)}min, ${s.totalVolume || 0} volume, ${s.prCount || 0} PR(s)`)
    .join('\n')
  const prLines = prs.length
    ? prs.map((p) => `- ${p.exercise?.name || 'exercise'}: ${p.weight}x${p.reps} (est. 1RM ${p.estOneRepMax})`).join('\n')
    : 'None this week.'

  const systemPrompt = `You are TemprFit's weekly report writer. Respond with ONLY raw JSON, no markdown fences, in exactly this shape:
{"summary": "2-3 sentence factual, encouraging recap of THIS week using only the data given", "recommendation": "1-2 sentence specific, actionable suggestion for next week based on this data"}
Never invent numbers or exercises not in the data. Be honest — if the week was light, say so plainly rather than overselling it.`

  const userMessage = `Name: ${displayName(user)}
Stated goal: ${user.goal || 'not set'}
Weekly session target: ${sessionsGoal}
Sessions completed this week: ${sessions.length}
Total volume this week: ${totalVolume}
Volume vs last week: ${volumeTrendPct === null ? 'no data for last week' : `${volumeTrendPct > 0 ? '+' : ''}${volumeTrendPct}%`}

Sessions this week:
${sessionLines}

New PRs this week:
${prLines}`

  let parsed
  try {
    const raw = await askGemini({ systemPrompt, history: [], userMessage })
    parsed = parseJsonLoose(raw)
  } catch (err) {
    const status = err instanceof GeminiConfigError ? 500 : err instanceof GeminiRequestError ? 502 : 500
    return NextResponse.json({ error: err.message || 'Could not generate the report.' }, { status })
  }

  if (!parsed?.summary || !parsed?.recommendation) {
    return NextResponse.json({ error: 'The AI response could not be parsed. Try again.' }, { status: 502 })
  }

  const report = await WeeklyReport.findOneAndUpdate(
    { user: user._id, weekStart },
    {
      $set: {
        summary: String(parsed.summary).slice(0, 800),
        recommendation: String(parsed.recommendation).slice(0, 500),
        statsSnapshot: {
          sessionsCompleted: sessions.length,
          totalVolume,
          newPRs: prs.length,
          sessionsGoal,
        },
      },
    },
    { upsert: true, new: true }
  )

  return NextResponse.json({ report })
}
