# WEB-005 — A100 R21 / Legacy unknown-owner cache policy decision intake

**Task / agent:** `WEB-005-T080-A100-R21` — A100 Session Security & Private Access.  
**Mode:** `SOURCE_ONLY / OWNER_DECISION_INTAKE / NO_CODE_GO`.  
**Authority:** [R21 master §§0–2, AGENT A100](../../WEB-005_WAVE_R21_AGENT_PROMPTS.md), Git blob `f90aa01ada90a0a311eb9a8d97d04a5c65c89e45`.  
**Binding decision source:** [WEB-005_R21_OWNER_DECISION_PACKET.md](../../WEB-005_R21_OWNER_DECISION_PACKET.md), Git blob `18dcc781f420c2aaa1f9839b6bf61e5db467d065`, **DRAFT FOR OWNER SIGNOFF**; `LEGACY_CACHE=A/B/approved defer___` remains unfilled at verification.  
**Owner-signature evidence:** **NONE VERIFIED** — no selected option, named accountable signer, dated decision permalink, formally accepted risk, release condition, or review trigger. R21 status: **`WAIT_OWNER / POLICY_OPEN`**. **A100 has NOT chosen A/B/defer.**  
**Date:** 2026-10-14 Europe/Warsaw.  
**Existing PR:** [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53), `fix/web-005/t080-s2a-private-auth-query-cache-r13` HEAD **`d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34`**, OPEN DRAFT / unmerged; release/base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. `PR53_FROZEN` — no source or test-file changes during R21.

## 1. Exact independent QA, what it does and does not certify

- [A60 independent R20 exact-SHA QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R20_INDEPENDENT_QA.md), blob `bdcb24f0eb572bc58e65b4022d4490f3d6237ba1`, states **`SOURCE_ACCEPTED_SCOPED_ON_EXACT_SHA`** at PR53 `d1aebfc...`. This supersedes older statements that there was no current independent review. Specifically the R19 hook segregates a reused old untagged match-picks triple into a new owner-qualified five-part key; exact owner metadata permits scoped logout and 401/403 eviction; no global B purge or matchId-to-tournamentId inference.
- [A30 R20 security peer](../A30/WEB-005_A30_R20_HANDOFF.md), blob `172d2cf1bca53218cbf5ff3cb8a31e9a3c563f08`, agrees on source-level protection of the verified hook but **not** a blanket privacy certification.
- [A50 R20 receipt](../A50/WEB-005_A50_R20_RECEIPT.md), blob `dffce7bf7ffd799bf33d9bb0b360d7f13ad188cb`: **zero native app tests verified**; no trusted per-SHA monorepo checkout, Node22/pnpm10 frozen install plus authorized executor and no dedicated PG16. **A100 R21 app tests: `NOT_EXECUTED`**; no command+exit/TAP, not `RUNTIME_VERIFIED`. Frontend-only PR53 RTL does not need PG16.
- Historical [GitHub Actions run 38631806899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38631806899) at current PR53 SHA failed at inherited Pack19 `readOnly:true` matcher vs existing `accessMode:"read only"`; separate draft PR35 owns correction. This did **not** run PR53 targeted RTL and is not a privacy feature PASS/FAIL.

**Hence:** source acceptance is **bounded to current verified-owner rebind isolation**, not erasure of all raw old entries, full browser session security, or completed release readiness. A60 R20 also found `HANDOFF_NOT_READY`.

## 2. Exact residual / evidence-limited risk definition

**Identifier:** `PR53-R21-LEGACY-UNKNOWN-OWNER-RAW-CACHE` — retained old untagged cached data with missing owner proof.

A pre-R18 TanStack Query entry `['matches',701,'game-picks']`, created under previous A=7 authorization and containing a private fictional `OLD_A_SECRET`, can remain in in-memory QueryClient after logout or credential replacement **if** no `meta.web005VerifiedTournamentId` and no successful currently cached tournament-scoped `/api/tournaments/7/matches` owner proof exist. The evictor cannot infer the tenant safely from match ID 701 alone. A blanket purge of all `['matches',...]` could erase unrelated lawful B=8/M801 data and is **not authorized**.

The current hook, once a fresh canonical list proves `{id:701,tournamentId:7}`, detects the stale raw query with missing/mismatched metadata and subscribes instead to `['matches',701,'game-picks','verified-owner',7]`; it attaches `meta.web005VerifiedTournamentId=7` and does not intentionally display the old raw result. On later 401/403 or credential removal, it can evict that tagged query while preserving B. **A retained orphan != confirmed browser leak**. It is nevertheless still potentially readable by other unchecked raw-cache consumers and does **not** satisfy a formal *full in-memory erasure* guarantee.

Other boundaries not closed by A100's narrowly scoped source patch: browser route A→B under concurrent observers, module-global request-header token lifecycle, component-local drafts, and the use of legal public B results. No actual user compromise has been observed or verified by native RTL/browser testing.

## 3. Exact owner/HQ decision alternatives — no chosen default

| Owner option | Scope and required risk statement | Source implementation consequences | Conditions and release effect |
|---|---|---|---|
| **A: `LEGACY_CACHE=A`** | Explicitly **accept limited in-memory retention of unattributed raw entries until session end**, only to the extent they cannot be displayed by the current verified Hook. Record who accepts, precise affected SHA, information retention consequence, alternative raw consumers uncertainty, date/review trigger and A60 independent risk assessment. Do **not** label full erasure or app security PASS. | **No R21 code.** Current PR53 remains source-accepted scoped. All new reads and owner-qualified eviction contract remain mandatory. | Require named signer and published decision, A30 peer/A60 risk acknowledgment, and native RTL/browser A→B, late result, 401/403, B preservation on exact SHA. If runtime unavailable, later separate **owner-signed** runtime-debt transfer only after all source/policy/38-case gates close; hard release NO-GO until executed PASS. |
| **B: `LEGACY_CACHE=B`** | Explicitly require **physical removal of legacy unattributed private cache entries**, beyond scoped UI non-reuse. Define scope across old versions/active observers and desired retention lifetime, threat boundary, and what to do when attribution cannot be proven. | **Future separate contract and written A00 exact-file/test-first GO**, after signed owner choice and independent QA defect/risk characterization. No implementation in R21. See safe approach below. | Requires A60 review of proposed semantics, A50 native tests, rollback and controlled integration gate. A policy choice is **not** an immediate authorization to change PR53, merge or dispatch SWARM-006. |
| **Approved defer** | Only if owner/HQ explicitly signs **OWNER_APPROVED_DEFER** with accountable role, concrete accepted risk, expiry/review date/trigger and feature/release implications; silence is not defer. | None now; leave targeted task open. | No automatic handoff or blanket waiver of proven source/security defects; A00 and A60 must determine if final closeout can proceed under the specific exception. |
| **No response (actual observed)** | `LEGACY_CACHE=___`, no dated signature/permalink in R21 packet or checked DECISIONS.md. | `WAIT_OWNER`. | **`WEB005_IN_PROGRESS / HANDOFF_NOT_READY / RELEASE_NO_GO / SWARM006_HOLD`**. |

### If B is signed: proposed bounded safe identity/migration contract for *future* GO

1. **Source of truth:** an authoritative tournament-scoped successful match list explicitly contains `{id: matchId, tournamentId: tid}`; do not infer from raw match ID or reuse a conflicting/foreign list. Trusted owner metadata from a prior verified fetch may be used only when independent QA confirms its lifecycle and auth epoch.
2. **Owner-known legacy entries:** match the **exact** raw 3-tuple, compare verified owner to affected tenant, cancel in-flight request, evict safely without touching B. Preserve 7 vs 70 boundary, separately handle 401/403 and old deferred response. Never log tokens or store bearer token values in query keys.
3. **Owner-unknown legacy entries:** if owner cannot be proven, **do not globally attribute to A, B or any tenant**. Owner/HQ must explicitly choose a scoped strategy, e.g. **version/epoch-based namespace retirement for old cache clients with a bounded storage lifecycle**, and test effect on legal B. Such a protocol is a *proposal*, not already proven to provide physical erasure; if full erasure cannot be guaranteed without broader session-lifecycle change, record **`BLOCKED_CONTRACT`** and require separate cross-owner file reservations.
4. **Test-first acceptance:** old A=7/M701 raw `OLD_A_SECRET` plus pending late A GET, B=8/M801 `PUBLIC_B`; A→B auth and route, list disappearance/reappearance, new valid A data, denial 401/403, active observer and A/B id parity, no unauthorized render **and**, if B selected, no forbidden raw residual retention after chosen cleanup boundary; B remains lawful and unaffected.
5. **Exclusive future file GO / integration:** A00 specifies exact PR/branch, SHA, owned files (`deadlock-bans-picks.ts`, `tournament-query-invalidation.ts`, tests and only separately reserved cross-owner auth/provider files if proven necessary), independent A60 source FAIL or accepted new requirement, and rollback. No global `queryClient.clear()` by default; no code in R21.

## 4. Owner signoff receipt and next unblocker

**Required decision record:** `LEGACY_CACHE=A/B/explicit defer`; owner/HQ name/role, exact timestamp, signed answer permalink, risk accepted, affected PR53 SHA, review trigger/date, A60 QA opinion, RELEASE/HANDOFF effect. At time of this R21 read **all relevant choice fields are unsigned** in [owner packet](../../WEB-005_R21_OWNER_DECISION_PACKET.md). `OWNER_APPROVED_EXCEPTION=FALSE/NOT_VERIFIED`. No signed transfer authorization.

**A00 immediate action:** solicit the **single missing owner/HQ legacy cache choice** from the R21 decision packet; if signed, version it in `DECISIONS.md`, request A60 risk confirmation and route consequences to A50. All other R21 owner signoffs and original WEB-004 38-case source/dispositions remain A00/A10 responsibility. Do not repeat speculative source waves while awaiting signature.

**Final A100 source/policy state:** `PR53_FROZEN / A60_R20_SOURCE_ACCEPTED_SCOPED / LEGACY_CACHE_WAIT_OWNER / 23_AUTHORED_RTL_CASES_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD`.
