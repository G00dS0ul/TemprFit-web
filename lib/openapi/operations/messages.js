import { z } from 'zod';
import {
  listConversationsResponseSchema,
  initConversationRequestSchema,
  initConversationResponseSchema,
  initConversationXpFeeResponseSchema,
  conversationMessagesResponseSchema,
  sendMessageRequestSchema,
  sendMessageResponseSchema,
  patchMessageRequestSchema,
  patchMessageResponseSchema,
  deleteMessageResponseSchema,
} from '../../contracts/v1/messages.js';
import { standardErrorSchema } from '../common.js';

export function registerMessagesOperations(registry) {
  const userSecurity = [{ BearerAuth: [] }, { CookieAuth: [] }];

  const conversationIdParamSchema = z
    .object({
      id: z.string().min(1, 'Conversation ID required'),
    })
    .strict();

  // 1. GET /api/v1/messages
  registry.registerPath({
    method: 'get',
    path: '/api/v1/messages',
    summary: 'List user direct message conversations',
    description:
      'Retrieves all active conversations for the authenticated athlete with populated participants, last message preview, and unread counts, ordered by most recent update.',
    tags: ['Community'],
    security: userSecurity,
    responses: {
      200: {
        description: 'List of conversations',
        content: { 'application/json': { schema: listConversationsResponseSchema } },
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

  // 2. POST /api/v1/messages/init
  registry.registerPath({
    method: 'post',
    path: '/api/v1/messages/init',
    summary: 'Initialize direct conversation with XP fee check',
    description:
      'Finds or creates a direct 1-on-1 conversation with the target user. If the target athlete is on the Max plan and has set an XP message fee, returns HTTP 402 unless confirmXpPayment is true.',
    tags: ['Community'],
    security: userSecurity,
    request: {
      body: {
        content: { 'application/json': { schema: initConversationRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Conversation initialized or retrieved',
        content: { 'application/json': { schema: initConversationResponseSchema } },
      },
      400: {
        description: 'Bad request (self-chat or insufficient XP)',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      401: {
        description: 'Unauthorized (Sign in required)',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      402: {
        description: 'Payment required (Target athlete requires XP gift)',
        content: { 'application/json': { schema: initConversationXpFeeResponseSchema } },
      },
      404: {
        description: 'Target user not found',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
    },
  });

  // 3. GET /api/v1/messages/{id}
  registry.registerPath({
    method: 'get',
    path: '/api/v1/messages/{id}',
    summary: 'Get conversation messages and mark seen',
    description:
      'Loads chronological messages for the conversation and marks incoming messages from other participants as seen. Strictly verifies participant membership.',
    tags: ['Community'],
    security: userSecurity,
    request: {
      params: conversationIdParamSchema,
    },
    responses: {
      200: {
        description: 'Chronological message list',
        content: { 'application/json': { schema: conversationMessagesResponseSchema } },
      },
      401: {
        description: 'Unauthorized (Sign in required)',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      403: {
        description: 'Forbidden: Caller is not a participant of this conversation',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      404: {
        description: 'Conversation not found',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
    },
  });

  // 4. POST /api/v1/messages/{id}
  registry.registerPath({
    method: 'post',
    path: '/api/v1/messages/{id}',
    summary: 'Send message in conversation',
    description:
      'Creates a new text message in the conversation, updates the conversation lastMessage pointer, and dispatches in-app notifications to other participants.',
    tags: ['Community'],
    security: userSecurity,
    request: {
      params: conversationIdParamSchema,
      body: {
        content: { 'application/json': { schema: sendMessageRequestSchema } },
      },
    },
    responses: {
      201: {
        description: 'Message sent successfully',
        content: { 'application/json': { schema: sendMessageResponseSchema } },
      },
      400: {
        description: 'Invalid text payload',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      401: {
        description: 'Unauthorized (Sign in required)',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      403: {
        description: 'Forbidden: Caller is not a participant of this conversation',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      404: {
        description: 'Conversation not found',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
    },
  });

  // 5. PATCH /api/v1/messages/{id}
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/messages/{id}',
    summary: 'Edit message text or toggle like',
    description:
      'Updates message text (if caller is the author) or toggles a heart like reaction on the message.',
    tags: ['Community'],
    security: userSecurity,
    request: {
      params: conversationIdParamSchema,
      body: {
        content: { 'application/json': { schema: patchMessageRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Message updated',
        content: { 'application/json': { schema: patchMessageResponseSchema } },
      },
      400: {
        description: 'Invalid update payload',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      401: {
        description: 'Unauthorized (Sign in required)',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      403: {
        description: 'Forbidden: Caller cannot edit another user message',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      404: {
        description: 'Message or conversation not found',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
    },
  });

  // 6. DELETE /api/v1/messages/{id}
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/messages/{id}',
    summary: 'Delete own message',
    description:
      'Permanently deletes a message authored by the caller and re-points the conversation lastMessage if needed.',
    tags: ['Community'],
    security: userSecurity,
    request: {
      params: conversationIdParamSchema,
      query: z.object({
        messageId: z.string().min(1, 'messageId is required'),
      }),
    },
    responses: {
      200: {
        description: 'Message deleted successfully',
        content: { 'application/json': { schema: deleteMessageResponseSchema } },
      },
      400: {
        description: 'Missing messageId',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      401: {
        description: 'Unauthorized (Sign in required)',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      403: {
        description: 'Forbidden: Caller cannot delete another user message',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      404: {
        description: 'Message not found',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
    },
  });
}
