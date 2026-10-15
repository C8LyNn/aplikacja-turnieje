/**
 * WEB-005 / A30 R23C. SYNTHETIC, NON-PRODUCTION SECURITY FIXTURES.
 * No private keys, authentic tokens or external tenant identifiers.
 * Data is deliberately small so failures target ingress invariants, not quotas.
 */
export const NOW = "2026-10-15T09:00:00.000Z";
export const SOURCE_MATCH = 21;
export const SECOND_MATCH = 22;
export const SOURCE_STAGE = 3;

export const deepCopy = (x) => structuredClone(x);

export function legacyV3() {
  return {
    schemaVersion: 3, resultModelVersion: "series_v1",
    rankingPolicy: "match_record_v1", exportedAt: NOW,
    tournament: {
      name: "Synthetic archived v3", status: "active",
      visibility: "private_offline", activeStageBackupId: SOURCE_STAGE,
    },
    players: [
      { backupId: 11, name: "A", status: "active" },
      { backupId: 12, name: "B", status: "active" },
    ],
    stages: [{
      backupId: SOURCE_STAGE, stageKey: "swiss", position: 1,
      name: "Swiss", format: "swiss", status: "active",
      participantCount: 2, bestOf: 3, rankingPolicy: "swiss_v1",
      qualificationMode: "none", seedingPolicy: "standings_order",
      version: 1, createdAt: NOW, startedAt: NOW,
    }],
    groups: [],
    stageParticipants: [
      { backupId: 101, stageBackupId: SOURCE_STAGE, playerBackupId: 11,
        status: "active", stageSeed: 1, qualificationSource: "registration", createdAt: NOW },
      { backupId: 102, stageBackupId: SOURCE_STAGE, playerBackupId: 12,
        status: "active", stageSeed: 2, qualificationSource: "registration", createdAt: NOW },
    ],
    matches: [], resultHistory: [], actionLog: [],
  };
}

export function legacyV2() {
  return {
    schemaVersion: 2, resultModelVersion: "series_v1",
    rankingPolicy: "match_record_v1", exportedAt: NOW,
    tournament: {
      name: "Synthetic archived v2", format: "swiss", status: "active",
      visibility: "private_offline", defaultBestOf: 3,
    },
    players: [{ backupId: 11, name: "A", status: "active" }],
    matches: [], resultHistory: [], actionLog: [],
  };
}

export function strictBackup() {
  const x = legacyV3();
  x.tournament.name = "Synthetic strict completed + pending";
  x.matches = [
    { backupId: SOURCE_MATCH, stageBackupId: SOURCE_STAGE,
      round: 1, matchNumber: 1, status: "completed", resultType: "played",
      resultReason: null, player1BackupId: 11, player2BackupId: 12,
      winnerBackupId: 11, score1: 2, score2: 0, bestOf: 3, completedAt: NOW },
    { backupId: SECOND_MATCH, stageBackupId: SOURCE_STAGE,
      round: 2, matchNumber: 1, status: "pending", resultType: null,
      resultReason: null, player1BackupId: 11, player2BackupId: 12,
      winnerBackupId: null, score1: null, score2: null, bestOf: 3, completedAt: null },
  ];
  x.resultHistory = [{
    matchBackupId: SOURCE_MATCH, stageBackupId: SOURCE_STAGE, revision: 2,
    round: 1, matchNumber: 1, player1BackupId: 11, player2BackupId: 12,
    winnerBackupId: 11, score1: 2, score2: 0, bestOf: 3,
    resultType: "played", resultReason: null, completedAt: NOW, recordedAt: NOW,
  }];
  x.actionLog = [{
    actionType: "match_result_submitted", description: "Synthetic manual completion",
    stageBackupId: SOURCE_STAGE, matchBackupId: SOURCE_MATCH,
    canUndo: true, undoPayload: { matchId: SOURCE_MATCH, winnerId: 11 },
    isUndone: false, createdAt: NOW,
  }];
  x.strictPolicy = {
    profile: "web005.backup-v3.strict.v1", version: 1,
    matchStateRevisions: [
      { matchBackupId: SOURCE_MATCH, stateRevision: 7 },
      { matchBackupId: SECOND_MATCH, stateRevision: 1 },
    ],
    actionOrder: [{ sourceActionIndex: 0, portableActionId: "act-01", ordinal: 1 }],
    completionActions: [{
      sourceActionIndex: 0, matchBackupId: SOURCE_MATCH,
      historyRevision: 2, active: true,
    }],
  };
  return x;
}

/** Envelope v1 draft. INVALID illustrative signature, not a signing helper. */
export function untrustedStrictEnvelope(backup = strictBackup()) {
  return {
    envelopeVersion: 1, profile: "web005.backup-v3.strict.v1",
    issuerId: "test-only-unknown-issuer", keyId: "test-only-unknown-kid",
    algorithm: "Ed25519", issuedAt: NOW,
    payloadDigestAlgorithm: "SHA-256", payloadDigest: "00".repeat(32),
    signature: "not-a-valid-ed25519-signature",
    backup,
  };
}

/** The HTTP wrapper uses fresh test credentials; all literals are synthetic. */
export function requestWith(backup) {
  return { backup, organizerPassword: "Synthetic!Only2026", viewerPassword: "Viewer!Only2026" };
}

/**
 * Use this for action-local mismatch only: both IDs exist in source.
 * Membership-only ID validators can miss the forged relationship.
 */
export function mismatchedActionTarget() {
  const x = strictBackup();
  x.actionLog[0].undoPayload.matchId = SECOND_MATCH;
  return x;
}

/** Legacy data with malicious old Undo capability must never gain authority. */
export function untrustedLegacyUndo() {
  const x = legacyV3();
  x.actionLog = [{
    actionType: "match_result_submitted", description: "Untrusted historic Undo",
    stageBackupId: SOURCE_STAGE, matchBackupId: null,
    canUndo: true, undoPayload: { matchId: 999_999, winnerId: 999_999 },
    isUndone: false, createdAt: NOW,
  }];
  return x;
}

/**
 * Scenarios are a versioned data manifest consumed by the contract suites.
 * HTTP/PG expectations are specified in the adjacent acceptance document.
 */
export const CORPUS_VERSION = "web005.a30.backup_ingress_security.corpus.v1";
export const CASE_IDS = Object.freeze([
  "BI-01-STRIP", "BI-02-UNKNOWN-ISSUER", "BI-03-BAD-SIGNATURE",
  "BI-04-PROFILE-CONFUSION", "BI-05-ZOD-STRIP",
  "BI-06-LEGACY-UNDO", "BI-07-FOREIGN-ID",
  "BI-08-ACTION-LOCAL", "BI-09-PRECLONE-WRITES",
  "BI-10-LEGACY-V2", "BI-11-LEGACY-V3", "BI-12-SIGNED-POSITIVE",
  "BI-13-LATE-ROLLBACK", "BI-14-RESTORE-AUTH",
  "BI-15-PRIVATE-VIEWER", "BI-16-CLONE-ISOLATION",
]);
