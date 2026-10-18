# WEB-005 — A120 / DEVELOPMENT_FIRST_HANDOFF — 2026-10-18

**Agent:** A120 — Presentation & Bracket Views.  
**Mode:** parallel functional development, source-only isolated Draft PR, no dependency on destructive PostgreSQL16 operations.  
**Chosen highest-priority independent lane:** [GitHub Issue #70](https://github.com/C8LyNn/aplikacja-turnieje/issues/70) — missing static resources returning SPA HTML200 instead of genuine 404, while retaining portfolio, stream, minigame/static assets and SPA navigation.  
**Outcome:** **`ROUTE_POLICY_SOURCE_PROPOSED / PURE_UNIT_TEST_10_10_PASS / ACTUAL_STATIC_HOSTING_NOT_WIRED / LIVE_NOT_EXECUTED / INDEPENDENT_A60_PENDING / RELEASE_NO_GO / SWARM006_HOLD`**.

## 1. Verified existing ownership, PRs and report

- R23D [Issue #70](https://github.com/C8LyNn/aplikacja-turnieje/issues/70), still OPEN, A120+A40. Owner-confirmed problem: wildcard production `/* -> /index.html` returns HTML200 for absent font/wasm; published Replit tree differs from GitHub release and requires separate source reconciliation before modifying live routes.
- R23D A120 [test-first PR #78](https://github.com/C8LyNn/aplikacja-turnieje/pull/78), OPEN DRAFT HEAD `11e8d5d0bea679515a807f002724926113bdafc1`, contains read-only 13-case HTTP probe, **not** app routing correction.
- [PR #69](https://github.com/C8LyNn/aplikacja-turnieje/pull/69), OPEN DRAFT HEAD `1bc087384542b16bb82bc9ab58ec48780fc0e972`, independently A60 conditionally accepted CSS source-only (removes dead @font-face, keeps fallback); no duplicate font change.
- Older presentation [PR #47](https://github.com/C8LyNn/aplikacja-turnieje/pull/47) HEAD `f09a13623faca8d7ab29b09a2c5b43907c2acd0b` and RR privacy [PR #54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) HEAD `bfa9d075b431185aa8bbf87bf021d64dde8ae22f` remain separate OPEN DRAFT candidates. This functional change does **not** touch those frontend presentation or tournament files.
- [A40 R23D source blocker report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A40/WEB-005_A40_R23D_ISSUE70_75_HANDOFF.md), blob `583c9ae6631adf5c88d2543100f272943714510d`: Replit *published* local-only checkpoint `cb55335ea8e789d5e0f7912955da7d679d7dbb5f` unavailable as a retrievable git object; connected Replit workspace is a **different** HEAD `5e68f0f4b7d73cb5ff6aad0065dbe54c5f691776`; **no proof of source parity or actual live HTTP**. Never overwrite Replit with release or guess unsupported manifest syntax.
- GitHub current release `release/tournament-ops-20261013-01@1db3734b8988940acc6be8b992420a58fc39624a`, **unchanged**. Existing production config `artifacts/tournament-manager/.replit-artifact/artifact.toml`, blob `377637a6e88f5db4142dedb5035e854b99f422c1`, contains `serve=static`, historical `/dev/animated-effects` rewrites and global `/* -> /index.html`. This is source evidence, not a live deployment request receipt.

## 2. New isolated GitHub source — real development output

**NEW [Draft PR #103](https://github.com/C8LyNn/aplikacja-turnieje/pull/103)**: OPEN/DRAFT/unmerged; branch `feat/web-005/a120-development-first-static-route-policy-20261018`.  
**Exact HEAD:** **`9fb85b2ca5c137c6107a360bbdb45efec6bf1dde`**.  
**Exact base:** `1db3734b8988940acc6be8b992420a58fc39624a`, compare ahead 2/behind 0.  
**Exactly 2 added files, zero modifications/deletions, zero game/DB/server/release changes:**

| Path | Git blob SHA-1 | SHA-256 exact tested bytes |
|---|---|---|
| `scripts/deployment/static-route-policy.mjs` | **`69ad72d85858ea43f8d61cd0b0770026650e23a3`** | `f8642a6da5696317cfaa073c6566582db93549233633e6af750e05986e9868c6` |
| `scripts/deployment/static-route-policy.test.mjs` | **`e6d3312f1ed951dacf307b9bfda42a9b655071c4`** | `041312a47e0abf2fcc0d4e4ce9b96579e6eec961c9490441784728cb137b9079` |

Both Git blobs were **read back via GitHub** and byte-identity checked against `git hash-object` of actually tested local files.

**Functional contract:** pure synchronous `resolveStaticRoute(path, exists)`, returning only **`static`** (a real file exists), **`spa`** (only extensionless app navigation), **`not_found`** (missing static asset/reserved namespace/legacy nonexistent /dev route), or **`invalid_path`** (encoding/traversal/unsafe path). Recognizes real portfolio and /stream/animated-effects directory indexes ONLY when corresponding index file exists. Real Unity HTML/WASM/JS paths take precedence over SPA fallback; no game asset contents read/rewritten. Missing TTF/WASM/JS/HTML never logically maps to index.html. URL query and encoded extensions are handled, encoded slash/traversal fails closed. Unknown extensionless routes still reach Wouter's own NotFound view.

**Critical integration limit:** This is a **source candidate with no hosting adapter**. It does not cause HTTP 404 until an independently audited production adapter maps not_found to actual status404, accesses a trustworthy built public file listing, and is integrated into an **authorized source-parity Replit checkpoint**. There is no unsupported `artifact.toml` syntax or deployment behavior asserted. The API namespace intentionally returns a non-SPA decision; a future host MUST dispatch real /api routes before this policy. No routing manifest, CSS, Wouter or game source touched.

## 3. Actually executed test evidence and missing test scopes

**Executed on local Node v22.16.0, using exact GitHub-identical bytes:**

    node --check scripts/deployment/static-route-policy.mjs
    node --check scripts/deployment/static-route-policy.test.mjs
    node --test scripts/deployment/static-route-policy.test.mjs

- Both `node --check`: **exit 0**.
- `node --test`: **exit 0; TAP 10 PASS / 0 FAIL / 0 SKIP**; actual local duration ~125 ms. Covered existing static precedence (including Unity WebGL), missing static assets, valid portfolio and Animated Effects, legacy /dev route no invented target, Wouter deep links, reserved API/assets, query and encoded paths, traversal, no direct filesystem writes.
- **GitHub Actions PR103:** no workflow run found for HEAD at time of inspection — **NOT_EXECUTED**.
- **Actual Replit/live HTTP status/Content-Type, browser/E2E, build/typecheck of tournament manager, independently signed A60:** **NOT_EXECUTED / PENDING**. No live DNS/HTTP proof is inferred from synthetic tests. Do not claim source accepted, fixed deployed bug, or that every public asset's byte SHA matches Replit.

## 4. Handoff to A10, A40 and A60; blockers and rollback

**A10:** register Draft PR103 as **NEW, UNWIRED pure route policy** tied to Issue70. Preserve PR78 separate read-only HTTP probe and PR69 separate CSS fix; do not mark Issue70 fixed, no change to old P01–P21 without authorization. Pin exact PR103 HEAD, 2 Git blobs, 10/10 native pure tests, and pending source QA.

**A40:** before any actual live/static adapter, reconcile **published** Replit checkpoint `cb55335...` with GitHub release `1db3734...`; current Replit workspace HEAD is NOT the published checkpoint. Prove platform-supported route behavior and real file existence; choose a minimal adapter (or confirmed host rule), never assume test-only helper is active. Then validate real **404 + non-HTML** for missing TTF/WASM/JS, 200 HTML for portfolio and stream Animated Effects, SPA deep-link refresh, /api route prioritization, and read-only existing Unity file byte parity. Do not fabricate `/dev/animated-effects` artifact.

**A60:** review PR103 exact HEAD/2 blobs for pure path parsing, encoded/static fallback bypass, API precedence, cross-platform filesystem semantics, and false-positive handling. Author's tests are not independent source acceptance. Separately preserve PR69 source-conditional review and PR78 test-only QA; evaluate approved adapter on its own new SHA and later actual browser/network evidence.

**A00/HQ next GO:** authorize narrowly scoped Replit routing adapter **only after checkpoint parity** and A60 source review; no silent live publication. If absent, leave `APP_ROUTING_INTEGRATION_BLOCKED` and continue other independent agents; this development source may remain DRAFT.

**Rollback:** close Draft PR103 or revert its two additive commits `f4444b32d21370cb650b43c84079201ba5fe3e17` and `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` on the isolated branch. No production, game or DB rollback necessary.

**Restrictions respected:** no game source/asset, HTML/canvas/Unity loader, balancing, PG16 operations, migrations, protected merges/rebase/force push, paid CI rerun, Replit mutation or live deployment, SWARM-006.

**FINAL:** `DEVELOPMENT_FIRST_HANDOFF_PUBLISHED / DRAFT_PR103 / PURE_FUNCTIONAL_SOURCE_READY / RUNTIME_ROUTE_NOT_WIRED / INDEPENDENT_QA_PENDING / RELEASE_NO_GO`.
