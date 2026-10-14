# WEB-005 — A100 R17 PR53 S2B result (conditional R16 carryover)

**Agent / task:** A100 Session Security & Private Access / `WEB-005-T080-A100-S2B-R17`.
**Authorization:** Central R17 §§0–2 + AGENT A100, prompt blob `c2dd8c1e2e2e3b5e245db61877da99f59c77a0ff`; conditional L3 GO on **existing PR #53 branch only**, no additional PR or cross-owned files.
**Date:** 2026-10-14 Europe/Warsaw.
**Original R16 evidence:** [WEB-005_A100_R16_RECOVERY_STATUS_R17.md](./WEB-005_A100_R16_RECOVERY_STATUS_R17.md) (source recovery commit `9d7ecda6fa2d01888ee6b760c7310c705a152f05`). Original A100 R16 report, code SHA, actual tests and exit receipts were **not present on checked GitHub**. This report is a R17 recovery note, not a rewritten original R16 artifact. `R16_ARTIFACTS_UNAVAILABLE / R16_DELIVERY_NOT_VERIFIED`.
**Base/release:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` (unchanged).
**Existing draft PR:** [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53); head branch `fix/web-005/t080-s2a-private-auth-query-cache-r13`, **initial HEAD** `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979`, **R17 source HEAD** `8f959733258aed0cab15298dd0684ca068045e6f`. OPEN/DRAFT/unmerged; same release base. No new PR.

## 1. Independent evidence and exact source issue

- A60 original R15 independent report at `docs/web-005/agent-reports/A60/WEB-005_A60_R15_INDEPENDENT_QA.md` labels PR53 old SHA `SOURCE_FAIL_FULL_PRIVACY_SCOPE;SOURCE_ACCEPTED_URL_PREFIX_ONLY`. A30 R13 security peer flagged private cache scope/global header/observer questions. **Neither is an independent review of the amended R17 HEAD**.
- Baseline `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts` blob `480cbf83e705e3ece91d9ae13635314b80fa47ac`: tuple bans `['tournaments', tid, 'player-bans']`, tuple game picks `['matches', mid, 'game-picks']`. Source router `GET /tournaments/:id/player-bans` and `GET /matches/:id/game-picks` use tournament-specific read auth; latter derives `matchesTable.tournamentId`, not numeric match ID coincidence.
- Existing PR53 helper source blob `1d4365963192646dd918675a65f4496913f2873f` matched only URL-prefixed keys; existing legacy `use-tournament-auth.test.tsx` blob `2b1f7433b478de5dbb60459a9460055079d8b9b1` used AuthProvider without QueryClientProvider.
- No actual past exploitation or post-logout private rendering has been demonstrated. **SOURCE_CONFIRMED** uncovered query shapes; privacy consequences **STATIC_INFERRED** until A50 executes.

## 2. R17 code commits, files and test-first sequence

| Order | Commit | Changed file | Action |
|---|---|---|---|
| Test-first | `ca407975ea2af8cdce117497c04072975e8650f5` | `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` | Add 6 S2B targeted React Query/RTL test cases (A/B bans, revoked 403, proven-owned picks 403, delayed old A reply, no unproven ownership purge, strict 7/70 tuple). |
| Test-fixture | `cbe2abc42622be6d7cbd36c7dbae4b7c447b1f48` | `artifacts/tournament-manager/src/hooks/use-tournament-auth.test.tsx` | Add QueryClientProvider, per-test QueryClient/cleanup; retain two original support revocation/route-switch test assertions. |
| Source patch | `8f959733258aed0cab15298dd0684ca068045e6f` | `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts` | Scoped tuple ban matching and error ID parsing; ownership-aware match pick eviction, with no global match clear. |

**Exact diff versus prior PR53 HEAD**: 3 paths only; `hooks/use-tournament-auth.test.tsx` +7/-1, `lib/tournament-auth-query-cache.test.tsx` +92, `lib/tournament-query-invalidation.ts` +68/-5. No code updates in `deadlock-bans-picks.ts`, `tournament-host.tsx`, backend auth/routes, migration or API-client module globals. Existing R13 URL prefix contract unchanged.

### What the new matcher does

- Existing URL key `/api/tournaments/7[/...]` remains matched only for tournament 7, not 70. Adds **exact** key `['tournaments', 7, 'player-bans']`; B=8 and 70 remain untouched.
- `tournamentIdFromAuthQuery` recognizes only exact player-bans tuples as well as pre-existing URL keys. A 401/403 failed player-bans query now has a resolvable tenant and removes stale data for that tenant.
- Game-picks query `['matches', matchId, 'game-picks']` is evicted ONLY if a cached authorized `getListMatchesQueryKey(tid) = ['/api/tournaments/tid/matches']` record already provides explicit `{ id: matchId, tournamentId: tid }`. It reads the match ownership set **before** evicting the canonical match list, then cancels/invalidates only that match's picks. A 401/403 picks query can determine its tournament by checking all present canonical match-list responses for explicit consistent ownership; conflicting/missing ownership produces no guessed global purge.
- Canceled old in-flight A queries are detached before they can reinsert a late payload into the live query cache, **conditional on having match ownership metadata**. B's cache is preserved. No match ID is treated as tournament ID.
- **Explicit partial coverage:** if no trusted, already-loaded tournament-scoped match list exists, match→tournament cannot be established: a match-only cached picks entry stays outside automatic per-tournament eviction. This is an intentional `OWNERSHIP_UNPROVEN / HOLD` limitation rather than silently clearing all match caches. A30/A60 must assess whether an approved typed metadata hook or Host read path is required; A100 is not authorized to modify Host here.

## 3. Test matrix and exact runtime evidence

On PR53 branch, existing R13 suite contained **9 authored test instances** (8 literal test declarations, one generated extra 401/403 case). Six R17 S2B tests were added, resulting in **15 authored cache-suite test cases**. Two existing support-auth hook test cases remain, now using QueryClientProvider. **0 native React RTL tests run by A100.** All assertions/test counts are authored definitions, not PASS.

**Executor preflight observed here (non-test):** `node --version` returned `v22.16.0`; `pnpm` not available; `/mnt/data` lacks verified repo checkout, pnpm lock/deps and test fixtures; no full repo in this container. **RUNTIME_NOT_EXECUTED / NO EXIT FOR TESTS**. Older PR53 GitHub workflow run 38606179795 failed inherited Pack19 matcher; it does not test the amended HEAD. No manual GitHub CI restart initiated.

### A50 targeted runbook (Node22/pnpm10, frozen full checkout, no PG needed)

```bash
git rev-parse HEAD # assert 8f959733258aed0cab15298dd0684ca068045e6f
node --version
pnpm --version
cd artifacts/tournament-manager
export TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json"
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/lib/tournament-auth-query-cache.test.tsx
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-auth.test.tsx
pnpm typecheck
```

Capture real exact SHA, lock/deps evidence, TAP counts/skips, exit codes, test logs and separate A/B query snapshots; do not infer PASS from authored tests. A30 peer and A60 independent exact-head review must follow, including query cache cancellation ordering and module-global stale headers (out of this narrow patch).

## 4. Boundaries, policy and follow-on dependencies

- **N1** bans supported by exact numeric tournamentId tuple; **N2** match picks protected only with current proven cached match-list ownership; **N3** original hook-test fixture updated without changing production provider/API.
- Backend independent drafts #44 @ `2f0187b7242681c394c09058b5ef647667206bd6`, #46 @ `7f60849e389a7ed35fdd39dd5493c4c4c267d860`, #49 @ `99298b81501c3e7764d653604923522a19b9f05c` remain separate; no merge/cherry-pick or new PR.
- `POLICY_OPEN`: token TTL/hash/digest/organizer rotation; no changes made. Read gate/Host cross-page local states and missing match metadata require separate authorized owner file window if A60 considers them blocking. This narrow patch does NOT prove comprehensive frontend private-data isolation.
- **No production DB/SQL, paid CI rerun, staging/live, integration, data exports or SWARM-006.** Rollback: revert three R17 commits on PR53 branch before any later integration; release unchanged.

**Final author verdict:** `PATCH_REVISED / SOURCE_CONFIRMED_SCOPED / R16_ARTIFACTS_UNAVAILABLE / N1_TEST_AUTHORED / N2_CONDITIONAL_OWNERSHIP / N3_FIXTURE_AUTHORED / NATIVE_RTL_NOT_EXECUTED / A30_A50_A60_PENDING / RELEASE_NO_GO`.

**NEXT A00:** acknowledge permalink + revised PR53 SHA; dispatch A50 exact-SHA RTL/typecheck, A30 source/privacy peer and A60 source acceptance. Explicitly decide whether missing match-list metadata merits a separate narrowly reserved Host/typed-query GO. Do not activate SWARM-006.
