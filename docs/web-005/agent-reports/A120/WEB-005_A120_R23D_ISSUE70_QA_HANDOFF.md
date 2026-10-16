# WEB-005 / R23D — A120 Issue #70 source QA and handoff

**Date:** 2026-10-16 (Europe/Warsaw)
**Agent:** A120 — Presentation & Bracket Views
**Mode:** source inspection + isolated TEST-FIRST Draft PR; NO app production changes.
**Dispatch:** [R23D execution dispatch](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R23D_EXECUTION_DISPATCH_20261016.md), blob 226b6a89c3fd8348eac814221de1c9715ee6ae25.
**Issue:** [#70](https://github.com/C8LyNn/aplikacja-turnieje/issues/70), A120+A40.
**Verdict:** TEST_PROBE_PUBLISHED / SYNTHETIC_QA_PASS / LIVE_HTTP_NOT_EXECUTED / REPLIT_SOURCE_UNAVAILABLE / APP_ROUTING_FIX_BLOCKED / INDEPENDENT_A60_PENDING / RELEASE_NO_GO / SWARM006_HOLD.

## 1. Exact GitHub source and PR evidence

| Source | Exact evidence |
|---|---|
| R23D GitHub release | release/tournament-ops-20261013-01 @ **1db3734b8988940acc6be8b992420a58fc39624a** |
| Replit local-only checkpoint | **cb55335ea8e789d5e0f7912955da7d679d7dbb5f**. This is NOT a GitHub SHA; source files inaccessible to A120. R23D dispatch records **140 differing paths** (90 Replit-local-only, 50 differing blobs), not automatically 140 defects |
| [PR #69 font](https://github.com/C8LyNn/aplikacja-turnieje/pull/69) | OPEN DRAFT, head **1bc087384542b16bb82bc9ab58ec48780fc0e972**, base R23D release, **1 changed file**. Removes only obsolete Valve Pulp Bold font-face block from tournament-manager/src/index.css; both --app-font-deadlock-display fallback declarations remain. Release CSS blob **8e347f9a1aa70e3e4cb8f5adc94faca6ad9bbaa8**; PR69 CSS blob **c1699af3d05b63edd85f6a2a3d7e006036c56f07**. Public fonts/README documents the missing uncommitted font. Live font fix NOT DEPLOYED or copied into Replit |
| **[PR #78 A120 new test-only](https://github.com/C8LyNn/aplikacja-turnieje/pull/78)** | OPEN DRAFT, head/commit **11e8d5d0bea679515a807f002724926113bdafc1**, base **1db3734b8988940acc6be8b992420a58fc39624a**, **one new file** scripts/qa/r23d-static-route-probe.mjs |
| PR78 file identity | Git blob SHA-1 **f6291168689745be37b4574e77b2d20bc5a44c6e**, SHA-256 **e30d97a9e7c3aa78300bdd858654f7623c2279f25335764d245cb02fcb680c4b**. GitHub fetched blob matches git hash-object of locally executed test file exactly. NO application routing, CSS, games, assets or DB edits |
| [PR #60 C01](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) | Disposable composite SHA fa3261b2c9510e110ac9eba21726812d3401a525; separate A40/A50/A60 blocked API integration exit 1. Not modified by A120 |

## 2. Static routing and Animated Effects source facts (GitHub ONLY)

- Source **artifacts/tournament-manager/vite.config.ts** blob **4c833bf13a03b28174f9202dc0498f1f5d25d3ea** contains two **configureServer DEV** middleware rewrites: portfolio root to /portfolio/index.html; /stream/animated-effects root to /stream/animated-effects/index.html. These do NOT establish Replit production deployment rewrites. SPA /api proxy is development-only. No unverified manifest exclusion/negation syntax was written.
- **.replit** blob 7e63a433931aa73310a7ed67f51f1316a101436a declares deployment router application and autoscale target. It does not show actual 2026-10-15 locally published route manifest.
- **public/portfolio/index.html** exists, blob **197bd447df2449947fda3203ab76e7a63e58a48f**; **public/portfolio/projects/index.html** exists. Portfolio roots, relative CSS/assets and direct refresh must remain working after route remediation. Replit local portfolio rewrites reported in Issue #70 are absent from the GitHub release and not yet inspected directly.
- **public/stream/animated-effects/index.html** exists on R23D GitHub release, blob **5af45933e47ac0bb84de9fb95cc761cc82b804e7**; references actual release JS/CSS build files. This is a REAL static Stream Animated Effects artifact. However **/dev/animated-effects** is NOT present among Wouter src/App.tsx routes, and Issue #70 says its target artifact is absent from local public/dist. The standalone **artifacts/animated-effects/index.html** is source, NOT proof of deployment under /dev. **Do not fabricate a replacement, redirect or path** without A40 confirming a published authorized target in the actual Replit tree.
- **src/App.tsx** blob 298f94ac19dbbdc6df775543e720ec250a1de82a supports /minigames, /stream, /stream/overlay/camera-chat, /tournaments/:id/bracket; no explicit /obs Wouter route was observed. The test uses the known OBS-style stream overlay route, not an invented /obs page.
- GitHub release static Unity assets exist: /prototypes/minigames/core-clash-unity/index.html, Build/WebGL.wasm and Build/WebGL.loader.js. They are read-only QA examples, **NEVER modified, rebuilt, copied or rebalanced**.
- The old global SPA wildcard returning **HTTP 200 text/html for nonexistent .ttf/.wasm** is **Issue #70 confirmed input**, not newly measured by A120 in a production request. Real missing .js is a required negative test, not a measured result.

## 3. What A120 actually executed (source/blob QA versus live)

**Exact test file executed locally:** PR78 Git blob f6291168689745be37b4574e77b2d20bc5a44c6e, Node.js **v22.16.0**. No package install, external request or game execution was used.

| Test / command | Actual exit and result |
|---|---|
| node /mnt/data/web005_r23d_route_probe.mjs --self-test | **exit 0; 13/13 PASS**, synthetic localhost HTTP response fixture only |
| node --check /mnt/data/web005_r23d_route_probe.mjs | **exit 0**, syntax check only |
| Negative control: same probe imported on local mock HTTP server returning the same SPA HTML 200 for every path | **exit 0** for verifying detection; 3/3 intentionally invalid nonexistent-asset requests correctly flagged FAIL |
| Real Replit host HTTP | **NOT_EXECUTED**: web tool could not reach URLs and sandbox HTTP fails DNS NameResolutionError, no live status/content-type evidence |
| Real frontend build/TypeScript/browser/Unity E2E | **NOT_EXECUTED**; no app runtime PASS inferred from the test harness |
| Full Replit checkpoint vs release 140-path source diff | **NOT_EXECUTED / BLOCKED**; checkpoint local-only |

**13 read-only probe cases:** 3 nonexistent static extensions (.ttf,.wasm,.js) must return true **404, no SPA root**; 3 real HTML routes (/portfolio/, /portfolio/projects/, /stream/animated-effects/); 4 SPA deep links (/tournaments/101/bracket, /minigames, /stream, /stream/overlay/camera-chat); 3 Unity assets (HTML index, real WASM magic 0061736d, JS loader non-HTML). The probe reads the FIRST response chunk and cancels the stream to avoid downloading a large binary. It does **not** establish byte-for-byte identity with live Unity files; that requires a separate verified checkpoint hash comparison. A synthetic green result does **NOT** mean the live app is fixed.

**Controlled execution recipe, ONLY on approved reachable isolated/preview target**: set R23D_BASE_URL to its explicit HTTP(S) URL, then run node scripts/qa/r23d-static-route-probe.mjs. Without a URL the tool exits 2 and NEVER defaults to a production endpoint. To exercise its synthetic self-test, pass --self-test. All requests are GET and no writes.

## 4. Replit live gap and hard boundary

Connected Replit app [aplikacja-turnieje](https://replit.com/@kubapowierski10/aplikacja-turnieje), replId 924eaa5b-3c0a-46bc-a33c-59b199c21a8b. Two separate READ-ONLY questions were declined **phase=busy** because the Replit Agent was handling a prior request; neither question was queued, no workspace files read or written. Replit get_publish_status says latest deployment **failed** and exposes URL https://aplikacja-turnieje.replit.app, but this is **not** an HTTP status assertion about previously served content. Explicit HTTP calls to that hostname failed DNS resolution, and browser-style web fetches were inaccessible.

Therefore **do not port PR69 CSS into Replit, copy GitHub router files into Replit or change/redeploy live** until an authorized read of actual Replit checkpoint cb55335... compares exact content/hunks. Replit platform routing semantics and supported exclusions must be verified before changing static 404 handling. The reported wrong wildcard route can only be considered a proposed target, not a safely merged fix today.

## 5. Owner handoff, blockers, rollback and gate

**Done A120:** read central dispatch and Issue #70; verify PR69 changed hunk and fallback; source-check real portfolio and Stream Animated Effects artifacts; create **isolated test-only DRAFT PR78** on exact current release; execute matching mock self-test 13/13 and negative-control 3/3; publish this source QA handoff. No game, CSS, server, Wouter routing, database or live changes.

**Open A40/A00 owner action:** obtain read-only access to locally published Replit source and checkpoint metadata; perform **actual local-vs-release route/CSS/artifact reconciliation**; choose platform-supported minimal missing-static true-404 rule while preserving direct SPA/portfolio/stream/minigame and loaded assets. Verify whether a real deployed /dev/animated-effects target exists; otherwise document missing artifact, no synthetic placeholder. Gate PR69 CSS port on exact Replit hunk parity. Collect real isolated HTTP status+Content-Type logs, browser refresh/screenshots and unchanged game-asset SHA256. Have **A60 review PR69 and new PR78 independently on their exact SHAs**; A10 register the separate test-only candidate and actual blockers. No deployment without explicit HQ approval.

**Rollback:** PR78 adds one optional, read-only Node tester in an isolated draft branch. Revert its sole commit 11e8d5d... or close the Draft PR if needed; no production source, game build or database is affected. A future route fix needs its own exact file/hunk rollback and Replit reconciliation before deployment.

**Final:** TEST_FIRST_SOURCE_PUBLISHED / ROUTING_PRODUCTION_FIX_BLOCKED_REPLIT_SOURCE / LIVE_HTTP_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD.
