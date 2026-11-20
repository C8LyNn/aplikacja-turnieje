-- #331 — granular permissions for the organizer's support people.
-- Additive and backward compatible:
--   * tournament_support_members: one row per person the organizer grants access to — a name, a personal access
--     code (stored only as a password hash), the explicit list of delegated permissions and a revocation mark.
--   * support_sessions.member_id: a session opened with a personal code belongs to that person; NULL keeps the
--     existing shared support password sessions, which keep exactly their former rights.
--   * No existing row changes. Members are not part of backups (their codes are secrets): after a restore the
--     organizer grants access again.
-- Rollback (personal support access is lost; shared-password support keeps working):
--   ALTER TABLE public.support_sessions DROP COLUMN IF EXISTS member_id;
--   DROP TABLE IF EXISTS public.tournament_support_members;

CREATE TABLE IF NOT EXISTS public.tournament_support_members (
  id serial PRIMARY KEY,
  tournament_id integer NOT NULL,
  name text NOT NULL,
  access_code_hash text NOT NULL,
  permissions text[] NOT NULL DEFAULT '{}'::text[],
  permissions_version integer NOT NULL DEFAULT 1,
  revoked_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT tournament_support_members_tournament_fk FOREIGN KEY (tournament_id)
    REFERENCES public.tournaments(id) ON DELETE CASCADE,
  CONSTRAINT tournament_support_members_name_length CHECK (char_length(btrim(name)) BETWEEN 1 AND 60),
  CONSTRAINT tournament_support_members_permissions_supported CHECK (permissions <@ ARRAY[
    'matches.run', 'results.write', 'results.correct', 'participants.manage', 'stages.rounds',
    'presentation.featured', 'presentation.settings', 'visibility.publish'
  ]::text[]),
  CONSTRAINT tournament_support_members_permissions_version_positive CHECK (permissions_version > 0)
);
CREATE INDEX IF NOT EXISTS tournament_support_members_tournament_idx ON public.tournament_support_members (tournament_id);

ALTER TABLE public.support_sessions ADD COLUMN IF NOT EXISTS member_id integer;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.support_sessions'::regclass
                  AND conname = 'support_sessions_member_fk') THEN
    ALTER TABLE public.support_sessions ADD CONSTRAINT support_sessions_member_fk FOREIGN KEY (member_id)
      REFERENCES public.tournament_support_members(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS support_sessions_member_idx ON public.support_sessions (member_id);
