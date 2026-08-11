BEGIN;
ALTER TABLE public.match_game_picks
  ADD COLUMN IF NOT EXISTS player1_side TEXT
    CHECK (player1_side IN ('archmother', 'hidden_king'));
COMMENT ON COLUMN public.match_game_picks.player1_side IS
  'Deadlock side for player1 slot in this specific game. player2 always takes the opposite. NULL = not assigned. Meaningful only for Deadlock tournaments.';
COMMIT;
