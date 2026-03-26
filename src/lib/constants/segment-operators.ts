export const SEGMENT_OPERATORS = [
  'equals',
  'not_equals',
  'in',
  'not_in',
  'exists',
  'not_exists',
] as const

export type SegmentOperator = (typeof SEGMENT_OPERATORS)[number]
