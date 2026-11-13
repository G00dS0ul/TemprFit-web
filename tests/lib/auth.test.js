import './../setup.js';
import { describe, it, mock, beforeEach, afterEach, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
  getSessionUser,
  isTokenRevoked,
  revokeToken,
  hashToken,
  RevocationUnavailableError,
  AUTH_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE,
} from '@/lib/auth';
import User from '@/models/User';
import Notification from '@/models/Notification';
import RevokedToken from '@/models/RevokedToken';
import { setMockCookies, clearMockCookies, clearMockHeaders } from './../mocks/next-headers.js';

const savedUri = process.env.MONGODB_URI;
const hadUri = Object.hasOwn(process.env, 'MONGODB_URI');
const savedCache = Object.getOwnPropertyDescriptor(globalThis, '_mongoose');
const cache = { conn: null, promise: null };
process.env.MONGODB_URI = 'mongodb://auth-storage.invalid/test';
globalThis._mongoose = cache;
const { connectDB } = await import('@/lib/db');
if (hadUri) process.env.MONGODB_URI = savedUri;
else delete process.env.MONGODB_URI;
after(() => {
  if (savedCache) Object.defineProperty(globalThis, '_mongoose', savedCache);
  else delete globalThis._mongoose;
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe('lib/auth.js Core Cryptography & Constants', () => {
  describe('Constants', () => {
    it('cookie names should preserve the primary and legacy fallback tokens', () => {
      assert.equal(AUTH_COOKIE_NAME, 'temprfit_token');
      assert.equal(LEGACY_AUTH_COOKIE_NAME, 'repily_token');
    });

    it('AUTH_COOKIE_MAX_AGE should be exactly 30 days in seconds', () => {
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

    it('signToken should embed payload fields and the 30-day expiration', () => {
      const payload = { userId: 'user_abc_456', role: 'trainer' };
      const token = signToken(payload);

      const decoded = jwt.decode(token);
      assert.equal(decoded.userId, 'user_abc_456');
      assert.equal(decoded.role, 'trainer');
      assert.ok(decoded.iat, 'Token should contain iat timestamp');
      assert.ok(decoded.exp, 'Token should contain exp timestamp');

      const lifetimeSeconds = decoded.exp - decoded.iat;
      assert.equal(lifetimeSeconds, AUTH_COOKIE_MAX_AGE);
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

    it('getSessionUser should accept a valid JWT stored only in the legacy cookie', async () => {
      const token = signToken({ userId: 'legacy_member_id', role: 'user' });
      setMockCookies({ [LEGACY_AUTH_COOKIE_NAME]: token });
      const legacyUser = {
        _id: 'legacy_member_id',
        email: 'legacy@temprfit.com',
        role: 'user',
        plan: 'free',
        isBanned: false,
      };
      const findMock = mock.method(User, 'findById', async () => legacyUser);
      try {
        assert.equal(await getSessionUser(), legacyUser);
        assert.equal(findMock.mock.calls[0].arguments[0], 'legacy_member_id');
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
  });
});

describe('Required revocation storage and preserved defaults', { concurrency: false }, () => {
  let token;
  let records;
  let connect;

  beforeEach(() => {
    cache.conn = null;
    cache.promise = null;
    token = signToken({ userId: new mongoose.Types.ObjectId().toString() });
    records = new Map();
    clearMockCookies();
    clearMockHeaders();
    mock.method(console, 'error', () => {});
    connect = mock.method(mongoose, 'connect', async (uri) => {
      assert.equal(uri, 'mongodb://auth-storage.invalid/test');
      return mongoose;
    });
    mock.method(RevokedToken, 'findOne', async (filter, projection, options) => {
      assert.deepEqual(filter, { tokenHash: filter.tokenHash });
      if (options) assert.equal(options.readPreference, 'primary');
      return records.get(filter.tokenHash) || null;
    });
  });

  afterEach(() => {
    mock.restoreAll();
    clearMockCookies();
    clearMockHeaders();
    cache.conn = null;
    cache.promise = null;
  });

  it('does not query until a cold connection resolves, then reuses warm storage', async () => {
    const connection = deferred();
    const started = deferred();
    connect.mock.mockImplementation(() => { started.resolve(); return connection.promise; });
    const find = mock.method(RevokedToken, 'findOne', async (filter, projection, options) => {
      assert.equal(cache.conn, mongoose);
      assert.deepEqual(options, { readPreference: 'primary' });
      assert.equal(filter.tokenHash, crypto.createHash('sha256').update(token).digest('hex'));
      return null;
    });
    const read = isTokenRevoked(token, { requireStorage: true });
    await started.promise;
    assert.equal(find.mock.callCount(), 0);
    connection.resolve(mongoose);
    assert.equal(await read, false);
    assert.equal(await isTokenRevoked(token, { requireStorage: true }), false);
    assert.equal(connect.mock.callCount(), 1);
    assert.equal(find.mock.callCount(), 2);
  });

  it('connects before a strict write and recovers after a rejected attempt', async () => {
    connect.mock.mockImplementationOnce(async () => { throw new Error('offline'); });
    await assert.rejects(isTokenRevoked(token, { requireStorage: true }), RevocationUnavailableError);
    assert.equal(cache.promise, null);
    const write = mock.method(RevokedToken, 'updateOne', async () => {
      assert.equal(cache.conn, mongoose);
      return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 1, upsertedId: new mongoose.Types.ObjectId() };
    });
    assert.equal(await revokeToken(token, { requireStorage: true }), true);
    assert.equal(connect.mock.callCount(), 2);
    assert.equal(write.mock.callCount(), 1);
    assert.equal(await connectDB(), mongoose);
  });

  it('rejects a null connection without any model access', async () => {
    connect.mock.mockImplementation(async () => null);
    const read = mock.method(RevokedToken, 'findOne', async () => assert.fail('unconnected read'));
    const write = mock.method(RevokedToken, 'updateOne', async () => assert.fail('unconnected write'));
    await assert.rejects(isTokenRevoked(token, { requireStorage: true }), RevocationUnavailableError);
    await assert.rejects(revokeToken(token, { requireStorage: true }), RevocationUnavailableError);
    assert.equal(read.mock.callCount(), 0);
    assert.equal(write.mock.callCount(), 0);
  });

  it('uses the canonical connector in fresh missing/empty-configuration processes', () => {
    for (const absent of [true, false]) {
      const env = { ...process.env, JWT_SECRET: 'synthetic-only-secret', MONGODB_URI: '' };
      if (absent) delete env.MONGODB_URI;
      const child = spawnSync(process.execPath, ['--no-warnings', '--import', './tests/register.js', '--input-type=module', '-e', `
        import assert from 'node:assert/strict';
        import mongoose from 'mongoose';
        mongoose.connect = () => assert.fail('network must not be attempted');
        const { signToken, isTokenRevoked, revokeToken, RevocationUnavailableError } = await import('@/lib/auth');
        const token = signToken({ userId: new mongoose.Types.ObjectId().toString() });
        await assert.rejects(isTokenRevoked(token, { requireStorage: true }), RevocationUnavailableError);
        await assert.rejects(revokeToken(token, { requireStorage: true }), RevocationUnavailableError);
      `], { env, encoding: 'utf8', timeout: 15000 });
      assert.equal(child.status, 0, child.stderr);
      assert.equal(child.error, undefined);
    }
  });

  it('distinguishes known absence/presence from read failure and preserves fail-open defaults', async () => {
    assert.equal(await isTokenRevoked(token, { requireStorage: true }), false);
    records.set(hashToken(token), { tokenHash: hashToken(token) });
    assert.equal(await isTokenRevoked(token, { requireStorage: true }), true);
    const read = mock.method(RevokedToken, 'findOne', async () => { throw new Error('read failed'); });
    await assert.rejects(isTokenRevoked(token, { requireStorage: true }), RevocationUnavailableError);
    cache.conn = null;
    cache.promise = null;
    const before = connect.mock.callCount();
    assert.equal(await isTokenRevoked(token), false);
    assert.equal(connect.mock.callCount(), before);
    assert.equal(read.mock.calls.at(-1).arguments.length, 1);
    setMockCookies({ [AUTH_COOKIE_NAME]: token });
    const user = { _id: 'default-user', plan: 'free' };
    mock.method(User, 'findById', async () => user);
    assert.equal(await getSessionUser(), user);
    await assert.rejects(getSessionUser({ requireRevocation: true }), RevocationUnavailableError);
  });

  it('retains default write booleans and does not add a default connection', async () => {
    const write = mock.method(RevokedToken, 'findOneAndUpdate', async () => ({}));
    assert.equal(await revokeToken(token), true);
    write.mock.mockImplementation(async () => { throw new Error('write failed'); });
    assert.equal(await revokeToken(token), false);
    assert.equal(connect.mock.callCount(), 0);
  });

  const results = [
    [{ acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 1, upsertedId: 'insert' }, true],
    [{ acknowledged: true, matchedCount: 1, modifiedCount: 0, upsertedCount: 0, upsertedId: null }, false],
    [{ acknowledged: false }, 'unavailable'],
    [{}, 'unavailable'],
    [null, 'unavailable'],
    [{ acknowledged: true, matchedCount: 1, modifiedCount: 0, upsertedCount: 1, upsertedId: 'insert' }, 'unavailable'],
    [{ acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 1, upsertedId: null }, 'unavailable'],
    [{ acknowledged: true, matchedCount: 1, modifiedCount: 1, upsertedCount: 0, upsertedId: null }, 'unavailable'],
  ];
  for (const [result, expected] of results) {
    it(`classifies atomic write result ${JSON.stringify(result)}`, async () => {
      mock.method(RevokedToken, 'updateOne', async () => result);
      const claim = revokeToken(token, { requireStorage: true });
      if (expected === 'unavailable') await assert.rejects(claim, RevocationUnavailableError);
      else assert.equal(await claim, expected);
    });
  }

  for (const confirmation of ['present', 'absent', 'failed']) {
    it(`confirms a duplicate key with an exact primary read: ${confirmation}`, async () => {
      mock.method(RevokedToken, 'updateOne', async () => { throw Object.assign(new Error('duplicate'), { code: 11000 }); });
      mock.method(RevokedToken, 'findOne', async (filter, projection, options) => {
        assert.deepEqual(filter, { tokenHash: hashToken(token) });
        assert.equal(options.readPreference, 'primary');
        if (confirmation === 'failed') throw new Error('read unavailable');
        return confirmation === 'present' ? { tokenHash: filter.tokenHash } : null;
      });
      const claim = revokeToken(token, { requireStorage: true });
      if (confirmation === 'present') assert.equal(await claim, false);
      else await assert.rejects(claim, RevocationUnavailableError);
    });
  }

  it('rejects unusable lifecycle credentials without fallback metadata or storage', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const invalid = [null, '', 'malformed', jwt.sign({ userId }, 'wrong-secret'),
      jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: -1 }),
      jwt.sign({ userId }, process.env.JWT_SECRET), signToken({ role: 'admin' }),
      jwt.sign({ userId, exp: 1e100 }, process.env.JWT_SECRET)];
    const write = mock.method(RevokedToken, 'updateOne', async () => assert.fail('invalid claim'));
    for (const candidate of invalid) assert.equal(await revokeToken(candidate, { requireStorage: true }), false);
    assert.equal(connect.mock.callCount(), 0);
    assert.equal(write.mock.callCount(), 0);
  });

  it('preserves exp, hash-only metadata and timestamps through actual Mongoose update middleware', async () => {
    mock.method(RevokedToken.collection, 'updateOne', async (filter, update, options) => {
      assert.deepEqual(Object.keys(update), ['$setOnInsert']);
      assert.equal(options.upsert, true);
      const existing = records.get(filter.tokenHash);
      if (existing) return { acknowledged: true, matchedCount: 1, modifiedCount: 0, upsertedCount: 0, upsertedId: null };
      assert.ok(update.$setOnInsert.userId instanceof mongoose.Types.ObjectId);
      records.set(filter.tokenHash, structuredClone({
        ...update.$setOnInsert,
        userId: update.$setOnInsert.userId.toString(),
      }));
      return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 1, upsertedId: new mongoose.Types.ObjectId() };
    });
    const options = { requireStorage: true, reason: 'token_refresh', userId: new mongoose.Types.ObjectId(), expiresAt: new Date('2099-01-01') };
    assert.equal(await revokeToken(token, options), true);
    const snapshot = structuredClone(records.get(hashToken(token)));
    assert.equal(snapshot.expiresAt.getTime(), jwt.decode(token).exp * 1000);
    assert.equal(snapshot.userId.toString(), jwt.decode(token).userId);
    assert.equal(snapshot.jti, jwt.decode(token).jti);
    assert.equal(snapshot.reason, 'token_refresh');
    assert.equal(snapshot.createdAt.getTime(), snapshot.updatedAt.getTime());
    assert.equal(snapshot.createdAt.getTime(), snapshot.revokedAt.getTime());
    assert.equal(JSON.stringify(snapshot).includes(token), false);
    assert.deepEqual(Object.keys(snapshot).sort(), ['__v', 'createdAt', 'expiresAt', 'jti', 'reason', 'revokedAt', 'tokenHash', 'updatedAt', 'userId'].sort());
    assert.equal(await revokeToken(token, { requireStorage: true, reason: 'user_logout' }), false);
    assert.deepEqual(records.get(hashToken(token)), snapshot);
    const indexes = RevokedToken.schema.indexes();
    assert.ok(indexes.some(([keys, settings]) => keys.tokenHash === 1 && settings.unique === true));
    assert.ok(indexes.some(([keys, settings]) => keys.expiresAt === 1 && settings.expireAfterSeconds === 0));
    const signed = jwt.decode(token);
    assert.equal(signed.exp - signed.iat, 2592000);
    assert.ok(signed.jti);
    assert.notEqual(jwt.decode(signToken({ userId: signed.userId })).jti, signed.jti);
  });
});

