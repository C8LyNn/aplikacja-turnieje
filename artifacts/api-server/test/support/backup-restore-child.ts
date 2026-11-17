/**
 * Test-only helper: restores a Backup V3 file into a SEPARATE, freshly migrated database
 * (or schema) in its own process, so nothing from the source environment can leak in.
 * Never imported by the application. The HTTP V3 import stays disabled (BACKUP_V3_IMPORT).
 *
 * argv: <backup.json> <out.json>; env: RESTORE_DATABASE_URL, RESTORE_SCHEMA.
 */
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const [backupPath, outPath] = process.argv.slice(2);
const rawUrl = process.env.RESTORE_DATABASE_URL ?? "";
const schema = process.env.RESTORE_SCHEMA ?? "";
const url = new URL(rawUrl);
const databaseName = url.pathname.slice(1);
if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) throw new Error("Restore target must be local.");
if (!databaseName.toLowerCase().includes("test") || databaseName.toLowerCase().includes("prod")) throw new Error("Restore target must be a test database.");
if (!/^tm_test_[a-z0-9_]+$/.test(schema)) throw new Error("Unsafe restore schema.");
url.searchParams.set("options", `-c search_path=${schema}`);
process.env.DATABASE_URL = url.toString();
process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = `restore-${randomUUID()}`;

const db = await import("@workspace/db");
const { resetTestSchema, dropTestSchema } = await import("../test-database");
const { importBackupV3, exportBackupV3 } = await import("../../src/application/backups/backup-v3");
const { hashPassword } = await import("../../src/auth");
type Pool = Parameters<typeof resetTestSchema>[0];
await resetTestSchema(db.pool as unknown as Pool, schema);
try {
  const before = (await db.pool.query("SELECT count(*)::int AS n FROM tournaments")).rows[0].n as number;
  if (before !== 0) throw new Error("Restore target is not empty.");
  const backup = JSON.parse(await readFile(backupPath, "utf8"));
  const restored = await importBackupV3(backup, {
    hostCode: randomUUID().slice(0, 8).toUpperCase(),
    organizerPasswordHash: await hashPassword(`restore-${randomUUID()}`),
    supportPasswordHash: null,
    viewerPasswordHash: null,
  });
  const reExported = await exportBackupV3(restored.tournament.id);
  const sourceRows = (await db.pool.query(
    "SELECT (SELECT count(*)::int FROM tournaments) AS tournaments, (SELECT count(*)::int FROM tournament_teams) AS teams, (SELECT count(*)::int FROM team_members) AS members",
  )).rows[0];
  await writeFile(outPath, JSON.stringify({
    database: databaseName,
    schema,
    restored: { teamsImported: restored.teamsImported, teamMembersImported: restored.teamMembersImported, playersImported: restored.playersImported, matchesImported: restored.matchesImported },
    rows: sourceRows,
    reExported,
  }));
} finally {
  await dropTestSchema(db.pool as unknown as Pool, schema);
  await db.pool.end();
}
