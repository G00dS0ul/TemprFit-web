import MealLog from '@/models/MealLog'
import { displayName } from '@/lib/utils'

/**
 * Builds a compact, factual summary of the user's nutrition profile and
 * recent logging so the AI meal plan is grounded in real constraints
 * (allergies, dietary pattern, actual targets) rather than generic advice.
 */
export async function buildNutritionContext(user, profile) {
  const lines = []
  lines.push(`Name: ${displayName(user)}`)

  if (profile) {
    lines.push(`Dietary pattern: ${profile.dietaryPattern || 'none specified'}`)
    lines.push(`Goal: ${profile.goal || 'maintain'}`)
    if (profile.allergies?.length) lines.push(`Allergies (must strictly avoid): ${profile.allergies.join(', ')}`)
    if (profile.exclusions?.length) lines.push(`Foods to avoid/dislikes: ${profile.exclusions.join(', ')}`)
    lines.push(`Meals per day preferred: ${profile.mealsPerDay || 3}`)
    if (profile.calorieTarget) lines.push(`Daily calorie target: ${profile.calorieTarget} kcal`)
    if (profile.proteinTarget) lines.push(`Daily protein target: ${profile.proteinTarget}g`)
    if (profile.carbsTarget) lines.push(`Daily carbs target: ${profile.carbsTarget}g`)
    if (profile.fatTarget) lines.push(`Daily fat target: ${profile.fatTarget}g`)
    if (profile.pantry && profile.pantry.length) {
      lines.push(`AVAILABLE PANTRY / INGREDIENTS (Use these as much as possible): ${profile.pantry.join(', ')}`)
    }
  } else {
    lines.push('No nutrition profile set up yet — use sensible general defaults and say so.')
  }

  const recentLogs = await MealLog.find({ user: user._id })
    .sort({ date: -1 })
    .limit(15)
    .populate('food', 'name')
    .select('mealType servings calories protein carbs fat date food')
    .lean()

  if (recentLogs.length === 0) {
    lines.push('No recent food logs.')
  } else {
    lines.push('Recently logged foods (most recent first):')
    for (const log of recentLogs) {
      const date = log.date ? new Date(log.date).toISOString().slice(0, 10) : 'unknown date'
      lines.push(
        `- ${date} ${log.mealType}: ${log.food?.name || 'food'} x${log.servings} (${log.calories} kcal, ${log.protein}g protein)`
      )
    }
  }

  return lines.join('\n')
}

export const NUTRITION_SYSTEM_PROMPT_HEADER = `You are the TemprFit AI Nutrition planner, built into a real fitness tracking app.

Ground every plan in the REAL USER DATA block below — their actual dietary pattern, allergies, exclusions, and targets. NEVER include a food that conflicts with a stated allergy or dietary pattern; this is a hard safety constraint, not a preference.

CRITICAL: Do NOT include introductory greetings like "Welcome to TemprFit" or "Since you are just getting started". Provide the plan directly without assuming the user is new.

Give practical, realistic, everyday meals — not exotic or hard-to-source ingredients — appropriate to the stated goal and calorie/macro targets. If no targets are set, estimate sensible ones and say you did.

You must respond with ONLY valid JSON, no markdown fences, no preamble, matching exactly this shape:
{
  "days": [
    {
      "dayNumber": 1,
      "meals": [
        { "mealType": "breakfast", "name": "...", "description": "...", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
      ]
    }
  ],
  "shoppingList": ["..."]
}
Produce exactly 7 days, each with a "breakfast", "lunch", "dinner" meal and, if mealsPerDay > 3, additional "snack" meals. Keep "description" to one short sentence.

Clearly this is general nutrition guidance, not medical or dietetic advice — never diagnose, never recommend extreme calorie deficits (below ~1200 kcal/day) or restrictive eating patterns, and if the user's stated goal or data suggests disordered eating patterns, ignore the JSON format instruction and instead respond with a short plain-text message gently suggesting they speak with a doctor or registered dietitian.`
