import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalize,
  hashString,
  detectApiChanges,
} from '../../lib/openapi/change-detector.js';

describe('API Change Detector Engine', () => {
  test('canonicalize sorts keys deterministically', () => {
    const objA = { z: 1, a: 2, m: { y: 'b', x: 'a' } };
    const objB = { a: 2, m: { x: 'a', y: 'b' }, z: 1 };

    assert.strictEqual(
      JSON.stringify(canonicalize(objA)),
      JSON.stringify(canonicalize(objB)),
      'Key order differences must be normalized away'
    );
  });

  test('line ending normalization produces identical hash for CRLF and LF', () => {
    const contentLF = 'export async function GET() {\n  return 1;\n}\n';
    const contentCRLF = 'export async function GET() {\r\n  return 1;\r\n}\r\n';

    const normalizedLF = contentLF.replace(/\r\n/g, '\n');
    const normalizedCRLF = contentCRLF.replace(/\r\n/g, '\n');

    assert.strictEqual(
      hashString(normalizedLF),
      hashString(normalizedCRLF),
      'CRLF and LF must hash to identical SHA-256'
    );
  });

  test('reports UNKNOWN status when baseline manifest is unavailable', () => {
    const dummySpec = {
      openapi: '3.0.3',
      paths: {
        '/api/v1/test': {
          get: { summary: 'Test', responses: { 200: { description: 'ok' } } },
        },
      },
    };

    const report = detectApiChanges({
      currentSpec: dummySpec,
      baselineManifest: null,
      currentFingerprints: {},
    });

    assert.strictEqual(report.baselineAvailable, false);
    assert.strictEqual(report.summary.unknown, 1);
    assert.strictEqual(report.operations[0].primaryStatus, 'UNKNOWN');
    assert.ok(report.operations[0].secondaryReasons.includes('Baseline unavailable'));
  });

  test('reports UNCHANGED when current matches baseline exactly', () => {
    const dummySpec = {
      openapi: '3.0.3',
      paths: {
        '/api/v1/test': {
          get: { summary: 'Test', responses: { 200: { description: 'ok' } } },
        },
      },
    };

    const manifest = {
      baselineId: 'b1',
      baselineCommit: 'c1',
      openApiSpec: dummySpec,
      routeFingerprints: { 'app/api/v1/test/route.js': 'hash123' },
    };

    const report = detectApiChanges({
      currentSpec: dummySpec,
      baselineManifest: manifest,
      currentFingerprints: { 'app/api/v1/test/route.js': 'hash123' },
    });

    assert.strictEqual(report.baselineAvailable, true);
    assert.strictEqual(report.summary.unchanged, 1);
    assert.strictEqual(report.operations[0].primaryStatus, 'UNCHANGED');
  });

  test('reports NEW when operation is added', () => {
    const baselineSpec = { openapi: '3.0.3', paths: {} };
    const currentSpec = {
      openapi: '3.0.3',
      paths: {
        '/api/v1/new-op': {
          post: { summary: 'New Op', responses: { 201: { description: 'created' } } },
        },
      },
    };

    const manifest = {
      baselineId: 'b1',
      openApiSpec: baselineSpec,
      routeFingerprints: {},
    };

    const report = detectApiChanges({
      currentSpec,
      baselineManifest: manifest,
      currentFingerprints: {},
    });

    assert.strictEqual(report.summary.new, 1);
    assert.strictEqual(report.operations[0].primaryStatus, 'NEW');
    assert.ok(report.operations[0].secondaryReasons.includes('New operation added'));
  });

  test('reports REMOVED in separate non-executable list when operation is deleted', () => {
    const baselineSpec = {
      openapi: '3.0.3',
      paths: {
        '/api/v1/old-op': {
          delete: { summary: 'Old Op', responses: { 200: { description: 'ok' } } },
        },
      },
    };
    const currentSpec = { openapi: '3.0.3', paths: {} };

    const manifest = {
      baselineId: 'b1',
      openApiSpec: baselineSpec,
      routeFingerprints: {},
    };

    const report = detectApiChanges({
      currentSpec,
      baselineManifest: manifest,
      currentFingerprints: {},
    });

    assert.strictEqual(report.summary.removed, 1);
    assert.strictEqual(report.removedOperations.length, 1);
    assert.strictEqual(report.removedOperations[0].id, 'DELETE /api/v1/old-op');
    assert.strictEqual(report.removedOperations[0].primaryStatus, 'REMOVED');
  });

  test('reports CHANGED with "Contract changed" when schema differs', () => {
    const baselineSpec = {
      openapi: '3.0.3',
      paths: {
        '/api/v1/data': {
          get: {
            summary: 'Data',
            responses: { 200: { description: 'ok', content: { 'application/json': { schema: { type: 'string' } } } } },
          },
        },
      },
    };
    const currentSpec = {
      openapi: '3.0.3',
      paths: {
        '/api/v1/data': {
          get: {
            summary: 'Data',
            responses: { 200: { description: 'ok', content: { 'application/json': { schema: { type: 'number' } } } } },
          },
        },
      },
    };

    const manifest = {
      baselineId: 'b1',
      openApiSpec: baselineSpec,
      routeFingerprints: { 'app/api/v1/data/route.js': 'hashA' },
    };

    const report = detectApiChanges({
      currentSpec,
      baselineManifest: manifest,
      currentFingerprints: { 'app/api/v1/data/route.js': 'hashA' },
    });

    assert.strictEqual(report.summary.changed, 1);
    assert.strictEqual(report.operations[0].primaryStatus, 'CHANGED');
    assert.ok(report.operations[0].secondaryReasons.includes('Contract changed'));
  });

  test('reports CHANGED with "Possible handler-changed" when route file hash changes but contract is identical', () => {
    const spec = {
      openapi: '3.0.3',
      paths: {
        '/api/v1/test': {
          get: { summary: 'Test', responses: { 200: { description: 'ok' } } },
        },
      },
    };

    const manifest = {
      baselineId: 'b1',
      openApiSpec: spec,
      routeFingerprints: { 'app/api/v1/test/route.js': 'original_hash' },
    };

    const report = detectApiChanges({
      currentSpec: spec,
      baselineManifest: manifest,
      currentFingerprints: { 'app/api/v1/test/route.js': 'modified_hash' },
    });

    assert.strictEqual(report.summary.changed, 1);
    assert.strictEqual(report.operations[0].primaryStatus, 'CHANGED');
    assert.ok(report.operations[0].secondaryReasons.includes('Possible handler-changed'));
  });

  test('reports CHANGED with "Documentation only" when description changes with identical contract and file hash', () => {
    const baselineSpec = {
      openapi: '3.0.3',
      paths: {
        '/api/v1/test': {
          get: { summary: 'Original Summary', responses: { 200: { description: 'ok' } } },
        },
      },
    };
    const currentSpec = {
      openapi: '3.0.3',
      paths: {
        '/api/v1/test': {
          get: { summary: 'Updated Summary', responses: { 200: { description: 'ok' } } },
        },
      },
    };

    const manifest = {
      baselineId: 'b1',
      openApiSpec: baselineSpec,
      routeFingerprints: { 'app/api/v1/test/route.js': 'hash123' },
    };

    const report = detectApiChanges({
      currentSpec,
      baselineManifest: manifest,
      currentFingerprints: { 'app/api/v1/test/route.js': 'hash123' },
    });

    assert.strictEqual(report.summary.changed, 1);
    assert.strictEqual(report.operations[0].primaryStatus, 'CHANGED');
    assert.ok(report.operations[0].secondaryReasons.includes('Documentation only'));
  });
});
