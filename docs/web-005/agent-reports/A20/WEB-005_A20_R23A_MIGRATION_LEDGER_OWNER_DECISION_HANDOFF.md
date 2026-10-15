# WEB-005 — A20 / R23A · Migration Ledger Reconciliation Decision Handoff to A00

**Task:** `WEB-005-T020-A20-R23A-MIGRATION-LEDGER` · **Agent:** A20 — PostgreSQL Migration Reconciliation · **Priority:** CRITICAL · **Mode:** DOCS / MIGRATION ARCHITECTURE · **Date:** 2026-10-15 Europe/Warsaw.

## Executive owner verdict

**`LEDGER_RECONCILIATION_READY_FOR_OWNER_DECISION`** — sufficient source evidence and explicit decision alternatives to enable an **A00 architecture / source-graph signoff**. **Not** `MIGRATION_IMPLEMENTATION_GO`: physical PostgreSQL applied-history and full writer/lock graph are unverified; migration identifier is not allocated; no SQL/DDL or runtime tests executed. Release/merge/deploy remain **HARD STOP**.

Distinct statuses (do not conflate):
- **`SOURCE_GRAPH_VERIFIED`:** 14/14 original Git blob SHA-1 and 14/14 independently recomputed UTF-8 SHA-256 match the pinned P05 manifest.
- **`GRAPH_ADOPTION_PENDING_A00`:** proposal explicitly `PROPOSAL_ONLY_NOT_APPROVED`; canonical order and collision policy need owner signoff.
- **`MIGRATION_RESERVATION=REQUESTED_NOT_ALLOCATED`:** logical key `WEB-005-T055-BASKET-CAS-PERSISTENCE-V1`, numeric ID=NULL.
- **`PHYSICAL_PG16_APPLIED_LEDGER=UNKNOWN`:** no live ledger/runner/DDL receipt; file identity != DB execution.
- **`IMPLEMENTATION_SQL_GO=NO`:** no authorized migration/code PR. `SWARM006_HOLD`.

## 1. Published artifacts: exact immutable GitHub links

1. **[Canonical migration graph with 14 full SHA-1 + SHA-256 checksums](https://github.com/C8LyNn/aplikacja-turnieje/blob/74abd89158dacb2eb6d2e92fd48deb4405ee7a30/docs/web-005/agent-reports/A20/WEB-005_A20_R23A_CANONICAL_MIGRATION_GRAPH_PROPOSAL.md)**, committed `74abd89158dacb2eb6d2e92fd48deb4405ee7a30`: source lineage, original and proposed canonical numbers, hard SQL dependencies vs canonical ordering, 0030/0031 collisions, file-vs-executed identity boundary, owner choices.
2. **[T055 logical reservation, 58-file API source-scan writer/deadlock matrix, BigInt/ETag/Backup contract](https://github.com/C8LyNn/aplikacja-turnieje/blob/1ce5a0e9eb11b6a926357d9acfd59f597df4d7a2/docs/web-005/agent-reports/A20/WEB-005_A20_R23A_T055_RESERVATION_WRITER_CONFLICT_MATRIX.md)**, committed `1ce5a0e9eb11b6a926357d9acfd59f597df4d7a2`: full direct DML findings on source-pinned paths, trigger 0027, lock inversion risks, 428/412, ABA, Undo clone-local version requirements and future acceptance.
3. This final handoff, `docs/web-005/agent-reports/A20/WEB-005_A20_R23A_MIGRATION_LEDGER_OWNER_DECISION_HANDOFF.md`, docs-only.

R23 starting point: [R23 CAS/Backup Readiness](https://github.com/C8LyNn/aplikacja-turnieje/blob/4cf3b9f3dd7349287a2cfdefec9dd1be3e816875/docs/web-005/agent-reports/A20/WEB-005_A20_R23_CAS_BACKUP_SCHEMA_READINESS.md).

## 2. Live repository/PR evidence and original SQL dependency boundary

**Release branch** `release/tournament-ops-20261013-01` exactly `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` and **editor branch** `codex/game-catalog-editor-reliability` exactly `28da3ef94f3b30f90c1b3b70a88ab7f61462d99c`, compared IDENTICAL to pinned references. [P05 PR38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38) OPEN DRAFT/UNMERGED, HEAD `2d36864f4d2f1c838073f387fd3c8efb3378c43b`, base release; `manifest.proposal.json` Git blob `28f493263a2cbfb919db1f99b220058175b46ba0`.

- Shared/release `0027_preserve_started_stage_memberships` → `0028_match_revision` → `0029_steam_game_catalog_v1`; correction release `0030_controlled_correction_operations` → `0031_atomic_correction_receipts`.
- Editor **original** `0030_steam_catalog_abstract_world` and **original** `0031_steam_catalog_pagination_indexes` are different source bytes from release original 0030/0031, and proposed to map to canonical 0032/0033; editor original 0032–0038 proposed maps canonical 0034–0040. **The editor 0032 node is only ordered by manifest from shared 0029; a source-order policy must explicitly put it after release 0031 if the sequential total order 0027–0040 is adopted.**
- Release original `0031_atomic_correction_receipts.sql` has embedded `BEGIN; COMMIT;`, and existing migration 0024 has runner-specific strip markers. No autonomous runner transformation, ledger adoption or execution permitted.
- Existing release `lib/db/src/schema/tournaments.ts` defines `app_schema_migrations(migration_key, applied_at, app_commit, target_schema, deployment_environment)`, **not a source checksum**. No physical receipt can be fabricated from its number or from table/constraint existence.

**Additional source-target dependency, distinct from ledger:** [PR55](https://github.com/C8LyNn/aplikacja-turnieje/pull/55) HEAD `c3a4ea00ba933cbab36b3582859cb3eff20f0204` is fail-first CAS test-only. [PR56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) HEAD `a7f71a7e7efdabd479b358a3cee80bc6359c4321` is isolated strict Backup V3 validator with P23-01 system BYE fix, **NOT_WIRED**. A60's earlier defect QA concerned an **older** PR56 SHA; independent post-fix exact-SHA QA is a separate acceptance gate. Neither PR supplies a database migration or an applied CAS counter.

## 3. Decisions needed from A00 — YES/NO/SELECT, no automatic defaults

| Decision | Exact A00 required answer | Default before signed selection |
|---|---|---|
| **A00-D01 — canonical graph** | Ratify OR reject the **14 identity mappings with pinned Git SHA-1 and SHA-256** in graph report, including collision separation of release/editor original 0030/0031 and original editor 0032–0038 → proposed 0034–0040. Name A00 reviewer and approved graph version. | `PROPOSAL_ONLY_NOT_APPROVED` |
| **A00-D02 — total order** | Explicitly choose release correction chain 0030→0031 *before* editor abstract world canonical 0032, or an alternative graph with complete nonconflicting edges and unique canonical identities. State whether all 14 belong in one future runner lane. | `NO_TOTAL_ORDER_GO` |
| **A00-D03 — historical execution evidence** | Select authoritative target DB environments/schemas/owner, required read-only system-catalog+legacy-ledger+runner receipt sources, unknown/orphan/partial/duplicate policy, checksum mismatch STOP and prohibition on automatic adoption. | `DB_EXECUTION_UNKNOWN / NO_ADOPTION` |
| **A00-D04 — allocator authority** | Name exclusive migration-number/manifest allocator and serialized reservation registry; assign **logical** request key `WEB-005-T055-BASKET-CAS-PERSISTENCE-V1` state `REQUESTED_NOT_ALLOCATED`; explicitly defer actual number until D01–D03 and competing PR check. | `NO_NUMBER_ALLOCATED` |
| **A00-D05 — DB writer scope** | Approve a complete DB trigger and all-writer audit (legacy `0027` compat trigger, API stage/roster/routing/qualification/Undo/Backup and PG functions); choose **parent-first mutation protocol** or explicitly reviewed safe equivalent, with strict monotonic bump and deadlock/retry plan. | `TRIGGER_AND_LOCK_GRAPH_NOT_APPROVED` |
| **A00-D06 — CAS ETag/epoch and rollback** | Confirm lossless `BIGINT`, strong tenant/generation-bound ETags (fresh clone identity), exact invalidation scope (stage/roster/graph, conditional output), 428/412+zero writes, no ABA and bounded fail-closed recovery. Approve non-destructive rollback and forward repair. D1–D6 product policy already approved; this is technical execution scope. | `DESIGN_NOT_IMPLEMENTATION_GO` |
| **A00-D07 — Backup/Undo integration** | Confirm B1–B6 approved policy is implemented in a **separately authorized** strict exporter/importer wiring; `0028 matches.revision` state CAS remains distinct from result_history revision and basket version; system BYE non-undoable and legal V2/V3 degraded Undo supported; no source ETag/token transplanted into clone. | `NOT_WIRED / QA_PENDING` |
| **A00-D08 — future PR scope** | Issue an explicit narrow **new migration+ORM+test code GO** on a protected branch, unique number only after allocator approval; name A20/A50/A60 responsibilities, immutable baseline and file ownership. | `NO_PR_GO` |
| **A00-D09 — isolated PG16 runtime** | Provision independently owner-certified physically disposable PG16, signed nonsecret cluster/DB/role/schema allowlist and **read-only catalog scope first**; separately authorize destructive test-only `tm_test_*` reset on exact disposable target and fixture runner. | `PG16_NOT_EXECUTED / SQL_STOP` |
| **A00-D10 — independent acceptance and deployment** | Require real A50 PG16 TAP/exit and A60 exact migration SHA review plus legacy/backups/race/rollback/forward repair evidence before any later merge or deployment; authorize final handoff separately. | `RELEASE_NO_GO / SWARM006_HOLD` |

**A00 can take D01–D04 now based on documentary source evidence. D05–D10 require separate technical/code/physical approvals and evidence.** Never imply that selecting a policy in R21 authorizes SQL execution.

## 4. Minimal future migration PR — ordered source-only *plan* (NOT CREATED)

**Prerequisite:** A00 signs D01–D04, resolves historical ledger source graph and allocates a unique global migration number; D05/06 architecture plus dedicated PG16 test authorizations follow separately. Future branch from A00-pinned release/integration baseline; **no cherry-pick of other PRs** and no modification of 0027–0031 or editor originals.

**Future PR title proposal:** `[WEB-005 T055] Add server-owned persistent basket CAS revision (isolated migration)`.

**Strict file allowlist (future, not written now):**

| Future path | Required change | Constraints |
|---|---|---|
| `lib/db/migrations/<A00_ALLOCATED_ID>_basket_config_revision.sql` | One reviewed additive forward migration: `tournaments.basket_config_revision BIGINT NOT NULL DEFAULT 1`, positive constraint, server-owned monotonic guard + owner-selected invalidation function/triggers or strict parent-first writer boundary; optional generation/epoch with signed schema rationale | **Placeholder, NOT a filename and NOT a numeric allocation**. Pin raw UTF-8 SHA-256/Git blob, predecessor receipt, executable input/transaction transform, exact SQLSTATE rollback and catalog postconditions. |
| `lib/db/src/schema/tournaments.ts` | Drizzle schema counterpart as **lossless bigint mode**; optional generation if signed; guard against unsafe client-controlled mutation | No unrelated schema drift; migration/postcondition parity test |
| `artifacts/api-server/test/tournament-basket-config-revision.postgresql.integration.test.ts` (proposed new file) | Fail-first PG16 column/default/guard, stage/roster/graph transaction bump, trigger recursion/lock order, A→B→A, signed D1 invariants, rollback/late failure, precision >2^53, per-tournament clone version | **NOT a currently existing test**. MUST be physically isolated, scoped, and explicit reset GO |
| `docs/web-005/migration-ledger/<APPROVED_IDENTITY_RECORD>.md` (proposed new file) | Authorized immutable reservation+original provenance+checksum+approved total-order edges and execution procedure/status `RESERVED_NOT_APPLIED` | Separate from PR38 unapproved manifest; **no claim of applied SQL** |

**Explicit out-of-scope for the future migration PR:** changing PR38 source-only validator history, rewriting 0027/0028/0030/0031 originals, PR55 test-only head without coordination, changing PR56 pure strict validator, **actual** T055 API/Host/UI If-Match code, Backup B2–B6 exporter/importer wiring, data import actions or production deployment. These need **separate** source branches/PRs and exact-SHA QA.

**Implementation sequence after future distinct GO:**
1. Reserve actual unique migration key in signed allocator, freeze source graph and PG16 preconditions.
2. First add failing DB tests for BIGINT precision, FK/trigger/stage-compat behavior, double-write monotonicity, abort/rollback; run only in certified test DB. A prepared test case is not a PASS.
3. Implement additive schema + ORM + minimal audited guard/invalidation. Do not rely on a child-trigger touching the parent if prior child-first writers would deadlock; bring writers under common parent-first protocol or defer trigger and **do not enable CAS endpoint**.
4. Run read-only catalog/schema signature and authorized dedicated PG16 DDL test; pin executed-input/runner checksum and verify row defaults, null/constraint/trigger function grants, transitive lock/reentry, partial failure and idempotency under the approved runner. Verify historical fixtures F0/F1 `0001–0028`, full release F2 `0001–0031`, and approved editor graph if relevant, not accidentally treating F1 as F2.
5. Independently review and sign migration PR exact SHA (A60), only then allow separate API/UI strict CAS change and Backup strict wiring; no protected integration/merge without explicit coordinator authorization.

## 5. PG16 acceptance / rollback / forward-repair test matrix — future conditional only

| Test | Setup on *approved disposable* PG16 | Mandatory oracle |
|---|---|---|
| Identity | F0 empty and F1 0001–0028 vs full release F2 0001–0031, editor/mixed only when graph ratified | Abort missing predecessor, orphan/duplicate checksum; no production/shared SQL |
| Schema | Add column to disposable replica with existing tournament data | `bigint`, default 1, NOT NULL, positive guard, no unexpected data rewrite/metadata loss; stable clone generation |
| Monotonicity | Two authorized writers, committed ABA A→B→A, triggered child updates and >2^53 test input in isolated fixture | Per-tournament strictly increasing token and lossless serialization; never reuse old ETag |
| Parent-lock race | Deterministic barriers: CAS PUT vs same CAS PUT / roster CSV / stage start / Undo / qualification | One winner; stale 412 zero writes; missing 428; no child-parent deadlock, retries bounded; same-snapshot GET |
| Partial-failure rollback | Inject error after graph DELETE but before reINSERT; error after trigger bump; duplicate FK/unique fault | Aborted transaction restores graph, stage versions, roster, routing plan and basket revision; no partial clone |
| Backup strict+legacy | Valid strict played + completed system BYE `system_bye_assigned`, NC/walkover; genuinely legacy V2/V3, forged marker, foreign nested Undo IDs, late clone SQL error | Strict source revision separate from history revision; modern rejects invalid preclone 400/zero writes; legal legacy safely restores with restricted Undo; failure aborts all clone rows and CAS version |
| Migration down/repair | Feature activation interrupted or migration catalog partially applied in disposable target | No silent decrement/reseed/downgrade; additive column preserved when feasible; authoritative forward-only repair with approved new migration+checksum. A blind DROP COLUMN is **not** a safe post-activation rollback. |
| Observability | Repeat with a simulated owner-authorized physical ledger receipt and checksum mismatch | Captures PG16 version, certified instance/DB/schema, immutable code/runner/input checksum, exit/TAP, postcondition/transaction proof, redacted secrets; unknown receipts STOP |

**Rollback:**
- **Before activation:** stop rollout; retain additive safe column and prior-compatible reads, do not permit unconditional PUT once signed CAS cutover starts. Revert only unactivated code/config through approved release process.
- **After activation:** never decrement or reset existing `basket_config_revision` and never silently allow old unconditional clients. Block writes/restore as needed, repair via new separately reviewed forward migration, preserve or rotate tenant-local epoch only under explicit invalidation plan.
- **During migration transaction:** PG16 test proves rollback of column/guard/trigger partial failure using the exact runner and explicit BEGIN/COMMIT policy. Embedded source 0031 `BEGIN/COMMIT` must not be naively double-wrapped; runner executes only after source+transform proof.
- **Restore:** clone-local version and Undo/action IDs must roll back on late failure, source ETags never authorize writes to restored instance.

**Safety:** `artifacts/api-server/test/test-database.ts` (blob `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6`) actually **DROP SCHEMA CASCADE** for `TEST_DATABASE_SCHEMA=tm_test_*`, despite string checks. A00 must separately certify *physical* isolation and authorize exact reset boundary; no `DATABASE_URL` fallback. Opt-in tests that `DROP public` are excluded. The current A20 environment did **not** access PG16 or run test/SQL.

## 6. Final explicit GO/STOP and handoff

| Gate | Current result | Next owner |
|---|---|---|
| Source content SHA-1 + SHA-256 of 14 originals | `14/14 PASS / 14/14 PASS` in R23A | A00 may ratify source graph |
| Original 0030/0031 release-editor collisions | Fully identified, canonical mapping documented, **not adopted** | A00 decides D01/D02 |
| Applied DB history | No read-only physical DB receipt | A00 selects evidence policy and host D03/D09 |
| CAS logical reservation | `REQUESTED_NOT_ALLOCATED`; no filename, no numeric key | A00 exclusive allocator D04 |
| Writer source inventory | 58 TS inspected, DB trigger 0027 identified; unknown PG functions and extra writers remain | A00 approves full scan D05 |
| T055/Backup technical contract | Proposed BIGINT/ETag/ABA/428/412, clone match-history CAS separation | A00 technical design D06/D07 |
| Future migration code & tests | Not created or run | A00 separate D08/D09, A50 tests, A60 QA |
| Production SQL/DDL, merge, deploy, SWARM-006 | **HARD STOP** | A00/HQ only through separate future gates |

**One next action now:** A00 signs a **source-graph+total-order+evidence/allocator architectural decision** D01–D04, explicitly maintaining numeric reservation `UNASSIGNED` until physical ledger facts are inspected. Only after those signatures can a separate narrow migration code GO be considered. Do **not** authorize SQL merely because this documentation is ready.

**Final verdict:** `WEB-005-T020-A20-R23A-MIGRATION-LEDGER / LEDGER_RECONCILIATION_READY_FOR_OWNER_DECISION / SQL_NOT_EXECUTED / PG16_NOT_EXECUTED / MIGRATION_ID_UNASSIGNED / RELEASE_NO_GO / SWARM006_HOLD`.
