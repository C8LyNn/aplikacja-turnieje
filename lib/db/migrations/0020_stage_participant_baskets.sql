-- Migration 0020: stable stage input/output baskets, forward-only routes and
-- direct input-basket assignments to canonical tournament players.
-- Existing stages remain implicit one-input/one-output stages; no legacy rows
-- are rewritten or require manual migration.

-- migration-runner-strip-begin
BEGIN;
SELECT pg_advisory_xact_lock(841730035);
-- migration-runner-strip-end

DO $prerequisites$
DECLARE
  required_table text;
BEGIN
  FOREACH required_table IN ARRAY ARRAY[
    'tournaments',
    'players',
    'tournament_stages',
    'stage_participants'
  ] LOOP
    IF to_regclass('public.' || required_table) IS NULL THEN
      RAISE EXCEPTION '0020 prerequisite failed: table public.% is missing', required_table;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint constraint_row
    WHERE constraint_row.conrelid = 'public.tournament_stages'::regclass
      AND constraint_row.conname = 'tournament_stages_tournament_id_id_unique'
      AND constraint_row.contype = 'u'
      AND constraint_row.convalidated
  ) THEN
    RAISE EXCEPTION '0020 prerequisite failed: canonical tournament stage identity is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_index index_row
    JOIN pg_class table_row ON table_row.oid = index_row.indrelid
    JOIN pg_class index_name ON index_name.oid = index_row.indexrelid
    WHERE table_row.oid = 'public.players'::regclass
      AND index_name.relname = 'players_tournament_id_id_unique'
      AND index_row.indisunique
      AND index_row.indisvalid
  ) THEN
    RAISE EXCEPTION '0020 prerequisite failed: canonical tournament player identity is missing';
  END IF;
END;
$prerequisites$;

CREATE TABLE IF NOT EXISTS public.stage_baskets (
  id text NOT NULL,
  tournament_id integer NOT NULL,
  stage_id integer NOT NULL,
  basket_type text NOT NULL,
  ordinal integer NOT NULL,
  display_order integer NOT NULL,
  color_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stage_baskets_pkey PRIMARY KEY (tournament_id, id),
  CONSTRAINT stage_baskets_tournament_stage_id_unique
    UNIQUE (tournament_id, stage_id, id),
  CONSTRAINT stage_baskets_stage_type_ordinal_unique
    UNIQUE (stage_id, basket_type, ordinal),
  CONSTRAINT stage_baskets_stage_type_order_unique
    UNIQUE (stage_id, basket_type, display_order),
  CONSTRAINT stage_baskets_stage_same_tournament_fk
    FOREIGN KEY (tournament_id, stage_id)
    REFERENCES public.tournament_stages(tournament_id, id)
    ON DELETE CASCADE,
  CONSTRAINT stage_baskets_id_valid
    CHECK (id ~ '^[a-z0-9][a-z0-9._:-]{0,99}$'),
  CONSTRAINT stage_baskets_type_supported
    CHECK (basket_type IN ('input', 'output')),
  CONSTRAINT stage_baskets_ordinal_range
    CHECK (ordinal BETWEEN 1 AND 4),
  CONSTRAINT stage_baskets_order_range
    CHECK (display_order BETWEEN 1 AND 4),
  CONSTRAINT stage_baskets_color_id_valid
    CHECK (color_id IS NULL OR length(btrim(color_id)) BETWEEN 1 AND 64)
);

CREATE TABLE IF NOT EXISTS public.stage_basket_routes (
  id text NOT NULL,
  tournament_id integer NOT NULL,
  source_stage_id integer NOT NULL,
  source_basket_id text NOT NULL,
  target_stage_id integer NOT NULL,
  target_basket_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stage_basket_routes_pkey PRIMARY KEY (tournament_id, id),
  CONSTRAINT stage_basket_routes_source_unique
    UNIQUE (tournament_id, source_basket_id),
  CONSTRAINT stage_basket_routes_source_same_tournament_fk
    FOREIGN KEY (tournament_id, source_stage_id, source_basket_id)
    REFERENCES public.stage_baskets(tournament_id, stage_id, id)
    ON DELETE CASCADE,
  CONSTRAINT stage_basket_routes_target_same_tournament_fk
    FOREIGN KEY (tournament_id, target_stage_id, target_basket_id)
    REFERENCES public.stage_baskets(tournament_id, stage_id, id)
    ON DELETE CASCADE,
  CONSTRAINT stage_basket_routes_id_valid
    CHECK (id ~ '^[a-z0-9][a-z0-9._:-]{0,99}$'),
  CONSTRAINT stage_basket_routes_distinct_baskets
    CHECK (source_basket_id <> target_basket_id)
);

CREATE TABLE IF NOT EXISTS public.stage_basket_participants (
  tournament_id integer NOT NULL,
  stage_id integer NOT NULL,
  basket_id text NOT NULL,
  player_id integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stage_basket_participants_pkey
    PRIMARY KEY (tournament_id, basket_id, player_id),
  CONSTRAINT stage_basket_participants_stage_player_unique
    UNIQUE (tournament_id, stage_id, player_id),
  CONSTRAINT stage_basket_participants_basket_same_stage_fk
    FOREIGN KEY (tournament_id, stage_id, basket_id)
    REFERENCES public.stage_baskets(tournament_id, stage_id, id)
    ON DELETE CASCADE,
  CONSTRAINT stage_basket_participants_player_same_tournament_fk
    FOREIGN KEY (tournament_id, player_id)
    REFERENCES public.players(tournament_id, id)
    ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION public.validate_stage_basket_route()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  source_type text;
  target_type text;
  source_position integer;
  target_position integer;
BEGIN
  SELECT basket.basket_type, stage.position
  INTO source_type, source_position
  FROM public.stage_baskets basket
  JOIN public.tournament_stages stage
    ON stage.id = basket.stage_id
   AND stage.tournament_id = basket.tournament_id
  WHERE basket.id = NEW.source_basket_id
    AND basket.stage_id = NEW.source_stage_id
    AND basket.tournament_id = NEW.tournament_id;

  SELECT basket.basket_type, stage.position
  INTO target_type, target_position
  FROM public.stage_baskets basket
  JOIN public.tournament_stages stage
    ON stage.id = basket.stage_id
   AND stage.tournament_id = basket.tournament_id
  WHERE basket.id = NEW.target_basket_id
    AND basket.stage_id = NEW.target_stage_id
    AND basket.tournament_id = NEW.tournament_id;

  IF source_type IS NULL OR target_type IS NULL THEN
    RAISE EXCEPTION 'stage basket route references a missing basket';
  END IF;
  IF source_type <> 'output' THEN
    RAISE EXCEPTION 'stage basket route source must be an output basket';
  END IF;
  IF target_type <> 'input' THEN
    RAISE EXCEPTION 'stage basket route target must be an input basket';
  END IF;
  IF target_position <= source_position THEN
    RAISE EXCEPTION 'stage basket routing must be forward-only';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS stage_basket_routes_validate ON public.stage_basket_routes;
CREATE TRIGGER stage_basket_routes_validate
BEFORE INSERT OR UPDATE OF tournament_id, source_stage_id, source_basket_id,
  target_stage_id, target_basket_id
ON public.stage_basket_routes
FOR EACH ROW EXECUTE FUNCTION public.validate_stage_basket_route();

CREATE OR REPLACE FUNCTION public.validate_stage_basket_participant()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  actual_type text;
BEGIN
  SELECT basket_type
  INTO actual_type
  FROM public.stage_baskets
  WHERE id = NEW.basket_id
    AND tournament_id = NEW.tournament_id
    AND stage_id = NEW.stage_id;

  IF actual_type IS NULL THEN
    RAISE EXCEPTION 'stage basket participant references a missing basket';
  END IF;
  IF actual_type <> 'input' THEN
    RAISE EXCEPTION 'participants can be assigned only to input baskets';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS stage_basket_participants_validate ON public.stage_basket_participants;
CREATE TRIGGER stage_basket_participants_validate
BEFORE INSERT OR UPDATE OF tournament_id, stage_id, basket_id
ON public.stage_basket_participants
FOR EACH ROW EXECUTE FUNCTION public.validate_stage_basket_participant();

DO $postconditions$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.stage_baskets'::regclass
      AND conname = 'stage_baskets_pkey'
      AND contype = 'p'
      AND convalidated
      AND pg_get_constraintdef(oid) = 'PRIMARY KEY (tournament_id, id)'
  ) THEN
    RAISE EXCEPTION '0020 postcondition failed: basket primary key differs';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.stage_basket_routes'::regclass
      AND conname = 'stage_basket_routes_source_unique'
      AND contype = 'u'
      AND convalidated
      AND pg_get_constraintdef(oid) = 'UNIQUE (tournament_id, source_basket_id)'
  ) THEN
    RAISE EXCEPTION '0020 postcondition failed: output source uniqueness differs';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.stage_basket_participants'::regclass
      AND conname = 'stage_basket_participants_stage_player_unique'
      AND contype = 'u'
      AND convalidated
      AND pg_get_constraintdef(oid) = 'UNIQUE (tournament_id, stage_id, player_id)'
  ) THEN
    RAISE EXCEPTION '0020 postcondition failed: stage participant uniqueness differs';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.stage_basket_routes'::regclass
      AND tgname = 'stage_basket_routes_validate'
      AND NOT tgisinternal
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.stage_basket_participants'::regclass
      AND tgname = 'stage_basket_participants_validate'
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION '0020 postcondition failed: basket validation triggers are missing';
  END IF;
END;
$postconditions$;

-- migration-runner-strip-begin
COMMIT;
-- migration-runner-strip-end
