import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { isBackupV3Import, BACKUP_V3_IMPORT_DISABLED, hasV3OnlyFieldsInV2 } from "../src/application/backups/backup-import-policy";

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

test("V2 documents containing known V3-only fields are identified at their defined paths", () => {
  const rootFields = ["stages", "groups", "stageParticipants", "marvelRounds", "marvelGroups", "marvelGroupEntries", "stageBaskets", "stageBasketRoutes", "deadlockBans", "gamePicks", "routingPlan", "routingExecutions", "qualificationProposals", "routeExecutions"];
  for (const key of rootFields) {
    for (const value of [null, [], {}]) {
      assert.equal(hasV3OnlyFieldsInV2({ schemaVersion: 2, [key]: value }), true, key);
    }
  }
  for (const key of ["basketFlowAuthorityVersion", "activeStageBackupId", "gameConfig"]) {
    assert.equal(hasV3OnlyFieldsInV2({ schemaVersion: 2, tournament: { [key]: null } }), true, key);
  }
  for (const key of ["stageBackupId", "stageGroupBackupId", "routingMatchKey"]) {
    assert.equal(hasV3OnlyFieldsInV2({ schemaVersion: 2, matches: [{ [key]: null }] }), true, key);
  }
  for (const key of ["resultHistory", "actionLog"]) {
    assert.equal(hasV3OnlyFieldsInV2({ schemaVersion: 2, [key]: [{ stageBackupId: null }] }), true, key);
  }
});

test("V2 checks do not recursively inspect unrelated extension or undo payload data", () => {
  assert.equal(hasV3OnlyFieldsInV2({ schemaVersion: 2 }), false);
  assert.equal(hasV3OnlyFieldsInV2({ schemaVersion: 2, metadata: { stages: [] }, players: [{ stageBackupId: 1 }], actionLog: [{ undoPayload: { stages: [], stageBackupId: 3 } }] }), false);
  assert.equal(hasV3OnlyFieldsInV2({ schemaVersion: 2, tournament: null, matches: [null, 4, "text"], resultHistory: {}, actionLog: null }), false);
  assert.equal(hasV3OnlyFieldsInV2({ schemaVersion: 3, stages: [] }), false);
});

test("generated API clients expose both backup import policy errors", () => {
  for (const file of [
    "../../../lib/api-zod/src/generated/types/backupImportErrorCode.ts",
    "../../../lib/api-client-react/src/generated/api.schemas.ts",
  ]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    const codes = source.match(/export const BackupImportErrorCode = \{([\s\S]*?)\} as const;/)?.[1];
    assert.ok(codes, `BackupImportErrorCode missing in ${file}`);
    assert.match(codes, /BACKUP_V3_IMPORT_DISABLED:\s*['"]BACKUP_V3_IMPORT_DISABLED['"]/);
    assert.match(codes, /BACKUP_V2_CONTAINS_V3_FIELDS:\s*['"]BACKUP_V2_CONTAINS_V3_FIELDS['"]/);
  }
});
