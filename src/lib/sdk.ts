import { evaluateFlag } from './evaluation/engine'
import { DEFAULT_ENVIRONMENT_KEY } from './flags'
import { TraitMap } from './segments'

// export async function useFeatureFlag(key: string, userId?: string) {
//   // add logic to log analytics
//   // handle default values if the service is down

//   try {
//     return await evaluateFlag(key, userId)
//   } catch (error) {
//     console.error(`FlagSmithy error for ${key}:`, error)
//     return false // Fail safe
//   }
// }

/**
 * - Rewrite useFeatureFlag
 */
export async function useFeatureFlag(
  key: string,
  options?: { environment?: string; userId?: string; traits?: TraitMap },
) {
  try {
    return await evaluateFlag({
      flagKey: key,
      environmentKey: options?.environment ?? DEFAULT_ENVIRONMENT_KEY,
      userId: options?.userId,
      traits: options?.traits,
    })
  } catch (error) {
    console.error(`FlagSmithy error for ${key}:`, error)
    return false
  }
}
