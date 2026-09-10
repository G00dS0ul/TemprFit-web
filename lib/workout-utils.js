import PersonalRecord from '@/models/PersonalRecord'

/** Epley formula — the standard estimated-1RM approximation. */
export function estOneRepMax(weight, reps) {
  if (!weight || !reps) return 0
  return Math.round(weight * (1 + reps / 30) * 10) / 10
}

/** Sum of weight * reps across completed sets only. */
export function computeVolume(exercises) {
  let total = 0
  for (const ex of exercises || []) {
    for (const set of ex.sets || []) {
      if (set.completed && set.weight > 0 && set.reps > 0) {
        total += set.weight * set.reps
      }
    }
  }
  return Math.round(total)
}

/**
 * Compares every completed, weighted set in this session against the
 * user's best-ever estOneRepMax for that exercise. Writes a PersonalRecord
 * for anything that's a new best, marks the winning set's `isPR` flag, and
 * returns how many new PRs were set. Call once, at session completion.
 */
export async function detectAndRecordPRs({ userId, sessionId, exercises }) {
  let prCount = 0

  for (const ex of exercises || []) {
    let bestThisExercise = 0
    let bestSet = null

    for (const set of ex.sets || []) {
      if (!set.completed || !set.weight || !set.reps) continue
      const est = estOneRepMax(set.weight, set.reps)
      if (est > bestThisExercise) {
        bestThisExercise = est
        bestSet = set
      }
    }

    if (!bestSet || bestThisExercise <= 0) continue

    const priorBest = await PersonalRecord.findOne({ user: userId, exercise: ex.exercise })
      .sort({ estOneRepMax: -1 })
      .select('estOneRepMax')
      .lean()

    if (!priorBest || bestThisExercise > priorBest.estOneRepMax) {
      await PersonalRecord.create({
        user: userId,
        exercise: ex.exercise,
        session: sessionId,
        weight: bestSet.weight,
        reps: bestSet.reps,
        estOneRepMax: bestThisExercise,
      })
      bestSet.isPR = true
      prCount += 1
    }
  }

  return prCount
}
