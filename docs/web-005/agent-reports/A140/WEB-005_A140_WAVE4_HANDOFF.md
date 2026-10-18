# WEB-005 — A140 / WAVE4_HANDOFF

**Task:** `WEB-005-T140-W4-LIVE-PRESERVATION`  
**Agent:** A140 — Replit & Live Synchronization  
**Status:** **PARTIAL** (scoped review ready; served Live parity blocked)  
**Date:** 2026-10-18  
**Base:** `1db3734b8988940acc6be8b992420a58fc39624a`  
**PR:** https://github.com/C8LyNn/aplikacja-turnieje/pull/116 (existing A140 Draft PR; no new PR)

## Closed in WAVE4

1. Read-only Replit Agent refreshed workspace evidence: HEAD `5e68f0f4b7d73cb5ff6aad0065dbe54c5f691776`, branch `feat/double-elimination-full-integration`, clean working tree, **WORKSPACE_ONLY**. Last provider publish status: **failed**; actual served bytes unverified.
2. Read GitHub release, editor, PR #34, #69, #78, #103 and A30 sparse manifest (#79). Confirmed exact GitHub blob hashes independently of the Replit Agent's reported workspace hashes.
3. Classified **21 scoped paths** in the accompanying `WEB-005_A140_WAVE4_TRANSFER_CANDIDATES.json`; this is a **sparse priority manifest, not the original full 140-path diff**. No automatic source copy.
4. Concrete new source evidence: Replit workspace is missing both Steam catalog route and admin middleware; release catalog mutations are unguarded. PR #34 has a fail-closed candidate guard, **not production integration acceptance**. Do not copy older release backend over Replit.
5. Workspace `index.css` retains dead Valve Pulp font declaration; PR #69 exact deletion-only hunk is a **manual/rebase candidate** for A120, not approved Replit copy. Source CSS differs between release and workspace.
6. Replit `artifact.toml` has only `/* -> /index.html`; GitHub release additionally lists missing-asset legacy `/dev/animated-effects` rewrites. The Replit workspace lacks checked `portfolio/`, `portfolio/projects/`, and `stream/animated-effects/` HTML in public and dist. GitHub release contains HTML sources and checked related hashed stream CSS/JS, **but full bundle closure and hosting behavior remain untested**.
7. PR #78 HTTP smoke probe and PR #103 pure route classifier are **source-only review candidates** for future C02, not production bug fixes. Two agent-reported identical files need no copy.
8. GitHub release and current Replit differ in App.tsx, vite config, lockfile, .replit, and API router; preserve current Replit workspace until three-way review and release signoff.

## Tested in this wave

- **15/15 PASS:** V8 structural/invariant checks on authored JSON before GitHub write (21 unique paths; exact SHA formats, no automatic-copy disposition, missing Steam auth gate, protected SQL and bundled assets, source-only candidate counts, unverified published state).
- GitHub source files and exact blob SHAs fetched; actual last provider publish status checked; Replit Agent read-only source inspection completed.
- **NOT TESTED:** native Node tests of updated PR HEAD, full real Replit/GitHub tree diff, physical published deployment bundle, HTTP/browser refresh, PostgreSQL/SQL, game assets, production deployment or rollback. No claims of runtime route/Steam success.

## Handoff to A10 / A40 / A60

- **A10:** register exact WAVE4 PR #116 head from GitHub metadata and inspect candidate ownership; keep `READY` limited to source-only QA packets **after** independent review.
- **A40:** use the 21-path JSON as a dependency/conflict input, not a cherry-pick script. Do not import Replit configuration, lockfile, old Steam routes, or migration history blindly. Prefer already isolated PR #78 / #103 for source-only QA; PR #69 only as verified manual CSS hunk under A120.
- **A60:** QA the exact WAVE4 PR HEAD, verify SHA/content/manifest and independently run source-only tests. Explicitly retain unverified live and A30/PG16 gates.
- **A120:** handle CSS fallback and full static bundle / 404/SPA behavior; scope is owned by A120 and not edited by A140.
- **A30/A20/A22:** own Steam write-authorization and migrations D01–D04; no acceptance here.

**Remaining blockers:** full published tree, complete live artifact provenance, Steam admin staging gate, DB migration ledger, authoritative route behavior. **NO MERGE / NO LIVE UPDATE / NO RE-PUBLISH / NO SQL / NO GAME CHANGES.**

**Decision:** `WAVE4_SOURCE_PRESERVATION_MANIFEST_PARTIAL_DONE / INTEGRATION_SOURCE_CANDIDATES_READY_FOR_A10_A40_A60_REVIEW / LIVE_PARITY_BLOCKED / RELEASE_NO_GO`.
