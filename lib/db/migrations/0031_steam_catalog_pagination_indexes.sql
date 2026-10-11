-- Stable ordering and fast status-filtered catalog pages / classification queue.
CREATE INDEX IF NOT EXISTS steam_catalog_games_name_id_idx
  ON steam_catalog_games (name, id);

CREATE INDEX IF NOT EXISTS steam_catalog_games_status_name_id_idx
  ON steam_catalog_games (status, name, id);

-- Substring ILIKE searches may later benefit from pg_trgm (optional extension).
-- Do not require that extension on hosted databases for this migration.
