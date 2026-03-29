import { auth } from '@/lib/auth'
import {
  environments,
  flagEnvironmentRules,
  flagEnvironments,
  flags,
  projects,
  segmentConditions,
  segments,
} from '@/lib/db/schema'
import { AdminFlagRow } from '@/lib/flags'
import {
  FlagEnvironmentRuleWithSegment,
  SegmentWithConditions,
} from '@/lib/segments'

export type SelectProject = typeof projects.$inferSelect
export type SelectEnvironment = typeof environments.$inferSelect
export type SelectFlag = typeof flags.$inferSelect
export type SelectFlagEnvironmentState = typeof flagEnvironments.$inferSelect
export type SelectSegment = typeof segments.$inferSelect
export type SelectSegmentCondition = typeof segmentConditions.$inferSelect
export type SelectFlagEnvironmentRule = typeof flagEnvironmentRules.$inferSelect
export type SelectAdminFlag = AdminFlagRow
export type SelectSegmentWithConditions = SegmentWithConditions
export type SelectFlagEnvironmentRuleWithSegment =
  FlagEnvironmentRuleWithSegment

export type ActionResponse<T = void> =
  | {
      ok: true
      message?: string
      data?: T
    }
  | {
      ok: false
      message: string
      fieldErrors?: Record<string, string[]>
      code?: string
    }
