import { evaluateFlag } from '@/lib/evaluation/engine'
import { DEFAULT_ENVIRONMENT_KEY } from '@/lib/flags'
import { normalizeTrait } from '@/lib/segments'
import { NextRequest, NextResponse } from 'next/server'

/** API endpoints for checking whether a feature flas is enabled
 * -> `GET` - simple and convenient for query-string based checks
 * -> `POST` - better for richer data like traits
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const userId = req.nextUrl.searchParams.get('userId') || undefined
  const environment =
    req.nextUrl.searchParams.get('environment') || DEFAULT_ENVIRONMENT_KEY
  const { key } = await params

  const isEnabled = await evaluateFlag({
    flagKey: key,
    environmentKey: environment,
    ...(userId && { userId }),
  })
  return NextResponse.json({ key, isEnabled })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const body = (await req.json().catch(() => null)) as {
    environment?: unknown
    userId?: unknown
    traits?: unknown
  } | null
  const { key } = await params
  const environment =
    typeof body?.environment === 'string' && body.environment.length > 0
      ? body.environment
      : DEFAULT_ENVIRONMENT_KEY
  const userId = typeof body?.userId === 'string' ? body.userId : undefined
  const traits = normalizeTrait(body?.traits)

  const isEnabled = await evaluateFlag({
    flagKey: key,
    environmentKey: environment,
    ...(userId && { userId }),
    ...(traits && { traits }),
  })

  return NextResponse.json({ key, environment, isEnabled })
}
