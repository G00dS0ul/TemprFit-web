import { z } from 'zod';

export const contractMetadata = {
  endpoint: '/api/v1/users',
  version: '1.0.0',
  description: 'Public athlete profiles, follow and like social toggles, and community social graph contracts for /api/v1/users/**',
};

export const usernameParamSchema = z
  .object({
    username: z
      .string()
      .trim()
      .regex(
        /^[a-z0-9_.]{3,24}$/i,
        'Username must be 3-24 characters (alphanumeric, underscore, period)'
      ),
  })
  .strict();

export const safePublicUserSchema = z
  .object({
    _id: z.any().optional(),
    username: z.string(),
    name: z.string().nullable().optional(),
    avatarUrl: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    hobbies: z.array(z.string()).optional().default([]),
    talents: z.array(z.string()).optional().default([]),
    profession: z.string().nullable().optional(),
    age: z.number().nullable().optional(),
    sex: z.string().nullable().optional(),
    plan: z.string().default('free'),
    activeColor: z.string().nullable().optional(),
    activeBorder: z.string().nullable().optional(),
    xp: z.number().default(0),
    checkInStreak: z.number().default(0),
    totalCheckInStreak: z.number().default(0),
    longestCheckInStreak: z.number().default(0),
    currentStreak: z.number().default(0),
    longestStreak: z.number().default(0),
    badges: z.array(z.any()).optional().default([]),
    createdAt: z.union([z.string(), z.date()]).optional(),
    goal: z.string().optional(),
    experience: z.string().optional(),
  })
  .passthrough();

export const publicProfileStatsSchema = z
  .object({
    totalVolume: z.number().default(0),
    sessions: z.number().default(0),
  })
  .passthrough();

export const publicProfilePodSchema = z
  .object({
    _id: z.any().optional(),
    name: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
    isPrivate: z.boolean().default(false),
  })
  .passthrough();

export const publicProfileRoomSchema = z
  .object({
    _id: z.any().optional(),
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    isPrivate: z.boolean().default(false),
    memberCount: z.number().default(0),
    isPreset: z.boolean().default(false),
    isCreator: z.boolean().default(false),
  })
  .passthrough();

export const publicUserProfileResponseSchema = z
  .object({
    user: safePublicUserSchema,
    stats: publicProfileStatsSchema,
    pods: z.array(publicProfilePodSchema).default([]),
    rooms: z.array(publicProfileRoomSchema).default([]),
    isOwner: z.boolean().default(false),
    isFollowing: z.boolean().default(false),
    hasLiked: z.boolean().default(false),
    followersCount: z.number().default(0),
    followingCount: z.number().default(0),
    likesCount: z.number().default(0),
    messageXpFee: z.number().default(0),
  })
  .passthrough();

export const privateProfileResponseSchema = z
  .object({
    error: z.string(),
    isPrivate: z.literal(true),
    user: z.object({
      username: z.string(),
      avatarUrl: z.string().nullable().optional(),
      plan: z.string().default('free'),
    }),
  })
  .passthrough();

export const followToggleResponseSchema = z
  .object({
    success: z.boolean(),
    isFollowing: z.boolean(),
    followersCount: z.number(),
  })
  .passthrough();

export const likeToggleResponseSchema = z
  .object({
    success: z.boolean(),
    hasLiked: z.boolean(),
    likesCount: z.number(),
  })
  .passthrough();
