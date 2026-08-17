-- Migration 0024: persisted opt-in marker for basket-authoritative stage flow.
--
-- Existing tournaments, including tournaments with stored Phase 1-3 basket
-- graphs, remain in compatibility mode through the NOT NULL DEFAULT 0 value.
-- Phase 3.5 activates version 1 only after a valid basket configuration has
-- been saved successfully.

-- migration-runner-strip-begin
BEGIN;
SELECT pg_advisory_xact_lock(841730040);
-- migration-runner-strip-end

DO $prerequisites$
BEGIN
  IF to_regclass('public.tournaments') IS NULL THEN
    RAISE EXCEPTION '0024 prerequisite failed: table public.tournaments is missing';
  END IF;
  IF to_regclass('public.stage_baskets') IS NULL THEN
    RAISE EXCEPTION '0024 prerequisite failed: table public.stage_baskets is missing';
  END IF;
END;
$prerequisites$;

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS basket_flow_authority_version integer;

UPDATE public.tournaments
SET basket_flow_authority_version = 0
WHERE basket_flow_authority_version IS NULL;

ALTER TABLE public.tournaments
  ALTER COLUMN basket_flow_authority_version SET DEFAULT 0,
  ALTER COLUMN basket_flow_authority_version SET NOT NULL;

ALTER TABLE public.tournaments
  DROP CONSTRAINT IF EXISTS tournaments_basket_flow_authority_version_supported;
ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_basket_flow_authority_version_supported
    CHECK (basket_flow_authority_version IN (0, 1));

DO $postconditions$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tournaments'
      AND column_name = 'basket_flow_authority_version'
      AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION '0024 postcondition failed: basket_flow_authority_version column is missing or invalid';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.tournaments'::regclass
      AND conname = 'tournaments_basket_flow_authority_version_supported'
      AND contype = 'c'
      AND convalidated
  ) THEN
    RAISE EXCEPTION '0024 postcondition failed: authority-version constraint is missing';
  END IF;
END;
$postconditions$;

-- migration-runner-strip-begin
COMMIT;
-- migration-runner-strip-end
