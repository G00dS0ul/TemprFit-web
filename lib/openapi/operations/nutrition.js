import { z } from 'zod';
import {
  nutritionProfileResponseSchema,
  nutritionProfileUpdateRequestSchema,
  foodSearchResponseSchema,
  mealLogListResponseSchema,
  mealLogCreateRequestSchema,
  mealPlanResponseSchema,
  mealPlanCompleteRequestSchema,
  mealPlanCompleteResponseSchema,
} from '../../contracts/v1/nutrition.js';
import { standardErrorSchema, successMessageSchema } from '../common.js';

export function registerNutritionOperations(registry) {
  const userSecurity = [{ BearerAuth: [] }, { CookieAuth: [] }];

  // 1. GET /api/v1/nutrition/foods/search
  registry.registerPath({
    method: 'get',
    path: '/api/v1/nutrition/foods/search',
    summary: 'Search verified food items and nutrition database',
    description: 'Searches food database by keyword with calories, protein, carbs, fats, and micronutrient breakdown.',
    tags: ['Nutrition'],
    security: userSecurity,
    request: {
      query: z.object({
        q: z.string().describe('Food search keyword (e.g. oatmeal, chicken breast)'),
      }),
    },
    responses: {
      200: {
        description: 'Matching food items list',
        content: { 'application/json': { schema: foodSearchResponseSchema } },
      },
      400: { description: 'Missing search query', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 2. GET /api/v1/nutrition/log
  registry.registerPath({
    method: 'get',
    path: '/api/v1/nutrition/log',
    summary: 'Get daily nutrition and meal log',
    description: 'Retrieves logged meals, foods, and calculated calorie/macro totals for a specific date (YYYY-MM-DD).',
    tags: ['Nutrition'],
    security: userSecurity,
    request: {
      query: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Log date in YYYY-MM-DD format (defaults to today)'),
      }),
    },
    responses: {
      200: {
        description: 'Daily meal log with macro totals',
        content: { 'application/json': { schema: mealLogListResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 3. POST /api/v1/nutrition/log
  registry.registerPath({
    method: 'post',
    path: '/api/v1/nutrition/log',
    summary: 'Log meal entry',
    description: 'Records a meal (breakfast, lunch, dinner, snack) with serving count and consumed macros.',
    tags: ['Nutrition'],
    security: userSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: mealLogCreateRequestSchema } },
      },
    },
    responses: {
      201: {
        description: 'Meal logged successfully',
        content: { 'application/json': { schema: successMessageSchema } },
      },
      400: { description: 'Validation error', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 4. DELETE /api/v1/nutrition/log
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/nutrition/log',
    summary: 'Remove logged meal item',
    description: 'Deletes a logged food item or entire meal from the daily nutrition log.',
    tags: ['Nutrition'],
    security: userSecurity,
    request: {
      body: {
        required: false,
        content: {
          'application/json': {
            schema: z.object({
              logId: z.string().optional().describe('Daily log ID'),
              mealType: z.string().optional().describe('Meal type container'),
              itemIndex: z.number().optional().describe('Item index within meal foods array'),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Meal item deleted',
        content: { 'application/json': { schema: successMessageSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 5. GET /api/v1/nutrition/plan
  registry.registerPath({
    method: 'get',
    path: '/api/v1/nutrition/plan',
    summary: 'Retrieve active personalized meal plan',
    description: 'Retrieves the athlete 7-day personalized dietary meal plan, target daily macros, and meal schedule.',
    tags: ['Nutrition'],
    security: userSecurity,
    request: {
      query: z.object({
        targetDate: z.string().optional().describe('Target date in YYYY-MM-DD format'),
      }),
    },
    responses: {
      200: {
        description: 'Active meal plan',
        content: { 'application/json': { schema: mealPlanResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 6. POST /api/v1/nutrition/plan
  registry.registerPath({
    method: 'post',
    path: '/api/v1/nutrition/plan',
    summary: 'Generate or update AI meal plan',
    description: 'Generates a fresh 7-day dietary plan matching caloric goals, dietary restrictions, and preferred meal frequencies.',
    tags: ['Nutrition'],
    security: userSecurity,
    request: {
      body: {
        required: false,
        content: {
          'application/json': {
            schema: z.object({
              targetCalories: z.number().optional(),
              dietaryPreference: z.string().optional(),
              allergies: z.array(z.string()).optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Generated meal plan',
        content: { 'application/json': { schema: mealPlanResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 7. POST /api/v1/nutrition/plan/complete
  registry.registerPath({
    method: 'post',
    path: '/api/v1/nutrition/plan/complete',
    summary: 'Toggle meal plan scheduled item completion',
    description: 'Marks a planned scheduled meal as completed or uncompleted, automatically syncing macro progress.',
    tags: ['Nutrition'],
    security: userSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: mealPlanCompleteRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Meal plan completion status updated',
        content: { 'application/json': { schema: mealPlanCompleteResponseSchema } },
      },
      400: { description: 'Validation failed', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 8. GET /api/v1/nutrition/profile
  registry.registerPath({
    method: 'get',
    path: '/api/v1/nutrition/profile',
    summary: 'Get athlete nutrition and dietary profile',
    description: 'Retrieves athlete daily caloric target, macro distribution ratio (protein/carbs/fat), and dietary preferences.',
    tags: ['Nutrition'],
    security: userSecurity,
    responses: {
      200: {
        description: 'Nutrition profile',
        content: { 'application/json': { schema: nutritionProfileResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 9. PUT /api/v1/nutrition/profile
  registry.registerPath({
    method: 'put',
    path: '/api/v1/nutrition/profile',
    summary: 'Update nutrition profile and macro goals',
    description: 'Sets daily calorie and macro goals, cooking preferences, dietary patterns, and allergies.',
    tags: ['Nutrition'],
    security: userSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: nutritionProfileUpdateRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Nutrition profile updated',
        content: { 'application/json': { schema: nutritionProfileResponseSchema } },
      },
      400: { description: 'Validation error', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });
}
