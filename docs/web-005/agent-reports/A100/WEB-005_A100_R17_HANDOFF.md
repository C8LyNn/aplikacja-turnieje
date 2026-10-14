# WEB-005_A100_R17_HANDOFF

**AGENT:** A100 — Session Security & Private Access. **TASK:** `WEB-005-T080-A100-S2B-R17`. **MODE:** CONDITIONAL GO on existing PR #53 only, L3. **Date:** 2026-10-14 Europe/Warsaw.

**Central R17 authority:** `docs/web-005/WEB-005_WAVE_R17_AGENT_PROMPTS.md` SHA `c2dd8c1e2e2e3b5e245db61877da99f59c77a0ff` §§0–2 and AGENT A100.
**R16 recovery:** [WEB-005_A100_R16_RECOVERY_STATUS_R17.md](./WEB-005_A100_R16_RECOVERY_STATUS_R17.md) at commit `9d7ecda6fa2d01888ee6b760c7310c705a152f05`. **R16_ARTIFACTS_UNAVAILABLE**: original A100 R16 report/exact executable tests/source patch were not verified on GitHub; this is a newly published R17 audit note, not the original R16 deliverable.
**R17 technical report:** [WEB-005_A100_R17_PR53_S2B_RESULT.md](./WEB-005_A100_R17_PR53_S2B_RESULT.md), initial report commit `b75144e44703172c189a18975b2d454a36f15450`.

**Existing PR:** [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53), `fix/web-005/t080-s2a-private-auth-query-cache-r13`, base release `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, old head `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979`, **new R17 head `8f959733258aed0cab15298dd0684ca068045e6f`**. OPEN/DRAFT/unmerged. **NO NEW PR**.

## Work completed (source only)

Three PR53 code/test commits, test-first:
- `ca407975ea2af8cdce117497c04072975e8650f5` — six S2B negative/positive React Query test definitions in `src/lib/tournament-auth-query-cache.test.tsx`.
- `cbe2abc42622be6d7cbd36c7dbae4b7c447b1f48` — fix existing `src/hooks/use-tournament-auth.test.tsx` QueryClientProvider wrapper and isolate per-test client; retain both original support auth cases.
- `8f959733258aed0cab15298dd0684ca068045e6f` — `src/lib/tournament-query-invalidation.ts` exact `['tournaments', tid, 'player-bans']` cache matching + denied 401/403; only known `['matches', matchId, 'game-picks']` whose `matchId` is positively bound to same `tournamentId` via current cached canonical `getListMatchesQueryKey(tid)` data. Owned set captured before canonical cache removal. B cache preserved; no global matches purge.

**Source review:** real Deadlock tuple hooks `deadlock-bans-picks.ts` blob `480cbf83e705e3ece91d9ae13635314b80fa47ac`, server `GET player-bans` and `GET match game-picks` both protected by tournament read auth. Original A60 R15 independent judgment is `SOURCE_FAIL_FULL_PRIVACY_SCOPE; SOURCE_ACCEPTED_URL_PREFIX_ONLY` at OLD PR53 SHA, not an acceptance of this R17 revision.

**Exact current coverage:** N1 bans on logout, token swap and denied GET by typed tournament tuple. N2 match picks on logout/denial/late completion **ONLY when cached, explicit `{id, tournamentId}` match list proves ownership**. No cached list/ambiguous mapping → `OWNERSHIP_UNPROVEN`, match-only key is intentionally not globally removed: outstanding privacy dependency. N3 test fixture repaired. Other private cache key types/component-local state and module-level global auth headers not claimed fixed.

## Tests, blockers, QA

**9** authored R13 cache test cases + **6** new R17 cache test cases = **15 authored**, plus original two support auth tests preserved. **0 actually executed** in A100 session. Environment checked: Node v22.16.0 exists, `pnpm` missing, no full checkout/frozen dependencies in container, no verified isolated PG16 (frontend-only tests require none). Exact executable A50 commands and required logs in technical report. GitHub PR53 historical workflow run 38606179795 ended at old Pack19 matcher and did not exercise R17 HEAD.

**Independent QA:** A30 security peer, A50 native Node22/pnpm10 React RTL/typecheck, A60 exact HEAD new `SOURCE_ACCEPTED / FAIL` all PENDING. No author self-signoff and no final package runtime PASS.

## STOP / policy

No edits to other agents' files, backend PR44/46/49, `tournament-host.tsx`, PR54, auth token TTL/digest/rotation policy, matchId numeric inference, global `queryClient.clear()`, another implementation PR, merge/rebase/cherry-pick, paid CI rerun, prod/shared SQL, staging/live, release or SWARM-006.

**Next coordinator 00 action:** A50 test exact `8f959733258aed0cab15298dd0684ca068045e6f` with full checkout, report TAP/count/exits; A30 review match ownership and stale header risk; A60 independently assess revised exact SHA and partial/full security claim. If match-picks cache lacks proven ownership in a real view, issue a separate exclusive file-window for validated metadata or record HOLD; do not silently broaden PR53.

**FINAL STATUS:** `PATCH_REVISED / R16_ARTIFACTS_UNAVAILABLE / RUNTIME_NOT_EXECUTED / N2_PARTIAL_OWNERSHIP / QA_PENDING / RELEASE_NO_GO`.
