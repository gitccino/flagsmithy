## Summary
Introduce production-grade audit log foundations:
- v2 `audit_logs` schema columns and indexes
- typed audit event contract
- centralized `logAuditEventV2` + context resolver

## Changes
- Add audit columns: `environment_id`, `environment_key`, `scope`, `actor_type`, `actor_id`, `request_id`, `ip_address`, `user_agent`, `status`, `changes`
- Add indexes: `(project_id, created_at desc)`, `(project_id, environment_key, created_at desc)`, `(project_id, action, created_at desc)`, `(request_id)`
- Add typed contract + runtime validation
- Add context resolver helpers
- Keep legacy compatibility for phased rollout

## Out of Scope
- Full mutation migration
- UI filters
- Backfill

## Checklist
- [ ] Migration applies cleanly
- [ ] Logger writes v2 fields
- [ ] Validation rejects invalid payloads
