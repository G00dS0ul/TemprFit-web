import './../../setup.js';
import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '@/app/api/auth/me/route';
import User from '@/models/User';
import { signToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { setMockCookies, clearMockCookies } from './../../mocks/next-headers.js';

describe('GET /api/auth/me Route Handler', () => {
  beforeEach(() => {
    clearMockCookies();
  });

  it('should return { user: null } with status 200 when no cookie is present', async () => {
    const res = await GET();
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.deepEqual(data, { user: null });
  });

  it('should return { user: null } with status 200 when cookie has invalid JWT', async () => {
    setMockCookies({ [AUTH_COOKIE_NAME]: 'invalid.garbage.jwt' });

    const res = await GET();
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.deepEqual(data, { user: null });
  });

  it('should return { user: null } with status 200 when user id does not exist in DB', async () => {
    const token = signToken({ userId: 'ghost_user_id', role: 'user' });
    setMockCookies({ [AUTH_COOKIE_NAME]: token });

    const findMock = mock.method(User, 'findById', async () => null);

    try {
      const res = await GET();
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.deepEqual(data, { user: null });
    } finally {
      findMock.mock.restore();
    }
  });

  it('should return { user: safeUser } for valid authenticated session', async () => {
    const token = signToken({ userId: 'real_user_123', role: 'user' });
    setMockCookies({ [AUTH_COOKIE_NAME]: token });

    const mockUser = {
      _id: 'real_user_123',
      email: 'member@temprfit.com',
      username: 'member123',
      role: 'user',
      plan: 'free',
      planExpiresAt: null,
      save: async () => {},
      toSafeObject: () => ({
        id: 'real_user_123',
        email: 'member@temprfit.com',
        username: 'member123',
        role: 'user',
      }),
    };

    const findMock = mock.method(User, 'findById', async () => mockUser);

    try {
      const res = await GET();
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.user);
      assert.equal(data.user.id, 'real_user_123');
      assert.equal(data.user.email, 'member@temprfit.com');
      assert.equal(data.user.role, 'user');
      assert.equal(data.user.originalRole, 'user');
    } finally {
      findMock.mock.restore();
    }
  });

  it('should elevate role to admin in-memory when admin_token cookie is true', async () => {
    const token = signToken({ userId: 'admin_candidate', role: 'user' });
    setMockCookies({
      [AUTH_COOKIE_NAME]: token,
      admin_token: 'true',
    });

    const mockUser = {
      _id: 'admin_candidate',
      email: 'admin_candidate@temprfit.com',
      username: 'candidate',
      role: 'user',
      plan: 'free',
      save: async () => {},
      toSafeObject: () => ({
        id: 'admin_candidate',
        email: 'admin_candidate@temprfit.com',
        role: 'user',
      }),
    };

    const findMock = mock.method(User, 'findById', async () => mockUser);

    try {
      const res = await GET();
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.user);
      // Legacy behavior: admin_token='true' elevates safeUser.role to admin while keeping originalRole
      assert.equal(data.user.role, 'admin');
      assert.equal(data.user.originalRole, 'user');
    } finally {
      findMock.mock.restore();
    }
  });

  it('should downgrade expired premium plan to free', async () => {
    const token = signToken({ userId: 'expired_plan_user', role: 'user' });
    setMockCookies({ [AUTH_COOKIE_NAME]: token });

    let saved = false;
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // Expired yesterday

    const mockUser = {
      _id: 'expired_plan_user',
      email: 'expired@temprfit.com',
      role: 'user',
      plan: 'pro',
      planExpiresAt: pastDate,
      save: async function () {
        saved = true;
      },
      toSafeObject: function () {
        return {
          id: this._id,
          email: this.email,
          role: this.role,
          plan: this.plan,
        };
      },
    };

    const findMock = mock.method(User, 'findById', async () => mockUser);

    try {
      const res = await GET();
      assert.equal(res.status, 200);
      assert.equal(saved, true);
      assert.equal(mockUser.plan, 'free');
      assert.equal(mockUser.planExpiresAt, null);

      const data = await res.json();
      assert.equal(data.user.plan, 'free');
    } finally {
      findMock.mock.restore();
    }
  });
});
