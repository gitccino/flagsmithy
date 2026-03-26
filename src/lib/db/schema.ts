import { table } from 'console'
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import type { RuleOutcomeType } from '@/lib/constants/rule-outcome'
import type { SegmentOperator } from '@/lib/constants/segment-operators'

/**
 * New Flag system model
 * - Add Project and Environment models
 */

// Primitive - the most basic, fundamental data type
export type TraitPrimitive = string | number | boolean
export type SegmentConditionValue = TraitPrimitive | TraitPrimitive[] | null
export type FlagStrategy =
  | { type: 'boolean' }
  | { type: 'percentage'; value: number }
export type { SegmentOperator }

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const environments = pgTable(
  'environments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    /** Scoped or composite uniqueness - unique per parent, not globally unique
     * - You can't have two envs both named `staging`
     *  */
    unique('environments_project_id_key_unique').on(table.projectId, table.key),
  ],
)

export const flags = pgTable(
  'flags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // In the same projectId, flag must be unique
    unique('flags_project_id_key_unique').on(table.projectId, table.key),
  ],
)

// Enable single flag with different settings per env
export const flagEnvironments = pgTable(
  'flag_environments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    flagId: uuid('flag_id')
      .notNull()
      .references(() => flags.id, { onDelete: 'cascade' }),
    environmentId: uuid('environment_id')
      .notNull()
      .references(() => environments.id, { onDelete: 'cascade' }),
    isEnabled: boolean('is_enabled').notNull().default(false),
    strategy: jsonb('strategy').$type<FlagStrategy>().notNull().default({
      type: 'boolean',
    }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // In the same flagId, env must be unique
    unique('flag_environments_flag_id_environment_id_unique').on(
      table.flagId,
      table.environmentId,
    ),
  ],
)

/** Reusable group of users
 * - Users in Thailand
 * - Users on Pro plan
 * - Users using app version 2.3+
 */
export const segments = pgTable(
  'segments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }), // Automatic cleanup behavior
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // Composite unique constraint
    // Inside a single project, can't have two segments with the same name
    unique('segments_project_id_name_unique').on(table.projectId, table.name),
  ],
)

/** Segment Condition
 * - One rule inside a segment
 */
export const segmentConditions = pgTable('segment_conditions', {
  id: uuid('id').primaryKey().defaultRandom(),
  segmentId: uuid('segment_id')
    .notNull()
    .references(() => segments.id, { onDelete: 'cascade' }),
  // Attribute - trait name to inspect from the caller context e.g., plan or country
  attribute: text('attribute').notNull(),
  // Operator - comparison to apply against the trait e.g, equals or not_equals
  operator: text('operator').$type<SegmentOperator>().notNull(),
  valueJson: jsonb('value_json').$type<SegmentConditionValue>().notNull(),
  priority: integer('priority').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/** Flag Environment Rules
 * - Connects flag in a specific environment to a segment,
 *    and define what to do if that segment matched
 */
export const flagEnvironmentRules = pgTable(
  'flag_environment_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    flagEnvironmentId: uuid('flag_environment_id')
      .notNull()
      .references(() => flagEnvironments.id, { onDelete: 'cascade' }),
    segmentId: uuid('segment_id')
      .notNull()
      .references(() => segments.id, { onDelete: 'cascade' }),
    priority: integer().notNull().default(0),
    outcomeType: text('outcome_type').$type<RuleOutcomeType>().notNull(),
    percentageValue: integer('percentage_value'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // No 2 rules can have the same priority number
    unique('flag_environment_rules_flag_environment_id_priority_unique').on(
      table.flagEnvironmentId,
      table.priority,
    ),
    unique('flag_environment_rules_flag_environment_id_segment_id_unique').on(
      table.flagEnvironmentId,
      table.segmentId,
    ),
  ],
)
