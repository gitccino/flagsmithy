import { evaluateFlag } from '@/lib/evaluation/engine'
import { validateApiKey } from '@/lib/api-keys'
import { rateLimiter } from '@/lib/rate-limiter'
import { normalizeTrait } from '@/lib/segments'
import { NextRequest, NextResponse } from 'next/server'

/** API endpoints for checking whether a feature flag is enabled
 * -> `GET` - simple and convenient for query-string based checks
 * -> `POST` - better for richer data like traits
 *
 * Both require a valid API key in the Authorization header:
 *   Authorization: Bearer fs_<key>
 *
 * The environment is determined by the API key itself — no need to pass
 * ?environment=... separately. A staging key only evaluates staging flags.
 */

function extractBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice(7)
}

async function authenticate(
  req: NextRequest,
): Promise<
  | { environmentId: string; projectId: string; environmentKey: string }
  | NextResponse
> {
  const token = extractBearerToken(req)
  if (!token) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
  }

  const result = await validateApiKey(token)
  if (!result) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  // Rate limit by projectId — 1 000 requests / minute per project
  const { success } = await rateLimiter.limit(result.projectId)
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  return result
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const auth = await authenticate(req)
  if (auth instanceof NextResponse) return auth

  const userId = req.nextUrl.searchParams.get('userId') || undefined
  const { key } = await params

  const isEnabled = await evaluateFlag({
    flagKey: key,
    environmentKey: auth.environmentKey,
    projectId: auth.projectId,
    ...(userId && { userId }),
  })

  return NextResponse.json(
    { key, isEnabled },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const auth = await authenticate(req)
  if (auth instanceof NextResponse) return auth

  const body = (await req.json().catch(() => null)) as {
    userId?: unknown
    traits?: unknown
  } | null
  const { key } = await params
  const userId = typeof body?.userId === 'string' ? body.userId : undefined
  const traits = normalizeTrait(body?.traits)

  const isEnabled = await evaluateFlag({
    flagKey: key,
    environmentKey: auth.environmentKey,
    projectId: auth.projectId,
    ...(userId && { userId }),
    ...(traits && { traits }),
  })

  return NextResponse.json({ key, environment: auth.environmentKey, isEnabled })
}
