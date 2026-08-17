-- Migration 0025: persisted Marvel elimination-group rounds inside one stage.
-- The runtime is isolated from legacy stage_groups because that table models
-- a single round-robin grouping layer and cannot preserve round-to-round flow.

-- migration-runner-strip-begin
BEGIN;
SELECT pg_advisory_xact_lock(841730040);
-- migration-runner-strip-end

DO $prerequisites$
BEGIN
  IF to_regclass('public.tournament_stages') IS NULL THEN
    RAISE EXCEPTION '0025 prerequisite failed: table public.tournament_stages is missing';
  END IF;
  IF to_regclass('public.players') IS NULL THEN
    RAISE EXCEPTION '0025 prerequisite failed: table public.players is missing';
  END IF;
END;
$prerequisites$;

CREATE TABLE public.marvel_stage_rounds (
  id serial PRIMARY KEY,
  tournament_id integer NOT NULL,
  stage_id integer NOT NULL,
  round_number integer NOT NULL CHECK (round_number > 0),
  participant_count integer NOT NULL CHECK (participant_count > 0),
  group_size integer NOT NULL CHECK (group_size >= 2),
  advancing_count integer NOT NULL,
  kill_limit integer NOT NULL CHECK (kill_limit > 0),
  regrouping_strategy text NOT NULL CHECK (regrouping_strategy IN ('paired_merge', 'random', 'manual')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'awaiting_manual', 'completed')),
  random_seed text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT marvel_stage_rounds_advancing_range CHECK (advancing_count BETWEEN 1 AND group_size - 1),
  CONSTRAINT marvel_stage_rounds_stage_round_unique UNIQUE (stage_id, round_number),
  CONSTRAINT marvel_stage_rounds_tournament_stage_id_unique UNIQUE (tournament_id, stage_id, id),
  CONSTRAINT marvel_stage_rounds_stage_fk FOREIGN KEY (tournament_id, stage_id)
    REFERENCES public.tournament_stages (tournament_id, id) ON DELETE CASCADE
);

CREATE TABLE public.marvel_stage_groups (
  id serial PRIMARY KEY,
  tournament_id integer NOT NULL,
  stage_id integer NOT NULL,
  round_id integer NOT NULL,
  group_key text NOT NULL CHECK (length(group_key) > 0),
  position integer NOT NULL CHECK (position > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marvel_stage_groups_round_key_unique UNIQUE (round_id, group_key),
  CONSTRAINT marvel_stage_groups_round_position_unique UNIQUE (round_id, position),
  CONSTRAINT marvel_stage_groups_tournament_stage_id_unique UNIQUE (tournament_id, stage_id, id),
  CONSTRAINT marvel_stage_groups_tournament_id_unique UNIQUE (tournament_id, id),
  CONSTRAINT marvel_stage_groups_tournament_stage_round_id_unique
    UNIQUE (tournament_id, stage_id, round_id, id),
  CONSTRAINT marvel_stage_groups_round_fk FOREIGN KEY (tournament_id, stage_id, round_id)
    REFERENCES public.marvel_stage_rounds (tournament_id, stage_id, id) ON DELETE CASCADE
);

CREATE TABLE public.marvel_stage_group_entries (
  id serial PRIMARY KEY,
  tournament_id integer NOT NULL,
  stage_id integer NOT NULL,
  round_id integer NOT NULL,
  group_id integer NOT NULL,
  player_id integer NOT NULL,
  source_group_id integer,
  group_slot integer NOT NULL CHECK (group_slot > 0),
  placement integer,
  kills integer CHECK (kills IS NULL OR kills >= 0),
  qualified boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marvel_stage_group_entries_round_player_unique UNIQUE (round_id, player_id),
  CONSTRAINT marvel_stage_group_entries_group_slot_unique UNIQUE (group_id, group_slot),
  CONSTRAINT marvel_stage_group_entries_group_placement_unique UNIQUE (group_id, placement),
  CONSTRAINT marvel_stage_group_entries_result_values CHECK (
    (placement IS NULL AND qualified IS NULL)
    OR (placement > 0 AND qualified IS NOT NULL)
  ),
  CONSTRAINT marvel_stage_group_entries_group_fk
    FOREIGN KEY (tournament_id, stage_id, round_id, group_id)
    REFERENCES public.marvel_stage_groups (tournament_id, stage_id, round_id, id) ON DELETE CASCADE,
  CONSTRAINT marvel_stage_group_entries_round_fk FOREIGN KEY (tournament_id, stage_id, round_id)
    REFERENCES public.marvel_stage_rounds (tournament_id, stage_id, id) ON DELETE CASCADE,
  CONSTRAINT marvel_stage_group_entries_source_group_fk FOREIGN KEY (tournament_id, source_group_id)
    REFERENCES public.marvel_stage_groups (tournament_id, id) ON DELETE CASCADE,
  CONSTRAINT marvel_stage_group_entries_player_fk FOREIGN KEY (tournament_id, player_id)
    REFERENCES public.players (tournament_id, id) ON DELETE CASCADE
);

DO $postconditions$
DECLARE
  required_constraint text;
BEGIN
  IF to_regclass('public.marvel_stage_rounds') IS NULL
    OR to_regclass('public.marvel_stage_groups') IS NULL
    OR to_regclass('public.marvel_stage_group_entries') IS NULL THEN
    RAISE EXCEPTION '0025 postcondition failed: Marvel runtime tables are incomplete';
  END IF;

  FOREACH required_constraint IN ARRAY ARRAY[
    'marvel_stage_rounds_stage_fk',
    'marvel_stage_groups_round_fk',
    'marvel_stage_group_entries_group_fk',
    'marvel_stage_group_entries_round_fk',
    'marvel_stage_group_entries_source_group_fk',
    'marvel_stage_group_entries_player_fk'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = required_constraint
        AND convalidated
    ) THEN
      RAISE EXCEPTION '0025 postcondition failed: constraint % is missing or unvalidated', required_constraint;
    END IF;
  END LOOP;
END;
$postconditions$;

-- migration-runner-strip-begin
COMMIT;
-- migration-runner-strip-end
