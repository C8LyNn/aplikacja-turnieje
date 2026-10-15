-- WEB-005 / A20 / R23C | PG16 CATALOG PRECHECK -- AUTHORING ONLY, NEVER EXECUTED.
-- Scope: system catalog + migration object metadata only. NOT proof of historical SQL execution.
-- Precondition: independent A00 owner-signed disposable PG16 identity, read-only observer
-- and named schema. No shared/prod/staging connection, no app data, no unapproved proxy.
-- Suggested future run: owner-only psql -X -W -1 -v ON_ERROR_STOP=1
--   -v schema=tm_test_r23c_... -h OWNER_HOST -p OWNER_PORT -U OBSERVER -d OWNER_DB -f FILE
-- Owner configures default_transaction_read_only=on, timeouts and least privilege out of band.
-- Redact host/IP/role and catalog details in evidence. Do not treat SELECT result as physical isolation.

-- Q01: identity and major-version comparison to independent owner's attestation.
SELECT current_database() AS db_name, session_user AS login_role,
       current_user AS effective_role, current_setting('server_version_num')::integer AS version_num,
       inet_server_addr()::text AS server_ip, inet_server_port() AS server_port,
       current_setting('search_path') AS search_path, pg_is_in_recovery() AS replica;

-- Q02: read-only observer must lack elevated flags and DB CREATE privilege.
SELECT rolname, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole,
       rolreplication, rolbypassrls,
       has_database_privilege(session_user,current_database(),'CREATE') AS can_create_db
FROM pg_catalog.pg_roles WHERE rolname=session_user;

-- Q03: required named schema and its observer CREATE privilege.
SELECT n.nspname, pg_catalog.pg_get_userbyid(n.nspowner) AS owner_role,
       has_schema_privilege(session_user,n.oid,'USAGE') AS can_use_schema,
       has_schema_privilege(session_user,n.oid,'CREATE') AS can_create_schema
FROM pg_catalog.pg_namespace n WHERE n.nspname=:'schema';

-- Q04: ledger existence only and separately authorized ledger SELECT permission.
SELECT pg_catalog.to_regclass(pg_catalog.format('%I.app_schema_migrations',:'schema'))::text AS legacy_ledger,
       pg_catalog.to_regclass(pg_catalog.format('%I.app_schema_migration_receipts_v2',:'schema'))::text AS additional_receipts,
       has_table_privilege(session_user,
         pg_catalog.to_regclass(pg_catalog.format('%I.app_schema_migrations',:'schema')),
         'SELECT') AS ledger_select_permission;

-- Q05: relation/object inventory, including catalog and correction artefacts.
SELECT c.relname,c.relkind,c.relpersistence,pg_catalog.pg_get_userbyid(c.relowner) AS owner_role
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname=:'schema' AND c.relkind IN ('r','p','v','m','S')
ORDER BY c.relname;

-- Q06: columns, defaults, types and nullability (including match and basket revisions).
SELECT c.relname AS table_name,a.attnum,a.attname,
       pg_catalog.format_type(a.atttypid,a.atttypmod) AS data_type,
       a.attnotnull,pg_catalog.pg_get_expr(def.adbin,def.adrelid) AS default_expression
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid
LEFT JOIN pg_catalog.pg_attrdef def ON def.adrelid=a.attrelid AND def.adnum=a.attnum
WHERE n.nspname=:'schema' AND c.relkind IN ('r','p')
  AND a.attnum>0 AND NOT a.attisdropped
ORDER BY c.relname,a.attnum;

-- Q07: FK/UNIQUE/CHECK constraints and validated flag.
SELECT c.relname AS table_name,co.conname,co.contype,co.convalidated,
       pg_catalog.pg_get_constraintdef(co.oid,true) AS definition
FROM pg_catalog.pg_constraint co
JOIN pg_catalog.pg_class c ON c.oid=co.conrelid
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname=:'schema'
ORDER BY c.relname,co.conname;

-- Q08: index signatures and validity, important for editor 0030/0031 and later.
SELECT c.relname AS table_name,idx.relname AS index_name,
       i.indisunique,i.indisvalid,i.indisready,
       pg_catalog.pg_get_indexdef(i.indexrelid) AS definition
FROM pg_catalog.pg_index i
JOIN pg_catalog.pg_class c ON c.oid=i.indrelid
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
JOIN pg_catalog.pg_class idx ON idx.oid=i.indexrelid
WHERE n.nspname=:'schema'
ORDER BY c.relname,idx.relname;

-- Q09: enabled trigger signatures to distinguish 0027 compat and 0028 match CAS.
SELECT c.relname AS table_name,t.tgname,t.tgenabled,
       t.tgfoid::regprocedure::text AS function_signature,
       pg_catalog.pg_get_triggerdef(t.oid,true) AS definition
FROM pg_catalog.pg_trigger t
JOIN pg_catalog.pg_class c ON c.oid=t.tgrelid
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname=:'schema' AND NOT t.tgisinternal
ORDER BY c.relname,t.tgname;

-- Q10: known function signatures and MD5 of definition; not a raw migration checksum.
SELECT p.proname,pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments,
       p.provolatile,p.prosecdef,p.proleakproof,
       md5(pg_catalog.pg_get_functiondef(p.oid)) AS function_definition_md5
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname=:'schema'
  AND p.proname IN (
    'increment_match_revision','compat_sync_single_stage_participant',
    'compat_resequence_single_stage_participants',
    'validate_tournament_stage_participant_flow')
ORDER BY p.proname,p.oid;

-- Q11: trigger-to-relation dependency edges (non-exhaustive runtime lock graph).
SELECT c.relname AS relation_name,t.tgname,p.proname AS trigger_function,
       d.deptype,refc.relname AS referenced_relation
FROM pg_catalog.pg_trigger t
JOIN pg_catalog.pg_class c ON c.oid=t.tgrelid
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
JOIN pg_catalog.pg_proc p ON p.oid=t.tgfoid
LEFT JOIN pg_catalog.pg_depend d ON d.classid='pg_catalog.pg_trigger'::regclass
  AND d.objid=t.oid AND d.refclassid='pg_catalog.pg_class'::regclass
LEFT JOIN pg_catalog.pg_class refc ON refc.oid=d.refobjid
WHERE n.nspname=:'schema' AND NOT t.tgisinternal
ORDER BY c.relname,t.tgname,refc.relname;

-- Q12: relevant installed extensions.
SELECT extname,extversion FROM pg_catalog.pg_extension
WHERE extname IN ('plpgsql','pg_trgm') ORDER BY extname;
