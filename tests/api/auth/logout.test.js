import './../../setup.js';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '@/app/api/auth/logout/route';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

describe('POST /api/auth/logout Route Handler', () => {
  it('should return { ok: true } and clear repily_token cookie', async () => {
    const res = await POST();
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.deepEqual(data, { ok: true });

    // Verify Set-Cookie header clears the cookie
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Response must contain a Set-Cookie header');
    assert.ok(setCookie.includes(`${AUTH_COOKIE_NAME}=`), 'Must target AUTH_COOKIE_NAME');
    assert.ok(setCookie.includes('Max-Age=0') || setCookie.includes('expires='), 'Must expire immediately');
    assert.ok(setCookie.includes('Path=/'), 'Must apply to root Path=/');
  });
});
