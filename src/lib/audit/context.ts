import { headers } from 'next/headers'
import type { Session } from '@/lib/auth'
import type { AuditActorType } from '@/lib/audit/types'

type AuditRequestContext = {
  requestId?: string
  ipAddress?: string
  userAgent?: string
}

type AuditActorContext = {
  actorType: AuditActorType
  actorId?: string
  userId?: string
}

function getHeaderValue(headersList: Headers, key: string): string | undefined {
  const value = headersList.get(key)?.trim()
  return value && value.length > 0 ? value : undefined
}

function getForwardedIp(headersList: Headers): string | undefined {
  const forwardedFor = getHeaderValue(headersList, 'x-forwarded-for')
  if (!forwardedFor) return getHeaderValue(headersList, 'x-real-ip')
  const [first] = forwardedFor.split(',')
  return first?.trim() || undefined
}

export async function resolveAuditRequestContext(
  sourceHeaders?: Headers,
): Promise<AuditRequestContext> {
  try {
    const headersList = sourceHeaders ?? (await headers())
    const requestId =
      getHeaderValue(headersList, 'x-request-id') ??
      getHeaderValue(headersList, 'x-vercel-id')
    const ipAddress = getForwardedIp(headersList)
    const userAgent = getHeaderValue(headersList, 'user-agent')
    const context: AuditRequestContext = {}
    if (requestId) context.requestId = requestId
    if (ipAddress) context.ipAddress = ipAddress
    if (userAgent) context.userAgent = userAgent

    return context
  } catch {
    return {}
  }
}

export function resolveAuditActorContext(
  session?: Session | null,
): AuditActorContext {
  const userId = session?.user.id
  if (!userId) return { actorType: 'system' }
  return { actorType: 'user', actorId: userId, userId }
}
