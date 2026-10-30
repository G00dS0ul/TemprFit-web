import { z } from 'zod';

export const contractMetadata = {
  endpoint: '/api/v1/progress',
  version: '1.1.0',
  description: 'Progress analytics and weekly report contracts for Flutter mobile',
};

export const chartPointSchema = z.object({
  label: z.string(),
  value: z.number(),
}).passthrough();

export const exerciseOptionSchema = z.object({
  slug: z.string(),
  name: z.string(),
}).passthrough();

export const strengthTrendItemSchema = z.object({
  achievedAt: z.union([z.string(), z.date()]),
  estOneRepMax: z.number(),
  weight: z.number(),
  reps: z.number(),
}).passthrough();

export const strengthHistoryItemSchema = z.object({
  label: z.string(),
  value: z.number(),
  weight: z.number(),
  reps: z.number(),
}).passthrough();

export const progressQuerySchema = z.object({
  exercise: z.string().min(1, 'Exercise slug cannot be empty').optional(),
}).strict();

export const progressResponseSchema = z.object({
  hasHistory: z.boolean(),
  totalSessions: z.number().int().nonnegative(),
  totalVolumeAllTime: z.number().nonnegative(),
  totalPRs: z.number().int().nonnegative(),
  totalTimeMinutes: z.number().int().nonnegative(),
  totalCaloriesBurned: z.number().int().nonnegative(),
  currentStreak: z.number().int().nonnegative(),
  longestStreak: z.number().int().nonnegative(),
  volumeByWeek: z.array(chartPointSchema).length(12),
  sessionsByWeek: z.array(chartPointSchema).length(12),
  exerciseOptions: z.array(exerciseOptionSchema),
  activeExerciseSlug: z.string().nullable(),
  strengthHistory: z.array(strengthHistoryItemSchema),
  goals: z.record(z.any()),
  strengthTrend: z.array(strengthTrendItemSchema).optional(),
  currentBest1RM: z.number().nullable().optional(),
  selectedExerciseName: z.string().nullable().optional(),
}).passthrough();

export const weeklyReportStatsSnapshotSchema = z.object({
  sessionsCompleted: z.number().int().nonnegative(),
  totalVolume: z.number().nonnegative(),
  newPRs: z.number().int().nonnegative(),
  sessionsGoal: z.number().int().nonnegative(),
}).passthrough();

export const weeklyReportSchema = z.object({
  _id: z.any().optional(),
  id: z.string().optional(),
  user: z.any().optional(),
  weekStart: z.union([z.string(), z.date()]),
  summary: z.string(),
  recommendation: z.string(),
  statsSnapshot: weeklyReportStatsSnapshotSchema,
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
}).passthrough();

export const weeklyReportGetResponseSchema = z.object({
  report: weeklyReportSchema.nullable(),
  weekStart: z.union([z.string(), z.date()]),
}).strict();

export const weeklyReportPostRequestSchema = z.object({}).strict();

export const weeklyReportPostResponseSchema = z.object({
  report: weeklyReportSchema,
}).strict();

export const progressErrorSchema = z.object({
  error: z.string(),
  details: z.any().optional(),
}).passthrough();

export const progressGetContract = {
  contractMetadata: {
    endpoint: '/api/v1/progress',
    method: 'GET',
    version: '1.1.0',
    description: 'Return additive 12-week and all-time Progress analytics',
  },
  requestSchema: progressQuerySchema,
  responseSchema: progressResponseSchema,
};

export const weeklyReportGetContract = {
  contractMetadata: {
    endpoint: '/api/v1/progress/weekly-report',
    method: 'GET',
    version: '1.0.0',
    description: 'Return the cached report for the current ISO week',
  },
  responseSchema: weeklyReportGetResponseSchema,
};

export const weeklyReportPostContract = {
  contractMetadata: {
    endpoint: '/api/v1/progress/weekly-report',
    method: 'POST',
    version: '1.0.0',
    description: 'Generate or regenerate the current ISO-week report',
  },
  requestSchema: weeklyReportPostRequestSchema,
  responseSchema: weeklyReportPostResponseSchema,
};
