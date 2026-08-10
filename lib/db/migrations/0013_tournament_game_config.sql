-- Generic, optional game configuration for a tournament. No existing
-- tournament is backfilled: absence of a row intentionally means no game was
-- selected.

-- migration-runner-strip-begin
BEGIN;
-- migration-runner-strip-end

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '5min';
SELECT pg_advisory_xact_lock(841730033);

DO $tournament_game_config_prerequisites$
BEGIN
  IF to_regclass('public.tournaments') IS NULL THEN
    RAISE EXCEPTION '0013 prerequisite failed: public.tournaments is missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'tournaments'
      AND column_name = 'id'
      AND data_type = 'integer'
      AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION '0013 prerequisite failed: public.tournaments.id is incompatible';
  END IF;
END;
$tournament_game_config_prerequisites$;

CREATE TABLE IF NOT EXISTS public.tournament_game_configs (
  tournament_id INTEGER NOT NULL,
  game_id TEXT NOT NULL,
  config_version INTEGER NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tournament_game_configs_pkey PRIMARY KEY (tournament_id),
  CONSTRAINT tournament_game_configs_tournament_fk
    FOREIGN KEY (tournament_id)
    REFERENCES public.tournaments(id)
    ON DELETE CASCADE,
  CONSTRAINT tournament_game_configs_game_id_present
    CHECK (length(btrim(game_id)) > 0),
  CONSTRAINT tournament_game_configs_version_positive
    CHECK (config_version > 0),
  CONSTRAINT tournament_game_configs_config_object
    CHECK (jsonb_typeof(config) = 'object')
);

DO $tournament_game_config_postconditions$
DECLARE
  actual_columns TEXT;
BEGIN
  SELECT string_agg(
    concat_ws(':', column_name, data_type, is_nullable),
    ',' ORDER BY ordinal_position
  )
  INTO actual_columns
  FROM information_schema.columns
  WHERE table_schema = current_schema()
    AND table_name = 'tournament_game_configs';

  IF actual_columns <> 'tournament_id:integer:NO,game_id:text:NO,config_version:integer:NO,config:jsonb:NO,created_at:timestamp with time zone:NO,updated_at:timestamp with time zone:NO' THEN
    RAISE EXCEPTION '0013 postcondition failed: unexpected columns: %', actual_columns;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tournament_game_configs'::regclass
      AND conname = 'tournament_game_configs_pkey'
      AND contype = 'p'
      AND pg_get_constraintdef(oid) = 'PRIMARY KEY (tournament_id)'
  ) THEN
    RAISE EXCEPTION '0013 postcondition failed: canonical primary key is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tournament_game_configs'::regclass
      AND conname = 'tournament_game_configs_tournament_fk'
      AND contype = 'f'
      AND pg_get_constraintdef(oid) = 'FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE'
      AND convalidated
  ) THEN
    RAISE EXCEPTION '0013 postcondition failed: canonical tournament foreign key is missing';
  END IF;

  IF (
    SELECT count(*)
    FROM pg_constraint
    WHERE conrelid = 'public.tournament_game_configs'::regclass
      AND conname = ANY (ARRAY[
        'tournament_game_configs_game_id_present',
        'tournament_game_configs_version_positive',
        'tournament_game_configs_config_object'
      ])
      AND contype = 'c'
      AND convalidated
  ) <> 3 THEN
    RAISE EXCEPTION '0013 postcondition failed: canonical checks are missing';
  END IF;
END;
$tournament_game_config_postconditions$;

-- migration-runner-strip-begin
COMMIT;
-- migration-runner-strip-end
