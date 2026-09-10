// Sets, reps, and rest are deliberately NOT stored on Exercise documents —
// the same "Barbell Back Squat" should prescribe differently for someone
// training for strength vs. fat loss vs. a beginner just learning the
// pattern. This is the rules-based version of that; Phase 5's AI coach can
// later replace or augment `prescribe()` without touching the exercise data
// itself.

export const GOALS = ['strength', 'hypertrophy', 'endurance', 'fat-loss']

const GOAL_TABLE = {
  strength: { sets: 5, reps: '3-6', restSeconds: 150 },
  hypertrophy: { sets: 4, reps: '8-12', restSeconds: 75 },
  endurance: { sets: 3, reps: '15-20', restSeconds: 40 },
  'fat-loss': { sets: 4, reps: '12-15', restSeconds: 30 },
}

const DIFFICULTY_SET_ADJUSTMENT = {
  beginner: -1,
  intermediate: 0,
  advanced: 1,
}

/**
 * @param {{ category?: string, difficulty?: string }} exercise
 * @param {{ goal?: string }} [options]
 * @returns {{ sets: number, reps?: string, durationSeconds?: number, restSeconds: number }}
 */
export function prescribe(exercise, { goal = 'hypertrophy' } = {}) {
  if (!exercise) return GOAL_TABLE.hypertrophy

  if (exercise.category === 'stretching') {
    return { sets: 1, durationSeconds: 30, restSeconds: 15 }
  }

  if (exercise.category === 'cardio' || exercise.category === 'plyometrics') {
    const base = { strength: 30, hypertrophy: 30, endurance: 45, 'fat-loss': 45 }[goal] || 30
    return { sets: 4, durationSeconds: base, restSeconds: goal === 'endurance' ? 20 : 30 }
  }

  const base = GOAL_TABLE[goal] || GOAL_TABLE.hypertrophy
  const adjustment = DIFFICULTY_SET_ADJUSTMENT[exercise.difficulty] ?? 0
  const sets = Math.max(2, base.sets + adjustment)

  return { sets, reps: base.reps, restSeconds: base.restSeconds }
}
