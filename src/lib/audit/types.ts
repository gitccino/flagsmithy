import { z } from 'zod'
import { AUDIT_ACTIONS, type AuditAction } from '@/lib/constants/audit-actions'

const auditActionValues = Object.values(AUDIT_ACTIONS) as [AuditAction, ...AuditAction[]]

export const AUDIT_SCOPES = ['project', 'environment'] as const
export type AuditScope = (typeof AUDIT_SCOPES)[number]

export const AUDIT_ACTOR_TYPES = ['user', 'system', 'api_key'] as const
export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number]

export const AUDIT_STATUSES = ['success', 'denied', 'failed'] as const
export type AuditStatus = (typeof AUDIT_STATUSES)[number]

export const auditScopeSchema = z.enum(AUDIT_SCOPES)
export const auditActorTypeSchema = z.enum(AUDIT_ACTOR_TYPES)
export const auditStatusSchema = z.enum(AUDIT_STATUSES)

export const auditEventInputSchema = z.object({
  projectId: z.string().min(1),
  environmentId: z.string().min(1).optional(),
  environmentKey: z.string().min(1).optional(),
  scope: auditScopeSchema.default('project'),
  userId: z.string().min(1).optional(),
  actorType: auditActorTypeSchema.default('user'),
  actorId: z.string().min(1).optional(),
  action: z.enum(auditActionValues),
  status: auditStatusSchema.default('success'),
  resourceType: z.string().min(1),
  resourceId: z.string().min(1),
  resourceKey: z.string().min(1).optional(),
  requestId: z.string().min(1).optional(),
  ipAddress: z.string().min(1).optional(),
  userAgent: z.string().min(1).optional(),
  changes: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type AuditEventInput = z.input<typeof auditEventInputSchema>
export type ParsedAuditEventInput = z.output<typeof auditEventInputSchema>
