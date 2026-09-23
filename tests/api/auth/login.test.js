import './../../setup.js';
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '@/app/api/auth/login/route';
import User from '@/models/User';
import { hashPassword, AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from '@/lib/auth';


describe('POST /api/auth/login Route Handler', () => {
  it('should return 400 if email or password is missing', async () => {
    // Missing both
    const req1 = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res1 = await POST(req1);
    assert.equal(res1.status, 400);
    const data1 = await res1.json();
    assert.equal(data1.error, 'Email and password are required.');

    // Missing password
    const req2 = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com' }),
    });
    const res2 = await POST(req2);
    assert.equal(res2.status, 400);

    // Missing email
    const req3 = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'secretPassword123' }),
    });
    const res3 = await POST(req3);
    assert.equal(res3.status, 400);
  });

  it('should return 401 if user email is not found in database', async () => {
    const findOneMock = mock.method(User, 'findOne', async () => null);

    try {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'anyPassword',
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, 'Invalid email or password.');
    } finally {
      findOneMock.mock.restore();
    }
  });

  it('should return 401 if password does not match hash', async () => {
    const correctPasswordHash = await hashPassword('realPassword_123');
    const fakeUser = {
      _id: 'user_obj_id_1',
      email: 'user@example.com',
      password: correctPasswordHash,
      role: 'user',
      isBanned: false,
      isVerified: true,
      save: async () => {},
      toSafeObject: () => ({ id: 'user_obj_id_1', email: 'user@example.com' }),
    };

    const findOneMock = mock.method(User, 'findOne', async () => fakeUser);

    try {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'WRONG_PASSWORD',
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, 'Invalid email or password.');
    } finally {
      findOneMock.mock.restore();
    }
  });

  it('should return 403 if user account is banned', async () => {
    const passwordHash = await hashPassword('validPassword_123');
    const bannedUser = {
      _id: 'banned_user_1',
      email: 'banned@example.com',
      password: passwordHash,
      role: 'user',
      isBanned: true,
      isVerified: true,
      save: async () => {},
      toSafeObject: () => ({ id: 'banned_user_1', email: 'banned@example.com' }),
    };

    const findOneMock = mock.method(User, 'findOne', async () => bannedUser);

    try {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'banned@example.com',
          password: 'validPassword_123',
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.error, 'Your account has been banned. Please contact support.');
    } finally {
      findOneMock.mock.restore();
    }
  });

  it('should return 403 if user email is not verified', async () => {
    const passwordHash = await hashPassword('validPassword_123');
    const unverifiedUser = {
      _id: 'unverified_user_1',
      email: 'unverified@example.com',
      password: passwordHash,
      role: 'user',
      isBanned: false,
      isVerified: false,
      save: async () => {},
      toSafeObject: () => ({ id: 'unverified_user_1', email: 'unverified@example.com' }),
    };

    const findOneMock = mock.method(User, 'findOne', async () => unverifiedUser);

    try {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'unverified@example.com',
          password: 'validPassword_123',
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.requiresVerification, true);
      assert.equal(data.email, 'unverified@example.com');
      assert.equal(data.message, 'Please verify your email to log in.');
    } finally {
      findOneMock.mock.restore();
    }
  });

  it('should successfully log in valid user, set repily_token cookie, and return safe user object', async () => {
    const passwordHash = await hashPassword('correctPass123!');
    let savedLastLogin = null;

    const validUser = {
      _id: { toString: () => 'valid_user_id_456' },
      email: 'athlete@example.com',
      username: 'athlete_one',
      password: passwordHash,
      role: 'user',
      isBanned: false,
      isVerified: true,
      lastLoginAt: null,
      save: async function () {
        savedLastLogin = this.lastLoginAt;
      },
      toSafeObject: () => ({
        id: 'valid_user_id_456',
        email: 'athlete@example.com',
        username: 'athlete_one',
        role: 'user',
      }),
    };

    const findOneMock = mock.method(User, 'findOne', async () => validUser);

    try {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.50',
        },
        body: JSON.stringify({
          email: 'ATHLETE@example.com', // Test email lowercase normalization
          password: 'correctPass123!',
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);

      // Verify user payload
      const data = await res.json();
      assert.ok(data.user);
      assert.equal(data.user.email, 'athlete@example.com');
      assert.equal(data.user.username, 'athlete_one');
      // Assert legacy contract: does NOT return token in response body
      assert.equal(data.token, undefined);

      // Verify lastLoginAt was updated
      assert.ok(savedLastLogin instanceof Date);

      // Verify Set-Cookie header contains repily_token
      const setCookie = res.headers.get('set-cookie');
      assert.ok(setCookie, 'Response should contain Set-Cookie header');
      assert.ok(setCookie.includes('repily_token='), 'Cookie name must be repily_token');
      assert.ok(setCookie.includes('Path=/'), 'Cookie path must be /');
      assert.ok(setCookie.includes('HttpOnly'), 'Cookie must be HttpOnly');
      assert.ok(
        setCookie.includes(`Max-Age=${AUTH_COOKIE_MAX_AGE}`),
        'Cookie Max-Age must match legacy 10-year baseline'
      );
    } finally {
      findOneMock.mock.restore();
    }
  });
});

