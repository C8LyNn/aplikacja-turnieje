# WEB-005 / R23D / A20 — Issue #72 Steam migration & live-state preservation

**Task:** R23D dispatch, [Issue #72](https://github.com/C8LyNn/aplikacja-turnieje/issues/72), A20 subtask.  
**Role:** A20 PostgreSQL Migration Reconciliation; A30 owns Steam auth/catalog behavior and credential/security controls.  
**Date:** 2026-10-16 Europe/Warsaw. **Mode:** SOURCE READ + DOCS ONLY.  
**Status:** `SOURCE_MIGRATION_IDENTITY_CONFIRMED / REPLIT_EXACT_DIFF_UNVERIFIED / POSTGRES_APPLIED_HISTORY_UNKNOWN / LIVE_PRESERVATION_HOLD`.

## Evidence boundary / exact SHA

- Dispatcher: [WEB-005_R23D_EXECUTION_DISPATCH_20261016.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R23D_EXECUTION_DISPATCH_20261016.md), Git blob `226b6a89c3fd8348eac814221de1c9715ee6ae25`.
- **GitHub live release ref:** `release/tournament-ops-20261013-01@1db3734b8988940acc6be8b992420a58fc39624a` (actual branch compare `identical`). This is **one commit ahead** of A20 R23C base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. The commit changed **23 paths, all under `artifacts/tournament-manager` related to Core Clash/Unity showcase, routing and visuals; no `lib/db/migrations` changes.** This release-only Git compare does **not** compare against Replit.
- **Editor original source:** `codex/game-catalog-editor-reliability@28da3ef94f3b30f90c1b3b70a88ab7f61462d99c`, branch compare `identical`.
- **P05 [PR #38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38):** HEAD `2d36864f4d2f1c838073f387fd3c8efb3378c43b`, OPEN/DRAFT/UNMERGED, manifests are OFFLINE `PROPOSAL_ONLY_NOT_APPROVED` and `ready_for_sql:false`. Manifest Git blob `28f493263a2cbfb919db1f99b220058175b46ba0`.
- **Replit published LOCAL checkpoint (owner-supplied, not downloaded):** `cb55335ea8e789d5e0f7912955da7d679d7dbb5f`. GitHub dispatcher reports 140 Replit-vs-release differing paths (90 Replit-only / 50 different blobs), categories 15 backend/auth + 21 DB/migrations + 42 frontend/config + 3 dependencies + 59 docs/tests/CI. These are **SECONDARY DISPATCH COUNTS ONLY**: no raw local path/hash manifest was available to A20, thus not independently reproduced and not a list of 140 bugs.
- Replit app search returned `aplikacja-turnieje`, but last-updated metadata was 2026-08-11; subsequent read-only `ask_question` returned **phase=busy; question NOT queued/executed**. That app therefore did NOT provide a verified Oct-15 checkpoint, local file blobs, migration list, database receipts or actual runtime evidence.
- **Actual R23D QA**: GitHub commit compare, release/editor recursive trees, P05 migration manifest check; verified **14/14 source Git blob SHA-1 identities**, five original release SQL files present, nine original editor SQL files present; **0/9 proposed canonical editor-named `0032–0040` SQL present** in GitHub release. SHA-256 values below were independently verified **R23A** from raw UTF-8, but NOT rehashed in R23D. No node/api/PG16 test executed.

## A20 exact source-side migration preservation manifest (nine editor migrations)

The *canonical* numbers below are only **P05 PROPOSALS**. Source files on the original editor branch retain their own original ordinal. **Replit live filename/blob/receipt = UNKNOWN for every row** until owner supplies its actual local manifest and separately authorized DB evidence.

| Proposed canonical | Editor ORIGINAL source path under `lib/db/migrations/` | Original Git blob SHA-1 (verified again R23D) | Original raw SHA-256 (R23A verified) | GitHub release canonical named file | Replit file & DB status |
|---|---|---|---|---|---|
| 0032 | `0030_steam_catalog_abstract_world.sql` | `a6d4ce679136b016dc6eed0e490e3e54060ada22` | `1d5ba3e810ce80077e6991d64132042ea0265b1aa1073248dbb389f68a916fdb` | ABSENT | UNKNOWN |
| 0033 | `0031_steam_catalog_pagination_indexes.sql` | `b813547b834febe8e7398d1b2cfe204b84dd1ed5` | `cd36853fa3809868c10fddf8fa763048ff8c56766fcd33c18549af61c136fd77` | ABSENT | UNKNOWN |
| 0034 | `0032_steam_catalog_classification_revision.sql` | `694c4e7d30694551c38a944e44e7dd0efe35f030` | `7a40cea1b9ffaf30d4bd7d5c381aa6eeed711947e97ac49b82d67d682882b211` | ABSENT | UNKNOWN |
| 0035 | `0033_steam_catalog_trigram_search.sql` | `37d550193d7c5280e16195d5f733c59bbabb591b` | `9a6ccbb7adaa71e1fa4171e3c1a4cf3f123c8c96511c33c0bc63a766941ca4f5` | ABSENT | UNKNOWN |
| 0036 | `0034_steam_catalog_exact_status_counters.sql` | `b8958e51a3651b259f851d34c34075f3a4b0de36` | `1c568e03b02c8f8f8ecefc3e3ed35b725bd1aefea88391f334fe036fb4d49f3f` | ABSENT | UNKNOWN |
| 0037 | `0035_steam_catalog_import_jobs.sql` | `fadfe2786d2a119ef663106e541f9e225e2e0000` | `b91e57eaefca7a364e8df11c7854426d0ca1d77410d979b9a40924c647a471d3` | ABSENT | UNKNOWN |
| 0038 | `0036_steam_catalog_import_job_sources.sql` | `382b0e418454df934f3fadcd442180e3b2333727` | `7f9971c9371b891b6484a61294a8204a1f56a7937728496a2f8d4a17808ba2ca` | ABSENT | UNKNOWN |
| 0039 | `0037_steam_catalog_import_retry_backoff.sql` | `5a044dc12b645f68cb8a7fa99f3b455fe7db999e` | `a224635d1501b9f309c049ce471bdbc36263078ed3a0a1328059b2f6041442dd` | ABSENT | UNKNOWN |
| 0040 | `0038_steam_catalog_global_source_throttle.sql` | `332f983a8ea541a1a3579d476dd6e21bcd61c9dc` | `f86c78546c37396d84aa5effc202a6ffab52dae0f592c17229f8ae49c0670b38` | ABSENT | UNKNOWN |

For these nine rows, **preservation policy = PRESERVE LOCAL ORIGINAL AND RUNTIME DATA; DO NOT OVERWRITE/RENUMBER/EXECUTE**. Physical Replit source code, corresponding original SQL file byte hash, migration runner version and actual DB receipts must be gathered first. Unknown does not equal missing/not applied.

### Historical conflict DAG and exact release identity

GitHub release still contains **only five** files `0027–0031` from the 14-source proposal, with checked blob identities:
- `0027_preserve_started_stage_memberships.sql` SHA-1 `90b9fd1c7297097d32ddbb546f9828c47fda02dc`, depends on 0026.
- `0028_match_revision.sql` SHA-1 `45eb2ea26e8bbeb290be4e8ded21b544440ce7ec`: match-state revision trigger, separate from result-history sequence and basket CAS.
- `0029_steam_game_catalog_v1.sql` SHA-1 `e6c6ff4c4bc81181391a3b6cedafba3ab96c6c41`.
- Release original `0030_controlled_correction_operations.sql` SHA-1 `50aa71ae0199806de3aaf3c57700d2739f2c42bc`: correction operations.
- Release original `0031_atomic_correction_receipts.sql` SHA-1 `d44601f4b6477dc9366fc7a65475a0eede1c34c1`: receipts, SQL includes embedded `BEGIN; COMMIT;`.

Conflict: **original 0030** = release correction operations **vs** editor Steam abstract world; **original 0031** = release correction receipts **vs** editor pagination indexes. Never resolve by matching only 4-digit prefix, table existence or `IF NOT EXISTS`. The P05 proposed graph is release `0027→0028→0029→0030→0031`, *then* proposed editor `0032→...→0040`. **Cross-lane edge release 0031→editor 0032 is owner-selected execution-order policy, not a proven hard SQL dependency** (editor abstract world lists 0029 as SQL predecessor). [R23A full 14-entry source graph](https://github.com/C8LyNn/aplikacja-turnieje/blob/74abd89158dacb2eb6d2e92fd48deb4405ee7a30/docs/web-005/agent-reports/A20/WEB-005_A20_R23A_CANONICAL_MIGRATION_GRAPH_PROPOSAL.md) records raw hashes and hard-vs-order DAG. Until A00 signs D01/D02, **no canonical rename/adoption**.

## Partial-deploy hazards — A20 scope / interface to A30

| Hazard | Observed source/dispatch evidence | Preservation action |
|---|---|---|
| Catalog API on Replit ahead of GitHub release, DB schema not verified | GitHub release lacks proposed canonical 0032–0040; dispatcher reports Replit local drift, no per-path hashes | **STOP forced GitHub release overwrite**; A30 checks guard/frontend route behavior, A20 obtains owner-approved read-only schema/ledger evidence |
| Steam auth/403/503 guard mismatch with schema/import handlers | A30 owns actual live guard/security; Replit behavior not tested by A20 | Do not assert 403/503 safety or read credentials; jointly freeze public access behavior, no fallback/relaxed auth to mask errors |
| Background Steam catalog import job schema absent/mismatched | Editor original import jobs/sources/backoff/throttle have verified SQL source bytes, GitHub release does not contain them | Do not auto-run/copy these migrations, truncate jobs or replay importers; separate per-target physical catalogue signature and application feature flag gate |
| `0030/0031` release/editor collision | Two distinct pairs with incompatible SQL hashes | Never use ordinal-only DB adoption; owner must choose source identity/runner transform policy and inspect actual ledger |
| Replit-local `App.tsx`, portfolio rewrites and `pnpm-lock.yaml` Playwright delta | **Only dispatcher describes them**, no exact Replit local manifest delivered to A20 | Preserve and pass as `A40/A120/owner SOURCE_DIFF_REQUIRED`; no source sync, lockfile overwrite, dependency upgrade or game edits |
| Proxy/Orval version assumptions | No exact local snapshot or independent import proof | A30/A00 must not assume either upgrade is already published |
| Backup V3 strict/Undo vs future Basket CAS | PR56 isolated validator NOT_WIRED, #55 tests only; #38 source-only ledger | No activation of strict import/CAS writer or production migration merely from an offline source pass |

## No-op preservation preflight / deterministic operator evidence contract

**PHASE P0: gather evidence without altering runtime** (owner-controlled operator, not A20):
1. Identify immutable Replit local checkpoint `cb55335...` and its content address/tree/ref, deployment ID/time and relation to currently published instance. Take independently authorized read-only inventory of source **path, exact byte size, Git blob SHA-1 and raw SHA-256, file mode, source commit/origin and deployed/not-deployed classification** for all reported 140 paths; prove which 21 DB/migration paths exist, including original and canonical naming. Preserve both Replit-only `App.tsx` and portfolio/lockfile unmodified.
2. Construct two-way table indexed by normalized exact path, not ordinal or base filename: GitHub release blob, Replit local blob, file availability, ownership (A20 DB, A30 auth, A40/A120 app, game code = FROZEN), source lineage, migration logical_id, policy `KEEP_LOCAL`/`REVIEW_CONFLICT`/`CHERRY_PICK_SEPARATELY_AFTER_QA`/`FROZEN_GAME`. **No path may be marked safe to replace until both blobs are independently observed.** The 140 reported path counts are not independently attested by A20.
3. A00/HQ selects exact real database for **separately authorized READ ONLY** and naming owner/operator; first identify target physically/certify correct instance and observer privileges. If dedicated disposable PG16 is supplied use [A20 R23C catalog SELECT-only script](https://github.com/C8LyNn/aplikacja-turnieje/blob/ee25edb9a6296e256005d477d3d5fadfa1d1859d/docs/web-005/agent-reports/A20/WEB-005_A20_R23C_PG16_CATALOG_SELECT_ONLY.sql), then separately approved [ledger SELECT-only](https://github.com/C8LyNn/aplikacja-turnieje/blob/640113a78a04b730f6333caf9882deb1bfbcb7e3/docs/web-005/agent-reports/A20/WEB-005_A20_R23C_PG16_LEDGER_SELECT_ONLY.sql) **ONLY after owner and A50 verify physical target/schema and least privileges**. Do not direct these test-schema scripts at Replit/live or silently assume `public`; production metadata collection (if authorized at all) needs **a separately approved host/schema/redaction-specific read-only contract**. No SQL executed in R23D.
4. Compare source manifests vs actual ledger `app_schema_migrations` plus any alternative runner receipts, catalogue `pg_class, pg_attribute, pg_constraint, pg_index, pg_trigger, pg_proc`, extensions and independent archived deploy/runner logs. Classify `SOURCE_FOUND`, `LEDGER_CLAIM`, `CATALOG_STATE_CONSISTENT`, `ATTESTED_APPLIED` **only with executed-input checksum and transaction receipt**, `UNKNOWN` or `CONFLICT`. Nothing moves to APPLIED from file existence.
5. A30 supplies owner-approved auth/worker compatibility matrix; before any future deploy require independently reviewed atomically compatible API+frontend+DB schema, exact rollback checkpoint and no-loss preservation of jobs/status/counters. If not provable, **HOLD / NO-OP**.

**Rollback/forward preservation if a future source-only comparison reveals unsafe drift:** stop promotion; keep last known published Replit checkpoint intact; do not force-reset workspace, re-run SQL, drop columns/tables or downgrade completed migration history. On a later authorized release, backup rollback must be non-destructive and verified against actual schema; failure routes to a separately signed forward repair with exact hashes and transaction records. The R23D operation here has **no rollback to perform because no runtime state changed**.

## A00 concrete missing decisions / handoff

1. **D01/D02:** accept or amend canonical identity graph and explicit release-first/editor-second policy. `PENDING_OWNER_APPROVAL`.
2. **D03:** source of truth for Replit checkpoint/file hashes and authentic applied PostgreSQL receipts; approve read-only operator/host/schema/privileges/retention. `PENDING_OWNER_APPROVAL`.
3. **D04:** single exclusive number allocator, serialized reservation process and no race with other PRs. `PENDING_OWNER_APPROVAL`. T055 logical only `REQUESTED_NOT_ALLOCATED`.
4. **Preservation:** receive the actual **140-path Replit diff manifest** with file hashes and exact deployment connection; choose `PRESERVE_LOCAL / REVIEW_CONFLICT` until signed per-path resolution. Do not adopt Replit-only code by guessing.
5. **A30 boundary:** written live Steam guard/worker flag/access policy and cutover tests; A20 must not take ownership of auth/credentials/security.
6. **Deployment:** future, separately authorized source candidate + PG16 test+independent A60 exact SHA QA and A00 rollback approval; no direct live action, paid CI, game edits, protected merge or SWARM-006.

**Verdict:** `R23D_ISSUE72_A20_SOURCE_RECONCILED / 14_OF_14_GIT_BLOBS_MATCH / 9_CANONICAL_EDITOR_FILES_ABSENT_ON_GH_RELEASE / LOCAL_REPLIT_CHECKPOINT_UNATTESTED / PG16_NOT_EXECUTED / PRESERVE_LIVE_HOLD`. **No game files changed, no code edits, no DB/SQL/reset, no Replit update or republish, no force-push/merge/deploy.**
