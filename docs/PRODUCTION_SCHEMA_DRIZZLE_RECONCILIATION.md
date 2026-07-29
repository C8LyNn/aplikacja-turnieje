# Production schema: Drizzle reconciliation

This note covers one narrow drift between the authoritative Drizzle schema and
the already-correct Production schema. It does not apply migrations, change
data, or replace the forward-only migration history.

## Required objects

The authoritative schema declares the following existing Production objects:

- `tournament_stages_winner_same_stage_fk`;
- `action_log_match_same_tournament_stage_fk`;
- `action_log_stage_same_tournament_fk`;
- `app_schema_migrations`.

Migrations remain the source of truth for `DEFERRABLE INITIALLY DEFERRED`,
which Drizzle Kit 0.31 does not serialize. PostgreSQL's column-specific
`ON DELETE SET NULL` syntax is retained in the Drizzle export through the full
action string, although the current public Drizzle ORM TypeScript union exposes
only the unqualified `set null` value. Integration tests verify both advanced
attributes directly from `pg_constraint`.

Migrations 0008, 0009 and 0010 must remain unchanged. Forward-only migration
`0011_reconcile_replit_schema_catalog.sql` reconciles later Development and
Production catalog drift without redefining those historical migrations.

## Canonical Replit catalog after 0011

Migration `0011` requires the following exact catalog definitions:

- `tournament_stages_tournament_id_id_unique` as
  `UNIQUE (tournament_id, id)`;
- `stage_groups_stage_id_id_unique` as `UNIQUE (stage_id, id)`;
- `stage_participants_tournament_id_id_unique` as
  `UNIQUE (tournament_id, id)`;
- `matches_tournament_stage_id_id_unique` as
  `UNIQUE (tournament_id, stage_id, id)`;
- `stage_participants_stage_seed_unique` as
  `UNIQUE (stage_id, stage_seed) DEFERRABLE INITIALLY DEFERRED`;
- `matches_stage_round_number_unique` as
  `UNIQUE (stage_id, round, match_number)`;
- `matches_id_stage_id_unique` as `UNIQUE (id, stage_id)`;
- `result_history_match_same_stage_fk` as
  `FOREIGN KEY (match_id, stage_id) REFERENCES matches(id, stage_id)`
  with `ON UPDATE NO ACTION`, `ON DELETE NO ACTION` and `NOT DEFERRABLE`;
- `result_history_match_same_tournament_stage_fk` remains
  `FOREIGN KEY (tournament_id, stage_id, match_id) REFERENCES
  matches(tournament_id, stage_id, id) ON DELETE CASCADE`;
- the complete `auth_credential_rate_limits` table, primary key and both
  supporting indexes from migration `0010`.

The migration reuses valid standalone indexes with `UNIQUE USING INDEX`,
rebuilds only the two constraints whose order or deferrability is wrong, and
rebuilds the legacy same-stage history FK before removing the proven redundant
`matches_stage_id_id_unique`. It enumerates every `pg_constraint.conindid`
dependency of that object and aborts on an unknown FK. It preserves all rows,
uses no `CASCADE`, validates exact postconditions before commit and is safe to
rerun.

## Read-only Development/Production comparison

Before Republish, supply the URLs only to the current process:

```text
SCHEMA_COMPARE_DEVELOPMENT_DATABASE_URL=<development URL>
SCHEMA_COMPARE_PRODUCTION_DATABASE_URL=<production URL>
SCHEMA_COMPARE_EXPECTED_DEVELOPMENT_DATABASE_NAME=<development database>
SCHEMA_COMPARE_EXPECTED_PRODUCTION_DATABASE_NAME=<production database>
SCHEMA_COMPARE_EXPECTED_SCHEMA=public
pnpm --filter @workspace/db run schema:compare:pre-republish
```

The command has no fallback to `DATABASE_URL` or
`DEVELOPMENT_DATABASE_URL`. Both inspections use
`REPEATABLE READ READ ONLY` transactions. A successful report contains
`safe: true`, `equivalent: true`, no catalog problems and
`transactionReadOnly: "on"` for both targets. It never reports a connection
string or credential.

An unsafe report is a hard stop. Apply reviewed migration `0011` through the
controlled forward-only SQL path, then rerun this comparison. Do not use
`drizzle-kit push` to repair either catalog.

## Expected schema diff

Before removing the redundant index, the only expected statement is:

```sql
DROP INDEX "public"."matches_stage_id_id_unique";
```

After removing that index, the expected schema diff is empty. In particular,
the diff must not drop any required foreign key or
`public.app_schema_migrations`.

Stop if any additional DDL is proposed.

The repository currently pins Drizzle Kit 0.31.10. Its PostgreSQL `push`
introspector has a separate false-positive problem for migration-created
composite foreign keys and their supporting unique indexes: a local
Production-shaped fixture caused it to propose drop/recreate cycles and then
collide with an index that already existed.

Filtering only `app_schema_migrations`, `tournament_stages` and `action_log`
with `tablesFilter` is not safe in this version. A Production-shaped fixture
still produced drop/recreate cycles for related composite keys and proposed
dropping the serial sequences of excluded tables. The application therefore
does not use a partial table filter.

Instead, `lib/db/drizzle.config.ts` scopes the automatic Replit/Drizzle push to
the built-in `information_schema` namespace and to a table pattern that matches
no table. `lib/db/replit-push-schema.ts` contains only the matching empty
namespace declaration. The complete runtime model remains in
`lib/db/src/schema/index.ts`.

This uses the officially supported `schemaFilter` and `tablesFilter`
configuration surfaces and produces an empty Drizzle push for the complete
Production-shaped catalog both before and after the guarded redundant-index
cleanup. It does not generate or post-process SQL.

Consequently, Drizzle push manages **no application object in `public`**.
Every future change to application tables, constraints, indexes, enums,
functions or triggers must be delivered by a reviewed forward-only SQL
migration, its guarded deployment runner and PostgreSQL catalog tests. The
schema-diff integration test must be rerun before changing Drizzle Kit or this
filter configuration.

## Production preflight and one-index cleanup

This block is retained only for auditing the pre-0011 case where the duplicate
is a standalone index with no dependent FK. Once migration `0011` is
available, do not run this as a separate schema change: `0011` also
canonicalizes known dependent FKs before the guarded removal. The block below
intentionally refuses the real Development state where a constraint owns the
index or a foreign key depends on it.

Run this only in the Production Database SQL console after independently
confirming that the selected database and schema are correct. The transaction
checks the canonical constraint and the redundant index before changing
anything. It never uses `CASCADE` and does not modify table data.

```sql
BEGIN;

DO $reconcile_redundant_matches_index$
DECLARE
  canonical_index_oid oid;
  redundant_index_oid oid;
  actual_columns text[];
BEGIN
  SELECT constraint_row.conindid
  INTO canonical_index_oid
  FROM pg_constraint constraint_row
  JOIN pg_class table_row
    ON table_row.oid = constraint_row.conrelid
  JOIN pg_namespace namespace_row
    ON namespace_row.oid = table_row.relnamespace
  JOIN pg_index index_row
    ON index_row.indexrelid = constraint_row.conindid
  WHERE namespace_row.nspname = 'public'
    AND table_row.relname = 'matches'
    AND constraint_row.conname = 'matches_id_stage_id_unique'
    AND constraint_row.contype = 'u'
    AND constraint_row.convalidated
    AND index_row.indisunique
    AND index_row.indisvalid
    AND index_row.indisready
    AND index_row.indpred IS NULL
    AND index_row.indexprs IS NULL;

  IF canonical_index_oid IS NULL THEN
    RAISE EXCEPTION
      'Required canonical constraint public.matches_id_stage_id_unique is missing or invalid';
  END IF;

  SELECT array_agg(attribute_row.attname ORDER BY key_column.position)
  INTO actual_columns
  FROM pg_index index_row
  CROSS JOIN LATERAL unnest(index_row.indkey::smallint[])
    WITH ORDINALITY AS key_column(attribute_number, position)
  JOIN pg_attribute attribute_row
    ON attribute_row.attrelid = index_row.indrelid
   AND attribute_row.attnum = key_column.attribute_number
  WHERE index_row.indexrelid = canonical_index_oid
    AND key_column.position <= index_row.indnkeyatts;

  IF actual_columns IS DISTINCT FROM ARRAY['id', 'stage_id']::text[] THEN
    RAISE EXCEPTION
      'Canonical constraint has unexpected columns: %',
      actual_columns;
  END IF;

  redundant_index_oid :=
    to_regclass('public.matches_stage_id_id_unique')::oid;

  IF redundant_index_oid IS NULL THEN
    RAISE NOTICE 'Redundant index is already absent; no change made';
    RETURN;
  END IF;

  SELECT array_agg(attribute_row.attname ORDER BY key_column.position)
  INTO actual_columns
  FROM pg_index index_row
  JOIN pg_class table_row
    ON table_row.oid = index_row.indrelid
  JOIN pg_namespace namespace_row
    ON namespace_row.oid = table_row.relnamespace
  CROSS JOIN LATERAL unnest(index_row.indkey::smallint[])
    WITH ORDINALITY AS key_column(attribute_number, position)
  JOIN pg_attribute attribute_row
    ON attribute_row.attrelid = index_row.indrelid
   AND attribute_row.attnum = key_column.attribute_number
  WHERE index_row.indexrelid = redundant_index_oid
    AND namespace_row.nspname = 'public'
    AND table_row.relname = 'matches'
    AND index_row.indisunique
    AND index_row.indisvalid
    AND index_row.indisready
    AND index_row.indpred IS NULL
    AND index_row.indexprs IS NULL
    AND key_column.position <= index_row.indnkeyatts
  GROUP BY index_row.indexrelid;

  IF actual_columns IS DISTINCT FROM ARRAY['stage_id', 'id']::text[] THEN
    RAISE EXCEPTION
      'Refusing cleanup: public.matches_stage_id_id_unique has unexpected definition';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint constraint_row
    WHERE constraint_row.conindid = redundant_index_oid
  ) THEN
    RAISE EXCEPTION
      'Refusing cleanup: public.matches_stage_id_id_unique owns a constraint';
  END IF;

  EXECUTE 'DROP INDEX public.matches_stage_id_id_unique';
END;
$reconcile_redundant_matches_index$;

COMMIT;
```

If the command reports an error, do not add `CASCADE` and do not retry after
weakening the guards. Roll back, capture the exact catalog state, and review it
before any further action.

After success, verify that
`to_regclass('public.matches_stage_id_id_unique')` is `NULL`, the canonical
`matches_id_stage_id_unique` constraint remains validated, and the schema diff
is empty. The automatic Replit/Drizzle push ignores the duplicate both before
and after cleanup; the targeted catalog check above is the authority for this
one manual cleanup.
