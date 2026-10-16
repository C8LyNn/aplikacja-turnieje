# WEB-005 — R23D / A40 — ISSUE #75 C02 AND ISSUE #70 STATIC ROUTING HANDOFF

**Agent:** A40 — CI Pack Recovery / Source Integration  
**Task source:** [R23D execution dispatch](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R23D_EXECUTION_DISPATCH_20261016.md), verified blob `226b6a89c3fd8348eac814221de1c9715ee6ae25`  
**Assigned issues:** [#75](https://github.com/C8LyNn/aplikacja-turnieje/issues/75) P0 A40/A10, [#70](https://github.com/C8LyNn/aplikacja-turnieje/issues/70) P1 A120/A40.  
**Date:** 2026-10-16 Europe/Warsaw  
**Result:** **`R23D_A40_SOURCE_PREFLIGHT_DONE / C02_BLOCKED_BY_C01 / LIVE_ROUTING_BLOCKED_BY_CHECKPOINT / RELEASE_NO_GO / SWARM006_HOLD`**. No new application commit/PR created: doing so without the stated prerequisites would violate the issue STOP gates.  
**Machine-readable exact-ref summary:** [WEB-005_A40_R23D_ISSUE70_75_PREFLIGHT.json](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A40/WEB-005_A40_R23D_ISSUE70_75_PREFLIGHT.json).

## 1. Issue #75 — real C01 failure and C02 GO/STOP

**Immutable parent:** [C01 draft PR #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) OPEN/DRAFT/unmerged, HEAD `fa3261b2c9510e110ac9eba21726812d3401a525`, historic base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. The release reference for Replit drift is **another** commit, `1db3734b8988940acc6be8b992420a58fc39624a`; do not rebase one onto the other silently.

**Real CI receipt:** [run 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793), C01 exact commit: SE safety 23/23, Pack19–26 domain 220/220, Pack source 72/72, Pack17 source 12/12, fail-closed helper 24/24, CI ephemeral PG16 atomic 8/8, workspace typecheck PASS; **API integration exited 1**. Later frontend test/build gates were NOT_EXECUTED. This is **full CI FAILURE**, not composite-ready signoff.

**A60 independent R23D root-cause gate:** [Issue #73 first-failure triage](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R23D_ISSUE73_C01_FIRST_FAILURE_TRIAGE.md), exact Git blob `534baf62abaf251b07bd3c359366979bb7aafd92`, verdict **`C01_API_ROOT_CAUSE_NOT_CONFIRMED`**. Decoded log does **not** expose the first failing integration assertion, a complete API integration TAP or named failing file/stack. A60's own [R23D HQ handoff](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R23D_A00_HQ_QA_HANDOFF.md), blob `91a992c0369005f29a6e399f94cf530bcf06fcd6`, explicitly says **do not start C02 composition assuming C01 is fixed**. The Issue #73 thread contained **zero** owner/A50 test-repro/acceptance comments during this review. **C02_SOURCE_GO=BLOCKED**, not `QA_READY`.

### Exact latest candidate heads read from GitHub

| Candidate | Exact current HEAD on review | Relative Git base | Changed-file envelope | Independent QA constraint |
|---|---|---|---|---|
| [PR61 Swiss caller](https://github.com/C8LyNn/aplikacja-turnieje/pull/61) | `8c26778c94cd6c96987f3986b651066024f10d4a` | PR57 `a57fe31c1bc123c5217b3f58bcdd34750c64c5c6` | **1 new test** | A60 source conditional; PG16 test `resetTestSchema`/`dropTestSchema` requires separately certified isolated test DB; NEVER invoke manually now |
| [PR63 CAS client](https://github.com/C8LyNn/aplikacja-turnieje/pull/63) | **`a4119b29a78b72d400947d8dd5bd100c59d6444e`** | historic release `1fdc401d...` | **6 frontend files**; four changed since earlier QA head | **NEW SHA** supersedes old A60 PR63 review on `3ddcfea2...`; exact-SHA re-QA mandatory; CAS remains unmounted/off |
| [PR64 action-local](https://github.com/C8LyNn/aplikacja-turnieje/pull/64) | `7837e412626e88761c70f1a2ceeb822d7ed101e1` | historic release | **3 files** including report | A60 source conditional; pure only; real validator/adapter interoperability NOT_EXECUTED |
| [PR66 preclone](https://github.com/C8LyNn/aplikacja-turnieje/pull/66) | `7490c974b7c84404559fd590bd09817a71c2134f` | **C01 exact commit**, not release | **2 new files** | A60 source conditional; uses stubbed ports, cannot grant authenticated import; full CI has same API integration exit 1 |
| [PR67 ingress security](https://github.com/C8LyNn/aplikacja-turnieje/pull/67) | `880824f18b8913602955578dfd76eeac7976e32a` | historic release | **4 test/documentation files** | A60 design conditional; fail-first security suite intentionally expects **RED**, PG16 tests default SKIP, importer not implemented |

All candidate PRs verified OPEN/DRAFT/UNMERGED. Their direct changed-file lists contain **16 distinct paths** and no exact path collision with the 14 C01 changed paths from [A40 C01 14-blob manifest](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A40/WEB-005_A40_R23C_COMPOSITE_B1_MANIFEST.json). This is **preliminary path-only audit**, **not** A10 final R23D inclusion approval, not API compatibility proof, not 16 accepted files, not a new composite. Historic A10 R23C DAG still has **15 unresolved overlap pairs** in other source packets; no hunk may be declared resolved by adjacency.

**Critical ancestry:** PR61 adds only a Swiss test atop PR57 already included in C01. PR66 adds only two files atop C01 itself. Any later C02 composer must copy **only direct per-PR deltas**, not reapply their parent commits or replace the C01 source tree. PR63 and PR67 are NOT ready for enablement / green run just because they have non-overlapping paths. PR64+PR66 pure files do not by themselves prove signed issuer, clone, rollback, or HTTP integration.

**Stop decision:** no C02 branch, no DRAFT C02 PR, no `COMPOSITE_C02_SHA`, and no C02 process exit/TAP were produced. **`C02_SHA = null / C02_DRAFT_PR = null / QA_NOT_EXECUTED`** is deliberate fail-closed compliance. Next owner action: A50 locate/publish first integration failure at exact C01 SHA with real native TAP/exit and authorized PG16 if needed; A60 independently verify classification or fix; A10 freeze final exact-SHA inclusion/exclusion/collision DAG including the changed PR63; then A00 issue explicit C02 source GO. No paid CI rerun/forced skip from A40.

## 2. Issue #70 — static 404, portfolio, Animated Effects, PR69 font

**Owner/source distinction:** GitHub **release** `1db3734b8988940acc6be8b992420a58fc39624a`, separate **local-only Replit published checkpoint** `cb55335ea8e789d5e0f7912955da7d679d7dbb5f`, current *Replit agent-read workspace* on branch `feat/double-elimination-full-integration` at **`5e68f0f4b7d73cb5ff6aad0065dbe54c5f691776`**. The Replit agent reported a clean current workspace but could **not resolve the published checkpoint as a local Git object**, so a true `checkpoint↔release` diff and safe hunk transfer **could not be performed**. Its current workspace is NOT proof of what was published. Dispatch states **140 path differences**: 90 local-only, 50 differing blobs; no assumption that all represent faults.

**Replit status observed through connected Replit app:** `get_publish_status` returned `found=true, status=failed`, published URL `https://aplikacja-turnieje.replit.app`. Attempts to open live routes for missing font, missing wasm, portfolio and Animated Effects were **NOT retrievable**, so no actual `HTTP status / Content-Type` receipt is available; distinguish dispatch's previously documented HTML-200 symptom from newly reproduced data. A *read-only* Replit Agent question confirmed current `artifact.toml` has production static `/* -> /index.html` with **no explicit asset exception**, and no current local public portfolio or animated-effects files in its own checkout. This is **agent-reported current local state**, not byte-verified source at checkpoint.

**GitHub release byte-verified facts:**
- `artifacts/tournament-manager/.replit-artifact/artifact.toml`, blob `377637a6e88f5db4142dedb5035e854b99f422c1`: `serve="static"`, `/* -> /index.html` wildcard and two historical **`/dev/animated-effects -> /dev/animated-effects/index.html`** rewrites. This is **config only**, not independently proven HTTP routing.
- `artifacts/tournament-manager/vite.config.ts`, blob `4c833bf13a03b28174f9202dc0498f1f5d25d3ea`: **development-only middleware** maps `/portfolio` to `/portfolio/index.html` and `/stream/animated-effects` to `/stream/animated-effects/index.html`. Dev middleware is not automatically a production static rewrite.
- `artifacts/tournament-manager/public/fonts/` has only README (blob `bbe4e7bdbb07bcb9028102e9d392f71df0b2f6d9`); no `valvepulp-bold.ttf` committed in the release directory.
- `artifacts/tournament-manager/public/portfolio/index.html` exists, blob `197bd447df2449947fda3203ab76e7a63e58a48f`, and `portfolio/projects/index.html` exists, blob `98a74d8ab002d9ac34d01c042715ca3d6db4f7f4`.
- **Real Animated Effects release artifact** exists at `artifacts/tournament-manager/public/stream/animated-effects/index.html`, blob `5af45933e47ac0bb84de9fb95cc761cc82b804e7`; build staging script blob `9ebf7d2f95a8ff000c95e48ab9b3c75b0c240070` copies generated app into **`/stream/animated-effects`** and removes legacy `/dev/animated-effects` directory. Therefore release's old `/dev/animated-effects` rewrite targets a path not produced by current staging. **Do not fabricate `/dev/animated-effects/index.html` to satisfy this; use real artifact and separately verified authorized redirect/rewrite after local Replit reconciliation.**
- [**PR #69 font hunk**](https://github.com/C8LyNn/aplikacja-turnieje/pull/69) remains OPEN/DRAFT/unmerged, HEAD `1bc087384542b16bb82bc9ab58ec48780fc0e972`, base `1db3734b8988940acc6be8b992420a58fc39624a`. Exactly **one** non-game path `artifacts/tournament-manager/src/index.css`: old blob `8e347f9a1aa70e3e4cb8f5adc94faca6ad9bbaa8` → new blob `c1699af3d05b63edd85f6a2a3d7e006036c56f07`. Only 8 lines of obsolete `@font-face` deleted; existing `--app-font-deadlock-display: 'Valve Pulp Bold', 'Georgia', 'Times New Roman', serif` declarations intact, no asset or game edits. [A60 independent PR69 QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R23D_PR69_FONT_INDEPENDENT_QA.md), blob `04e9d84b2ee269e1613f514194cca1edba282237`, **PASS WITH CONDITIONS — NARROW CSS SOURCE ONLY**. Automatic PR69 CI run `38823508396` FAILED inherited Pack19 before new CSS/build/browser steps, so PR69 is NOT full native/liveness PASS. Do not duplicate/replace PR69.

### Route acceptance matrix (expected, NOT actual HTTP execution)

| Request / scope | Required response / preservation | R23D A40 evidence |
|---|---|---|
| missing `/fonts/valvepulp-bold.ttf` | **404** and not `text/html` | Font absent GitHub; live status/content type **NOT_EXECUTED** |
| missing `/*.wasm` | **404** and not `text/html` | Live status/content type **NOT_EXECUTED** |
| missing `/*.js` | **404** and not `text/html` | Live status/content type **NOT_EXECUTED** |
| `/portfolio/`, `/portfolio/projects/` | **200 HTML** (real index files, valid refresh) | GitHub source exists, current Replit checkout reportedly absent, **LIVE_NOT_VERIFIED** |
| `/stream/animated-effects/` | **200 HTML + real JS/CSS assets** if build staged | GitHub artifact exists, current Replit checkout reportedly absent, **LIVE_NOT_VERIFIED** |
| `/dev/animated-effects` | Redirect or verified rewrite ONLY to real authorized artifact, otherwise honest 404 | Existing release mapping points at legacy path now removed by build script; **LIVE_NOT_VERIFIED** |
| tournament SPA deep links / OBS / stream | Existing recognized navigation and refresh retained, no API response masking | Browser/HTTP **NOT_EXECUTED** |
| real minigame HTML/wasm/js, portfolio assets | **Byte-identical content and correct status/MIME** | No game file changed; live/browser **NOT_EXECUTED** |

**Why no new static-routing app PR today:** the **mandatory published Replit checkpoint comparison is not possible with presently readable local Git objects**, and we have no verified hosting rewrite syntax for safely returning 404 on selected missing static extensions while preserving routes. Guessing a `!*.ttf`-style negation, rewriting production `artifact.toml` from a divergent GitHub source tree, or copying its public assets to Replit would risk live portfolio/game loss. There was **no new A40 code, static asset, frontend, .replit, HTML, loader, game, build or stylesheet change**. A120 and A00 should obtain an immutable preservation manifest/source snapshot of the actual deployed Replit checkpoint, validate routing mechanism in a disposable preview and create a new test-first isolated routing DRAFT PR. Then A60 reviews exact SHA and the full route/status/MIME/browser matrix. Only after that can PR69's proven **single CSS hunk** be ported into preserved source under separate owner GO. No live publication or overwrite is authorized.

## 3. Evidence accounting and rollback

| Evidence type | Actual outcome |
|---|---|
| GitHub dispatch / issue / PR / exact file readback | **Executed** (connected GitHub, source/provenance inspection) |
| Replit read-only metadata / agent source inquiry | **Executed**; current workspace differs from published checkpoint; no file changes |
| Replit live HTTP status, Content-Type or screenshot | **NOT_EXECUTED** — URL inaccessible to requested remote check |
| New A40 native app tests / pnpm / full C02 checkout | **NOT_EXECUTED**; no new process exit code |
| C01 native automatic GitHub Actions (historic evidence) | **FAIL** Pack17 API integration child exit **1** |
| PR69 native automatic GitHub Actions (historic evidence) | **FAIL** inherited Pack19, feature stages skipped |
| New R23D application code commit / DRAFT PR by A40 | **NONE**, exact SHA **N/A** |
| New DB/reset/DDL / protected merge / deployment / games | **NONE** |
| Rollback | **NOT_APPLICABLE** — no app branch, live environment or PR altered |

**A00 handoff and STOP:** [#75](https://github.com/C8LyNn/aplikacja-turnieje/issues/75) `C02_BLOCKED_C01_FIRST_FAILURE`; [#70](https://github.com/C8LyNn/aplikacja-turnieje/issues/70) `ROUTING_LIVE_CHECKPOINT_BLOCKED`; PR69 `SOURCE_PASS_WITH_CONDITIONS`; **`RELEASE_NO_GO / SWARM006_HOLD`**. Next tangible owner action is to provide A50 controlled exact-C01 PG16/API execution and an actual published Replit checkpoint/preservation manifest to A120. Do not allocate C02 SHA or mark HTTP 404 as verified without the required evidence.
