import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'
import type { AuditAction } from '@/lib/constants/audit-actions'

type LogAuditEventInput = {
  projectId: string
  userId?: string
  action: AuditAction
  resourceType: string
  resourceId: string
  resourceKey?: string
  metadata?: Record<string, unknown>
}

/**
 * Insert one audit log row.
 * Always fire-and-forget from mutations — never let a logging failure
 * block or roll back the actual operation.
 */
export async function logAuditEvent(input: LogAuditEventInput): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      projectId: input.projectId,
      userId: input.userId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      resourceKey: input.resourceKey,
      metadata: input.metadata,
    })
  } catch {
    // Intentionally swallowed — audit logging must never fail a mutation
  }
}
