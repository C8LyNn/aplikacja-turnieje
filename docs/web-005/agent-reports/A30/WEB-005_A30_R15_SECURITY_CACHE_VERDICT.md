# WEB-005 — A30 R15 / SECURITY CACHE VERDICT

**Project:** WEB-005 · **Agent:** A30 — Security Implementation (peer) · **Task:** WEB-005-T030-T031-A30-R13  
**Wave:** R15 · **Date:** 2026-10-14 (Europe/Warsaw) · **Mode:** READ ONLY / SOURCE SECURITY QA  
**Authority:** [R15.1 central instructions](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R15_AGENT_PROMPTS.md), blob \`e6950cbff7e521ed9b3ff774e7787e8d598a966d\`, §§0–§2 and AGENT A30.  
**Release base:** \`release/tournament-ops-20261013-01\` @ \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`.  
**Peer sign-off:** A30, **SOURCE_GAP_CONFIRMED / PATCH_PROPOSED / RUNTIME_NOT_EXECUTED / A60_INDEPENDENT_ACCEPTANCE_PENDING / RELEASE_NO_GO**. This is an A30 security recommendation, **not** an A60 SOURCE_ACCEPTED signature or formal approval to merge.

## 1. Exact GitHub review anchors

| Packet | PR | HEAD SHA | State | Security scope |
|---|---|---|---|---|
| P03 | [#34](https://github.com/C8LyNn/aplikacja-turnieje/pull/34) | \`fae2eea2f22df3f1b02ad035a7db00bc411ea73f\` | OPEN DRAFT, not merged | Steam write authorization |
| P04 | [#37](https://github.com/C8LyNn/aplikacja-turnieje/pull/37) | \`fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7\` | OPEN DRAFT, not merged | trusted proxy CIDRs / proxy-addr |
| P11 | [#44](https://github.com/C8LyNn/aplikacja-turnieje/pull/44) | \`2f0187b7242681c394c09058b5ef647667206bd6\` | OPEN DRAFT, not merged | S1A post-lock bans/game picks |
| P13 | [#46](https://github.com/C8LyNn/aplikacja-turnieje/pull/46) | \`7f60849e389a7ed35fdd39dd5493c4c4c267d860\` | OPEN DRAFT, not merged | S1B-D tournament DELETE |
| P16 | [#49](https://github.com/C8LyNn/aplikacja-turnieje/pull/49) | \`99298b81501c3e7764d653604923522a19b9f05c\` | OPEN DRAFT, not merged | S1B-P password/visibility |
| P20 | [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) | \`6a8f0c3e5775eb056df75ebdd7b33df7cbc78979\` | OPEN DRAFT, not merged | S2A credential-dependent cache |

All six source branches remain separate, based on the **same** release commit. No composite code SHA; no approved merge/deploy. Current PR reviews did not provide A60 exact-SHA source acceptance for these packages at this readback.

## 2. Independent S2A source finding: exact keys, owners and renderers

**S2B-R01 — P1 / SOURCE_GAP_CONFIRMED — custom tournament ban key.**

- Source \`artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts\` at release, blob \`480cbf83e705e3ece91d9ae13635314b80fa47ac\`, lines ~34–53:
  \`getPlayerBansQueryKey(tournamentId) = ["tournaments", tournamentId, "player-bans"]\`; \`usePlayerBans\` sends GET \`/api/tournaments/:id/player-bans\`.
- Actual hook consumers: \`src/pages/tournament-detail.tsx\` lines ~185–191 (bans displayed via \`PlayerBansRow\` around 1180 and passed to \`StageProgressView\` around 1468), and \`src/pages/tournament-host.tsx\` lines ~151–152.
- PR53 \`src/lib/tournament-query-invalidation.ts\` blob \`1d4365963192646dd918675a65f4496913f2873f\` checks \`queryKey[0]\` is a URL string starting \`/api/tournaments/<id>\`. Thus this tuple cannot be selected for credential-change eviction or associated with a denied 401/403.
- The source-level cache-key mismatch **is confirmed**. Whether a stale value actually renders after logout is **STATIC_INFERRED**; no browser/RTL result was observed by A30.

**S2B-R02 — P1 / SOURCE_GAP_CONFIRMED — match-only picks without tournament owner.**

- Same Deadlock helper, lines ~37–38 and ~87–101: \`getMatchGamePicksQueryKey(matchId) = ["matches", matchId, "game-picks"]\`; \`useMatchGamePicks\` GETs \`/api/matches/:id/game-picks\`.
- Actual consumer: \`src/pages/tournament-host.tsx\` lines ~330–345, where \`focusedMatchPicks\` feed the currently focused match and bracket hero-pick presentation (also used in the page near lines ~1042/1105/1173).
- Query key contains **neither a URL-prefixed tournament ID nor any explicit ownership metadata**, so PR53 cannot evict it on tournament A credential changes, and a 401/403 QueryCache error cannot be mapped to its tournament by the existing parser.
- It is **not safe** to guess tournament ownership from \`matchId\`, or to remove every cached match across all tournaments. The mismatch is SOURCE_CONFIRMED, actual visible disclosure remains STATIC_INFERRED.

**S2B-Q01 — P0 QA compatibility / SOURCE_CONFIRMED mismatch, runtime FAIL unproven.**

- Baseline \`src/hooks/use-tournament-auth.test.tsx\` blob \`2b1f7433b478de5dbb60459a9460055079d8b9b1\` wraps only \`<AuthProvider>\`.
- PR53 \`src/context/auth-context.tsx\` blob \`8916545544d55fc8d7fbd146d0328e36543bebb7\` now calls \`useQueryClient()\`, requiring \`QueryClientProvider\` above the provider.
- Existing test fixture is therefore structurally incompatible; it **may throw at execution**, but no exit code or targeted reproduction is available. A50 must run it before labeling FAIL.

**Bounded hypotheses, not independent tickets:** \`tournament-detail.tsx\` contains edit-player, ban editor, CSV/import preview state not owned by React Query (requires A120/page-state review). A generated match detail URL query key may also be non-tournament-prefixed, but an actively used private component for that generated hook was **not established**. No general production exploit is claimed.

## 3. Actual server read policy — do not conflate cache retention with API bypass

Release \`artifacts/api-server/src/routes/tournaments.ts\`:
- GET \`/tournaments/:id/player-bans\` (~3134) calls \`checkViewerReadAuth\` **before** its SELECT.
- GET \`/matches/:id/game-picks\` (~3210) first resolves the match's \`tournamentId\`, then calls \`checkViewerReadAuth\` **before** the picks SELECT; unknown match returns **404**.
- \`checkViewerReadAuth\` delegates to \`requireTournamentRead\` in \`src/access-policy.ts\` (~190 onward).
- \`public_online\`: anonymous read allowed; \`private_online\`: organizer/support/viewer allowed; \`private_offline\`: organizer/support only. Private visibility denial returns **403** (\`VIEWER_PASSWORD_REQUIRED\` or \`PRIVATE_OFFLINE\`), not an observed 401 at these endpoints. Other app pathways might use 401; PR53 listener handles both 401 and 403 if a **matched** key emits an error.
- Current evidence identifies a **frontend cache eviction coverage bug**, not a proven backend unauthorized-GET bypass. Any request-level exploit claim requires separate safe proof and is **not made here**.

## 4. Safe S2B technical recommendation — design only, no implementation GO

**Preferred scoped approach:** make every auth-dependent query own a verified \`tournamentId\`, via a canonical query-key namespace **and/or** typed TanStack \`query.meta\` with a trustworthy owner supplied at hook creation.

1. Bans may retain tuple \`["tournaments", tournamentId, "player-bans"]\`; extend \`removeTournamentAuthQueries\` / denied-refetch ownership resolution to match its tuple **exactly**, with validated positive integer ID. Maintain the old URL prefix coverage and strict 7-vs-70 boundaries.
2. For match picks, pass the page's current tournament ID to \`useMatchGamePicks\` only after ensuring the focused \`matchId\` belongs to that tournament's authoritative loaded match list (or to trusted server-provided ownership). A possible canonical key is \`["tournaments", tournamentId, "matches", matchId, "game-picks"]\`. Keep \`useSetMatchGamePick\` invalidation aligned. Without reliable ownership, **disable the protected read** rather than assign an arbitrary tenant. Backend continues to enforce its own authorization.
3. A \`meta: { authScope: "tournament", tournamentId }\` alternative may help central eviction, but \`meta\` MUST be present on all query producers and verified; it must not silently retroactively bless legacy \`["matches",matchId,...]\` entries. Define a bounded compatibility strategy for old keyed cache entries and no cross-tenant reuse.
4. On token removal/rotation or 401/403, **cancel and remove every owner-A auth-dependent key**, including custom keys; ensure late uncancellable promises cannot repopulate it. Preserve unrelated public tournament B and any independently authenticated private B. Avoid \`queryClient.clear()\` or global \`["matches"]\` deletion.
5. Test module-global API-client credential header reset/scope separately: \`AuthProvider\` currently removes stored credentials and cache without universally clearing \`setActiveOrganizerToken\`/\`setActiveSupportToken\`/\`setActiveViewerToken\`; page-specific handlers sometimes do so. This is a **source-confirmed coverage distinction**, not a proven header leak.

**Owner decision:** The keyed privacy bug and provider fixture are implementation/QA defects, not reasons to invent a product policy. A100 S2B code may begin **only** after A60 independent source confirmation or A50 reproducible FAIL **AND** distinct A00 \`R15-S2B-CODE-GO\` with exclusive file/hunk reservation. A00/HQ still owns session TTL, support token digest-at-rest, organizer password rotation, logout semantics and Steam missing-secret 403/503 policy; do not choose these silently.

## 5. A50 deterministic negative / positive fixture matrix (NOT EXECUTED)

Use **synthetic values only** (e.g. \`BAN_A_ONLY\`, \`PICK_A_ONLY\`, \`PUBLIC_B\`) and distinct test identities; never print raw credentials.

| ID | Setup / action | Expected assertion |
|---|---|---|
| S2-01 | QueryClient has URL \`/api/tournaments/7\`, tuple \`["tournaments",7,"player-bans"]\`, match picks key of verified match of 7, and public \`/api/tournaments/8\`. Store then remove organizer A. | **All** A cache entries removed, public B unchanged. Existing PR53 is SOURCE-PREDICTED to fail for both tuple keys; actual test exit required. |
| S2-02 | Organizer A→new credential A, viewer replacement, support revocation/removal, same exact keys. | Old identity's A data removed prior to rendering the new identity; B unaffected. |
| S2-03 | Authenticated A GET later denied **403** for private_online viewer-required or private_offline organizer-required; seed previous tuple responses. Include simulated **401** separately as generic client error. | No old protected tuple value remains; real server's 403 code is recorded, 401 is not claimed as actual for these endpoints. |
| S2-04 | Delay a started A bans/picks request, revoke/change A auth, then resolve old result after B/new A role becomes active. | Old response cannot rehydrate or render A private data; abortable and unabortable cases. |
| S2-05 | Try wrong match→tournament ownership / unknown owner and tournament IDs 7 vs 70. | No accidental B cache eviction, no reuse of private A match value; fail closed on unknown ownership. |
| S2-06 | Mount **enabled:true** active QueryObserver and actual page Host/detail with A data, log out, navigate A→B. | Page gate hides unauthorized data, no retained A hero bans/picks/drafts exposed under B; normal public B works. |
| S2-07 | Run old \`use-tournament-auth.test.tsx\` against PR53 \`AuthProvider\` wrapper missing QueryClientProvider. | Record actual fixture outcome; no unsupported preemptive FAIL. |
| S2-08 | Capture synthetic outgoing requests immediately after each logout/revocation. | No stale \`x-organizer-token\`, \`x-support-token\`, \`x-viewer-token\` attached to requests outside their authorized tenant/session. |

**A50 runnable existing suite at PR53 HEAD (Node22/pnpm10, full checkout, frozen deps; no DB):**
\`\`\`bash
git fetch origin fix/web-005/t080-s2a-private-auth-query-cache-r13
git switch --detach 6a8f0c3e5775eb056df75ebdd7b33df7cbc78979
git rev-parse HEAD
node --version
pnpm --version
pnpm install --frozen-lockfile
cd artifacts/tournament-manager
export TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json"
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/lib/tournament-auth-query-cache.test.tsx
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-auth.test.tsx ./src/lib/tournament-query-invalidation.test.ts
pnpm typecheck
\`\`\`
For S2-01–S2-06 and S2-08, A50 first prepares a disposable local targeted fixture; test creation is **not** permission for A30 code modifications or a new implementation PR. Require exact test command, checksum/HEAD, counts, exit, environment, no secrets. A60 must independently review the pinned source and result.

## 6. Other security PRs — source-only A60/A50 acceptance matrix

| Package | Source result on pinned HEAD | Negative controls | Positive controls | Pending |
|---|---|---|---|---|
| #34 Steam | Three protected mutators: POST taxonomy, POST import, PUT classification. Middleware precedes SQL and Steam upstream. Public GET remains. | 403 anonymous, viewer, **real authenticated support**, organizer, bad catalog admin; 503 missing/short server secret; zero full-table DB diffs and zero mocked Steam calls on denials. | Valid admin three writes; public GET 200 also on missing server secret. | Isolated PG16+HTTP, A60, owner choice 403/503. Existing test's support token is random, not authenticated support. |
| #37 proxy | \`proxy-addr@2.0.8\` in workspace override+lock; \`trust proxy=false\` default; reject unsafe CIDRs. | Reject IPv4 /0,/1,/7, IPv6 /0,/1,/15, mapped < /104, malformed CSV; XFF/XFH/XFP spoofing from untrusted peer must not change client source/HMAC limiter bucket. | Trusted loopback/explicit narrow proxy and nearest-untrusted hop, valid IP/CIDR, source fallback. | Express/Supertest + API typecheck; effective production proxy topology unverified. |
| #44 S1A | Organizer credential proof version checked after tournament lock; support session/version under lock; bans/picks writes inside transaction. | Stale queued organizer/support after revocation ->403, **zero protected-domain writes**; wrong tenant, stale match and double submit. Distinguish support lastActiveAt touch from protected write. | Valid actors can perform legal bans/picks, correct match/participant ownership and 200/422/404 parity. | PG16 race barrier; independent A60. |
| #46 S1B-D | Original organizer signed token rechecked against locked row before tournament DELETE. | Revoked queued DELETE ->403, zero cascade; wrong tenant, support/viewer, duplicate DELETE not touching other tournaments. | Authorized current organizer ->204 with correct atomic cascades; subsequent DELETE ->404. | PG16 barrier/rollback/deadlock, independent A60. |
| #49 S1B-P | Four password/visibility mutations revalidate organizer token after tournament lock. | Revoked queued or wrong-tenant organizer ->403, no credential/visibility/audit side effects; concurrent double-submit assessed. | Authorized 200 and correct password/version/audit; private_online viewer-password removal stays 409. | PG16/TypeScript, A60, organizer-facing \`SUPPORT_SESSION_EXPIRED\` wording policy open. |
| #53 S2A | URL-prefixed cache eviction implemented. | Noncanonical ban/picks tuples **missed** as source bug; 401/403, token swap, deferred GET and provider wrapper compatibility need targeted reproduction. | Unrelated public B cache untouched; legal authorized reads remain available. | A50 frontend RTL, A60 S2B evidence + A00 code GO. |

**PG16 exact-HEAD targeted suite names for A50, only if A20/A50 prove physical isolation + owner-approved schema-only reset:**
\`\`\`text
PR34: test/steam-catalog-access.test.ts
      test/steam-catalog-admin-middleware.test.ts
      test/steam-catalog-admin.integration.test.ts
PR37: test/request-source.test.ts                    [no DB for primary suite]
PR44: test/session-revocation-race.integration.test.ts
PR46: test/tournament-delete-revocation.integration.test.ts
PR49: test/auth-organizer-revocation-r12.integration.test.ts
\`\`\`
Run each suite on **its own detached exact PR HEAD**, \`pnpm install --frozen-lockfile\`, \`pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ...\` where relevant and \`pnpm --filter @workspace/api-server typecheck\`. No shared/prod DB, no reset without safety preflight, no combined branch here.

## 7. CI evidence, blockers, disposition

- Existing GitHub Actions exact/associated runs: #34 \`38554385676\`, #37 \`38568300206\` (on earlier source SHA; final report commit skipped CI), #44 \`38591653457\`, #46 \`38595739665\`, #49 \`38600249157\`, #53 \`38606179795\`. These show successful locked installation and SE unit step followed by **FAIL at earlier Pack19 snapshot matcher**; following DB/static gates SKIPPED. They provide **no** target application runtime acceptance. PR35 has the separate Pack19 fix; do not duplicate or cherry-pick.
- A30 R15 actual application tests: **0 / NOT_EXECUTED**, no local Node/pnpm environment attestation or exit codes. The source-only comparisons above **do not count** as runtime tests. No A60 \`SOURCE_ACCEPTED\` signed on all exact PR HEADs verified in PR review readback; separate A60 document URL/exits not supplied in this task.
- Scope conflict: #44 and #46 both change \`routes/tournaments.ts\`; #49 changes \`routes/auth.ts\`; #53 changes frontend auth/cache; PR53 future S2B will coordinate with A100 and A120 on page-local state. **No composite branch/merge by A30**.
- **Peer recommendation to A60:** confirm \`S2B-R01/R02\` as independent **source FAIL for complete S2A eviction** on exact PR53 SHA, treat Q01 as predicted fixture incompatibility until executed. Require a bounded A50 result before recommending code changes. Do **not** assert a customer-impacting exploit.
- **Owner/HQ signoffs:** (i) PR34 absent-secret 403 vs 503 (existing behavior unchanged until signed); (ii) TTL/idle session expiration, hashed support tokens and organizer password rotation/logout semantics remain separate POLICY_OPEN. Scoped noncanonical cache matching/tenant ownership is principally a security correctness defect, not a product trade-off; still needs A00 strict \`R15-S2B-CODE-GO\`.
- **A00 exact next action:** route this pinned report to A50/A60; demand runnable RTL + original auth-hook fixture and A60 exact-SHA verdict; if source FAIL independently confirmed, decide narrow A100 S2B file ownership/GO. Maintain WEB-005 closeout backlog and SWARM-006 HOLD until all accepted findings dispositioned.

**SIGNED PEER RECOMMENDATION — A30:** \`PR53_SOURCE_GAP_CONFIRMED; S2B_BOUNDED_REPAIR_RECOMMENDED_AFTER_A60_AND_A00_GO; ALL_PACKAGE_RUNTIME_PENDING; RELEASE_NO_GO; SWARM006_HOLD\`.  
**Code changes/commits to application:** none. **Integration / SQL / CI rerun / PROD / REPLIT:** none.
