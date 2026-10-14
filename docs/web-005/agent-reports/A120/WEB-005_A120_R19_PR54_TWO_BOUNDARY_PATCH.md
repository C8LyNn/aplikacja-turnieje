# WEB-005 / A120 — R19 PR54 two-boundary RR401/403 patch

**Agent:** A120 — Presentation & Bracket Views  
**Task:** `WEB-005-T100-A120-R19` · **Date:** 2026-10-14 Europe/Warsaw  
**Authority:** central `WEB-005_WAVE_R19_AGENT_PROMPTS.md`, blob `076b14ca7ea953c818309502cce322c7dd6a7bef`, §§0–2 and AGENT A120. Code L1 **existing PR54 only**, exclusive scope parent and selected-stage child; no new PR/cherry-pick/merge.  
**Author status:** `PATCH_REVISED_SOURCE_ONLY / STATIC_AUTHOR_CHECKS_12_12 / INDEPENDENT_A60_NEW_HEAD_PENDING / RUNTIME_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD`.

## 1. GitHub pins / provenance

- Repo `C8LyNn/aplikacja-turnieje`; release base unchanged: `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.
- [PR54 P21](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) **OPEN DRAFT / UNMERGED**, branch `fix/web-005/t100-rr-readback-r13`. **OLD R18 HEAD** `9866e5d2e73c99e01c2934a38ca1c62455efd2ed` → **NEW R19 HEAD** **`bfa9d075b431185aa8bbf87bf021d64dde8ae22f`**. Eleven total commits ahead of release, exactly FOUR paths in PR54, all A120 R19-owned. Neither release nor other PRs modified.
- [PR47 P14](https://github.com/C8LyNn/aplikacja-turnieje/pull/47) independently remains HEAD `f09a13623faca8d7ab29b09a2c5b43907c2acd0b` on release base. It changes the SAME `stage-progress-view.tsx` with dedicated DE graph; **PR47 was NOT cherry-picked**. Semantic/path collision awaits separately authorized SWARM-006 integration.
- PR43 CSV HEAD `96a6068f69027574ac76e18d4d5a2c444b5a914a`, PR50 Backup HEAD `5457a74187edc263730c3a4b25a663bdf5531ee9` modify the same parent `tournament-detail.tsx`; path overlap ≠ proven same-hunk conflict.
- PR53 private-cache A100 HEAD preflight `8710f7fe5946d7f62e366303a97722d4201fc96b`; A120 made no auth/cache-helper changes.

**Exact file blobs before → after (all under `artifacts/tournament-manager/src/`):**

| File | Old blob → NEW blob | Purpose |
|---|---|---|
| `pages/tournament-detail.tsx` | `7d03d3ea7a14883fd7d6b0010eebd14c1f11d00d` → **`a3565b6638f9def4ee9aebb0126444c15a613338`** | Removes historical RR401/403 entire-Tabs guard; preserves canonical RR-stage and standings invalidation |
| `components/stage-progress-view.tsx` | `6cbc352602d71919057f83a0bcc24b55f1fa343c` → **`2c50b5915572ec3721ad709ffd18ec58a597273f`** | Manually selected RR only: local 401/403 alert, hide `detailQuery.data`, local retry, preserve navigation |
| `pages/tournament-detail.rr-readback.test.tsx` | `c907d4431f632f82d1ae9bc14d7520292c332a70` → **`b5775b1305dabda8cdf6f5f482639be62c05b345`** | Keeps R18 MIX401/403 lawful DE/Overview, N→N+1, late/unchanged/non-RR tests; removes obsolete parent-global denial assumption |
| `components/stage-progress-view.rr-denied.test.tsx` | NEW → **`eb282e0812c6daf9db8a2de04e5e9aca6308fe0b`** | Test-first selected RR401/403 with retained authorized cache and DE navigation; selected-only retry authorized 200 |

**R19 Git commits in order:** tests `731c25f59dfcd6310fe747a200851faca80b9197`, fixture fresh-query correction `f104b5da4e41d2708784bf1a1f25cc5f05cf3272`, parent obsolete test migration `491a004d60dd4269430f9b7c7e734ffe71dee457`, child code `897e9a88e1108e29d710ea114ef438731c03f9c8`, parent code **`bfa9d075b431185aa8bbf87bf021d64dde8ae22f`**. **Tests committed before production code.**

## 2. Exact source fix — lawful navigation AND RR privacy

**A60 R18 independent source finding:** On old PR54 HEAD the `RoundRobinReadbackBridge` checked `rrStageIds.some(...401/403)` across **all** historical RR stages and returned an alert instead of the **entire** `TournamentDetail` Tabs tree. An old RR31 detail GET403 thus could conceal lawful current DE32 and Overview GET200. A60 classified old SHA `SOURCE_BLOCKED` (not measured browser exploit).

**Boundary A — parent `tournament-detail.tsx`:** preserve page-spanning `RoundRobinReadbackBridge` and RR fingerprint of canonical stage status/match revision/result; changed RR snapshots continue invalidating only exact `getGetTournamentStageQueryKey(tournamentId, stageId)` and `getGetTournamentStandingsQueryKey(tournamentId)`. Unchanged/DE-only snapshots cause no RR invalidation. Remove global `hasDeniedRrDetail`, RR-all cache subscription and all-tabs return. **No client ranking calculation** or auth helper modifications. Original page `readOk` remains unchanged and still gates whole-tournament private authorization.

**Boundary B — actual manual stage in `components/stage-progress-view.tsx`:** selectedStageId is owned in the child, not derivable from parent `tournament.activeStageId`. After `selected`, check `detailQuery.error.status ?? detailQuery.error.response?.status` numeric 401/403 **only if selected.format === round_robin**. API `ApiError.status:number` verified in source `lib/api-client-react/src/custom-fetch.ts`. Set `visibleDetails = selectedRrDenied ? undefined : detailQuery.data` and use it in **all** selected-stage participant render branches **and winner extraction**. Denied RR renders a local `role=alert` with **manual `detailQuery.refetch()` on selected query only**, keeps `StageNavigation` available and omits the duplicate generic error banner. Legal DE/Overview are not blocked by history RR error. Other errors retain previous generic handling.

**Privacy boundary:** whole-tournament credential revocation 401/403 stays A100-owned; this stage-local presentation correction does not guarantee global private-cache clearance. It must not be interpreted as granting access to a private tournament on a stale session. Do not declare `FULL_PRIVACY` based on RR alone.

**PR47 dependency:** PR54 contains the release-based child + RR local guard, **not PR47's dedicated DE Graph**. Therefore legal DE navigation is no longer blanket-blocked, but full Upper/Lower/GF/Reset graph correctness still requires future authorized integration of PR47 with the overlapping child file, then browser/regression QA. This is a source candidate, **not** a complete composite UI verification.

## 3. Actual test evidence / A50 commands

**Authored source tests, not executed:**
- `T100-R18-MIX-401` and `MIX-403`: historical RR31 query is error after previous authorized cached row, while legal DE32 and Overview children must remain visible; no parent blanket alert or private cached row in lawful child fixture.
- `T100-R19-C01-401/403`: current DE32 selected → manually choose old RR31; a 401/403 GET hides `RR_STALE_PRIVATE_RANK_701`, maintains DE navigation, DE→RR switch remains safe; manual retry GET200 reveals only `RR_CANONICAL_AFTER_RETRY_701`.
- `T100-R19-C02`: preexisting cached old authorized RR data and query error403 → manual selection never exposes old participant table.
- R13 fixtures retain external RR N→N+1 canonical readback, old deferred N, stage-only reopen, unchanged/DE-only no-poll, server 409 unchanged no invented rank.
- Test source follows `node:test`, RTL, real `QueryClient` and synthetic mocked `globalThis.fetch` responses. **No real user data, write API or DB.**

**Author static inspection:** **12/12 targeted source assertions** (selected-stage RR401/403, `visibleDetails` everywhere incl winner, local retry, navigation, parent all-tabs guard removed, exact RR/standings invalidation kept, `readOk` retained, two test files, no PR47 DE cherry-pick). **NOT app/RTL/typecheck PASS.**

**A120 R19 actual app commands/exit:** `NOT_EXECUTED` (React RTL, typecheck, build, browser, API integration, PG16), actual process `exit_code=NULL` and TAP `PASS/FAIL/SKIP=NULL`: no verified full frozen workspace checkout and Node22/pnpm10 executor in A120. A50 [R18 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R18_RECEIPT.md) likewise records zero native app tests due missing connected environment.

**Actual automatic GitHub Actions NEW SHA:** run **`38631912235`**, job **`116085745327`** = `completed/failure` at **upstream Pack19 snapshot matcher** (`readOnly:true` expected vs `accessMode:"read only"`). T100 RTL/typecheck/build were **not run by this workflow**. Existing unmerged PR35 owns Pack19. **No paid/manual CI rerun.**

**Proposed exact-SHA A50 safe frontend execution (NOT executed by A120), per approved full checkout at `bfa9d075b431185aa8bbf87bf021d64dde8ae22f`:**

```bash
git rev-parse HEAD
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm --filter @workspace/tournament-manager test
pnpm --filter @workspace/tournament-manager typecheck
pnpm --filter @workspace/tournament-manager build
```

Focused from `artifacts/tournament-manager`:

```bash
TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test \
  src/pages/tournament-detail.rr-readback.test.tsx \
  src/components/stage-progress-view.rr-denied.test.tsx
```

A50 needs actual **SHA, cwd, Node/pnpm, frozen install, command+exit, TAP counts and sanitized logs**. If environment unavailable: `ENV_BLOCKED`, not PASS. A60 independently reviews exact new SHA and all four changed files.

## 4. Independent QA, conflict map and STOP

[A60 R18 signed source report](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md) blob `656a8850a6358e5b4b2517220a5fc55f99dc014f`: PR54 OLD R18 HEAD `9866e5...` was **`SOURCE_BLOCKED`**. Its verdict cannot be transferred to new `bfa9d075...`; **A60 R19 acceptance PENDING**. [A60 R18 final gate](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_FINAL_HANDOFF_READINESS.md) blob `e838d37d15a30beb83dd65ec5189b10df89827b0`: `HANDOFF_NOT_READY` due PR54, PR53 legacy privacy, zero app tests, unsigned WEB004 38-row dispositions and owner policies.

**Integration collisions:**
- PR47 and PR54 same `stage-progress-view.tsx` path, different child implementations (DE graph vs RR private denial); later authorized integrator must preserve both and execute composite RTL/browser.
- PR43/PR50/PR54 same `tournament-detail.tsx` path; no same-hunk conflict established, no manual merge attempted.
- PR53 A100 global auth/query cache separate: local RR denial cannot resolve legacy private game-picks after token change.
- PR42/45/backend stage policy and all HQ-owned Swiss/SE/DE, Basket CAS, Backup B2, Steam, session decisions remain out of scope.

**A00 NEXT:** have A60 independently issue exact `bfa9d075...` `SOURCE_ACCEPTED`/block with evidence; have A50 run actual frontend tests or report one owner-action `ENV_BLOCKED`; update 21 PR manifest and 38 historical cases with owner-signed disposition before any final handoff request. No code changes outside two R19 owned UI files/two tests, no new PR, no cherry-pick, no merge/rebase, no SQL/PG, no shared DB, no paid CI, no staging/live/Replit, **no SWARM-006**.

**FINAL:** `PATCH_REVISED_SOURCE_ONLY / AUTHOR_STATIC_12_12 / A60_EXACT_SHA_PENDING / RUNTIME_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD`.
