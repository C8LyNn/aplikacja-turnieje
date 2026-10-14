# WEB-005 — A30 R20 / PR53 Exact-SHA Privacy Peer

**Task:** WEB-005-T030-T031-A30-R20 · **Agent:** A30 Security Implementation · **Mode:** SOURCE READ ONLY · **Date:** 2026-10-14 Europe/Warsaw.  
**Authority:** [R20 central sections 0–2, AGENT A30](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R20_AGENT_PROMPTS.md), Git blob `dabf0146a08ef8488400df9268b52210662cbb63`.  
**Project:** C8LyNn/aplikacja-turnieje. **Base:** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**PR:** [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53), `fix/web-005/t080-s2a-private-auth-query-cache-r13`.  
**HEAD checked R20:** `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34`, OPEN/DRAFT/UNMERGED, same release base. **Change since R19:** none at review; R18→R19 `8710f7fe5946d7f62e366303a97722d4201fc96b` → `d1aebfca…` = four commits, three modified files (+110/-8 based on GitHub compare: +17/-1, +78/-0, +15/-7). **A30 R20 application code writes: ZERO**.

**A30 PEER verdict (NOT A60 independent release signoff):**  
`PR53_SOURCE_REVIEWED_SCOPED / LEGACY_REBIND_GUARDED_IN_PRODUCER / OWNER_SCOPED_EVICTION_VERIFIED_IN_SOURCE / UNKNOWN_OWNER_RAW_CACHE_RETAINED / USER_VISIBLE_LEAK_NOT_OBSERVED / RUNTIME_NOT_EXECUTED / A60_R19_NEW_SHA_NOT_VERIFIED / RELEASE_NO_GO / SWARM006_HOLD`.

## 1. Exact source-line security evidence

**`artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts` blob `1a5404e8a0dccf12063d6efb6248c2253cafee4a`:**

- L38–39 `getMatchGamePicksQueryKey(mid) = ["matches",mid,"game-picks"]` is the legacy 3-element identity.
- L92–103 `useMatchGamePicks` calls `getVerifiedMatchTournamentOwner(queryClient, matchId)`, not owner guessing from `matchId`.
- L104–119 inspects the **exact** legacy key in the cache; if `legacy.meta?.web005VerifiedTournamentId !== verifiedOwner`, new protected read uses a segregated **5-element** key `["matches", mid, "game-picks", "verified-owner", verifiedOwner]`. A retained untagged old raw result is **not** the new observer's query identity after authoritative owner reproof.
- L115–126 without trustworthy owner selects `["matches",0,"game-picks"]` with `enabled:false`; verified reads attach `meta.web005VerifiedTournamentId` at query production and use `staleTime: 10_000`. **Source-level fail-closed unknown/ambiguous fetch**; no runtime proof on disabled observers with manually seeded placeholder data.
- L134–156 `useSetMatchGamePick` invalidates prefix `["matches",mid,"game-picks"]`. The 5-element key shares this exact 3-element prefix; React Query prefix invalidation **should** reach it. Test actual mutation/readback and disabled placeholder separately, no source-only runtime PASS.

**`artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts` blob `e2c12c88c051f20f08474ee0dc9f877207923624`:**

- L97–120 `getVerifiedMatchTournamentOwner` inspects **only successful** canonical `/api/tournaments/:tid/matches` cached queries and requires each match DTO's `id===matchId` and `tournamentId===tid`. Conflicting ownership returns null, unknown owner does not turn into a wrong-tenant guess. A source-successful list is not a fresh auth proof after credential rotation; the auth cache clearing and backend are separate gates.
- L124–145 owner metadata and `isGamePicksQueryKey` accept only strict 3-segment or 5-segment typed match-picks keys with positive safe integer match/owner IDs and fixed `verified-owner` marker.
- L182–198 `removeTournamentAuthQueries` snapshots known match ownership, then cancels/removes exact A URL/bans keys and **only A-attributed** picks keys (meta first, known list fallback). Unknown raw match entry stays in memory when no valid attribution; B's unrelated cached state is outside the targeted predicate.
- L206–221 denial observer catches **401/403** and resolves owner from URL/bans tuple or query meta or existing canonical list. It calls the same owner-scoped eviction. **For the actual private ban/picks APIs, 403 is the important protected-denial contract; 401 is a supplemental generic negative case.**

**`artifacts/tournament-manager/src/context/auth-context.tsx` blob `8916545544d55fc8d7fbd146d0328e36543bebb7`:**

- L50–86 organizer, support and viewer **store/remove/replace** paths call `removeTournamentAuthQueries(queryClient, tid)` for the scoped tenant. This proves the codepath is linked, not the real scheduler/Host UI behavior.

**`artifacts/tournament-manager/src/pages/tournament-host.tsx` blob `6b50dcf4a3f09c5bc3416da5bc9c9d1f22c2d1e9`:**

- L89–110 protected tournament/match queries are generally gated on `isAuthReady`. L292–297 derives `focusedMatchId` from `matches` for that Host. L330–331 invokes `useMatchGamePicks(focusedMatchId)` with `enabled: isDeadlock && !!focusedMatchId`, without a **direct** `isAuthReady` gate on this standalone hook. Other page/auth gates exist, so no browser disclosure or backend bypass can be inferred from this alone. Preserve Host A→B/credential-epoch regression as an **open runtime test**.

**Server boundary:** prior grounded source at baseline `GET /tournaments/:tid/matches` and `GET /matches/:mid/game-picks` uses `checkViewerReadAuth`/`requireTournamentRead` before protected output (403 on denied private visibility). PR53 concerns **client-held authorized response reuse**, not a proven server-side authorization bypass.

## 2. Proof classification — ownerless legacy state is not an observed UI leak

**SOURCE_CONFIRMED:** if `["matches",701,"game-picks"]` contains historical A private data without owner metadata **and** the canonical A match list was removed, scoped A eviction **cannot attribute this raw entry**. It intentionally remains in QueryClient to avoid mistakenly wiping B. A plain diagnostic QueryClient query consumer or DevTools might still inspect in-memory state in that browser instance, depending on actual access; no proof that the normal post-logout Host renders it.

**SOURCE_CONFIRMED correction:** on later verified match list recovery, the **new hook** notices old raw entry/meta mismatch **before** subscribing and creates the owner-qualified distinct key. It therefore does not select that old cached payload as `data` at initial render. If no owner proof is present, query is disabled. The old raw entry's mere presence is **a separate retention risk**, not evidence that a user saw an old A secret.

**UNVERIFIED RUNTIME / hypotheses:**

- Old match-only raw entry already carrying owner-matching meta but stale credential epoch: `removeTournamentAuthQueries` is designed to evict it on store/remove, but a real auth page/lifecycle, externally revoked credential, 403 and delayed fetch need RTL.
- `getVerifiedMatchTournamentOwner` searches all successful cached tournament match lists. If one is stale in an A→B navigation or credentials have been revoked externally, fresh server 403 and host-route scoping must be enforced; no ownerId numeric spoof allowed.
- Old unabortable in-flight completion must not repopulate the **new owner-qualified** query after A is revoked; standard React Query cancel/remove is source-intended, not separately runtime-verified here.
- A stale global module-level API header or Host-derived state after token change remains an independent test surface; no packet-specific exploit demonstrated.

**Do NOT misstate:** `SOURCE_REVIEWED_SCOPED` ≠ `SOURCE_ACCEPTED_A60_EXACT_SHA` ≠ `NATIVE_RUNTIME_VERIFIED` ≠ `FULL_LEGACY_CACHE_ERASURE` ≠ `PRODUCTION_INCIDENT`.

## 3. Required precise A60 / A50 regression matrix

| ID | Test state/action | Acceptance requirement |
|---|---|---|
| `LEGACY-N01` | Seed untagged 3-tuple A=7/mid701 with `OLD_A_SECRET`, A match list absent, revoke A organizer, switch to new viewer, then a valid owner A list returns | New hook immediately has `data===undefined`; never uses old raw key; new 5-tuple owner=7; only `NEW_AUTHORIZED` visible after fresh protected GET |
| `LATE-N02` | Old raw A promise resolves `OLD_A_LATE` after logout and new observer mount | No old data enters new owner-qualified cache or UI, including when fetch ignores abort |
| `DENY-N03` | Protected picks GET returns actual **403**, then synthetic 401, after owner meta set and canonical match list evicted | Evict A meta-owned 3/5 tuple only, no old protected A display; no public B eviction |
| `LOGOUT-N04` | Viewer/support/organizer store/replace/remove on A after a **new scoped response** | Scoped 5-tuple cache gone on credential change; no stale pending response; B unchanged |
| `OWNER-N05` | Unknown, orphan or conflicting owner; DTO mismatch; IDs 7 vs 70 | No protected GET and no data leakage; no match ID equals tenant ID assumption |
| `SCOPE-P06` | B=8/mid801 `PUBLIC_B` independently legal before/after A logout/403 | B remains accessible; no global `["matches"]` wipe, no unintended global role logout |
| `AUTH-P07` | Genuine A authorized private_online viewer and organizer/support where permitted; mutation set-pick and refetch | Read succeeds, owner-qualified key invalidated by original 3-tuple prefix, correct fresh result shown |
| `HOST-N08` | Host A→B/role rotation with cached stale A match list and local selected match; inspect actual headers | No wrong-tenant A hero selection in B, no stale A token on new request; no unauthorized 200/200 from cache without fresh scope confirmation |
| `HISTORY-N09` | Query cache contains raw ownerless historical A entry after logout, with no canonical match list | Policy: accept documented **retention** as a separate bounded exception or authorize a migration contract; **do not** claim it was purged |
| `FULL-P10` | Re-run existing support/organizer/viewer auth-hook tests and full authored R19 cache suite on exact new SHA | Actual TAP, failures, skips and exits; no PASSED based on authored tests alone |

**Authored test evidence:** `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` blob `2196851691735e560b36099caa3d33ac649ccf84` lines 363–438: R19 case models `OLD_A_SECRET`, old pending query, B `PUBLIC_B`, revoked old organizer/new viewer, restored A match ownership, new 5-key, late `OLD_A_LATE`, new `NEW_AUTHORIZED` and scoped viewer logout. A100 reports **23 authored cache instances** (including earlier parameterization), **not 23 runtime PASS**.

**A50 safe command contract:** authorized trusted exact-head full repository checkout, Node22/pnpm10, frozen workspace dependencies; NO PG16 needed for this frontend suite:

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

**R20 A30 app test executions:** `ZERO / NOT_EXECUTED`, no local full test checkout, no TAP/exit, only GitHub repository readback. [A50 R19 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R19_RECEIPT.md), Git blob `412117e31c297353b35a3c21fbd616d41754d4b6`, confirms no native React/API/PG16 application test execution at previous wave. Owner action: connect an **approved full per-SHA checkout and pnpm10 executor** to A50; don't invent a failed/passed test.

**Exact PR53 automatic workflow [38631806899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38631806899):** locked dependency install `SUCCESS`, SE safety unit `SUCCESS`, upstream historic `Pack 19 snapshot consistency tests FAILURE`, downstream `Static and database release gates SKIPPED`. **This CI does not execute targeted RTL or prove PR53 privacy failure/success.** Existing Pack19 matcher correction is on separate PR35, not merged.

## 4. Signable *bounded* owner decision if hard historical erasure is desired

This is a **decision request**, not a signoff:

```text
DECISION_ID: WEB-005-PR53-LEGACY-OWNERLESS-CACHE-R20
REVIEW_SHA: d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34
SCOPE: historical in-memory three-tuple ["matches",matchId,"game-picks"] with
       no owner meta and no authoritative cached tournament owner list
SOURCE_REBIND_GUARD: A30 SOURCE_REVIEWED_SCOPED, A60 independent PENDING
CHOICE:
 [ ] A — Accept bounded residual in-memory retention, provided independent
         A60 verifies new protected UI never subscribes to orphan raw data,
         new guarded query cannot rebind old data and future release QA validates.
         This does NOT waive 403 checks, auth lifecycle or eventual runtime testing.
 [ ] B — Require separate safe migration/expiration/identity design with explicit
         owner-approved file scope and A60 re-review (NO blanket cache wipe);
         hold full privacy closeout until delivered.
 [ ] C — Hold: insufficient provenance/evidence, no exception.
OWNER/HQ SIGNER: [unset]
OWNER APPROVAL LINK/TIMESTAMP: [unset]
A60 EXACT-SHA DECISION: [pending]
A50 ACTUAL TEST RECEIPT: [pending]
```

**Neither A30 nor A100 may pick a default.** No owner-signed exception was found in this task readback. Option A is not `RUNTIME_DEBT_TO_SWARM006`; those are different independent owner gates. No silent acceptance.

## 5. Integration and final handoff boundary

**A60 R19 independent exact-head QA:** no signed R19 report was found in checked control branch nor any additional R19 A60 dedicated branch at R20 intake; only [A60 R18 QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md) blob `656a8850a6358e5b4b2517220a5fc55f99dc014f` applied to **old R18 HEAD** `8710f7fe…` as `SOURCE_ACCEPTED_SCOPED_FULL_PRIVACY_REVIEW_OPEN`. A60 R20 must independently sign `d1aebfca…` and classify residual separately. A30 cannot self-certify A60.

**Owner/HQ policies:** Historical ownerless retention decision, session TTL/digest/rotation, Steam absent admin secret 403/503 and other cross-agent sporting/CAS/Backup/Revert policies are `UNSIGNED/POLICY_OPEN` unless A00 produces real exact signed source. Not selected by A30.

**WEB-004 38 historical case provenance:** A10 R19 recovered 29 authentic IDs and marked 9 unknown; no fabricated IDs or signed disposition. A00/A10 own that gate, not this security peer. **SWARM006_FINAL_HANDOFF_GO = FALSE** without independent A60 exact-SHA closeout, owner approvals, accepted 38-row backlog and either A50 tests or specifically signed runtime-debt *after* policy/source closure.

**No file collisions caused by A30:** PR53 changes only A100-owned three frontend files; PR54/PR47 semantic collision is separately owned by A120/A00 and future SWARM-006, not an authorization for A30 integration.

**HARD STOP:** no A30 code changes, new PR, merge/cherry-pick/rebase, paid CI rerun, DB write/DDL/reset, Replit/staging/live, or SWARM-006 dispatch.

**A30 R20 security peer final:** `SOURCE_REVIEWED_SCOPED / BOUNDED_LEGACY_REBIND_GUARD_VISIBLE_IN_SOURCE / RAW_ORPHAN_RETAINED / A60_EXACT_HEAD_PENDING / REAL_APP_TESTS_0 / OWNER_EXCEPTION_UNSIGNED / HANDOFF_NOT_READY / RELEASE_NO_GO / SWARM006_HOLD`.
