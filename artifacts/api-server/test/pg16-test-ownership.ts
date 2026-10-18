/**
 * WEB-005 R23H-R5 Variant B: fixture-only SQL ownership guards.
 * No SQL runs on module import. The source-side marker is NOT independent
 * authentication: external signed G4 physical identity and exclusive writer
 * attestation are indispensable before execution.
 */
export interface SafetyPool {
  query(text: string, values?: unknown[]): Promise<{ rows: unknown[]; rowCount: number | null }>;
}
export interface SafetyContext { runId: string; clusterCertificateSha256: string }
export interface CreatedDatabaseReceipt extends SafetyContext {
  name: string; oid: string; owner: string; createdByRun: true;
}
interface DatabaseIdentity { oid: string; owner: string; principal: string }
interface SchemaIdentity { oid: string; owner: string; principal: string; marker: string | null }
interface SchemaReceipt extends SafetyContext { schema: string; oid: string; owner: string }
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
  const runId = env.WEB005_RUN_ID ?? "";
  const clusterCertificateSha256 = env.WEB005_PG16_CLUSTER_CERT_SHA256 ?? "";
  if (!/^[a-f0-9]{32}$/.test(runId) || !/^[a-f0-9]{64}$/.test(clusterCertificateSha256)) {
    hold("SIGNED_G4_RUN_AND_CLUSTER_CERT_REQUIRED");
  }
  return { runId, clusterCertificateSha256 };
}
function quote(name: string, pattern: RegExp): string {
  if (name.length > 63 || !pattern.test(name)) hold("UNSAFE_IDENTIFIER");
  return `"${name}"`;
}
async function dbIdentity(pool: SafetyPool, name: string): Promise<DatabaseIdentity | null> {
  const {rows} = await pool.query(
    `SELECT oid::text AS oid, pg_get_userbyid(datdba) AS owner,
        current_user AS principal FROM pg_database WHERE datname = $1`,
    [name]);
  if (rows.length > 1) hold("DUPLICATE_DATABASE_CATALOG_ROWS");
  return (rows[0] as DatabaseIdentity | undefined) ?? null;
}
function same(a: SafetyContext, b: SafetyContext): boolean {
  return a.runId === b.runId && a.clusterCertificateSha256 === b.clusterCertificateSha256;
}
export async function createRunDatabase(
  pool: SafetyPool, name: string, pattern: RegExp,
): Promise<CreatedDatabaseReceipt> {
  const context = requireSafetyContext();
  const safeName = quote(name, pattern);
  if (await dbIdentity(pool, name)) hold("DATABASE_NAME_COLLISION_BEFORE_CREATE");
  // If CREATE fails or its response is ambiguous, no DROP receipt is produced.
  emit("S2_CREATE_ATTEMPTED", { name });
  try {
    await pool.query(`CREATE DATABASE ${safeName}`);
  } catch (error) {
    emit("S2_CREATE_FAILED_OR_AMBIGUOUS", { name });
    throw new Error("WEB005_CLEANUP_HOLD:S2_CREATE_RESPONSE_UNCONFIRMED", { cause: error });
  }
  const created = await dbIdentity(pool, name);
  if (!created || !/^\d+$/.test(created.oid) || created.owner !== created.principal) {
    hold("CREATE_SUCCEEDED_BUT_IDENTITY_UNCONFIRMED");
  }
  const receipt: CreatedDatabaseReceipt = {
    ...context, name, oid: created.oid, owner: created.owner, createdByRun: true,
  };
  emit("S2_CREATE_CONFIRMED", { name, oid: created.oid, owner: created.owner });
  return receipt;
}
export async function dropRunDatabase(
  pool: SafetyPool, receipt: CreatedDatabaseReceipt | undefined, pattern: RegExp,
): Promise<void> {
  if (!receipt) hold("S2_MISSING_CREATE_RECEIPT_NO_DROP");
  const context = requireSafetyContext();
  if (!receipt.createdByRun || !same(context, receipt)) hold("DROP_CONTEXT_MISMATCH");
  const safeName = quote(receipt.name, pattern);
  const current = await dbIdentity(pool, receipt.name);
  if (!current || current.oid !== receipt.oid ||
      current.owner !== receipt.owner || current.principal !== receipt.owner) {
    hold("PRE_DROP_OID_OWNER_MISMATCH");
  }
  // Guard+DROP is NOT atomic against untrusted third-party DB writers.
  emit("S2_DROP_ALLOWED", { name: receipt.name, oid: receipt.oid, owner: receipt.owner });
  await pool.query(`DROP DATABASE ${safeName} WITH (FORCE)`);
  if (await dbIdentity(pool, receipt.name)) hold("DROP_NOT_CONFIRMED");
  emit("S2_DROP_CONFIRMED", { name: receipt.name, oid: receipt.oid, owner: receipt.owner });
}
const S1_PATTERN = /^tm_test_[a-f0-9]{32}(?:_(?:rollback|marker_drift))?$/;
function schemaMarker(context: SafetyContext): string {
  return `WEB005_G4:${context.runId}:${context.clusterCertificateSha256}`;
}
async function schemaIdentity(pool: SafetyPool, name: string): Promise<SchemaIdentity | null> {
  const {rows} = await pool.query(
    `SELECT n.oid::text AS oid, pg_get_userbyid(n.nspowner) AS owner,
        current_user AS principal, obj_description(n.oid, 'pg_namespace') AS marker
       FROM pg_namespace n WHERE n.nspname = $1`, [name]);
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
      identity.marker !== schemaMarker(ctx) || !/^\d+$/.test(identity.oid)) {
    hold("UNOWNED_SCHEMA_OR_MARKER_COLLISION");
  }
  return identity;
}
export async function createRunSchema(pool: SafetyPool, schema: string): Promise<void> {
  const ctx = requireSafetyContext();
  const safe = safeS1Name(schema, ctx);
  if (await schemaIdentity(pool, schema)) hold("SCHEMA_NAME_PREEXISTS");
  await pool.query(`CREATE SCHEMA ${safe}`);
  // Marker characters are strictly generated from validated hex + fixed chars.
  // Failed marker write => CLEANUP_HOLD, never blind rollback/drop.
  await pool.query(`COMMENT ON SCHEMA ${safe} IS '${schemaMarker(ctx)}'`);
  const owned = await requireOwnedSchema(pool, schema, ctx);
  createdSchemaReceipts.set(schema, { ...ctx, schema, oid: owned.oid, owner: owned.owner });
  emit("S1_CREATE_CONFIRMED", { schema, oid: owned.oid, owner: owned.owner });
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
  const existing = await requireOwnedSchema(pool, schema, ctx);
  const receipt = createdSchemaReceipts.get(schema);
  if (!receipt || receipt.schema !== schema || receipt.oid !== existing.oid ||
      receipt.owner !== existing.owner || !same(receipt, ctx)) {
    hold("S1_MISSING_POSITIVE_CREATE_RECEIPT");
  }
  emit("S1_DROP_ALLOWED", { schema, oid: existing.oid, owner: existing.owner });
  await pool.query(`DROP SCHEMA ${safe} CASCADE`);
  if (await schemaIdentity(pool, schema)) hold("S1_DROP_NOT_CONFIRMED");
  createdSchemaReceipts.delete(schema);
  emit("S1_DROP_CONFIRMED", { schema, oid: existing.oid, owner: existing.owner });
}
