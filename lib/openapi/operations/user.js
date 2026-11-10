import { z } from 'zod';
import {
  userProfileResponseSchema,
  userProfileUpdateRequestSchema,
  firstLoginResponseSchema,
  onboardingRequestSchema,
  onboardingResponseSchema,
  userCheckInResponseSchema,
  userTransferXpRequestSchema,
  userTransferXpResponseSchema,
  userChangePasswordRequestSchema,
  userChangePasswordResponseSchema,
} from '../../contracts/v1/user.js';
import { standardErrorSchema, successMessageSchema } from '../common.js';

export function registerUserOperations(registry) {
  const userSecurity = [{ BearerAuth: [] }, { CookieAuth: [] }];

  // 1. POST /api/v1/user/checkin
  registry.registerPath({
    method: 'post',
    path: '/api/v1/user/checkin',
    summary: 'Daily athlete streak check-in',
    description: 'Records daily platform attendance check-in, maintains consecutive day streaks, and awards daily check-in XP bonus.',
    tags: ['User'],
    security: userSecurity,
    responses: {
      200: {
        description: 'Check-in recorded; streak and XP awarded',
        content: { 'application/json': { schema: userCheckInResponseSchema } },
      },
      400: { description: 'Already checked in today', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 2. POST /api/v1/user/first-login
  registry.registerPath({
    method: 'post',
    path: '/api/v1/user/first-login',
    summary: 'Acknowledge initial login tour',
    description: 'Marks isFirstLogin flag as false on the user record so welcome walkthroughs or introductory modals are dismissed.',
    tags: ['User'],
    security: userSecurity,
    responses: {
      200: {
        description: 'First login acknowledged',
        content: { 'application/json': { schema: firstLoginResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 3. POST /api/v1/user/onboarding
  registry.registerPath({
    method: 'post',
    path: '/api/v1/user/onboarding',
    summary: 'Complete multi-step athlete onboarding',
    description: 'Saves initial fitness profile: primary goals, experience level, available equipment, workout frequency, and metric/imperial preference.',
    tags: ['User'],
    security: userSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: onboardingRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Onboarding completed and user profile updated',
        content: { 'application/json': { schema: onboardingResponseSchema } },
      },
      400: { description: 'Validation failed', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 4. POST /api/v1/user/password
  registry.registerPath({
    method: 'post',
    path: '/api/v1/user/password',
    summary: 'Change user account password',
    description: 'Verifies current password via bcrypt and sets new hashed password.',
    tags: ['User'],
    security: userSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: userChangePasswordRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Password changed successfully',
        content: { 'application/json': { schema: userChangePasswordResponseSchema } },
      },
      400: { description: 'Current password incorrect or new password validation failed', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 5. GET /api/v1/user/profile
  registry.registerPath({
    method: 'get',
    path: '/api/v1/user/profile',
    summary: 'Get full athlete profile',
    description: 'Retrieves complete profile for authenticated user: personal info, fitness metrics, achievements, level, and settings.',
    tags: ['User'],
    security: userSecurity,
    responses: {
      200: {
        description: 'Athlete profile object',
        content: { 'application/json': { schema: userProfileResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 6. PATCH /api/v1/user/profile
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/user/profile',
    summary: 'Update athlete profile settings',
    description: 'Modifies display name, bio, avatar, notification preferences, and body metrics.',
    tags: ['User'],
    security: userSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: userProfileUpdateRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Profile updated successfully',
        content: { 'application/json': { schema: userProfileResponseSchema } },
      },
      400: { description: 'Validation failed', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 7. DELETE /api/v1/user/profile
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/user/profile',
    summary: 'Permanently delete own athlete account',
    description: 'Deletes authenticated athlete user document, revokes active session tokens, and cleans up private logs.',
    tags: ['User'],
    security: userSecurity,
    responses: {
      200: {
        description: 'Account deleted',
        content: { 'application/json': { schema: successMessageSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 8. POST /api/v1/user/transfer-xp
  registry.registerPath({
    method: 'post',
    path: '/api/v1/user/transfer-xp',
    summary: 'Transfer XP points to another athlete',
    description: 'Atomically deducts XP from sender and credits recipient athlete account.',
    tags: ['User'],
    security: userSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: userTransferXpRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'XP transferred successfully',
        content: { 'application/json': { schema: userTransferXpResponseSchema } },
      },
      400: { description: 'Insufficient XP balance or invalid recipient', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });
}
