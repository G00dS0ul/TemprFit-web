import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { generateOpenApiSpec } from '@/lib/openapi/generator';
import { computeAllRouteFingerprints, detectApiChanges } from '@/lib/openapi/change-detector';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const cwd = process.cwd();
    const baselineFile = path.resolve(cwd, 'contracts/openapi/baseline-manifest.json');

    let baselineManifest = null;
    if (fs.existsSync(baselineFile)) {
      try {
        baselineManifest = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
      } catch (err) {
        console.warn('[api/api-changes] Failed to parse baseline manifest:', err.message);
      }
    }

    const currentSpec = generateOpenApiSpec();
    const currentFingerprints = computeAllRouteFingerprints(cwd);

    const report = detectApiChanges({
      currentSpec,
      baselineManifest,
      currentFingerprints,
      repoRoot: cwd,
    });

    return NextResponse.json(report, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('[api/api-changes] Error evaluating API changes:', err);
    return NextResponse.json(
      { error: 'Failed to compute API change report.' },
      { status: 500 }
    );
  }
}
