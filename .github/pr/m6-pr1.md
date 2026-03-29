## Summary
Introduce production-grade audit log foundations:
- v2 `audit_logs` schema columns and indexes
- typed audit event contract
- centralized `logAuditEventV2` + context resolver

## Changes
- Add audit columns:
  - `environment_id`, `environment_key`, `scope`, `actor_type`, `actor_id`
  - `request_id`, `ip_address`, `user_agent`, `status`, `changes`
- Add indexes:
  - `(project_id, created_at desc)`
  - `(project_id, environment_key, created_at desc)`
  - `(project_id, action, created_at desc)`
  - `(request_id)`
- Add typed contract + runtime validation (`src/lib/audit/types.ts`)
- Add request/actor context helpers (`src/lib/audit/context.ts`)
- Add `logAuditEventV2` with structured non-blocking failure reporting
- Keep backward compatibility by routing existing `logAuditEvent` through v2

## Out of Scope
- Full mutation migration
- UI filters
- Data backfill

## Checklist
- [x] Migration SQL added
- [x] Typed audit contract added
- [x] v2 logger added
- [x] Legacy wrapper kept for compatibility
