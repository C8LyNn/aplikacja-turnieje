# WEB-005 — A10 → A00 / R23D ISSUE #75 & #77 CLOSEOUT

**Task:** `WEB-005-R23D-A10-ISSUES-75-77` · **Date:** 2026-10-16 · Docs only, append-only. **Outcome:** `A10_SOURCE_REGISTRY_PUBLISHED / C02_DEPENDENCY_BLOCKED / A60_R23D_INDEPENDENT_QA_PENDING / RELEASE_NO_GO / SWARM006_HOLD`.

## Published deliverables

1. [R23D full source registry Markdown](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23D_APPEND_ONLY_REGISTRY.md) — docs commit `5bd0a25f322c4c4b2158e1b56a3238ea750826bd`.
2. [R23D machine-readable registry JSON](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23D_REGISTRY.json) — docs commit `236f0c7be0e1b7c76f94dbc4876ab2eb622fd077`.
3. [R23D QA + SWARM-004M intake matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23D_QA_MATRIX.json) — docs commit `1ade3b29038b7d2707101feb1309745179172d5e`.
4. [Issue75 C02 eligibility and Replit preservation gates](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23D_C02_ELIGIBILITY_AND_DRIFT.md) — docs commit `a5ef407377269d61900f634cfc4c3da801440b4c`.

## Actual readback and QA boundary

- Historic P01–P30 preserved, including original SHA; current live PR identities checked. New P31 = PR69 `1bc087384542b16bb82bc9ab58ec48780fc0e972`, one CSS file; exact blob SHA1 `c1699af3d05b63edd85f6a2a3d7e006036c56f07`, UTF8 SHA256 `04f2a64f5225cb94f2e0089becad02a6b84f786235844682635cb24547b3b26b`. Static scope one CSS removal, game paths untouched. A60/browser not executed; PR69 automatic CI 38823508396 failed inherited Pack19.
- P27 existing PR63 revised: original `3ddcfea2ba47f4314fced3022d00922f8cedb0e3` → intermediate `5469dde23931cad8b87316831328fbb8ded13dbb` → pinned R23D `a4119b29a78b72d400947d8dd5bd100c59d6444e`. Four existing frontend files changed, two others unchanged; six exact blob+SHA256 records in registry. **35 tests authored, full native NOT_EXECUTED**. Last CI run 38876069415 FAILURE, target CAS suite not proven. New GET401/403 `authorization-blocked` logic preserves internal draft but redacts view and prevents save until successful same-scope GET. A60 independent new SHA QA pending; older security clearing expectation vs Issue74 preservation intent requires A00/A110/A60 explicit accept/reject.
- **31 source packets / 110 unique changed paths / 15 original exact PR collision pairs remain UNRESOLVED / 0 new overlaps**. No C02 integrated SHA.
- C01 PR60 `fa3261b2c9510e110ac9eba21726812d3401a525`: real CI scoped green source/domain/helper/typecheck/ephemeral PG16 atomic, but API integration EXIT1, overall workflow FAILURE. [Issue #73](https://github.com/C8LyNn/aplikacja-turnieje/issues/73) root cause not published yet, #75 blocks C02. A50/A60 must provide first-failure evidence before integration.
- Source groups P28/P29 are **conditional proposals only**, no A40 C02 authorization. P26 requires separate safe PG16, P27 requires A60 source/privacy decision, P30 fail-first contract is expected red/skip, P31's release ancestry differs from C01 and contains game assets if transplanted whole.

## Replit/live and owner decisions

- Dispatch GitHub release `1db3734b8988940acc6be8b992420a58fc39624a` versus local Replit checkpoint `cb55335ea8e789d5e0f7912955da7d679d7dbb5f` has claimed 140 differing paths (90 local-only + 50 changed). A10 verified the aggregate claim as documentation but **did not retrieve/check individual Replit blobs**. A20/A30 Issue72 preservation manifest must precede any deployment. No code sync or game tree transplant.
- A60 Issue77 should independently QA PR69 and PR63 exact new SHAs and any future C02, and compare app shell/portfolio/OBS and game asset non-regression using real runtime evidence. No A10 native or browser execution.
- A00 owns owner-gated D01–D04, Backup producer authenticity, Basket CAS server, logged privacy policy and the original 38-case WEB004 matrix (29 derived IDs, nine originals missing, zero signed per-case dispositions). SWARM-004M intake format is prepared but no independently verifiable new findings are ingested.

## Exact next action for A00

1. Assign #73 root cause and reproduce exact C01 failing TAP/stack, reject blanket skip.
2. Ask A60 for bounded review of PR69 source, revised PR63 auth-blocked behavior on new SHA (and owner policy), and future C02.
3. Ask A40 to prepare C02 only after #73 and exact A00 source allowlist; apply a separate Replit preservation plan; do not import newer game's release branch into C01.
4. Issue separate owner decisions for migration/PG16, Backup/CAS security and future EXEC-B test debt. The current source document does **not** grant `FINAL_HANDOFF_GO`.

**STOP:** no code/game edits, protected merge/rebase, SQL/PG16 reset, manual paid CI rerun, Replit live deployment or SWARM-006 activation by A10.
