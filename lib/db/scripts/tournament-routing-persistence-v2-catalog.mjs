/**
 * Canonical PostgreSQL catalog manifest for migration 0012.
 *
 * The signature is calculated from 273 ordered facts. Those facts cover every
 * routing table and its owner, relkind, ordered columns, PostgreSQL types and
 * typmods, nullability, normalized defaults, PK/UQ/FK/CHECK constraints
 * (including ordered local/referenced columns, update/delete actions,
 * validation and deferrability), and every index (method, ordered keys,
 * ordering, predicate, uniqueness and constraint ownership).
 *
 * This module is the executable source of truth used by the read-only
 * preflight and catalog/deployment tests. Migration 0012 repeats the same
 * normalized query because standalone SQL cannot import JavaScript; the
 * deployment test proves that SQL 0012 produces this exact signature.
 */
export const ROUTING_PERSISTENCE_TABLES = Object.freeze([
  "tournament_routing_plans",
  "tournament_routing_buckets",
  "tournament_routing_stages",
  "tournament_routing_stage_group_sizes",
  "tournament_routing_entry_points",
  "tournament_routing_logical_matches",
  "tournament_routing_logical_match_slots",
  "tournament_routing_outputs",
  "tournament_routing_routes",
  "tournament_routing_selections",
  "tournament_routing_selection_group_sizes",
  "tournament_routing_route_sources",
  "tournament_routing_route_targets",
  "tournament_routing_route_conditions",
  "tournament_routing_dependencies",
]);

export const ROUTING_PERSISTENCE_FORBIDDEN_INDEXES = Object.freeze([
  "tournament_routing_entry_points_stage_idx",
  "tournament_routing_outputs_stage_idx",
]);

export const ROUTING_PERSISTENCE_CATALOG_MANIFEST = Object.freeze({
  version: 1,
  tableCount: 15,
  factCount: 273,
  signature: "e0f6a2ba1936217266e3d2afadece43e",
  tables: ROUTING_PERSISTENCE_TABLES,
  forbiddenIndexes: ROUTING_PERSISTENCE_FORBIDDEN_INDEXES,
});

export const ROUTING_PERSISTENCE_CATALOG_FACTS_CTE = String.raw`
WITH routing_relations AS (
  SELECT relation.oid,
         relation.relname,
         relation.relkind,
         (pg_get_userbyid(relation.relowner) = current_user) AS owner_ok
  FROM pg_class relation
  JOIN pg_namespace namespace_row ON namespace_row.oid = relation.relnamespace
  WHERE namespace_row.nspname = $1
    AND relation.relname = ANY($2::text[])
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
      FROM unnest(constraint_row.conkey) WITH ORDINALITY key_column(attnum, ordinality)
      JOIN pg_attribute attribute
        ON attribute.attrelid = constraint_row.conrelid
       AND attribute.attnum = key_column.attnum
    ), '<null>'),
    coalesce(referenced_relation.relname, '<null>'),
    coalesce((
      SELECT string_agg(attribute.attname, ',' ORDER BY key_column.ordinality)
      FROM unnest(constraint_row.confkey) WITH ORDINALITY key_column(attnum, ordinality)
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
    coalesce(pg_get_expr(index_row.indpred, index_row.indrelid, true), '<null>'),
    (EXISTS (
      SELECT 1
      FROM pg_constraint owner_constraint
      WHERE owner_constraint.conindid = index_relation.oid
        AND owner_constraint.contype IN ('p', 'u', 'x')
    ))::text
  )
  FROM routing_relations relation
  JOIN pg_index index_row ON index_row.indrelid = relation.oid
  JOIN pg_class index_relation ON index_relation.oid = index_row.indexrelid
  JOIN pg_am access_method ON access_method.oid = index_relation.relam
)`;

export const ROUTING_PERSISTENCE_CATALOG_SIGNATURE_QUERY =
  ROUTING_PERSISTENCE_CATALOG_FACTS_CTE +
  String.raw`
SELECT count(*)::integer AS fact_count,
       md5(string_agg(fact, E'\n' ORDER BY fact)) AS signature
FROM catalog_facts`;

export async function inspectRoutingPersistenceCatalog(client, schema) {
  const relationsResult = await client.query(
    `SELECT relation.relname AS name,
            relation.relkind AS relkind
     FROM pg_class relation
     JOIN pg_namespace namespace_row
       ON namespace_row.oid = relation.relnamespace
     WHERE namespace_row.nspname = $1
       AND relation.relname = ANY($2::text[])
     ORDER BY relation.relname`,
    [schema, ROUTING_PERSISTENCE_TABLES],
  );
  const signatureResult = await client.query(
    ROUTING_PERSISTENCE_CATALOG_SIGNATURE_QUERY,
    [schema, ROUTING_PERSISTENCE_TABLES],
  );
  const forbiddenIndexesResult = await client.query(
    `SELECT index_relation.relname AS name
     FROM pg_class index_relation
     JOIN pg_namespace namespace_row
       ON namespace_row.oid = index_relation.relnamespace
     WHERE namespace_row.nspname = $1
       AND index_relation.relkind = 'i'
       AND index_relation.relname = ANY($2::text[])
     ORDER BY index_relation.relname`,
    [schema, ROUTING_PERSISTENCE_FORBIDDEN_INDEXES],
  );
  const foreignNamedObjectsResult = await client.query(
    `SELECT object_type, object_name
     FROM (
       SELECT 'constraint'::text AS object_type,
              constraint_row.conname AS object_name
       FROM pg_constraint constraint_row
       JOIN pg_class owner_relation ON owner_relation.oid = constraint_row.conrelid
       JOIN pg_namespace namespace_row ON namespace_row.oid = owner_relation.relnamespace
       WHERE namespace_row.nspname = $1
         AND constraint_row.conname LIKE 'tournament_routing_%'
         AND owner_relation.relname <> ALL($2::text[])
       UNION ALL
       SELECT 'index'::text,
              index_relation.relname
       FROM pg_class index_relation
       JOIN pg_index index_row ON index_row.indexrelid = index_relation.oid
       JOIN pg_class owner_relation ON owner_relation.oid = index_row.indrelid
       JOIN pg_namespace namespace_row ON namespace_row.oid = owner_relation.relnamespace
       WHERE namespace_row.nspname = $1
         AND index_relation.relname LIKE 'tournament_routing_%'
         AND owner_relation.relname <> ALL($2::text[])
     ) named_object
     ORDER BY object_type, object_name`,
    [schema, ROUTING_PERSISTENCE_TABLES],
  );
  const externalDependenciesResult = await client.query(
    `SELECT owner_schema, owner_table, constraint_name
     FROM (
       SELECT owner_namespace.nspname AS owner_schema,
            owner_relation.relname AS owner_table,
            constraint_row.conname AS constraint_name
     FROM pg_constraint constraint_row
     JOIN pg_class referenced_relation
       ON referenced_relation.oid = constraint_row.confrelid
     JOIN pg_namespace referenced_namespace
       ON referenced_namespace.oid = referenced_relation.relnamespace
     JOIN pg_class owner_relation
       ON owner_relation.oid = constraint_row.conrelid
     JOIN pg_namespace owner_namespace
       ON owner_namespace.oid = owner_relation.relnamespace
     WHERE referenced_namespace.nspname = $1
       AND referenced_relation.relname = ANY($2::text[])
       AND NOT (
         owner_namespace.nspname = $1
         AND owner_relation.relname = ANY($2::text[])
       )
       UNION
       SELECT owner_namespace.nspname,
              owner_relation.relname,
              'pg_depend:' || rewrite_rule.rulename
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
       WHERE referenced_namespace.nspname = $1
         AND referenced_relation.relname = ANY($2::text[])
         AND NOT (
           owner_namespace.nspname = $1
           AND owner_relation.relname = ANY($2::text[])
         )
     ) external_dependency
     ORDER BY owner_schema, owner_table, constraint_name`,
    [schema, ROUTING_PERSISTENCE_TABLES],
  );
  const signatureRow = signatureResult.rows[0] ?? {};
  return {
    relations: relationsResult.rows,
    factCount: Number(signatureRow.fact_count ?? 0),
    signature: signatureRow.signature ?? null,
    forbiddenIndexes: forbiddenIndexesResult.rows.map((row) => row.name),
    foreignNamedObjects: foreignNamedObjectsResult.rows,
    externalDependencies: externalDependenciesResult.rows,
  };
}

export function classifyRoutingPersistenceCatalog(snapshot) {
  const expected = new Set(ROUTING_PERSISTENCE_TABLES);
  const presentExpected = snapshot.relations.filter((row) =>
    expected.has(row.name),
  );
  const wrongKinds = presentExpected.filter((row) => row.relkind !== "r");
  const reasons = [];
  let status;

  if (wrongKinds.length > 0 || snapshot.foreignNamedObjects.length > 0) {
    status = "conflict";
    reasons.push("An expected catalog name is owned by an incompatible object.");
  } else if (
    presentExpected.length > 0 &&
    presentExpected.length < ROUTING_PERSISTENCE_TABLES.length
  ) {
    status = "unsafe";
    reasons.push("The routing persistence catalog is only partially present.");
  } else if (
    snapshot.forbiddenIndexes.length > 0 ||
    snapshot.externalDependencies.length > 0
  ) {
    status = "unsafe";
    reasons.push("The routing catalog has forbidden indexes or external dependencies.");
  } else if (presentExpected.length === 0) {
    status = "needed";
  } else if (
    snapshot.factCount === ROUTING_PERSISTENCE_CATALOG_MANIFEST.factCount &&
    snapshot.signature === ROUTING_PERSISTENCE_CATALOG_MANIFEST.signature
  ) {
    status = "applied";
  } else {
    status = "conflict";
    reasons.push("The complete catalog differs from the canonical manifest.");
  }

  return {
    safe: status === "needed" || status === "applied",
    status,
    reasons,
    tableCount: presentExpected.length,
    requiredTableCount: ROUTING_PERSISTENCE_TABLES.length,
    factCount: snapshot.factCount,
    requiredFactCount: ROUTING_PERSISTENCE_CATALOG_MANIFEST.factCount,
    signature: snapshot.signature,
    expectedSignature: ROUTING_PERSISTENCE_CATALOG_MANIFEST.signature,
  };
}
