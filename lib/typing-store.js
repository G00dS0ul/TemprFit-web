/**
 * Ephemeral in-memory typing state manager.
 *
 * Keeps track of active typing pulses per conversation with a sliding TTL window (default 4 seconds).
 * Does not write to MongoDB Atlas, avoiding write connection saturation and disk overhead on M0 clusters.
 */

class TypingStore {
  constructor() {
    // Map<conversationId, Map<userId, { username: string, expiresAt: number }>>
    this.conversations = new Map();
  }

  /**
   * Updates or clears the typing status of an athlete in a conversation.
   *
   * @param {string} conversationId
   * @param {string} userId
   * @param {string} username
   * @param {boolean} isTyping
   * @param {number} [ttlMs=4000]
   */
  setTyping(conversationId, userId, username, isTyping, ttlMs = 4000) {
    const convKey = String(conversationId);
    const userKey = String(userId);

    if (!this.conversations.has(convKey)) {
      this.conversations.set(convKey, new Map());
    }

    const userMap = this.conversations.get(convKey);

    if (isTyping) {
      userMap.set(userKey, {
        userId: userKey,
        username: String(username || 'athlete'),
        expiresAt: Date.now() + ttlMs,
      });
    } else {
      userMap.delete(userKey);
      if (userMap.size === 0) {
        this.conversations.delete(convKey);
      }
    }
  }

  /**
   * Retrieves active typing users in a conversation, filtering out expired users and the caller.
   *
   * @param {string} conversationId
   * @param {string|null} [excludeUserId=null]
   * @returns {Array<{ userId: string, username: string }>}
   */
  getTypingUsers(conversationId, excludeUserId = null) {
    const convKey = String(conversationId);
    if (!this.conversations.has(convKey)) {
      return [];
    }

    const userMap = this.conversations.get(convKey);
    const now = Date.now();
    const active = [];
    const excludeKey = excludeUserId ? String(excludeUserId) : null;

    for (const [uid, record] of userMap.entries()) {
      if (record.expiresAt <= now) {
        userMap.delete(uid);
      } else if (uid !== excludeKey) {
        active.push({
          userId: record.userId,
          username: record.username,
        });
      }
    }

    if (userMap.size === 0) {
      this.conversations.delete(convKey);
    }

    return active;
  }

  /**
   * Clears state for testing or conversation deletion.
   */
  reset() {
    this.conversations.clear();
  }
}

// Global singleton instance preserved across invocations
const globalTypingStoreKey = Symbol.for('temprfit.typingStore');
if (!global[globalTypingStoreKey]) {
  global[globalTypingStoreKey] = new TypingStore();
}

export const typingStore = global[globalTypingStoreKey];
export { TypingStore };
