# WEB-005 A100 R20 — PR53 frozen privacy QA support and legacy orphan decision

**Task:** `WEB-005-T080-A100-R20` — Session Security & Private Access (A100).  
**Authority:** central [R20 master](../../WEB-005_WAVE_R20_AGENT_PROMPTS.md), §§0–2 + AGENT A100; blob `dabf0146a08ef8488400df9268b52210662cbb63`.  
**Allowed action:** `SOURCE_ONLY / READ_ONLY_APP / DOCUMENTS_AND_QA_ORACLE`. No application/test-code change, new fix PR, merge, CI restart or SWARM-006.  
**Date:** 2026-10-14, Europe/Warsaw.  
**Repo:** `C8LyNn/aplikacja-turnieje`.  
**PR53:** [OPEN DRAFT / UNMERGED](https://github.com/C8LyNn/aplikacja-turnieje/pull/53); head `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34`; release base `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. **R19→R20 HEAD unchanged**, no A100 R20 source commit.  
**A30 R19 peer:** [WEB-005_A30_R19_SECURITY_PEER.md](../A30/WEB-005_A30_R19_SECURITY_PEER.md), blob `cda372e54440020209aef89bc3351244ce18870d`, exact new HEAD: `LEGACY_REBIND_SOURCE_RECONCILED_SCOPED / OLD_UNTAGGED_CACHE_RETENTION_REMAINS / RUNTIME_NOT_EXECUTED / A60_R19_INDEPENDENT_QA_PENDING`. It is a **security peer**, not A60 independent signoff.  
**A60:** R18 independently reviewed **old** `8710f7fe5946d7f62e366303a97722d4201fc96b` as `SOURCE_ACCEPTED_SCOPED / FULL_PRIVACY_REVIEW_OPEN`. A signed A60 **R19/R20 exact `d1aebfc...` verdict was not verified** in the inspected central A60 directory, PR53 review submissions or fetched provenance. Therefore `A60_EXACT_SHA_PENDING`, not a categorical statement about work outside accessible sources.  
**A50 R19:** [receipt](../A50/WEB-005_A50_R19_RECEIPT.md), blob `412117e31c297353b35a3c21fbd616d41754d4b6`: **0** native application tests due to absent authorized clean full checkout / pnpm10 / frozen dependencies. No frontend RTL/typecheck exit/TAP available.

## 1. Exact R19 source anchors for an independent reviewer

| Source at frozen HEAD | Blob SHA | Relevant contract |
|---|---|---|
| `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts` | `1a5404e8a0dccf12063d6efb6248c2253cafee4a` | Lines 94–127: `getVerifiedMatchTournamentOwner(client,mid)` checks proven owner; inspect exact legacy triple; missing/mismatched `meta.web005VerifiedTournamentId` selects five-element owner-qualified query; unproven owner -> disabled placeholder; `staleTime:10_000`. |
| `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts` | `e2c12c88c051f20f08474ee0dc9f877207923624` | Lines 97–128: only unique validated successful tournament match-list entry with exact `{id,tournamentId}` establishes owner; 132–149: three/five-element key predicate; 182–199: tenant-scoped cancellation + removal; 204–223: 401/403 cache denial handling, no unowned global purge. |
| `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` | `2196851691735e560b36099caa3d33ac649ccf84` | Lines 363–439: R19 test-first negative on legacy ownerless A rebind, late A promise, fresh A auth response, B preservation, revocation of fresh viewer. **23 authored cache test instances in PR53 total, NOT_EXECUTED**. |
| `artifacts/tournament-manager/src/context/auth-context.tsx` | `8916545544d55fc8d7fbd146d0328e36543bebb7` | All six organizer/support/viewer store/remove callbacks invoke scoped `removeTournamentAuthQueries`; QueryCache subscription handles 401/403. Unchanged in R19/R20. |

Source facts **do not prove physical React Query runtime behavior**. Nor do they demonstrate that historical users actually saw unauthorized data.

## 2. Test-first oracle N1 — same-match legacy ownerless rebind, A7/M701 vs public B8/M801

The already authored [R19 focused test](https://github.com/C8LyNn/aplikacja-turnieje/blob/d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34/artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx) is the **test artifact**; R20 specifies its acceptance oracle, does NOT run or alter it.

**Initial fixture**: React Query `QueryClient` and `AuthProvider` under `QueryClientProvider`. Synthetic private tournament **A=7 / M_A=701**, distinct lawful public or otherwise authorized tournament **B=8 / M_B=801** (do not infer owner from match ID). Stored organizer token = fictitious A credential only. Put **OLD_A_SECRET** in raw, ownerless `['matches',701,'game-picks']`, with **no** verified `meta` and **no** authoritative cached `/api/tournaments/7/matches`. Seed **PUBLIC_B** under `['matches',801,'game-picks']`; B must not be cleared by A. Start an old A deferred non-abortable query resolving later as `OLD_A_LATE`. Instrument real observer `data`, query keys/meta, request identity (header names only, token values redacted).

**Identity boundary**: `removeOrgToken(7)` / equivalent real support/viewer revocation, with A's match list absent; then store fictitious *new*, distinct viewer credential for tournament 7. Old raw orphan **may physically remain** because no trusted ownership attribution exists. This is not a permission to show it. Unrelated B stays intact.

**Verified return**: a *newly authorized* tournament-scoped match-list GET succeeds and contains `{id:701,tournamentId:7}`; no conflicting successful list. Hook `useMatchGamePicks(701)` mounts with `enabled:true`. Its **first observer result must NOT contain OLD_A_SECRET**: it must initially be `undefined` until a fresh server-authorized result is available. The new query must address `['matches',701,'game-picks','verified-owner',7]` and have `meta.web005VerifiedTournamentId===7`; old three-element raw query remains a different identity. The match list establishes owner, **not** current viewer read permission; backend still decides 200/403.

**Old and new async responses**: resolve pending old promise with `OLD_A_LATE` *after* the new hook mounts and while fresh request is still pending. It must not write into the owner-qualified query or its observer. Fresh GET 200 returns a fictional `NEW_AUTHORIZED` record; **only then** may new observer show it. B's `PUBLIC_B` remains unchanged. Revoke the *new* viewer; the owner-qualified entry must be evicted, B must remain. A denial 403 (also 401 infrastructure) must likewise evict owner-qualified A after its proven metadata even if parent list is gone.

**Positive control**: a fresh matched legitimate query with already-valid metadata retains its normal triple key if no legacy conflict; `useSetMatchGamePick` three-element prefix invalidation covers both the triple and five-element namespace; public B remains available after A mutation/denial/logout.

**Negative / refusal**: missing, conflicting or foreign match-list `tournamentId` disables private picks GET; never infer `tournamentId` numerically from 701, never clear all `['matches']`, and never claim that successful list lookup overrides server per-request auth.

## 3. QA matrix and evidence type

| Oracle | Required invariant | Current basis | Execution |
|---|---|---|---|
| N1 old A rebind | No `OLD_A_SECRET` in new observer before fresh authorized response | Guarded owner-qualified key in hook; authored R19 test | NOT_EXECUTED |
| N2 old A late promise | `OLD_A_LATE` cannot repopulate new key/data | Distinct exact query identities; authored test | NOT_EXECUTED |
| P3 lawful new viewer | Only fresh 200 `NEW_AUTHORIZED` becomes visible | Test synthetic deferred fetch; backend remains actual arbiter | NOT_EXECUTED |
| P4 unrelated public B | B8/M801 remains byte-for-byte intact | Scoped tenant/meta predicate and test assertion | NOT_EXECUTED |
| N5 renewed revocation | New owner-qualified A key removed; B intact | 3/5 tuple matcher; R19 test assertion | NOT_EXECUTED |
| N6 denial after rebind | Both 401/403 on proven A evict its guarded query, B retained | Owner-meta denial subscriber; earlier R18 cases; R20 QA ask | NOT_EXECUTED |
| N7 missing/foreign/ambiguous owner | No unowned private GET and no old raw result display | Successful scoped DTO owner matching; earlier authored negative | NOT_EXECUTED |
| P8 mutation parity | `useSetMatchGamePick` prefix invalidation refreshes owner-qualified key | Source `invalidateQueries` prefix; A30 peer analysis | NOT_EXECUTED |
| N9 A→B Host route/header | B route cannot inherit A module-global auth header or A local state | **OUTSIDE this source patch**; A30 requests separate end-to-end oracle | NOT_EXECUTED |
| N10 historical raw retention | Old ownerless raw cache may survive internally without its owner attribution | SOURCE_CONFIRMED; no blanket memory erasure | OWNER_POLICY_OPEN |

**Status vocabulary**: `SOURCE_RECONCILED_SCOPED` is a source-level judgment by A30; `SOURCE_ACCEPTED_A60_EXACT_HEAD` requires independent A60 at **this SHA**. `RUNTIME_VERIFIED` requires the actual Node22/pnpm10 command, full checkout SHA, process exit, TAP and sanitized logs. Neither was supplied to A100 for this R20 handoff.

## 4. Explicit residual decision for owner/HQ — no silent waiver

**R-LEGACY-ORPHAN-RETENTION:** An untagged old `['matches',mid,'game-picks']` query, containing earlier private data, may remain physically in the browser's in-memory QueryClient when no owner meta and no verified parent match list exist. This is **not the same** as reusing it in the R19 new guarded `useMatchGamePicks` observer. Current A30 source peer finds the rebind path mitigated within verified owner scope; does **not** find a confirmed frontend leak or claim memory erasure.

Only owner/HQ can choose between:
- **Decision A — scoped source/security acceptance** of in-memory ownerless retention, with written owner/QA risk exception explicitly limited to no-display on the current hook and a declared no-global-purge invariant. Any data-accessible alternate consumers, Host page state or stale module headers remain separate signoff/test debt. Formal owner identity, date, affected SHA and A60 risk opinion required.
- **Decision B — stronger historical privacy guarantee**, with an explicit owner-approved migration/cache-epoch disposal contract and a new narrow file/hunk GO **only after A60 exact SHA SOURCE_FAIL**; define allowed identity provenance and A/B boundary. No global cache clear, fabricated tenant association, backend/TTL policy changes or file ownership expansion by default.

Neither A nor B has a **verified signed owner decision**. If none, mark `POLICY_OPEN / OWNER_WAIVER_REQUIRED_IF_FULL_ERASURE` and **RELEASE NO-GO**. This is a decision packet, NOT permission for A100 to implement another change.

## 5. CI and A50 actual frontend executor contract

R19 exact PR53 GitHub Actions [run 38631806899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38631806899), job `116085315511`, completed **FAILURE** upstream at Pack19 matcher `readOnly:true` vs current Drizzle `accessMode:"read only"`; Pack20–26 and static/database gates skipped. Separate PR35 addresses this. This is **NOT** an R19 N1 feature-specific failing or passing test.

**A100 R20 performed no executable app tests:** `NOT_EXECUTED`, no command exit, no TAP, no new HEAD. **A50 R19** documented no complete checkout/pnpm10/frozen-dep executor and 0 app test executions. **Single owner action:** grant A50 a trusted connected, clean, full checkout of PR53 SHA `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34`, Node22/pnpm10 with frozen lockfile and explicit safe frontend test approval. No PG16 needed.

Target **commands to be executed by A50, NOT executed by A100**:

```bash
git rev-parse HEAD # must equal d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34
node --version
pnpm --version
# from repo root: pnpm install --frozen-lockfile
cd artifacts/tournament-manager
export TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json"
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/lib/tournament-auth-query-cache.test.tsx
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-auth.test.tsx
pnpm typecheck
```

Record verified SHA, cwd, dependency proof, all exact commands/exit, TAP/pass/fail/skip, observer transitions and redacted HTTP request metadata. Real 403 denial + old late-response timing must not be silently replaced by an authored assertion.

## 6. R20 GO/STOP, next agents and final disposition

- **GO performed:** frozen exact HEAD and blobs; R19 A30 source peer + A50 receipt + R18 A60 chronology; test-first acceptance oracle and owner decision alternatives; this docs-only report.
- **STOP observed:** no code/test source write, PR change, merge/rebase/cherry-pick, CI manual rerun, production/shared DB, release/staging/live, SWARM-006 transfer or author self-signoff.
- **A30:** independently recheck the R19 SHA and stale global auth header/Host route edge cases; report security peer, not release acceptance.
- **A50:** one connected executor action above; genuine commands/exit/TAP or `ENV_BLOCKED`.
- **A60:** independently sign scoped source PASS/FAIL at `d1aebfc...` and the exact unresolved raw-cache policy risk; do not reuse old R18 verdict.
- **A00/HQ:** make explicit signed raw-orphan retention risk decision if required; separately close original WEB-004 38-case owner-mapped dispositions and final release/handoff gates. A100 cannot send any intermediate SWARM-006 package.

**FINAL A100 R20 technical state:** `PR53_FROZEN_EXACT_SHA / LEGACY_REBIND_SOURCE_RECONCILED_BY_A30_SCOPED / A60_NEW_SHA_NOT_VERIFIED / RUNTIME_NOT_EXECUTED / RAW_ORPHAN_OWNER_POLICY_OPEN / RELEASE_NO_GO / SWARM006_HOLD`.
