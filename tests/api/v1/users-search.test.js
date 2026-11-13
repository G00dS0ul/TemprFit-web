import './../../setup.js';
import {
  afterEach,
  beforeEach,
  describe,
  it,
  mock,
} from 'node:test';
import assert from 'node:assert/strict';
import { GET as handleSearchUsers } from '@/app/api/v1/users/search/route.js';
import User from '@/models/User';
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
    plan: 'pro',
    role: 'trainee',
    activeColor: '#38bdf8',
    activeBorder: 'neon',
    xp: 5000,
    privacySettings: { isProfileHidden: false },
    ...overrides,
  };
  return doc;
}

function authenticate(user) {
  setMockHeaders({
    authorization: `Bearer ${signToken({ userId: user._id })}`,
  });
}

describe('V1 Users Search API: GET /api/v1/users/search', () => {
  beforeEach(() => {
    clearMockHeaders();
    clearMockCookies();
  });

  afterEach(() => {
    mock.restoreAll();
    clearMockHeaders();
    clearMockCookies();
  });

  it('rejects unauthenticated requests with 401', async () => {
    const req = new Request('http://localhost/api/v1/users/search?q=sarah');
    const res = await handleSearchUsers(req);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.error, 'Sign in required');
  });

  it('returns empty users array when query q is empty', async () => {
    const caller = createMockUser({ _id: '507f1f77bcf86cd799439099' });
    authenticate(caller);
    mock.method(User, 'findById', async () => caller);

    const req = new Request('http://localhost/api/v1/users/search?q=');
    const res = await handleSearchUsers(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.deepStrictEqual(body.users, []);
  });

  it('searches users by query and filters caller and hidden profiles', async () => {
    const caller = createMockUser({ _id: '507f1f77bcf86cd799439099', username: 'caller_user' });
    authenticate(caller);
    mock.method(User, 'findById', async () => caller);

    const targetUser = createMockUser({
      _id: '507f1f77bcf86cd799439011',
      username: 'deeee',
      name: 'Dee Athlete',
      plan: 'max',
    });

    mock.method(User, 'find', () => ({
      select: () => ({
        limit: () => ({
          lean: async () => [targetUser],
        }),
      }),
    }));

    const req = new Request('http://localhost/api/v1/users/search?q=deee');
    const res = await handleSearchUsers(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.users.length, 1);
    assert.strictEqual(body.users[0].username, 'deeee');
    assert.strictEqual(body.users[0].plan, 'max');
    assert.strictEqual(body.users[0]._id, '507f1f77bcf86cd799439011');
  });
});
