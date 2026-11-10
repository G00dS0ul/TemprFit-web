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
    assert.strictEqual(spec.tags.length, 11, 'Expected 11 feature domain tags');
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
});
