import { z } from 'zod';
import {
  sessionListResponseSchema,
  sessionSingleResponseSchema,
  sessionStartRequestSchema,
  sessionPatchRequestSchema,
  sessionCompleteRequestSchema,
} from '../../contracts/v1/sessions.js';
import { standardErrorSchema, idParamSchema } from '../common.js';

export function registerSessionsOperations(registry) {
  const userSecurity = [{ BearerAuth: [] }, { CookieAuth: [] }];

  // 1. GET /api/v1/sessions
  registry.registerPath({
    method: 'get',
    path: '/api/v1/sessions',
    summary: 'List athlete workout sessions',
    description: 'Retrieves historical and active workout sessions for the authenticated athlete with optional status filtering.',
    tags: ['Sessions'],
    security: userSecurity,
    request: {
      query: z.object({
        status: z.enum(['in-progress', 'completed', 'abandoned']).optional().describe('Filter sessions by execution status'),
      }),
    },
    responses: {
      200: {
        description: 'Sessions list',
        content: { 'application/json': { schema: sessionListResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 2. POST /api/v1/sessions
  registry.registerPath({
    method: 'post',
    path: '/api/v1/sessions',
    summary: 'Start active workout session',
    description: 'Initializes a live workout session from a template or scratch, starting the elapsed timer and HUD telemetry.',
    tags: ['Sessions'],
    security: userSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: sessionStartRequestSchema } },
      },
    },
    responses: {
      201: {
        description: 'Session initialized',
        content: { 'application/json': { schema: sessionSingleResponseSchema } },
      },
      400: { description: 'Validation failed', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 3. GET /api/v1/sessions/{id}
  registry.registerPath({
    method: 'get',
    path: '/api/v1/sessions/{id}',
    summary: 'Get workout session details',
    description: 'Retrieves detailed telemetry for a single workout session, including all logged exercises, completed sets, reps, weight, and rest durations.',
    tags: ['Sessions'],
    security: userSecurity,
    request: {
      params: idParamSchema,
    },
    responses: {
      200: {
        description: 'Workout session details',
        content: { 'application/json': { schema: sessionSingleResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
      404: { description: 'Session not found', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 4. PATCH /api/v1/sessions/{id}
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/sessions/{id}',
    summary: 'Update active session telemetry',
    description: 'Persists live set progress, logged weights, reps, rest timer timestamps, and scratch workout notes.',
    tags: ['Sessions'],
    security: userSecurity,
    request: {
      params: idParamSchema,
      body: {
        required: true,
        content: { 'application/json': { schema: sessionPatchRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Session progress saved',
        content: { 'application/json': { schema: sessionSingleResponseSchema } },
      },
      400: { description: 'Validation failed', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
      404: { description: 'Session not found', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 5. POST /api/v1/sessions/{id}/complete
  registry.registerPath({
    method: 'post',
    path: '/api/v1/sessions/{id}/complete',
    summary: 'Finalize and complete workout session',
    description: 'Calculates total volume, checks and records personal records (PRs), awards gamification XP, and finalizes session status. Idempotent.',
    tags: ['Sessions'],
    security: userSecurity,
    request: {
      params: idParamSchema,
      body: {
        required: false,
        content: { 'application/json': { schema: sessionCompleteRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Session completed successfully',
        content: { 'application/json': { schema: sessionSingleResponseSchema } },
      },
      400: { description: 'Validation failed', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
      404: { description: 'Session not found', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });
}
