import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { createRegistry } from './registry.js';
import { registerAuthOperations } from './operations/auth.js';
import { registerAdminOperations } from './operations/admin.js';
import { registerCoachOperations } from './operations/coach.js';
import { registerExercisesOperations } from './operations/exercises.js';
import { registerFormCheckOperations } from './operations/form-check.js';
import { registerNutritionOperations } from './operations/nutrition.js';
import { registerProgressOperations } from './operations/progress.js';
import { registerSessionsOperations } from './operations/sessions.js';
import { registerStatsOperations } from './operations/stats.js';
import { registerUserOperations } from './operations/user.js';
import { registerWorkoutsOperations } from './operations/workouts.js';
import { registerCommunityOperations } from './operations/community.js';

/**
 * Builds and returns the complete, canonical OpenAPI 3.0.3 specification for TemprFit API v1.
 */
export function generateOpenApiSpec() {
  const registry = createRegistry();

  // Register operations across all 12 domains
  registerAuthOperations(registry);
  registerAdminOperations(registry);
  registerCoachOperations(registry);
  registerExercisesOperations(registry);
  registerFormCheckOperations(registry);
  registerNutritionOperations(registry);
  registerProgressOperations(registry);
  registerSessionsOperations(registry);
  registerStatsOperations(registry);
  registerUserOperations(registry);
  registerWorkoutsOperations(registry);
  registerCommunityOperations(registry);

  const generator = new OpenApiGeneratorV3(registry.definitions);

  const openApiDoc = generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'TemprFit API',
      version: '1.0.0',
      description: 'Local-first interactive API documentation and change-tracking system for TemprFit Next.js backend.',
    },
    servers: [
      {
        url: '/',
        description: 'Local development server (same origin)',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication, registration, Google SSO, token rotation and revocation' },
      { name: 'Admin', description: 'Administrative platform analytics, user moderation, disputes, coupons, and bans' },
      { name: 'Coach', description: 'Gemini conversational AI coaching and exercise Q&A' },
      { name: 'Exercises', description: 'Exercise catalogue, filtering, dual offset/cursor pagination, favorites, and smart swaps' },
      { name: 'Form Check', description: 'On-device ML Kit pose detection flags feedback (hard rule: zero video egress)' },
      { name: 'Nutrition', description: 'Dietary profiles, verified food search, meal logging, and meal plan scheduling' },
      { name: 'Progress', description: '12-week volume trends, strength PR analytics, and weekly summary reports' },
      { name: 'Sessions', description: 'Workout session tracking, live telemetry HUD logging, and idempotent completion' },
      { name: 'Stats', description: 'Dashboard aggregate stats, active streaks, and body weight logging' },
      { name: 'User', description: 'Athlete profile management, onboarding, streak check-in, password, and XP transfer' },
      { name: 'Workouts', description: 'Custom workout templates and rules-based/Gemini AI multimodal routine generator' },
      { name: 'Community', description: 'Public athlete profiles, social graph, follow/like actions, and community rooms' },
    ],
  });

  return openApiDoc;
}
