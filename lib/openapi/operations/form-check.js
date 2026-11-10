import { z } from 'zod';
import {
  formCheckListResponseSchema,
  formCheckSubmitRequestSchema,
  formCheckSubmitResponseSchema,
  formCheckRateLimitErrorSchema,
} from '../../contracts/v1/form-check.js';
import { standardErrorSchema } from '../common.js';

export function registerFormCheckOperations(registry) {
  const userSecurity = [{ BearerAuth: [] }, { CookieAuth: [] }];

  // 1. GET /api/v1/form-check
  registry.registerPath({
    method: 'get',
    path: '/api/v1/form-check',
    summary: 'List athlete form-check session history',
    description: 'Retrieves previous on-device pose inference feedback evaluations and summaries for the athlete.',
    tags: ['Form Check'],
    security: userSecurity,
    responses: {
      200: {
        description: 'Form check session history',
        content: { 'application/json': { schema: formCheckListResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 2. POST /api/v1/form-check
  registry.registerPath({
    method: 'post',
    path: '/api/v1/form-check',
    summary: 'Submit on-device pose detection feedback flags',
    description: 'HARD CONTRACT RULE: All ML Kit pose inference runs locally on the mobile client. Only structured geometric flags and issue summaries (e.g. knees_caving_in, lumbar_flexion) are submitted. Zero video files, camera frames, or image byte buffers ever leave the device.',
    tags: ['Form Check'],
    security: userSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: formCheckSubmitRequestSchema } },
      },
    },
    responses: {
      201: {
        description: 'Form check feedback evaluation saved',
        content: { 'application/json': { schema: formCheckSubmitResponseSchema } },
      },
      400: { description: 'Validation failed or invalid issue schema', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
      429: {
        description: 'Daily form check limit reached; Pro/Max subscription upgrade required',
        content: { 'application/json': { schema: formCheckRateLimitErrorSchema } },
      },
    },
  });
}
