/**
 * WEB-005 A50 R23H-R5 Variant B -- SOURCE-ONLY guarded G4 launcher candidate.
 *
 * This version CANNOT execute tests: trust roots, atomic replay ledger, and
 * physical attestor are deliberately UNPROVISIONED. They must be separately
 * implemented and independently reviewed at a NEW exact SHA. Never flip the
 * lock as an operator workaround. Merely importing this module has no effects.
 */
import { createPublicKey, verify as verifySignature } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const SOURCE_ONLY_LOCK = true;
const TRUSTED_ED25519_PUBLIC_KEYS = Object.freeze({}); // external issuer keys NOT PROVIDED
const PINNED_PHASE = "G4_TEST_ONCE";
const REQUIRED_SCOPES = Object.freeze([
  "G0_SOURCE", "G1_PHYSICAL", "G2_IDENTITY",
  "G3_S1_SCHEMA", "G3_S2_CATALOG", "G3_S2_DRIZZLE_FORCE",
  PINNED_PHASE,
]);
const EXPECTED_COMMAND = Object.freeze([
  "--filter", "@workspace/api-server", "run", "test:integration",
]);
const FORBIDDEN_EXACT = new Set([
  "DATABASE_URL", "TEST_DATABASE_URL", "NEON_DATABASE_URL", "DIRECT_URL",
  "NODE_OPTIONS", "NODE_PATH", "NODE_EXTRA_CA_CERTS",
  "PGHOST", "PGHOSTADDR", "PGPORT", "PGUSER", "PGPASSWORD",
  "PGPASSFILE", "PGSERVICE", "PGSERVICEFILE", "PGDATABASE", "PGOPTIONS",
  "PGCONNECT_TIMEOUT", "PGSSLMODE", "PGSSLROOTCERT", "PGSSLCERT",
  "PGSSLKEY", "PGREQUIRESSL", "PGTARGETSESSIONATTRS", "PGAPPNAME",
  "NPM_CONFIG_USERCONFIG", "NPM_CONFIG_REGISTRY", "COREPACK_NPM_REGISTRY_TOKEN",
]);
const FORBIDDEN_PREFIX = [
  "PG", "SCHEMA_COMPARE_", "DOTENV_", "npm_config_", "PNPM_", "COREPACK_",
];
export class GateStop extends Error {
  constructor(code) { super(code); this.name = "WEB005_GATE_STOP"; this.code = code; }
}
function stop(reason) { throw new GateStop(reason); }
export function assertUntaintedParentEnv(parent = process.env) {
  // Deliberately reject rather than inherit and silently override foreign DSNs.
  for (const name of Object.keys(parent)) {
    const upper = name.toUpperCase();
    if (FORBIDDEN_EXACT.has(upper) ||
        FORBIDDEN_PREFIX.some(p => upper.startsWith(p.toUpperCase()))) {
      stop("STOP_INHERITED_ENV"); // do not log variable value
    }
  }
  return true;
}
function strictCanonicalJson(parsed) {
  if (parsed === null || typeof parsed === "boolean") return JSON.stringify(parsed);
  if (typeof parsed === "string") {
    if (/[\u0000-\u001f]/.test(parsed)) stop("STOP_NONCANONICAL_PAYLOAD");
    return JSON.stringify(parsed);
  }
  if (Number.isSafeInteger(parsed)) return String(parsed);
  if (Array.isArray(parsed)) return "[" + parsed.map(strictCanonicalJson).join(",") + "]";
  if (typeof parsed === "object") {
    const keys = Object.keys(parsed).sort();
    if (keys.some(k => !/^[A-Za-z0-9_]+$/.test(k))) stop("STOP_NONCANONICAL_KEY");
    return "{" + keys.map(k => JSON.stringify(k) + ":" + strictCanonicalJson(parsed[k])).join(",") + "}";
  }
  stop("STOP_NONCANONICAL_VALUE");
}
function decodeCanonicalSignedBytes(encoded) {
  if (typeof encoded !== "string" || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
    stop("STOP_MALFORMED_SIGNED_PAYLOAD");
  }
  const raw = Buffer.from(encoded, "base64");
  if (!raw.length || raw.length > 16384) stop("STOP_SIGNED_PAYLOAD_SIZE");
  const text = raw.toString("utf8");
  if (!Buffer.from(text, "utf8").equals(raw)) stop("STOP_NON_UTF8_PAYLOAD");
  let data;
  try { data = JSON.parse(text); } catch { stop("STOP_INVALID_SIGNED_JSON"); }
  if (strictCanonicalJson(data) !== text) stop("STOP_NONCANONICAL_SIGNED_JSON");
  return { raw, data };
}
export function verifyTripleSignedAction(envelope, expected) {
  if (!envelope || typeof envelope !== "object" || !Array.isArray(envelope.signatures)) {
    stop("STOP_APPROVAL_MISSING");
  }
  // There is no way to pass untrusted keys in an envelope. Key registration
  // must be a separate A00/A20/A30 source-change + review, not a JSON override.
  const trustedKeys = TRUSTED_ED25519_PUBLIC_KEYS;
  if (Object.keys(trustedKeys).length !== 3) stop("STOP_TRUST_ROOTS_UNPROVISIONED");
  const {raw, data} = decodeCanonicalSignedBytes(envelope.payload_base64);
  if (!data || typeof data !== "object") stop("STOP_APPROVAL_PAYLOAD");
  for (const key of ["run_id", "plan_sha256", "source_sha", "phase", "action", "expires_unix", "cluster_certificate_sha256"]) {
    if (data[key] !== expected[key]) stop("STOP_APPROVAL_SCOPE");
  }
  if (data.phase !== PINNED_PHASE || data.action !== "EXECUTE_ONE_FULL_API_INTEGRATION") {
    stop("STOP_PHASE_OR_ACTION");
  }
  if (!Number.isSafeInteger(data.expires_unix) || data.expires_unix <= Math.floor(Date.now() / 1000)) {
    stop("STOP_APPROVAL_EXPIRED");
  }
  const distinct = new Set();
  for (const sig of envelope.signatures) {
    if (!sig || typeof sig.role !== "string" || typeof sig.signature_base64 !== "string") {
      stop("STOP_APPROVAL_SIGNATURE");
    }
    if (distinct.has(sig.role)) stop("STOP_DUPLICATE_APPROVER");
    distinct.add(sig.role);
    const pem = trustedKeys[sig.role];
    if (!pem) stop("STOP_UNTRUSTED_APPROVER");
    const key = createPublicKey(pem);
    if (key.asymmetricKeyType !== "ed25519" ||
        !verifySignature(null, raw, key, Buffer.from(sig.signature_base64, "base64"))) {
      stop("STOP_APPROVAL_SIGNATURE_INVALID");
    }
  }
  if (distinct.size !== 3 || !["A00", "A20", "OPERATOR"].every(x => distinct.has(x))) {
    stop("STOP_APPROVAL_QUORUM");
  }
  return data;
}
export function assertSealedTarget(target) {
  if (!target || target.host !== "127.0.0.1" || target.port !== 55432 ||
      target.network_mode !== "service:pg16" || target.host_ports !== 0 ||
      target.pg_major !== 16 || target.rootfs_read_only !== true ||
      target.caps_dropped !== true || target.unique_pgdata_attested !== true) {
    stop("STOP_TARGET_NOT_PHYSICALLY_ATTESTED");
  }
  // This validates typed claims, NOT the physical truth of those claims.
  if (typeof target.cluster_system_identifier !== "string" ||
      !/^[0-9]{10,}$/.test(target.cluster_system_identifier)) stop("STOP_MISSING_CLUSTER_ID");
  return true;
}
export function sealMinimalChildEnv(cert, password) {
  if (!cert || !/^[a-f0-9]{32}$/.test(cert.run_id) ||
      !/^[a-f0-9]{64}$/.test(cert.cluster_certificate_sha256) ||
      !/^[a-z_][a-z0-9_]*$/.test(cert.user ?? "") ||
      cert.database !== `web005_c01_test_${cert.run_id}`) {
    stop("STOP_SIGNED_DB_SCOPE");
  }
  if (typeof password !== "string" || !password) stop("STOP_MISSING_TEST_SECRET");
  const encodedUser = encodeURIComponent(cert.user);
  const encodedPassword = encodeURIComponent(password);
  const url = `postgresql://${encodedUser}:${encodedPassword}@127.0.0.1:55432/${cert.database}`;
  return Object.freeze({
    PATH: "/usr/local/bin:/usr/bin:/bin",
    HOME: "/tmp/web005/home",
    TMPDIR: "/tmp/web005/tmp",
    XDG_CACHE_HOME: "/tmp/web005/cache",
    XDG_CONFIG_HOME: "/tmp/web005/config",
    XDG_DATA_HOME: "/tmp/web005/data",
    LANG: "C.UTF-8", TZ: "UTC", NODE_ENV: "test",
    TEST_DATABASE_URL: url,
    TEST_DATABASE_SCHEMA: `tm_test_${cert.run_id}`,
    TEST_DATABASE_RESET: "DROP_TM_TEST_SCHEMA",
    // After signed A22/A31 review, the S1 alias must refer to the SAME
    // disposable base DB; never inherit DATABASE_URL from the parent.
    DATABASE_URL: url,
    WEB005_RUN_ID: cert.run_id,
    WEB005_PG16_CLUSTER_CERT_SHA256: cert.cluster_certificate_sha256,
  });
}
export function verifyFutureExecutionPlan(plan) {
  if (!plan || plan.phase !== PINNED_PHASE || plan.command?.join(" ") !== EXPECTED_COMMAND.join(" ") ||
      !Array.isArray(plan.scope_chain) ||
      REQUIRED_SCOPES.some(scope => !plan.scope_chain.includes(scope)) ||
      plan.entrypoints !== 36 || plan.five_db_contexts !== 5 ||
      plan.drizzle_force_pushes !== 2 || plan.replay_guard !== "EXTERNAL_ATOMIC_CAS") {
    stop("STOP_EXECUTION_PLAN_DRIFT");
  }
  return true;
}
/**
 * Explicitly non-executing entrypoint for this source-only authorization.
 * There is NO spawn, Docker, SQL, migration, or upload command in this build.
 */
export async function sourceOnlyMain() {
  assertUntaintedParentEnv(process.env);
  if (SOURCE_ONLY_LOCK) stop("STOP_SOURCE_ONLY_NO_G4_AUTHORIZATION");
  stop("STOP_MISSING_EXTERNAL_ATOMIC_LEDGER_AND_PHYSICAL_OBSERVER");
}
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  sourceOnlyMain().catch(error => {
    console.error(error instanceof GateStop ? error.code : "STOP_UNEXPECTED_LAUNCHER_ERROR");
    process.exitCode = 2;
  });
}
