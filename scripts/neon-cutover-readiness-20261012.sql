-- READ-ONLY: run on the isolated Neon TEST database tournament_manager.
-- Never place connection strings, user rows, audit/session contents or other
-- private data into GitHub Actions logs.
SELECT
  current_database() AS database_name,
  current_user AS connected_role,
  (SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = current_database()) AS database_owner,
  (SELECT count(*) FROM information_schema.tables
     WHERE table_schema IN ('public','_system') AND table_type = 'BASE TABLE') AS table_count,
  (SELECT count(*) FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace
     WHERE n.nspname IN ('public','_system')) AS constraint_count,
  (SELECT count(*) FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace
     WHERE n.nspname IN ('public','_system') AND NOT c.convalidated) AS unvalidated_constraints,
  (SELECT count(*) FROM pg_indexes
     WHERE schemaname IN ('public','_system')) AS index_count,
  (SELECT count(*) FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid
     JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname IN ('public','_system') AND (NOT i.indisvalid OR NOT i.indisready)) AS invalid_indexes,
  (SELECT count(*) FROM pg_sequences
     WHERE schemaname IN ('public','_system')) AS sequence_count,
  (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
     JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname IN ('public','_system') AND NOT t.tgisinternal) AS custom_trigger_count,
  (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
     JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname IN ('public','_system') AND NOT t.tgisinternal AND t.tgenabled='D') AS disabled_custom_triggers,
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname IN ('public','_system') AND c.relkind IN ('r','p')
       AND pg_get_userbyid(c.relowner) = 'pg_database_owner') AS tables_owned_by_db_owner,
  (SELECT count(*) FROM pg_shdepend d WHERE d.refobjid =
     (SELECT oid FROM pg_roles WHERE rolname = 'transfer_20261012b')) AS transfer_role_dependencies,
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname IN ('public','_system') AND c.relkind IN ('r','p') AND c.relrowsecurity) AS rls_enabled_tables;

-- Known clean snapshot (2026-10-12) target:
-- tables=46, constraints=314, unvalidated=0, indexes=125,
-- invalid_indexes=0, sequences=28, custom_triggers=17,
-- disabled_custom_triggers=0, tables_owned_by_db_owner=46,
-- transfer_role_dependencies=0, rls_enabled_tables=0.
-- Total rows across all tables: 5502, verified separately with COUNT(*)
-- from each table. This read-only query does not dump any private rows.
