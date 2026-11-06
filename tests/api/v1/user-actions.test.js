import './../../setup.js';
import {
  afterEach,
  beforeEach,
  describe,
  it,
  mock,
} from 'node:test';
import assert from 'node:assert/strict';
import { POST as handleCheckIn } from '@/app/api/v1/user/checkin/route.js';
import { POST as handleTransferXp } from '@/app/api/v1/user/transfer-xp/route.js';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import {
  userCheckInResponseSchema,
  userTransferXpRequestSchema,
  userTransferXpResponseSchema,
} from '@/lib/contracts/v1/user';
import {
  clearMockCookies,
  clearMockHeaders,
  setMockHeaders,
} from './../../mocks/next-headers.js';

function createTestUser(overrides = {}) {
  const savedDoc = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test Athlete',
    username: 'testathlete',
    email: 'athlete@temprfit.test',
    role: 'user',
    xp: 500,
    checkInStreak: 1,
    totalCheckInStreak: 1,
    longestCheckInStreak: 1,
    lastCheckInDate: null,
    inventory: { streak_freeze: 0 },
    markModified: mock.fn(),
    save: mock.fn(async () => savedDoc),
    ...overrides,
  };
  return savedDoc;
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

async function callTransferXp(body, headers = {}) {
  const reqHeaders = new Headers(headers);
  if (!reqHeaders.has('content-type')) {
    reqHeaders.set('content-type', 'application/json');
  }
  const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  const request = new Request('http://localhost/api/v1/user/transfer-xp', {
    method: 'POST',
    headers: reqHeaders,
    body: bodyString,
  });
  return handleTransferXp(request);
}

describe('User Actions API v1 (/api/v1/user/checkin & /api/v1/user/transfer-xp)', () => {
  let user;

  beforeEach(() => {
    clearMockHeaders();
    clearMockCookies();
    user = createTestUser();
  });

  afterEach(() => {
    mock.reset();
  });

  describe('POST /api/v1/user/checkin', () => {
    it('returns 401 when unauthenticated', async () => {
      const response = await handleCheckIn();
      assert.equal(response.status, 401);
      const json = await response.json();
      assert.equal(json.error, 'Sign in required.');
    });

    it('successfully processes first check-in and awards base XP', async () => {
      authenticate(user);
      user.lastCheckInDate = null;
      user.checkInStreak = 0;
      user.totalCheckInStreak = 0;

      const response = await handleCheckIn();
      assert.equal(response.status, 200);
      const json = await response.json();

      assert.equal(json.success, true);
      assert.equal(json.xpAward, 50);
      assert.equal(json.xp, 550);
      assert.equal(json.checkInStreak, 1);
      assert.equal(json.totalCheckInStreak, 1);
      assert.ok(userCheckInResponseSchema.safeParse(json).success);
      assert.equal(user.save.mock.callCount(), 1);
    });

    it('rejects duplicate check-in on the same day with 400', async () => {
      authenticate(user);
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      user.lastCheckInDate = todayStr;

      const response = await handleCheckIn();
      assert.equal(response.status, 400);
      const json = await response.json();
      assert.equal(json.error, 'Already checked in today');
      assert.equal(json.xp, 500);
      assert.equal(user.save.mock.callCount(), 0);
    });

    it('advances streak on consecutive day and awards Day 4 double XP', async () => {
      authenticate(user);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      user.lastCheckInDate = yesterdayStr;
      user.checkInStreak = 3;
      user.totalCheckInStreak = 3;

      const response = await handleCheckIn();
      assert.equal(response.status, 200);
      const json = await response.json();

      assert.equal(json.success, true);
      assert.equal(json.checkInStreak, 4);
      assert.equal(json.totalCheckInStreak, 4);
      assert.equal(json.xpAward, 100); // 50 * 2
      assert.equal(json.xp, 600);
      assert.ok(userCheckInResponseSchema.safeParse(json).success);
    });

    it('consumes streak freeze when previous day was missed', async () => {
      authenticate(user);
      user.lastCheckInDate = '2026-01-01'; // Missed day
      user.checkInStreak = 5;
      user.totalCheckInStreak = 12;
      user.inventory = { streak_freeze: 1 };

      const response = await handleCheckIn();
      assert.equal(response.status, 200);
      const json = await response.json();

      assert.equal(json.success, true);
      assert.equal(user.inventory.streak_freeze, 0);
      assert.equal(json.checkInStreak, 6);
      assert.equal(json.totalCheckInStreak, 13);
      assert.equal(user.markModified.mock.callCount(), 1);
    });

    it('resets streak to 1 when day was missed and no freeze exists', async () => {
      authenticate(user);
      user.lastCheckInDate = '2026-01-01'; // Missed day
      user.checkInStreak = 6;
      user.totalCheckInStreak = 20;
      user.inventory = { streak_freeze: 0 };

      const response = await handleCheckIn();
      assert.equal(response.status, 200);
      const json = await response.json();

      assert.equal(json.success, true);
      assert.equal(json.checkInStreak, 1);
      assert.equal(json.totalCheckInStreak, 1);
      assert.equal(json.xpAward, 50);
    });
  });

  describe('POST /api/v1/user/transfer-xp', () => {
    it('returns 401 when unauthenticated', async () => {
      const response = await callTransferXp({ targetUsername: 'recipient', amount: 50 });
      assert.equal(response.status, 401);
      const json = await response.json();
      assert.equal(json.error, 'Sign in required.');
    });

    it('returns 400 when body has invalid types or missing fields', async () => {
      authenticate(user);
      const response = await callTransferXp({ targetUsername: 'ab', amount: -10 });
      assert.equal(response.status, 400);
      const json = await response.json();
      assert.equal(json.error, 'Invalid transfer details.');
      assert.ok(json.details);
    });

    it('returns 400 when sender has insufficient XP', async () => {
      authenticate(user);
      user.xp = 30;

      const response = await callTransferXp({ targetUsername: 'recipient', amount: 100 });
      assert.equal(response.status, 400);
      const json = await response.json();
      assert.equal(json.error, 'Insufficient XP balance for transfer.');
    });

    it('returns 404 when recipient username does not exist', async () => {
      authenticate(user);
      user.xp = 500;
      mock.method(User, 'findOne', async () => null);

      const response = await callTransferXp({ targetUsername: 'nonexistent', amount: 50 });
      assert.equal(response.status, 404);
      const json = await response.json();
      assert.equal(json.error, 'Recipient username not found.');
    });

    it('returns 400 when attempting self-transfer', async () => {
      authenticate(user);
      user.xp = 500;
      const selfReceiver = {
        _id: user._id,
        username: user.username,
      };
      mock.method(User, 'findOne', async () => selfReceiver);

      const response = await callTransferXp({ targetUsername: user.username, amount: 50 });
      assert.equal(response.status, 400);
      const json = await response.json();
      assert.equal(json.error, 'You cannot send XP to yourself.');
    });

    it('successfully transfers XP between sender and recipient', async () => {
      authenticate(user);
      user.xp = 500;

      const recipient = {
        _id: '607f1f77bcf86cd799439099',
        username: 'recipient',
        xp: 200,
        save: mock.fn(async () => recipient),
      };
      mock.method(User, 'findOne', async () => recipient);

      const response = await callTransferXp({ targetUsername: 'recipient', amount: 150 });
      assert.equal(response.status, 200);
      const json = await response.json();

      assert.equal(json.success, true);
      assert.equal(json.newXp, 350);
      assert.equal(user.xp, 350);
      assert.equal(recipient.xp, 350);
      assert.ok(userTransferXpResponseSchema.safeParse(json).success);
      assert.equal(user.save.mock.callCount(), 1);
      assert.equal(recipient.save.mock.callCount(), 1);
    });
  });
});
