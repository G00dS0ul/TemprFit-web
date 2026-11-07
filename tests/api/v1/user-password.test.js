import './../../setup.js';
import {
  afterEach,
  beforeEach,
  describe,
  it,
  mock,
} from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { POST as handlePasswordChange } from '@/app/api/v1/user/password/route.js';
import { PATCH as handleProfileUpdate } from '@/app/api/v1/user/profile/route.js';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import {
  userChangePasswordResponseSchema,
  userProfileResponseSchema,
} from '@/lib/contracts/v1/user';
import {
  clearMockCookies,
  clearMockHeaders,
  setMockHeaders,
} from './../../mocks/next-headers.js';

function createTestUser(overrides = {}) {
  const savedDoc = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Password Tester',
    username: 'passwordtester',
    email: 'tester@temprfit.test',
    role: 'user',
    password: '$2a$10$hashedExistingPasswordValue1234567890',
    bio: '',
    toSafeObject: () => ({
      _id: '507f1f77bcf86cd799439011',
      name: 'Password Tester',
      username: 'passwordtester',
      email: 'tester@temprfit.test',
      role: 'user',
      bio: savedDoc.bio,
    }),
    set: mock.fn((key, val) => {
      savedDoc[key] = val;
    }),
    save: mock.fn(async () => savedDoc),
    ...overrides,
  };
  return savedDoc;
}

function authenticate(user) {
  setMockHeaders({
    authorization: `Bearer ${signToken({ userId: user._id })}`,
  });
  mock.method(User, 'findById', (id) => {
    return {
      select: (fields) => {
        if (id?.toString() === user._id.toString()) return Promise.resolve(user);
        return Promise.resolve(null);
      },
      then: (resolve) => resolve(user),
    };
  });
}

async function callPasswordChange(body, headers = {}) {
  const reqHeaders = new Headers(headers);
  if (!reqHeaders.has('content-type')) {
    reqHeaders.set('content-type', 'application/json');
  }
  const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  const request = new Request('http://localhost/api/v1/user/password', {
    method: 'POST',
    headers: reqHeaders,
    body: bodyString,
  });
  return handlePasswordChange(request);
}

async function callProfilePatch(body, headers = {}) {
  const reqHeaders = new Headers(headers);
  if (!reqHeaders.has('content-type')) {
    reqHeaders.set('content-type', 'application/json');
  }
  const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  const request = new Request('http://localhost/api/v1/user/profile', {
    method: 'PATCH',
    headers: reqHeaders,
    body: bodyString,
  });
  return handleProfileUpdate(request);
}

describe('User Password API v1 (/api/v1/user/password & profile bio)', () => {
  let user;

  beforeEach(() => {
    clearMockHeaders();
    clearMockCookies();
    user = createTestUser();
  });

  afterEach(() => {
    mock.reset();
  });

  describe('POST /api/v1/user/password', () => {
    it('returns 401 when unauthenticated', async () => {
      const response = await callPasswordChange({
        currentPassword: 'oldPassword123',
        newPassword: 'newStrongPassword456',
      });
      assert.equal(response.status, 401);
      const json = await response.json();
      assert.equal(json.error, 'Sign in required.');
    });

    it('returns 400 when missing current password or new password is too short', async () => {
      authenticate(user);
      const response = await callPasswordChange({
        currentPassword: '',
        newPassword: 'short',
      });
      assert.equal(response.status, 400);
      const json = await response.json();
      assert.equal(json.error, 'Invalid password details.');
      assert.ok(json.details);
    });

    it('returns 400 when user has no password set (social login)', async () => {
      user.password = null;
      authenticate(user);

      const response = await callPasswordChange({
        currentPassword: 'somePassword123',
        newPassword: 'newPassword12345',
      });
      assert.equal(response.status, 400);
      const json = await response.json();
      assert.match(json.error, /social login/i);
    });

    it('returns 401 when current password does not match', async () => {
      authenticate(user);
      mock.method(bcrypt, 'compare', async () => false);

      const response = await callPasswordChange({
        currentPassword: 'wrongPassword123',
        newPassword: 'newStrongPassword456',
      });
      assert.equal(response.status, 401);
      const json = await response.json();
      assert.equal(json.error, 'Incorrect current password.');
      assert.equal(user.save.mock.callCount(), 0);
    });

    it('updates password and returns 200 with validated success response', async () => {
      authenticate(user);
      mock.method(bcrypt, 'compare', async () => true);
      mock.method(bcrypt, 'genSalt', async () => 'test_salt');
      mock.method(bcrypt, 'hash', async (pw) => `hashed_${pw}`);

      const response = await callPasswordChange({
        currentPassword: 'correctCurrentPassword123',
        newPassword: 'brandNewPassword999',
      });
      assert.equal(response.status, 200);
      const json = await response.json();

      assert.equal(json.success, true);
      assert.ok(userChangePasswordResponseSchema.safeParse(json).success);
      assert.equal(user.password, 'hashed_brandNewPassword999');
      assert.equal(user.save.mock.callCount(), 1);
    });
  });

  describe('PATCH /api/v1/user/profile with bio field', () => {
    it('accepts and persists user bio up to 500 characters', async () => {
      authenticate(user);
      mock.method(User, 'findOne', async () => null);

      const response = await callProfilePatch({
        bio: 'Passionate natural bodybuilder and runner.',
      });
      assert.equal(response.status, 200);
      const json = await response.json();

      assert.ok(userProfileResponseSchema.safeParse(json).success);
      assert.equal(user.set.mock.calls[0].arguments[0], 'bio');
      assert.equal(user.set.mock.calls[0].arguments[1], 'Passionate natural bodybuilder and runner.');
      assert.equal(user.save.mock.callCount(), 1);
    });
  });
});
