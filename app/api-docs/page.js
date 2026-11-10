import fs from 'node:fs';
import path from 'node:path';
import { generateOpenApiSpec } from '@/lib/openapi/generator';
import { computeAllRouteFingerprints, detectApiChanges } from '@/lib/openapi/change-detector';
import SwaggerExplorer from './SwaggerExplorer';

export const metadata = {
  title: 'API Documentation & Explorer | TemprFit',
  description: 'Interactive OpenAPI 3.0.3 documentation and change tracking for TemprFit Next.js backend.',
};

export const dynamic = 'force-dynamic';

export default function ApiDocsPage() {
  const cwd = process.cwd();
  const specPath = path.resolve(cwd, 'contracts/openapi/openapi-spec.json');
  const baselinePath = path.resolve(cwd, 'contracts/openapi/baseline-manifest.json');

  let canonicalSpec;
  if (fs.existsSync(specPath)) {
    try {
      canonicalSpec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    } catch {
      canonicalSpec = generateOpenApiSpec();
    }
  } else {
    canonicalSpec = generateOpenApiSpec();
  }

  let baselineManifest = null;
  if (fs.existsSync(baselinePath)) {
    try {
      baselineManifest = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    } catch (err) {
      console.warn('[api-docs] Could not load baseline manifest:', err.message);
    }
  }

  const currentFingerprints = computeAllRouteFingerprints(cwd);
  const changesReport = detectApiChanges({
    currentSpec: canonicalSpec,
    baselineManifest,
    currentFingerprints,
    repoRoot: cwd,
  });

  return (
    <SwaggerExplorer
      canonicalSpec={canonicalSpec}
      changesReport={changesReport}
    />
  );
}
