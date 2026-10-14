# WEB-005_A100_R19_HANDOFF

**AGENT:** A100 — Session Security & Private Access  
**TASK:** `WEB-005-T080-A100-S2B-R19`  
**AUTHORIZATION:** R19 master prompt §§0–2 + A100, blob `076b14ca7ea953c818309502cce322c7dd6a7bef`. **CONDITIONAL L2** on existing draft PR53; **NO NEW PR**.  
**DATE:** 2026-10-14 Europe/Warsaw.  
**REPOSITORY:** `C8LyNn/aplikacja-turnieje`.  
**PR:** [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53), `fix/web-005/t080-s2a-private-auth-query-cache-r13`, still OPEN DRAFT/unmerged at last checked.  
**RELEASE:** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**OLD HEAD (R18):** `8710f7fe5946d7f62e366303a97722d4201fc96b`.  
**NEW HEAD (R19):** `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34`.  
**TECHNICAL REPORT:** [`WEB-005_A100_R19_LEGACY_CACHE_REBIND.md`](./WEB-005_A100_R19_LEGACY_CACHE_REBIND.md), commit `3e5ddf2b7e3863a9d40fc96f6f1430f04310850f`.

## Code / test SHA and exact owned files

**R19 test-first commit:** `ffa9a18897863bd76b9121d093bfc82da2fedc16` — `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx`. One focused negative: raw legacy untagged `['matches',701,'game-picks']` protected OLD_A data, deferred old HTTP, logout/revocation, list removal, new viewer identity, list reappears with explicit `{id:701,tournamentId:7}`. Current fresh observer **must not** show old A data; only new `NEW_AUTHORIZED` GET may display; unrelated B 801 cached value untouched. After new viewer logout, guarded A entry evicted. **No native execution**.

**R19 source commit:** `72d268ee31e4d87072a992ae3f2bd08c0173ef4b` — `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts`. On a verified owner, if the exact pre-existing legacy match-only query has missing/mismatching `meta.web005VerifiedTournamentId`, use new `['matches',mid,'game-picks','verified-owner',tid]` key rather than rebinding old raw cache. Preserve original tuple in verified fresh cases, disabled placeholder when owner unproven.

**R19 source commit:** `1747a9a09368e9b5bf82afd9cd718bc61d4f1490` — `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts`. Recognize both legacy 3-element and guarded 5-element game-picks key for scoped logout/401/403/cancellation, no global `matches` cache purge, no numeric ID guess or B eviction.

**Final R19 test hardening commit:** `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34` — extend same test with new identity removal and guarded query eviction.

**Diff R18→R19:** exactly **three** owned paths, `deadlock-bans-picks.ts` +17/-1, `tournament-query-invalidation.ts` +15/-7, `tournament-auth-query-cache.test.tsx` +78. **23 authored React Query cache cases** (previous 22 + R19 one), plus 2 existing support hook tests. `NOT_EXECUTED`, NOT PASS.

## Independent proof / QA and release gates

- [A60 R18 independent source report](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md) at **old** PR53 SHA: `SOURCE_ACCEPTED_SCOPED / FULL_PRIVACY_REVIEW_OPEN`. Author's R19 revisions must NOT be self-certified and need fresh A30/A60 exact-SHA evaluation.
- [A50 R18 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R18_RECEIPT.md): zero actual native RTL/API/PG16 tests. A100 has no verified full per-SHA checkout/frozen pnpm executor, **RUNTIME_NOT_EXECUTED**; no TAP/exit or actual browser repro. Request A00 owner action: provide one approved connected clean checkout pinned to `d1aebfc...`, Node22/pnpm10/frozen deps so A50 can execute frontend-only tests.
- **Target commands, NOT RUN**: `pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/lib/tournament-auth-query-cache.test.tsx`; same command for `./src/hooks/use-tournament-auth.test.tsx`; `pnpm typecheck`. Full commands/env in technical report. Obtain output, exit codes, 0 skip, SHA.
- GitHub Actions historically inherited separate upstream Pack19 matcher failure (own draft PR35); do not infer targeted R19 PASS/FAIL or manually rerun paid CI. Fresh CI exact-HEAD must be read and classified independently.

## Residuals, owner policy and strict STOP

**SOURCE_CONFIRMED:** old untagged entry can persist without owner and be rebound under the old query key; R19 patch uses distinct owner-qualified namespace to prevent newly authorized hook from displaying that old data. **STATIC_INFERRED** UI leakage before runtime test, not a confirmed production incident. R19 patch isolates the observed source-level UI path but does **not erase** arbitrary legacy ownerless entries from raw QueryClient; owner/HQ must decide whether bounded residual is allowed or signed migration/identity contract is required. That disposition is **OWNER_POLICY_OPEN / OWNER_WAIVER_REQUIRED** if full historical purge mandated.

**Other out-of-scope risks:** module-global active auth request headers, component-local private state, support token TTL/hash/rotation policy, other PRs and release integration. No work on PR54, PR42, PR41, backend, migrations, release/main, live/staging, no composite branch, no SWARM-006.

**Required A00 action:** deliver exact R19 HEAD and test semantics to A30 source security peer, A50 approved connected RTL/typecheck executor, A60 independent exact-SHA source QA. Resolve whether legacy ownerless persistence is accepted or needs signed migration; separately close WEB-004 38-case owner-mapped backlog, unsigned policies and final runtime debt authorization before any final-only SWARM-006 handoff. A100 does **not** grant release GO.

**FINAL:** `PATCH_REVISED / NEGATIVE_TEST_AUTHORED / LEGACY_REBIND_GUARDED_SOURCE_ONLY / 23_TESTS_AUTHORED_NOT_EXECUTED / A30_A50_A60_PENDING / OWNER_POLICY_OPEN / RELEASE_NO_GO / SWARM006_HOLD`.
