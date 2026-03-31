/**
 * Redis client — Upstash Redis (serverless, HTTP-based)
 * Used for:
 *   1. Per-store rate limiting on /api/chat
 *   2. SSE pub/sub for multi-instance token streaming
 *
 * Install: pnpm add @upstash/redis @upstash/ratelimit
 */
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Lazily initialised — will throw at first use if env vars are missing
let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.REDIS_URL;
    const token = process.env.REDIS_TOKEN;
    if (!url || !token) {
      throw new Error(
        "REDIS_URL and REDIS_TOKEN must be set. Get them from upstash.com"
      );
    }
    _redis = new Redis({ url, token });
  }
  return _redis;
}

// ── Rate Limiting ──────────────────────────────────────────────────────────

/** Plan limits: requests per minute */
const PLAN_RATE_LIMITS: Record<string, number> = {
  starter: 10,   // 10 chat msgs / min per store
  growth:  30,
  scale:   100,
};

/**
 * Returns a Ratelimit instance for the given plan.
 * Uses sliding window algorithm for smooth rate limiting.
 */
export function getRateLimiter(plan: string): Ratelimit {
  const rps = PLAN_RATE_LIMITS[plan] ?? 10;
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(rps, "60s"),
    prefix: `delivai:ratelimit`,
    analytics: true,
  });
}

/**
 * Check rate limit for a store.
 * @returns { success: boolean, remaining: number, reset: number }
 */
export async function checkRateLimit(
  storeId: string,
  plan: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const limiter = getRateLimiter(plan);
  const result = await limiter.limit(`store:${storeId}`);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}

// ── SSE Pub/Sub ────────────────────────────────────────────────────────────

const SSE_CHANNEL_PREFIX = "delivai:sse:";

/**
 * Publish a token or event to a conversation SSE channel.
 * Called by the AI agent worker after it receives tokens.
 */
export async function publishSSEEvent(
  conversationId: string,
  event: string
): Promise<void> {
  const redis = getRedis();
  await redis.publish(`${SSE_CHANNEL_PREFIX}${conversationId}`, event);
}

/**
 * Store conversation AI response in Redis for 60s
 * (allows reconnecting SSE clients to catch up).
 */
export async function cacheSSEEvent(
  conversationId: string,
  event: string
): Promise<void> {
  const redis = getRedis();
  const key = `${SSE_CHANNEL_PREFIX}cache:${conversationId}`;
  await redis.rpush(key, event);
  await redis.expire(key, 60); // 60 second TTL
}

/**
 * Get cached SSE events for a conversation (for reconnection).
 */
export async function getCachedSSEEvents(
  conversationId: string
): Promise<string[]> {
  const redis = getRedis();
  const key = `${SSE_CHANNEL_PREFIX}cache:${conversationId}`;
  return (await redis.lrange(key, 0, -1)) as string[];
}

// ── Conversation Usage Tracking ────────────────────────────────────────────

const USAGE_KEY_PREFIX = "delivai:usage:";

/**
 * Increment monthly conversation count for a store.
 * Key expires at end of month automatically.
 */
export async function incrementUsage(storeId: string): Promise<number> {
  const redis = getRedis();
  const now = new Date();
  const key = `${USAGE_KEY_PREFIX}${storeId}:${now.getFullYear()}-${now.getMonth() + 1}`;
  const count = await redis.incr(key);
  // Expire 35 days after first use to cover full month
  if (count === 1) {
    await redis.expire(key, 35 * 24 * 60 * 60);
  }
  return count;
}

/**
 * Get current month usage count for a store.
 */
export async function getMonthlyUsage(storeId: string): Promise<number> {
  const redis = getRedis();
  const now = new Date();
  const key = `${USAGE_KEY_PREFIX}${storeId}:${now.getFullYear()}-${now.getMonth() + 1}`;
  return ((await redis.get<number>(key)) ?? 0);
}
