# WEB-005 — R23D / A00 execution dispatch (2026-10-16)

**Status:** `DISPATCHED_TO_GITHUB_QUEUE / AGENT_EXECUTION_UNCONFIRMED / SWARM006_HOLD / RELEASE_NO_GO`

## Owner directive

Continue R23C integration while addressing only **confirmed surrounding-app defects** from the 2026-10-15 Replit live publication. The entire game domain is frozen: no game code, balance, Unity WebGL binaries, HTML game content, canvases, or loaders. Findings from SWARM-004M are later incremental inputs, not a reason to block currently known narrow fixes.

### Evidence baseline

- GitHub release: `1db3734b8988940acc6be8b992420a58fc39624a`
- Replit local published checkpoint: `cb55335ea8e789d5e0f7912955da7d679d7dbb5f` (local-only; not GitHub)
- Replit-vs-release source drift: 140 differing paths, of which 90 local-only and 50 different blobs. Not all represent defects or Oct 15 changes.
- Composite C01: PR #60 @ `fa3261b2c9510e110ac9eba21726812d3401a525`, API integration failed exit 1 in workflow run `38736073793`; previous green suites remain scoped.
- Narrow font source correction: DRAFT PR #69 @ `1bc087384542b16bb82bc9ab58ec48780fc0e972`. Not deployed, QA pending.

## Active task queue (GitHub issues)

| Priority | Agent(s) | Issue | Objective |
|---|---|---|---|
| P0 | A30+A20 | [#72](https://github.com/C8LyNn/aplikacja-turnieje/issues/72) | Preserve live Steam auth/catalog/DB behavior and reconcile migration 0032–0040 |
| P0 | A50+A60 | [#73](https://github.com/C8LyNn/aplikacja-turnieje/issues/73) | Root cause C01 API integration exit 1 |
| P0 | A40+A10 | [#75](https://github.com/C8LyNn/aplikacja-turnieje/issues/75) | C02 disposable integration after first-failure triage |
| P0 | A00+A20+A30+A90 | [#76](https://github.com/C8LyNn/aplikacja-turnieje/issues/76) | D01–D04, Backup trust and CAS backend decisions |
| P1 | A120+A40 | [#70](https://github.com/C8LyNn/aplikacja-turnieje/issues/70) | Missing asset HTTP 200, portfolio/Animated Effects routes, PR #69 font QA |
| P1 | A50 | [#71](https://github.com/C8LyNn/aplikacja-turnieje/issues/71) | Transient /api/healthz 503 diagnostics |
| P1 | A110 | [#74](https://github.com/C8LyNn/aplikacja-turnieje/issues/74) | Preserve Basket CAS draft after GET 401/403 |
| CRITICAL QA | A60+A10 | [#77](https://github.com/C8LyNn/aplikacja-turnieje/issues/77) | Exact-SHA independent QA, append-only registry, SWARM-004M intake |

## Execution graph

1. Start in parallel: #70, #71, #72, #73, #74; A00/HQ decision packet #76.
2. After #73 first-failure triage and source QA of candidate packs, begin #75 C02 integration. Never assume issue creation itself runs an agent.
3. A60 independent QA for each new exact SHA; A10 register all results and unresolved blockers in #77.
4. A00 closeout: decide further implementation, owner gates, SWARM-006 eligibility. Do not convert incomplete native PG16/browser/security evidence into PASS.

## Non-negotiable restrictions

- **No game changes.** No edits under `public/prototypes/minigames/` or game engine/source logic.
- **No direct production changes or republish.** Replit live and GitHub release differ. Every proposed source change must be reconciled with Replit before any separately approved deploy.
- **No protected merge, force push, database DDL/reset, new migration allocation, secrets in logs or paid CI** without explicit authorization.
- Do not silently bypass failing tests or overwrite the current Replit workspace with the GitHub release.
- Publish evidence: source SHA, Git blob SHA where applicable, changed files, commands/exit codes, status `NOT_EXECUTED` for unavailable tests, precise blockers and rollback.
