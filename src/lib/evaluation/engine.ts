import { redis } from "@/lib/redis";
import { db } from "@/lib/db";
import { flags } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getFlag(key: string, userId?: string) {
  const cacheKey = `flag:${key}`;

  // 1. Try cache
  let flag = await redis.get(cacheKey);

  // 2. Cache not found -> Database
  if (!flag) {
    const result = await db.query.flags.findFirst({
      where: eq(flags.key, key),
    });

    if (!result) return false;
    flag = result;

    await redis.set(cacheKey, JSON.stringify(flag), { ex: 60 });
  }

  const { isEnabled, strategy } = flag as any;

  // 3. Global Kill-switch check
  if (!isEnabled) return false;

  // 4. Strategy Logic
  if (strategy.type === "boolean") return true;

  if (strategy.type === "percentage" && userId) {
    // Deterministic hashing for consistent rollouts
    const hash = await hashString(userId + key);
    return hash % 100 < strategy.value;
  }
}

async function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
