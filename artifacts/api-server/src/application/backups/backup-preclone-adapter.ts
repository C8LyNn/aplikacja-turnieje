/**
 * WEB-005 R23C / A90: pure raw-before-Zod preclone adapter, NOT importer wiring.
 * Uses the exact PR58 raw-profile and PR56 strict validators in A40 composite.
 * Historical format is not historical origin. No issued trust evidence exists.
 * Neither this adapter nor any caller port may authorize import or Undo/CAS.
 */
import {
  preflightBackupV3Profile,
  type BackupProfilePreflight,
} from "./backup-v3-profile-gate";
import { validateStrictBackupV3Policy } from "./backup-v3-strict-policy";

export type PrecloneCode =
  | "RAW_JSON_REQUIRED"
  | "PROFILE_REJECTED"
  | "MISSING_DEPENDENCY"
  | "PARSER_FAILED"
  | "PARSED_PROFILE_CONFLICT"
  | "SEMANTIC_VALIDATION_FAILED"
  | "STRICT_POLICY_FAILED"
  | "ACTION_LOCAL_CLOSURE_FAILED"
  | "STRICT_ATTESTATION_REQUIRED"
  | "LEGACY_COMPAT_RESTRICTED";

export type BackupPrecloneDecision = Readonly<{
  code: PrecloneCode;
  profile: Readonly<BackupProfilePreflight>;
  semanticValidated: boolean;
  actionLocalValidated: boolean;
  authenticated: false;
  importAuthorized: false;
  capabilities: Readonly<{
    importAuthorized: false;
    historicalUndo: false;
    historicalRevert: false;
    historicalCasReplay: false;
  }>;
}>;

/**
 * Trusted application ports, missing dependency always denies:
 * - parseV2/parseV3 must parse the complete version-tagged schema without
 *   silently removing any source or security metadata.
 * - validateV2/validateV3 MUST call real full release domain validators.
 * - validateActionLocalV3 MUST implement the A70 action-local closure:
 *   global existence of any backup ID in PR56 is NOT sufficient.
 *
 * Tests inject stubs only to prove invocation and policy routing. No callback
 * or caller-provided property can act as a trusted issuer attestation.
 */
export interface BackupPreclonePorts {
  parseV2?: (raw: unknown) => unknown;
  parseV3?: (raw: unknown) => unknown;
  validateV2?: (parsed: unknown) => void;
  validateV3?: (parsed: unknown) => void;
  validateActionLocalV3?: (parsed: unknown) => void;
}
const NO_AUTHORITY = Object.freeze({
  importAuthorized: false,
  historicalUndo: false,
  historicalRevert: false,
  historicalCasReplay: false,
} as const);
const NONE: BackupProfilePreflight = Object.freeze({
  status: "REJECT",
  reason: "UNKNOWN_OR_HYBRID_STRUCTURE",
  schemaVersion: null,
  authenticated: false,
  capabilities: NO_AUTHORITY,
});
function decision(
  code: PrecloneCode,
  profile: BackupProfilePreflight = NONE,
  semanticValidated = false,
  actionLocalValidated = false,
): BackupPrecloneDecision {
  const frozenProfile = Object.freeze({
    ...profile,
    capabilities: Object.freeze({ ...profile.capabilities }),
  }) as Readonly<BackupProfilePreflight>;
  return Object.freeze({
    code, profile: frozenProfile, semanticValidated, actionLocalValidated,
    authenticated: false, importAuthorized: false, capabilities: NO_AUTHORITY,
  });
}
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
/** Key-order-neutral loss-sensitive form; inputs have first passed preflight bounds. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (record(value)) {
    return "{" + Object.keys(value).sort()
      .map(key => JSON.stringify(key) + ":" + canonical(value[key]))
      .join(",") + "}";
  }
  return JSON.stringify(value) ?? "undefined";
}

/** Single raw JSON text entry, side effect free; never return import authority. */
export function validateRawBackupBeforeClone(
  raw: unknown,
  ports?: BackupPreclonePorts,
): BackupPrecloneDecision {
  if (typeof raw !== "string") return decision("RAW_JSON_REQUIRED");
  const profile = preflightBackupV3Profile(raw);
  if (profile.status === "REJECT" || profile.schemaVersion === null) {
    return decision("PROFILE_REJECTED", profile);
  }
  const version = profile.schemaVersion;
  const parser = version === 2 ? ports?.parseV2 : ports?.parseV3;
  const semantic = version === 2 ? ports?.validateV2 : ports?.validateV3;
  if (typeof parser !== "function" || typeof semantic !== "function") {
    return decision("MISSING_DEPENDENCY", profile);
  }

  // Real raw duplicate-key/limits preflight occurred BEFORE JSON.parse.
  let untouched: unknown, parsed: unknown;
  try {
    untouched = JSON.parse(raw) as unknown;
    parsed = parser(structuredClone(untouched));
  } catch {
    return decision("PARSER_FAILED", profile);
  }

  // Catch Zod stripping strictPolicy, wrong V2/V3 union or any changed data.
  // Preserve an immutable raw-derived profile snapshot in the result.
  try {
    const after = preflightBackupV3Profile(parsed);
    if (after.status !== profile.status ||
        after.schemaVersion !== version ||
        after.reason !== profile.reason ||
        canonical(untouched) !== canonical(parsed)) {
      return decision("PARSED_PROFILE_CONFLICT", profile);
    }
  } catch {
    return decision("PARSED_PROFILE_CONFLICT", profile);
  }

  let semanticsPassed = false;
  try {
    semantic(parsed);
    if (canonical(untouched) !== canonical(parsed)) {
      return decision("SEMANTIC_VALIDATION_FAILED", profile);
    }
    semanticsPassed = true;
  } catch {
    return decision("SEMANTIC_VALIDATION_FAILED", profile);
  }
  if (profile.status === "LEGACY_COMPAT_UNATTESTED") {
    // For a future owner-approved restricted recovery path only.
    // No historical Undo, Direct Revert, CAS or import authorization.
    return decision("LEGACY_COMPAT_RESTRICTED", profile, semanticsPassed);
  }

  // The modern strict policy is a second independent check, not provenance.
  try {
    validateStrictBackupV3Policy(parsed);
  } catch {
    return decision("STRICT_POLICY_FAILED", profile, semanticsPassed);
  }
  if (typeof ports?.validateActionLocalV3 !== "function") {
    return decision("MISSING_DEPENDENCY", profile, semanticsPassed);
  }
  try {
    ports.validateActionLocalV3(parsed);
    if (canonical(untouched) !== canonical(parsed)) {
      return decision("ACTION_LOCAL_CLOSURE_FAILED", profile, semanticsPassed);
    }
  } catch {
    return decision("ACTION_LOCAL_CLOSURE_FAILED", profile, semanticsPassed);
  }
  // No Ed25519, issuance registry or cryptographic attester is implemented.
  // This final denial is unconditional, even if caller passes verified=true.
  return decision("STRICT_ATTESTATION_REQUIRED", profile, semanticsPassed, true);
}
