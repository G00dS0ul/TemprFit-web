import { z } from 'zod';
import {
  statsResponseSchema,
  weightListResponseSchema,
  weightSingleResponseSchema,
  weightCreateRequestSchema,
} from '../../contracts/v1/stats.js';
import { standardErrorSchema } from '../common.js';

export function registerStatsOperations(registry) {
  const userSecurity = [{ BearerAuth: [] }, { CookieAuth: [] }];

  // 1. GET /api/v1/stats
  registry.registerPath({
    method: 'get',
    path: '/api/v1/stats',
    summary: 'Dashboard aggregate stats and workout streaks',
    description: 'Calculates active workout streak, total XP, current user tier, weekly volume chart, and activity heatmap history for dashboard visualization.',
    tags: ['Stats'],
    security: userSecurity,
    responses: {
      200: {
        description: 'Dashboard statistics payload',
        content: { 'application/json': { schema: statsResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 2. GET /api/v1/weight
  registry.registerPath({
    method: 'get',
    path: '/api/v1/weight',
    summary: 'Get body weight entry history',
    description: 'Retrieves historical body weight logs, weighing dates, body fat percentage, and units (kg/lbs) for progress tracking.',
    tags: ['Stats'],
    security: userSecurity,
    request: {
      query: z.object({
        limit: z.coerce.number().optional().describe('Maximum number of weight log entries to retrieve (default 30)'),
      }),
    },
    responses: {
      200: {
        description: 'Weight history list',
        content: { 'application/json': { schema: weightListResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 3. POST /api/v1/weight
  registry.registerPath({
    method: 'post',
    path: '/api/v1/weight',
    summary: 'Log body weight measurement',
    description: 'Records a new weight measurement with date, optional body fat percentage, and note.',
    tags: ['Stats'],
    security: userSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: weightCreateRequestSchema } },
      },
    },
    responses: {
      201: {
        description: 'Weight entry saved successfully',
        content: { 'application/json': { schema: weightSingleResponseSchema } },
      },
      400: { description: 'Validation failed', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });
}
