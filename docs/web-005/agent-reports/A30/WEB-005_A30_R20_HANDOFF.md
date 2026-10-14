# WEB-005 — A30 R20 HANDOFF to A00 / A60

**Task:** WEB-005-T030-T031-A30-R20 · **Agent:** A30 Security Implementation (security peer, not independent QA A60).  
**Date:** 2026-10-14 Europe/Warsaw · **Mode:** STRICT SOURCE READ-ONLY / DOCUMENTATION ONLY.  
**Authority:** [WEB-005_WAVE_R20_AGENT_PROMPTS.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R20_AGENT_PROMPTS.md), exact prompt blob `dabf0146a08ef8488400df9268b52210662cbb63`, sections 0–2 + AGENT A30.  
**Base:** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**Detailed published line-level security peer:** [WEB-005_A30_R20_PRIVACY_PEER.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/5b7e4063e04f3e2d9986b17975dac823bd18b80c/docs/web-005/agent-reports/A30/WEB-005_A30_R20_PRIVACY_PEER.md), documentation commit `5b7e4063e04f3e2d9986b17975dac823bd18b80c`.

## 1. Verified source-state/HEAD

**[PR53 / P20](https://github.com/C8LyNn/aplikacja-turnieje/pull/53)** — `fix/web-005/t080-s2a-private-auth-query-cache-r13`, **current R20 exact HEAD** `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34`. **OPEN / DRAFT / UNMERGED**, exact base `1fdc401d…`. Compared with A60 signed R18 old `8710f7fe5946d7f62e366303a97722d4201fc96b`: **4 R19 commits**, only three A100-owned files (+110/-8 total); **R20 HEAD unchanged at A30 review**. A30 made **zero** application code edits.

| Source file | HEAD blob | Security result |
|---|---|---|
| `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts` | `1a5404e8a0dccf12063d6efb6248c2253cafee4a` | L101–126 verified canonical tenant owner, pre-subscribe legacy raw key/meta check, segregated `["matches",mid,"game-picks","verified-owner",tid]` on mismatch; no-owner fetch disabled. |
| `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts` | `e2c12c88c051f20f08474ee0dc9f877207923624` | L97–120 owner provenance, L124–145 typed three/five key guard, L182–198 exact owner-scoped cancel/remove, L206–221 401/403 denied owner attribution. |
| `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` | `2196851691735e560b36099caa3d33ac649ccf84` | R19 focused legacy A=7/mid701 untagged→revocation→new viewer/owner→fresh A segregated key; delayed old result cannot fill new observer; B=8 remains. **Authored only, NOT_EXECUTED**. |
| `artifacts/tournament-manager/src/context/auth-context.tsx` | `8916545544d55fc8d7fbd146d0328e36543bebb7` | L50–86 organizer/support/viewer credential store/remove all call owner-scoped eviction, source unchanged. |
| `artifacts/tournament-manager/src/pages/tournament-host.tsx` | `6b50dcf4a3f09c5bc3416da5bc9c9d1f22c2d1e9` | L292–297 picks match from current Host matches; L330–331 standalone picks enabled by Deadlock/focus without direct `isAuthReady` option; Host A→B full RTL still a distinct requirement. |

**A30 scope-limited source assessment:** `LEGACY_REBIND_SOURCE_GUARDED / TAGGED_AND_VERIFIED_KEY_SCOPED_EVICTION / NO_UNAUTHORIZED_SERVER_GET_BYPASS_SHOWN / UNKNOWN_OWNER_RAW_CACHE_RETAINED / NO_PROVEN_UI_EXPOSURE`.

**Raw-ownerless cache caveat:** when an old pre-R18 `["matches",mid,"game-picks"]` query has no trustworthy owner metadata or canonical parent match list, A logout cannot safely attribute it, so it stays in QueryClient. Its in-memory presence is `SOURCE_CONFIRMED`, but the **new verified hook refuses to rebind to its query identity**. This is **not** a runtime-demonstrated user-visible leak nor equivalent to a full historic cache purge. Owner may independently accept bounded retention with a written risk exception or require a separately scoped migration; do not choose for owner.

## 2. R19 independent QA and runtime provenance

**Previous independent QA:** [A60 R18 signed exact SHA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md), blob `656a8850a6358e5b4b2517220a5fc55f99dc014f`, verdict `SOURCE_ACCEPTED_SCOPED_FULL_PRIVACY_REVIEW_OPEN` for **older SHA** `8710f7fe…`. That signature **does not automatically apply** to new `d1aebf…`. On checked control/doc branches, an independent signed A60 R19 exact-new-SHA report was **NOT_FOUND**; A60 R20 countersign remains pending. No A30 attempt to self-sign A60.

**A50 R19 actual evidence:** [R19 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R19_RECEIPT.md), blob `412117e31c297353b35a3c21fbd616d41754d4b6` — **ZERO** actual native React/API/PG16 executions; full trusted repo checkout and pnpm10 not connected. Node/Git environment-only preflight is not application testing. A30 R20 actual native tests `ZERO / NOT_EXECUTED`; no command/TAP/exit for application. No new code or runtime patches issued.

**Auto CI on PR53 exact current SHA:** [38631806899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38631806899): frozen install PASS, SE safety unit PASS, **upstream Pack19 snapshot matcher FAIL**, static/DB release gates SKIPPED; does not prove targeted React RTL failure or PASS. Pack19 correction belongs to independent PR35.

## 3. Exact A60/A50 ten-case acceptance needs

See detailed peer `3 for full fixture table IDs `LEGACY-N01`, `LATE-N02`, `DENY-N03`, `LOGOUT-N04`, `OWNER-N05`, `SCOPE-P06`, `AUTH-P07`, `HOST-N08`, `HISTORY-N09`, `FULL-P10`.

**Blocking privacy invariants** to be independently signed on **PR53 `d1aebf…`**:
- Seed **OLD_A_SECRET** in untagged 3-tuple, remove A token while owner list absent; when A match list recovers under new lawful credentials the hook must return `data:undefined` until the fresh `NEW_AUTHORIZED` protected GET, using separate five-segment key.
- Old async **OLD_A_LATE** may finish after logout but may not repopulate the new scoped query, even if it ignores AbortSignal.
- Correct 403 for denied private GET and supplemental 401 must evict only the proven A session's 3/5 tuple; unrelated legal/public B retained.
- Unknown, ambiguous, foreign tenant and 7/70 confusion never allow private GET or inferred owner; Host A→B route and module-global auth headers independently verified.
- Test lawful viewer/private-online and organizer/support permitted roles and game-picks mutation invalidation parity on the owner-qualified five-segment query. Old support-auth regression still intact.

**A50 exact executor command when owner supplies approved trusted per-SHA checkout + Node22/pnpm10/frozen dependencies:**

```bash
git fetch origin fix/web-005/t080-s2a-private-auth-query-cache-r13
git switch --detach d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34
git rev-parse HEAD
node --version
pnpm --version
pnpm install --frozen-lockfile
cd artifacts/tournament-manager
export TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json"
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/lib/tournament-auth-query-cache.test.tsx
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-auth.test.tsx
pnpm typecheck
```

No PostgreSQL needed for this PR53 frontend QA. PG16 runtime and A20 physical isolation are required separately for backend PR44/46/49 but are not in A30 R20 implementation scope. Exact TAP, skips, exits, cwd/env and SHA must be recorded by A50 before `NATIVE_RUNTIME_VERIFIED`.

## 4. Bounded owner-policy signoff and integration boundary

**Owner-signable disposition (no selection by A30):** `WEB-005-PR53-LEGACY-OWNERLESS-CACHE-R20`, full options in detailed security peer `4: (A) accept bounded *in-memory historical retention only*, conditioned on A60 signoff of non-reuse + eventual native tests, (B) separately authorize narrow safe erasure/migration contract without blanket matching, or (C) HOLD pending evidence. **Owner/HQ signer/link/status: UNSIGNED.** This does NOT grant `RUNTIME_DEBT_TO_SWARM006`.

**Other owner policies untouched/unsigned:** session TTL, support-token digest, organizer rotation/logout, Steam absent-secret 403/503. A30 does not select sport/Basket/Backup/Direct Revert policy and does not supply 38-case WEB-004 owner signatures.

**Additional final gate:** central R20 records 21 draft PRs and 38 historical WEB-004 cases: 29 authentic recovered IDs, **9 SOURCE_ID_NOT_AVAILABLE**, no complete signed per-case dispositions. The wider 21-PR A60 final-only independent signoff and A00/HQ `FINAL_HANDOFF_GO` remain unavailable. A runtime-debt exception cannot waive source/policy/38-case gates.

**Dependencies/conflicts:** PR53 scoped change is solely A100-owned; A30 no changed source. PR54/PR47 stage-progress-view.tsx collision is a separate A120/A00 future integration issue; no cross-PR cherry-pick or merged source. Do not reopen Steam/proxy/locked auth PRs in this scoped task.

**GO:** A60 independent PR53 exact-head source QA and owner exception risk view; A50 actual tested evidence after A00 connects executor; A00 signed exception/policy/38-case closeout.  
**STOP:** code by A30, new PR, merge/cherry-pick/rebase, manual paid CI, shared/prod SQL, Replit/staging/live, SWARM-006.

**A30 R20 terminal report:** `REPORT_PUBLISHED / PR53_SOURCE_REVIEWED_SCOPED / RAW_OWNERLESS_CACHE_RETAINED / USER_VISIBLE_LEAK_NOT_OBSERVED / A60_NEW_SHA_PUBLISH_PENDING / A50_REAL_APP_TESTS_0 / OWNER_EXCEPTION_UNSIGNED / HANDOFF_NOT_READY / RELEASE_NO_GO / SWARM006_HOLD`.
