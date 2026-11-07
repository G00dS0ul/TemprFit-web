#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateOpenApiSpec } from '../lib/openapi/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.resolve(REPO_ROOT, 'contracts/openapi');
const OUT_FILE = path.join(OUT_DIR, 'openapi-spec.json');

export function emitOpenApiSpec() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const spec = generateOpenApiSpec();

  // Deterministic JSON formatting with 2 spaces and trailing newline
  const serialized = JSON.stringify(spec, null, 2) + '\n';
  fs.writeFileSync(OUT_FILE, serialized, 'utf8');

  const pathCount = Object.keys(spec.paths || {}).length;
  let opCount = 0;
  for (const pathItem of Object.values(spec.paths || {})) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      if (pathItem[method]) opCount++;
    }
  }

  return {
    filePath: OUT_FILE,
    pathCount,
    operationCount: opCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  console.log('Generating TemprFit OpenAPI 3.0.3 specification...');
  const res = emitOpenApiSpec();
  console.log(`[EMIT] Successfully written to contracts/openapi/openapi-spec.json`);
  console.log(`       Unique Paths     : ${res.pathCount}`);
  console.log(`       Documented Ops   : ${res.operationCount}`);
}
