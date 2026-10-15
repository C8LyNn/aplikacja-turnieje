# WEB-005 — R23B / A60 INDEPENDENT CORRECTION QA — PR #36

**Task:** WEB-005-T130-A60-R23B-FIX-CLOSEOUT | **Date:** 2026-10-15 Europe/Warsaw | **Scope:** Pack25 response-comment-spoof, independent source exact-SHA.

**Verdict: PASS WITH CONDITIONS** — **P36-P2-01 CLOSED in isolated source/test contract**, not the full Pack19–26 or release suite. **RELEASE_NO_GO / SWARM006_HOLD**.

## GitHub identity, diff, ownership

- [PR36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) current **OPEN/DRAFT/UNMERGED**, exact HEAD **24fe6c399e3a4fa82c3d96703620097fa941a59a**, base release **1fdc401d87c6bffe6bf7312dfc9db681b689dcf7**.
- Independently inspected GitHub compare 4be68fdd48ee3529029dc4dd2952780ba37853e7...24fe6c399e3a4fa82c3d96703620097fa941a59a: 2 commits ahead, 0 behind. **Test-first** RED commit **daef47233a630152e131e9c6b86d48f5530b6e0c** introduced negative fixtures; GREEN **24fe6c399e3a4fa82c3d96703620097fa941a59a** replaced unanchored raw response regex. Between these commits the **only edited file** is qa/pack25/source-contract.test.mjs, final blob SHA-1 **f38fe8b7af53a43ae560fe26fed1682ddcb7f608**, 142 lines; +53/-2 vs R23A. No source API, schema, DB, workflows or PR35 modification. Entire PR36 retains exactly four contract paths pack20/21/25/26.
- PR35 separate current HEAD **7cb283aa82273a1e22daf9051a82311eef53760c**, only qa/pack19/source-contract.test.mjs. Source-compatible at the unchanged actual Drizzle route; cross-PR execution **NOT_EXECUTED**.
- Independently re-fetched Pack20 blob **42359d5116038f515a4b8504bad2fcc0f0df5b26**, Pack21 **38d8a96870b31c604b86d010d53b5f40dbd359d6**, Pack26 **dd06d0cfba9db9c772e5559e0fbe1915e8e51385**: unchanged since R23A. Pack25 retains snapshot guard on sanitized route and no-write assertions.

## Independent source findings

P36-P2-01 was the prior defect: an unsafe actual response could hide behind a valid fake 'return { ...result, actionPlan, diagnostic, impactGraph, impactRiskReport };' in line/block comment. At exact HEAD [Pack25 lines 26–100](https://github.com/C8LyNn/aplikacja-turnieje/blob/24fe6c399e3a4fa82c3d96703620097fa941a59a/qa/pack25/source-contract.test.mjs#L26-L100), the new bounded lexical scan masks comments, double/single strings, and backtick literals while preserving structure; finds exactly one named 'const outcome = await db.transaction(async tx => {', balances braces within the callback, verifies transaction options immediately after callback, and requires the **final** consecutive code statements to compute impactRiskReport from impactGraph and return four **distinct exact shorthand** fields: actionPlan, diagnostic, impactGraph, impactRiskReport, in any order.

Negative authored probes cover line, block, multiline comment spoof; an unrelated function, conditional branch, real return without graph, string/template spoof, missing/duplicate/extra fields, and explicit undefined. A positive control with fake commented return followed by an actual correct return remains valid. Independently inspected [actual route on immutable release](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/routes/tournament-se-correction-readiness.ts#L39-L105): actual single transaction (line 39), risk computation (103), real four-field return (104), read-only repeatable-read config (105). No new mutation route or write permission is provided by this test-only PR.

**Defects on current narrow source:** P0=0, P1=0, P2=0 **new verified**. Former P36-P2-01 **SOURCE_FIXED**.

**Residual P2-risk (not a demonstrated current exploit):** this source test uses a bounded textual lexer, not a TypeScript AST/control-flow engine. Unusual regex literal slashes, template interpolation, source refactor, or unrelated matching syntactic contexts may require a future AST-aware oracle. It does not prove real transaction isolation, route authorization, or UI/no-write behavior at runtime; those are distinct release gates. If the legitimate callback changes shape the source test may fail closed; do not weaken the safety contract without review.

## Execution / evidence provenance

- **A40 author synthetic RED:** [R23B A40 handoff](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A40/WEB-005_A40_R23B_PACK25_RESPONSE_SPOOF_HANDOFF.md): synthetic 0/3 PASS, 3 expected FAIL, exit 1 on old parser. This is AUTHOR evidence, **not A60 execution**, and not native repo source tests.
- **A40 author synthetic GREEN:** same handoff: synthetic bounded lexer 20/20 PASS exit 0, prior synthetic 19/19 PASS exit 0. Author's readback evaluation of actual route with mutants 15/15 expected is SOURCE_EVALUATION, not Node test suite.
- **A60 independently executed** local isolated *synthetic representative logic only*: Node v22.16.0, command 'node --test --test-reporter=tap /mnt/data/web005_a60_r23b/independent_synthetic_boundary.test.mjs', actual **exit 0**; *16 Pack25 synthetic fixtures* PASS16/FAIL0/SKIP0. Includes 3 comment fake-return cases, unrelated/conditional function, extra/duplicate/undefined, string/template spoof, reordering, valid response. Script 'node --check' exit 0. **The same command also ran 13 separate synthetic Backup fixtures**, hence aggregate TAP 29/29 PASS; DO NOT assign all 29 to PR36. TAP SHA256 **3cfe15b28f8448900d101fb69d17f8f90e8ffd2c911f6b95f701668f883793ca**; script SHA256 **722b541d1ce15e077ff031dbc8b63afe0a7d4a0fb750a14884144c18d0b02b1c**. These are authored by A60 but are **not exact source byte PR36 executable tests** and **not an installed monorepo worktree**.
- **Native original project test:** 'node --test qa/pack25/source-contract.test.mjs' and combined Pack19–26 => **NOT_EXECUTED**; exact current HEAD Node TAP, exit and PASS counts **UNAVAILABLE**, not zero passing/failing.
- **GitHub current HEAD CI:** returned no PR-triggered workflow run for 24fe6c399e3a4fa82c3d96703620097fa941a59a (R23B commits tagged [skip ci]); this is **not green CI**. Historical PR35 Actions success for Pack19 and failure at old Pack20 are different exact SHAs, cannot certify current PR36.
- **A50:** R23A DB-free receipt reports 0 native checks on earlier PR56/57 only; no new A50 PR36 exact-HEAD receipt verified. Full domain/typecheck, Pack17 --full and physical PostgreSQL 16 NOT_EXECUTED.

## Recommendation / scoped disposition

A00 may close **P36-P2-01** as repaired in the exact isolated source-contract file at HEAD 24fe6c399e3a4fa82c3d96703620097fa941a59a. Do **not** mark Pack19–26 CI or composite release PASS. Before combining: an A00/A50-authorized *disposable full checkout* must run real Node source contract suite for PR35 + PR36 overlay with exact source SHA receipts, then per-route domain/API and safe PG16 gates. New source SHA => independent A60 re-review. **PASS WITH CONDITIONS / RELEASE_NO_GO / SWARM006_HOLD**; no source edits, merge, SQL/DDL, paid CI, deploy or SWARM-006 performed by A60.
