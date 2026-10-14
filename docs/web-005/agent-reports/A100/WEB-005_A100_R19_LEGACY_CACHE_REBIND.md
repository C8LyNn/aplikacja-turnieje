# WEB-005 / A100 R19 — legacy untagged game-picks cache rebind, negative and bounded fix

**TASK:** `WEB-005-T080-A100-S2B-R19` — A100 Session Security & Private Access.  
**Authority:** `docs/web-005/WEB-005_WAVE_R19_AGENT_PROMPTS.md` blob `076b14ca7ea953c818309502cce322c7dd6a7bef`; §§0–2 and AGENT A100, conditional CODE L2 exclusively on existing PR53.  
**Date:** 2026-10-14 Europe/Warsaw.  
**Repository:** C8LyNn/aplikacja-turnieje.  
**PR:** [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53), branch `fix/web-005/t080-s2a-private-auth-query-cache-r13`, OPEN DRAFT/unmerged.  
**Base release SHA:** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**R18 frozen test baseline SHA:** `8710f7fe5946d7f62e366303a97722d4201fc96b`.  
**R19 revision HEAD:** `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34`.  
**Evidence classification:** `SOURCE_CONFIRMED_LEGACY_KEY_REUSE` / `PATCH_REVISED` / `R19_NEGATIVE_TEST_AUTHORED` / `RUNTIME_NOT_EXECUTED` / `A30_A50_A60_PENDING` / `FULL_PRIVACY_POLICY_OPEN` / `RELEASE_NO_GO`.

## 1. R18 independently verified prerequisite

Independent [A60 R18 QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md) at the **old** HEAD gave `SOURCE_ACCEPTED_SCOPED_FOR_NEW_PROVEN_OWNERSHIP` with full privacy review still OPEN, because pre-R18 query data `['matches',matchId,'game-picks']` may survive logout without owner `meta`, and later match-list restoration can rebind a new hook to that same key. A50 R18 [receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R18_RECEIPT.md) records **0 native RTL/API/PG16 application runs**. No old exact-SHA verdict applies automatically to R19.

**Independently source-confirmed rebind path (not observed browser exploitation):**
- Prior R18 `src/lib/deadlock-bans-picks.ts` blob `59fbc215607fd82f55dc5af6d938310cc9f2ef69` uses the normal tuple `getMatchGamePicksQueryKey(matchId)` **again** as soon as `getVerifiedMatchTournamentOwner(queryClient,matchId)` returns a tournament ID. The disabled `matches/0/game-picks` placeholder only applies while owner cannot be proved; it stops isolating legacy keys when the canonical list reappears.
- Prior `src/lib/tournament-query-invalidation.ts` blob `955409d1456f13f3f291215712a1afcf322ad094` leaves an old untagged orphan when neither owner `meta` nor canonical `/api/tournaments/:tid/matches` exists. It must not guess match ownership or globally clear the `matches` cache.
- Consequently the new `useQuery` with the **same key** can subscribe to retained previously authorized `data` before fresh GET authorization. This is a `SOURCE_CONFIRMED` cache identity collision and `STATIC_INFERRED` potential UI leak; **not** a production incident or a native test FAIL.

## 2. Test-first negative (one focused test with B positive and async race)

Test-first commit **`ffa9a18897863bd76b9121d093bfc82da2fedc16`** extends the existing `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` with:

`R19 legacy untagged picks cannot rebind or display old A after list recovery`

Fixture uses fictional A tournament 7, match 701, public B tournament 8 / match 801. Seed an untagged old `['matches',701,'game-picks']` with `OLD_A_SECRET` and pending non-AbortSignal old A promise; preserve B `PUBLIC_B`. Remove A canonical list; `removeOrgToken(7)` then `storeViewerToken(7,synthetic-new-viewer)`; the untagged legacy A entry remains because it had no trusted owner at the eviction point. A newly fetched canonical list proves `{id:701,tournamentId:7}`.

**Required negative assertions:** new `useMatchGamePicks(701)` returns **no** `OLD_A_SECRET` before an authorized new GET, its query uses a distinct verified-owner key carrying `meta.web005VerifiedTournamentId=7`; a deferred old A completion `OLD_A_LATE` must never populate the new observer; a fresh `NEW_AUTHORIZED` GET is the first displayed data; public B picks remain byte-for-byte intact. The same focused test finally revokes the new viewer token and checks the fresh owner-scoped query is evicted while B is preserved. The test uses a mocked synthetic fetch; **not executed**.

The test directly fails the old source semantics at the immediate `current.data===undefined` assertion if an old successful raw tuple is reused, but this is a **predicted test result** until A50 runs it.

One new literal test case was authored. Previous R18 set = **22 authored cache test instances**; R19 set = **23 authored instances**, including two parameterized doubled 401/403 contracts. Two separately authored support-auth hook cases remain. No source PASS inferred from a count.

## 3. Bounded R19 implementation on the same PR53

**Code commits (after test-first):**
- `72d268ee31e4d87072a992ae3f2bd08c0173ef4b` — `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts`. At verified hook creation inspect *exact* old raw tuple using `queryClient.getQueryCache().find({queryKey:legacyKey,exact:true})`. If an old entry exists and its `meta.web005VerifiedTournamentId` does **not** match the server-verified current owner, never reuse that cache identity. Select `['matches',matchId,'game-picks','verified-owner',verifiedTid]` for the new fetch. If no legacy mismatch exists, preserve the original triple query key, avoiding unnecessary churn in R18 valid paths.
- `1747a9a09368e9b5bf82afd9cd718bc61d4f1490` — `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts`. Extend the exact match-picks key predicate to accept either normal 3-element tuple or newly guarded 5-element `verified-owner` tuple with positive integer IDs; **both** remain recognized by logout/401/403 scoped eviction and provenance-based metadata matching. On a mismatch or ambiguous/no trusted match-list, do **not** assume any match ID equals a tournament ID; existing disabled placeholder remains.
- `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34` — focused R19 test strengthened with revocation of the newly authorized viewer identity, checking guarded key eviction while unrelated B remains.

**Exact old→new changed paths only:**
| Owned file | R19 diff |
|---|---|
| `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts` | +17/-1 |
| `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts` | +15/-7 |
| `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` | +78 |

No edits to `auth-context.tsx`, Host/Detail, generated API types, backend auth, test infrastructure, other agents' branches or PR54. No new PR, merge, composite branch or release commit.

**Scope integrity:** A known, currently verified query keeps its original key and successful R18 behavior. A legacy query without matching provenance gets a new owner-qualified query namespace, so its old cached result is not attached to the fresh observer. The new namespace stores same verified `meta` for later cancellation/eviction. Existing `useSetMatchGamePick` invalidation starts with the 3-element prefix and therefore continues to target the owner-qualified 5-element key using standard React Query prefix matching. B keys remain untouched. A match whose ownership is absent or ambiguous stays disabled and cannot fetch.

## 4. Residual risks / explicit limits (NO claim of full cache hygiene)

This correction **isolates the visible rebind path**. It does **not** remove a historical untagged orphan which has neither `meta` nor a known matching tournament list, because no tenant identity exists to safely select it. It can still remain programmatically observable to raw QueryClient consumers and must not be described as a full historical migration or global privacy wipe. If an owner/HQ requires erasure of *all* old ownerless cache records (rather than verified UI isolation), sign a limited migration/identity contract, or explicitly accept this residual `OWNER_WAIVER_REQUIRED`; A100 must not invent that policy.

Other **out-of-scope** prior A30 concerns: module-global active auth request headers, page-local derived private state, and old mixed-identity implementations. No assertion that a real production user was exposed. No backend 401/403 policy, token TTL/hash/rotation or server access rights changed.

**Important QA risk:** existing tests validate React Query behavior only when A50 physically runs them; source inspection does not prove scheduler/cancellation and nonabortable async timing. A30 should inspect that guarded queries are evicted on logout and 401/403, old raw state never enters the fresh observer, B remains unaffected, and mutation invalidation still hits the owner-qualified prefix. A60 must determine whether `SOURCE_ACCEPTED_SCOPED` or `SOURCE_BLOCKED_FULL_PRIVACY` is justified on the exact new SHA.

## 5. RUNTIME / A50 commands / owners

**Actual R19 A100 native execution:** `NOT_EXECUTED`. There is no verified full pinned frontend checkout and frozen pnpm workspace in A100's tool environment; A50's R18 authoritative receipt records unavailable native executor. No test exit/TAP or TypeScript `PASS` is claimed.

**A50 single action:** A00/HQ must provide an authorized connected test executor with clean checkout pinned to `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34`, Node22/pnpm10 and `pnpm install --frozen-lockfile` from repo root. Frontend tests require no PG16.

```bash
git rev-parse HEAD  # exact d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34
cd artifacts/tournament-manager
export TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json"
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/lib/tournament-auth-query-cache.test.tsx
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-auth.test.tsx
pnpm typecheck
```

Report exact SHA, cwd, Node/pnpm, frozen lock verification, counts, failures, zero skip, command exit, sanitised logs. Automatic baseline Pack19 CI may fail first due independent PR35 not integrated: this is **not** a substitute for targeted RTL.

**A30/A60:** independently inspect **this exact HEAD** before signoff, not the R18 verdict. A00/HQ resolves any `OWNER_WAIVER_REQUIRED` for residual historical untagged storage and final handoff policy. Existing 38 historical WEB-004 cases and all 21 PR composite readiness belong to A00/A10/A60, not A100.

**FINAL:** `R19_TEST_FIRST_PATCH_REVISED / REBIND_PREVENTION_SOURCE_CONFIRMED / LEGACY_RAW_STORAGE_RESIDUAL / RUNTIME_NOT_EXECUTED / A30_A60_PENDING / OWNER_POLICY_OPEN / RELEASE_NO_GO / SWARM006_HOLD`.
