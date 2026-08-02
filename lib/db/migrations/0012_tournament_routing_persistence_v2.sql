-- Relational, append-only persistence for deterministic Tournament Engine V2
-- compiled routing plans. Runtime matches, participant assignments and routing
-- history intentionally remain outside this migration.

-- migration-runner-strip-begin
BEGIN;
-- migration-runner-strip-end

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '5min';
SELECT pg_advisory_xact_lock(841730032);

CREATE OR REPLACE FUNCTION pg_temp.tournament_routing_catalog_signature()
RETURNS TABLE(fact_count BIGINT, signature TEXT)
LANGUAGE sql
STABLE
AS $catalog_signature$
  WITH routing_relations AS (
    SELECT relation.oid,
           relation.relname,
           relation.relkind,
           (pg_get_userbyid(relation.relowner) = current_user) AS owner_ok
    FROM pg_class relation
    JOIN pg_namespace namespace_row
      ON namespace_row.oid = relation.relnamespace
    WHERE namespace_row.nspname = current_schema()
      AND relation.relname = ANY(ARRAY[
        'tournament_routing_plans',
        'tournament_routing_buckets',
        'tournament_routing_stages',
        'tournament_routing_stage_group_sizes',
        'tournament_routing_entry_points',
        'tournament_routing_logical_matches',
        'tournament_routing_logical_match_slots',
        'tournament_routing_outputs',
        'tournament_routing_routes',
        'tournament_routing_selections',
        'tournament_routing_selection_group_sizes',
        'tournament_routing_route_sources',
        'tournament_routing_route_targets',
        'tournament_routing_route_conditions',
        'tournament_routing_dependencies'
      ])
      AND relation.relkind IN ('r', 'v', 'm', 'p', 'f')
  ),
  catalog_facts AS (
    SELECT concat_ws('|', 'T', relname, relkind::text, owner_ok::text) AS fact
    FROM routing_relations
    UNION ALL
    SELECT concat_ws(
      '|', 'C', relation.relname, attribute.attnum::text, attribute.attname,
      format_type(attribute.atttypid, attribute.atttypmod),
      attribute.atttypmod::text, attribute.attnotnull::text,
      coalesce(
        CASE
          WHEN pg_get_expr(default_row.adbin, default_row.adrelid) LIKE 'nextval(%'
            THEN 'serial'
          ELSE pg_get_expr(default_row.adbin, default_row.adrelid)
        END,
        '<null>'
      )
    )
    FROM routing_relations relation
    JOIN pg_attribute attribute
      ON attribute.attrelid = relation.oid
     AND attribute.attnum > 0
     AND NOT attribute.attisdropped
    LEFT JOIN pg_attrdef default_row
      ON default_row.adrelid = relation.oid
     AND default_row.adnum = attribute.attnum
    UNION ALL
    SELECT concat_ws(
      '|', 'K', relation.relname, constraint_row.conname,
      constraint_row.contype::text,
      coalesce((
        SELECT string_agg(attribute.attname, ',' ORDER BY key_column.ordinality)
        FROM unnest(constraint_row.conkey)
          WITH ORDINALITY key_column(attnum, ordinality)
        JOIN pg_attribute attribute
          ON attribute.attrelid = constraint_row.conrelid
         AND attribute.attnum = key_column.attnum
      ), '<null>'),
      coalesce(referenced_relation.relname, '<null>'),
      coalesce((
        SELECT string_agg(attribute.attname, ',' ORDER BY key_column.ordinality)
        FROM unnest(constraint_row.confkey)
          WITH ORDINALITY key_column(attnum, ordinality)
        JOIN pg_attribute attribute
          ON attribute.attrelid = constraint_row.confrelid
         AND attribute.attnum = key_column.attnum
      ), '<null>'),
      constraint_row.confupdtype::text,
      constraint_row.confdeltype::text,
      constraint_row.convalidated::text,
      constraint_row.condeferrable::text,
      constraint_row.condeferred::text,
      coalesce(
        pg_get_expr(constraint_row.conbin, constraint_row.conrelid, true),
        '<null>'
      )
    )
    FROM routing_relations relation
    JOIN pg_constraint constraint_row
      ON constraint_row.conrelid = relation.oid
    LEFT JOIN pg_class referenced_relation
      ON referenced_relation.oid = constraint_row.confrelid
    UNION ALL
    SELECT concat_ws(
      '|', 'I', relation.relname, index_relation.relname,
      index_row.indisunique::text, access_method.amname,
      (
        SELECT string_agg(
          pg_get_indexdef(index_row.indexrelid, key_position, true),
          ',' ORDER BY key_position
        )
        FROM generate_series(1, index_row.indnkeyatts) key_position
      ),
      (
        SELECT string_agg(
          CASE
            WHEN (index_row.indoption[key_position - 1] & 1) = 1
              THEN 'DESC'
            ELSE 'ASC'
          END,
          ',' ORDER BY key_position
        )
        FROM generate_series(1, index_row.indnkeyatts) key_position
      ),
      coalesce(
        pg_get_expr(index_row.indpred, index_row.indrelid, true),
        '<null>'
      ),
      (EXISTS (
        SELECT 1
        FROM pg_constraint owner_constraint
        WHERE owner_constraint.conindid = index_relation.oid
          AND owner_constraint.contype IN ('p', 'u', 'x')
      ))::text
    )
    FROM routing_relations relation
    JOIN pg_index index_row ON index_row.indrelid = relation.oid
    JOIN pg_class index_relation
      ON index_relation.oid = index_row.indexrelid
    JOIN pg_am access_method ON access_method.oid = index_relation.relam
  )
  SELECT count(*),
         md5(string_agg(fact, E'\n' ORDER BY fact))
  FROM catalog_facts;
$catalog_signature$;

DO $routing_persistence_catalog_preflight$
DECLARE
  expected_tables CONSTANT TEXT[] := ARRAY[
    'tournament_routing_plans',
    'tournament_routing_buckets',
    'tournament_routing_stages',
    'tournament_routing_stage_group_sizes',
    'tournament_routing_entry_points',
    'tournament_routing_logical_matches',
    'tournament_routing_logical_match_slots',
    'tournament_routing_outputs',
    'tournament_routing_routes',
    'tournament_routing_selections',
    'tournament_routing_selection_group_sizes',
    'tournament_routing_route_sources',
    'tournament_routing_route_targets',
    'tournament_routing_route_conditions',
    'tournament_routing_dependencies'
  ];
  present_count INTEGER;
  wrong_kind_count INTEGER;
  forbidden_index_count INTEGER;
  external_dependency_count INTEGER;
  foreign_named_object_count INTEGER;
  actual_fact_count BIGINT;
  actual_signature TEXT;
BEGIN
  SELECT count(*) FILTER (WHERE relation.relkind = 'r'),
         count(*) FILTER (WHERE relation.relkind <> 'r')
  INTO present_count, wrong_kind_count
  FROM pg_class relation
  JOIN pg_namespace namespace_row
    ON namespace_row.oid = relation.relnamespace
  WHERE namespace_row.nspname = current_schema()
    AND relation.relname = ANY(expected_tables);

  IF wrong_kind_count > 0 THEN
    RAISE EXCEPTION
      '0012 catalog conflict: an expected table name has another relkind';
  END IF;
  IF present_count > 0 AND present_count < array_length(expected_tables, 1) THEN
    RAISE EXCEPTION
      '0012 unsafe partial catalog: % of % routing tables exist',
      present_count, array_length(expected_tables, 1);
  END IF;

  SELECT count(*)
  INTO forbidden_index_count
  FROM pg_class index_relation
  JOIN pg_namespace namespace_row
    ON namespace_row.oid = index_relation.relnamespace
  WHERE namespace_row.nspname = current_schema()
    AND index_relation.relkind = 'i'
    AND index_relation.relname IN (
      'tournament_routing_entry_points_stage_idx',
      'tournament_routing_outputs_stage_idx'
    );

  SELECT count(*)
  INTO external_dependency_count
  FROM (
    SELECT constraint_row.oid
    FROM pg_constraint constraint_row
    JOIN pg_class referenced_relation
      ON referenced_relation.oid = constraint_row.confrelid
    JOIN pg_namespace referenced_namespace
      ON referenced_namespace.oid = referenced_relation.relnamespace
    JOIN pg_class owner_relation
      ON owner_relation.oid = constraint_row.conrelid
    JOIN pg_namespace owner_namespace
      ON owner_namespace.oid = owner_relation.relnamespace
    WHERE referenced_namespace.nspname = current_schema()
      AND referenced_relation.relname = ANY(expected_tables)
      AND NOT (
        owner_namespace.nspname = current_schema()
        AND owner_relation.relname = ANY(expected_tables)
      )
    UNION
    SELECT dependency.objid
    FROM pg_depend dependency
    JOIN pg_rewrite rewrite_rule
      ON dependency.classid = 'pg_rewrite'::regclass
     AND rewrite_rule.oid = dependency.objid
    JOIN pg_class owner_relation
      ON owner_relation.oid = rewrite_rule.ev_class
    JOIN pg_namespace owner_namespace
      ON owner_namespace.oid = owner_relation.relnamespace
    JOIN pg_class referenced_relation
      ON referenced_relation.oid = dependency.refobjid
    JOIN pg_namespace referenced_namespace
      ON referenced_namespace.oid = referenced_relation.relnamespace
    WHERE referenced_namespace.nspname = current_schema()
      AND referenced_relation.relname = ANY(expected_tables)
      AND NOT (
        owner_namespace.nspname = current_schema()
        AND owner_relation.relname = ANY(expected_tables)
      )
  ) external_dependency;

  SELECT count(*)
  INTO foreign_named_object_count
  FROM (
    SELECT constraint_row.conname AS object_name
    FROM pg_constraint constraint_row
    JOIN pg_class owner_relation
      ON owner_relation.oid = constraint_row.conrelid
    JOIN pg_namespace namespace_row
      ON namespace_row.oid = owner_relation.relnamespace
    WHERE namespace_row.nspname = current_schema()
      AND constraint_row.conname LIKE 'tournament_routing_%'
      AND owner_relation.relname <> ALL(expected_tables)
    UNION ALL
    SELECT index_relation.relname
    FROM pg_class index_relation
    JOIN pg_index index_row ON index_row.indexrelid = index_relation.oid
    JOIN pg_class owner_relation ON owner_relation.oid = index_row.indrelid
    JOIN pg_namespace namespace_row
      ON namespace_row.oid = owner_relation.relnamespace
    WHERE namespace_row.nspname = current_schema()
      AND index_relation.relname LIKE 'tournament_routing_%'
      AND owner_relation.relname <> ALL(expected_tables)
  ) foreign_named_object;

  IF forbidden_index_count > 0 OR external_dependency_count > 0 THEN
    RAISE EXCEPTION
      '0012 unsafe catalog: forbidden indexes or external dependencies exist';
  END IF;
  IF foreign_named_object_count > 0 THEN
    RAISE EXCEPTION
      '0012 catalog conflict: routing object names are owned by other tables';
  END IF;

  IF present_count = array_length(expected_tables, 1) THEN
    SELECT fact_count, signature
    INTO actual_fact_count, actual_signature
    FROM pg_temp.tournament_routing_catalog_signature();
    IF actual_fact_count <> 273
       OR actual_signature <> 'e0f6a2ba1936217266e3d2afadece43e' THEN
      RAISE EXCEPTION
        '0012 catalog conflict: complete catalog differs from manifest';
    END IF;
  END IF;
END;
$routing_persistence_catalog_preflight$;

DO $routing_persistence_prerequisites$
BEGIN
  IF to_regclass('public.tournaments') IS NULL THEN
    RAISE EXCEPTION
      '0012_tournament_routing_persistence_v2 requires public.tournaments';
  END IF;
  IF to_regclass('public.tournament_stages') IS NULL THEN
    RAISE EXCEPTION
      '0012_tournament_routing_persistence_v2 requires public.tournament_stages';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.tournament_stages'::regclass
      AND conname = 'tournament_stages_tournament_id_id_unique'
      AND contype = 'u'
      AND convalidated
  ) THEN
    RAISE EXCEPTION
      '0012_tournament_routing_persistence_v2 requires validated tournament_stages_tournament_id_id_unique';
  END IF;
END;
$routing_persistence_prerequisites$;

CREATE TABLE IF NOT EXISTS public.tournament_routing_plans (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL
    REFERENCES public.tournaments(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  compiled_plan_version INTEGER NOT NULL,
  blueprint_model_version INTEGER NOT NULL,
  checksum TEXT NOT NULL,
  canonical_payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sealed',
  source_kind TEXT NOT NULL DEFAULT 'compiled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sealed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT tournament_routing_plans_tournament_revision_unique
    UNIQUE (tournament_id, revision),
  CONSTRAINT tournament_routing_plans_id_tournament_unique
    UNIQUE (id, tournament_id),
  CONSTRAINT tournament_routing_plans_revision_positive
    CHECK (revision > 0),
  CONSTRAINT tournament_routing_plans_model_versions_positive
    CHECK (compiled_plan_version > 0 AND blueprint_model_version > 0),
  CONSTRAINT tournament_routing_plans_checksum_sha256
    CHECK (checksum ~ '^[0-9a-f]{64}$'),
  CONSTRAINT tournament_routing_plans_status_supported
    CHECK (status = 'sealed'),
  CONSTRAINT tournament_routing_plans_source_kind_nonempty
    CHECK (length(trim(source_kind)) > 0)
);

CREATE TABLE IF NOT EXISTS public.tournament_routing_buckets (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL
    REFERENCES public.tournament_routing_plans(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  bucket_key TEXT NOT NULL,
  name TEXT NOT NULL,
  exact_capacity INTEGER NOT NULL,
  priority INTEGER NOT NULL,
  CONSTRAINT tournament_routing_buckets_plan_key_unique
    UNIQUE (plan_id, bucket_key),
  CONSTRAINT tournament_routing_buckets_plan_ordinal_unique
    UNIQUE (plan_id, ordinal),
  CONSTRAINT tournament_routing_buckets_plan_id_unique
    UNIQUE (plan_id, id),
  CONSTRAINT tournament_routing_buckets_values_valid
    CHECK (ordinal >= 0 AND exact_capacity > 0 AND priority >= 0)
);

CREATE TABLE IF NOT EXISTS public.tournament_routing_stages (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL,
  tournament_id INTEGER NOT NULL,
  stage_id INTEGER NOT NULL,
  ordinal INTEGER NOT NULL,
  stage_key TEXT NOT NULL,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  exact_participant_capacity INTEGER NOT NULL,
  selection_capability_type TEXT NOT NULL,
  exact_group_count INTEGER,
  maximum_qualifiers_per_group INTEGER,
  format_id TEXT NOT NULL,
  format_rules_version INTEGER NOT NULL,
  CONSTRAINT tournament_routing_stages_plan_tournament_fk
    FOREIGN KEY (plan_id, tournament_id)
    REFERENCES public.tournament_routing_plans(id, tournament_id)
    ON DELETE CASCADE,
  CONSTRAINT tournament_routing_stages_stage_tournament_fk
    FOREIGN KEY (tournament_id, stage_id)
    REFERENCES public.tournament_stages(tournament_id, id)
    ON DELETE NO ACTION,
  CONSTRAINT tournament_routing_stages_plan_key_unique
    UNIQUE (plan_id, stage_key),
  CONSTRAINT tournament_routing_stages_plan_stage_unique
    UNIQUE (plan_id, stage_id),
  CONSTRAINT tournament_routing_stages_plan_ordinal_unique
    UNIQUE (plan_id, ordinal),
  CONSTRAINT tournament_routing_stages_plan_id_unique
    UNIQUE (plan_id, id),
  CONSTRAINT tournament_routing_stages_values_valid
    CHECK (
      ordinal >= 0
      AND display_order >= 0
      AND exact_participant_capacity > 0
      AND format_rules_version > 0
    ),
  CONSTRAINT tournament_routing_stages_selection_shape
    CHECK (
      (
        selection_capability_type = 'none'
        AND exact_group_count IS NULL
        AND maximum_qualifiers_per_group IS NULL
      ) OR (
        selection_capability_type = 'groups'
        AND exact_group_count > 0
        AND maximum_qualifiers_per_group > 0
      )
    )
);
CREATE INDEX IF NOT EXISTS tournament_routing_stages_tournament_stage_idx
  ON public.tournament_routing_stages (tournament_id, stage_id);

CREATE TABLE IF NOT EXISTS public.tournament_routing_stage_group_sizes (
  plan_id INTEGER NOT NULL,
  routing_stage_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  exact_group_size INTEGER NOT NULL,
  CONSTRAINT tournament_routing_stage_group_sizes_pk
    PRIMARY KEY (routing_stage_id, position),
  CONSTRAINT tournament_routing_stage_group_sizes_stage_fk
    FOREIGN KEY (plan_id, routing_stage_id)
    REFERENCES public.tournament_routing_stages(plan_id, id)
    ON DELETE CASCADE,
  CONSTRAINT tournament_routing_stage_group_sizes_values_valid
    CHECK (position >= 0 AND exact_group_size > 0)
);

CREATE TABLE IF NOT EXISTS public.tournament_routing_entry_points (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL,
  routing_stage_id INTEGER NOT NULL,
  ordinal INTEGER NOT NULL,
  entry_key TEXT NOT NULL,
  name TEXT,
  exact_capacity INTEGER NOT NULL,
  priority INTEGER NOT NULL,
  completeness_type TEXT NOT NULL,
  CONSTRAINT tournament_routing_entry_points_stage_fk
    FOREIGN KEY (plan_id, routing_stage_id)
    REFERENCES public.tournament_routing_stages(plan_id, id)
    ON DELETE CASCADE,
  CONSTRAINT tournament_routing_entry_points_stage_key_unique
    UNIQUE (routing_stage_id, entry_key),
  CONSTRAINT tournament_routing_entry_points_plan_ordinal_unique
    UNIQUE (plan_id, ordinal),
  CONSTRAINT tournament_routing_entry_points_plan_id_unique
    UNIQUE (plan_id, id),
  CONSTRAINT tournament_routing_entry_points_plan_stage_id_unique
    UNIQUE (plan_id, routing_stage_id, id),
  CONSTRAINT tournament_routing_entry_points_values_valid
    CHECK (
      ordinal >= 0
      AND exact_capacity > 0
      AND priority >= 0
      AND completeness_type = 'exact'
    )
);
CREATE TABLE IF NOT EXISTS public.tournament_routing_logical_matches (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL,
  routing_stage_id INTEGER NOT NULL,
  ordinal INTEGER NOT NULL,
  match_key TEXT NOT NULL,
  name TEXT,
  match_order INTEGER NOT NULL,
  CONSTRAINT tournament_routing_logical_matches_stage_fk
    FOREIGN KEY (plan_id, routing_stage_id)
    REFERENCES public.tournament_routing_stages(plan_id, id)
    ON DELETE CASCADE,
  CONSTRAINT tournament_routing_logical_matches_plan_key_unique
    UNIQUE (plan_id, match_key),
  CONSTRAINT tournament_routing_logical_matches_plan_ordinal_unique
    UNIQUE (plan_id, ordinal),
  CONSTRAINT tournament_routing_logical_matches_plan_id_unique
    UNIQUE (plan_id, id),
  CONSTRAINT tournament_routing_logical_matches_plan_stage_id_unique
    UNIQUE (plan_id, routing_stage_id, id),
  CONSTRAINT tournament_routing_logical_matches_values_valid
    CHECK (ordinal >= 0 AND match_order >= 0)
);
CREATE INDEX IF NOT EXISTS tournament_routing_logical_matches_stage_idx
  ON public.tournament_routing_logical_matches (routing_stage_id);

CREATE TABLE IF NOT EXISTS public.tournament_routing_logical_match_slots (
  plan_id INTEGER NOT NULL,
  routing_stage_id INTEGER NOT NULL,
  logical_match_id INTEGER NOT NULL,
  slot INTEGER NOT NULL,
  CONSTRAINT tournament_routing_logical_match_slots_pk
    PRIMARY KEY (logical_match_id, slot),
  CONSTRAINT tournament_routing_logical_match_slots_match_fk
    FOREIGN KEY (plan_id, routing_stage_id, logical_match_id)
    REFERENCES public.tournament_routing_logical_matches(plan_id, routing_stage_id, id)
    ON DELETE CASCADE,
  CONSTRAINT tournament_routing_match_slots_plan_stage_match_slot_uq
    UNIQUE (plan_id, routing_stage_id, logical_match_id, slot),
  CONSTRAINT tournament_routing_logical_match_slots_supported
    CHECK (slot IN (1, 2))
);

CREATE TABLE IF NOT EXISTS public.tournament_routing_outputs (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL,
  routing_stage_id INTEGER NOT NULL,
  ordinal INTEGER NOT NULL,
  output_key TEXT NOT NULL,
  name TEXT,
  exact_capacity INTEGER NOT NULL,
  priority INTEGER NOT NULL,
  CONSTRAINT tournament_routing_outputs_stage_fk
    FOREIGN KEY (plan_id, routing_stage_id)
    REFERENCES public.tournament_routing_stages(plan_id, id)
    ON DELETE CASCADE,
  CONSTRAINT tournament_routing_outputs_stage_key_unique
    UNIQUE (routing_stage_id, output_key),
  CONSTRAINT tournament_routing_outputs_plan_ordinal_unique
    UNIQUE (plan_id, ordinal),
  CONSTRAINT tournament_routing_outputs_plan_id_unique
    UNIQUE (plan_id, id),
  CONSTRAINT tournament_routing_outputs_plan_stage_id_unique
    UNIQUE (plan_id, routing_stage_id, id),
  CONSTRAINT tournament_routing_outputs_values_valid
    CHECK (ordinal >= 0 AND exact_capacity > 0 AND priority >= 0)
);
CREATE TABLE IF NOT EXISTS public.tournament_routing_routes (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL
    REFERENCES public.tournament_routing_plans(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  route_key TEXT NOT NULL,
  reserved_slots INTEGER NOT NULL,
  priority INTEGER NOT NULL,
  route_order INTEGER NOT NULL,
  CONSTRAINT tournament_routing_routes_plan_key_unique
    UNIQUE (plan_id, route_key),
  CONSTRAINT tournament_routing_routes_plan_ordinal_unique
    UNIQUE (plan_id, ordinal),
  CONSTRAINT tournament_routing_routes_plan_id_unique
    UNIQUE (plan_id, id),
  CONSTRAINT tournament_routing_routes_plan_id_cardinality_unique
    UNIQUE (plan_id, id, reserved_slots),
  CONSTRAINT tournament_routing_routes_values_valid
    CHECK (
      ordinal >= 0
      AND reserved_slots > 0
      AND priority >= 0
      AND route_order >= 0
    )
);

CREATE TABLE IF NOT EXISTS public.tournament_routing_selections (
  route_id INTEGER PRIMARY KEY,
  plan_id INTEGER NOT NULL,
  routing_stage_id INTEGER,
  selection_type TEXT NOT NULL,
  exact_cardinality INTEGER NOT NULL,
  count INTEGER,
  range_from INTEGER,
  range_to INTEGER,
  count_per_group INTEGER,
  group_count INTEGER,
  named_output_id INTEGER,
  CONSTRAINT tournament_routing_selections_plan_route_unique
    UNIQUE (plan_id, route_id),
  CONSTRAINT tournament_routing_selections_route_cardinality_fk
    FOREIGN KEY (plan_id, route_id, exact_cardinality)
    REFERENCES public.tournament_routing_routes(plan_id, id, reserved_slots)
    ON DELETE CASCADE,
  CONSTRAINT tournament_routing_selections_output_fk
    FOREIGN KEY (plan_id, routing_stage_id, named_output_id)
    REFERENCES public.tournament_routing_outputs(plan_id, routing_stage_id, id)
    ON DELETE NO ACTION
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT tournament_routing_selections_cardinality_positive
    CHECK (exact_cardinality > 0),
  CONSTRAINT tournament_routing_selections_shape
    CHECK (
      (
        selection_type = 'all'
        AND count IS NULL
        AND range_from IS NULL
        AND range_to IS NULL
        AND count_per_group IS NULL
        AND group_count IS NULL
        AND named_output_id IS NULL
      ) OR (
        selection_type IN ('top_n', 'best_not_selected')
        AND count = exact_cardinality
        AND range_from IS NULL
        AND range_to IS NULL
        AND count_per_group IS NULL
        AND group_count IS NULL
        AND named_output_id IS NULL
      ) OR (
        selection_type = 'rank_range'
        AND range_from > 0
        AND range_to >= range_from
        AND exact_cardinality = range_to - range_from + 1
        AND count IS NULL
        AND count_per_group IS NULL
        AND group_count IS NULL
        AND named_output_id IS NULL
      ) OR (
        selection_type = 'top_n_per_group'
        AND count_per_group > 0
        AND group_count > 0
        AND exact_cardinality = count_per_group * group_count
        AND count IS NULL
        AND range_from IS NULL
        AND range_to IS NULL
        AND named_output_id IS NULL
      ) OR (
        selection_type = 'named_output'
        AND routing_stage_id IS NOT NULL
        AND named_output_id IS NOT NULL
        AND count IS NULL
        AND range_from IS NULL
        AND range_to IS NULL
        AND count_per_group IS NULL
        AND group_count IS NULL
      )
    )
);

CREATE TABLE IF NOT EXISTS public.tournament_routing_selection_group_sizes (
  plan_id INTEGER NOT NULL,
  route_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  exact_group_size INTEGER NOT NULL,
  CONSTRAINT tournament_routing_selection_group_sizes_pk
    PRIMARY KEY (route_id, position),
  CONSTRAINT tournament_routing_selection_group_sizes_selection_fk
    FOREIGN KEY (plan_id, route_id)
    REFERENCES public.tournament_routing_selections(plan_id, route_id)
    ON DELETE CASCADE,
  CONSTRAINT tournament_routing_selection_group_sizes_values_valid
    CHECK (position >= 0 AND exact_group_size > 0)
);

CREATE TABLE IF NOT EXISTS public.tournament_routing_route_sources (
  route_id INTEGER PRIMARY KEY,
  plan_id INTEGER NOT NULL,
  source_type TEXT NOT NULL,
  bucket_id INTEGER,
  routing_stage_id INTEGER,
  entry_point_id INTEGER,
  logical_match_id INTEGER,
  entry_position INTEGER,
  match_outcome TEXT,
  CONSTRAINT tournament_routing_route_sources_route_fk
    FOREIGN KEY (plan_id, route_id)
    REFERENCES public.tournament_routing_routes(plan_id, id)
    ON DELETE CASCADE,
  CONSTRAINT tournament_routing_route_sources_bucket_fk
    FOREIGN KEY (plan_id, bucket_id)
    REFERENCES public.tournament_routing_buckets(plan_id, id)
    ON DELETE NO ACTION
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT tournament_routing_route_sources_stage_fk
    FOREIGN KEY (plan_id, routing_stage_id)
    REFERENCES public.tournament_routing_stages(plan_id, id)
    ON DELETE NO ACTION
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT tournament_routing_route_sources_stage_entry_fk
    FOREIGN KEY (plan_id, routing_stage_id, entry_point_id)
    REFERENCES public.tournament_routing_entry_points(plan_id, routing_stage_id, id)
    ON DELETE NO ACTION
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT tournament_routing_route_sources_stage_match_fk
    FOREIGN KEY (plan_id, routing_stage_id, logical_match_id)
    REFERENCES public.tournament_routing_logical_matches(plan_id, routing_stage_id, id)
    ON DELETE NO ACTION
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT tournament_routing_route_sources_plan_route_stage_unique
    UNIQUE (plan_id, route_id, routing_stage_id),
  CONSTRAINT tournament_routing_route_sources_shape
    CHECK (
      (
        source_type = 'registration_bucket'
        AND bucket_id IS NOT NULL
        AND routing_stage_id IS NULL
        AND entry_point_id IS NULL
        AND logical_match_id IS NULL
        AND entry_position IS NULL
        AND match_outcome IS NULL
      ) OR (
        source_type = 'stage_result'
        AND bucket_id IS NULL
        AND routing_stage_id IS NOT NULL
        AND entry_point_id IS NULL
        AND logical_match_id IS NULL
        AND entry_position IS NULL
        AND match_outcome IS NULL
      ) OR (
        source_type = 'stage_entry'
        AND bucket_id IS NULL
        AND routing_stage_id IS NOT NULL
        AND entry_point_id IS NOT NULL
        AND logical_match_id IS NULL
        AND entry_position > 0
        AND match_outcome IS NULL
      ) OR (
        source_type = 'match_outcome'
        AND bucket_id IS NULL
        AND routing_stage_id IS NOT NULL
        AND entry_point_id IS NULL
        AND logical_match_id IS NOT NULL
        AND entry_position IS NULL
        AND match_outcome IN ('winner', 'loser')
      )
  )
);

DO $routing_selection_source_stage_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.tournament_routing_selections'::regclass
      AND conname = 'tournament_routing_selections_source_stage_fk'
  ) THEN
    ALTER TABLE public.tournament_routing_selections
      ADD CONSTRAINT tournament_routing_selections_source_stage_fk
      FOREIGN KEY (plan_id, route_id, routing_stage_id)
      REFERENCES public.tournament_routing_route_sources(
        plan_id,
        route_id,
        routing_stage_id
      )
      ON DELETE CASCADE;
  END IF;
END;
$routing_selection_source_stage_fk$;

CREATE TABLE IF NOT EXISTS public.tournament_routing_route_targets (
  route_id INTEGER PRIMARY KEY,
  plan_id INTEGER NOT NULL,
  target_type TEXT NOT NULL,
  routing_stage_id INTEGER,
  entry_point_id INTEGER,
  logical_match_id INTEGER,
  output_id INTEGER,
  match_slot INTEGER,
  CONSTRAINT tournament_routing_route_targets_route_fk
    FOREIGN KEY (plan_id, route_id)
    REFERENCES public.tournament_routing_routes(plan_id, id)
    ON DELETE CASCADE,
  CONSTRAINT tournament_routing_route_targets_stage_fk
    FOREIGN KEY (plan_id, routing_stage_id)
    REFERENCES public.tournament_routing_stages(plan_id, id)
    ON DELETE NO ACTION
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT tournament_routing_route_targets_stage_entry_fk
    FOREIGN KEY (plan_id, routing_stage_id, entry_point_id)
    REFERENCES public.tournament_routing_entry_points(plan_id, routing_stage_id, id)
    ON DELETE NO ACTION
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT tournament_routing_route_targets_stage_match_fk
    FOREIGN KEY (plan_id, routing_stage_id, logical_match_id)
    REFERENCES public.tournament_routing_logical_matches(plan_id, routing_stage_id, id)
    ON DELETE NO ACTION
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT tournament_routing_route_targets_match_slot_fk
    FOREIGN KEY (plan_id, routing_stage_id, logical_match_id, match_slot)
    REFERENCES public.tournament_routing_logical_match_slots(
      plan_id,
      routing_stage_id,
      logical_match_id,
      slot
    )
    ON DELETE NO ACTION
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT tournament_routing_route_targets_stage_output_fk
    FOREIGN KEY (plan_id, routing_stage_id, output_id)
    REFERENCES public.tournament_routing_outputs(plan_id, routing_stage_id, id)
    ON DELETE NO ACTION
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT tournament_routing_route_targets_match_slot_unique
    UNIQUE (plan_id, logical_match_id, match_slot),
  CONSTRAINT tournament_routing_route_targets_shape
    CHECK (
      (
        target_type = 'stage_entry'
        AND routing_stage_id IS NOT NULL
        AND entry_point_id IS NOT NULL
        AND logical_match_id IS NULL
        AND output_id IS NULL
        AND match_slot IS NULL
      ) OR (
        target_type = 'match_slot'
        AND routing_stage_id IS NOT NULL
        AND entry_point_id IS NULL
        AND logical_match_id IS NOT NULL
        AND output_id IS NULL
        AND match_slot IN (1, 2)
      ) OR (
        target_type = 'stage_output'
        AND routing_stage_id IS NOT NULL
        AND entry_point_id IS NULL
        AND logical_match_id IS NULL
        AND output_id IS NOT NULL
        AND match_slot IS NULL
      )
    )
);

CREATE TABLE IF NOT EXISTS public.tournament_routing_route_conditions (
  route_id INTEGER PRIMARY KEY,
  plan_id INTEGER NOT NULL,
  condition_type TEXT NOT NULL,
  lineage_type TEXT,
  lineage_entry_point_id INTEGER,
  lineage_route_id INTEGER,
  logical_match_id INTEGER,
  CONSTRAINT tournament_routing_route_conditions_route_fk
    FOREIGN KEY (plan_id, route_id)
    REFERENCES public.tournament_routing_routes(plan_id, id)
    ON DELETE CASCADE,
  CONSTRAINT tournament_routing_route_conditions_entry_fk
    FOREIGN KEY (plan_id, lineage_entry_point_id)
    REFERENCES public.tournament_routing_entry_points(plan_id, id)
    ON DELETE NO ACTION
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT tournament_routing_route_conditions_lineage_route_fk
    FOREIGN KEY (plan_id, lineage_route_id)
    REFERENCES public.tournament_routing_routes(plan_id, id)
    ON DELETE NO ACTION
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT tournament_routing_route_conditions_match_fk
    FOREIGN KEY (plan_id, logical_match_id)
    REFERENCES public.tournament_routing_logical_matches(plan_id, id)
    ON DELETE NO ACTION
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT tournament_routing_route_conditions_shape
    CHECK (
      (
        condition_type = 'always'
        AND lineage_type IS NULL
        AND lineage_entry_point_id IS NULL
        AND lineage_route_id IS NULL
        AND logical_match_id IS NULL
      ) OR (
        condition_type = 'participant_lineage'
        AND logical_match_id IS NULL
        AND (
          (
            lineage_type = 'stage_entry'
            AND lineage_entry_point_id IS NOT NULL
            AND lineage_route_id IS NULL
          ) OR (
            lineage_type = 'route'
            AND lineage_entry_point_id IS NULL
            AND lineage_route_id IS NOT NULL
            AND lineage_route_id <> route_id
          )
        )
      ) OR (
        condition_type = 'match_winner_lineage'
        AND logical_match_id IS NOT NULL
        AND (
          (
            lineage_type = 'stage_entry'
            AND lineage_entry_point_id IS NOT NULL
            AND lineage_route_id IS NULL
          ) OR (
            lineage_type = 'route'
            AND lineage_entry_point_id IS NULL
            AND lineage_route_id IS NOT NULL
            AND lineage_route_id <> route_id
          )
        )
      )
    )
);

CREATE TABLE IF NOT EXISTS public.tournament_routing_dependencies (
  route_id INTEGER PRIMARY KEY,
  plan_id INTEGER NOT NULL,
  ordinal INTEGER NOT NULL,
  source_node_key TEXT NOT NULL,
  target_node_key TEXT NOT NULL,
  CONSTRAINT tournament_routing_dependencies_route_fk
    FOREIGN KEY (plan_id, route_id)
    REFERENCES public.tournament_routing_routes(plan_id, id)
    ON DELETE CASCADE,
  CONSTRAINT tournament_routing_dependencies_plan_ordinal_unique
    UNIQUE (plan_id, ordinal),
  CONSTRAINT tournament_routing_dependencies_values_valid
    CHECK (
      ordinal >= 0
      AND length(source_node_key) > 0
      AND length(target_node_key) > 0
    )
);

DO $routing_persistence_postconditions$
DECLARE
  actual_fact_count BIGINT;
  actual_signature TEXT;
BEGIN
  SELECT fact_count, signature
  INTO actual_fact_count, actual_signature
  FROM pg_temp.tournament_routing_catalog_signature();
  IF actual_fact_count <> 273
     OR actual_signature <> 'e0f6a2ba1936217266e3d2afadece43e' THEN
    RAISE EXCEPTION
      '0012 postcondition failed: catalog does not match manifest (facts %, signature %)',
      actual_fact_count, actual_signature;
  END IF;
END;
$routing_persistence_postconditions$;

-- migration-runner-strip-begin
COMMIT;
-- migration-runner-strip-end
