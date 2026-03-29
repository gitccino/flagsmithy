import { redis } from '@/lib/redis'
import { db } from '@/lib/db'
import {
  environments,
  flagEnvironments,
  flags,
  FlagStrategy,
} from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { DEFAULT_ENVIRONMENT_KEY, getFlagCacheKey } from '@/lib/flags'
import {
  evaluateRuleOutcome,
  listRulesForFlagEnvironment,
  matchesSegment,
  TraitMap,
} from '../segments'

/**
 * - Rewrite evaluateFlag
 */

type EvaluateFlagInput =
  | string
  | {
      flagKey: string
      environmentKey?: string
      userId?: string
      traits?: TraitMap
      // When called from the evaluation API route, projectId comes from the API key.
      // Scopes the DB query so one project's flags can't bleed into another's.
      projectId?: string
    }

type CachedFlagState = {
  id: string
  isEnabled: boolean
  strategy: FlagStrategy
}

function normalizeStrategy(strategy: unknown): FlagStrategy {
  if (
    strategy &&
    typeof strategy === 'object' &&
    (strategy as { type?: string }).type === 'percentage' &&
    typeof (strategy as { value?: unknown }).value === 'number'
  ) {
    return {
      type: 'percentage',
      value: (strategy as { value: number }).value,
    }
  }

  return { type: 'boolean' }
}

export async function evaluateFlag(
  input: EvaluateFlagInput,
  legacyUserId?: string,
) {
  const payload =
    typeof input === 'string'
      ? {
          flagKey: input,
          environmentKey: DEFAULT_ENVIRONMENT_KEY,
          userId: legacyUserId,
          traits: undefined,
          projectId: undefined,
        }
      : {
          flagKey: input.flagKey,
          environmentKey: input.environmentKey ?? DEFAULT_ENVIRONMENT_KEY,
          userId: input.userId,
          traits: input.traits,
          projectId: input.projectId,
        }
  const cacheKey = getFlagCacheKey(payload.environmentKey, payload.flagKey)
  let flag = await redis.get<CachedFlagState>(cacheKey)

  // Cache not found -> Database
  if (!flag) {
    const result = await db
      .select({
        id: flagEnvironments.id,
        isEnabled: flagEnvironments.isEnabled,
        strategy: flagEnvironments.strategy,
      })
      .from(flags)
      .innerJoin(flagEnvironments, eq(flagEnvironments.flagId, flags.id))
      .innerJoin(
        environments,
        eq(flagEnvironments.environmentId, environments.id),
      )
      .where(
        and(
          eq(flags.key, payload.flagKey),
          eq(environments.key, payload.environmentKey),
          eq(flags.projectId, environments.projectId),
          // When called from the API route, scope to the project that owns the API key
          payload.projectId
            ? eq(environments.projectId, payload.projectId)
            : undefined,
        ),
      )
      .limit(1)

    if (!result[0]) {
      return false
    }

    flag = {
      id: result[0].id,
      isEnabled: result[0].isEnabled,
      strategy: normalizeStrategy(result[0].strategy),
    }

    await redis.set(cacheKey, flag, { ex: 60 })
  }

  const { isEnabled, strategy } = flag

  // 3. Global Kill-switch check
  if (!isEnabled) return false

  // 4. Strategy Logic
  const rules = await listRulesForFlagEnvironment(flag.id)

  for (const rule of rules) {
    if (!matchesSegment(rule.segment, payload.traits)) continue
    return evaluateRuleOutcome(
      rule.outcomeType,
      payload.flagKey,
      payload.userId,
      rule.percentageValue,
    )
  }

  if (strategy.type === 'boolean') return true

  if (strategy.type === 'percentage' && payload.userId) {
    // Deterministic hashing for consistent rollouts
    const hash = await hashString(payload.userId + payload.flagKey)
    return hash % 100 < strategy.value
  }

  return false
}

async function hashString(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}
