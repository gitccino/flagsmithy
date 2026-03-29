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

// ─── Auth Tables (Better Auth) ──────────────────────────────────────────────

/** User account — the person who logs in to the admin dashboard */
export const users = pgTable('users', {
  // text, not uuid — Better Auth generates alphanumeric IDs (not UUID format)
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  name: text('name').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/** Active login session — one user can have multiple sessions (different devices) */
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/** Auth provider link — connects a user to an auth method (email/password or OAuth)
 *  The `password` field stores the hashed password for email/password auth.
 *  For OAuth, `providerId` would be 'github', 'google', etc.
 */
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  providerId: text('provider_id').notNull(),
  accountId: text('account_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/** Email verification tokens — used during sign-up to verify email ownership */
export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── API Keys ───────────────────────────────────────────────────────────────

/** A hashed API key used by SDK clients to authenticate against the evaluation API.
 *  The raw key is only shown once at creation — we only store the hash.
 */
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  environmentId: uuid('environment_id')
    .notNull()
    .references(() => environments.id, { onDelete: 'cascade' }),
  // Human-readable label so you know what a key is for (e.g. "Production server")
  name: text('name').notNull(),
  // SHA-256 hash of the actual key — used for lookup on each API request
  keyHash: text('key_hash').notNull().unique(),
  // First ~10 chars of the key for display (e.g. "fs_abc123…")
  keyPrefix: text('key_prefix').notNull(),
  // Which admin user created this key
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  // Updated whenever the key is used to authenticate a request
  lastUsedAt: timestamp('last_used_at'),
})

// ─── Audit Logs ─────────────────────────────────────────────────────────────

/** One row per admin action — who did what to which resource and when.
 *  Used to display the audit trail on the settings page.
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  // The admin user who performed the action (nullable for future system events)
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  // Dot-namespaced action constant, e.g. "flag.created", "segment.deleted"
  action: text('action').notNull(),
  // The type of thing that was acted on: "flag", "segment", "api_key", etc.
  resourceType: text('resource_type').notNull(),
  // The database ID of the resource
  resourceId: text('resource_id').notNull(),
  // Human-readable identifier for display (flag key, segment name, key name…)
  resourceKey: text('resource_key'),
  // Optional extra context stored as JSON (e.g. old/new values, environment)
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Authorization ──────────────────────────────────────────────────────────

/** Connects users to projects with a role.
 *  Right now there's one project, but this prepares for multi-tenancy.
 */
export const projectMembers = pgTable(
  'project_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // A user can only be a member of a project once
    unique('project_members_user_id_project_id_unique').on(
      table.userId,
      table.projectId,
    ),
  ],
)
