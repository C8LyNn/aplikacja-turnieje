"""Offline tests for production-safe Neon migration utility."""
import importlib.util
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

FILE = Path(__file__).with_name("neon-private-test-migration.py")
SPEC = importlib.util.spec_from_file_location("safe_neon_migration", FILE)
migration = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(migration)


class MigrationSafetyTests(unittest.TestCase):
    def test_connection_credentials_are_child_environment_only(self):
        uri = "postgresql://transfer_name:a%24b%20c@ep-example.neon.tech:5432/tournament_manager?sslmode=require&channel_binding=require"
        with patch.dict(os.environ, {"PGPASSWORD": "WRONG", "PGHOST": "wrong.example"}, clear=False):
            env, host, database = migration.postgres_environment(uri)
        self.assertEqual(host, "ep-example.neon.tech")
        self.assertEqual(database, "tournament_manager")
        self.assertEqual(env["PGUSER"], "transfer_name")
        self.assertEqual(env["PGPASSWORD"], "a$b c")
        self.assertEqual(env["PGHOST"], "ep-example.neon.tech")
        self.assertEqual(env["PGSSLMODE"], "require")
        self.assertEqual(env["PGCHANNELBINDING"], "require")
        self.assertNotIn("WRONG", str(env))

    def test_reject_invalid_uri(self):
        for uri in [
            "https://example.com", "postgresql://", "postgresql://host/database",
            "postgresql://user@host/", "postgresql://user@host/nested/db",
        ]:
            with self.subTest(uri=uri):
                with self.assertRaises(ValueError):
                    migration.postgres_environment(uri)

    def test_schema_public_is_skipped_but_system_tables_are_retained(self):
        fixture = (
            "; pg_restore toc\n"
            "5; 2615 2200 SCHEMA - public pg_database_owner\n"
            "7; 2615 16390 SCHEMA - _system test_owner\n"
            "17; 1259 16400 TABLE public tournaments test_owner\n"
            "18; 1259 16402 TABLE _system replit_database_migrations_v1 test_owner\n"
            "55; 0 16400 TABLE DATA public tournaments test_owner\n"
        )
        with tempfile.TemporaryDirectory() as d:
            out = Path(d) / "list"
            with patch.object(migration, "command", return_value=fixture):
                migration.restore_list(Path(d) / "source.dump", out, {})
            lines = out.read_text().splitlines()
            self.assertTrue(lines[1].startswith(";5;"))
            self.assertEqual(lines[2], "7; 2615 16390 SCHEMA - _system test_owner")
            self.assertEqual(lines[3], "17; 1259 16400 TABLE public tournaments test_owner")
            self.assertEqual(len(lines), 6)
            self.assertEqual(out.stat().st_mode & 0o777, 0o600)

    def test_count_queries_escape_table_identifiers(self):
        with patch.object(migration, "sql", return_value="public.unusual|9\n_system.log|2") as run:
            counts = migration.row_counts({}, [("public", 'unusual'), ("_system", "log")])
            statement = run.call_args.args[1]
        self.assertEqual(counts, {"public.unusual": 9, "_system.log": 2})
        self.assertIn('FROM "public"."unusual"', statement)
        self.assertIn('FROM "_system"."log"', statement)

    def test_default_mode_requires_both_secrets_and_does_not_run(self):
        with patch.dict(os.environ, {}, clear=True):
            with patch("sys.argv", ["migration"]):
                self.assertEqual(migration.main(), 2)


if __name__ == "__main__":
    unittest.main()
