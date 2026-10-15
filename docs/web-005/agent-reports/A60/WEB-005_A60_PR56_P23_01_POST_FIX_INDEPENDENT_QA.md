# WEB-005 — A60 / PR #56 P23-01 POST-FIX INDEPENDENT QA

**Task:** A60 PR56 POST-FIX INDEPENDENT QA · **Date:** 2026-10-15 Europe/Warsaw · **Priority:** HIGH · **Mode:** NARROW QA, READ-ONLY source; documentation only.  
**Final scoped verdict: `PASS WITH CONDITIONS` — P23-01 source blocker resolved at exact HEAD.**  
**Not a merged/integrated Backup V3 signoff:** `NOT_WIRED / SWARM006_HOLD / RELEASE_NO_GO`.

## 1. Verified GitHub identity, patch and test-first history

- [PR #56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56): **OPEN DRAFT, UNMERGED**, exact HEAD `a7f71a7e7efdabd479b358a3cee80bc6359c4321`; original parent release `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, prior independent QA `77707092202ca79277de7bc57cc4e37e4c033171`.
- Independently fetched full current source/test blobs, PR changed paths and GitHub compare `77707092202ca79277de7bc57cc4e37e4c033171...a7f71a7e7efdabd479b358a3cee80bc6359c4321`: **ahead 4 commits, behind 0, exactly 2 existing PR-owned files modified**, no importer/exporter, HTTP route, schema, SQL, PR41/48 or generated DTO changes.
- Four commits, in order: **test-first** `b2b1cbacca0b7ff81c0977c2a6554a262d9f65c7`; implementation `7c73c7316bc30a150e7aad9cd510d30b4399ac19`; typed fixture adjustment `3391867f32a41ca377dd153ad49b3bbb52e5e9c5`; narrowed unknown-ID type guard `a7f71a7e7efdabd479b358a3cee80bc6359c4321`.
- Verified changed files:
  - `artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts`, exact **Git blob** `595c68b87a5361623bef6293519ed668e9d4e493` (current 325 lines); diff vs old **+42/-2**.
  - `artifacts/api-server/test/backup-v3-strict-policy.test.ts`, exact **Git blob** `d1242b84c9b2db269ab6864459d8d11656d4fe8c` (347 lines); diff vs old **+176/-0**, six new named P23-01 tests.

**Verification of executable bytes:** Independently reconstructed both fetched files into a disposable local Linux folder, ran `git hash-object` on each and observed both hashes **exactly equal the GitHub blob SHA above**. Source bytes therefore match the reviewed exact HEAD files, not approximate excerpts. No git checkout of the complete repository or network Git clone was available, and no application code was written back to GitHub.

## 2. Root-cause change and independent source correctness

The prior source blocker wrongly required one active manual `match_result_submitted` for *every* completed match, including legal Swiss system BYE with `system_bye_assigned`. At current exact HEAD:

1. [Module lines 199–215](https://github.com/C8LyNn/aplikacja-turnieje/blob/a7f71a7e7efdabd479b358a3cee80bc6359c4321/artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts#L199-L215) identifies only `status=completed/resultType=bye/resultReason=system_bye`, player1 a real exported positive-ID participant, no player2, winner=player1, both scores null.
2. [Lines 216–229](https://github.com/C8LyNn/aplikacja-turnieje/blob/a7f71a7e7efdabd479b358a3cee80bc6359c4321/artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts#L216-L229) bind exactly typed `system_bye_assigned` action to that same match and stage; `canUndo=false`, `undoPayload=null`, `isUndone=false`. Current head additionally narrows `matchBackupId` with `positiveInt` before Set/Map lookup.
3. [Lines 231–284](https://github.com/C8LyNn/aplikacja-turnieje/blob/a7f71a7e7efdabd479b358a3cee80bc6359c4321/artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts#L231-L284) forbid BYE from taking the manual completion path; require **exactly one** valid system action and **zero** active manual completions; ordinary completed played/walkover/no_contest matches still need exactly one provable active manual completion.
4. Existing strict checks **remain intact**: latest result-history parity and completedAt, distinct positive match CAS state revision, portable action order/identity, typed manual history reference, recognized nested Undo IDs, strict marker `UNATTESTED` if missing.
5. Actual immutable release Swiss stage startup and next-round writers create completed BYE and history with `system_bye_assigned`, not manual Undo; compared `routes/tournaments.ts` lines 1544–1570 and 1738–1764. This matches the new narrow exception.

**Static outcome:** `P23-01_FIXED_IN_ISOLATED_SOURCE`; no new high/medium defect observed within the two files and P23-01 regression boundary. This is a source statement with supporting exact-blob executed tests, **not** proof of imported V3 behavior.

## 3. Actual executed tests — precise provenance and TAP

**Environment:** disposable Linux runtime, Node **v22.16.0**, TypeScript compiler library **v5.8.3**, no DB / no shared state / no GitHub Actions triggered. A sandbox-only `typescript.transpileModule` transform generated CommonJS JS from **the two byte-identical TypeScript sources** with **0 transpile diagnostics**. The transform does *not* provide semantic TypeScript checking, nor a full workspace build. Executed **real JS emitted from those exact reviewed source bytes**, not a mock of the validator.

| Execution | Command as run | Exit | TAP tests | PASS | FAIL | SKIP |
|---|---|---:|---:|---:|---:|---:|
| A90 authored complete unit suite, including six new P23-01 cases | `node --test dist/test/backup-v3-strict-policy.test.js` | **0** | **14** | **14** | 0 | 0 |
| Independent A60 extra adversarial boundary suite against same emitted exact policy module | `node --test independent-negative.js` | **0** | **8** | **8** | 0 | 0 |
| **TOTAL actually executed isolated Node tests** | | | **22** | **22** | **0** | **0** |

**Six actual post-fix P23-01 tests (all PASS as subtests 9–14):**
1. Lawful completed system BYE + history + nonundoable action accepted.
2. Combined manual `played` + system BYE accepted; attempts to promote BYE to manual completion rejected.
3. Missing/wrong last BYE history rejected.
4. Forged participant, winner, score or reason rejected even when match/history mutated together.
5. Missing, duplicate, foreign/stale, wrong-stage, undoable or forged BYE system action rejected.
6. Ordinary played/walkover/no_contest unable to masquerade as completed system BYE.

**Eight independent A60 tests (all PASS):** minimal genuine BYE positive; invalid action IDs `0/-1/null/undefined/string`; duplicate BYE action; wrong stage; forbidden undo capability/payload; absent history or tampered winner; stripped strict marker `UNATTESTED`; forged active manual completion on BYE. Independent harness exists in local disposable QA folder and is not part of PR56.

**NOT VERIFIED:** full TypeScript monorepo typecheck/webpack/pnpm frozen-lock integration or end-to-end Backup V3 importer/exporter/PG16 tests. An attempted monorepo-style `tsc` invocation exceeded execution window without a reliable exit/result; **no TYPECHECK PASS claimed**. No target suite TAP from CI; this isolated execution is distinct from GitHub Actions.

## 4. Actual GitHub CI result (separate from isolated unit tests)

The latest verified exact-head [GitHub Actions run 38698700862](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38698700862), job `correction-qa` 116301422802, is **FAILURE**. Direct job logs confirm the inherited **Pack19** `qa/pack19/source-contract.test.mjs` expected `isolationLevel:"repeatable read",readOnly:true` while the source uses `isolationLevel:"repeatable read",accessMode:"read only"`; Pack19 shows **7 PASS, 1 FAIL**, later gates skipped. This check did *not* execute the newly added Backup validator suite. Existing isolated PR35 handles the matcher; **no CI rerun or new code** authorized from A60. A green local unit suite cannot turn the actual CI check green.

## 5. Issues and remaining gates

**New P23-01 source defect severity P0/P1:** **NONE FOUND** on current two files and proven suite. Previous **P23-01 SOURCE_BLOCKED is lifted only for the isolated pure module**, not the broader Backup B2 rollout.

Remaining conditions (not presented as newly found regressions):
- **C1 / HARD INTEGRATION STOP:** `NOT_WIRED`. Neither importer, exporter, HTTP preclone `400 INVALID_BACKUP_V3`, DB full rollback, history restoration nor real legacy V2/V3 compatibility is implemented/tested by PR56. Marker `UNATTESTED` is *not* authenticated old-producer provenance; Zod unknown-field stripping and existing nested ID remapper fallback await separate GO + A30 threat review.
- **C2 / TEST & CI:** run authoritative `pnpm --filter @workspace/api-server run typecheck` and source test command at pinned SHA in trusted full clean checkout. Integrate isolated CI prerequisite Pack19/PR35 only in later separately authorized flow. Record exact TAP/command/exit.
- **C3 / FUTURE DB:** A20 physical B3/match CAS, portable history, actual rollback and approved disposable PG16 must be separately tested before release.
- **C4 / RELEASE AUTHORITY:** this is no merge approval, no source rollout permission, no `FINAL_HANDOFF_GO` and does not remove `SWARM006_HOLD`. Original WEB004 case/owner-policy/24-PR composite gates remain outside this narrow QA.

## 6. Formal verdict and next action

**`PASS WITH CONDITIONS`** on exact PR56 HEAD `a7f71a7e7efdabd479b358a3cee80bc6359c4321` for narrow **P23-01**. Narrow unit source acceptance: `P23-01_CLOSED_SOURCE / P23_STRICT_CORE_SOURCE_ACCEPTED_SCOPED / NOT_WIRED / INTEGRATION_NOT_TESTED`. A90 does **not** need another change for the originally reported system-BYE failure on this SHA. A00 should record A60's scoped exact-SHA acceptance, keep PR56 OPEN/DRAFT and ensure future A30-approved provenance/strict importer wiring and full runtime checks are separately authorized. Re-review on any further SHA change. **WEB005_HANDOFF_NOT_READY / RELEASE_NO_GO / SWARM006_HOLD.**

No application changes, PR merge, SQL/DDL, staging, paid workflow, data reset or SWARM-006 execution by A60.
