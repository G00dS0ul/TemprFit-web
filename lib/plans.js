/**
 * Plan hierarchy for feature gating.
 * Higher index = more access.
 */
const PLAN_LEVELS = { free: 0, pro: 1, max: 2 };

/**
 * Check if a user's current plan meets the minimum required plan level.
 * @param {object} user - The user object (must have `plan` and optionally `planExpiresAt`)
 * @param {'free'|'pro'|'max'} requiredPlan - The minimum plan needed
 * @returns {{ allowed: boolean, currentPlan: string, requiredPlan: string }}
 */
export function checkPlanAccess(user, requiredPlan = 'free') {
  if (!user) return { allowed: false, currentPlan: 'none', requiredPlan };

  let currentPlan = user.plan || 'free';

  // Check if the paid plan has expired
  if (currentPlan !== 'free' && user.planExpiresAt) {
    if (new Date() > new Date(user.planExpiresAt)) {
      currentPlan = 'free'; // Plan expired, treat as free
    }
  }

  const currentLevel = PLAN_LEVELS[currentPlan] ?? 0;
  const requiredLevel = PLAN_LEVELS[requiredPlan] ?? 0;

  return {
    allowed: currentLevel >= requiredLevel,
    currentPlan,
    requiredPlan,
  };
}

/**
 * Feature-to-plan mapping. Used by API routes to determine the minimum plan.
 */
export const FEATURE_PLANS = {
  'ai-workout-generate': 'pro',
  'ai-diet-plan': 'pro',
  'ai-coach-unlimited': 'pro',
  'ai-form-check-unlimited': 'pro',
  'progress-history-all': 'pro',
  'community-forum': 'pro',
  'priority-trainer-booking': 'max',
  'weekly-ai-checkins': 'max',
  'ad-free': 'max',
};

/**
 * Quick helper for API routes — returns a 403 NextResponse if access is denied.
 * Usage:
 *   const gate = gatePlanOrRespond(user, 'pro');
 *   if (gate) return gate; // 403
 */
export function gatePlanOrRespond(user, requiredPlan) {
  const { allowed, currentPlan } = checkPlanAccess(user, requiredPlan);
  if (!allowed) {
    const { NextResponse } = require('next/server');
    return NextResponse.json(
      {
        error: `This feature requires the ${requiredPlan.toUpperCase()} plan. You are currently on ${currentPlan.toUpperCase()}.`,
        upgrade: true,
        requiredPlan,
        currentPlan,
      },
      { status: 403 }
    );
  }
  return null; // Access granted
}
