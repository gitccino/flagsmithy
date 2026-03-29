import { db } from '@/lib/db'
import {
  environments,
  flagEnvironmentRules,
  flagEnvironments,
  flags,
  projects,
  type FlagStrategy,
} from '@/lib/db/schema'
import { asc, eq, and, desc, sql } from 'drizzle-orm'
import { redis } from '@/lib/redis'

export const DEFAULT_PROJECT_NAME = 'Default Project'
export const DEFAULT_PROJECT_KEY = 'default'
export const DEFAULT_ENVIRONMENT_KEY = 'development'
export const SYSTEM_ENVIRONMENTS = [
  { key: 'development', name: 'Development' },
  { key: 'staging', name: 'Staging' },
  { key: 'production', name: 'Production' },
] as const

const DEFAULT_STRATEGY: FlagStrategy = { type: 'boolean' }

export type EnvironmentRecord = typeof environments.$inferSelect
export type ProjectRecord = typeof projects.$inferSelect
export type FlagDefinitionRecord = typeof flags.$inferSelect
export type FlagEnvironmentStateRecord = typeof flagEnvironments.$inferSelect

export type AdminFlagRow = FlagDefinitionRecord & {
  environmentId: string
  environmentKey: string
  environmentName: string
  stateId: string | null
  isEnabled: boolean
  strategy: FlagStrategy
}

function coerceStrategy(strategy: unknown): FlagStrategy {
  if (!strategy || typeof strategy !== 'object') {
    return DEFAULT_STRATEGY
  }

  const nextStrategy = strategy as Partial<FlagStrategy>

  if (
    nextStrategy.type === 'percentage' &&
    typeof nextStrategy.value === 'number'
  ) {
    return { type: 'percentage', value: nextStrategy.value }
  }

  return DEFAULT_STRATEGY
}

function toAdminFlagRow(
  flag: FlagDefinitionRecord,
  environment: EnvironmentRecord,
  state?: { id: string; isEnabled: boolean; strategy: unknown } | null,
): AdminFlagRow {
  return {
    ...flag,
    environmentId: environment.id,
    environmentKey: environment.key,
    environmentName: environment.name,
    stateId: state?.id ?? null,
    isEnabled: state?.isEnabled ?? false,
    strategy: coerceStrategy(state?.strategy),
  }
}

export function getFlagCacheKey(environmentKey: string, flagKey: string) {
  return `flag:${environmentKey}:${flagKey}`
}

export async function listProjectEnvironments() {
  return db
    .select({
      id: environments.id,
      projectId: environments.projectId,
      key: environments.key,
      name: environments.name,
      createdAt: environments.createdAt,
      updatedAt: environments.updatedAt,
    })
    .from(environments)
    .innerJoin(projects, eq(environments.projectId, projects.id))
    .where(eq(projects.key, DEFAULT_PROJECT_KEY))
    .orderBy(
      sql`CASE ${environments.key}
        WHEN 'development' THEN 1
        WHEN 'staging' THEN 2
        WHEN 'production' THEN 3
        ELSE 4
      END`,
      asc(environments.name),
    )
}

export async function getEnvironmentContext(requestedKey?: string | null) {
  const availableEnvironments = await listProjectEnvironments()

  if (availableEnvironments.length === 0) {
    throw new Error('No environments found. Run the latest database migration.')
  }

  const activeEnvironment =
    availableEnvironments.find(
      (environment) => environment.key === requestedKey,
    ) ??
    availableEnvironments.find(
      (environment) => environment.key === DEFAULT_ENVIRONMENT_KEY,
    ) ??
    availableEnvironments[0]

  if (!activeEnvironment) throw new Error('No active environment found')

  return {
    environments: availableEnvironments,
    activeEnvironment,
  }
}

export async function listFlagsForEnvironment(environmentKey: string) {
  const { activeEnvironment } = await getEnvironmentContext(environmentKey)

  const rows = await db
    .select({
      flag: flags,
      stateId: flagEnvironments.id,
      stateIsEnabled: flagEnvironments.isEnabled,
      stateStrategy: flagEnvironments.strategy,
    })
    .from(flags)
    .leftJoin(
      flagEnvironments,
      and(
        eq(flagEnvironments.flagId, flags.id),
        eq(flagEnvironments.environmentId, activeEnvironment.id),
      ),
    )
    .where(eq(flags.projectId, activeEnvironment.projectId))
    .orderBy(desc(flags.createdAt))

  return {
    environment: activeEnvironment,
    flags: rows.map((row) => {
      const state = row.stateId
        ? {
            id: row.stateId,
            isEnabled: row.stateIsEnabled ?? false,
            strategy: row.stateStrategy,
          }
        : null

      return toAdminFlagRow(row.flag, activeEnvironment, state)
    }),
  }
}

export async function getFlagForEnvironment(
  flagId: string,
  environmentKey: string,
) {
  const { activeEnvironment } = await getEnvironmentContext(environmentKey)

  const row = await db
    .select({
      flag: flags,
      stateId: flagEnvironments.id,
      stateIsEnabled: flagEnvironments.isEnabled,
      stateStrategy: flagEnvironments.strategy,
    })
    .from(flags)
    .leftJoin(
      flagEnvironments,
      and(
        eq(flagEnvironments.flagId, flags.id),
        eq(flagEnvironments.environmentId, activeEnvironment.id),
      ),
    )
    .where(
      and(
        eq(flags.id, flagId),
        eq(flags.projectId, activeEnvironment.projectId),
      ),
    )
    .limit(1)

  const result = row[0]

  if (!result) {
    return null
  }

  const state = result.stateId
    ? {
        id: result.stateId,
        isEnabled: result.stateIsEnabled ?? false,
        strategy: result.stateStrategy,
      }
    : null

  return toAdminFlagRow(result.flag, activeEnvironment, state)
}

export async function getFlagDefinition(flagId: string) {
  const row = await db.select().from(flags).where(eq(flags.id, flagId)).limit(1)
  return row[0] ?? null
}

/**
 * Looks up the state of a flag in a given environment.
 */
export async function getFlagEnvironmentState(
  flagId: string,
  environmentId: string,
) {
  const rows = await db
    .select()
    .from(flagEnvironments)
    .where(
      and(
        eq(flagEnvironments.flagId, flagId),
        eq(flagEnvironments.environmentId, environmentId),
      ),
    )
    .limit(1)
  return rows[0] ?? null
}

export async function ensureFlagEnvironmentState(
  flagId: string,
  environmentId: string,
) {
  const existingState = await getFlagEnvironmentState(flagId, environmentId)
  if (existingState) return existingState

  // Doesn't exist, create one
  const rows = await db
    .insert(flagEnvironments)
    .values({
      flagId,
      environmentId,
      isEnabled: false,
      strategy: DEFAULT_STRATEGY,
    })
    .returning()

  if (!rows[0]) throw new Error('Failed to create flag environment state')

  return rows[0]
}

export async function invalidateFlagCache(
  environmentKey: string,
  flagKey: string,
) {
  await redis.del(getFlagCacheKey(environmentKey, flagKey))
}

export async function invalidateFlagCachesForSegment(segmentId: string) {
  const rows = await db
    .select({
      flagKey: flags.key,
      environmentKey: environments.key,
    })
    .from(flagEnvironmentRules)
    .innerJoin(
      flagEnvironments,
      eq(flagEnvironmentRules.flagEnvironmentId, flagEnvironments.id),
    )
    .innerJoin(flags, eq(flagEnvironments.flagId, flags.id))
    .innerJoin(
      environments,
      eq(flagEnvironments.environmentId, environments.id),
    )
    .where(eq(flagEnvironmentRules.segmentId, segmentId))

  const cacheKeys = rows.map((row) =>
    getFlagCacheKey(row.environmentKey, row.flagKey),
  )
  if (cacheKeys.length === 0) {
    return
  }

  await redis.del(...cacheKeys)
}

export async function invalidateFlagCachesForFlag(flagId: string) {
  const rows = await db
    .select({
      flagKey: flags.key,
      environmentKey: environments.key,
    })
    .from(flags)
    .leftJoin(flagEnvironments, eq(flagEnvironments.flagId, flags.id))
    .leftJoin(environments, eq(flagEnvironments.environmentId, environments.id))
    .where(eq(flags.id, flagId))

  const keys = rows
    .filter(
      (row): row is { flagKey: string; environmentKey: string } =>
        Boolean(row.flagKey) && Boolean(row.environmentKey),
    )
    .map((row) => getFlagCacheKey(row.environmentKey, row.flagKey))

  if (keys.length === 0) {
    return
  }

  await redis.del(...keys)
}
