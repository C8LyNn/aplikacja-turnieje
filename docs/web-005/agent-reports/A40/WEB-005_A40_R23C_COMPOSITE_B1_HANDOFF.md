# WEB-005 — R23C / A40 SOURCE COMPOSITE BATCH 1 — HANDOFF TO 00

**Task:** `WEB-005-T015-A40-R23C-COMPOSITE-B1`  
**Owner:** A40 CI Pack Recovery / Source Integration · **Mode:** CONTROLLED DISPOSABLE SOURCE INTEGRATION  
**Created:** 2026-10-15 Europe/Warsaw · **Repository:** `C8LyNn/aplikacja-turnieje`  
**Source result:** **`COMPOSITE_B1_CREATED / QA_PENDING`**. This is an isolated *candidate*, not a release or independent QA acceptance. **NO protected merge / NO deploy / SWARM006_HOLD.**

## 1. Published immutable Git objects and pull request

| Field | Verified GitHub value |
|---|---|
| [**DRAFT integration PR #60**](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) | OPEN / DRAFT / UNMERGED |
| [**Isolated integration branch**](https://github.com/C8LyNn/aplikacja-turnieje/tree/integration/web-005/r23c-composite-b1-20261015) | `integration/web-005/r23c-composite-b1-20261015` |
| [**COMPOSITE_B1_SHA**](https://github.com/C8LyNn/aplikacja-turnieje/commit/fa3261b2c9510e110ac9eba21726812d3401a525) | `fa3261b2c9510e110ac9eba21726812d3401a525` |
| Baseline branch | `release/tournament-ops-20261013-01` |
| Baseline and **sole composite parent** | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` |
| Baseline Git tree | `5cc19d23cb42cdd09b11f82ad201c56303c9d87c` |
| Composite Git tree | `c19fff1d6b8538dee731ea0daad75bfe568714c3` |
| [**Exact machine-readable source manifest**](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A40/WEB-005_A40_R23C_COMPOSITE_B1_MANIFEST.json) | All six exact source SHAs, **14 paths and 14 blob SHAs**, zero exclusions |

**Git facts independently read back:** `compare(base, composite)` = `ahead_by=1`, `behind_by=0`; **exactly 14 changed paths**, same 14 as draft PR #60. The composite commit has **exactly one parent (release SHA)** and its tree equals the constructed Git tree. The source files were **copied byte-for-byte via existing Git blob SHA** into a tree using `base_tree_sha`. Every one of the 14 final composite paths was re-fetched by exact composite SHA and its Git blob checked equal to the source PR blob. **No cherry-pick, merge, rebase, manual conflict resolution, tests deleted or unauthorized behavior patch.**

## 2. Candidate source HEAD manifest and included files

Each PR was checked OPEN/DRAFT/UNMERGED and **exactly equal to the owner-pinned SHA**, with the **same** baseline commit SHA, before writing the new branch.

### P01 / PR #35 — Pack19; 1 file

**SOURCE HEAD:** `7cb283aa82273a1e22daf9051a82311eef53760c`

- `qa/pack19/source-contract.test.mjs` — blob `5726986dca6a6fd7309bb883eb1106d2d19fb14e`

### P02 / PR #36 — Pack20/21/25/26; 4 files

**SOURCE HEAD:** `24fe6c399e3a4fa82c3d96703620097fa941a59a`

- `qa/pack20/source-contract.test.mjs` — blob `42359d5116038f515a4b8504bad2fcc0f0df5b26`
- `qa/pack21/source-contract.test.mjs` — blob `38d8a96870b31c604b86d010d53b5f40dbd359d6`
- `qa/pack25/source-contract.test.mjs` — blob `f38fe8b7af53a43ae560fe26fed1682ddcb7f608`
- `qa/pack26/source-contract.test.mjs` — blob `dd06d0cfba9db9c772e5559e0fbe1915e8e51385`

### P07 / PR #40 — Pack17; 3 files

**SOURCE HEAD:** `9a8287271299a59fc9291b8d253299a8d109a35d`

- `qa/pack17/gate-contract.mjs` — blob `eae350a60a684d7b14af3e481baf7bd6c4a2b2fc`
- `qa/pack17/gate-contract.test.mjs` — blob `f59a65509009fbdf74a38239693238704b1af583`
- `qa/pack17/run-gates.mjs` — blob `8779ab2c1588cc62a2f3c5f63c57be9b55e86043`

### P23 / PR #56 — isolated Backup V3 strict core; 2 files

**SOURCE HEAD:** `a7f71a7e7efdabd479b358a3cee80bc6359c4321`

- `artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts` — blob `595c68b87a5361623bef6293519ed668e9d4e493`
- `artifacts/api-server/test/backup-v3-strict-policy.test.ts` — blob `d1242b84c9b2db269ab6864459d8d11656d4fe8c`

### P24 / PR #57 — Swiss S3/S4; 2 files

**SOURCE HEAD:** `a57fe31c1bc123c5217b3f58bcdd34750c64c5c6`

- `artifacts/api-server/src/domain/tournament/swiss.ts` — blob `5e7fa424371c10a0360e471bb050afa7096d361b`
- `artifacts/api-server/test/swiss.test.ts` — blob `150d34619abb83d12bb351a7aedb6e377d5d1332`

### P25 / PR #58 — pure raw Backup V2/V3 preflight; 2 files

**SOURCE HEAD:** `e8100f7b0c1071c2a98880d4eb7947514fc58185`

- `artifacts/api-server/src/application/backups/backup-v3-profile-gate.ts` — blob `518526d8d9ff2cef368261788e12c9f8290754f5`
- `artifacts/api-server/test/backup-v3-profile-gate.test.ts` — blob `04f6dc8834f11d63f1b3710ae75c4ad7f6419f19`

**Inclusion decisions:** **6/6 included**; **0 excluded**. **File collisions:** 0; **semantically incompatible overlapping rewrites demonstrated:** 0. All 14 changes from the exact source refs transferred. **Manual conflict resolution:** NONE; **source-copy changes:** EXACT-BLOB-ONLY. Diff contains **no** `package.json`, lockfile, OpenAPI, API route, migrations, SQL, or workflow file changes. Production Backup import/export remains unmodified; the two new pure Backup modules share the exact marker `web005.backup-v3.strict.v1` but are deliberately *not wired*. Their outputs do **not** authenticate an untrusted issuer or grant import rights.

## 3. Actual tests and source-contract results — no inflated exit claims

**Native test environment limitation:** the separate A40 container has Node/Git but no authenticated full private repository checkout; unauthenticated `git ls-remote https://github.com/C8LyNn/aplikacja-turnieje.git HEAD` failed DNS with `Could not resolve host: github.com`. Thus **A40 did not execute direct local `node --test` against the composite**; local composite test process exit codes `null` and local TAP `null`.

**Real automatic GitHub Actions result (not manually triggered):**

- [**PR #60 run 38736073793**](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793), job **`116425579970`**, completed **FAILURE** on exact composite `fa3261b2c9510e110ac9eba21726812d3401a525`. Run was **automatically triggered by PR/branch publication**, **not** manually rerun/dispatched by A40. Decoded native job logs were fetched.
- GitHub Actions steps completed **SUCCESS**: SE safety; **Pack19, Pack20, Pack21, Pack22, Pack26, Pack25, Pack24, Pack23**. Exact source-contract job outputs were real in the composite GitHub runner: Pack19 source **8/8 PASS**, Pack20 source **9/9 PASS**; all eight source suites **72/72 PASS**, all eight domain suites **220/220 PASS**, and SE safety **23/23 PASS**, with 0 reported failures in these reached TAP summaries. Those are **not synthetic**. Wrapper job status is **FAILURE** because the later `Static and database release gates` step ended **FAILURE**.
**Exact native per-Pack TAP evidence from the completed PR #60 job log** (not author fixtures):

| Correction suite | Domain TAP | Source-contract TAP |
|---|---|---|
| Pack19 | 26/26 PASS | 8/8 PASS |
| Pack20 | 15/15 PASS | 9/9 PASS |
| Pack21 | 24/24 PASS | 7/7 PASS |
| Pack22 | 31/31 PASS | 6/6 PASS |
| Pack23 | 28/28 PASS | 8/8 PASS |
| Pack24 | 29/29 PASS | 10/10 PASS |
| Pack25 | 32/32 PASS | 12/12 PASS |
| Pack26 | 35/35 PASS | 12/12 PASS |
| **TOTAL** | **220/220 PASS** | **72/72 PASS** |

SE safety separate: **23/23 PASS**. All listed TAP chunks show `# fail 0`. This table is from the one automatically executed CI job on the **composite SHA**, not from individual PRs or synthetic probes.

- Inside the actual **`node qa/pack17/run-gates.mjs --full`** invocation, decoded log explicitly records:
  1. `PASS source contracts` — **12/12 TAP PASS**.
  2. `PASS gate fail-closed contracts` — **24/24 TAP PASS**.
  3. `PASS PostgreSQL atomic correction` — **8/8 TAP PASS** in **GitHub's own ephemeral PostgreSQL 16 container**.
  4. `PASS workspace typecheck` (API/frontend/libs), completed.
  5. `API unit tests` were reached and execution advanced to API integration; no independent per-test fixture counts were separately certified by A40.
  6. `API integration tests` **BLOCKED**, log literal: **`BLOCKED: API integration tests execution failed exit 1; signal none`**; corresponding GitHub step wrapper **`Process completed with exit code 1`**.
  7. **Frontend tests, API build and frontend build did NOT execute as later Pack17 gates** due to fail-closed early stop. Targeted Swiss and both Backup pure tests are **not shown as separately invoked named suites** by this correction workflow, so **do not claim targeted per-file PASS** from a broader earlier unit step.
- During failed integration execution, the PostgreSQL service log records numerous expected-looking negative constraint errors and intentional-failure fixture messages; the available record **does not isolate a confirmed root cause for API integration exit 1**. **Do not classify it as a Swiss/Backup, schema, or Postgres server bug without A50/A60 targeted reproduction.** Some API integration TAP output was cut off before a complete final summary; the stage failed and was **NOT GREEN**.
- **Numeric exit evidence:** the real failing API-integration child returned **exit 1**, GitHub wrapping step **exit 1**. The completed-success workflow steps have explicit native **GitHub status `success`**, but their individual shell numeric exit codes were not separately surfaced by the job metadata; do not invent standalone exit-code receipts. `A40_LOCAL_DIRECT_TEST_EXIT = null` because no full local checkout was executable.
- **Scope of prohibition:** A40 did **not** manually start any PostgreSQL schema-reset test, migration, SQL write, paid workflow rerun or additional environment. The existing workflow **automatically** ran its configured isolated PG16 atomic test after the PR publication; this receipt does not authorize **future manual DB resets**.

**Correct final classification:** `COMPOSITE_SOURCE_CONTRACTS_NATIVE_CI_PASS / PACK17_SOURCE_HELPER_PG_TYPECHECK_PASS / PACK17_API_INTEGRATION_EXIT_1 / FULL_CI_FAILURE / FURTHER_GATES_NOT_EXECUTED / A40_LOCAL_DIRECT_NOT_EXECUTED / A60_INDEPENDENT_QA_PENDING / RELEASE_NO_GO`.


## 4. Test guidance to A50 and independent review by A60

A50 can start **non-destructive native source QA** because the draft composite HEAD and full 14-file manifest are real and pinned. In a *trusted clean complete checkout*, first check `git rev-parse HEAD == fa3261b2c9510e110ac9eba21726812d3401a525` and run from monorepo root:

~~~powershell
node --test --test-reporter=tap qa/pack19/source-contract.test.mjs qa/pack20/source-contract.test.mjs qa/pack21/source-contract.test.mjs qa/pack22/source-contract.test.mjs qa/pack23/source-contract.test.mjs qa/pack24/source-contract.test.mjs qa/pack25/source-contract.test.mjs qa/pack26/source-contract.test.mjs
if ($LASTEXITCODE -ne 0) { throw 'STOP: Pack19–26 native source contracts failed' }

node --test --test-reporter=tap qa/pack17/gate-contract.test.mjs
if ($LASTEXITCODE -ne 0) { throw 'STOP: Pack17 pure helper contracts failed' }
~~~

Only after owner-approved safe Node22/pnpm10 and `pnpm install --frozen-lockfile`, execute three additional **isolated DB-free pure suites** in the API package, recording per-command actual TAP and exits:

~~~powershell
pnpm --filter @workspace/api-server exec node --import tsx --test --test-reporter=tap ./test/swiss.test.ts ./test/backup-v3-strict-policy.test.ts ./test/backup-v3-profile-gate.test.ts
if ($LASTEXITCODE -ne 0) { throw 'STOP: Swiss/Backup pure unit test failure' }
~~~

**No A40 authorization for DB reset, migration, production/shared DB, staging, protected merge, deployment or SWARM-006.** Any later Pack17 `--full`/PG16 integration gate requires a separately approved physical test environment and explicit scope for disposable test schema/DB; automatic CI receipts do not permit arbitrary later manual DB actions.

**Residual independent QA:** A60 must review exactly the new composite SHA and evidence on code/data boundary, Pack25 lexical spoof limitations, Pack17 `T017-QA-01` TAP parser risk, Swiss stage-scoped `previousMatches` caller assumption, and Backup strict-policy versus profile-preflight producer trust; note no importer wiring. A00 must retain formal owner decisions, original WEB004 38-case provenance and handoff policy gates separately. **Source combination does not authorize release.**

## 5. Final decision / STOP

**COMPOSITE_B1_CREATED / QA_PENDING**. A50 **MAY START** clean, non-destructive per-SHA source-contract and pure unit QA; A60 independent exact-SHA source review remains mandatory. **Not safe** to infer acceptance of future integration, dedicated physical PG16 DB reset, release or SWARM-006. No merge, rebase protected refs, database mutation, manually paid workflow dispatch or deployment was made by A40.
