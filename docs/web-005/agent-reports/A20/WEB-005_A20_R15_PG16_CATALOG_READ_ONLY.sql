-- WEB-005 / A20 / R15.1 — PG16 NONMUTATING CATALOG PRECHECK
-- AUTHORING ONLY. NOT EXECUTED. A50 may execute ONLY AFTER owner/HQ permits an
-- independently verified, physically dedicated disposable PG16 test database.
-- Use psql -X -v ON_ERROR_STOP=1 -v schema=tm_test_... -f this_file.sql.
-- Output contains structural metadata, not table row data or credentials.
-- Refuse to continue any feature test if endpoint/role/schema differs from
-- the owner's OUT-OF-BAND certified allowlist. This script CANNOT attest
-- physical isolation merely by itself.
\set ON_ERROR_STOP on
BEGIN READ ONLY;
SET LOCAL statement_timeout = '10s';
SET LOCAL lock_timeout = '2s';

-- Q01: exact PostgreSQL endpoint/database/role identity.
SELECT current_database() AS db_name, session_user AS login_role,
       current_user AS current_role,
       current_setting('server_version_num')::integer AS pg_version_num,
       inet_server_addr()::text AS server_ip, inet_server_port() AS server_port,
       current_setting('search_path') AS search_path,
       pg_is_in_recovery() AS is_replica;

-- Q02: observer role must not hold DDL/privileged capabilities.
SELECT rolname, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole,
       rolreplication, rolbypassrls
FROM pg_roles WHERE rolname = session_user;
SELECT has_database_privilege(session_user, current_database(), 'CREATE') AS can_create_in_db;

-- Q03: schema boundary and CREATE privilege; missing or unauthorized -> STOP.
SELECT n.nspname, pg_get_userbyid(n.nspowner) AS schema_owner,
       has_schema_privilege(session_user, n.oid, 'USAGE') AS can_use_schema,
       has_schema_privilege(session_user, n.oid, 'CREATE') AS can_create_in_schema
FROM pg_namespace n WHERE n.nspname = :'schema';

-- Q04: relations actually present in the approved test schema.
SELECT c.relname, c.relkind, c.relpersistence
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = :'schema' AND c.relkind IN ('r','p','v','m')
ORDER BY c.relname;

-- Q05: columns, data type and NOT NULL; only catalog metadata.
SELECT c.relname AS table_name, a.attnum, a.attname AS column_name,
       format_type(a.atttypid,a.atttypmod) AS data_type, a.attnotnull AS not_null
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE n.nspname = :'schema' AND c.relkind IN ('r','p')
  AND a.attnum > 0 AND NOT a.attisdropped
ORDER BY c.relname, a.attnum;

-- Q06: all PK/FK/UNIQUE/CHECK constraints and validated status.
SELECT c.relname AS table_name, con.conname, con.contype, con.convalidated,
       pg_get_constraintdef(con.oid, true) AS definition
FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = :'schema'
ORDER BY c.relname, con.conname;

-- Q07: index identity and validity (incl. partial/unique indexes).
SELECT c.relname AS table_name, idx.relname AS index_name,
       ix.indisunique, ix.indisvalid, ix.indisready,
       pg_get_indexdef(ix.indexrelid) AS index_definition
FROM pg_index ix JOIN pg_class c ON c.oid = ix.indrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_class idx ON idx.oid = ix.indexrelid
WHERE n.nspname = :'schema'
ORDER BY c.relname, idx.relname;

-- Q08: non-internal trigger fingerprint (match revision / compat sync).
SELECT c.relname AS table_name, t.tgname, t.tgenabled,
       pg_get_triggerdef(t.oid, true) AS trigger_definition
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = :'schema' AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- Q09: relevant functions, arguments and installed extensions.
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS arguments,
       pg_get_functiondef(p.oid) AS source_definition
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = :'schema'
  AND p.proname IN ('compat_sync_single_stage_participant','increment_match_revision')
ORDER BY p.proname, arguments;
SELECT extname, extversion FROM pg_extension
WHERE extname IN ('plpgsql','pg_trgm') ORDER BY extname;

-- Q10: existence only of legacy migration ledger; no rows are read or adopted.
SELECT to_regclass(format('%I.app_schema_migrations', :'schema'))::text AS legacy_ledger,
       to_regclass(format('%I.app_schema_migration_receipts_v2', :'schema'))::text AS proposed_receipt_table;

ROLLBACK;
-- NEVER: DROP/CREATE/ALTER/INSERT/UPDATE/DELETE/TRUNCATE, automated ledger repair,
-- raw user data export, shared DB resets, or future migration GO.
