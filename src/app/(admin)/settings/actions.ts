'use server'

import { db } from '@/lib/db'
import { apiKeys, environments } from '@/lib/db/schema'
import { generateApiKey, getKeyPrefix, hashApiKey } from '@/lib/api-keys'
import { DEFAULT_ENVIRONMENT_KEY, getEnvironmentContext } from '@/lib/flags'
import { auth, type Session } from '@/lib/auth'
import { headers } from 'next/headers'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import type { ActionResponse } from '@/types'
import { logAuditEventV2 } from '@/lib/audit-logs'
import { AUDIT_ACTIONS } from '@/lib/constants/audit-actions'
import {
  resolveAuditActorContext,
  resolveAuditRequestContext,
} from '@/lib/audit/context'

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return {
      ok: false as const,
      code: 'UNAUTHORIZED',
      message: 'Sign in to continue',
    }
  }
  return session
}

async function getAuditContext(session: Session) {
  const [requestContext] = await Promise.all([resolveAuditRequestContext()])
  const actorContext = resolveAuditActorContext(session)
  return { ...actorContext, ...requestContext }
}

export async function createApiKey(
  formData: FormData,
): Promise<ActionResponse<{ rawKey: string }>> {
  const session = await requireSession()
  if ('ok' in session) return session

  try {
    const auditContext = await getAuditContext(session)
    const name = ((formData.get('name') as string) ?? '').trim()
    const environmentKey = (
      (formData.get('environmentKey') as string) || DEFAULT_ENVIRONMENT_KEY
    ).trim()
    if (!name) return { ok: false, message: 'Name is required' }

    const { activeEnvironment } = await getEnvironmentContext(environmentKey)

    const rawKey = generateApiKey()
    const [key] = await db
      .insert(apiKeys)
      .values({
        environmentId: activeEnvironment.id,
        name,
        keyHash: hashApiKey(rawKey),
        keyPrefix: getKeyPrefix(rawKey),
        createdBy: session.user.id,
      })
      .returning({ id: apiKeys.id })

    if (key) {
      await logAuditEventV2({
        projectId: activeEnvironment.projectId,
        scope: 'environment',
        environmentId: activeEnvironment.id,
        environmentKey: activeEnvironment.key,
        ...auditContext,
        action: AUDIT_ACTIONS.API_KEY_CREATED,
        resourceType: 'api_key',
        resourceId: key.id,
        resourceKey: name,
      })
    }

    revalidatePath('/settings')
    return { ok: true, message: 'API key created', data: { rawKey } }
  } catch {
    return {
      ok: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create API key',
    }
  }
}

export async function deleteApiKey(
  id: string,
  environmentKey = DEFAULT_ENVIRONMENT_KEY,
): Promise<ActionResponse> {
  const session = await requireSession()
  if ('ok' in session) return session

  try {
    const auditContext = await getAuditContext(session)
    const { activeEnvironment } = await getEnvironmentContext(environmentKey)

    // Capture key info before deletion — join to environments to get projectId for audit log.
    // The environmentId check also enforces ownership: you can only delete keys in your active environment.
    const [key] = await db
      .select({ name: apiKeys.name, projectId: environments.projectId })
      .from(apiKeys)
      .innerJoin(environments, eq(apiKeys.environmentId, environments.id))
      .where(
        and(
          eq(apiKeys.id, id),
          eq(apiKeys.environmentId, activeEnvironment.id),
        ),
      )
      .limit(1)

    if (!key)
      return { ok: false, code: 'NOT_FOUND', message: 'API key not found' }

    await db.delete(apiKeys).where(eq(apiKeys.id, id))

    await logAuditEventV2({
      projectId: key.projectId,
      scope: 'environment',
      environmentId: activeEnvironment.id,
      environmentKey: activeEnvironment.key,
      ...auditContext,
      action: AUDIT_ACTIONS.API_KEY_DELETED,
      resourceType: 'api_key',
      resourceId: id,
      resourceKey: key.name,
    })

    revalidatePath('/settings')
    return { ok: true, message: 'API key deleted' }
  } catch {
    return {
      ok: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete API key',
    }
  }
}
