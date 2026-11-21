-- RC-4 — support session tokens are no longer stored in clear.
-- A support session token is 32 random bytes (256 bits, crypto.randomBytes), so a plain SHA-256 is the right protection:
-- there is nothing to guess and no key to manage. (Short secrets — passwords and #331 personal codes — keep scrypt.)
--   * support_sessions.session_token_hash: lower-case hex SHA-256 of the token as the browser sends it.
--   * Every existing row is converted in place (hash filled, clear token removed), so sessions that are logged in
--     keep working with the new API without logging in again. Row count is unchanged.
--   * session_token becomes nullable. It stays only so an OLDER API (rollback) can still open new sessions; the new API
--     never writes it and converts any such row on its first use.
--   * The SQL is idempotent (a replay converts any clear token written meanwhile by an older API and changes nothing
--     else); the runner itself applies it once. Clear-token rows written after that are converted by the API.
-- Rollback (support people log in again; sessions converted to hashes cannot be turned back into tokens):
--   DELETE FROM public.support_sessions WHERE session_token IS NULL;
--   ALTER TABLE public.support_sessions DROP CONSTRAINT IF EXISTS support_sessions_token_stored;
--   ALTER TABLE public.support_sessions DROP CONSTRAINT IF EXISTS support_sessions_token_hash_shape;
--   DROP INDEX IF EXISTS public.support_sessions_token_hash_unique;
--   ALTER TABLE public.support_sessions DROP COLUMN IF EXISTS session_token_hash;
--   ALTER TABLE public.support_sessions ALTER COLUMN session_token SET NOT NULL;

ALTER TABLE public.support_sessions ADD COLUMN IF NOT EXISTS session_token_hash text;
ALTER TABLE public.support_sessions ALTER COLUMN session_token DROP NOT NULL;

UPDATE public.support_sessions
   SET session_token_hash = encode(sha256(convert_to(session_token, 'UTF8')), 'hex'),
       session_token = NULL
 WHERE session_token IS NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.support_sessions'::regclass
                  AND conname = 'support_sessions_token_hash_shape') THEN
    ALTER TABLE public.support_sessions ADD CONSTRAINT support_sessions_token_hash_shape
      CHECK (session_token_hash IS NULL OR session_token_hash ~ '^[0-9a-f]{64}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.support_sessions'::regclass
                  AND conname = 'support_sessions_token_stored') THEN
    ALTER TABLE public.support_sessions ADD CONSTRAINT support_sessions_token_stored
      CHECK (session_token_hash IS NOT NULL OR session_token IS NOT NULL);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS support_sessions_token_hash_unique ON public.support_sessions (session_token_hash);
