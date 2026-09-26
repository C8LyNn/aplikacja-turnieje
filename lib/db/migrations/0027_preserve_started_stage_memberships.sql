-- Preserve stage-owned membership after start; safe to replay.
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

  -- Started stages own their frozen seeds, membership statuses and capacity.
  -- Legacy player writes must not replay registration seeding after results.
  IF target_stage_id IS NULL OR (TG_OP = 'UPDATE' AND EXISTS (
    SELECT 1 FROM public.tournament_stages
    WHERE id = target_stage_id AND status <> 'planned'
  )) THEN
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

  IF stage_count = 1 AND NOT EXISTS (
    SELECT 1
    FROM public.tournament_routing_plans plan
    WHERE plan.tournament_id = NEW.tournament_id
  ) THEN
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
