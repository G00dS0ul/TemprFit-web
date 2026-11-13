import { z } from 'zod';

export const contractMetadata = {
  endpoint: '/api/v1/messages',
  version: '1.0.0',
  description: 'Direct messaging, conversation initialization with XP fee check, and chat thread contracts',
};

export const participantUserSummarySchema = z
  .object({
    _id: z.any(),
    username: z.string(),
    name: z.string().nullable().optional(),
    avatarUrl: z.string().nullable().optional(),
    role: z.string().optional(),
    plan: z.string().optional().default('free'),
    activeColor: z.string().nullable().optional(),
    activeBorder: z.string().nullable().optional(),
  })
  .passthrough();

export const replyToSchema = z
  .object({
    messageId: z.string(),
    senderName: z.string().optional(),
    textSnippet: z.string().optional(),
  })
  .passthrough();

export const messageItemSchema = z
  .object({
    _id: z.any(),
    conversationId: z.any(),
    sender: z.union([z.string(), participantUserSummarySchema, z.any()]),
    text: z.string(),
    readBy: z.array(z.any()).default([]),
    status: z.enum(['sent', 'delivered', 'seen']).default('sent'),
    isEdited: z.boolean().default(false),
    editedAt: z.union([z.string(), z.date()]).nullable().optional(),
    isForwarded: z.boolean().default(false),
    likes: z.array(z.any()).default([]),
    replyTo: replyToSchema.nullable().optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
  })
  .passthrough();

export const conversationItemSchema = z
  .object({
    _id: z.any(),
    participants: z.array(z.union([participantUserSummarySchema, z.any()])),
    lastMessage: messageItemSchema.nullable().optional(),
    unreadCount: z.number().default(0).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
  })
  .passthrough();

export const listConversationsResponseSchema = z
  .object({
    conversations: z.array(conversationItemSchema),
  })
  .passthrough();

export const initConversationRequestSchema = z
  .object({
    targetUserId: z.string().min(1, 'Target user ID is required'),
    confirmXpPayment: z.boolean().optional().default(false),
  })
  .strict();

export const initConversationResponseSchema = z
  .object({
    success: z.boolean(),
    conversationId: z.string(),
    conversation: z.any().optional(),
  })
  .passthrough();

export const initConversationXpFeeResponseSchema = z
  .object({
    requiresXpFee: z.literal(true),
    fee: z.number(),
    recipientUsername: z.string(),
    senderXp: z.number(),
    canAfford: z.boolean(),
    message: z.string(),
  })
  .passthrough();

export const conversationMessagesResponseSchema = z
  .object({
    messages: z.array(messageItemSchema),
  })
  .passthrough();

export const sendMessageRequestSchema = z
  .object({
    text: z.string().trim().min(1, 'Message text cannot be empty').max(2000, 'Message text exceeds 2000 characters'),
    replyTo: replyToSchema.optional(),
  })
  .strict();

export const sendMessageResponseSchema = z
  .object({
    success: z.boolean(),
    message: messageItemSchema,
  })
  .passthrough();

export const patchMessageRequestSchema = z
  .object({
    action: z.enum(['like']).optional(),
    messageId: z.string().optional(),
    text: z.string().trim().min(1).max(2000).optional(),
  })
  .strict();

export const patchMessageResponseSchema = z
  .object({
    success: z.boolean(),
    message: messageItemSchema,
  })
  .passthrough();

export const deleteMessageResponseSchema = z
  .object({
    success: z.boolean(),
    deletedMessageId: z.string(),
  })
  .passthrough();
