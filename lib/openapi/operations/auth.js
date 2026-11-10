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
    description: 'Clears the temprfit_token and repily_token cookies, adds active Bearer token jti to server-side RevokedToken collection, and terminates session.',
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
        description: 'Logged out successfully',
        content: {
          'application/json': {
            schema: logoutResponseSchema,
          },
        },
      },
    },
  });

  // 5. POST /api/v1/auth/refresh
  registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/refresh',
    summary: 'Rotate and refresh authentication token',
    description: 'Rotates an existing unexpired, unrevoked JWT token. Emits a fresh 30-day token, revokes the previous token, and updates cookie.',
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
        description: 'Invalid, expired, or already revoked token',
        content: {
          'application/json': {
            schema: standardErrorSchema,
          },
        },
      },
    },
  });

  // 6. GET /api/v1/auth/me
  registry.registerPath({
    method: 'get',
    path: '/api/v1/auth/me',
    summary: 'Inspect current authenticated session',
    description: 'Inspects active Bearer header or session cookie. Returns the authenticated user object, or user: null if unauthenticated.',
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
    },
  });
}
