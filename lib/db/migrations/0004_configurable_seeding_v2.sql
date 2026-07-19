-- Configurable seeding and placement v2
-- Persists deterministic entry seeding, group/bracket placement, group result
-- reseeding, reveal metadata and a start-stage audit without changing matches.

ALTER TYPE public.stage_seeding_policy RENAME TO stage_seeding_policy_v1;
CREATE TYPE public.stage_seeding_policy AS ENUM (
  'standings_order',
  'snake_groups',
  'cross_group',
  'random_groups',
  'standard_bracket',
  'random_bracket'
);

ALTER TABLE public.tournament_stages
  ALTER COLUMN seeding_policy DROP DEFAULT,
  ALTER COLUMN seeding_policy TYPE public.stage_seeding_policy
    USING seeding_policy::text::public.stage_seeding_policy,
  ALTER COLUMN seeding_policy SET DEFAULT 'standings_order'::public.stage_seeding_policy;
DROP TYPE public.stage_seeding_policy_v1;

CREATE TYPE public.stage_entry_seeding_policy AS ENUM (
  'preserve',
  'registration_order',
  'alphabetical',
  'random',
  'manual'
);
CREATE TYPE public.stage_result_seeding_policy AS ENUM (
  'standings_order',
  'rank_bands',
  'global_ranking'
);
CREATE TYPE public.stage_random_reveal_order AS ENUM ('instant', 'sequential');

ALTER TABLE public.tournament_stages
  ADD COLUMN entry_seeding_policy public.stage_entry_seeding_policy NOT NULL DEFAULT 'preserve',
  ADD COLUMN result_seeding_policy public.stage_result_seeding_policy NOT NULL DEFAULT 'standings_order',
  ADD COLUMN random_seed TEXT,
  ADD COLUMN random_reveal_order public.stage_random_reveal_order NOT NULL DEFAULT 'instant',
  ADD COLUMN seeding_audit JSONB;

UPDATE public.tournament_stages
SET
  seeding_policy = CASE format
    WHEN 'group_stage' THEN 'snake_groups'::public.stage_seeding_policy
    WHEN 'single_elimination' THEN 'standard_bracket'::public.stage_seeding_policy
    ELSE 'standings_order'::public.stage_seeding_policy
  END,
  result_seeding_policy = CASE format
    WHEN 'group_stage' THEN 'rank_bands'::public.stage_result_seeding_policy
    ELSE 'standings_order'::public.stage_result_seeding_policy
  END;

ALTER TABLE public.tournament_stages
  ADD CONSTRAINT tournament_stages_seeding_configuration CHECK (
    (format IN ('swiss', 'round_robin') AND seeding_policy = 'standings_order')
    OR (format = 'group_stage' AND seeding_policy IN ('snake_groups', 'random_groups'))
    OR (format = 'single_elimination' AND seeding_policy IN ('standard_bracket', 'random_bracket'))
  ),
  ADD CONSTRAINT tournament_stages_result_seeding_configuration CHECK (
    (format = 'group_stage' AND result_seeding_policy IN ('rank_bands', 'global_ranking'))
    OR (format <> 'group_stage' AND result_seeding_policy = 'standings_order')
  ),
  ADD CONSTRAINT tournament_stages_random_seed_configuration CHECK (
    (random_seed IS NULL OR length(trim(random_seed)) BETWEEN 1 AND 200)
    AND (
      (
        entry_seeding_policy <> 'random'
        AND seeding_policy NOT IN ('random_groups', 'random_bracket')
      )
      OR random_seed IS NOT NULL
    )
  ),
  ADD CONSTRAINT tournament_stages_seeding_audit_shape CHECK (
    seeding_audit IS NULL OR jsonb_typeof(seeding_audit) = 'object'
  );

-- Keep the legacy one-stage compatibility projection valid under the stricter
-- placement constraints introduced above.
CREATE OR REPLACE FUNCTION public.compat_create_single_stage() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.compat_sync_single_stage_from_tournament() RETURNS trigger
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
