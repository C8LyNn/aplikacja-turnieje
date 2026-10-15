-- WEB-005 / A20 / R23C -- OPTIONAL LEGACY MIGRATION LEDGER READ (NOT EXECUTED).
-- IMPORTANT: separate Phase B, only after Phase A system catalog confirms:
-- 1) physically certified disposable PG16 + owner-signed read-only target authorization,
-- 2) the specified schema and relation actually exist,
-- 3) observer has explicit SELECT on ONLY this migration metadata ledger,
-- 4) exactly the five expected columns are present.
-- DO NOT execute if relation is absent, shared/prod, schema mismatch, or any permission failure.
-- Schema variable is safely injected as a quoted identifier by psql :"schema".
-- Same psql identity+timeout+default_transaction_read_only controls as catalog preflight.
-- Entries are UNATTESTED historical claims, NOT verified SQL-content execution.
-- DO NOT publish target details, sensitive commit history or role names unredacted.

-- L01: raw declared migration receipts. Human must compare to approved source+runner bytes.
SELECT migration_key,applied_at,app_commit,target_schema,deployment_environment
FROM :"schema".app_schema_migrations
ORDER BY applied_at,migration_key;

-- L02: catch repeated apparent four-digit prefixes despite distinct primary keys.
-- A repeated prefix is NOT automatically duplicate SQL: release/editor collisions exist.
SELECT substring(migration_key FROM '^[0-9]{4}') AS apparent_numeric_prefix,
       count(*) AS receipt_count,
       array_agg(migration_key ORDER BY migration_key) AS receipts
FROM :"schema".app_schema_migrations
GROUP BY substring(migration_key FROM '^[0-9]{4}')
HAVING count(*)>1
ORDER BY apparent_numeric_prefix NULLS LAST;

-- L03: compare declared schema/environment to owner-certified target fingerprint.
SELECT target_schema,deployment_environment,count(*) AS receipt_count,
       min(applied_at) AS oldest_claim,max(applied_at) AS newest_claim
FROM :"schema".app_schema_migrations
GROUP BY target_schema,deployment_environment
ORDER BY target_schema,deployment_environment;
