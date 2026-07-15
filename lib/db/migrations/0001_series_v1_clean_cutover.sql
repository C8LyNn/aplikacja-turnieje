-- DESTRUCTIVE TOURNAMENT-DOMAIN RESET
--
-- This migration intentionally removes all Tournament Manager domain data from
-- tournaments, players, matches, result history, action logs, support sessions
-- and auth audit logs. It does not drop the database, schema, extensions, roles,
-- or unrelated tables. Run it only through the guarded reset script after a
-- deployment backup and explicit operator approval.

BEGIN;

DROP TABLE IF EXISTS auth_audit_log CASCADE;
DROP TABLE IF EXISTS support_sessions CASCADE;
DROP TABLE IF EXISTS action_log CASCADE;
DROP TABLE IF EXISTS result_history CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;

DROP TYPE IF EXISTS match_result_type CASCADE;
DROP TYPE IF EXISTS match_status CASCADE;
DROP TYPE IF EXISTS player_status CASCADE;
DROP TYPE IF EXISTS ranking_policy CASCADE;
DROP TYPE IF EXISTS result_model_version CASCADE;
DROP TYPE IF EXISTS tournament_status CASCADE;
DROP TYPE IF EXISTS tournament_format CASCADE;

CREATE TYPE tournament_format AS ENUM (
  'single_elimination',
  'round_robin',
  'swiss'
);
CREATE TYPE tournament_status AS ENUM ('draft', 'active', 'completed');
CREATE TYPE result_model_version AS ENUM ('series_v1');
CREATE TYPE ranking_policy AS ENUM ('match_record_v1');
CREATE TYPE player_status AS ENUM ('active', 'eliminated', 'winner');
CREATE TYPE match_status AS ENUM (
  'pending',
  'in_progress',
  'postponed',
  'completed',
  'cancelled'
);
CREATE TYPE match_result_type AS ENUM ('played', 'walkover', 'bye', 'no_contest');

CREATE TABLE tournaments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  result_model_version result_model_version NOT NULL DEFAULT 'series_v1',
  ranking_policy ranking_policy NOT NULL DEFAULT 'match_record_v1',
  format tournament_format NOT NULL,
  status tournament_status NOT NULL DEFAULT 'draft',
  max_players INTEGER,
  swiss_rounds INTEGER,
  default_best_of INTEGER NOT NULL DEFAULT 1,
  current_round INTEGER,
  total_rounds INTEGER,
  winner_id INTEGER,
  featured_match_id INTEGER,
  host_code TEXT,
  organizer_password_hash TEXT,
  support_password_hash TEXT,
  support_password_version INTEGER NOT NULL DEFAULT 1,
  viewer_password_hash TEXT,
  viewer_password_version INTEGER NOT NULL DEFAULT 1,
  visibility TEXT NOT NULL DEFAULT 'public_online',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT tournaments_default_best_of_positive_odd
    CHECK (default_best_of > 0 AND default_best_of % 2 = 1),
  CONSTRAINT tournaments_round_values_positive
    CHECK (
      (current_round IS NULL OR current_round > 0)
      AND (total_rounds IS NULL OR total_rounds > 0)
      AND (swiss_rounds IS NULL OR swiss_rounds > 0)
    )
);

CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rank TEXT,
  country TEXT,
  team_name TEXT,
  seed INTEGER,
  status player_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT players_tournament_id_id_unique UNIQUE (tournament_id, id),
  CONSTRAINT players_seed_positive CHECK (seed IS NULL OR seed > 0)
);
CREATE INDEX players_tournament_seed_idx ON players(tournament_id, seed);

CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id INTEGER,
  player2_id INTEGER,
  score1 INTEGER,
  score2 INTEGER,
  winner_id INTEGER,
  best_of INTEGER NOT NULL DEFAULT 1,
  result_type match_result_type,
  result_reason TEXT,
  note TEXT,
  status match_status NOT NULL DEFAULT 'pending',
  next_match_id INTEGER,
  sort_order INTEGER,
  scheduled_at TIMESTAMP,
  completed_at TIMESTAMP,
  CONSTRAINT matches_tournament_round_number_unique
    UNIQUE (tournament_id, round, match_number),
  CONSTRAINT matches_player1_same_tournament_fk
    FOREIGN KEY (tournament_id, player1_id) REFERENCES players(tournament_id, id),
  CONSTRAINT matches_player2_same_tournament_fk
    FOREIGN KEY (tournament_id, player2_id) REFERENCES players(tournament_id, id),
  CONSTRAINT matches_winner_same_tournament_fk
    FOREIGN KEY (tournament_id, winner_id) REFERENCES players(tournament_id, id),
  CONSTRAINT matches_round_positive CHECK (round > 0),
  CONSTRAINT matches_number_positive CHECK (match_number > 0),
  CONSTRAINT matches_best_of_positive_odd CHECK (best_of > 0 AND best_of % 2 = 1),
  CONSTRAINT matches_score1_nonnegative CHECK (score1 IS NULL OR score1 >= 0),
  CONSTRAINT matches_score2_nonnegative CHECK (score2 IS NULL OR score2 >= 0),
  CONSTRAINT matches_winner_is_participant
    CHECK (winner_id IS NULL OR winner_id = player1_id OR winner_id = player2_id),
  CONSTRAINT matches_lifecycle_result_consistency CHECK (
    (
      status = 'completed'
      AND result_type IS NOT NULL
      AND completed_at IS NOT NULL
    ) OR (
      status <> 'completed'
      AND result_type IS NULL
      AND result_reason IS NULL
      AND winner_id IS NULL
      AND score1 IS NULL
      AND score2 IS NULL
      AND completed_at IS NULL
    )
  ),
  CONSTRAINT matches_result_shape CHECK (
    result_type IS NULL
    OR (
      result_type = 'played'
      AND player1_id IS NOT NULL AND player2_id IS NOT NULL
      AND player1_id <> player2_id
      AND score1 IS NOT NULL AND score2 IS NOT NULL
      AND winner_id IS NOT NULL
      AND result_reason IS NULL
    )
    OR (
      result_type = 'walkover'
      AND player1_id IS NOT NULL AND player2_id IS NOT NULL
      AND player1_id <> player2_id
      AND score1 IS NULL AND score2 IS NULL
      AND winner_id IS NOT NULL
    )
    OR (
      result_type = 'bye'
      AND player1_id IS NOT NULL AND player2_id IS NULL
      AND score1 IS NULL AND score2 IS NULL
      AND winner_id = player1_id
      AND result_reason = 'system_bye'
    )
    OR (
      result_type = 'no_contest'
      AND player1_id IS NOT NULL AND player2_id IS NOT NULL
      AND player1_id <> player2_id
      AND score1 IS NULL AND score2 IS NULL
      AND winner_id IS NULL
    )
  )
);
CREATE INDEX matches_tournament_status_idx ON matches(tournament_id, status);

ALTER TABLE tournaments
  ADD CONSTRAINT tournaments_winner_fk
  FOREIGN KEY (winner_id) REFERENCES players(id) ON DELETE SET NULL;
ALTER TABLE tournaments
  ADD CONSTRAINT tournaments_featured_match_fk
  FOREIGN KEY (featured_match_id) REFERENCES matches(id) ON DELETE SET NULL;
ALTER TABLE matches
  ADD CONSTRAINT matches_next_match_fk
  FOREIGN KEY (next_match_id) REFERENCES matches(id) ON DELETE SET NULL;

CREATE TABLE result_history (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id INTEGER,
  player2_id INTEGER,
  score1 INTEGER,
  score2 INTEGER,
  winner_id INTEGER,
  best_of INTEGER NOT NULL,
  result_type match_result_type NOT NULL,
  result_reason TEXT,
  completed_at TIMESTAMP NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT result_history_match_revision_unique UNIQUE (match_id, revision),
  CONSTRAINT result_history_revision_positive CHECK (revision > 0),
  CONSTRAINT result_history_best_of_positive_odd CHECK (best_of > 0 AND best_of % 2 = 1),
  CONSTRAINT result_history_score1_nonnegative CHECK (score1 IS NULL OR score1 >= 0),
  CONSTRAINT result_history_score2_nonnegative CHECK (score2 IS NULL OR score2 >= 0)
);
CREATE INDEX result_history_tournament_recorded_idx
  ON result_history(tournament_id, recorded_at);

CREATE TABLE action_log (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  match_id INTEGER REFERENCES matches(id) ON DELETE SET NULL,
  undo_payload TEXT,
  is_undone BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE support_sessions (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  nick TEXT NOT NULL,
  session_token TEXT NOT NULL,
  password_version INTEGER NOT NULL DEFAULT 1,
  last_active_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE auth_audit_log (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL,
  actor_nick TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMIT;
