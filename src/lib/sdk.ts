import { evaluateFlag } from "./evaluation/engine";

export async function useFeatureFlag(key: string, userId?: string) {
  // add logic to log analytics
  // handle default values if the service is down

  try {
    return await evaluateFlag(key, userId);
  } catch (error) {
    console.error(`FlagSmithy error for ${key}:`, error);
    return false; // Fail safe
  }
}
