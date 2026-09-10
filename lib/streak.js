const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Given a user's current streak state and "now", returns the updated
 * streak fields after logging a completed workout today.
 */
export function updateStreak(user, now = new Date()) {
  const today = startOfDay(now)
  const last = user.lastWorkoutDate ? startOfDay(user.lastWorkoutDate) : null

  let currentStreak = user.currentStreak || 0

  if (!last) {
    currentStreak = 1
  } else {
    const diffDays = Math.round((today - last) / DAY_MS)
    if (diffDays === 0) {
      // already logged a workout today — streak unchanged
    } else if (diffDays === 1) {
      currentStreak += 1
    } else {
      currentStreak = 1
    }
  }

  const longestStreak = Math.max(user.longestStreak || 0, currentStreak)

  return { currentStreak, longestStreak, lastWorkoutDate: now }
}
