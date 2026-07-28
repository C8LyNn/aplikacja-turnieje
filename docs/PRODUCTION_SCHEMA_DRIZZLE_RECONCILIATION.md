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

No new migration is required for these objects. Migrations 0008, 0009 and 0010
must remain unchanged.

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
collide with an index that already existed. Therefore `drizzle-kit push` is not
an approved Production verification or deployment command. The empty-diff
expectation above applies to the targeted semantic reconciliation; any Replit
or future Drizzle preview must still be reviewed and rejected if it proposes
additional DDL.

## Production preflight and one-index cleanup

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
is empty.
