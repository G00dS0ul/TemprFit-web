import { z } from 'zod';
import {
  listNotificationsResponseSchema,
  markNotificationsReadResponseSchema,
  deleteNotificationResponseSchema,
  notificationItemSchema,
} from '../../contracts/v1/notifications.js';
import { standardErrorSchema } from '../common.js';

export function registerNotificationsOperations(registry) {
  const userSecurity = [{ BearerAuth: [] }, { CookieAuth: [] }];

  const notificationIdParamSchema = z
    .object({
      id: z.string().min(1, 'Notification ID required'),
    })
    .strict();

  // 1. GET /api/v1/notifications
  registry.registerPath({
    method: 'get',
    path: '/api/v1/notifications',
    summary: 'List user notifications and unread counters',
    description:
      'Fetches recent notification events for the athlete and provides accurate total unread notification and unread DM counters across the account.',
    tags: ['Community'],
    security: userSecurity,
    request: {
      query: z.object({
        limit: z.string().optional(),
      }),
    },
    responses: {
      200: {
        description: 'Notifications list and accurate unread counts',
        content: { 'application/json': { schema: listNotificationsResponseSchema } },
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

  // 2. PUT /api/v1/notifications
  registry.registerPath({
    method: 'put',
    path: '/api/v1/notifications',
    summary: 'Batch mark all notifications as read',
    description:
      'Marks all unread notifications for the authenticated user as read in a single batch operation.',
    tags: ['Community'],
    security: userSecurity,
    responses: {
      200: {
        description: 'All notifications marked as read',
        content: { 'application/json': { schema: markNotificationsReadResponseSchema } },
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

  // 3. PATCH /api/v1/notifications/{id}/read
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/notifications/{id}/read',
    summary: 'Mark single notification as read',
    description:
      'Marks a specific notification owned by the authenticated user as read.',
    tags: ['Community'],
    security: userSecurity,
    request: {
      params: notificationIdParamSchema,
    },
    responses: {
      200: {
        description: 'Notification marked read',
        content: {
          'application/json': {
            schema: z.object({ success: z.boolean(), notification: notificationItemSchema }),
          },
        },
      },
      401: {
        description: 'Unauthorized (Sign in required)',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      404: {
        description: 'Notification not found',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
    },
  });

  // 4. DELETE /api/v1/notifications/{id}
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/notifications/{id}',
    summary: 'Delete notification',
    description:
      'Permanently deletes a notification item owned by the authenticated user.',
    tags: ['Community'],
    security: userSecurity,
    request: {
      params: notificationIdParamSchema,
    },
    responses: {
      200: {
        description: 'Notification deleted',
        content: { 'application/json': { schema: deleteNotificationResponseSchema } },
      },
      401: {
        description: 'Unauthorized (Sign in required)',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      404: {
        description: 'Notification not found',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
    },
  });
}
