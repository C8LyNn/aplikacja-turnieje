-- Tournament Engine V2: mutable execution snapshots for sealed routing plans.
-- Double Elimination itself is represented by the generic compiled routing
-- graph and is exposed as a first-class TournamentStage format.

-- migration-runner-strip-begin
BEGIN;
SELECT pg_advisory_xact_lock(841730034);
-- migration-runner-strip-end

DO $prerequisites$
DECLARE
  required_table TEXT;
  required_column TEXT;
BEGIN
  FOREACH required_table IN ARRAY ARRAY[
    'matches',
    'tournament_routing_plans',
    'tournament_routing_stages'
  ] LOOP
    IF to_regclass('public.' || required_table) IS NULL THEN
      RAISE EXCEPTION '0017 prerequisite failed: table public.% is missing', required_table;
    END IF;
  END LOOP;

  FOREACH required_column IN ARRAY ARRAY[
    'tournament_routing_stages.plan_id',
    'tournament_routing_stages.stage_key'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns column_row
      WHERE column_row.table_schema = current_schema()
        AND column_row.table_name = split_part(required_column, '.', 1)
        AND column_row.column_name = split_part(required_column, '.', 2)
    ) THEN
      RAISE EXCEPTION '0017 prerequisite failed: column public.% is missing', required_column;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint constraint_row
    WHERE constraint_row.conrelid = 'public.tournament_routing_stages'::regclass
      AND constraint_row.conname = 'tournament_routing_stages_plan_key_unique'
      AND constraint_row.contype = 'u'
      AND constraint_row.convalidated
      AND pg_get_constraintdef(constraint_row.oid) = 'UNIQUE (plan_id, stage_key)'
  ) THEN
    RAISE EXCEPTION
      '0017 prerequisite failed: canonical routing stage key constraint is missing';
  END IF;
END;
$prerequisites$;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS routing_match_key text;

DO $routing_match_constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.matches'::regclass
      AND conname = 'matches_stage_routing_match_key_unique'
  ) THEN
    ALTER TABLE public.matches
      ADD CONSTRAINT matches_stage_routing_match_key_unique
      UNIQUE (stage_id, routing_match_key);
  END IF;
END
$routing_match_constraint$;

ALTER TYPE public.tournament_stage_format
  ADD VALUE IF NOT EXISTS 'double_elimination';

ALTER TABLE public.tournament_stages
  DROP CONSTRAINT IF EXISTS tournament_stages_position_range;
ALTER TABLE public.tournament_stages
  ADD CONSTRAINT tournament_stages_position_range
  CHECK (position BETWEEN 1 AND 10) NOT VALID;
ALTER TABLE public.tournament_stages
  VALIDATE CONSTRAINT tournament_stages_position_range;

ALTER TABLE public.tournament_stages
  DROP CONSTRAINT IF EXISTS tournament_stages_seeding_configuration;
ALTER TABLE public.tournament_stages
  ADD CONSTRAINT tournament_stages_seeding_configuration CHECK (
    (format::text IN ('swiss', 'round_robin') AND seeding_policy = 'standings_order')
    OR (format::text = 'group_stage' AND seeding_policy IN ('snake_groups', 'random_groups'))
    OR (format::text IN ('single_elimination', 'double_elimination')
      AND seeding_policy IN ('standard_bracket', 'random_bracket'))
  ) NOT VALID;
ALTER TABLE public.tournament_stages
  VALIDATE CONSTRAINT tournament_stages_seeding_configuration;

ALTER TABLE public.tournament_stages
  DROP CONSTRAINT IF EXISTS tournament_stages_format_configuration;
ALTER TABLE public.tournament_stages
  ADD CONSTRAINT tournament_stages_format_configuration CHECK (
    (format::text = 'swiss' AND ranking_policy = 'swiss_v1' AND planned_rounds IS NOT NULL
      AND group_count IS NULL AND participants_per_group IS NULL AND qualifiers_per_group IS NULL)
    OR (format::text = 'round_robin' AND ranking_policy = 'round_robin_v1' AND planned_rounds IS NULL
      AND group_count IS NULL AND participants_per_group IS NULL AND qualifiers_per_group IS NULL)
    OR (format::text IN ('single_elimination', 'double_elimination')
      AND ranking_policy = 'elimination_bracket_v1' AND planned_rounds IS NULL
      AND group_count IS NULL AND participants_per_group IS NULL AND qualifiers_per_group IS NULL)
    OR (format::text = 'group_stage' AND ranking_policy = 'group_v1' AND planned_rounds IS NULL
      AND group_count >= 1 AND group_count * 2 <= participant_count
      AND participants_per_group >= 2
      AND participant_count <= group_count * participants_per_group
      AND participant_count > group_count * (participants_per_group - 1)
      AND qualifiers_per_group BETWEEN 1 AND participants_per_group)
  ) NOT VALID;
ALTER TABLE public.tournament_stages
  VALIDATE CONSTRAINT tournament_stages_format_configuration;

CREATE TABLE IF NOT EXISTS public.tournament_routing_executions (
  plan_id INTEGER NOT NULL,
  stage_key TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tournament_routing_executions_pk
    PRIMARY KEY (plan_id, stage_key),
  CONSTRAINT tournament_routing_executions_stage_fk
    FOREIGN KEY (plan_id, stage_key)
    REFERENCES public.tournament_routing_stages(plan_id, stage_key)
    ON DELETE CASCADE,
  CONSTRAINT tournament_routing_executions_revision_positive
    CHECK (revision > 0),
  CONSTRAINT tournament_routing_executions_state_object
    CHECK (jsonb_typeof(state) = 'object')
);

-- The legacy one-stage compatibility triggers predate compiled routing plans.
-- Keep their historical behaviour for tournaments without a V2 plan, but do
-- not let a later tournament status update overwrite an authored V2 stage.
CREATE OR REPLACE FUNCTION public.compat_sync_single_stage_from_tournament()
RETURNS trigger
LANGUAGE plpgsql AS $$
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

  IF stage_count = 1 AND NOT EXISTS (
    SELECT 1
    FROM public.tournament_routing_plans plan
    WHERE plan.tournament_id = OLD.tournament_id
  ) THEN
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

DO $postconditions$
DECLARE
  expected_columns TEXT[] := ARRAY[
    'plan_id:integer:NO',
    'stage_key:text:NO',
    'revision:integer:NO',
    'state:jsonb:NO',
    'created_at:timestamp with time zone:NO',
    'updated_at:timestamp with time zone:NO'
  ];
  actual_columns TEXT[];
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns column_row
    WHERE column_row.table_schema = current_schema()
      AND column_row.table_name = 'matches'
      AND column_row.column_name = 'routing_match_key'
      AND column_row.data_type = 'text'
      AND column_row.is_nullable = 'YES'
  ) THEN
    RAISE EXCEPTION '0017 postcondition failed: matches.routing_match_key differs';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint constraint_row
    WHERE constraint_row.conrelid = 'public.matches'::regclass
      AND constraint_row.conname = 'matches_stage_routing_match_key_unique'
      AND constraint_row.contype = 'u'
      AND constraint_row.convalidated
      AND pg_get_constraintdef(constraint_row.oid) =
        'UNIQUE (stage_id, routing_match_key)'
  ) THEN
    RAISE EXCEPTION '0017 postcondition failed: canonical match routing key constraint differs';
  END IF;

  SELECT array_agg(
    column_row.column_name || ':' || column_row.data_type || ':' || column_row.is_nullable
    ORDER BY column_row.ordinal_position
  )
  INTO actual_columns
  FROM information_schema.columns column_row
  WHERE column_row.table_schema = current_schema()
    AND column_row.table_name = 'tournament_routing_executions';

  IF actual_columns IS DISTINCT FROM expected_columns THEN
    RAISE EXCEPTION
      '0017 postcondition failed: execution table columns differ (actual=%)',
      actual_columns;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint constraint_row
    WHERE constraint_row.conrelid = 'public.tournament_routing_executions'::regclass
      AND constraint_row.conname = 'tournament_routing_executions_pk'
      AND constraint_row.contype = 'p'
      AND constraint_row.convalidated
      AND pg_get_constraintdef(constraint_row.oid) = 'PRIMARY KEY (plan_id, stage_key)'
  ) THEN
    RAISE EXCEPTION '0017 postcondition failed: execution primary key differs';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint constraint_row
    WHERE constraint_row.conrelid = 'public.tournament_routing_executions'::regclass
      AND constraint_row.conname = 'tournament_routing_executions_stage_fk'
      AND constraint_row.contype = 'f'
      AND constraint_row.confrelid = 'public.tournament_routing_stages'::regclass
      AND constraint_row.confdeltype = 'c'
      AND constraint_row.convalidated
      AND pg_get_constraintdef(constraint_row.oid) =
        'FOREIGN KEY (plan_id, stage_key) REFERENCES tournament_routing_stages(plan_id, stage_key) ON DELETE CASCADE'
  ) THEN
    RAISE EXCEPTION '0017 postcondition failed: execution stage FK differs';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint constraint_row
    WHERE constraint_row.conrelid = 'public.tournament_routing_executions'::regclass
      AND constraint_row.conname = 'tournament_routing_executions_revision_positive'
      AND constraint_row.contype = 'c'
      AND constraint_row.convalidated
      AND pg_get_constraintdef(constraint_row.oid) = 'CHECK ((revision > 0))'
  ) THEN
    RAISE EXCEPTION '0017 postcondition failed: revision check differs';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint constraint_row
    WHERE constraint_row.conrelid = 'public.tournament_routing_executions'::regclass
      AND constraint_row.conname = 'tournament_routing_executions_state_object'
      AND constraint_row.contype = 'c'
      AND constraint_row.convalidated
      AND pg_get_constraintdef(constraint_row.oid) =
        'CHECK ((jsonb_typeof(state) = ''object''::text))'
  ) THEN
    RAISE EXCEPTION '0017 postcondition failed: state object check differs';
  END IF;
END;
$postconditions$;

-- migration-runner-strip-begin
COMMIT;
-- migration-runner-strip-end
