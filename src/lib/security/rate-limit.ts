import 'server-only';

import { redis } from '@/lib/cache/redis';
import { env } from '@/lib/env';

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export async function rateLimit(
  identifier: string,
  maxRequests = env.RATE_LIMIT_MAX_REQUESTS,
  windowMs = env.RATE_LIMIT_WINDOW_MS,
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zadd(key, now, `${now}`);
  pipeline.zcard(key);
  pipeline.pexpire(key, windowMs);

  const results = await pipeline.exec();
  const count = (results?.[2]?.[1] as number) ?? 0;

  return {
    success: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
    resetAt: now + windowMs,
  };
}
