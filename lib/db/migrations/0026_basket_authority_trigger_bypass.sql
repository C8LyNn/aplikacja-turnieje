-- migration-runner-strip-begin
BEGIN;
-- migration-runner-strip-end

-- Basket-authority tournaments (basket_flow_authority_version = 1) own stage
-- capacity through their basket plan rather than through the legacy
-- advancing_count → next_participant_count chain.  Patch the cross-stage flow
-- validator to skip the mismatch check for these tournaments so that
-- Stage N advancing_count (routed quota) may legitimately differ from
-- Stage N+1 participant_count (routed + direct slots).
--
-- The terminal-stage guard (qualification_mode = 'none', advancing_count IS NULL)
-- is unchanged; it still fires for all tournaments.
CREATE OR REPLACE FUNCTION public.validate_tournament_stage_participant_flow()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  affected_tournament_id INTEGER := COALESCE(NEW.tournament_id, OLD.tournament_id);
  stage_count INTEGER;
  stage_row RECORD;
  next_participant_count INTEGER;
  expected_output INTEGER;
  smaller_group_size INTEGER;
  larger_group_count INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.tournament_id IS DISTINCT FROM NEW.tournament_id THEN
    RAISE EXCEPTION 'a tournament stage cannot move between tournaments';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tournaments WHERE id = affected_tournament_id
  ) THEN
    RETURN NULL;
  END IF;

  -- Basket-authority tournaments manage stage capacity via their basket plan;
  -- the legacy advancing_count cross-stage flow check must not fire for them.
  IF EXISTS (
    SELECT 1 FROM public.tournaments
    WHERE id = affected_tournament_id
      AND basket_flow_authority_version = 1
  ) THEN
    RETURN NULL;
  END IF;

  SELECT count(*)::INTEGER
  INTO stage_count
  FROM public.tournament_stages
  WHERE tournament_id = affected_tournament_id;

  IF stage_count <= 1 THEN
    RETURN NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM generate_series(1, stage_count) AS expected(position)
    LEFT JOIN public.tournament_stages stage
      ON stage.tournament_id = affected_tournament_id
     AND stage.position = expected.position
    WHERE stage.id IS NULL
  ) THEN
    RAISE EXCEPTION 'tournament % stage positions must be contiguous from 1', affected_tournament_id;
  END IF;

  FOR stage_row IN
    SELECT *
    FROM public.tournament_stages
    WHERE tournament_id = affected_tournament_id
    ORDER BY position
  LOOP
    IF stage_row.position = stage_count THEN
      IF stage_row.qualification_mode <> 'none' OR stage_row.advancing_count IS NOT NULL THEN
        RAISE EXCEPTION 'terminal stage % cannot feed another stage', stage_row.id;
      END IF;
      CONTINUE;
    END IF;

    SELECT participant_count
    INTO next_participant_count
    FROM public.tournament_stages
    WHERE tournament_id = affected_tournament_id
      AND position = stage_row.position + 1;

    IF stage_row.format IN ('swiss', 'round_robin', 'single_elimination') THEN
      IF stage_row.qualification_mode <> 'top_n' OR stage_row.advancing_count IS NULL THEN
        RAISE EXCEPTION 'stage % requires top_n qualification', stage_row.id;
      END IF;
      expected_output := stage_row.advancing_count;
    ELSIF stage_row.format = 'group_stage' THEN
      IF stage_row.qualification_mode <> 'top_n_per_group'
        OR stage_row.group_count IS NULL
        OR stage_row.qualifiers_per_group IS NULL
      THEN
        RAISE EXCEPTION 'group stage % has invalid qualification settings', stage_row.id;
      END IF;
      smaller_group_size := stage_row.participant_count / stage_row.group_count;
      larger_group_count := stage_row.participant_count % stage_row.group_count;
      expected_output :=
        larger_group_count * LEAST(stage_row.qualifiers_per_group, smaller_group_size + 1)
        + (stage_row.group_count - larger_group_count)
          * LEAST(stage_row.qualifiers_per_group, smaller_group_size);
    ELSE
      RAISE EXCEPTION 'stage % has unsupported format', stage_row.id;
    END IF;

    IF next_participant_count IS DISTINCT FROM expected_output THEN
      RAISE EXCEPTION
        'stage participant flow mismatch: stage % outputs %, next stage expects %',
        stage_row.id,
        expected_output,
        next_participant_count;
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$;

-- Migration 0017 added a guard to compat_sync_single_stage_from_tournament
-- that skips the format-sync for tournaments backed by a routing plan (DE).
-- Migration 0019 preserved it and added the double_elimination seeding-policy fix.
-- Migration 0025 (Marvel) introduced group_stage stages whose tournament
-- compat-format is 'round_robin', but the stage keeps format='group_stage'
-- with group_count/qualifiers_per_group set.  These tournaments do NOT have a
-- routing plan, so the 0017/0019 guard does not protect them.
--
-- This replacement adds a second guard: for stages whose format is already
-- 'group_stage', sync only the lifecycle fields (status, best_of, rounds,
-- winner, timestamps) and leave format, ranking_policy, seeding_policy,
-- planned_rounds, and the group columns untouched — they are owned by
-- the stage itself, not mirrored from tournaments.format.
CREATE OR REPLACE FUNCTION public.compat_sync_single_stage_from_tournament()
  RETURNS trigger
  LANGUAGE plpgsql
AS $function$
DECLARE
  stage_format public.tournament_stage_format;
BEGIN
  -- 0017/0019 guard: skip entirely for routing-plan-backed tournaments (DE etc.)
  IF EXISTS (
    SELECT 1
    FROM public.tournament_routing_plans
    WHERE tournament_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  IF (SELECT count(*) FROM public.tournament_stages WHERE tournament_id = NEW.id) <> 1 THEN
    RETURN NEW;
  END IF;

  SELECT format INTO stage_format
  FROM public.tournament_stages
  WHERE tournament_id = NEW.id AND position = 1;

  IF stage_format = 'group_stage' THEN
    -- Group-stage stages own their format and group configuration
    -- (e.g. Marvel elimination groups: format='group_stage', group_count=4,
    -- qualifiers_per_group=4 while tournament.format='round_robin').
    -- Sync only lifecycle fields to avoid violating format_configuration.
    UPDATE public.tournament_stages
    SET
      status = CASE NEW.status
        WHEN 'draft'  THEN 'planned'::public.tournament_stage_status
        WHEN 'active' THEN 'active'::public.tournament_stage_status
        ELSE               'completed'::public.tournament_stage_status
      END,
      best_of       = NEW.default_best_of,
      current_round = NEW.current_round,
      total_rounds  = NEW.total_rounds,
      winner_id     = NEW.winner_id,
      started_at    = CASE WHEN NEW.status = 'draft' THEN NULL ELSE started_at END,
      completed_at  = CASE WHEN NEW.status = 'completed' THEN COALESCE(
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
        status IS DISTINCT FROM CASE NEW.status
          WHEN 'draft'  THEN 'planned'::public.tournament_stage_status
          WHEN 'active' THEN 'active'::public.tournament_stage_status
          ELSE               'completed'::public.tournament_stage_status
        END
        OR best_of       IS DISTINCT FROM NEW.default_best_of
        OR current_round IS DISTINCT FROM NEW.current_round
        OR total_rounds  IS DISTINCT FROM NEW.total_rounds
        OR winner_id     IS DISTINCT FROM NEW.winner_id
      );
  ELSE
    -- Original behavior (0019): full format + lifecycle sync for legacy
    -- single-stage tournaments (swiss, round_robin, single_elimination).
    UPDATE public.tournament_stages
    SET
      format = NEW.format::text::public.tournament_stage_format,
      status = CASE NEW.status
        WHEN 'draft'  THEN 'planned'::public.tournament_stage_status
        WHEN 'active' THEN 'active'::public.tournament_stage_status
        ELSE               'completed'::public.tournament_stage_status
      END,
      best_of = NEW.default_best_of,
      planned_rounds = CASE WHEN NEW.format = 'swiss' THEN
        COALESCE(NEW.swiss_rounds, NEW.total_rounds, 1)
      ELSE NULL END,
      current_round = NEW.current_round,
      total_rounds  = NEW.total_rounds,
      ranking_policy = CASE NEW.format
        WHEN 'swiss'            THEN 'swiss_v1'::public.stage_ranking_policy
        WHEN 'round_robin'      THEN 'round_robin_v1'::public.stage_ranking_policy
        ELSE 'elimination_bracket_v1'::public.stage_ranking_policy
      END,
      seeding_policy = CASE NEW.format
        WHEN 'single_elimination' THEN 'standard_bracket'::public.stage_seeding_policy
        WHEN 'double_elimination' THEN 'standard_bracket'::public.stage_seeding_policy
        ELSE 'standings_order'::public.stage_seeding_policy
      END,
      result_seeding_policy = 'standings_order',
      winner_id  = NEW.winner_id,
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
          WHEN 'draft'  THEN 'planned'::public.tournament_stage_status
          WHEN 'active' THEN 'active'::public.tournament_stage_status
          ELSE               'completed'::public.tournament_stage_status
        END
        OR best_of IS DISTINCT FROM NEW.default_best_of
        OR planned_rounds IS DISTINCT FROM CASE WHEN NEW.format = 'swiss' THEN
          COALESCE(NEW.swiss_rounds, NEW.total_rounds, 1)
        ELSE NULL END
        OR current_round IS DISTINCT FROM NEW.current_round
        OR total_rounds  IS DISTINCT FROM NEW.total_rounds
        OR ranking_policy IS DISTINCT FROM CASE NEW.format
          WHEN 'swiss'       THEN 'swiss_v1'::public.stage_ranking_policy
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

-- migration-runner-strip-begin
COMMIT;
-- migration-runner-strip-end
