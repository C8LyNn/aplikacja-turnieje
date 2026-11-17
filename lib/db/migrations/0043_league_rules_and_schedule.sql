-- V5.3 — league rules (draws, points, tie-breakers) and league schedule time zone.
-- Additive and backward compatible:
--   * every existing stage gets league_rules = NULL, which keeps the pre-V5.3 ranking (by match wins)
--     and the series_v1 result rules exactly — no stored result or table changes;
--   * schedule_time_zone = NULL means "no schedule time zone chosen" (dates, if any, stay UTC instants);
--   * schedule_plan = NULL means "no automatic dates at stage start" (startDate, intervalDays, defaultTime);
--   * matches.scheduled_at already exists (UTC instant written by the API); it is not rewritten;
--   * matches_result_shape becomes matches_result_shape_v53: identical, except that a 'played' result may have
--     no winner when score1 = score2 (a league draw). Every existing row satisfies it (the old rule was
--     stricter); whether a stage allows draws is enforced by the API (CompleteMatch, RevertMatch, backup).
-- Rollback (only when no stage uses league rules or a schedule time zone, and no draw is stored —
-- SELECT count(*) FROM public.matches WHERE result_type = 'played' AND winner_id IS NULL must be 0):
--   ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_result_shape_v53;
--   (re-add matches_result_shape from 0001_series_v1_clean_cutover.sql)
--   ALTER TABLE public.tournament_stages DROP CONSTRAINT IF EXISTS tournament_stages_league_rules_supported;
--   ALTER TABLE public.tournament_stages DROP CONSTRAINT IF EXISTS tournament_stages_schedule_time_zone_shape;
--   ALTER TABLE public.tournament_stages DROP CONSTRAINT IF EXISTS tournament_stages_schedule_plan_supported;
--   ALTER TABLE public.tournament_stages DROP COLUMN IF EXISTS schedule_plan;
--   ALTER TABLE public.tournament_stages DROP COLUMN IF EXISTS league_rules;
--   ALTER TABLE public.tournament_stages DROP COLUMN IF EXISTS schedule_time_zone;
ALTER TABLE public.tournament_stages ADD COLUMN IF NOT EXISTS league_rules jsonb;
ALTER TABLE public.tournament_stages ADD COLUMN IF NOT EXISTS schedule_time_zone text;
ALTER TABLE public.tournament_stages ADD COLUMN IF NOT EXISTS schedule_plan jsonb;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tournament_stages'::regclass AND conname = 'tournament_stages_league_rules_supported') THEN
    ALTER TABLE public.tournament_stages ADD CONSTRAINT tournament_stages_league_rules_supported
      CHECK (league_rules IS NULL OR (jsonb_typeof(league_rules) = 'object' AND format IN ('round_robin', 'group_stage')));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tournament_stages'::regclass AND conname = 'tournament_stages_schedule_time_zone_shape') THEN
    ALTER TABLE public.tournament_stages ADD CONSTRAINT tournament_stages_schedule_time_zone_shape
      CHECK (schedule_time_zone IS NULL OR schedule_time_zone ~ '^[A-Za-z][A-Za-z0-9_+-]*(/[A-Za-z0-9_+-]+){0,2}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tournament_stages'::regclass AND conname = 'tournament_stages_schedule_plan_supported') THEN
    ALTER TABLE public.tournament_stages ADD CONSTRAINT tournament_stages_schedule_plan_supported
      CHECK (schedule_plan IS NULL OR (jsonb_typeof(schedule_plan) = 'object' AND schedule_time_zone IS NOT NULL AND format IN ('round_robin', 'group_stage')));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.matches'::regclass AND conname = 'matches_result_shape_v53') THEN
    ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_result_shape;
    ALTER TABLE public.matches ADD CONSTRAINT matches_result_shape_v53 CHECK (
      result_type IS NULL
      OR (
        result_type = 'played'
        AND player1_id IS NOT NULL AND player2_id IS NOT NULL
        AND player1_id <> player2_id
        AND score1 IS NOT NULL AND score2 IS NOT NULL
        AND (winner_id IS NOT NULL OR score1 = score2)
        AND result_reason IS NULL
      )
      OR (
        result_type = 'walkover'
        AND player1_id IS NOT NULL AND player2_id IS NOT NULL
        AND player1_id <> player2_id
        AND score1 IS NULL AND score2 IS NULL
        AND winner_id IS NOT NULL
      )
      OR (
        result_type = 'bye'
        AND player1_id IS NOT NULL AND player2_id IS NULL
        AND score1 IS NULL AND score2 IS NULL
        AND winner_id = player1_id
        AND result_reason = 'system_bye'
      )
      OR (
        result_type = 'no_contest'
        AND player1_id IS NOT NULL AND player2_id IS NOT NULL
        AND player1_id <> player2_id
        AND score1 IS NULL AND score2 IS NULL
        AND winner_id IS NULL
      )
    );
  END IF;
END $$;
