import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateOpenApiSpec } from '../../lib/openapi/generator.js';

describe('OpenAPI 3.0.3 Generator Tests', () => {
  test('generates valid OpenAPI 3.0.3 specification structure', () => {
    const spec = generateOpenApiSpec();

    assert.strictEqual(spec.openapi, '3.0.3', 'Specification must declare openapi: 3.0.3');
    assert.ok(spec.info && spec.info.title, 'Info title must be present');
    assert.strictEqual(spec.info.title, 'TemprFit API');
    assert.strictEqual(spec.info.version, '1.0.0');
    assert.ok(Array.isArray(spec.servers) && spec.servers.length > 0, 'Servers must be defined');
    assert.strictEqual(spec.servers[0].url, '/', 'Default server must be relative same-origin /');
    assert.ok(spec.components && spec.components.securitySchemes, 'Security schemes must be present');
    assert.ok(spec.components.securitySchemes.BearerAuth, 'BearerAuth scheme required');
    assert.ok(spec.components.securitySchemes.CookieAuth, 'CookieAuth scheme required');
    assert.ok(spec.components.schemas, 'Components schemas required');
    assert.ok(spec.components.schemas.StandardError, 'StandardError schema required');
    assert.ok(spec.components.schemas.SafeUser, 'SafeUser schema required');
    assert.ok(spec.components.schemas.FlaggedIssue, 'FlaggedIssue schema required');
    assert.strictEqual(spec.tags.length, 12, 'Expected 12 feature domain tags');
  });

  test('no schema emits invalid OpenAPI 3.0 type arrays for nullables', () => {
    const spec = generateOpenApiSpec();
    const serialized = JSON.stringify(spec);

    // In OpenAPI 3.0, type arrays like ["string", "null"] are invalid
    assert.strictEqual(
      /\"type\"\s*:\s*\[/.test(serialized),
      false,
      'Found invalid type array in OpenAPI specification. Must use nullable: true.'
    );
  });

  test('generator is deterministic across repeated runs', () => {
    const spec1 = generateOpenApiSpec();
    const spec2 = generateOpenApiSpec();

    assert.strictEqual(
      JSON.stringify(spec1),
      JSON.stringify(spec2),
      'Consecutive OpenAPI generations must produce identical JSON output'
    );
  });

  test('auth lifecycle documentation preserves successes and truthful storage failures', () => {
    const spec = generateOpenApiSpec();
    const logout = spec.paths['/api/v1/auth/logout'].post;
    const refresh = spec.paths['/api/v1/auth/refresh'].post;
    const me = spec.paths['/api/v1/auth/me'].get;
    for (const operation of [logout, refresh, me]) {
      assert.deepEqual(operation.responses[503].content['application/json'].example,
        { error: 'Authentication service temporarily unavailable.' });
      assert.equal(operation.responses[503].content['application/json'].schema.$ref, '#/components/schemas/StandardError');
      assert.ok(operation.responses[200]);
      assert.ok(operation.responses[500]);
      assert.match(operation.description, /temprfit_token > repily_token/);
      assert.match(operation.description, /without falling through an invalid selected token/);
    }
    for (const operation of [logout, refresh]) {
      assert.equal(operation.requestBody.required, false);
      assert.match(operation.description, /JSON body > Bearer header/);
      assert.ok(operation.responses[400]);
    }
    assert.match(logout.description, /hash-only revocation with its original expiry/);
    assert.match(logout.description, /503 clear temprfit_token, repily_token and admin_token/);
    assert.match(logout.description, /does not prove server invalidation/);
    assert.match(logout.description, /does not cancel the successor/);
    assert.equal(logout.responses[401], undefined);
    assert.match(refresh.description, /single acknowledged winner/);
    assert.match(refresh.description, /no successor recovery/);
    assert.match(refresh.responses[503].description, /no replacement token or cookie/);
    assert.ok(refresh.responses[401]);
    assert.match(me.description, /503, not user: null or 401/);
    assert.match(me.description, /Other shared\/legacy auth consumers retain/);
    assert.equal(me.responses[401], undefined);
    const logoutSchema = logout.responses[200].content['application/json'].schema;
    const refreshSchema = refresh.responses[200].content['application/json'].schema;
    const meSchema = me.responses[200].content['application/json'].schema;
    assert.deepEqual(logoutSchema, { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'], additionalProperties: false });
    assert.deepEqual(refreshSchema.required, ['user', 'token']);
    assert.deepEqual(refreshSchema.properties.token, { type: 'string' });
    assert.deepEqual(refreshSchema.properties.user.required, ['email', 'role']);
    assert.equal(refreshSchema.additionalProperties, false);
    assert.deepEqual(meSchema.required, ['user']);
    assert.equal(meSchema.properties.user.nullable, true);
    assert.equal(meSchema.additionalProperties, false);
  });
});
