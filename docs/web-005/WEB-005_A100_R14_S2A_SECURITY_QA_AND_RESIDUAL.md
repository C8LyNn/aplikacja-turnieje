# WEB-005 A100 R14 — PR53 S2A Security QA and Bounded Residual Inventory

**TASK:** `WEB-005-T080-A100-R14`  
**ROLE:** A100 — Session Security & Private Access, author QA handoff; **SOURCE-ONLY / NO CODE / NO NEW PR**.  
**DATE:** 2026-10-14 Europe/Warsaw.  
**AUTHORITY:** `docs/web-005/WEB-005_WAVE_R14_AGENT_PROMPTS.md` §§0–2, AGENT A100, source blob `e3fc34cee212e23c7516a2271af1080c96eff9a0`.  
**PR UNDER REVIEW:** [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) — HEAD `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979`, OPEN DRAFT / unmerged.  
**BASE / RELEASE SHA:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` (rechecked unchanged).  
**PR53 change scope:** `artifacts/tournament-manager/src/context/auth-context.tsx`, `src/lib/tournament-query-invalidation.ts`, `src/lib/tournament-auth-query-cache.test.tsx`, plus two R13 docs. No R14 modifications to PR53.  
**VERDICT (author, not independent):** `SOURCE_CONFIRMED` scoped implementation and identified gaps; `PATCH_PROPOSED`; `STATIC_INFERRED` intended runtime effects; `RUNTIME_NOT_EXECUTED`; `INDEPENDENT_SOURCE_ACCEPTANCE_PENDING`; `RELEASE_NO_GO`.

## 1. Actual GitHub / CI / independent QA readback

- PR53 HEAD/base/state rechecked with GitHub connector and compared against pinned release: five files changed; no backend/SQL or other agents' frontend files.
- Its test file `tournament-auth-query-cache.test.tsx` (blob `ec4b98ae6d7d6860176f65d4c7945557f983ddbb`) has **9 authored test instances**: eight literal `test()` declarations, of which the `401/403` parameterized declaration produces two. **Zero execution evidence** for those tests, not nine PASS.
- GitHub Actions [run 38606179795](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38606179795), job **115997865474** (`correction-qa`) completed `failure`. Job steps and raw log confirm failure at `Pack 19 snapshot consistency tests`: test `qa/pack19/source-contract.test.mjs:11` still matches `readOnly:true`, although actual implementation uses Drizzle `accessMode:"read only"`. Later static/database gates skipped. The fix already exists separately in **PR35**. This is a **real CI FAIL of Pack19 baseline**, **not** an observed failure or PASS of PR53's RTL tests.
- GitHub PR53 review submissions: empty; review threads: empty; no verified separate signed A60 source-acceptance report at PR53 exact SHA was supplied. Do not self-label `SOURCE_ACCEPTED`.
- This wave performed **no application tests**, browser sessions, `pnpm` commands, CI reruns or deployment. All requested frontend runtime results remain `NOT_EXECUTED`.

## 2. What PR53 actually protects — source-backed

At exact PR53 HEAD:
- `src/context/auth-context.tsx` blob `8916545544d55fc8d7fbd146d0328e36543bebb7`, lines ~32–88: `AuthProvider` uses `useQueryClient()`, installs a QueryCache denial subscriber, and calls `removeTournamentAuthQueries(queryClient, id)` after storing/replacing/removing organizer, support or viewer credentials (6 handlers). Existing `useVerifiedSupportSession` calls `removeSupSession` on 401/403, so that known revocation path reaches eviction.
- `src/lib/tournament-query-invalidation.ts` blob `1d4365963192646dd918675a65f4496913f2873f`, lines ~45–99: matcher accepts only query keys whose **first item is a string** beginning with `/api/tournaments/<exact-id>` and a proper boundary; it cancels and removes matching queries, and on a QueryCache 401/403 `error` event evicts the tournament ID parsed from such a key.
- Existing generated `getGetTournamentQueryKey(id)`, `getListPlayersQueryKey(id)`, `getListMatchesQueryKey(id)`, `getGetActionLogQueryKey(id)` use covered `/api/tournaments/id[/...]` key paths, so normal tournament GETs are in scope. Public tournament B cache is not intentionally globally purged.
- Nine authored tests exercise exact-ID boundary (7 vs 70), logout, credential replacement, late old response, viewer/support credentials, 401, 403, explicit remove and active QueryObserver A→B. Their existence is `SOURCE_CONFIRMED`; asserted effect is **not runtime verified**.

**No blanket statement of complete private-data isolation is supported.** Existing noncanonical query keys and component-local drafts are excluded below.

## 3. Bounded residual inventory (not a new code lane)

| ID | Precise finding | Source evidence and classification | Security / decision |
|---|---|---|---|
| **S2A-R14-R01 — P1** | **Deadlock player bans cache is NOT matched by PR53's eviction.** Actual `getPlayerBansQueryKey(id) = ["tournaments", id, "player-bans"]` and `usePlayerBans` fetches `/api/tournaments/:id/player-bans`. PR53 checks only string URL-prefix as queryKey[0]. The result will remain in the cache after a credential removal and is not evicted on a denied 401/403 refetch under that key. | `src/lib/deadlock-bans-picks.ts` blob `480cbf83e705e3ece91d9ae13635314b80fa47ac`, lines 34–54; `tournament-detail.tsx` lines 179–191 and `tournament-host.tsx` lines 145–152 use the hook. `SOURCE_CONFIRMED` key/predicate mismatch; visible post-logout exploit `STATIC_INFERRED`. | **Top residual privacy candidate.** A50 exact-SHA physical React Query test should demonstrate retained cached value. A60 independently assign FAIL/acceptance; A00 owns explicit separate GO/affected file reservation before any repair. |
| **S2A-R14-R02 — P1** | **Deadlock match game-picks cache is NOT matched and has no tournament ID in its key.** `getMatchGamePicksQueryKey(matchId)=["matches",matchId,"game-picks"]`, GET `/api/matches/:id/game-picks`. It cannot be safely mapped to a tournament using PR53 URL matcher alone. No cancellation, purge or 401/403 tenant mapping is performed for this cache on A's logout. | Same Deadlock helper blob, lines 37–38, 87–101; `tournament-host.tsx` imports `useMatchGamePicks` at line 39 and calls it at line ~330. `SOURCE_CONFIRMED` cache blind spot; visibility leak `STATIC_INFERRED` until A50 browser/RTL. | Require explicit match→tournament ownership mapping before purge; do **not** globally remove all matches. Combine fixture with R01 but preserve independent assertion and report. |
| **S2A-R14-Q01 — P0 QA compatibility** | **Existing auth hook regression test mounts the updated AuthProvider without QueryClientProvider.** New PR53 `AuthProvider` calls `useQueryClient()`, which requires provider context. The existing test wrapper renders `<AuthProvider>{children}</AuthProvider>` directly. | `src/hooks/use-tournament-auth.test.tsx` blob `2b1f7433b478de5dbb60459a9460055079d8b9b1`, lines 16–18; PR53 `auth-context.tsx` line 33. **SOURCE_CONFIRMED** fixture incompatibility; actual test verdict `NOT_EXECUTED` (predicted failure, NOT labeled runtime FAIL). | A50 run existing test at exact #53 HEAD. If FAIL, A60 records exact test output; A00 supplies explicit narrow GO for fixture/provider update and file reservation. New R13 tests already wrap providers correctly, so may miss this regression. |
| **S2A-R14-R03 — P2 needs reproduction** | **Page-local state is outside query cache:** `tournament-detail.tsx` tracks player edit drafts (`editingPlayerId`, `editName` / rank/team/country), CSV/import preview and restore input state; no visible global `id`/logout cleanup of all these values in analyzed flow. Private record values could persist in memory during same-component navigation. UI `readOk` gating mitigates normal rendering; actual cross-identity display is **not proven**. | `tournament-detail.tsx` blob `55aac4138d4e1c2556f100d58aa5a437dcbb82f6`, ~230–263 state; ~469–475 edit fields; ~808–839 gated tabs. `SOURCE_CONFIRMED` state lifetime and gate, `HYPOTHESIS` actual disclosure. | A00 coordinate A120 page ownership after QA; A50 add route A→B / logout draft persistence repro; no A100 edit to page. |
| **S2A-R14-R04 — bounded scan** | Generated `getGetMatchQueryKey(id) = ["/api/matches/:id"]` likewise escapes tournament-prefix predicate, **but usage as active privileged query on examined pages was not established**. | `lib/api-client-react/src/generated/api.ts` blob `276b28637821e39a58d476a6e5268b40932eff73`, lines 4607–4610. `SOURCE_CONFIRMED` generated key; runtime/privacy relevance `HYPOTHESIS`. | Do not open additional code task without proof it is used for protected payloads and a failing fixture. |

**Priority:** R01/R02 are concrete *coverage holes* in a cache-security patch (not independently confirmed user-visible incidents). Q01 is a direct test-harness contract mismatch. R03/R04 are bounded investigation notes only. This list is deliberately not an exhaustive catalog of every future private endpoint.

### Suggested minimal defect fixture for A50/A60 (no code authorized in R14)

On a verified frontend checkout at PR53 exact SHA:
1. Seed a QueryClient with canonical `getGetTournamentQueryKey(7)`, custom `getPlayerBansQueryKey(7)` and `getMatchGamePicksQueryKey(matchIdOf7)` containing non-sensitive fixture sentinels, plus `getGetTournamentQueryKey(8)` public B sentinel. Use real AuthProvider+QueryClientProvider and a mounted observer for A.
2. Store organizer token A for tournament 7, simulate logout with `removeOrgToken(7)`; assert **all three A query caches empty**, public B preserved. At current source this is predicted to **fail specifically for custom bans/picks keys**; collect actual `getQueryData` output and command exit, without logging credentials.
3. Repeat A→B token replacement in the same tournament, prior authorized response followed by 403 on a custom bans/picks query, and late deferred A custom hook GET resolution after logout. Require A response not visible or retained under old identity.
4. Run existing `use-tournament-auth.test.tsx` directly to expose or refute Q01; do not treat old fixture failure as evidence that private data escaped in production.
5. For R03 only, test `tournament-detail.tsx` route A→B while edit draft is active; verify no A draft appears under B. A120 owns any future change.

### Exact frontend commands (A50 only; Node22/pnpm10, frozen lockfile)

```bash
# checkout exact PR #53 HEAD 6a8f0c3e5775eb056df75ebdd7b33df7cbc78979
cd artifacts/tournament-manager
export TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json"
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/lib/tournament-auth-query-cache.test.tsx
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-auth.test.tsx ./src/lib/tournament-query-invalidation.test.ts
pnpm typecheck
# when isolated targeted fixes are permitted in a separate A00-approved window:
# add targeted R01/R02 negative tests, then rerun them and full frontend test runner
```

For each command, report `git rev-parse HEAD`, Node/pnpm versions, dependency lock status, exact command, test counts, exit code, failures and environment. Frontend-only tests require **no PostgreSQL**; no paid CI rerun.

## 4. Reconciliation of distinct backend post-lock patches

All checked live GitHub and remain independent OPEN DRAFT / unmerged, each based on the same release SHA, not integrated with PR53:
- **PR44 / S1A** @ `2f0187b7242681c394c09058b5ef647667206bd6`: `src/access-policy.ts`, `src/auth.ts`, `src/routes/tournaments.ts`, `session-revocation-race.integration.test.ts` + reports. Password-version revalidation for bans/game-picks writes. PG16+security independent acceptance pending; no S2 frontend cache change.
- **PR46 / S1B-D** @ `7f60849e389a7ed35fdd39dd5493c4c4c267d860`: tournament `DELETE /tournaments/:id` locked credential recheck, `tournament-delete-revocation.integration.test.ts` + reports. PG16+security pending.
- **PR49 / S1B-P** @ `99298b81501c3e7764d653604923522a19b9f05c`: `routes/auth.ts` support/viewer password and visibility post-lock organizer revalidation, `auth-organizer-revocation-r12.integration.test.ts` + reports. PG16+security pending.

**Integration conflicts:** PR44 and PR46 both alter `routes/tournaments.ts`, plus other independent Undo patches in that area; A00/SWARM-006 future authorized merge required. PR49 auth-only, PR53 frontend-only. Never cherry-pick/merge or make a composite branch within WEB-005. Session TTL, support-token storage hashing and organizer rotation remain owner/HQ `POLICY_OPEN`, unaffected here.

## 5. R14 GO/STOP and explicit next action

- **GO DONE:** Freeze PR53 HEAD; verify exact source, 9-authored test inventory, actual CI blocker, no A60 review; enumerate bounded concrete cache residuals, a test compatibility blocker, and A50/A60 fixture instructions.
- **STOP OBSERVED:** No edits to PR53 or app code; no new implementation PR; no paid CI, shared/production DB, migration, rebase/merge, staging/live or SWARM-006.
- **BLOCKER:** No actual A50 front-end test exit codes or A60 exact-SHA independent verdict. In addition, source-evident Deadlock key gap and existing test provider mismatch should be resolved through evidence-first triage before source acceptance.
- **NEXT:** A50 run PR53 targeted + existing auth-hook tests and bounded R01/R02 reproduction; A60 assess exact SHA and sign `SOURCE_ACCEPTED` or explicit `FAIL/BLOCKED` supported by evidence; A30 security peer reviews scopes; A00 optionally issues a **separate, narrow, file-reserved GO** for a failing defect after A50/A60 evidence. Final integration and SWARM-006 transfer remain unauthorized.

**FINAL:** `PR53_PATCH_PROPOSED / SOURCE_QA_HAS_FINDINGS / RTL_NOT_EXECUTED / A30_A50_A60_PENDING / RELEASE_NO_GO`.
