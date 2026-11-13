import { z } from 'zod';
import {
  usernameParamSchema,
  publicUserProfileResponseSchema,
  privateProfileResponseSchema,
  followToggleResponseSchema,
  likeToggleResponseSchema,
  searchUsersQuerySchema,
  searchUsersResponseSchema,
} from '../../contracts/v1/community.js';
import { standardErrorSchema } from '../common.js';

export function registerCommunityOperations(registry) {
  const userSecurity = [{ BearerAuth: [] }, { CookieAuth: [] }];

  // 1. GET /api/v1/users/{username}
  registry.registerPath({
    method: 'get',
    path: '/api/v1/users/{username}',
    summary: 'Get public athlete profile',
    description:
      'Retrieves sanitized public athlete profile, aggregate workout volume stats, visible pods, community rooms, and follow/like status for the requesting user.',
    tags: ['Community'],
    security: userSecurity,
    request: {
      params: usernameParamSchema,
    },
    responses: {
      200: {
        description: 'Public athlete profile details',
        content: { 'application/json': { schema: publicUserProfileResponseSchema } },
      },
      400: {
        description: 'Invalid username format',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      403: {
        description: 'Profile is private',
        content: { 'application/json': { schema: privateProfileResponseSchema } },
      },
      404: {
        description: 'User not found',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
    },
  });

  // 2. POST /api/v1/users/{username}/follow
  registry.registerPath({
    method: 'post',
    path: '/api/v1/users/{username}/follow',
    summary: 'Toggle follow status for athlete',
    description:
      'Atomically toggles follower relationship with target athlete. Dispatches a social notification when a new follow is initiated.',
    tags: ['Community'],
    security: userSecurity,
    request: {
      params: usernameParamSchema,
    },
    responses: {
      200: {
        description: 'Follow status updated',
        content: { 'application/json': { schema: followToggleResponseSchema } },
      },
      400: {
        description: 'Invalid username or attempt to follow oneself',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      401: {
        description: 'Unauthorized (Sign in required)',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      404: {
        description: 'User not found',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
    },
  });

  // 3. POST /api/v1/users/{username}/like
  registry.registerPath({
    method: 'post',
    path: '/api/v1/users/{username}/like',
    summary: 'Toggle profile like for athlete',
    description:
      'Atomically toggles profile like for target athlete. Dispatches a social notification when a profile like is initiated.',
    tags: ['Community'],
    security: userSecurity,
    request: {
      params: usernameParamSchema,
    },
    responses: {
      200: {
        description: 'Like status updated',
        content: { 'application/json': { schema: likeToggleResponseSchema } },
      },
      400: {
        description: 'Invalid username format',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      401: {
        description: 'Unauthorized (Sign in required)',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      404: {
        description: 'User not found',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
    },
  });

  // 4. GET /api/v1/users/search
  registry.registerPath({
    method: 'get',
    path: '/api/v1/users/search',
    summary: 'Search athletes by query',
    description:
      'Searches athletes by username, name, or nickname using case-insensitive partial matching, excluding caller and hidden profiles.',
    tags: ['Community'],
    security: userSecurity,
    request: {
      query: searchUsersQuerySchema,
    },
    responses: {
      200: {
        description: 'List of matching athletes',
        content: { 'application/json': { schema: searchUsersResponseSchema } },
      },
      400: {
        description: 'Invalid query parameters',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      401: {
        description: 'Unauthorized (Sign in required)',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
    },
  });
}
