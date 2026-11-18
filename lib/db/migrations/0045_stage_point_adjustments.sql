-- V5.5 — point adjustments (bonuses and penalties) on league / group stages.
-- Additive and backward compatible:
--   * tournament_stages.point_adjustments = NULL means "no adjustments" (every existing stage).
--   * The value is a JSON array of audit entries written only by the API:
--     { id, playerId, points (≠0, −100..100), reason, createdAt, revokedAt|null }. Entries are never deleted;
--     a revoked entry stays for the record. Only stages with a points table (league rules) may carry them.
--   * No existing row is rewritten; tables of stages without adjustments are unchanged.
-- Rollback (adjustments are lost; export a Backup V3 first if any stage uses them —
-- SELECT count(*) FROM public.tournament_stages WHERE point_adjustments IS NOT NULL):
--   ALTER TABLE public.tournament_stages DROP CONSTRAINT IF EXISTS tournament_stages_point_adjustments_supported;
--   ALTER TABLE public.tournament_stages DROP COLUMN IF EXISTS point_adjustments;
ALTER TABLE public.tournament_stages ADD COLUMN IF NOT EXISTS point_adjustments jsonb;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tournament_stages'::regclass AND conname = 'tournament_stages_point_adjustments_supported') THEN
    ALTER TABLE public.tournament_stages ADD CONSTRAINT tournament_stages_point_adjustments_supported
      CHECK (point_adjustments IS NULL OR (
        jsonb_typeof(point_adjustments) = 'array'
        AND league_rules IS NOT NULL
        AND format IN ('round_robin', 'group_stage')
        AND pg_column_size(point_adjustments) <= 65536));
  END IF;
END $$;
