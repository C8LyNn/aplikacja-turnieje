# WEB-005 / A110 / R19 — T055 Basket CAS owner signoff and frontend QA

**Wave:** R19.1 · 2026-10-14, Europe/Warsaw  
**Task / owner of this source packet:** `WEB-005-T055-T110-A110-R19` / A110 Basket Concurrency & Frontend State  
**Authorization:** **SOURCE ONLY.** No application code changes, no new PR, no merge, no deployment, no SWARM-006 initiation.  
**Result:** `SOURCE_CONFIRMED_MISSING_CLIENT_CAS / T055_POLICY_OPEN / UX044_POLICY_OPEN / P10_P17_P19_A60_CONDITIONAL_SOURCE / APP_RUNTIME_NOT_VERIFIED / RELEASE_NO_GO`.

**Verified central authority:** [R19.1 prompts](../../WEB-005_WAVE_R19_AGENT_PROMPTS.md), blob `076b14ca7ea953c818309502cce322c7dd6a7bef`.  
**Source release:** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. No A110 PR head changed from R18.

## 1. Immediate owner/HQ decision request — sign D1–D6 or sign explicit disposition

**To:** local A00 → global product owner/HQ. **Required:** one named signatory and a choice in **all six** policy cells. Blank cells mean `POLICY_OPEN`; this document does not select a default.

The existing [GET/PUT full graph stage-baskets endpoint](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/routes/tournaments.ts#L778-L815) accepts/forwards baskets and routes but no editor's base revision. The [service transaction](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/application/stages/stage-basket-configuration.ts#L308-L381) uses tournament/stage/roster row locking and organizer reauthorization, yet does **not** compare the client-read graph revision before [full replacement and stage-version updates](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/application/stages/stage-basket-configuration.ts#L441-L532). The [frontend Save](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/components/stage-baskets-panel.tsx#L928-L943) submits only `{baskets,routes}`. Existing `basketFlowAuthorityVersion` is a mode marker (implicit/explicit), **not** a monotonic concurrency revision.

**Evidence classification:** missing precondition = `SOURCE_CONFIRMED`; two editors reading V0 then second serial PUT overwriting first = `STATIC_INFERRED`, **NOT** a reproduced PG16 test or observed incident. Row locks serialize operations but do not by themselves prove the late client's read base is still current.

| Owner decision | Choice A | Choice B | Selection |
|---|---|---|---|
| **D1 — revision authority** | Same-snapshot server-issued ordered stage-id/version vector, with proven stage-set/ABA and writer coverage | Persisted monotonic basket-configuration revision scalar; requires A20 migration and A90 Backup V3 compatibility/restore review | **UNSIGNED** |
| **D2 — HTTP wire contract** | Explicit JSON `expectedStageVersions` / `expectedRevision` tied to D1 | Opaque graph ETag returned with GET, mandatory `If-Match` on PUT | **UNSIGNED** |
| **D3 — stale PUT status** | **409 Conflict** with stable domain code `STAGE_BASKET_CONFIGURATION_STALE` | **412 Precondition Failed** with identical stable domain code | **UNSIGNED** |
| **D4 — absent/legacy token** | **428 Precondition Required**, migration banner/client upgrade | Another explicitly approved fail-closed 4xx with prescribed legacy handling; **never accept an unversioned old client silently** | **UNSIGNED** |
| **D5 — stage/roster invalidation** | Any basket-relevant changed stage set/version/participant roster invalidates loaded editor snapshot | Basket revision alone, plus separate atomic guard for every relevant stage/roster mutation under same lock | **UNSIGNED** |
| **D6 — conflict UX** | Keep unsaved losing draft; show server-vs-local diff; explicit rebase/discard | Keep unsaved losing draft; show conflict and require explicit reload/manual reconcile before opt-in resubmit | **UNSIGNED** |

**Signature block — must be populated by the real owner/HQ, not A110:**

```text
POLICY: WEB-005/T055 BASKET FULL-PUT CAS
D1=___ D2=___ D3=___ D4=___ D5=___ D6=___
OWNER/HQ_SIGNER=___ SIGNED_AT=___ REASON/COMPATIBILITY=___
A20/SCHEMA=___ A90/BACKUP=___ FRONTEND_CLIENT_UPGRADE_OWNER=___
A00_FUTURE_TASK_ID=___ EXCLUSIVE_CODE_FILE_GO=___
```

**No implicit technical selection:** ETag naturally pairs with 412 but 412 is not selected until D3 is signed. Stage-version vector may be implementable without DDL but cannot be treated sufficient until *all* writers/roster/ABA cases are proven; a new scalar may require schema/Backup/restore migration. If a policy remains unsigned at WEB-005 closeout, A00 needs a **named owner-approved** `POLICY_OPEN/BLOCKED/WONT_FIX` disposition with risk and follow-up owner. A110 cannot mark T055 `SOURCE_FIXED` or approve a waiver.

### Minimum invariant and executable test-first acceptance contract

1. **GET graph + token coherence:** token must describe the returned basket graph in the **same transaction/snapshot**. Do not retrieve a newer stage-version token independently and attach it to older cached graph.
2. **Locked PUT CAS:** authenticate/reauthorize, obtain same-tournament lock, compare expected token against current authoritative state **before any graph DELETE/INSERT/UPDATE**; malformed, absent, stale, unauthorized are distinctly fail-closed.
3. **Two legitimate users both start V0:** one chosen winner commits a complete V1 graph; the other receives **exactly one** selected 409/412 with stable domain code and **zero** DB mutations, winner unchanged. A precondition check outside the lock fails this test.
4. **Client respects losing draft:** no auto retry/force overwrite; keep draft securely scoped to same tournament, explicit diff/reload/rebase and user-mediated retry after a newly coherent GET.
5. **Negative/edge:** first legacy implicit save; no or corrupt token; ABA/stage identity reorder; stage-version-only update; roster/participant update; unauthorized or revoked organizer; first writer success then network retry; induced late transaction fault rollback; conflict during import/qualification. **Positive:** legitimate single-editor save; token increment/changed vector; read-back; explicit successful reconciled retry.

**Next smallest implementation *request*, NOT GO:** `T055-CAS-L1` separate future A00/HQ decision + exclusive backend file ownership after signed D1–D6: coherent GET/precondition contract and PostgreSQL16 physically isolated two-editor zero-write test. Then coordinate generated API/client update and StageBasketsPanel draft-preservation L2. Do not ship backend fail-closed without deployed compatible client; no source code change this wave. PG16 execution needs separate A20 physical test DB attestation, exact test-schema reset consent, `TEST_DATABASE_URL` only.

## 2. UX044 Host dirty navigation: separate, unsigned product decision

The [release Host screen](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/pages/tournament-host.tsx#L245-L270) derives `hasDraftScores` from score-object keys and separately tracks `resultReason`; protection handles `beforeunload` and intercepted anchor clicks, but is not a complete documented guard for reason-only dirty input or Wouter programmatic/popstate routing.

**Owner decision UX044 (independent of D1–D6):**
- **H1 BLOCK:** when any score/reason/other Host draft is dirty, block or confirm *every* relevant SPA/browser transition, clear only on authorized explicit discard/submit.
- **H2 RETAIN:** keep a private per-tournament/per-role scoped draft across navigation, with expiry, auth downgrade/logout wipe, explicit restore/discard and tests; no A→B cross-context draft transfer.

```text
UX044=H1_BLOCK / H2_RETAIN / OWNER_ACCEPTED_EXCEPTION
OWNER/HQ_SIGNER=___ APPROVED_AT=___ EXPIRY/PRIVACY_IF_H2=___
```

**SOURCE_CONFIRMED guard coverage gap**, but actual loss `HYPOTHESIS / RUNTIME_NOT_EXECUTED`. Do not patch or select behavior without separate GO.

## 3. P10/P17/P19 exact-SHA source QA and ready-to-run A50 instructions

The GitHub metadata and changed filenames were rechecked at R19 inspection; these remain OPEN DRAFT/unmerged on common base SHA `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.

| Packet | PR/HEAD SHA (R18→R19) | Exact paths in PR | A60 independently signed R18 source | App runtime |
|---|---|---|---|---|
| **P10 CSV** | [PR43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) `96a6068f69027574ac76e18d4d5a2c444b5a914a` → **unchanged** | `artifacts/tournament-manager/src/hooks/use-tournament-csv-file-reader.{ts,test.tsx}`, `src/pages/tournament-detail.tsx` | `SOURCE_ACCEPTED_CONDITIONAL` | `NOT_VERIFIED` |
| **P17 Backup** | [PR50](https://github.com/C8LyNn/aplikacja-turnieje/pull/50) `5457a74187edc263730c3a4b25a663bdf5531ee9` → **unchanged** | `src/hooks/use-scoped-backup-preview.{ts,test.tsx}`, `src/components/backup-restore-dialog.{tsx,test.tsx}`, `src/pages/tournament-detail.tsx` | `SOURCE_ACCEPTED_CONDITIONAL` | `NOT_VERIFIED` |
| **P19 Stage modal** | [PR52](https://github.com/C8LyNn/aplikacja-turnieje/pull/52) `cce73ec47445102b216b3f8eceb4ec9de67eb1a7` → **unchanged** | `src/components/tournament-stages-panel.{tsx,test.tsx}` | `SOURCE_ACCEPTED_CONDITIONAL` | `NOT_VERIFIED` |

**Independent QA source of truth:** [A60 R18 independent QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md) (blob `656a8850a6358e5b4b2517220a5fc55f99dc014f`); [A60 R18 21-packet matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_PACKAGE_MATRIX.json) (blob `b693f64ba31bb99ef1cc1a4b7eb9300a8db7c2dd`). A60 acceptance is **source-only conditional**, *not* full app test or release acceptance.

**Rechecked source mechanisms:** PR43 identity+generation+active FileReader rejects late A callbacks; PR50 scope+generation+reader guards preview and resets new credentials; valid V2/V3 backup import creates **new tournament C**, never overwrites existing B; PR52 captures opening stage/tournament/version/action, re-reads authoritative stage immediately on confirmation, plus readiness/ceremony for start. Backend still authoritatively validates GET→POST transition races. **Regression tests authored but not run:** 5 CSV hook RTL; 5 Backup hook + 5 dialog RTL; 7 targeted UX046 panel RTL, **22 targeted authored cases**. The stage-panel test file contains other existing tests; do not claim the whole file has only seven tests.

**Independent A50 real-test evidence:** [A50 R18 receipt](../../agent-reports/A50/WEB-005_A50_R18_RECEIPT.md) blob `a54e410eddf12ff9b909cb8a73cfd91d1d91acad`, `APPLICATION_NATIVE_TESTS_0`, no full connected checkout/pnpm/approved disposable PG16. These historical app R18 tests remain `NOT_EXECUTED`. A110 R19 also did not run the tests. Old automatic GitHub [PR43 Actions 38590842415](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38590842415), [PR50 38600542147](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38600542147), [PR52 38605694664](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38605694664) `completed/failure` at upstream stale Pack19 matcher; relevant frontend RTL was never reached. PR35 already corrects matcher in its separate draft; don't rerun paid CI or call feature tests failed.

### A50 executable frontend plan — one immutable HEAD checkout per PR; commands NOT run by A110

Prerequisite: A00-approved **actual** trusted isolated full per-PR checkout (not merely a PLAN harness), Node22/pnpm10, frozen dependency lock/install; no test DB needed for React-only suite. From repository root, POSIX syntax:

```bash
# P10 PR43 only
git checkout --detach 96a6068f69027574ac76e18d4d5a2c444b5a914a
git rev-parse HEAD; node --version; pnpm --version
pnpm --filter @workspace/tournament-manager run typecheck
(cd artifacts/tournament-manager && TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-csv-file-reader.test.tsx)
pnpm --filter @workspace/tournament-manager run test

# P17 PR50 only (different clean worktree)
git checkout --detach 5457a74187edc263730c3a4b25a663bdf5531ee9
git rev-parse HEAD
pnpm --filter @workspace/tournament-manager run typecheck
(cd artifacts/tournament-manager && TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-scoped-backup-preview.test.tsx ./src/components/backup-restore-dialog.test.tsx)
pnpm --filter @workspace/tournament-manager run test

# P19 PR52 only (different clean worktree)
git checkout --detach cce73ec47445102b216b3f8eceb4ec9de67eb1a7
git rev-parse HEAD
pnpm --filter @workspace/tournament-manager run typecheck
(cd artifacts/tournament-manager && TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test ./src/components/tournament-stages-panel.test.tsx)
pnpm --filter @workspace/tournament-manager run test
```

A50 must capture **real** command, OS, Node/pnpm, immutable HEAD, TAP pass/fail/skip, exit and sanitized logs. On PowerShell, set `$env:TSX_TSCONFIG_PATH` rather than POSIX prefix. Frontend-only tests do not authorize any shared database calls. Later full-page real route/browser+HTTP tests remain separate acceptance requirements, especially PR43/50 shared `tournament-detail.tsx`.

**Negative and positive acceptance cases**:
- **CSV PR43:** old A FileReader.onload/error after A→B/close/manual B never populates or submits B; **0 stale POST**, valid intentionally selected B file import works once.
- **Backup PR50:** old A preview callback after choose B/route/close cannot resurrect A and cannot carry old organizer/viewer/support secrets; **0 stale POST**; fresh B V2/V3 file and new credentials allow explicit import to separate new C.
- **Lifecycle PR52:** version/status change, route A→B same numeric stage ID, fresh stage read failure: **0 POST**, fail-closed; legitimate fresh unchanged stage start/complete exactly once, including readiness/ceremony constraints.

The existing targeted hook RTL does not prove mounted TournamentDetail HTTP/route correctness. No invented frontend PASS.

## 4. Dependencies and boundaries for A00 / A10 / A30 / A100 / A120

- **Shared-file risk:** PR43 + PR50 + PR54 all edit `artifacts/tournament-manager/src/pages/tournament-detail.tsx`; PR52 has its own stage panel. This is a future integration ordering/collision **risk** (not proof of unavoidable textual conflict), to be resolved only after HQ `FINAL_HANDOFF_GO` by SWARM-006. PR54 is still independently `SOURCE_BLOCKED` on R18 exact HEAD `9866e5d2e73c99e01c2934a38ca1c62455efd2ed`; A120 has R19 exclusive child `stage-progress-view.tsx` GO. **A110 does not edit PR54**.
- **Privacy intersection:** PR53 independent A60 R18 source accepted **only newly proven ownership**; legacy untagged `['matches',matchId,'game-picks']` and credential rebind remain `FULL_PRIVACY_REVIEW_OPEN`. A100/A30 own the R19 bounded negative/fix; no blanket cache purge, speculative production breach claim or A110 PR53 edits. Test auth downgrade/denial while CSV/Backup component file/form state is pending using synthetic credentials, even after React Query private-cache eviction.
- **UX016 and retracted claims:** no fresh source-confirmed UX016 finding in this A110 scope. Previously withdrawn ordinary StageBasketsPanel A→B advanced draft leak and claim that Backup import overwrites B **remain WITHDRAWN**. Do not inflate WEB-004 38-case closeout with withdrawn findings.

## 5. R19 final-source-closeout gate, disposition request to A00

**T055 still `POLICY_OPEN / NOT_IMPLEMENTED / OWNER_SIGNATURE_REQUIRED`.** Owner may (i) sign D1–D6 and later grant a separate T055 code task; or (ii) sign a time-bounded accountable `OWNER_APPROVED_POLICY_OPEN / BLOCKED / WONT_FIX` exception with explicit lost-update risk, owner/follow-up, release impact. Do **not** present this signable template as signed. UX044 is independent H1/H2/exception policy choice. A00/A10 must place the exact original WEB-004 R2 finding(s), not guessed IDs, in their 38-case signed disposition mapping.

A60 R18 independently concluded [`HANDOFF_NOT_READY`](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_FINAL_HANDOFF_READINESS.md). No A110 document overrides that gate. The possible future `HANDOFF_WITH_RUNTIME_TEST_DEBT` is a **distinct** owner/HQ authorization **only after source/privacy/policy/38-case closeout**; it never means any app test passed or permits production release. SWARM-006 has a hard integrated test/release STOP and remains HOLD until separate signed `FINAL_HANDOFF_GO`.

**Immediate next actions:** A00 obtains signatures/waivers T055 and UX044; A50 obtains trusted executable checkout and runs actual exact-SHA RTL/typecheck/full-page HTTP; A60 signs any new runtime results and separately reviews code-lane PR53/54 on new SHA; A10 preserves three-way file conflict DAG and incomplete 38-row mapping. **Do not delegate these actions to A110.**

**A110 R19 author disposition:** `SIGNABLE_POLICY_PUBLISHED / SOURCE_QA_HANDOFF_READY / SOURCE_CODE_NOT_MODIFIED / APP_RUNTIME_NOT_EXECUTED / T055_UNSIGNED / UX044_UNSIGNED / NO_MERGE / RELEASE_NO_GO / SWARM006_HOLD`. Formal [R19 handoff](./WEB-005_A110_R19_HANDOFF.md) contains exact receipt SHA and publication links.
