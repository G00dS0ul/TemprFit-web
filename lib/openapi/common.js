import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

/**
 * Standard flat error envelope:
 * { error: string, details?: any }
 */
export const standardErrorSchema = z
  .object({
    error: z.string().describe('Human-readable error explanation'),
    details: z.any().optional().describe('Optional validation issue details or structured diagnostic context'),
  })
  .passthrough()
  .openapi('StandardError', {
    description: 'Standard flat error envelope returned across all /api/v1 endpoints',
  });

/**
 * Top-level paywall error schema:
 * { error: string, upgrade?: boolean, requiredPlan?: string, details?: any }
 */
export const paywallErrorSchema = z
  .object({
    error: z.string().describe('Paywall or quota limitation message'),
    upgrade: z.boolean().optional().describe('Flag indicating whether account upgrade resolves access'),
    requiredPlan: z.string().optional().describe('Minimum subscription plan tier required (e.g. pro, max)'),
    details: z.any().optional().describe('Optional quota limit metadata'),
  })
  .passthrough()
  .openapi('PaywallError', {
    description: 'Paywall, quota limitation, or feature tier gating error response',
  });

/**
 * Generic simple success confirmation schema
 */
export const successMessageSchema = z
  .object({
    ok: z.boolean().describe('Operation success status'),
    message: z.string().optional().describe('Optional descriptive confirmation message'),
  })
  .passthrough()
  .openapi('SuccessConfirmation', {
    description: 'Generic success confirmation payload',
  });

/**
 * Parameter schema for resource ID path segment: [id] -> {id}
 */
export const idParamSchema = z
  .object({
    id: z.string().describe('Target resource MongoDB ObjectId or identifier string'),
  })
  .openapi('IdPathParameter');

/**
 * Parameter schema for resource slug path segment: [slug] -> {slug}
 */
export const slugParamSchema = z
  .object({
    slug: z.string().describe('URL-safe slug identifier (e.g. barbell-bench-press)'),
  })
  .openapi('SlugPathParameter');
