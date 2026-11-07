#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { generateOpenApiSpec } from '../lib/openapi/generator.js';
import { computeAllRouteFingerprints } from '../lib/openapi/change-detector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const BASELINE_FILE = path.resolve(REPO_ROOT, 'contracts/openapi/baseline-manifest.json');

export function updateBaseline(baselineId = null) {
  let commitHash = 'unknown';
  try {
    commitHash = execSync('git rev-parse HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    // Non-git environment fallback
  }

  const generatedAt = new Date().toISOString();
  const id = baselineId || `baseline-${commitHash.slice(0, 7)}-${Date.now()}`;
  const spec = generateOpenApiSpec();
  const fingerprints = computeAllRouteFingerprints(REPO_ROOT);

  const manifest = {
    $schema: './baseline-manifest.schema.json',
    version: '1.0.0',
    baselineId: id,
    baselineCommit: commitHash,
    generatedAt,
    generatorVersion: '1.0.0',
    routeFingerprints: fingerprints,
    openApiSpec: spec,
  };

  fs.mkdirSync(path.dirname(BASELINE_FILE), { recursive: true });
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  return {
    filePath: BASELINE_FILE,
    baselineId: id,
    baselineCommit: commitHash,
    fingerprintCount: Object.keys(fingerprints).length,
    pathCount: Object.keys(spec.paths || {}).length,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  console.log('Updating TemprFit API baseline manifest...');
  const res = updateBaseline();
  console.log(`[BASELINE UPDATED] Saved to contracts/openapi/baseline-manifest.json`);
  console.log(`  Baseline ID    : ${res.baselineId}`);
  console.log(`  Baseline Commit: ${res.baselineCommit}`);
  console.log(`  Route Files    : ${res.fingerprintCount}`);
  console.log(`  OpenAPI Paths  : ${res.pathCount}`);
}
