import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'

export const auth = betterAuth({
  // Connect Better Auth to our Neon PostgreSQL via the existing Drizzle client.
  // `usePlural: true` because our table names are plural (users, sessions, etc.)
  // `transaction: false` because Neon HTTP doesn't support transactions.
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: true,
    transaction: false,
  }),

  // Enable email + password sign-up and sign-in.
  // This is the only auth method for now — OAuth can be added later.
  emailAndPassword: {
    enabled: true,
  },

  // Signed with BETTER_AUTH_SECRET — keep this secret, never commit it.
  // Session tokens and cookies are signed with this key.
  secret: process.env.BETTER_AUTH_SECRET!,

  // The public URL of this app — used in email verification links.
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
})

// Export the session type so we can use it throughout the app
export type Session = typeof auth.$Infer.Session
export type UserSession = Session['user']
