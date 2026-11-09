-- Persistent server-side Steam growth jobs (one resumable active job).
-- Workers claim short leases atomically; a restart can safely reclaim expired
-- work without duplicating games thanks to steam_catalog_games.steam_app_id.
CREATE TABLE IF NOT EXISTS steam_catalog_import_jobs (
  id bigserial PRIMARY KEY,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'paused', 'completed')),
  steam_cursor integer NOT NULL DEFAULT 0 CHECK (steam_cursor >= 0),
  pending jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(pending) = 'array'),
  has_more boolean NOT NULL DEFAULT true,
  max_games integer NOT NULL CHECK (max_games BETWEEN 1 AND 20000),
  processed integer NOT NULL DEFAULT 0 CHECK (processed >= 0),
  inserted integer NOT NULL DEFAULT 0 CHECK (inserted >= 0),
  existing integer NOT NULL DEFAULT 0 CHECK (existing >= 0),
  ignored integer NOT NULL DEFAULT 0 CHECK (ignored >= 0),
  failed integer NOT NULL DEFAULT 0 CHECK (failed >= 0),
  scanned integer NOT NULL DEFAULT 0 CHECK (scanned >= 0),
  pause_requested boolean NOT NULL DEFAULT false,
  lease_token uuid,
  lease_expires_at timestamptz,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  CHECK (processed <= max_games),
  CHECK (inserted + existing + ignored + failed <= processed)
);

CREATE UNIQUE INDEX IF NOT EXISTS steam_catalog_import_jobs_single_active_idx
  ON steam_catalog_import_jobs ((true))
  WHERE status IN ('running', 'paused');

CREATE INDEX IF NOT EXISTS steam_catalog_import_jobs_due_idx
  ON steam_catalog_import_jobs (next_run_at, id)
  WHERE status = 'running';

COMMENT ON TABLE steam_catalog_import_jobs IS
  'Resumable, lease-guarded Steam game discovery/import tasks. No API keys stored.';
