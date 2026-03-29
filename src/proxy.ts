import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

const PUBLIC_AUTH_PATHS = new Set(['/sign-in', '/sign-up'])

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  console.log(`pathname: ${pathname}, search: ${search}`)
  // console.log(new URL('https://localhost:3000/sign-in'))
  // console.log(new URL('/sign-in', request.url))

  if (PUBLIC_AUTH_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (session) {
    return NextResponse.next()
  }

  const signInUrl = new URL('/sign-in', request.url)
  const callbackUrl = `${pathname}${search}`

  signInUrl.searchParams.set('callbackUrl', callbackUrl)

  return NextResponse.redirect(signInUrl)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)'],
}
