-- Reconcile the two observed Replit catalogs with the forward-only schema
-- authority established by migrations 0001-0010.
--
-- This migration changes catalog ownership/ordering only. It does not delete
-- application rows, weaken constraints, or use CASCADE.

-- migration-runner-strip-begin
BEGIN;
-- migration-runner-strip-end

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '5min';
SELECT pg_advisory_xact_lock(841730029);

DO $schema_catalog_prerequisites$
DECLARE
  required_table TEXT;
  required_column RECORD;
  rate_limit_columns TEXT[];
  expected_rate_limit_columns CONSTANT TEXT[] := ARRAY[
    'scope_type:text:true',
    'tournament_id:integer:true',
    'credential_type:text:true',
    'source_fingerprint:text:true',
    'window_started_at:timestamp with time zone:true',
    'failure_count:integer:true',
    'blocked_until:timestamp with time zone:false',
    'last_updated_at:timestamp with time zone:true'
  ];
  required_constraint JSONB;
  actual_constraint_definition TEXT;
BEGIN
  FOREACH required_table IN ARRAY ARRAY[
    'tournament_stages',
    'stage_groups',
    'stage_participants',
    'matches'
  ] LOOP
    IF to_regclass(format('public.%I', required_table)) IS NULL THEN
      RAISE EXCEPTION
        '0011_reconcile_replit_schema_catalog requires table public.%',
        required_table;
    END IF;
  END LOOP;

  FOR required_column IN
    SELECT *
    FROM (VALUES
      ('tournament_stages', 'id'),
      ('tournament_stages', 'tournament_id'),
      ('stage_groups', 'id'),
      ('stage_groups', 'stage_id'),
      ('stage_participants', 'id'),
      ('stage_participants', 'tournament_id'),
      ('stage_participants', 'stage_id'),
      ('stage_participants', 'stage_seed'),
      ('matches', 'id'),
      ('matches', 'tournament_id'),
      ('matches', 'stage_id'),
      ('matches', 'round'),
      ('matches', 'match_number'),
      ('matches', 'next_match_id')
    ) AS required(table_name, column_name)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns column_row
      WHERE column_row.table_schema = current_schema()
        AND column_row.table_name = required_column.table_name
        AND column_row.column_name = required_column.column_name
    ) THEN
      RAISE EXCEPTION
        '0011_reconcile_replit_schema_catalog requires column public.%.%',
        required_column.table_name,
        required_column.column_name;
    END IF;
  END LOOP;

  IF to_regclass('public.auth_credential_rate_limits') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_class table_row
      JOIN pg_namespace namespace_row
        ON namespace_row.oid = table_row.relnamespace
      WHERE namespace_row.nspname = current_schema()
        AND table_row.relname = 'auth_credential_rate_limits'
        AND table_row.relkind IN ('r', 'p')
    ) THEN
      RAISE EXCEPTION
        'public.auth_credential_rate_limits exists but is not a table';
    END IF;

    SELECT array_agg(
      format(
        '%s:%s:%s',
        attribute_row.attname,
        format_type(attribute_row.atttypid, attribute_row.atttypmod),
        attribute_row.attnotnull::TEXT
      )
      ORDER BY attribute_row.attnum
    )
    INTO rate_limit_columns
    FROM pg_attribute attribute_row
    WHERE attribute_row.attrelid =
      'public.auth_credential_rate_limits'::regclass
      AND attribute_row.attnum > 0
      AND NOT attribute_row.attisdropped;

    IF rate_limit_columns IS DISTINCT FROM expected_rate_limit_columns THEN
      RAISE EXCEPTION
        'public.auth_credential_rate_limits has an incompatible column shape';
    END IF;

    FOR required_constraint IN
      SELECT value
      FROM jsonb_array_elements($constraints$[
        {
          "name": "auth_credential_rate_limits_scope_pk",
          "definition": "PRIMARY KEY (scope_type, tournament_id, credential_type, source_fingerprint)"
        },
        {
          "name": "auth_credential_rate_limits_scope_type_check",
          "definition": "CHECK (scope_type = ANY (ARRAY['tournament'::text, 'source'::text]))"
        },
        {
          "name": "auth_credential_rate_limits_credential_type_check",
          "definition": "CHECK (credential_type = ANY (ARRAY['organizer'::text, 'viewer'::text, 'support'::text, 'legacy_upgrade'::text]))"
        },
        {
          "name": "auth_credential_rate_limits_tournament_id_check",
          "definition": "CHECK (tournament_id > 0)"
        },
        {
          "name": "auth_credential_rate_limits_failure_count_check",
          "definition": "CHECK (failure_count >= 0)"
        },
        {
          "name": "auth_credential_rate_limits_source_fingerprint_check",
          "definition": "CHECK (length(source_fingerprint) >= 1 AND length(source_fingerprint) <= 128)"
        }
      ]$constraints$::JSONB)
    LOOP
      SELECT pg_get_constraintdef(constraint_row.oid, TRUE)
      INTO actual_constraint_definition
      FROM pg_constraint constraint_row
      WHERE constraint_row.conrelid =
        'public.auth_credential_rate_limits'::regclass
        AND constraint_row.conname = required_constraint ->> 'name'
        AND constraint_row.convalidated;

      IF NOT FOUND
        OR actual_constraint_definition IS DISTINCT FROM
          required_constraint ->> 'definition'
      THEN
        RAISE EXCEPTION
          'public.auth_credential_rate_limits has missing or incompatible constraint %',
          required_constraint ->> 'name';
      END IF;
    END LOOP;
  END IF;
END;
$schema_catalog_prerequisites$;

CREATE TABLE IF NOT EXISTS public.auth_credential_rate_limits (
  scope_type TEXT NOT NULL,
  tournament_id INTEGER NOT NULL,
  credential_type TEXT NOT NULL,
  source_fingerprint TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL,
  failure_count INTEGER NOT NULL DEFAULT 0,
  blocked_until TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT auth_credential_rate_limits_scope_pk PRIMARY KEY (
    scope_type,
    tournament_id,
    credential_type,
    source_fingerprint
  ),
  CONSTRAINT auth_credential_rate_limits_scope_type_check
    CHECK (scope_type IN ('tournament', 'source')),
  CONSTRAINT auth_credential_rate_limits_credential_type_check
    CHECK (credential_type IN ('organizer', 'viewer', 'support', 'legacy_upgrade')),
  CONSTRAINT auth_credential_rate_limits_tournament_id_check
    CHECK (tournament_id > 0),
  CONSTRAINT auth_credential_rate_limits_failure_count_check
    CHECK (failure_count >= 0),
  CONSTRAINT auth_credential_rate_limits_source_fingerprint_check
    CHECK (length(source_fingerprint) BETWEEN 1 AND 128)
);

CREATE INDEX IF NOT EXISTS auth_credential_rate_limits_cleanup_idx
  ON public.auth_credential_rate_limits (last_updated_at);

CREATE INDEX IF NOT EXISTS auth_credential_rate_limits_blocked_idx
  ON public.auth_credential_rate_limits (blocked_until);

DO $reference_unique_constraints$
DECLARE
  requirement JSONB;
  expected_columns TEXT[];
  actual_columns TEXT[];
  index_oid OID;
  index_table TEXT;
  index_is_unique BOOLEAN;
  index_is_valid BOOLEAN;
  index_is_ready BOOLEAN;
  index_is_partial BOOLEAN;
  index_has_expressions BOOLEAN;
  owner_constraint TEXT;
  column_list TEXT;
BEGIN
  FOR requirement IN
    SELECT value
    FROM jsonb_array_elements($requirements$[
      {
        "table": "tournament_stages",
        "name": "tournament_stages_tournament_id_id_unique",
        "columns": ["tournament_id", "id"]
      },
      {
        "table": "stage_groups",
        "name": "stage_groups_stage_id_id_unique",
        "columns": ["stage_id", "id"]
      },
      {
        "table": "stage_participants",
        "name": "stage_participants_tournament_id_id_unique",
        "columns": ["tournament_id", "id"]
      },
      {
        "table": "matches",
        "name": "matches_tournament_stage_id_id_unique",
        "columns": ["tournament_id", "stage_id", "id"]
      }
    ]$requirements$::JSONB)
  LOOP
    expected_columns := ARRAY(
      SELECT jsonb_array_elements_text(requirement -> 'columns')
    );

    SELECT ARRAY(
      SELECT attribute_row.attname::TEXT
      FROM unnest(constraint_row.conkey) WITH ORDINALITY
        AS key_column(attribute_number, position)
      JOIN pg_attribute attribute_row
        ON attribute_row.attrelid = constraint_row.conrelid
       AND attribute_row.attnum = key_column.attribute_number
      ORDER BY key_column.position
    )
    INTO actual_columns
    FROM pg_constraint constraint_row
    JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
    JOIN pg_namespace namespace_row
      ON namespace_row.oid = table_row.relnamespace
    WHERE namespace_row.nspname = current_schema()
      AND table_row.relname = requirement ->> 'table'
      AND constraint_row.conname = requirement ->> 'name'
      AND constraint_row.contype = 'u'
      AND NOT constraint_row.condeferrable
      AND NOT constraint_row.condeferred
      AND constraint_row.convalidated;

    IF FOUND THEN
      IF actual_columns IS DISTINCT FROM expected_columns THEN
        RAISE EXCEPTION
          'constraint public.%.% has columns %, expected %',
          requirement ->> 'table',
          requirement ->> 'name',
          actual_columns,
          expected_columns;
      END IF;
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_constraint constraint_row
      JOIN pg_namespace namespace_row
        ON namespace_row.oid = constraint_row.connamespace
      WHERE namespace_row.nspname = current_schema()
        AND constraint_row.conname = requirement ->> 'name'
    ) THEN
      RAISE EXCEPTION
        'constraint public.% has an incompatible owner, type or attributes',
        requirement ->> 'name';
    END IF;

    SELECT
      index_row.indexrelid,
      indexed_table.relname,
      index_row.indisunique,
      index_row.indisvalid,
      index_row.indisready,
      index_row.indpred IS NOT NULL,
      index_row.indexprs IS NOT NULL,
      ARRAY(
        SELECT attribute_row.attname::TEXT
        FROM unnest(index_row.indkey::SMALLINT[]) WITH ORDINALITY
          AS index_column(attribute_number, position)
        JOIN pg_attribute attribute_row
          ON attribute_row.attrelid = index_row.indrelid
         AND attribute_row.attnum = index_column.attribute_number
        WHERE index_column.position <= index_row.indnkeyatts
        ORDER BY index_column.position
      )
    INTO
      index_oid,
      index_table,
      index_is_unique,
      index_is_valid,
      index_is_ready,
      index_is_partial,
      index_has_expressions,
      actual_columns
    FROM pg_class index_class
    JOIN pg_namespace namespace_row
      ON namespace_row.oid = index_class.relnamespace
    LEFT JOIN pg_index index_row ON index_row.indexrelid = index_class.oid
    LEFT JOIN pg_class indexed_table ON indexed_table.oid = index_row.indrelid
    WHERE namespace_row.nspname = current_schema()
      AND index_class.relname = requirement ->> 'name';

    IF NOT FOUND THEN
      SELECT string_agg(format('%I', column_name), ', ')
      INTO column_list
      FROM unnest(expected_columns) AS column_name;

      EXECUTE format(
        'CREATE UNIQUE INDEX %I ON public.%I (%s)',
        requirement ->> 'name',
        requirement ->> 'table',
        column_list
      );
    ELSE
      IF index_table IS DISTINCT FROM requirement ->> 'table'
        OR NOT COALESCE(index_is_unique, FALSE)
        OR NOT COALESCE(index_is_valid, FALSE)
        OR NOT COALESCE(index_is_ready, FALSE)
        OR COALESCE(index_is_partial, TRUE)
        OR COALESCE(index_has_expressions, TRUE)
        OR actual_columns IS DISTINCT FROM expected_columns
      THEN
        RAISE EXCEPTION
          'index public.% is incompatible with canonical UNIQUE constraint on public.% (%)',
          requirement ->> 'name',
          requirement ->> 'table',
          array_to_string(expected_columns, ', ');
      END IF;

      SELECT constraint_row.conname
      INTO owner_constraint
      FROM pg_constraint constraint_row
      WHERE constraint_row.conindid = index_oid
        AND constraint_row.contype IN ('u', 'p');

      IF owner_constraint IS NOT NULL THEN
        RAISE EXCEPTION
          'index public.% is already owned by constraint %',
          requirement ->> 'name',
          owner_constraint;
      END IF;
    END IF;

    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I UNIQUE USING INDEX %I NOT DEFERRABLE',
      requirement ->> 'table',
      requirement ->> 'name',
      requirement ->> 'name'
    );
  END LOOP;
END;
$reference_unique_constraints$;

DO $ordered_unique_constraints$
DECLARE
  requirement JSONB;
  expected_columns TEXT[];
  actual_columns TEXT[];
  sorted_expected_columns TEXT[];
  sorted_actual_columns TEXT[];
  constraint_oid OID;
  index_oid OID;
  actual_table TEXT;
  actual_deferrable BOOLEAN;
  actual_deferred BOOLEAN;
  actual_validated BOOLEAN;
  index_table TEXT;
  index_is_unique BOOLEAN;
  index_is_valid BOOLEAN;
  index_is_ready BOOLEAN;
  index_is_partial BOOLEAN;
  index_has_expressions BOOLEAN;
  owner_constraint TEXT;
  dependent_constraint TEXT;
  temporary_index_name TEXT;
  column_list TEXT;
  deferrability_clause TEXT;
BEGIN
  FOR requirement IN
    SELECT value
    FROM jsonb_array_elements($requirements$[
      {
        "table": "stage_participants",
        "name": "stage_participants_stage_seed_unique",
        "columns": ["stage_id", "stage_seed"],
        "deferrable": true,
        "initiallyDeferred": true
      },
      {
        "table": "matches",
        "name": "matches_stage_round_number_unique",
        "columns": ["stage_id", "round", "match_number"],
        "deferrable": false,
        "initiallyDeferred": false
      }
    ]$requirements$::JSONB)
  LOOP
    expected_columns := ARRAY(
      SELECT jsonb_array_elements_text(requirement -> 'columns')
    );
    SELECT array_agg(column_name ORDER BY column_name)
    INTO sorted_expected_columns
    FROM unnest(expected_columns) AS column_name;

    SELECT
      constraint_row.oid,
      constraint_row.conindid,
      table_row.relname,
      constraint_row.condeferrable,
      constraint_row.condeferred,
      constraint_row.convalidated,
      ARRAY(
        SELECT attribute_row.attname::TEXT
        FROM unnest(constraint_row.conkey) WITH ORDINALITY
          AS key_column(attribute_number, position)
        JOIN pg_attribute attribute_row
          ON attribute_row.attrelid = constraint_row.conrelid
         AND attribute_row.attnum = key_column.attribute_number
        ORDER BY key_column.position
      )
    INTO
      constraint_oid,
      index_oid,
      actual_table,
      actual_deferrable,
      actual_deferred,
      actual_validated,
      actual_columns
    FROM pg_constraint constraint_row
    JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
    JOIN pg_namespace namespace_row
      ON namespace_row.oid = table_row.relnamespace
    WHERE namespace_row.nspname = current_schema()
      AND constraint_row.conname = requirement ->> 'name'
      AND constraint_row.contype = 'u';

    IF FOUND THEN
      IF actual_table IS DISTINCT FROM requirement ->> 'table'
        OR NOT COALESCE(actual_validated, FALSE)
      THEN
        RAISE EXCEPTION
          'constraint public.% has an incompatible owner or validation state',
          requirement ->> 'name';
      END IF;

      IF actual_columns = expected_columns
        AND actual_deferrable =
          COALESCE((requirement ->> 'deferrable')::BOOLEAN, FALSE)
        AND actual_deferred =
          COALESCE((requirement ->> 'initiallyDeferred')::BOOLEAN, FALSE)
      THEN
        CONTINUE;
      END IF;

      SELECT array_agg(column_name ORDER BY column_name)
      INTO sorted_actual_columns
      FROM unnest(actual_columns) AS column_name;

      IF sorted_actual_columns IS DISTINCT FROM sorted_expected_columns THEN
        RAISE EXCEPTION
          'constraint public.% protects columns %, expected the same set as %',
          requirement ->> 'name',
          actual_columns,
          expected_columns;
      END IF;

      SELECT constraint_row.conname
      INTO dependent_constraint
      FROM pg_constraint constraint_row
      WHERE constraint_row.contype = 'f'
        AND constraint_row.conindid = index_oid
      LIMIT 1;

      IF dependent_constraint IS NOT NULL THEN
        RAISE EXCEPTION
          'refusing to rebuild public.% because FK % depends on it',
          requirement ->> 'name',
          dependent_constraint;
      END IF;

      temporary_index_name :=
        (requirement ->> 'name') || '_0011_idx';
      IF to_regclass(format('public.%I', temporary_index_name)) IS NOT NULL THEN
        RAISE EXCEPTION
          'temporary reconciliation index public.% already exists',
          temporary_index_name;
      END IF;

      SELECT string_agg(format('%I', column_name), ', ')
      INTO column_list
      FROM unnest(expected_columns) AS column_name;

      EXECUTE format(
        'CREATE UNIQUE INDEX %I ON public.%I (%s)',
        temporary_index_name,
        requirement ->> 'table',
        column_list
      );
      EXECUTE format(
        'ALTER TABLE public.%I DROP CONSTRAINT %I',
        requirement ->> 'table',
        requirement ->> 'name'
      );

      deferrability_clause := CASE
        WHEN COALESCE((requirement ->> 'deferrable')::BOOLEAN, FALSE)
          THEN 'DEFERRABLE INITIALLY DEFERRED'
        ELSE 'NOT DEFERRABLE'
      END;
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I UNIQUE USING INDEX %I %s',
        requirement ->> 'table',
        requirement ->> 'name',
        temporary_index_name,
        deferrability_clause
      );
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_constraint constraint_row
      JOIN pg_namespace namespace_row
        ON namespace_row.oid = constraint_row.connamespace
      WHERE namespace_row.nspname = current_schema()
        AND constraint_row.conname = requirement ->> 'name'
    ) THEN
      RAISE EXCEPTION
        'constraint public.% exists with the wrong type',
        requirement ->> 'name';
    END IF;

    SELECT
      index_row.indexrelid,
      indexed_table.relname,
      index_row.indisunique,
      index_row.indisvalid,
      index_row.indisready,
      index_row.indpred IS NOT NULL,
      index_row.indexprs IS NOT NULL,
      ARRAY(
        SELECT attribute_row.attname::TEXT
        FROM unnest(index_row.indkey::SMALLINT[]) WITH ORDINALITY
          AS index_column(attribute_number, position)
        JOIN pg_attribute attribute_row
          ON attribute_row.attrelid = index_row.indrelid
         AND attribute_row.attnum = index_column.attribute_number
        WHERE index_column.position <= index_row.indnkeyatts
        ORDER BY index_column.position
      )
    INTO
      index_oid,
      index_table,
      index_is_unique,
      index_is_valid,
      index_is_ready,
      index_is_partial,
      index_has_expressions,
      actual_columns
    FROM pg_class index_class
    JOIN pg_namespace namespace_row
      ON namespace_row.oid = index_class.relnamespace
    LEFT JOIN pg_index index_row ON index_row.indexrelid = index_class.oid
    LEFT JOIN pg_class indexed_table ON indexed_table.oid = index_row.indrelid
    WHERE namespace_row.nspname = current_schema()
      AND index_class.relname = requirement ->> 'name';

    IF FOUND THEN
      IF index_table IS DISTINCT FROM requirement ->> 'table'
        OR NOT COALESCE(index_is_unique, FALSE)
        OR NOT COALESCE(index_is_valid, FALSE)
        OR NOT COALESCE(index_is_ready, FALSE)
        OR COALESCE(index_is_partial, TRUE)
        OR COALESCE(index_has_expressions, TRUE)
        OR actual_columns IS DISTINCT FROM expected_columns
      THEN
        RAISE EXCEPTION
          'standalone index public.% is incompatible with the canonical constraint',
          requirement ->> 'name';
      END IF;

      SELECT constraint_row.conname
      INTO owner_constraint
      FROM pg_constraint constraint_row
      WHERE constraint_row.conindid = index_oid
        AND constraint_row.contype IN ('u', 'p');
      IF owner_constraint IS NOT NULL THEN
        RAISE EXCEPTION
          'index public.% is already owned by constraint %',
          requirement ->> 'name',
          owner_constraint;
      END IF;
    ELSE
      SELECT string_agg(format('%I', column_name), ', ')
      INTO column_list
      FROM unnest(expected_columns) AS column_name;
      EXECUTE format(
        'CREATE UNIQUE INDEX %I ON public.%I (%s)',
        requirement ->> 'name',
        requirement ->> 'table',
        column_list
      );
    END IF;

    deferrability_clause := CASE
      WHEN COALESCE((requirement ->> 'deferrable')::BOOLEAN, FALSE)
        THEN 'DEFERRABLE INITIALLY DEFERRED'
      ELSE 'NOT DEFERRABLE'
    END;
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I UNIQUE USING INDEX %I %s',
      requirement ->> 'table',
      requirement ->> 'name',
      requirement ->> 'name',
      deferrability_clause
    );
  END LOOP;
END;
$ordered_unique_constraints$;

DO $redundant_matches_unique$
DECLARE
  canonical_index_oid OID;
  canonical_columns TEXT[];
  redundant_constraint_oid OID;
  redundant_index_oid OID;
  redundant_columns TEXT[];
  sorted_redundant_columns TEXT[];
  redundant_is_unique BOOLEAN;
  redundant_is_valid BOOLEAN;
  redundant_is_ready BOOLEAN;
  redundant_is_partial BOOLEAN;
  redundant_has_expressions BOOLEAN;
  redundant_owner_table TEXT;
  dependent_foreign_key RECORD;
  recreate_next_match_foreign_key BOOLEAN := FALSE;
BEGIN
  SELECT
    constraint_row.conindid,
    ARRAY(
      SELECT attribute_row.attname::TEXT
      FROM unnest(constraint_row.conkey) WITH ORDINALITY
        AS key_column(attribute_number, position)
      JOIN pg_attribute attribute_row
        ON attribute_row.attrelid = constraint_row.conrelid
       AND attribute_row.attnum = key_column.attribute_number
      ORDER BY key_column.position
    )
  INTO canonical_index_oid, canonical_columns
  FROM pg_constraint constraint_row
  WHERE constraint_row.conrelid = 'public.matches'::regclass
    AND constraint_row.conname = 'matches_id_stage_id_unique'
    AND constraint_row.contype = 'u'
    AND NOT constraint_row.condeferrable
    AND NOT constraint_row.condeferred
    AND constraint_row.convalidated;

  IF canonical_index_oid IS NULL
    OR canonical_columns IS DISTINCT FROM ARRAY['id', 'stage_id']::TEXT[]
  THEN
    RAISE EXCEPTION
      'canonical constraint public.matches_id_stage_id_unique is missing or incompatible';
  END IF;

  SELECT
    constraint_row.oid,
    constraint_row.conindid,
    ARRAY(
      SELECT attribute_row.attname::TEXT
      FROM unnest(constraint_row.conkey) WITH ORDINALITY
        AS key_column(attribute_number, position)
      JOIN pg_attribute attribute_row
        ON attribute_row.attrelid = constraint_row.conrelid
       AND attribute_row.attnum = key_column.attribute_number
      ORDER BY key_column.position
    )
  INTO
    redundant_constraint_oid,
    redundant_index_oid,
    redundant_columns
  FROM pg_constraint constraint_row
  WHERE constraint_row.conrelid = 'public.matches'::regclass
    AND constraint_row.conname = 'matches_stage_id_id_unique'
    AND constraint_row.contype = 'u';

  IF NOT FOUND THEN
    IF EXISTS (
      SELECT 1
      FROM pg_constraint constraint_row
      JOIN pg_namespace namespace_row
        ON namespace_row.oid = constraint_row.connamespace
      WHERE namespace_row.nspname = current_schema()
        AND constraint_row.conname = 'matches_stage_id_id_unique'
    ) THEN
      RAISE EXCEPTION
        'public.matches_stage_id_id_unique exists as a non-UNIQUE constraint';
    END IF;

    SELECT
      index_row.indexrelid,
      indexed_table.relname,
      index_row.indisunique,
      index_row.indisvalid,
      index_row.indisready,
      index_row.indpred IS NOT NULL,
      index_row.indexprs IS NOT NULL,
      ARRAY(
        SELECT attribute_row.attname::TEXT
        FROM unnest(index_row.indkey::SMALLINT[]) WITH ORDINALITY
          AS index_column(attribute_number, position)
        JOIN pg_attribute attribute_row
          ON attribute_row.attrelid = index_row.indrelid
         AND attribute_row.attnum = index_column.attribute_number
        WHERE index_column.position <= index_row.indnkeyatts
        ORDER BY index_column.position
      )
    INTO
      redundant_index_oid,
      redundant_owner_table,
      redundant_is_unique,
      redundant_is_valid,
      redundant_is_ready,
      redundant_is_partial,
      redundant_has_expressions,
      redundant_columns
    FROM pg_class index_class
    JOIN pg_namespace namespace_row
      ON namespace_row.oid = index_class.relnamespace
    LEFT JOIN pg_index index_row ON index_row.indexrelid = index_class.oid
    LEFT JOIN pg_class indexed_table ON indexed_table.oid = index_row.indrelid
    WHERE namespace_row.nspname = current_schema()
      AND index_class.relname = 'matches_stage_id_id_unique';

    IF NOT FOUND THEN
      RETURN;
    END IF;

    IF redundant_owner_table IS DISTINCT FROM 'matches'
      OR NOT COALESCE(redundant_is_unique, FALSE)
      OR NOT COALESCE(redundant_is_valid, FALSE)
      OR NOT COALESCE(redundant_is_ready, FALSE)
      OR COALESCE(redundant_is_partial, TRUE)
      OR COALESCE(redundant_has_expressions, TRUE)
    THEN
      RAISE EXCEPTION
        'public.matches_stage_id_id_unique exists with an incompatible index definition';
    END IF;
  END IF;

  SELECT array_agg(column_name ORDER BY column_name)
  INTO sorted_redundant_columns
  FROM unnest(redundant_columns) AS column_name;

  IF sorted_redundant_columns IS DISTINCT FROM
    ARRAY['id', 'stage_id']::TEXT[]
  THEN
    RAISE EXCEPTION
      'public.matches_stage_id_id_unique protects %, not the redundant id/stage pair',
      redundant_columns;
  END IF;

  IF redundant_index_oid = canonical_index_oid THEN
    RAISE EXCEPTION
      'redundant and canonical matches constraints unexpectedly share one index';
  END IF;

  FOR dependent_foreign_key IN
    SELECT
      namespace_row.nspname AS schema_name,
      table_row.relname AS table_name,
      constraint_row.conname AS constraint_name
    FROM pg_constraint constraint_row
    JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
    JOIN pg_namespace namespace_row
      ON namespace_row.oid = table_row.relnamespace
    WHERE constraint_row.contype = 'f'
      AND constraint_row.conindid = redundant_index_oid
  LOOP
    IF dependent_foreign_key.schema_name <> current_schema()
      OR dependent_foreign_key.table_name <> 'matches'
      OR dependent_foreign_key.constraint_name <>
        'matches_next_match_same_stage_fk'
    THEN
      RAISE EXCEPTION
        'refusing to remove redundant index; unexpected FK %.%.% depends on it',
        dependent_foreign_key.schema_name,
        dependent_foreign_key.table_name,
        dependent_foreign_key.constraint_name;
    END IF;

    EXECUTE format(
      'ALTER TABLE %I.%I DROP CONSTRAINT %I',
      dependent_foreign_key.schema_name,
      dependent_foreign_key.table_name,
      dependent_foreign_key.constraint_name
    );
    recreate_next_match_foreign_key := TRUE;
  END LOOP;

  IF redundant_constraint_oid IS NOT NULL THEN
    ALTER TABLE public.matches
      DROP CONSTRAINT matches_stage_id_id_unique;
  ELSE
    DROP INDEX public.matches_stage_id_id_unique;
  END IF;

  IF recreate_next_match_foreign_key THEN
    ALTER TABLE public.matches
      ADD CONSTRAINT matches_next_match_same_stage_fk
      FOREIGN KEY (next_match_id, stage_id)
      REFERENCES public.matches(id, stage_id)
      ON UPDATE NO ACTION
      ON DELETE NO ACTION
      NOT DEFERRABLE
      NOT VALID;
    ALTER TABLE public.matches
      VALIDATE CONSTRAINT matches_next_match_same_stage_fk;
  END IF;
END;
$redundant_matches_unique$;

DO $schema_catalog_postconditions$
DECLARE
  requirement JSONB;
  expected_columns TEXT[];
  actual_columns TEXT[];
  actual_table TEXT;
  actual_type "char";
  actual_deferrable BOOLEAN;
  actual_deferred BOOLEAN;
  actual_validated BOOLEAN;
  rate_limit_columns TEXT[];
  expected_rate_limit_columns CONSTANT TEXT[] := ARRAY[
    'scope_type:text:true',
    'tournament_id:integer:true',
    'credential_type:text:true',
    'source_fingerprint:text:true',
    'window_started_at:timestamp with time zone:true',
    'failure_count:integer:true',
    'blocked_until:timestamp with time zone:false',
    'last_updated_at:timestamp with time zone:true'
  ];
  index_requirement JSONB;
  check_requirement JSONB;
  actual_check_definition TEXT;
  index_table TEXT;
  index_is_unique BOOLEAN;
  index_is_valid BOOLEAN;
  index_is_ready BOOLEAN;
  index_is_partial BOOLEAN;
  index_has_expressions BOOLEAN;
  index_columns TEXT[];
  next_match_columns TEXT[];
  next_match_foreign_columns TEXT[];
  next_match_delete_action "char";
  next_match_deferrable BOOLEAN;
  next_match_deferred BOOLEAN;
  next_match_validated BOOLEAN;
BEGIN
  FOR requirement IN
    SELECT value
    FROM jsonb_array_elements($requirements$[
      {
        "table": "tournament_stages",
        "name": "tournament_stages_tournament_id_id_unique",
        "columns": ["tournament_id", "id"],
        "deferrable": false,
        "initiallyDeferred": false
      },
      {
        "table": "stage_groups",
        "name": "stage_groups_stage_id_id_unique",
        "columns": ["stage_id", "id"],
        "deferrable": false,
        "initiallyDeferred": false
      },
      {
        "table": "stage_participants",
        "name": "stage_participants_tournament_id_id_unique",
        "columns": ["tournament_id", "id"],
        "deferrable": false,
        "initiallyDeferred": false
      },
      {
        "table": "matches",
        "name": "matches_tournament_stage_id_id_unique",
        "columns": ["tournament_id", "stage_id", "id"],
        "deferrable": false,
        "initiallyDeferred": false
      },
      {
        "table": "stage_participants",
        "name": "stage_participants_stage_seed_unique",
        "columns": ["stage_id", "stage_seed"],
        "deferrable": true,
        "initiallyDeferred": true
      },
      {
        "table": "matches",
        "name": "matches_stage_round_number_unique",
        "columns": ["stage_id", "round", "match_number"],
        "deferrable": false,
        "initiallyDeferred": false
      },
      {
        "table": "matches",
        "name": "matches_id_stage_id_unique",
        "columns": ["id", "stage_id"],
        "deferrable": false,
        "initiallyDeferred": false
      }
    ]$requirements$::JSONB)
  LOOP
    expected_columns := ARRAY(
      SELECT jsonb_array_elements_text(requirement -> 'columns')
    );

    SELECT
      table_row.relname,
      constraint_row.contype,
      constraint_row.condeferrable,
      constraint_row.condeferred,
      constraint_row.convalidated,
      ARRAY(
        SELECT attribute_row.attname::TEXT
        FROM unnest(constraint_row.conkey) WITH ORDINALITY
          AS key_column(attribute_number, position)
        JOIN pg_attribute attribute_row
          ON attribute_row.attrelid = constraint_row.conrelid
         AND attribute_row.attnum = key_column.attribute_number
        ORDER BY key_column.position
      )
    INTO
      actual_table,
      actual_type,
      actual_deferrable,
      actual_deferred,
      actual_validated,
      actual_columns
    FROM pg_constraint constraint_row
    JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
    JOIN pg_namespace namespace_row
      ON namespace_row.oid = table_row.relnamespace
    WHERE namespace_row.nspname = current_schema()
      AND constraint_row.conname = requirement ->> 'name';

    IF NOT FOUND
      OR actual_table IS DISTINCT FROM requirement ->> 'table'
      OR actual_type <> 'u'
      OR actual_columns IS DISTINCT FROM expected_columns
      OR actual_deferrable <>
        COALESCE((requirement ->> 'deferrable')::BOOLEAN, FALSE)
      OR actual_deferred <>
        COALESCE((requirement ->> 'initiallyDeferred')::BOOLEAN, FALSE)
      OR NOT COALESCE(actual_validated, FALSE)
    THEN
      RAISE EXCEPTION
        'postcondition failed for canonical UNIQUE constraint public.%',
        requirement ->> 'name';
    END IF;
  END LOOP;

  IF to_regclass('public.matches_stage_id_id_unique') IS NOT NULL
    OR EXISTS (
      SELECT 1
      FROM pg_constraint constraint_row
      JOIN pg_namespace namespace_row
        ON namespace_row.oid = constraint_row.connamespace
      WHERE namespace_row.nspname = current_schema()
        AND constraint_row.conname = 'matches_stage_id_id_unique'
    )
  THEN
    RAISE EXCEPTION
      'postcondition failed: redundant public.matches_stage_id_id_unique remains';
  END IF;

  SELECT
    ARRAY(
      SELECT attribute_row.attname::TEXT
      FROM unnest(constraint_row.conkey) WITH ORDINALITY
        AS key_column(attribute_number, position)
      JOIN pg_attribute attribute_row
        ON attribute_row.attrelid = constraint_row.conrelid
       AND attribute_row.attnum = key_column.attribute_number
      ORDER BY key_column.position
    ),
    ARRAY(
      SELECT attribute_row.attname::TEXT
      FROM unnest(constraint_row.confkey) WITH ORDINALITY
        AS key_column(attribute_number, position)
      JOIN pg_attribute attribute_row
        ON attribute_row.attrelid = constraint_row.confrelid
       AND attribute_row.attnum = key_column.attribute_number
      ORDER BY key_column.position
    ),
    constraint_row.confdeltype,
    constraint_row.condeferrable,
    constraint_row.condeferred,
    constraint_row.convalidated
  INTO
    next_match_columns,
    next_match_foreign_columns,
    next_match_delete_action,
    next_match_deferrable,
    next_match_deferred,
    next_match_validated
  FROM pg_constraint constraint_row
  WHERE constraint_row.conrelid = 'public.matches'::regclass
    AND constraint_row.conname = 'matches_next_match_same_stage_fk'
    AND constraint_row.contype = 'f';

  IF NOT FOUND
    OR next_match_columns IS DISTINCT FROM
      ARRAY['next_match_id', 'stage_id']::TEXT[]
    OR next_match_foreign_columns IS DISTINCT FROM
      ARRAY['id', 'stage_id']::TEXT[]
    OR next_match_delete_action <> 'a'
    OR next_match_deferrable
    OR next_match_deferred
    OR NOT next_match_validated
  THEN
    RAISE EXCEPTION
      'postcondition failed for public.matches_next_match_same_stage_fk';
  END IF;

  SELECT array_agg(
    format(
      '%s:%s:%s',
      attribute_row.attname,
      format_type(attribute_row.atttypid, attribute_row.atttypmod),
      attribute_row.attnotnull::TEXT
    )
    ORDER BY attribute_row.attnum
  )
  INTO rate_limit_columns
  FROM pg_attribute attribute_row
  WHERE attribute_row.attrelid =
    'public.auth_credential_rate_limits'::regclass
    AND attribute_row.attnum > 0
    AND NOT attribute_row.attisdropped;

  IF rate_limit_columns IS DISTINCT FROM expected_rate_limit_columns THEN
    RAISE EXCEPTION
      'postcondition failed for public.auth_credential_rate_limits columns';
  END IF;

  FOR check_requirement IN
    SELECT value
    FROM jsonb_array_elements($checks$[
      {
        "name": "auth_credential_rate_limits_scope_type_check",
        "definition": "CHECK (scope_type = ANY (ARRAY['tournament'::text, 'source'::text]))"
      },
      {
        "name": "auth_credential_rate_limits_credential_type_check",
        "definition": "CHECK (credential_type = ANY (ARRAY['organizer'::text, 'viewer'::text, 'support'::text, 'legacy_upgrade'::text]))"
      },
      {
        "name": "auth_credential_rate_limits_tournament_id_check",
        "definition": "CHECK (tournament_id > 0)"
      },
      {
        "name": "auth_credential_rate_limits_failure_count_check",
        "definition": "CHECK (failure_count >= 0)"
      },
      {
        "name": "auth_credential_rate_limits_source_fingerprint_check",
        "definition": "CHECK (length(source_fingerprint) >= 1 AND length(source_fingerprint) <= 128)"
      }
    ]$checks$::JSONB)
  LOOP
    SELECT pg_get_constraintdef(constraint_row.oid, TRUE)
    INTO actual_check_definition
    FROM pg_constraint constraint_row
    WHERE constraint_row.conrelid =
      'public.auth_credential_rate_limits'::regclass
      AND constraint_row.conname = check_requirement ->> 'name'
      AND constraint_row.contype = 'c'
      AND constraint_row.convalidated;

    IF NOT FOUND
      OR actual_check_definition IS DISTINCT FROM
        check_requirement ->> 'definition'
    THEN
      RAISE EXCEPTION
        'postcondition failed for check constraint public.%',
        check_requirement ->> 'name';
    END IF;
  END LOOP;

  FOR index_requirement IN
    SELECT value
    FROM jsonb_array_elements($indexes$[
      {
        "name": "auth_credential_rate_limits_cleanup_idx",
        "columns": ["last_updated_at"]
      },
      {
        "name": "auth_credential_rate_limits_blocked_idx",
        "columns": ["blocked_until"]
      }
    ]$indexes$::JSONB)
  LOOP
    expected_columns := ARRAY(
      SELECT jsonb_array_elements_text(index_requirement -> 'columns')
    );

    SELECT
      indexed_table.relname,
      index_row.indisunique,
      index_row.indisvalid,
      index_row.indisready,
      index_row.indpred IS NOT NULL,
      index_row.indexprs IS NOT NULL,
      ARRAY(
        SELECT attribute_row.attname::TEXT
        FROM unnest(index_row.indkey::SMALLINT[]) WITH ORDINALITY
          AS index_column(attribute_number, position)
        JOIN pg_attribute attribute_row
          ON attribute_row.attrelid = index_row.indrelid
         AND attribute_row.attnum = index_column.attribute_number
        WHERE index_column.position <= index_row.indnkeyatts
        ORDER BY index_column.position
      )
    INTO
      index_table,
      index_is_unique,
      index_is_valid,
      index_is_ready,
      index_is_partial,
      index_has_expressions,
      index_columns
    FROM pg_class index_class
    JOIN pg_namespace namespace_row
      ON namespace_row.oid = index_class.relnamespace
    JOIN pg_index index_row ON index_row.indexrelid = index_class.oid
    JOIN pg_class indexed_table ON indexed_table.oid = index_row.indrelid
    WHERE namespace_row.nspname = current_schema()
      AND index_class.relname = index_requirement ->> 'name';

    IF NOT FOUND
      OR index_table <> 'auth_credential_rate_limits'
      OR COALESCE(index_is_unique, TRUE)
      OR NOT COALESCE(index_is_valid, FALSE)
      OR NOT COALESCE(index_is_ready, FALSE)
      OR COALESCE(index_is_partial, TRUE)
      OR COALESCE(index_has_expressions, TRUE)
      OR index_columns IS DISTINCT FROM expected_columns
    THEN
      RAISE EXCEPTION
        'postcondition failed for index public.%',
        index_requirement ->> 'name';
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint constraint_row
    WHERE constraint_row.conrelid =
      'public.auth_credential_rate_limits'::regclass
      AND constraint_row.conname =
        'auth_credential_rate_limits_scope_pk'
      AND constraint_row.contype = 'p'
      AND constraint_row.conkey = ARRAY[
        (
          SELECT attnum
          FROM pg_attribute
          WHERE attrelid =
            'public.auth_credential_rate_limits'::regclass
            AND attname = 'scope_type'
        ),
        (
          SELECT attnum
          FROM pg_attribute
          WHERE attrelid =
            'public.auth_credential_rate_limits'::regclass
            AND attname = 'tournament_id'
        ),
        (
          SELECT attnum
          FROM pg_attribute
          WHERE attrelid =
            'public.auth_credential_rate_limits'::regclass
            AND attname = 'credential_type'
        ),
        (
          SELECT attnum
          FROM pg_attribute
          WHERE attrelid =
            'public.auth_credential_rate_limits'::regclass
            AND attname = 'source_fingerprint'
        )
      ]::SMALLINT[]
      AND constraint_row.convalidated
  ) THEN
    RAISE EXCEPTION
      'postcondition failed for auth_credential_rate_limits_scope_pk';
  END IF;
END;
$schema_catalog_postconditions$;

-- migration-runner-strip-begin
COMMIT;
-- migration-runner-strip-end
