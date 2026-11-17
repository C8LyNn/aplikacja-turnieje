-- V5 · Stage D — teams as participants.
-- A team is a real entity linked 1:1 to the engine entry (players row = participation in
-- this tournament), with its own roster and membership history. Additive and backward
-- compatible: existing tournaments default to participant_type = 'players'.
-- Rollback (drops rosters; entries and results are untouched):
--   DROP TABLE IF EXISTS public.team_members; DROP TABLE IF EXISTS public.tournament_teams;
--   ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_participant_type_supported,
--     DROP CONSTRAINT IF EXISTS tournaments_team_roster_limits,
--     DROP COLUMN IF EXISTS team_roster_max, DROP COLUMN IF EXISTS team_roster_min, DROP COLUMN IF EXISTS participant_type;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS participant_type text NOT NULL DEFAULT 'players';
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS team_roster_min smallint;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS team_roster_max smallint;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tournaments'::regclass AND conname = 'tournaments_participant_type_supported') THEN
    ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_participant_type_supported
      CHECK (participant_type IN ('players', 'teams'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tournaments'::regclass AND conname = 'tournaments_team_roster_limits') THEN
    ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_team_roster_limits
      CHECK ((team_roster_min IS NULL OR team_roster_min BETWEEN 1 AND 50)
        AND (team_roster_max IS NULL OR team_roster_max BETWEEN 1 AND 50)
        AND (team_roster_min IS NULL OR team_roster_max IS NULL OR team_roster_min <= team_roster_max)
        AND (participant_type = 'teams' OR (team_roster_min IS NULL AND team_roster_max IS NULL)));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.tournament_teams (
  id serial PRIMARY KEY,
  tournament_id integer NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id integer NOT NULL,
  short_code text,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT tournament_teams_player_unique UNIQUE (player_id),
  CONSTRAINT tournament_teams_entry_same_tournament_fk FOREIGN KEY (tournament_id, player_id)
    REFERENCES public.players(tournament_id, id) ON DELETE CASCADE,
  CONSTRAINT tournament_teams_short_code_format CHECK (short_code IS NULL OR short_code ~ '^[A-Za-z0-9]{2,6}$')
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id serial PRIMARY KEY,
  team_id integer NOT NULL REFERENCES public.tournament_teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'player',
  joined_at timestamp NOT NULL DEFAULT now(),
  left_at timestamp,
  left_reason text,
  CONSTRAINT team_members_name_length CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
  CONSTRAINT team_members_role_supported CHECK (role IN ('captain', 'player', 'reserve')),
  CONSTRAINT team_members_left_after_join CHECK (left_at IS NULL OR left_at >= joined_at),
  CONSTRAINT team_members_left_reason_shape CHECK (
    (left_at IS NULL AND left_reason IS NULL) OR (left_at IS NOT NULL AND left_reason IN ('removed', 'role_change')))
);
CREATE UNIQUE INDEX IF NOT EXISTS team_members_one_active_captain
  ON public.team_members (team_id) WHERE role = 'captain' AND left_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS team_members_active_name_unique
  ON public.team_members (team_id, lower(btrim(name))) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS team_members_team_idx ON public.team_members (team_id);
