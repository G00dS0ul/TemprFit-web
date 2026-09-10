import WorkoutSession from '@/models/WorkoutSession'
import PersonalRecord from '@/models/PersonalRecord'
import { displayName } from '@/lib/utils'

/**
 * Builds a compact, factual summary of the user's real data so the model
 * answers grounded in what actually happened — not invented specifics.
 * Deliberately terse: this eats into the free-tier token budget every call.
 */
export async function buildUserContext(user) {
  const recentSessions = await WorkoutSession.find({ user: user._id, status: 'completed' })
    .sort({ completedAt: -1 })
    .limit(5)
    .select('name completedAt durationSeconds totalVolume prCount')
    .lean()

  const recentPRs = await PersonalRecord.find({ user: user._id })
    .sort({ achievedAt: -1 })
    .limit(5)
    .populate('exercise', 'name')
    .select('weight reps estOneRepMax achievedAt')
    .lean()

  const lines = []
  lines.push(`Name: ${displayName(user)}`)
  if (user.goal) lines.push(`Stated fitness goal: ${user.goal}`)
  if (user.experience) lines.push(`Experience level: ${user.experience}`)
  lines.push(`Current streak: ${user.currentStreak || 0} days (longest: ${user.longestStreak || 0})`)
  lines.push(`Weekly session target: ${user.goals?.weeklySessions ?? 4}`)
  if (user.goals?.targetExerciseSlug && user.goals?.targetWeight) {
    lines.push(
      `Target lift: ${user.goals.targetExerciseSlug} to ${user.goals.targetWeight} ${user.weightUnit || 'lbs'} (est. 1RM)`
    )
  }

  if (recentSessions.length === 0) {
    lines.push('No completed workouts logged yet.')
  } else {
    lines.push('Recent completed sessions (most recent first):')
    for (const s of recentSessions) {
      const mins = Math.round((s.durationSeconds || 0) / 60)
      const date = s.completedAt ? new Date(s.completedAt).toISOString().slice(0, 10) : 'unknown date'
      lines.push(
        `- ${date}: "${s.name}", ${mins}min, ${s.totalVolume || 0} volume, ${s.prCount || 0} PR(s)`
      )
    }
  }

  if (recentPRs.length > 0) {
    lines.push('Recent personal records:')
    for (const pr of recentPRs) {
      const date = new Date(pr.achievedAt).toISOString().slice(0, 10)
      lines.push(`- ${date}: ${pr.exercise?.name || 'exercise'} — ${pr.weight}x${pr.reps} (est. 1RM ${pr.estOneRepMax})`)
    }
  }

  return lines.join('\n')
}

export const COACH_SYSTEM_PROMPT_HEADER = `You are the REPForge AI Coach, built into a real fitness tracking app.

Ground every answer in the REAL USER DATA block below — it is pulled live from the user's actual logged workouts, streaks, and goals. Never invent sessions, numbers, or PRs that aren't in that data. If the data doesn't cover what's being asked, say so plainly instead of guessing.

Be encouraging but honest — don't inflate progress that isn't there, and don't discourage someone who's genuinely doing fine.
Give specific, practical, evidence-based fitness, recovery, and training advice.
For anything about injuries, pain, or medical conditions, give general safety guidance but clearly recommend seeing a doctor or physical therapist — you are not a medical professional.

FORMATTING INSTRUCTIONS:
- When providing workout plans, routine splits, progression tables, or macro breakdowns, ALWAYS use structured Markdown Tables (| Day/Exercise | Sets x Reps | Rest | Notes |) so they are easy to read.
- Use clear bullet points (- ) and bold key metrics (**Metric**) for quick scanning.
- Use clean headings (### Heading) to organize multi-part answers.
- Keep direct answers clean and concise; use tables and lists whenever comparing multiple items or detailing step-by-step routines.`
