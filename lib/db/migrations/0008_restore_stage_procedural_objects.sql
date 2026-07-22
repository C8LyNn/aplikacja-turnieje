-- Restore the runtime functions and triggers required by Tournament Stages.
-- This forward-only migration changes no table data and is safe to replay.

-- migration-runner-strip-begin
BEGIN;
-- migration-runner-strip-end

DO $$
DECLARE
  missing_tables TEXT[];
  missing_columns TEXT[];
  missing_types TEXT[];
BEGIN
  SELECT array_agg(required_table ORDER BY required_table)
  INTO missing_tables
  FROM unnest(ARRAY[
    'tournaments', 'tournament_stages', 'stage_groups', 'stage_participants',
    'players', 'matches', 'result_history', 'action_log'
  ]) AS required(required_table)
  WHERE to_regclass(format('public.%I', required.required_table)) IS NULL;

  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION
      '0008_restore_stage_procedural_objects is missing tables: %',
      array_to_string(missing_tables, ', ');
  END IF;

  SELECT array_agg(
    required_table || '.' || required_column
    ORDER BY required_table, required_column
  )
  INTO missing_columns
  FROM (VALUES
    ('tournaments', 'id'),
    ('tournaments', 'format'),
    ('tournaments', 'status'),
    ('tournaments', 'default_best_of'),
    ('tournaments', 'swiss_rounds'),
    ('tournaments', 'current_round'),
    ('tournaments', 'total_rounds'),
    ('tournaments', 'active_stage_id'),
    ('tournaments', 'winner_id'),
    ('tournaments', 'created_at'),
    ('tournament_stages', 'id'),
    ('tournament_stages', 'tournament_id'),
    ('tournament_stages', 'stage_key'),
    ('tournament_stages', 'position'),
    ('tournament_stages', 'format'),
    ('tournament_stages', 'status'),
    ('tournament_stages', 'participant_count'),
    ('tournament_stages', 'best_of'),
    ('tournament_stages', 'planned_rounds'),
    ('tournament_stages', 'current_round'),
    ('tournament_stages', 'total_rounds'),
    ('tournament_stages', 'ranking_policy'),
    ('tournament_stages', 'qualification_mode'),
    ('tournament_stages', 'advancing_count'),
    ('tournament_stages', 'group_count'),
    ('tournament_stages', 'participants_per_group'),
    ('tournament_stages', 'qualifiers_per_group'),
    ('tournament_stages', 'seeding_policy'),
    ('tournament_stages', 'entry_seeding_policy'),
    ('tournament_stages', 'result_seeding_policy'),
    ('tournament_stages', 'random_reveal_order'),
    ('tournament_stages', 'winner_id'),
    ('tournament_stages', 'version'),
    ('tournament_stages', 'created_at'),
    ('tournament_stages', 'started_at'),
    ('tournament_stages', 'completed_at'),
    ('stage_groups', 'stage_id'),
    ('stage_groups', 'position'),
    ('stage_groups', 'participant_count'),
    ('stage_groups', 'qualifiers_count'),
    ('stage_participants', 'tournament_id'),
    ('stage_participants', 'stage_id'),
    ('stage_participants', 'player_id'),
    ('stage_participants', 'stage_seed'),
    ('stage_participants', 'status'),
    ('stage_participants', 'qualification_source'),
    ('stage_participants', 'created_at'),
    ('players', 'id'),
    ('players', 'tournament_id'),
    ('players', 'seed'),
    ('players', 'status'),
    ('players', 'created_at'),
    ('matches', 'id'),
    ('matches', 'tournament_id'),
    ('matches', 'stage_id'),
    ('matches', 'status'),
    ('matches', 'completed_at'),
    ('result_history', 'match_id'),
    ('result_history', 'stage_id'),
    ('action_log', 'match_id'),
    ('action_log', 'stage_id')
  ) AS required(required_table, required_column)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_attribute attribute
    WHERE attribute.attrelid = to_regclass(
        format('public.%I', required.required_table)
      )
      AND attribute.attname = required.required_column
      AND attribute.attnum > 0
      AND NOT attribute.attisdropped
  );

  IF missing_columns IS NOT NULL THEN
    RAISE EXCEPTION
      '0008_restore_stage_procedural_objects is missing columns: %',
      array_to_string(missing_columns, ', ');
  END IF;

  SELECT array_agg(required_type ORDER BY required_type)
  INTO missing_types
  FROM unnest(ARRAY[
    'tournament_status', 'tournament_stage_format',
    'tournament_stage_status', 'stage_ranking_policy',
    'stage_seeding_policy', 'stage_result_seeding_policy',
    'stage_participant_status'
  ]) AS required(required_type)
  WHERE to_regtype(format('public.%I', required.required_type)) IS NULL;

  IF missing_types IS NOT NULL THEN
    RAISE EXCEPTION
      '0008_restore_stage_procedural_objects is missing types: %',
      array_to_string(missing_types, ', ');
  END IF;

  IF to_regclass('public.stage_participants_stage_player_unique') IS NULL THEN
    RAISE EXCEPTION
      '0008_restore_stage_procedural_objects requires stage_participants_stage_player_unique';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.compat_create_single_stage()
RETURNS trigger
LANGUAGE plpgsql AS $$
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
    CASE NEW.format WHEN 'swiss' THEN 'swiss_v1'::public.stage_ranking_policy
      WHEN 'round_robin' THEN 'round_robin_v1'::public.stage_ranking_policy
      ELSE 'elimination_bracket_v1'::public.stage_ranking_policy END,
    'none',
    CASE NEW.format WHEN 'single_elimination' THEN 'standard_bracket'::public.stage_seeding_policy
      ELSE 'standings_order'::public.stage_seeding_policy END,
    'preserve', 'standings_order', 'instant',
    NEW.winner_id, NEW.created_at, NULL, NULL
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.compat_sync_single_stage_from_tournament()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT count(*) FROM public.tournament_stages WHERE tournament_id = NEW.id) = 1 THEN
    UPDATE public.tournament_stages
    SET
      format = NEW.format::text::public.tournament_stage_format,
      status = CASE NEW.status WHEN 'draft' THEN 'planned'::public.tournament_stage_status
        WHEN 'active' THEN 'active'::public.tournament_stage_status
        ELSE 'completed'::public.tournament_stage_status END,
      best_of = NEW.default_best_of,
      planned_rounds = CASE WHEN NEW.format = 'swiss' THEN
        COALESCE(NEW.swiss_rounds, NEW.total_rounds, 1)
      ELSE NULL END,
      current_round = NEW.current_round,
      total_rounds = NEW.total_rounds,
      ranking_policy = CASE NEW.format WHEN 'swiss' THEN 'swiss_v1'::public.stage_ranking_policy
        WHEN 'round_robin' THEN 'round_robin_v1'::public.stage_ranking_policy
        ELSE 'elimination_bracket_v1'::public.stage_ranking_policy END,
      seeding_policy = CASE NEW.format WHEN 'single_elimination' THEN
        'standard_bracket'::public.stage_seeding_policy
        ELSE 'standings_order'::public.stage_seeding_policy END,
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
          ELSE 'standings_order'::public.stage_seeding_policy
        END
        OR result_seeding_policy IS DISTINCT FROM 'standings_order'::public.stage_result_seeding_policy
        OR winner_id IS DISTINCT FROM NEW.winner_id
      );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_single_stage_lifecycle_alignment()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  current_tournament_status public.tournament_status;
BEGIN
  SELECT status INTO current_tournament_status
  FROM public.tournaments
  WHERE id = NEW.id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF (SELECT count(*) FROM public.tournament_stages WHERE tournament_id = NEW.id) = 1
     AND NOT EXISTS (
       SELECT 1
       FROM public.tournament_stages stage
       WHERE stage.tournament_id = NEW.id
         AND stage.status = CASE current_tournament_status
           WHEN 'draft' THEN 'planned'::public.tournament_stage_status
           WHEN 'active' THEN 'active'::public.tournament_stage_status
           ELSE 'completed'::public.tournament_stage_status
         END
     ) THEN
    RAISE EXCEPTION 'single-stage lifecycle must match tournament % status', NEW.id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.compat_sync_active_stage_pointer()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status = 'active' THEN
    IF NEW.status = 'active' THEN
      UPDATE public.tournaments
      SET active_stage_id = NEW.id
      WHERE id = NEW.tournament_id AND active_stage_id IS DISTINCT FROM NEW.id;
    END IF;
  ELSIF OLD.status = 'active' THEN
    UPDATE public.tournaments
    SET active_stage_id = NULL
    WHERE id = NEW.tournament_id AND active_stage_id = OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_active_stage_pointer()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.active_stage_id IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.tournament_stages
      WHERE tournament_id = NEW.id AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'active_stage_id is required while tournament % has an active stage', NEW.id;
    END IF;
  ELSIF NOT EXISTS (
    SELECT 1 FROM public.tournament_stages
    WHERE tournament_id = NEW.id AND id = NEW.active_stage_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'active_stage_id % must identify the active stage of tournament %', NEW.active_stage_id, NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_stage_group_configuration()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  stage_format public.tournament_stage_format;
  expected_group_count INTEGER;
  total_participant_count INTEGER;
  expected_qualifiers_limit INTEGER;
  smaller_group_size INTEGER;
  larger_group_count INTEGER;
  expected_participant_count INTEGER;
  expected_qualifiers_count INTEGER;
BEGIN
  SELECT
    format,
    group_count,
    participant_count,
    qualifiers_per_group
  INTO
    stage_format,
    expected_group_count,
    total_participant_count,
    expected_qualifiers_limit
  FROM public.tournament_stages
  WHERE id = NEW.stage_id;

  IF stage_format IS DISTINCT FROM 'group_stage'::public.tournament_stage_format THEN
    RAISE EXCEPTION 'stage_groups may belong only to group_stage';
  END IF;
  IF NEW.position < 1 OR NEW.position > expected_group_count THEN
    RAISE EXCEPTION 'stage group position must fit its tournament stage';
  END IF;

  smaller_group_size := total_participant_count / expected_group_count;
  larger_group_count := total_participant_count % expected_group_count;
  expected_participant_count := smaller_group_size
    + CASE WHEN NEW.position <= larger_group_count THEN 1 ELSE 0 END;
  expected_qualifiers_count := LEAST(
    expected_participant_count,
    expected_qualifiers_limit
  );

  IF NEW.participant_count <> expected_participant_count
     OR NEW.qualifiers_count <> expected_qualifiers_count THEN
    RAISE EXCEPTION 'stage group configuration must match its balanced tournament stage';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_last_tournament_stage_delete()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.tournaments WHERE id = OLD.tournament_id)
     AND NOT EXISTS (
       SELECT 1 FROM public.tournament_stages
       WHERE tournament_id = OLD.tournament_id
     ) THEN
    RAISE EXCEPTION 'tournament % must retain at least one stage', OLD.tournament_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.compat_prepare_single_stage_player_seed()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  target_stage_id INTEGER;
BEGIN
  IF current_setting('tournament_manager.resequencing', true) = 'on' THEN
    RETURN NEW;
  END IF;
  SELECT id INTO target_stage_id
  FROM public.tournament_stages
  WHERE tournament_id = NEW.tournament_id AND position = 1;
  IF target_stage_id IS NULL THEN
    RAISE EXCEPTION 'Tournament % has no stage 1', NEW.tournament_id;
  END IF;
  IF NEW.seed IS NULL THEN
    SELECT COALESCE(max(stage_seed), 0) + 1 INTO NEW.seed
    FROM public.stage_participants
    WHERE stage_id = target_stage_id AND (TG_OP = 'INSERT' OR player_id <> NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.compat_resequence_single_stage_participants(
  target_tournament_id INTEGER,
  target_stage_id INTEGER
) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('tournament_manager.resequencing', true) = 'on' THEN
    RETURN;
  END IF;

  PERFORM set_config('tournament_manager.resequencing', 'on', true);
  WITH ranked_players AS (
    SELECT
      player.id,
      row_number() OVER (
        ORDER BY player.seed ASC NULLS LAST, player.id ASC
      )::integer AS normalized_seed
    FROM public.players player
    WHERE player.tournament_id = target_tournament_id
  )
  UPDATE public.players player
  SET seed = ranked.normalized_seed
  FROM ranked_players ranked
  WHERE player.id = ranked.id
    AND player.seed IS DISTINCT FROM ranked.normalized_seed;

  UPDATE public.stage_participants participant
  SET stage_seed = player.seed
  FROM public.players player
  WHERE participant.stage_id = target_stage_id
    AND player.id = participant.player_id
    AND player.tournament_id = target_tournament_id
    AND participant.stage_seed IS DISTINCT FROM player.seed;
  PERFORM set_config('tournament_manager.resequencing', 'off', true);
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

CREATE OR REPLACE FUNCTION public.compat_assign_single_stage_match()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  target_stage_id INTEGER;
  stage_count INTEGER;
BEGIN
  IF NEW.stage_id IS NULL OR NEW.stage_id = 0 THEN
    SELECT count(*), min(id) INTO stage_count, target_stage_id
    FROM public.tournament_stages WHERE tournament_id = NEW.tournament_id;
    IF stage_count <> 1 THEN
      RAISE EXCEPTION 'stage_id is required when tournament % does not have exactly one stage', NEW.tournament_id;
    END IF;
    NEW.stage_id := target_stage_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.compat_assign_result_history_stage()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stage_id IS NULL OR NEW.stage_id = 0 THEN
    SELECT stage_id INTO NEW.stage_id FROM public.matches WHERE id = NEW.match_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.compat_assign_action_log_stage()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stage_id IS NULL AND NEW.match_id IS NOT NULL THEN
    SELECT stage_id INTO NEW.stage_id FROM public.matches WHERE id = NEW.match_id;
  END IF;
  RETURN NEW;
END;
$$;

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

DROP TRIGGER IF EXISTS tournaments_create_single_stage ON public.tournaments;
CREATE TRIGGER tournaments_create_single_stage
AFTER INSERT ON public.tournaments
FOR EACH ROW EXECUTE FUNCTION public.compat_create_single_stage();

DROP TRIGGER IF EXISTS tournaments_sync_single_stage ON public.tournaments;
CREATE TRIGGER tournaments_sync_single_stage
AFTER UPDATE OF format, status, default_best_of, swiss_rounds,
  current_round, total_rounds, winner_id
ON public.tournaments
FOR EACH ROW EXECUTE FUNCTION public.compat_sync_single_stage_from_tournament();

DROP TRIGGER IF EXISTS tournaments_validate_single_stage_lifecycle
  ON public.tournaments;
CREATE CONSTRAINT TRIGGER tournaments_validate_single_stage_lifecycle
AFTER INSERT OR UPDATE ON public.tournaments
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION public.validate_single_stage_lifecycle_alignment();

DROP TRIGGER IF EXISTS tournament_stages_sync_active_pointer
  ON public.tournament_stages;
CREATE TRIGGER tournament_stages_sync_active_pointer
AFTER INSERT OR UPDATE OF status ON public.tournament_stages
FOR EACH ROW EXECUTE FUNCTION public.compat_sync_active_stage_pointer();

DROP TRIGGER IF EXISTS tournaments_validate_active_stage_pointer
  ON public.tournaments;
CREATE TRIGGER tournaments_validate_active_stage_pointer
BEFORE UPDATE OF active_stage_id ON public.tournaments
FOR EACH ROW EXECUTE FUNCTION public.validate_active_stage_pointer();

DROP TRIGGER IF EXISTS stage_groups_validate_configuration
  ON public.stage_groups;
CREATE TRIGGER stage_groups_validate_configuration
BEFORE INSERT OR UPDATE OF stage_id, position, participant_count, qualifiers_count
ON public.stage_groups
FOR EACH ROW EXECUTE FUNCTION public.validate_stage_group_configuration();

DROP TRIGGER IF EXISTS tournament_stages_require_at_least_one
  ON public.tournament_stages;
CREATE CONSTRAINT TRIGGER tournament_stages_require_at_least_one
AFTER DELETE ON public.tournament_stages
DEFERRABLE INITIALLY IMMEDIATE
FOR EACH ROW EXECUTE FUNCTION public.prevent_last_tournament_stage_delete();

DROP TRIGGER IF EXISTS players_prepare_single_stage_seed ON public.players;
CREATE TRIGGER players_prepare_single_stage_seed
BEFORE INSERT OR UPDATE OF seed ON public.players
FOR EACH ROW EXECUTE FUNCTION public.compat_prepare_single_stage_player_seed();

DROP TRIGGER IF EXISTS players_sync_single_stage_participant ON public.players;
CREATE TRIGGER players_sync_single_stage_participant
AFTER INSERT OR UPDATE OF seed, status ON public.players
FOR EACH ROW EXECUTE FUNCTION public.compat_sync_single_stage_participant();

DROP TRIGGER IF EXISTS players_count_single_stage_after_delete ON public.players;
CREATE TRIGGER players_count_single_stage_after_delete
AFTER DELETE ON public.players
FOR EACH ROW EXECUTE FUNCTION public.compat_count_single_stage_participants_after_delete();

DROP TRIGGER IF EXISTS matches_assign_single_stage ON public.matches;
CREATE TRIGGER matches_assign_single_stage
BEFORE INSERT OR UPDATE OF tournament_id, stage_id ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.compat_assign_single_stage_match();

DROP TRIGGER IF EXISTS result_history_assign_stage ON public.result_history;
CREATE TRIGGER result_history_assign_stage
BEFORE INSERT OR UPDATE OF match_id, stage_id ON public.result_history
FOR EACH ROW EXECUTE FUNCTION public.compat_assign_result_history_stage();

DROP TRIGGER IF EXISTS action_log_assign_stage ON public.action_log;
CREATE TRIGGER action_log_assign_stage
BEFORE INSERT OR UPDATE OF match_id, stage_id ON public.action_log
FOR EACH ROW EXECUTE FUNCTION public.compat_assign_action_log_stage();

DROP TRIGGER IF EXISTS tournament_stages_validate_participant_flow
  ON public.tournament_stages;
CREATE CONSTRAINT TRIGGER tournament_stages_validate_participant_flow
AFTER INSERT OR UPDATE OR DELETE ON public.tournament_stages
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION public.validate_tournament_stage_participant_flow();

-- migration-runner-strip-begin
COMMIT;
-- migration-runner-strip-end
