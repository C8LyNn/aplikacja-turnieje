# WEB-005 / DECISIONS

**Owner:** 00 — Implementation Lead; **R3 date:** 2026-10-14. Read with `BACKLOG.md`. All refs verified against private GitHub repository. No production access.

| ID | Decision | State | Basis / condition |
|---|---|---|---|
| D001 | Replit FROZEN, production config/DB/secrets untouched | ENFORCED | User instruction; no Replit tool calls |
| D002 | PR #32 release merge and deploy | STOP | 856 files, incomplete gates, unresolved migration/auth |
| D003 | T010 Pack19 minimal contract fix / PR #35 | QA_REVIEW GO | Verified CI Pack19 8/8 and unchanged read-only/snapshot intent; independent A60 to accept |
| D004 | T020 ledger, manifest, preflight and recovery analysis | GO | Source-only; no SQL changes or database execution by 00 |
| D005 | T020 proposed canonical manifest 0027–0040 | **CONCEPTUAL GO FOR FIXTURE DESIGN ONLY / IMPLEMENTATION STOP** | 0030–0031 release; 0032–0040 editor. Require raw checksums, ledger/canonical history, SQL BEGIN/COMMIT normalization, PostgreSQL16 clean and historical upgrade runs, independent A60, final 00 approval. |
| D006 | T030 code hardening of catalog 3 writes | QA_REVIEW GO | Fail-closed role separation, no production secret |
| D007 | T130-A60 independent QA | GO | Reviews, not implements, tested code |
| D008 | T040–T060 wave2 and later waves | HOLD | Wave1 unresolved; PR #7 and #27 stacked |
| D009 | CI release certification | STOP | Pack19 green **in PR35 only**; Pack20 real FAIL; rest skipped; T030 PR34 CI fails earlier Pack19 |
| D010 | Any merge/release/deployment/prod token provisioning | OWNER/HQ APPROVAL REQUIRED | Never implied by PR or code review |
| D011 | WEB-004 complete consolidated handoff | BLOCKED/B001 | Missing; provisional backlog |
| D012 | Pinned release baseline | CONFIRMED | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` unchanged |
| D013 | Central registers only on `chore/web-005/t000-wave1-control` | ENFORCED | Do not touch release/main |
| **D014** | Assign T015-A40 to Pack20–26 source-contract repair | **GO CONDITIONAL** | Branch now `f6e94aae9239d578e23d5a8fb23a2446ea669a41`, PR #36 OPEN DRAFT; exclusive contracts Pack20/21/25/26; no Pack19 overlap; test suites not executed; A60 acceptance required |
| **D015** | Assign T131-A50 to isolated PostgreSQL16 + test-execution preflight | **GO PREFLIGHT** | Environment support, not implementation nor independent QA; no use of production DB |
| **D016** | Keep T010-A10 confined to Pack19 closeout | **ENFORCED** | Free implementation slot to A40, A60 independent acceptance |
| **D017** | Select PR #34 as preferred Steam Catalog security implementation | **DECIDED FOR QA ONLY** | Reference middleware matches editor; 403/503 distinction; deeper PostgreSQL HTTP/no-write fixture. Runtime tests not executed, merge STOP |
| **D018** | Classify PR #33 as superseded alternative | **HOLD / OPEN** | Do not close or merge yet; decision documented |
| **D019** | Integration ordering | **PLAN ONLY** | release baseline -> reviewed PR35 -> reviewed T015 -> QA-approved PR34 -> full isolated gates; T020 SQL separate |
| **D020** | Dedicated integration branch | **BLOCKED** | Creation attempt blocked by tool safeguards. Do not bypass, no branch created, no code integration authorized |
| **D021** | Maximum concurrent implementation lanes | **3** | T015/A40, T020/A20, T030/A30; T010 closeout only; T131 support; T130 QA |
| **D022** | Wave1 release gate | **NO-GO** | CI red and missing runtime auth/integration/DB upgrades |

## Confirmed CI evidence

- [GitHub Actions 38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899) at T010 `7cb283aa...`: safety 23/23, Pack19 readiness 26/26, Pack19 source 8/8, Pack20 domain 15/15 PASS; Pack20 source 6/7 FAIL; downstream SKIPPED.
- [GitHub Actions 38550962951](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550962951) at T030 `030d0f5f...`: Pack19 FAIL because T010 change absent; unrelated to auth test correctness.
- [PR #36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) HEAD `f6e94aae9239d578e23d5a8fb23a2446ea669a41`: new source-contract repair commit `[skip ci]`, 4 files, **Node/Pack17 NOT_EXECUTED**.
- [PR #33](https://github.com/C8LyNn/aplikacja-turnieje/pull/33), [PR #34](https://github.com/C8LyNn/aplikacja-turnieje/pull/34), [PR #35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) remain OPEN draft.
- Source R2 migration JSON `WEB-005_T020_A10_R2_TARGET_MANIFEST_PROPOSAL.json`: 14 canonical entries 0027–0040, raw SHA-256, logical ID and postconditions; `runtime_rendered_sha256=null` and historic ledger attestation absent; **not migration test PASS**.

## No unauthorized operations

No modifications to main/release, no merges/cherry-picks/deployments or production SQL. No paid workflow was intentionally dispatched by 00. Source/CI evidence is not a claim about deployed Replit runtime.


## R3 live-update decision

**D023 — T015 R1 handoff:** [PR #36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) created after coordinator registered task; accept for independent A60 review (GO QA), **STOP** integration/merge while tests remain NOT_EXECUTED. Latest HEAD `f6e94aae9239d578e23d5a8fb23a2446ea669a41`. No workflow dispatch without cost authorization.


## R4 decisions — reuse completed specialists without exceeding Wave1 limits

| ID | Decision | Status / qualification |
|---|---|---|
| D024 | Allocate T016-A10 to Agent 10 after T010 handoff | GO SOURCE-ONLY: map integration order, CI and Pack17 gates; no code merge or branch operations; A60 acceptance still required for PR35 |
| D025 | Allocate T132-A50 to Agent 50 after T131 preflight | GO SOURCE-ONLY: concrete test harness/fixture plan; runtime DB operations require proved isolation and authorization |
| D026 | Do not prematurely recycle Agent 40 | HOLD NEW T017 until independent QA/rework of PR36 completed; then Pack17 internal gate audit only, no Pack20–26 ownership collision |
| D027 | PR34 HEAD advanced to `fae2eea2f22df3f1b02ad035a7db00bc411ea73f` | Requires renewed independent QA at exact head; prior evidence may not cover new commits |
| D028 | Active implementation/analysis cap | THREE: T015/A40, T020/A20, T030/A30. T016/T132 preliminary read-only; T010 closeout, T130 independent QA. No Wave2 implementation |
| D029 | User dispatch through existing worker threads | PENDING: no automatic delegation to other conversations; repo registration is not execution |

No merge, deploy, Replit, production data/schema/secrets changes or paid CI dispatch were performed in this R4 assignment update.
