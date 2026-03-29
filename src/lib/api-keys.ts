import { createHash, randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { apiKeys, environments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// All Flagsmithy API keys start with this prefix so they're recognisable
const KEY_PREFIX = 'fs_'

// How many random bytes to generate — 24 bytes → 48 hex chars
const KEY_RANDOM_BYTES = 24

/**
 * Generate a new raw API key.
 * The caller must store the hash (via hashApiKey), never the raw value.
 * The raw value is shown to the user exactly once.
 */
export function generateApiKey(): string {
  const random = randomBytes(KEY_RANDOM_BYTES).toString('hex')
  return `${KEY_PREFIX}${random}`
}

/**
 * SHA-256 hash of a raw API key.
 * This is what gets stored in the database and compared on every request.
 */
export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex')
}

/**
 * The display prefix shown in the UI (e.g. "fs_a1b2c3d4…").
 * Long enough to be identifiable, short enough to be safe.
 */
export function getKeyPrefix(rawKey: string): string {
  return `${rawKey.slice(0, 12)}…`
}

/**
 * Validate an incoming API key from a request.
 * Hashes the raw key, looks it up, joins to the environment, and returns
 * { environmentId, projectId, environmentKey } so the caller knows which
 * environment (and project) the key belongs to without a second query.
 * Returns null if the key doesn't exist.
 */
export async function validateApiKey(
  rawKey: string,
): Promise<{ environmentId: string; projectId: string; environmentKey: string } | null> {
  const hash = hashApiKey(rawKey)

  const [row] = await db
    .select({
      id: apiKeys.id,
      environmentId: environments.id,
      projectId: environments.projectId,
      environmentKey: environments.key,
    })
    .from(apiKeys)
    .innerJoin(environments, eq(apiKeys.environmentId, environments.id))
    .where(eq(apiKeys.keyHash, hash))
    .limit(1)

  if (!row) return null

  // Fire-and-forget — we don't need to await this for the response
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.id))
    .catch(() => {
      // lastUsedAt is best-effort; don't fail the request if this errors
    })

  return {
    environmentId: row.environmentId,
    projectId: row.projectId,
    environmentKey: row.environmentKey,
  }
}
