import { z } from 'zod';
import {
  progressQuerySchema,
  progressResponseSchema,
  weeklyReportGetResponseSchema,
  weeklyReportPostRequestSchema,
  weeklyReportPostResponseSchema,
} from '../../contracts/v1/progress.js';
import { standardErrorSchema } from '../common.js';

export function registerProgressOperations(registry) {
  const userSecurity = [{ BearerAuth: [] }, { CookieAuth: [] }];

  // 1. GET /api/v1/progress
  registry.registerPath({
    method: 'get',
    path: '/api/v1/progress',
    summary: '12-week progress analytics and volume trends',
    description: 'Returns 12-week strength trends, exercise-specific personal records (PRs), weekly session counts, aggregate volume by week, and goal completion rates.',
    tags: ['Progress'],
    security: userSecurity,
    request: {
      query: progressQuerySchema,
    },
    responses: {
      200: {
        description: 'Comprehensive 12-week progress analytics data',
        content: { 'application/json': { schema: progressResponseSchema } },
      },
      400: { description: 'Invalid range parameter', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 2. GET /api/v1/progress/weekly-report
  registry.registerPath({
    method: 'get',
    path: '/api/v1/progress/weekly-report',
    summary: 'Get cached weekly performance summary report',
    description: 'Retrieves the athlete latest cached AI-generated weekly digest report, highlighting volume changes, PR achievements, and recommendations.',
    tags: ['Progress'],
    security: userSecurity,
    responses: {
      200: {
        description: 'Cached weekly performance report',
        content: { 'application/json': { schema: weeklyReportGetResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 3. POST /api/v1/progress/weekly-report
  registry.registerPath({
    method: 'post',
    path: '/api/v1/progress/weekly-report',
    summary: 'Generate or regenerate weekly performance report',
    description: 'Aggregates the past 7 days of workout telemetry, analyzes volume/intensity shifts, and uses Gemini to generate a personalized weekly summary report.',
    tags: ['Progress'],
    security: userSecurity,
    request: {
      body: {
        required: false,
        content: { 'application/json': { schema: weeklyReportPostRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Newly generated weekly report',
        content: { 'application/json': { schema: weeklyReportPostResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });
}
