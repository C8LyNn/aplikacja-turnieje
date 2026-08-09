import assert from "node:assert/strict";
import test from "node:test";
import { parseTournamentBackupFile } from "./backup-file";

const validBackupHeader = {
  schemaVersion: 2,
  resultModelVersion: "series_v1",
  rankingPolicy: "match_record_v1",
  exportedAt: "2026-07-15T00:00:00.000Z",
  tournament: { name: "Test" },
  players: [],
  matches: [],
  resultHistory: [],
  actionLog: [],
};

test("frontend accepts a series_v1 Backup v2 file", () => {
  const result = parseTournamentBackupFile(JSON.stringify(validBackupHeader));
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.backup.schemaVersion, 2);
});

test("frontend accepts a series_v1 Backup v3 file", () => {
  const result = parseTournamentBackupFile(JSON.stringify({
    ...validBackupHeader,
    schemaVersion: 3,
    stages: [],
    groups: [],
    stageParticipants: [],
  }));
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.backup.schemaVersion, 3);
});

test("frontend rejects legacy Backup v1 with a clear message", () => {
  for (const legacyVersion of [{ version: "1" }, { schemaVersion: 1 }]) {
    const result = parseTournamentBackupFile(JSON.stringify({
      ...validBackupHeader,
      ...legacyVersion,
    }));
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /legacy backupu v1/i);
  }
});

test("frontend rejects a Backup v2 for a different result model", () => {
  const result = parseTournamentBackupFile(JSON.stringify({
    ...validBackupHeader,
    resultModelVersion: "legacy_points",
  }));
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /series_v1\/match_record_v1/);
});
