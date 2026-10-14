# WEB-005 / BACKLOG

**Owner:** 00 — Implementation Lead (local only; global Queen resides in separate HQ)  
**Updated:** 2026-10-14 — WAVE 1 R3  
**Scope:** WAVE 1 ONLY; no merge/deploy/Replit/prod; full WEB-004 consolidated handoff still missing (B001).  
**Source of truth:** this file and DECISIONS.md, isolated in `chore/web-005/t000-wave1-control`.

## Verified GitHub pins (R3)

| Ref | SHA | State |
|---|---|---|
| main | `c50cc48e6fa508592bda3f4838111e9cff5af80c` | unchanged |
| release/tournament-ops-20261013-01 | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | unchanged, no wave 1 fixes included |
| codex/game-catalog-editor-reliability | `28da3ef94f3b30f90c1b3b70a88ab7f61462d99c` | source reference only |
| T010 / PR #35 | `7cb283aa82273a1e22daf9051a82311eef53760c` | OPEN DRAFT, one-file Pack19 fix |
| T020 migration analysis branch | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | no migration files changed |
| T030 / PR #34 | `030d0f5f51df6731cff8135a793abc2d51b0b775` | OPEN DRAFT, 8 files, 11 commits |
| T030 alternative / PR #33 | `79fc25971a53641a704fa052a2b8d937d140fa7d` | OPEN DRAFT, SUPERSEDED/HOLD |
| T015 / PR #36 | `f6e94aae9239d578e23d5a8fb23a2446ea669a41` | OPEN DRAFT, 4 source-contract files, 1 commit |
| PR #32 | release HEAD above | OPEN, 856 changed files, no merge |

## Wave 1 ownership and next gates

| Task / agent | Branch / permitted scope | R3 state | Required next evidence |
|---|---|---|---|
| **T010-A10 / 10** | `fix/web-005/t010-pack19-contract`: Pack19 test only | **QA_REVIEW / CLOSEOUT**. Actual CI Pack19 green; PR #35 draft. | A60 source review of read-only/snapshot contract, fail-before/pass-after; handoff and acceptance. Do not edit Pack20–26. |
| **T015-A40 / 40** | `fix/web-005/t015-pack20-26-contracts`: Pack20–26 source contracts only | **QA_REVIEW / TESTS_NOT_EXECUTED**. [PR #36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) created on `f6e94aae9239d578e23d5a8fb23a2446ea669a41`; Pack20/21/25/26 source contracts changed, Pack22–24 unchanged. | Minimal robust assertions preserving both `repeatable read` and `accessMode: read only`; mandatory negative controls; exact before/after tests; independent A60. Pack20 failing, 21/25/26 source-stale. |
| **T020-A10 / 20** | `fix/web-005/t020-migration-reconciliation`: ledger/manifest/recovery analysis and isolated fixture contract | **PLAN_REVIEW / GO DESIGN ONLY**. Manifest proposal 0027–0040 external artefact, not in repo, PostgreSQL tests NOT_EXECUTED. | Verify raw source checksums; runner atomicity, embedded BEGIN/COMMIT in release 0031; history ledger/attestation; clean B26 / R30 / R31 / E30–E38 / MIXED safe test matrix. No DDL changes without second 00 approval. |
| **T030-A10 / 30** | `fix/web-005/t030-steam-catalog-write-auth`: 3 Steam Catalog mutations, dedicated admin guard, scoped frontend, tests | **QA_REVIEW / PR #34 SELECTED**. Unit, DB-integrated HTTP, typecheck NOT_EXECUTED; PR #33 remains open HOLD. | A50 isolated execution of tests; A60 independent deny/no-write/allowed/GET QA and frontend token assessment. No server secret activation. |
| **T131-A50 / 50** | no source implementation branch; runner/setup and isolation evidence | **READY / PRE-FLIGHT ONLY**; no independent runtime tests credited | Prove TEST_DATABASE_URL safe, TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA, isolated PostgreSQL16 & fixture; execute permitted tests only if environment verified; provide commands, exit codes and SHA to A60. No production connection. |
| **T130-A60 / 60** | no implementation branch; independently review T010, T015, T020 and T030 | **ACTIVE / RELEASE NO-GO** | independently validate HEAD-pinned PR #35 and #34, migration proposal, T015; distinguish SOURCE, HISTORICAL_CI, TESTED and NOT_EXECUTED. |

**Concurrency:** three implementation/analysis lanes at most: 40=T015, 20=T020, 30=T030. Agent 10 completes closeout/QA only, no new implementation; 50 is environment support, 60 is independent QA.

## Actual CI provenance and remaining blocks

- [PR #35 run 38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899), HEAD `7cb283aa...`: SE safety 23/23 PASS, Pack19 readiness 26/26 PASS, Pack19 source contract 8/8 PASS, Pack20 domain 15/15 PASS, **Pack20 source 6/7 FAIL** (stale `readOnly:true`). Pack21–26 and Pack17 `--full` SKIPPED.
- [PR #36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) / `f6e94aae9239d578e23d5a8fb23a2446ea669a41`: four source-contract test files changed (Pack20, 21, 25, 26). Downgrade regression controls added; Node/test suite **NOT_EXECUTED**. Commit message includes `[skip ci]`; no Actions run at this head observed.
- [PR #34 run 38550962951](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550962951), HEAD `030d0f5f...`: CI Pack19 FAIL because PR34 branch does not include PR35 test fix. **Not evidence that T030 auth tests failed or passed.**
- New independent T030 targeted unit, PostgreSQL HTTP integration, typecheck and public GET tests have **NOT_EXECUTED** status pending A50/A60.
- Postgres migration clean install and upgrade tests **NOT_EXECUTED**. No live DB ledger or deployed SHA inspection authorized.

## Selection and migrations

- **T030 chosen draft for review: PR #34**, because compatible with editor-reference middleware and HTTP 403 (missing/bad client key)/503 (missing server configuration), plus deeper isolated DB state-fingerprint tests and public GET. **#33 SUPERSEDED/HOLD**, no close/merge without separate action.
- **T020 proposed manifest 0027–0040:** 0027–0029 shared; 0030–0031 release corrections; 0032–0040 renumbered editor catalog lineage (former 0030–0038). Source-only manifest and validator not runtime proof. **GO** for verifying manifest and designing safe disposable fixtures; **STOP** for production DDL, migration runner changes, automatic historic adoption, and merging SQL pending attestation and operator decision.
- Release 0031 has embedded BEGIN/COMMIT; fix/test transaction ownership before any migration implementation.

## Integration strategy (PLAN ONLY)

1. Pin release base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` and record clean compare.
2. On a **future dedicated disposable integration branch** apply independently accepted **PR #35 (Pack19)** by reviewed cherry-pick/patch (NOT into release/main).
3. Then apply vetted **T015 (Pack20–26)**; run source contracts and unit suites in dependency order, verify full Pack17 `--full` with isolated PostgreSQL.
4. Only after 00 selects and A60 approves, apply **PR #34 (Steam auth)**, never PR #33 as well; run negative/positive HTTP, no-write, public GET, typecheck, frontend regressions.
5. Keep T020 SQL outside candidate until its own manifest and historical upgrade acceptance; never silently include catalog editor migrations.
6. All staged commits and SHA logged; independent A60 gives gate verdict. No release/main merge; no Replit or production.

**Integration branch creation attempt was blocked by tool safeguards during R3.** No integration branch exists and no cherry-pick, merge, tests or CI dispatch was performed. Re-attempt only by an approved/supported workflow after explicit resolution of tool restriction; do not work around it.

## Deferred packages

| Task | Status / dependency |
|---|---|
| T040 match Undo/cancel/stale-state | HOLD; PR #7 then stacked PR #27; Wave2 |
| T050 SE/DE/Swiss/baskets/qualifications | HOLD; Wave2 |
| T060 backup/restore/correction journal | HOLD; migration decision first; Wave2 |
| T070 API, T080 auth/privacy, T090 Host, T100 standings, T110 UX, T120 version-readiness | BACKLOG; later waves |

## Blockers

- B001 full WEB-004 consolidated handoff absent.
- B002 Base PR35 Pack20 fails real CI; PR36 fixes Pack20/21/25/26 contracts in untested candidate; Pack17/remaining gates still unverified.
- B003 competing 0030/0031 histories, unknown production migration ledger/checksums, embedded SQL transaction.
- B004 owner-only Steam catalog production credential provisioning.
- B005 production deployed SHA and migration history unknown; Replit frozen.
- B006 no independent full DB/HTTP/typecheck/UX regression green.
- B007 main/release/task branches not protected; no rules changed.
- B008 PR #33/#34 duplicate (R3 decision to select #34, other on HOLD).
- B009 isolated test execution capacity unproven; T131-A50 tasked with safe preflight.
- B010 integration branch creation blocked by platform tool safeguards; future integration remains a plan.

## Reporting / state semantics

Workers return TASK, BASE_SHA, HEAD_SHA, BRANCH, PR, FILES_CHANGED, TESTS_RUN (exact command, environment, exit code), TESTS_NOT_RUN, A60_VERDICT, RISK, ROLLBACK, NEXT_OWNER, READY_FOR_ARCHIVE. Only actual runtime executions may be labeled PASS. SOURCE or historical CI is a separate evidence type; no implicit release GO or permission to merge/deploy.


## R3 live-update addendum — T015

- GitHub branch advanced during R3 coordinator checks from release baseline to `f6e94aae9239d578e23d5a8fb23a2446ea669a41`; compare shows 1 commit and 4 test files.
- [PR #36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) is OPEN DRAFT; author reports source predicate/downgrade checks, but **actual Node suite, isolated PostgreSQL and paid CI NOT_EXECUTED**.
- T015 status elevated to **QA_REVIEW**, not PASS or PR_READY for merge. Send to A60 with exact SHA; A50 should test if safe infrastructure becomes available.


## R4 assignment queue (2026-10-14) — FOR USER DISPATCH, NOT AUTOMATIC THREAD DELIVERY

Verified at coordination time:
- PR #35 / T010 remains OPEN DRAFT, HEAD `7cb283aa82273a1e22daf9051a82311eef53760c`; CI Pack19 green, Pack20 later failure.
- PR #36 / T015 remains OPEN DRAFT, HEAD `f6e94aae9239d578e23d5a8fb23a2446ea669a41`; targeted Node/Pack17 execution not demonstrated.
- PR #34 / T030 remains OPEN DRAFT, **updated HEAD `fae2eea2f22df3f1b02ad035a7db00bc411ea73f`**, 13 commits / 9 files; retest/re-review required. PR #33 remains HOLD.
- Release SHA unchanged at `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.

### New bounded assignments (not yet executed by thread workers)

| Agent | New task / mode | Scope / hard dependency |
|---|---|---|
| 10 | **T016-A10 — CI Integration/Release Gate Mapping**; SOURCE-ONLY, no code integration | Inspect PR35/36 + PR34 dependencies, CI paths, Pack17 gating, define reproducible isolated integration plan; do not merge/cherry-pick/create integration branch without coordinator owner approval. Begins after T010 handoff is accepted. |
| 50 | **T132-A50 — Safe Test Harness & Fixture Preparation**; SOURCE-ONLY/prep initially | Exact PostgreSQL 16 disposable fixture plan, test gates, scripts/protocol; no DB/DDL execution until isolation verified and authorized. Starts after T131 preflight handoff. Do not self-certify runtime tests. |
| 40 | **T015-A40 closeout FIRST**, then optional **T017-A40 — Pack17 Gate Contract Audit** (read-only preflight) | No new task before A60 accepts PR36 or delegates targeted rework. T017 must not overlap A10 T016 (A40 owns technical Pack17 internals, A10 integration ordering). |
| 20 | T020 migration ledger/runner historical scenario verification | No SQL migration implementation until coordinator accepts complete plan and isolated DB; preserve current task. |
| 30 | T030 PR34 updated head `fae2eea2...`; targeted security QA and fixes only | No PR33 overlap; no production secrets, merge or Replit. |
| 60 | T130 independently review exact PR34/35/36 SHA and plans | No implementation; return PASS/FAIL/BLOCKED/NOT_EXECUTED by exact source/test provenance. |

**Concurrency rule:** The newly assigned T016/T017/T132 begin as SOURCE-ONLY research/preflight and do NOT add active implementation lanes. Remaining implementations T015/T020/T030 hold existing scopes. Wave2 T040/T050/T060 implementation remains HOLD. No additional CI dispatch or paid run authorized.

**Dispatch requirement:** This backlog records assignments, but messages must be pasted into their existing ChatGPT threads by the owner; no cross-thread message sending tool is available.


## INCOMING WEB-004 REPORT — RESERVED TRIAGE CAPACITY (2026-10-14)

**Incoming report:** WEB-004 follow-up audit in preparation. **Not yet received or assessed** by WEB-005. The number, severity and validity of findings are UNKNOWN. Do not create speculative implementation tasks or claim new findings as confirmed.

### Intake workflow for the next WEB-004 handoff

1. **Register source:** report name/version/date, WEB-004 issue ID, exact impacted branch/SHA, affected endpoint/workflow, reproduction, expected/actual, impact, severity, and evidence. Record every finding with independent cross-reference; preserve original ID.
2. **Revalidate:** verify defect against a pinned current source (or authorized isolated runtime). Differentiate resolved-by-PR, duplicate, regression, present-on-release, main-only, editor-only, and unconfirmed/deployment-unknown. Never assume GitHub source is deployed on Replit.
3. **Deduplicate and link:** route into existing T015/T016/T017/T020/T030/T040–T130 where appropriate; otherwise assign a *new* T-number after coordinator approval. Avoid duplicate fixes or same-file ownership.
4. **Risk rank:** P0 security/data-loss/integrity and blocked production correctness; P1 important correctness/workflow; P2 UI/usability; P3 enhancements. Record exploitability, blast radius, dependency on migration/authorization, regression risk, and confidence.
5. **Slotting and wave planning:** protect current P0 gates; maintain **max 3 active implementation lanes and 1 independent QA lane**. Reserve at least one future implementation slot for incoming critical findings **once an existing lane closes**. Supporting source-only triage does not consume an implementation slot but must not conflict with owners.
6. **Handoff-to-fix contract:** owner, task and branch, base SHA, file ownership, preconditions, isolated tests, negative tests, exit criteria, rollback, independent A60 reviewer, explicit authorization. Retire/replace prior plans only through DECISIONS.md.
7. **Report reconciliation:** produce `WEB-005-00-WEB004-NEXT-INTAKE-R1` with `NEW / DUPLICATE / ALREADY_FIXED_UNVERIFIED / NEEDS_REPRO / DEFERRED / BLOCKED` classification; a severity-ranked queue; impact on Wave2 and critical path.

### Capacity and escalation

- **No new agent threads yet** merely because a larger report is expected. Create specialists based on validated clusters and actual backlog after report arrival.
- **Wave 2 remains HOLD** until the first-wave P0 release dependencies have been reviewed; urgent P0 findings can be analyzed immediately and coordinator may reprioritize before implementation.
- Cross-cutting findings with same affected API/DB/UI should be grouped by shared owner and dependencies, not one agent per bug.
- Preserve source-vs-runtime evidence, exact commit SHA, and no production/Replit access.
