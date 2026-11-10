import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { standardErrorSchema, paywallErrorSchema, successMessageSchema } from './common.js';
import { safeUserSchema } from '../contracts/v1/auth.js';
import { exerciseSummarySchema, exerciseDetailSchema } from '../contracts/v1/exercises.js';
import { workoutTemplateSchema } from '../contracts/v1/workouts.js';
import { flaggedIssueSchema } from '../contracts/v1/form-check.js';

export function createRegistry() {
  const registry = new OpenAPIRegistry();

  // 1. Security Schemes
  registry.registerComponent('securitySchemes', 'BearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Enter 30-day JWT Bearer token obtained from POST /api/v1/auth/login or register',
  });

  registry.registerComponent('securitySchemes', 'CookieAuth', {
    type: 'apiKey',
    in: 'cookie',
    name: 'temprfit_token',
    description: 'Primary session cookie set automatically on web login',
  });

  // 2. Shared Component Schemas
  registry.register('StandardError', standardErrorSchema);
  registry.register('PaywallError', paywallErrorSchema);
  registry.register('SuccessConfirmation', successMessageSchema);
  registry.register('SafeUser', safeUserSchema);
  registry.register('ExerciseSummary', exerciseSummarySchema);
  registry.register('ExerciseDetail', exerciseDetailSchema);
  registry.register('WorkoutTemplate', workoutTemplateSchema);
  registry.register('FlaggedIssue', flaggedIssueSchema);

  return registry;
}
