import { z } from 'zod';
import {
  exerciseListQuerySchema,
  exerciseListResponseSchema,
  exerciseDetailResponseSchema,
  exerciseFavoriteToggleResponseSchema,
  exerciseFavoritesListResponseSchema,
  exerciseSwapRequestSchema,
  exerciseSwapResponseSchema,
} from '../../contracts/v1/exercises.js';
import { standardErrorSchema, slugParamSchema } from '../common.js';

export function registerExercisesOperations(registry) {
  const userSecurity = [{ BearerAuth: [] }, { CookieAuth: [] }];
  const optionalSecurity = [{ BearerAuth: [] }, { CookieAuth: [] }, {}];

  // 1. GET /api/v1/exercises
  registry.registerPath({
    method: 'get',
    path: '/api/v1/exercises',
    summary: 'List exercises with filtering and dual pagination',
    description: 'Returns published exercises filtered by text search, target muscle, equipment, difficulty, environment, and category. Supports both offset pagination (page/pageSize) and cursor-based pagination (after Mongo _id). Enriches items with isFavorited when authenticated.',
    tags: ['Exercises'],
    security: optionalSecurity,
    request: {
      query: exerciseListQuerySchema,
    },
    responses: {
      200: {
        description: 'Paginated list of exercises',
        content: { 'application/json': { schema: exerciseListResponseSchema } },
      },
      400: {
        description: 'Invalid filter or pagination query parameters',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
    },
  });

  // 2. GET /api/v1/exercises/favorites
  registry.registerPath({
    method: 'get',
    path: '/api/v1/exercises/favorites',
    summary: 'List athlete favorite exercises',
    description: 'Retrieves all exercise summaries currently favorited / bookmarked by the authenticated athlete.',
    tags: ['Exercises'],
    security: userSecurity,
    responses: {
      200: {
        description: 'List of favorited exercises',
        content: { 'application/json': { schema: exerciseFavoritesListResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 3. POST /api/v1/exercises/swap
  registry.registerPath({
    method: 'post',
    path: '/api/v1/exercises/swap',
    summary: 'Find smart exercise replacements',
    description: 'Recommends biomechanically compatible alternative exercises based on target muscles, available equipment, and athlete injuries or preferences.',
    tags: ['Exercises'],
    security: userSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: exerciseSwapRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'List of alternative exercise recommendations',
        content: { 'application/json': { schema: exerciseSwapResponseSchema } },
      },
      400: { description: 'Invalid exercise swap parameters', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 4. GET /api/v1/exercises/{slug}
  registry.registerPath({
    method: 'get',
    path: '/api/v1/exercises/{slug}',
    summary: 'Get exercise details by slug',
    description: 'Retrieves full details for a single published exercise, including primary and secondary target muscles, video URLs, instructions, and safety notes.',
    tags: ['Exercises'],
    security: optionalSecurity,
    request: {
      params: slugParamSchema,
    },
    responses: {
      200: {
        description: 'Exercise detail record',
        content: { 'application/json': { schema: exerciseDetailResponseSchema } },
      },
      404: { description: 'Exercise not found', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 5. POST /api/v1/exercises/{slug}/favorite
  registry.registerPath({
    method: 'post',
    path: '/api/v1/exercises/{slug}/favorite',
    summary: 'Toggle exercise favorite status',
    description: 'Adds or removes the specified exercise from the authenticated athlete favoriteExercises list.',
    tags: ['Exercises'],
    security: userSecurity,
    request: {
      params: slugParamSchema,
    },
    responses: {
      200: {
        description: 'Favorite status toggled successfully',
        content: { 'application/json': { schema: exerciseFavoriteToggleResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
      404: { description: 'Exercise not found', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });
}
