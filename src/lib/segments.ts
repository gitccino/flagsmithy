import { eq, asc, desc, and, inArray } from 'drizzle-orm'
import { db } from './db'
import {
  flagEnvironmentRules,
  segmentConditions,
  SegmentConditionValue,
  segments,
  TraitPrimitive,
} from './db/schema'
import {
  RULE_OUTCOME_TYPES,
  type RuleOutcomeType,
} from './constants/rule-outcome'
export {
  SEGMENT_OPERATORS,
  type SegmentOperator,
} from './constants/segment-operators'
export type TraitMap = Record<string, TraitPrimitive>
export type SegmentRecord = typeof segments.$inferSelect
export type SegmentConditionRecord = typeof segmentConditions.$inferSelect
export type FlagEnvironmentRulesRecord =
  typeof flagEnvironmentRules.$inferSelect

export type SegmentWithConditions = SegmentRecord & {
  conditions: SegmentConditionRecord[]
}

export type FlagEnvironmentRuleWithSegment = FlagEnvironmentRulesRecord & {
  segment: SegmentWithConditions
}

export function isTraitPrimitive(value: unknown): value is TraitPrimitive {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

// Ensures the "traits" used for segmenting users are in the correct format
// Preventing runtime erroes when processing external API requests
export function normalizeTrait(input: unknown): TraitMap | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return undefined
  }

  const entries = Object.entries(input).filter(
    (entry): entry is [string, TraitPrimitive] => isTraitPrimitive(entry[1]),
  )

  return Object.fromEntries(entries)
}

export function normalizeConditionValue(value: unknown): SegmentConditionValue {
  if (value == null) return null

  if (isTraitPrimitive(value)) return value

  if (Array.isArray(value) && value.every(isTraitPrimitive)) return value

  return null
}

function valuesMatch(left: TraitPrimitive, right: TraitPrimitive) {
  return left === right
}

export function matchesCondition(
  condition: Pick<
    SegmentConditionRecord,
    'attribute' | 'operator' | 'valueJson'
  >,
  traits?: TraitMap,
) {
  const normalizedValue = normalizeConditionValue(condition.valueJson)
  const traitValue = traits?.[condition.attribute]

  switch (condition.operator) {
    case 'exists':
      return traitValue !== undefined
    case 'not_exists':
      return traitValue === undefined
    case 'equals':
      return (
        traitValue !== undefined &&
        isTraitPrimitive(normalizedValue) &&
        valuesMatch(traitValue, normalizedValue)
      )
    case 'not_equals':
      return (
        traitValue !== undefined &&
        isTraitPrimitive(normalizedValue) &&
        !valuesMatch(traitValue, normalizedValue)
      )
    case 'in':
      return (
        traitValue !== undefined &&
        Array.isArray(normalizedValue) &&
        normalizedValue.some((value) => valuesMatch(traitValue, value))
      )
    case 'not_in':
      return (
        traitValue !== undefined &&
        Array.isArray(normalizedValue) &&
        !normalizedValue.some((value) => valuesMatch(traitValue, value))
      )
    default:
      return false
  }
}

/**
 * Checks whether a user fits a segment based on their traits.
 */
export function matchesSegment(
  segment: Pick<SegmentWithConditions, 'conditions'>,
  traits?: TraitMap,
) {
  return segment.conditions.every((condition) =>
    matchesCondition(condition, traits),
  )
}

export function evaluateRuleOutcome(
  outcomeType: RuleOutcomeType,
  flagKey: string,
  userId?: string,
  percentageValue?: number | null,
) {
  if (outcomeType === 'enabled_on') {
    return true
  }

  if (outcomeType === 'enabled_off') {
    return false
  }

  if (!userId || typeof percentageValue !== 'number') {
    return false
  }

  return hashString(userId + flagKey) % 100 < percentageValue
}

function hashString(str: string) {
  let hash = 0

  for (let index = 0; index < str.length; index += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash)
}

export async function listSegmentsForProject(
  projectId: string,
): Promise<SegmentWithConditions[]> {
  const rows = await db
    .select()
    .from(segments)
    .where(eq(segments.projectId, projectId))
    .orderBy(asc(segments.name))

  const segmentIds = rows.map((segment) => segment.id)

  if (segmentIds.length === 0) return []

  const conditions = await db
    .select()
    .from(segmentConditions)
    .where(inArray(segmentConditions.segmentId, segmentIds))
    .orderBy(
      asc(segmentConditions.segmentId),
      asc(segmentConditions.priority),
      asc(segmentConditions.createdAt),
    )

  const conditionsBySegmentId = new Map<string, SegmentConditionRecord[]>()

  for (const condition of conditions) {
    const nextConditions = conditionsBySegmentId.get(condition.segmentId) ?? []
    // Sanitizing the data - avoid unexpected data
    nextConditions.push({
      ...condition,
      valueJson: normalizeConditionValue(condition.valueJson),
    })
    conditionsBySegmentId.set(condition.segmentId, nextConditions)
  }

  return rows.map((segment) => ({
    ...segment,
    conditions: conditionsBySegmentId.get(segment.id) ?? [],
  }))
}

// Return segment with conditions
export async function getSegmentById(
  segmentId: string,
): Promise<SegmentWithConditions | null> {
  const [segment] = await db
    .select()
    .from(segments)
    .where(eq(segments.id, segmentId))
    .limit(1)

  if (!segment) return null

  const conditions = await db
    .select()
    .from(segmentConditions)
    .where(eq(segmentConditions.segmentId, segment.id))
    .orderBy(asc(segmentConditions.priority), asc(segmentConditions.createdAt))

  return {
    ...segment,
    conditions: conditions.map((condition) => ({
      ...condition,
      valueJson: normalizeConditionValue(condition.valueJson),
    })),
  }
}

export async function listRulesForFlagEnvironment(flagEnvironmentId: string) {
  const rows = await db
    .select({
      rules: flagEnvironmentRules,
      segment: segments,
    })
    .from(flagEnvironmentRules)
    .innerJoin(segments, eq(flagEnvironmentRules.segmentId, segments.id))
    .where(eq(flagEnvironmentRules.flagEnvironmentId, flagEnvironmentId))
    .orderBy(
      asc(flagEnvironmentRules.priority),
      asc(flagEnvironmentRules.createdAt),
    )

  if (rows.length === 0) return []

  const segmentIds = rows.map((row) => row.segment.id)
  const conditions = await db
    .select()
    .from(segmentConditions)
    .where(inArray(segmentConditions.segmentId, segmentIds))
    .orderBy(
      asc(segmentConditions.segmentId),
      asc(segmentConditions.priority),
      asc(segmentConditions.createdAt),
    )

  const conditionsBySegmentId = new Map<string, SegmentConditionRecord[]>()

  for (const condition of conditions) {
    const nextConditions = conditionsBySegmentId.get(condition.segmentId) ?? []
    nextConditions.push({
      ...condition,
      valueJson: normalizeConditionValue(condition.valueJson),
    })
    conditionsBySegmentId.set(condition.segmentId, nextConditions)
  }

  return rows.map((row) => ({
    ...row.rules,
    segment: {
      ...row.segment,
      conditions: conditionsBySegmentId.get(row.segment.id) ?? [],
    },
  }))
}

export async function getRuleById(ruleId: string) {
  const [row] = await db
    .select({
      rule: flagEnvironmentRules,
      segment: segments,
    })
    .from(flagEnvironmentRules)
    .innerJoin(segments, eq(flagEnvironmentRules.segmentId, segments.id))
    .where(eq(flagEnvironmentRules.id, ruleId))
    .limit(1)

  if (!row) return null

  const segment = await getSegmentById(row.segment.id)

  if (!segment) return null

  return {
    ...row.rule,
    segment,
  }
}

export async function listRulesForSegment(segmentId: string) {
  return await db
    .select()
    .from(flagEnvironmentRules)
    .where(eq(flagEnvironmentRules.segmentId, segmentId))
    .orderBy(
      asc(flagEnvironmentRules.priority),
      asc(flagEnvironmentRules.createdAt),
    )
}

export async function getSegmentForProject(
  segmentId: string,
  projectId: string,
) {
  const [segment] = await db
    .select()
    .from(segments)
    .where(and(eq(segments.id, segmentId), eq(segments.projectId, projectId)))
    .limit(1)

  if (!segment) return null

  return getSegmentById(segment.id)
}

export function formatConditionValue(value: SegmentConditionValue) {
  if (value == null) return ''

  if (Array.isArray(value)) return value.join(', ')

  return String(value)
}

export function inferConditionValueType(value: SegmentConditionValue) {
  if (Array.isArray(value)) {
    if (value.every((entry) => typeof entry === 'number')) return 'number'

    if (value.every((entry) => typeof entry === 'boolean')) return 'boolean'

    return 'string'
  }

  if (typeof value === 'number') return 'number'

  if (typeof value === 'boolean') return 'boolean'

  return 'string'
}
