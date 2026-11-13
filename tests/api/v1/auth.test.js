import './../../setup.js';
import { describe, it, beforeEach, afterEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import User from '@/models/User';
import Notification from '@/models/Notification';
import RevokedToken from '@/models/RevokedToken';
import {
  hashPassword,
  signToken,
  hashToken,
  AUTH_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
} from '@/lib/auth';
import {
  setMockCookies,
  clearMockCookies,
  setMockHeaders,
  clearMockHeaders,
} from './../../mocks/next-headers.js';
import * as authClient from '@/lib/client/v1/auth.js';

const savedUri = process.env.MONGODB_URI;
const hadUri = Object.hasOwn(process.env, 'MONGODB_URI');
const savedCache = Object.getOwnPropertyDescriptor(globalThis, '_mongoose');
const cache = { conn: null, promise: null };
process.env.MONGODB_URI = 'mongodb://auth-handlers.invalid/test';
globalThis._mongoose = cache;
const importConnect = mock.method(mongoose, 'connect', async () => mongoose);
const { POST: loginHandler } = await import('@/app/api/v1/auth/login/route.js');
const { POST: refreshHandler } = await import('@/app/api/v1/auth/refresh/route.js');
const { POST: logoutHandler } = await import('@/app/api/v1/auth/logout/route.js');
const { GET: meHandler } = await import('@/app/api/v1/auth/me/route.js');
importConnect.mock.restore();
if (hadUri) process.env.MONGODB_URI = savedUri;
else delete process.env.MONGODB_URI;
after(() => {
  if (savedCache) Object.defineProperty(globalThis, '_mongoose', savedCache);
  else delete globalThis._mongoose;
});

function request(path, body) {
  return new Request(`http://auth-handlers.invalid/api/v1/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

function deferred() {
  let resolve;
  const promise = new Promise((yes) => { resolve = yes; });
  return { promise, resolve };
}

function assertCleared(response) {
  const values = response.cookies.getAll();
  assert.deepEqual(values.map(({ name }) => name).sort(), [AUTH_COOKIE_NAME, LEGACY_AUTH_COOKIE_NAME, 'admin_token'].sort());
  for (const cookie of values) {
    assert.equal(cookie.value, '');
    assert.equal(cookie.maxAge, 0);
    assert.equal(cookie.path, '/');
  }
}

async function assertUnavailable(response, clears = false) {
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'Authentication service temporarily unavailable.' });
  if (clears) assertCleared(response);
  else assert.equal(response.headers.get('set-cookie'), null);
}

describe('API v1 Auth Endpoints with Contract Boundary (/api/v1/auth/**)', { concurrency: false }, () => {
  const TEST_PASSWORD = 'SecurePassword123!';
  let mockUserInstance = null;
  let records;
  let read;
  let write;
  let connect;
  let findUser;

  function claim(filter, update, options) {
    assert.equal(cache.conn, mongoose);
    assert.deepEqual(options, { upsert: true, timestamps: false });
    assert.deepEqual(Object.keys(update), ['$setOnInsert']);
    if (records.has(filter.tokenHash)) {
      return { acknowledged: true, matchedCount: 1, modifiedCount: 0, upsertedCount: 0, upsertedId: null };
    }
    assert.equal(update.$setOnInsert.tokenHash, filter.tokenHash);
    records.set(filter.tokenHash, structuredClone(update.$setOnInsert));
    return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 1, upsertedId: new mongoose.Types.ObjectId() };
  }

  beforeEach(async () => {
    clearMockCookies();
    clearMockHeaders();
    cache.conn = null;
    cache.promise = null;
    records = new Map();
    mock.method(console, 'error', () => {});
    connect = mock.method(mongoose, 'connect', async (uri) => {
      assert.equal(uri, 'mongodb://auth-handlers.invalid/test');
      return mongoose;
    });
    read = mock.method(RevokedToken, 'findOne', async (filter, projection, options) => {
      assert.equal(cache.conn, mongoose);
      assert.deepEqual(options, { readPreference: 'primary' });
      return records.get(filter.tokenHash) || null;
    });
    write = mock.method(RevokedToken, 'updateOne', claim);
    findUser = mock.method(User, 'findById', async () => mockUserInstance);
    mock.method(Notification, 'create', async () => assert.fail('unexpected subscription notification'));

    const passwordHash = await hashPassword(TEST_PASSWORD);
    mockUserInstance = {
      _id: '507f1f77bcf86cd799439011',
      name: 'V1 Auth Tester',
      email: 'v1_test@example.com',
      password: passwordHash,
      role: 'user',
      isVerified: true,
      isBanned: false,
      toSafeObject() {
        return {
          id: this._id,
          name: this.name,
          email: this.email,
          role: this.role,
          isVerified: this.isVerified,
          isBanned: this.isBanned,
        };
      },
    };
  });

  afterEach(() => {
    mock.restoreAll();
    clearMockCookies();
    clearMockHeaders();
    cache.conn = null;
    cache.promise = null;
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns 400 on contract request validation failure (missing password)', async () => {
      const request = new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mockUserInstance.email }),
      });

      const response = await loginHandler(request);
      assert.equal(response.status, 400);
      const json = await response.json();
      assert(json.error);
    });

    it('returns 401 on invalid password', async () => {
      const findOneMock = mock.method(User, 'findOne', async () => mockUserInstance);

      try {
        const request = new Request('http://localhost/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: mockUserInstance.email, password: 'WrongPassword!' }),
        });

        const response = await loginHandler(request);
        assert.equal(response.status, 401);
      } finally {
        findOneMock.mock.restore();
      }
    });

    it('authenticates valid credentials, returns Bearer token and user, sets cookie', async () => {
      const findOneMock = mock.method(User, 'findOne', async () => mockUserInstance);

      try {
        const request = new Request('http://localhost/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: mockUserInstance.email, password: TEST_PASSWORD }),
        });

        const response = await loginHandler(request);
        assert.equal(response.status, 200);

        const json = await response.json();
        assert(json.token);
        assert.equal(typeof json.token, 'string');
        assert.equal(json.user.email, mockUserInstance.email);
        assert(!json.user.password);

        const cookieHeader = response.headers.get('set-cookie');
        assert(cookieHeader.includes(AUTH_COOKIE_NAME));
      } finally {
        findOneMock.mock.restore();
      }
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('authenticates via Authorization: Bearer <token> header', async () => {
      const token = signToken({ userId: mockUserInstance._id });
      setMockHeaders({ authorization: `Bearer ${token}` });

      const findByIdMock = mock.method(User, 'findById', async () => mockUserInstance);

      try {
        const response = await meHandler();
        assert.equal(response.status, 200);

        const json = await response.json();
        assert(json.user);
        assert.equal(json.user.email, mockUserInstance.email);
      } finally {
        findByIdMock.mock.restore();
      }
    });

    it('falls back to cookie when bearer token is absent', async () => {
      const token = signToken({ userId: mockUserInstance._id });
      setMockCookies({ [AUTH_COOKIE_NAME]: token });

      const findByIdMock = mock.method(User, 'findById', async () => mockUserInstance);

      try {
        const response = await meHandler();
        assert.equal(response.status, 200);

        const json = await response.json();
        assert(json.user);
        assert.equal(json.user.email, mockUserInstance.email);
      } finally {
        findByIdMock.mock.restore();
      }
    });

    it('returns user: null when token is revoked', async () => {
      const token = signToken({ userId: mockUserInstance._id });
      setMockHeaders({ authorization: `Bearer ${token}` });

      const findOneRevokedMock = mock.method(RevokedToken, 'findOne', async () => ({ tokenHash: 'revoked' }));

      try {
        const response = await meHandler();
        assert.equal(response.status, 200);

        const json = await response.json();
        assert.equal(json.user, null);
      } finally {
        findOneRevokedMock.mock.restore();
      }
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('returns 401 when no token is present', async () => {
      const request = new Request('http://localhost/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await refreshHandler(request);
      assert.equal(response.status, 401);
    });

    it('re-issues fresh token and revokes the old token', async () => {
      const oldToken = signToken({ userId: mockUserInstance._id });
      setMockHeaders({ authorization: `Bearer ${oldToken}` });

      const findByIdMock = mock.method(User, 'findById', async () => mockUserInstance);

      try {
        const req = new Request('http://localhost/api/v1/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await refreshHandler(req);
        assert.equal(response.status, 200);

        const json = await response.json();
        assert(json.token);
        assert.notEqual(json.token, oldToken);
        assert.equal(json.user.email, mockUserInstance.email);
        assert.equal(write.mock.callCount(), 1);
        assert.equal(records.get(hashToken(oldToken)).expiresAt.getTime(), jwt.decode(oldToken).exp * 1000);
        assert.equal(jwt.decode(json.token).exp - jwt.decode(json.token).iat, 2592000);
        assert.notEqual(jwt.decode(json.token).jti, jwt.decode(oldToken).jti);
        assert.equal((await refreshHandler(request('refresh'))).status, 401);
        assert.deepEqual(await (await meHandler()).json(), { user: null });
      } finally {
        findByIdMock.mock.restore();
      }
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('revokes active token in RevokedToken and clears cookies', async () => {
      const activeToken = signToken({ userId: mockUserInstance._id });
      setMockHeaders({ authorization: `Bearer ${activeToken}` });


      const req = new Request('http://localhost/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await logoutHandler(req);
      assert.equal(response.status, 200);

      const json = await response.json();
      assert.equal(json.ok, true);
      assert.equal(write.mock.callCount(), 1);
      assertCleared(response);
      const snapshot = structuredClone(records.get(hashToken(activeToken)));
      assertCleared(await logoutHandler(request('logout')));
      assert.equal(write.mock.callCount(), 1);
      assert.deepEqual(records.get(hashToken(activeToken)), snapshot);
      assert.deepEqual(await (await meHandler()).json(), { user: null });

      const cookieHeader = response.headers.get('set-cookie');
      assert(cookieHeader.includes(`${AUTH_COOKIE_NAME}=;`));
    });
  });

  describe('Credential selection and harmless lifecycle inputs', () => {
    for (const endpoint of ['refresh', 'logout']) {
      const handler = endpoint === 'refresh' ? refreshHandler : logoutHandler;
      for (const selected of ['body', 'bearer', 'primary', 'legacy']) {
        it(`${endpoint} selects ${selected} before lower-priority credentials`, async () => {
          const tokens = Object.fromEntries(['body', 'bearer', 'primary', 'legacy'].map((key) => [key, signToken({ userId: mockUserInstance._id })]));
          const levels = ['body', 'bearer', 'primary', 'legacy'];
          const active = levels.slice(levels.indexOf(selected));
          if (active.includes('bearer')) setMockHeaders({ authorization: `Bearer ${tokens.bearer}` });
          setMockCookies({
            ...(active.includes('primary') ? { [AUTH_COOKIE_NAME]: tokens.primary } : {}),
            [LEGACY_AUTH_COOKIE_NAME]: tokens.legacy,
            admin_token: 'true',
          });
          const response = await handler(request(endpoint, selected === 'body' ? { token: tokens.body } : undefined));
          assert.equal(response.status, 200);
          assert.deepEqual([...records.keys()], [hashToken(tokens[selected])]);
          assert.equal(records.get(hashToken(tokens[selected])).userId, mockUserInstance._id);
          if (endpoint === 'logout') assertCleared(response);
        });
      }
      for (const selected of ['body', 'bearer', 'primary']) {
        it(`${endpoint} never falls through a nonempty invalid ${selected}`, async () => {
          const token = signToken({ userId: mockUserInstance._id });
          setMockCookies({ [AUTH_COOKIE_NAME]: selected === 'primary' ? 'invalid' : token, [LEGACY_AUTH_COOKIE_NAME]: token });
          if (selected !== 'primary') setMockHeaders({ authorization: `Bearer ${selected === 'bearer' ? 'invalid' : token}` });
          const response = await handler(request(endpoint, selected === 'body' ? { token: 'invalid' } : undefined));
          assert.equal(response.status, endpoint === 'refresh' ? 401 : 200);
          assert.equal(connect.mock.callCount(), 0);
          assert.equal(read.mock.callCount(), 0);
          assert.equal(write.mock.callCount(), 0);
          if (endpoint === 'logout') assertCleared(response);
          else assert.equal(response.headers.get('set-cookie'), null);
        });
      }
      it(`${endpoint} preserves invalid-body 400 without cookie clearing or storage`, async () => {
        for (const body of [{ token: 42 }, { unexpected: true }, []]) {
          const response = await handler(request(endpoint, body));
          assert.equal(response.status, 400);
          assert.equal((await response.json()).error, 'Invalid request body');
          assert.equal(response.headers.get('set-cookie'), null);
        }
        assert.equal(connect.mock.callCount(), 0);
        assert.equal(write.mock.callCount(), 0);
      });
    }

    it('rejects unusable refresh/me credentials while logout remains harmless without storage', async () => {
      const userId = mockUserInstance._id;
      const invalid = [undefined, 'malformed', jwt.sign({ userId }, 'wrong-secret'),
        jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: -1 }),
        jwt.sign({ userId }, process.env.JWT_SECRET), signToken({ role: 'admin' }),
        jwt.sign({ userId, exp: 1e100 }, process.env.JWT_SECRET)];
      for (const token of invalid) {
        setMockHeaders(token ? { authorization: `Bearer ${token}` } : {});
        const refresh = await refreshHandler(request('refresh'));
        assert.equal(refresh.status, 401);
        assert.equal(refresh.headers.get('set-cookie'), null);
        const me = await meHandler();
        assert.equal(me.status, 200);
        assert.deepEqual(await me.json(), { user: null });
        const logout = await logoutHandler(request('logout'));
        assert.equal(logout.status, 200);
        assert.deepEqual(await logout.json(), { ok: true });
        assertCleared(logout);
      }
      assert.equal(connect.mock.callCount(), 0);
      assert.equal(read.mock.callCount(), 0);
      assert.equal(write.mock.callCount(), 0);
      assert.equal(findUser.mock.callCount(), 0);
    });

    for (const selected of ['bearer', 'primary', 'legacy']) {
      it(`me uses ${selected} precedence and preserves originalRole`, async () => {
        const token = signToken({ userId: mockUserInstance._id });
        setMockCookies({ [LEGACY_AUTH_COOKIE_NAME]: selected === 'legacy' ? token : 'invalid',
          ...(selected === 'legacy' ? {} : { [AUTH_COOKIE_NAME]: selected === 'primary' ? token : 'invalid' }) });
        if (selected === 'bearer') setMockHeaders({ authorization: `Bearer ${token}` });
        const me = await meHandler();
        assert.equal(me.status, 200);
        assert.equal((await me.json()).user.originalRole, mockUserInstance.role);
        assert.equal(read.mock.calls[0].arguments[0].tokenHash, hashToken(token));
      });
    }
    for (const selected of ['bearer', 'primary']) {
      it(`me does not fall through invalid ${selected}`, async () => {
        const token = signToken({ userId: mockUserInstance._id });
        setMockCookies({ [AUTH_COOKIE_NAME]: selected === 'primary' ? 'invalid' : token, [LEGACY_AUTH_COOKIE_NAME]: token });
        if (selected === 'bearer') setMockHeaders({ authorization: 'Bearer invalid' });
        assert.deepEqual(await (await meHandler()).json(), { user: null });
        assert.equal(connect.mock.callCount(), 0);
      });
    }

    for (const user of ['missing', 'banned']) {
      it(`refresh/me deny a ${user} user without claiming`, async () => {
        setMockHeaders({ authorization: `Bearer ${signToken({ userId: mockUserInstance._id })}` });
        findUser.mock.mockImplementation(async () => user === 'missing' ? null : { ...mockUserInstance, isBanned: true });
        assert.equal((await refreshHandler(request('refresh'))).status, 401);
        assert.deepEqual(await (await meHandler()).json(), { user: null });
        assert.equal(write.mock.callCount(), 0);
      });
    }
  });

  describe('Storage and lifecycle fault boundaries', () => {
    for (const endpoint of ['refresh', 'logout', 'me']) {
      for (const fault of ['connection', 'null connection', 'read']) {
        it(`${endpoint} returns exact 503 on ${fault} failure before user access`, async () => {
          setMockHeaders({ authorization: `Bearer ${signToken({ userId: mockUserInstance._id })}` });
          if (fault === 'connection') connect.mock.mockImplementation(async () => { throw new Error('offline'); });
          else if (fault === 'null connection') connect.mock.mockImplementation(async () => null);
          else read.mock.mockImplementation(async () => { throw new Error('unavailable'); });
          await assertUnavailable(await (endpoint === 'me' ? meHandler() : (endpoint === 'refresh' ? refreshHandler : logoutHandler)(request(endpoint))), endpoint === 'logout');
          assert.equal(findUser.mock.callCount(), 0);
          assert.equal(write.mock.callCount(), 0);
        });
      }
    }
    for (const endpoint of ['refresh', 'logout']) {
      for (const fault of ['throw', 'unacknowledged', 'unknown']) {
        it(`${endpoint} does not report success for ${fault} write`, async () => {
          setMockHeaders({ authorization: `Bearer ${signToken({ userId: mockUserInstance._id })}` });
          write.mock.mockImplementation(async () => {
            if (fault === 'throw') throw new Error('write failed');
            return fault === 'unknown' ? {} : { acknowledged: false };
          });
          await assertUnavailable(await (endpoint === 'refresh' ? refreshHandler : logoutHandler)(request(endpoint)), endpoint === 'logout');
          assert.equal(records.size, 0);
        });
      }
    }
    for (const fault of ['signing', 'DTO throw', 'DTO schema']) {
      it(`refresh ${fault} failure occurs before predecessor claim`, async () => {
        const token = signToken({ userId: mockUserInstance._id });
        setMockHeaders({ authorization: `Bearer ${token}` });
        if (fault === 'signing') mock.method(jwt, 'sign', () => { throw new Error('sign failed'); });
        else mockUserInstance.toSafeObject = () => {
          if (fault === 'DTO throw') throw new Error('DTO failed');
          return { email: 'invalid' };
        };
        const response = await refreshHandler(request('refresh'));
        assert.equal(response.status, 500);
        assert.equal(response.headers.get('set-cookie'), null);
        assert.equal(write.mock.callCount(), 0);
        assert.equal(records.size, 0);
      });
    }
    for (const fault of ['response', 'cookie']) {
      it(`refresh ${fault} failure after claim never releases or deletes a successor`, async () => {
        const token = signToken({ userId: mockUserInstance._id });
        setMockHeaders({ authorization: `Bearer ${token}` });
        const original = NextResponse.json;
        mock.method(NextResponse, 'json', (body, options) => {
          if (options.status === 200) {
            if (fault === 'response') throw new Error('response failed');
            const response = original.call(NextResponse, body, options);
            response.cookies.set = () => { throw new Error('cookie failed'); };
            return response;
          }
          return original.call(NextResponse, body, options);
        });
        const response = await refreshHandler(request('refresh'));
        assert.equal(response.status, 500);
        assert.equal(response.headers.get('set-cookie'), null);
        assert.equal((await response.json()).token, undefined);
        assert.ok(records.has(hashToken(token)));
        assert.equal((await refreshHandler(request('refresh'))).status, 401);
      });
    }

    it('an unknown committed write returns 503; retry observes revocation, not recovery', async () => {
      const token = signToken({ userId: mockUserInstance._id });
      setMockHeaders({ authorization: `Bearer ${token}` });
      write.mock.mockImplementation(async (...args) => { claim(...args); throw new Error('acknowledgement lost'); });
      await assertUnavailable(await refreshHandler(request('refresh')));
      const snapshot = structuredClone(records.get(hashToken(token)));
      assert.equal((await refreshHandler(request('refresh'))).status, 401);
      read.mock.mockImplementation(async () => { throw new Error('offline'); });
      await assertUnavailable(await refreshHandler(request('refresh')));
      assert.deepEqual(records.get(hashToken(token)), snapshot);
    });

    it('discarding a successful refresh leaves replay 401 and old-token logout cannot cancel its successor', async () => {
      const token = signToken({ userId: mockUserInstance._id });
      const success = await refreshHandler(request('refresh', { token }));
      assert.equal(success.status, 200);
      const successor = (await success.json()).token;
      assert.equal((await refreshHandler(request('refresh', { token }))).status, 401);
      assert.equal((await logoutHandler(request('logout', { token }))).status, 200);
      setMockHeaders({ authorization: `Bearer ${successor}` });
      assert.ok((await (await meHandler()).json()).user);
      assert.equal(records.has(hashToken(successor)), false);
      assert.equal(write.mock.callCount(), 1);
    });

    for (const endpoint of ['refresh', 'logout']) {
      it(`${endpoint} rechecks expiry after awaited preparation without writing`, async () => {
        const token = signToken({ userId: mockUserInstance._id });
        const future = jwt.decode(token).exp * 1000 + 1;
        if (endpoint === 'refresh') findUser.mock.mockImplementation(async () => {
          mock.method(Date, 'now', () => future);
          return mockUserInstance;
        });
        else read.mock.mockImplementation(async () => { mock.method(Date, 'now', () => future); return null; });
        const response = await (endpoint === 'refresh' ? refreshHandler : logoutHandler)(request(endpoint, { token }));
        assert.equal(response.status, endpoint === 'refresh' ? 401 : 200);
        assert.equal(write.mock.callCount(), 0);
      });
    }

    it('ordinary user/subscription/response faults remain 500 rather than storage errors', async () => {
      setMockHeaders({ authorization: `Bearer ${signToken({ userId: mockUserInstance._id })}` });
      findUser.mock.mockImplementation(async () => { throw new Error('user unavailable'); });
      assert.equal((await meHandler()).status, 500);
      assert.equal((await refreshHandler(request('refresh'))).status, 500);
      findUser.mock.mockImplementation(async () => ({ ...mockUserInstance, plan: 'pro', planExpiresAt: new Date(0), save: async () => { throw new Error('save failed'); } }));
      assert.equal((await meHandler()).status, 500);
      findUser.mock.mockImplementation(async () => ({ ...mockUserInstance, toSafeObject: () => ({ email: 'invalid' }) }));
      assert.equal((await meHandler()).status, 500);
      assert.equal(write.mock.callCount(), 0);
    });
  });

  describe('Controlled concurrent lifecycle schedules', () => {
    for (const schedule of ['refresh pair', 'logout first', 'refresh first']) {
      it(`both callers observe absence: ${schedule}`, async () => {
        const token = signToken({ userId: mockUserInstance._id });
        const readsReady = deferred();
        const releaseReads = deferred();
        const claimsReady = deferred();
        const gates = [deferred(), deferred()];
        let reads = 0;
        let claims = 0;
        read.mock.mockImplementation(async () => {
          const observed = records.get(hashToken(token)) || null;
          if (++reads === 2) readsReady.resolve();
          await releaseReads.promise;
          return observed;
        });
        write.mock.mockImplementation(async (...args) => {
          const slot = claims++;
          if (claims === 2) claimsReady.resolve();
          await gates[slot].promise;
          return claim(...args);
        });
        const first = refreshHandler(request('refresh', { token }));
        const second = schedule === 'refresh pair' ? refreshHandler(request('refresh', { token })) : logoutHandler(request('logout', { token }));
        await readsReady.promise;
        assert.equal(write.mock.callCount(), 0);
        releaseReads.resolve();
        await claimsReady.promise;
        const calls = write.mock.calls;
        const winner = schedule === 'logout first' ? calls.findIndex(({ arguments: args }) => args[1].$setOnInsert.reason === 'user_logout')
          : calls.findIndex(({ arguments: args }) => args[1].$setOnInsert.reason === 'token_refresh');
        gates[winner].resolve();
        await (schedule === 'logout first' ? second : first);
        gates[1 - winner].resolve();
        const responses = await Promise.all([first, second]);
        if (schedule === 'refresh pair') {
          assert.deepEqual(responses.map(({ status }) => status).sort(), [200, 401]);
          assert.equal(responses.find(({ status }) => status === 401).headers.get('set-cookie'), null);
        } else {
          assert.equal(responses[0].status, schedule === 'logout first' ? 401 : 200);
          assert.equal(responses[1].status, 200);
          assertCleared(responses[1]);
        }
        assert.equal(records.size, 1);
        read.mock.mockImplementation(async (filter) => records.get(filter.tokenHash) || null);
        setMockHeaders({ authorization: `Bearer ${token}` });
        assert.deepEqual(await (await meHandler()).json(), { user: null });
        assert.equal((await refreshHandler(request('refresh', { token }))).status, 401);
        const success = responses[0].status === 200 ? responses[0] : responses[1];
        if (schedule !== 'logout first') {
          const successor = (await success.json()).token;
          setMockHeaders({ authorization: `Bearer ${successor}` });
          assert.ok((await (await meHandler()).json()).user);
          assert.equal(records.has(hashToken(successor)), false);
        }
      });
    }
  });

  describe('lib/client/v1/auth.js Client Functions', () => {
    for (const endpoint of ['refresh', 'logout', 'me']) {
      it(`client ${endpoint} preserves exact 503 body and status without success parsing`, async () => {
        const body = { error: 'Authentication service temporarily unavailable.' };
        const fetchFn = async (url) => {
          assert.equal(url, `/api/v1/auth/${endpoint}`);
          return Response.json(body, { status: 503 });
        };
        const operation = endpoint === 'me' ? authClient.getCurrentUser({}, { fetchFn }) : authClient[endpoint]({}, { fetchFn });
        await assert.rejects(operation, (error) => error.status === 503 && assert.deepEqual(error.data, body) === undefined);
      });
    }
    it('client refresh preserves replay 401 and successful replacement fields', async () => {
      const fetchFn = async () => Response.json({ error: 'Token has been revoked. Please sign in again.' }, { status: 401 });
      await assert.rejects(authClient.refresh({}, { fetchFn }), (error) => error.status === 401 && error.data.error.includes('revoked'));
      const replacement = { token: 'synthetic-successor', user: mockUserInstance.toSafeObject() };
      assert.deepEqual(await authClient.refresh({}, { fetchFn: async () => Response.json(replacement) }), replacement);
      assert.deepEqual(await authClient.logout({}, { fetchFn: async () => Response.json({ ok: true }) }), { ok: true });
    });
    it('authClient functions call endpoints and parse responses via contracts', async () => {
      const mockFetch = async (url) => {
        if (url === '/api/v1/auth/login') {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({
              token: 'mock-jwt-token',
              user: {
                id: '123',
                email: 'mock@example.com',
                role: 'user',
              },
            }),
          };
        }
        if (url === '/api/v1/auth/me') {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({
              user: {
                id: '123',
                email: 'mock@example.com',
                role: 'user',
              },
            }),
          };
        }
        return { ok: false, status: 404 };
      };

      const loginRes = await authClient.login(
        { email: 'mock@example.com', password: 'password123' },
        { fetchFn: mockFetch }
      );
      assert.equal(loginRes.token, 'mock-jwt-token');
      assert.equal(loginRes.user.email, 'mock@example.com');

      const meRes = await authClient.getCurrentUser({}, { fetchFn: mockFetch });
      assert.equal(meRes.user.email, 'mock@example.com');
    });
  });
});
