-- V5 · Stage C — round-robin stages may be played home and away (double round robin).
-- Additive and backward compatible: every existing stage keeps exactly one leg, and
-- running tournaments are not changed. Rollback (only when no stage uses 2 legs):
--   ALTER TABLE public.tournament_stages DROP CONSTRAINT IF EXISTS tournament_stages_round_robin_legs_supported;
--   ALTER TABLE public.tournament_stages DROP COLUMN IF EXISTS round_robin_legs;
ALTER TABLE public.tournament_stages ADD COLUMN IF NOT EXISTS round_robin_legs smallint NOT NULL DEFAULT 1;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tournament_stages'::regclass AND conname = 'tournament_stages_round_robin_legs_supported') THEN
    ALTER TABLE public.tournament_stages ADD CONSTRAINT tournament_stages_round_robin_legs_supported
      CHECK (round_robin_legs = 1 OR (round_robin_legs = 2 AND format = 'round_robin'));
  END IF;
END $$;
