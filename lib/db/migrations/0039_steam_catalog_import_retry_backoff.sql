-- Consecutive transient upstream failures are bounded and persistent across restarts.
-- Existing jobs start with zero retries; no cursor or pending IDs are changed.
ALTER TABLE steam_catalog_import_jobs
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'steam_catalog_import_jobs_retry_count_check'
      AND conrelid = 'steam_catalog_import_jobs'::regclass
  ) THEN
    ALTER TABLE steam_catalog_import_jobs
      ADD CONSTRAINT steam_catalog_import_jobs_retry_count_check
      CHECK (retry_count BETWEEN 0 AND 5);
  END IF;
END $$;

COMMENT ON COLUMN steam_catalog_import_jobs.retry_count IS
  'Consecutive retryable Steam/SteamSpy failures; resets after successful step or manual resume.';
