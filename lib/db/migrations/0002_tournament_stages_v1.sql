-- Tournament Stages v1: non-destructive schema migration and one-stage backfill.
-- Existing tournaments, players, matches, results and logs are preserved.
-- Compatibility triggers are intentionally limited to the legacy single-stage write paths.
-- This file can be pasted directly into the Replit Production Database SQL console.
-- The Node migration runner removes only the marked transaction wrapper because it
-- already owns the same transaction and advisory lock.

-- migration-runner-strip-begin
BEGIN;
SELECT pg_advisory_xact_lock(841730021);
-- Before pasting into the Replit Production Database SQL console, replace both
-- placeholders below. Neither value is a secret.
SELECT set_config('tournament_manager.expected_database_name', '__EXPECTED_DATABASE_NAME__', true);
SELECT set_config('tournament_manager.deployment_environment', 'production', true);
SELECT set_config('tournament_manager.app_commit', '__DEPLOYED_APP_COMMIT__', true);
-- migration-runner-strip-end

CREATE TABLE IF NOT EXISTS public.app_schema_migrations (
  migration_key TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  app_commit TEXT NOT NULL,
  target_schema TEXT NOT NULL,
  deployment_environment TEXT NOT NULL
);

CREATE OR REPLACE PROCEDURE public.apply_tournament_stages_v1()
LANGUAGE plpgsql
AS $tournament_stages_migration$
DECLARE
  expected_database_name TEXT := NULLIF(
    current_setting('tournament_manager.expected_database_name', true), ''
  );
  migration_environment TEXT := COALESCE(NULLIF(
    current_setting('tournament_manager.deployment_environment', true), ''
  ), 'migration');
  migration_app_commit TEXT := COALESCE(NULLIF(
    current_setting('tournament_manager.app_commit', true), ''
  ), 'schema-migration');
  migration_target_schema TEXT := (
    SELECT namespace.nspname
    FROM pg_class class
    JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
    WHERE class.oid = to_regclass('public.tournaments')
  );
BEGIN
  IF expected_database_name IS NOT NULL
    AND current_database() <> expected_database_name
  THEN
    RAISE EXCEPTION 'Connected database % does not match expected database %',
      current_database(), expected_database_name;
  END IF;

  IF migration_environment = 'production'
    AND migration_app_commit !~ '^[0-9a-fA-F]{40}$'
  THEN
    RAISE EXCEPTION 'Production SQL console migration requires a full 40-character deployed APP_COMMIT';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.app_schema_migrations
    WHERE migration_key = 'tournament_stages_v1'
  ) THEN
    IF NOT EXISTS (
        SELECT 1 FROM public.app_schema_migrations
        WHERE migration_key = 'tournament_stages_v1'
          AND target_schema = migration_target_schema
      )
      OR to_regclass('public.tournament_stages') IS NULL
      OR to_regclass('public.stage_participants') IS NULL
      OR to_regclass('public.stage_groups') IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM pg_attribute
        WHERE attrelid = to_regclass('public.matches')
          AND attname = 'stage_id' AND attnotnull AND NOT attisdropped
      )
      OR NOT EXISTS (
        SELECT 1
        FROM pg_constraint constraint_row
        WHERE constraint_row.conrelid = to_regclass('public.matches')
          AND constraint_row.conname = 'matches_id_stage_id_unique'
          AND constraint_row.contype = 'u'
          AND ARRAY(
            SELECT attribute.attname::text
            FROM unnest(constraint_row.conkey) WITH ORDINALITY AS key(attnum, position)
            JOIN pg_attribute attribute
              ON attribute.attrelid = constraint_row.conrelid AND attribute.attnum = key.attnum
            ORDER BY key.position
          ) = ARRAY['id', 'stage_id']::text[]
      )
      OR NOT EXISTS (
        SELECT 1
        FROM pg_constraint constraint_row
        WHERE constraint_row.conrelid = to_regclass('public.matches')
          AND constraint_row.confrelid = to_regclass('public.matches')
          AND constraint_row.conname = 'matches_next_match_same_stage_fk'
          AND constraint_row.contype = 'f'
          AND constraint_row.confdeltype = 'a'
          AND ARRAY(
            SELECT attribute.attname::text
            FROM unnest(constraint_row.conkey) WITH ORDINALITY AS key(attnum, position)
            JOIN pg_attribute attribute
              ON attribute.attrelid = constraint_row.conrelid AND attribute.attnum = key.attnum
            ORDER BY key.position
          ) = ARRAY['next_match_id', 'stage_id']::text[]
          AND ARRAY(
            SELECT attribute.attname::text
            FROM unnest(constraint_row.confkey) WITH ORDINALITY AS key(attnum, position)
            JOIN pg_attribute attribute
              ON attribute.attrelid = constraint_row.confrelid AND attribute.attnum = key.attnum
            ORDER BY key.position
          ) = ARRAY['id', 'stage_id']::text[]
      )
    THEN
      RAISE EXCEPTION 'Tournament Stages v1 marker exists but the required schema or match constraints are inconsistent';
    END IF;
    RETURN;
  END IF;

  IF migration_environment = 'production' AND NOT EXISTS (
    SELECT 1 FROM public.app_schema_migrations
    WHERE migration_key = 'series_v1_clean_cutover'
  ) THEN
    RAISE EXCEPTION 'Tournament Stages v1 requires the series_v1_clean_cutover marker';
  END IF;

  IF to_regclass('public.tournament_stages') IS NOT NULL
    OR to_regclass('public.stage_participants') IS NOT NULL
    OR to_regclass('public.stage_groups') IS NOT NULL
    OR EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = to_regclass('public.matches')
        AND attname IN ('stage_id', 'stage_group_id') AND NOT attisdropped
    )
  THEN
    RAISE EXCEPTION 'Partial Tournament Stages v1 schema exists without its migration marker';
  END IF;

CREATE TYPE public.tournament_stage_format AS ENUM (
  'swiss', 'round_robin', 'group_stage', 'single_elimination'
);
CREATE TYPE public.tournament_stage_status AS ENUM ('planned', 'active', 'completed');
CREATE TYPE public.stage_ranking_policy AS ENUM (
  'swiss_v1', 'round_robin_v1', 'group_v1', 'elimination_bracket_v1'
);
CREATE TYPE public.stage_qualification_mode AS ENUM ('none', 'top_n', 'top_n_per_group');
CREATE TYPE public.stage_seeding_policy AS ENUM ('standings_order', 'snake_groups', 'cross_group');
CREATE TYPE public.stage_participant_status AS ENUM ('active', 'eliminated', 'qualified', 'winner');
CREATE TYPE public.stage_qualification_source AS ENUM ('registration', 'standings', 'group_position');

CREATE SEQUENCE public.tournament_stages_id_seq AS INTEGER;
CREATE SEQUENCE public.stage_groups_id_seq AS INTEGER;
CREATE SEQUENCE public.stage_participants_id_seq AS INTEGER;

CREATE TABLE public.tournament_stages (
  id INTEGER PRIMARY KEY DEFAULT nextval('public.tournament_stages_id_seq'::regclass),
  tournament_id INTEGER NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  stage_key TEXT NOT NULL,
  position INTEGER NOT NULL,
  name TEXT NOT NULL,
  format public.tournament_stage_format NOT NULL,
  status public.tournament_stage_status NOT NULL DEFAULT 'planned',
  participant_count INTEGER NOT NULL DEFAULT 0,
  best_of INTEGER NOT NULL DEFAULT 1,
  planned_rounds INTEGER,
  current_round INTEGER,
  total_rounds INTEGER,
  ranking_policy public.stage_ranking_policy NOT NULL,
  qualification_mode public.stage_qualification_mode NOT NULL DEFAULT 'none',
  advancing_count INTEGER,
  group_count INTEGER,
  participants_per_group INTEGER,
  qualifiers_per_group INTEGER,
  seeding_policy public.stage_seeding_policy NOT NULL DEFAULT 'standings_order',
  winner_id INTEGER,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  CONSTRAINT tournament_stages_tournament_position_unique UNIQUE (tournament_id, position),
  CONSTRAINT tournament_stages_tournament_key_unique UNIQUE (tournament_id, stage_key),
  CONSTRAINT tournament_stages_tournament_id_id_unique UNIQUE (tournament_id, id),
  CONSTRAINT tournament_stages_winner_same_tournament_fk
    FOREIGN KEY (tournament_id, winner_id) REFERENCES public.players(tournament_id, id),
  CONSTRAINT tournament_stages_position_range CHECK (position BETWEEN 1 AND 3),
  CONSTRAINT tournament_stages_participant_count_nonnegative CHECK (participant_count >= 0),
  CONSTRAINT tournament_stages_best_of_supported CHECK (best_of > 0 AND best_of % 2 = 1),
  CONSTRAINT tournament_stages_round_values_positive CHECK (
    (planned_rounds IS NULL OR planned_rounds > 0)
    AND (current_round IS NULL OR current_round > 0)
    AND (total_rounds IS NULL OR total_rounds > 0)
  ),
  CONSTRAINT tournament_stages_advancing_count_positive CHECK (advancing_count IS NULL OR advancing_count > 0),
  CONSTRAINT tournament_stages_qualification_configuration CHECK (
    (qualification_mode = 'none' AND advancing_count IS NULL)
    OR (qualification_mode = 'top_n' AND format IN ('swiss', 'round_robin') AND advancing_count IS NOT NULL)
    OR (qualification_mode = 'top_n_per_group' AND format = 'group_stage' AND advancing_count IS NULL)
  ),
  CONSTRAINT tournament_stages_version_positive CHECK (version > 0),
  CONSTRAINT tournament_stages_lifecycle_timestamps CHECK (
    (status = 'planned' AND started_at IS NULL AND completed_at IS NULL)
    OR (status = 'active' AND completed_at IS NULL)
    OR (status = 'completed' AND completed_at IS NOT NULL)
  ),
  CONSTRAINT tournament_stages_format_configuration CHECK (
    (format = 'swiss' AND ranking_policy = 'swiss_v1' AND planned_rounds IS NOT NULL
      AND group_count IS NULL AND participants_per_group IS NULL AND qualifiers_per_group IS NULL)
    OR (format = 'round_robin' AND ranking_policy = 'round_robin_v1' AND planned_rounds IS NULL
      AND group_count IS NULL AND participants_per_group IS NULL AND qualifiers_per_group IS NULL)
    OR (format = 'single_elimination' AND ranking_policy = 'elimination_bracket_v1' AND planned_rounds IS NULL
      AND group_count IS NULL AND participants_per_group IS NULL AND qualifiers_per_group IS NULL)
    OR (format = 'group_stage' AND ranking_policy = 'group_v1' AND planned_rounds IS NULL
      AND group_count IN (2, 4) AND participants_per_group BETWEEN 3 AND 8
      AND qualifiers_per_group IN (1, 2) AND qualifiers_per_group < participants_per_group
      AND participant_count = group_count * participants_per_group)
  )
);
ALTER SEQUENCE public.tournament_stages_id_seq OWNED BY public.tournament_stages.id;
CREATE UNIQUE INDEX tournament_stages_one_active_per_tournament
  ON public.tournament_stages(tournament_id) WHERE status = 'active';

ALTER TABLE public.tournaments ADD COLUMN active_stage_id INTEGER;
ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_active_stage_same_tournament_fk
  FOREIGN KEY (id, active_stage_id)
  REFERENCES public.tournament_stages(tournament_id, id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE public.stage_groups (
  id INTEGER PRIMARY KEY DEFAULT nextval('public.stage_groups_id_seq'::regclass),
  stage_id INTEGER NOT NULL REFERENCES public.tournament_stages(id) ON DELETE CASCADE,
  group_key TEXT NOT NULL,
  position INTEGER NOT NULL,
  participant_count INTEGER NOT NULL,
  qualifiers_count INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT stage_groups_stage_key_unique UNIQUE (stage_id, group_key),
  CONSTRAINT stage_groups_stage_position_unique UNIQUE (stage_id, position),
  CONSTRAINT stage_groups_stage_id_id_unique UNIQUE (stage_id, id),
  CONSTRAINT stage_groups_key_supported CHECK (group_key IN ('A', 'B', 'C', 'D')),
  CONSTRAINT stage_groups_position_range CHECK (position BETWEEN 1 AND 4),
  CONSTRAINT stage_groups_participant_count_range CHECK (participant_count BETWEEN 3 AND 8),
  CONSTRAINT stage_groups_qualifiers_count_supported
    CHECK (qualifiers_count IN (1, 2) AND qualifiers_count < participant_count)
);
ALTER SEQUENCE public.stage_groups_id_seq OWNED BY public.stage_groups.id;

CREATE TABLE public.stage_participants (
  id INTEGER PRIMARY KEY DEFAULT nextval('public.stage_participants_id_seq'::regclass),
  tournament_id INTEGER NOT NULL,
  stage_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  stage_seed INTEGER NOT NULL,
  group_id INTEGER,
  status public.stage_participant_status NOT NULL DEFAULT 'active',
  qualification_source public.stage_qualification_source NOT NULL DEFAULT 'registration',
  final_rank INTEGER,
  group_rank INTEGER,
  qualification_rank INTEGER,
  next_stage_seed INTEGER,
  source_stage_participant_id INTEGER,
  qualified_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT stage_participants_stage_player_unique UNIQUE (stage_id, player_id),
  -- Deferred so one transaction can atomically normalize every seed to 1..N.
  CONSTRAINT stage_participants_stage_seed_unique
    UNIQUE (stage_id, stage_seed) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT stage_participants_tournament_id_id_unique UNIQUE (tournament_id, id),
  CONSTRAINT stage_participants_stage_same_tournament_fk
    FOREIGN KEY (tournament_id, stage_id)
    REFERENCES public.tournament_stages(tournament_id, id) ON DELETE CASCADE,
  CONSTRAINT stage_participants_player_same_tournament_fk
    FOREIGN KEY (tournament_id, player_id)
    REFERENCES public.players(tournament_id, id) ON DELETE CASCADE,
  CONSTRAINT stage_participants_group_same_stage_fk
    FOREIGN KEY (stage_id, group_id)
    REFERENCES public.stage_groups(stage_id, id),
  CONSTRAINT stage_participants_source_same_tournament_fk
    FOREIGN KEY (tournament_id, source_stage_participant_id)
    REFERENCES public.stage_participants(tournament_id, id) ON DELETE RESTRICT,
  CONSTRAINT stage_participants_seed_positive CHECK (stage_seed > 0),
  CONSTRAINT stage_participants_rank_values_positive CHECK (
    (final_rank IS NULL OR final_rank > 0)
    AND (group_rank IS NULL OR group_rank > 0)
    AND (qualification_rank IS NULL OR qualification_rank > 0)
    AND (next_stage_seed IS NULL OR next_stage_seed > 0)
  )
);
ALTER SEQUENCE public.stage_participants_id_seq OWNED BY public.stage_participants.id;

ALTER TABLE public.tournament_stages
  ADD CONSTRAINT tournament_stages_winner_same_stage_fk
  FOREIGN KEY (id, winner_id)
  REFERENCES public.stage_participants(stage_id, player_id)
  DEFERRABLE INITIALLY DEFERRED;

-- A completed legacy stage needs a reliable completion timestamp. The final
-- completed match is historical evidence; tournament.created_at is not.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.tournaments tournament
    WHERE tournament.status = 'completed'
      AND NOT EXISTS (
        SELECT 1
        FROM public.matches match
        WHERE match.tournament_id = tournament.id
          AND match.status = 'completed'
          AND match.completed_at IS NOT NULL
      )
  ) THEN
    RAISE EXCEPTION 'Cannot backfill a completed tournament without a reliable completed match timestamp';
  END IF;
END;
$$;

-- Create one normal stage for every existing tournament before adding NOT NULL match links.
INSERT INTO public.tournament_stages (
  tournament_id, stage_key, position, name, format, status, participant_count,
  best_of, planned_rounds, current_round, total_rounds, ranking_policy,
  qualification_mode, advancing_count, seeding_policy, winner_id, version,
  created_at, started_at, completed_at
)
SELECT
  tournament.id,
  'stage-1',
  1,
  'Etap 1',
  tournament.format::text::public.tournament_stage_format,
  CASE tournament.status
    WHEN 'draft' THEN 'planned'::public.tournament_stage_status
    WHEN 'active' THEN 'active'::public.tournament_stage_status
    ELSE 'completed'::public.tournament_stage_status
  END,
  (SELECT count(*)::integer FROM public.players player WHERE player.tournament_id = tournament.id),
  tournament.default_best_of,
  CASE WHEN tournament.format = 'swiss' THEN
    COALESCE(tournament.swiss_rounds, tournament.total_rounds, 1)
  ELSE NULL END,
  tournament.current_round,
  tournament.total_rounds,
  CASE tournament.format
    WHEN 'swiss' THEN 'swiss_v1'::public.stage_ranking_policy
    WHEN 'round_robin' THEN 'round_robin_v1'::public.stage_ranking_policy
    ELSE 'elimination_bracket_v1'::public.stage_ranking_policy
  END,
  'none'::public.stage_qualification_mode,
  NULL,
  'standings_order'::public.stage_seeding_policy,
  tournament.winner_id,
  1,
  tournament.created_at,
  NULL,
  CASE WHEN tournament.status = 'completed' THEN
    (SELECT max(match.completed_at) FROM public.matches match
      WHERE match.tournament_id = tournament.id
        AND match.status = 'completed'
        AND match.completed_at IS NOT NULL)
  ELSE NULL END
FROM public.tournaments tournament;

UPDATE public.tournaments tournament
SET active_stage_id = stage.id
FROM public.tournament_stages stage
WHERE stage.tournament_id = tournament.id
  AND stage.status = 'active';

-- Normalize the legacy compatibility seed deterministically, preserving valid 1..N seeds.
WITH ranked_players AS (
  SELECT
    player.id,
    row_number() OVER (
      PARTITION BY player.tournament_id
      ORDER BY player.seed ASC NULLS LAST, player.id ASC
    )::integer AS normalized_seed
  FROM public.players player
)
UPDATE public.players player
SET seed = ranked.normalized_seed
FROM ranked_players ranked
WHERE ranked.id = player.id;

INSERT INTO public.stage_participants (
  tournament_id, stage_id, player_id, stage_seed, status, qualification_source, created_at
)
SELECT
  player.tournament_id,
  stage.id,
  player.id,
  player.seed,
  player.status::text::public.stage_participant_status,
  'registration'::public.stage_qualification_source,
  player.created_at
FROM public.players player
JOIN public.tournament_stages stage
  ON stage.tournament_id = player.tournament_id AND stage.position = 1;

ALTER TABLE public.matches ADD COLUMN stage_id INTEGER;
ALTER TABLE public.matches ADD COLUMN stage_group_id INTEGER;
UPDATE public.matches match
SET stage_id = stage.id
FROM public.tournament_stages stage
WHERE stage.tournament_id = match.tournament_id AND stage.position = 1;
ALTER TABLE public.matches ALTER COLUMN stage_id SET NOT NULL;

ALTER TABLE public.result_history ADD COLUMN stage_id INTEGER;
UPDATE public.result_history history
SET stage_id = match.stage_id
FROM public.matches match
WHERE match.id = history.match_id;
ALTER TABLE public.result_history ALTER COLUMN stage_id SET NOT NULL;

ALTER TABLE public.action_log ADD COLUMN stage_id INTEGER;
UPDATE public.action_log log
SET stage_id = match.stage_id
FROM public.matches match
WHERE match.id = log.match_id;

ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_tournament_round_number_unique;
ALTER TABLE public.matches
  ADD CONSTRAINT matches_stage_round_number_unique UNIQUE (stage_id, round, match_number),
  ADD CONSTRAINT matches_id_stage_id_unique UNIQUE (id, stage_id),
  ADD CONSTRAINT matches_tournament_stage_id_id_unique UNIQUE (tournament_id, stage_id, id),
  ADD CONSTRAINT matches_stage_same_tournament_fk
    FOREIGN KEY (tournament_id, stage_id)
    REFERENCES public.tournament_stages(tournament_id, id),
  ADD CONSTRAINT matches_group_same_stage_fk
    FOREIGN KEY (stage_id, stage_group_id)
    REFERENCES public.stage_groups(stage_id, id),
  ADD CONSTRAINT matches_player1_same_stage_fk
    FOREIGN KEY (stage_id, player1_id)
    REFERENCES public.stage_participants(stage_id, player_id),
  ADD CONSTRAINT matches_player2_same_stage_fk
    FOREIGN KEY (stage_id, player2_id)
    REFERENCES public.stage_participants(stage_id, player_id),
  ADD CONSTRAINT matches_winner_same_stage_fk
    FOREIGN KEY (stage_id, winner_id)
    REFERENCES public.stage_participants(stage_id, player_id);

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_next_match_fk;
ALTER TABLE public.matches
  ADD CONSTRAINT matches_next_match_same_stage_fk
  FOREIGN KEY (next_match_id, stage_id)
  REFERENCES public.matches(id, stage_id) ON DELETE NO ACTION;

ALTER TABLE public.result_history
  ADD CONSTRAINT result_history_match_same_stage_fk
  FOREIGN KEY (stage_id, match_id)
  REFERENCES public.matches(stage_id, id) ON DELETE CASCADE;

ALTER TABLE public.result_history
  ADD CONSTRAINT result_history_match_same_tournament_stage_fk
  FOREIGN KEY (tournament_id, stage_id, match_id)
  REFERENCES public.matches(tournament_id, stage_id, id) ON DELETE CASCADE;

ALTER TABLE public.action_log
  ADD CONSTRAINT action_log_stage_same_tournament_fk
  FOREIGN KEY (tournament_id, stage_id)
  REFERENCES public.tournament_stages(tournament_id, id) ON DELETE SET NULL (stage_id);

ALTER TABLE public.action_log
  ADD CONSTRAINT action_log_match_requires_stage
    CHECK (match_id IS NULL OR stage_id IS NOT NULL),
  ADD CONSTRAINT action_log_match_same_tournament_stage_fk
    FOREIGN KEY (tournament_id, stage_id, match_id)
    REFERENCES public.matches(tournament_id, stage_id, id)
    ON DELETE SET NULL (stage_id, match_id);

-- Legacy single-stage compatibility. Cross-table defaults cannot be expressed declaratively.
CREATE FUNCTION public.compat_create_single_stage() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.tournament_stages (
    tournament_id, stage_key, position, name, format, status, participant_count,
    best_of, planned_rounds, current_round, total_rounds, ranking_policy,
    qualification_mode, seeding_policy, winner_id, created_at, started_at, completed_at
  ) VALUES (
    NEW.id, 'stage-1', 1, 'Etap 1', NEW.format::text::public.tournament_stage_format,
    CASE NEW.status WHEN 'draft' THEN 'planned'::public.tournament_stage_status
      ELSE 'active'::public.tournament_stage_status END,
    0, NEW.default_best_of,
    CASE WHEN NEW.format = 'swiss' THEN COALESCE(NEW.swiss_rounds, NEW.total_rounds, 1) ELSE NULL END,
    NEW.current_round, NEW.total_rounds,
    CASE NEW.format WHEN 'swiss' THEN 'swiss_v1'::public.stage_ranking_policy
      WHEN 'round_robin' THEN 'round_robin_v1'::public.stage_ranking_policy
      ELSE 'elimination_bracket_v1'::public.stage_ranking_policy END,
    'none', 'standings_order', NEW.winner_id, NEW.created_at, NULL, NULL
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER tournaments_create_single_stage
AFTER INSERT ON public.tournaments
FOR EACH ROW EXECUTE FUNCTION public.compat_create_single_stage();

CREATE FUNCTION public.compat_sync_single_stage_from_tournament() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT count(*) FROM public.tournament_stages WHERE tournament_id = NEW.id) = 1 THEN
    UPDATE public.tournament_stages
    SET
      format = NEW.format::text::public.tournament_stage_format,
      status = CASE NEW.status WHEN 'draft' THEN 'planned'::public.tournament_stage_status
        WHEN 'active' THEN 'active'::public.tournament_stage_status
        ELSE 'completed'::public.tournament_stage_status END,
      best_of = NEW.default_best_of,
      planned_rounds = CASE WHEN NEW.format = 'swiss' THEN
        COALESCE(NEW.swiss_rounds, NEW.total_rounds, 1)
      ELSE NULL END,
      current_round = NEW.current_round,
      total_rounds = NEW.total_rounds,
      ranking_policy = CASE NEW.format WHEN 'swiss' THEN 'swiss_v1'::public.stage_ranking_policy
        WHEN 'round_robin' THEN 'round_robin_v1'::public.stage_ranking_policy
        ELSE 'elimination_bracket_v1'::public.stage_ranking_policy END,
      winner_id = NEW.winner_id,
      -- The legacy Tournament row has no reliable start timestamp. Preserve a
      -- known stage timestamp, but never manufacture one from created_at/NOW().
      started_at = CASE WHEN NEW.status = 'draft' THEN NULL ELSE started_at END,
      -- A completed match is the only reliable completion evidence available
      -- to the compatibility path (including Backup v2 import).
      completed_at = CASE WHEN NEW.status = 'completed' THEN COALESCE(
        completed_at,
        (SELECT max(match.completed_at)
         FROM public.matches match
         WHERE match.tournament_id = NEW.id
           AND match.status = 'completed'
           AND match.completed_at IS NOT NULL)
      ) ELSE NULL END,
      version = version + 1
    WHERE tournament_id = NEW.id AND position = 1
      AND (
        format IS DISTINCT FROM NEW.format::text::public.tournament_stage_format
        OR status IS DISTINCT FROM CASE NEW.status
          WHEN 'draft' THEN 'planned'::public.tournament_stage_status
          WHEN 'active' THEN 'active'::public.tournament_stage_status
          ELSE 'completed'::public.tournament_stage_status
        END
        OR best_of IS DISTINCT FROM NEW.default_best_of
        OR planned_rounds IS DISTINCT FROM CASE WHEN NEW.format = 'swiss' THEN
          COALESCE(NEW.swiss_rounds, NEW.total_rounds, 1)
        ELSE NULL END
        OR current_round IS DISTINCT FROM NEW.current_round
        OR total_rounds IS DISTINCT FROM NEW.total_rounds
        OR ranking_policy IS DISTINCT FROM CASE NEW.format
          WHEN 'swiss' THEN 'swiss_v1'::public.stage_ranking_policy
          WHEN 'round_robin' THEN 'round_robin_v1'::public.stage_ranking_policy
          ELSE 'elimination_bracket_v1'::public.stage_ranking_policy
        END
        OR winner_id IS DISTINCT FROM NEW.winner_id
      );
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER tournaments_sync_single_stage
AFTER UPDATE OF format, status, default_best_of, swiss_rounds, current_round, total_rounds, winner_id
ON public.tournaments
FOR EACH ROW EXECUTE FUNCTION public.compat_sync_single_stage_from_tournament();

-- A non-draft Tournament may be inserted before its Backup v2 matches. Allow
-- that work inside one transaction, then require the final one-stage lifecycle
-- to agree at commit. A completed import without timestamp evidence therefore
-- rolls back instead of receiving an invented timestamp.
CREATE FUNCTION public.validate_single_stage_lifecycle_alignment() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  current_tournament_status public.tournament_status;
BEGIN
  -- A deferred trigger keeps the NEW tuple from the statement that queued it.
  -- Re-read the row so every queued invocation validates the final transaction
  -- state rather than an intermediate draft/active/completed snapshot.
  SELECT status INTO current_tournament_status
  FROM public.tournaments
  WHERE id = NEW.id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF (SELECT count(*) FROM public.tournament_stages WHERE tournament_id = NEW.id) = 1
     AND NOT EXISTS (
       SELECT 1
       FROM public.tournament_stages stage
       WHERE stage.tournament_id = NEW.id
         AND stage.status = CASE current_tournament_status
           WHEN 'draft' THEN 'planned'::public.tournament_stage_status
           WHEN 'active' THEN 'active'::public.tournament_stage_status
           ELSE 'completed'::public.tournament_stage_status
         END
     ) THEN
    RAISE EXCEPTION 'single-stage lifecycle must match tournament % status', NEW.id;
  END IF;
  RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER tournaments_validate_single_stage_lifecycle
AFTER INSERT OR UPDATE ON public.tournaments
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION public.validate_single_stage_lifecycle_alignment();

CREATE FUNCTION public.compat_sync_active_stage_pointer() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status = 'active' THEN
    IF NEW.status = 'active' THEN
      UPDATE public.tournaments
      SET active_stage_id = NEW.id
      WHERE id = NEW.tournament_id AND active_stage_id IS DISTINCT FROM NEW.id;
    END IF;
  ELSIF OLD.status = 'active' THEN
    UPDATE public.tournaments
    SET active_stage_id = NULL
    WHERE id = NEW.tournament_id AND active_stage_id = OLD.id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER tournament_stages_sync_active_pointer
AFTER INSERT OR UPDATE OF status ON public.tournament_stages
FOR EACH ROW EXECUTE FUNCTION public.compat_sync_active_stage_pointer();

CREATE FUNCTION public.validate_active_stage_pointer() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.active_stage_id IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.tournament_stages
      WHERE tournament_id = NEW.id AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'active_stage_id is required while tournament % has an active stage', NEW.id;
    END IF;
  ELSIF NOT EXISTS (
    SELECT 1 FROM public.tournament_stages
    WHERE tournament_id = NEW.id AND id = NEW.active_stage_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'active_stage_id % must identify the active stage of tournament %', NEW.active_stage_id, NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER tournaments_validate_active_stage_pointer
BEFORE UPDATE OF active_stage_id ON public.tournaments
FOR EACH ROW EXECUTE FUNCTION public.validate_active_stage_pointer();

CREATE FUNCTION public.validate_stage_group_configuration() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  stage_format public.tournament_stage_format;
  expected_group_count INTEGER;
  expected_participant_count INTEGER;
  expected_qualifiers_count INTEGER;
BEGIN
  SELECT format, group_count, participants_per_group, qualifiers_per_group
  INTO stage_format, expected_group_count, expected_participant_count, expected_qualifiers_count
  FROM public.tournament_stages
  WHERE id = NEW.stage_id;
  IF stage_format IS DISTINCT FROM 'group_stage'::public.tournament_stage_format THEN
    RAISE EXCEPTION 'stage_groups may belong only to group_stage';
  END IF;
  IF NEW.position > expected_group_count
     OR NEW.participant_count <> expected_participant_count
     OR NEW.qualifiers_count <> expected_qualifiers_count THEN
    RAISE EXCEPTION 'stage group configuration must match its tournament stage';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER stage_groups_validate_configuration
BEFORE INSERT OR UPDATE OF stage_id, position, participant_count, qualifiers_count
ON public.stage_groups
FOR EACH ROW EXECUTE FUNCTION public.validate_stage_group_configuration();

CREATE FUNCTION public.prevent_last_tournament_stage_delete() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.tournaments WHERE id = OLD.tournament_id)
     AND NOT EXISTS (
       SELECT 1 FROM public.tournament_stages
       WHERE tournament_id = OLD.tournament_id
     ) THEN
    RAISE EXCEPTION 'tournament % must retain at least one stage', OLD.tournament_id;
  END IF;
  RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER tournament_stages_require_at_least_one
AFTER DELETE ON public.tournament_stages
DEFERRABLE INITIALLY IMMEDIATE
FOR EACH ROW EXECUTE FUNCTION public.prevent_last_tournament_stage_delete();

CREATE FUNCTION public.compat_prepare_single_stage_player_seed() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  target_stage_id INTEGER;
BEGIN
  IF current_setting('tournament_manager.resequencing', true) = 'on' THEN
    RETURN NEW;
  END IF;
  SELECT id INTO target_stage_id
  FROM public.tournament_stages
  WHERE tournament_id = NEW.tournament_id AND position = 1;
  IF target_stage_id IS NULL THEN
    RAISE EXCEPTION 'Tournament % has no stage 1', NEW.tournament_id;
  END IF;
  IF NEW.seed IS NULL THEN
    SELECT COALESCE(max(stage_seed), 0) + 1 INTO NEW.seed
    FROM public.stage_participants
    WHERE stage_id = target_stage_id AND (TG_OP = 'INSERT' OR player_id <> NEW.id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER players_prepare_single_stage_seed
BEFORE INSERT OR UPDATE OF seed ON public.players
FOR EACH ROW EXECUTE FUNCTION public.compat_prepare_single_stage_player_seed();

CREATE FUNCTION public.compat_resequence_single_stage_participants(
  target_tournament_id INTEGER,
  target_stage_id INTEGER
) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('tournament_manager.resequencing', true) = 'on' THEN
    RETURN;
  END IF;

  PERFORM set_config('tournament_manager.resequencing', 'on', true);
  WITH ranked_players AS (
    SELECT
      player.id,
      row_number() OVER (ORDER BY player.seed ASC NULLS LAST, player.id ASC)::integer AS normalized_seed
    FROM public.players player
    WHERE player.tournament_id = target_tournament_id
  )
  UPDATE public.players player
  SET seed = ranked.normalized_seed
  FROM ranked_players ranked
  WHERE player.id = ranked.id
    AND player.seed IS DISTINCT FROM ranked.normalized_seed;

  UPDATE public.stage_participants participant
  SET stage_seed = player.seed
  FROM public.players player
  WHERE participant.stage_id = target_stage_id
    AND player.id = participant.player_id
    AND player.tournament_id = target_tournament_id
    AND participant.stage_seed IS DISTINCT FROM player.seed;
  PERFORM set_config('tournament_manager.resequencing', 'off', true);
END;
$$;

CREATE FUNCTION public.compat_sync_single_stage_participant() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  target_stage_id INTEGER;
BEGIN
  IF current_setting('tournament_manager.resequencing', true) = 'on' THEN
    RETURN NEW;
  END IF;
  SELECT id INTO target_stage_id
  FROM public.tournament_stages
  WHERE tournament_id = NEW.tournament_id AND position = 1;
  INSERT INTO public.stage_participants (
    tournament_id, stage_id, player_id, stage_seed, status, qualification_source, created_at
  ) VALUES (
    NEW.tournament_id, target_stage_id, NEW.id, NEW.seed,
    NEW.status::text::public.stage_participant_status, 'registration', NEW.created_at
  )
  ON CONFLICT (stage_id, player_id) DO UPDATE SET
    stage_seed = EXCLUDED.stage_seed,
    status = EXCLUDED.status;
  PERFORM public.compat_resequence_single_stage_participants(NEW.tournament_id, target_stage_id);
  UPDATE public.tournament_stages
  SET participant_count = (SELECT count(*) FROM public.players WHERE tournament_id = NEW.tournament_id)
  WHERE id = target_stage_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER players_sync_single_stage_participant
AFTER INSERT OR UPDATE OF seed, status ON public.players
FOR EACH ROW EXECUTE FUNCTION public.compat_sync_single_stage_participant();

CREATE FUNCTION public.compat_count_single_stage_participants_after_delete() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  target_stage_id INTEGER;
BEGIN
  SELECT id INTO target_stage_id
  FROM public.tournament_stages
  WHERE tournament_id = OLD.tournament_id AND position = 1;
  IF target_stage_id IS NOT NULL THEN
    PERFORM public.compat_resequence_single_stage_participants(OLD.tournament_id, target_stage_id);
  END IF;
  UPDATE public.tournament_stages
  SET participant_count = (SELECT count(*) FROM public.players WHERE tournament_id = OLD.tournament_id)
  WHERE tournament_id = OLD.tournament_id AND position = 1;
  RETURN OLD;
END;
$$;
CREATE TRIGGER players_count_single_stage_after_delete
AFTER DELETE ON public.players
FOR EACH ROW EXECUTE FUNCTION public.compat_count_single_stage_participants_after_delete();

CREATE FUNCTION public.compat_assign_single_stage_match() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  target_stage_id INTEGER;
  stage_count INTEGER;
BEGIN
  IF NEW.stage_id IS NULL OR NEW.stage_id = 0 THEN
    SELECT count(*), min(id) INTO stage_count, target_stage_id
    FROM public.tournament_stages WHERE tournament_id = NEW.tournament_id;
    IF stage_count <> 1 THEN
      RAISE EXCEPTION 'stage_id is required when tournament % does not have exactly one stage', NEW.tournament_id;
    END IF;
    NEW.stage_id := target_stage_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER matches_assign_single_stage
BEFORE INSERT OR UPDATE OF tournament_id, stage_id ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.compat_assign_single_stage_match();

CREATE FUNCTION public.compat_assign_result_history_stage() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stage_id IS NULL OR NEW.stage_id = 0 THEN
    SELECT stage_id INTO NEW.stage_id FROM public.matches WHERE id = NEW.match_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER result_history_assign_stage
BEFORE INSERT OR UPDATE OF match_id, stage_id ON public.result_history
FOR EACH ROW EXECUTE FUNCTION public.compat_assign_result_history_stage();

CREATE FUNCTION public.compat_assign_action_log_stage() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stage_id IS NULL AND NEW.match_id IS NOT NULL THEN
    SELECT stage_id INTO NEW.stage_id FROM public.matches WHERE id = NEW.match_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER action_log_assign_stage
BEFORE INSERT OR UPDATE OF match_id, stage_id ON public.action_log
FOR EACH ROW EXECUTE FUNCTION public.compat_assign_action_log_stage();

INSERT INTO public.app_schema_migrations (
  migration_key, app_commit, target_schema, deployment_environment
) VALUES (
  'tournament_stages_v1', migration_app_commit, migration_target_schema, migration_environment
);

END;
$tournament_stages_migration$;

CALL public.apply_tournament_stages_v1();
DROP PROCEDURE public.apply_tournament_stages_v1();

-- migration-runner-strip-begin
COMMIT;
-- migration-runner-strip-end
