import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import pg from "pg";
import { DEVELOPMENT_DATABASE_NAME, isTournamentDevelopmentDatabase, resolveDatabaseConnectionString } from "../src/development-database-connection.mjs";

// Manual, development-only bootstrap. Never called by app startup or publishing.
const migrationsDirectory = new URL("../migrations/", import.meta.url);
const stripRunnerBlocks = /^-- migration-runner-strip-begin\r?\n[\s\S]*?^-- migration-runner-strip-end\r?\n?/gm;
const stripTransactionBoundary = /^(?:BEGIN|COMMIT);\r?\n?/gm;

async function main() {
  if (!process.argv.includes("--apply-to-empty-development-database") || !isTournamentDevelopmentDatabase(process.env)) {
    throw new Error("Explicit isolated development bootstrap authorization is required.");
  }
  const appCommit = process.env.APP_COMMIT;
  if (!/^[a-f0-9]{40}$/.test(appCommit ?? "")) throw new Error("Full APP_COMMIT is required.");
  const names = (await readdir(migrationsDirectory)).filter((name) => /^\d{4}_.+\.sql$/.test(name)).sort();
  if (names.length !== 40 || names.some((name, index) => Number(name.slice(0, 4)) !== index + 1)) {
    throw new Error("Expected exactly migrations 0001–0040 in order.");
  }
  const client = new pg.Client({ connectionString: resolveDatabaseConnectionString(process.env) });
  await client.connect();
  try {
    const identity = (await client.query("SELECT current_database() AS db,inet_server_addr() AS address,current_schema() AS schema")).rows[0];
    if (identity.db !== DEVELOPMENT_DATABASE_NAME || identity.address !== null || identity.schema !== "public") {
      throw new Error("Live target is not the verified isolated development database.");
    }
    await client.query("SELECT pg_advisory_lock(2026101301)");
    const tables = (await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public'")).rows;
    const hasLedger = tables.some((row) => row.tablename === "development_migration_ledger");
    if (!hasLedger && tables.length !== 0) throw new Error("Refusing bootstrap of a nonempty database without our ledger.");
    if (!hasLedger) {
      await client.query(`CREATE TABLE public.development_migration_ledger (
        filename text PRIMARY KEY, sha256 text NOT NULL,
        app_commit text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
      )`);
    }
    const applied = new Map((await client.query("SELECT filename,sha256 FROM public.development_migration_ledger")).rows.map((row) => [row.filename, row.sha256]));
    if (!applied.has(names[0]) && tables.some((row) => row.tablename !== "development_migration_ledger")) {
      throw new Error("Refusing the initial destructive migration after other tables appeared.");
    }
    const expectedPrefix = names.slice(0, applied.size);
    if (applied.size > names.length || expectedPrefix.some((name) => !applied.has(name))) {
      throw new Error("Development migration ledger must be a contiguous known prefix.");
    }
    for (const name of names) {
      const raw = await readFile(new URL(name, migrationsDirectory), "utf8");
      const sha = createHash("sha256").update(raw).digest("hex");
      if (applied.has(name)) {
        if (applied.get(name) !== sha) throw new Error("Applied migration checksum mismatch: " + name);
        console.log("VERIFIED " + name);
        continue;
      }
      await client.query("BEGIN");
      try {
        await client.query("SELECT set_config('tournament_manager.expected_database_name',$1,true),set_config('tournament_manager.deployment_environment','development',true),set_config('tournament_manager.app_commit',$2,true)", [DEVELOPMENT_DATABASE_NAME, appCommit]);
        await client.query(raw.replace(stripRunnerBlocks, "").replace(stripTransactionBoundary, ""));
        await client.query("INSERT INTO public.development_migration_ledger(filename,sha256,app_commit) VALUES($1,$2,$3)", [name, sha, appCommit]);
        await client.query("COMMIT");
        console.log("APPLIED " + name);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
    console.log(JSON.stringify({ database: DEVELOPMENT_DATABASE_NAME, migrations: names.length, environment: "development" }));
  } finally {
    await client.end();
  }
}
main().catch((error) => {
  // Do not print connection strings, SQL parameters or driver error objects.
  console.error("DEVELOPMENT_BOOTSTRAP_FAILED: " + (error instanceof Error ? error.message : "unknown error"));
  process.exitCode = 1;
});
