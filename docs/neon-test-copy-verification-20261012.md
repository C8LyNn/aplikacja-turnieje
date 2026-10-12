# Neon test-copy verification — 2026-10-12

Status: **test copy completed; production cutover NOT authorized or performed**.

## Target

- Neon Free: `dawn-union-59334166`, `tournament_manager`, PostgreSQL 16, Frankfurt.
- Source: existing Replit production PostgreSQL 16.
- Transfer: private `pg_dump -Fc` and transactional `pg_restore` via direct Neon endpoint (not the pooler).
- A previous restore failed on the owner-only `COMMENT ON SCHEMA public` and rolled back to 0 target tables. The migration helper now skips both the preexisting `public` schema creation and its COMMENT entry.
- Successful restore was separately verified from Neon SQL and by read-only Replit checks.

## Verified outcomes

| Check | Source | Neon | Result |
| --- | ---: | ---: | --- |
| Application and platform tables | 46 | 46 | PASS |
| Sum of all table rows | 5,502 | 5,502 | PASS |
| Per-table exact COUNT(*) | 46 tables | 46 tables | PASS — 0 differences |
| PostgreSQL constraints | 314 | 314 | PASS |
| Indexes | 125 | 125 | PASS |
| Sequences | 28 | 28 | PASS |
| Noninternal triggers | 17 | 17 | PASS |
| Trigger definitions and enabled state | 17 | 17 | PASS — 0 differences |
| Temporary dump and scripts | n/a | n/a | Removed after restore |

No production write, deployment, database-connection switch or new Steam import was performed during the copy. At snapshot time the catalog's three Steam tables contained zero rows; this copy does **not** populate the game catalog.

## Access cleanup and remaining gate

- Objects imported through `--no-owner` are owned by the transfer role `transfer_20261012b` (46 tables).
- The long-lived `tournament_manager_owner` can perform SELECT, INSERT, UPDATE and DELETE on all 46 tables, confirmed via privilege inspection. **It is not necessarily allowed to ALTER tables that it does not own.**
- The transfer role's password was reset **after** verification. A single read-only authentication test from Replit confirmed that its old `NEON_MIGRATION_DATABASE_URL` value no longer authenticates.
- The transfer role itself was **retained** because it owns the copied objects; do not delete it or cascade-drop objects.
- The user should remove the now-unused `NEON_MIGRATION_DATABASE_URL` from Replit Secrets. No replacement password should be inserted in the application.
- Before any real cutover: design an authorized ownership handoff for tables, sequences, schemas, functions and related objects; verify application-level smoke tests and rollback; separately review handling and retention of personal/session/audit data.
- The production app remains connected to Replit's PostgreSQL database and is unaffected. Do not change its `DATABASE_URL` on the basis of this copy alone.

This report contains counts and nonsecret technical identifiers only. Do not store connection strings or pg_dump archives in the repository.
