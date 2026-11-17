import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";
import { assertContiguousMigrationSequence } from "../scripts/migration-sequence.mjs";
import { SCHEMA_REQUIREMENTS } from "../src/schema-requirements.mjs";

const directory = new URL("../migrations/", import.meta.url);

test("bootstrap accepts the real, growing migration sequence (no fixed count of 40)", async () => {
  const names = assertContiguousMigrationSequence(await readdir(directory));
  assert.ok(names.length >= 43);
  assert.equal(names.at(-1), "0043_league_rules_and_schedule.sql");
  const source = await readFile(new URL("../scripts/bootstrap-isolated-development.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /!== 40|exactly migrations/);
});

test("gaps, duplicates and odd names are refused", () => {
  assert.deepEqual(assertContiguousMigrationSequence(["0002_b.sql", "0001_a.sql", "README.md"]), ["0001_a.sql", "0002_b.sql"]);
  assert.throws(() => assertContiguousMigrationSequence(["0001_a.sql", "0003_c.sql"]), /expected 0002/);
  assert.throws(() => assertContiguousMigrationSequence(["0001_a.sql", "0001_b.sql"]), /expected 0002/);
  assert.throws(() => assertContiguousMigrationSequence(["0001_A b.sql"]), /not supported/);
  assert.throws(() => assertContiguousMigrationSequence([]), /No migrations/);
});

test("every post-baseline migration is covered by the API schema guard", async () => {
  const names = assertContiguousMigrationSequence(await readdir(directory));
  const covered = new Set(SCHEMA_REQUIREMENTS.map((requirement) => requirement.migration));
  for (const name of names.filter((file) => Number(file.slice(0, 4)) > 40)) {
    assert.ok(covered.has(name), `${name} must be listed in src/schema-requirements.mjs`);
  }
});

test("V5 migrations are additive and idempotent by construction", async () => {
  for (const requirement of SCHEMA_REQUIREMENTS) {
    const sql = (await readFile(new URL(requirement.migration, directory), "utf8")).replace(/^--.*$/gm, "");
    assert.doesNotMatch(sql, /\bDROP\s+(TABLE|COLUMN|SCHEMA)\b|\bTRUNCATE\b|\bDELETE\s+FROM\b/i, requirement.migration);
    assert.doesNotMatch(sql, /^\s*(BEGIN|COMMIT)\s*;/im, `${requirement.migration} must not manage its own transaction`);
    for (const statement of sql.match(/\b(CREATE TABLE|CREATE (UNIQUE )?INDEX|ADD COLUMN)\b[^;(]*/gi) ?? []) {
      assert.match(statement, /IF NOT EXISTS/i, `${requirement.migration}: ${statement.trim()}`);
    }
  }
});

test("the API integration-test schema builder replays every post-baseline migration", async () => {
  const names = assertContiguousMigrationSequence(await readdir(directory));
  const helper = await readFile(new URL("../../../artifacts/api-server/test/test-database.ts", import.meta.url), "utf8");
  for (const name of names.filter((file) => Number(file.slice(0, 4)) > 40)) {
    assert.ok(helper.includes(name), `test-database.ts must apply ${name}`);
  }
});
