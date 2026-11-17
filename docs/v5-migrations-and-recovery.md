# V5 schema migrations (0041, 0042, 0043): procedure and recovery

> **V5.3** adds `0043_league_rules_and_schedule.sql` and renames the confirmation token to
> `apply-0041-0043`, so an operator who approved only 0041/0042 cannot apply 0043 by habit.
> A V5.2 database (0001–0042) has exactly one pending migration: 0043.

All three migrations are additive (new columns with safe defaults, new tables) and idempotent.
0043 also replaces the `matches_result_shape` CHECK with `matches_result_shape_v53`, which is the same rule
except that a `played` result may have no winner when `score1 = score2` (a league draw). Every existing row
already satisfies it (the old rule was stricter); the constraint is validated during the migration.
The API refuses to start on a schema without them (`src/lib/schema-guard.ts`), so the order is:
**snapshot → preflight → apply → start the new API**.

## 1. Snapshot (always first)
```
pg_dump --format=custom --file=before-v5.dump "$DATABASE_URL"
```
or, on the same cluster: `CREATE DATABASE app_before_v5 TEMPLATE app;` (needs no open connections).

## 2. Preflight (read-only, exit code 2 when blocked)
```
DATABASE_URL=... DATABASE_SCHEMA=public pnpm --filter @workspace/db migrate:v5:preflight
```
Reports per migration `applied | absent | partial`, the missing objects and any blocker:
missing baseline tables, a foreign object using a V5 name with another shape, rows that would
violate a new CHECK constraint, missing `players(tournament_id, id)` key.

## 3. Apply (one transaction, all or nothing)
```
DATABASE_URL=... DATABASE_SCHEMA=public V5_MIGRATION_CONFIRM=apply-0041-0043 \
  APP_COMMIT=<sha> DEPLOYMENT_ENVIRONMENT=<env> pnpm --filter @workspace/db migrate:v5
```
Advisory lock, `lock_timeout 10s`, preflight inside the transaction, migration SQL, catalog
verification, row-count comparison of every existing table, markers in `app_schema_migrations`.
Any failure → `ROLLBACK`, nothing changes. Re-running is a verified no-op.

## 4. Verify
Run the preflight again: `"status": "applied"`. Start the API: the log line
`Database schema compatible` lists the verified migrations.

## Recovery
* **Apply failed** – nothing was changed (single transaction). Fix the reported blocker and rerun.
* **API refuses to start** (`SchemaIncompatibleError`) – the schema lacks a migration; run steps 2–3,
  or roll the API back to the previous build (old builds ignore the new columns/tables).
* **Need to undo V5.3 only (0043)** – roll the code back to V5.2 first. Then, only if no stage uses the new
  options and no draw is stored (`SELECT count(*) FROM matches WHERE result_type = 'played' AND winner_id IS NULL`
  and `SELECT count(*) FROM tournament_stages WHERE league_rules IS NOT NULL OR schedule_time_zone IS NOT NULL OR schedule_plan IS NOT NULL` are both 0):
  `ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_result_shape_v53;` then re-add `matches_result_shape`
  from `0001_series_v1_clean_cutover.sql`, and
  `ALTER TABLE tournament_stages DROP CONSTRAINT IF EXISTS tournament_stages_schedule_plan_supported, DROP CONSTRAINT IF EXISTS tournament_stages_schedule_time_zone_shape, DROP CONSTRAINT IF EXISTS tournament_stages_league_rules_supported, DROP COLUMN IF EXISTS schedule_plan, DROP COLUMN IF EXISTS schedule_time_zone, DROP COLUMN IF EXISTS league_rules;`
  `DELETE FROM app_schema_migrations WHERE migration_key = 'v53_league_rules_and_schedule_0043';`
  If draws or league settings exist, keep 0043 in the database: the V5.2 API ignores the new columns, but it
  neither counts a stored draw in the table nor can revert it, and it ranks such leagues by wins again —
  export those tournaments (Backup V3) before rolling the code back.
* **Need to undo V5** – first roll the code back, then (optional, the old API ignores the objects):
  * 0042 (drops rosters only; entries, matches and results stay):
    `DROP TABLE IF EXISTS team_members; DROP TABLE IF EXISTS tournament_teams;`
    `ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_participant_type_supported, DROP CONSTRAINT IF EXISTS tournaments_team_roster_limits, DROP COLUMN IF EXISTS team_roster_max, DROP COLUMN IF EXISTS team_roster_min, DROP COLUMN IF EXISTS participant_type;`
  * 0041 (only if `SELECT count(*) FROM tournament_stages WHERE round_robin_legs = 2` is 0):
    `ALTER TABLE tournament_stages DROP CONSTRAINT IF EXISTS tournament_stages_round_robin_legs_supported, DROP COLUMN IF EXISTS round_robin_legs;`
  * `DELETE FROM app_schema_migrations WHERE migration_key LIKE 'v5_%';`
* **Data damaged** – restore the snapshot from step 1 (`pg_restore --clean --if-exists` or rename the
  template copy back). Export team tournaments first (Backup V3 with `teamRosters`) if they were
  created after the migration.

## Fresh install
The development bootstrap (`development:bootstrap`) applies 0001…N; it no longer assumes exactly
40 files — any contiguous sequence is accepted, and `test:v5-migrations` fails if a migration after
0040 is missing from `src/schema-requirements.mjs` or from the API test schema builder.
