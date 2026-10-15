# WEB-005 — A60 R23A FINAL INDEPENDENT QA — PR #36 PACK20–26

**Task:** WEB-005-T130-A60-R23A-EXACT-SHA-CLOSEOUT · **Date:** 2026-10-15 Europe/Warsaw
**Independent verdict:** **PASS WITH CONDITIONS** for the bounded **transaction-options comment-spoof matcher fix**; separate **P2 response-comment spoof** persists in Pack25. **HANDOFF_NOT_READY / RELEASE_NO_GO / SWARM006_HOLD**.

## HEAD and authorized changed files

- [PR #36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) **OPEN DRAFT / UNMERGED**, HEAD **4be68fdd48ee3529029dc4dd2952780ba37853e7**, base **1fdc401d87c6bffe6bf7312dfc9db681b689dcf7**.
- Compared with previously reviewed R4 head **85ad0b86136fc3491c9ef18663d9b01396179349**: five new commits, zero behind: 410401abd399d31ea51578f807a07b05eb0ce44e fail-first Pack20 probe; 1b209150614ff04cf0fcf2a6b3f7add717596d41 Pack20 fix; 99f9a105947a92d5053aeedff1a815014933a60c Pack21 fix; 46df97b0c205c630a689d0961c87b501f89749a4 Pack25 fix; **4be68fdd48ee3529029dc4dd2952780ba37853e7** Pack26 fix.
- Four edited paths only, all exact GitHub HEAD files independently read:
  - qa/pack20/source-contract.test.mjs — blob **42359d5116038f515a4b8504bad2fcc0f0df5b26**
  - qa/pack21/source-contract.test.mjs — blob **38d8a96870b31c604b86d010d53b5f40dbd359d6**
  - qa/pack25/source-contract.test.mjs — blob **f9d3eff6b18e74ebe00d6ec8c9a1b0628f081ee1**
  - qa/pack26/source-contract.test.mjs — blob **dd06d0cfba9db9c772e5559e0fbe1915e8e51385**
- No backend, migration, Pack17, Pack19, GitHub workflow or production writes changed. [PR35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) HEAD **7cb283aa82273a1e22daf9051a82311eef53760c** is unchanged, touches only qa/pack19/source-contract.test.mjs (blob 5726986dca6a6fd7309bb883eb1106d2d19fb14e); there is no path collision. Actual server transaction options match Drizzle isolationLevel:"repeatable read",accessMode:"read only" on release source.

## Independent source analysis

**Positive:** Pack20/21/25/26 now strip line and block comments from route source *before* applying the snapshot-options regex; same object must contain both repeatable read and read only, in either property order. Source negative fixtures reject missing/downgraded isolation, missing/write-enabled access, duplicate/conflicting property names, and line/block comment text that fakes legal options. Pack20 adds authored test cases for both spoof forms; Pack21/25/26 reuse hardened matcher. Pack22–24 remain untouched; Pack25 four-field shorthand response requirement and Pack26 risk-report source rules remain in the code. Existing Pack19 standalone patch remains independent, narrower and order-dependent, but matches real route order; this is source compatibility only, not a combined test.

**P0: 0 newly demonstrated. P1: 0 newly demonstrated.**

**P2-01, PRE-EXISTING PACK25 RESPONSE-COMMENT FALSE PASS:** The [Pack25 responseFields matcher](https://github.com/C8LyNn/aplikacja-turnieje/blob/4be68fdd48ee3529029dc4dd2952780ba37853e7/qa/pack25/source-contract.test.mjs#L30-L61) applies a return-object regex to unstripped raw source and checks only that exactly one matching shorthand return contains actionPlan, diagnostic, impactGraph and impactRiskReport. Given representative unsafe input:

    return result;
    // return { ...result, actionPlan, diagnostic, impactGraph, impactRiskReport };

the matcher treats the commented line as the one real return and **accepts the unsafe response**, as independently reproduced by A60's synthetic Node probe. It does not enforce executable return semantics. This issue **predates the five R23A commits** and is not a regression introduced by the new comment-sanitization change; nonetheless **fully comment-spoof-safe Pack25 cannot be signed off**. Missing graph without a spoof and explicit impactGraph: undefined are correctly rejected. **A40 action:** add test-first negative case for fake commented return plus a real return without graph, then use sanitized executable return extraction or a TS AST-aware test; issue own new scoped fix SHA and obtain separate exact-SHA QA. Do not weaken the current four-field check.

**Residual:** Regex stripping is not a full parser; string literals and unrelated syntactically similar constructs may still produce false positives or false negatives. No PG read-only isolation runtime behavior was demonstrated by source regex alone.

## Actually executed tests vs authored tests

| Provenance | Execution and result | Interpretation |
|---|---|---|
| **A60 independent synthetic Node probes** | Executed: node --test /mnt/data/web005_a60_r23a/independent_contract_probes.test.mjs, **exit 0, 14 tests, 14 PASS, 0 FAIL, 0 SKIP**, Node v22.16.0 | Ten positive/negative transaction cases and four Pack25 shorthand-response probes. **One PASS deliberately means comment-spoof defect reproduced**, NOT that Pack25 is safe. These tests reproduce exact retrieved regex semantics in hand-constructed snippets, **NOT exact-source native monorepo tests** |
| **A40 author-reported fixture TAP** | [A40 R23A report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A40/WEB-005_A40_R23A_CI_PACK19_26_RECOVERY.md): **33/33 synthetic fixture PASS**, exit 0 | Author evidence only, not independent A60 execution or full PR36 native test |
| **PR36 current HEAD Github workflow** | Zero matching PR-head workflow runs returned in readback; five R23A commits were marked [skip ci] | **NO_CURRENT_CI / NOT_EXECUTED**, no red/green inference |
| **PR35 old live workflow** | [Actions run 38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899): Pack19 8/8 PASS; old Pack20 6/7 FAIL | Real but older separate PR SHA, cannot certify current PR36 |
| **Pack19–26 actual combined source contracts** | **NOT_EXECUTED, exit=null, TAP=null** | No full clean authorized repo/PR35+PR36 disposable overlay |
| **Pack20–26 domain/PG16, Pack17 --full, frontend/backend typecheck** | **NOT_EXECUTED** | Missing authorized physical executor and isolated disposable PG16; NO-GO |

A60 verified Github source files via connector; direct container download of exact raw GitHub file bytes was blocked by DNS, so the 14 independent tests are **synthetic**, not byte-identical native source tests. [A50 R23A execution report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R23A_DBFREE_EXECUTION.md) reports 0 native A50 executions for earlier PR56/57; cannot attribute those to PR36 or PR58.

## Formal verdict and owner next actions

**PASS WITH CONDITIONS — R23A four-file comment-sanitized TRANSACTION_OPTIONS_CONTRACT_SOURCE_ACCEPTED_SCOPED**, HEAD **4be68fdd48ee3529029dc4dd2952780ba37853e7**. Does **not** mean entire Pack19–26/Pack17/SE correction CI is accepted. A00 should authorize a narrow A40 follow-up for the remaining P2 Pack25 RESPONSE-comment spoof, and demand actual pinned Node source-contract tests on the PR35+PR36 file overlay in a disposable authorized checkout, then independent exact-merged-SHA full QA. Keep the P01/P02 PRs isolated, DRAFT, unmerged until release governance signoff.

**RELEASE_NO_GO / SWARM006_HOLD**. No author code modification, merge, schema mutation, paid workflow or deployment.
