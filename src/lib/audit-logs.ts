import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'
import type { AuditAction } from '@/lib/constants/audit-actions'
import {
  type AuditEventInput,
  type ParsedAuditEventInput,
  auditEventInputSchema,
} from '@/lib/audit/types'

type LogAuditEventInput = {
  projectId: string
  userId?: string
  action: AuditAction
  resourceType: string
  resourceId: string
  resourceKey?: string
  metadata?: Record<string, unknown>
}

function getEnvironmentKeyFromMetadata(
  metadata?: Record<string, unknown>,
): string | undefined {
  const candidate = metadata?.environment
  return typeof candidate === 'string' && candidate.length > 0
    ? candidate
    : undefined
}

function normalizeAuditEvent(input: AuditEventInput): ParsedAuditEventInput {
  const parsed = auditEventInputSchema.parse(input)
  if (!parsed.userId && parsed.actorType === 'user' && parsed.actorId) {
    return {
      ...parsed,
      userId: parsed.actorId,
    }
  }
  return parsed
}

function reportAuditWriteFailure(
  error: unknown,
  input: Partial<AuditEventInput>,
) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  console.error('audit_log_write_failed', {
    action: input.action,
    requestId: input.requestId,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    message,
  })
}

export async function logAuditEventV2(input: AuditEventInput): Promise<void> {
  try {
    const event = normalizeAuditEvent(input)
    await db.insert(auditLogs).values({
      projectId: event.projectId,
      environmentId: event.environmentId,
      environmentKey: event.environmentKey,
      scope: event.scope,
      userId: event.userId,
      actorType: event.actorType,
      actorId: event.actorId,
      action: event.action,
      status: event.status,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      resourceKey: event.resourceKey,
      requestId: event.requestId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      changes: event.changes,
      metadata: event.metadata,
    })
  } catch (error) {
    reportAuditWriteFailure(error, input)
  }
}

/**
 * Insert one audit log row.
 * Always fire-and-forget from mutations — never let a logging failure
 * block or roll back the actual operation.
 */
export async function logAuditEvent(input: LogAuditEventInput): Promise<void> {
  const environmentKey = getEnvironmentKeyFromMetadata(input.metadata)
  await logAuditEventV2({
    projectId: input.projectId,
    userId: input.userId,
    actorType: input.userId ? 'user' : 'system',
    actorId: input.userId,
    action: input.action,
    status: 'success',
    scope: environmentKey ? 'environment' : 'project',
    environmentKey,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    resourceKey: input.resourceKey,
    metadata: input.metadata,
  })
}
