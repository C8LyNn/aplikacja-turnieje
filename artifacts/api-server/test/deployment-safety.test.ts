import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";

const ROOT = new URL("../../../", import.meta.url);

const FORBIDDEN_DATABASE_MUTATIONS = [
  { name: "database CLI", pattern: /\b(?:psql|pg_dump|pg_restore|drizzle-kit)\b/i },
  { name: "migration or reset", pattern: /\b(?:migrat(?:e|ion)|reset)\b/i },
  {
    name: "database package push",
    pattern: /\b(?:db|@workspace\/db)\b[^\n]*\bpush(?:-force)?\b/i,
  },
  {
    name: "SQL mutation",
    pattern: /\b(?:drop|alter|truncate|insert|update|delete|create\s+table)\b/i,
  },
];

function activeShellCommands(source: string): string {
  return source
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+#.*$/, "").trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .join("\n");
}

function assertNoDatabaseMutation(source: string, context: string): void {
  for (const rule of FORBIDDEN_DATABASE_MUTATIONS) {
    assert.equal(
      rule.pattern.test(source),
      false,
      `${context} contains a forbidden ${rule.name} command`,
    );
  }
}

function ordinaryLifecycleScripts(source: string): string {
  const scripts = (JSON.parse(source) as { scripts?: Record<string, unknown> }).scripts ?? {};
  const lifecycleName = /^(?:pre|post)?(?:install|prepare|dev|build|start|serve|preview|deploy|publish|prepublishOnly)$/i;
  return Object.entries(scripts)
    .filter(([name, command]) => lifecycleName.test(name) && typeof command === "string")
    .map(([name, command]) => `${name}: ${command}`)
    .join("\n");
}

describe("Replit deployment safety controls", () => {
  test("post-merge performs no database operation", async () => {
    const source = await readFile(new URL("scripts/post-merge.sh", ROOT), "utf8");
    const commands = activeShellCommands(source);
    assertNoDatabaseMutation(commands, "scripts/post-merge.sh");
    assert.match(commands, /pnpm\s+install\s+--frozen-lockfile/);
  });

  test("ordinary development and production service commands do not reset the database", async () => {
    const serviceConfigurationFiles = [
      ".replit",
      "artifacts/api-server/.replit-artifact/artifact.toml",
      "artifacts/tournament-manager/.replit-artifact/artifact.toml",
    ];
    const packageFiles = [
      "artifacts/api-server/package.json",
      "artifacts/tournament-manager/package.json",
      "package.json",
    ];
    const serviceConfiguration = await Promise.all(
      serviceConfigurationFiles.map((file) => readFile(new URL(file, ROOT), "utf8")),
    );
    const packageLifecycleScripts = (
      await Promise.all(packageFiles.map((file) => readFile(new URL(file, ROOT), "utf8")))
    ).map(ordinaryLifecycleScripts);
    const source = [...serviceConfiguration, ...packageLifecycleScripts].join("\n");
    assertNoDatabaseMutation(source, "ordinary Run/Build/Start/Publish configuration");
  });

  test("the versioned cutover migration uses qualified targets and no DROP CASCADE", async () => {
    const source = await readFile(
      new URL("lib/db/migrations/0001_series_v1_clean_cutover.sql", ROOT),
      "utf8",
    );
    assert.doesNotMatch(source, /\bDROP\s+(?:TABLE|TYPE)[^;]*\bCASCADE\b/is);
    assert.doesNotMatch(source, /\bDROP\s+(?:DATABASE|SCHEMA|ROLE|EXTENSION)\b/i);
    for (const object of [
      "tournaments",
      "players",
      "matches",
      "result_history",
      "action_log",
      "support_sessions",
      "auth_audit_log",
      "tournament_format",
      "tournament_status",
      "result_model_version",
      "ranking_policy",
      "player_status",
      "match_status",
      "match_result_type",
      "app_schema_migrations",
    ]) {
      assert.match(source, new RegExp(`\\bpublic\\.${object}\\b`));
    }
  });
});
