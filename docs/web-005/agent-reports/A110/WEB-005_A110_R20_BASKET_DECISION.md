# WEB-005 — A110 / R20 — T055 Basket CAS: owner-signable decision

**Wave / task:** R20.1 · `WEB-005-T055-T110-A110-R20`  
**Agent:** A110 — Basket Concurrency & Frontend State  
**Date:** 2026-10-14, Europe/Warsaw  
**Mode:** **SOURCE ONLY**, documentation and handoff. No implementation GO, no SQL, new PR, CI rerun, merge, staging/live or SWARM-006 dispatch.  
**Disposition:** `T055_POLICY_OPEN / T055_NOT_SOURCE_FIXED / UX044_POLICY_OPEN / RUNTIME_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD`.

**Central instruction:** [R20 agents](../../WEB-005_WAVE_R20_AGENT_PROMPTS.md), verified blob `dabf0146a08ef8488400df9268b52210662cbb63`.  
**Source base:** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; HEAD unchanged on live recheck.

## 1. Why the product decision is required — pinned source

- The server [GET /tournaments/:id/stage-baskets and full-graph PUT](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/routes/tournaments.ts#L778-L815) validates and forwards `baskets` and `routes` but **no client expected revision**.
- [replaceStageBasketConfiguration](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/application/stages/stage-basket-configuration.ts#L308-L381) obtains transaction locks on tournament, stages and players and revalidates organizer identity, but does not compare the editor's loaded graph revision with current authoritative state. Downstream code replaces basket graph rows and updates stage versions.
- The [StageBasketsPanel save](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/components/stage-baskets-panel.tsx#L928-L946) sends only `{baskets:draft.baskets,routes:draft.routes}`. `basketFlowAuthorityVersion` is an implicit/explicit **mode** discriminator, not a revision.
- **Classification:** no client CAS = `SOURCE_CONFIRMED`. A/B both read V0, A commits V1, B later overwrites full graph without recognizing V0 as stale = `STATIC_INFERRED` risk. No physical PG16 A/B reproduction, and not asserted as an observed user incident.

**Owner/HQ:** choose exactly one signed option D1–D6 below; this packet deliberately chooses none. Signatures must be explicit and attributable. A policy signature **does not itself grant implementation GO**.

## 2. Six independent owner decisions — no implicit defaults

| ID | Option A | Option B | OWNER/HQ choice |
|---|---|---|---|
| **D1 — revision source** | Atomic, same-snapshot ordered stage ID/version vector; only after proving that basket graph, stage set, roster and all writers cannot escape the token (incl. ABA) | New persisted monotonic `basketConfigRevision` (or equivalent) incremented in same locked transaction; A20 migration/restore and A90 Backup V3 compatibility review required | **UNSIGNED** |
| **D2 — wire format** | Explicit JSON `expectedRevision` / `expectedStageVersions` in PUT, coherently paired to GET | Server-generated opaque graph `ETag` on GET, required `If-Match` header on PUT | **UNSIGNED** |
| **D3 — stale write** | `409 Conflict` with stable domain error `STAGE_BASKET_CONFIGURATION_STALE` | `412 Precondition Failed` with same domain error | **UNSIGNED** |
| **D4 — missing/malformed legacy precondition** | `428 Precondition Required` for missing token + explicit legacy-client upgrade; malformed token must fail-closed | Other owner-specified, fail-closed 4xx and migration UX. **Never silently accept an old unversioned full-graph PUT** | **UNSIGNED** |
| **D5 — stage/roster mutation** | Any change to basket-relevant stage ID/order/version/roster makes an old draft stale | Basket-specific token plus **separate atomic under-lock verification** of all stage/roster changes affecting the graph | **UNSIGNED** |
| **D6 — losing-editor UX** | Keep local draft, present server-vs-local diff and explicitly chosen rebase/discard | Keep local draft; require explicit reload/manual reconciliation and a new opt-in save | **UNSIGNED** |

**Technical trade-offs, not decisions:** stage versions may save a migration *if* the version-vector/writer inventory is comprehensive; using a persistent revision may simplify client protocol but introduces schema/Backup/restore integration. An ETag frequently maps to 412 but **D2 does not secretly choose D3**. Missing/malformed tokens must never fall back to last-writer-wins. An owner-approved D6 option must not leak another tournament's private draft or passwords.

**Owner signature sheet — leave unfilled until an actual authorized named signer responds:**

```text
POLICY_ID: WEB-005-T055 / UX047 — Full basket-graph optimistic concurrency
D1: ____  D2: ____  D3: ____  D4: ____  D5: ____  D6: ____
OWNER/HQ_SIGNER: __________________   SIGNED_AT: __________________
RATIONALE: ________________________   LEGACY_CLIENT_UPGRADE_PLAN: ______
A20_SCHEMA_MIGRATION_REVIEW: ____     A90_BACKUP_V3_REVIEW: _____________
A00_FUTURE_IMPLEMENTATION_TASK_ID: ____  EXCLUSIVE_CODE_FILE_GO: _______
```

**If owner refuses/defers a policy choice:** the **alternative** is a distinct, explicit, named owner/HQ `OWNER_APPROVED_POLICY_OPEN`, `OWNER_APPROVED_BLOCKED` or `OWNER_APPROVED_WONT_FIX` disposition with accepted lost-update risk, timebound follow-up, accountable owner and release consequence. Until a real signature or exception is recorded, `POLICY_OPEN`, `T055_NOT_SOURCE_FIXED` and `FINAL_HANDOFF_NOT_READY`. Do not convert this unsigned form into owner approval.

## 3. Invariants and future executable test contract — NOT a current implementation GO

1. **Read coherence:** authorized GET returns a graph and a precondition token that describe exactly the same transactional snapshot. Never combine cached V0 graph with newer separately queried stage token.
2. **Locked compare-before-write:** reauthorize organizer and check expected token **after acquiring lock but before any graph DELETE/INSERT/UPDATE**. Selected D3 conflict returns stable structured error, no partial rows changed.
3. **Two-author race:** A and B fetch identical V0. Exactly one valid PUT commits and produces V1. The other yields the selected 409/412, has **zero DB mutations**, and never destroys winner's routes/participants/positions. No automatic retry after HTTP timeout with stale token.
4. **Draft conflict:** loser remains in an editable private tournament-local draft (not global context); no A→B resurrection, no forced overwrite, explicit current-server readback and explicit user reconciliation.
5. **Negative cases:** malformed/missing token, legacy graph with null/first-save, stage ID/order changes, stage-version-only changes, roster/participant edit, ABA, parallel put + duplicate retry, revoked organizer, unauthorized GET detail, rollback after injected post-delete failure. **Positive cases:** one fresh authorized update succeeds, coherent GET new token/graph, valid manual reconciliation and new-token retry succeeds once. Backend's atomic check is authority.
6. **Runtime safety:** API/PG16 concurrency tests require verified dedicated physical disposable PG16, `TEST_DATABASE_URL`, distinct `tm_test_*` schema, owner-approved reset scope and no production fallback. Frontend suite requires full per-SHA checkout, Node22/pnpm10/frozen dependencies, real command/exit/TAP.

**Smallest proposed future code slice, REQUEST ONLY:** `T055-CAS-L1` coherent server GET token, locked compare, domain error + isolated dual-editor test, explicitly approved after D1–D6. Follow with coordinated generated API/client and `StageBasketsPanel` draft-keep UX L2; avoid a fail-closed server-only patch with unupgraded legacy UI. A110 R20 has **no source-code GO**.

## 4. Separate UX044 Host dirty-draft owner decision (not a T055 subchoice)

[Host baseline](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/pages/tournament-host.tsx#L245-L270) calculates `hasDraftScores` from keys of `scores`, while `resultReason` is separate. Guard intercepts beforeunload and anchored clicks, but lacks a proven complete programmatic SPA/popstate/reason-only dirty contract. **Guard coverage gap = SOURCE_CONFIRMED; actual user data-loss incident = HYPOTHESIS, not reproduced.**

| UX044 choice | Intended contract | OWNER/HQ choice |
|---|---|---|
| **H1 — BLOCK** | All dirty score/reason/other Host changes block or ask before navigating by anchor, history, programmatic SPA or browser lifecycle; authorization change clears private draft | **UNSIGNED** |
| **H2 — RETAIN** | Private per-tournament/per-role retained draft, explicit restore/discard, TTL, auth revoke/logout clearing and A→B partition, with frontend tests | **UNSIGNED** |
| **H3 — exception** | Owner signs accepted risk, scope, compensating UX, owner and expiration; this is not a silent fix | **UNSIGNED** |

```text
UX044=H1/H2/H3: ____
OWNER/HQ_SIGNER: ____  SIGNED_AT: ____  REASON/RISK: ____
FUTURE_TASK_ID_AND_EXCLUSIVE_GO: ____
```

No UX044 implementation in R20; do not merge it into Basket CAS semantics.

## 5. Current A110 source QA, exact PR heads and A50/A60 follow-up

Live GitHub PR metadata and changed filenames rechecked on R20; all share base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, are **OPEN DRAFT, unmerged**.

| Packet | PR | Exact HEAD R19→R20 | Change paths | Independent A60 R18 source verdict | Native app test |
|---|---|---|---|---|---|
| **P10 CSV UX042** | [#43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) | `96a6068f69027574ac76e18d4d5a2c444b5a914a` → same | CSV FileReader hook/test + `tournament-detail.tsx` (3 files) | `SOURCE_ACCEPTED_CONDITIONAL` | `NOT_EXECUTED` |
| **P17 Backup UX045** | [#50](https://github.com/C8LyNn/aplikacja-turnieje/pull/50) | `5457a74187edc263730c3a4b25a663bdf5531ee9` → same | backup preview hook/test + restore dialog/test + `tournament-detail.tsx` (5 files) | `SOURCE_ACCEPTED_CONDITIONAL` | `NOT_EXECUTED` |
| **P19 Stage UX046** | [#52](https://github.com/C8LyNn/aplikacja-turnieje/pull/52) | `cce73ec47445102b216b3f8eceb4ec9de67eb1a7` → same | stages panel/test (2 files) | `SOURCE_ACCEPTED_CONDITIONAL` | `NOT_EXECUTED` |

**Independent citation:** [A60 R18 report](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md), blob `656a8850a6358e5b4b2517220a5fc55f99dc014f`, independently carries identical-HEAD conditional source verdicts from R15/R17/R18. **Do not say no independent A60 review exists:** it does, but **only source conditional** and zero app test proof. No new SHA in A110 source means no new A60 author acceptance implied. Separately, current R19 PR53 `d1aebfc...` and PR54 `bfa9d075...` have **no new signed A60 exact-SHA R19 report located at this R20 control snapshot**, so their R18 source status must not be transferred across heads.

**Authored targeted React definitions:** #43 = **5**; #50 = **10** (5 hook + 5 dialog); #52 = **7 UX046-specific** (among other tests in the full stage panel file). **Total targeted 22 authored, 0 executed by A110**. [A50 R19 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R19_RECEIPT.md), blob `412117e31c297353b35a3c21fbd616d41754d4b6`, documents **0 native app tests**, Node/Git only, no connected full repository checkout/pnpm10/approved isolated PG16. **No local Node/RTL/API/PG16 commands executed by A110 in R20**. `RUNTIME_VERIFIED=NO` on these exact heads.

**Historical CI at each exact unchanged head:** [PR43 run 38590842415](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38590842415), [PR50 run 38600542147](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38600542147), [PR52 run 38605694664](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38605694664) completed FAILURE at old upstream Pack19 `readOnly:true` matcher vs actual `accessMode:"read only"`. Feature-specific RTL not reached; standalone PR35 addresses matcher; never call these targeted feature FAIL or PASS.

**A50 runtime acceptance contract (no redundant PLAN-only assertion):**
- CSV #43: late A FileReader.onload/onerror after A→B/modal-close/B manual input must cause **zero stale state and zero unauthorized POST**, while deliberate current B CSV import succeeds once.
- Backup #50: deferred A read/preview cannot revive A under B, preserve old credentials or submit old file; current V2/V3 B file + **new** credentials may deliberately import to separate new tournament C (not overwrite B).
- Stage #52: stale modal version/status and A→B same stage ID or failed fresh GET causes **zero POST**; current stage once-only legitimate start and complete with fresh readiness/ceremony succeeds.
- A50 must run real per-HEAD typecheck, targeted React RTL and full frontend suite with pinned shell+exit+TAP+Node22/pnpm10/OS; then full `TournamentDetail` route/HTTP regression, not just hooks. A60 validates actual evidence independently.

**Future integration collision DAG (not merge permission):** PR43/PR50/**PR54** each touch `artifacts/tournament-manager/src/pages/tournament-detail.tsx`; PR47 and PR54 touch `stage-progress-view.tsx`. Preserve FileReader/backup scopes, RR/DE legal visibility and selected-RR denial; no A110 code changes or cross-branch cherry-picks. PR53 private cache and local CSV/Backup form state logout isolation require separate A30/A100/A60 scoped QA; no unproven leak claim.

**WITHDRAWN forever unless new independent evidence:** supposed ordinary advanced `StageBasketsPanel` A→B draft transfer and allegation that backup import overwrites an existing B. Backup import creates new C. UX016 no new A110-source-confirmed R20 case.

## 6. Original WEB-004 backlog and owner gates — A110 does not fabricate IDs/signoffs

Per [A10 R19 ledger](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R19_FINAL_ONLY_PACKAGE_AND_38_CASES.md): historical **38 cases**, aggregate 0 PASS/3 external CI FAIL/33 BLOCKED/2 NOT_RUN; **29 original case IDs traced, 9 original IDs SOURCE_ID_NOT_AVAILABLE** because original `WEB-004_A60_FINAL_ACCEPTANCE_MATRIX_R2.csv` not yet recovered. The owner-signed per-original-case disposition remains incomplete. Do not invent missing IDs or assign T055/UX044 an unverified original historical case number. A10/A00 own lineage and signature reconciliation.

**Formal handoff not ready:** pending exact A60 new-head verdict for PR53/54, source/privacy risk and 38-case owner decisions; T055/UX044 and other policy signatures absent; A50 native tests zero; no separate `HANDOFF_WITH_RUNTIME_TEST_DEBT`, no `FINAL_HANDOFF_GO`. Even if owner later accepts a runtime-debt transfer after source/policy/38-case closeout, SWARM-006 must treat full composite frontend/API/PG regression and release gates as hard STOP before staging/live. No activation in R20.

**Immediate owner action requested by A110:** A00 sends the six D1–D6 choices **plus separate UX044 H1/H2/H3** to actual owner/HQ for explicit signatures or accountable exceptions. If signed, open a future T055/UX044 code lane only via fresh, exclusive written A00/HQ GO, then obtain actual isolated tests. Until then `T055_POLICY_OPEN / OWNER_SIGNATURE_REQUIRED / NO_CODE_GO`.

**Final formal report:** [WEB-005_A110_R20_HANDOFF.md](./WEB-005_A110_R20_HANDOFF.md).
