# WEB-005 — A100 R20 formal handoff to local coordinator 00

**Agent:** A100 — Session Security & Private Access.  
**Task:** `WEB-005-T080-A100-R20`, per R20 central master blob `dabf0146a08ef8488400df9268b52210662cbb63`.  
**Authority:** §0–§2 + AGENT A100, **SOURCE ONLY / NO NEW FIX GO**.  
**Date:** 2026-10-14 Europe/Warsaw.  
**Technical deliverable:** [WEB-005_A100_R20_PR53_QA_SUPPORT.md](./WEB-005_A100_R20_PR53_QA_SUPPORT.md) — published on control branch, commit `5e65780fa9945b4d3902742765807dddb91b7266`.

## Source snapshot and work done

- Existing [PR53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53), P20, remains **OPEN DRAFT / UNMERGED**, head unchanged at **`d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34`**; base `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. PR54 separate head `bfa9d075b431185aa8bbf87bf021d64dde8ae22f` at snapshot; its QA is **A60/A120 ownership**, not modified.
- **R20 changed code/test files: NONE.** Three reviewed exact PR53 paths: `src/lib/deadlock-bans-picks.ts` blob `1a5404e8a0dccf12063d6efb6248c2253cafee4a`; `src/lib/tournament-query-invalidation.ts` blob `e2c12c88c051f20f08474ee0dc9f877207923624`; `src/lib/tournament-auth-query-cache.test.tsx` blob `2196851691735e560b36099caa3d33ac649ccf84`. Also read `src/context/auth-context.tsx` blob `8916545544d55fc8d7fbd146d0328e36543bebb7`.
- **A30 R19 security peer** [report](../A30/WEB-005_A30_R19_SECURITY_PEER.md) blob `cda372e54440020209aef89bc3351244ce18870d` gives `LEGACY_REBIND_SOURCE_RECONCILED_SCOPED` for exact PR53 R19 HEAD; **not** independent A60 acceptance, not runtime PASS.
- **A60 R18** [report](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md) scoped source acceptance was for **older** head `8710f7fe5946d7f62e366303a97722d4201fc96b`. Central A60 R19 exact-head handoff/report not found at check; GitHub PR53 review submissions also empty. **A60_NEW_HEAD_VERDICT=NOT_VERIFIED**; do not promote A30 peer to A60 signed source QA.
- **A50 R19** [receipt](../A50/WEB-005_A50_R19_RECEIPT.md) blob `412117e31c297353b35a3c21fbd616d41754d4b6`: zero native application tests, no full authorized connected per-SHA checkout/pnpm10/frozen deps. **A100 R20 application tests: NOT_EXECUTED; command/exit/TAP: N/A.** R19 PR53 `23 authored` cache cases are not `23 PASS`.

## Focused legacy A7/M701 versus B8/M801 acceptance oracle (source only)

1. Place fictional private **OLD_A_SECRET** in legacy **untagged** `['matches',701,'game-picks']` with no owner metadata or A match-list proof; seed distinct lawful public B=8, match=801, **PUBLIC_B**; start delayed non-AbortSignal old A promise.
2. Revoke A organizer and rotate to new viewer while canonical A match-list is absent. Orphan raw entry **may remain physically cached**; no guessing or global removal. B unaffected.
3. Reintroduce newly authorized A tournament match-list containing trusted exact `{id:701,tournamentId:7}`. `useMatchGamePicks(701)` must bind only the guarded `['matches',701,'game-picks','verified-owner',7]` key with corresponding owner `meta`; observer **must show undefined, never OLD_A_SECRET** before new authorized GET.
4. Resolve pending old A promise as **OLD_A_LATE** after new hook mount. It must never fill fresh query or observer; fresh 200 **NEW_AUTHORIZED** may appear, but only after authorized response. 403 (also 401 infra) under new guard must evict A query and retain B.
5. New viewer logout evicts fresh owner-qualified key; legacy orphan retention risk remains separately recorded. Missing/foreign/ambiguous ownership disables private request; unrelated B cache unchanged. Mutation invalidation with triple prefix should target guarded five-element key; actual runtime needs test.

**Current source evidence:** `deadlock-bans-picks.ts` exact legacy triple lookup followed by mismatching-meta guard chooses five-element key; helper accepts both precisely shaped keys for 401/403 and credential eviction. Test `R19 legacy untagged picks cannot rebind or display old A after list recovery` authored in the existing suite (23 total), **NOT_EXECUTED**. No confirmed user-visible security incident.

## Open policy and execution gate

**`POLICY_OPEN / RAW_ORPHAN_RETENTION`:** untagged records with no provable tournament owner can remain in React Query memory, even though the new verified hook avoids binding them. Physical historical cache erasure and all other raw cache consumers are **not certified**. Owner/HQ must **sign** either acceptance of a *narrow scoped no-display risk* with explicit impact and A60 assessment, or a stronger migration/identity contract for a separately authorized future lane. No inferred `OWNER_APPROVED_EXCEPTION`; neither option is chosen by A100.

**`RUNTIME_NOT_EXECUTED`:** A00/owner must provide A50 one trusted connected clean checkout at SHA `d1aebfc...`, Node22/pnpm10/frozen dependencies and written safe frontend test authorization. Targeted `tournament-auth-query-cache.test.tsx`, `use-tournament-auth.test.tsx`, `pnpm typecheck`; record actual command, cwd, SHA, exit/TAP, skips and redacted runtime evidence. Frontend tests do not require PostgreSQL. Automatic [CI run 38631806899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38631806899) failed earlier Pack19 matcher (`readOnly:true` vs `accessMode:"read only"`) before target RTL; PR35 owns that isolated fix. Not a feature test result.

**`A60_QA_PENDING`:** Independent A60 must verify exact PR53 SHA, guarded query and legacy rebind scenarios; A30 supports privacy peer. Any fresh source FAIL may justify **future** specific A00 written code GO, **not R20 permission**. Other unapproved policies (session TTL/digest/rotation etc.) remain HQ owner matters.

**Coordinator next action:** route this QA oracle to A30/A50/A60; request exact-head signed disposition and owner decision on legacy orphan retention. Final WEB-004 38-case provenance/signed owner mapping, 21 package ledger and `HANDOFF_WITH_RUNTIME_TEST_DEBT` are separate A00/A10/A60/HQ gates, not A100's authority. `FINAL_HANDOFF_GO` not verified.

## STOP compliance and final state

No changes to PR53, any app source/test, PR54, PR44/46/49, release/main, backend TTL/hash/rotation, SQL, staging/live, paid manual CI or SWARM-006. No merge, cherry-pick, rebase, new PR, new wave trigger or independent release signoff.

**FINAL:** `R20_A100_SOURCE_SUPPORT_PUBLISHED / PR53_FROZEN / A30_PEER_SOURCE_RECONCILED_SCOPED / A60_EXACT_SHA_NOT_VERIFIED / A50_NATIVE_TESTS_0 / RAW_ORPHAN_OWNER_POLICY_OPEN / RELEASE_NO_GO / SWARM006_HOLD`.
