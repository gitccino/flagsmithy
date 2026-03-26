import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Load .env.local only when NEXT_PUBLIC_DATABASE_URL isn't already set.
// Next.js populates it automatically in the app runtime; this fallback
// handles scripts running outside Next.js (drizzle-kit, tsx seed.ts).
if (!process.env.NEXT_PUBLIC_DATABASE_URL) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  config({ path: '.env.local' })
}

const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!)
export const db = drizzle(sql, { schema })

// ─── Lazy Proxy (fixes "Cannot read properties of undefined (reading 'isTTY')")
// import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
// import * as schema from './schema'
//
// type DB = NeonHttpDatabase<typeof schema>
// let _db: DB | undefined
//
// function instance(): DB {
//   if (!_db) {
//     _db = drizzle(neon(process.env.NEXT_PUBLIC_DATABASE_URL!), { schema })
//   }
//   return _db
// }
//
// export const db = new Proxy({} as DB, {
//   get(_, prop) {
//     const inst = instance()
//     const val = (inst as unknown as Record<string | symbol, unknown>)[
//       prop as string | symbol
//     ]
//     return typeof val === 'function' ? (val as Function).bind(inst) : val
//   },
// })
