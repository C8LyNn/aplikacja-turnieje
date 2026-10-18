/**
 * WEB-005 A50 R23H-R5-R2. Source-only Ed25519 signed context verifier.
 * Deliberate NO-GO: A00/A20/operator public keys not provisioned.
 * No network/SQL, test invocation or mutable approval override.
 */
import { readFileSync } from "node:fs";
import { createPublicKey, verify as verifyEd25519, createHash } from "node:crypto";
const TRUSTED_ROLE_KEYS = Object.freeze({}); // PINNED by separate independently reviewed source change.
const CONTEXT_FILE = "/run/web005/g4-context.json";
const ROLES = Object.freeze(["A00", "A20", "OPERATOR"]);
const hex = (x, n) => typeof x === "string" && new RegExp("^[0-9a-f]{" + n + "}$").test(x);
export class SourceContextHold extends Error {
  constructor(code) { super("WEB005_CLEANUP_HOLD:" + code); this.code=code; }
}
function stop(code) { throw new SourceContextHold(code); }
function canonical(v) {
  if (v === null || typeof v === "boolean" || typeof v === "string") return JSON.stringify(v);
  if (Number.isSafeInteger(v)) return String(v);
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype) {
    const keys = Object.keys(v).sort();
    if (keys.some(k => !/^[a-z][a-z0-9_]*$/.test(k))) stop("NONCANONICAL_CONTEXT_KEYS");
    return "{" + keys.map(k => JSON.stringify(k)+":"+canonical(v[k])).join(",") + "}";
  }
  stop("NONCANONICAL_CONTEXT");
}
function decodeBoundedB64(x) {
  if (typeof x !== "string" || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(x)) stop("BAD_BASE64");
  const b = Buffer.from(x, "base64");
  if (!b.length || b.length > 32768 || b.toString("base64") !== x) stop("BAD_BASE64_BYTES");
  return b;
}
/** Trust root keys are compiled into the reviewed source image. Envelope keys are never trusted. */
export function verifySignedSourceContextBytes(jsonBytes) {
  if (Object.keys(TRUSTED_ROLE_KEYS).length !== ROLES.length ||
      !ROLES.every(x => typeof TRUSTED_ROLE_KEYS[x] === "string")) stop("TRUST_ROOTS_UNPROVISIONED");
  if (!Buffer.isBuffer(jsonBytes) || jsonBytes.length > 65536) stop("BAD_ENVELOPE_SIZE");
  let envelope;
  try { envelope=JSON.parse(jsonBytes.toString("utf8")); } catch { stop("BAD_ENVELOPE_JSON"); }
  if (canonical(envelope) !== jsonBytes.toString("utf8").trimEnd()) stop("NONCANONICAL_ENVELOPE");
  if (!envelope || !Array.isArray(envelope.signatures) ||
      envelope.signatures.length !== 3) stop("SIGNATURE_QUORUM");
  const payload = decodeBoundedB64(envelope.payload_base64);
  const source = payload.toString("utf8");
  let claims;
  try { claims = JSON.parse(source); } catch { stop("BAD_CLAIMS"); }
  if (canonical(claims) !== source) stop("NONCANONICAL_CLAIMS");
  const actualRoles = new Set();
  for (const entry of envelope.signatures) {
    if (!entry || !ROLES.includes(entry.role) || actualRoles.has(entry.role)) stop("DUPLICATE_OR_UNKNOWN_SIGNER");
    actualRoles.add(entry.role);
    const k = createPublicKey(TRUSTED_ROLE_KEYS[entry.role]);
    if (k.asymmetricKeyType !== "ed25519" ||
        !verifyEd25519(null, payload, k, decodeBoundedB64(entry.signature_base64))) stop("INVALID_SIGNATURE");
  }
  if (!ROLES.every(role=>actualRoles.has(role))) stop("MISSING_REQUIRED_SIGNER");
  if (claims.phase !== "G4_TEST_ONCE" || claims.action !== "EXECUTE_FULL_36_INTEGRATION" ||
      !hex(claims.run_id,32) || !hex(claims.source_sha,40) ||
      !hex(claims.plan_sha256,64) || !hex(claims.cluster_cert_sha256,64) ||
      !hex(claims.nonce,32) || !/^[0-9]{10,}$/.test(claims.system_identifier) ||
      !/^[0-9]+$/.test(claims.base_database_oid) ||
      !/^[0-9]+$/.test(claims.role_oid) ||
      !/^[a-z_][a-z0-9_]*$/.test(claims.role_name) ||
      !hex(claims.lock_sha256,64) ||
      !hex(claims.drizzle_kit_sha256,64) ||
      !hex(claims.drizzle_config_sha256,64) ||
      claims.five_db_contexts !== 5 || claims.integration_entrypoints !== 36 ||
      claims.drizzle_force_calls !== 2 ||
      claims.base_database !== "web005_c01_test_" + claims.run_id ||
      claims.host !== "127.0.0.1" || claims.port !== 55432 ||
      claims.network_mode !== "service:pg16" ||
      claims.exclusive_writer !== true || claims.native_windows_pg_untouched !== true ||
      !Number.isSafeInteger(claims.expires_unix) ||
      claims.expires_unix <= Math.floor(Date.now()/1000) ||
      claims.expires_unix > Math.floor(Date.now()/1000)+3600
  ) stop("SIGNED_CLAIMS_OUT_OF_SCOPE");
  return Object.freeze({
    ...claims,
    signed_payload_sha256:createHash("sha256").update(payload).digest("hex"),
    envelope_sha256:createHash("sha256").update(jsonBytes).digest("hex")
  });
}
/** Fixed image path: no caller-chosen authorization file, no env-provided key. */
export function requireVerifiedSourceContext() {
  let bytes;
  try { bytes=readFileSync(CONTEXT_FILE); } catch { stop("SIGNED_CONTEXT_FILE_UNAVAILABLE"); }
  return verifySignedSourceContextBytes(bytes);
}
