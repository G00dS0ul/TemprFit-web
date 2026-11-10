import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { generateOpenApiSpec } from '@/lib/openapi/generator';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // In local development or when explicitly enabled in staging
    const specPath = path.resolve(process.cwd(), 'contracts/openapi/openapi-spec.json');

    let spec;
    if (fs.existsSync(specPath)) {
      spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    } else {
      spec = generateOpenApiSpec();
    }

    return NextResponse.json(spec, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('[api/openapi] Error serving OpenAPI specification:', err);
    return NextResponse.json(
      { error: 'Failed to generate OpenAPI specification.' },
      { status: 500 }
    );
  }
}
