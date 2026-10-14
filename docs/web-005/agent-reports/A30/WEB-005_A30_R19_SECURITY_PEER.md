# WEB-005 — A30 R19 Security Peer / PR53 legacy orphan picks

**Task** `WEB-005-T030-T031-A30-R19` · **Agent** A30 Security Implementation · **Role** scoped security peer, NOT independent A60 QA · **Mode** STRICT SOURCE READ-ONLY · **Date** 2026-10-14 Europe/Warsaw.  
**Authority:** [central R19.1 §§0–§2 + AGENT A30](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R19_AGENT_PROMPTS.md), Git blob `076b14ca7ea953c818309502cce322c7dd6a7bef`.  
**Repo/base:** `C8LyNn/aplikacja-turnieje`, `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**Primary target:** [PR #53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53), `fix/web-005/t080-s2a-private-auth-query-cache-r13`, initial R19 head `8710f7fe5946d7f62e366303a97722d4201fc96b`, OPEN DRAFT UNMERGED. **R19 A100 code/test delta at this initial evidence checkpoint: ZERO new verified commits.** A later PR HEAD must be separately reviewed before certification.  
**Independently signed prior QA:** [A60 R18](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md), Git blob `656a8850a6358e5b4b2517220a5fc55f99dc014f`; `SOURCE_ACCEPTED_SCOPED_FOR_NEW_PROVEN_OWNERSHIP / FULL_PRIVACY_REVIEW_OPEN` for this exact baseline PR53 head; [A60 handoff gate](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_FINAL_HANDOFF_READINESS.md) `HANDOFF_NOT_READY`. No current native frontend/PG tests in [A50 R18 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R18_RECEIPT.md).

## 1. Exact code provenance and source verdict

| File | Git blob SHA on R18/R19 baseline | Relevant behavior |
|---|---|---|
| `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts` | `59fbc215607fd82f55dc5af6d938310cc9f2ef69` | `getMatchGamePicksQueryKey(matchId) = ["matches",matchId,"game-picks"]`; `useMatchGamePicks` obtains owner using cached success-matches and passes `meta.web005VerifiedTournamentId` before fetch; unknown owner disables request on placeholder id 0; `staleTime:10_000`; `useSetMatchGamePick` invalidates original match-only key. |
| `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts` | `955409d1456f13f3f291215712a1afcf322ad094` | `getVerifiedMatchTournamentOwner` accepts unique exact `{id, tournamentId}` from successful URL-keyed tournament-scoped match list; `removeTournamentAuthQueries` removes canonical + bans + proven owned picks using meta or still-cached parent list; `subscribeToTournamentAuthDenials` handles 401/403 on identified owner. |
| `artifacts/tournament-manager/src/context/auth-context.tsx` | `8916545544d55fc8d7fbd146d0328e36543bebb7` | Organizer/viewer/support token/session store/remove calls `removeTournamentAuthQueries(queryClient,tid)`; installs denial observer. |
| `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` | `37f7a9923e9081b4fd4340f1833790f9abd28813` | 22 authored cache test cases (A60 R18 count), including owner metadata on new queries, 401/403, active late HTTP response, unknown owner and B preservation; **none address complete legacy untagged rebind identity transition**. |

**Confirmed good source scope** (not a runtime PASS): fetch of a *new* owned match has server-context-sourced explicit tournament ID; unproven owner blocks private fetch; valid tagged A cache is purged on logout and 401/403 even if the parent match-list cache later disappears; no global `["matches"]` purge. API `GET /tournaments/:tid/matches` is checked by `requireTournamentRead`/`checkViewerReadAuth` and `mapMatch` preserves explicit tournament ID. Unrelated B remains outside the owner-A eviction predicate.

**Source-confirmed retention + potential reuse, not an observed exploit:**

1. Seed **legacy** React Query entry `["matches",701,"game-picks"]` with protected A payload, **no** `meta.web005VerifiedTournamentId`. Also **no** successful `/api/tournaments/7/matches` list in query cache.
2. Remove or rotate A's organizer/viewer/support credential, invoking `removeTournamentAuthQueries(client,7)`. Predicate cannot attribute match 701 to 7 by meta or a cached match list, and therefore leaves the old match-only entry in cache. The old R17/R18 authored `"do not purge unknown-ownership match keys"` test explicitly expects retention.
3. Subsequently under a **changed authorization context**, successful matching list `/api/tournaments/7/matches` is inserted/re-fetched and contains `{id:701,tournamentId:7}`. `getVerifiedMatchTournamentOwner` now returns 7, so `useMatchGamePicks(701)` selects **the same** `["matches",701,"game-picks"]` key, attaches updated meta, and enables it.
4. The query-key identity does **not encode tournament or credential epoch**, and pre-existing `data` may be reused synchronously by the observer, potentially within `staleTime:10_000`, before a newly authorized response. A changed query `meta` alone is not a data cache boundary. **Whether an actual Host/browser renders protected A data is unproven**; distinguish `SOURCE_CONFIRMED cache-state/provenance gap` from `STATIC_INFERRED potential UI rebind`. No established backend GET authorization bypass.

**Counterexample to safe attribution:** match ID is not tenant ID. No guessing from 701, no accepting stale mismatched `tournamentId`, no treating merely a successful cached list from **another current Host** as proof of present authorization. The last risk is not independently demonstrated in runtime; A50/A60 should include wrong-tenant route A→B and old URL GET cache identity.

## 2. Required single R19 A100 test-first negative (main acceptance gate)

**LEGACY-REBIND-N1** — deterministic isolated React/TanStack Query fixture with real `useMatchGamePicks` observer:

- Tenant **A=7** match `701` has `SECRET_A_ONLY` in legacy untagged `getMatchGamePicksQueryKey(701)`; no A list and no owner meta.
- Tenant **B=8** public/otherwise legitimately authorized match `801` has `PUBLIC_B_OK` cached in a separate key, plus valid successful `getListMatchesQueryKey(8)`; keep observer B alive.
- Set old A credential then revoke/rotate it with `removeOrgToken(7)` or relevant viewer/support equivalent. Assert old A untagged entry can survive internal cache if unowned, but it **must not become publicly rendered**; no global B wipe. Optionally use fake `staleTime` to make old response fresh.
- Reinsert a valid authoritative scoped A match list `[{id:701,tournamentId:7}]` but with a **different authorization identity**/restricted role; mount `useMatchGamePicks(701)` with `enabled:true` under fresh `QueryClientProvider`/`AuthProvider`. Immediately inspect `result.current.data` **before HTTP completion**, and then after an induced server **403**; no `SECRET_A_ONLY` may be seen. Capture actual fetch count and header scope. If a delayed old fetch ignores AbortSignal, completion after logout must still not repopulate.
- Positive: B=8 cached `PUBLIC_B_OK` stays accessible and its query is not refetched/removed spuriously; correct authorized A fetch after obtaining a valid credential returns **fresh** A only. Also check ID 7 vs 70 and unknown/conflicting owner never fetches and never exposes stale legacy data.
- One explicit `401` case is useful for generic auth-denial infrastructure; actual private GET may return `403`, so **do not substitute a 401 mock for the actual 403 contract**.

**Separate targeted A60 concerns:**

| Case | Negative/positive invariant |
|---|---|
| `LEGACY-REBIND-N1` | Old untagged A payload cannot be delivered to new auth epoch/role when valid match-list proof arrives after credential change. |
| `PICK-OWNER-N2` | Missing/ambiguous/foreign `{id,tournamentId}`: fetch disabled; no trust from numeric ID or another tenant. |
| `PICK-403-N3` | After valid owner meta recorded and list evicted, denied 403 for A evicts only A query, B cached public and current auth remain. |
| `PICK-LATE-N4` | `enabled:true` active A HTTP fetch, logout, unabortable late success: no A cache resurrection or stale render. |
| `PICK-POS-P5` | Current lawful A viewer/private-online, support/organizer where permitted and B public: picks display and mutation invalidation work, no blank result due to owner logic. |
| `PICK-CONTEXT-N6` | Host navigates A→B with unique *old cached A* match ownership; B-context cannot send stale A credentials or expose A-picks in B UI. |
| `PICK-LEGACY-N7` | Existing old `["matches",701,"game-picks"]` no owner meta after logout; new hook's disabled placeholder must never expose legacy key data before it is revalidated. |
| `PICK-ROLE-P8` | B lawful data remains after A denial/logout, including 7/70 exact key match. |

**A50 approved executor command template (no actual execution here):**

```bash
git fetch origin fix/web-005/t080-s2a-private-auth-query-cache-r13
git switch --detach <EXACT_A100_R19_PR53_HEAD_SHA>
git rev-parse HEAD
node --version
pnpm --version
pnpm install --frozen-lockfile
cd artifacts/tournament-manager
export TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json"
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/lib/tournament-auth-query-cache.test.tsx ./src/hooks/use-tournament-auth.test.tsx
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/lib/tournament-query-invalidation.test.ts
pnpm typecheck
```

Record commands/cwd, Node22/pnpm10, commit SHA, test count/TAP, exit, which variants passed/failed/skipped. If no full isolated executor, report `ENV_BLOCKED / NOT_EXECUTED`. No paid CI, production secrets or DB required for these frontend tests.

## 3. Bounded A100 remediation options; A30 does not implement them

- **Preferred narrow semantic boundary:** ensure old untagged match-only query data **cannot be reused** after auth identity change and later owner proof. E.g. change producer's *read identity* to a verified tournament/credential-epoch-aware key (and keep mutation invalidation parity), or implement a strict pre-rebind cache isolation guard **before** query observer can expose old `data`, with exact-match targeting and no global clear. Never put real bearer token in key/meta/logs. Changes only in A100-owned PR53 files `deadlock-bans-picks.ts`, `tournament-query-invalidation.ts`, `tournament-auth-query-cache.test.tsx`.
- **Do not** do a global `queryClient.clear()`, purge all match keys, copy source of truth from a mismatched parent list, guess tenant from match IDs, or choose token TTL/session migration semantics.
- If a safe fix would require a new shared auth-epoch API, backend changes, migration, conflicting owner file or other unapproved contract: **HOLD / OWNER_POLICY_REQUIRED**. A00/HQ may specifically approve a bounded residual exception with documented impact and A60 risk opinion, not unilaterally declare PASS. No automatic waiver from silence.

## 4. Unchanged post-lock authentication PR dependencies (recheck only)

At R19 intake same base and original HEAD; each OPEN DRAFT/UNMERGED, **A60 R18 SOURCE_ACCEPTED_CONDITIONAL, no independent native PG16**:

| Package | Exact HEAD | Boundary and outstanding dependency |
|---|---|---|
| P11 [#44](https://github.com/C8LyNn/aplikacja-turnieje/pull/44) | `2f0187b7242681c394c09058b5ef647667206bd6` | Organizer credential fingerprint and support session/password-version under tournament mutation lock, queued stale write `403` and zero DB side effects with PG16 interleaving unexecuted. |
| P13 [#46](https://github.com/C8LyNn/aplikacja-turnieje/pull/46) | `7f60849e389a7ed35fdd39dd5493c4c4c267d860` | Lock-protected organizer DELETE token recheck, revoked queued DELETE `403`/zero cascade and lawful `204`, physical PG16 unexecuted. |
| P16 [#49](https://github.com/C8LyNn/aplikacja-turnieje/pull/49) | `99298b81501c3e7764d653604923522a19b9f05c` | Four locked organizer password/visibility mutations stale `403` zero protected writes, lawful `200`, private-online viewer-password guard `409`, PG16 unexecuted. |

These fixes are **separate** release-based PRs, **not integrated** with PR53. They do not prove that old browser cache is purged on revoked credentials; server lock guards are a distinct threat boundary. No new reimplementation or file edits by A30.

## 5. End-of-wave / owner handoff gate

**A30 executed native app tests in R19:** `0`, `NOT_EXECUTED`, command exit/TAP `N/A`. Only connected GitHub file/blob/PR/QA metadata was read. **Source evidence ≠ runtime proof**.

- The R18 independent `SOURCE_ACCEPTED_SCOPED / FULL_PRIVACY_REVIEW_OPEN` applies only to old `8710f7fe…`; A60 must review exact **new A100 R19 HEAD** if it advances. A30 cannot self-approve.
- A50 needs an owner-connected trusted exact-SHA full repo checkout, Node22/pnpm10 frozen dependencies and authorized RTL execution. PG16 race tests of auth PR44/46/49 require separate physical isolated DB and owner/A20 reset approval; never shared/prod SQL.
- Current formal A60 R18 conclusion `HANDOFF_NOT_READY` remains unless a fresh A60 R19 exact-head report, signed owner policy and original WEB-004 38-case disposition close it. Unsigned Steam missing-secret 403/503; session TTL/token-hash/organizer rotation; sporting/backup/basket/revert contracts are **POLICY_OPEN**. A30 doesn't decide them.
- **STOP:** app code by A30, merge/rebase/cherry-pick, new PR, paid CI run, shared/production DB, Replit, staging/live, SWARM-006 dispatch. **RELEASE NO-GO**. A final owner/HQ `FINAL_HANDOFF_GO` and, if applicable, explicit `HANDOFF_WITH_RUNTIME_TEST_DEBT` cannot be presumed.

**A30 signed initial R19 checkpoint:** `PR53_R19_HEAD_UNCHANGED_AT_INTAKE / LEGACY_UNTAGGED_RETENTION_SOURCE_CONFIRMED / REBIND_UI_EXPOSURE_STATIC_INFERRED_NOT_OBSERVED / A100_R19_FOCUSED_TEST_PENDING / A60_NEW_SHA_PENDING / A50_APP_NATIVE_0 / SOURCE_REVIEW_ONLY / SWARM006_HOLD`.


---

## 6. LIVE R19 A100 PATCH REVIEW — supersedes initial old-HEAD/no-R19-patch statement

**Independent A30 readback at current R19 checkpoint:** PR53 `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34`, OPEN/DRAFT/UNMERGED, base remains `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. Compared with prior `8710f7fe5946d7f62e366303a97722d4201fc96b`: **4 R19 commits**:
1. `ffa9a18897863bd76b9121d093bfc82da2fedc16` — test-first legacy untagged rebind, B preserved, delayed old completion.
2. `72d268ee31e4d87072a992ae3f2bd08c0173ef4b` — hook produces segregated key for legacy untagged rebind.
3. `1747a9a09368e9b5bf82afd9cd718bc61d4f1490` — scoped invalidation of new verified-owner key on logout and denied 401/403.
4. `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34` — strengthen positive test ensuring fresh guarded A query evicts while B is retained.

**Exact updated app Git blobs:**

- `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts`: `1a5404e8a0dccf12063d6efb6248c2253cafee4a`.
- `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts`: `e2c12c88c051f20f08474ee0dc9f877207923624`.
- `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx`: `2196851691735e560b36099caa3d33ac649ccf84` (439 lines).

### A30 source proof of the bounded correction

1. The original producer still computes authoritative `verifiedOwner` from a successful tournament-scoped match list with an explicitly matching `{id,tournamentId}`. No numeric owner guess. Unknown/ambiguous owner disables query with placeholder `["matches",0,"game-picks"]`.
2. **Legacy detection before query binding:** the hook looks for the **exact raw legacy** `["matches",matchId,"game-picks"]` in the QueryCache. If present with missing/mismatched `web005VerifiedTournamentId` metadata, it **does not use the old raw key**, instead creates a separately addressed `["matches",matchId,"game-picks","verified-owner",verifiedOwner]`. React Query's identity is the key; therefore the existing legacy raw query's old data is **not the new query's cached data**. This directly addresses the source-rebind path described in `1–`2.
3. On new fetch, metadata records verified owner and `enabled` requires proven ownership. A legit fresh read receives new API result; original legacy untagged payload may remain cached internally, but **is not selected by this new hook** when key segregation applies. **In-memory retention is not an observed display leak and is not equivalent to deleting the legacy secret.** Any hard retention/deletion policy beyond scoped eviction remains an explicit A00/HQ risk decision.
4. Invalidation now recognizes only exact raw 3-tuple and exact 5-tuple `["matches",mid,"game-picks","verified-owner",positiveOwner]`. Given `meta.web005VerifiedTournamentId`, the previously captured A identity is purged on logout or 401/403 even if match-list proof was later evicted. `useSetMatchGamePick` calls `invalidateQueries` on the old 3-tuple prefix, which by TanStack Query prefix-matching semantics **also matches** the new five-segment owner namespace; positive actual mutation/refetch parity still needs runtime.
5. Only narrow keyed scope is touched; unrelated B=8 private-authorized/public cache is not globally purged. A successful current A/B list alone is not authorization proof across all roles; the backend remains the 403 authorization arbiter.

### Newly authored focused test (NOT_EXECUTED)

R19 `"legacy untagged picks cannot rebind or display old A after list recovery"` now seeds legacy `OLD_A_SECRET` and B `PUBLIC_B`, simulates old A in-flight query, removes A credential without parent list, supplies a new viewer credential and recovered matching list, mounts actual `useMatchGamePicks(701)` and expects:

- `data===undefined` before a new authorized HTTP response,
- owner-scoped **five-element** key with owner meta 7, original three-element orphan segregated,
- late old-identity completion cannot update the new observer,
- new HTTP payload `NEW_AUTHORIZED` is shown instead of old A payload,
- public B remains,
- removal of new viewer credential evicts the newly scoped query, B remains.

This is a meaningful test-first source contract; **it has not been run by A30 or A50**. No TAP count/exit and no browser screenshot is claimed. The R19 test separately exercises old in-flight completion as well as a new mocked response but does not independently prove all real Host route and global token edge cases.

### Residual A60 acceptance questions (narrow)

- **SCOPE:** Source correction matches the intended **legacy rebind** issue; check query/meta compatibility with old raw entries, and whether old raw entries with already owner-matching metadata or stale successful parent list can appear after an auth epoch change. This is a *conditional* additional check, not a confirmed bypass.
- **HOST & EPOCH:** `getVerifiedMatchTournamentOwner(queryClient, matchId)` scans all successful cached tournament lists without current Host tournament context. The actual Host sets `focusedMatchId` from its currently fetched matches, lowering but not eliminating stale-role/route race uncertainty. Ensure A→B route, supported viewer/support/organizer and module-global header lifecycle do not display A values under B.
- **REAL RTL:** A50 must run this new exact `d1aebf…` commit tests + prior auth hook/typecheck, report real result. A60 needs an independently signed **new SHA** source verdict, distinguishing `SOURCE_ACCEPTED_SCOPED` from `RUNTIME_VERIFIED`.

**A30 current security peer disposition at the pinned `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34` HEAD:**  
`PATCH_REVISED / LEGACY_REBIND_SOURCE_RECONCILED_SCOPED / OLD_UNTAGGED_CACHE_RETENTION_REMAINS / NO_KNOWN_BACKEND_BYPASS / NO_OBSERVED_UI_LEAK / RUNTIME_NOT_EXECUTED / A60_R19_INDEPENDENT_QA_PENDING / RELEASE_NO_GO / SWARM006_HOLD`.

**Source verdict authority:** this is an A30 *peer* recommendation, **not** an A60 release acceptance or permission to dispatch SWARM-006. A later HEAD needs its own review; do not automatically transfer this assessment.
