-- Durable, multi-instance credential attempt limiter.
-- Stores only pseudonymous request-source fingerprints. It never stores raw
-- addresses, credentials, tokens, or tournament data.

-- migration-runner-strip-begin
BEGIN;
-- migration-runner-strip-end

CREATE TABLE IF NOT EXISTS public.auth_credential_rate_limits (
  scope_type TEXT NOT NULL,
  tournament_id INTEGER NOT NULL,
  credential_type TEXT NOT NULL,
  source_fingerprint TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL,
  failure_count INTEGER NOT NULL DEFAULT 0,
  blocked_until TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT auth_credential_rate_limits_scope_pk PRIMARY KEY (
    scope_type,
    tournament_id,
    credential_type,
    source_fingerprint
  ),
  CONSTRAINT auth_credential_rate_limits_scope_type_check
    CHECK (scope_type IN ('tournament', 'source')),
  CONSTRAINT auth_credential_rate_limits_credential_type_check
    CHECK (credential_type IN ('organizer', 'viewer', 'support', 'legacy_upgrade')),
  CONSTRAINT auth_credential_rate_limits_tournament_id_check
    CHECK (tournament_id > 0),
  CONSTRAINT auth_credential_rate_limits_failure_count_check
    CHECK (failure_count >= 0),
  CONSTRAINT auth_credential_rate_limits_source_fingerprint_check
    CHECK (length(source_fingerprint) BETWEEN 1 AND 128)
);

CREATE INDEX IF NOT EXISTS auth_credential_rate_limits_cleanup_idx
  ON public.auth_credential_rate_limits (last_updated_at);

CREATE INDEX IF NOT EXISTS auth_credential_rate_limits_blocked_idx
  ON public.auth_credential_rate_limits (blocked_until);

DO $credential_rate_limit_prerequisites$
DECLARE
  missing_columns TEXT[];
BEGIN
  SELECT array_agg(required.name ORDER BY required.name)
    INTO missing_columns
  FROM (
    VALUES
      ('scope_type'),
      ('tournament_id'),
      ('credential_type'),
      ('source_fingerprint'),
      ('window_started_at'),
      ('failure_count'),
      ('blocked_until'),
      ('last_updated_at')
  ) AS required(name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'auth_credential_rate_limits'
      AND column_name = required.name
  );

  IF missing_columns IS NOT NULL THEN
    RAISE EXCEPTION
      'auth_credential_rate_limits exists with an incompatible shape; missing columns: %',
      array_to_string(missing_columns, ', ');
  END IF;
END;
$credential_rate_limit_prerequisites$;

-- migration-runner-strip-begin
COMMIT;
-- migration-runner-strip-end
