# WEB-005 / A120 — WAVE4_HANDOFF — Integration Readiness

**Agent / task:** A120 — Presentation & Bracket Views / DEVELOPMENT FIRST WAVE 4: bracket, standings, audience, stream, responsive, deep-links/refresh, missing static assets.  
**Date:** 2026-10-18, Europe/Warsaw.  
**Status:** **PARTIAL** — source acceptance checks completed, integration/runtime and independent QA gates remain open.  
**Mode:** read-only source verification, no app changes, no new PR, no collision with A40/A140 or database work.  
**Overall:** `SOURCE_9_OF_9_VERIFIED / EXISTING_TEST_SOURCE_4_OF_4_CHECKED_INDEPENDENTLY / NATIVE_4_SKIPS_NOT_ERASED / REACT_BROWSER_HTTP_NOT_TESTED / RELEASE_NO_GO`.

## Exact repo/PR pins

- **Current release base:** `release/tournament-ops-20261013-01@1db3734b8988940acc6be8b992420a58fc39624a` — unchanged.
- **[PR #103](https://github.com/C8LyNn/aplikacja-turnieje/pull/103)** `OPEN DRAFT / UNMERGED`; head **`9fb85b2ca5c137c6107a360bbdb45efec6bf1dde`**, base release. Pure `resolveStaticRoute` classifier is **NOT WIRED into production host**, so no actual live 404 fix is demonstrated.
- **[PR #120](https://github.com/C8LyNn/aplikacja-turnieje/pull/120)** `OPEN DRAFT / UNMERGED`; head **`e97e9d582e76cc4c4b6ba5bb784c89feb6be50ab`**, stacked on PR103 exact head, **two test-only files**. There were **zero submitted GitHub reviews** and **zero associated PR-triggered workflow runs** for this head at Wave4 preflight. No PR120 source files were changed.
- **[PR #47](https://github.com/C8LyNn/aplikacja-turnieje/pull/47)** DE graph head `f09a13623faca8d7ab29b09a2c5b43907c2acd0b`; **[PR #54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54)** RR401/403 handling head `bfa9d075b431185aa8bbf87bf021d64dde8ae22f`. Both open/draft, separate release-derived branches. Their common path `artifacts/tournament-manager/src/components/stage-progress-view.tsx` has **NOT** been integrated.
- **[Issue #70](https://github.com/C8LyNn/aplikacja-turnieje/issues/70)** remains OPEN: actual Replit static 404 vs broad SPA fallback/source-parity blocker. No A120 modification to Replit, A40/C02, A140 preservation, Unity/games or production deployment.

## Source checks actually executed in Wave4

Executed **nine bounded read-only JavaScript assertions against GitHub `fetch_file` source content and immutable release Git tree** of `1db3734...`, with PR47/54 child files read at their own pinned heads. The tool fetched exact source blobs, evaluated predicates, and returned **9 PASS / 0 FAIL**. **These are source-level assertions only, not TAP/native Node, React/browser/UI, or Replit server tests.**

| Check | Exact source contract evaluated | Result |
|---|---|---|
| SOURCE-01 | All 8 asserted Wouter bracket/audience/projector/stream routes and Wouter base declaration in `App.tsx` | **SOURCE PASS** |
| SOURCE-02 | Organizer `?tab=standings` URL, query parser and standings TabsContent in detail | **SOURCE PASS** |
| SOURCE-03 | Audience `?section=standings`/bracket query parser, selection and route registry | **SOURCE PASS** |
| SOURCE-04 | Six referenced portfolio/Animated Effects/Unity public file paths exist in immutable release Git tree; Animated Effects index HTML, JS/CSS and favicon references all exist | **SOURCE PASS** |
| RESP-01 | SE bracket scrollable `overflow-x-auto`, keyboard `tabIndex=0`, champion aria label | **SOURCE PASS** |
| RESP-02 | DE bracket horizontal scroll plus `sm:grid-cols-2` / `lg:grid-cols-3` layout | **SOURCE PASS** |
| RESP-03 | Audience horizontal standings table `min-w-[680px]`, overflow and wrapping nav | **SOURCE PASS** |
| COMPOSITE-01 | PR47 dedicated DE read-only source and PR54 selected-RR cache masking present **in separate child blobs** | **SOURCE PASS** |
| AUTH-SPLIT | PR47 child blob differs from PR54 child blob; no accepted composite was inferred | **SOURCE PASS** |

**Blob provenance:** release `App.tsx@298f94ac19dbbdc6df775543e720ec250a1de82a`; organizer navigation `@cc2cc6cc16592ec39666a13f2245742cef122200`; detail `@55aac4138d4e1c2556f100d58aa5a437dcbb82f6`; audience `@432ffc7623cd510acbb86a9e9a2aca14a25ef196`; SE bracket `@7f1548ce272973ee251591540081caa016d8ef49`; DE bracket `@93954f1f183da5b061d5f3de8c09961f6920eb7d`; Animated Effects index `@5af45933e47ac0bb84de9fb95cc761cc82b804e7`; PR47 child `@fd95b1fa4812e3af14a95c8146410dcb7aae4fa6`; PR54 child `@2c50b5915572ec3721ad709ffd18ec58a597273f`.

**Important test ledger distinction:** Wave3/earlier isolated Node replay observed `12 PASS / 0 FAIL / 4 SKIP` in synthetic HTTP tests. In Wave4 the exact conditions of **four source-skipped cases** were independently checked using GitHub source + tree (**4/4 source PASS**), but **the original Node test suite was NOT rerun here in a real full checkout**. Do NOT replace the TAP record `4 SKIP` with PASS, or assert browser F5, responsive viewports, data authorization or actual live 404.

## Changed files, commands and actual execution

- **CHANGED PATHS:** `docs/web-005/agent-reports/A120/WEB-005_A120_WAVE4_HANDOFF.md` (documentation only). **NO CODE CHANGES / NO NEW PR**.
- **This Wave4 actual execution:** read-only connector `fetch_file`, immutable release tree retrieval and nine explicit JavaScript source predicates; **9/9 PASS**, returned in tool output. Native Node 22 tests, `pnpm test`, `typecheck`, `build`, browser/Playwright, Replit HTTP, PHP/SQL/PG16, API/database regression: **NOT_EXECUTED** this wave.
- **Previously recorded synthetic regression suite:** `node --test scripts/deployment/presentation-route-refresh.integration.test.mjs scripts/deployment/presentation-route-source-contract.test.mjs`, `12 PASS / 0 FAIL / 4 SKIP / exit 0` (Wave2/3 receipts; **not rerun** in Wave4).
- **No demonstrated new failing implementation case:** no speculative patch or duplicate new PR opened. Source contracts present; real failures remain unknown without integrated runtime evidence.

## Known gaps/conflicts and next owner

**P0 Integration/QA:** PR47 DE graph and PR54 RR 401/403 masks touch the same selected-stage component on separate older release bases. A later authorized integrator must preserve both DE Upper/Lower/GF/Reset and local RR authorization denial, then independent A60 accepts **the new composite SHA** and A50/A60 execute actual React/browser scenarios. Existing source pass of both branches does **not** prove composite behavior.

**P0 Static host:** PR103 policy and PR120 tests are unmerged and the classifier is unwired. A40/A140 own actual Replit checkpoint `cb55335...` reconciliation with release and supported live/preview static router; a real missing-font/wasm/js HTTP 404 (non-HTML), 200 asset MIME and SPA deep-link refresh must be observed on authorized preview. No inventing `/dev/animated-effects`, no alteration of game assets.

**P1 Responsive/browser:** viewport 320/360/390/768/1440/1920, horizontal-scroll discoverability, long names, complete DE graph, audience/stream overlays, actual standings selections and password/private GET401/403 need real browser/screenshots/network. A class string is not viewport PASS.

**Next owner:** **A60** run PR120 actual Node source tests on pinned *full* checkout (4 previously skipped, require 0 SKIP) and independent exact-SHA review of PR120+103. **A40/A140** actual trusted preview routing/asset evidence. **A10/A00** carry this bounded source receipt into READY / BLOCKED manifest, reserve future combined PR47/54 QA and release gate; no automatic promotion.

**STOP:** no merge, deploy/Replit overwrite, game source/assets, PG16/Docker/SQL, paid CI rerun, SWARM-006.  
**FINAL:** `A120_WAVE4_PARTIAL / DOCUMENTED_SOURCE_9_PASS / NATIVE_SOURCE_TEST_PENDING / RELEASE_NO_GO`.
