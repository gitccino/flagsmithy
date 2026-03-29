import { Ratelimit } from '@upstash/ratelimit'
import { redis } from '@/lib/redis'

/**
 * Sliding-window rate limiter for the flag evaluation API.
 * Keyed by projectId — 1 000 requests per minute per project.
 * Uses the same Upstash Redis instance as the flag cache.
 */
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '60 s'),
  prefix: 'flagsmithy:ratelimit',
})
