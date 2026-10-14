# WEB-005 — A70 R20 / owner signoff: public Direct Revert dual CAS + Host compatibility

**Decision request:** `WEB-005-T040-MP2B-OWNER-DECISION-R20`  
**Agent/task:** A70 — Match Lifecycle & Undo / `WEB-005-T040-A70-R20`  
**Date:** 2026-10-14, Europe/Warsaw  
**Source authorization:** `WEB-005_WAVE_R20_AGENT_PROMPTS.md` §§0–2 and AGENT A70 — SOURCE ONLY, NO CODE GO  
**Coordinator:** A00 local Implementation Lead; final product-policy authority: named owner/HQ (one global Queen, separate project).  
**Release baseline:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**Status:** **OWNER SIGNATURE REQUESTED — POLICY_OPEN / NOT SIGNED / CODE STOP / RELEASE_NO_GO / SWARM-006 HOLD**.

> **This is a proposed decision contract, not an executed approval.** A00/HQ must select, date and sign one option and the implementation interface below. A70 does not silently choose a product policy or grant code, test-debt, integration or deployment authorization.

## 1. Exact R20 GitHub/source confirmation

| Independent package | Live SHA verified R20 | Status |
|---|---|---|
| [P09 / PR42 global Undo](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) | **021bed269f9ea8ac8ce53caeea44263c098aa2dd** | OPEN DRAFT; independent [A60 R18](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md) **SOURCE_ACCEPTED_CONDITIONAL** at exact HEAD; PostgreSQL16 race/rollback **NOT_EXECUTED** |
| [P06 / PR39 Cancel/Restore](https://github.com/C8LyNn/aplikacja-turnieje/pull/39) | 16053ee132756ca05b6f2cd1f0cabae823905387 | OPEN DRAFT; separate candidate |
| [P18 / PR51 historical Undo](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) | 2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a | OPEN DRAFT; separate candidate |

**R19 QA:** [A50 R19 central receipt](./agent-reports/A50/WEB-005_A50_R19_RECEIPT.md), Git blob `412117e31c297353b35a3c21fbd616d41754d4b6`, confirms **0 native API/React/PG16 app test executions**: no trusted complete per-SHA checkout, pnpm dependencies or authorized disposable physical PG16. The R19 A60 handoff was **not found** at inspected central `agent-reports/A60/WEB-005_A60_R19_HANDOFF.md` / `WEB-005_A60_R19_INDEPENDENT_QA.md` or a discovered a60-r19 branch. Do not invent an R19 exact-SHA acceptance or claim R19 QA never happened elsewhere. For unchanged PR42 the directly confirmed independent result remains A60 **R18** conditional acceptance, not native runtime PASS. PR42 commit Actions query returned zero matching workflows and zero submitted PR reviews; the A60 R18 report exists independently of inline GitHub review.

**Public boundary SOURCE_CONFIRMED at pinned release SHA:**
- `artifacts/api-server/src/routes/tournaments.ts` `POST /matches/:id/revert` checks path, match owner and write actor, then invokes `revertMatch({ matchId, expectedTournamentId, actor })` **without parsing/passing public request body CAS fields**. `GET /tournaments/:id/action-log` returns **latest 50** entries, not an authoritative match-completion cursor.
- `artifacts/api-server/src/application/matches/revert-match.ts` supports **optional** domain `expectedMatchRevision` and `expectedCompletionActionId` checks under its own transaction; separate internal T050 controlled-correction path relies on stage vector/receipt.
- `lib/api-spec/openapi.yaml` has no `/matches/{id}/revert` requestBody. Generated backend Zod/React contract has no mandatory two-token payload; `lib/api-client-react/src/generated/api.ts` accepts `revertMatch(id, options?)`, and Host `tournament-host.tsx` calls `revertMatch.mutate({ id: matchId })` without tokens.
- Direct Revert strict HTTP CAS, completion ID retrieval and Host old-tab behavior are **not implemented merely by PR39/42/51**. Those patches must remain independent until separately authorized integration.

## 2. Choose EXACTLY ONE owner policy (no A70 default approval)

### [ ] OPTION A — Strict dual-token CAS, synchronized API/Host cutover

Public `POST /matches/{id}/revert` requires two current immutable tokens: expected match revision and active completion action ID. Source of both must be an authorized match-specific read tied to one revision, not latest-50 action log. Release backend validation, authorized read model, OpenAPI, generated backend Zod, React client and Host together. Old open Host/browser tabs posting the legacy no-body form must refresh/reconfirm; they do **not** bypass CAS. Written migration order, telemetry, rollback and stale-UI instructions are required. Internal T050 correction callers retain their separate service contract.

### [ ] OPTION B — Time-boxed, explicitly gated old-Host compatibility

The **new** public path requires exactly the same strict pair as A. A separate explicitly named/versioned or feature-gated *legacy surface* may temporarily serve old clients without these tokens only under owner-signed actor restrictions, legacy risk acknowledgement, telemetry, hard expiry, removal executor and rollback condition. Do not silently preserve indefinite no-body behavior on the same unversioned new route, and never represent legacy calls as CAS protected. End state becomes A at the signed deadline.

**B requires nonempty:** `legacy_path_or_version`, `actor_allowlist`, `start_date`, `hard_end_date`, `deprecation_UI`, `request_count_metric`, `rollback_trigger`, `sunset_owner`, `accepted_residual_risk`. An incomplete B is NOT an actionable decision.

### [ ] OPTION C — Explicit deferral / code STOP

Keep current public behavior and document residual reversal-race risk; do not start MP2B implementation. Record deferral owner, review trigger/date, severity and a future design owner. This is the **present administrative state** (no signed decision exists), **not** proof HQ chose to retain it indefinitely.

## 3. API & UX semantics to sign regardless of A/B selection

| Contract cell | Proposed technical behavior — NOT currently live |
|---|---|
| JSON request body | `{"expectedMatchRevision":7,"expectedCompletionActionId":1234}`. **Both required**. Owner may choose public `expectedRevision` instead of `expectedMatchRevision` — select exactly ONE canonical wire name; no implicit alias/coercion. |
| Token validation | JSON finite positive **safe integers**. Reject missing/null/arrays/string/negative/zero/decimal/unsafe, incorrect object shape and extraneous keys as agreed. Machine-readable **422 `INVALID_REVERT_PRECONDITION`**, zero writes, for schema error. Raw syntactically malformed JSON may currently be framework **400**; owner signs 400 vs 422 normalized mapping rather than assuming a framework guarantee. |
| Stale revision or ABA | HTTP **409 `CONCURRENT_MODIFICATION`**, zero writes; compare revision under locked transaction, never infer freshness from unchanged visible score/status. |
| Stale, wrong or superseded completion action ID | HTTP **409 `UNDO_ACTION_CHANGED`**, zero writes. A successful revert followed by a new completion must not allow the old token to undo the new completion. |
| Both tokens stale | Pick stable, documented precedence. Proposed match revision before completion ID follows existing domain order, but final decision owner-signed. No mutation. |
| Valid current pair | 200; exactly one legal revert and one undo receipt; preserve immutable `result_history` and existing downstream/qualification/correction guards. |
| Double submit | At most one success; second identical request gets controlled 409, no duplicate log or history rewrite. No auto-retry with new tokens. |
| Completion ID read model | Select **one** owner-approved authorized match detail field or dedicated endpoint giving pair `{revision,activeCompletionActionId}`. Reads must work even after >50 unrelated actions. IDs exposed only to current authorized organizer/support with access recheck; no undoPayload/private historical data. |
| Host stale UX | Capture immutable pair when operator confirms. On 409 close/hold stale mutation, refetch context, show operator-visible conflict, request a NEW human confirmation; do not silently replay against new revision/action ID. |
| Authorization | Current anonymous/viewer/revoked-support/foreign-tournament restrictions and existing tournament permissions remain effective; rejected requests zero-write. |
| Internal correction compatibility | Do not make domain `revertMatch` parameters globally mandatory in a way that breaks T050 stage-version-vector/correction operation receipts; scope strict requirement to approved public HTTP boundary. |

**Boundary questions A00/HQ must answer explicitly:**
1. Canonical external naming of match revision token?
2. Invalid raw JSON parser 400 or mapped 422? Precise error envelope?
3. Stale error precedence for both mismatches?
4. Authorized `activeCompletionActionId` retrieval path/role visibility, representation when none, and coupling with match revision?
5. Hard cutover / old-tab refresh UX (A), or the fully bounded legacy contract with expiry and named sunset executor (B)?
6. Is the accepted scoped historical data exposure risk of showing an action ID mitigated (no raw private payloads)?
7. Final migration/scheduling sequence to avoid server-only cutover breaking existing Host and currently open tabs?

## 4. Signable owner decision record — fill, sign, commit separately

| Required field | Authority entry |
|---|---|
| Decision ID | `WEB-005-T040-MP2B-OWNER-DECISION-R20` |
| Signed disposition | **[A STRICT / B TIMED LEGACY / C DEFER]** — NOT YET ENTERED |
| Chosen external wire keys | **[__________]** |
| Value validation / schema error / raw JSON parser status | **[__________]** |
| Stale revision vs completion priority | **[__________]** |
| Completion ID read endpoint/response+roles | **[__________]** |
| Host old tabs and coordinated rollout sequence | **[__________]** |
| If B: full signed time-boxed legacy profile | **[__________]** |
| If C: named deferral owner + revisit condition | **[__________]** |
| Risk/privacy/sporting compatibility acceptance | **[__________]** |
| Named approving owner/HQ, timestamp, version and Git commit reference | **[__________]** |
| Separate future A00 code task GO / exact base and exclusive file window | **[NOT GRANTED]** |
| Separate test-debt/final handoff/deploy permission | **[NOT GRANTED]** |

**Unsigned form never counts as policy approval.** An owner signature on this product policy is NOT automatically code GO or integration permission. A00 must separately allocate file ownership (`routes/tournaments.ts` collides PR39/42/44/46/51; Host/React/OpenAPI/Zod owner lanes), define test-first exact-base implementation and obtain independent A60 exact-SHA review plus real A50 runtime receipts.

## 5. Focused future test-first gate — only after separate GO

**MP2B M01–M12 expected outcomes:**
- M01: current revision+completion ID, played / walkover / no_contest (where lawful) → HTTP 200, exactly one revert; result_history preserved.
- M02: empty body, missing either token, string, negative, fractional, 0, unsafe integer, null, array → proposed 422 + zero writes; raw malformed JSON per separately signed parser policy.
- M03: changed revision with same visible match state (ABA) → 409 CONCURRENT_MODIFICATION, zero writes.
- M04: current revision but stale completion ID → 409 UNDO_ACTION_CHANGED, zero writes.
- M05: complete A → revert A → complete B → request tied to A cannot revert B.
- M06: simultaneous identical requests → one 200 maximum; remaining 409, no double action log/history mutation.
- M07: completed match's active completion ID older than 50 latest tournament actions → authorized read still returns correct revision-linked ID, no fallback guessing.
- M08: anonymous, viewer, revoked support, cross-tournament match ID → existing auth denial/404, zero-write.
- M09: downstream started, stage advanced, qualification committed → existing sporting protections preserve state and error mapping.
- M10: internal T050 controlled-correction stage vector and receipts remain compatible and tenant-safe.
- M11: old Host tab behavior matches signed A/B rollout (no silent bypass in new path).
- M12: stale confirmation UI refetches match then requires human reconfirmation, does not auto-resubmit.

**Separate P09 / PR42 PG16 non-waived runtime debt (NOT an MP2B implementation test):** owner/A20 physically isolated disposable PostgreSQL16 test DB + explicit `tm_test_t040_r20_roster` schema reset approval + trusted full exact-SHA checkout Node22/pnpm10/frozen deps. A50 must verify actual X queued on tournament lock by `pg_blocking_pids`; B commits newer Y; stale X returns 409 and produces **zero writes** relative to post-Y snapshot, both for `delete_player` and `restore_player`. Valid newest Undo returns 200; generic `revert_match` and `restore_status` regression cases stay green. Source-authored tests already exist on PR42, but no actual command, exit/TAP or PostgreSQL16 ledger exists at R20 A70 read. Test-only schema cleanup never proves request rollback. No paid CI or shared/prod SQL.

## 6. Original WEB-004 traceability and final handoff boundary

A10 R19 [21-PR/38-case registry](./agent-reports/A10/WEB-005_A10_R19_FINAL_ONLY_PACKAGE_AND_38_CASES.md) records **29 known original case IDs and nine original IDs unavailable**. A70/T040 relates to recognized `CC-01`–`CC-04`, linked to P06/PR39, P09/PR42 and P18/PR51 as candidate remediation; their **owner per-row dispositions are NOT_SIGNED**. Do not invent missing nine IDs or assign resolution status merely because three PRs exist. An authentic WEB-004 source matrix must be recovered by the responsible agents, not fabricated here.

**Final project gate:** current WEB005 IN_PROGRESS, source/owner-policy/38-case disposition incomplete, native app runtime zero, no composite SHA or accepted release QA. A00 alone may request separate owner/HQ `FINAL_HANDOFF_GO` when all source and signed policy/backlog gates close. Explicit `HANDOFF_WITH_RUNTIME_TEST_DEBT` is a separate possible owner decision thereafter, never a default waiver; it does not allow release before composite QA in SWARM-006. No code/merge/cherry-pick/rebase, database changes, deployment, paid CI, Replit or SWARM-006 action authorized in R20 A70.
