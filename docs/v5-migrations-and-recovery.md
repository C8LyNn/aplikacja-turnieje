# V5 schema migrations (0041–0047): procedure and recovery

> **V5.10** adds `0047_two_leg_ties.sql`: three new tables for two-legged knockout ties — `match_legs` (both legs
> of a tie: own date, score in the tie's orientation, revision), `match_tie_decisions` (the organizer's winner and
> public reason for a level aggregate) and `match_tie_history` (legs and decisions, recorded/reverted). The
> `tournament_stages_match_rules_supported` CHECK is replaced in place by one that keeps every V5.7 `sets`
> condition and adds `{ "kind": "two_legs", "levelAggregate": "organizer_decision" }` (best of 1); the separate
> `tournament_stages_two_legs_supported` CHECK allows that kind only in a `single_elimination` stage without
> league rules. The token becomes `apply-0041-0047`. A V5.7–V5.9.1 database (0001–0046) has exactly one pending
> migration: 0047. No existing row is rewritten; old stages keep `match_rules` as they were and get no legs.
>
> **V5.7** adds `0046_match_set_rules.sql`: `tournament_stages.match_rules` (set-based match rules, NULL keeps
> the old meaning of a stage), `matches.set_scores` and `result_history.set_scores` (per-set scores, NULL for
> every existing match — old results never get invented sets). The match revision trigger now also counts
> set scores. The token becomes `apply-0041-0046`. A V5.5/V5.6 database (0001–0045) has exactly one pending
> migration: 0046. No existing row is rewritten; the CHECK constraints are validated during the migration
> (every existing row has NULL in the new columns, so it passes).
>
> **V5.5** adds `0045_stage_point_adjustments.sql` (`tournament_stages.point_adjustments`: bonus/penalty audit
> entries, only on stages with league rules) and renames the token to `apply-0041-0045`.
> A V5.4 database (0001–0044) has exactly one pending migration: 0045. No existing row is rewritten.
>
> **V5.4** adds `0044_participant_fields.sql` (participant field definitions on `tournaments`, values on
> `players`; both nullable JSON objects with size limits) and renames the token to `apply-0041-0044`.
> A V5.3 database (0001–0043) has exactly one pending migration: 0044. No existing row is rewritten.
>
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
DATABASE_URL=... DATABASE_SCHEMA=public V5_MIGRATION_CONFIRM=apply-0041-0047 \
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
* **Need to undo V5.10 only (0047)** – roll the code back to V5.9.1 first. The V5.9.1 API does not know the
  `two_legs` kind: it would read such a stage as having no rules and treat each tie as a single game (its stored
  aggregate would no longer validate) — finish or export (Backup V3 keeps legs, decisions and history) every
  tournament that uses it first: `SELECT count(*) FROM tournament_stages WHERE match_rules->>'kind' = 'two_legs'`.
  To remove 0047 (only when that count is 0; legs, decisions and history are lost):
  `DROP TABLE IF EXISTS match_tie_history; DROP TABLE IF EXISTS match_tie_decisions; DROP TABLE IF EXISTS match_legs;`
  `ALTER TABLE tournament_stages DROP CONSTRAINT IF EXISTS tournament_stages_two_legs_supported;`
  re-create `tournament_stages_match_rules_supported` with the 0046 definition and
  `DELETE FROM app_schema_migrations WHERE migration_key = 'v510_two_leg_ties_0047';`
* **Need to undo V5.7 only (0046)** – roll the code back to V5.6 first. The V5.6 API ignores the new columns,
  but it would treat a set stage as a plain series (no set validation, no set columns), and the database refuses
  its revert of a result that has sets (the CHECK keeps sets only on completed results) — finish or export
  such tournaments first (Backup V3 keeps rules and sets): `SELECT count(*) FROM tournament_stages WHERE match_rules IS NOT NULL`.
  To remove 0046 (rules and set scores are lost):
  `ALTER TABLE result_history DROP CONSTRAINT IF EXISTS result_history_set_scores_shape, DROP COLUMN IF EXISTS set_scores;`
  `ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_set_scores_shape, DROP COLUMN IF EXISTS set_scores;`
  `ALTER TABLE tournament_stages DROP CONSTRAINT IF EXISTS tournament_stages_match_rules_supported, DROP COLUMN IF EXISTS match_rules;`
  then recreate `increment_match_revision()` from `0028_match_revision.sql` (the trigger itself stays) and
  `DELETE FROM app_schema_migrations WHERE migration_key = 'v57_match_set_rules_0046';`
* **Need to undo V5.5 only (0045)** – roll the code back to V5.4 first. The V5.4 API ignores the column, so it
  can stay — but it then ranks tables **without** the adjustments (places shown would differ from what V5.5
  showed; completed stages keep their stored places). To remove it (adjustments are lost — export tournaments
  that use them with Backup V3 first; `SELECT count(*) FROM tournament_stages WHERE point_adjustments IS NOT NULL`):
  `ALTER TABLE tournament_stages DROP CONSTRAINT IF EXISTS tournament_stages_point_adjustments_supported, DROP COLUMN IF EXISTS point_adjustments;`
  `DELETE FROM app_schema_migrations WHERE migration_key = 'v55_stage_point_adjustments_0045';`
* **Need to undo V5.4 only (0044)** – roll the code back to V5.3 first. The V5.3 API ignores both columns, so
  0044 can stay. To remove it (extra participant data is lost — export tournaments that use it with Backup V3
  first; `SELECT count(*) FROM tournaments WHERE participant_fields IS NOT NULL`):
  `ALTER TABLE players DROP CONSTRAINT IF EXISTS players_custom_fields_shape, DROP COLUMN IF EXISTS custom_fields;`
  `ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_participant_fields_shape, DROP COLUMN IF EXISTS participant_fields;`
  `DELETE FROM app_schema_migrations WHERE migration_key = 'v54_participant_fields_0044';`
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
