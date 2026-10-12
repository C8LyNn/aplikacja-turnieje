-- PostgreSQL 16. One-time ownership handoff for the REPLIT -> NEON TEST COPY.
-- IMPORTANT: Execute ONLY after the Neon API has temporarily set the
-- TEST DATABASE owner to the source-import transfer role.
-- NEVER run against the production Replit connection.
-- Tested on qa-owner-handoff-20261012, then applied on Neon main copy.
-- AFTER this DO statement succeeds (or fails), set the database owner BACK
-- to tournament_manager_owner using the Neon API.
-- Do NOT include DROP, DELETE, TRUNCATE, or the source database credentials.
DO $owner_handoff$
DECLARE obj record;
BEGIN
  IF current_database() <> 'tournament_manager' OR
     current_user <> 'transfer_20261012b' OR
     NOT pg_has_role(current_user, 'pg_database_owner', 'MEMBER') OR
     (SELECT count(*) FROM information_schema.tables
      WHERE table_schema IN ('public', '_system') AND table_type = 'BASE TABLE') <> 46
  THEN
    RAISE EXCEPTION 'Neon ownership handoff preconditions failed';
  END IF;

  -- pg_database_owner follows the DATABASE owner without hardcoding a
  -- privileged password into application/CI configuration.
  FOR obj IN
    SELECT nspname FROM pg_namespace
    WHERE nspname = '_system' AND pg_get_userbyid(nspowner) = current_user
  LOOP
    EXECUTE format('ALTER SCHEMA %I OWNER TO pg_database_owner', obj.nspname);
  END LOOP;

  FOR obj IN
    SELECT n.nspname, t.typname
    FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typtype IN ('e','d') AND n.nspname IN ('public','_system')
      AND pg_get_userbyid(t.typowner) = current_user
  LOOP
    EXECUTE format('ALTER TYPE %I.%I OWNER TO pg_database_owner', obj.nspname, obj.typname);
  END LOOP;

  FOR obj IN
    SELECT n.nspname, c.relname
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r','p') AND n.nspname IN ('public','_system')
      AND pg_get_userbyid(c.relowner) = current_user
  LOOP
    EXECUTE format('ALTER TABLE %I.%I OWNER TO pg_database_owner', obj.nspname, obj.relname);
  END LOOP;

  FOR obj IN
    SELECT n.nspname, c.relname
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S' AND n.nspname IN ('public','_system')
      AND pg_get_userbyid(c.relowner) = current_user
  LOOP
    EXECUTE format('ALTER SEQUENCE %I.%I OWNER TO pg_database_owner', obj.nspname, obj.relname);
  END LOOP;

  FOR obj IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prokind='f' AND n.nspname IN ('public','_system')
      AND pg_get_userbyid(p.proowner) = current_user
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) OWNER TO pg_database_owner',
                   obj.nspname, obj.proname, obj.args);
  END LOOP;
END
$owner_handoff$;

-- Validation after database owner is restored to tournament_manager_owner:
--   SELECT current_user, pg_get_userbyid(datdba)
--   FROM pg_database WHERE datname=current_database();
--   SELECT count(*) FROM pg_class c
--   JOIN pg_namespace n ON n.oid=c.relnamespace
--   WHERE n.nspname IN ('public','_system')
--     AND c.relkind IN ('r','p','S','i','t')
--     AND pg_get_userbyid(c.relowner)='transfer_20261012b';
-- The ownership count above must be ZERO.
