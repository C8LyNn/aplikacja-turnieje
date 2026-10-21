/**
 * WEB-005 R23H-R5 Variant B: fixture-only SQL ownership guards.
 * No SQL runs on module import. The source-side marker is NOT independent
 * authentication: external signed G4 physical identity and exclusive writer
 * attestation are indispensable before execution.
 */
import { requireVerifiedSourceContext } from "../../../qa/web005/r23h-r5/signed-source-context.mjs";
import { persistSafetyEvent, verifyPersistedEvent, type EventReceipt } from "../../../qa/web005/r23h-r5/source-evidence-journal.mjs";

export interface SafetyPool {
  query(text: string, values?: unknown[]): Promise<{ rows: unknown[]; rowCount: number | null }>;
}
export interface SafetyContext {
  runId: string; clusterCertificateSha256: string; signedContextSha256: string;
  systemIdentifier: string; baseDatabase: string; baseDatabaseOid: string;
  roleOid: string; roleName: string; exclusiveWriter: true;
}
export interface CreatedDatabaseReceipt extends SafetyContext {
  name: string; oid: string; owner: string; ownerOid: string; slot: string;
  createdByRun: true; evidence: EventReceipt;
}
interface DatabaseIdentity {
  oid: string; owner: string; principal: string; ownerOid: string; principalOid: string;
}
interface SchemaIdentity {
  oid: string; owner: string; principal: string; ownerOid: string;
  principalOid: string; marker: string | null;
}
interface SchemaReceipt extends SafetyContext {
  schema: string; oid: string; owner: string; ownerOid: string; slot: string;
  evidence: EventReceipt;
}
type SlotStatus = "NOT_ATTEMPTED" | "CREATE_ATTEMPTED" | "CREATE_CONFIRMED" |
  "CREATE_AMBIGUOUS" | "DROP_ATTEMPTED" | "DROP_CONFIRMED" | "CLEANUP_HOLD";
interface SlotRecord { slot: string; name: string; state: SlotStatus }
const slotStates = new Map<string, SlotRecord>();
export function sourceOnlySlotStateSnapshot(): ReadonlyArray<Readonly<SlotRecord>> {
  return [...slotStates.values()].map(item => Object.freeze({...item}));
}
export function reserveRunDatabaseSlot(name: string): void {
  const ctx=requireSafetyContext();
  const slot=slotForDb(name);
  if (slotStates.has(slot)) hold("S2_SLOT_ALREADY_RESERVED");
  journal(ctx,slot,"NOT_ATTEMPTED",name);
}
export function holdRunDatabaseSlot(name: string): void {
  const slot=slotForDb(name);
  // B02: preserve terminal DROP_CONFIRMED; a redundant HOLD has no effect.
  if (slotStates.get(slot)?.state==="DROP_CONFIRMED") return;
  const ctx=requireSafetyContext();
  journal(ctx,slot,"CLEANUP_HOLD",name);
}
function slotForDb(name: string): string {
  if (/^tm_catalog_test_[a-f0-9]{16}_(dev|prod|fresh)$/.test(name)) {
    return "catalog_" + name.split("_").at(-1);
  }
  if (/^tm_drizzle_schema_test_[a-f0-9]{32}$/.test(name)) return "drizzle";
  hold("UNKNOWN_S2_SLOT");
}
function slotForSchema(name: string): string {
  if (name.endsWith("_marker_drift")) return "s1_marker_drift";
  if (name.endsWith("_rollback")) return "s1_rollback";
  return "s1_base";
}
function journal(ctx: SafetyContext, slot: string, event: SlotStatus, name: string,
                 details: Record<string,string> = {}): EventReceipt {
  if (slotStates.get(slot)?.state==="DROP_CONFIRMED") {
    hold("S2_TERMINAL_DROP_CONFIRMED_IMMUTABLE");
  }
  const evidence = persistSafetyEvent({
    run_id: ctx.runId, cluster_cert_sha256: ctx.clusterCertificateSha256,
    signed_context_sha256: ctx.signedContextSha256, slot, event, name, ...details,
  });
  slotStates.set(slot, {slot, name, state:event});
  emit(event, {slot, name, ...details});
  return evidence;
}
const createdSchemaReceipts = new Map<string, SchemaReceipt>();


function emit(event: string, details: Record<string, string> = {}): void {
  // Emitted on STDERR for an operator-side private append-only collector.
  // This in-process log is NOT a trusted physical attestation or a substitute
  // for the separately signed G4/G5 SQL event receipt.
  console.error("WEB005_SAFETY_EVENT " + JSON.stringify({
    schema: "web005.a50.r23h-r5.fixture-event.v1", event,
    run_id: process.env.WEB005_RUN_ID ?? "UNSET",
    cluster_cert_sha256: process.env.WEB005_PG16_CLUSTER_CERT_SHA256 ?? "UNSET",
    ...details,
  }));
}
function hold(reason: string): never {
  emit("CLEANUP_HOLD", { reason });
  throw new Error(`WEB005_CLEANUP_HOLD:${reason}`);
}
export function requireSafetyContext(env: NodeJS.ProcessEnv = process.env): SafetyContext {
  // Signed, canonical, triply Ed25519 authenticated bytes at an image-fixed
  // operator-owned path, NEVER an environment-provided root/signature/URL.
  // Current reviewed tree has no pinned actual trust roots -> fail closed.
  const certified = requireVerifiedSourceContext();
  if (env.WEB005_RUN_ID !== certified.run_id ||
      env.WEB005_PG16_CLUSTER_CERT_SHA256 !== certified.cluster_cert_sha256) {
    hold("SIGNED_G4_ENV_SCOPE_MISMATCH");
  }
  if (certified.exclusive_writer !== true || certified.native_windows_pg_untouched !== true) {
    hold("EXCLUSIVE_WRITER_OR_WINDOWS_ATTESTATION_MISSING");
  }
  return {
    runId: certified.run_id, clusterCertificateSha256: certified.cluster_cert_sha256,
    signedContextSha256: certified.signed_payload_sha256,
    systemIdentifier: certified.system_identifier,
    baseDatabase: certified.base_database, baseDatabaseOid: certified.base_database_oid,
    roleOid: certified.role_oid, roleName: certified.role_name, exclusiveWriter: true,
  };
}
/** G2-admitted BASE+principal consistency read, required before source SQL mutation.
 * Does not independently prove Docker netns/PGDATA/system_identifier; signed
 * attestor and external no-foreign-writer control remain additional MUST gates.
 */
export async function requireBaseAndRoleIdentity(pool: SafetyPool, context = requireSafetyContext()): Promise<void> {
  const observed = await pool.query(
    `SELECT current_database() AS database_name, db.oid::text AS database_oid,
       current_user AS role_name, role.oid::text AS role_oid,
       role.rolcanlogin AS can_login, role.rolcreatedb AS can_create_db,
       role.rolsuper AS superuser, role.rolcreaterole AS can_create_role,
       role.rolreplication AS replication, role.rolbypassrls AS bypass_rls
       FROM pg_database db JOIN pg_roles role ON role.rolname = current_user
       WHERE db.datname = current_database()`
  );
  const row = observed.rows[0] as Record<string,unknown>|undefined;
  if (observed.rows.length !== 1 || !row ||
      row.database_name !== context.baseDatabase ||
      row.database_oid !== context.baseDatabaseOid ||
      row.role_oid !== context.roleOid || row.role_name !== context.roleName ||
      row.can_login !== true || row.can_create_db !== true ||
      row.superuser !== false || row.can_create_role !== false ||
      row.replication !== false || row.bypass_rls !== false) {
    hold("G2_BASE_ROLE_OID_PRIVILEGES_MISMATCH");
  }
}
function quote(name: string, pattern: RegExp): string {
  if (name.length > 63 || !pattern.test(name)) hold("UNSAFE_IDENTIFIER");
  return `"${name}"`;
}
async function dbIdentity(pool: SafetyPool, name: string): Promise<DatabaseIdentity | null> {
  const {rows} = await pool.query(
    `SELECT db.oid::text AS oid, pg_get_userbyid(db.datdba) AS owner,
        db.datdba::text AS "ownerOid", current_user AS principal,
        role.oid::text AS "principalOid"
       FROM pg_database db CROSS JOIN pg_roles role
       WHERE db.datname = $1 AND role.rolname = current_user`,
    [name]);
  if (rows.length > 1) hold("DUPLICATE_DATABASE_CATALOG_ROWS");
  return (rows[0] as DatabaseIdentity | undefined) ?? null;
}
function same(a: SafetyContext, b: SafetyContext): boolean {
  return a.runId === b.runId && a.clusterCertificateSha256 === b.clusterCertificateSha256 &&
         a.signedContextSha256 === b.signedContextSha256 &&
         a.systemIdentifier === b.systemIdentifier && a.roleOid === b.roleOid &&
         a.baseDatabaseOid === b.baseDatabaseOid;
}
export async function createRunDatabase(
  pool: SafetyPool, name: string, pattern: RegExp,
): Promise<CreatedDatabaseReceipt> {
  const context = requireSafetyContext();
  const safeName = quote(name, pattern);
  const slot = slotForDb(name);
  if (slotStates.get(slot)?.state !== "NOT_ATTEMPTED") {
    hold("S2_SLOT_NOT_DURABLY_RESERVED");
  }
  await requireBaseAndRoleIdentity(pool, context);
  if (await dbIdentity(pool, name)) hold("DATABASE_NAME_COLLISION_BEFORE_CREATE");
  // Fsync local attempt receipt BEFORE sending destructive SQL, otherwise STOP.
  journal(context, slot, "CREATE_ATTEMPTED", name);
  try {
    await pool.query(`CREATE DATABASE ${safeName}`);
  } catch (error) {
    journal(context, slot, "CREATE_AMBIGUOUS", name);
    throw new Error("WEB005_CLEANUP_HOLD:S2_CREATE_RESPONSE_UNCONFIRMED", { cause: error });
  }
  let created: DatabaseIdentity | null;
  try { created = await dbIdentity(pool, name); }
  catch(error) {
    journal(context, slot, "CREATE_AMBIGUOUS", name);
    throw new Error("WEB005_CLEANUP_HOLD:S2_POST_CREATE_CATALOG_UNAVAILABLE", {cause:error});
  }
  if (!created || !/^\d+$/.test(created.oid) ||
      created.owner !== created.principal || created.ownerOid !== context.roleOid ||
      created.principalOid !== context.roleOid) {
    journal(context, slot, "CREATE_AMBIGUOUS", name);
    hold("CREATE_SUCCEEDED_BUT_IDENTITY_UNCONFIRMED");
  }
  const evidence = journal(context, slot, "CREATE_CONFIRMED", name, {
    oid: created.oid, owner: created.owner, owner_oid: created.ownerOid,
  });
  const receipt: CreatedDatabaseReceipt = {
    ...context, name, oid: created.oid, owner: created.owner,
    ownerOid:created.ownerOid, slot, createdByRun: true, evidence,
  };
  return receipt;
}
export async function dropRunDatabase(
  pool: SafetyPool, receipt: CreatedDatabaseReceipt | undefined, pattern: RegExp,
): Promise<void> {
  if (!receipt) hold("S2_MISSING_CREATE_RECEIPT_NO_DROP");
  const context = requireSafetyContext();
  if (!receipt.createdByRun || !same(context, receipt)) hold("DROP_CONTEXT_MISMATCH");
  await requireBaseAndRoleIdentity(pool, context);
  const safeName = quote(receipt.name, pattern);
  verifyPersistedEvent(receipt.evidence, {
    event: "CREATE_CONFIRMED",slot:receipt.slot,run_id:context.runId,
    name:receipt.name, oid:receipt.oid,owner_oid:receipt.ownerOid,
    signed_context_sha256:context.signedContextSha256,
  });
  const current = await dbIdentity(pool, receipt.name);
  if (!current || current.oid !== receipt.oid || current.owner !== receipt.owner ||
      current.ownerOid !== receipt.ownerOid || current.principalOid !== context.roleOid) {
    hold("PRE_DROP_OID_OWNER_CLUSTER_MISMATCH");
  }
  // This still requires external certified exclusion of foreign DB writers.
  journal(context, receipt.slot, "DROP_ATTEMPTED", receipt.name,
          {oid:receipt.oid, owner_oid:receipt.ownerOid});
  try {
    await pool.query(`DROP DATABASE ${safeName} WITH (FORCE)`);
  } catch (error) {
    journal(context, receipt.slot, "CLEANUP_HOLD", receipt.name);
    throw new Error("WEB005_CLEANUP_HOLD:S2_DROP_RESPONSE_UNCONFIRMED", {cause:error});
  }
  if (await dbIdentity(pool, receipt.name)) hold("DROP_NOT_CONFIRMED");
  journal(context, receipt.slot, "DROP_CONFIRMED", receipt.name, {oid:receipt.oid});
}
const S1_PATTERN = /^tm_test_[a-f0-9]{32}(?:_(?:rollback|marker_drift))?$/;
function schemaMarker(context: SafetyContext): string {
  return `WEB005_G4:${context.runId}:${context.clusterCertificateSha256}`;
}
async function schemaIdentity(pool: SafetyPool, name: string): Promise<SchemaIdentity | null> {
  const {rows} = await pool.query(
    `SELECT n.oid::text AS oid, pg_get_userbyid(n.nspowner) AS owner,
        n.nspowner::text AS "ownerOid", current_user AS principal,
        role.oid::text AS "principalOid",
        obj_description(n.oid, 'pg_namespace') AS marker
       FROM pg_namespace n CROSS JOIN pg_roles role
       WHERE n.nspname = $1 AND role.rolname = current_user`, [name]);
  if (rows.length > 1) hold("DUPLICATE_SCHEMA_CATALOG_ROWS");
  return (rows[0] as SchemaIdentity | undefined) ?? null;
}
function safeS1Name(name: string, context: SafetyContext): string {
  const main = `tm_test_${context.runId}`;
  if (name !== main && name !== `${main}_rollback` &&
      name !== `${main}_marker_drift`) hold("SCHEMA_OUTSIDE_SIGNED_RUN_NAMESPACE");
  return quote(name, S1_PATTERN);
}
async function requireOwnedSchema(pool: SafetyPool, name: string, ctx: SafetyContext): Promise<SchemaIdentity> {
  const identity = await schemaIdentity(pool, name);
  if (!identity || identity.owner !== identity.principal ||
      identity.ownerOid !== ctx.roleOid || identity.principalOid !== ctx.roleOid ||
      identity.marker !== schemaMarker(ctx) || !/^\d+$/.test(identity.oid)) {
    hold("UNOWNED_SCHEMA_OR_MARKER_COLLISION");
  }
  return identity;
}
export async function createRunSchema(pool: SafetyPool, schema: string): Promise<void> {
  const ctx = requireSafetyContext();
  const safe = safeS1Name(schema, ctx);
  const slot = slotForSchema(schema);
  await requireBaseAndRoleIdentity(pool,ctx);
  if (await schemaIdentity(pool, schema)) hold("SCHEMA_NAME_PREEXISTS");
  journal(ctx, slot, "CREATE_ATTEMPTED", schema);
  try {
    await pool.query(`CREATE SCHEMA ${safe}`);
  } catch(error) {
    journal(ctx, slot, "CREATE_AMBIGUOUS", schema);
    throw new Error("WEB005_CLEANUP_HOLD:S1_CREATE_AMBIGUOUS", {cause:error});
  }
  // Marker characters are strictly generated from validated hex + fixed chars.
  // Failed marker write => CLEANUP_HOLD, never blind rollback/drop.
  try {
    await pool.query(`COMMENT ON SCHEMA ${safe} IS '${schemaMarker(ctx)}'`);
    const owned = await requireOwnedSchema(pool, schema, ctx);
    const evidence = journal(ctx, slot, "CREATE_CONFIRMED",schema, {
      oid:owned.oid,owner:owned.owner,owner_oid:owned.ownerOid
    });
    createdSchemaReceipts.set(schema, {
      ...ctx, schema, oid: owned.oid,owner:owned.owner,ownerOid:owned.ownerOid,slot,evidence
    });
  } catch(error) {
    journal(ctx,slot,"CREATE_AMBIGUOUS",schema);
    throw new Error("WEB005_CLEANUP_HOLD:S1_MARKER_OR_CREATE_RECEIPT_FAILED",{cause:error});
  }
}
export async function resetRunSchema(pool: SafetyPool, schema: string): Promise<void> {
  const ctx = requireSafetyContext();
  safeS1Name(schema, ctx);
  // A fresh signed run must start with an ABSENT schema. Even a same-run
  // leftover may contain a partial committed migration after an error:
  // never auto-reset it and erase diagnostic evidence.
  if (await schemaIdentity(pool, schema)) {
    hold("S1_PREEXISTING_SCHEMA_CLEANUP_HOLD");
  }
  await createRunSchema(pool, schema);
}
export async function dropRunSchema(pool: SafetyPool, schema: string): Promise<void> {
  const ctx = requireSafetyContext();
  const safe = safeS1Name(schema, ctx);
  await requireBaseAndRoleIdentity(pool,ctx);
  const existing = await requireOwnedSchema(pool, schema, ctx);
  const receipt = createdSchemaReceipts.get(schema);
  if (!receipt || receipt.schema !== schema || receipt.oid !== existing.oid ||
      receipt.owner !== existing.owner || receipt.ownerOid !== existing.ownerOid ||
      !same(receipt, ctx)) {
    hold("S1_MISSING_POSITIVE_CREATE_RECEIPT");
  }
  verifyPersistedEvent(receipt.evidence, {
    event:"CREATE_CONFIRMED",slot:receipt.slot,name:schema,run_id:ctx.runId,
    oid:existing.oid,owner_oid:existing.ownerOid,
    signed_context_sha256:ctx.signedContextSha256
  });
  // B01: Traverse all dependency classes from run-owned schema; pg_rewrite,
  // pg_constraint, pg_proc and pg_type are not necessarily pg_class objects.
  // Unclassifiable objects (NULL namespace) count as foreign: fail closed.
  // Physical isolation and exclusive writers remain separate G0/G2 prerequisites.
  const deps = await pool.query(
    `WITH RECURSIVE impacted(classid, objid) AS (
       SELECT 'pg_namespace'::regclass::oid, n.oid
       FROM pg_namespace n WHERE n.nspname=$1
       UNION
       SELECT d.classid, d.objid FROM pg_depend d
       JOIN impacted i ON d.refclassid=i.classid AND d.refobjid=i.objid
     )
     SELECT COUNT(*)::int AS foreign_count
     FROM impacted i
     CROSS JOIN LATERAL pg_identify_object(i.classid, i.objid, 0) obj
     WHERE i.classid <> 'pg_namespace'::regclass::oid
       AND obj.schema IS DISTINCT FROM $1`, [schema]
  );
  if (Number((deps.rows[0] as {foreign_count?:number}|undefined)?.foreign_count ?? -1)!==0) {
    hold("S1_FOREIGN_CASCADE_DEPENDENCY");
  }
  journal(ctx,receipt.slot,"DROP_ATTEMPTED",schema,{oid:existing.oid,owner_oid:existing.ownerOid});
  try{
    await pool.query(`DROP SCHEMA ${safe} CASCADE`);
  } catch(error) {
    journal(ctx,receipt.slot,"CLEANUP_HOLD",schema);
    throw new Error("WEB005_CLEANUP_HOLD:S1_DROP_AMBIGUOUS",{cause:error});
  }
  if (await schemaIdentity(pool, schema)) hold("S1_DROP_NOT_CONFIRMED");
  createdSchemaReceipts.delete(schema);
  journal(ctx,receipt.slot,"DROP_CONFIRMED",schema,{oid:existing.oid});
}

/**
 * Child process env is built from an explicit allowlist, never `...process.env`.
 * Only child URLs to DBs positively created by this run are permitted.
 */
export function sealedFixtureChildEnv(
  additions: Record<string, string>, receipts: readonly CreatedDatabaseReceipt[],
): NodeJS.ProcessEnv {
  const ctx = requireSafetyContext();
  const owned = new Set(receipts.filter(r => r.createdByRun &&
    same(r, ctx)).map(r => r.name));
  const permitted = new Set([
    "DATABASE_URL",
    "SCHEMA_COMPARE_DEVELOPMENT_DATABASE_URL",
    "SCHEMA_COMPARE_PRODUCTION_DATABASE_URL",
    "SCHEMA_COMPARE_EXPECTED_DEVELOPMENT_DATABASE_NAME",
    "SCHEMA_COMPARE_EXPECTED_PRODUCTION_DATABASE_NAME",
    "SCHEMA_COMPARE_EXPECTED_SCHEMA",
  ]);
  if (owned.size === 0) hold("CHILD_NO_CONFIRMED_S2_DATABASES");
  const result: NodeJS.ProcessEnv = {
    PATH: "/usr/local/bin:/usr/bin:/bin",
    HOME: "/tmp/web005/home",
    TMPDIR: "/tmp/web005/tmp",
    XDG_CACHE_HOME: "/tmp/web005/cache",
    XDG_CONFIG_HOME: "/tmp/web005/config",
    XDG_DATA_HOME: "/tmp/web005/data",
    LANG: "C.UTF-8", TZ: "UTC", NODE_ENV: "test",
    WEB005_RUN_ID: ctx.runId,
    WEB005_PG16_CLUSTER_CERT_SHA256: ctx.clusterCertificateSha256,
  };
  for (const [key, value] of Object.entries(additions)) {
    if (!permitted.has(key) || typeof value !== "string") hold("CHILD_FORBIDDEN_ENV_KEY");
    if (key.endsWith("_DATABASE_URL") || key === "DATABASE_URL") {
      let u: URL;
      try { u = new URL(value); } catch { hold("CHILD_INVALID_DSN"); }
      const name = decodeURIComponent(u.pathname.replace(/^\//, ""));
      if (!["postgres:", "postgresql:"].includes(u.protocol) ||
          u.hostname !== "127.0.0.1" || u.port !== "55432" ||
          !owned.has(name)) {
        hold("CHILD_DSN_NOT_OWNED_SCRATCH_DATABASE");
      }
    } else if (key === "SCHEMA_COMPARE_EXPECTED_SCHEMA") {
      if (value !== "public") hold("CHILD_UNEXPECTED_SCHEMA");
    } else if (!owned.has(value)) {
      hold("CHILD_EXPECTED_NAME_NOT_OWNED");
    }
    result[key] = value;
  }
  return result;
}
