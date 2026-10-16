# WEB-005 — R23D / A10 / ISSUE #75 — C02 ELIGIBILITY, COLLISION DAG AND REPLIT PRESERVATION

**This is an A10 pre-composition document; no C02 created or approved.** Exact-source pins and owner test/branch authorization required before A40 action. `C02_NOT_CREATED / WAIT_ISSUE_73 / SWARM006_HOLD`.

## Blocking predecessor

- [Issue #73](https://github.com/C8LyNn/aplikacja-turnieje/issues/73) — A50/A60 first failure of real C01 API integration exit 1 has not been published. Do NOT infer cause from PG logs, blame new pure Swiss/Backup, skip tests or rerun paid CI without GO.
- C01 PR60 `fa3261b2c9510e110ac9eba21726812d3401a525` remains OPEN DRAFT on historic `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, 14 exact blob copies and 6 source packets. Existing CI 38736073793 proves scoped suites PASS plus API integration FAIL; frontend/build gates NOT_EXECUTED.

## Eligibility ledger — exact SHA and functional gates

| Packet / PR | Current SHA | C02 position | Rationale |
|---|---|---|---|
| P26/[#61](https://github.com/C8LyNn/aplikacja-turnieje/pull/61) | `8c26778c94cd6c96987f3986b651066024f10d4a` | **HOLD** | Stacked PR57, test invokes schema reset; no certified PG16 |
| P27/[#63](https://github.com/C8LyNn/aplikacja-turnieje/pull/63) | `a4119b29a78b72d400947d8dd5bd100c59d6444e` | **EXCLUDE_PENDING_A60_SECURITY_AND_BACKEND** | Authorization-blocked source changed, A60 unreviewed; server CAS not wired |
| P28/[#64](https://github.com/C8LyNn/aplikacja-turnieje/pull/64) | `7837e412626e88761c70f1a2ceeb822d7ed101e1` | **PROVISIONAL_ONLY_AFTER_73_AND_A60_NEW_COMPOSITE_QA** | Pure isolated action-local validator; no importer privileges |
| P29/[#66](https://github.com/C8LyNn/aplikacja-turnieje/pull/66) | `7490c974b7c84404559fd590bd09817a71c2134f` | **PROVISIONAL_ONLY_AFTER_73_CALLBACK_COMPAT** | Stacked C01, stub callbacks, not wired |
| P30/[#67](https://github.com/C8LyNn/aplikacja-turnieje/pull/67) | `880824f18b8913602955578dfd76eeac7976e32a` | **SEPARATE_EXPECTED_RED_SECURITY_TEST_LANE** | Fail-first ingress tests, six PG16 default skip |
| P31/[#69](https://github.com/C8LyNn/aplikacja-turnieje/pull/69) | `1bc087384542b16bb82bc9ab58ec48780fc0e972` | **EXCLUDE_FROM_C02_BASE_DIVERGENCE** | New release base includes games; only CSS hunk review after Replit preservation |

**File overlap:** 31 source packets, 110 unique paths and **15 exact collision pairs**. All 15 are old unresolved P01–P25 pairs; none of P26–P31 adds a direct new path collision. This only proves path disjointness, never behavioral/API/Undo/issuer compatibility.

**Stacked ancestry:** P26/PR61 has PR57 parent already in C01; P29/PR66 has C01 as its exact Git base. A40 must isolate only the child diff with a pinned base+parent link, or count inherited ancestor blobs incorrectly.

## C02 safe batch selection for A40 (deferred until predecessor gate)

1. A00 accepts A50/A60 identified first failed C01 test and remedy or explicit blocker. No source integration starts before this. Record diagnosis link, new fix PR/head SHA and test receipts.
2. Freeze C01 SHA, each source PR SHA and file digest; request A00 exact allowlist for a new disposable branch. No `main`, `develop`, protected release, production or staging edits.
3. Review P28 pure provenance validator and P29 preclone adapter as **conditional source-only candidates**, after real callback/schema/negative provenance compatibility checks. Their prior source-only A60 PASS is not importer GO, and no code is automatically wired.
4. Exclude P27 until its latest SHA receives independent A60 QA and A00 reconciles 401/403 retained-private-versus-cleared draft policy. Feature remains OFF until backend CAS D1–D5 (not in PR55) exists and is verified.
5. Keep P26 destructive two-stage PG16 acceptance test out of default DB-free green lane. Its `resetTestSchema/dropTestSchema` requires named disposable PG16, A00/A20 written physical scope and test fixture identity.
6. Keep P30 future-intended-RED ingress security tests in separate test-first branch/lane; six PG16 tests default SKIP and cannot silently count as PASS. Do not disable them to green-light candidate.
7. Keep P31 font PR69 on its own **new GitHub release ancestry**, not C01. Never merge entire release because the new release delta includes 23 paths and game assets. Allow only exact CSS hunk after source/renderer QA and Replit file-by-file preservation under #70/#72.
8. On an independently authorized C02 source commit, publish exact SHA, source-ref→blob→target manifest, manual conflict hunk evidence, A50 real TAP/exits, independent A60 verdict and rollback instructions. If CI fails, keep `FULL_CI_FAILURE` and stop.

## Replit preservation / required no-op preflight

- Published local checkpoint (not GitHub object): `cb55335ea8e789d5e0f7912955da7d679d7dbb5f`. GitHub release `1db3734b8988940acc6be8b992420a58fc39624a`. GitHub C01 historic release base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.
- Dispatch/#72 reports 140 different paths: 90 Replit-only, 50 different blobs. This is aggregate source information, **not 140 defect confirmations** and not individually SHA-verified by A10. Known areas include Steam catalog/auth, DB migrations 0032–0040, portfolio SPA rewrites, App.tsx, lockfile and game bundles.
- A20/A30 must publish append-only per-path `{path, github_source_SHA, replit_source_SHA, owner, origin, functional_dependency, preserve/port/omit, rollback}` manifest and reconcile deploy status with actual Replit workspace before any authorized live/re-publish.
- A40/A120 review missing static resources returning SPA HTML and Animated Effects only against real existing artifact. No fabrication of HTML/game files; routing changes may affect game loaders but the game domain is frozen.
- Never auto-force clone/sync GitHub over Replit workspace, never apply game binary/root release delta, never edit `public/prototypes/minigames/`, Unity WebGL, game HTML/canvas/engine/loaders.

## Acceptance / completion of #75

**A10 part:** exact source identity, collision DAG, gating, exclusions and preservation obligations documented. **A40 part remains BLOCKED** pending #73 confirmed triage and explicit source allowances. No C02 SHA/PR exists; no tests executed by A10. Unknown outcomes remain `NOT_EXECUTED`, not PASS.

[R23D machine registry](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23D_REGISTRY.json) · [R23D QA matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23D_QA_MATRIX.json).

`ISSUE75_PRECOMPOSITION_READY / C02_NOT_CREATED / C01_API_INTEGRATION_EXIT_1 / NO_MERGE / RELEASE_NO_GO / SWARM006_HOLD`.