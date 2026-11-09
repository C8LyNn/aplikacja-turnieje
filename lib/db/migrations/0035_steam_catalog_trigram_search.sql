-- Optional acceleration of substring search on Steam metadata.
-- pg_trgm is a trusted extension in supported PostgreSQL releases, but
-- managed providers may restrict CREATE EXTENSION. Never break deployment
-- when an administrator has not enabled it.
DO $catalog_search$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
    EXCEPTION
      WHEN insufficient_privilege OR undefined_file OR feature_not_supported THEN
        RAISE NOTICE 'Steam catalog: pg_trgm unavailable; using existing search without trigram indexes';
    END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_opclass AS c
    JOIN pg_am AS m ON m.oid = c.opcmethod
    WHERE c.opcname = 'gin_trgm_ops' AND m.amname = 'gin'
  ) THEN
    -- Resolve the extension's operator class schema explicitly; managed DBs
    -- may install pg_trgm into public rather than the current search_path.
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS steam_catalog_games_name_trgm_idx ON steam_catalog_games USING gin (name %I.gin_trgm_ops)',
      (SELECT n.nspname FROM pg_opclass c
       JOIN pg_namespace n ON n.oid = c.opcnamespace
       JOIN pg_am m ON m.oid = c.opcmethod
       WHERE c.opcname = 'gin_trgm_ops' AND m.amname = 'gin' LIMIT 1)
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS steam_catalog_games_developer_trgm_idx ON steam_catalog_games USING gin (developer %I.gin_trgm_ops)',
      (SELECT n.nspname FROM pg_opclass c
       JOIN pg_namespace n ON n.oid = c.opcnamespace
       JOIN pg_am m ON m.oid = c.opcmethod
       WHERE c.opcname = 'gin_trgm_ops' AND m.amname = 'gin' LIMIT 1)
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS steam_catalog_games_publisher_trgm_idx ON steam_catalog_games USING gin (publisher %I.gin_trgm_ops)',
      (SELECT n.nspname FROM pg_opclass c
       JOIN pg_namespace n ON n.oid = c.opcnamespace
       JOIN pg_am m ON m.oid = c.opcmethod
       WHERE c.opcname = 'gin_trgm_ops' AND m.amname = 'gin' LIMIT 1)
    );
  END IF;
END
$catalog_search$;
