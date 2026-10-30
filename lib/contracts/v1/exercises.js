import { z } from 'zod';

export const contractMetadata = {
  endpoint: '/api/v1/exercises',
  version: '1.0.0',
  description: 'Exercise library and exploration contracts for /api/v1/exercises/**',
};

export const EXERCISE_MUSCLES = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'abdominals', 'glutes', 'quads', 'hamstrings', 'calves', 'full body',
];

export const EXERCISE_CATEGORIES = [
  'calisthenics', 'bodybuilding', 'powerlifting', 'stretching',
  'cardio', 'olympic weightlifting', 'plyometrics', 'strongman',
];

export const EXERCISE_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
export const EXERCISE_ENVIRONMENTS = ['home', 'gym', 'outdoor', 'studio'];

/**
 * Exercise summary representation for paginated lists and cards.
 */
export const exerciseSummarySchema = z.object({
  _id: z.any(),
  id: z.string().optional(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional().default(''),
  targetMuscles: z.object({
    primary: z.string(),
    secondary: z.array(z.string()).optional().default([]),
  }).passthrough(),
  equipment: z.array(z.string()).optional().default([]),
  category: z.string(),
  difficulty: z.string().optional().default('beginner'),
  environment: z.array(z.string()).optional().default([]),
  movementPattern: z.string().optional().default(''),
  ageSuitability: z.string().optional().default('all'),
  trackingType: z.enum(['weight_reps', 'reps_only', 'time_only']).optional().default('weight_reps'),
  media: z.any().optional(),
  variations: z.array(z.string()).optional().default([]),
  progressions: z.array(z.string()).optional().default([]),
  regressions: z.array(z.string()).optional().default([]),
  alternatives: z.array(z.any()).optional().default([]),
  isFavorited: z.boolean().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
}).passthrough();

/**
 * Full exercise detail representation including instructions, tips, and populated alternatives.
 */
export const exerciseDetailSchema = exerciseSummarySchema.extend({
  instructions: z.array(z.string()).optional().default([]),
  safetyNotes: z.array(z.string()).optional().default([]),
  commonMistakes: z.array(z.string()).optional().default([]),
  formTips: z.array(z.string()).optional().default([]),
  source: z.object({
    name: z.string().optional(),
    url: z.string().optional(),
    license: z.string().optional(),
  }).passthrough().optional(),
}).passthrough();

/**
 * GET /api/v1/exercises query parameters
 * Supports dual offset and Mongo _id cursor pagination 
 */
export const exerciseListQuerySchema = z.object({
  q: z.string().trim().optional(),
  muscle: z.string().trim().optional(),
  equipment: z.string().trim().optional(),
  difficulty: z.string().trim().optional(),
  environment: z.string().trim().optional(),
  category: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
  after: z.string().trim().optional(),
}).strict();

export const exerciseListResponseSchema = z.object({
  items: z.array(exerciseSummarySchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
  hasMore: z.boolean(),
  nextCursor: z.string().nullable(),
}).passthrough();

export const exerciseDetailResponseSchema = z.object({
  exercise: exerciseDetailSchema,
}).passthrough();

export const exerciseFavoriteToggleResponseSchema = z.object({
  favorited: z.boolean(),
  message: z.string().optional(),
}).passthrough();

export const exerciseFavoritesListResponseSchema = z.object({
  favorites: z.array(exerciseSummarySchema),
}).passthrough();

/**
 * POST /api/v1/exercises/swap request parameters.
 * Strict trimmed name (1-200 chars), optional trimmed currentEquipment (0-1000 chars) defaulting to 'Bodyweight, Dumbbells, Bands'.
 */
export const exerciseSwapRequestSchema = z.object({
  exerciseName: z.string().trim().min(1).max(200),
  currentEquipment: z.string().trim().max(1000).optional().default('Bodyweight, Dumbbells, Bands'),
}).strict();

/**
 * Single candidate alternative returned by Gemini model.
 * Candidate validation accepts extra model metadata but requires valid name and reason.
 */
export const exerciseSwapCandidateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  reason: z.string().trim().min(1).max(1000),
}).passthrough();

export const exerciseSwapCandidateListSchema = z.array(exerciseSwapCandidateSchema).max(3);

/**
 * Strict DTO for an exercise swap alternative in response.
 * Both _id and slug must be present (for published matches) or both must be null (for unmatched/unlisted).
 */
export const exerciseSwapAlternativeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  reason: z.string().trim().min(1).max(1000),
  _id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format').nullable(),
  slug: z.string().trim().min(1).max(200).nullable(),
}).strict().refine(
  (data) => (data._id === null && data.slug === null) || (data._id !== null && data.slug !== null),
  { message: 'Both _id and slug must be present or both must be null' }
);

/**
 * POST /api/v1/exercises/swap response schema.
 */
export const exerciseSwapResponseSchema = z.object({
  success: z.literal(true),
  alternatives: z.array(exerciseSwapAlternativeSchema).max(3),
}).strict();

/**
 * Named contract definition for POST /api/v1/exercises/swap.
 */
export const exerciseSwapContract = {
  contractMetadata: {
    endpoint: '/api/v1/exercises/swap',
    method: 'POST',
    version: '1.0.0',
    description: 'AI-assisted exercise alternative suggestions with library matching',
  },
  requestSchema: exerciseSwapRequestSchema,
  responseSchema: exerciseSwapResponseSchema,
};
