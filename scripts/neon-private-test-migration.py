#!/usr/bin/env python3
"""One-time, private, non-destructive PostgreSQL production -> Neon test copy.

All connection strings are read from process environment (never argv, stdout
or a repository file). pg_dump reads a consistent source snapshot; pg_restore
uses a transaction and refuses any nonempty destination. No app redeploy.
"""
from __future__ import annotations

import argparse
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from urllib.parse import parse_qs, unquote, urlsplit

TABLES_SQL = """SELECT table_schema || E'\\t' || table_name
FROM information_schema.tables
WHERE table_schema IN ('public', '_system') AND table_type='BASE TABLE'
ORDER BY table_schema, table_name"""
COLUMNS_SQL = """SELECT table_schema, table_name, column_name, ordinal_position,
data_type, udt_name, is_nullable, coalesce(column_default,'')
FROM information_schema.columns
WHERE table_schema IN ('public', '_system')
ORDER BY table_schema, table_name, ordinal_position"""
CONSTRAINTS_SQL = """SELECT n.nspname, t.relname, c.conname,
c.contype, pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_class t ON t.oid=c.conrelid
JOIN pg_namespace n ON n.oid=t.relnamespace
WHERE n.nspname IN ('public', '_system')
ORDER BY n.nspname,t.relname,c.conname"""
INDEXES_SQL = """SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes WHERE schemaname IN ('public','_system')
ORDER BY schemaname,tablename,indexname"""
SEQUENCES_SQL = """SELECT schemaname, sequencename
FROM pg_sequences WHERE schemaname IN ('public','_system')
ORDER BY schemaname,sequencename"""


def postgres_environment(raw: str) -> tuple[dict[str, str], str, str]:
    """Parse libpq URI into child-only environment; no credentials in argv."""
    u = urlsplit(raw)
    if u.scheme not in ("postgres", "postgresql") or not u.hostname or not u.username:
        raise ValueError("Expected valid PostgreSQL connection URI")
    db = unquote(u.path.lstrip("/"))
    if not db or "/" in db:
        raise ValueError("Expected exactly one database name in URI")
    query = parse_qs(u.query, keep_blank_values=True)
    allowed = {
        "sslmode": "PGSSLMODE",
        "channel_binding": "PGCHANNELBINDING",
        "sslrootcert": "PGSSLROOTCERT",
        "options": "PGOPTIONS",
        "connect_timeout": "PGCONNECT_TIMEOUT",
    }
    env = os.environ.copy()
    # Avoid accidentally inheriting credentials for the wrong database.
    for item in ["PGPASSWORD", "PGHOST", "PGPORT", "PGUSER", "PGDATABASE",
                 "PGSSLMODE", "PGCHANNELBINDING", "PGSSLROOTCERT",
                 "PGOPTIONS", "PGCONNECT_TIMEOUT", "PGSERVICE", "PGSERVICEFILE"]:
        env.pop(item, None)
    env.update({
        "PGHOST": u.hostname,
        "PGPORT": str(u.port or 5432),
        "PGUSER": unquote(u.username),
        "PGDATABASE": db,
        "PGPASSWORD": unquote(u.password or ""),
        "PGAPPNAME": "neon-private-migration-check",
        "PGCONNECT_TIMEOUT": "15",
    })
    for key, dest in allowed.items():
        if key in query:
            env[dest] = query[key][-1]
    return env, u.hostname, db


def command(argv: list[str], env: dict[str, str], *, stdout_file=None) -> str:
    result = subprocess.run(
        argv, env=env, stdin=subprocess.DEVNULL,
        stdout=stdout_file if stdout_file is not None else subprocess.PIPE,
        stderr=subprocess.PIPE, text=stdout_file is None,
        check=False, timeout=180,
    )
    if result.returncode:
        # Do not echo libpq error output: it may contain private connection
        # details or rows. Only the command's basename is safe to print.
        raise RuntimeError(f"{Path(argv[0]).name} failed (exit {result.returncode}); see protected execution logs")
    return result.stdout if stdout_file is None else ""


def sql(env: dict[str, str], query: str) -> str:
    return command(["psql", "-X", "--no-align", "--tuples-only",
                    "--set", "ON_ERROR_STOP=1", "--command", query], env).strip()


def table_names(env: dict[str, str]) -> list[tuple[str, str]]:
    output = sql(env, TABLES_SQL)
    return [tuple(line.split("\t", 1)) for line in output.splitlines()] if output else []


def quote(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def row_counts(env: dict[str, str], tables: list[tuple[str, str]]) -> dict[str, int]:
    if not tables:
        return {}
    statements = [
        "SELECT " + "'" + (schema + "." + name).replace("'", "''") + "'"
        + " AS name, count(*)::bigint FROM " + quote(schema) + "." + quote(name)
        for schema, name in tables
    ]
    raw = sql(env, " UNION ALL ".join(statements))
    return {name: int(count) for name, count in (line.split("|", 1)
            for line in raw.splitlines())}


def metadata(env: dict[str, str]) -> dict[str, str]:
    return {
        "columns": sql(env, COLUMNS_SQL),
        "constraints": sql(env, CONSTRAINTS_SQL),
        "indexes": sql(env, INDEXES_SQL),
        "sequences": sql(env, SEQUENCES_SQL),
    }


def restore_list(dump: Path, output: Path, env: dict[str, str]) -> None:
    listing = command(["pg_restore", "--list", str(dump)], env)
    public_schema = re.compile(r"^\s*\d+;\s+\d+\s+\d+\s+SCHEMA\s+-\s+public\s")
    public_comment = re.compile(r"^\s*\d+;\s+\d+\s+\d+\s+COMMENT\s+-\s+SCHEMA\s+public\s")
    lines = []
    for line in listing.splitlines(keepends=True):
        # Neon provides public and owns it via pg_database_owner. Even with
        # --no-owner the source's COMMENT ON SCHEMA public would require
        # ownership and abort the whole transactional restore. Keep both
        # entries out, while retaining ALL source tables and their data.
        skip = public_schema.match(line) or public_comment.match(line)
        lines.append(";" + line if skip else line)
    output.write_text("".join(lines))
    output.chmod(0o600)


def main() -> int:
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument("--apply", action="store_true", help="Copy into EMPTY Neon test database")
    parsed = args.parse_args()
    source_uri = os.environ.get("PRODUCTION_DATABASE_URL")
    dest_uri = os.environ.get("NEON_MIGRATION_DATABASE_URL")
    if not source_uri or not dest_uri:
        print("Missing PRODUCTION_DATABASE_URL or NEON_MIGRATION_DATABASE_URL in environment.")
        return 2
    try:
        src, src_host, src_db = postgres_environment(source_uri)
        dst, dst_host, dst_db = postgres_environment(dest_uri)
        if src_host == dst_host or not dst_host.endswith(".neon.tech"):
            raise RuntimeError("Destination is not a separate Neon PostgreSQL host")
        if dst_db != "tournament_manager":
            raise RuntimeError("Unexpected Neon database name; aborting")
        if not dst["PGUSER"].startswith("transfer_"):
            raise RuntimeError("Use a temporary transfer_ PostgreSQL role, not a long-lived owner")
        for tool in ("psql", "pg_dump", "pg_restore"):
            if not shutil.which(tool):
                raise RuntimeError(f"Missing executable: {tool}")
        for label, env in (("source", src), ("Neon", dst)):
            version = int(sql(env, "SHOW server_version_num"))
            if version < 160000 or version >= 170000:
                raise RuntimeError(f"Unexpected {label} PostgreSQL major version")
        from_tables = table_names(src)
        to_tables = table_names(dst)
        if not from_tables:
            raise RuntimeError("Source database has no expected application tables")
        if to_tables:
            raise RuntimeError("Destination has application tables; refusing to overwrite it")
        before = row_counts(src, from_tables)
        print(f"Source verified: {len(from_tables)} tables; {sum(before.values())} records.")
        print(f"Neon verified: {len(to_tables)} tables. No source modifications.")
        if not parsed.apply:
            print("DRY RUN: no dump or restore. Use --apply only after review.")
            return 0

        with tempfile.TemporaryDirectory(prefix="private-neon-copy-") as tmp:
            dump, listfile = Path(tmp) / "snapshot.dump", Path(tmp) / "restore.list"
            dump.touch(mode=0o600)
            dump.chmod(0o600)
            # pg_dump itself opens the file: all bytes remain private in tempdir.
            command(["pg_dump", "--format=custom", "--file", str(dump)], src)
            if dump.stat().st_size < 100:
                raise RuntimeError("Unexpected empty PostgreSQL dump")
            restore_list(dump, listfile, dst)
            command(["pg_restore", "--no-owner", "--no-acl", "--single-transaction",
                     "--exit-on-error", "--use-list", str(listfile),
                     "--dbname", dst_db, str(dump)], dst)
            # tempfile deletes the dump after verification, even on failure.

        restored = table_names(dst)
        after = row_counts(dst, restored)
        source_now = row_counts(src, from_tables)
        expected = set(from_tables)
        got = set(restored)
        mismatches = sorted(name for name in (before.keys() | after.keys())
                            if before.get(name) != after.get(name))
        schema_src, schema_dst = metadata(src), metadata(dst)
        unequal = [key for key in schema_src if schema_src[key] != schema_dst[key]]
        print(f"Neon after restore: {len(restored)} tables; {sum(after.values())} records.")
        print(f"Table identity matched: {expected == got}")
        print(f"Row counts matched: {not mismatches}")
        if mismatches:
            print("Row-count mismatches (table names only): " + ", ".join(mismatches))
        if unequal:
            print("Schema metadata differences: " + ", ".join(unequal))
        if before != source_now:
            print("Source changed during transfer; a new consistent comparison is needed.")
        if expected != got or mismatches or unequal or before != source_now:
            print("NOT VERIFIED: do not connect application or promote this database.")
            return 1
        print("VERIFIED TEST COPY. Production application was NOT switched.")
        return 0
    except (RuntimeError, ValueError, subprocess.TimeoutExpired, OSError) as error:
        message = str(error)
        # Exception messages here are authored by this script; never dump the
        # raw connection strings or database CLI output.
        print(f"Migration stopped safely: {message}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
