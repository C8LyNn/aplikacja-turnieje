# WEB-005 / R23D / A20 — Issue #76 D01–D04 owner migration/Backup/CAS gates

**Task:** [GitHub Issue #76](https://github.com/C8LyNn/aplikacja-turnieje/issues/76), A20 subset; R23D A00 owner dispatch 2026-10-16.  
**Mode:** ARCHITECTURE FREEZE / SOURCE READ-ONLY / NO OWNER PROXY APPROVAL.  
**Current disposition:** `D01_D04_PENDING_OWNER_APPROVAL / MIGRATION_NUMBER_UNALLOCATED / BACKUP_TRUST_POLICY_SEPARATE_OWNER_GATE / CAS_BACKEND_GO_NOT_GRANTED / PG16_NOT_EXECUTED / RELEASE_NO_GO`.

## Exact authority verification and status

- Authoritative A20 [R23B A00 DECISION PACKET](https://github.com/C8LyNn/aplikacja-turnieje/blob/2401cdcadba8ebe808fb38d461d856b0726e0f38/docs/web-005/agent-reports/A20/WEB-005_A20_R23B_A00_DECISION_PACKET.md), and [R23C execution gate](https://github.com/C8LyNn/aplikacja-turnieje/blob/3b7750df99672287eafaf199ac04667d87c9c7d7/docs/web-005/agent-reports/A20/WEB-005_A20_R23C_MIGRATION_ARCHITECTURE_EXECUTION_GATE.md).
- At R23D verification, [central `docs/web-005/DECISIONS.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/DECISIONS.md) Git blob `f90a2f1dfabfce4e288d472839265a22ee7bad64`: D005 remains **CONCEPTUAL GO FOR FIXTURE DESIGN ONLY / IMPLEMENTATION STOP**. No specific signed R23B D01–D04 choice found in inspected central branch, owner packet, Issue #76 (0 comments), Issue #72 (0 comments), or PR #38 discussion. **A00/HQ may have an unlinked decision elsewhere; not presumed signed**. A20 cannot approve on their behalf.
- P05 [PR #38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38) HEAD `2d36864f4d2f1c838073f387fd3c8efb3378c43b`, OPEN DRAFT, source-only `manifest.proposal.json` status `PROPOSAL_ONLY_NOT_APPROVED`.
- [R23D A20 issue #72 evidence](https://github.com/C8LyNn/aplikacja-turnieje/blob/27b902a847f371ae9649b1870362a86a83b8d4da/docs/web-005/agent-reports/A20/WEB-005_A20_R23D_ISSUE72_STEAM_DB_PRESERVATION.md): GitHub release advanced to `1db3734b8988940acc6be8b992420a58fc39624a` by a game/UI-only commit (23 changed paths), **no DB migration changes**; release present 0027–0031, proposed canonical editor 0032–0040 absent; editor original 0030–0038 hashes 9/9 matched. The local Replit checkpoint `cb55335...` and actual DB ledger remain **NOT ATTESTED**. Do not use GitHub absence to claim Replit lack or migration execution failure.
- PR #55 `c3a4ea00ba933cbab36b3582859cb3eff20f0204` (test-only Basket CAS) and PR #56 `a7f71a7e7efdabd479b358a3cee80bc6359c4321` (isolated NOT_WIRED strict Backup validator) OPEN DRAFT/UNMERGED; neither grants server CAS/schema activation.

## D01–D04: EXACT A00/HQ owner signature packet

| Decision | A20 recommended option | Scope that may be approved NOW | Risk / evidence boundary | Signed real owner choice |
|---|---|---|---|---|
| **D01 — source identities** | `APPROVE_SOURCE_GRAPH_ONLY` | Approve the 14 distinct immutable source identities, raw SHA-1/SHA-256 and release/editor original 0030/0031 conflict split from R23A graph. | 14/14 Git SHA verified R23D against release/editor trees; P05 manifest is unapproved; source identity != PostgreSQL apply receipt; Replit local originals unknown. | **`PENDING_OWNER_APPROVAL`** |
| **D02 — total order** | `RELEASE_FIRST_EDITOR_SECOND` | Proposed order 0027→0028→0029→**release** 0030→0031→proposed editor canonical 0032…0040. | `release 0031 -> editor 0032` is a **policy ordering edge**, not an editor SQL hard dependency; editor abstract world depends on Steam base 0029. Existing Replit DB may have executed original editor 0030–0038 already. | **`PENDING_OWNER_APPROVAL`** |
| **D03 — execution evidence** | `SOURCE_AND_RUNTIME_RECEIPT_REQUIRED` with unknown/mismatch STOP | Define owner-approved read-only physical instance attestation, actual ledger + catalog and independent exact runner executed-input/transaction logs, per source/target schema. | No SQL/PG connection; GitHub/release tree hashes cannot attest Replit execution. Production/live read requires its **own** specific authorization; physical disposable PG16 test access separate. | **`PENDING_OWNER_APPROVAL`** |
| **D04 — single serialized allocator** | `A00_CONTROLLED_SERIALIZED_ALLOCATOR` | Exclusive versioned registry/owner, collision checks across all open branches, expected-HEAD/atomic PR reservation and audit trail; currently logical-only request. | Source graph not adopted, actual ledger unknown, editor canonical 0032–0040 only proposal; never infer unused numeric prefix via MAX(). | **`PENDING_OWNER_APPROVAL`** |

**Exact logical reservation to preserve:**

```yaml
request_id: WEB-005-T055-BASKET-CAS-PERSISTENCE-V1
status: REQUESTED_NOT_ALLOCATED
numeric_migration_id: null
canonical_filename: null
owner_signature: null
postgres_execution_receipt: null
```

**Owner acknowledgment required:** A00/HQ issues an independently signed D01–D04 record with precise selected options, scope (documentation only), date, approver identity, source graph SHA, residual risks, and explicit HOLD for SQL/number/deploy. Until then: **NO migration number and NO migration implementation**. Later numeric allocation needs separate authorization *after* independently verified target history.

## Owner-separated Backup V3 and Basket CAS backend decisions

**Do not expand A20 into A30/A90 security or A110 frontend ownership.** A20 can state PostgreSQL preconditions:

1. **Backup trust:** A00/HQ with A30 and A90 decides authenticated issuer/attestation, strict marker/version and anti-downgrade, legal V2/V3 with restricted legacy Undo/Revert, and failure behavior. A source-only PR56 parser is NOT an authenticated end-to-end exporter/importer; no trust or physical restore PASS. **Owner trust policy pending in Issue #76**. Unauthenticated backup must not import elevated actor/Undo CAS authority.
2. **Revision distinction:** `lib/db/migrations/0028_match_revision.sql` contains `public.matches.revision` (match-state revision), separate from `result_history.revision` (event sequence) and future `tournaments.basket_config_revision` BIGINT. Future strict match-state provenance must be mapped to **fresh clone-local version authority**. Never transplant source tournament ETag, action IDs, organizer tokens or stale Undo condition into clone; fail closed on unknown nested identifiers.
3. **Basket server persistence:** Owner-approved *product* D1–D6 requires monotonic persisted `basketConfigRevision`, GET strong ETag, PUT `If-Match` with missing 428 / stale 412 (zero writes), parent-first `tournaments FOR UPDATE` and exhaustive stage/roster/graph invalidation; retain client draft on 412. **Implementation/code/SQL GO is NOT granted** by product-policy record.
4. **Writer conflict:** release `0027_preserve_started_stage_memberships.sql` compatibility triggers may mutate stage membership indirectly, so inserting child→parent revision bump without locking contract creates possible lock inversion/deadlock. Review every writer and trigger before schema activation. Existing [A20 R23A writer matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/1ce5a0e9eb11b6a926357d9acfd59f597df4d7a2/docs/web-005/agent-reports/A20/WEB-005_A20_R23A_T055_RESERVATION_WRITER_CONFLICT_MATRIX.md) audits 58 TypeScript modules only; unknown raw SQL/physical trigger graph remains.
5. **Exporter/restore rollout:** restore legacy under approved degraded Undo, preclone error 400 without writes, late DB error full clone/action/lock rollback. Actual live Steam migrations or backup schema must be preserved, not silently adopted or reset. Refuse optimistic server cutover when present DB schema/runner history unknown.

## Implementable follow-up graph, **NOT executed**

| Gate | Owner | Next permitted action **after separately signed GO** | STOP now |
|---|---|---|---|
| G0 D01–D04 | A00/HQ | Sign specific four documentary choices and freeze authoritative ledger graph+allocator policy | Pending |
| G1 live/Replit source reconciliation | A00 + A20/A30 | Supply real 140-path local manifest + unredacted hashes *privately*, approved readable source provenance, per-target schema/ledger read-only permission and operator; preserve currently published instance | Snapshot inaccessible to A20 |
| G2 isolated PG16 | A00 + A50/A60 | Independently certify disposable PG16 and read-only observer; under separate authorizations execute [12 catalog SELECTs](https://github.com/C8LyNn/aplikacja-turnieje/blob/ee25edb9a6296e256005d477d3d5fadfa1d1859d/docs/web-005/agent-reports/A20/WEB-005_A20_R23C_PG16_CATALOG_SELECT_ONLY.sql), then [3 ledger SELECTs](https://github.com/C8LyNn/aplikacja-turnieje/blob/640113a78a04b730f6333caf9882deb1bfbcb7e3/docs/web-005/agent-reports/A20/WEB-005_A20_R23C_PG16_LEDGER_SELECT_ONLY.sql) on **owner-certified test schema only**; compare to external runner receipts. | All SELECTs NOT_EXECUTED |
| G3 migration reserve | A00 exclusive allocator | Check all numeric/logical ID conflicts, assign unique number via serialized owner-reviewed change only **after** G0–G2 and separate number GO | REQUESTED_NOT_ALLOCATED |
| G4 Basket/Backup code | A00 code lane, A110/A90/A30/A20 | Separate test-first exact-file PRs, dedicated migration+Drizzle, server CAS & strict trust wiring, A60 source QA | No code GO |
| G5 mutating test and merge/release | A00/A50/A60/HQ | Exact disposable PG16 target + second reset/DDL GO, race/rollback/legacy/Steam preservation QA, then separate integration/release/HQ decision | No PG reset/DDL/merge/live |

**Exact requested A00 reply:** `D01=<SELECTED|DEFER>; D02=<SELECTED|DEFER>; D03=<SELECTED|DEFER>; D04=<SELECTED|DEFER>; signoff_URL=...; physical_ledger_read_GO=<SEPARATE>; allocated_T055_number=NULL`. These placeholders are a decision request, NOT signatures.

**Issue #76 A20 conclusion:** `D01_D04_PENDING_OWNER_APPROVAL / BACKUP_TRUST_PENDING_OWNER_SECURITY / CAS_SERVER_IMPLEMENTATION_GATED / PG16_NOT_EXECUTED / NO_SQL / SWARM006_HOLD`. No app/game changes, no runtime access, no merge/deploy.
