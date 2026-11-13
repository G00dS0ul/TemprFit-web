import './../../setup.js';
import {
  afterEach,
  beforeEach,
  describe,
  it,
  mock,
} from 'node:test';
import assert from 'node:assert/strict';
import { GET as handleGetUser } from '@/app/api/v1/users/[username]/route.js';
import { POST as handleFollowUser } from '@/app/api/v1/users/[username]/follow/route.js';
import { POST as handleLikeUser } from '@/app/api/v1/users/[username]/like/route.js';
import User from '@/models/User';
import WorkoutSession from '@/models/WorkoutSession';
import Pod from '@/models/Pod';
import ChatRoom from '@/models/ChatRoom';
import { signToken } from '@/lib/auth';
import {
  clearMockCookies,
  clearMockHeaders,
  setMockHeaders,
} from './../../mocks/next-headers.js';

function createMockUser(overrides = {}) {
  const doc = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Sarah Connor',
    username: 'sarah_fit',
    avatarUrl: 'https://example.com/avatar.jpg',
    bio: 'Lifting heavy',
    hobbies: ['Powerlifting'],
    talents: ['Handstand'],
    profession: 'Coach',
    age: 29,
    sex: 'female',
    plan: 'pro',
    activeColor: '#38bdf8',
    activeBorder: 'neon',
    xp: 5000,
    checkInStreak: 10,
    totalCheckInStreak: 20,
    longestCheckInStreak: 25,
    currentStreak: 5,
    longestStreak: 15,
    badges: [],
    followers: ['507f1f77bcf86cd799439022'],
    following: [],
    profileLikes: [],
    privacySettings: { isProfileHidden: false, messageXpFee: 0 },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    markModified: mock.fn(),
    save: mock.fn(async () => doc),
    ...overrides,
  };
  return doc;
}

function authenticate(user) {
  setMockHeaders({
    authorization: `Bearer ${signToken({ userId: user._id })}`,
  });
  mock.method(User, 'findById', async (id) => {
    if (id?.toString() === user._id.toString()) return user;
    return null;
  });
}

describe('Community API v1 (/api/v1/users/**)', () => {
  beforeEach(() => {
    clearMockHeaders();
    clearMockCookies();
  });

  afterEach(() => {
    mock.restoreAll();
    clearMockHeaders();
    clearMockCookies();
  });

  describe('GET /api/v1/users/[username]', () => {
    it('returns 400 on invalid username format', async () => {
      const res = await handleGetUser(new Request('http://localhost/api/v1/users/a!'), {
        params: { username: 'a!' },
      });
      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert.strictEqual(json.error, 'Invalid username parameter format.');
    });

    it('returns 404 when target user is not found', async () => {
      mock.method(User, 'findOne', () => ({
        select: mock.fn(async () => null),
      }));

      const res = await handleGetUser(new Request('http://localhost/api/v1/users/nonexistent'), {
        params: { username: 'nonexistent' },
      });
      assert.strictEqual(res.status, 404);
      const json = await res.json();
      assert.strictEqual(json.error, 'User not found');
    });

    it('returns 403 with private profile payload when profile is hidden for non-owner', async () => {
      const target = createMockUser({
        privacySettings: { isProfileHidden: true },
      });
      mock.method(User, 'findOne', () => ({
        select: mock.fn(async () => target),
      }));

      const res = await handleGetUser(new Request('http://localhost/api/v1/users/sarah_fit'), {
        params: { username: 'sarah_fit' },
      });
      assert.strictEqual(res.status, 403);
      const json = await res.json();
      assert.strictEqual(json.error, 'Profile is private');
      assert.strictEqual(json.isPrivate, true);
      assert.strictEqual(json.user.username, 'sarah_fit');
      assert.strictEqual(json.stats, undefined);
    });

    it('returns 200 with sanitized public profile when visible', async () => {
      const target = createMockUser();
      mock.method(User, 'findOne', () => ({
        select: mock.fn(async () => target),
      }));
      mock.method(WorkoutSession, 'aggregate', async () => [
        { totalVolume: 150000, sessions: 85 },
      ]);
      mock.method(Pod, 'find', () => ({
        select: () => ({
          limit: () => ({
            lean: async () => [
              { _id: 'pod_1', name: 'Morning Squad', isPrivate: false },
            ],
          }),
        }),
      }));
      mock.method(ChatRoom, 'find', () => ({
        select: () => ({
          limit: () => ({
            lean: async () => [
              { _id: 'room_1', title: 'General Fitness', isPrivate: false, creator: target._id },
            ],
          }),
        }),
      }));

      const res = await handleGetUser(new Request('http://localhost/api/v1/users/sarah_fit'), {
        params: { username: 'sarah_fit' },
      });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.user.username, 'sarah_fit');
      assert.strictEqual(json.user.followers, undefined);
      assert.strictEqual(json.user.following, undefined);
      assert.strictEqual(json.followersCount, 1);
      assert.strictEqual(json.stats.totalVolume, 150000);
      assert.strictEqual(json.stats.sessions, 85);
      assert.strictEqual(json.pods.length, 1);
      assert.strictEqual(json.rooms.length, 1);
    });
  });

  describe('POST /api/v1/users/[username]/follow', () => {
    it('returns 401 when caller is unauthenticated', async () => {
      const res = await handleFollowUser(new Request('http://localhost/api/v1/users/sarah_fit/follow', { method: 'POST' }), {
        params: { username: 'sarah_fit' },
      });
      assert.strictEqual(res.status, 401);
      const json = await res.json();
      assert.strictEqual(json.error, 'Sign in required');
    });

    it('returns 400 when attempting to follow oneself', async () => {
      const user = createMockUser();
      authenticate(user);
      mock.method(User, 'findOne', async () => user);

      const res = await handleFollowUser(new Request('http://localhost/api/v1/users/sarah_fit/follow', { method: 'POST' }), {
        params: { username: 'sarah_fit' },
      });
      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert.strictEqual(json.error, 'You cannot follow yourself');
    });

    it('toggles follow relationship on and off', async () => {
      const caller = createMockUser({ _id: '507f1f77bcf86cd799439099', username: 'caller' });
      const target = createMockUser({ followers: [] });
      authenticate(caller);

      mock.method(User, 'findOne', async () => target);
      mock.method(User, 'findByIdAndUpdate', async () => {});
      mock.method(User, 'findById', (id) => {
        if (id?.toString() === caller._id.toString()) return caller;
        return {
          select: mock.fn(async () => ({ followers: [caller._id] })),
        };
      });

      const res = await handleFollowUser(new Request('http://localhost/api/v1/users/sarah_fit/follow', { method: 'POST' }), {
        params: { username: 'sarah_fit' },
      });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.isFollowing, true);
      assert.strictEqual(json.followersCount, 1);
    });
  });

  describe('POST /api/v1/users/[username]/like', () => {
    it('returns 401 when caller is unauthenticated', async () => {
      const res = await handleLikeUser(new Request('http://localhost/api/v1/users/sarah_fit/like', { method: 'POST' }), {
        params: { username: 'sarah_fit' },
      });
      assert.strictEqual(res.status, 401);
    });

    it('toggles profile like on and off', async () => {
      const caller = createMockUser({ _id: '507f1f77bcf86cd799439099', username: 'caller' });
      const target = createMockUser({ profileLikes: [] });
      authenticate(caller);

      mock.method(User, 'findOne', async () => target);
      mock.method(User, 'findByIdAndUpdate', async () => {});
      mock.method(User, 'findById', (id) => {
        if (id?.toString() === caller._id.toString()) return caller;
        return {
          select: mock.fn(async () => ({ profileLikes: [caller._id] })),
        };
      });

      const res = await handleLikeUser(new Request('http://localhost/api/v1/users/sarah_fit/like', { method: 'POST' }), {
        params: { username: 'sarah_fit' },
      });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.hasLiked, true);
      assert.strictEqual(json.likesCount, 1);
    });
  });
});
