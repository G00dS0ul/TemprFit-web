import { z } from 'zod';

export const contractMetadata = {
  endpoint: '/api/v1/notifications',
  version: '1.0.0',
  description: 'In-app user notifications feed, unread counters, and mark-read contracts',
};

export const notificationItemSchema = z
  .object({
    _id: z.any(),
    user: z.any(),
    title: z.string(),
    message: z.string(),
    read: z.boolean().default(false),
    link: z.string().default(''),
    type: z.string().default('general'),
    createdAt: z.union([z.string(), z.date()]).optional(),
  })
  .passthrough();

export const listNotificationsResponseSchema = z
  .object({
    notifications: z.array(notificationItemSchema),
    unreadCount: z.number().default(0),
    unreadMessagesCount: z.number().default(0),
  })
  .passthrough();

export const markNotificationsReadResponseSchema = z
  .object({
    success: z.boolean(),
  })
  .passthrough();

export const deleteNotificationResponseSchema = z
  .object({
    success: z.boolean(),
    deletedId: z.string(),
  })
  .passthrough();
