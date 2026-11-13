import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { TypingStore } from '../../../lib/typing-store.js';
import {
  typingRequestSchema,
  typingResponseSchema,
  typingPostResponseSchema,
  conversationMessagesQuerySchema,
} from '../../../lib/contracts/v1/messages.js';

describe('V1 Direct Messages Typing Indicators & Delta Contracts', () => {
  let store;

  beforeEach(() => {
    store = new TypingStore();
  });

  test('validates typingRequestSchema with boolean isTyping', () => {
    const valid = typingRequestSchema.parse({ isTyping: true });
    assert.strictEqual(valid.isTyping, true);

    const validFalse = typingRequestSchema.parse({ isTyping: false });
    assert.strictEqual(validFalse.isTyping, false);

    assert.throws(() => {
      typingRequestSchema.parse({ isTyping: 'yes' });
    });

    assert.throws(() => {
      typingRequestSchema.parse({ isTyping: true, extra: 123 });
    });
  });

  test('validates typingResponseSchema shape', () => {
    const res = typingResponseSchema.parse({
      isTyping: true,
      typingUsers: [
        {
          userId: '6724a1b2c3d4e5f6a7b8c9d1',
          username: 'deeee',
        },
      ],
    });
    assert.strictEqual(res.isTyping, true);
    assert.strictEqual(res.typingUsers.length, 1);
    assert.strictEqual(res.typingUsers[0].username, 'deeee');
  });

  test('validates typingPostResponseSchema shape', () => {
    const res = typingPostResponseSchema.parse({
      success: true,
      isTyping: true,
    });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.isTyping, true);
  });

  test('validates conversationMessagesQuerySchema with since timestamp', () => {
    const query = conversationMessagesQuerySchema.parse({
      since: '2026-11-13T14:30:00.000Z',
    });
    assert.strictEqual(query.since, '2026-11-13T14:30:00.000Z');

    const emptyQuery = conversationMessagesQuerySchema.parse({});
    assert.strictEqual(emptyQuery.since, undefined);
  });

  test('typingStore registers active typing participant and filters caller', () => {
    const convId = 'conv_123';
    const callerId = 'user_me';
    const partnerId = 'user_partner';

    // Partner starts typing
    store.setTyping(convId, partnerId, 'deeee', true, 4000);

    // Caller checks typing in conversation: should see partner
    const active = store.getTypingUsers(convId, callerId);
    assert.strictEqual(active.length, 1);
    assert.strictEqual(active[0].userId, partnerId);
    assert.strictEqual(active[0].username, 'deeee');

    // Partner checks typing: should NOT see themselves
    const partnerView = store.getTypingUsers(convId, partnerId);
    assert.strictEqual(partnerView.length, 0);

    // Partner stops typing
    store.setTyping(convId, partnerId, 'deeee', false);
    const stopped = store.getTypingUsers(convId, callerId);
    assert.strictEqual(stopped.length, 0);
  });

  test('typingStore automatically expires entries past TTL', async () => {
    const convId = 'conv_expiry';
    const partnerId = 'user_expiry';

    // Set typing with short 50ms TTL
    store.setTyping(convId, partnerId, 'athlete_quick', true, 50);

    const activeImmediate = store.getTypingUsers(convId);
    assert.strictEqual(activeImmediate.length, 1);

    // Wait 70ms for TTL expiry
    await new Promise((resolve) => setTimeout(resolve, 70));

    const activeAfter = store.getTypingUsers(convId);
    assert.strictEqual(activeAfter.length, 0);
  });
});
