ALTER TABLE "audit_logs"
  ADD COLUMN IF NOT EXISTS "environment_id" uuid REFERENCES "environments"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "environment_key" text,
  ADD COLUMN IF NOT EXISTS "scope" text DEFAULT 'project' NOT NULL,
  ADD COLUMN IF NOT EXISTS "actor_type" text DEFAULT 'user' NOT NULL,
  ADD COLUMN IF NOT EXISTS "actor_id" text,
  ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'success' NOT NULL,
  ADD COLUMN IF NOT EXISTS "request_id" text,
  ADD COLUMN IF NOT EXISTS "ip_address" text,
  ADD COLUMN IF NOT EXISTS "user_agent" text,
  ADD COLUMN IF NOT EXISTS "changes" jsonb;

CREATE INDEX IF NOT EXISTS "audit_logs_project_id_created_at_idx"
  ON "audit_logs" ("project_id", "created_at");

CREATE INDEX IF NOT EXISTS "audit_logs_project_id_environment_key_created_at_idx"
  ON "audit_logs" ("project_id", "environment_key", "created_at");

CREATE INDEX IF NOT EXISTS "audit_logs_project_id_action_created_at_idx"
  ON "audit_logs" ("project_id", "action", "created_at");

CREATE INDEX IF NOT EXISTS "audit_logs_request_id_idx"
  ON "audit_logs" ("request_id");
