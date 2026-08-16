-- Migration 0021: add qualifier_count to stage_baskets.
-- Defines the exact number of ranked participants an output basket captures.
-- Input baskets: must be NULL (enforced by check constraint).
-- Output baskets in explicit configs: positive integer set by the organizer.
-- Implicit/legacy baskets that were never persisted to stage_baskets are
-- unaffected — they do not exist as rows in this table.

-- migration-runner-strip-begin
BEGIN;
SELECT pg_advisory_xact_lock(841730036);
-- migration-runner-strip-end

DO $prerequisites$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.stage_baskets'::regclass
      AND conname = 'stage_baskets_pkey'
      AND contype = 'p'
      AND convalidated
  ) THEN
    RAISE EXCEPTION '0021 prerequisite failed: stage_baskets table is missing or has no primary key';
  END IF;
END;
$prerequisites$;

-- Add the column (nullable so existing rows are not affected).
ALTER TABLE public.stage_baskets
  ADD COLUMN IF NOT EXISTS qualifier_count integer;

-- Enforce: input baskets must never carry qualifier_count.
ALTER TABLE public.stage_baskets
  DROP CONSTRAINT IF EXISTS stage_baskets_qualifier_count_input_null;
ALTER TABLE public.stage_baskets
  ADD CONSTRAINT stage_baskets_qualifier_count_input_null
    CHECK (basket_type <> 'input' OR qualifier_count IS NULL);

-- Enforce: when present, qualifier_count must be a positive integer.
ALTER TABLE public.stage_baskets
  DROP CONSTRAINT IF EXISTS stage_baskets_qualifier_count_positive;
ALTER TABLE public.stage_baskets
  ADD CONSTRAINT stage_baskets_qualifier_count_positive
    CHECK (qualifier_count IS NULL OR qualifier_count > 0);

DO $postconditions$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'stage_baskets'
      AND column_name  = 'qualifier_count'
  ) THEN
    RAISE EXCEPTION '0021 postcondition failed: qualifier_count column is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.stage_baskets'::regclass
      AND conname   = 'stage_baskets_qualifier_count_input_null'
      AND contype   = 'c'
  ) THEN
    RAISE EXCEPTION '0021 postcondition failed: input-null constraint is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.stage_baskets'::regclass
      AND conname   = 'stage_baskets_qualifier_count_positive'
      AND contype   = 'c'
  ) THEN
    RAISE EXCEPTION '0021 postcondition failed: positive constraint is missing';
  END IF;
END;
$postconditions$;

-- migration-runner-strip-begin
COMMIT;
-- migration-runner-strip-end
