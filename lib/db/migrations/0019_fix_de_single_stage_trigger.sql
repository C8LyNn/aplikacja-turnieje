-- Migration 0019: fix compat_create_single_stage and compat_sync_single_stage_from_tournament
-- to handle double_elimination seeding policy correctly.
--
-- Root cause: both trigger functions used
--   CASE NEW.format WHEN 'single_elimination' THEN 'standard_bracket' ELSE 'standings_order' END
-- which maps double_elimination → 'standings_order', violating the
-- tournament_stages_seeding_configuration constraint that requires
--   format IN ('single_elimination', 'double_elimination') → seeding_policy IN ('standard_bracket', 'random_bracket')
--
-- Fix: add WHEN 'double_elimination' THEN 'standard_bracket' to both CASE expressions.
-- Forward-only, non-destructive. Both functions are replaced in-place.

BEGIN;

CREATE OR REPLACE FUNCTION public.compat_create_single_stage()
  RETURNS trigger
  LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO public.tournament_stages (
    tournament_id, stage_key, position, name, format, status, participant_count,
    best_of, planned_rounds, current_round, total_rounds, ranking_policy,
    qualification_mode, seeding_policy, entry_seeding_policy,
    result_seeding_policy, random_reveal_order, winner_id, created_at,
    started_at, completed_at
  ) VALUES (
    NEW.id, 'stage-1', 1, 'Etap 1', NEW.format::text::public.tournament_stage_format,
    CASE NEW.status WHEN 'draft' THEN 'planned'::public.tournament_stage_status
      ELSE 'active'::public.tournament_stage_status END,
    0, NEW.default_best_of,
    CASE WHEN NEW.format = 'swiss' THEN COALESCE(NEW.swiss_rounds, NEW.total_rounds, 1) ELSE NULL END,
    NEW.current_round, NEW.total_rounds,
    CASE NEW.format
      WHEN 'swiss'  THEN 'swiss_v1'::public.stage_ranking_policy
      WHEN 'round_robin' THEN 'round_robin_v1'::public.stage_ranking_policy
      ELSE 'elimination_bracket_v1'::public.stage_ranking_policy
    END,
    'none',
    CASE NEW.format
      WHEN 'single_elimination' THEN 'standard_bracket'::public.stage_seeding_policy
      WHEN 'double_elimination' THEN 'standard_bracket'::public.stage_seeding_policy
      ELSE 'standings_order'::public.stage_seeding_policy
    END,
    'preserve', 'standings_order', 'instant',
    NEW.winner_id, NEW.created_at, NULL, NULL
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.compat_sync_single_stage_from_tournament()
  RETURNS trigger
  LANGUAGE plpgsql
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.tournament_routing_plans plan
    WHERE plan.tournament_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  IF (SELECT count(*) FROM public.tournament_stages WHERE tournament_id = NEW.id) = 1 THEN
    UPDATE public.tournament_stages
    SET
      format = NEW.format::text::public.tournament_stage_format,
      status = CASE NEW.status
        WHEN 'draft' THEN 'planned'::public.tournament_stage_status
        WHEN 'active' THEN 'active'::public.tournament_stage_status
        ELSE 'completed'::public.tournament_stage_status
      END,
      best_of = NEW.default_best_of,
      planned_rounds = CASE WHEN NEW.format = 'swiss' THEN
        COALESCE(NEW.swiss_rounds, NEW.total_rounds, 1)
      ELSE NULL END,
      current_round = NEW.current_round,
      total_rounds = NEW.total_rounds,
      ranking_policy = CASE NEW.format
        WHEN 'swiss' THEN 'swiss_v1'::public.stage_ranking_policy
        WHEN 'round_robin' THEN 'round_robin_v1'::public.stage_ranking_policy
        ELSE 'elimination_bracket_v1'::public.stage_ranking_policy
      END,
      seeding_policy = CASE NEW.format
        WHEN 'single_elimination' THEN 'standard_bracket'::public.stage_seeding_policy
        WHEN 'double_elimination' THEN 'standard_bracket'::public.stage_seeding_policy
        ELSE 'standings_order'::public.stage_seeding_policy
      END,
      result_seeding_policy = 'standings_order',
      winner_id = NEW.winner_id,
      started_at = CASE WHEN NEW.status = 'draft' THEN NULL ELSE started_at END,
      completed_at = CASE WHEN NEW.status = 'completed' THEN COALESCE(
        completed_at,
        (SELECT max(match.completed_at)
         FROM public.matches match
         WHERE match.tournament_id = NEW.id
           AND match.status = 'completed'
           AND match.completed_at IS NOT NULL)
      ) ELSE NULL END,
      version = version + 1
    WHERE tournament_id = NEW.id AND position = 1
      AND (
        format IS DISTINCT FROM NEW.format::text::public.tournament_stage_format
        OR status IS DISTINCT FROM CASE NEW.status
          WHEN 'draft' THEN 'planned'::public.tournament_stage_status
          WHEN 'active' THEN 'active'::public.tournament_stage_status
          ELSE 'completed'::public.tournament_stage_status
        END
        OR best_of IS DISTINCT FROM NEW.default_best_of
        OR planned_rounds IS DISTINCT FROM CASE WHEN NEW.format = 'swiss' THEN
          COALESCE(NEW.swiss_rounds, NEW.total_rounds, 1)
        ELSE NULL END
        OR current_round IS DISTINCT FROM NEW.current_round
        OR total_rounds IS DISTINCT FROM NEW.total_rounds
        OR ranking_policy IS DISTINCT FROM CASE NEW.format
          WHEN 'swiss' THEN 'swiss_v1'::public.stage_ranking_policy
          WHEN 'round_robin' THEN 'round_robin_v1'::public.stage_ranking_policy
          ELSE 'elimination_bracket_v1'::public.stage_ranking_policy
        END
        OR seeding_policy IS DISTINCT FROM CASE NEW.format
          WHEN 'single_elimination' THEN 'standard_bracket'::public.stage_seeding_policy
          WHEN 'double_elimination' THEN 'standard_bracket'::public.stage_seeding_policy
          ELSE 'standings_order'::public.stage_seeding_policy
        END
        OR result_seeding_policy IS DISTINCT FROM 'standings_order'::public.stage_result_seeding_policy
        OR winner_id IS DISTINCT FROM NEW.winner_id
      );
  END IF;
  RETURN NEW;
END;
$function$;

COMMIT;
