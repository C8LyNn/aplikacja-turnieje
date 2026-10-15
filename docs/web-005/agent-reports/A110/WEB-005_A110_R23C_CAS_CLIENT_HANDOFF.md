# WEB-005 — A110 R23C / T055 frontend CAS client & draft retention — handoff

**Task:** `WEB-005-T055-A110-R23C-CAS-CLIENT`  
**Agent:** A110 — Basket Concurrency & Frontend State  
**Date:** 2026-10-15, Europe/Warsaw  
**Authorization:** TEST-FIRST FRONTEND SOURCE / FEATURE-GATED, no production cutover, SQL/DDL, PR55 edit, shared page edit, merge, deploy or SWARM-006.  
**Disposition:** `CAS_FRONTEND_SOURCE_READY_FOR_QA / SERVER_PENDING / RUNTIME_NOT_VERIFIED / NO_PRODUCTION_ACTIVATION / RELEASE_NO_GO / SWARM006_HOLD`.

## 1. Actual isolated source publication

**New DRAFT PR [#63](https://github.com/C8LyNn/aplikacja-turnieje/pull/63), branch `WEB-005-T055-A110-R23C-CAS-CLIENT`.**

- **Exact HEAD:** `3ddcfea2ba47f4314fced3022d00922f8cedb0e3`.
- **Base:** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.
- **GitHub compare:** ahead by 9 sequential commits; **6 newly added frontend files**, no modified pre-existing source. Independent current PR metadata and filenames read back after PR creation.
- [`artifacts/tournament-manager/src/lib/stage-basket-cas-client.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/3ddcfea2ba47f4314fced3022d00922f8cedb0e3/artifacts/tournament-manager/src/lib/stage-basket-cas-client.ts) — typed transport, server-owned strong quoted ETag, If-Match, 412/428/HTTP errors, runtime snapshot provenance bound to same client, tournament and **non-secret** authorization epoch. Explicit feature gate default OFF. Auth header is injected freshly for every request. No client-side ETag mint, implicit retry or force update.
- [`artifacts/tournament-manager/src/lib/stage-basket-cas-draft.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/3ddcfea2ba47f4314fced3022d00922f8cedb0e3/artifacts/tournament-manager/src/lib/stage-basket-cas-draft.ts) — locally retained graph, 412/428 conflict state, explicit canonical refresh, local-vs-remote diff, manual reconciliation only by confirmed organizer action and **separate explicit save**; stage/roster mutation warning preserves local draft and blocks stale writes. Tenant/authorization epoch switch or 403 clears private state. Pending reads/PUT results cannot revive a previous tenant's state; no auto retry.
- [`artifacts/tournament-manager/src/components/basket-cas-conflict-review.tsx`](https://github.com/C8LyNn/aplikacja-turnieje/blob/3ddcfea2ba47f4314fced3022d00922f8cedb0e3/artifacts/tournament-manager/src/components/basket-cas-conflict-review.tsx) — separate unmounted compare component, local/remote side-by-side, participant and stage context, user-triggered refresh, keep-local vs use-remote buttons; neither choice submits HTTP PUT.
- Accompanying test files: `stage-basket-cas-client.test.ts` **10 cases**, `stage-basket-cas-draft.test.ts` **13 cases**, `basket-cas-conflict-review.test.tsx` **5 React Testing Library cases**.

**Explicit negative scope**: no edits to `tournament-detail.tsx`, `stage-baskets-panel.tsx`, existing #43/#50/#54 files, generated API client, backend routes, schema/migrations or [test-only PR55](https://github.com/C8LyNn/aplikacja-turnieje/pull/55). There is no separate conflict/integration branch because those shared files were not touched. **StageBasketsPanel production behavior unchanged.**

## 2. Owner source and backend gating

**Owner decision** [T055 D1–D6](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_T055_BASKET_CAS_APPROVAL.md), Git blob `36a14ef3be7852c202cc003264bf17e67da2f022`: D1=B monotonic persisted basket revision, D2=B server GET ETag / PUT If-Match, D3=B stale **412**/zero-write, D4=A missing **428**/no write, D5=B stage/roster in-lock guard, D6=B keep draft and manual reconcile/opt-in resave.

**A20 design** [R23A writer conflict matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/WEB-005_A20_R23A_T055_RESERVATION_WRITER_CONFLICT_MATRIX.md), blob `6e1d01e69f1180da06fff15abfb33ea6400c50cd`: persistence reservation `REQUESTED_NOT_ALLOCATED` (numeric migration ID NULL), full writer/trigger deadlock graph and actual physically isolated PG16 QA pending. Suggested BIGINT monotonic revision and server-issued tenant/generation token, **not** implemented in release. No SQL permission.

**Hard inactive gate:** `createBasketCasClient` requires `featureEnabled:true` **and** `serverCasVerified:true`. Both default false and the app does not import the new modules. The existing backend's GET does not issue a strong CAS validator, PUT does not implement If-Match. **Never turn either gate on merely because this PR is merged or because generic HTTP auto-ETag exists**. Once server CAS exists, A00/HQ must separately authorize generated API/StageBasketsPanel integration, safe rollout/legacy client upgrade and real regression QA.

**Auth and privacy:** `authContextId` must be a fresh non-secret role/session epoch rotated on account change, expiry or logout; never a password/session token. If UI later mounts the adapter, it must preserve one session per active tournament scope, call `markStageOrRosterChanged` after relevant stage/roster mutations and destroy/switch on credential downgrade. R23C does **not** alter actual current production frontend persistence or navigation guards.

## 3. Authored regression matrix, with honest execution status

| Area | Source-defined tests | Expected oracle |
|---|---:|---|
| HTTP / ETag / If-Match | 10 | Gate-disabled sends **zero** requests; missing/weak/list strong-tag rejection; valid server token reused unchanged; stale 412/428 explicit; successful server-issued new ETag; foreign tenant/auth/client tag rejected; no uncontrolled retry |
| State adapter | 13 | Local graph retained after 412/428 and during stage/roster edits; explicit remote refresh/diff then human reconcile and separate save; repeated 412 requires repeated opt-in; switch tenant/auth clears old local data; old pending GET cannot resurrect; permission revocation clears; edits during pending PUT preserved |
| Isolated React component | 5 | Conflict shows explicit refresh before comparison; manual local/remote choice never PUT; side-by-side differences; button disabled during save; hidden in normal editing |

**28 tests AUTHORED, not verified PASS.** At author handoff there is no trusted complete per-HEAD repository checkout in the current agent runtime with pnpm10/frozen dependencies and no approved server CAS environment; **no typecheck or test runner exit/TAP was produced by A110**. Browser/JSdom focused tests require the actual workspace dependencies, independent receipt and A60 source QA. No production DB operations attempted.

**Proposed non-DB verification commands (not executed):**
```bash
git rev-parse HEAD  # assert 3ddcfea2ba47f4314fced3022d00922f8cedb0e3
pnpm install --frozen-lockfile
pnpm --filter @workspace/tournament-manager run typecheck
cd artifacts/tournament-manager
TSX_TSCONFIG_PATH=./test/tsconfig.json node --import tsx --import ./test/setup-dom.mjs --test \
  ./src/lib/stage-basket-cas-client.test.ts \
  ./src/lib/stage-basket-cas-draft.test.ts \
  ./src/components/basket-cas-conflict-review.test.tsx
```
This is purely mocked frontend transport and RTL, no PG16 reset or paid CI rerun is needed for this suite. Any independent report must identify exact SHA, real exit, TAP/skip and failing testcase.

**GitHub Actions:** workflow for PR63 exact HEAD [run 38737278121](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38737278121) completed `FAILURE`. [Job 116429670932](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38737278121/job/116429670932) failed at **Pack 19 snapshot consistency tests**, where an obsolete assertion requires `readOnly:true` but the actual released source has `accessMode:"read only"`; this was confirmed from the real job log. Later gates were SKIPPED. This workflow did **not execute any newly authored Basket CAS client/draft/RTL test**. CI_UPSTREAM_PACK19_FAILURE, FEATURE_TEST_NOT_EXECUTED, no manual rerun; PR35 already owns the isolated Pack19 matcher correction.

## 4. Dependencies / future code-owned cutover, not authorized here

1. **A20 and backend:** approve a real monotonic basketConfigRevision/generation migration and writer lock graph (no unapproved SQL), implement transactional snapshot ETag and lock-based matching If-Match, 412/428 zero-write; after relevant roster/stage mutation ensure prior editor token invalid. Verify on dedicated owner-approved disposable PG16 and update API/DTO response to return coherent final strong ETag. **PR55 is test-only; server remains pending.**
2. **A90 Backup V2/V3:** correct clone-local revision/generation, legal historical restore and modern strict Backup V3 with rollback. Never accept source backup's ETag as clone token or derive basket revision from match/resultHistory revision.
3. **A00 future frontend integration:** separate exact-file integration GO for `StageBasketsPanel` and any shared `tournament-detail.tsx`, client auth epoch lifetime, explicit UI refresh/diff/confirm flows and 412 draft retention after real mounting. Semantic conflicts with PR43/50/54 require ownership resolution; nothing cherry-picked.
4. **A50/A60:** run actual focused typecheck/RTL on PR63 immutable head and independent security/logic source review; then full mounted A→B/roster/stage HTTP and deterministic concurrency tests after backend gate. A60 independent verdict **PENDING**, author report cannot sign itself.
5. **Final gate:** do not merge/stage/live/release/dispatch SWARM006. WEB004 historical 38-case and other final gate decisions remain governed by A00/HQ.

## 5. Coordinator receipt

- **Draft PR:** https://github.com/C8LyNn/aplikacja-turnieje/pull/63
- **Handoff (this document):** https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A110/WEB-005_A110_R23C_CAS_CLIENT_HANDOFF.md
- **Immediate A00 action:** register the new exact-head isolated feature-gated frontend candidate, request A60 independent review and connect future A20/backend CAS cutover only after signed migration and staged rollout GO.

**A110 source author disposition:** `CAS_FRONTEND_SOURCE_READY_FOR_QA / SERVER_PENDING / TESTS_AUTHORED_28_NOT_EXECUTED / QA_A60_PENDING / NO_PRODUCTION_CUTOVER / NO_MERGE / SWARM006_HOLD`.
