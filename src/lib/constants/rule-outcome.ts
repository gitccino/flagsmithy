export const RULE_OUTCOME_TYPES = [
  'enabled_on',
  'enabled_off',
  'percentage',
] as const

export type RuleOutcomeType = (typeof RULE_OUTCOME_TYPES)[number]
