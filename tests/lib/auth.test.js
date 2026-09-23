import './../setup.js';
import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import {
  hashPassword,
  comparePassword,
  hashToken,
  signToken,
  verifyToken,
  isTokenRevoked,
  revokeToken,
  getSessionUser,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE,
} from '@/lib/auth';
import User from '@/models/User';
import Notification from '@/models/Notification';
import RevokedToken from '@/models/RevokedToken';
import { setMockCookies, clearMockCookies, setMockHeaders, clearMockHeaders } from './../mocks/next-headers.js';

describe('lib/auth.js Core Cryptography & Constants', () => {
  describe('Constants', () => {
    it('AUTH_COOKIE_NAME should be repily_token', () => {
      assert.equal(AUTH_COOKIE_NAME, 'repily_token');
    });

    it('AUTH_COOKIE_MAX_AGE should be exactly 30 days in seconds per D-4', () => {
      const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;
      assert.equal(AUTH_COOKIE_MAX_AGE, THIRTY_DAYS_SECONDS);
      assert.equal(AUTH_COOKIE_MAX_AGE, 2592000);
    });
  });

  describe('Password Hashing & Comparison', () => {
    it('hashPassword should generate a valid bcrypt hash', async () => {
      const plain = 'superSecretPassword123!';
      const hash = await hashPassword(plain);

      assert.equal(typeof hash, 'string');
      assert.match(hash, /^\$2[ab]\$\d{2}\$/);
    });

    it('hashPassword should generate distinct hashes for identical plaintexts (salting)', async () => {
      const plain = 'samePasswordEveryTime';
      const hash1 = await hashPassword(plain);
      const hash2 = await hashPassword(plain);

      assert.notEqual(hash1, hash2);
    });

    it('comparePassword should return true for matching password', async () => {
      const plain = 'userPassword_2026';
      const hash = await hashPassword(plain);
      const isMatch = await comparePassword(plain, hash);

      assert.equal(isMatch, true);
    });

    it('comparePassword should return false for incorrect password', async () => {
      const plain = 'correctPassword';
      const wrong = 'wrongPassword';
      const hash = await hashPassword(plain);
      const isMatch = await comparePassword(wrong, hash);

      assert.equal(isMatch, false);
    });
  });

  describe('Token Signing (signToken)', () => {
    it('signToken should produce a valid 3-segment JWT string', () => {
      const payload = { userId: 'user_123', role: 'user' };
      const token = signToken(payload);

      assert.equal(typeof token, 'string');
      const segments = token.split('.');
      assert.equal(segments.length, 3);
    });

    it('signToken should embed payload fields, unique jti, and 30-day expiration per D-4', () => {
      const payload = { userId: 'user_abc_456', role: 'trainer' };
      const token = signToken(payload);

      const decoded = jwt.decode(token);
      assert.equal(decoded.userId, 'user_abc_456');
      assert.equal(decoded.role, 'trainer');
      assert.ok(decoded.jti, 'Token should contain unique jti UUID');
      assert.ok(decoded.iat, 'Token should contain iat timestamp');
      assert.ok(decoded.exp, 'Token should contain exp timestamp');

      const lifetimeSeconds = decoded.exp - decoded.iat;
      assert.equal(lifetimeSeconds, AUTH_COOKIE_MAX_AGE);
      assert.equal(lifetimeSeconds, 2592000);
    });
  });

  describe('Token Verification (verifyToken)', () => {
    it('verifyToken should decode valid signed token', () => {
      const payload = { userId: 'user_verified_789', role: 'user' };
      const token = signToken(payload);

      const verified = verifyToken(token);
      assert.ok(verified);
      assert.equal(verified.userId, 'user_verified_789');
      assert.equal(verified.role, 'user');
    });

    it('verifyToken should return null for token signed with a different secret', () => {
      const fakeToken = jwt.sign(
        { userId: 'impostor_999' },
        'different_unauthorized_secret_key'
      );

      const verified = verifyToken(fakeToken);
      assert.equal(verified, null);
    });

    it('verifyToken should return null for malformed token string', () => {
      assert.equal(verifyToken('not.a.valid.jwt.token'), null);
      assert.equal(verifyToken('garbageTokenString'), null);
      assert.equal(verifyToken(''), null);
      assert.equal(verifyToken(null), null);
      assert.equal(verifyToken(undefined), null);
    });

    it('verifyToken should return null for expired token without throwing error', () => {
      const expiredToken = jwt.sign(
        { userId: 'expired_user' },
        process.env.JWT_SECRET,
        { expiresIn: -10 } // Expired 10 seconds ago
      );

      assert.doesNotThrow(() => {
        const result = verifyToken(expiredToken);
        assert.equal(result, null);
      });
    });
  });

  describe('getSessionUser Helper', () => {
    beforeEach(() => {
      clearMockCookies();
    });

    it('getSessionUser should return null when auth cookie is missing', async () => {
      const user = await getSessionUser();
      assert.equal(user, null);
    });

    it('getSessionUser should return null when cookie has invalid or unverified JWT', async () => {
      setMockCookies({ [AUTH_COOKIE_NAME]: 'tampered.or.invalid.token' });
      const user = await getSessionUser();
      assert.equal(user, null);
    });

    it('getSessionUser should return null when user is not found in database', async () => {
      const token = signToken({ userId: 'missing_user_id', role: 'user' });
      setMockCookies({ [AUTH_COOKIE_NAME]: token });

      const findMock = mock.method(User, 'findById', async () => null);

      try {
        const user = await getSessionUser();
        assert.equal(user, null);
      } finally {
        findMock.mock.restore();
      }
    });

    it('getSessionUser should return null when user is banned', async () => {
      const token = signToken({ userId: 'banned_user_id', role: 'user' });
      setMockCookies({ [AUTH_COOKIE_NAME]: token });

      const findMock = mock.method(User, 'findById', async () => ({
        _id: 'banned_user_id',
        isBanned: true,
      }));

      try {
        const user = await getSessionUser();
        assert.equal(user, null);
      } finally {
        findMock.mock.restore();
      }
    });

    it('getSessionUser should return user when token is valid and user is active', async () => {
      const token = signToken({ userId: 'active_member_id', role: 'user' });
      setMockCookies({ [AUTH_COOKIE_NAME]: token });

      const mockUser = {
        _id: 'active_member_id',
        email: 'member@temprfit.com',
        role: 'user',
        plan: 'free',
        isBanned: false,
      };

      const findMock = mock.method(User, 'findById', async () => mockUser);

      try {
        const user = await getSessionUser();
        assert.ok(user);
        assert.equal(user._id, 'active_member_id');
        assert.equal(user.email, 'member@temprfit.com');
      } finally {
        findMock.mock.restore();
      }
    });

    it('getSessionUser should downgrade expired plan to free, save user, and trigger notification', async () => {
      const token = signToken({ userId: 'expired_plan_id', role: 'user' });
      setMockCookies({ [AUTH_COOKIE_NAME]: token });

      let userSaved = false;
      let notificationCreated = false;
      let notificationPayload = null;

      const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // 1 day ago
      const mockUser = {
        _id: 'expired_plan_id',
        email: 'pro_expired@temprfit.com',
        role: 'user',
        plan: 'pro',
        planExpiresAt: pastDate,
        isBanned: false,
        save: async function () {
          userSaved = true;
        },
      };

      const findMock = mock.method(User, 'findById', async () => mockUser);
      const notifMock = mock.method(Notification, 'create', async (data) => {
        notificationCreated = true;
        notificationPayload = data;
        return data;
      });

      try {
        const user = await getSessionUser();
        assert.ok(user);
        assert.equal(userSaved, true);
        assert.equal(notificationCreated, true);
        assert.equal(user.plan, 'free');
        assert.equal(user.planExpiresAt, null);
        assert.equal(notificationPayload.user, 'expired_plan_id');
        assert.equal(notificationPayload.type, 'subscription');
        assert.match(notificationPayload.message, /pro plan has expired/);
      } finally {
        findMock.mock.restore();
        notifMock.mock.restore();
      }
    });

    it('getSessionUser should authenticate via Authorization: Bearer <token> header (Phase 0 contract)', async () => {
      clearMockCookies();
      const token = signToken({ userId: 'bearer_user_789', role: 'user' });
      setMockHeaders({ authorization: `Bearer ${token}` });

      const mockUser = {
        _id: 'bearer_user_789',
        email: 'bearer@temprfit.com',
        role: 'user',
        plan: 'free',
        isBanned: false,
      };

      const findMock = mock.method(User, 'findById', async () => mockUser);

      try {
        const user = await getSessionUser();
        assert.ok(user);
        assert.equal(user._id, 'bearer_user_789');
        assert.equal(user.email, 'bearer@temprfit.com');
      } finally {
        findMock.mock.restore();
        clearMockHeaders();
      }
    });

    it('getSessionUser should return null when token is marked revoked in RevokedToken', async () => {
      const token = signToken({ userId: 'revoked_user_123', role: 'user' });
      setMockHeaders({ authorization: `Bearer ${token}` });

      const revokeCheckMock = mock.method(RevokedToken, 'findOne', async () => ({
        tokenHash: hashToken(token),
        jti: 'some-revoked-jti',
      }));

      try {
        const user = await getSessionUser();
        assert.equal(user, null);
      } finally {
        revokeCheckMock.mock.restore();
        clearMockHeaders();
      }
    });
  });

  describe('Token Revocation & Hashing', () => {
    it('hashToken should return deterministic 64-char sha256 hex digest', () => {
      const token1 = 'sample.jwt.token.string';
      const hash1 = hashToken(token1);
      const hash2 = hashToken(token1);

      assert.equal(typeof hash1, 'string');
      assert.equal(hash1.length, 64);
      assert.equal(hash1, hash2);
      assert.notEqual(hash1, hashToken('different.jwt.token'));
    });

    it('isTokenRevoked should return true when token is found in revocation collection', async () => {
      const token = 'revoked.token.sample';
      const findMock = mock.method(RevokedToken, 'findOne', async () => ({
        tokenHash: hashToken(token),
      }));

      try {
        const revoked = await isTokenRevoked({ token });
        assert.equal(revoked, true);
      } finally {
        findMock.mock.restore();
      }
    });

    it('isTokenRevoked should return false when token is not in revocation collection', async () => {
      const token = 'active.valid.token';
      const findMock = mock.method(RevokedToken, 'findOne', async () => null);

      try {
        const revoked = await isTokenRevoked({ token });
        assert.equal(revoked, false);
      } finally {
        findMock.mock.restore();
      }
    });
  });
});

