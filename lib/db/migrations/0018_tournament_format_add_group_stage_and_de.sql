-- Migration 0018: add group_stage and double_elimination to the tournament-level format enum
-- Forward-only, non-destructive. ADD VALUE IF NOT EXISTS is idempotent.
-- Does NOT touch tournament_stage_format (already has both values from 0017).

BEGIN;

ALTER TYPE public.tournament_format ADD VALUE IF NOT EXISTS 'group_stage';
ALTER TYPE public.tournament_format ADD VALUE IF NOT EXISTS 'double_elimination';

COMMIT;
