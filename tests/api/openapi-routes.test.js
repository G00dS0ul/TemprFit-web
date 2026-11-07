import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { GET as getOpenApi } from '../../app/api/openapi/route.js';
import { GET as getApiChanges } from '../../app/api/api-changes/route.js';

describe('OpenAPI & Change Tracking Route Handlers', () => {
  test('GET /api/openapi returns valid OpenAPI 3.0.3 document', async () => {
    const req = new Request('http://localhost:3000/api/openapi', { method: 'GET' });
    const res = await getOpenApi(req);

    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('application/json'));

    const body = await res.json();
    assert.strictEqual(body.openapi, '3.0.3');
    assert.strictEqual(body.info.title, 'TemprFit API');
    assert.ok(body.paths['/api/v1/auth/login']);
    assert.ok(body.paths['/api/v1/exercises']);
  });

  test('GET /api/api-changes returns structured change detection report', async () => {
    const req = new Request('http://localhost:3000/api/api-changes', { method: 'GET' });
    const res = await getApiChanges(req);

    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('application/json'));

    const body = await res.json();
    assert.strictEqual(typeof body.baselineAvailable, 'boolean');
    assert.ok(body.summary && typeof body.summary.total === 'number');
    assert.ok(Array.isArray(body.operations));
    assert.ok(Array.isArray(body.removedOperations));
  });
});
