-- Introduce an independent credential-free discovery source for persisted imports.
-- Existing jobs remain 'steam', and their AppID cursor is preserved.
ALTER TABLE steam_catalog_import_jobs
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'steam';
ALTER TABLE steam_catalog_import_jobs
  ADD COLUMN IF NOT EXISTS source_page integer NOT NULL DEFAULT 0;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'steam_catalog_import_jobs_source_check'
      AND conrelid = 'steam_catalog_import_jobs'::regclass
  ) THEN
    ALTER TABLE steam_catalog_import_jobs
      ADD CONSTRAINT steam_catalog_import_jobs_source_check
      CHECK (source IN ('steam', 'steamspy'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'steam_catalog_import_jobs_source_page_check'
      AND conrelid = 'steam_catalog_import_jobs'::regclass
  ) THEN
    ALTER TABLE steam_catalog_import_jobs
      ADD CONSTRAINT steam_catalog_import_jobs_source_page_check
      CHECK (source_page BETWEEN 0 AND 301);
  END IF;
END $$;

COMMENT ON COLUMN steam_catalog_import_jobs.source IS
  'Explicit discovery backend: keyed Steam or credential-free SteamSpy.';
COMMENT ON COLUMN steam_catalog_import_jobs.source_page IS
  'Next SteamSpy page. Independent of steam_cursor used by keyed Steam discovery.';
