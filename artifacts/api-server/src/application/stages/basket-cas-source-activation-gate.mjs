/**
 * WEB005 A50 isolated source gate / authoritative A20 matrix pinned:
 * Git blob e3f49f7abb6ea127f1a7d0fd7e9875f11b61747b.
 * No client-controlled opt-in. Feature cannot activate until A00 separately
 * approves T055/source SQL history and complete parent-lock/ETag obligations.
 * SOURCE-only graph port code may be reviewed/tested without opening the gate.
 */
export const BASKET_CAS_SOURCE_HOLDS = Object.freeze([
  'D03_APPLIED_HISTORY_UNATTESTED',
  'D04_T055_MIGRATION_NOT_ALLOCATED',
  'QUALIFICATION_PROPOSAL_WRITER_PARENT_LOCK_UNPROVEN',
  'ROUTING_EXECUTION_WRITER_PARENT_LOCK_UNPROVEN',
  'ROUTING_PLAN_CHILDREN_SEALED_OR_DIGEST_UNPROVEN',
  'LEGACY_SQL_TRIGGER_PARENT_LOCK_UNPROVEN',
  'PHYSICAL_PG16_TRANSACTION_AND_SERIALIZABLE_UNTESTED',
]);
export function assertBasketCasSourceActivationAllowed() {
  // Intentional constant HOLD; passing a caller-supplied boolean or forged
  // proof record must never activate an unverified CAS writer.
  throw new Error('WEB005_BASKET_CAS_SOURCE_HOLD:' + BASKET_CAS_SOURCE_HOLDS.join(','));
}
