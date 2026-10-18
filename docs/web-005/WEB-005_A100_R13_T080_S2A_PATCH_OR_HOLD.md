# WEB-005 — A100 R13 / T080-S2A Private Cache Isolation

**Task:** WEB-005-T080-A100-S2A-R13. **Agent:** A100 — Session Security & Private Access.  
**Wave:** R13, 2026-10-14 (Europe/Warsaw). **Mode:** CONDITIONAL GO SOURCE-CODE ONLY, L1, test-first, DRAFT PR.  
**Central authority:** docs/web-005/WEB-005_WAVE_R13_AGENT_PROMPTS.md §§0–2, blob SHA ec765236516cb63c1dd62e0e9257943ad9c9cc71.  
**Source base:** release/tournament-ops-20261013-01 @ 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7.  
**Branch:** fix/web-005/t080-s2a-private-auth-query-cache-r13, directly from that base.  
**PR:** [#53 OPEN DRAFT](https://github.com/C8LyNn/aplikacja-turnieje/pull/53), not merged.  
**Test-first commit:** 9c6d16bb5e954c7fef4b0447f27f25ed478c2b11.  
**Source/helper commits:** 993cb39609462a5851e52115c274adbac5951001, 56974a318a5cd7bf4cc18c2b0c5077871424933d; test extension 3e5e1d99287672fe6be2ae4eddc97f144ebd92de.  
**Evidence classification:** SOURCE_CONFIRMED (existing cache gap; patch diff), PATCH_PROPOSED (PR #53), STATIC_INFERRED (security impact), NOT_EXECUTED (RTL/typecheck), A30/A50/A60 PENDING, RELEASE_NO_GO.

## 1. Fixed-SHA source gap and prerequisites

Read directly at source baseline:
- artifacts/tournament-manager/src/context/auth-context.tsx, blob 3f82e72c1ad81014715258da4a78ed98cc18f64e.
- artifacts/tournament-manager/src/hooks/use-tournament-auth.ts, blob 642fc3a6f8f5c4a73d5d32c5462b74f45fc3cec0.
- artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts, blob e178c3d079dfa8ba8b86335f70fe6399d8ef9c57.
- artifacts/tournament-manager/src/App.tsx, blob ea619db272b3a065ed272b566a9512595803cd5f.

Baseline AuthProvider stores or clears organizer/support/viewer sessionStorage values and calls forceUpdate, but does not remove or reset authorized React Query entries. Baseline helper invalidateTournamentDependentQueries marks queries stale without removing their old data; this is suitable for ordinary domain mutations, NOT a security boundary. The global QueryClient is stable and wraps AuthProvider in App; default staleTime 30 seconds. Tournament-specific GETs use URL-like query keys. On 403 background refetch, React Query may retain previously authorized data. These are SOURCE_CONFIRMED source facts. A real historical user exposure is NOT asserted; UX consequence is STATIC_INFERRED pending physical RTL/browser reproduction.

Prior frozen A100 backend PRs: #44 @ 2f0187b7242681c394c09058b5ef647667206bd6, #46 @ 7f60849e389a7ed35fdd39dd5493c4c4c267d860, #49 @ 99298b81501c3e7764d653604923522a19b9f05c; all verified OPEN DRAFT, not modified.

## 2. Minimal implementation (source only)

| Changed file | Source action |
|---|---|
| artifacts/tournament-manager/src/context/auth-context.tsx | Reuse the existing QueryClientProvider context. Six organizer/support/viewer store/remove methods now remove only the affected tournament's auth-privileged cache after writing credential storage and before the forced rerender. Install one QueryCache error observer for denied GETs. Existing useVerifiedSupportSession invalidation calls removeSupSession and therefore inherits cleanup. |
| artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts | Retain ordinary domain invalidation unchanged. Add strict tournament query-key predicate (ID 7 never matches 70), ID extraction, auth-specific query cancellation followed by removeQueries, and 401/403 QueryCache error cleanup. |
| artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx | Authored React Query + React Testing Library checks for credential removal/replacement, in-flight old response, active QueryObserver, denied background refetch, public B noninterference, and key boundaries. |

**Identity isolation:** An explicit credential change cancels active queries before their cache entries are detached. Old Query instances therefore cannot fill the live cache after the credential boundary; this relies on TanStack Query cancellation/query-detachment semantics rather than a new token-identity format or a global cache purge. The cache is scoped by exact URL tournament ID. React context rerender refreshes consumers after token storage changes.

**Fail-closed after denial:** When a tournament-scoped query emits an error with status 401 or 403, its previously authorized data and related scoped tournament entries are removed, rather than left visible while refetching. The observer is not a backend token-revocation policy or an automatic global logout.

**Compatibility:** No changes to token storage type, wire format, server authorization, support TTL, digest-at-rest, organizer rotation, session persistence, public GET semantics or existing legal access; a public/authorized tournament B is not globally evicted by A's logout. Existing invalidateTournamentDependentQueries still provides ordinary mutation refresh.

## 3. Authored test matrix, no runtime claim

The new test file contains **9** generated Node/RTL test cases:
1. Exact query-key scope: tournament 7 versus 70, stages, queries, invalid identifiers.
2. Explicit organizer logout removes tournament A cache while retaining public B.
3. Organizer token A-to-B replacement evicts A-authorized cached payload.
4. A delayed, non-AbortSignal GET initiated before logout cannot re-add A payload.
5. Viewer and support credential replacement/removal purge targeted cache.
6. 401 after prior cached authorized query evicts stale private result but preserves B.
7. 403 after prior cached authorized query has same fail-closed behavior.
8. Explicit helper cancellation prevents a delayed standings query from repopulating.
9. A live React Query observer stops rendering A payload after logout, then shows B's authorized cached value on navigation without reusing A data.

No test count is a PASS count. No test environment for this agent includes a verified checkout with installed pnpm dependencies, so targeted RTL, existing regression suites, TS typecheck and browser E2E are **NOT_EXECUTED** (no actual exit codes).

### A50 test commands — permitted on verified frontend checkout, no DB needed

Run from artifacts/tournament-manager after checkout pinning the current PR #53 SHA, Node22/pnpm10 and frozen lock dependencies. Record exact checkout SHA, command, exit code, 0 skipped and logs.

```bash
TSX_TSCONFIG_PATH=./test/tsconfig.json node --import tsx --import ./test/setup-dom.mjs --test ./src/lib/tournament-auth-query-cache.test.tsx
TSX_TSCONFIG_PATH=./test/tsconfig.json node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-auth.test.tsx ./src/lib/tournament-query-invalidation.test.ts
pnpm typecheck
```

A60 independent SOURCE_ACCEPTED verdict must be tied to exact PR HEAD and a real frontend query observer test; A30 should verify privacy scope and error handling. Do not reinterpret inherited unrelated Pack19 CI matcher failures as failed S2A tests.

## 4. Explicit STOP, residual gap and escalation

**Scoped implementation only:** Query-key matching covers GETs prefixed by /api/tournaments/:id. A standalone player-ID or match-ID query without tournament identity cannot be precisely evicted from this helper without mapping it to its tournament. Likewise, local component state may contain already-derived private values. Full page-level read gates, route-switch authorization and presentation state controls require an A00-coordinated owner window, in particular tournament-detail.tsx belongs to A120 during R13. This is a **RESIDUAL SECURITY GAP / QA REVIEW REQUIRED**, not an unsupported assertion of comprehensive isolation.

**Do not implement silently:** Switching auth on an unrelated current tournament, 403 semantics beyond current fail-closed cache removal, support TTL, password rotation or token hashing/storage. A00/HQ owns any policy change. A100 made no changes to routes, stage panel, tournament-detail, SQL, backend or PR #44/#46/#49.

**Rollback:** close Draft PR #53/abandon branch; release remains unchanged. No schema migration or state migration. Revert only after later authorized integration by designated team; A100 does not merge.

**Next action:** A50 actual frontend-only RTL/typecheck on pinned SHA, A30 security source review, A60 independent exact-SHA verification, A00 record partial cache coverage and decide whether the unscoped-key/page-view residual needs a separate owner-approved window. SWARM-006 remains HOLD.

**VERDICT:** PATCH_PROPOSED / TESTS_NOT_EXECUTED / INDEPENDENT_QA_PENDING / POLICY_UNCHANGED / RELEASE_NO_GO.
