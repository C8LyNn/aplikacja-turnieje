-- Reconcile the qualification constraint and legacy participant compatibility
-- functions without changing tournament data. Safe to replay.

-- migration-runner-strip-begin
BEGIN;
-- migration-runner-strip-end

DO $$
DECLARE
  missing_columns TEXT[];
  invalid_count BIGINT;
  first_invalid_stage_id INTEGER;
BEGIN
  IF to_regclass('public.tournament_stages') IS NULL
    OR to_regclass('public.stage_participants') IS NULL
    OR to_regclass('public.players') IS NULL
  THEN
    RAISE EXCEPTION
      '0007_reconcile_stage_schema requires tournament_stages, stage_participants, and players';
  END IF;

  SELECT array_agg(required_column ORDER BY required_column)
  INTO missing_columns
  FROM unnest(ARRAY[
    'id', 'tournament_id', 'position', 'format', 'qualification_mode',
    'advancing_count', 'participant_count'
  ]) AS required(required_column)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_attribute attribute
    WHERE attribute.attrelid = to_regclass('public.tournament_stages')
      AND attribute.attname = required.required_column
      AND attribute.attnum > 0
      AND NOT attribute.attisdropped
  );
  IF missing_columns IS NOT NULL THEN
    RAISE EXCEPTION
      '0007_reconcile_stage_schema: tournament_stages is missing columns: %',
      array_to_string(missing_columns, ', ');
  END IF;

  SELECT array_agg(required_column ORDER BY required_column)
  INTO missing_columns
  FROM unnest(ARRAY[
    'id', 'tournament_id', 'seed', 'status', 'created_at'
  ]) AS required(required_column)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_attribute attribute
    WHERE attribute.attrelid = to_regclass('public.players')
      AND attribute.attname = required.required_column
      AND attribute.attnum > 0
      AND NOT attribute.attisdropped
  );
  IF missing_columns IS NOT NULL THEN
    RAISE EXCEPTION
      '0007_reconcile_stage_schema: players is missing columns: %',
      array_to_string(missing_columns, ', ');
  END IF;

  SELECT array_agg(required_column ORDER BY required_column)
  INTO missing_columns
  FROM unnest(ARRAY[
    'tournament_id', 'stage_id', 'player_id', 'stage_seed', 'status',
    'qualification_source', 'created_at'
  ]) AS required(required_column)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_attribute attribute
    WHERE attribute.attrelid = to_regclass('public.stage_participants')
      AND attribute.attname = required.required_column
      AND attribute.attnum > 0
      AND NOT attribute.attisdropped
  );
  IF missing_columns IS NOT NULL THEN
    RAISE EXCEPTION
      '0007_reconcile_stage_schema: stage_participants is missing columns: %',
      array_to_string(missing_columns, ', ');
  END IF;

  IF to_regtype('public.stage_participant_status') IS NULL THEN
    RAISE EXCEPTION
      '0007_reconcile_stage_schema requires type stage_participant_status';
  END IF;

  IF to_regprocedure(
    'public.compat_resequence_single_stage_participants(integer,integer)'
  ) IS NULL
    OR to_regprocedure('public.compat_sync_single_stage_participant()') IS NULL
    OR to_regprocedure(
      'public.compat_count_single_stage_participants_after_delete()'
    ) IS NULL
  THEN
    RAISE EXCEPTION
      '0007_reconcile_stage_schema requires the existing participant compatibility functions';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = to_regclass('public.players')
      AND tgname = 'players_sync_single_stage_participant'
      AND NOT tgisinternal
  )
    OR NOT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgrelid = to_regclass('public.players')
        AND tgname = 'players_count_single_stage_after_delete'
        AND NOT tgisinternal
    )
  THEN
    RAISE EXCEPTION
      '0007_reconcile_stage_schema requires the existing player compatibility triggers';
  END IF;

  SELECT count(*), min(id)
  INTO invalid_count, first_invalid_stage_id
  FROM public.tournament_stages
  WHERE NOT COALESCE(
    (qualification_mode = 'none' AND advancing_count IS NULL)
    OR (qualification_mode = 'top_n'
      AND format IN ('swiss', 'round_robin')
      AND advancing_count IS NOT NULL
      AND advancing_count <= participant_count)
    OR (qualification_mode = 'top_n'
      AND format = 'single_elimination'
      AND advancing_count IS NOT NULL)
    OR (qualification_mode = 'top_n_per_group'
      AND format = 'group_stage'
      AND advancing_count IS NULL),
    false
  );

  IF invalid_count > 0 THEN
    RAISE EXCEPTION
      '0007_reconcile_stage_schema: % tournament_stages rows violate the target qualification constraint (first stage id: %)',
      invalid_count,
      first_invalid_stage_id;
  END IF;
END;
$$;

ALTER TABLE public.tournament_stages
  DROP CONSTRAINT IF EXISTS tournament_stages_qualification_configuration;

ALTER TABLE public.tournament_stages
  ADD CONSTRAINT tournament_stages_qualification_configuration CHECK (
    (qualification_mode = 'none' AND advancing_count IS NULL)
    OR (qualification_mode = 'top_n'
      AND format IN ('swiss', 'round_robin')
      AND advancing_count IS NOT NULL
      AND advancing_count <= participant_count)
    OR (qualification_mode = 'top_n'
      AND format = 'single_elimination'
      AND advancing_count IS NOT NULL)
    OR (qualification_mode = 'top_n_per_group'
      AND format = 'group_stage'
      AND advancing_count IS NULL)
  ) NOT VALID;

ALTER TABLE public.tournament_stages
  VALIDATE CONSTRAINT tournament_stages_qualification_configuration;

CREATE OR REPLACE FUNCTION public.compat_sync_single_stage_participant()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  target_stage_id INTEGER;
  stage_count INTEGER;
BEGIN
  IF current_setting('tournament_manager.resequencing', true) = 'on' THEN
    RETURN NEW;
  END IF;

  SELECT
    count(*)::INTEGER,
    max(stage.id) FILTER (WHERE stage.position = 1)
  INTO stage_count, target_stage_id
  FROM public.tournament_stages stage
  WHERE stage.tournament_id = NEW.tournament_id;

  IF target_stage_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.stage_participants (
    tournament_id, stage_id, player_id, stage_seed, status,
    qualification_source, created_at
  ) VALUES (
    NEW.tournament_id, target_stage_id, NEW.id, NEW.seed,
    NEW.status::text::public.stage_participant_status,
    'registration', NEW.created_at
  )
  ON CONFLICT (stage_id, player_id) DO UPDATE SET
    stage_seed = EXCLUDED.stage_seed,
    status = EXCLUDED.status;

  PERFORM public.compat_resequence_single_stage_participants(
    NEW.tournament_id,
    target_stage_id
  );

  IF stage_count = 1 THEN
    UPDATE public.tournament_stages
    SET participant_count = (
      SELECT count(*) FROM public.players
      WHERE tournament_id = NEW.tournament_id
    )
    WHERE id = target_stage_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.compat_count_single_stage_participants_after_delete()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  target_stage_id INTEGER;
  stage_count INTEGER;
BEGIN
  SELECT
    count(*)::INTEGER,
    max(stage.id) FILTER (WHERE stage.position = 1)
  INTO stage_count, target_stage_id
  FROM public.tournament_stages stage
  WHERE stage.tournament_id = OLD.tournament_id;

  IF target_stage_id IS NULL THEN
    RETURN OLD;
  END IF;

  PERFORM public.compat_resequence_single_stage_participants(
    OLD.tournament_id,
    target_stage_id
  );

  IF stage_count = 1 THEN
    UPDATE public.tournament_stages
    SET participant_count = (
      SELECT count(*) FROM public.players
      WHERE tournament_id = OLD.tournament_id
    )
    WHERE id = target_stage_id;
  END IF;

  RETURN OLD;
END;
$$;

-- migration-runner-strip-begin
COMMIT;
-- migration-runner-strip-end
