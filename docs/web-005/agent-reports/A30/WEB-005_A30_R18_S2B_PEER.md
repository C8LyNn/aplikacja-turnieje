# WEB-005 — A30 R18 Security Peer: S2B match ownership, negative security contracts

**Date:** 2026-10-14 (Europe/Warsaw)  
**Agent / task:** A30 Security Implementation · WEB-005-T030-T031-A30-R18  
**Assignment:** [R18.1 central instructions](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R18_AGENT_PROMPTS.md), blob `fd08cedcbd2db3222e4a444403180414d1666f6c`, ``0–`2 / AGENT A30  
**Mode:** STRICT SOURCE-ONLY / independent *security peer*, **not** A60 independent release QA, **not** A100 code implementer  
**Release base:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`  
**Evidence taxonomy:** `SOURCE_CONFIRMED`, `SOURCE_REVIEWED_CONDITIONAL`, `STATIC_INFERRED`, `HYPOTHESIS`, `PATCH_REVISED`, `SOURCE_ACCEPTED` (A60 only), `RUNTIME_VERIFIED` (actual test report only), `NOT_EXECUTED`, `POLICY_OPEN`.

## 1. Frozen review anchors and historical QA

| Scope | PR | Live HEAD verified R18 intake | GitHub state / A60 R17 source verdict |
|---|---|---|---|
| P03 Steam catalog | [#34](https://github.com/C8LyNn/aplikacja-turnieje/pull/34) | `fae2eea2f22df3f1b02ad035a7db00bc411ea73f` | OPEN/DRAFT/UNMERGED; `SOURCE_ACCEPTED_CONDITIONAL`, policy 403/503 and HTTP/PG pending |
| P04 proxy hardening | [#37](https://github.com/C8LyNn/aplikacja-turnieje/pull/37) | `fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7` | OPEN/DRAFT/UNMERGED; `SOURCE_ACCEPTED_CONDITIONAL`, HTTP/XFF and proxy topology pending |
| P11 S1A post-lock auth | [#44](https://github.com/C8LyNn/aplikacja-turnieje/pull/44) | `2f0187b7242681c394c09058b5ef647667206bd6` | OPEN/DRAFT/UNMERGED; `SOURCE_ACCEPTED_CONDITIONAL`, PG16 race pending |
| P13 S1B-D deletion | [#46](https://github.com/C8LyNn/aplikacja-turnieje/pull/46) | `7f60849e389a7ed35fdd39dd5493c4c4c267d860` | OPEN/DRAFT/UNMERGED; `SOURCE_ACCEPTED_CONDITIONAL`, PG16 cascade pending |
| P16 S1B-P passwords | [#49](https://github.com/C8LyNn/aplikacja-turnieje/pull/49) | `99298b81501c3e7764d653604923522a19b9f05c` | OPEN/DRAFT/UNMERGED; `SOURCE_ACCEPTED_CONDITIONAL`, PG16 operations pending |
| P20 S2A/S2B cache | [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) | **`8f959733258aed0cab15298dd0684ca068045e6f`** | OPEN/DRAFT/UNMERGED; A60 R17 `SOURCE_ACCEPTED_CONDITIONAL_KNOWN_OWNER_ONLY / SOURCE_BLOCKED_FULL_PRIVACY_UNKNOWN_OWNER` |

All six remained on the same release base at intake. A100 **R18** new patch not present at this inspection; **old/new code SHA for this A30 action**: `8f959733… → 8f959733…` (zero A30 application changes). If A100 advances the PR, this report is only a pinned older-SHA peer contract until an addendum independently inspects **the new actual SHA**. A60 R17 [signed report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_INDEPENDENT_QA.md), [signed 21-packet matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_PACKAGE_MATRIX.json). Historical A30 [R17 peer](https://github.com/C8LyNn/aplikacja-turnieje/blob/bed32dbd6936060a9bf01b2e3510788ebe528455/docs/web-005/agent-reports/A30/WEB-005_A30_R17_S2B_SECURITY.md) contains the original scope evidence.

## 2. PR53 SOURCE: exact privacy gap and sound narrow fix

**Code blobs at `8f959733…`:**

- `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts` blob `480cbf83e705e3ece91d9ae13635314b80fa47ac`: `getPlayerBansQueryKey(tid) = ["tournaments", tid, "player-bans"]`; `getMatchGamePicksQueryKey(mid) = ["matches", mid, "game-picks"]`. `useMatchGamePicks(matchId)` creates the latter with `staleTime: 10_000` and **no tournament ID/auth epoch**, and `useSetMatchGamePick` invalidates precisely that same key.
- `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts` blob `626d31eb5b82d38c171f091f07990e00069de4ad`: matches tuple bans and canonical URL prefix; `ownedCachedMatchIds(queryClient,tid)` infers picks owner **only** from `getListMatchesQueryKey(tid)` cached match data containing an explicit valid `{id, tournamentId: tid}`; `removeTournamentAuthQueries` snapshots this before cancel/remove; 401/403 match-picks errors attempt unique owner lookup across cached lists. No global `["matches"]` purge.
- `artifacts/tournament-manager/src/context/auth-context.tsx` blob `8916545544d55fc8d7fbd146d0328e36543bebb7`: organizer/support/viewer store/remove evicts scoped cache, plus denial subscriber.
- `artifacts/tournament-manager/src/hooks/use-tournament-auth.test.tsx` blob `9367462da601b7a6b39e6b825984a27fae12cf16` fixes QueryClientProvider fixture.
- `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` blob `d11dc19728c7ce0211d515df03b5182f1e6bfea9`: 15 authored scenarios (9 prior + 6 R17), **no executed TAP/exit receipt**.

**SOURCE_CONFIRMED limited positive:** while a valid authoritative match-list response is retained in React Query, the implementation recognizes the private match as belonging to A and removes only owner-A picks; bans tuple also covered. Release API `GET /tournaments/:id/matches` checks `requireTournamentRead` before selection, and `mapMatch` preserves `tournamentId` in `...m`. This is a defensible source of *verified ownership*, unlike using a match ID as a surrogate.

**SOURCE_CONFIRMED remaining blocker:** if the canonical tournament match list is **missing/evicted/not fetched** while `["matches",mid,"game-picks"]` already contains privileged picks, neither owner discovery nor eviction can identify its tenant. The R17 test **explicitly expects this unknown-owner value to remain**. The same globally keyed hook can read that key again without an attached auth/tournament identity; that is a **source-backed stale cache reuse hazard**, not an observed cross-user display or a proven production exploit. A60's R17 `SOURCE_BLOCKED_FULL_PRIVACY_UNKNOWN_OWNER` is therefore correct on this pinned SHA.

**Front-end lifecycle nuance:** the Host's `usePlayerBans(id)` and `useMatchGamePicks(focusedMatchId)` have `enabled` conditions based on game/focus, but neither explicitly includes `isAuthReady`. There are other page auth gates, so user-visible leakage is `STATIC_INFERRED / NOT_OBSERVED`, not `RUNTIME_VERIFIED`. Similarly the module-global organizer/support/viewer API-client token state is not synchronously reset by all AuthContext token storage methods; this is a source-level header-lifecycle concern requiring A50 capture, not a proven transmitted stale token.

## 3. R18 A100 scoped source acceptance contract — no A30 code GO

A100 alone owns R18 PR53. Its **authorized narrow goal** is to make each private game-picks query attributable to a *verified tournament at fetch/creation time*, and to evict owner-A data on credential change/revocation/denied 401/403 **even if the canonical match-list cache disappears**.

A30 will only recommend conditional A60 acceptance if ALL these source checks hold:

1. **Trusted owner provenance before private request:** use current authenticated/authorized tournament-scoped match DTO `tournamentId` from a verified list or a server-provided scoped match DTO. Do not infer from numerical matching, query-key string prefix of match ID, user-controlled response value unverified against context, or a role label alone. If ownership cannot be established, fail closed: do not create an unscoped private read that can leave reusable data behind.
2. **Consumer, producer, mutation parity:** change `useMatchGamePicks` query production **and** `useSetMatchGamePick` invalidation/readback, and update Host caller contracts as required, inside A100's explicitly reserved files. Possible implementation: composite key `["tournaments",tid,"matches",mid,"game-picks"]` after verifying match membership; or per-query typed `meta: {authScope:"tournament",tournamentId: tid}` established at hook creation. Do not merely patch the central cache matcher while retaining an orphan-prone global key. If a required file belongs to A120/PR54 or another agent, ask A00 for exclusive hunk ownership first.
3. **Old-key compatibility/fail-close:** old `["matches",mid,"game-picks"]` entries must be made nonreusable after role/tenant switch (and evicted only if attributable). Don't silently expose them through a legacy hook fallback, and don't replace targeted scoping with `queryClient.clear()` or all-matches eviction.
4. **Session/auth lifecycle:** organizer, support, viewer logout or role/password change must invalidate owner-A query keys **before** a new authorization epoch can render them; delayed/uncancellable old replies cannot repopulate or rehydrate the new scope. Avoid relying only on an API 403 when authorized data was already cached.
5. **Tenant isolation:** unrelated public B and independently authorized private B remain cached/readable; neither A's 403 nor A logout revokes all roles or removes all match keys.
6. **No product choices:** do not set TTL, switch cookie/token storage, change support session persistence, change Steam missing-secret response, invent new global logout policy, backend write/change, or modify another PR without fresh GO. If real owner provenance needs a broad redesign, `HOLD / OWNER_DECISION_REQUIRED` with bounded alternative, not a fake fix.

**Important implementation-proof caveat:** typed query metadata is safe only when placed by the *producer* for that exact match/tenant/auth context; a metadata tag inferred later from a now-missing URL list is not fetch-time provenance. For ambiguous duplicates/conflicting owner assertions: reject attribution, do not reassign private A to public B. Track credential/auth epoch or ensure fresh authorization before reusing queries across role changes. Exact R18 A100 patch source must be re-inspected after push.

## 4. Negative and positive A50 / A60 tests (do not claim EXECUTED)

| ID | Scenario | Required bounded proof |
|---|---|---|
| S2B-N01 | Standalone game-picks query **created when canonical match-list cache was absent**, with trusted owner available separately; logout A. | Query carries A owner at creation/fetch; A picks are removed; no reliance on cached list at eviction time. |
| S2B-N02 | Fetch picks under A=7, remove canonical `/api/tournaments/7/matches` query, revoke organizer/support/viewer or force actual mock **403** from picks endpoint. | A picks removed despite loss of match-list cache; B=8 public picks preserved. 401 simulated separately; don't falsely claim the privacy route uses 401. |
| S2B-N03 | In-flight private A fetch `enabled:true`, logout/swap token A→B or A role downgrade, resolve old promise late **without honoring abort**. | Old A data never reappears in QueryClient or rendered Host/detail; B is not purged. Include abortable counterpart. |
| S2B-N04 | Unknown owner, conflicting owners for same match ID, orphan match, tournament IDs 7/70, forged match DTO with mismatched tournamentId. | Fail closed **before protected private fetch**; no cache reuse and no speculative purge of B. |
| S2B-N05 | Existing legacy unscoped `["matches",701,"game-picks"]` seeded with `PRIVATE_A_ONLY`, change from A to B, mount new A/B observer. | Old value must not render or be resurrected; explicitly test legacy migration/removal if present. |
| S2B-N06 | Organizer/support/viewer credential remove and replace on the same tournament; capture outgoing headers on next request, include delayed support verify from prior tournament. | No stale active organizer/support/viewer header crossing scope; valid support session still authenticates correctly. |
| S2B-N07 | 403 on private_online viewer-required and private_offline organizer/support-required for real bans/picks requests. | No privileged old cache remains; correct 403/404 semantics; ordinary role denial doesn't unilaterally sign out lawful B. |
| S2B-P01 | Legitimate viewer private_online, organizer/support private_offline, lawful game picks and bans changes. | Existing authorized read/update/invalidation still works; no false negative due to new composite key. |
| S2B-P02 | Anonymous public_online B, valid B match, A logout and failed 403. | Public B query data and the B view remain intact. |
| S2B-P03 | Run existing `use-tournament-auth.test.tsx` support tests under QueryClientProvider and PR53 cache tests. | No support session regression; commands, counts, true exits and 0 skipped recorded. |

**A50 exact-shell commands (after A00 grants an executable full clean checkout; target SHA must be substituted with actual newly verified A100 HEAD, not old hardcoding):**

```bash
git fetch origin fix/web-005/t080-s2a-private-auth-query-cache-r13
git switch --detach <EXACT_NEW_PR53_SHA>
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

If no new A100 SHA is delivered, run the current `8f959733…` tests strictly as a **baseline to reproduce failure**, not as a full fix acceptance. Ensure auth and owner synthetic fixtures are isolated; no real credentials, paid CI reruns, or shared/prod DB. **A50 R17 evidence:** [actual R17 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R17_RECEIPT.md): real application commands = **0**, test exits = N/A due to missing runnable checkout/pnpm, not an app FAIL.

**A60 review gate:** sign the **new exact PR53 SHA**, inspect complete diff and runtime evidence separately; demand an explicit result for N01–N05 even if tests are not executable; qualify `SOURCE_ACCEPTED` narrowly or `SOURCE_BLOCKED`. A30 only provides the threat model/peer review; it does not self-certify A60 QA.

## 5. Bounded regression recheck — security PR #34 / #37 / #44 / #46 / #49

No changes to their HEAD or affected scopes at R18 intake; no broad reimplementation. Original source constraints retain their A60 R17 **conditional** acceptance; targeted negative/positive gates remain:

| PR | Source anchor | Negative/positive requirement; additional blocker |
|---|---|---|
| #34 / P03 | Guard blob `feff5ff50443f40ae8f3e51ebe4f34b524ad2638`; three guarded routes in `routes/steam-game-catalog.ts` blob `b637a4530b352c1b127a8129569a0108f81a3f75` | Three mutations `POST taxonomy`, `POST import`, `PUT classification` **must** deny missing/bad admin with **zero DB writes and zero Steam upstream requests**, including valid organizer/support/viewer who lacks separate admin token. Public GET games/taxonomy remain accessible. Missing/short env secret currently returns 503; wrong token returns 403; owner `STEAM_403_503_POLICY_OPEN`. Positive correct independent admin writes. |
| #37 / P04 | Request-source blob `aa57e6bcf713a164ad63e7918eb44c81fef1be92`; lock blob `df9b656ed118dfe3df2752c10553f83795ff02cd`; workspace overrides blob `5f3fb75908b46fab375dce2f892bb9c3b049baf6` | `proxy-addr@2.0.8` pinned in override + lock; trust proxy false if unconfigured; reject IPv4 CIDR /0,/1,/7, IPv6 /0,/1,/15, mapped prefix below /104, malformed/empty CSV; actual Express/Supertest spoofed XFF/XFH/XFP must not alter req.ip/HMAC limiter bucket from untrusted socket. Positive trusted loopback/narrow v4/v6/mapped chain, nearest-untrusted hop. Real deployment proxy topology not independently proven. |
| #44 / P11 | `access-policy.ts` on exact HEAD uses organizer credential fingerprint and support row/password version under transaction lock | Revoked organizer/support requests queued behind tournament lock must return 403 with zero protected write; valid current credentials perform bans/game picks. Inspect optional `if (!actor) return` path only with caller inventory, do not assert public exploit without trace. Real PG16 lock-wait barrier required. |
| #46 / P13 | `routes/tournaments.ts` rechecks original organizer signature against locked passwordHash before DELETE | Revoked/foreign viewer/support/anonymous must never cascade; current authorized organizer 204 atomic deletion, subsequent 404, induced DB error rollback, concurrent credential rotation 403. Require physical isolated PG16. |
| #49 / P16 | `routes/auth.ts` `revalidateLockedOrganizer` within lock for four password/visibility mutations | Revoked queued organizer 403 and zero protected credential/audit writes; legal current organizer 200; removing viewer password in private_online still 409; no secrets in logs. `SUPPORT_SESSION_EXPIRED` code used for organizer revocation is a compatibility/wording question; do not change without owner. |

**API A50 commands / test suite names** (each on its **own exact PR HEAD**, frozen deps, disposable PG16 only when owner/A20 approves isolated URL/schema/reset):

- `#34`: `test/steam-catalog-access.test.ts`, `test/steam-catalog-admin-middleware.test.ts`, `test/steam-catalog-admin.integration.test.ts`.
- `#37`: `test/request-source.test.ts` (Express/Supertest, no DB for base tests).
- `#44`: `test/session-revocation-race.integration.test.ts`.
- `#46`: `test/tournament-delete-revocation.integration.test.ts`.
- `#49`: `test/auth-organizer-revocation-r12.integration.test.ts`.

Template from root, after pinning detached exact SHA and `pnpm install --frozen-lockfile`:

```bash
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/<EXACT_SUITE>.ts
pnpm --filter @workspace/api-server typecheck
```

**CI note:** current per-PR Actions historically reach locked install and SE unit, then fail the **preceding Pack19 matcher** from release; target positive/negative security runtime is not certified by these runs. PR35 independently owns that fix, not integrated into these isolated branches. Do not turn this failure into a claim that the S2B/Steam/proxy patches themselves failed; similarly, do not infer PASS.

## 6. Handoff, policy and release boundary

**Required A00/HQ policies outstanding:** Steam missing-secret `403/503`, auth absolute/idle session expiry, hashed support token at rest, organizer rotation/revocation/logout and legacy strategy. Other cross-swarm sporting/backup/CAS policy signoffs belong to other agents; A30 does not choose them.

**WEB-005 R18 global handoff rule:** source blockers must be repaired and independently signed on exact SHA **or** separately accepted by owner as an exception. Physical native per-PR tests must run **or** owner/HQ must separately authorize documented `RUNTIME_DEBT_TO_SWARM006` (which leaves composite runtime tests as a hard release STOP). Only after completed accepted backlog + 21 PR manifest + signed policy/disposition ledger can owner/HQ issue `FINAL_HANDOFF_GO`. No interim SWARM-006 package.

**A30 tests executed in R18:** `0`. Environment `GitHub API readback only`; local React/Node/PostgreSQL test command `NOT_EXECUTED`; runtime exit `N/A`. **A30 changes to application:** none. R18 source report is not a full application release signoff.

**Signed A30 peer verdict on exact old/source HEAD at R18 intake:**  
`PR53_SOURCE_BLOCKED_UNKNOWN_OWNER / SOURCE_ACCEPTED_KNOWN_OWNER_ONLY_BY_A60_R17 / NEW_A100_R18_SHA_NOT_YET_PUBLISHED / RUNTIME_NOT_EXECUTED / A50_PENDING / A60_NEW_SHA_PENDING / STEAM_PROXY_AUTH_CONDITIONAL / OWNER_POLICIES_OPEN / RELEASE_NO_GO / SWARM006_HOLD`.


---

## 7. LIVE R18 A100 AMENDMENT CHECKPOINT (supersedes original PR53 SHA snapshot)

**New A100 PR53 exact HEAD observed:** `fe381689c9ec20eadfe6312dda83b5c1f57328be` (OPEN/DRAFT/UNMERGED), **two R18 commits** versus R17 `8f959733258aed0cab15298dd0684ca068045e6f`. This is **in-progress implementation**, not an independently accepted fully secured source patch.

**R18 diff at this checkpoint:**
- `f400590b13e9b260232e822f7ea88fba7ea1224a`: adds five test-first `R18` scenarios to `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx`. New test blob `6357e6af447f12c9f73c6b613c3f51cfa718a2e6`; prior 15 scenario instances plus five = **20 authored test scenario instances**, **0 executed by A30**.
- `fe381689c9ec20eadfe6312dda83b5c1f57328be`: modifies `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts`, blob `59319a93b9fcc709f3438a36bdb1a42c6b57f10f`: introduces `getVerifiedMatchTournamentOwner(queryClient, matchId)` scanning **successful** cached tournament-scoped canonical match-list queries and requiring exact `record.id===matchId && record.tournamentId===tid`, returning null on ambiguous ownership; adds `web005VerifiedTournamentId` typed query metadata acceptance for owner-A eviction and 401/403 failure after list loss; preserves legacy cached-list fallback and selective B retention.
- **Critical omitted production change at observed HEAD:** `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts` blob **UNCHANGED** `480cbf83e705e3ece91d9ae13635314b80fa47ac`. Its actual `useMatchGamePicks(matchId)` hook does **not call** `getVerifiedMatchTournamentOwner`, does **not** attach `meta: { web005VerifiedTournamentId: tid }`, and still constructs/reads tenant-free `["matches",mid,"game-picks"]`. The test `"R18: hook persists verified A match owner metadata..."` cannot be counted PASS; it **appears source-predicted to fail** until a corresponding hook change lands. The test `"unverified and ambiguously attributed matches cannot issue or display picks"` likewise requires hook fail-closed behavior absent from current production.
- Metadata helper may only trust metadata set by the producing authenticated hook after unique server DTO ownership proof. Metadata manually injected in a unit test proves only the *consumer* path, not real query production; A60 must demand an integration of both halves and exact-SHA Test PASS.

**R18 A30 current peer verdict on observed HEAD `fe381689…`:**  
`PATCH_PARTIAL / META_EVICTION_SOURCE_PRESENT / FETCH_TIME_PRODUCER_ABSENT / SOURCE_BLOCKED_FULL_PRIVACY / TESTS_AUTHORED_NOT_EXECUTED / A60_NEW_SHA_PENDING / RELEASE_NO_GO`.

**Remaining A100 checklist:** finish the separately authorized hook-scoped owner proof, ensure unknown/ambiguous ownership cannot fetch or return previously cached match data; preserve valid B/public, mutation invalidation, denied 403 and late response cleanup; re-run A50 targeted tests on **newer pinned HEAD** in a real executor. If no safe way to attach ownership within authorized file scope, stop and request `OWNER_DECISION_REQUIRED` rather than claim full repair. This newer checkpoint **supersedes** the R17 HEAD statement in sections 1–6 but does not retroactively alter A60 R17's verdict.


---

## 8. LIVE R18 A100 SOURCE IMPLEMENTATION CHECKPOINT (supersedes section 7 partial SHA)

**New exact PR53 HEAD:** `3947508b70a5125a0d1b194be4bec4927740d382` (OPEN / DRAFT / UNMERGED), two commits since `fe381689c9ec20eadfe6312dda83b5c1f57328be`:

- `f304e32882692697d0bbf0e7f6b3482fa4c381b1` — hook-side fetch-time owner attribution;
- `3947508b70a5125a0d1b194be4bec4927740d382` — strict match-picks key validator for metadata eviction.

**Source blobs:**
- `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts` blob `59fbc215607fd82f55dc5af6d938310cc9f2ef69`: `useMatchGamePicks` now calls `getVerifiedMatchTournamentOwner(queryClient,matchId)`. If no unique proven owner, it uses disabled key `["matches",0,"game-picks"]` and `enabled:false`; if proof present, it attaches `meta.web005VerifiedTournamentId=owner` **at useQuery creation**. This addresses the previously omitted producing-hook change. `useSetMatchGamePick` still invalidates the original match-ID key; mutation/positive parity must be tested.
- `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts` blob `955409d1456f13f3f291215712a1afcf322ad094`: metadata-aware owner eviction and denied 401/403 lookup persists; `isGamePicksQueryKey` now verifies exact three-element key, positive safe integer match ID and literal `game-picks` before accepting query meta. The fallback from cached authorized tournament match list remains scoped; no global match purge.
- `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` blob `6357e6af447f12c9f73c6b613c3f51cfa718a2e6`: five new R18 tests added on top of 15 earlier authored scenarios, including owner metadata at hook creation, 403 after canonical list removal, delayed response after removal, fail-closed unknown/ambiguous match and mismatched DTO. **Authored, NOT_EXECUTED**.

**A30 source-positive conditional assessment:** \`FETCH_TIME_OWNER_METADATA_PRESENT / UNATTRIBUTED_FETCH_DISABLED / OWNER_A_EVICTION_AND_403_HANDLER_PRESENT / BOUNDARY_EXACT_MATCH_KEY / NO_BROAD_PURGE\`. This corrects the previous section 7 PRODUCER_ABSENT blocker; do NOT carry the intermediate `fe381…` verdict forward as the latest state.

**Two outstanding independent QA/security questions:**

1. **Legacy untagged key upgrade / credential epoch.** When a stale older `["matches",mid,"game-picks"]` cache entry survives a credential downgrade because its canonical match-list owner was absent, a *subsequent valid* owner list for the same match can cause the new hook to reuse **that same match-only query key**. The query is then supplied new meta, but the old data might already be visible before a fresh authorized GET (`staleTime=10_000`) unless old entry was removed or session/role epoch changes the key. **This is `STATIC_INFERRED`, not a demonstrated UI disclosure.** A50/A60 require a synthetic sequence: seed orphan cached PRIVATE_A_ONLY under old key → remove A token with owner list absent → authenticate limited role/other context → introduce a valid scoped match list → mount active enabled:true hook → verify no old value renders before authorized re-fetch. Reusing the same global match key solely after adding owner meta is not automatically equivalent to credential-epoch isolation.
2. **Current-view/owner correspondence:** `getVerifiedMatchTournamentOwner` scans all **successful cached** tournament match lists, without receiving current Host `tournamentId` as a parameter. A unique cached A match may be attributed to A even when the Host is navigating B or its A auth has just been revoked, if an old successful list survives. Check exact route/Host match membership, A→B navigation and auth readiness; ensure fetch never uses credentials from wrong tenant. No actual cross-tenant exploit is claimed.

**Additional gates:** actively mounted `enabled:true` observer with late unabortable A response; negative 403 when parent canonical list deleted; stale module-global API token headers; no accidental removal of valid B, public GET unchanged; legal supported support/organizer viewer flows; final exact-SHA TypeScript + RTL TAP/exit. Existing authored tests do not cover the full legacy-epoch scenario by themselves. Owner/HQ policy on token expiry/rotation is distinct.

**Updated A30 peer status on `3947508b…`:**  
`PATCH_REVISED / SOURCE_REVIEWED_CONDITIONAL_FETCH_OWNER_PRESENT / RESIDUAL_LEGACY_KEY_EPOCH_REUSE_STATIC_INFERRED / WRONG_VIEW_CONTEXT_HYPOTHESIS / A50_RTL_NOT_EXECUTED / A60_NEW_SHA_PENDING / RELEASE_NO_GO`.

**Important:** A60 R17's independent `SOURCE_BLOCKED_FULL_PRIVACY_UNKNOWN_OWNER` was on **`8f959733…`**. It is historic, not a valid independent verdict for this latest `3947508b…`; A60 must review and sign the changed source. A30 cannot self-promote to SOURCE_ACCEPTED.


---

## 9. LATEST R18 TEST-ONLY DELTA (supersedes section 8 pinned HEAD for tests)

**New observed PR53 HEAD:** `62fbdfae556e9dc48d40e00708a2954611c782d5`, OPEN/DRAFT/UNMERGED. Comparison from `3947508b70a5125a0d1b194be4bec4927740d382` = **two further TEST-ONLY commits**:

- `4b0e293dcb9e4d752f9fbe45913d7fbc66b1dc19` — adds an **enabled:true real useMatchGamePicks hook** with delayed mocked fetch, verifies owner metadata on active query and no late A cache repopulation after canonical A match-list removal and logout.
- `62fbdfae556e9dc48d40e00708a2954611c782d5` — parameterizes metadata-owned denied-fetch assertions for **401 and 403**.
- Only `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` changed in this delta, new Git blob `3a1f8f19d6b71e3aacd2e5b2fef971b5756da033`. Production blobs remain `59fbc215607fd82f55dc5af6d938310cc9f2ef69` (Deadlock hooks) and `955409d1456f13f3f291215712a1afcf322ad094` (cache invalidation) from `3947508b…`.

**A30 appraisal:** positive for **test coverage breadth**, but `AUTHORED_TESTS_NOT_RUNTIME_PASS`. A50 must independently execute with exact SHA/TAP/exit; A60 must independently confirm this exact source. The credential-epoch/legacy preexisting cache issue (section 8, U1) and wrong-view cached tenant (section 8, U2) remain **targeted acceptance questions**, not claimed exploited. The new real enabled hook test covers one late response, but not all orphan legacy cache rehydration paths.

**Current reviewed security peer disposition on `62fbdfae…`:**  
`PATCH_REVISED / FETCH_TIME_OWNER_PRESENT / META_EVICTION_SOURCE_PRESENT / ENABLED_FETCH_LATE_RESPONSE_TEST_AUTHORED / DENIED_401_403_TESTS_AUTHORED / LEGACY_EPOCH_QA_REQUIRED / A50_NATIVE_NOT_EXECUTED / A60_R18_PENDING / RELEASE_NO_GO`.


---

## 10. FINAL R18 PR53 exact HEAD security peer checkpoint

**Reviewed PR53 HEAD:** `8710f7fe5946d7f62e366303a97722d4201fc96b`, OPEN/DRAFT/UNMERGED. One R18 **test-only** commit after `62fbdfae556e9dc48d40e00708a2954611c782d5`, changing only `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` (blob `37f7a9923e9081b4fd4340f1833790f9abd28813`). New test mounts the `useAuth` and `useMatchGamePicks` hooks inside **one AuthProvider observer** for the enabled pending HTTP response/logout regression. It does not change production code.

**Cumulative PR53 delta compared with A60 R17 `8f959733258aed0cab15298dd0684ca068045e6f`: seven R18 commits** in the **same PR53 branch**, changing the Deadlock hooks, cache invalidation and S2B tests. Production blobs remain `59fbc215607fd82f55dc5af6d938310cc9f2ef69` (hook-side owner proof and metadata; unowned fetch disabled) and `955409d1456f13f3f291215712a1afcf322ad094` (scoped metadata-owner eviction on logout and 401/403 with fallback). The exact R18 HEAD has **no independent A60 R18 acceptance at this checkpoint** and no A50 native frontend exit.

**A30 SOURCE_REVIEWED_CONDITIONAL** for the current implementation: verified match→tournament proof comes from successful, scoped canonical match-list response at hook creation; query metadata survives deletion of that parent list; no guess based on numeric match ID; unknown or conflicting owner disables private picks GET; no global A/B eviction. Negative authored tests now include active enabled pending fetch, denied 401/403, unknown/ambiguous owners, strict 7/70 and preservation of B. **Authored ≠ executed.**

**Still require explicit independent QA decisions:** (a) seed a legacy untagged `["matches",mid,"game-picks"]` with PRIVATE_A_ONLY when no cached parent list exists; change roles/credentials, then establish a valid owner list and mount the hook. The same match-ID-only key could yield that old cached data before authorization-epoch freshness is proven (`STATIC_INFERRED`, not measured). (b) unique cached owner A selected while a Host for B is active; prove current page/tenant and header-scoped authorization is not confused. Include legitimate public B, support/private_offline and active real UI observer. These are test acceptance risks, not asserted production exploits.

**Current R18 peer disposition:** `PATCH_REVISED / SOURCE_REVIEWED_CONDITIONAL_FETCH_OWNER / LEGACY_AUTH_EPOCH_RISK_STATIC_INFERRED / A50_APP_TESTS_NOT_EXECUTED / A60_NEW_EXACT_SHA_PENDING / RELEASE_NO_GO / SWARM006_HOLD`. No application code commits by A30. Another A100 HEAD requires new QA.
