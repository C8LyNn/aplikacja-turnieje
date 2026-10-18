# WEB-005 — A110 DEVELOPMENT_FIRST_HANDOFF — 2026-10-18

**Agent:** A110 — Basket Concurrency & Frontend State  
**Workstream:** DEVELOPMENT FIRST / PARALLEL FEATURE DEVELOPMENT  
**Chosen non-PG task:** eliminate concurrent first-GET initialization race that can overwrite a newer unsaved Basket CAS draft; narrowed follow-up of [Issue #74](https://github.com/C8LyNn/aplikacja-turnieje/issues/74), no production app activation.  
**Status:** `DEVELOPMENT_FIRST_SOURCE_PATCH_PUBLISHED / QA_A60_PENDING / NATIVE_TESTS_NOT_EXECUTED / SERVER_PENDING / NO_CUTOVER / RELEASE_NO_GO / SWARM006_HOLD`.

## 1. Verified prior work and highest-value non-PG blocker

- [Issue #74](https://github.com/C8LyNn/aplikacja-turnieje/issues/74) remains OPEN, A110 P1: retain unauthorized GET 401/403 draft in quarantined private session, prevent stale/unauthorized render, no automatic retry, no cross-tournament leakage. Previous R23D correction is published and awaiting independent A60 exact-head QA.
- [Draft PR #63](https://github.com/C8LyNn/aplikacja-turnieje/pull/63) remains OPEN DRAFT, unmerged, source only, feature-gated and unmounted. Previous HEAD `a4119b29a78b72d400947d8dd5bd100c59d6444e`. Its [A110 R23D handoff](./WEB-005_A110_R23D_ISSUE74_HANDOFF.md) is the last author report. [A60 R23C QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R23C_PR63_A110_SOURCE_QA.md) was `BLOCKED FOR CAS ENABLEMENT` on older `3ddcfea2...`, **not** a QA verdict on this new SHA.
- [PR #55](https://github.com/C8LyNn/aplikacja-turnieje/pull/55), test-only server T055 API acceptance, remains DRAFT on `c3a4ea00ba933cbab36b3582859cb3eff20f0204`, **not** a functional server CAS.
- Concrete additional frontend source risk: original `initialize()` checked only `base`/phase before `await client.load`. Two simultaneous initializations on one epoch could both pass this check, and a slower old GET could replace the graph and overwrite user edits made after the faster GET. This was a **STATIC_INFERRED draft-loss race, not a physical browser reproduction**. No PG16 dependency.

## 2. Actual isolated source change

**Updated existing, isolated [DRAFT PR #63](https://github.com/C8LyNn/aplikacja-turnieje/pull/63)**, rather than duplicating the entire six-file candidate in another PR. Branch `WEB-005-T055-A110-R23C-CAS-CLIENT` remains solely A110's feature-gated frontend branch; release base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.

| Ref | Exact SHA |
|---|---|
| Source delta base (pre-development-first) | `a4119b29a78b72d400947d8dd5bd100c59d6444e` |
| **New PR63 exact HEAD** | **`04229390a7baa3ece720b186d86fe9ad07f04adc`** |
| New source commit (code) | `04229390a7baa3ece720b186d86fe9ad07f04adc` |
| New test-first commit | `dd6496d39ee4be04dc3665169b1f9eeef15c2a12` |

**Exact diff against prior HEAD:** only two existing frontend CAS files; no other source, no games, no DB:
1. [`artifacts/tournament-manager/src/lib/stage-basket-cas-draft.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/04229390a7baa3ece720b186d86fe9ad07f04adc/artifacts/tournament-manager/src/lib/stage-basket-cas-draft.ts) — blob `e915a28aeb2e71d6328f5a63033a74b2053bcf35`. Adds `initializingEpoch` per-scope guard **before async GET**, rejects duplicate initialization, ignores stale completions and resets guard on GET failure. Scope reset advances epoch and lets B initialize before A's pending GET settles; old A completion cannot unlock B. Existing GET 401/403 quarantine and 412/428 manual retry logic unchanged.
2. [`artifacts/tournament-manager/src/lib/stage-basket-cas-draft.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/04229390a7baa3ece720b186d86fe9ad07f04adc/artifacts/tournament-manager/src/lib/stage-basket-cas-draft.test.ts) — blob `08b719bc05d3ccbe97dacee25cb412a602a12dfd`. Three **authored test-first Node cases**:
   - DF-01 duplicate initialization while a GET is pending rejects second request, preserving subsequent draft edits.
   - DF-02 failed initial GET 403 permits deliberate later re-initialization without stale graph/token.
   - DF-03 A pending initialization then B auth/tournament switch permits B immediately; late A result cannot replace B private edit.

**Source comparison readback:** `ahead_by=2` commits, exactly **two modified paths**. All other CAS/React modules, `tournament-detail.tsx`, `stage-baskets-panel.tsx`, existing PR #43/#50/#54, API and game paths unchanged. The 28 initial R23C cases + 7 R23D cases + 3 DF cases = **38 frontend test cases authored on PR63**, not 38 executed or green. No standalone new PR was needed because the isolated existing draft PR63 is the same authorized workstream.

**Independent QA and integration:** A60 should review exact HEAD, especially epoch reset and simultaneous initialization, existing authorization-blocked semantics, assertions before/after GET failure, stale in-flight response suppression and no unexpected importing of CAS into current production UI. A10 should register updated PR63 HEAD; A40 must treat this as a *new source revision* on an existing draft PR and no independent runtime/CI PASS.

## 3. Test/evidence receipt (do not turn authored tests into PASS)

**GitHub connector verification actually performed:** fetched exact PR63 head and both resulting file blob SHAs; compared to previous HEAD (two files only); enumerated three new test declarations; inspected automatic CI job and actual failure log.

**Native test execution in this environment:** `NOT_EXECUTED`. Available isolated tools have Node22/TypeScript but **no connected complete monorepo checkout/locked pnpm workspace dependencies**, and container network cannot resolve `github.com` for safe clone. No local app test/typecheck exit or TAP was obtained; source readback and static inspection are **not** test execution. This frontend change does not require PostgreSQL 16 or any DB mutation.

**Existing automatic CI for exact PR63 HEAD:** [run 39125407364](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39125407364), `completed/failure`. [job 117669432143](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39125407364/job/117669432143) failed **before frontend target tests** at inherited Pack 19 snapshot assertion `isolationLevel:"repeatable read",readOnly:true` expecting obsolete API while actual source uses `accessMode:"read only"`. Verified directly from GitHub job log. No manual CI rerun, bypass, override or paid action. Do not assign that workflow failure to Basket CAS tests or assert CAS PASS.

**Future trusted, non-DB focused commands in A50/isolated checkout of exact SHA:**
```bash
git rev-parse HEAD
# require: 04229390a7baa3ece720b186d86fe9ad07f04adc
pnpm install --frozen-lockfile
pnpm --filter @workspace/tournament-manager run typecheck
cd artifacts/tournament-manager
TSX_TSCONFIG_PATH=./test/tsconfig.json node --import tsx --import ./test/setup-dom.mjs --test \
  ./src/lib/stage-basket-cas-client.test.ts \
  ./src/lib/stage-basket-cas-draft.test.ts \
  ./src/components/basket-cas-conflict-review.test.tsx
```
Require real exit/TAP/skip and SHA receipt. No PG16 or real remote endpoint activation required for mock transport unit tests. Do not substitute a downloaded partial checkout for official native monorepo evidence.

## 4. Explicit remaining gates / no live

- The feature is still **OFF/unmounted**. Backend D1–D5 server strong ETag, If-Match 412/428, durable revision and test-only migration/backup review require separate A20/A90/A50/A60 gates. Existing production UI remains unchanged.
- R23D GET 401/403 privacy-state fix still needs **independent A60 signoff** under later owner #74 semantics (retain while redacted; switch auth epoch destroys), not conflated with source author self-review.
- The pinned PR63 base is older than dispatch current GitHub release `1db3734b8988940acc6be8b992420a58fc39624a`; Replit local checkpoint `cb55335ea8e789d5e0f7912955da7d679d7dbb5f` is distinct; A40/A00 must handle integration drift and explicit cutover separately.
- No protected merge, Replit live publish, production/staging deployment, SQL migrations, test DB reset, paid/manual CI or SWARM-006 dispatch. No asset, logic, loader, canvas, minigame or Unity source was touched.

## 5. Coordinator handoff

- **Draft PR:** https://github.com/C8LyNn/aplikacja-turnieje/pull/63
- **Formal handoff:** https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A110/WEB-005_A110_DEVELOPMENT_FIRST_HANDOFF_20261018.md
- **Assigned Issue:** https://github.com/C8LyNn/aplikacja-turnieje/issues/74

**A10:** append an updated SHA on existing PR63, no duplicate package.  
**A40:** preserve source delta as an isolated, feature-disabled integration candidate, not a verified runtime fix.  
**A60:** independent exact-SHA security/concurrency review and safe focused typecheck/RTL evidence before changing QA status.

**Final author label:** `DEVELOPMENT_FIRST_HANDOFF / PR63_HEAD_UPDATED / TEST_FIRST_CASES_3_ADDED / SOURCE_QA_REQUESTED / TESTS_NOT_EXECUTED / SERVER_PENDING / RELEASE_NO_GO / SWARM006_HOLD`.
