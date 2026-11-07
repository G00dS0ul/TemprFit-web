import { z } from 'zod';
import {
  coachMessageListResponseSchema,
  coachSendMessageRequestSchema,
  coachSendMessageResponseSchema,
  coachAskExerciseRequestSchema,
  coachAskExerciseResponseSchema,
  coachPaywallErrorSchema,
} from '../../contracts/v1/coach.js';
import { standardErrorSchema } from '../common.js';

export function registerCoachOperations(registry) {
  const userSecurity = [{ BearerAuth: [] }, { CookieAuth: [] }];

  // 1. GET /api/v1/coach
  registry.registerPath({
    method: 'get',
    path: '/api/v1/coach',
    summary: 'Retrieve AI coach conversation history',
    description: 'Retrieves the athlete conversation history with the Gemini-powered AI fitness coach, including structured advice and exercise attachments.',
    tags: ['Coach'],
    security: userSecurity,
    responses: {
      200: {
        description: 'Conversation message history list',
        content: { 'application/json': { schema: coachMessageListResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 2. POST /api/v1/coach
  registry.registerPath({
    method: 'post',
    path: '/api/v1/coach',
    summary: 'Send message to AI Coach',
    description: 'Dispatches conversational prompt to AI coach. Checks user subscription quota (3 messages/day on Free tier, unlimited on Pro/Max). Returns AI response and updated conversation.',
    tags: ['Coach'],
    security: userSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: coachSendMessageRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'AI coach response message',
        content: { 'application/json': { schema: coachSendMessageResponseSchema } },
      },
      400: { description: 'Missing message content', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
      403: {
        description: 'AI quota exceeded; subscription upgrade required',
        content: { 'application/json': { schema: coachPaywallErrorSchema } },
      },
    },
  });

  // 3. POST /api/v1/coach/ask-exercise
  registry.registerPath({
    method: 'post',
    path: '/api/v1/coach/ask-exercise',
    summary: 'Ask AI coach for specific exercise form and tips',
    description: 'Queries Gemini for tailored form tips, muscle activation cues, and progression advice for a specific exercise.',
    tags: ['Coach'],
    security: userSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: coachAskExerciseRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Targeted exercise advice',
        content: { 'application/json': { schema: coachAskExerciseResponseSchema } },
      },
      400: { description: 'Invalid exercise query parameters', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
      403: { description: 'Paywall error', content: { 'application/json': { schema: coachPaywallErrorSchema } } },
    },
  });
}
