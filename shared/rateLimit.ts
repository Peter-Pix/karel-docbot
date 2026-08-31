/**
 * Simple in-memory rate limiter for Vercel serverless functions.
 *
 * ─── DECISION (A5, 2026-08-31) ─────────────────────────────────────────────
 * This in-memory implementation is ACCEPTED for single-user / low-traffic
 * deployments (personal use, internal tooling, demo). It is simple, has zero
 * external dependencies, and works fine when the app is used by one person.
 *
 * For PRODUCTION (multi-user, public launch) this is NOT sufficient:
 * Vercel serverless functions are ephemeral — memory is shared within a
 * single warm instance but resets across cold starts, and concurrent
 * instances do NOT share the `store` Map. That means rate limits can be
 * bypassed (each cold start / instance starts with an empty store) and
 * limits are not globally consistent.
 *
 * → PRODUCTION REQUIREMENT: replace with a persistent, distributed store:
 *   - Vercel KV (Redis)  → https://vercel.com/docs/storage/vercel-kv
 *   - Upstash Redis      → https://upstash.com/docs/redis/overall/getstarted
 *
 * Migration path: swap the `store` Map for a Redis-backed implementation
 * (e.g. `@upstash/redis` or Vercel KV SDK) using the same `checkRateLimit`
 * signature, so API routes (chat.ts, analyze-risks.ts, parse-entity.ts,
 * parse-entity-multi.ts) need no changes. Keep this file as the interface
 * contract; add a `shared/rateLimitRedis.ts` for the production impl.
 * ────────────────────────────────────────────────────────────────────────────
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * Check if a request should be rate limited.
 * 
 * @param identifier - Usually IP address or a combination of IP + endpoint
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Object with { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 30,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup();
  
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Get client IP from Vercel request headers.
 */
export function getClientIP(req: any): string {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}
