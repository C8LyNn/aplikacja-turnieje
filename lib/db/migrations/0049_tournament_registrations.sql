-- #329 — optional public sign-ups, integrated with the existing participant list.
-- Additive and backward compatible:
--   * tournaments.registration_settings: NULL = sign-ups never configured (= off). The API validates the shape
--     ({ version, enabled, open, approval, capacity, note }); the database bounds its type and size.
--   * tournament_registrations: one row per sign-up — the nick, the answers to the organizer's own questions
--     (validated against the tournament's participant fields), the status (pending → approved / rejected) and,
--     once approved, the player row it became. Approval goes through the same roster path as a manual add, so the
--     players table stays the only list the engine reads.
--   * No existing row changes. Sign-ups are not part of backups (personal data); the participants they became are.
-- Rollback (pending sign-ups and the settings are lost; approved participants stay in players):
--   DROP TABLE IF EXISTS public.tournament_registrations;
--   ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_registration_settings_shape;
--   ALTER TABLE public.tournaments DROP COLUMN IF EXISTS registration_settings;

ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS registration_settings jsonb;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.tournaments'::regclass
                  AND conname = 'tournaments_registration_settings_shape') THEN
    ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_registration_settings_shape CHECK (
      registration_settings IS NULL
      OR (jsonb_typeof(registration_settings) = 'object' AND pg_column_size(registration_settings) <= 4096));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id serial PRIMARY KEY,
  tournament_id integer NOT NULL,
  name text NOT NULL,
  custom_fields jsonb,
  status text NOT NULL DEFAULT 'pending',
  player_id integer,
  client_token text NOT NULL,
  decided_at timestamp,
  decided_by text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT tournament_registrations_tournament_fk FOREIGN KEY (tournament_id)
    REFERENCES public.tournaments(id) ON DELETE CASCADE,
  CONSTRAINT tournament_registrations_player_fk FOREIGN KEY (player_id)
    REFERENCES public.players(id) ON DELETE SET NULL,
  CONSTRAINT tournament_registrations_name_length CHECK (char_length(btrim(name)) BETWEEN 1 AND 60),
  CONSTRAINT tournament_registrations_status_supported CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT tournament_registrations_decision_shape CHECK ((status = 'pending') = (decided_at IS NULL)),
  CONSTRAINT tournament_registrations_custom_fields_shape CHECK (
    custom_fields IS NULL OR (jsonb_typeof(custom_fields) = 'object' AND pg_column_size(custom_fields) <= 16384)),
  CONSTRAINT tournament_registrations_client_token_length CHECK (char_length(client_token) BETWEEN 16 AND 80),
  CONSTRAINT tournament_registrations_client_token_unique UNIQUE (tournament_id, client_token)
);
CREATE INDEX IF NOT EXISTS tournament_registrations_tournament_status_idx
  ON public.tournament_registrations (tournament_id, status);
