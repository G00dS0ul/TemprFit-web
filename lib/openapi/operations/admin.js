import { z } from 'zod';
import {
  adminStatsResponseSchema,
  adminUserListResponseSchema,
  adminBanUserRequestSchema,
  adminBanUserResponseSchema,
  adminGrantBadgeRequestSchema,
  adminGrantBadgeResponseSchema,
  adminGrantXpRequestSchema,
  adminGrantXpResponseSchema,
  adminBookingListResponseSchema,
  adminCouponListResponseSchema,
  adminCouponCreateRequestSchema,
  adminCouponUpdateRequestSchema,
  adminCouponSingleResponseSchema,
  adminModerationListResponseSchema,
  adminModerationDeleteRequestSchema,
  adminDisputeListResponseSchema,
  adminDisputeAdjudicateRequestSchema,
  adminDisputeAdjudicateResponseSchema,
  adminApproveTrainerRequestSchema,
  adminApproveTrainerResponseSchema,
} from '../../contracts/v1/admin.js';
import { standardErrorSchema, successMessageSchema } from '../common.js';

export function registerAdminOperations(registry) {
  const adminSecurity = [{ BearerAuth: [] }, { CookieAuth: [] }];

  // 1. GET /api/v1/admin/stats
  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/stats',
    summary: 'Platform administrator high-level statistics',
    description: 'Aggregates platform KPIs: user count, active sessions, monthly volume, revenue, pending trainers, and moderation queues.',
    tags: ['Admin'],
    security: adminSecurity,
    responses: {
      200: {
        description: 'Administrator platform stats',
        content: { 'application/json': { schema: adminStatsResponseSchema } },
      },
      401: { description: 'Missing admin authentication', content: { 'application/json': { schema: standardErrorSchema } } },
      403: { description: 'Forbidden: admin role required', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 2. GET /api/v1/admin/bookings
  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/bookings',
    summary: 'List all trainer booking records',
    description: 'Returns all trainee booking appointments and escrow status, populating trainee and trainer profiles.',
    tags: ['Admin'],
    security: adminSecurity,
    responses: {
      200: {
        description: 'Booking records list',
        content: { 'application/json': { schema: adminBookingListResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
      403: { description: 'Forbidden', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 3. GET /api/v1/admin/coupons
  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/coupons',
    summary: 'List discount coupons',
    description: 'Returns all platform promotional and subscription discount coupon records.',
    tags: ['Admin'],
    security: adminSecurity,
    responses: {
      200: {
        description: 'Coupons list',
        content: { 'application/json': { schema: adminCouponListResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
      403: { description: 'Forbidden', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 4. POST /api/v1/admin/coupons
  registry.registerPath({
    method: 'post',
    path: '/api/v1/admin/coupons',
    summary: 'Create discount coupon',
    description: 'Creates a new subscription promo code with percentage discount, usage limit, and optional expiration date.',
    tags: ['Admin'],
    security: adminSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: adminCouponCreateRequestSchema } },
      },
    },
    responses: {
      201: {
        description: 'Coupon created successfully',
        content: { 'application/json': { schema: adminCouponSingleResponseSchema } },
      },
      400: { description: 'Validation failed or duplicate code', content: { 'application/json': { schema: standardErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
      403: { description: 'Forbidden', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 5. PATCH /api/v1/admin/coupons
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/coupons',
    summary: 'Update or deactivate coupon',
    description: 'Modifies active status, max uses, or expiration date of an existing coupon.',
    tags: ['Admin'],
    security: adminSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: adminCouponUpdateRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Coupon updated',
        content: { 'application/json': { schema: adminCouponSingleResponseSchema } },
      },
      400: { description: 'Validation failed', content: { 'application/json': { schema: standardErrorSchema } } },
      404: { description: 'Coupon not found', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 6. GET /api/v1/admin/disputes
  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/disputes',
    summary: 'List escrow booking disputes',
    description: 'Retrieves all financial escrow disputes raised by trainees or trainers.',
    tags: ['Admin'],
    security: adminSecurity,
    request: {
      query: z.object({
        status: z.enum(['disputed', 'resolved']).optional().describe('Filter disputes by status'),
      }),
    },
    responses: {
      200: {
        description: 'Disputes list',
        content: { 'application/json': { schema: adminDisputeListResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
      403: { description: 'Forbidden', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 7. PATCH /api/v1/admin/disputes
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/disputes',
    summary: 'Adjudicate escrow dispute',
    description: 'Resolves an open booking dispute by refunding client, paying trainer, or splitting funds.',
    tags: ['Admin'],
    security: adminSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: adminDisputeAdjudicateRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Dispute resolved',
        content: { 'application/json': { schema: adminDisputeAdjudicateResponseSchema } },
      },
      400: { description: 'Invalid adjudication parameters', content: { 'application/json': { schema: standardErrorSchema } } },
      404: { description: 'Transaction not found', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 8. GET /api/v1/admin/moderation
  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/moderation',
    summary: 'List flagged social moments',
    description: 'Retrieves community posts and moments flagged by athletes for safety, abuse, or spam review.',
    tags: ['Admin'],
    security: adminSecurity,
    responses: {
      200: {
        description: 'Flagged moments list',
        content: { 'application/json': { schema: adminModerationListResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
      403: { description: 'Forbidden', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 9. DELETE /api/v1/admin/moderation
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/admin/moderation',
    summary: 'Remove violating flagged moment',
    description: 'Permanently deletes a flagged community moment and clears it from athlete feeds.',
    tags: ['Admin'],
    security: adminSecurity,
    request: {
      query: z.object({
        momentId: z.string().optional().describe('ID of moment to delete (can also be passed in body)'),
      }),
      body: {
        required: false,
        content: { 'application/json': { schema: adminModerationDeleteRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Moment deleted',
        content: { 'application/json': { schema: successMessageSchema } },
      },
      404: { description: 'Moment not found', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 10. POST /api/v1/admin/trainers/approve
  registry.registerPath({
    method: 'post',
    path: '/api/v1/admin/trainers/approve',
    summary: 'Approve or reject trainer application',
    description: 'Reviews a pending trainer application and grants or revokes certified trainer status.',
    tags: ['Admin'],
    security: adminSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: adminApproveTrainerRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Trainer application decision recorded',
        content: { 'application/json': { schema: adminApproveTrainerResponseSchema } },
      },
      400: { description: 'Validation failed', content: { 'application/json': { schema: standardErrorSchema } } },
      404: { description: 'User not found', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 11. GET /api/v1/admin/users
  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/users',
    summary: 'Search and paginate platform users',
    description: 'Returns paginated user records with search by email/username and filtering by role or plan.',
    tags: ['Admin'],
    security: adminSecurity,
    request: {
      query: z.object({
        q: z.string().optional().describe('Search substring for username or email'),
        role: z.enum(['trainee', 'trainer', 'admin']).optional().describe('Filter by role'),
        plan: z.enum(['free', 'pro', 'max']).optional().describe('Filter by subscription tier'),
        page: z.coerce.number().optional().describe('Page number (1-indexed, default 1)'),
        limit: z.coerce.number().optional().describe('Items per page (default 20, max 100)'),
      }),
    },
    responses: {
      200: {
        description: 'User list with total count',
        content: { 'application/json': { schema: adminUserListResponseSchema } },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: standardErrorSchema } } },
      403: { description: 'Forbidden', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 12. DELETE /api/v1/admin/users
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/admin/users',
    summary: 'Permanently delete user account',
    description: 'Permanently deletes user profile, auth credentials, and associated logs.',
    tags: ['Admin'],
    security: adminSecurity,
    request: {
      query: z.object({
        userId: z.string().describe('Target user MongoDB ObjectId to delete'),
      }),
    },
    responses: {
      200: {
        description: 'User account deleted',
        content: { 'application/json': { schema: successMessageSchema } },
      },
      404: { description: 'User not found', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 13. PATCH /api/v1/admin/users
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/users',
    summary: 'Update user role or subscription plan',
    description: 'Elevates or modifies user role (trainee, trainer, admin) and subscription plan tier.',
    tags: ['Admin'],
    security: adminSecurity,
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: z.object({
              userId: z.string().describe('Target user ID'),
              role: z.enum(['trainee', 'trainer', 'admin']).optional().describe('New user role'),
              plan: z.enum(['free', 'pro', 'max']).optional().describe('New subscription plan tier'),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User updated successfully',
        content: { 'application/json': { schema: successMessageSchema } },
      },
      400: { description: 'Validation error', content: { 'application/json': { schema: standardErrorSchema } } },
      404: { description: 'User not found', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 14. POST /api/v1/admin/users/ban
  registry.registerPath({
    method: 'post',
    path: '/api/v1/admin/users/ban',
    summary: 'Ban or unban user account',
    description: 'Toggles ban status of user. Banned users cannot authenticate or access endpoints.',
    tags: ['Admin'],
    security: adminSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: adminBanUserRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Ban status updated',
        content: { 'application/json': { schema: adminBanUserResponseSchema } },
      },
      404: { description: 'User not found', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 15. POST /api/v1/admin/users/grant-badge
  registry.registerPath({
    method: 'post',
    path: '/api/v1/admin/users/grant-badge',
    summary: 'Award badge to athlete',
    description: 'Manually assigns a gamification achievement badge to an athlete account.',
    tags: ['Admin'],
    security: adminSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: adminGrantBadgeRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Badge awarded successfully',
        content: { 'application/json': { schema: adminGrantBadgeResponseSchema } },
      },
      404: { description: 'User not found', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });

  // 16. POST /api/v1/admin/users/grant-xp
  registry.registerPath({
    method: 'post',
    path: '/api/v1/admin/users/grant-xp',
    summary: 'Credit or debit athlete XP points',
    description: 'Manually adjusts athlete XP balance and updates overall level progression.',
    tags: ['Admin'],
    security: adminSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: adminGrantXpRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'XP balance updated',
        content: { 'application/json': { schema: adminGrantXpResponseSchema } },
      },
      404: { description: 'User not found', content: { 'application/json': { schema: standardErrorSchema } } },
    },
  });
}
