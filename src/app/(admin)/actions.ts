'use server'

import { db } from '@/lib/db'
import {
  flagEnvironmentRules,
  flagEnvironments,
  flags,
  FlagStrategy,
  segmentConditions,
  SegmentConditionValue,
  SegmentOperator,
  segments,
  TraitPrimitive,
} from '@/lib/db/schema'
import {
  DEFAULT_ENVIRONMENT_KEY,
  ensureFlagEnvironmentState,
  getEnvironmentContext,
  getFlagDefinition,
  getFlagEnvironmentState,
  invalidateFlagCache,
  invalidateFlagCachesForFlag,
  invalidateFlagCachesForSegment,
} from '@/lib/flags'
import {
  getRuleById,
  getSegmentById,
  getSegmentForProject,
  SEGMENT_OPERATORS,
} from '@/lib/segments'
import { ActionResponse } from '@/types'
import { eq, not, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import {
  RULE_OUTCOME_TYPES,
  type RuleOutcomeType,
} from '@/lib/constants/rule-outcome'

type ConditionValueType = 'string' | 'number' | 'boolean'

const CONDITION_VALUE_TYPES: ConditionValueType[] = [
  'string',
  'number',
  'boolean',
]

function getStrategyFromFormData(formData: FormData): FlagStrategy {
  const strategyType = formData.get('strategyType') as string
  const rawValue = formData.get('strategyValue')
  const parsedValue =
    typeof rawValue === 'string' && rawValue.length > 0
      ? Number.parseInt(rawValue, 10)
      : undefined

  if (strategyType === 'percentage' && typeof parsedValue === 'number') {
    return {
      type: 'percentage',
      value: Math.min(Math.max(parsedValue, 0), 100),
    }
  }

  return { type: 'boolean' }
}

function getEnvironmentRedirect(environmentKey: string) {
  return `/?environment=${environmentKey}`
}

function getFlagEditRedirect(flagId: string, environmentKey: string) {
  return `/flags/${flagId}/edit?environment=${environmentKey}`
}

function getSegmentEditRedirect(segmentId: string) {
  return `/segments/${segmentId}/edit`
}

function parseTraitPrimitive(
  rawValue: string,
  valueType: ConditionValueType,
): TraitPrimitive | null {
  if (valueType === 'number') {
    const value = Number(rawValue)
    return Number.isNaN(value) ? null : value
  }

  if (valueType === 'boolean') {
    if (rawValue === 'true') {
      return true
    }

    if (rawValue === 'false') {
      return false
    }

    return null
  }

  return rawValue
}

function getSegmentConditionPayload(formData: FormData): {
  attribute: string
  operator: SegmentOperator
  valueJson: SegmentConditionValue
  priority: number
} {
  const attribute = ((formData.get('attribute') as string) || '').trim()
  const operatorCandidate = (formData.get('operator') as string) || 'equals'
  const operator = SEGMENT_OPERATORS.includes(
    operatorCandidate as SegmentOperator,
  )
    ? (operatorCandidate as SegmentOperator)
    : 'equals'
  const valueTypeCandidate = (formData.get('valueType') as string) || 'string'
  const valueType = CONDITION_VALUE_TYPES.includes(
    valueTypeCandidate as ConditionValueType,
  )
    ? (valueTypeCandidate as ConditionValueType)
    : 'string'
  const rawValue = ((formData.get('value') as string) || '').trim()
  const priority = Number.parseInt(
    (formData.get('priority') as string) || '0',
    10,
  )

  if (operator === 'exists' || operator === 'not_exists') {
    return {
      attribute,
      operator,
      valueJson: null,
      priority: Number.isNaN(priority) ? 0 : priority,
    }
  }

  if (operator === 'in' || operator === 'not_in') {
    const valueJson = rawValue
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .map((value) => parseTraitPrimitive(value, valueType))
      .filter((value): value is TraitPrimitive => value !== null)
    return {
      attribute,
      operator,
      valueJson,
      priority: Number.isNaN(priority) ? 0 : priority,
    }
  }

  return {
    attribute,
    operator,
    valueJson: parseTraitPrimitive(rawValue, valueType),
    priority: Number.isNaN(priority) ? 0 : priority,
  }
}

function getRulePayload(formData: FormData): {
  segmentId: string
  priority: number
  outcomeType: RuleOutcomeType
  percentageValue: number | null
} {
  const segmentId = ((formData.get('segmentId') as string) || '').trim()
  const priority = Number.parseInt(
    (formData.get('priority') as string) || '0',
    10,
  )
  const outcomeCandidate =
    (formData.get('outcomeType') as string) || 'enabled_on'
  const outcomeType = RULE_OUTCOME_TYPES.includes(
    outcomeCandidate as RuleOutcomeType,
  )
    ? (outcomeCandidate as RuleOutcomeType)
    : 'enabled_on'
  const rawPercentageValue = (formData.get('percentageValue') as string) || ''
  const parsedPercentageValue =
    rawPercentageValue.length > 0
      ? Number.parseInt(rawPercentageValue, 10)
      : undefined

  return {
    segmentId,
    priority: Number.isNaN(priority) ? 0 : priority,
    outcomeType,
    percentageValue:
      outcomeType === 'percentage' && typeof parsedPercentageValue === 'number'
        ? Math.min(Math.max(parsedPercentageValue, 0), 100)
        : null,
  }
}

export async function createFlag(
  formData: FormData,
): Promise<ActionResponse<{ redirectUrl: string }>> {
  try {
    const key = (formData.get('key') as string).trim()
    const description = (formData.get('description') as string).trim()
    const environmentKey = (
      (formData.get('environmentKey') as string) || DEFAULT_ENVIRONMENT_KEY
    ).trim()
    const { activeEnvironment } = await getEnvironmentContext(environmentKey)

    const [flag] = await db
      .insert(flags)
      .values({
        projectId: activeEnvironment.projectId,
        key,
        description: description || null,
      })
      .returning({
        id: flags.id,
        key: flags.key,
      })

    if (!flag) {
      return { ok: false, message: 'Failed to create flag' }
    }

    await db.insert(flagEnvironments).values({
      flagId: flag.id,
      environmentId: activeEnvironment.id,
      isEnabled: false,
      strategy: { type: 'boolean' },
    })

    revalidatePath('/')
    return {
      ok: true,
      message: 'Flag created',
      data: { redirectUrl: getEnvironmentRedirect(activeEnvironment.key) },
    }
  } catch {
    return {
      ok: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create flag',
    }
  }
}

export async function toggleFlag(
  id: string,
  environmentKey = DEFAULT_ENVIRONMENT_KEY,
): Promise<ActionResponse> {
  try {
    const { activeEnvironment } = await getEnvironmentContext(environmentKey)
    const flag = await getFlagDefinition(id)

    if (!flag) {
      return { ok: false, code: 'NOT_FOUND', message: 'Flag not found' }
    }

    // "Upsert": Try to insert. If it already exists, update 'isEnabled' instead.
    await db
      .insert(flagEnvironments)
      .values({
        flagId: id,
        environmentId: activeEnvironment.id,
        isEnabled: true,
        strategy: { type: 'boolean' },
      })
      .onConflictDoUpdate({
        target: [flagEnvironments.flagId, flagEnvironments.environmentId],
        set: {
          isEnabled: not(flagEnvironments.isEnabled),
          updatedAt: new Date(),
        },
      })

    await invalidateFlagCache(activeEnvironment.id, flag.key)
    revalidatePath('/')
    return { ok: true, message: 'Flag toggled' }
  } catch {
    return {
      ok: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to toggle flag',
    }
  }
}

export async function deleteFlag(id: string): Promise<ActionResponse> {
  try {
    await invalidateFlagCachesForFlag(id)
    await db.delete(flags).where(eq(flags.id, id))

    revalidatePath('/')
    return { ok: true, message: 'Flag deleted' }
  } catch {
    return {
      ok: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete flag',
    }
  }
}

export async function createSegment(
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const name = ((formData.get('name') as string) || '').trim()
    const rawDescription = formData.get('description')
    const description =
      typeof rawDescription === 'string' ? rawDescription.trim() : ''
    const { activeEnvironment } = await getEnvironmentContext(
      DEFAULT_ENVIRONMENT_KEY,
    )

    await db.insert(segments).values({
      name,
      description,
      projectId: activeEnvironment.projectId,
    })

    revalidatePath('/segments')
    return { ok: true, message: 'Segment created' }
  } catch {
    return {
      ok: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create segment',
    }
  }
}

/** Helper function to get a string value from FormData (trimmed)
 */
function getStringFromFormData(formData: FormData, key: string) {
  const rawValue = formData.get(key)
  return typeof rawValue === 'string' ? rawValue.trim() : ''
}

export async function updateSegment(
  segmentId: string,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const segment = await getSegmentById(segmentId)

    if (!segment) {
      return { ok: false, code: 'NOT_FOUND', message: 'Segment not found' }
    }

    const name = getStringFromFormData(formData, 'name')
    const description = getStringFromFormData(formData, 'description')

    await db
      .update(segments)
      .set({
        name,
        description: description || null,
        updatedAt: new Date(),
      })
      .where(eq(segments.id, segmentId))

    await invalidateFlagCachesForSegment(segmentId)
    revalidatePath('/segments')
    revalidatePath(getSegmentEditRedirect(segmentId))
    return { ok: true, message: 'Segment updated' }
  } catch {
    return {
      ok: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update segment',
    }
  }
}

export async function deleteSegment(
  segmentId: string,
): Promise<ActionResponse> {
  try {
    const segment = await getSegmentById(segmentId)

    if (!segment) {
      return { ok: false, code: 'NOT_FOUND', message: 'Segment not found' }
    }

    await invalidateFlagCachesForSegment(segmentId)
    await db.delete(segments).where(eq(segments.id, segmentId))
    revalidatePath('/segments')
    return { ok: true, message: 'Segment deleted' }
  } catch {
    return {
      ok: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete segment',
    }
  }
}

export async function createSegmentCondition(
  segmentId: string,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const segment = await getSegmentById(segmentId)

    if (!segment) {
      return { ok: false, code: 'NOT_FOUND', message: 'Segment not found' }
    }

    const payload = getSegmentConditionPayload(formData)

    await db.insert(segmentConditions).values({ segmentId, ...payload })

    await invalidateFlagCachesForSegment(segmentId)
    revalidatePath('/segments')
    revalidatePath(getSegmentEditRedirect(segmentId))
    return { ok: true, message: 'Condition created' }
  } catch {
    return {
      ok: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create condition',
    }
  }
}

export async function updateSegmentCondition(
  conditionId: string,
  segmentId: string,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const segment = await getSegmentById(segmentId)

    if (!segment) {
      return { ok: false, code: 'NOT_FOUND', message: 'Segment not found' }
    }

    const payload = getSegmentConditionPayload(formData)

    await db
      .update(segmentConditions)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(segmentConditions.id, conditionId),
          eq(segmentConditions.segmentId, segmentId),
        ),
      )

    await invalidateFlagCachesForSegment(segmentId)
    revalidatePath('/segments')
    revalidatePath(getSegmentEditRedirect(segmentId))
    return { ok: true, message: 'Condition updated' }
  } catch {
    return {
      ok: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update condition',
    }
  }
}

export async function deleteSegmentCondition(
  conditionId: string,
  segmentId: string,
): Promise<ActionResponse> {
  try {
    const segment = await getSegmentById(segmentId)

    if (!segment) {
      return { ok: false, code: 'NOT_FOUND', message: 'Segment not found' }
    }

    await db
      .delete(segmentConditions)
      .where(
        and(
          eq(segmentConditions.id, conditionId),
          eq(segmentConditions.segmentId, segmentId),
        ),
      )

    await invalidateFlagCachesForSegment(segmentId)
    revalidatePath('/segments')
    revalidatePath(getSegmentEditRedirect(segmentId))
    return { ok: true, message: 'Condition deleted' }
  } catch {
    return {
      ok: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete condition',
    }
  }
}

export async function createFlagEnvironmentRule(
  flagId: string,
  environmentKey: string,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const { activeEnvironment } = await getEnvironmentContext(environmentKey)
    const flag = await getFlagDefinition(flagId)

    if (!flag || flag.projectId !== activeEnvironment.projectId)
      return {
        ok: false,
        code: 'NOT_FOUND',
        message: 'The selected flag was not found',
      }

    const payload = getRulePayload(formData)
    const segment = await getSegmentForProject(
      payload.segmentId,
      activeEnvironment.projectId,
    )

    if (!segment)
      return {
        ok: false,
        code: 'NOT_FOUND',
        message: 'The selected segment was not found',
      }

    const state = await ensureFlagEnvironmentState(flagId, activeEnvironment.id)

    await db.insert(flagEnvironmentRules).values({
      flagEnvironmentId: state.id,
      segmentId: payload.segmentId,
      priority: payload.priority,
      outcomeType: payload.outcomeType,
      percentageValue: payload.percentageValue,
    })

    await invalidateFlagCache(activeEnvironment.key, flag.key)
    revalidatePath('/')
    revalidatePath(getFlagEditRedirect(flagId, activeEnvironment.key))
    // redirect(getFlagEditRedirect(flagId, activeEnvironment.key))
    return { ok: true, message: 'Rule created' }
  } catch {
    return {
      ok: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create rule',
    }
  }
}

export async function updateFlagEnvironmentRule(
  ruleId: string,
  flagId: string,
  environmentKey: string,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const { activeEnvironment } = await getEnvironmentContext(environmentKey)
    const flag = await getFlagDefinition(flagId)
    const state = await getFlagEnvironmentState(flagId, activeEnvironment.id)
    const existingRule = await getRuleById(ruleId)

    if (
      !flag ||
      !state ||
      !existingRule ||
      existingRule.flagEnvironmentId !== state.id
    )
      return { ok: false, code: 'NOT_FOUND', message: 'Rule not found' }

    const payload = getRulePayload(formData)
    const segment = await getSegmentForProject(
      payload.segmentId,
      activeEnvironment.projectId,
    )

    if (!segment)
      return { ok: false, code: 'NOT_FOUND', message: 'Segment not found' }

    await db
      .update(flagEnvironmentRules)
      .set({
        segmentId: payload.segmentId,
        priority: payload.priority,
        outcomeType: payload.outcomeType,
        percentageValue: payload.percentageValue,
        updatedAt: new Date(),
      })
      .where(eq(flagEnvironmentRules.id, ruleId))

    await invalidateFlagCache(activeEnvironment.key, flag.key)
    revalidatePath('/')
    revalidatePath(getFlagEditRedirect(flagId, activeEnvironment.key))
    // redirect(getFlagEditRedirect(flagId, activeEnvironment.key))

    return { ok: true, message: 'Rule updated' }
  } catch {
    return {
      ok: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update rule',
    }
  }
}

export async function deleteFlagEnvironmentRule(
  ruleId: string,
  flagId: string,
  environmentKey: string,
): Promise<ActionResponse> {
  try {
    const { activeEnvironment } = await getEnvironmentContext(environmentKey)
    const flag = await getFlagDefinition(flagId)
    const state = await getFlagEnvironmentState(flagId, activeEnvironment.id)
    const existingRule = await getRuleById(ruleId)

    if (
      !flag ||
      !state ||
      !existingRule ||
      existingRule.flagEnvironmentId !== state.id
    ) {
      return { ok: false, code: 'NOT_FOUND', message: 'Rule not found ' }
    }

    // Without above validation, caller could potentially delete a rule that should not be acting on
    await db
      .delete(flagEnvironmentRules)
      .where(eq(flagEnvironmentRules.id, ruleId))

    await invalidateFlagCache(activeEnvironment.key, flag.key)
    revalidatePath('/')
    revalidatePath(getFlagEditRedirect(flagId, activeEnvironment.key))
    return { ok: true, message: 'Rule deleted' }
  } catch {
    return {
      ok: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete rule',
    }
  }
}

export async function updateFlag(
  id: string,
  environmentKey: string,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const description = ((formData.get('description') as string) || '').trim()
    const isEnabled = formData.get('isEnabled') === 'on'
    const strategy = getStrategyFromFormData(formData)
    const { activeEnvironment } = await getEnvironmentContext(environmentKey)
    const flag = await getFlagDefinition(id)

    if (!flag) {
      return { ok: false, code: 'NOT_FOUND', message: 'Flag not found' }
    }

    await db
      .update(flags)
      .set({
        description: description || null,
        updatedAt: new Date(),
      })
      .where(eq(flags.id, id))

    await db
      .insert(flagEnvironments)
      .values({
        flagId: id,
        environmentId: activeEnvironment.id,
        isEnabled,
        strategy,
      })
      .onConflictDoUpdate({
        target: [flagEnvironments.flagId, flagEnvironments.environmentId],
        set: {
          isEnabled,
          strategy,
          updatedAt: new Date(),
        },
      })

    await invalidateFlagCache(activeEnvironment.key, flag.key)
    revalidatePath('/')
    revalidatePath(getFlagEditRedirect(id, activeEnvironment.key))
    return { ok: true, message: 'Flag updated' }
  } catch {
    return {
      ok: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update flag',
    }
  }
}

