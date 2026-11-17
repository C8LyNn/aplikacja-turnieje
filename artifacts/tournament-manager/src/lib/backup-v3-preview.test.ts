import assert from "node:assert/strict";
import { test } from "node:test";
import { inspectBackupV3 } from "./backup-v3-preview";

function backup(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 3, resultModelVersion: "series_v1", rankingPolicy: "match_record_v1", exportedAt: "2026-11-17T10:00:00.000Z",
    tournament: { name: "Liga drużyn", status: "completed", participantType: "teams", teamRosterMin: 1, teamRosterMax: 3 },
    players: [{ backupId: 1, name: "Lwy" }, { backupId: 2, name: "Wilki" }],
    stages: [{ backupId: 10, name: "Etap 1" }],
    matches: [{ backupId: 100, stageBackupId: 10, player1BackupId: 1, player2BackupId: 2, winnerBackupId: 1, status: "completed" }],
    resultHistory: [{ round: 1 }], actionLog: [],
    teamRosters: { formatVersion: 1, teams: [{ backupId: 5, playerBackupId: 1, members: [
      { name: "Kuba", role: "captain", leftAt: null }, { name: "Piotr", role: "reserve", leftAt: "2026-11-17T11:00:00.000Z" },
    ] }] },
    ...overrides,
  };
}

test("V5.2: a complete V3 team backup is summarised without problems", () => {
  const preview = inspectBackupV3(JSON.stringify(backup()));
  assert.ok(preview);
  assert.equal(preview.name, "Liga drużyn");
  assert.equal(preview.participantType, "teams");
  assert.deepEqual(preview.matches, { total: 1, completed: 1 });
  assert.deepEqual(preview.teams, { count: 1, activeMembers: 1, historyEntries: 2 });
  assert.deepEqual(preview.problems, []);
});

test("V5.2: broken references, missing rosters and credentials are reported", () => {
  const broken = backup({ matches: [{ backupId: 100, stageBackupId: 99, player1BackupId: 1, player2BackupId: 7, status: "completed" }] });
  assert.match(inspectBackupV3(JSON.stringify(broken))!.problems.join(" "), /nieistniejących uczestników lub etapy: 1/);
  const { teamRosters: _drop, ...noRosters } = backup();
  assert.match(inspectBackupV3(JSON.stringify(noRosters))!.problems.join(" "), /bez sekcji składów/);
  const leaked = backup({ tournament: { name: "X", organizerPasswordHash: "abc" } });
  assert.match(inspectBackupV3(JSON.stringify(leaked))!.problems.join(" "), /organizerPasswordHash/);
});

test("V5.2: non-V3 text is left to the existing parser", () => {
  assert.equal(inspectBackupV3("nie json"), null);
  assert.equal(inspectBackupV3(JSON.stringify({ schemaVersion: 2 })), null);
});
