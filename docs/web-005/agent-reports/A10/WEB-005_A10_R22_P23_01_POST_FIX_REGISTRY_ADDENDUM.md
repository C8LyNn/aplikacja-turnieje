# WEB-005 — A10 / P23-01 POST-FIX SOURCE REGISTRY ADDENDUM

**Task:** `WEB-005-T018-A10-R22-P23-01-CLOSEOUT` · **Agent:** A10 · **Date:** 2026-10-15, Europe/Warsaw · **Mode:** `APPEND-ONLY / DOCS ONLY`.

**Registry verdict:** `P23-01 SOURCE_DEFECT_FIXED / P23_STRICT_CORE_SOURCE_ACCEPTED_SCOPED / BACKUP_V3_NOT_WIRED / SWARM006_HOLD / RELEASE_NO_GO`.

## 1. Preservation of the immutable original registry

- **Unchanged [R22 original P01–P24 registry (Markdown)](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R22_LATE_DELTA_REGISTRY.md)** — Git blob `435655b9d211ac90d28443d3b34e31b4ef988185`.
- **Unchanged [R22 original P01–P24 machine manifest (JSON)](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R22_LATE_DELTA_REGISTRY.json)** — Git blob `25cc2d206768123e4f73e4a20483ef41ddeb9471`.
- All historical P01–P24 entries, original P23 SHA and the earlier 96 legacy digests remain untouched. This new pair of documents is a supplemental, append-only P23 revision record — **not** an in-place rewrite.
- No new packet P25 is created. The source packet is still **P23 / PR #56**; only its post-fix revision and QA scope are appended.

## 2. Live PR identity and SHA transition

- [PR #56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) is **OPEN_DRAFT_UNMERGED**; base `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.
- **Original P23 HEAD (retained):** `77707092202ca79277de7bc57cc4e37e4c033171` — the historical R22 source candidate. Its earlier intake gate remains historical, not silently altered.
- **New P23-01 HEAD:** `a7f71a7e7efdabd479b358a3cee80bc6359c4321` — [original → current comparison](https://github.com/C8LyNn/aplikacja-turnieje/compare/77707092202ca79277de7bc57cc4e37e4c033171...a7f71a7e7efdabd479b358a3cee80bc6359c4321), **+4 commits / −0**, exactly 2 previously owned paths modified (no importer/exporter/HTTP/schema/SQL/PR41/48 diff).
- [Full release-base → new HEAD compare](https://github.com/C8LyNn/aplikacja-turnieje/compare/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7...a7f71a7e7efdabd479b358a3cee80bc6359c4321). No integrated release SHA or merge is claimed.

### New P23-01 commit order

| Order | Commit | Role and content |
|---:|---|---|
| 1 | [`b2b1cbacca0b7ff81c0977c2a6554a262d9f65c7`](https://github.com/C8LyNn/aplikacja-turnieje/commit/b2b1cbacca0b7ff81c0977c2a6554a262d9f65c7) | **test-first** — reproduce lawful system BYE and forged-provenance negatives |
| 2 | [`7c73c7316bc30a150e7aad9cd510d30b4399ac19`](https://github.com/C8LyNn/aplikacja-turnieje/commit/7c73c7316bc30a150e7aad9cd510d30b4399ac19) | **source-fix** — separate lawful system BYE provenance from manual completion |
| 3 | [`3391867f32a41ca377dd153ad49b3bbb52e5e9c5`](https://github.com/C8LyNn/aplikacja-turnieje/commit/3391867f32a41ca377dd153ad49b3bbb52e5e9c5) | **test-typing** — keep played-as-system forgery fixture typed |
| 4 | [`a7f71a7e7efdabd479b358a3cee80bc6359c4321`](https://github.com/C8LyNn/aplikacja-turnieje/commit/a7f71a7e7efdabd479b358a3cee80bc6359c4321) | **source-guard** — narrow unknown BYE match ID before typed Set/Map lookup |

## 3. Exact source hashes — original and post-fix

Git blob SHA-1 comes from `fetch_file` exact-HEAD metadata and was cross-checked against the GitHub PR files API. SHA-256 was calculated over UTF-8 bytes of both exact-HEAD GitHub source files; the hash implementation passed the standard `abc` SHA-256 test vector. A60 independently verified the corresponding source-byte Git blob IDs using `git hash-object`.

| Revision / file | Git blob SHA-1 | SHA-256 | Size |
|---|---|---|---:|
| Original [`artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/77707092202ca79277de7bc57cc4e37e4c033171/artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts) | `c663c3d8347f22caf9375ae48a6f7670a6629d34` | `030e852b52b3ba6cb031dedf3791e7f35ac6721215d30f2ca5851928b189d2b8` | 12058 B |
| Original [`artifacts/api-server/test/backup-v3-strict-policy.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/77707092202ca79277de7bc57cc4e37e4c033171/artifacts/api-server/test/backup-v3-strict-policy.test.ts) | `fdd1f5a7efc95f87ef4fcf38eb0393563bf56adc` | `aa687172a7b0b68a5b3f30b60e17c74872ee4e09c4e3281945903087a5e00dea` | 7930 B |
| Post-fix [`artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/a7f71a7e7efdabd479b358a3cee80bc6359c4321/artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts) | `595c68b87a5361623bef6293519ed668e9d4e493` | `98530f871f27a9851fe89571f56fd6c9313816f1b8f0c4baea8986ca9350c2d6` | 13944 B |
| Post-fix [`artifacts/api-server/test/backup-v3-strict-policy.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/a7f71a7e7efdabd479b358a3cee80bc6359c4321/artifacts/api-server/test/backup-v3-strict-policy.test.ts) | `d1242b84c9b2db269ab6864459d8d11656d4fe8c` | `11aa4c9754829771ab40ad39bbbdd4e100591f958bad7407ba42f137b9eac59f` | 14470 B |

**Delta relative to the initial P23 revision:**

- `artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts`: **+42/−2**, 325 lines at current HEAD.
- `artifacts/api-server/test/backup-v3-strict-policy.test.ts`: **+176/−0**, 347 lines at current HEAD.

## 4. P23-01 defect resolution and independently reviewed scope

- **Former blocker:** legal completed Swiss/system BYE with `system_bye_assigned` was rejected when the strict validator incorrectly required an active manual `match_result_submitted` for every completed match.
- **Post-fix:** system BYE is recognized only with the legitimate result/status/reason, positive player identity, no second player, winner matching player1 and null scores. Exactly one typed non-undoable `system_bye_assigned` action must bind to the same stage/match; active manual submissions are forbidden for a BYE. Ordinary played/walkover/no_contest completions retain their manual-provenance requirement.
- **Direct A60 independent QA report:** [`WEB-005_A60_PR56_P23_01_POST_FIX_INDEPENDENT_QA.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_PR56_P23_01_POST_FIX_INDEPENDENT_QA.md), blob `d8c900df075903413ca3d0ce4fec3b4aa2d18e84`. It independently reviewed **exact HEAD `a7f71a7e7efdabd479b358a3cee80bc6359c4321`** and returned **`PASS WITH CONDITIONS`**.
- Scoped classification: **`P23-01_CLOSED_SOURCE / P23_STRICT_CORE_SOURCE_ACCEPTED_SCOPED`**; **`SOURCE_DEFECT_FIXED`**. This is NOT acceptance of integrated Backup B2–B6, live restore safety, the whole release or final handoff.

## 5. Actual A60 test evidence: 22/22 PASS, scoped execution only

**Provenance:** A60 executed locally against JavaScript emitted by sandbox-only TypeScript transpileModule from source/test bytes matching both reviewed Git blobs. A10 did not rerun tests. Environment: disposable Linux; Node v22.16.0; TypeScript compiler library v5.8.3. Source transpilation had **0 diagnostics**, but did not perform semantic TypeScript checking. A10 did not run any of these tests.

| Execution by A60 | Exact command | Tests | PASS | FAIL | SKIP | Exit |
|---|---|---:|---:|---:|---:|---:|
| A90-authored unit suite, including 6 P23-01 cases | `node --test dist/test/backup-v3-strict-policy.test.js` | 14 | 14 | 0 | 0 | 0 |
| A60 independent adversarial suite (not part of PR) | `node --test independent-negative.js` | 8 | 8 | 0 | 0 | 0 |
| **Total local isolated Node tests** | | **22** | **22** | **0** | **0** | |

**Six newly authored P23-01 regression cases (A90 suite, all PASS):**

1. accept lawful completed system BYE with latest history and nonundoable system_bye_assigned.
2. accept mixed completed played plus system BYE; reject BYE disguised as manual completion.
3. reject absent or wrong latest BYE result history.
4. reject forged BYE participant/winner/scores/reason, even if match and history are mutated together.
5. reject absent/duplicate/foreign/stale/wrong-stage/undoable/forged BYE action.
6. reject played/walkover/no_contest masquerading as system BYE.

**Eight independent A60 adversarial cases (all PASS):**

1. minimal lawful BYE positive.
2. invalid action match IDs: 0, -1, null, undefined and string.
3. duplicate system BYE action.
4. wrong-stage action.
5. forbidden undo capability/payload.
6. missing history or tampered winner.
7. strict marker removed -> UNATTESTED.
8. forged active manual completion on BYE.

### CI and execution limitations

- GitHub [Actions correction-qa run #38698700862](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38698700862) remained **FAILURE** at A60 verification. A60's direct job logs identify inherited **Pack19 7 PASS / 1 FAIL**, comparing `readOnly:true` with `accessMode:"read only"`; subsequent steps were skipped. PR35 is an isolated prerequisite. The new Backup V3 unit suite **did not run in GitHub CI**.
- **timed out without conclusive exit; never classified PASS**. Isolated Node transpilation/execution does not establish monorepo typecheck success; no full pnpm/frozen-lock build or integration was executed/verified.
- No PostgreSQL/backup importer/exporter/restore/HTTP/rollback test was run or claimed. A60's eight independent tests reside in a disposable harness, not the PR. A10 executed **zero** application tests.

**Unverified conditions explicitly retained:**

- full monorepo TypeScript typecheck with reliable success exit.
- frozen pnpm workspace build and integration.
- Backup V3 importer/exporter wired-path execution.
- HTTP preclone 400 INVALID_BACKUP_V3 and late transaction rollback.
- real legacy V2/V3 provenance classification and downgrade safety.
- PG16 database restore and portable match state revision/history consistency.
- integrated GitHub CI of Backup validator.

## 6. Dependency and hard-stop gates

- **`BACKUP_V3_NOT_WIRED`:** the current PR only implements a pure strict-policy validator. Existing importer/exporter, generated contracts, live HTTP preclone `400 INVALID_BACKUP_V3`, PG rollback and portable restore remain outside the PR.
- **Legacy provenance is not proven:** `UNATTESTED` on missing modern marker cannot establish the backup's historical authenticity. A30/A00-approved anti-downgrade strategy and nested-ID safety review remain essential.
- PR41 + PR48 Backup integration, A20/A70 physical CAS/history, A110 basket revision portability, trusted monorepo typecheck/tests and owner/HQ gate are all unresolved.
- **Status preserved:** `SWARM006_HOLD`, `RELEASE_NO_GO`, `WEB005_HANDOFF_NOT_READY`. This **does not** authorize merge, release or activation of SWARM-006.

## 7. Direct A00 handoff

**Register:** P23 / PR #56 revised HEAD `a7f71a7e7efdabd479b358a3cee80bc6359c4321`; previous `77707092202ca79277de7bc57cc4e37e4c033171` immutable historical entry; **`P23-01 SOURCE_DEFECT_FIXED`**; A60 **`PASS WITH CONDITIONS`** on exact current source. Source acceptance is restricted to isolated strict validator; integration remains `BACKUP_V3_NOT_WIRED`.

- **This Markdown report:** [`WEB-005_A10_R22_P23_01_POST_FIX_REGISTRY_ADDENDUM.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R22_P23_01_POST_FIX_REGISTRY_ADDENDUM.md).
- **Machine-readable new revision JSON:** [`WEB-005_A10_R22_P23_01_POST_FIX_REGISTRY_ADDENDUM.json`](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R22_P23_01_POST_FIX_REGISTRY_ADDENDUM.json).
- **Source PR:** [PR #56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56).
- **Independent exact-SHA QA:** [A60 post-fix report](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_PR56_P23_01_POST_FIX_INDEPENDENT_QA.md).

**Operations performed by A10:** live GitHub metadata/files/commits/hash verification + documentation commits only. No app edits, original manifest changes, PR merge, SQL/migration, CI rerun, tests, deployment or SWARM-006 dispatch.
