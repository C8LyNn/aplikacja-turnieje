# WEB-005 / SWARM-005 — W6I — A22 Basket CAS Two-Column Migration Safety Contract

**Task:** `WEB-005-W6I-A22-BASKET-CAS-SCHEMA-SAFETY` · **Owner:** A22 (SQL & Migration Safety) · **Priority:** P0  
**Date:** 2026-10-21 · **Mode:** SOURCE/DESIGN REVIEW ONLY; NO SQL, migration file creation/allocation, DB/Docker, PG16 tests, API integration, CI, merge, release or deployment.  
**A00 governing decision:** [Issue #76, comment 6316816901](https://github.com/C8LyNn/aplikacja-turnieje/issues/76#issuecomment-6316816901), specifically CAS-DEC-01..04. **Status:** `TWO_COLUMN_SOURCE_MODEL_CONDITIONAL / D01_D04_EXECUTION_HOLD / MIGRATION_NOT_ALLOCATED`. This is an approval of *model choice*, not DDL/source GO.

## 1. Exact immutable evidence inspected

| Role | Source | Exact SHA / Git blob |
|---|---|---|
| Frozen C03 candidate (unchanged) | [PR #134](https://github.com/C8LyNn/aplikacja-turnieje/pull/134) | commit `80bb4ca7a9a359fbe76dbab1478a1af16ded0174` |
| Existing ORM model | [`lib/db/src/schema/tournaments.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/80bb4ca7a9a359fbe76dbab1478a1af16ded0174/lib/db/src/schema/tournaments.ts) | blob `0fb1a93e2ea99a5944e71ea1e7bc54d4097f60a8` |
| Current stage-basket transaction (not CAS) | [`stage-basket-configuration.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/80bb4ca7a9a359fbe76dbab1478a1af16ded0174/artifacts/api-server/src/application/stages/stage-basket-configuration.ts) | blob `7814928721fb3b3af11ef6960c4944ef96c2d128` |
| A20 selected model / lock design | [PR #144 Basket CAS contract](https://github.com/C8LyNn/aplikacja-turnieje/blob/e01bd761f8d10629b1f2f1a3fbca4a8336647674/docs/web-005/architecture/W6H_A20_BASKET_SERVER_CAS_CONTRACT.md) | commit `e01bd761f8d10629b1f2f1a3fbca4a8336647674`; blob `bd3d8f6e8ba61fedc4438facd0e738f1e14b8edd` |
| A20 final persistence packet | [A20 W6H FINAL decision packet](https://github.com/C8LyNn/aplikacja-turnieje/blob/e01bd761f8d10629b1f2f1a3fbca4a8336647674/docs/web-005/architecture/W6H_FINAL_A20_BASKET_CAS_PERSISTENCE_DECISION_PACKET.md) | blob `b4e2b6f27e961312c111616a7441c83056a5e127` |
| Basket CAS isolated pure source | [PR #146](https://github.com/C8LyNn/aplikacja-turnieje/pull/146) | observed HEAD `16a3e590ff37c4d15ecbfe8e2519fb2547593120` (4 file paths changed; **no schema or migration file in PR** at inspection) |
| D01–D04 owner-gate contract | [A20 R23B decision packet](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/WEB-005_A20_R23B_A00_DECISION_PACKET.md) | blob `1a6475847fe9a7726b0fb8806891098c2ea3abbe` |
| Release/editor migration conflict | [A20 R23D issue #72 preservation](https://github.com/C8LyNn/aplikacja-turnieje/blob/27b902a847f371ae9649b1870362a86a83b8d4da/docs/web-005/agent-reports/A20/WEB-005_A20_R23D_ISSUE72_STEAM_DB_PRESERVATION.md) | blob `b63190678de0792705c2286790bc8efd4c2adcf0` |

Source readback of frozen C03 `lib/db/migrations/` shows 31 numeric SQL files **0001–0031 only**. This is **not** the union of release/editor or a certificate of actual live applied migrations. A00 has selected the model but not authorized a migration number, creation, backfill or release.

## 2. Selected two-column physical + ORM contract — SOURCE MODEL CONDITIONAL

**Canonical storage:** append exactly two fields to **`public.tournaments`**, not a sidecar table:

| Field | PostgreSQL 16 requirement | Drizzle semantic equivalent in future authorized schema PR |
|---|---|---|
| `basket_config_revision` | `BIGINT NOT NULL DEFAULT 0`; named `CHECK(basket_config_revision >= 0)` | `bigint("basket_config_revision", {mode:"bigint"}).notNull().default(0n)` + ORM check |
| `basket_edit_epoch` | `UUID NOT NULL DEFAULT gen_random_uuid()` | `uuid("basket_edit_epoch").notNull().defaultRandom()` |

**Mandatory distinctions:** `basket_flow_authority_version` is already 0/1 and remains unchanged (flow mode); existing `tournament_stages.version`, routing-plan revision, match revision and correction receipts are different identities. CAS revision is **per tournament and independent**; do not borrow, migrate or reset unrelated counters. `BIGINT` is signed 64-bit; all TS/JSON/ETag conversions must treat it as a true bigint or decimal string, not lossy JS Number.

**Compatibility assessment:** selected columns sit on the **same parent `tournaments` row already locked `FOR UPDATE`** by current `replaceStageBasketConfiguration()`. This avoids companion-row creation races. It does NOT prove that all other stage/roster writers acquire the same lock, that existing GET is snapshot coherent, or that PR #146 includes transaction persistence.

**Epoch uniqueness:** PostgreSQL16 core `gen_random_uuid()` returns a random UUIDv4. Generation per row is necessary; formal global uniqueness is *probabilistic*, not established by the column definition. The ETag also binds tournament ID, so a globally unique index on epochs is not necessary for cross-tournament validator separation; require operator verification of non-null fresh epoch per logical clone/restore and unexpected duplicate detection as an anomalous receipt. A copied source epoch/revision in a cloned tournament is always forbidden.

**Schema parity:** future ORM schema and exact SQL migration must match column type/nullable/default/CHECK. A20 packet's illustrative TS does **not** include the CHECK; require explicit ORM named check, otherwise source drift. Verify whether `.defaultRandom()` actually emits the intended PG16 default in the separately authorized schema diff — not an assumption from the proposed declaration. No automatically executed `drizzle-kit push --force` may reconcile these fields in lieu of approved migration.

## 3. D01–D04 are canonical *decisions*, not four migration numbers

A20 R23B identified these as **PENDING_OWNER_APPROVAL**; A00 W6I accepts two-column CAS source **design only**, with D01–D04 migration gate **still HOLD**.

| Gate | Exact R23B semantic requirement | Basket CAS admission criterion | Current decision |
|---|---|---|---|
| **D01 — source DAG identities** | Canonical logical ID, source lineage/commit/path, original filename, Git blob SHA1, UTF-8 SHA256, hard SQL deps vs policy deps for all 14 release/editor migration objects | Determine existing and new migration by **logical IDs/source digests** and reconcile both historical original 0030/0031 pairs; no ordinal-only adoption | `SOURCE_GRAPH_PROPOSED / OWNER_SIGNATURE_PENDING` |
| **D02 — total execution order** | Proposed release-first/editor-second order, distinguish dependency from policy | Preserve immutable applied order; new Basket CAS migration follows accepted necessary predecessors and does not collide with editor or live migration history | `ORDER_POLICY_PROPOSED / OWNER_SIGNATURE_PENDING` |
| **D03 — applied runtime proof** | Independently identified target + catalog/ledger + runner executed-input hash + transaction receipt; do not infer applied from filenames/table existence | Before schema alteration, prove exact physical target and applied logical history; registry must be authoritative for actual deployed database; distinguish `SOURCE_FOUND`/`LEDGER_CLAIM`/`CATALOG_COMPATIBLE`/`ATTESTED_APPLIED` | `RUNTIME_RECEIPTS_MISSING / READ_ONLY_G0_REQUIRED` |
| **D04 — serialized allocator** | **A00-controlled** exclusive numeric prefix, atomic expected-head/lease/version, collision STOP | Maintain logical request `WEB-005-T055-BASKET-CAS-PERSISTENCE-V1` as `REQUESTED_NOT_ALLOCATED` with numeric ID `null` until separate signed owner reservation. Do NOT infer `0032` or `0041`. | `REQUESTED_NOT_ALLOCATED / NO_SQL_GO` |

R23B's **proposed, not approved/executed**, D02 sequence:
```text
0026 (basket trigger bypass) → 0027 → 0028 → 0029 Steam catalog
→ release 0030 correction operations → release 0031 correction receipts
→ editor proposed canonical 0032 Steam abstract world
→ 0033 Steam pagination → 0034 classification revision
→ 0035 trigram → 0036 counters → 0037 import jobs
→ 0038 import job sources → 0039 retry backoff → 0040 throttle
→ [FUTURE A00-ALLOCATED LOGICAL T055 Basket CAS migration; NUMBER UNASSIGNED]
```

**Critical factual collision:** historical editor ORIGINAL `0030_steam_catalog_abstract_world.sql` is **not** release `0030_controlled_correction_operations.sql`; editor ORIGINAL `0031_steam_catalog_pagination_indexes.sql` is **not** release `0031_atomic_correction_receipts.sql`. P05's `0032–0040` are *proposed* remapped filenames that are absent on observed GitHub release, while the Replit local checkpoint and real DB ledger remain unverified. Original release 0031→editor proposed 0032 is an **owner-chosen policy edge**, not a hard SQL dependency. T055 cannot receive a numeric ID while these ambiguities are unresolved. `MAX(numeric_prefix)` is NOT an allocator.

**Where fresh CAS logically fits:** after the reconciled `tournaments` table exists, and after the actually agreed release/editor predecessor set **for each physical target**. The CAS DDL has a direct table dependency on `tournaments`, not a demonstrated direct SQL dependency on Steam catalog `0040`; ordering after the complete accepted stream is a *conservative governance choice*, not an asserted SQL hard dependency. If A00 chooses a different physically reconciled branch, independently approve that explicit order. No new history entries have been written.

## 4. Backfill/expand-contract plan — DESIGN ONLY, NOT A MIGRATION FILE

**Preconditions:** A00-signed D01/D02/D03/D04 outcomes; target identity; immutable pre-deploy snapshot/backup (separate Backup V3 issuer auth, not an unverified data dump); no pending unidentified 0030/0031 collision; accurate ledger with actual committed prior migrations and DB schema postconditions; schema owner and source/runner SHA pinned. **No SQL or connection authorized by this document.**

**Recommended phased, restartable *future* procedure (without issuing runnable SQL):**

1. **Expand under a separately authorized migration:** add both columns initially nullable, without volatile per-row DEFAULT in the first structural step if lock duration/table rewrite is not quantified. This stage must not expose CAS endpoints, and all existing clients remain feature-OFF. Record schema shape before/after; lock timeout/statement timeout and table rewrite risk review by A20/A31. Confirm `gen_random_uuid()` resolves to PG16 core function in the *actual* approved search path; do not assume extension provisioning or use a custom wrapper.
2. **Backfill every preexisting `tournaments` row:** set `basket_config_revision=0` only for uninitialized rows; produce a **fresh random UUID separately for each row**. Do not copy the same constant UUID to all rows, copy a source tournament's epoch, touch `basket_flow_authority_version`, mutate basket graph, create new stages or reset routing. Use a bounded, migration-owned, repeatable backfill receipt with count, zero/NULL inventory, physical target ID and transaction boundary. Do not do an indiscriminate re-run: a partially completed or newly active CAS row must never have its revision/epoch reset.
3. **Concurrent create behavior:** while backfill runs, old app code can still insert tournaments; either hold writes in a separately approved maintenance window or arrange **verified server defaults before concurrent inserts** and a completion sweep. The phased plan **must not permit NULL race rows at final NOT NULL validation**. No CAS traffic or clone/restore with old epoch propagation before completion.
4. **Validate before contract:** server-observed `NULL revision=0` count and `NULL epoch=0` count; all revisions nonnegative, all generated epochs UUID-compatible; no preexisting rows' graph/roster/stage/flow-mode changed. Verify no unexpected duplicate/zero UUID patterns and validate named `CHECK >= 0` in PostgreSQL (note CHECK itself does not imply NOT NULL).
5. **Contract:** install `DEFAULT 0` and `DEFAULT gen_random_uuid()`, verify NOT NULL and validated CHECK, and update Drizzle schema in the **same authorized logical change set**/release choreography; verify effective `INSERT` semantics for new rows and schema compatibility before A50 server source ever reads mandatory values. Consider PG16 `NOT VALID`/VALIDATE for CHECK separately from setting NOT NULL; do not skip validation.
6. **Admit source implementation after schema GO:** parent tournament `FOR UPDATE` acquired first; persistent epoch/revision read under lock; stage/roster/routing canonical digest checked from trusted DB; organizer revalidated in same transaction; reject stale/invalid before mutation; graph/stage/routing/revision modified atomically; increment exactly **one** per accepted PUT, even a same-graph/no-op, overflow ⇒ deny without writes; coherent committed GET/ETag. Existing unguarded route is prohibited once flag enabled. Real writer inventory + negative tests required.
7. **Activation separately after SWARM-006 integration and owner GO:** client/server flags initially OFF; no in-place restore until separate epoch-rotation contract; test both old-reader compatibility and conditional writer, then retire blind writer only with signed feature cutover plan.

**PG16 operational risk:** a **volatile** default, unlike a constant default, can require a full table rewrite/per-row evaluation on `ADD COLUMN`; application-owned table size/lock duration must be measured before selecting direct DDL vs phased expand/backfill/contract. PG16 source references:
- https://www.postgresql.org/docs/16/ddl-alter.html
- https://www.postgresql.org/docs/16/sql-altertable.html
- https://www.postgresql.org/docs/16/functions-uuid.html

**Important race/ABA semantics:** A fresh epoch per row at initial backfill is not enough if an in-place restore is ever allowed. A restore that returns a previously used graph/revision MUST mint a **new epoch** atomically with restore and invalidate prior ETags. Until source/DB contract and actor policy exist, **deny in-place restore**; clone/new tournament must set revision 0 + new epoch regardless of backup metadata.

## 5. Rollback matrix (no destructive automatic SQL)

| Failure point | Allowed recovery intent after separate owner GO | Forbidden shortcut |
|---|---|---|
| Before any schema alteration | Abort, preserve current release/DB/ledger, no DB rollback necessary | Preemptively writing an `APPLIED` ledger entry or assigning a reserved number |
| After nullable expand, **before** CAS activation | Feature OFF; retain both inert columns while investigating; operator can revert application binary independently if old code remains compatible. Resume or forward-fix after schema/ledger reconciliation. | `DROP COLUMN CASCADE` or unconditional table rewrite/clear-all |
| Partial backfill / loss of acknowledgement | `STOP` and reconcile row-level state/ledger; distinguish applied from ambiguous; separately authorized, idempotence-reviewed continuation only for **certified uninitialized rows** | Unconditional "UPDATE all revision=0 / rotate all epochs" |
| CHECK/NOT NULL validation fails | Keep feature OFF, investigate nonconforming rows and DDL lock/transaction evidence; forward-only repaired migration under new owner gate | Silencing validation, modifying `app_schema_migrations` to PASS, or changing the checked SQL bytes |
| After source CAS starts handling accepted PUTs | Keep revision/epoch history. Disable new CAS requests and use signed forward repair; old unconditional PUT cannot be silently re-enabled. | Rolling database back to a stale dump with previously issued ETags or dropping state columns |
| New clone/Backup V3 / proposed in-place restore | Fresh target epoch and revision 0 for clone; source copies may not transplant epoch/revision; refuse in-place restore pending a separately scoped transaction+auth+epoch policy | Clone from older backup with original epoch; treat signed Backup V3 bytes as permission to mutate CAS |
| Failed deployment / release-editor migration collision | Restore application/runtime rollout state without erasing unrelated live Steam extensions; reconcile per-physical DB source+applied history and use new owner-approved forward migration only | Renumber already-applied historical SQL, reapply old 0030/0031 based on ordinal, `down -v`, schema reset |

**General rule:** after any accepted CAS write, **data-destructive reverse migrations of revision/epoch are not a safe rollback** because they invalidate optimistic concurrency semantics. Prefer disabled feature + preserve columns + compensating forward-only repair. A restore from a checkpoint is separately security- and data-integrity-gated and must not replay old validators.

## 6. D01–D04 signed authority, source admission and concrete blockers

**Requested owner decision/record** for logical migration slot:
```yaml
request_id: WEB-005-T055-BASKET-CAS-PERSISTENCE-V1
status: REQUESTED_NOT_ALLOCATED
numeric_migration_id: null
canonical_sql_filename: null
db_ledger_receipt: null
physical_sql_authorized: false
schema_source_authorized: false
owner: WEB-005/A00
```

**A22 must NOT** reserve/create `0041` or any other number; publish executable DDL; amend historical SQL; call PG16; use `drizzle-kit push --force`; modify `lib/db/src/schema/tournaments.ts`; merge/import to C03; perform real tests or G0–G5 self-authorization.

**Required future endorsements:**
- **A00 + A20**: explicitly sign D01–D04 and physical target/order, grant source-specific schema migration authoring separately (not provided by CAS-DEC-01).
- **A20/DB owner/operator**: independently read and attest source identities, actual applied ledger and schema/cluster runtime; lease the exclusive numeric slot before any migration file is written.
- **A50**: implement conditional transactional server adapter only as separately approved source, using existing PR #146 precondition and A20 lock protocol; do not mount routes or use real SQL now.
- **A30/A31/A60**: QA migration+rollback/epoch/clone/privileges and negative cases, notably concurrent tournament create during backfill, failed partial backfill, revision bigint overflow, restore replay and historical migration collision.
- **SWARM-006**: later integrate approved source with current app and separately authorized DB/system/browser testing, never supply missing SWARM-005 server CAS implementation in place of A50.

**A22 W6I findings P0:** (1) D01–D04 source identity and owner signature not completed; (2) release/editor original 0030/0031 collision and proposed 0032–0040 not reconciled with actual physical ledger; (3) no allocated T055 numeric migration; (4) no per-target measured backfill/table rewrite/privilege/rollback receipts; (5) full mutator parent-lock inventory, coherent GET and clone/restore epoch preservation remain unverified and involve A20/A50. All are **open conditions**, not claims of detected runtime data corruption.

**Final:** `W6I_A22_SCHEMA_CONTRACT_DELIVERED / TWO_COLUMN_MODEL_SOURCE_CONDITIONAL / D01_D04_PENDING_OWNER_SIGNOFF / T055_REQUESTED_NOT_ALLOCATED / NO_MIGRATION_SOURCE_GO / SQL_AND_PG16_NOT_RUN / BASKET_CAS_SOURCE_IMPLEMENTATION_READY_FOR_QA_PENDING_A50 / SWARM006_HOLD`.

**Commands/results by A22:** GitHub connector read-only exact SHA/manifest/issue inspections; **0** node/native/SQL/PG16/CI/test commands; **test exit codes N/A**, test TAP SHA256 **N/A**. The only permitted write in this task is this **documentation-only** handoff and GitHub Issue communication.
