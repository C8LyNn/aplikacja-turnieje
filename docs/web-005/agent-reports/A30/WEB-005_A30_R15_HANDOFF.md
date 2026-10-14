# WEB-005 — A30 R15 HANDOFF TO A00

**Agent:** A30 / Security Implementation (security peer, not independent A60)  
**Task:** \`WEB-005-T030-T031-A30-R13\` · **Wave:** R15 · **Mode:** READ ONLY  
**Authority:** R15 central prompts §§0–§2 + AGENT A30, blob \`e6950cbff7e521ed9b3ff774e7787e8d598a966d\`.  
**BASE:** \`release/tournament-ops-20261013-01\` @ \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`.  
**Detailed independently authored security peer verdict:** [WEB-005_A30_R15_SECURITY_CACHE_VERDICT.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/4659664c0ae5c644969c26183980b5f06774d738/docs/web-005/agent-reports/A30/WEB-005_A30_R15_SECURITY_CACHE_VERDICT.md) — committed to central report directory in documentation-only commit \`4659664c0ae5c644969c26183980b5f06774d738\`.

## 1. Frozen reviewed PR HEADs

| PR / Packet | Exact SHA | Status / verdict |
|---|---|---|
| [#34](https://github.com/C8LyNn/aplikacja-turnieje/pull/34) / P03 Steam | \`fae2eea2f22df3f1b02ad035a7db00bc411ea73f\` | OPEN DRAFT / source write guard reviewed / runtime pending |
| [#37](https://github.com/C8LyNn/aplikacja-turnieje/pull/37) / P04 proxy | \`fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7\` | OPEN DRAFT / source CIDR and 2.0.8 reviewed / runtime pending |
| [#44](https://github.com/C8LyNn/aplikacja-turnieje/pull/44) / P11 S1A | \`2f0187b7242681c394c09058b5ef647667206bd6\` | OPEN DRAFT / post-lock actor source reviewed / PG16 pending |
| [#46](https://github.com/C8LyNn/aplikacja-turnieje/pull/46) / P13 DELETE | \`7f60849e389a7ed35fdd39dd5493c4c4c267d860\` | OPEN DRAFT / guarded DELETE source reviewed / PG16 pending |
| [#49](https://github.com/C8LyNn/aplikacja-turnieje/pull/49) / P16 password | \`99298b81501c3e7764d653604923522a19b9f05c\` | OPEN DRAFT / four guarded operations source reviewed / PG16 pending |
| [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) / P20 cache | \`6a8f0c3e5775eb056df75ebdd7b33df7cbc78979\` | OPEN DRAFT / two S2B source gaps CONFIRMED / RTL pending |

None of these is a composite merge or independently A60-SOURCE_ACCEPTED at this readback. PR53's authored tests do **not** establish runtime verification.

## 2. One bounded blocker / unblocker for A00

**BLOCKER S2B:** PR53 evicts only URL-prefixed \`/api/tournaments/:id\` React Query keys, whereas actual Deadlock queries use \`["tournaments", id, "player-bans"]\` (tournament detail **and** Host) and \`["matches", matchId, "game-picks"]\` (Host). Source mismatch and actual hook/render usage **confirmed**. User-visible data leak **STATIC_INFERRED / NOT_OBSERVED**. Server authorizes these GETs with visibility-dependent 403 before protected DB SELECT; no proven backend auth bypass.

**UNBLOCKER:** A50 runnable frontend-only PR53 exact-head RTL + existing auth-hook fixture; A60 signed exact-head source verdict for R01/R02. A00 may then issue **separate** \`R15-S2B-CODE-GO\` to A100 with explicit file ownership. No code lane is opened by this report.

**Design boundary:** ban key can be matched exactly by tournament ID. Match-only key must be tied to verified match→tournament ownership from authoritative match list/server before scoped eviction; do NOT purge all \`["matches", ...]\` globally, and do not evict authorized/public tournament B because A logged out. Scope data in query key and/or validated TanStack query metadata, including old alias cleanup and denied 401/403. Test module-global API credentials independently.

**Related QA compatibility blocker:** existing \`use-tournament-auth.test.tsx\` mounts \`AuthProvider\` without \`QueryClientProvider\`, but PR53 now uses \`useQueryClient()\`. This is SOURCE_CONFIRMED fixture mismatch, **NOT_EXECUTED**, not proven FAIL.

## 3. Required A50/A60 receipts and deterministic tests

**A50 exact commands on PR53 HEAD, no database needed:**
\`\`\`bash
git fetch origin fix/web-005/t080-s2a-private-auth-query-cache-r13
git switch --detach 6a8f0c3e5775eb056df75ebdd7b33df7cbc78979
pnpm install --frozen-lockfile
cd artifacts/tournament-manager
export TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json"
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/lib/tournament-auth-query-cache.test.tsx
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-auth.test.tsx ./src/lib/tournament-query-invalidation.test.ts
pnpm typecheck
\`\`\`
Request a disposable synthetic QueryClient fixture proving: private A canonical key + ban tuple + match-only picks key all evicted on logout/replace/401/403; public B preserved; late A response cannot rehydrate; unknown match owner fail-closed; active GET observer \`enabled:true\`; wrong tenant 7 vs 70; real 403 vs simulated 401 distinguished. Existing PR53 author tests alone do not include R01/R02. Record real Node22/pnpm10 env, SHA, exact commands, exit codes and logs.

**A60 peer matrix:** inspect source at all six exact SHA; give \`SOURCE_ACCEPTED\` or \`FAIL/BLOCKED\` **per PR**. Require positive authenticated operations and negative stale queued organizer/support writes, double submits, zero protected-domain side effects for PR44/46/49; Steam 403/503 and mocked zero upstream/DB writes for PR34; trusted/untrusted XFF/XFH/XFP and CIDR cases for PR37. PG16 tests only after A20/A50 documented physical isolation and owner-approved schema-limited reset. Do not run integration/merge tests within WEB-005.

## 4. Executed evidence and STOP

**A30 R15 application test executions:** \`0\`, **NOT_EXECUTED**, command/exit/environment \`N/A\`. This is a source-only peer review. No source or browser runtime exploit proof. Existing Actions jobs on the reviewed branches stopped at old Pack19 matcher; this does not certify feature regression nor feature PASS. Separate PR35 owns Pack19 correction; no cherry-pick in this swarm.

**Independent A60 approval:** \`PENDING / NOT_VERIFIED_BY_COORDINATOR\`; absence of linked A60 signed exact-head matrix cannot be turned into SOURCE_ACCEPTED. **A50 current actual runtime receipts:** not supplied in this handoff.

**Open owner policies:** Steam absent admin secret 403 vs 503; auth TTL / idle expiration; support token hashing/rotation; organizer password rotation and logout behavior. Bounded S2B privacy key ownership is a **code correctness issue**, not permission to choose those policies.

**Dependencies/conflicts:** #44/#46 both touch \`routes/tournaments.ts\`; #49 auth routes; #53 frontend auth/cache. A100 owns potential S2B, A120 owns page-local view/gates; A50 runs tests, A60 independently signs, A00 coordinates. No composite branch/merge or cross-agent code take-over.

**GO:** A50 safe real frontend tests; A60 independent exact-SHA QA; A00 triage / potential separate scoped GO to A100 **after** evidence.  
**STOP:** A30 code change, new implementation PR, merge/cherry-pick/rebase, shared/production DB, unauthorized paid CI, Replit, staging/live, SWARM-006.  
**NEXT OWNER:** \`A50 → A60 → A00 (conditional A100 S2B)\`.  
**RELEASE:** \`RELEASE_NO_GO\`.

**A30 peer sign-off:** \`SOURCE_GAP_CONFIRMED (PR53 R01/R02) / USER_VISIBLE_EXPLOIT_UNPROVEN / QA_FIXTURE_MISMATCH_PREDICTED / RUNTIME_NOT_EXECUTED / A60_PENDING / R15_CODE_HOLD / SWARM006_HOLD\`.
