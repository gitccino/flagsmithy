'use client'

import { createAuthClient } from 'better-auth/react'

// The client-side auth instance.
// Components use this to sign in, sign out, and read the current session.
// It talks to our API route at /api/auth/* — no direct DB access here.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
})

// Named exports for convenience — import only what you need
export const { signIn, signUp, signOut, useSession } = authClient
