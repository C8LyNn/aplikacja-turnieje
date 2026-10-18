# WEB-005 — A140 — WAVE5_HANDOFF

**Task:** `WEB-005-T140-W5-PRESERVATION-CLOSURE`  
**Role:** Replit & Live Synchronization  
**Status:** **PARTIAL** — source preservation and candidate handoff DONE; published/runtime parity BLOCKED  
**Integration readiness:** **CONDITIONAL for independently QA-approved source-only tests; NO for Replit/live deployment**  
**Date:** 2026-10-18  
**Draft PR:** https://github.com/C8LyNn/aplikacja-turnieje/pull/116  
**Immutable PR base:** `1db3734b8988940acc6be8b992420a58fc39624a`  
**WAVE4 ancestor HEAD:** `58ac042d98ca42eca2f8229996b49ca575b6c78f`  
**Final WAVE5 HEAD:** read from PR #116 metadata after this new report commit; this document must not assert a self-referential HEAD.

## 1. Scope completed without modifying production code

WAVE5 continues A140 PR #116 and its 21-path WAVE4 source-preservation JSON:
[WEB-005_A140_WAVE4_TRANSFER_CANDIDATES.json](./WEB-005_A140_WAVE4_TRANSFER_CANDIDATES.json).

Fresh Replit **read-only Git** inspection confirmed:

| Identity | Source-evidence result |
|---|---|
| Workspace HEAD | `5e68f0f4b7d73cb5ff6aad0065dbe54c5f691776` |
| Workspace Git tree | `90ec61122e4e04b67a68e6a4b8e825f62c393afa` |
| Workspace branch | `feat/double-elimination-full-integration` |
| Workspace status | Clean (`git status --porcelain` empty, Replit Agent-reported) |
| GitHub release | `1db3734b8988940acc6be8b992420a58fc39624a` (connector-verified) |
| Historic 'published checkpoint' from Issue #72 | `cb55335ea8e789d5e0f7912955da7d679d7dbb5f`; not available as a local Replit commit |
| Replit connector last publish | `failed`, deployment id `03378589-2eed-47f9-b501-c54a5bccfa7c` |
| Actual public served source/bundle | **UNKNOWN / NOT_ATTESTED** |
| Physical production database migration ledger | **UNKNOWN / NOT_ATTESTED** |

Replit Agent `git ls-tree HEAD` OIDs and separate working-file hashes agreed for six relevant paths: `App.tsx`, static `artifact.toml`, `.replit`, API `routes/index.ts`, `index.css`, `pnpm-lock.yaml`. This is credible **workspace-head provenance**, not proof of what the public endpoint serves. The public URL `https://aplikacja-turnieje.replit.app/` could not be opened in the read-only web fetch; an independent HEAD attempt failed before HTTP with local DNS resolution error. Neither establishes the response/status of the deployed application.

## 2. Protected functionality and no-overwrite controls

| Protected surface | Observed source boundary / preservation policy | Owner, next gate |
|---|---|---|
| Tournament user flows: organizer, bracket, host, audience, dashboards | Replit `artifacts/tournament-manager/src/App.tsx` blob `91f9bc2155b13abf9d233e59e1cc573ebf590daa` differs from release `298f94ac19dbbdc6df775543e720ec250a1de82a`. Preserve current workspace routes, no whole-file replacement; runtime function **NOT TESTED**. | A120/A40, route-by-route reconciliation and A60 |
| API router / tournament auth | Replit `artifacts/api-server/src/routes/index.ts` `597796cca7bcb4a59f56d9edb5f4a54f8a669cdb` exposes the health/auth/tournaments registrations in inspected workspace; release differs (`7a61b2513d4e24526edbeb947a870d94f2f64a75`). No wholesale backend replacement. | A30/A40, independent auth & API QA |
| Steam catalog writes | Steam router and Steam admin-access module **absent in Replit HEAD**, not independently established for deployed Live. GitHub release has unguarded POST/PUT catalog routes; PR #34 head `fae2eea2f22df3f1b02ad035a7db00bc411ea73f` supplies guard contract 503 unconfigured / 403 invalid. Never copy release write handlers alone or present PR #34 as runtime-ready. | A30/A10, PR #34 QA, server-only key policy and A20/A22 DB gates |
| Replit routing / static host | Replit `artifacts/tournament-manager/.replit-artifact/artifact.toml` blob `c4d8f2bc41e771f796be22506370f979922edd78` contains only global `/* -> /index.html`; release blob `377637a6e88f5db4142dedb5035e854b99f422c1` adds legacy `/dev/animated-effects` rewrites. No invented rewrite to missing artifact. | A120/A140, existing-asset + missing-asset real HTTP contract |
| Portfolio | Replit HEAD does not track `public/portfolio/index.html` or `public/portfolio/projects/index.html`. GitHub release does; there is an accompanying asset directory. Do not cherry-pick HTML without transitive dependencies. Presence/absence on published Live **UNKNOWN**. | A120/A40, bundle closure & direct-load QA |
| Stream / Animated Effects | Replit HEAD does not track `public/stream/animated-effects/index.html`. GitHub release tracks HTML plus its referenced hashed JS/CSS. No single HTML transfer, no fabricated legacy /dev target, no game/OBS overwrite. | A120/A40, complete static bundle and stream routing QA |
| Vite + deployment config | Replit `vite.config.ts` blob `2011f5fa44b68a0569b27a204f393a0205fd1305`, `.replit` blob `1489e8ab835a947e398ab2babbd57f7a32a169d8`; both differ from release. Preserve environment-specific configuration. | A20/A140, isolated startup review |
| Dependencies | `pnpm-lock.yaml` Replit blob `1e9e256937fe8cf7c5e469ae522b11d7c6b458a0` differs from GitHub `97ceb41938b53e8fc98f788ac1aa0c625761a2f2`. No install or lockfile replacement here. | A20/A40, isolated reviewed dependency resolution |
| CSS / Valve Pulp | Replit `index.css` blob `120812ce2afc2d5fbce9d3cfe156e4aa64c02e92` retains dead font `@font-face`; PR #69 removes only that hunk. Full CSS differs; fallbacks must be preserved. | A120, manual hunk adaptation and visual QA |
| SQL/migration history | Release 0030 controlled correction and editor 0030 Steam migration conflict documented by A30. Workspace and **executed** database ledger not verified. A140 does not renumber, apply or adopt any migration. | A20/A22/A30, signed D01-D04 and PG16 gate |
| Minigames / Unity / stream assets | No edits to source, loader, game assets, physics, balance or builds in A140 PR. Absence of edits does not constitute game runtime PASS. | Game owner / A60, separate functional QA |

The prior **140-path divergence** refers to historic checkpoint versus GitHub release as reported in Issue #72. This WAVE5 does **not** pretend to have recovered those 140 exact paths, nor does the 21-path sparse manifest prove current published drift.

## 3. Actual, constrained transfer decisions for A40

1. **SOURCE-ONLY REVIEW**: PR #78 `11e8d5d0bea679515a807f002724926113bdafc1` (HTTP probe); PR #103 `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` (pure routing policy) with stacked test-only PR #120 `e97e9d582e76cc4c4b6ba5bb784c89feb6be50ab`. May enter source-test candidate *only after* A10 registry and independent A60 validation; does not wire Replit routing.
2. **MANUAL, A120-OWNED HUNK CANDIDATE**: PR #69 `1bc087384542b16bb82bc9ab58ec48780fc0e972` removes dead CSS `@font-face`. Adapt ONLY that reviewed hunk against Replit source; do not replace CSS file or change Replit without additional approval and tests.
3. **SECURITY/DB BLOCKED**: PR #34 Steam catalog guard (above) is a prerequisite for any corresponding catalog mutation; do not enable partial unguarded route migrations, dependencies or admin UI. `STEAM_CATALOG_ADMIN_TOKEN` provisioning and actual staged DB/migration acceptance remain outside A140.
4. **BUNDLE CLOSURE BLOCKED**: portfolio and Animated Effects static assets from GitHub require the verified transitive closure, routing adapter/host behavior and A120/A60 QA. No route stubs or isolated HTML file copy.
5. **NO COPY**: existing matching workspace/source blob identities (`portfolio-ui.tsx`, API service TOML) provide no reason for a source transfer; even equality of tracked source OIDs does not certify deployed bytes.
6. **DO NOT TRANSFER**: full `App.tsx`, `vite.config.ts`, `.replit`, API routes index, migration history, `pnpm-lock.yaml` and game-related files without a separately approved conflict-resolution and functional QA plan.

PR #116 source tooling is a review-only, offline parity helper; it is not a release patch.

## 4. Non-destructive checks ACTUALLY performed

- GitHub connector `get_pr_info` and `list_pr_changed_filenames`: PR #116 and A40 C03 #134 file sets have **zero overlapping changed paths**; PR #116 was 5 A140-owned paths before this handoff. C03 PR #134 is stacked on C02 PR #101, itself stacked on C01 PR #60. PR #120 is stacked on #103. Exact heads: C01 `fa3261b2c9510e110ac9eba21726812d3401a525`, C02 `a5bfd07b822c223fd995604dc2e228935ab81498`, C03 `80bb4ca7a9a359fbe76dbab1478a1af16ded0174`.
- GitHub connector `fetch_file` at exact SHAs and JavaScript V8 invariant checks of resulting **real GitHub source and WAVE4 manifest**: **21/21 PASS**, after correcting a test-only classifier that originally misclassified the independently owned test path of C03. No product files were changed.
- Replit read-only Agent: tracked `git ls-tree HEAD` SHA and six workspace-file hash matches; no build, fetch, restart, secret reads, SQL, code edits or publish.
- Provider native publish-state query: `failed` (not a complete external HTTP status determination).
- Attempted GET via browser tool: endpoint inaccessible to tool; attempted Python `urllib` HEAD: failed on local DNS resolution **before any HTTP response**.
- **NOT EXECUTED:** native Node/monorepo tests for current WAVE5 head; runtime E2E; actual deployed-bundle hash; all 140 historic changed paths; PostgreSQL; migration ledger; stream/game/browser regressions; deployment/rollback. Previous A140 8/8 synthetic Node fixtures belong to DEVELOPMENT_FIRST and were not rerun in WAVE5.

## 5. Handoff and next owner

- **A10:** register this WAVE5 HEAD from PR metadata as source-only and resolve candidate dedup/stacking in the canonical registry.
- **A40:** keep C03 `80bb4ca7a9a359fbe76dbab1478a1af16ded0174` as existing integration candidate and apply this preservation matrix. Do not add new PRs to C03 unless A10/A60 qualify them. Live Replit remains a distinct, unidentified deployment source.
- **A60:** independently verify latest PR #116 SHA/source-only diff and candidate PR #78/#103/#120. Native tests needed before integrated QA claims.
- **A120:** own CSS and static-routing functional corrections. **A30:** own Steam mutation authorization and security signoff. **A20/A22:** own SQL/migration/environment.
- **A00:** release/integration/live still `NO-GO` pending approved artifact, staging and runtime evidence.

**Disposition:** `WAVE5_SOURCE_PROTECTION_HANDOFF_COMPLETE / PUBLISHED_PARITY_NOT_ATTESTED / NO_AUTOSYNC / NO_DEPLOY / NO_MERGE / NO_SQL / NO_GAME_CHANGES`.
