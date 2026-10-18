# WEB-005 / WAVE 5R — A120 ROUTE ASYNC FIX / HANDOFF

**Task ID:** `WEB005-W5R-A120-ROUTE-ASYNC-EXISTS`  
**Role:** A120 — Presentation & Bracket Views  
**Date:** 2026-10-18 Europe/Warsaw  
**Status:** `DONE` for the scoped pure-helper fix; `READY_FOR_QA` for independent A60 exact-SHA review; **NOT deployed / NOT ready for live integration**.  
**Authority:** [W5R MASTER DISPATCH](https://docs.google.com/document/d/1yKUPtfE0dC9a0nRAdi35OnYPDIZUN46u3bCkN2KeDTw/edit), section `A120 — ROUTE POLICY FIX`, revision `AHj4eMR8Wrdomd9pM1-oqbTujnI3kMKX3ZEgMalBnu-o75MDFXAdJiO1iZvSg7k9-PNFZc3cuDkJ3MGa13Qkk9Jpftp6nDUx8BRAexU3oM4`.  
**Issue:** [#70 — static asset 404, portfolio, Animated Effects](https://github.com/C8LyNn/aplikacja-turnieje/issues/70).

## 1. Exact Git and isolation

- Repository `C8LyNn/aplikacja-turnieje`.
- Unmodified GitHub release `release/tournament-ops-20261013-01@1db3734b8988940acc6be8b992420a58fc39624a`.
- **Parent [PR103](https://github.com/C8LyNn/aplikacja-turnieje/pull/103)** remains OPEN DRAFT, exact HEAD/BASE for this child **`9fb85b2ca5c137c6107a360bbdb45efec6bf1dde`**. Old route helper blob **`69ad72d85858ea43f8d61cd0b0770026650e23a3`**.
- **NEW [Draft PR142](https://github.com/C8LyNn/aplikacja-turnieje/pull/142)** on `fix/web-005/a120-w5r-route-async-exists-20261018`, exact HEAD **`b289cbd75ebc828d3e562eabef5ae40d1e92cce5`**, base exact PR103 SHA **`9fb85b2ca5c137c6107a360bbdb45efec6bf1dde`**. GitHub compare: 2 commits ahead, 0 behind, **two affected paths exclusively A120-owned**:
  - `scripts/deployment/static-route-policy.async-exists.test.mjs` — new 71-line test file, blob **`d1f86241b55dd9198bfdb8528d97fc9c02d7b113`**, SHA256 `25955f7c8c9e351e43eb5da45cb4ebef71d0a17328ed146ffe28c0a17d425363`.
  - `scripts/deployment/static-route-policy.mjs` — 27 insertions/4 deletions, blob **`1b023671cd68116bb3876d1ef11d057c28a59265`**, SHA256 `eb6c5e5e4e23088ac0852a357b83fae92bc263b5653fa4e37f483bbbe25e734c`.
- **Test-first commit:** `db66aa1f3e17093fbb38efc757d40a41c659c96b` (test). **Fix commit:** `b289cbd75ebc828d3e562eabef5ae40d1e92cce5` (classifier).
- Sibling **[PR120](https://github.com/C8LyNn/aplikacja-turnieje/pull/120)** remains OPEN DRAFT exact `e97e9d582e76cc4c4b6ba5bb784c89feb6be50ab` stacked on old PR103; **NOT changed, rebased, merged or cherry-picked**. Later integrator/A10 must account for two PR103 child branches and preserve PR120's 2 test files without duplicate parent application.

## 2. Confirmed defect before change — not a hypothesis

Exact PR103 source had `if (exists(decoded)) return {kind:'static'...}`, and for known directory aliases used `exists(index) ? 'static' : 'not_found'`. JavaScript Promise objects are truthy even when they later resolve to `false`: `exists=async () => false` therefore **wrongly classified missing .ttf/.js/.wasm as present static files**, and a resolved-false directory index could similarly be treated as present. It is a **source-reproduced defect**; no claim of observed production route responses is made.

**Test-first executed against byte-identical ORIGINAL PR103 helper blob `69ad72d...`**, in local isolated Node v22.16.0:

    node --test scripts/deployment/static-route-policy.async-exists.test.mjs

At the initial 6-case test stage: **exit 1, TAP 6 TOTAL / 1 PASS / 5 FAIL / 0 SKIP**. The five failures were Promise(false) missing static assets, Promise(true) incorrectly authorizing assets/SPA, async false directory aliases, truthy thenable, and synchronous exceptions from `exists`. This is a legitimate failing-before receipt; subsequent seventh rejection case was added to the test file after the initial failing-before run and before the passing-after run.

## 3. Narrow fix and decision

**Chosen design: SYNCHRONOUS contract + FAIL-CLOSED**, not implicit asynchronous support. This avoids changing the return type or introducing unsupported async behavior into host routers.

A small `checkedExists(exists,path)` helper accepts **only strict synchronous `boolean`**. Exceptions, Promise/thenable, and non-boolean results become `UNKNOWN`; `resolveStaticRoute` maps that to `{kind:'not_found',path}` rather than exposing static resources or the SPA shell. A rejected Promise is observed with `Promise.resolve(result).catch(()=>{})`, preventing an unhandled rejection caused solely by the unsupported probe. Existing synchronous `true`/ `false` behavior is retained; missing static routes and known directory alias index denial remain 404 decisions. No filesystem/network/HTTP server implementation is added; the returned `not_found` is **only a routing decision**, not an actual host HTTP404.

**Contract limit:** A legitimate async `exists` provider will now receive `not_found` even for an actually present file or extensionless SPA URL. That is an intentional fail-closed mismatch, and the future hosting adapter **must supply a verified synchronous built-file existence map**. If async provider is required in future, it needs a separate explicitly asynchronous API and associated caller changes under new GO; never pass a Promise to this sync helper.

## 4. Actually executed QA (sanitized DB-free environment)

**Local environment:** `/mnt/data/web005_w5r`, Node **v22.16.0**. Source/test bytes independently confirmed by `git hash-object` to match the exact GitHub blobs; original 10-test source `static-route-policy.test.mjs` blob **`e6d3312f1ed951dacf307b9bfda42a9b655071c4`**. No checkout of entire frontend, no pnpm, no DB; test command removes DB/PG/Replit env vars.

    env -u DATABASE_URL -u TEST_DATABASE_URL -u PGHOST -u PGPORT -u PGUSER -u PGPASSWORD -u PGDATABASE -u REPLIT_DB_URL -u REPL_ID -u REPLIT_DEPLOYMENT node --test scripts/deployment/static-route-policy.test.mjs scripts/deployment/static-route-policy.async-exists.test.mjs

**After source fix (actual process): `exit 0`, TAP `17 TOTAL / 17 PASS / 0 FAIL / 0 SKIP`, ~106 ms.** Includes all 10 existing PR103 tests and 7 new tests (Promise true/false, missing TTF/JS/WASM, index aliases, arbitrary thenable, synchronous provider exceptions, rejected async exists without unhandledRejection). `node --check` both updated module and new test **exit 0**. These are **genuine native Node tests** of the exact matched source, **not** React/browser/live/PG integration results.

**CI for exact PR142 HEAD:** queried GitHub workflow runs — **none observed** at handoff; no paid/manual CI rerun. **Replit static host adapter, actual HTTP status/MIME, game asset hash parity, browser refresh, API/E2E: `NOT_EXECUTED`.** Do not infer release readiness from unit-test PASS.

## 5. Conflict map / next owner / integration verdict

- **A60:** independently source-review exact PR142 **`b289cbd75ebc828d3e562eabef5ae40d1e92cce5`** and both new blobs; rerun 17 native DB-free Node tests with recorded exit/TAP, inspect strict sync fail-closed and rejection handling. This author's 17 PASS is not independent QA.
- **A10/A40:** register PR142 as the narrow proven fix on PR103 and account for sibling test-only PR120; never double cherry-pick PR103's parent. Later create one approved source-only composition after independent acceptance, preserving source and tests. **Do not change PR120's base or content automatically**.
- **A40/A140:** true live/preview HTTP404 still requires reconciliation with published Replit checkpoint, supported production adapter, actual static existence inventory, SPA deep-link reload, portfolio/stream/OBS and untouched game build hashes. Neither PR103 nor PR142 is wired into Replit; no source-based QA proves actual host behavior.
- **A00:** retain `RELEASE_NO_GO` for composite/production. PR142 **READY_FOR_QA as a source fix**, not READY_FOR_INTEGRATION or actual working web candidate.
- **Rollback:** Close Draft PR142 or revert its 2 isolated test/fix commits on own branch; no impact to games, DB or live.

**STOP respected:** no changes to PR120/A140/Replit manifest, Unity or other game assets, protected merges, deploy, PG16/SQL, live Steam auth, paid CI or SWARM006.

**FINAL:** `W5R_A120_DONE / SOURCE_DEFECT_REPRODUCED_AND_FIXED / NATIVE_NODE_17_PASS / A60_EXACT_SHA_PENDING / HOST_UNWIRED / INTEGRATION_VERDICT=READY_FOR_QA_ONLY`.
