-- Reconcile composite foreign keys after a drizzle-kit push created constraints
-- with a different column order. The current Drizzle schema and the explicit
-- cross-table lifecycle constraints are authoritative.

-- migration-runner-strip-begin
BEGIN;
-- migration-runner-strip-end

DO $composite_foreign_key_reconciliation$
DECLARE
  required_table TEXT;
  required_column RECORD;
  required_unique RECORD;
  foreign_key JSONB;
  local_columns TEXT[];
  foreign_columns TEXT[];
  expected_set_null_columns TEXT[];
  actual_local_columns TEXT[];
  actual_foreign_columns TEXT[];
  actual_set_null_columns TEXT[];
  actual_foreign_table TEXT;
  actual_delete_action "char";
  actual_deferrable BOOLEAN;
  actual_initially_deferred BOOLEAN;
  actual_validated BOOLEAN;
  constraint_exists BOOLEAN;
  definition_matches BOOLEAN;
  local_column_list TEXT;
  foreign_column_list TEXT;
  delete_clause TEXT;
  deferrability_clause TEXT;
BEGIN
  FOREACH required_table IN ARRAY ARRAY[
    'stage_participants',
    'tournaments',
    'tournament_stages',
    'matches',
    'action_log',
    'result_history',
    'players',
    'stage_groups'
  ] LOOP
    IF to_regclass(format('public.%I', required_table)) IS NULL THEN
      RAISE EXCEPTION
        '0009_reconcile_composite_foreign_keys requires table public.%',
        required_table;
    END IF;
  END LOOP;

  FOR required_column IN
    SELECT *
    FROM (VALUES
      ('stage_participants', 'id'),
      ('stage_participants', 'tournament_id'),
      ('stage_participants', 'stage_id'),
      ('stage_participants', 'player_id'),
      ('stage_participants', 'group_id'),
      ('stage_participants', 'source_stage_participant_id'),
      ('tournaments', 'id'),
      ('tournaments', 'active_stage_id'),
      ('tournament_stages', 'id'),
      ('tournament_stages', 'tournament_id'),
      ('tournament_stages', 'winner_id'),
      ('matches', 'id'),
      ('matches', 'tournament_id'),
      ('matches', 'stage_id'),
      ('matches', 'stage_group_id'),
      ('matches', 'player1_id'),
      ('matches', 'player2_id'),
      ('matches', 'winner_id'),
      ('matches', 'next_match_id'),
      ('action_log', 'tournament_id'),
      ('action_log', 'stage_id'),
      ('action_log', 'match_id'),
      ('result_history', 'tournament_id'),
      ('result_history', 'stage_id'),
      ('result_history', 'match_id'),
      ('players', 'tournament_id'),
      ('players', 'id'),
      ('stage_groups', 'stage_id'),
      ('stage_groups', 'id')
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
        '0009_reconcile_composite_foreign_keys requires column public.%.%',
        required_column.table_name,
        required_column.column_name;
    END IF;
  END LOOP;

  FOR required_unique IN
    SELECT *
    FROM (VALUES
      ('tournament_stages', ARRAY['tournament_id', 'id']::TEXT[]),
      ('players', ARRAY['tournament_id', 'id']::TEXT[]),
      ('stage_groups', ARRAY['stage_id', 'id']::TEXT[]),
      ('stage_participants', ARRAY['stage_id', 'player_id']::TEXT[]),
      ('stage_participants', ARRAY['tournament_id', 'id']::TEXT[]),
      ('matches', ARRAY['id', 'stage_id']::TEXT[]),
      ('matches', ARRAY['tournament_id', 'stage_id', 'id']::TEXT[])
    ) AS required(table_name, column_names)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_index index_row
      JOIN pg_class table_row ON table_row.oid = index_row.indrelid
      JOIN pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
      WHERE namespace_row.nspname = current_schema()
        AND table_row.relname = required_unique.table_name
        AND index_row.indisunique
        AND index_row.indisvalid
        AND index_row.indisready
        AND index_row.indpred IS NULL
        AND index_row.indexprs IS NULL
        AND ARRAY(
          SELECT attribute_row.attname::TEXT
          FROM unnest(index_row.indkey::SMALLINT[]) WITH ORDINALITY
            AS index_column(attribute_number, position)
          JOIN pg_attribute attribute_row
            ON attribute_row.attrelid = index_row.indrelid
           AND attribute_row.attnum = index_column.attribute_number
          WHERE index_column.position <= index_row.indnkeyatts
          ORDER BY index_column.position
        ) = required_unique.column_names
    ) THEN
      RAISE EXCEPTION
        '0009_reconcile_composite_foreign_keys requires a valid unique index on public.%(%)',
        required_unique.table_name,
        array_to_string(required_unique.column_names, ', ');
    END IF;
  END LOOP;

  FOR foreign_key IN
    SELECT value
    FROM jsonb_array_elements($foreign_keys$[
      {
        "table": "stage_participants",
        "name": "stage_participants_stage_same_tournament_fk",
        "columns": ["tournament_id", "stage_id"],
        "foreignTable": "tournament_stages",
        "foreignColumns": ["tournament_id", "id"],
        "deleteAction": "c",
        "deleteClause": "ON DELETE CASCADE"
      },
      {
        "table": "stage_participants",
        "name": "stage_participants_player_same_tournament_fk",
        "columns": ["tournament_id", "player_id"],
        "foreignTable": "players",
        "foreignColumns": ["tournament_id", "id"],
        "deleteAction": "c",
        "deleteClause": "ON DELETE CASCADE"
      },
      {
        "table": "stage_participants",
        "name": "stage_participants_group_same_stage_fk",
        "columns": ["stage_id", "group_id"],
        "foreignTable": "stage_groups",
        "foreignColumns": ["stage_id", "id"],
        "deleteAction": "a",
        "deleteClause": "ON DELETE NO ACTION"
      },
      {
        "table": "stage_participants",
        "name": "stage_participants_source_same_tournament_fk",
        "columns": ["tournament_id", "source_stage_participant_id"],
        "foreignTable": "stage_participants",
        "foreignColumns": ["tournament_id", "id"],
        "deleteAction": "r",
        "deleteClause": "ON DELETE RESTRICT"
      },
      {
        "table": "tournaments",
        "name": "tournaments_active_stage_same_tournament_fk",
        "columns": ["id", "active_stage_id"],
        "foreignTable": "tournament_stages",
        "foreignColumns": ["tournament_id", "id"],
        "deleteAction": "a",
        "deleteClause": "ON DELETE NO ACTION",
        "deferrable": true,
        "initiallyDeferred": true
      },
      {
        "table": "tournament_stages",
        "name": "tournament_stages_winner_same_tournament_fk",
        "columns": ["tournament_id", "winner_id"],
        "foreignTable": "players",
        "foreignColumns": ["tournament_id", "id"],
        "deleteAction": "a",
        "deleteClause": "ON DELETE NO ACTION"
      },
      {
        "table": "tournament_stages",
        "name": "tournament_stages_winner_same_stage_fk",
        "columns": ["id", "winner_id"],
        "foreignTable": "stage_participants",
        "foreignColumns": ["stage_id", "player_id"],
        "deleteAction": "a",
        "deleteClause": "ON DELETE NO ACTION",
        "deferrable": true,
        "initiallyDeferred": true
      },
      {
        "table": "matches",
        "name": "matches_stage_same_tournament_fk",
        "columns": ["tournament_id", "stage_id"],
        "foreignTable": "tournament_stages",
        "foreignColumns": ["tournament_id", "id"],
        "deleteAction": "a",
        "deleteClause": "ON DELETE NO ACTION"
      },
      {
        "table": "matches",
        "name": "matches_group_same_stage_fk",
        "columns": ["stage_id", "stage_group_id"],
        "foreignTable": "stage_groups",
        "foreignColumns": ["stage_id", "id"],
        "deleteAction": "a",
        "deleteClause": "ON DELETE NO ACTION"
      },
      {
        "table": "matches",
        "name": "matches_player1_same_stage_fk",
        "columns": ["stage_id", "player1_id"],
        "foreignTable": "stage_participants",
        "foreignColumns": ["stage_id", "player_id"],
        "deleteAction": "a",
        "deleteClause": "ON DELETE NO ACTION"
      },
      {
        "table": "matches",
        "name": "matches_player2_same_stage_fk",
        "columns": ["stage_id", "player2_id"],
        "foreignTable": "stage_participants",
        "foreignColumns": ["stage_id", "player_id"],
        "deleteAction": "a",
        "deleteClause": "ON DELETE NO ACTION"
      },
      {
        "table": "matches",
        "name": "matches_winner_same_stage_fk",
        "columns": ["stage_id", "winner_id"],
        "foreignTable": "stage_participants",
        "foreignColumns": ["stage_id", "player_id"],
        "deleteAction": "a",
        "deleteClause": "ON DELETE NO ACTION"
      },
      {
        "table": "matches",
        "name": "matches_player1_same_tournament_fk",
        "columns": ["tournament_id", "player1_id"],
        "foreignTable": "players",
        "foreignColumns": ["tournament_id", "id"],
        "deleteAction": "a",
        "deleteClause": "ON DELETE NO ACTION"
      },
      {
        "table": "matches",
        "name": "matches_player2_same_tournament_fk",
        "columns": ["tournament_id", "player2_id"],
        "foreignTable": "players",
        "foreignColumns": ["tournament_id", "id"],
        "deleteAction": "a",
        "deleteClause": "ON DELETE NO ACTION"
      },
      {
        "table": "matches",
        "name": "matches_winner_same_tournament_fk",
        "columns": ["tournament_id", "winner_id"],
        "foreignTable": "players",
        "foreignColumns": ["tournament_id", "id"],
        "deleteAction": "a",
        "deleteClause": "ON DELETE NO ACTION"
      },
      {
        "table": "matches",
        "name": "matches_next_match_same_stage_fk",
        "columns": ["next_match_id", "stage_id"],
        "foreignTable": "matches",
        "foreignColumns": ["id", "stage_id"],
        "deleteAction": "a",
        "deleteClause": "ON DELETE NO ACTION"
      },
      {
        "table": "action_log",
        "name": "action_log_stage_same_tournament_fk",
        "columns": ["tournament_id", "stage_id"],
        "foreignTable": "tournament_stages",
        "foreignColumns": ["tournament_id", "id"],
        "deleteAction": "n",
        "deleteClause": "ON DELETE SET NULL (stage_id)",
        "setNullColumns": ["stage_id"]
      },
      {
        "table": "action_log",
        "name": "action_log_match_same_tournament_stage_fk",
        "columns": ["tournament_id", "stage_id", "match_id"],
        "foreignTable": "matches",
        "foreignColumns": ["tournament_id", "stage_id", "id"],
        "deleteAction": "n",
        "deleteClause": "ON DELETE SET NULL (stage_id, match_id)",
        "setNullColumns": ["stage_id", "match_id"]
      },
      {
        "table": "result_history",
        "name": "result_history_match_same_stage_fk",
        "columns": ["stage_id", "match_id"],
        "foreignTable": "matches",
        "foreignColumns": ["stage_id", "id"],
        "deleteAction": "a",
        "deleteClause": "ON DELETE NO ACTION"
      },
      {
        "table": "result_history",
        "name": "result_history_match_same_tournament_stage_fk",
        "columns": ["tournament_id", "stage_id", "match_id"],
        "foreignTable": "matches",
        "foreignColumns": ["tournament_id", "stage_id", "id"],
        "deleteAction": "c",
        "deleteClause": "ON DELETE CASCADE"
      }
    ]$foreign_keys$::JSONB)
  LOOP
    local_columns := ARRAY(
      SELECT jsonb_array_elements_text(foreign_key -> 'columns')
    );
    foreign_columns := ARRAY(
      SELECT jsonb_array_elements_text(foreign_key -> 'foreignColumns')
    );
    expected_set_null_columns := ARRAY(
      SELECT jsonb_array_elements_text(COALESCE(foreign_key -> 'setNullColumns', '[]'::JSONB))
    );

    SELECT
      TRUE,
      ARRAY(
        SELECT attribute_row.attname::TEXT
        FROM unnest(constraint_row.conkey) WITH ORDINALITY
          AS constraint_column(attribute_number, position)
        JOIN pg_attribute attribute_row
          ON attribute_row.attrelid = constraint_row.conrelid
         AND attribute_row.attnum = constraint_column.attribute_number
        ORDER BY constraint_column.position
      ),
      foreign_table_row.relname,
      ARRAY(
        SELECT attribute_row.attname::TEXT
        FROM unnest(constraint_row.confkey) WITH ORDINALITY
          AS constraint_column(attribute_number, position)
        JOIN pg_attribute attribute_row
          ON attribute_row.attrelid = constraint_row.confrelid
         AND attribute_row.attnum = constraint_column.attribute_number
        ORDER BY constraint_column.position
      ),
      constraint_row.confdeltype,
      ARRAY(
        SELECT attribute_row.attname::TEXT
        FROM unnest(COALESCE(constraint_row.confdelsetcols, ARRAY[]::SMALLINT[])) WITH ORDINALITY
          AS constraint_column(attribute_number, position)
        JOIN pg_attribute attribute_row
          ON attribute_row.attrelid = constraint_row.conrelid
         AND attribute_row.attnum = constraint_column.attribute_number
        ORDER BY constraint_column.position
      ),
      constraint_row.condeferrable,
      constraint_row.condeferred,
      constraint_row.convalidated
    INTO
      constraint_exists,
      actual_local_columns,
      actual_foreign_table,
      actual_foreign_columns,
      actual_delete_action,
      actual_set_null_columns,
      actual_deferrable,
      actual_initially_deferred,
      actual_validated
    FROM pg_constraint constraint_row
    JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
    JOIN pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
    JOIN pg_class foreign_table_row ON foreign_table_row.oid = constraint_row.confrelid
    JOIN pg_namespace foreign_namespace_row ON foreign_namespace_row.oid = foreign_table_row.relnamespace
    WHERE namespace_row.nspname = current_schema()
      AND table_row.relname = foreign_key ->> 'table'
      AND constraint_row.conname = foreign_key ->> 'name'
      AND constraint_row.contype = 'f'
      AND foreign_namespace_row.nspname = current_schema();

    constraint_exists := COALESCE(constraint_exists, FALSE);
    definition_matches := constraint_exists
      AND actual_local_columns = local_columns
      AND actual_foreign_table = foreign_key ->> 'foreignTable'
      AND actual_foreign_columns = foreign_columns
      AND actual_delete_action = (foreign_key ->> 'deleteAction')::"char"
      AND actual_set_null_columns = expected_set_null_columns
      AND actual_deferrable = COALESCE((foreign_key ->> 'deferrable')::BOOLEAN, FALSE)
      AND actual_initially_deferred = COALESCE((foreign_key ->> 'initiallyDeferred')::BOOLEAN, FALSE);

    IF NOT definition_matches THEN
      EXECUTE format(
        'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
        foreign_key ->> 'table',
        foreign_key ->> 'name'
      );

      SELECT string_agg(format('%I', column_name), ', ')
      INTO local_column_list
      FROM unnest(local_columns) AS column_name;
      SELECT string_agg(format('%I', column_name), ', ')
      INTO foreign_column_list
      FROM unnest(foreign_columns) AS column_name;

      delete_clause := foreign_key ->> 'deleteClause';
      deferrability_clause := CASE
        WHEN COALESCE((foreign_key ->> 'deferrable')::BOOLEAN, FALSE)
          THEN 'DEFERRABLE INITIALLY DEFERRED'
        ELSE 'NOT DEFERRABLE'
      END;

      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%s) REFERENCES public.%I (%s) ON UPDATE NO ACTION %s %s NOT VALID',
        foreign_key ->> 'table',
        foreign_key ->> 'name',
        local_column_list,
        foreign_key ->> 'foreignTable',
        foreign_column_list,
        delete_clause,
        deferrability_clause
      );
      actual_validated := FALSE;
    END IF;

    IF NOT COALESCE(actual_validated, FALSE) THEN
      EXECUTE format(
        'ALTER TABLE public.%I VALIDATE CONSTRAINT %I',
        foreign_key ->> 'table',
        foreign_key ->> 'name'
      );
    END IF;
  END LOOP;
END;
$composite_foreign_key_reconciliation$;

-- migration-runner-strip-begin
COMMIT;
-- migration-runner-strip-end
