-- Deadlock hero bans per player and per-game hero picks in a match series.
-- Both tables are additive — existing tournaments without Deadlock data are unaffected.

BEGIN;

-- Up to 5 banned heroes per player for the duration of their tournament.
CREATE TABLE IF NOT EXISTS public.player_deadlock_bans (
  player_id   INTEGER PRIMARY KEY REFERENCES public.players(id) ON DELETE CASCADE,
  tournament_id INTEGER NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  banned_hero_ids TEXT[] NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS player_deadlock_bans_tournament_idx
  ON public.player_deadlock_bans(tournament_id);

-- Hero played by each player in each individual game of a BO series.
-- game_number = 1..5. Both hero columns are nullable (pick not yet recorded).
CREATE TABLE IF NOT EXISTS public.match_game_picks (
  match_id        INTEGER NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  game_number     INTEGER NOT NULL CHECK (game_number >= 1 AND game_number <= 5),
  player1_hero_id TEXT,
  player2_hero_id TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (match_id, game_number)
);

COMMIT;
