import assert from "node:assert/strict";
import test from "node:test";
import { validateRawBackupBeforeClone } from "../src/application/backups/backup-preclone-adapter";
import type { BackupPreclonePorts } from "../src/application/backups/backup-preclone-adapter";

const stamp = "2026-10-15T12:00:00.000Z";
// Synthetic source-contract fixtures; not authenticated archival files.
function v2(): Record<string, any> {
  return {
    schemaVersion: 2, resultModelVersion: "series_v1", rankingPolicy: "match_record_v1", exportedAt: stamp,
    tournament: { name: "Archive", format: "swiss", status: "completed", visibility: "private_offline", defaultBestOf: 3 },
    players: [{ backupId: 11, name: "One", status: "active" }],
    matches: [{ backupId: 21, round: 1, matchNumber: 1, bestOf: 3, status: "completed",
      resultType: "bye", resultReason: "system_bye", player1BackupId: 11, player2BackupId: null,
      winnerBackupId: 11, score1: null, score2: null, completedAt: stamp }],
    resultHistory: [{ matchBackupId: 21, revision: 1, round: 1, matchNumber: 1, bestOf: 3,
      resultType: "bye", resultReason: "system_bye", player1BackupId: 11, player2BackupId: null,
      winnerBackupId: 11, score1: null, score2: null, completedAt: stamp, recordedAt: stamp }],
    actionLog: [{ actionType: "system_bye_assigned", description: "BYE", matchBackupId: 21,
      canUndo: false, undoPayload: null, isUndone: false, createdAt: stamp }],
  };
}
function v3(): Record<string, any> {
  return {
    schemaVersion: 3, resultModelVersion: "series_v1", rankingPolicy: "match_record_v1", exportedAt: stamp,
    tournament: { name: "Archive", status: "active", visibility: "private_offline", activeStageBackupId: 3 },
    players: [{ backupId: 11, name: "One", status: "active" }],
    stages: [{ backupId: 3, stageKey: "swiss", position: 1, name: "Swiss", format: "swiss",
      status: "active", participantCount: 1, bestOf: 3, rankingPolicy: "swiss_v1",
      qualificationMode: "none", seedingPolicy: "standings_order", version: 1,
      createdAt: stamp, startedAt: stamp }],
    groups: [], stageParticipants: [], matches: [], resultHistory: [], actionLog: [],
  };
}
function strict(): Record<string, any> {
  const doc = v3();
  doc.matches = [{ backupId: 21, stageBackupId: 3, round: 1, matchNumber: 1, bestOf: 3,
    player1BackupId: 11, player2BackupId: null, winnerBackupId: 11, score1: null, score2: null,
    resultType: "bye", resultReason: "system_bye", status: "completed", completedAt: stamp }];
  doc.resultHistory = [{ matchBackupId: 21, stageBackupId: 3, revision: 2, round: 1, matchNumber: 1,
    bestOf: 3, player1BackupId: 11, player2BackupId: null, winnerBackupId: 11, score1: null,
    score2: null, resultType: "bye", resultReason: "system_bye", completedAt: stamp, recordedAt: stamp }];
  doc.actionLog = [{ actionType: "system_bye_assigned", description: "BYE", stageBackupId: 3,
    matchBackupId: 21, canUndo: false, undoPayload: null, isUndone: false, createdAt: stamp }];
  doc.strictPolicy = { profile: "web005.backup-v3.strict.v1", version: 1,
    matchStateRevisions: [{ matchBackupId: 21, stateRevision: 7 }],
    actionOrder: [{ sourceActionIndex: 0, portableActionId: "a1", ordinal: 1 }],
    completionActions: [] };
  return doc;
}
const raw = (value: unknown): string => JSON.stringify(value);
function ports(): BackupPreclonePorts {
  return {
    parseV2: (v) => structuredClone(v), parseV3: (v) => structuredClone(v),
    validateV2: () => {}, validateV3: () => {},
    validateActionLocalV3: () => {},
  };
}
function noAuthority(out: ReturnType<typeof validateRawBackupBeforeClone>): void {
  assert.equal(out.importAuthorized, false);
  assert.equal(out.authenticated, false);
  assert.equal(out.capabilities.historicalUndo, false);
  assert.equal(out.capabilities.historicalRevert, false);
  assert.equal(out.capabilities.historicalCasReplay, false);
  assert.equal(out.capabilities.importAuthorized, false);
  assert.ok(Object.isFrozen(out) && Object.isFrozen(out.profile));
}

test("R23C raw V2: full semantic port runs and legacy stays restricted", () => {
  const called: string[] = [], p = ports();
  p.parseV2 = (v) => { called.push("parseV2"); return structuredClone(v); };
  p.validateV2 = () => { called.push("validateV2"); };
  const out = validateRawBackupBeforeClone(raw(v2()), p);
  assert.equal(out.code, "LEGACY_COMPAT_RESTRICTED");
  assert.equal(out.profile.schemaVersion, 2);
  assert.equal(out.semanticValidated, true);
  assert.deepEqual(called, ["parseV2", "validateV2"]);
  noAuthority(out);
});
test("R23C raw V3: exact-version parser and semantic validator invoked", () => {
  const called: string[] = [], p = ports();
  p.parseV3 = (v) => { called.push("parseV3"); return structuredClone(v); };
  p.validateV3 = () => { called.push("validateV3"); };
  const out = validateRawBackupBeforeClone(raw(v3()), p);
  assert.equal(out.code, "LEGACY_COMPAT_RESTRICTED");
  assert.equal(out.profile.schemaVersion, 3);
  assert.deepEqual(called, ["parseV3", "validateV3"]);
  noAuthority(out);
});
test("R23C valid strict must validate semantic, strict core and action-local then deny lacking attestation", () => {
  const called: string[] = [], p = ports();
  p.validateV3 = () => { called.push("semantic"); };
  p.validateActionLocalV3 = () => { called.push("actionLocal"); };
  const out = validateRawBackupBeforeClone(raw(strict()), p);
  assert.equal(out.code, "STRICT_ATTESTATION_REQUIRED");
  assert.equal(out.profile.status, "STRICT_AUTH_REQUIRED");
  assert.equal(out.semanticValidated, true);
  assert.equal(out.actionLocalValidated, true);
  assert.deepEqual(called, ["semantic", "actionLocal"]);
  noAuthority(out);
});
test("R23C stripped marker with modern sidecars is rejected before Zod parser", () => {
  const x = strict(); delete x.strictPolicy; x.matchStateRevisions = [7];
  const p = ports(); let calls = 0;
  p.parseV3 = (v) => { calls++; return v; };
  const out = validateRawBackupBeforeClone(raw(x), p);
  assert.equal(out.code, "PROFILE_REJECTED");
  assert.equal(calls, 0); noAuthority(out);
});
test("R23C fully stripped marker is never attested legacy or inherited Undo authority", () => {
  const x = strict(); delete x.strictPolicy;
  const out = validateRawBackupBeforeClone(raw(x), ports());
  assert.equal(out.code, "LEGACY_COMPAT_RESTRICTED");
  assert.equal(out.profile.status, "LEGACY_COMPAT_UNATTESTED");
  noAuthority(out);
});
test("R23C Zod-like stripping and wrong post-parse version cause conflict before semantic validation", () => {
  const p = ports(); let called = 0;
  p.parseV3 = (v: any) => { const x = structuredClone(v); delete x.strictPolicy; return x; };
  p.validateV3 = () => { called++; };
  assert.equal(validateRawBackupBeforeClone(raw(strict()), p).code, "PARSED_PROFILE_CONFLICT");
  p.parseV3 = (v: any) => ({ ...v, schemaVersion: 2 });
  assert.equal(validateRawBackupBeforeClone(raw(v3()), p).code, "PARSED_PROFILE_CONFLICT");
  assert.equal(called, 0);
});
test("R23C domain-invalid duplicate V2 round is rejected by mandatory full semantic port", () => {
  const x = v2(); x.matches.push({ ...x.matches[0], backupId: 22 });
  const p = ports();
  p.validateV2 = (v: any) => {
    const keys = new Set<string>();
    for (const m of v.matches) {
      const key = String(m.round) + ":" + String(m.matchNumber);
      if (keys.has(key)) throw new Error("duplicate match");
      keys.add(key);
    }
  };
  assert.equal(validateRawBackupBeforeClone(raw(x), p).code, "SEMANTIC_VALIDATION_FAILED");
});
test("R23C corrupted completed historic BYE denied before semantic parser", () => {
  const x = v2(); delete x.matches[0].completedAt;
  let calls = 0; const p = ports();
  p.validateV2 = () => { calls++; };
  assert.equal(validateRawBackupBeforeClone(raw(x), p).code, "PROFILE_REJECTED");
  assert.equal(calls, 0);
});
test("R23C globally existing but action-local foreign match ID fails A70 closure hook", () => {
  const x = strict();
  x.matches.push({ ...x.matches[0], backupId: 22, matchNumber: 2,
    status: "pending", resultType: null, resultReason: null,
    winnerBackupId: null, score1: null, score2: null, completedAt: null });
  x.strictPolicy.matchStateRevisions.push({ matchBackupId: 22, stateRevision: 1 });
  x.actionLog.push({ actionType: "match_started", description: "wrong local relation",
    stageBackupId: 3, matchBackupId: 21, canUndo: false,
    undoPayload: { type: "restore_status", matchId: 22, prevStatus: "pending" },
    isUndone: false, createdAt: stamp });
  x.strictPolicy.actionOrder.push({ sourceActionIndex: 1, portableActionId: "a2", ordinal: 2 });
  let closure = 0;
  const p = ports(); p.validateActionLocalV3 = (v: any) => {
    closure++;
    for (const action of v.actionLog) {
      if (action.undoPayload?.matchId != null &&
          action.undoPayload.matchId !== action.matchBackupId)
        throw new Error("A70 action-local mismatch");
    }
  };
  const out = validateRawBackupBeforeClone(raw(x), p);
  assert.equal(out.code, "ACTION_LOCAL_CLOSURE_FAILED");
  assert.equal(closure, 1); noAuthority(out);
});
test("R23C missing A70 closure is typed missing dependency for valid strict", () => {
  const p = ports(); delete p.validateActionLocalV3;
  const out = validateRawBackupBeforeClone(raw(strict()), p);
  assert.equal(out.code, "MISSING_DEPENDENCY");
  noAuthority(out);
});
test("R23C no version-specific parser or semantic validator is fail-closed", () => {
  for (const x of [v2(), v3(), strict()]) {
    const out = validateRawBackupBeforeClone(raw(x), {});
    assert.equal(out.code, "MISSING_DEPENDENCY"); noAuthority(out);
  }
  const p = ports(); delete p.validateV3;
  assert.equal(validateRawBackupBeforeClone(raw(strict()), p).code, "MISSING_DEPENDENCY");
});
test("R23C valid-shaped but contradictory strict latest-history timestamp is denied before action-local", () => {
  const x = strict(); x.resultHistory[0].completedAt = "2026-10-15T12:00:01.000Z";
  const p = ports(); let invoked = 0;
  p.validateActionLocalV3 = () => { invoked++; };
  assert.equal(validateRawBackupBeforeClone(raw(x), p).code, "STRICT_POLICY_FAILED");
  assert.equal(invoked, 0);
});
test("R23C forged trust attributes or client-asserted verified port never authorize modern strict", () => {
  for (const attr of ["trusted", "signature", "capabilities", "verified"]) {
    const x = strict(); x[attr] = true;
    assert.equal(validateRawBackupBeforeClone(raw(x), ports()).code, "PROFILE_REJECTED");
  }
  const p = ports(); (p as any).verified = true;
  assert.equal(validateRawBackupBeforeClone(raw(strict()), p).code, "STRICT_ATTESTATION_REQUIRED");
});
test("R23C malformed raw, duplicate JSON keys, parsed JS input rejected", () => {
  const original = raw(v2());
  for (const input of ['{"schemaVersion":2,', original.replace('"schemaVersion":2',
    '"schemaVersion":2,"schemaVersion":3'), v2()]) {
    const out = validateRawBackupBeforeClone(input, ports());
    assert.ok(out.code === "PROFILE_REJECTED" || out.code === "RAW_JSON_REQUIRED");
    noAuthority(out);
  }
});
test("R23C thrown parser, semantic validator and parse-time mutation cannot become validation success", () => {
  const p = ports(); p.parseV2 = () => { throw Error("invalid"); };
  assert.equal(validateRawBackupBeforeClone(raw(v2()), p).code, "PARSER_FAILED");
  const q = ports(); q.validateV2 = () => { throw Error("invalid"); };
  assert.equal(validateRawBackupBeforeClone(raw(v2()), q).code, "SEMANTIC_VALIDATION_FAILED");
  const t = ports(); t.parseV3 = (v: any) => ({ ...v, actionLog: [] });
  assert.equal(validateRawBackupBeforeClone(raw(strict()), t).code, "PARSED_PROFILE_CONFLICT");
});


test("development-first: async V2/V3 semantic validators must never be marked validated", () => {
  const cases: Array<{ backup: Record<string, any>; version: 2 | 3 }> = [
    { backup: v2(), version: 2 }, { backup: v3(), version: 3 },
  ];
  for (const { backup, version } of cases) {
    const p = ports();
    if (version === 2) p.validateV2 = async () => {};
    else p.validateV3 = async () => {};
    const result = validateRawBackupBeforeClone(raw(backup), p);
    assert.equal(result.code, "SEMANTIC_VALIDATION_FAILED");
    assert.equal(result.semanticValidated, false);
    noAuthority(result);
  }
});

test("development-first: Promise-like and unexpected non-void domain validator result are denied", () => {
  for (const value of [Promise.resolve(), { then: (_resolve: () => void) => {} }, false]) {
    const p = ports();
    p.validateV2 = () => value;
    const result = validateRawBackupBeforeClone(raw(v2()), p);
    assert.equal(result.code, "SEMANTIC_VALIDATION_FAILED");
    assert.equal(result.semanticValidated, false);
    noAuthority(result);
  }
});

test("development-first: async action-local closure must never be reported completed", () => {
  const p = ports();
  p.validateActionLocalV3 = async () => {};
  const result = validateRawBackupBeforeClone(raw(strict()), p);
  assert.equal(result.code, "ACTION_LOCAL_CLOSURE_FAILED");
  assert.equal(result.semanticValidated, true);
  assert.equal(result.actionLocalValidated, false);
  noAuthority(result);
});

test("development-first: thenable or false action-local callback cannot bypass closure", () => {
  for (const value of [Promise.resolve(), { then: (_resolve: () => void) => {} }, false]) {
    const p = ports();
    p.validateActionLocalV3 = () => value;
    const result = validateRawBackupBeforeClone(raw(strict()), p);
    assert.equal(result.code, "ACTION_LOCAL_CLOSURE_FAILED");
    assert.equal(result.actionLocalValidated, false);
    noAuthority(result);
  }
});

test("development-first: async versioned parser denied before semantic callback", () => {
  for (const version of [2, 3]) {
    const p = ports();
    if (version === 2) p.parseV2 = async () => v2();
    else p.parseV3 = async () => v3();
    let called = 0;
    p.validateV2 = () => { called++; };
    p.validateV3 = () => { called++; };
    const result = validateRawBackupBeforeClone(raw(version === 2 ? v2() : v3()), p);
    assert.equal(result.code, "PARSER_FAILED");
    assert.equal(called, 0);
    noAuthority(result);
  }
});
