export const TARGET_SCHEMA = "public";
export const MIGRATION_KEY = "series_v1_clean_cutover";
export const DELETE_CONFIRMATION = "DELETE_ALL_LEGACY_TOURNAMENT_DATA";
export const PRODUCTION_ENVIRONMENT = "production";

// Stable two-key namespace: "TM" / "SV1". The transaction-scoped lock is
// released automatically on COMMIT or ROLLBACK.
export const ADVISORY_LOCK_KEYS = Object.freeze([21581, 5453361]);

export const DOMAIN_TABLES = Object.freeze([
  "auth_audit_log",
  "support_sessions",
  "action_log",
  "result_history",
  "matches",
  "players",
  "tournaments",
]);

export const DOMAIN_TYPES = Object.freeze([
  "match_result_type",
  "match_status",
  "player_status",
  "ranking_policy",
  "result_model_version",
  "tournament_status",
  "tournament_format",
]);

export const DOMAIN_SEQUENCES = Object.freeze([
  "auth_audit_log_id_seq",
  "support_sessions_id_seq",
  "action_log_id_seq",
  "result_history_id_seq",
  "matches_id_seq",
  "players_id_seq",
  "tournaments_id_seq",
]);

export const DOMAIN_INDEXES = Object.freeze([
  "players_tournament_seed_idx",
  "matches_tournament_status_idx",
  "result_history_tournament_recorded_idx",
]);

export const MARKER_TABLE = "app_schema_migrations";

const SAFE_IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

export function quoteIdentifier(identifier) {
  if (!SAFE_IDENTIFIER.test(identifier)) {
    throw new Error(`Unsafe PostgreSQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

export function qualify(identifier, schema = TARGET_SCHEMA) {
  return `${quoteIdentifier(schema)}.${quoteIdentifier(identifier)}`;
}

export function displayName(identifier, schema = TARGET_SCHEMA) {
  return `${schema}.${identifier}`;
}

const QUALIFIED_DOMAIN_TABLES = Object.freeze(
  DOMAIN_TABLES.map((name) => displayName(name)),
);
const QUALIFIED_DOMAIN_TYPES = Object.freeze(
  DOMAIN_TYPES.map((name) => displayName(name)),
);
const QUALIFIED_DOMAIN_SEQUENCES = Object.freeze(
  DOMAIN_SEQUENCES.map((name) => displayName(name)),
);
const QUALIFIED_DOMAIN_INDEXES = Object.freeze(
  DOMAIN_INDEXES.map((name) => displayName(name)),
);

export const RESET_OBJECTS = Object.freeze({
  schema: TARGET_SCHEMA,
  markerTable: displayName(MARKER_TABLE),
  removes: Object.freeze({
    tables: QUALIFIED_DOMAIN_TABLES,
    types: QUALIFIED_DOMAIN_TYPES,
    derivedObjects: "reported from PostgreSQL catalogs before reset",
  }),
  creates: Object.freeze({
    markerTable: displayName(MARKER_TABLE),
    tables: QUALIFIED_DOMAIN_TABLES,
    types: QUALIFIED_DOMAIN_TYPES,
    sequences: QUALIFIED_DOMAIN_SEQUENCES,
    indexes: QUALIFIED_DOMAIN_INDEXES,
  }),
});

export const EXPECTED_MARKER_COLUMNS = Object.freeze([
  "migration_key",
  "applied_at",
  "app_commit",
  "target_schema",
  "deployment_environment",
]);

export const LEGACY_COLUMN_SIGNATURE = Object.freeze({
  tournaments: Object.freeze(["allow_draws"]),
  players: Object.freeze(["wins", "draws", "losses", "points"]),
});

export const SERIES_V1_COLUMN_SIGNATURE = Object.freeze({
  tournaments: Object.freeze([
    "result_model_version",
    "ranking_policy",
    "default_best_of",
  ]),
  matches: Object.freeze(["best_of", "result_type", "result_reason"]),
});

export function assertMigrationMatchesResetPlan(sql) {
  if (/\bDROP\s+(?:TABLE|TYPE)[^;]*\bCASCADE\b/is.test(sql)) {
    throw new Error("The series_v1 migration must not use DROP ... CASCADE.");
  }
  if (/\bDROP\s+(DATABASE|SCHEMA|ROLE|EXTENSION)\b/i.test(sql)) {
    throw new Error("The series_v1 migration contains a forbidden DROP target.");
  }

  for (const name of [...DOMAIN_TABLES, ...DOMAIN_TYPES, ...DOMAIN_SEQUENCES]) {
    const qualified = `public.${name}`;
    if (!sql.includes(qualified)) {
      throw new Error(`The series_v1 migration is missing ${qualified}.`);
    }
  }

  if (!sql.includes(`public.${MARKER_TABLE}`)) {
    throw new Error(`The series_v1 migration is missing public.${MARKER_TABLE}.`);
  }
}
