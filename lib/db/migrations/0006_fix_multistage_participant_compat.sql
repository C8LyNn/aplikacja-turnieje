-- Keep legacy one-stage participant counts dynamic without mutating a
-- persisted multi-stage plan during player registration or removal.
-- This forward-only migration is safe to replay.

DO $$
BEGIN
  IF to_regprocedure(
    'public.validate_tournament_stage_participant_flow()'
  ) IS NULL THEN
    RAISE EXCEPTION
      '0006_fix_multistage_participant_compat requires 0005_stage_participant_flow';
  END IF;
END;
$$;

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
