#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateOpenApiSpec } from '../lib/openapi/generator.js';
import { computeAllRouteFingerprints, detectApiChanges } from '../lib/openapi/change-detector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const BASELINE_FILE = path.resolve(REPO_ROOT, 'contracts/openapi/baseline-manifest.json');

export function runChangeCheck() {
  let baselineManifest = null;
  if (fs.existsSync(BASELINE_FILE)) {
    try {
      baselineManifest = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
    } catch (err) {
      console.warn(`[WARN] Could not parse baseline manifest: ${err.message}`);
    }
  }

  const currentSpec = generateOpenApiSpec();
  const currentFingerprints = computeAllRouteFingerprints(REPO_ROOT);

  return detectApiChanges({
    currentSpec,
    baselineManifest,
    currentFingerprints,
    repoRoot: REPO_ROOT,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const isJson = process.argv.includes('--json');
  const report = runChangeCheck();

  if (isJson) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  console.log('='.repeat(70));
  console.log('TemprFit API Change Report');
  console.log('='.repeat(70));
  console.log(`Baseline Status : ${report.baselineAvailable ? 'Available' : 'UNAVAILABLE'}`);
  if (report.baselineAvailable) {
    console.log(`Baseline ID     : ${report.baselineId}`);
    console.log(`Baseline Commit : ${report.baselineCommit}`);
    console.log(`Baseline Date   : ${report.baselineGeneratedAt}`);
  }
  console.log('-'.repeat(70));
  console.log('Change Summary:');
  console.log(`  Total Operations: ${report.summary.total}`);
  console.log(`  Unchanged       : ${report.summary.unchanged}`);
  console.log(`  New             : ${report.summary.new}`);
  console.log(`  Changed         : ${report.summary.changed}`);
  console.log(`  Removed         : ${report.summary.removed}`);
  console.log(`  Unknown         : ${report.summary.unknown}`);
  console.log('='.repeat(70));

  if (report.summary.new > 0) {
    console.log('\n[NEW OPERATIONS]');
    for (const op of report.operations.filter((o) => o.primaryStatus === 'NEW')) {
      console.log(`  + ${op.id} - ${op.summary}`);
    }
  }

  if (report.summary.changed > 0) {
    console.log('\n[CHANGED OPERATIONS]');
    for (const op of report.operations.filter((o) => o.primaryStatus === 'CHANGED')) {
      console.log(`  ~ ${op.id} [${op.secondaryReasons.join(', ')}]`);
      if (op.diffSummary) console.log(`      Reason: ${op.diffSummary}`);
    }
  }

  if (report.summary.removed > 0) {
    console.log('\n[REMOVED OPERATIONS]');
    for (const op of report.removedOperations) {
      console.log(`  - ${op.id} - ${op.summary}`);
    }
  }

  if (!report.baselineAvailable) {
    console.warn('\n[NOTICE] No baseline manifest found at contracts/openapi/baseline-manifest.json');
    console.warn('         Run `npm run openapi:update-baseline` to initialize baseline.');
  } else if (report.summary.changed === 0 && report.summary.new === 0 && report.summary.removed === 0) {
    console.log('\n[CLEAN] Working tree matches baseline with zero API changes.');
  }
}
