#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const API_V1_DIR = path.resolve(REPO_ROOT, 'app/api/v1');

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

/**
 * Convert Next.js App Router file path to canonical OpenAPI path.
 * e.g. /app/api/v1/exercises/[slug]/route.js -> /api/v1/exercises/{slug}
 */
export function fileToOpenApiPath(relativeRoutePath) {
  // Strip route.js / route.ts and leading app
  let cleanPath = relativeRoutePath
    .replace(/[\\/]route\.(js|ts|mjs)$/, '')
    .replace(/^app/, '')
    .replace(/\\/g, '/');

  // Replace [param] with {param}
  cleanPath = cleanPath.replace(/\[([^\]]+)\]/g, '{$1}');

  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  return cleanPath;
}

/**
 * Scan a single route.js file and extract all explicitly exported HTTP methods.
 */
export function extractRouteMethods(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const foundMethods = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const method of HTTP_METHODS) {
      // Matches:
      // export async function GET(
      // export function GET(
      // export const GET =
      // export let GET =
      const fnRegex = new RegExp(`^\\s*export\\s+(async\\s+)?function\\s+(${method})\\b`);
      const constRegex = new RegExp(`^\\s*export\\s+(const|let|var)\\s+(${method})\\s*=`);

      if (fnRegex.test(line) || constRegex.test(line)) {
        foundMethods.push({
          method,
          line: i + 1,
        });
      }
    }
  }

  return foundMethods;
}

/**
 * Recursively find all route.js files in a directory.
 */
export function findRouteFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findRouteFiles(fullPath));
    } else if (entry.isFile() && /^route\.(js|ts|mjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

/**
 * Crawl app/api/v1 and generate complete operation inventory.
 */
export function inventoryV1Routes() {
  const routeFiles = findRouteFiles(API_V1_DIR);
  const operations = [];

  for (const fullPath of routeFiles) {
    const relativePath = path.relative(REPO_ROOT, fullPath).replace(/\\/g, '/');
    const openApiPath = fileToOpenApiPath(relativePath);
    const methods = extractRouteMethods(fullPath);

    for (const { method, line } of methods) {
      operations.push({
        id: `${method} ${openApiPath}`,
        method,
        path: openApiPath,
        file: relativePath,
        line,
      });
    }
  }

  return {
    fileCount: routeFiles.length,
    operationCount: operations.length,
    operations,
    files: routeFiles.map((f) => path.relative(REPO_ROOT, f).replace(/\\/g, '/')),
  };
}

// CLI Execution
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const isJson = process.argv.includes('--json');
  const checkCoverage = process.argv.includes('--check-coverage');
  const inventory = inventoryV1Routes();

  if (isJson) {
    console.log(JSON.stringify(inventory, null, 2));
    process.exit(0);
  }

  console.log('='.repeat(70));
  console.log(`TemprFit API v1 Route Inventory`);
  console.log('='.repeat(70));
  console.log(`Discovered Route Files: ${inventory.fileCount}`);
  console.log(`Total HTTP Operations : ${inventory.operationCount}`);
  console.log('-'.repeat(70));

  const methodCounts = {};
  for (const op of inventory.operations) {
    methodCounts[op.method] = (methodCounts[op.method] || 0) + 1;
  }
  for (const [method, count] of Object.entries(methodCounts)) {
    console.log(`  ${method.padEnd(8)}: ${count}`);
  }
  console.log('-'.repeat(70));

  if (checkCoverage) {
    const specPath = path.resolve(REPO_ROOT, 'contracts/openapi/openapi-spec.json');
    if (!fs.existsSync(specPath)) {
      console.warn(`[WARN] OpenAPI specification not found at contracts/openapi/openapi-spec.json`);
      console.warn(`       Run npm run openapi:emit first.`);
      process.exit(0);
    }

    const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    const documentedOps = new Set();

    if (spec.paths) {
      for (const [apiPath, pathItem] of Object.entries(spec.paths)) {
        for (const [method, op] of Object.entries(pathItem)) {
          if (HTTP_METHODS.includes(method.toUpperCase())) {
            documentedOps.add(`${method.toUpperCase()} ${apiPath}`);
          }
        }
      }
    }

    const missing = [];
    for (const op of inventory.operations) {
      if (!documentedOps.has(op.id)) {
        missing.push(op);
      }
    }

    const orphaned = [];
    const inventoriedIds = new Set(inventory.operations.map((o) => o.id));
    for (const docOp of documentedOps) {
      if (!inventoriedIds.has(docOp)) {
        orphaned.push(docOp);
      }
    }

    console.log(`Coverage Gate:`);
    console.log(`  Documented Operations in OpenAPI : ${documentedOps.size}`);
    console.log(`  Inventoried Operations in v1 Code: ${inventory.operationCount}`);
    console.log(`  Missing from Documentation       : ${missing.length}`);
    console.log(`  Orphaned Documentation Entries   : ${orphaned.length}`);

    if (missing.length > 0) {
      console.error('\n[FAIL] The following operations are in code but missing from OpenAPI:');
      for (const m of missing) {
        console.error(`  - ${m.id} (${m.file}:${m.line})`);
      }
    }
    if (orphaned.length > 0) {
      console.error('\n[FAIL] The following operations are documented but missing from code:');
      for (const o of orphaned) {
        console.error(`  - ${o}`);
      }
    }

    if (missing.length > 0 || orphaned.length > 0) {
      process.exit(1);
    }

    console.log('\n[PASS] 100% of API v1 operations are documented in OpenAPI with 0 orphans.');
  }
}
