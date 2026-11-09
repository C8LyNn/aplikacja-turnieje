-- Cross-replica SteamSpy polling guard. One atomic reservation per upstream
-- "request=all" GET, shared between HTTP discovery and background workers.
-- Do not reserve slots for cached pages or for Steam Store detail checks.
CREATE TABLE IF NOT EXISTS steam_catalog_source_poll_limiter (
  source text PRIMARY KEY,
  next_allowed_at timestamptz NOT NULL DEFAULT '-infinity'::timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT steam_catalog_source_poll_limiter_source_check
    CHECK (source = 'steamspy_all')
);

COMMENT ON TABLE steam_catalog_source_poll_limiter IS
  'Atomic cross-replica 65s SteamSpy all-pages request limiter (not a game import cursor).';
