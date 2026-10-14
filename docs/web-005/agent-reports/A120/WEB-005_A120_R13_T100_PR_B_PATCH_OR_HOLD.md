# WEB-005 — Agent A120 — R13 / T100 PR-B F058 (PATCH_PROPOSED)

**Agent:** A120 — Presentation & Bracket Views  
**Task:** `WEB-005-T100-A120-PR-B-R13` | **Priority:** P2/P1 stale presentation  
**Wave:** R13.1, 2026-10-14 (Europe/Warsaw)  
**Authority:** `WEB-005_WAVE_R13_AGENT_PROMPTS.md` (blob `ec765236516cb63c1dd62e0e9257943ad9c9cc71`), §§0–2 + AGENT A120  
**Mode:** CONDITIONAL GO CODE-ONLY L3, **source gap confirmed**; test-first, isolated draft; absolutely no merge/deploy.

**Author classification:** `PATCH_PROPOSED / SOURCE_CONFIRMED GAP / STATIC CHECK 10 OF 10 / RUNTIME NOT_EXECUTED / INDEPENDENT A60 QA PENDING / RELEASE NO-GO`.

## 1. Repository / exact GitHub pins

- Repository `C8LyNn/aplikacja-turnieje`.
- Source release baseline `release/tournament-ops-20261013-01` = `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.
- Branch `fix/web-005/t100-rr-readback-r13`; **DRAFT PR #54**: https://github.com/C8LyNn/aplikacja-turnieje/pull/54 .
- **Head SHA:** `dbba0eb82920b4f324866b1b983e1211459f52ec`, 5 commits ahead of release; OPEN DRAFT and UNMERGED at check.
- Changed **exactly two paths**, both within A120 R13 file ownership:
  - `artifacts/tournament-manager/src/pages/tournament-detail.tsx`, blob `7d03d3ea7a14883fd7d6b0010eebd14c1f11d00d` (RR readback observer and local denied-data presentation, no routes/backups/CSV edits).
  - `artifacts/tournament-manager/src/pages/tournament-detail.rr-readback.test.tsx`, blob `21eaad81248eb26c9430dfcd77ccb261ca11f191` (new deterministic React Query test source).
- Existing PR47 source `stage-progress-view.tsx` is **not** modified or cherry-picked into PR54.
- Existing PR47 https://github.com/C8LyNn/aplikacja-turnieje/pull/47 remains OPEN DRAFT HEAD `f09a13623faca8d7ab29b09a2c5b43907c2acd0b`.
- PR43 CSV `96a6068f69027574ac76e18d4d5a2c444b5a914a` and PR50 Backup preview `5457a74187edc263730c3a4b25a663bdf5531ee9` both change **the same `tournament-detail.tsx` path** on independent unmerged branches. **FILE-LEVEL INTEGRATION COLLISION registered**, no attempt to merge or decide hunk resolution.
- PR45 RR terminal roster `a7a87bc019731191dbfa44bee6939e3fa25e27f4`, PR39 MP1 `16053ee132756ca05b6f2cd1f0cabae823905387`, PR42 MP2A `1ae0ccb801f4177052bff1ec7041e55b8c992c8b`: independent OPEN DRAFT backend dependencies; none modified here.

## 2. SOURCE_CONFIRMED gap / conservative patch rationale

At release and PR47 source: `pages/tournament-detail.tsx` uses canonical `useListMatches(id)` and `useListTournamentStages(id)` with `refetchInterval:5000`. However `components/stage-progress-view.tsx` independently calls `useGetTournamentStage(tournamentId,selectedStageId)` **without** polling. `ParticipantTable` gets `detailQuery.data.participants` (`finalRank`, `status`, `stageSeed`), while stage-list status and match results already update. The existing local write helper `invalidateTournamentDependentQueries` invalidates stage queries, but a write made by an external host/second browser does **not** trigger that local mutation callback.

**Expected:** when fresh canonical list/matches reflects a changed RR match/result/stage status, the selected RR stage's cached details must be re-requested from `GET /api/tournaments/:id/stages/:stageId`; its backend-authoritative participant ranks/status replace prior cached rows. `GET /api/tournaments/:id/standings` is separately invalidated to refresh the tournament-wide classification tab. No new sport-rule, group, qualifications or client ranking logic.

**Actual patch:** exported page-local `RoundRobinReadbackBridge` observes the parent `stages` and `matches` reference snapshots, retaining fingerprints per RR stage of `stage.status/winnerId/currentRound/totalRounds` and `match.id/revision/status/scores/winnerId/resultType`. Only a changed fingerprint for a *previously observed same tournament stage* invalidates the exact canonical stage-details React Query key. An RR change also invalidates the already-existing tournament standings key. This bridges external writes; unchanged parent polling causes zero redundant invalidations. SE/DE stage fingerprints are excluded.

The bridge now encloses the organizer Tabs, **not merely the bracket panel**. This is required because the RR standings tab can be open when another browser changes results. No existing page-level operation, score mutation, auth helper, CSV reader, Backup preview, or sport rule is changed.

**Stale/out-of-order:** late old GET must not win after a newer React Query refetch generation; test source covers this, but actual cancellation behavior and HTTP time-of-check semantics require runtime QA. Cross-endpoint snapshots are *not atomic*. No freshness SLA or server version ordering guarantee is invented. A cached rank may remain visible during an ordinary pending/failed network read; it should not be marketed as freshly confirmed without successful GET.

## 3. Privacy / 401–403 presentation guard and boundary

The same scoped bridge examines the exact cached RR stage-detail queries for errors with HTTP `401`/`403` (direct `status` or `response.status`). It synchronously blocks the previously cached Tabs on an existing denial (prevents first-paint flash), subscribes to React Query cache changes to hide prior fetched data when later denied, and displays a retry button. Only a successful canonical stage read releases the denial. This is **local fail-closed presentation on this organizer page**, not global session/cache eviction.

**Explicit boundary:** A100 owns universal logout/session revocation, query-cache cross-tournament purge and auth token policy. This PR does NOT edit `src/context/auth-context.tsx`, `hooks/use-tournament-auth.ts`, `lib/tournament-query-invalidation.ts` or any API auth semantics; A60 must verify no stale private content survives in relevant routes. A100 must own any further global security repair; A120 must not silently implement it.

## 4. Test-first source changes, deterministic fixtures and expected result

The new React tests were committed **before** the production patch in commit `7ff81355ec42e8f1255796e3477fc02147163bac`, and extended in separate `af398fcd71615269174dfdb941ec08fad4d9dfd9`. Source patch commits `3da338a59f2dd140e52b38b180576003b5dfd1c3`, `6160587200b5100dfab914768eb9e8ed1a8c5bd3`, `dbba0eb82920b4f324866b1b983e1211459f52ec`.

| Fixture | Controlled input / chronology | Expected assertion |
|---|---|---|
| `F058-R13-01` | cached RR v1 → externally updated match revision 2 → canonical details v2; unchanged rerender; revision 3 / stage active → v3 | v2/v3 derived from GET only; no poll storm |
| `F058-R13-02` | details N old promise deferred; change revision N+1 triggers new read; old N resolves late | newer v3 persists; no old overwrite (must be verified runtime) |
| `F058-R13-03` × 2 | existing authorized v1 cache; canonical detail refetch returns 401 then 403, retry 200 | cached rows unmounted on denied read, explicit retry restores only valid v2 |
| `F058-R13-04` | DE match updates without an RR stage | no RR invalidation |
| `F058-R13-05` | terminal RR completed → active, match same revision | canonical stage detail refetched from stage lifecycle fingerprint |
| `F058-R13-06` | rejected 409 external Undo/Revert, canonical stages/matches unchanged | no synthetic v2 or invalidation |

**F054 winnerId champion behavior (already in PR32/47): retention test only.** No reimplementation.

**A120 test execution:** `NOT_EXECUTED`. A120 has no verified checkout of full repository + frozen workspace dependencies to run the actual frontend. Existing workflow for PR54 was `IN_PROGRESS` when first checked; evaluate exact final workflow separately. Never declare CI green on Pack19-blocked pipelines. No PostgreSQL, shared DB, API integration, browser or paid CI rerun executed by A120.

**A50 focused execution (proposed, NOT_EXECUTED by A120):** on exact PR54 SHA and approved Node22/pnpm10 locked workspace:

```bash
git rev-parse HEAD
node --version
pnpm --version
TSX_TSCONFIG_PATH="$PWD/artifacts/tournament-manager/test/tsconfig.json" \
  pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test src/pages/tournament-detail.rr-readback.test.tsx
pnpm --filter @workspace/tournament-manager test
pnpm --filter @workspace/tournament-manager typecheck
pnpm --filter @workspace/tournament-manager build
```

**Note:** the focused command should be executed from the `artifacts/tournament-manager` package root, or adjust `PWD` and the import path; the standard `pnpm --filter @workspace/tournament-manager test` is the unambiguous supported command in repo package script. Capture exact working directory, CLI, SHA, Node/pnpm, stdout/stderr, exit code, failures and screenshots. Frontend-only mocked tests need no PostgreSQL instance. A50 may find test fixture issues and return focused revisions to A120 within explicit A00 scope, not grant automatic PASS.

## 5. Exact source-only QA and outstanding independent checks

**Author static invariants verified 10/10** on HEAD `dbba0eb82920b4f324866b1b983e1211459f52ec`: RR-only scope, exact stage detail key, snapshot revision, tournament standings invalidation, unchanged fingerprint skip, forbidden read suppression, existing denial first-paint check, retry path, wrapper across tabs and fixture IDs. **This is STATIC_SOURCE only, not typecheck/RTL/build/QA acceptance.**

A60 independently must review: correctness under out-of-order GET, TanStack invalidation during pending request, no loops with structural-sharing/polling, tab-independent RR freshness, stage-only reopen, forbidden cached query and first-paint denial, recovery after token update, no accidental SE/DE mutation, whether an RR-related 500 should hide or explicitly mark stale information, whether cache needs new A100 global security action. The safety of A50 evidence and authorization for any follow-up patch is an A00 decision.

**Potential material limitation:** all polling endpoints are independently refreshed; without server atomic epoch the bridge can *only* guarantee a later canonical refetch attempt upon observed change, not that all endpoints describe the same instant. A 401/403 on **another** query route (outside exact RR stage detail) belongs to A100 shared cache security. Real private data leak is not asserted without runtime evidence.

## 6. Dependencies, conflicts and GO/STOP

| Owner | Required gate / external work | Current position |
|---|---|---|
| **A50** | Run real frontend tests/typecheck/build on exact PR54 SHA, record exit codes | `NOT_EXECUTED` by A120; A50 QA requested |
| **A60** | Independent exact SHA source review of PR54, PR47 and runtime logs | `SOURCE_ACCEPTED UNVERIFIED`; no automatic PASS |
| **A100 / R13 L1** | Global private cache, logout/revocation and cross-route ownership | Separate lane; no auth-helper edits by A120 |
| **A70/A80 PR39/42/45** | Legal Undo and terminal RR roster, stage readback and rejection semantics | Independent draft backend candidates; PG16 gate pending |
| **A110 PR50 / PR43** | Same `tournament-detail.tsx` path (Backup preview, CSV) | **KNOWN INTEGRATION COLLISION**. No cherry-pick, merge or rebase attempted |
| **A00/HQ** | QA sequencing, decision on hunk conflicts and cross-agent policy | Necessary before any integration; R13 author task does not grant release rights |

**GO consumed:** isolated source-only test-first frontend patch + draft PR; agent documentation.  
**STOP enforced:** no merge to release/main, no integrations of PR43/47/50, no auth/context helper or stage-panel edits, no backend/SQL/sport rules, no paid CI rerun, no production, no SWARM-006.  
**Safe branch rollback:** delete/revert PR54-specific commits **only under new owner authorization**; leave PR43/47/50 and release unchanged. No rollout performed, so no deployed rollback is necessary.

**R13 A120 recommendation:** `PATCH_PROPOSED, QA_HOLD`. A50 runs actual Node React/typecheck/build; A60 inspects exact SHA; A00 schedules any changes on an explicitly assigned lane after evidenced failures. SWARM-006 FINAL HANDOFF DEFERRED.
