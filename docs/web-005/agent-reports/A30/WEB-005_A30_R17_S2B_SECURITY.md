# WEB-005 — A30 R17 / S2B Security Peer & Trusted Match Ownership

**Agent / task:** A30 Security Implementation (peer) · WEB-005-T030-T031-A30-R15  
**Wave:** R17 · **Mode:** STRICT SOURCE-ONLY / READ-ONLY APPLICATION  
**Authority:** [central R17 document](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R17_AGENT_PROMPTS.md), Git blob c2dd8c1e2e2e3b5e245db61877da99f59c77a0ff, ``0–`2 and AGENT A30.  
**Pinned base:** release/tournament-ops-20261013-01 @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**Target:** [PR #53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) @ `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979` · OPEN / DRAFT / UNMERGED · branch `fix/web-005/t080-s2a-private-auth-query-cache-r13`. Recheck `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979` vs current branch = `identical`, ahead=0, behind=0, changed files=0 (during this review).  
**R16 retrospective:** [A30 R16 historical status receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/a65c919ec2a0365c2f044905ab8ac750f20f801a/docs/web-005/agent-reports/A30/WEB-005_A30_R16_STATUS.md): `R16_ARTIFACTS_UNAVAILABLE`. A30 has no R16 work or tests within this conversation. The R17 re-review is **new R17 evidence, not retroactive R16 approval**.

## 1. Verdict & independent provenance

**A30 PEER verdict:** `PR53_SOURCE_GAP_CONFIRMED; S2B_OWNERSHIP_REQUIRED; LEGACY_AUTH_FIXTURE_INCOMPATIBLE_SOURCE; UI_LEAK_STATIC_INFERRED_ONLY; RUNTIME_NOT_EXECUTED; RELEASE_NO_GO`.

**Separate A60 independent source decision:** [A60 R15 independent QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R15_INDEPENDENT_QA.md), exact PR53 SHA, `SOURCE_FAIL_FULL_PRIVACY_SCOPE` and `SOURCE_ACCEPTED_URL_PREFIX_ONLY`. This is **NOT** approval of the full private cache. A60 **R17** exact-head addendum/review remains pending at this snapshot. The A30 peer cannot self-sign A60 acceptance.

A50 [original R15 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R15_RECEIPT.md) documents zero native application tests; no complete checkout, pnpm or isolated PG16 available. **No A30 R17 frontend/PG/native test was run.** Commands and exit codes `NOT_EXECUTED / N/A`. Existing automated [PR53 run 38606179795](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38606179795) succeeded at frozen install and SE safety unit, failed **preceding Pack19**, and skipped downstream static/database release gates; **it did not run the targeted S2A RTL**. The Pack19 fix belongs to the separate PR35.

## 2. Exact S2B blind spots, source proof and component ownership

### S2B-R01 — player bans / P1 — SOURCE_CONFIRMED

- Release `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts` blob `480cbf83e705e3ece91d9ae13635314b80fa47ac`, lines 34–53: `getPlayerBansQueryKey(tid) = ["tournaments", tid, "player-bans"]`; live hook `usePlayerBans` fetches `/api/tournaments/:id/player-bans`.
- Consumers: `artifacts/tournament-manager/src/pages/tournament-detail.tsx` (~185–191, PlayerBansRow ~1180 and StageProgressView ~1468); `artifacts/tournament-manager/src/pages/tournament-host.tsx` (~151–152).
- PR53 `src/lib/tournament-query-invalidation.ts` blob `1d4365963192646dd918675a65f4496913f2873f` lines 45–55 matches only query keys with a first element starting `/api/tournaments/<id>`; lines 58–66 infer only that URL form for denial, lines 71–78 cancel/remove only matches. This tuple starts `"tournaments"`, so logout/token-switch eviction **cannot select it**. Denied refetch (401/403) cannot identify its tournament for eviction.
- **Classification:** source-level cache coverage failure `SOURCE_CONFIRMED`. Rendering previous bans to an unauthorized user is **STATIC_INFERRED** until a real React/browser fixture proves it.

### S2B-R02 — game picks / P1 — SOURCE_CONFIRMED

- Same helper, lines 37–38 / 91–100: `getMatchGamePicksQueryKey(mid) = ["matches", mid, "game-picks"]`; `useMatchGamePicks` fetches `/api/matches/:id/game-picks`.
- Consumer: `tournament-host.tsx` (~293–296 resolves focused match from loaded matches, ~330–345 hook and mapping; presentation ~1042 / 1105 / 1173).
- Key has **no tournamentId** and fails PR53 URL-first matcher and 401/403 owner inference; a match ID alone is not proof of tenant ownership. Never evict all `["matches", ...]` keys globally.
- **Classification:** `SOURCE_CONFIRMED` unmatched cache and absent owner identity. Visible unauthorized UI reuse remains `STATIC_INFERRED / NOT_OBSERVED`.

**Additional Host source note:** `usePlayerBans` enabled as `isDeadlock && !!id` and `useMatchGamePicks` enabled as `isDeadlock && !!focusedMatchId`, without a direct `isAuthReady` condition in their hook options. Other Host auth/early-return checks may prevent actual display; therefore this **raises urgency for deferred requests/401–403 checks**, not proof of exposure. Even if an existing entry later receives 403, the current denial handler does not evict these noncanonical keys.

### S2B-Q01 — existing AuthProvider test compatibility / P0 fixture

- Baseline `artifacts/tournament-manager/src/hooks/use-tournament-auth.test.tsx`, blob `2b1f7433b478de5dbb60459a9460055079d8b9b1`, lines 16–18: wrapper renders only `<AuthProvider>{children}</AuthProvider>`.
- PR53 `src/context/auth-context.tsx` blob `8916545544d55fc8d7fbd146d0328e36543bebb7`, line 33 calls `useQueryClient()` requiring a `QueryClientProvider`.
- Production `App.tsx` correctly nests AuthProvider *inside* QueryClientProvider. PR53's own nine RTL scenarios also use QueryClientProvider, which can conceal the old fixture mismatch.
- **Classification:** structurally incompatible existing test `SOURCE_CONFIRMED`; runtime failure **NOT_EXECUTED / not observed**. Legal support verification behavior in the original two tests remains required: expired support does not get mutation rights; late response from tournament A cannot authenticate B.

## 3. Backend read policy and 401/403 truth

Release `artifacts/api-server/src/routes/tournaments.ts` blob `6767e7ac6c4d43cf39faa8a61534bdb92b898e14`:
- GET `/tournaments/:id/player-bans` (~3134–3146) passes `checkViewerReadAuth` **before** table SELECT.
- GET `/matches/:id/game-picks` (~3210–3230) looks up match→tournament from the DB, returns **404** for nonexistent match, then passes `checkViewerReadAuth` **before** picks SELECT.
- `checkViewerReadAuth` (~413–414) delegates to `requireTournamentRead` in `artifacts/api-server/src/access-policy.ts` blob `2efd5a51e365e9b3aed598eb3289178911f87af6`. `public_online` allows anonymous reads; `private_online` permits organizer/support/viewer; `private_offline` organizer/support only. Denied private reads return **403** with `VIEWER_PASSWORD_REQUIRED` or `PRIVATE_OFFLINE`. PR53 also listens to 401 as a general query failure, but **401 is not the proven response for these specific privacy endpoints**.
- No demonstrated backend bypass, production exploit, or evidence of real user secret disclosure exists. The actual source issue is **client-side stale authorized data retention** after privileges change.

## 4. Safe tenant ownership design for A100; NO code authorization from A30

1. Retain existing safe URL-prefix matching with exact ID boundary (7 ≠ 70). Include explicitly typed custom bans key `["tournaments", tid, "player-bans"]` in owner-aware match logic and denial parsing.
2. For match picks, derive `tournamentId` from **authoritative, authorized tournament-scoped match list** or server-provided verified ownership. On Host, `focusedMatch` already comes from `matches?.find(m => m.id === focusedMatchId)`; ensure this list actually belongs to the current tournament and auth epoch. Before dispatching a picks GET, verify membership. If mapping is missing, fail closed (no speculative tenant).
3. Proposed canonical key shape: `["tournaments", tid, "matches", mid, "game-picks"]`, paired with an explicit ownership contract for `useMatchGamePicks` and `useSetMatchGamePick` invalidation. Alternative: `query.meta = { authScope: "tournament", tournamentId: tid }` set by the producing hook and verified by the eviction predicate. **Meta must not be blindly accepted from old untagged entries.** No cross-tournament purge; retain independently public/valid-B caches.
4. Credential change / logout / 403 on an owner-scoped private key must cancel and remove A's prior query data; ensure late unabortable response cannot rehydrate protected A data or render into new credentials/route. When auth **epoch** changes (A→new A or A→B), stale async closures must not attach old authorization identity.
5. Module-global token setters in `lib/api-client-react/src/custom-fetch.ts` store active organizer/support/viewer headers. PR53 token store/remove functions affect sessionStorage/QueryClient but do not directly call those global setters; `useSyncTournamentAuth` effects and page-specific handlers may update them later. Require an A50 request-capture test for post-logout/role-swap stale headers. **Source distinction, not a confirmed leaked header in runtime.**

**Owner vs bug decision:** This scoped owner attribution/fixture repair is a privacy correctness defect, **not a license** to decide TTL, token digest storage, password-rotation strategy, global logout policy or Steam 403/503. The S2B lane belongs exclusively to A100 within the exact prior R16 contract, and requires A00/hard GO or its R17 conditional carryover. A30 does **not** edit that code or approve own patch. Any extra page-local state work belongs to separately assigned A120 if A00 allocates it.

## 5. Exact A50 test commands / negative and positive scenarios

**A50 environment gate:** Node22 / pnpm10 / real full detached checkout and frozen dependencies on **PR53 HEAD**, no PostgreSQL needed. No promised results without this environment. Commands to run in an authorized trusted executor:

```bash
git fetch origin fix/web-005/t080-s2a-private-auth-query-cache-r13
git switch --detach 6a8f0c3e5775eb056df75ebdd7b33df7cbc78979
git rev-parse HEAD
node --version
pnpm --version
pnpm install --frozen-lockfile
cd artifacts/tournament-manager
export TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json"
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-auth.test.tsx
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/lib/tournament-auth-query-cache.test.tsx ./src/lib/tournament-query-invalidation.test.ts
pnpm typecheck
```

**Targeted additional negative cases (new test fixture required; not claimed to exist or pass):**

| ID | Fixture and action | Expected fail-closed result |
|---|---|---|
| N1 | Synthetic A=7 canonical URL GET + A tuple bans + A match-picks mid=701; seed B=8 public canonical + B match-picks. Remove A organizer token. | All owner-A auth-dependent cached payloads removed; public/independently authorized B unchanged. Current PR53 **source-predicted mismatch** for both tuples; collect real verdict. |
| N2 | A viewer/support/organizer token expires or is replaced; GET of A bans/picks yields actual mock **403**; generic synthetic 401 in separate case. | Old A cache must not remain after denied private response. No blanket logout of unrelated roles on an ordinary 403; preserve legal B session. |
| N3 | Pending active `enabled:true` A bans and picks GET; logout/route change before late unabortable A response resolves; also test abortable variant. | No old private A data rendered or reinserted post logout, no automatic stale request with old auth header. Existing PR53 observer test uses `enabled:false` and only a URL key. |
| N4 | Match 701 belongs A=7, but caller on B=8 attempts to attribute it to B; unknown/orphan match; IDs 7 vs 70. | Owner check fails closed; no A/B data confusion or global cache wipe. |
| N5 | Existing `use-tournament-auth.test.tsx` two cases with actual AuthProvider context, including expired support and delayed A response arriving after navigation to B. | Preserve legitimate support login and reject cross-tournament session pickup. Record actual provider error if old fixture fails. |
| P1 | Public B GET after A logout; legal current viewer (private_online) and support/organizer (private_offline), valid B picks. | Authorized reads continue; B remains in cache; no refetch storm or accidental global purge. |
| P2 | Current organizer A remains logged in and changes unrelated cache entry; legitimate picks mutate/refetch. | Correct match tenant and invalidation, no overeviction or broken edit. |

Test output must include exact HEAD, Node/pnpm versions, command/cwd, test count and TAP, exit, skipped cases and bounded synthetic data. A60 must review **after** any A100 code movement on its exact new HEAD.

## 6. Backend dependencies — independent PR44/46/49 peer status

| PR | Exact immutable HEAD | Source-reviewed protection | Still unproven |
|---|---|---|---|
| [#44](https://github.com/C8LyNn/aplikacja-turnieje/pull/44) | `2f0187b7242681c394c09058b5ef647667206bd6` | `access-policy.ts` organizer `organizerCredentialFingerprint` compared after tournament lock, support `support_sessions` row-lock and passwordVersion; bans/game-picks transaction. Optional actor compatibility path `if (!actor) return` demands caller inventory; no proven public bypass. | Physical PG16 queued credential revocation: 403 and **zero protected writes**, positive 200, wrong-tenant actor and lock ordering. |
| [#46](https://github.com/C8LyNn/aplikacja-turnieje/pull/46) | `7f60849e389a7ed35fdd39dd5493c4c4c267d860` | `routes/tournaments.ts` DELETE locks tournament row and re-verifies original signed organizer token before cascade. | PG16 revoked queued DELETE 403, no cascade, legal current organizer 204 and expected cascades, wrong-tenant and deadlock. |
| [#49](https://github.com/C8LyNn/aplikacja-turnieje/pull/49) | `99298b81501c3e7764d653604923522a19b9f05c` | `routes/auth.ts` locked organizer revalidation on four support/viewer password/visibility operations. | PG16 old credential 403/no writes, current organizer positive, viewer-password private_online 409 parity, legacy response `SUPPORT_SESSION_EXPIRED` naming owner policy. |

These PRs are **independent, not integrated with PR53 or one another**; backend GET permissions in `3 are from the common release base, not proof of a combined app runtime. No source patch changed their HEAD from A30 R15. A50 PG16 work requires isolated dedicated database, safe schema `tm_test_*`, approved DB reset; absent this, `BLOCKED` not PASS. A60 exact-head acceptance stays conditional as in signed R15 matrix.

## 7. Full QA and disposition

- PR53 source changed files: `artifacts/tournament-manager/src/context/auth-context.tsx`, `src/lib/tournament-query-invalidation.ts`, `src/lib/tournament-auth-query-cache.test.tsx` + 2 old R13 docs (five total). App blobs reviewed: `8916545544d55fc8d7fbd146d0328e36543bebb7`, `1d4365963192646dd918675a65f4496913f2873f`, `ec4b98ae6d7d6860176f65d4c7945557f983ddbb`. Nine authored tests ≠ nine executed PASS.
- A30 R17 tests run: **0**. Source-only GitHub readback, no local checkout, no paid CI, no DB, no browser, no external secrets. `EXIT=N/A`.
- A30 security verdict: **SOURCE_FAIL for PR53 FULL privacy scope** (two noncanonical gaps). Partial canonical URL cache implementation acknowledged; **no** production exploit/visible leak proved.
- A60 R15 signed prior source FAIL remains valid on **same** PR53 SHA. A60 R17 addendum and native tests **pending**, not self-approved.
- Current conditional R17 A100 code lane: only A100/PR53, original S2B narrow scope; A30 cannot implement or grant GO. If A100 changes PR53, re-review new HEAD before any SOURCE_ACCEPTED.
- **GO:** A50 targeted isolated frontend and positive/negative tests; A60 independent exact-SHA QA; A00 R16 provenance, exclusive A100 scope and owner executable environment.
- **STOP:** code by A30, rebase/cherry-pick/merge, deployment, prod/DDL, unapproved paid CI, extra PR, SWARM-006. No release acceptance from this report.

**SIGNED A30 SECURITY PEER — R17:** `SOURCE_GAP_CONFIRMED / R16_ARTIFACTS_UNAVAILABLE / PR53_UNCHANGED_AT_REVIEW / S2B_MATCH_TENANT_REQUIRED / A60_R15_SOURCE_FAIL_FULL_PRIVACY / APP_RUNTIME_NOT_EXECUTED / NEXT_A100+A50+A60→A00 / RELEASE_NO_GO / SWARM006_HOLD`.


---

## 8. LATE R17 DELTA — supersedes the initial PR53 HEAD checkpoint above

**Re-review timestamp:** 2026-10-14 Europe/Warsaw, immediately after concurrent A100 R17 push. **Latest verified code HEAD:** `8f959733258aed0cab15298dd0684ca068045e6f`, OPEN/DRAFT/UNMERGED. Comparison to initial `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979`: **3 new commits**, test-first (two) + production cache matcher revision (one). This section is the **current A30 security peer assessment**; sections 1–7 document the **earlier observed state** and remain historical evidence, not the new HEAD verdict.

### R17 actual changed file/provenance

- `artifacts/tournament-manager/src/hooks/use-tournament-auth.test.tsx` now blob `9367462da601b7a6b39e6b825984a27fae12cf16`: original `AuthProvider` fixture is correctly nested in `QueryClientProvider` with an isolated fresh `QueryClient` per test and cleared afterward. The former structural wrapper source blocker **is corrected in source**, but its two legitimate support-session tests remain **NOT_EXECUTED**.
- `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` now blob `d11dc19728c7ce0211d515df03b5182f1e6bfea9`: **six new test declarations** after the prior 9 scenario count, covering A logout and bans/owned picks versus B, 403 on bans and picks, late non-abortable picks response, unknown owner retained, 7/70 strict scope. **15 authored scenarios overall**, NOT 15 executed PASS.
- `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts` now blob `626d31eb5b82d38c171f091f07990e00069de4ad`: S2B code now recognizes exact `["tournaments",tid,"player-bans"]`, maps tuple denial to tid, snapshots owned match IDs **before** evicting the authoritative URL match list, removes only `["matches",mid,"game-picks"]` entries whose owner it can confirm, and resolves denied match picks through a unique owner in cached tournament-scoped match lists.
- Production `auth-context.tsx` blob `8916545544d55fc8d7fbd146d0328e36543bebb7` and Deadlock hook `deadlock-bans-picks.ts` blob `480cbf83e705e3ece91d9ae13635314b80fa47ac` remain unchanged.

### A30 positive source assessment: scoped improvement, not final acceptance

1. **Ban scope now SOURCE_CONFIRMED covered:** tuple length/type/exact tournamentId equality; strict positive integer extraction; 7 ≠ 70. URL-prefix path remains.
2. **Match owner lookup now SOURCE_CONFIRMED guarded:** `ownedCachedMatchIds(queryClient,tid)` reads `getListMatchesQueryKey(tid)` and accepts a match only when `record.id` is positive safe integer **and** `record.tournamentId === tid`. Actual release `GET /tournaments/:id/matches` applies `checkViewerReadAuth` before returning DB results, and `mapMatch(m)` spreads the original match including `tournamentId`; this is a source-grounded possible ownership provenance, not mere equality of numeric match IDs.
3. **No blanket wipe:** unknown/conflicting ownership returns no attribution. The successful known-owner path snapshots IDs before cancel/remove, which avoids losing owner evidence mid-purge. This preserves unrelated public B while a known private A is removed.
4. **Fixture repaired at SOURCE:** unlike the old R15/R16 blocker, support auth tests now mount valid QueryClientProvider, but runtime success is still unverified.

### A30 independent residual threat questions for A60 and A50

- **U1 unknown ownership is intentionally retained:** new test `S2B N2: do not purge unknown-ownership match keys` explicitly asserts unknown-tenant `["matches",701,"game-picks"]` **remains in QueryClient**. This is a safe anti-overpurge policy only if no future query, observer, route or credential can reuse/render that old protected value without renewed authorization. Current `useMatchGamePicks(matchId)` still uses **the same globally keyed cache without tournament/credential epoch**. Therefore **complete privacy after auth downgrade is not yet SOURCE_ACCEPTED**; preserve original doubt as `RESIDUAL_UNKNOWN_OWNER_REUSE_RISK / STATIC_INFERRED`. Require **active observer and route-switch** proof that orphan data cannot reappear, or design a tenant-scoped producer key/auth epoch that makes unknown legacy entries inaccessible, rather than global removal.
- **U2 ownership can expire:** cached `GET /tournaments/:id/matches` may be stale, absent, removed or never loaded when the standalone match-picks query returns 403. If absent, `tournamentIdForOwnedMatchError` cannot evict the cached picks entry. Test a 403 after parent match-list removal, cross-role switch, and match migrated/reassigned in synthetic fixtures (no live data). Do not attribute a match to wrong B.
- **U3 test suite trust boundary:** new tests seed explicit `{id:701,tournamentId:7}` as accepted ownership; independently verify a real generated API match payload carries `tournamentId` (source suggests yes via `...m`). Test conflicts (same mid present under two owners) and no auth-scoped match list rather than accepting synthetic success alone.
- **U4 active request & global headers:** original old `enabled:false` QueryObserver test is unchanged. New fixture uses `client.fetchQuery`, not a mounted active Host with `enabled:true` / forced late response. Global organizer/support/viewer token module variables remain separately updated by effects/page handlers, not synchronously cleared inside every AuthContext removal. A50 must verify outgoing post-logout header and stale UI reuse without storing/logging real secrets.
- **U5 cancellation and denial runtime:** promise-cancel/remove sequencing and the 403 notification path require actual React/TanStack execution, not source claims. **No A30 native runtime tests executed**; PR53 CI in flight at the new R17 SHA, so no success asserted.

**Revised current HEAD peer verdict:** `PATCH_REVISED / SOURCE_REVIEWED_CONDITIONAL_FOR_KNOWN_OWNER / TEST_FIXTURE_SOURCE_FIXED / UNKNOWN_OWNER_CACHE_RESIDUAL / RUNTIME_NOT_EXECUTED / A60_NEW_SHA_QA_PENDING / RELEASE_NO_GO`. Previous `SOURCE_FAIL` is the authoritative **A60 R15 verdict on the old 6a8f0c3… SHA only**; it must **not** be mechanically copied as A60 judgment of new 8f959733… HEAD. A30 suggests A60 test and reassess exact new SHA, with a targeted `U1/U2` independent privacy gate.
