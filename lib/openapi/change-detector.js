import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findRouteFiles } from '../../tools/inventory-routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

/**
 * Deterministically sorts object keys recursively.
 */
export function canonicalize(val) {
  if (val === null || typeof val !== 'object') {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(canonicalize);
  }
  const sorted = {};
  for (const key of Object.keys(val).sort()) {
    sorted[key] = canonicalize(val[key]);
  }
  return sorted;
}

export function hashString(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

/**
 * Computes SHA-256 fingerprint for a file, normalizing line endings (\r\n -> \n)
 * to ensure deterministic cross-platform hashing across line endings.
 */
export function computeFileFingerprint(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  const normalized = content.replace(/\r\n/g, '\n');
  return hashString(normalized);
}

/**
 * Computes route file fingerprints for all route.js files in app/api/v1.
 */
export function computeAllRouteFingerprints(repoRoot = REPO_ROOT) {
  const apiV1Dir = path.resolve(repoRoot, 'app/api/v1');
  const files = findRouteFiles(apiV1Dir);
  const fingerprints = {};

  for (const fullPath of files) {
    const relPath = path.relative(repoRoot, fullPath).replace(/\\/g, '/');
    fingerprints[relPath] = computeFileFingerprint(fullPath);
  }

  return fingerprints;
}

/**
 * Maps an OpenAPI canonical path (e.g. /api/v1/exercises/{slug}/favorite)
 * back to its relative file path (e.g. app/api/v1/exercises/[slug]/favorite/route.js).
 */
export function openApiPathToFile(openApiPath) {
  let fileSegment = openApiPath.replace(/^\//, '');
  fileSegment = fileSegment.replace(/\{([^}]+)\}/g, '[$1]');
  return `app/${fileSegment}/route.js`;
}

/**
 * Extracts operations map from an OpenAPI spec:
 * Key: "METHOD /path" -> value: { method, path, operationObject }
 */
export function extractOperationsFromSpec(spec) {
  const ops = new Map();
  if (!spec || !spec.paths) return ops;

  for (const [apiPath, pathItem] of Object.entries(spec.paths)) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']) {
      if (pathItem[method]) {
        const id = `${method.toUpperCase()} ${apiPath}`;
        ops.set(id, {
          id,
          method: method.toUpperCase(),
          path: apiPath,
          operation: pathItem[method],
        });
      }
    }
  }

  return ops;
}

/**
 * Separates contract-critical data from descriptive documentation data.
 */
export function partitionOperationData(op, components = {}) {
  const { summary, description, tags, externalDocs, ...contractRest } = op;

  // Resolve referenced component schemas inside contract data
  const resolvedContract = resolveRefs(contractRest, components, new Set());

  return {
    contract: canonicalize(resolvedContract),
    documentation: canonicalize({ summary, description, tags }),
  };
}

/**
 * Recursively resolves $ref pointers (e.g. #/components/schemas/SafeUser)
 * to ensure changes to shared component schemas flag all referencing operations.
 */
function resolveRefs(obj, components, visited) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => resolveRefs(item, components, visited));

  if (obj.$ref && typeof obj.$ref === 'string') {
    const ref = obj.$ref;
    if (visited.has(ref)) {
      return { $ref: ref, _cyclic: true };
    }
    const newVisited = new Set(visited).add(ref);
    const prefix = '#/components/schemas/';
    if (ref.startsWith(prefix)) {
      const schemaName = ref.slice(prefix.length);
      const schema = components?.schemas?.[schemaName];
      if (schema) {
        return {
          $ref: ref,
          _resolved: resolveRefs(schema, components, newVisited),
        };
      }
    }
    return { $ref: ref };
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = resolveRefs(value, components, visited);
  }
  return result;
}

/**
 * Compares current OpenAPI specification and route fingerprints against baseline.
 */
export function detectApiChanges({ currentSpec, baselineManifest, currentFingerprints, repoRoot = REPO_ROOT }) {
  if (!baselineManifest || !baselineManifest.openApiSpec) {
    const currentOps = Array.from(extractOperationsFromSpec(currentSpec).values()).map((op) => ({
      id: op.id,
      method: op.method,
      path: op.path,
      primaryStatus: 'UNKNOWN',
      secondaryReasons: ['Baseline unavailable'],
      diffSummary: null,
      summary: op.operation.summary || '',
      tags: op.operation.tags || [],
    }));

    return {
      baselineAvailable: false,
      baselineId: null,
      baselineCommit: null,
      baselineGeneratedAt: null,
      currentGeneratedAt: new Date().toISOString(),
      summary: {
        total: currentOps.length,
        new: 0,
        changed: 0,
        unchanged: 0,
        removed: 0,
        unknown: currentOps.length,
      },
      operations: currentOps,
      removedOperations: [],
    };
  }

  const baselineSpec = baselineManifest.openApiSpec;
  const baselineFingerprints = baselineManifest.routeFingerprints || {};
  const currentFingerprintMap = currentFingerprints || computeAllRouteFingerprints(repoRoot);

  const currentOps = extractOperationsFromSpec(currentSpec);
  const baselineOps = extractOperationsFromSpec(baselineSpec);

  const results = [];
  const removedOperations = [];
  let newCount = 0;
  let changedCount = 0;
  let unchangedCount = 0;

  // 1. Check current operations against baseline
  for (const [id, currentItem] of currentOps.entries()) {
    const baselineItem = baselineOps.get(id);

    if (!baselineItem) {
      newCount++;
      results.push({
        id,
        method: currentItem.method,
        path: currentItem.path,
        primaryStatus: 'NEW',
        secondaryReasons: ['New operation added'],
        diffSummary: 'Operation is not present in baseline',
        summary: currentItem.operation.summary || '',
        tags: currentItem.operation.tags || [],
      });
      continue;
    }

    const currentPartition = partitionOperationData(currentItem.operation, currentSpec.components);
    const baselinePartition = partitionOperationData(baselineItem.operation, baselineSpec.components);

    const contractChanged = JSON.stringify(currentPartition.contract) !== JSON.stringify(baselinePartition.contract);
    const docChanged = JSON.stringify(currentPartition.documentation) !== JSON.stringify(baselinePartition.documentation);

    const relFile = openApiPathToFile(currentItem.path);
    const currentFileHash = currentFingerprintMap[relFile] || computeFileFingerprint(path.resolve(repoRoot, relFile));
    const baselineFileHash = baselineFingerprints[relFile];
    const handlerChanged = currentFileHash && baselineFileHash && currentFileHash !== baselineFileHash;

    const secondaryReasons = [];
    if (contractChanged) secondaryReasons.push('Contract changed');
    if (handlerChanged) secondaryReasons.push('Possible handler-changed');
    if (docChanged) secondaryReasons.push('Documentation only');

    let primaryStatus = 'UNCHANGED';
    let diffSummary = null;

    if (contractChanged) {
      primaryStatus = 'CHANGED';
      diffSummary = 'Effective request/response/parameter schema changed relative to baseline';
      changedCount++;
    } else if (handlerChanged) {
      primaryStatus = 'CHANGED';
      diffSummary = `Route handler file ${relFile} was modified`;
      changedCount++;
    } else if (docChanged) {
      primaryStatus = 'CHANGED';
      diffSummary = 'Summary, description, or tags updated';
      changedCount++;
    } else {
      unchangedCount++;
    }

    results.push({
      id,
      method: currentItem.method,
      path: currentItem.path,
      primaryStatus,
      secondaryReasons,
      diffSummary,
      summary: currentItem.operation.summary || '',
      tags: currentItem.operation.tags || [],
    });
  }

  // 2. Check for removed operations (in baseline but not in current)
  for (const [id, baselineItem] of baselineOps.entries()) {
    if (!currentOps.has(id)) {
      removedOperations.push({
        id,
        method: baselineItem.method,
        path: baselineItem.path,
        primaryStatus: 'REMOVED',
        secondaryReasons: ['Operation removed from current build'],
        diffSummary: 'Operation existed in baseline but is no longer present',
        summary: baselineItem.operation.summary || '',
        tags: baselineItem.operation.tags || [],
      });
    }
  }

  return {
    baselineAvailable: true,
    baselineId: baselineManifest.baselineId || 'baseline-init',
    baselineCommit: baselineManifest.baselineCommit || 'HEAD',
    baselineGeneratedAt: baselineManifest.generatedAt || null,
    currentGeneratedAt: new Date().toISOString(),
    summary: {
      total: results.length,
      new: newCount,
      changed: changedCount,
      unchanged: unchangedCount,
      removed: removedOperations.length,
      unknown: 0,
    },
    operations: results,
    removedOperations,
  };
}
