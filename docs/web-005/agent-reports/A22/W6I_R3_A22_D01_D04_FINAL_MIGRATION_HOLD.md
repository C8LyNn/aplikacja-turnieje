# WEB-005 / SWARM-005 — A22 W6I-R3 — FINAL D01–D04 MIGRATION SAFETY DISPOSITION

**Task:** `WEB-005-W6I-R3-A22-D01-D04-CLOSEOUT` · **Owner:** A22 — SQL & Migration Safety · **Priority:** P0.  
**Date:** 2026-10-21 · **Mode:** role-scoped, independent, read-only SOURCE REVIEW; documentation publication only.  
**A00 authorization:** [Issue #76, decision 6325249159](https://github.com/C8LyNn/aplikacja-turnieje/issues/76#issuecomment-6325249159): do **not** invent a migration number; absent authenticated physical history ⇒ precise HOLD; no schema authoring/SQL/PG16.  
**Verdict:** **`CONDITIONAL`** for the selected two-column source model and documentary migration graph; **`BLOCKED`** for canonical SQL migration source GO, assigning T055 an ordinal, backfill, rollback execution and physical PG16 activation. No schema/migration/PG16/test authorization is granted by this report.

## 1. Immutable evidence inspected — no repeat of accepted QA

| Artifact | Pinned exact Git commit / Git blob | Evidence type |
|---|---|---|
| Frozen C03 [PR #134](https://github.com/C8LyNn/aplikacja-turnieje/pull/134) | **`80bb4ca7a9a359fbe76dbab1478a1af16ded0174`** | Existing schema/migration source, not a deployed DB certificate |
| [C03 `tournaments.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/80bb4ca7a9a359fbe76dbab1478a1af16ded0174/lib/db/src/schema/tournaments.ts) | blob `0fb1a93e2ea99a5944e71ea1e7bc54d4097f60a8` | Current `basket_flow_authority_version` is a 0/1 flow mode, not CAS revision; **two CAS columns absent** |
| A20 [PR #144](https://github.com/C8LyNn/aplikacja-turnieje/pull/144) | HEAD **`05dffa9d85c757675eb7bc8dd548f90f1adb1cdc`** | Documentation-only CAS schema+writer contract; not a migration |
| A50 [PR #146](https://github.com/C8LyNn/aplikacja-turnieje/pull/146) | observed HEAD **`fae8a91feae13e779b7c27baa7452df725d370a2`** | Isolated injected adapter. A60 18/18 native DB-free PASS, A30 source SECURITY_CONDITIONAL; **no applied schema** |
| P05 [PR #38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38), `manifest.proposal.json` | PR HEAD **`2d36864f4d2f1c838073f387fd3c8efb3378c43b`**; blob **`28f493263a2cbfb919db1f99b220058175b46ba0`** | 14 source identities and proposed remap; manifest status exactly `PROPOSAL_ONLY_NOT_APPROVED` |
| [A20 R23B D01–D04 decision packet](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/WEB-005_A20_R23B_A00_DECISION_PACKET.md) | Git blob `1a6475847fe9a7726b0fb8806891098c2ea3abbe` | Precise owner decision meanings and T055 `REQUESTED_NOT_ALLOCATED` |
| [A20 R23A source DAG](https://github.com/C8LyNn/aplikacja-turnieje/blob/74abd89158dacb2eb6d2e92fd48deb4405ee7a30/docs/web-005/agent-reports/A20/WEB-005_A20_R23A_CANONICAL_MIGRATION_GRAPH_PROPOSAL.md) | Git blob `053616dc8e2d0c44d86699c8462e711325ace9c2` | Source-only 14/14 Git SHA1/UTF-8 SHA256 earlier verified by A20; **not** rehashed or executed by A22 here |
| [A20 R23D real-environment preservation](https://github.com/C8LyNn/aplikacja-turnieje/blob/27b902a847f371ae9649b1870362a86a83b8d4da/docs/web-005/agent-reports/A20/WEB-005_A20_R23D_ISSUE72_STEAM_DB_PRESERVATION.md) | Git blob `b63190678de0792705c2286790bc8efd4c2adcf0` | Physical applied-history receipts and Replit exact snapshot **unavailable** |

**No independent A22 executed-source receipts** for the physical target were found among the inspected owner-gate records [Issue #76](https://github.com/C8LyNn/aplikacja-turnieje/issues/76) and [Issue #72](https://github.com/C8LyNn/aplikacja-turnieje/issues/72), including their latest relevant comments at this inspection. Absence of accessible evidence is **not** proof SQL never ran on any system.

A30 [source security verdict](https://github.com/C8LyNn/aplikacja-turnieje/issues/77#issuecomment-6325137261) and A60 [independent 18/18](https://github.com/C8LyNn/aplikacja-turnieje/issues/77#issuecomment-6325122540) were read for W6I handoff. Their judgments concern the injected CAS source at `fae8a91...`, **not** D01–D04 migration application.

## 2. Exact D01–D04 source/government decisions

| Gate | Identified design | What can be concluded now | Missing evidence blocking source-authoring GO |
|---|---|---|---|
| **D01 — immutable canonical identities** | `logical_id + lineage + source commit + original name + Git blob SHA1 + UTF-8 SHA256 + hard-SQL dependency + ordering dependency`. P05 has 14 entries. | **`CONDITIONAL / SOURCE_IDENTITIES_KNOWN`**; manifest is **proposal-only**. | Explicit A00 owner adoption of logical graph with signed reconciliation of original 0030/0031 collisions. Never equate numeric prefix to identity. |
| **D02 — total order** | Proposed release first, editor second; catalog and correction are separate dependency branches. | **`CONDITIONAL / ORDER_POLICY_PROPOSED`**; not proof the proposed order was actually applied to the target. | Sign exact target-specific order and executable-input transform incl. embedded `BEGIN/COMMIT` of release 0031; reconcile release/editor history. |
| **D03 — DB applied-history attestation** | Qualified per-target **physical fingerprint**, reliable ledger keys, catalog postconditions, actual runner/commit/transform/executed-SQL digest and committed receipt. | **`BLOCKED / APPLIED_HISTORY_UNATTESTED`**. Git source and table existence cannot establish applied historical SQL or commit outcome. | Independent separately authorized **read-only** owner/operator retrieval of actual target `cluster/system_identifier` (if privileged), DB OID/name, schema/role, migrated ledger with runner receipts, source/transform SHA, transaction commit status, duplicate/orphan profiles and backup checkpoint. Redact credentials. Where unavailable ⇒ `EXECUTION_NOT_ATTESTABLE / MANUAL_OWNER_DECISION`. |
| **D04 — exclusive allocator** | A00-controlled serialized `logical_id` and new number reservation under expected HEAD/lease and conflict STOP. | **`BLOCKED / REQUESTED_NOT_ALLOCATED`**. Proposal's `0032–0040` is NOT a reservation for Basket CAS. | A00 signed D01–D03 plus actual concurrent-branch/physical migration history reconciliation and atomic allocation receipt, *then* separately approved schema-source authoring. |

**T055 reservation stays exactly:**
```yaml
request_id: WEB-005-T055-BASKET-CAS-PERSISTENCE-V1
status: REQUESTED_NOT_ALLOCATED
numeric_migration_id: null
canonical_sql_filename: null
db_ledger_receipt: null
schema_source_go: false
sql_execution_go: false
owner: WEB-005/A00
```

D01–D04 are four **decisions**, not four available sequential migration slots. A00 chose two-column **model** through `CAS-DEC-01`; this does **not** sign D01–D04 or authorize an independently numbered SQL migration.

## 3. Conflicting release/editor numbers — source facts and allowable sequence

**Direct GitHub source/manifest check:** frozen C03's release SQL directory lists **0001–0031**, while editor original commits include their own **0030–0038**. Two verified collisions:

| Original numeric prefix | Release lineage (source Git blob) | Editor lineage (source Git blob; proposed canonical alias) |
|---|---|---|
| `0030` | `controlled_correction_operations` **`50aa71ae0199806de3aaf3c57700d2739f2c42bc`** | `steam_catalog_abstract_world` **`a6d4ce679136b016dc6eed0e490e3e54060ada22`**; proposal calls it `0032` |
| `0031` | `atomic_correction_receipts` **`d44601f4b6477dc9366fc7a65475a0eede1c34c1`** | `steam_catalog_pagination_indexes` **`b813547b834febe8e7398d1b2cfe204b84dd1ed5`**; proposal calls it `0033` |

**Proposed (NOT adopted/executed) D02 linearization:**
```text
0026 basket_authority_trigger_bypass
→ 0027 preserve_started_stage_memberships
→ 0028 match_revision
→ 0029 steam_game_catalog_v1
→ release 0030 controlled_correction_operations
→ release 0031 atomic_correction_receipts
→ proposed editor 0032 steam_catalog_abstract_world (original editor 0030)
→ proposed editor 0033 steam_catalog_pagination_indexes (original editor 0031)
→ proposed editor 0034–0040 remaining Steam editor migrations
→ T055 Basket CAS persistence: numeric migration ID NULL (not allocated)
```

**Distinguish graph semantics:** release `0031` has a direct SQL dependency on release `0030`; editor abstract-world original `0030` has a direct SQL dependency on Steam catalog `0029`, **not** release correction `0031`. Linearizing release `0031` before proposed editor `0032` is **an explicit policy edge**, not a SQL-hard dependency. Release `0031` contains literal `BEGIN; COMMIT;`; future runner must attest exact executed-input transform, not silently strip/assume old execution shape. `IF NOT EXISTS`, filename or table existence alone cannot prove historic APPLIED.

**Important D04 consequence:** `0032` collides with the proposal; `0041` has **not** been proven free across real targets and concurrent branches. Assigning either is forbidden. Likewise, blindly writing source while editor/release/physical histories disagree would not be a valid migration.

## 4. Minimal and exact prerequisites for future *schema-source authoring* GO

**No actions below are authorized by this A22 report; sequence is contractual:**

1. **Approve D01:** A00 owner-signed, immutable canonical source identities and explicit disposition for Release/Editor original 0030/0031; preserve published SQL byte identities and unrelated Replit/Steam state.
2. **Approve D02:** A00 owner-signed target-specific total execution order and runner transform policy, with distinct hard-dependency and policy-order edges.
3. **Resolve D03:** name/attest one exact target and source of truth. With **separately permitted read-only** inspection, prove actual applied keys, physical cluster, catalog signatures, effective runner/executed SQL, transaction/commit receipts and backup checkpoint, including orphan/partially applied profiles. If historical receipts unavailable, enter `D03_UNKNOWN_EXECUTION_HOLD`; A00 must sign a **specific no-invented-history disposition** rather than auto-adopt. This report **does not** make such a waiver.
4. **Authorize D04 reservation:** after synchronized check across branch migration sources, related PRs and physical ledgers, A00's exclusive serialized allocator issues a unique numeric ID and canonical filename for `WEB-005-T055-BASKET-CAS-PERSISTENCE-V1` with an exact HEAD/lease and written receipt; on conflicts, STOP.
5. **Separately issue `SCHEMA_SOURCE_GO`** scoped to pinned source+logical ID, destination `public.tournaments`, ORM parity, allowed DDL effects and migration test plan. Permission to create a migration file is **not** permission to run SQL, backfill or mutate a test/prod DB.
6. **Authorize execution much later and separately:** isolated PG16 G0–G5, physical identity, backup/rollback and owner/operator controls; SWARM-006 system integration is independently gated. Feature flags/client remain OFF.

**Selected CAS schema shape (design only):** `basket_config_revision BIGINT NOT NULL DEFAULT 0 CHECK >= 0`, `basket_edit_epoch UUID NOT NULL DEFAULT gen_random_uuid()` on `tournaments`; keep `basket_flow_authority_version` unchanged. For existing rows require a per-row distinct newly generated epoch and revision zero **only while uninitialized**, with no mutation of baskets/stages/roster. Handle concurrent INSERTs and potentially volatile UUID-default table-rewrite/DDL lock cost in separately reviewed rollout; validate NOT NULL/CHECK/defaults and ORM parity before any CAS activation. After any accepted CAS PUT, **never reset revision, rotate epoch by generic backfill or DROP CAS columns as an automatic rollback**; use feature-OFF and authorized forward repair. Clone/new target must get fresh epoch+0; in-place restore denied. All these are prerequisites, not permission to implement DDL.

**A20/A30 source-composition boundary:** independent of the D01–D04 question, A20's writer inventory still identifies stage-first `addPlayerWithStagePlanCompatibility()`, conditional proposal/routing/trigger writer coverage, coherent GET and authenticated real graph ports as source/composition blockers. A50's isolated fake-client 18/18 PASS does not prove source lock closure, persisted DB CAS, real HTTP or a completed migration. These are **not new A22 audits** and must not be conflated with D03 applied-history receipts.

## 5. A22 result and narrowly scoped next owners

**One actionable blocker:** `D03_APPLIED_HISTORY_UNATTESTED` plus unsigned D01/D02 and absent D04 lease; **all three prevent migration number and schema-source authoring**. Preserve the request status `T055_REQUESTED_NOT_ALLOCATED`; do not assign SQL to A50/SWARM-006 without separate owner authorization.

**A00/A20:** sign/finalize owner D01–D04 and choose authenticated physical read-only evidence collection or explicit unknown-history HOLD. **A50:** continue isolated DB-free CAS-SEC-01/02/03 source hardening without schema file/migration edits; source implementation and actual schema activation remain independently classified. **A30/A60:** target revised exact SHA, source/negative tests only when appropriate. **A22:** no SQL, no migration creation or numbering, no broad audits.

**Actual A22 checks:** read-only GitHub A00, A30/A60, PR #38/#144/#146, manifest, source migration pairs, issue comments and previously verified DAG. **No Node tests, SQL, Docker, PG16, CI, integration, migrations, merge or deployment**; command exit codes **N/A**, TAP/evidence SHA-256 **N/A**. GitHub source readback does not equal applied DB history.

**Final status:** `A22_W6I_R3_DONE / D01_D02_SOURCE_CONDITIONAL / D03_APPLIED_HISTORY_UNATTESTED_BLOCKED / D04_T055_REQUESTED_NOT_ALLOCATED / MIGRATION_SOURCE_AUTHORING_BLOCKED / CAS_DESIGN_CONDITIONAL / PG16_G0_G5_HOLD / SWARM005_FINAL_SOURCE_CLOSEOUT_CANDIDATE_CONDITIONAL / SWARM006_NOT_ACTIVATED`.
