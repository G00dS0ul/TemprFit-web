import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { inventoryV1Routes } from '../../tools/inventory-routes.js';
import { generateOpenApiSpec } from '../../lib/openapi/generator.js';

describe('OpenAPI Route Inventory & Coverage Gate', () => {
  test('discovers all 56 route files in app/api/v1', () => {
    const inv = inventoryV1Routes();
    assert.strictEqual(inv.fileCount, 56, `Expected 56 route.js files, found ${inv.fileCount}`);
  });

  test('discovers all 82 HTTP operation exports across app/api/v1', () => {
    const inv = inventoryV1Routes();
    assert.strictEqual(inv.operationCount, 82, `Expected 82 operations, found ${inv.operationCount}`);

    const methodCounts = {};
    for (const op of inv.operations) {
      methodCounts[op.method] = (methodCounts[op.method] || 0) + 1;
    }

    assert.strictEqual(methodCounts.GET, 31, 'Expected 31 GET methods');
    assert.strictEqual(methodCounts.POST, 34, 'Expected 34 POST methods');
    assert.strictEqual(methodCounts.PATCH, 7, 'Expected 7 PATCH methods');
    assert.strictEqual(methodCounts.DELETE, 7, 'Expected 7 DELETE methods');
    assert.strictEqual(methodCounts.PUT, 3, 'Expected 3 PUT methods');
  });

  test('coverage gate: 100% of inventoried operations are documented in OpenAPI with 0 orphans', () => {
    const inv = inventoryV1Routes();
    const spec = generateOpenApiSpec();

    const documentedOps = new Set();
    for (const [apiPath, pathItem] of Object.entries(spec.paths || {})) {
      for (const method of ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']) {
        if (pathItem[method]) {
          documentedOps.add(`${method.toUpperCase()} ${apiPath}`);
        }
      }
    }

    const missing = [];
    for (const op of inv.operations) {
      if (!documentedOps.has(op.id)) {
        missing.push(op.id);
      }
    }

    const inventoriedIds = new Set(inv.operations.map((o) => o.id));
    const orphaned = [];
    for (const docId of documentedOps) {
      if (!inventoriedIds.has(docId)) {
        orphaned.push(docId);
      }
    }

    assert.deepStrictEqual(missing, [], `Missing operations in OpenAPI documentation: ${missing.join(', ')}`);
    assert.deepStrictEqual(orphaned, [], `Orphaned operations documented but missing from code: ${orphaned.join(', ')}`);
    assert.strictEqual(documentedOps.size, 82, 'Expected exactly 82 documented operations');
  });
});
