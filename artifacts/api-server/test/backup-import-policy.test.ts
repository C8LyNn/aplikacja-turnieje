import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { isBackupV3Import, BACKUP_V3_IMPORT_DISABLED } from "../src/application/backups/backup-import-policy";

test("V3 import is denied without a feature-flag bypass; V2 is unaffected", () => {
  for (const version of [3, "3"]) {
    assert.ok(isBackupV3Import({ schemaVersion: version }));
    assert.ok(isBackupV3Import({ version }));
  }
  assert.equal(isBackupV3Import({ schemaVersion: 2 }), false);
  assert.equal(BACKUP_V3_IMPORT_DISABLED.code, "BACKUP_V3_IMPORT_DISABLED");
});

test("HTTP V3 denial occurs before any import call or credential hashing", () => {
  const source = readFileSync(new URL("../src/routes/tournaments.ts", import.meta.url), "utf8");
  const route = source.slice(source.indexOf('router.post("/tournaments/import"'));
  const guard = route.indexOf("if (isBackupV3Import(rawBackup))");
  assert.ok(guard > 0);
  assert.ok(guard < route.indexOf("await hashPassword("));
  assert.ok(guard < route.indexOf("await importBackupV3("));
  assert.match(route.slice(guard, guard + 135), /status\(422\)[\s\S]*return;/);
});
