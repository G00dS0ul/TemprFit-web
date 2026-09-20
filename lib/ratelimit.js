import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Only instantiate Redis if keys are present (to prevent crashes if keys are missing in dev)
let redis = null;
let authRateLimit = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // Limit auth endpoints to 5 requests per minute per IP
  authRateLimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
  });
}

export async function checkAuthRateLimit(identifier) {
  if (!authRateLimit) return { success: true }; // Skip if Upstash is not configured
  const { success, limit, remaining, reset } = await authRateLimit.limit(`auth_${identifier}`);
  return { success, limit, remaining, reset };
}
