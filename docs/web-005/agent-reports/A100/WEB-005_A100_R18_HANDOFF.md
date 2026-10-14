# WEB-005 — A100 R18 handoff to coordinator 00

**Agent / task:** A100 — Session Security & Private Access; `WEB-005-T080-A100-S2B-R18`.  
**Mode:** R18 source-code-only L2 on A100's existing PR #53; **test-first; no new PR; no integration**.  
**R18 authority:** central R18 §§0–2 + A100, GitHub master prompt blob `fd08cedcbd2db3222e4a444403180414d1666f6c`.  
**Date:** 2026-10-14 Europe/Warsaw.  
**Source base:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` (unchanged).  
**Existing PR:** [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) on `fix/web-005/t080-s2a-private-auth-query-cache-r13`, OPEN DRAFT/unmerged.  
**Old HEAD (R17):** `8f959733258aed0cab15298dd0684ca068045e6f`.  
**Current HEAD (R18):** `8710f7fe5946d7f62e366303a97722d4201fc96b`.  
**Technical report:** [WEB-005_A100_R18_PR53_FULL_SCOPE_OR_HOLD.md](./WEB-005_A100_R18_PR53_FULL_SCOPE_OR_HOLD.md), documentation update commit `3702dd2487f26bd69a5c50b4ca5b3d474d68455f`.  
**Pre-write scope declaration:** [PR53 A100 R18 comment](https://github.com/C8LyNn/aplikacja-turnieje/pull/53#issuecomment-6176943153).

## Exact changed files (old R17 HEAD → current R18 HEAD)

1. `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` (+116/-1): **7 newly authored R18 test instances** (including 401 and 403 parameterization), after existing 15 R13+R17. Now **22 authored cache test cases**; also two unchanged support-hook tests remain in separate test file. Test-first initial commit `f400590b13e9b260232e822f7ea88fba7ea1224a`.
2. `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts` (+60/-7): export `getVerifiedMatchTournamentOwner(queryClient,matchId)`; validate successful canonical `/api/tournaments/:tid/matches` list and its `{id,tournamentId}` DTO, refuse mismatched or ambiguous attribution; use durable query metadata on logout/401/403 even after canonical list disappears; fallback to R17 cached-list proof only for older entries. First implementation `fe381689c9ec20eadfe6312dda83b5c1f57328be`, hardening `3947508b70a5125a0d1b194be4bec4927740d382`.
3. `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts` (+12/-2): `useMatchGamePicks` attaches `meta.web005VerifiedTournamentId` to its match-only query **at creation/fetch-time** using verified owner; if owner cannot be proved, the hook uses an inert disabled placeholder and does not issue an unowned private GET. Implementation `f304e32882692697d0bbf0e7f6b3482fa4c381b1`.

All above changes remain within A100 R18 declared ownership. **No changes** to TournamentHost/detail, auth context, backend auth routes, migrations, prior #44/#46/#49, or other agents' branches. No new implementation PR.

## Independent exact-SHA evidence

- **A60 R17, prior HEAD:** [independent R17 report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_INDEPENDENT_QA.md) at OLD HEAD `8f959733...` gave `SOURCE_ACCEPTED_CONDITIONAL_KNOWN_OWNER_ONLY / SOURCE_BLOCKED_FULL_PRIVACY_UNKNOWN_OWNER`. Its acceptance **does not roll forward** to R18 source SHA. A30 security peer also remains pending for this SHA.
- **R18 author status:** `PATCH_REVISED / SOURCE_CONFIRMED_IMPLEMENTATION / NEW_SHA_A60_PENDING`. No author self-certification.
- **Actual native RTL/typecheck:** `NOT_EXECUTED`. A100 environment: Node v22.16.0 available; no `pnpm`, full pinned checkout or frozen frontend dependencies. **No test command/exit or TAP count** is presented as performed. A50 must execute on trusted checkout.
- **Automatic exact-HEAD CI:** [GitHub Actions 38627584615](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38627584615), job `116070657303`, ended `failure` at inherited **Pack19** source regex `readOnly:true` vs actual `accessMode:"read only"`; later steps skipped. It is **not an R18 feature test FAIL/PASS**. Existing fix isolated in PR35. No paid manual CI rerun.
- **A50 R17** [receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R17_RECEIPT.md): zero native app tests on earlier HEAD; same operational prerequisite for R18.

## Specific acceptance expectations and risk

A50 to pin `8710f7fe5946d7f62e366303a97722d4201fc96b`, run `tournament-auth-query-cache.test.tsx`, existing `use-tournament-auth.test.tsx` and `pnpm typecheck` on full Node22/pnpm10 checkout. Show real stdout/TAP/skips/exits. Check: owner A=7 matchId 701 and B=8 matchId 801; successful canonical list proof; owner meta retained after list removal; 401 and 403 evict only A; late enabled non-abortable response cannot refill A; B public cache remains; unknown/mismatched/ambiguous attribution prevents fetch; 7 vs 70 strict; prior bans and support regression intact. Exact commands and setup in technical report.

**Residual (must be evaluated, not concealed):** a **legacy untagged match-only cache record**, with neither metadata nor canonical match-list proof, cannot be safely linked to a tournament for eviction. The new built-in hook will not fetch/display it when ownership is unknown, but old raw QueryClient entries can remain and possible re-exposure after ownership list reappears is not runtime-tested. Only A30/A60/owner can decide a separately owned safe migration mechanism or a formal waiver. Module-global active auth headers and component-local derived private state likewise require own owner-scoped review, not implicit A100 changes.

**POLICY_OPEN:** session TTL/digest/rotation, historical untagged private cache migration/owner waiver. No change to backend policy. No claimed real production exploit.

## Instructions to A00 / final disposition

A00 to collect **A30 source privacy peer**, **A50 native frontend evidence**, then **A60 independent exact-new-HEAD verdict** and determine remaining legacy-orphan/HQ signoff. A00 can request explicit `HANDOFF WITH RUNTIME TEST DEBT` from owner/HQ for eventual one-time SWARM-006 package only after formal backlog closure. A100 is not authorized to dispatch it. Full release tests remain **STOP** until executed by future authorized executor/integrator.

**Final A100 status:** `PATCH_REVISED / R18_SOURCE_DELIVERED / 22_CACHE_TESTS_AUTHORED_NOT_EXECUTED / A30_A50_A60_PENDING / LEGACY_UNTAGGED_OWNER_HOLD / RELEASE_NO_GO / NO_MERGE / SWARM006_HOLD`.
