-- V5.10 — two-legged knockout ties (dwumecz) in single-elimination stages.
-- Additive and backward compatible:
--   * tournament_stages.match_rules may now also be { "version": 1, "kind": "two_legs",
--     "levelAggregate": "organizer_decision" } — only in a single_elimination stage with best_of = 1 and no
--     draw rules. Existing 'sets' rules keep exactly the V5.7 conditions. NULL keeps the existing meaning.
--   * A two-legged tie is the existing bracket match row (its result = the aggregate, its winner advances as
--     before). The two legs live in match_legs (own date, score, revision). Scores are stored from the tie's
--     point of view: score1 = participant 1 (home in leg 1), score2 = participant 2 (home in leg 2).
--   * match_tie_decisions holds the organizer's decision for a level aggregate (winner + reason); the tie is
--     never decided by the system on a level aggregate.
--   * match_tie_history is the append-only history of legs and decisions (recorded / reverted).
--   * No existing row changes: old stages have no legs and no decisions.
-- Rollback (two-legged data is lost; export a Backup V3 first if any stage uses it —
-- SELECT count(*) FROM public.tournament_stages WHERE match_rules->>'kind' = 'two_legs'):
--   DROP TABLE IF EXISTS public.match_tie_history;
--   DROP TABLE IF EXISTS public.match_tie_decisions;
--   DROP TABLE IF EXISTS public.match_legs;
--   ALTER TABLE public.tournament_stages DROP CONSTRAINT IF EXISTS tournament_stages_two_legs_supported;
--   (only when no stage uses two_legs) re-create tournament_stages_match_rules_supported from 0046.

-- The V5.7 check allowed only 'sets'. It is replaced in place (same name, so 0046 stays satisfied) by a check
-- that keeps the V5.7 'sets' conditions and adds the 'two_legs' kind.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tournament_stages'::regclass AND conname = 'tournament_stages_match_rules_supported'
      AND pg_get_constraintdef(oid) LIKE '%two_legs%') THEN
    ALTER TABLE public.tournament_stages DROP CONSTRAINT IF EXISTS tournament_stages_match_rules_supported;
    ALTER TABLE public.tournament_stages ADD CONSTRAINT tournament_stages_match_rules_supported
      CHECK (match_rules IS NULL OR (
        jsonb_typeof(match_rules) = 'object'
        AND COALESCE(match_rules->>'version', '') = '1'
        AND pg_column_size(match_rules) <= 1024
        AND (
          (match_rules->>'kind' = 'sets'
            AND COALESCE(match_rules->>'setsToWin', '') ~ '^[1-4]$'
            AND COALESCE(match_rules->>'winBy', '') ~ '^[12]$'
            AND COALESCE(match_rules->>'pointsPerSet', '') ~ '^([3-9]|[1-9][0-9])$'
            AND best_of = 2 * (CASE WHEN COALESCE(match_rules->>'setsToWin', '') ~ '^[1-4]$' THEN (match_rules->>'setsToWin')::int ELSE 0 END) - 1
            AND (league_rules IS NULL OR COALESCE(league_rules->>'allowDraws', 'false') = 'false'))
          OR (match_rules->>'kind' = 'two_legs'
            AND COALESCE(match_rules->>'levelAggregate', '') = 'organizer_decision'
            AND best_of = 1)
        )));
  END IF;
END $$;

-- A two-legged tie runs only in a single-elimination stage (separate, named check: evidence of 0047).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tournament_stages'::regclass AND conname = 'tournament_stages_two_legs_supported') THEN
    ALTER TABLE public.tournament_stages ADD CONSTRAINT tournament_stages_two_legs_supported
      CHECK (match_rules IS NULL OR match_rules->>'kind' IS DISTINCT FROM 'two_legs'
        OR (format = 'single_elimination' AND league_rules IS NULL));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.match_legs (
  id serial PRIMARY KEY,
  tournament_id integer NOT NULL,
  stage_id integer NOT NULL,
  match_id integer NOT NULL,
  leg smallint NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  score1 integer,
  score2 integer,
  scheduled_at timestamp,
  completed_at timestamp,
  revision integer NOT NULL DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT match_legs_match_fk FOREIGN KEY (tournament_id, stage_id, match_id)
    REFERENCES public.matches (tournament_id, stage_id, id) ON DELETE CASCADE,
  CONSTRAINT match_legs_match_leg_unique UNIQUE (match_id, leg),
  CONSTRAINT match_legs_leg_supported CHECK (leg IN (1, 2)),
  CONSTRAINT match_legs_status_supported CHECK (status IN ('pending', 'completed')),
  CONSTRAINT match_legs_result_shape CHECK (
    (status = 'pending' AND score1 IS NULL AND score2 IS NULL AND completed_at IS NULL)
    OR (status = 'completed' AND score1 BETWEEN 0 AND 999 AND score2 BETWEEN 0 AND 999 AND completed_at IS NOT NULL)),
  CONSTRAINT match_legs_revision_positive CHECK (revision > 0)
);
CREATE INDEX IF NOT EXISTS match_legs_stage_idx ON public.match_legs (stage_id);

CREATE TABLE IF NOT EXISTS public.match_tie_decisions (
  match_id integer PRIMARY KEY,
  tournament_id integer NOT NULL,
  stage_id integer NOT NULL,
  winner_id integer NOT NULL,
  reason text NOT NULL,
  decided_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT match_tie_decisions_match_fk FOREIGN KEY (tournament_id, stage_id, match_id)
    REFERENCES public.matches (tournament_id, stage_id, id) ON DELETE CASCADE,
  CONSTRAINT match_tie_decisions_reason_length CHECK (char_length(btrim(reason)) BETWEEN 1 AND 300)
);

CREATE TABLE IF NOT EXISTS public.match_tie_history (
  id serial PRIMARY KEY,
  tournament_id integer NOT NULL,
  stage_id integer NOT NULL,
  match_id integer NOT NULL,
  event text NOT NULL,
  leg smallint,
  score1 integer,
  score2 integer,
  winner_id integer,
  reason text,
  recorded_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT match_tie_history_match_fk FOREIGN KEY (tournament_id, stage_id, match_id)
    REFERENCES public.matches (tournament_id, stage_id, id) ON DELETE CASCADE,
  CONSTRAINT match_tie_history_event_supported CHECK (event IN ('leg_recorded', 'leg_reverted', 'decision_recorded', 'decision_reverted')),
  CONSTRAINT match_tie_history_shape CHECK (
    (event IN ('leg_recorded', 'leg_reverted') AND leg IN (1, 2) AND score1 BETWEEN 0 AND 999 AND score2 BETWEEN 0 AND 999 AND winner_id IS NULL)
    OR (event IN ('decision_recorded', 'decision_reverted') AND leg IS NULL AND winner_id IS NOT NULL
      AND reason IS NOT NULL AND char_length(btrim(reason)) BETWEEN 1 AND 300))
);
CREATE INDEX IF NOT EXISTS match_tie_history_match_idx ON public.match_tie_history (match_id, id);
