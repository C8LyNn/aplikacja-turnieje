# WEB-005 A100 / R15 — T080-S2B Negative Test Contracts and CODE HOLD

**AGENT:** A100 — Session Security & Private Access.
**TASK:** `WEB-005-T080-A100-S2B-R15`.
**AUTHORIZATION:** R15 master prompt §§0–2 and AGENT A100 (blob SHA `e6950cbff7e521ed9b3ff774e7787e8d598a966d`).
**MODE:** `SOURCE-ONLY FIRST / TEST CONTRACTS FIRST`. No `R15-S2B-CODE-GO` from A00 verified. No application-code or executable-test-file changes, no new PR.
**AS-OF:** 2026-10-14 Europe/Warsaw.
**TARGET:** [PR #53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53), `fix/web-005/t080-s2a-private-auth-query-cache-r13`, exact HEAD `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979`: OPEN DRAFT, unmerged.
**BASE:** `release/tournament-ops-20261013-01` HEAD `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, unchanged.
**R14 SOURCE REPORT:** [WEB-005_A100_R14_S2A_SECURITY_QA_AND_RESIDUAL.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a100-r14-s2a-security-qa/docs/web-005/WEB-005_A100_R14_S2A_SECURITY_QA_AND_RESIDUAL.md).
**R15 RESULT:** `SOURCE_CONFIRMED` cache-predicate mismatch and test-wrapper mismatch. `STATIC_INFERRED` client stale-data risk. `RUNTIME_VERIFIED=NO`, `TESTS=NOT_EXECUTED`, `INDEPENDENT_A60=NOT_VERIFIED`, `PR=NO_NEW_PR`, `RELEASE=NO_GO`.

## 1. Evidence inventory pinned to GitHub source

1. `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts` at PR53, blob `1d4365963192646dd918675a65f4496913f2873f`, lines ~45–99: `isTournamentAuthQuery` matches only a first key element of string `/api/tournaments/<exact id>`. `removeTournamentAuthQueries` cancels and removes those entries. `subscribeToTournamentAuthDenials` parses 401/403 tournament IDs from the same URL-like key shape. **No handling of tuple-keyed bans or match picks.**
2. `artifacts/tournament-manager/src/context/auth-context.tsx` at PR53, blob `8916545544d55fc8d7fbd146d0328e36543bebb7`: six organizer/support/viewer store-or-remove callbacks invoke only `removeTournamentAuthQueries(queryClient, id)`; there is no second noncanonical cache eviction. `AuthProvider` itself calls `useQueryClient()`.
3. `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts` baseline blob `480cbf83e705e3ece91d9ae13635314b80fa47ac`, lines 34–54 and 87–101: `getPlayerBansQueryKey(tid) = ["tournaments", tid, "player-bans"]` and `getMatchGamePicksQueryKey(mid) = ["matches", mid, "game-picks"]`; actual `useQuery` hooks fetch private-readable endpoints and use 30,000ms / 10,000ms staleTime. Both key shapes are excluded by PR53 predicate. Detail and Host read bans; Host reads game picks.
4. `artifacts/api-server/src/routes/tournaments.ts` at release, sections `GET /tournaments/:id/player-bans` ~3134–3151 and `GET /matches/:id/game-picks` ~3210–3236: both call `checkViewerReadAuth`; picks resolves `matchesTable.tournamentId` from the database before access check. Therefore auth-privileged data is possible on these endpoints, and the **server-side authoritative match ownership is tournamentId**, not numeric equality of matchId and tournamentId. A historical UI leak is *not* proven by that source fact.
5. `artifacts/tournament-manager/src/hooks/use-tournament-auth.test.tsx` at PR53, blob `2b1f7433b478de5dbb60459a9460055079d8b9b1`, lines 16–18: legacy wrapper renders `<AuthProvider>` without `<QueryClientProvider>`, while new PR53 `AuthProvider` calls `useQueryClient()`. Fixture incompatibility is `SOURCE_CONFIRMED`, *actual runtime FAIL not yet verified*.
6. New PR53 test file `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx`, blob `ec4b98ae6d7d6860176f65d4c7945557f983ddbb`: **9 authored tests**, covering mostly URL-keyed cache; NOT an S2B noncanonical test execution.
7. GitHub PR53 Actions [run 38606179795](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38606179795) was `failure` at Pack19 pre-existing `readOnly:true` matcher vs `accessMode:"read only"`. This did **not run S2B/PR53 RTL**. Historical Pack19 fix is separately in PR35.

### Independent verification gate

Read-back of PR53 review submissions is empty; neither an A60 exact-SHA signed acceptance nor actual A50 S2B runtime exit output was verified in available GitHub material. GitHub PR53 discussion includes an **A30 R13 source-only security peer comment** identifying module-global header revocation and enabled-observer coverage risks; it is *not* A60 signoff or executable FAIL. Search for `R15-S2B-CODE-GO` in repository issue/PR discussions returned no written authorization. As required, **no source-code changes have been made**.

## 2. Three test-first negative contracts for A50 and A60

These are **reviewable test specifications**, not committed executable `.test.tsx` code and not claims of test execution. A50 may implement them in an authorized, isolated test checkout/temporary test harness to obtain real failing or passing evidence; **A100 cannot change application or test source without written A00 GO**.

### N1 / S2B-BANS — organizer logout, revoked credential, noncanonical bans

**Fixture:** React Query `QueryClient` with active `AuthProvider` inside `QueryClientProvider`; synthetic, unique tournament A = 7 (`private_online`) and unrelated public B = 8. Seed `getGetTournamentQueryKey(7)`, `getPlayerBansQueryKey(7)` with sentinel A, `getGetTournamentQueryKey(8)` and `getPlayerBansQueryKey(8)` with sentinel B. Authenticate organizer A using the existing context callback, without real tokens or network users.

**Action:** Trigger `removeOrgToken(7)`. Repeat separately with `storeOrgToken(7, "synthetic-identity-B")`, support-session revocation via a 403 response, and a denied 401/403 background GET for `/api/tournaments/7/player-bans` using its *actual tuple query key*. Include a deferred in-flight GET started as A, then resolve after logout, with abortable and non-abortable variants; an **enabled=true** mounted observer must not show late A content.

**Must assert:** Both canonical and tuple-keyed **A** results become `undefined` / inaccessible synchronously at the identity boundary and remain absent after A's late completion; B's tournament and B's bans cached values are unchanged; no global clear, no cross-tenant purge, no sensitive token log. After 401/403, previously authorized A tuple data must not stay visible. The current PR53 implementation is **predicted to leave A's bans tuple entry**; only real output may be marked `FAIL`.

**Instrumentation:** Capture query key, query state, active observer render and network-request header metadata (whether an expired `X-*Token` was sent; redact all values). Distinguish cache defect from separate module-global header cleanup risk noted by A30.

### N2 / S2B-PICKS — owned match ID, no cross-tournament purge

**Fixture:** tournament A=7 with match M_A=701 and tournament B=8 with M_B=801 (IDs are deliberately unlike tournament IDs). Seed authoritative *fixture ownership* `GET /api/tournaments/7/matches` containing M_A with `tournamentId:7` and `GET /api/tournaments/8/matches` containing M_B with `tournamentId:8`. Seed `getMatchGamePicksQueryKey(701)` with sensitive synthetic A result and `getMatchGamePicksQueryKey(801)` with B result. Also seed canonical `/api/tournaments/7...` and `/api/tournaments/8...` entries.

**Action:** While an enabled Host observer is showing A picks, logout A, then simulate delayed A picks response and 403 for actual match-picks tuple query; navigate/login to B.

**Must assert:** A picks evicted or made inaccessible; late A response does not rehydrate; **B picks and public B tournament stay intact**; only matches proven to belong to A are affected. Numeric `matchId` **never** interpreted as `tournamentId`. If ownership mapping is missing, stale or ambiguous, record `OWNERSHIP_UNPROVEN` and **HOLD code**, not a global `removeQueries(["matches"])`. If a credible match→tournament mapping requires Host ownership changes, A00 must reserve those files explicitly. Source-only PR53 is **predicted to leave both A and B picks tuple entries unchanged**; runtime assertion needed.

**Proof requirement:** Record which stable, trusted source associates a match with a tournament (server matchesTable.tournamentId, or validated tenant-scoped match list/match metadata), when that association is captured relative to canonical cache removal, and how the logic avoids deleting B. Client-only guessed ID range, matchId modulo arithmetic, or global match cache purge is unacceptable.

### N3 / S2B-PROVIDER — old hook regression fixture and access revocation

**Fixture:** Re-run the **existing unchanged** `src/hooks/use-tournament-auth.test.tsx` under PR53 exact HEAD; it uses an `AuthProvider` wrapper without React Query context. Independently prepare a *test-only corrected fixture* wrapping `QueryClientProvider client={new QueryClient(...)}` around the same `AuthProvider`, with isolated client cleanup after each test. Do not modify protected production auth logic merely to silence a fixture failure.

**Must assert:** The two existing cases still enforce (1) revoked 403 support session gives **no mutating capability** and clears stored session, (2) delayed verification of support session for tournament 41 never grants authority to tournament 42. With a corrected provider the test must pass; first run should independently determine whether the unchanged fixture actually fails (expected `No QueryClient set...`, but **NOT_EXECUTED**). Do not declare a runtime FAIL before collecting exit code. This is a separately owned potential one-file test-fixture remediation, not implicit authorization for S2B code lane.

### Cross-contract P0 acceptance criteria

- Active query observers in **enabled=true** mode; abortable and unabortable late responses; `removeOrgToken`, token replacement, support 401/403, optional viewer revocation; exact A versus B cache isolation.
- Distinguish `GET` authorization denials from write authorization and from valid public GET; preserve positive organizer/support/viewer usage and public B.
- Do not rely on `invalidateQueries` alone (may retain old authorized `data`), and do not use global `queryClient.clear()` or blanket removal of all `["matches", ...]`.
- Check A30's module-global `setActiveOrganizerToken` / `setActiveSupportToken` / `setActiveViewerToken` observation: stale request headers after context-only logout are a separate source concern; report it for A30/A00 rather than expanding S2B scope by assumption.
- If independent test graph disproves private exposure in concrete UX, record `SOURCE_RECONCILED / NO_NEW_PR` despite noncanonical key mismatch. Conversely, demonstrated stale cache requires A60/owner severity assessment and authorized scoped remediation.
- All sentinels fictional; no production sessions, exports, tokens or DB writes.

## 3. A50 execution instructions (not executed by A100)

Use a **complete, pinned checkout** of PR53 HEAD, Node 22, pnpm 10, frozen dependencies, frontend-only JSDOM (no PostgreSQL). Run in a disposable worktree, not a merge/composite; record `git rev-parse HEAD`, Node/pnpm versions, package installation proof and every exit code. Do not rerun paid CI.

```bash
git rev-parse HEAD   # must equal 6a8f0c3e5775eb056df75ebdd7b33df7cbc78979
node --version
pnpm --version
cd artifacts/tournament-manager
export TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json"
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/lib/tournament-auth-query-cache.test.tsx
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-auth.test.tsx
pnpm typecheck
```

For N1/N2, A50 needs a separately authored **temporary test fixture**, since PR53's existing nine tests do not seed Deadlock tuple keys. Report its file path, exact SHA or attachment, **actual command** and zero/nonzero exit; never conflate an invented demonstration with executed application QA. Then attach actual React Query snapshots/render events and an A60-verifiable failure report. Do not add the temporary fixture to a shared release/composite branch without explicit permission.

## 4. Hold / conditional fix ownership proposal to A00

**No written A00 `R15-S2B-CODE-GO` or independent A60/A50 exact-SHA defect confirmation verified.** Thus the correct result this wave is **`NO_NEW_PR / CODE_HOLD`**, not a new implementation candidate.

Only if A00 subsequently issues a new explicit GO after verified evidence: start an **isolated release-based S2B branch**, with exact exclusive ownership for the necessary files. Candidate *conditional* scopes (not permission):
- `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts` — matcher/ownership-aware eviction adapter;
- `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts` — tuple-key-aware helper or API metadata if independently justified;
- `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` or separate `tournament-auth-noncanonical-cache.test.tsx` — deterministic negative tests;
- `artifacts/tournament-manager/src/hooks/use-tournament-auth.test.tsx` — **separate explicitly authorized** QueryClientProvider fixture fix;
- `artifacts/tournament-manager/src/pages/tournament-host.tsx` — only if match ownership cannot be established otherwise, must obtain independent owner file reservation; no implicit A100 permission.

The dependency is unmerged PR53. **No cherry-pick, merge or copy of PR53 into a new R15 branch**, no global cache purge, no changes to backend PR44/46/49, TTL/hash/rotation/403 product policy, migration or deployment. A00 must decide whether a tested mismatch is a privacy defect requiring narrow code or merely a safe source reconciliation. Future integration is SWARM-006-only after formal WEB-005 closeout.

## 5. PR and policy isolation

Live checked against GitHub: PR44 @ `2f0187b7242681c394c09058b5ef647667206bd6` (backend bans/picks post-lock), PR46 @ `7f60849e389a7ed35fdd39dd5493c4c4c267d860` (backend protected tournament DELETE), PR49 @ `99298b81501c3e7764d653604923522a19b9f05c` (organizer password/visibility post-lock), and PR53 @ `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979` (frontend private cache) all OPEN DRAFT, same release base, not merged. They are separate source patches and should not be reported as a tested composite.

**Final security assessment:** concrete **source-level cache-coverage blind spots**, and source-level hook-test wrapper incompatibility; no demonstrated real user exfiltration; frontend-only runtime test **NOT_EXECUTED**, independent A60 verdict **NOT_VERIFIED**, written GO absent. `RELEASE_NO_GO / SWARM-006_HOLD`.
