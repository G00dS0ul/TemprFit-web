import { z } from 'zod';
import {
  workoutListResponseSchema,
  workoutSingleResponseSchema,
  workoutCreateRequestSchema,
  workoutUpdateRequestSchema,
  workoutGenerateRequestSchema,
  workoutGenerateResponseSchema,
} from '../../contracts/v1/workouts.js';
import { standardErrorSchema, successMessageSchema, idParamSchema } from '../common.js';

export function registerWorkoutsOperations(registry) {
  const userSecurity = [{ BearerAuth: [] }, { CookieAuth: [] }];

  // 1. GET /api/v1/workouts
  registry.registerPath({
    method: 'get',
    path: '/api/v1/workouts',
    summary: 'List athlete workout templates',
    description: 'Retrieves custom athlete workout templates and platform standard routines.',
    tags: ['Workouts'],
    security: userSecurity,
    responses: {
      200: {
        description: 'Workout templates list',
        content: { 'application/json': { schema: workoutListResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 2. POST /api/v1/workouts
  registry.registerPath({
    method: 'post',
    path: '/api/v1/workouts',
    summary: 'Create custom workout template',
    description: 'Saves a new multi-exercise workout routine with target sets, reps, weights, rest intervals, and tempo.',
    tags: ['Workouts'],
    security: userSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: workoutCreateRequestSchema } },
      },
    },
    responses: {
      201: {
        description: 'Workout template created',
        content: { 'application/json': { schema: workoutSingleResponseSchema } },
      },
      400: { description: 'Validation failed', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 3. GET /api/v1/workouts/{id}
  registry.registerPath({
    method: 'get',
    path: '/api/v1/workouts/{id}',
    summary: 'Get workout template details by ID',
    description: 'Retrieves single workout template definition, including exercise list, target sets, and prescribed rest intervals.',
    tags: ['Workouts'],
    security: userSecurity,
    request: {
      params: idParamSchema,
    },
    responses: {
      200: {
        description: 'Workout template record',
        content: { 'application/json': { schema: workoutSingleResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
      404: { description: 'Workout not found', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 4. PUT /api/v1/workouts/{id}
  registry.registerPath({
    method: 'put',
    path: '/api/v1/workouts/{id}',
    summary: 'Update existing workout template',
    description: 'Modifies exercises, target volume, sets, routine name, or instructions for a custom workout template.',
    tags: ['Workouts'],
    security: userSecurity,
    request: {
      params: idParamSchema,
      body: {
        required: true,
        content: { 'application/json': { schema: workoutUpdateRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Workout template updated',
        content: { 'application/json': { schema: workoutSingleResponseSchema } },
      },
      400: { description: 'Validation failed', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
      404: { description: 'Workout not found', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 5. DELETE /api/v1/workouts/{id}
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/workouts/{id}',
    summary: 'Delete workout template',
    description: 'Permanently removes a custom workout template owned by the authenticated athlete.',
    tags: ['Workouts'],
    security: userSecurity,
    request: {
      params: idParamSchema,
    },
    responses: {
      200: {
        description: 'Workout template deleted',
        content: { 'application/json': { schema: successMessageSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
      404: { description: 'Workout not found', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 6. POST /api/v1/workouts/generate
  registry.registerPath({
    method: 'post',
    path: '/api/v1/workouts/generate',
    summary: 'Generate tailored routine (Rules-based or Gemini AI with equipment photo vision)',
    description: 'Generates a balanced workout session targeting specified muscle groups, available gym equipment, target session duration, and fitness goals (hypertrophy, strength, endurance, general_fitness). Supports multimodal equipment photo vision input (up to 4 JPEG/PNG/WebP base64 images under 512KB each, aggregate 2MB ceiling). Transparently falls back to deterministic rule-based selection if AI quota is exhausted or vision calls encounter network interruptions.',
    tags: ['Workouts'],
    security: userSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: workoutGenerateRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Generated workout routine payload',
        content: { 'application/json': { schema: workoutGenerateResponseSchema } },
      },
      400: {
        description: 'Invalid generation parameters or equipment image validation error',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
      413: { description: 'Payload too large: request body stream exceeded 4MB ceiling', content: { 'application/json': { schema: standardErrorSchema } } },
      429: { description: 'Daily AI generation quota exceeded', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });
}
