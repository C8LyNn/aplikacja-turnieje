-- V5.7 — match result rules per stage (set-based matches) and per-match set scores.
-- Additive and backward compatible:
--   * tournament_stages.match_rules = NULL keeps the existing meaning of a stage (a series to N won
--     games, or one game with goals/points in a draw league). A non-NULL value is written only by the API:
--     { "version": 1, "kind": "sets", "setsToWin": 1..4, "pointsPerSet": 3..99, "winBy": 1..2 }.
--     The stage's best_of must equal 2 × setsToWin − 1 and a set stage never allows draws.
--   * matches.set_scores = NULL for every existing match: old results are never given invented sets.
--     A value is a JSON array of [score1, score2] pairs, only on a completed, played match.
--   * result_history.set_scores keeps the sets of every saved result for the correction history.
--   * The match revision now also changes when the set scores change.
-- Rollback (set details are lost; export a Backup V3 first if any stage uses sets —
-- SELECT count(*) FROM public.tournament_stages WHERE match_rules IS NOT NULL):
--   ALTER TABLE public.result_history DROP CONSTRAINT IF EXISTS result_history_set_scores_shape;
--   ALTER TABLE public.result_history DROP COLUMN IF EXISTS set_scores;
--   ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_set_scores_shape;
--   ALTER TABLE public.matches DROP COLUMN IF EXISTS set_scores;
--   ALTER TABLE public.tournament_stages DROP CONSTRAINT IF EXISTS tournament_stages_match_rules_supported;
--   ALTER TABLE public.tournament_stages DROP COLUMN IF EXISTS match_rules;
--   then re-run 0028_match_revision.sql to restore the previous revision trigger.
ALTER TABLE public.tournament_stages ADD COLUMN IF NOT EXISTS match_rules jsonb;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tournament_stages'::regclass AND conname = 'tournament_stages_match_rules_supported') THEN
    ALTER TABLE public.tournament_stages ADD CONSTRAINT tournament_stages_match_rules_supported
      CHECK (match_rules IS NULL OR (
        jsonb_typeof(match_rules) = 'object'
        AND match_rules->>'kind' = 'sets'
        AND COALESCE(match_rules->>'version', '') = '1'
        AND COALESCE(match_rules->>'setsToWin', '') ~ '^[1-4]$'
        AND COALESCE(match_rules->>'winBy', '') ~ '^[12]$'
        AND COALESCE(match_rules->>'pointsPerSet', '') ~ '^([3-9]|[1-9][0-9])$'
        AND best_of = 2 * (CASE WHEN COALESCE(match_rules->>'setsToWin', '') ~ '^[1-4]$' THEN (match_rules->>'setsToWin')::int ELSE 0 END) - 1
        AND (league_rules IS NULL OR COALESCE(league_rules->>'allowDraws', 'false') = 'false')
        AND pg_column_size(match_rules) <= 1024));
  END IF;
END $$;

ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS set_scores jsonb;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.matches'::regclass AND conname = 'matches_set_scores_shape') THEN
    ALTER TABLE public.matches ADD CONSTRAINT matches_set_scores_shape
      CHECK (set_scores IS NULL OR (
        jsonb_typeof(set_scores) = 'array'
        AND jsonb_array_length(set_scores) BETWEEN 1 AND 7
        AND status = 'completed' AND result_type = 'played'
        AND pg_column_size(set_scores) <= 2048));
  END IF;
END $$;

ALTER TABLE public.result_history ADD COLUMN IF NOT EXISTS set_scores jsonb;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.result_history'::regclass AND conname = 'result_history_set_scores_shape') THEN
    ALTER TABLE public.result_history ADD CONSTRAINT result_history_set_scores_shape
      CHECK (set_scores IS NULL OR (
        jsonb_typeof(set_scores) = 'array'
        AND jsonb_array_length(set_scores) BETWEEN 1 AND 7
        AND pg_column_size(set_scores) <= 2048));
  END IF;
END $$;

-- The revision identifies the state a result form was based on; set details are part of that state.
CREATE OR REPLACE FUNCTION public.increment_match_revision()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF ROW(NEW.stage_id, NEW.stage_group_id, NEW.player1_id, NEW.player2_id,
         NEW.best_of, NEW.status, NEW.score1, NEW.score2, NEW.winner_id,
         NEW.result_type, NEW.result_reason, NEW.completed_at, NEW.next_match_id, NEW.routing_match_key,
         NEW.set_scores)
    IS DISTINCT FROM
     ROW(OLD.stage_id, OLD.stage_group_id, OLD.player1_id, OLD.player2_id,
         OLD.best_of, OLD.status, OLD.score1, OLD.score2, OLD.winner_id,
         OLD.result_type, OLD.result_reason, OLD.completed_at, OLD.next_match_id, OLD.routing_match_key,
         OLD.set_scores) THEN
    NEW.revision := OLD.revision + 1;
  ELSE
    -- Revision is server-owned: metadata-only writes cannot reset or bump it.
    NEW.revision := OLD.revision;
  END IF;
  RETURN NEW;
END $$;
