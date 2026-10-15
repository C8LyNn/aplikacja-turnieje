/**
 * WEB-005 / R23A — pure, RAW-data Backup V2/V3 profile preflight.
 *
 * This module is NOT connected to HTTP, Zod, export or import. A positive
 * historical producer SHAPE is NOT proof of issuer, age or authenticity.
 * No output from this module grants import, historical Undo, Revert or CAS.
 * A byte-identical stripped modern backup cannot be distinguished from
 * unsigned historic data without external trusted provenance.
 */
export const PROFILE_GATE_LIMITS = Object.freeze({
  maxJsonChars: 1_048_576,
  maxDepth: 32,
  maxNodes: 25_000,
  maxArrayItems: 5_000,
  maxObjectKeys: 128,
});

export type BackupProfileStatus =
  | "LEGACY_COMPAT_UNATTESTED"
  | "STRICT_AUTH_REQUIRED"
  | "REJECT";

export type BackupProfileReason =
  | "POSITIVE_HISTORICAL_SHAPE_ONLY"
  | "STRICT_MARKER_UNAUTHENTICATED"
  | "MALFORMED_JSON"
  | "DUPLICATE_JSON_KEY"
  | "INPUT_LIMIT_EXCEEDED"
  | "UNSUPPORTED_PROFILE"
  | "VERSION_OR_SCHEMA_CONFLICT"
  | "UNKNOWN_OR_HYBRID_STRUCTURE"
  | "CRITICAL_FIELD_INVALID";

export type BackupProfilePreflight = Readonly<{
  status: BackupProfileStatus;
  reason: BackupProfileReason;
  schemaVersion: 2 | 3 | null;
  authenticated: false;
  /** Restriction flags, NEVER authority tokens. */
  capabilities: Readonly<{
    importAuthorized: false;
    historicalUndo: false;
    historicalRevert: false;
    historicalCasReplay: false;
  }>;
}>;

const DISABLED = Object.freeze({
  importAuthorized: false,
  historicalUndo: false,
  historicalRevert: false,
  historicalCasReplay: false,
} as const);

function outcome(
  status: BackupProfileStatus,
  reason: BackupProfileReason,
  schemaVersion: 2 | 3 | null = null,
): BackupProfilePreflight {
  return { status, reason, schemaVersion, authenticated: false, capabilities: DISABLED };
}
class GateFailure extends Error {
  constructor(readonly reason: BackupProfileReason) {
    super(reason);
  }
}
type Obj = Record<string, unknown>;
const own = (x: Obj, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(x, key);
const obj = (x: unknown): x is Obj =>
  x !== null && typeof x === "object" && !Array.isArray(x);
const positive = (x: unknown): x is number =>
  typeof x === "number" && Number.isSafeInteger(x) && x > 0;
const nonempty = (x: unknown): x is string =>
  typeof x === "string" && x.trim().length > 0;
const time = (x: unknown): boolean =>
  typeof x === "string" && x.length <= 64 && Number.isFinite(Date.parse(x));
const objects = (x: unknown): x is Obj[] =>
  Array.isArray(x) && x.every(obj);

const V2_ROOT = new Set([
  "schemaVersion", "resultModelVersion", "rankingPolicy", "exportedAt",
  "tournament", "players", "matches", "resultHistory", "actionLog",
]);
const V3_ROOT = new Set([
  ...V2_ROOT, "stages", "groups", "stageParticipants",
  "marvelRounds", "marvelGroups", "marvelGroupEntries",
  "stageBaskets", "stageBasketRoutes", "deadlockBans", "gamePicks",
  "routingPlan", "routingExecutions", "qualificationProposals",
  "routeExecutions",
]);
const V2_TOURNAMENT = new Set([
  "name", "description", "format", "status", "maxPlayers",
  "currentRound", "totalRounds", "swissRounds", "defaultBestOf",
  "visibility", "winnerBackupId", "featuredMatchBackupId",
]);
const V3_TOURNAMENT = new Set([
  "name", "description", "status", "maxPlayers", "activeStageBackupId",
  "winnerBackupId", "featuredMatchBackupId", "visibility",
  "gameConfig", "basketFlowAuthorityVersion",
]);
const MODERN_ONLY = new Set([
  "strictPolicy", "strictProfile", "profileVersion",
  "matchStateRevisions", "actionOrder", "completionActions",
  "portableActionId", "sourceActionIndex", "historyRevision",
  "stateRevision", "capabilities", "signature", "signatureAlgorithm",
  "issuerKeyId", "issuer", "trusted", "isTrusted", "basketConfigRevision",
]);

/** Detect duplicate members on text BEFORE JSON.parse could erase them. */
function checkRawJsonKeys(text: string): void {
  let at = 0;
  const fail = (reason: BackupProfileReason): never => { throw new GateFailure(reason); };
  const space = (): void => {
    while (at < text.length && /[\u0020\t\r\n]/.test(text[at])) at++;
  };
  const quoted = (): string => {
    if (text[at] !== '"') return fail("MALFORMED_JSON");
    const begin = at++;
    while (at < text.length) {
      if (text[at] === "\\") { at += 2; continue; }
      if (text[at++] === '"') {
        try { return JSON.parse(text.slice(begin, at)) as string; }
        catch { return fail("MALFORMED_JSON"); }
      }
    }
    return fail("MALFORMED_JSON");
  };
  const value = (depth: number): void => {
    if (depth > PROFILE_GATE_LIMITS.maxDepth) return fail("INPUT_LIMIT_EXCEEDED");
    space();
    if (text[at] === '"') { quoted(); return; }
    if (text[at] === "{") {
      at++; space();
      const keys = new Set<string>();
      if (text[at] === "}") { at++; return; }
      for (;;) {
        const key = quoted();
        if (keys.has(key)) return fail("DUPLICATE_JSON_KEY");
        keys.add(key);
        if (keys.size > PROFILE_GATE_LIMITS.maxObjectKeys) return fail("INPUT_LIMIT_EXCEEDED");
        space(); if (text[at++] !== ":") return fail("MALFORMED_JSON");
        value(depth + 1); space();
        const next = text[at++];
        if (next === "}") return;
        if (next !== ",") return fail("MALFORMED_JSON");
        space();
      }
    }
    if (text[at] === "[") {
      at++; space();
      if (text[at] === "]") { at++; return; }
      let count = 0;
      for (;;) {
        if (++count > PROFILE_GATE_LIMITS.maxArrayItems) return fail("INPUT_LIMIT_EXCEEDED");
        value(depth + 1); space();
        const next = text[at++];
        if (next === "]") return;
        if (next !== ",") return fail("MALFORMED_JSON");
        space();
      }
    }
    const start = at;
    while (at < text.length && !/[\u0020\t\r\n,\]}\[:]/.test(text[at])) at++;
    if (at === start) return fail("MALFORMED_JSON");
    // JSON.parse below verifies literals/numbers and complete grammar.
  };
  value(0); space();
  if (at !== text.length) fail("MALFORMED_JSON");
}

/** Bound *all* submitted data, not just the historical fingerprint. */
function bound(value: unknown): void {
  let nodes = 0, chars = 0;
  const seen = new WeakSet<object>();
  const visit = (v: unknown, depth: number): void => {
    if (++nodes > PROFILE_GATE_LIMITS.maxNodes ||
        depth > PROFILE_GATE_LIMITS.maxDepth) {
      throw new GateFailure("INPUT_LIMIT_EXCEEDED");
    }
    if (typeof v === "string") {
      chars += v.length;
      if (chars > PROFILE_GATE_LIMITS.maxJsonChars) {
        throw new GateFailure("INPUT_LIMIT_EXCEEDED");
      }
    }
    if (v === null || typeof v !== "object") {
      if (typeof v === "function" || typeof v === "symbol" ||
          typeof v === "bigint" || typeof v === "undefined" ||
          (typeof v === "number" && !Number.isFinite(v))) {
        throw new GateFailure("CRITICAL_FIELD_INVALID");
      }
      return;
    }
    if (seen.has(v)) throw new GateFailure("CRITICAL_FIELD_INVALID");
    seen.add(v);
    if (Array.isArray(v)) {
      if (v.length > PROFILE_GATE_LIMITS.maxArrayItems) {
        throw new GateFailure("INPUT_LIMIT_EXCEEDED");
      }
      for (const entry of v) visit(entry, depth + 1);
    } else {
      if (Object.getPrototypeOf(v) !== Object.prototype &&
          Object.getPrototypeOf(v) !== null) {
        throw new GateFailure("CRITICAL_FIELD_INVALID");
      }
      const keys = Object.keys(v);
      if (keys.length > PROFILE_GATE_LIMITS.maxObjectKeys) {
        throw new GateFailure("INPUT_LIMIT_EXCEEDED");
      }
      for (const key of keys) {
        chars += key.length;
        if (chars > PROFILE_GATE_LIMITS.maxJsonChars) {
          throw new GateFailure("INPUT_LIMIT_EXCEEDED");
        }
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
          throw new GateFailure("CRITICAL_FIELD_INVALID");
        }
        const descriptor = Object.getOwnPropertyDescriptor(v, key);
        if (!descriptor || !own(descriptor as Obj, "value")) {
          throw new GateFailure("CRITICAL_FIELD_INVALID");
        }
        visit(descriptor.value, depth + 1);
      }
    }
    seen.delete(v);
  };
  visit(value, 0);
}
function acquire(raw: unknown): unknown {
  if (typeof raw === "string") {
    if (raw.length > PROFILE_GATE_LIMITS.maxJsonChars) {
      throw new GateFailure("INPUT_LIMIT_EXCEEDED");
    }
    checkRawJsonKeys(raw);
    let parsed: unknown;
    try { parsed = JSON.parse(raw); }
    catch { throw new GateFailure("MALFORMED_JSON"); }
    bound(parsed);
    return parsed;
  }
  bound(raw);
  return raw;
}
function exactlyKeys(value: Obj, keys: Set<string>): boolean {
  return Object.keys(value).every(k => keys.has(k));
}
function noModernKeys(value: Obj): boolean {
  return Object.keys(value).every(key => !MODERN_ONLY.has(key));
}
function legacyRecords(root: Obj, version: 2 | 3): boolean {
  if (!objects(root.players) || !objects(root.matches) ||
      !objects(root.resultHistory) || !objects(root.actionLog)) return false;
  const seenPlayers = new Set<number>(), seenMatches = new Set<number>();
  for (const player of root.players) {
    if (!positive(player.backupId) || !nonempty(player.name) ||
        !nonempty(player.status) || seenPlayers.has(player.backupId) ||
        !noModernKeys(player)) return false;
    seenPlayers.add(player.backupId);
  }
  for (const match of root.matches) {
    if (!positive(match.backupId) || !positive(match.round) ||
        !positive(match.matchNumber) || !positive(match.bestOf) ||
        !nonempty(match.status) || !own(match, "resultType") ||
        !own(match, "resultReason") || !noModernKeys(match) ||
        (version === 2 && own(match, "stageBackupId")) ||
        (version === 3 && !positive(match.stageBackupId)) ||
        seenMatches.has(match.backupId)) return false;
    seenMatches.add(match.backupId);
    for (const field of ["player1BackupId", "player2BackupId", "winnerBackupId"]) {
      if (match[field] != null &&
          (!positive(match[field]) || !seenPlayers.has(match[field] as number))) {
        return false;
      }
    }
  }
  const stages = version === 3 ? root.stages : null;
  const stageIds = new Set<number>();
  if (version === 3) {
    if (!objects(stages) || stages.length < 1 || stages.length > 10 ||
        !objects(root.groups) || !objects(root.stageParticipants)) return false;
    for (const stage of stages) {
      if (!positive(stage.backupId) || stageIds.has(stage.backupId) ||
          !nonempty(stage.stageKey) || !positive(stage.position) ||
          !nonempty(stage.name) || !nonempty(stage.format) ||
          !nonempty(stage.status) || !nonempty(stage.rankingPolicy) ||
          !nonempty(stage.qualificationMode) || !nonempty(stage.seedingPolicy) ||
          !positive(stage.bestOf) || !positive(stage.version) ||
          typeof stage.participantCount !== "number" ||
          !Number.isSafeInteger(stage.participantCount) ||
          stage.participantCount < 0 || !time(stage.createdAt) ||
          !noModernKeys(stage)) return false;
      stageIds.add(stage.backupId);
    }
    for (const match of root.matches) {
      if (!stageIds.has(match.stageBackupId as number)) return false;
    }
  }
  for (const entry of root.resultHistory) {
    if (!positive(entry.matchBackupId) ||
        !seenMatches.has(entry.matchBackupId) ||
        !positive(entry.revision) || !time(entry.completedAt) ||
        !noModernKeys(entry) ||
        (version === 3 &&
          (!positive(entry.stageBackupId) ||
           !stageIds.has(entry.stageBackupId)))) return false;
  }
  for (const entry of root.actionLog) {
    if (!nonempty(entry.actionType) || typeof entry.description !== "string" ||
        typeof entry.canUndo !== "boolean" ||
        typeof entry.isUndone !== "boolean" || !time(entry.createdAt) ||
        !own(entry, "undoPayload") || !noModernKeys(entry) ||
        (entry.undoPayload !== null && !obj(entry.undoPayload)) ||
        (entry.matchBackupId != null &&
          (!positive(entry.matchBackupId) ||
           !seenMatches.has(entry.matchBackupId as number))) ||
        (version === 3 && (!own(entry, "stageBackupId") ||
          (entry.stageBackupId !== null &&
            (!positive(entry.stageBackupId) ||
             !stageIds.has(entry.stageBackupId as number)))))) return false;
  }
  return true;
}

export function preflightBackupV3Profile(raw: unknown): BackupProfilePreflight {
  let value: unknown;
  try { value = acquire(raw); }
  catch (err) {
    return outcome("REJECT", err instanceof GateFailure ? err.reason : "CRITICAL_FIELD_INVALID");
  }
  if (!obj(value)) return outcome("REJECT", "UNKNOWN_OR_HYBRID_STRUCTURE");
  const root = value;
  const version = root.schemaVersion;
  const schemaVersion = version === 2 || version === 3 ? version : null;
  if (schemaVersion === null) return outcome("REJECT", "VERSION_OR_SCHEMA_CONFLICT");
  if (root.resultModelVersion !== "series_v1" ||
      root.rankingPolicy !== "match_record_v1" ||
      !time(root.exportedAt)) {
    return outcome("REJECT", "CRITICAL_FIELD_INVALID", schemaVersion);
  }
  if (!obj(root.tournament) || !nonempty(root.tournament.name) ||
      !["draft", "active", "completed"].includes(root.tournament.status as string) ||
      !["public_online", "private_online", "private_offline"]
        .includes(root.tournament.visibility as string)) {
    return outcome("REJECT", "CRITICAL_FIELD_INVALID", schemaVersion);
  }

  if (own(root, "strictPolicy")) {
    if (schemaVersion !== 3 || !exactlyKeys(root, new Set([...V3_ROOT, "strictPolicy"])) ||
        !noModernKeys(root.tournament) ||
        !exactlyKeys(root.tournament, V3_TOURNAMENT)) {
      return outcome("REJECT", "VERSION_OR_SCHEMA_CONFLICT", schemaVersion);
    }
    if (!obj(root.strictPolicy)) {
      return outcome("REJECT", "UNSUPPORTED_PROFILE", schemaVersion);
    }
    const marker = root.strictPolicy;
    if (marker.profile !== "web005.backup-v3.strict.v1" ||
        marker.version !== 1 ||
        (own(marker, "producer") && marker.producer !== "web005") ||
        Object.keys(marker).some(k => !new Set([
          "profile", "version", "producer", "matchStateRevisions",
          "actionOrder", "completionActions",
        ]).has(k)) ||
        !Array.isArray(marker.matchStateRevisions) ||
        !Array.isArray(marker.actionOrder) ||
        !Array.isArray(marker.completionActions)) {
      return outcome("REJECT", "UNSUPPORTED_PROFILE", schemaVersion);
    }
    // A self-declared strict marker must not hide invalid V3 structure,
    // contradictory references or an injected V2 tournament fingerprint.
    if (!legacyRecords(root, 3)) {
      return outcome("REJECT", "UNKNOWN_OR_HYBRID_STRUCTURE", schemaVersion);
    }
    // Marker and self-reported producer NEVER verify issuer or a signature.
    return outcome("STRICT_AUTH_REQUIRED", "STRICT_MARKER_UNAUTHENTICATED", 3);
  }

  const known = schemaVersion === 2 ? V2_ROOT : V3_ROOT;
  if (!exactlyKeys(root, known) ||
      !noModernKeys(root.tournament) ||
      !exactlyKeys(root.tournament,
        schemaVersion === 2 ? V2_TOURNAMENT : V3_TOURNAMENT)) {
    return outcome("REJECT", "UNKNOWN_OR_HYBRID_STRUCTURE", schemaVersion);
  }
  if (schemaVersion === 2) {
    if (!nonempty(root.tournament.format) ||
        !positive(root.tournament.defaultBestOf) ||
        root.tournament.defaultBestOf % 2 === 0) {
      return outcome("REJECT", "CRITICAL_FIELD_INVALID", 2);
    }
  } else if (!objects(root.stages) || !objects(root.groups) ||
             !objects(root.stageParticipants)) {
    return outcome("REJECT", "UNKNOWN_OR_HYBRID_STRUCTURE", 3);
  }
  if (!legacyRecords(root, schemaVersion)) {
    return outcome("REJECT", "CRITICAL_FIELD_INVALID", schemaVersion);
  }
  // Positive historical STRUCTURE, NEVER proof of actual historical origin.
  return outcome("LEGACY_COMPAT_UNATTESTED", "POSITIVE_HISTORICAL_SHAPE_ONLY",
    schemaVersion);
}
