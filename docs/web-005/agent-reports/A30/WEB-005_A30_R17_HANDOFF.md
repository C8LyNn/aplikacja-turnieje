# WEB-005 — A30 R17 HANDOFF TO COORDINATOR 00

**Agent:** A30 / Security Implementation — source security peer (not A60).  
**Task:** WEB-005-T030-T031-A30-R15. **Wave:** R17. **Mode:** STRICT READ-ONLY application.  
**Control:** [R17 central task document](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R17_AGENT_PROMPTS.md), blob `c2dd8c1e2e2e3b5e245db61877da99f59c77a0ff`.  
**Release base:** `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**Full published peer evidence:** [WEB-005_A30_R17_S2B_SECURITY.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/d96e72988a8d9c8c3fc560f099176f788e546149/docs/web-005/agent-reports/A30/WEB-005_A30_R17_S2B_SECURITY.md), GitHub immutable report commit `d96e72988a8d9c8c3fc560f099176f788e546149`.

## 1. R16 actual artifact recovery — honest outcome

[WEB-005_A30_R16_STATUS.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/a65c919ec2a0365c2f044905ab8ac750f20f801a/docs/web-005/agent-reports/A30/WEB-005_A30_R16_STATUS.md) is a **retrospective absence receipt**, not R16 work. There was **no A30 R16 instruction, analysis, runtime test, QA signoff or code patch within this conversation**; control-branch R16 report absent, targeted `a30-r16` branch search found none. Status `R16_ARTIFACTS_UNAVAILABLE / NOT_EXECUTED_IN_THIS_THREAD`. Do not count this as recovered successful R16 handoff.

## 2. Pinned GitHub PRs and files

| PR | HEAD SHA | Reviewed code and conclusion |
|---|---|---|
| [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) P20 S2A | `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979` | Auth context and URL-only cache invalidation; **unchanged (0 new commits)**, SOURCE_FAIL full privacy; no R16/R17 A100 patch at this checkpoint. |
| [#44](https://github.com/C8LyNn/aplikacja-turnieje/pull/44) P11 | `2f0187b7242681c394c09058b5ef647667206bd6` | `src/access-policy.ts` / `src/routes/tournaments.ts` post-lock actor version, source conditional. |
| [#46](https://github.com/C8LyNn/aplikacja-turnieje/pull/46) P13 | `7f60849e389a7ed35fdd39dd5493c4c4c267d860` | `src/routes/tournaments.ts` locked DELETE and signed token revalidation, source conditional. |
| [#49](https://github.com/C8LyNn/aplikacja-turnieje/pull/49) P16 | `99298b81501c3e7764d653604923522a19b9f05c` | `src/routes/auth.ts` four locked organizer controls, source conditional. |
| [#34](https://github.com/C8LyNn/aplikacja-turnieje/pull/34) P03 | `fae2eea2f22df3f1b02ad035a7db00bc411ea73f` | Steam protected mutations, original scoped review retained, HTTP/PG pending. |
| [#37](https://github.com/C8LyNn/aplikacja-turnieje/pull/37) P04 | `fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7` | proxy-addr@2.0.8 and trusted CIDR guard, real Express HTTP pending. |

**All remain OPEN/DRAFT/UNMERGED** and independently based on release; no integrated SHA.

### Concrete PR53 blockers — A30 peer evidence

- `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts` blob `480cbf83e705e3ece91d9ae13635314b80fa47ac`: actual active keys `["tournaments", tid, "player-bans"]` and `["matches", mid, "game-picks"]` are **not covered** by PR53 URL-first `isTournamentAuthQuery` or `tournamentIdFromAuthQuery`. Detail and Host display bans; Host displays match picks.
- PR53 `src/lib/tournament-query-invalidation.ts` blob `1d4365963192646dd918675a65f4496913f2873f`; `src/context/auth-context.tsx` blob `8916545544d55fc8d7fbd146d0328e36543bebb7`. Confirmed cancel/remove handles canonical URL keys only. No source-confirmed fix was pushed by R17 checkpoint.
- Match-only key requires **verified match→tournament ownership**, not global purging `["matches", ...]`. Prefer tenant-scoped composite key or validated query meta with explicit compatibility plan for legacy entries, preserve other public/authorized B data.
- `src/hooks/use-tournament-auth.test.tsx` (baseline blob `2b1f7433b478de5dbb60459a9460055079d8b9b1`) mounts AuthProvider without QueryClientProvider, whereas PR53 now uses `useQueryClient()`. Structural mismatch `SOURCE_CONFIRMED`; runtime test fail **not executed**.
- Host Deadlock hook options do not directly check `isAuthReady`; verify late 403 and uncancellable fetch. Backend `requireTournamentRead` does guard both GETs before protected SELECT; for private visibility, actual denial is **403**. This is a **client stale-cache coverage issue**, not demonstrated server auth bypass or a proven UI exploit.

## 3. A50/A60 mandatory next evidence

**A50:** full authorized checkout of PR53 exact HEAD, Node22/pnpm10 frozen dependencies, run (from `artifacts/tournament-manager`):
 
```bash
export TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json"
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-auth.test.tsx
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/lib/tournament-auth-query-cache.test.tsx ./src/lib/tournament-query-invalidation.test.ts
pnpm typecheck
```

**Missing additional fixture N1/N2/N3:** seed synthetic private tournament A=7 URL + bans tuple + picks match owned by A, unrelated public B=8 canonical and picks. Simulate organizer/viewer/support logout/rotation, 403 for actual private GET, separate synthetic 401, delayed active `enabled:true` GET and unabortable completion. Demand all A sensitive data gone and B retained. Wrong/missing match→tenant mapping must fail closed; route switch 7→70 must not alias. Existing PR53 authored tests alone do **not** cover full tuples and active observer uses `enabled:false`. Check outgoing global auth headers and existing support-session success/revocation tests.

**A60:** already signed [R15 exact-head full-privacy source FAIL](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R15_INDEPENDENT_QA.md). Request R17 reassessment of **new PR53 HEAD only if A100 pushes a revision**; independently verify match owner mapping and tuple negative/positive scenarios. Do not call source-defined tests real runtime PASS. PR44/46/49 remain pending physical disposable PG16 concurrency tests and separate QA; PR34/37 need HTTP/Supertest and policy/topology gates.

**Blocked environment:** A50 R15 verified Node/Git but no complete runnable checkout + pnpm/PG16; no new actual runtime receipts linked for PR53 in this review. Actual A30 R17 app test commands: `NOT_EXECUTED`; total `0`; exit code `N/A`. Existing PR53 GitHub run `38606179795` fails historical Pack19 before target RTL; PR35 owns the prior matcher. No unapproved CI rerun.

## 4. Conditions and actions for 00

- **GO:** A100 **only** already authorized narrow conditional S2B PR53 lane after verifying no new HEAD; A50 safe targeted frontend tests with actual execution environment; A60 independent exact SHA QA; A00 triage/reconcile actual R16 publication.
- **STOP:** A30 app code changes, new PR, fourth coding lane, arbitrary global cache wipe, self QA approval, merge/cherry-pick/rebase, prod/release, SQL/DDL/shared DB, paid CI without owner GO, Replit integrator and SWARM-006.
- **Open policy:** Steam missing-secret 403/503, session TTL/idle timeout, support token hashing, organizer password rotation/logout and other high-level cross-project owner decisions. **None** are decided by A30.
- **Next owner:** `A100 (source-only S2B scoped branch if updated) → A50 actual tests → A60 independent source/runtimes → A00 closeout`. If no A100 commit, retain `SOURCE_FAIL_FULL_PRIVACY_SCOPE` and `RELEASE_NO_GO`.

**A30 R17 signed peer / coordinator handoff:** `R16_ARTIFACTS_UNAVAILABLE; PR53_SOURCE_GAP_CONFIRMED; PR53_UNCHANGED_AT_REVIEW; A60_R15_SOURCE_FAIL_FULL_PRIVACY; RUNTIME_NOT_EXECUTED; NO_APPLICATION_CODE_CHANGE; SWARM006_HOLD; RELEASE_NO_GO`.


---

## 5. FINAL R17 LIVE UPDATE — newest A100 PR53 source (supersedes original #53 row)

**Current pinned PR53 HEAD at final source review:** `8f959733258aed0cab15298dd0684ca068045e6f`, OPEN/DRAFT/UNMERGED; **old SHA** `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979` is historical R15/early-R17 evidence only. GitHub compare: **three R17 commits**, two test-first (6 new S2B test declarations and repaired legacy QueryClientProvider wrapper), one implementation change in `tournament-query-invalidation.ts`. The app has not been merged.

**Actual changed blobs on latest HEAD:**
- `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts` `626d31eb5b82d38c171f091f07990e00069de4ad` — now matches exact player-bans tuple, resolves 403 owner from ban tuple, snapshots known owned-match IDs from cached canonical tournament match list before eviction and removes only confirmed-tenant match picks; no global purge.
- `artifacts/tournament-manager/src/hooks/use-tournament-auth.test.tsx` `9367462da601b7a6b39e6b825984a27fae12cf16` — adds QueryClientProvider to existing two legal support session tests, new isolated QueryClient per test.
- `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` `d11dc19728c7ce0211d515df03b5182f1e6bfea9` — six new R17 negative cases, **15 authored scenario instances total**, NONE VERIFIED EXECUTED.

**A30 late peer verdict:** `PATCH_REVISED / SOURCE_REVIEWED_CONDITIONAL_FOR_KNOWN_OWNER / TEST_FIXTURE_SOURCE_FIXED / UNKNOWN_OWNER_CACHE_RESIDUAL / RUNTIME_NOT_EXECUTED / A60_NEW_SHA_PENDING / RELEASE_NO_GO`.

**Positive source evidence:** real backend `GET /tournaments/:id/matches` enforces `checkViewerReadAuth` and returns enriched `mapMatch(m)` with `...m` including `tournamentId`; a successful, correctly scoped cached list is an appropriate source for match→tournament ownership. The new cache matcher checks strict `record.tournamentId === tid`, unique owner, and snapshots before removing A's canonical list.

**Remaining acceptance blocker:** when no proven cached match owner exists, new code does **not** evict unscoped match-picks entries. New test explicitly expects unknown-owner picks cache retention. This avoids accidentally evicting unrelated B, but **does not demonstrate that old A picks can never be reused or rendered after logout, switch or 403**: the original `useMatchGamePicks(matchId)` hook still uses the same tenant-free key. A50/A60 must test an active `enabled:true` observer and route A→B with unknown ownership, late unabortable A response and 403 when canonical match list was removed, plus valid B. Any further fix needs A100's scoped code permission, not A30.

**Exact-head CI evidence:** automatic runs `38622961390` and `38622702008` for `8f959733...` passed locked install + SE safety unit, then FAILED at **upstream Pack19**; downstream static/database gates were SKIPPED. Neither run proves a PR53 S2B RTL PASS or FAIL. A30 still executed **0 native application tests**. A60 R15 signed full-privacy FAIL applies to the **previous** SHA only; **independent A60 verdict on 8f959733... is pending**.

**Revised full technical report (includes section 8 live delta):** [WEB-005_A30_R17_S2B_SECURITY.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/bed32dbd6936060a9bf01b2e3510788ebe528455/docs/web-005/agent-reports/A30/WEB-005_A30_R17_S2B_SECURITY.md).

**Final A00 actions:** await the A100 newest patch readback, A50 actual frontend test receipt, A60 independently signed **new HEAD** QA. Keep R16 provenance `ARTIFACTS_UNAVAILABLE`; don't treat R16/old R15 source fail as an acceptance verdict for current PR53. **NO MERGE / NO DEPLOY / NO SWARM-006.**
