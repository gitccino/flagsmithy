import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

// Better Auth handles all its own endpoints (sign-in, sign-up, sign-out,
// session, etc.) through a single handler. We just wire it up here.
export const { GET, POST } = toNextJsHandler(auth)
