# WEB-005 / A100 R18 — PR53 verified-owner game-picks cache source patch, full scope or HOLD

**Agent/task:** A100 — Session Security & Private Access / `WEB-005-T080-A100-S2B-R18`  
**Authority:** R18 central prompt `WEB-005_WAVE_R18_AGENT_PROMPTS.md`, blob `fd08cedcbd2db3222e4a444403180414d1666f6c`, §§0–2 + AGENT A100; code lane L2, **existing PR #53 only**, no new PR.  
**Date:** 2026-10-14 Europe/Warsaw.  
**Repository:** C8LyNn/aplikacja-turnieje.  
**Release/base:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` (unchanged when checked).  
**PR:** [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53), `fix/web-005/t080-s2a-private-auth-query-cache-r13`, **OPEN DRAFT/unmerged**.  
**Old R17 SHA:** `8f959733258aed0cab15298dd0684ca068045e6f`.  
**New R18 source HEAD:** `8710f7fe5946d7f62e366303a97722d4201fc96b`.  
**Pre-write A100 exclusive-file declaration:** [PR53 comment #6176943153](https://github.com/C8LyNn/aplikacja-turnieje/pull/53#issuecomment-6176943153).  
**Independent R17 source verdict:** [A60 R17 QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_INDEPENDENT_QA.md): `SOURCE_ACCEPTED_CONDITIONAL_KNOWN_OWNER_ONLY / SOURCE_BLOCKED_FULL_PRIVACY_UNKNOWN_OWNER` at the **OLD** PR53 SHA. **Never transfer this acceptance to R18 HEAD**.  
**RUNTIME:** `NOT_EXECUTED`; **RELEASE:** `NO_GO`; **SWARM-006:** `HOLD`.

## 1. Narrow source problem and attribution evidence

R17 covered cached `getListMatchesQueryKey(tid)` with `{ id:matchId, tournamentId:tid }` and Deadlock bans tuples. But `['matches',matchId,'game-picks']` can outlive a canonical match list: a valid standalone previously fetched picks entry persisted after logout/401/403 because per-match ownership was no longer recoverable at eviction time.

In the existing Host (`artifacts/tournament-manager/src/pages/tournament-host.tsx`, **READ ONLY**, release blob `6b50dcf4a3f09c5bc3416da5bc9c9d1f22c2d1e9`), `useListMatches(id)` fetches the scoped `getListMatchesQueryKey(id)` (around lines 95–98) before `focusedMatchId` and `useMatchGamePicks(focusedMatchId)` (around lines 292–295, 329–332) are selected. The backend `GET /tournaments/:id/matches` supplies enriched matches including their own `tournamentId`; source `Match` DTO explicitly declares `tournamentId:number`. **No numerical matchId→tournamentId equivalence**.

PR53 old helper `tournament-query-invalidation.ts` blob `626d31eb5b82d38c171f091f07990e00069de4ad` inferred ownership only from cache data *at eviction*. R18 uses that same authoritative DTO proof **at hook creation/fetch-time**, saving it on the match-only query itself.

## 2. Test-first R18 change sequence and exact file scope

| Order | Commit SHA | Path | Controlled change |
|---|---|---|---|
| 1. test-first | `f400590b13e9b260232e822f7ea88fba7ea1224a` | `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` | New negative contracts: capture owner meta, list removal then logout; denial; late fetch; ambiguous/no owner; exact ID proof |
| 2. production helper | `fe381689c9ec20eadfe6312dda83b5c1f57328be` | `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts` | Verify match ownership from successful tenant-scoped match-list cache, recognize query `meta` at 401/403 and logout |
| 3. production hook | `f304e32882692697d0bbf0e7f6b3482fa4c381b1` | `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts` | Before match-picks fetch set `meta.web005VerifiedTournamentId` only after authoritative match DTO equality; no proof => disabled placeholder query |
| 4. predicate safeguard | `3947508b70a5125a0d1b194be4bec4927740d382` | query-invalidation helper | Exact positive integer match-picks tuple type guard, no cross-type over-eviction |
| 5. active observer coverage | `4b0e293dcb9e4d752f9fbe45913d7fbc66b1dc19` | targeted test | Actual enabled hook with deferred synthetic HTTP response during logout |
| 6. 401/403 coverage | `62fbdfae556e9dc48d40e00708a2954611c782d5` | targeted test | Parameterize denied match-only GET on both HTTP 401 and 403 |
| 7. test isolation | `8710f7fe5946d7f62e366303a97722d4201fc96b` | targeted test | Verify late enabled HTTP query with logout using the same AuthProvider instance |

**Exact old→new diff:** only 3 files in `src/lib/`: `deadlock-bans-picks.ts` +12/-2, `tournament-auth-query-cache.test.tsx` +116/-1, `tournament-query-invalidation.ts` +60/-7. **No edits** to Host, detail page, generated API client, `auth-context.tsx`, existing QueryClientProvider regression fixture, backend security, migrations, PR #44/#46/#49 or other PRs.

## 3. Design guarantees (source-level, subject to A30/A60 and RTL)

- **Verified source only:** scan successful cached `/api/tournaments/<tid>/matches` query entries, require each match record to contain `id===matchId` AND `tournamentId===tid`; if absent, malformed or two different tournament owners claim the same match, return null (no guess).
- **Capture before GET:** `useMatchGamePicks` attaches `{web005VerifiedTournamentId:tid}` to its regular `['matches',matchId,'game-picks']` React Query entry. This association remains with the query after the canonical match-list entry is removed/garbage-collected.
- **No owner means no new unowned GET:** the hook uses an inert disabled `['matches',0,'game-picks']` placeholder until proof is present. It does not display a previously cached unproven match query when the current canonical list is unavailable. This is an intentional fail-closed functional constraint, not a server access-policy change.
- **Revocation / 401 or 403:** auth change and denied GET use verified metadata for scoped cancellation+removal, independent of the live match-list cache. R17 fallback to a current authoritative match list remains for older untagged entries. Valid A picks should disappear; B's tuple and public B remain cached.
- **Delayed response:** cancel and remove the exact owned query before a late unabortable in-flight response can reinstate A content in the active QueryClient. Original URL-key 7-vs-70 matching, tuple bans, support/organizer/viewer store/remove and standard domain invalidation preserved.
- **Never:** `queryClient.clear()`, delete every `['matches',...]`, assume `matchId===tournamentId`, log live tokens, change 401/403 wire policy, use production DB.

### Remaining bounded risks / honest limits

1. **Legacy untagged orphan query** cached by a previous code version when both metadata and canonical tenant match list are absent cannot be safely attributed to A/B. R18 does NOT globally purge it; the updated normal hook does not fetch or display it without new ownership proof. Its existence in cache is still a **residual retention concern**. After a matching list is later introduced, a standalone legacy entry may become addressable again before real RTL/browser migration behavior is checked. A30/A60 must assess whether a startup/session migration clean-up strategy or explicit owner waiver is necessary. This is not a claimed complete cache purge of all historical entries.
2. Page-local derived state and module-global active organizer/support/viewer request headers are outside S2B; previous A30 review requested separate checks. No assertion that production data was disclosed.
3. Metadata is **client-side provenance** captured from server GET, not a substitute for backend `checkViewerReadAuth`. Reviewer must inspect match-list freshness, duplicate/mismatch refusal and observer cancellation under concurrent role switches.
4. Broad changes to Host/other agents' owned files, API schema, token TTL/hash/rotation require separate A00/HQ file reservation/GO.

## 4. Authored tests and actual runtime receipt

Prior test suite: **15 authored React Query/RTL cache cases** at PR53 R17 (9 R13 + 6 R17). R18 adds **7 test instances** (six new literal cases, including two instances from the 401/403 parameterization), for **22 authored cache cases** at the new HEAD. The legacy `use-tournament-auth.test.tsx` retains **2 authored** support revocation cases and R17's valid QueryClientProvider fixture. No old positive/negative test was removed.

**Actual A100 executable app tests:** `NOT_EXECUTED`. Environment check: `node --version = v22.16.0`; `pnpm` absent; no full approved repo checkout, frozen dependencies or runnable frontend workspace at `/mnt/data`. No native TAP, Jest/RTL, browser E2E or TypeScript typecheck has been executed here, and no test exit code exists. No PostgreSQL is necessary for these *frontend-only* tests. A50 R17 independently reported zero native app tests owing to unavailable executor.

**A50 exact SHA runbook (not run by A100):**

```bash
# trusted, clean checkout with frozen pnpm deps, Node22/pnpm10
git rev-parse HEAD # assert 8710f7fe5946d7f62e366303a97722d4201fc96b
node --version
pnpm --version
cd artifacts/tournament-manager
export TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json"
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/lib/tournament-auth-query-cache.test.tsx
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-auth.test.tsx
pnpm typecheck
```

Capture `cwd`, exact HEAD, lock/dependencies, output/TAP, 0 skipped, command exit codes and an explicit A7/B8 privacy projection. Critical N2: with old list removed and A metadata retained, logout or 401/403 evicts A only; B remains; delayed enabled HTTP response never populates A; unknown-owner hook does not fetch/display. Re-run legacy two support cases. Browser check for legacy untagged retained cache if available.

**GitHub Actions:** first checked automatic [run 38627584615](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38627584615) at final HEAD was `in_progress`; no conclusion inferred from a pending run. Older PR53 runs failed on unrelated inherited Pack19 `readOnly:true` matcher versus code `accessMode:"read only"` (fixed in independent draft PR #35), before targeted RTL. A100 has NOT manually rerun paid CI and does not treat any automatic CI status as app-R18 PASS.

## 5. Independent gates, blockers and decision

- **A30**: source security peer review of exact R18 HEAD, especially query meta survival/removal, 401/403 status handling, A/B leak prevention, potential stale module headers and legacy orphan retention.
- **A50**: actual frontend RTL/TypeScript execution at exact HEAD on approved executor. Lack of runner must remain `NOT_EXECUTED` with owner preflight action.
- **A60**: independent exact-new-SHA verdict, distinguish `SOURCE_ACCEPTED_SCOPED` vs `SOURCE_BLOCKED_FULL_PRIVACY`, identify any owner waiver and outstanding native test debt. Prior A60 R17 acceptance does not roll forward.
- **A00/HQ**: decide explicit legacy-orphan cache policy if A30/A60 view it as a release blocker; separately obtain `HANDOFF WITH RUNTIME TEST DEBT` approval if WEB-005 is to hand over without current native tests. Never initiate that handoff from A100.

**Rollback:** revert the seven R18 commits on the existing unmerged PR53 branch; release untouched. No migration/deployment.

**Author disposition:** `PATCH_REVISED / VERIFIED_OWNER_META_SOURCE_IMPLEMENTED / R18_TESTS_AUTHORED_7 / APP_RUNTIME_NOT_EXECUTED / INDEPENDENT_QA_PENDING / LEGACY_ORPHAN_RISK_OPEN / RELEASE_NO_GO / SWARM006_HOLD`.
