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

## Ownership handoff — completed in Neon test copy

The initial private `pg_restore --no-owner` imported 46 tables under
`transfer_20261012b`. On an isolated child branch named
`qa-owner-handoff-20261012` (Neon branch `br-empty-water-b9ug71tx`)
we validated a safe, complete ownership change. The same transaction was
then executed on the MAIN **Neon test branch only**, using
`scripts/neon-owner-handoff-20261012.sql`:

1. Temporarily assign the TEST database owner to the transfer role through
   Neon API. This lets Neon SQL connect as the role that owns the imported
   objects, without sharing or retrieving a password.
2. In one guarded DO statement, change application schemas, enum types,
   46 tables, sequences, and 18 functions to `pg_database_owner`.
   Associated indexes, TOAST relations, array/composite types and serial
   sequences inherit the new ownership.
3. Restore database ownership to `tournament_manager_owner` using Neon API,
   including if the DO statement fails.
4. Verify owner access and exact 46-table, 5,502-row parity.

**Confirmed on the main Neon test copy:**

| Category | Former transfer role owns | pg_database_owner owns |
| --- | ---: | ---: |
| Relations (tables, indexes, sequences, TOAST) | 0 | 199 |
| Functions | 0 | 18 |
| User-schema types | 0 | 126 |
| Application schemas | 0 | 2 |

The test branch additionally confirmed that
`tournament_manager_owner` could successfully perform an
`ALTER TABLE ... OWNER TO tournament_manager_owner` DDL operation.

A leftover explicit GRANT on the `public` schema for
`transfer_20261012b` was revoked. `pg_shdepend` now records zero
remaining ownership or ACL dependencies for the transfer role on the
test copy. The transfer password was reset earlier, and the old
Replit secret cannot authenticate.

The transfer role still exists but owns **no objects**. Do not delete
it or delete the QA branch without explicit owner confirmation.

## Remaining gates before any production cutover

- Perform an actual nonproduction API/backend smoke test against the Neon
  copy (login/auth, tournaments, matches, brackets, catalog read/write).
- Verify sequence values and correct INSERT/default behavior; matching row
  counts do not by themselves prove application-level correctness.
- Reconcile future schema migration history and deploy versions, since
  the test copy reflects one historical snapshot.
- Confirm backup/rollback, database exposure and handling of personal
  and security-audit information.
- Remove the stale `NEON_MIGRATION_DATABASE_URL` entry from Replit
  Secrets. Do not paste or replace it with a new privileged URI.
- Require an explicit decision before switching the production application's
  `DATABASE_URL` away from Replit.

The production app remains on its existing Replit PostgreSQL connection.
This report contains only structural evidence, counts, and nonsecret
technical identifiers.
