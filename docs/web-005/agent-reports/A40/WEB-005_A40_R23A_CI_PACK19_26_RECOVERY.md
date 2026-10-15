# WEB-005 — R23A / A40 CI PACK19–26 RECOVERY

**Task:** `WEB-005-T015-A40-R23A-CI-RECOVERY`  
**Agent:** A40 — CI Pack Recovery  
**Mode:** NARROW TEST-CONTRACT RECONCILIATION · scoped **four-file PR36 fix authorized**  
**Date:** 2026-10-15 Europe/Warsaw  
**Repo:** C8LyNn/aplikacja-turnieje  
**VERDICT:** **`CI_CONTRACT_READY_FOR_INTEGRATION_QA`** — *source contracts only, after remediation; NOT merged, NOT full native or release PASS*. Requires independent A60 QA at NEW PR36 HEAD and actual future combined tests.

## 1. Current exact SHA / base / ownership

| PR / packet | HEAD at final verification | Base | State |
|---|---|---|---|
| [PR35 P01 — Pack19](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) | `7cb283aa82273a1e22daf9051a82311eef53760c` | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | OPEN/DRAFT/unmerged; **untouched** |
| [PR36 P02 — Pack20/21/25/26](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) | **`4be68fdd48ee3529029dc4dd2952780ba37853e7`** | same | OPEN/DRAFT/unmerged; A40 five narrowly scoped commits, requires new A60 QA |
| [PR40 P07 — Pack17](https://github.com/C8LyNn/aplikacja-turnieje/pull/40) | `9a8287271299a59fc9291b8d253299a8d109a35d` | same | OPEN/DRAFT/unmerged; **untouched** |

**Comparison:** PR35 and PR36 diverge from common original release base and have **zero overlapping files**. P01 changes only `qa/pack19/source-contract.test.mjs`; P02 changes only the following four paths. No backend/DB/CI workflow, production, Pack19 or Pack17 code changed in this A40 R23A task.

| New PR36 exact file | New blob SHA |
|---|---|
| `qa/pack20/source-contract.test.mjs` | `42359d5116038f515a4b8504bad2fcc0f0df5b26` |
| `qa/pack21/source-contract.test.mjs` | `38d8a96870b31c604b86d010d53b5f40dbd359d6` |
| `qa/pack25/source-contract.test.mjs` | `f9d3eff6b18e74ebe00d6ec8c9a1b0628f081ee1` |
| `qa/pack26/source-contract.test.mjs` | `dd06d0cfba9db9c772e5559e0fbe1915e8e51385` |

New PR36 commit sequence (all on existing PR36 branch, no rebase / force push):
1. **`410401abd399d31ea51578f807a07b05eb0ce44e`** — fail-first regression added to Pack20 to reject comment-spoofed valid transaction options. **Actual native repository test NOT_EXECUTED at this transient RED commit**; separate local Node fixture/source expression independently confirms original matcher falsely accepts the spoof.
2. **`1b209150614ff04cf0fcf2a6b3f7add717596d41`** — Pack20 matcher sanitization and line/block comment regressions.
3. **`99f9a105947a92d5053aeedff1a815014933a60c`** — Pack21 matcher sanitization.
4. **`46df97b0c205c630a689d0961c87b501f89749a4`** — Pack25 matcher sanitization.
5. **`4be68fdd48ee3529029dc4dd2952780ba37853e7`** — Pack26 matcher sanitization; **FINAL PR36 HEAD**.

## 2. Real route / compatibility and negative controls

**Production route unchanged:** `artifacts/api-server/src/routes/tournament-se-correction-readiness.ts`, Git blob `bcd4413c1df18aef8bcc3399a9272fd3e6332757`: `db.transaction(async tx => { ... }, {isolationLevel:"repeatable read",accessMode:"read only"})`, with no `tx/db.insert/update/delete/execute` in that handler. Readiness remains organizer-guarded, advisory and non-mutating. This static observation is NOT actual PostgreSQL enforcement or authorization run.

**P01 corrected contract, unchanged:** blob `5726986dca6a6fd7309bb883eb1106d2d19fb14e` changes the obsolete `readOnly:true` matcher to real `isolationLevel:"repeatable read",accessMode:"read only"`. P02 matcher accepts both option orders in **one candidate options object**, rejects missing/weaker read-only or isolation and duplicate/conflicting keys. Both assertions match the unchanged real route and can coexist in a single future test workspace.

**Found concrete fail-closed test-source gap in old PR36:** an unsafe mutation to `accessMode:"read write"` could be accompanied by the harmless-looking text `// }, {isolationLevel:"repeatable read",accessMode:"read only"})`. The old non-anchored regex would match **the comment**, falsely reporting snapshot-contract PASS. A standalone Node expression reproduced this *false acceptance*; it is a defect in the test-contract matcher, **not an observed application change**.

**Minimal PR36-only fix:** every one of Pack20/21/25/26 now removes `//...` and `/*...*/` textual comments from the inspected input **before** applying the existing same-object, order-independent regex; Pack20 gets a fail-first regression and now includes line-comment and block-comment negative fixtures. Existing separate no-write guards remain. The existing Pack25 risk response test still requires exactly `actionPlan, diagnostic, impactGraph, impactRiskReport` **as four shorthand fields**, rejects missing fields, comment-only `impactGraph`, and `impactGraph: undefined`.

**Validation on REAL GitHub route text** (in-memory source evaluation, **not** Node test process or checkout): **12/12 expected**:
- legal actual options and harmless property reordering accepted;
- missing isolation/access, weakened read committed, write-capable/read write, duplicated isolation/access (equal and contradictory) rejected;
- valid-looking line and block comment decoys paired with write-capable actual transaction rejected.

**Residual honest limitations:** these are regex-based static contracts, not TypeScript AST or Postgres transactional proof; they can remain sensitive to source formatting or other non-comment semantic decoys (e.g. unrelated code/string-shaped snippets). Additionally, PR35's simpler matcher lacks PR36's negative-case strengthening and is **out of edit scope**; A60 should assess whether P01 needs its own future GO. This R23A fix does **not** establish universal adversarial fail-closure or run DB tests. P25/P26 source assertions have some pre-existing formatting dependencies unrelated to these four option fixes.

## 3. Actual tests and exit-code matrix

| Execution | Context | Actual | Exit code | Classification |
|---|---|---|---|---|
| `node --test /mnt/data/WEB-005_A40_R23A_comment_spoof_probe.test.mjs` | Local Node v22.16.0, **synthetic source** | 14/14 PASS, 0 fail/skip/todo; confirms unfixed regex comment false-positive + sanitized rejection | **0** | `NODE_SYNTHETIC_FIXTURE_PASS` |
| `node --test /mnt/data/WEB-005-T015-A40-R3-fixture.test.mjs /mnt/data/WEB-005-T015-A40-R4-response-fixture.test.mjs` | Previously reconstructed local narrow source fixtures | 19/19 PASS; transaction negative cases and strict four-field response | **0** | `NODE_SYNTHETIC_FIXTURE_PASS` |
| Combined execution of the three local fixture files | Local Node v22.16.0 | **33/33 PASS**, 0 fail, 0 skip/todo/cancelled; TAP SHA256 `3b912147668d9c0d66d8672410164ee07cd11fa2ab4487ae9f1c3d10f67632a8` | **0** | `NODE_SYNTHETIC_FIXTURE_PASS`, **NOT repo runtime** |
| Old live [PR35 Actions run 38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899), job `115807143959` | **Real single PR35 HEAD CI** | Pack19 domain and 8/8 source PASS, later obsolete Pack20 6/7 FAIL; overall workflow FAILURE | Pack19 step **0**; subsequent Pack20 step **nonzero**; overall workflow **FAILURE** | `HISTORICAL_REAL_SINGLE_PR_CI`, predates current PR36 |
| Native `node --test qa/pack20/...qa/pack26` on NEW PR36 `4be68fdd...` | Full authenticated repo checkout not furnished | **NOT_EXECUTED**; no native TAP/exit | **N/A** | `NATIVE_PR36_NOT_EXECUTED` |
| Actual *same-worktree uncommitted overlay* PR35+PR36 source suite | No combined checkout created or committed | **NOT_EXECUTED**; no native TAP/exit | **N/A** | `COMBINED_COMPAT_RUNTIME_NOT_EXECUTED` |
| API domain/PG16, Pack17 --full, full typecheck/build/browser | No owner-approved full pnpm10/isolated PG16 host | **NOT_EXECUTED** | **N/A** | `RELEASE_GATES_NOT_EXECUTED` |

**Current PR36 HEAD GitHub Actions:** no PR-head `pull_request` workflow run returned by the connector's first-page lookup. **This is not proof of passing CI**; all R23A commits use `[skip ci]`. No paid rerun initiated.

The 33-test local TAP is also available as a conversation artifact; reproducible input fixture files and SHA listed above. **Do not relabel synthetic pass as executed repository tests.**

## 4. Pack22–24 and Pack17 unchanged, non-weakened release stop

Source snapshots (unchanged release):
- Pack22 `qa/pack22/source-contract.test.mjs` blob `9f8191e1e99ce760e8970815fea7e0ae84762a14`: in-memory advisory-only diagnostics and no new SE write endpoint; CI paths checked in original source.
- Pack23 `qa/pack23/source-contract.test.mjs` blob `bb74e6a3614828c17b4972514d433181a4a7f1da`: bounded in-memory history, scope guard before capture/append, no persistence, CI gate;
- Pack24 `qa/pack24/source-contract.test.mjs` blob `217e20e9556be68feb00333d08419b7162848be6`: nonmutating triage, inconsistent history fails closed, priority/dependency visibility, CI gate;
- Pack17 [PR40](https://github.com/C8LyNn/aplikacja-turnieje/pull/40) unchanged `9a8287271299a59fc9291b8d253299a8d109a35d`, 9 ordered `--full` gates; static-only success is RELEASE STOP. Full gate requires **physically isolated disposable PostgreSQL 16**, owner/A20 preflight and schema DROP-scope authorization.
- These files/workflow are **not** modified by R23A. No Pack22–24 native execution or Pack17 full PASS is implied.
- Historical `T017-QA-01` TAP parser counter-only/spoof acceptance remains an independent P07 A60 risk awaiting separate disposition, not patched here.

## 5. Reproducible integration-QA plan without any shared commit

**GO only for a disposable test workstation authorized by A00/A50.** Preserve original PR HEADs unchanged. Node22; pnpm10 only for domain/API suite; PostgreSQL is **NOT** required for the source-contract-only suite.

~~~powershell
# On a clean DISPOSABLE *full* local clone; no branch merge/rebase/cherry-pick.
$p01='7cb283aa82273a1e22daf9051a82311eef53760c'
$p02='4be68fdd48ee3529029dc4dd2952780ba37853e7'
git fetch origin 'pull/35/head:refs/remotes/origin/web005-pr35' 'pull/36/head:refs/remotes/origin/web005-pr36'
if ($LASTEXITCODE -ne 0) { throw 'STOP: failed to fetch PR35/36 source objects' }
if ((git cat-file -t $p01).Trim() -ne 'commit' -or (git cat-file -t $p02).Trim() -ne 'commit') { throw 'STOP: unresolvable PR commits' }
git switch --detach $p01
if ((git rev-parse HEAD).Trim() -ne $p01) { throw 'STOP: P01 HEAD mismatch' }
if ((git status --porcelain).Count -gt 0) { throw 'STOP: dirty checkout before overlay' }

# UNCOMMITTED source-file overlay ONLY. Nothing is merged, staged or committed.
git restore --source=$p02 --worktree -- qa/pack20/source-contract.test.mjs qa/pack21/source-contract.test.mjs qa/pack25/source-contract.test.mjs qa/pack26/source-contract.test.mjs
$changed=@(git diff --name-only)
$expected=@('qa/pack20/source-contract.test.mjs','qa/pack21/source-contract.test.mjs','qa/pack25/source-contract.test.mjs','qa/pack26/source-contract.test.mjs')
if ((Compare-Object ($changed|Sort-Object) ($expected|Sort-Object)).Count -ne 0) { throw 'STOP: overlay exceeded four allowed files' }

# Run bare Node source contracts; no pnpm/PG needed.
node --test --test-reporter=tap qa/pack19/source-contract.test.mjs qa/pack20/source-contract.test.mjs qa/pack21/source-contract.test.mjs qa/pack22/source-contract.test.mjs qa/pack23/source-contract.test.mjs qa/pack24/source-contract.test.mjs qa/pack25/source-contract.test.mjs qa/pack26/source-contract.test.mjs
$sourceExit=$LASTEXITCODE
if ($sourceExit -ne 0) { throw "BLOCKED: source suite returned $sourceExit" }

# Optional domain tests ONLY after pnpm10 frozen dependencies installed, same worktree.
# Then separately real isolated PG16/Pack17 full gate under explicit owner/A20 GO.
# Discard the disposable clone after retaining sanitized logs; DO NOT git commit.
~~~

**Preflight precision:** the explicit fetch refspecs populate disposable remote-tracking refs for both PRs. Refuse execution unless both pinned 40-character SHAs resolve to commit objects before `git restore`. No mutation of existing PR branches or protected release. Capture `git rev-parse HEAD`, exact overlay diff SHA and four path list, commands, TAP tests/pass/fail/skipped, native process exits, sanitizer provenance. Native failure → STOP and A60/A00 triage, NOT override.

**Independent A60 acceptance:** review exact PR36 new HEAD `4be68fdd48ee3529029dc4dd2952780ba37853e7`, the fail-first regression commit plus four sanitization commits, confirm source behavior and residual string-decoy caveat, then execute/review actual isolated source tests and approve scoped contracts. Any further fix requires a **new HEAD and renewed independent QA**.

## 6. Final GO/STOP

**`CI_CONTRACT_READY_FOR_INTEGRATION_QA`** *only for review/testing*: no source overlap P01/P02, current Drizzle options accepted, requested missing/write/duplicate/contradictory/comment negative scenarios pass as source evaluations and standalone fixtures; reported spoof defect addressed in 4 authorized source-test files. **This is not native cross-PR PASS, not full fail-closed certification against arbitrary adversarial TS source, not runtime/Postgres proof.** A60 independent verdict still pending on new HEAD.

**Hard STOP:** no edits to PR35; no new PR/production code, no unauthorized composite commit/merge/rebase, DB operations, CI rerun, deployment, or SWARM-006. WEB-005 release remains **NO-GO**.
