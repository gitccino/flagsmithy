export const AUDIT_ACTIONS = {
  FLAG_CREATED: 'flag.created',
  FLAG_UPDATED: 'flag.updated',
  FLAG_TOGGLED: 'flag.toggled',
  FLAG_DELETED: 'flag.deleted',
  FLAG_RULE_CREATED: 'flag_rule.created',
  FLAG_RULE_UPDATED: 'flag_rule.updated',
  FLAG_RULE_DELETED: 'flag_rule.deleted',
  SEGMENT_CREATED: 'segment.created',
  SEGMENT_UPDATED: 'segment.updated',
  SEGMENT_DELETED: 'segment.deleted',
  SEGMENT_CONDITION_CREATED: 'segment_condition.created',
  SEGMENT_CONDITION_UPDATED: 'segment_condition.updated',
  SEGMENT_CONDITION_DELETED: 'segment_condition.deleted',
  API_KEY_CREATED: 'api_key.created',
  API_KEY_DELETED: 'api_key.deleted',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

// Human-readable labels for the UI
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  'flag.created': 'Created flag',
  'flag.updated': 'Updated flag',
  'flag.toggled': 'Toggled flag',
  'flag.deleted': 'Deleted flag',
  'flag_rule.created': 'Created targeting rule',
  'flag_rule.updated': 'Updated targeting rule',
  'flag_rule.deleted': 'Deleted targeting rule',
  'segment.created': 'Created segment',
  'segment.updated': 'Updated segment',
  'segment.deleted': 'Deleted segment',
  'segment_condition.created': 'Added segment condition',
  'segment_condition.updated': 'Updated segment condition',
  'segment_condition.deleted': 'Deleted segment condition',
  'api_key.created': 'Created API key',
  'api_key.deleted': 'Deleted API key',
}
