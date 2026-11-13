import { z } from 'zod';
import {
  loginRequestSchema,
  loginResponseSchema,
  refreshRequestSchema,
  refreshResponseSchema,
  logoutRequestSchema,
  logoutResponseSchema,
  meResponseSchema,
} from '../../contracts/v1/auth.js';
import {
  registerRequestSchema,
  registerResponseSchema,
  googleAuthRequestSchema,
  googleAuthResponseSchema,
} from '../../contracts/v1/user.js';
import { standardErrorSchema } from '../common.js';

export function registerAuthOperations(registry) {
  // 1. POST /api/v1/auth/login
  registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/login',
    summary: 'Authenticate with email and password',
    description: 'Validates athlete credentials against bcrypt hash, sets 30-day temprfit_token cookie, and returns Bearer JWT token and safe user payload.',
    tags: ['Auth'],
    security: [],
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: loginRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Login successful; token and user returned',
        content: {
          'application/json': {
            schema: loginResponseSchema,
          },
        },
      },
      400: {
        description: 'Missing or malformed email/password payload',
        content: {
          'application/json': {
            schema: standardErrorSchema,
          },
        },
      },
      401: {
        description: 'Invalid email or password',
        content: {
          'application/json': {
            schema: standardErrorSchema,
          },
        },
      },
      403: {
        description: 'User account suspended or banned',
        content: {
          'application/json': {
            schema: standardErrorSchema,
          },
        },
      },
      429: {
        description: 'Too many login attempts; rate limit exceeded',
        content: {
          'application/json': {
            schema: standardErrorSchema,
          },
        },
      },
    },
  });

  // 2. POST /api/v1/auth/register
  registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/register',
    summary: 'Register new athlete account',
    description: 'Provisions a new user profile with free plan tier, hashes password, sets session cookie, and returns Bearer JWT.',
    tags: ['Auth'],
    security: [],
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: registerRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Account registered successfully',
        content: {
          'application/json': {
            schema: registerResponseSchema,
          },
        },
      },
      400: {
        description: 'Validation failed or email/username already taken',
        content: {
          'application/json': {
            schema: standardErrorSchema,
          },
        },
      },
      429: {
        description: 'Registration rate limit exceeded',
        content: {
          'application/json': {
            schema: standardErrorSchema,
          },
        },
      },
    },
  });

  // 3. POST /api/v1/auth/google
  registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/google',
    summary: 'Google OAuth Single Sign-On',
    description: 'Verifies client-provided Google ID token, finds or provisions account with Google profile info, and issues Bearer JWT session.',
    tags: ['Auth'],
    security: [],
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: googleAuthRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Google authentication successful',
        content: {
          'application/json': {
            schema: googleAuthResponseSchema,
          },
        },
      },
      400: {
        description: 'Missing or invalid Google ID token',
        content: {
          'application/json': {
            schema: standardErrorSchema,
          },
        },
      },
      401: {
        description: 'Google token verification rejected by auth service',
        content: {
          'application/json': {
            schema: standardErrorSchema,
          },
        },
      },
    },
  });

  // 4. POST /api/v1/auth/logout
  registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/logout',
    summary: 'Log out and invalidate session',
    description: 'Selects a nonempty token from JSON body > Bearer header > temprfit_token > repily_token, without falling through an invalid selected token. Missing, invalid, expired or already-revoked tokens return 200 without adding or extending records. An active token requires an acknowledged atomic hash-only revocation with its original expiry. Both 200 and required-storage 503 clear temprfit_token, repily_token and admin_token cookies; cookie removal does not prove server invalidation or revoke unselected credentials. Logout using a predecessor after refresh does not cancel the successor.',
    tags: ['Auth'],
    security: [{ BearerAuth: [] }, { CookieAuth: [] }, {}],
    request: {
      body: {
        required: false,
        content: {
          'application/json': {
            schema: logoutRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Local cookies cleared; active selected token acknowledged revoked, or harmless/repeated logout',
        content: {
          'application/json': {
            schema: logoutResponseSchema,
          },
        },
      },
      400: {
        description: 'Invalid request body; cookies are not cleared',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      500: {
        description: 'Unexpected or response-contract failure',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      503: {
        description: 'Required revocation storage unavailable or write outcome unknown; cookies cleared without claiming server invalidation',
        content: { 'application/json': {
          schema: standardErrorSchema,
          example: { error: 'Authentication service temporarily unavailable.' },
        } },
      },
    },
  });

  // 5. POST /api/v1/auth/refresh
  registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/refresh',
    summary: 'Rotate and refresh authentication token',
    description: 'Selects a nonempty token from JSON body > Bearer header > temprfit_token > repily_token, without falling through an invalid selected token. Requires an unexpired, unrevoked JWT and active user. Prepares and validates a fresh 30-day successor before the atomic predecessor claim, but releases the token and primary cookie only to the single acknowledged winner. Replay or concurrent loser returns 401; required-storage failure or unknown write outcome returns 503 with no replacement token/cookie. Logout claiming first prevents issuance; refresh claiming first leaves its successor unaffected by old-token logout. A committed-but-lost response or post-claim failure may require sign-in again: there is no successor recovery or compensating claim deletion.',
    tags: ['Auth'],
    security: [{ BearerAuth: [] }, { CookieAuth: [] }],
    request: {
      body: {
        required: false,
        content: {
          'application/json': {
            schema: refreshRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Token refreshed successfully',
        content: {
          'application/json': {
            schema: refreshResponseSchema,
          },
        },
      },
      401: {
        description: 'Missing, invalid, expired, already revoked or concurrent losing token; missing or suspended user',
        content: {
          'application/json': {
            schema: standardErrorSchema,
          },
        },
      },
      400: {
        description: 'Invalid request body',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      500: {
        description: 'Unexpected signing, user-model, response or contract failure; a post-claim failure may require sign-in',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      503: {
        description: 'Required revocation storage unavailable or write outcome unknown; no replacement token or cookie',
        content: { 'application/json': {
          schema: standardErrorSchema,
          example: { error: 'Authentication service temporarily unavailable.' },
        } },
      },
    },
  });

  // 6. GET /api/v1/auth/me
  registry.registerPath({
    method: 'get',
    path: '/api/v1/auth/me',
    summary: 'Inspect current authenticated session',
    description: 'Selects a nonempty Bearer header > temprfit_token > repily_token, without falling through an invalid selected token. Returns the authenticated user with originalRole, or user: null for missing, invalid, expired, known-revoked, missing-user or banned-user sessions. A valid-session required revocation storage failure returns 503, not user: null or 401. Other shared/legacy auth consumers retain their existing outage behavior.',
    tags: ['Auth'],
    security: [{ BearerAuth: [] }, { CookieAuth: [] }, {}],
    responses: {
      200: {
        description: 'Current session user object (or null)',
        content: {
          'application/json': {
            schema: meResponseSchema,
          },
        },
      },
      500: {
        description: 'Unexpected user-model, subscription or response-contract failure',
        content: { 'application/json': { schema: standardErrorSchema } },
      },
      503: {
        description: 'Required revocation storage unavailable; no authenticated user data returned',
        content: { 'application/json': {
          schema: standardErrorSchema,
          example: { error: 'Authentication service temporarily unavailable.' },
        } },
      },
    },
  });
}
