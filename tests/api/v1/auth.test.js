import './../../setup.js';
import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { POST as loginPOST } from '@/app/api/v1/auth/login/route';
import { POST as refreshPOST } from '@/app/api/v1/auth/refresh/route';
import { POST as logoutPOST } from '@/app/api/v1/auth/logout/route';
import { GET as meGET } from '@/app/api/v1/auth/me/route';
import User from '@/models/User';
import RevokedToken from '@/models/RevokedToken';
import { signToken, hashPassword, AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from '@/lib/auth';
import {
  setMockCookies,
  clearMockCookies,
  setMockHeaders,
  clearMockHeaders,
} from './../../mocks/next-headers.js';

describe('API v1 Auth Endpoints (/api/v1/auth/**)', () => {
  beforeEach(() => {
    clearMockCookies();
    clearMockHeaders();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 400 if credentials are missing', async () => {
      const req = new Request('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await loginPOST(req);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /required/i);
    });

    it('should successfully authenticate, return { user, token }, and set repily_token cookie', async () => {
      const hashedPassword = await hashPassword('securePass_2026!');
      const mockUser = {
        _id: 'v1_user_123',
        email: 'v1_member@temprfit.com',
        username: 'v1_member',
        password: hashedPassword,
        role: 'user',
        plan: 'free',
        isBanned: false,
        isVerified: true,
        save: async () => {},
        toSafeObject: () => ({
          id: 'v1_user_123',
          email: 'v1_member@temprfit.com',
          username: 'v1_member',
          role: 'user',
        }),
      };

      const findMock = mock.method(User, 'findOne', async () => mockUser);

      const req = new Request('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'v1_member@temprfit.com',
          password: 'securePass_2026!',
        }),
      });

      try {
        const res = await loginPOST(req);
        assert.equal(res.status, 200);

        const data = await res.json();
        assert.ok(data.user, 'Response body should contain user');
        assert.equal(data.user.email, 'v1_member@temprfit.com');
        assert.ok(data.token, 'Response body should contain JWT token');
        assert.equal(typeof data.token, 'string');

        // Check Set-Cookie header
        const cookieHeader = res.headers.get('set-cookie');
        assert.ok(cookieHeader, 'Response should contain Set-Cookie');
        assert.ok(cookieHeader.includes('repily_token='));
        assert.ok(cookieHeader.includes(`Max-Age=${AUTH_COOKIE_MAX_AGE}`));
      } finally {
        findMock.mock.restore();
      }
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should authenticate via Authorization: Bearer <token> header', async () => {
      const token = signToken({ userId: 'v1_bearer_me_user', role: 'user' });
      setMockHeaders({ authorization: `Bearer ${token}` });

      const mockUser = {
        _id: 'v1_bearer_me_user',
        email: 'bearer_me@temprfit.com',
        role: 'user',
        plan: 'free',
        isBanned: false,
        toSafeObject: () => ({
          id: 'v1_bearer_me_user',
          email: 'bearer_me@temprfit.com',
          role: 'user',
        }),
      };

      const findMock = mock.method(User, 'findById', async () => mockUser);

      try {
        const res = await meGET();
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.ok(data.user);
        assert.equal(data.user.email, 'bearer_me@temprfit.com');
      } finally {
        findMock.mock.restore();
      }
    });

    it('should fall back to repily_token cookie during migration window', async () => {
      const token = signToken({ userId: 'v1_cookie_me_user', role: 'user' });
      setMockCookies({ [AUTH_COOKIE_NAME]: token });

      const mockUser = {
        _id: 'v1_cookie_me_user',
        email: 'cookie_me@temprfit.com',
        role: 'user',
        plan: 'free',
        isBanned: false,
        toSafeObject: () => ({
          id: 'v1_cookie_me_user',
          email: 'cookie_me@temprfit.com',
          role: 'user',
        }),
      };

      const findMock = mock.method(User, 'findById', async () => mockUser);

      try {
        const res = await meGET();
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.ok(data.user);
        assert.equal(data.user.email, 'cookie_me@temprfit.com');
      } finally {
        findMock.mock.restore();
      }
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return 401 if no active token is provided', async () => {
      const res = await refreshPOST();
      assert.equal(res.status, 401);
    });

    it('should issue a fresh token when active token is valid', async () => {
      const token = signToken({ userId: 'refresh_user_1', role: 'user' });
      setMockHeaders({ authorization: `Bearer ${token}` });

      const mockUser = {
        _id: 'refresh_user_1',
        email: 'refreshed@temprfit.com',
        role: 'user',
        plan: 'free',
        isBanned: false,
        toSafeObject: () => ({
          id: 'refresh_user_1',
          email: 'refreshed@temprfit.com',
          role: 'user',
        }),
      };

      const findUserMock = mock.method(User, 'findById', async () => mockUser);
      const revokeMock = mock.method(RevokedToken, 'findOneAndUpdate', async () => ({}));

      try {
        const res = await refreshPOST();
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.ok(data.token);
        assert.ok(data.user);
        assert.equal(data.user.email, 'refreshed@temprfit.com');
      } finally {
        findUserMock.mock.restore();
        revokeMock.mock.restore();
      }
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should revoke active token and clear auth cookies', async () => {
      const token = signToken({ userId: 'logout_user_1', role: 'user' });
      setMockHeaders({ authorization: `Bearer ${token}` });

      let revokedToken = null;
      const revokeMock = mock.method(RevokedToken, 'findOneAndUpdate', async (filter, update) => {
        revokedToken = update;
        return update;
      });

      try {
        const res = await logoutPOST();
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.ok, true);
        assert.ok(revokedToken, 'Revocation should have been written');

        // Check cleared cookie
        const setCookie = res.headers.get('set-cookie');
        assert.ok(setCookie.includes('Max-Age=0'));
      } finally {
        revokeMock.mock.restore();
      }
    });
  });
});
