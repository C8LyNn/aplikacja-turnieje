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


## T031-A30 — NEXT ASSIGNMENT / SECURITY PROXY TRUST (2026-10-14)

**Status:** ASSIGNED FOR SOURCE-ONLY DESIGN AFTER T030 HANDOFF; CODE IMPLEMENTATION HOLD pending A60 T030 QA disposition and 00 explicit new-branch authorization. The external WEB-004 full follow-up report remains pending; SEC-013 is grounded in the available A80 R4 security register and independently checked upstream advisory. No production exploitation is claimed.

- **Owner:** Agent 30 (security) on a new, isolated task branch **to be created only at authorized implementation start**, proposed `fix/web-005/t031-proxy-trust-hardening`, from pinned release baseline `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. Do **not** add T031 changes to PR #34.
- **Sources:** WEB-004 A80 R4 SEC-013 HIGH (conditional runtime preconditions), OBS-A80-R3-02, and upstream GHSA-jqcg-44mw-7w3h/CVE-2026-90711. Verify current lock dependency before editing; baseline `pnpm-lock.yaml` resolves `proxy-addr@2.0.7` under Express, patched `2.0.8`; `artifacts/api-server/src/http/request-source.ts` accepts broad /0 and mapped-IPv6 CIDRs, default `trust proxy=false`.
- **Task:** map indirect dependency/upgrade paths; specify safe minimal lockfile upgrade and `TRUSTED_PROXY_CIDRS` validation; design regression tests for untrusted `X-Forwarded-For`, loopback/current trusted proxy, short IPv4-mapped IPv6 prefixes and /0 deny, without false claims of deployed config. Verify backwards compatibility.
- **Ownership:** A30 owns source-only security design for request-source plus lock dependency. Before editing `pnpm-lock.yaml` coordinate exclusive ownership with A10 T016 integration. A60 independently QA T030 and later T031; A50 test environment only.
- **Acceptance:** a pinned-source R1 handoff with exact files, expected/actual negative tests, lock resolution, migration-free rollback, runtime/deployment evidence boundaries, and GO/STOP. No automatic paid CI, production secret access, GitHub merge, Replit or deploy.
- **Concurrency:** T031 source-only while T030 in QA_REVIEW; it may enter implementation only after T030 handoff is complete and agent 00 authorizes capacity under the max-three-implementation-lanes rule.


## WAVE R7 — AFTER R6 HANDOFF (2026-10-14)

**R7 objective:** WEB-005 continues implementing independently testable fixes, while SWARM-006 owns integration/release and SWARM-007 owns communication protocols, file taxonomy and Google Drive archiving architecture. No automatic merge or deploy. Incoming full consolidated WEB-004 findings remain an intake dependency; do not assume an unverified issue list.

**Fresh repository evidence:**
- PR #35 Pack19: OPEN DRAFT `7cb283aa82273a1e22daf9051a82311eef53760c`, Pack19 scoped CI PASS; workflow later FAIL on Pack20.
- PR #36 Pack20–26: OPEN DRAFT `85ad0b86136fc3491c9ef18663d9b01396179349`, A60 source acceptance reported; native repository suites/Pack17 --full NOT_EXECUTED.
- PR #34 Steam Catalog: OPEN DRAFT `fae2eea2f22df3f1b02ad035a7db00bc411ea73f`, A60 source acceptance reported; HTTP/PG runtime NOT_EXECUTED.
- **NEW PR #37** T031 Proxy Trust: OPEN DRAFT `fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7`, 5 files, dependency override `proxy-addr@2.0.8` and request-source tests; isolated HTTP/typecheck pending independent QA.
- **NEW PR #38** T021 offline Migration Ledger Validator: OPEN DRAFT `2d36864f4d2f1c838073f387fd3c8efb3378c43b`, 7 new files, author reports 37/37 local Node tests, NO SQL/PG use. GH Actions run 38569859562 FAIL at baseline Pack19 before running validator tests.
- PR #33 Steam Catalog alternative remains HOLD; PR #32 release remains open; release baseline unchanged `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.
- A10/T018 package P01–P03 SOURCE_READY / QA_PENDING or conditional; A40/T017 SOURCE-ONLY audit identified fail-open/omitted Pack17 gates; A50/T133 source runner assembled but full application execution unproven; A70/T040 MP1→MP4 plan prepared.

### R7 assignments and capacity

| Owner | Work | Authorized scope | Gate |
|---|---|---|---|
| A10 | T018 R2: extend SWARM-006 package manifest with P04=PR37 and P05=PR38, **conditional only** | READ-ONLY/package handoff; preserve QA provenance and exact SHAs | No merge or integration by WEB-005 |
| A20 | T021 R2: validator QA repair and test evidence | READ-ONLY until concrete A60 feedback; no runner/SQL/DDL | New PR38 source QA |
| A30 | T031 R5: security QA repair and T032 session lifecycle outline (SEC-002/007/008) | T031 bugfix-only if independent QA requests; T032 design only | No unapproved lockfile conflict or additional implementation |
| A40 | T017 R2: bounded Pack17 fail-closed gate repair | **Implementation lane 1 (GO code-only)** after checking A60 T015 source acceptance, isolated task branch, no CI billing | True repository suite still needed |
| A50 | T133 R2: runner handoff/actual execution support for 006 with safe disposable Node22/pnpm10/PG16 | INFRA support, no production connections; no runtime PASS unless executed | Independent A60 checks evidence |
| A60 | T130 R7: independent QA of PR37, PR38, T017 and MP1, maintain earlier PR35/36/34 exact SHA certifications | READ-ONLY independent QA | No reviewer-self-approval |
| A70 | T040 R4: implement **MP1 cancel/restore bypass protections only** test-first as isolated code-only patch | **Implementation lane 2 (GO narrow code-only)**, don't port all #7/#27, no DB migration, no integration | Later MP2 Undo requires separate GO |

**Reserve lane 3 for validated new P0 finding from the next WEB-004 consolidated handoff.** No additional implementation lanes until one is free. If new WEB-004 P0 overlaps A40/A70, coordinator reprioritizes before opening another patch.

**SWARM-007 protocol handoff:** A10/A50/A60 prepare hashes, reports, artifact types, owners and status; do not invent Google Drive folders/links or manually assert created architecture. SWARM-007 owns actual Drive folder setup and information exchange standards. SWARM-006 alone owns assembled integration candidate, full integrated tests, staging and release process under HQ authorization.

**NO-GO:** no integrated SHA, Pack17 --full/regression/HTTP/PG migrations uncertified, current PRs OPEN DRAFT; no deployment authorization.


## WAVE NEXT — WEB-004 BUG HUNTING 002 HANDOFF R2 (2026-10-14)

**Canonical detailed plan:** [WEB-005_WAVE_NEXT_IMPLEMENTATION_PLAN_R1.md](./WEB-005_WAVE_NEXT_IMPLEMENTATION_PLAN_R1.md). WEB-004 A00 final source consolidation accepted for triage, **WEB-004 A60 final cross-report countersign pending**. No unexecuted test counts as PASS. New verified PR #39 is **T040 MP1 Cancel/Restore** at SHA **3e0a2dd64d03df5a85b7875af7dc012c796d01b3**: 6 changed files, OPEN DRAFT, PostgreSQL/React parity NOT_EXECUTED, CI #38573071825 FAIL at baseline Pack19; **do not reimplement MP1**.

### Existing tasks — deduplicated
- **T017/A40, T018/A10, T130/A60, T133/A50:** full CI/Pack17/PG/browser gates; no shared-SHA runtime PASS.
- **T020/T021/A20:** migration 0027–0040 ledger/0030–0031, PR #38 offline validator only, no SQL GO.
- **T030/T031/A30:** Steam auth PR #34 (PR #33 alternative HOLD) and proxy PR #37; require HTTP/PG/security independent QA.
- **T040/A70:** MP1 PR #39 proposed; MP2 GLOBAL UNDO LIFO including revert_match and direct Revert CAS, MP3 Host/codegen, MP4 regression **not yet authorized as code**.
- **Partial main-only/source-mitigated/withdrawn IDs:** preserve as regression only; A52-F001/F002, BIZ-21-09/12 WITHDRAWN; BIZ-21-18 corrected source on release; don't create duplicate fixes.

### New R2 task queue — source-only until scoped GO
| Task | Priority | Agent | Source IDs / purpose | Readiness/dependency |
|---|---|---|---|---|
| **T050** stage lifecycle | P0 gate/P1 | **80 proposed** | A52-F022 terminal Swiss, A52-F019 RR restore, A52-F018 SE pointer | terminal Swiss/SE policies and no simultaneous revert-match.ts edits with A70 |
| **T051** sporting rules | P1 | **80 proposed** | BIZ-21-17 Swiss non-rematches, BIZ-21-19 DE 2–N, BIZ-21-18 RR retest only | sign Swiss/RR/DE rules, deterministic fixtures |
| **T060** Backup V3 | **P0** | **90 proposed** | A51-F034 approved output/routes, F037 match/history, F020=A50-F026 snapshot, revision/legacy | PG16 + backup policy, conflict-map with T040/T020; candidate next implementation lane 3 only after GO |
| **T080** session/privacy | P1 | **100 proposed** | SEC-021/006 revocation races, SEC-022=UX-030 private cache | separate backend/frontend PR, policy TTL/token if needed |
| **T055** basket CAS | P1 | **110 proposed** | UX-047 lost-update; atomic versioned PUT 409/412, retained draft | POLICY-BASKET, stage DB version |
| **T110** frontend async | P1/P2 | **110 proposed** | UX-042 FileReader, UX-044 Host drafts, UX-045 new backup preview, UX-046 modal | exclude withdrawn direct basket-panel draft transfer/backup overwrite claim |
| **T100** presentation | P2 | **120 proposed** | A20 F052/F053/F055/F058; F054 source-retention QA only | after lifecycle semantics and browser fixtures |

**Operating cap:** A40/T017 and A70/T040 retain current implementation lanes (until confirmed closed); **lane 3 reserved for T060-B1** and requires separate explicit implementation GO. New proposed agents may perform source-only design or test contracts without touching implementations; don't silently create extra code lanes. A60 remains the single independent QA lane. Source report R2 final 38 rows: 0 PASS / 3 external-CI FAIL / 33 BLOCKED / 2 NOT RUN; do not overwrite with the older 29-case draft.

**Testing:** isolated PostgreSQL16/Node22/pnpm10 (A50 preflight); 15 grouped suites Q01–Q15, notably global LIFO/CAS, terminal Swiss, RR/SE, backup QP/QPE/OP, history, MVCC, session/cache, basket CAS, generated API/client parity, Steam security, full Pack19–26 & Pack17 --full. Full acceptance per exact composite SHA is owned by SWARM-006; WEB-005 packages only.

**Cross-swarm:** SWARM-006 owns integration, staging and eventual release proposal; SWARM-007 owns communication/Google Drive folder and report architecture, not WEB-005. No asserted Drive sync, deployment, merge, migration or production changes.


### R8 coordination delta — latest T017 / T040 heads

- T017/A40 **PR #40 now exists**: \`f9ad033683d93e442c7915a840e7b3f8bfdbb933\`, 3 Pack17-only files, author synthetic 19/19, full \`--full\` PG/CI NOT_EXECUTED. A40 is now QA/fix-only; do not duplicate implementation.
- T040/A70 MP1 **PR #39 advanced**: \`16053ee132756ca05b6f2cd1f0cabae823905387\`, 8 files including backend/API Zod; real PG16/HTTP + generated React parity pending. A70 source QA/MP2 design only until a new scoped GO.
- A10 should track **P01–P07** with P06=PR39 and P07=PR40, all QA provenance explicit.
- Proposed agents 80/90/100/110/120 are **SOURCE-ONLY** at start. Code lanes are not automatically freed merely by creating a draft PR.


## Batch accumulation for SWARM-006 (owner decision, 2026-10-14)

**Current direction:** collect **more substantive, compatible and independently QA-tracked** repair packages before activating SWARM-006 for a WEB-005 integration wave. Existing P01–P07 preparation is an internal buffer, **not a send-now instruction**. Keep per-PR SHA, test evidence, dependencies and rollback current as PRs evolve; add future P08+ from T050/T060/T080/T055/etc only when actual patches exist and receive the appropriate acceptance.

**Batch-release trigger:** coordinator proposes one coherent batch after enough cross-module repairs reach independent source acceptance and safe test executability; owner/HQ then explicitly authorizes the SWARM-006 intake/integration wave. Do not require an arbitrary fixed number of PRs and do not wait forever for the entire open WEB-004 bug backlog. Escalate emergency/high-severity safety exceptions separately for owner decision.

**Status:** `BATCH_BUFFERED_NOT_DISPATCHED`; production/release remains NO-GO; WEB-005 continues fixes/QA, SWARM-007 file-communication architecture remains independently planned.


## Final-only integration protocol — owner directive 2026-10-14

**Supersedes the earlier "send after meaningful batch" suggestion:** WEB-005 must first complete the accepted remediation backlog originating from WEB-004 HANDOFF R2. WEB-004 confirmed that no additional audit report cycle is currently required; do **not** solicit or invent new WEB-004 tickets. Continue implementation and isolated test/independent QA, including P01–P07 and queued T040/T050/T051/T060/T080/T055/T110/T100, respecting agreed task priorities and bounded concurrency.

**Closeout checklist:** (1) every accepted task has a disposition with task owner and exact PR SHA or owner-signed `BLOCKED`/`POLICY_OPEN`/`WONT_FIX`, (2) A60 independently judges scoped source/runtime evidence without claiming unavailable tests passed, (3) approved product policy decisions and known unresolved risks are enumerated, (4) A10 maintains exact-source final manifest and conflict/dependency/rollback plan, (5) 00 authors a consolidated `WEB-005_FINAL_HANDOFF_TO_SWARM-006` and requests owner/HQ final transfer authorization. Do not equate a draft PR or partial local harness test with closed implementation.

**External work separation:** SWARM-006 is **not activated for WEB-005 until final WEB-005 closeout**; once handed over, SWARM-006 resolves cross-PR integration, runs full integrated CI/API/PG16/browser tests on a composite SHA, prepares controlled staging/release under HQ permission. SWARM-007 independently defines communication rules, creates Drive folder architecture and handles artifact/versioning protocols, without being assumed to have created remote folders.

**Status:** `WEB005_IN_PROGRESS / SWARM006_FINAL_HANDOFF_DEFERRED`. No WEB-004 additional reports currently requested. This overrides earlier interim P01–P05/P01–P07 dispatch recommendations but does not discard their source-ready internal packages.

## R9 continuation after finished specialist wave (2026-10-14)

Canonical next wave: [WEB-005_NEXT_REMEDIATION_WAVE_R9.md](./WEB-005_NEXT_REMEDIATION_WAVE_R9.md).

Existing P01–P07 are internal SOURCE_READY candidate draft PRs, not integrated. PR39 latest HEAD 16053ee132756ca05b6f2cd1f0cabae823905387; PR40 HEAD 9a8287271299a59fc9291b8d253299a8d109a35d. Author contract Pack17 24/24 and A50 harness 50/50 do **not** equal real PostgreSQL/API/frontend PASS.

R9 proposed code-only slots: A90/T060-B1 Backup V3 fail-closed preclone validator P0; A70/T040-MP2A global Undo LIFO recheck under lock P0; A100/T080-S1 session revocation reauthorization after lock P1. Separate scoped agent order required for each. A80/A110/A120 remain source-only until policy and file owners resolved. A10 keeps manifest internal, A50 works on isolated test environment, A60 independent QA. SWARM-006 stays HOLD until full WEB-005 backlog closeout; WEB-004 asks no new reports.


## Central wave prompts: R9

Authoritative agent assignments for R9 (13 roles, including A00) are stored in **[WEB-005_WAVE_R9_AGENT_PROMPTS.md](./WEB-005_WAVE_R9_AGENT_PROMPTS.md)**. All participating agents read §0–§2, then only their agent-ID section. A90/T060-B1, A70/T040-MP2A and A100/T080-S1 are the three narrowly scoped implementation lanes; all other agents perform QA, evidence, policy/test-design or manifest work. Existing PR #34–40 must not be implemented again. WEB-005 completes its approved backlog before a single final handoff; SWARM-006 remains HOLD. No new WEB-004 audit campaign requested.


## WEB-005 WAVE R10 — central agent prompts and resumed implementation (2026-10-14)

**Source:** [WEB-005_WAVE_R10_AGENT_PROMPTS.md](./WEB-005_WAVE_R10_AGENT_PROMPTS.md) — one central dispatch document for A00+A10–A120. R9 created P08=PR #41 (Backup V3 B1, HEAD e847cb705296a48ab5c68ece96776cd0e0bbb417) and P09=PR #42 (Undo LIFO MP2A, HEAD 1ae0ccb801f4177052bff1ec7041e55b8c992c8b), **both draft, PG16 runtime NOT_EXECUTED, independent QA pending**. A100/S1 was BLOCKED in R9 due to routes/tournaments.ts file ownership and has documentation only.

**New R10 code-only lanes (max 3):** A100/T080-S1A organizer/support post-lock authorization and bans/game-picks, A80/T050 RR multi-stage revert eliminates accidental resurrection of prior-stage players, A110/T110-UX042 stale FileReader callback identity guard. A70 R9 PR42 frozen and yields routes/tournaments.ts and revert-match.ts ownership for R10 subject to coordinator conflict checks. A90 B1 QA + B2/B3 design only. A120 T100 patch-ready design only. A10 maintains internal P01–P09+ manifests; A50 real safe tests; A60 independent QA.

**Owner boundary:** no WEB-004 new reports; WEB-005 completion before ONE final handoff to SWARM-006; no interim dispatch, merge, SQL migration or deploy. WEB-005 release remains NO-GO. Policy-sensitive T050 Swiss, SE, T055 CAS, DE and Backup B2/B3 remain on hold pending owner/HQ decisions.


## WAVE R11 — central prompt packet and priority update (2026-10-14)

**Central source:** [WEB-005_WAVE_R11_AGENT_PROMPTS.md](./WEB-005_WAVE_R11_AGENT_PROMPTS.md) with §§0–2 common rules and 13 AGENT Axx sections.

R10 implementation is **source patches only** (NOT integrated): **P10 PR #43** T110 UX042 FileReader A→B, **P11 PR #44** T080 S1A organizer/support post-lock bans/picks, **P12 PR #45** T050 terminal RR reopening scope. All three OPEN DRAFT, actual app test and independent exact-SHA QA not yet proven. Earlier **P08 PR #41** Backup B1 and **P09 PR #42** global Undo LIFO also require isolated PostgreSQL 16 and independent acceptance. Existing **P01–P07** unchanged unless fresh HEAD proves otherwise; total **P01–P12 = 12 internal candidate patches**, not a release or integrated candidate.

**R11 code lanes (GO narrow source-only, max 3):** A90/T060-B3A consistent repeatable-read export snapshot, A100/T080-S1B-D tournament DELETE post-lock auth, A120/T100 PR-A DE Details/format labels/completed overlay. Do not duplicate P08/P09/P10/P11/P12; no automatic merge or cherry-pick of previous drafts. Preserve file ownership and owner policies; HOLD on conflict.

**P0 unblock work:** A50 physical disposable PG16 test environment and actual per-SHA execution, A60 independent source/runtime review PR41–45; if environment unavailable label BLOCKED and provide executable test prerequisites. A10 maintains rolling P01–P12+ internal manifest and metadata for SWARM-007. A20/A30/A40 maintain migration/security/CI gates; A70 MP2B and history source-only, A80 terminal Swiss/SE sports policy source-only, A110 T055 basket CAS and remaining UX source-only. **NO SWARM-006 activation until WEB-005 whole approved backlog completed**. No new WEB-004 audit cycle.

**Release state: NO-GO.** Actual status != author's source code completion; no production/shared DB, no schema adoption, no CI billing, no Replit.


## WAVE R12 — central prompts and evidence gate (2026-10-14)

**Master R12 assignments (A00+A10–A120):** [WEB-005_WAVE_R12_AGENT_PROMPTS.md](./WEB-005_WAVE_R12_AGENT_PROMPTS.md). All agents read §0–§2 and their own Axx section. Do not regenerate/deduplicate previous source patches.

**R11 result:** three new DRAFT PRs: #46 protected DELETE tournament (A100/T080-S1B-D), #47 presentation PR-A DE Details/format labels/completed overlay (A120/T100), #48 consistent `REPEATABLE READ READ ONLY` Backup V3 export (A90/T060-B3A). HEADs and PG/React acceptance are pinned in central R12 document. Together with P01–P12, **15 candidate PRs exist**, all open unmerged, not an integrated build.

**CI R11 blocker:** automatic Actions on isolated new PRs failed at **old baseline Pack19 `qa/pack19/source-contract.test.mjs` matcher** requiring obsolete `readOnly:true` while release code uses `accessMode:"read only"`. P01 PR35 already fixes the matcher but has not been merged with other standalone PRs. Do not file second Pack19 patch or claim this is a B3A/DELETE/presentation app-test FAIL. A40/A50 verify exact GitHub job logs and proceed with appropriately scoped independent tests, **without creating WEB-005 composite integration branch**.

**R12 GO SOURCE-CODE ONLY code lanes (max 3):** A70/T040 malformed historical Undo payload fail-closed, A100/T080 S1B-P post-lock support/viewer password+visibility writes, A110/T110 UX045 backup preview FileReader identity and stale new-credential form state. Strict files and policy stops. All other agents support source QA, fixture design, manifest, testing and policy decisions.

**P0 global requirement:** A50 obtain actual safe Node/pnpm/isolated PG16 + frontend targeted exit evidence; A60 independently review exact PR HEAD, especially PR41–48. Reports/matrices classify `PATCH_PROPOSED` vs `RUNTIME_VERIFIED` and `BLOCKED`. A10 buffer P01–P15+ internally, confirms actual P13–P15 IDs using own R11 manifest, does not send SWARM-006.

**Cross-swarm:** no extra WEB-004 reports; WEB-005 completes full accepted backlog before one final handoff; SWARM-006 inactive until formal closeout; SWARM-007 designs communication and Google Drive structure separately. Production/release NO-GO.


## R13 — centralized agent wave (2026-10-14)

**Master R13:** [WEB-005_WAVE_R13_AGENT_PROMPTS.md](./WEB-005_WAVE_R13_AGENT_PROMPTS.md) — 13 exact agent sections, shared §0–§2, conditions/GO/STOP, immutable SHA and individual R13 reports.

**R12 actual new drafts:** PR #49 (A100 T080-S1B-P, POST-lock password/visibility, 17 authored PG tests), PR #50 (A110 UX045 backup-preview scope/epoch + password hygiene, 10 authored RTL), PR #51 (A70 T040 historical malformed Undo fail-closed, 17 authored PG cases). HEADs exact in central R13 file. Combined with P01–P15, total **18 unmerged draft patches PR34–51**; PR32 release→main and competing PR33 remain separate. There is **no composite SHA** and no demonstrated app-level acceptance on all drafts. R12 reports are author/source evidence, not native test execution.

**R13 operating priority:** emphasize **actual targeted runtime test execution** A50 (frontend without DB first; disposable physically isolated PG16 only after safe preflight) and independent A60 source/PG/RTL acceptance across existing PRs. Author synthetic tests do not count as native app PASS. Unrelated automated CI Pack19 old matcher failure persists on release-derived draft branches; PR35 already fixes it; full integration gates cannot be waived.

**Conditional small frontend code lanes:** A100/T080-S2A privacy cache after auth logout/revocation, A110/T110-UX046 stale stage modal, A120/T100-PR-B RR external standings freshness. **Code only upon source-confirmed gap; otherwise NO_NEW_PATCH**. No fourth code lane; no unapproved sport/basket/backup/API policy changes. A70/A80/A90 source-only policy/QA work; A10 P01–P18 internal manifest, A20 migration readiness, A30 security review, A40 CI gate.

**Final boundary unchanged:** no more WEB-004 reports, no intermediate SWARM-006 packets. Finish approved WEB-005 backlog, independently validate and obtain owner policy dispositions, then seek authorization for ONE final SWARM-006 handoff. SWARM-007 Drive/communication infrastructure remains separate. Release NO-GO.


## R14 — QUALITY GATE / 2026-10-14

**Master 13-agent R14:** [WEB-005_WAVE_R14_AGENT_PROMPTS.md](./WEB-005_WAVE_R14_AGENT_PROMPTS.md). Each A00/A10–A120 thread reads §0–§2 and its own `AGENT Axx` scope.

**R13 new source patches:** PR52 A110 UX046 stale stage modal HEAD `cce73ec47445102b216b3f8eceb4ec9de67eb1a7` (7 authored RTL); PR53 A100 S2A private auth cache HEAD `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979` (9 authored React tests); PR54 A120 RR canonical readback HEAD `dbba0eb82920b4f324866b1b983e1211459f52ec` (6 authored RTL). **Targeted runtime tests NOT_EXECUTED per author reports; A60 final independent exact-SHA acceptance not established.** All three OPEN DRAFT, not merged. Existing PR34–51 remain open draft. Thus **21 internal draft source candidates PR34–54**, excluding unrelated release PR32 and alternative HOLD PR33. No composite HEAD; no release acceptance.

**GitHub CI:** automatic runs 38605694664/38606179795/38606249912 FAIL on prior `Pack 19 snapshot consistency tests`, before R13 target tests. This is the old release matcher `readOnly:true` vs current source `accessMode:"read only"`; existing separate PR35 corrects matcher. Do not invent a second patch or count the blocked CI stage as a feature-specific test verdict; full integrated gates are not waived.

**R14 control:** No automatically authorized code lanes; A50 P0 exact SHA frontend + physically isolated PG16 tests or executable blocker; A60 P0 independent source/runtime per-packet matrix; A10 current P01–P21+ manifest + conflict/dependency DAG. A00 requests owner/HQ decisions (Swiss terminal, SE/Swiss/DE, Basket CAS, Backup B2, Direct Revert CAS, Steam/session) and reconciles entire WEB-004 R2 backlog. A20/A30/A40 source/security/CI QA and A70/A80/A90/A100/A110/A120 narrow owner-source support. Separate new scoped code GO only for confirmed independent FAIL, not draft accumulation.

**Final-only boundary:** No WEB-004 report cycle; WEB-005 completes approved scope and independent QA before one consolidated handoff to SWARM-006, which alone integrates and prepares release later. SWARM-007 handles communications/Drive architecture independently. **RELEASE NO-GO / SWARM-006 HOLD.**


## R15 — direct QA receipts and conditional security repair (2026-10-14)

**Central 13-agent instruction file:** [WEB-005_WAVE_R15_AGENT_PROMPTS.md](./WEB-005_WAVE_R15_AGENT_PROMPTS.md). Shared §0–§2, one AGENT Axx section, exact Sha snapshot and explicit report permalink/receipts. A00 local coordinator under global HQ.

**R14 completion:** no new implementation PR; all **21 PR34–54 remain OPEN DRAFT and unmerged**, R14 A10 registry P01–P21 internal-only with integrated_sha=null, per-package final QA/RUNTIME_VERIFIED not established. A80/A110/A120 reports visible on control branch; A70/A90/A100 R14 documents on separate docs branches. Direct final A50/A60 R14 report and executed test receipts were **not located by available coordinator inspection**; do not infer from secondary A10 quoted matrices. R15 must require directly inspectable A50/A60 reports, exact SHA tested, commands/exit, independent signed verdicts.

**R15 P0:** stop abstract QA repetition; A50 produce actual frontend-only RTL/typecheck per PR43/47/50/52/53/54 if physical full checkout+deps exist, then actual disposable isolated PG16 targeted tests with A20 signed safety preflight and owner reset consent; else one reproducible Windows/approved executor runbook + precise access blocker. A60 publish direct independent source QA matrix, prioritize PR53 blind spots, exact PR source-review and R14 conditional source signoffs.

**Security gap to triage (from A100 R14):** PR53 auth query-cache eviction uses URL-prefix queryKey matcher; `["tournaments",id,"player-bans"]` and `["matches",matchId,"game-picks"]` are outside that matcher. Match key needs match→tournament ownership mapping before targeted eviction, not broad global purge. Existing `use-tournament-auth.test.tsx` wraps AuthProvider without QueryClientProvider required by PR53. These are SOURCE_CONFIRMED incompatibilities, **runtime user-data leakage / actual test failure still not executed/proven**. A100 S2B conditional one-lane CODE HOLD pending A60 independent source FAIL or A50 reproduction and explicit A00 `R15-S2B-CODE-GO`.

**Owner decisions still blocking code:** T055 Basket CAS 409/412/version token; Swiss TS-A deny vs TS-B reopen, SE/Swiss/DE ranking; Backup B2 portable history/CAS/legacy; Direct Revert strict CAS+Host, Steam/session. A70/A80/A90/A110 prepare owner-signable choices, no guessed policy implementation. WEB-005 completes entire approved WEB-004 R2 backlog before single final SWARM-006 integration transfer; no new WEB-004 reports, no premature merge/release.
