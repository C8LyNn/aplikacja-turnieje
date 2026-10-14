# WEB-005 — A110 R21 — T055 owner decision receipt (NOT signed)

**Wave / task:** R21.1 · `WEB-005-T055-T110-A110-R21`  
**Date:** 2026-10-14 · **Agent:** A110 Basket Concurrency & Frontend State  
**Mode:** `SOURCE_ONLY / OWNER_DECISION_INTAKE` · **Outcome:** `WAIT_OWNER / NO_NEW_EVIDENCE_OF_SIGNATURE / NO_CODE_GO`.  
**Authorisation boundaries:** no application code, no new PR, no merge/rebase/cherry-pick/composite, no tests assumed, no staging/live and no SWARM-006.

## 1. What was actually received

- [Central R21 instructions](../../WEB-005_WAVE_R21_AGENT_PROMPTS.md), verified Git blob `f90aa01ada90a0a311eb9a8d97d04a5c65c89e45`, assign A110 to *receive* owner choices and translate them to a future scoped request **only if signed**.
- [R21 single owner decision packet](../../WEB-005_R21_OWNER_DECISION_PACKET.md), verified Git blob `18dcc781f420c2aaa1f9839b6bf61e5db467d065`, explicitly says **DRAFT FOR OWNER SIGNOFF, ZERO signed decisions** and leaves all T055 D1–D6 values blank. A decision worksheet is **not** a decision.
- [Control DECISIONS.md](../../DECISIONS.md), readback blob `7907a7c47ced7232289c6164b3c27e1e64c6ebd2`, D163: T055 D1–D6 unsigned. No verified later named owner signature for T055 in reviewed sources.
- **UX044** is required as a **separate** choice by the A110 R21 instructions. It is **not a selected/signed H1/H2/H3 field in the central owner packet**. No authentic UX044 signoff recovered. Do not silently substitute T055 D6 for UX044.
- Source alternatives already fully documented in [A110 R20 Basket decisions](./WEB-005_A110_R20_BASKET_DECISION.md), Git blob `1928cb82a7f2883f06a6f6161f7acb1cb3d045b8`; **do not regenerate a duplicative unsigned decision packet**.

**Verified receipt and disposition, one field at a time:**

| Field | Legitimate choices in R21 owner packet | Received owner choice |
|---|---|---|
| D1 / authoritative revision | coherent stage-ID/version vector; persisted monotonic basket revision | **NULL / WAIT_OWNER** |
| D2 / transport | JSON expected revision/version; ETag + If-Match | **NULL / WAIT_OWNER** |
| D3 / conflict | typed 409; typed 412 | **NULL / WAIT_OWNER** |
| D4 / missing legacy precondition | 428 with upgrade; other named fail-closed 4xx/upgrade | **NULL / WAIT_OWNER** |
| D5 / stage and roster changes | full relevant invalidation; scoped token + in-lock stage/roster validation | **NULL / WAIT_OWNER** |
| D6 / loser local draft | preserve+diff+explicit rebase; preserve+reload/manual reconcile/opt-in retry | **NULL / WAIT_OWNER** |
| **UX044 / Host dirty navigation** | H1 all dirty navigation blocked/confirmed; H2 private scoped draft retention; H3 named owner-approved exception | **NULL / WAIT_OWNER** |

**No new owner-authored choice was applied, inferred, signed or backfilled.** A00 should collect D1–D6 and separately UX044 with real named owner/HQ identity, date, stable decision permalink, compatibility risk and release impact. Alternatively owner may specifically approve a documented `OWNER_APPROVED_POLICY_OPEN/BLOCKED/WONT_FIX` disposition naming residual risk, accountable owner, revisit date and release gate. **Silence is not a waiver**. A00 alone versions authentic dispositions into DECISIONS after receipt.

## 2. Pinned source and future patch request — CONDITIONAL ONLY

**Release** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` is unchanged.

Existing [server basket PUT](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/routes/tournaments.ts#L778-L815) submits the full graph without a client revision. The existing [service](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/application/stages/stage-basket-configuration.ts#L308-L381) locks records but does not compare an editor's loaded revision before replacement; the [UI PUT](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/components/stage-baskets-panel.tsx#L928-L946) submits baskets/routes without a base token. `basketFlowAuthorityVersion` is an authority **mode** marker, not a CAS revision. Missing client precondition is **SOURCE_CONFIRMED**; stale-editor lost update is **STATIC_INFERRED**, not a proven production event or executed two-user test. T055 remains `NOT_IMPLEMENTED`.

**Conditional L1, not an approved task:** ONLY after signed D1–D6 and a **separate** future A00/HQ explicit file-ownership/source-code GO, designate one backend owner for `artifacts/api-server/src/routes/tournaments.ts`, `artifacts/api-server/src/application/stages/stage-basket-configuration.ts`, related validation/OpenAPI/schema paths *as approved separately*. Provide coherent GET graph+token, transaction-locked compare-before-first-write, chosen typed 409/412, legacy fail-closed handling; if D1 requires persisted revision, A20/migration and A90/Backup compatibility approval first. Use physically isolated, owner-approved disposable PG16 for real concurrent A/B V0 → one success, one typed conflict, loser **zero writes**, plus fresh-success and invalid/legacy/roster drift/ABA/rollback tests.

**Conditional L2, not an approved task:** coordinated generated API client and `artifacts/tournament-manager/src/components/stage-baskets-panel.tsx` future exclusive owner to send chosen token and retain private losing editor's draft; handle diff/manual reconciliation and deliberate re-submit without auto-overwrite; mounted page/HTTP negative and positive tests. Do not switch backend to mandatory token without a compatible, tested client and explicit cutover plan. `D6` does **not** replace UX044.

**Conditional UX044 separate lane, not approved:** `artifacts/tournament-manager/src/pages/tournament-host.tsx` future file owner, with owner H1/H2/H3 semantics and test-first dirty scores+resultReason+SPA/popstate+logout+cross-tournament cases. No patch until separate signed decision and GO.

**STOP:** these are ownership *candidates* and acceptance criteria, not present code permissions. No implementation was started, assigned to another thread or marked QA accepted by A110.

## 3. Evidence and final release gate

- [A60 independent R20 QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R20_INDEPENDENT_QA.md), blob `bdcb24f0eb572bc58e65b4022d4490f3d6237ba1`, and [21-packet matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R20_PACKAGE_MATRIX.json), blob `cc94d51f115ceace001d7354cd20eacbbd623a34`, **HANDOFF_NOT_READY**, app runtime = 0, signed original-case dispositions = 0.
- **A110 candidate PRs unchanged, all OPEN DRAFT/unmerged on release `1fdc401d...`:** P10 [#43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) `96a6068f69027574ac76e18d4d5a2c444b5a914a`, P17 [#50](https://github.com/C8LyNn/aplikacja-turnieje/pull/50) `5457a74187edc263730c3a4b25a663bdf5531ee9`, P19 [#52](https://github.com/C8LyNn/aplikacja-turnieje/pull/52) `cce73ec47445102b216b3f8eceb4ec9de67eb1a7`. All have real A60 `SOURCE_ACCEPTED_CONDITIONAL` at exact SHA, and `RUNTIME_NOT_EXECUTED` (22 targeted authored RTL definitions, not 22 PASS). No code changes in A110 R21.
- **Separately** A60 R20 confirms current PR53 `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34` `SOURCE_ACCEPTED_SCOPED` (historic raw orphan cache policy OPEN), and PR54 `bfa9d075b431185aa8bbf87bf021d64dde8ae22f` `SOURCE_ACCEPTED_CONDITIONAL` (PR47 integration and runtime remain STOP). Do **not** claim missing A60 for those new heads now.
- [A50 R20 receipt](../A50/WEB-005_A50_R20_RECEIPT.md), blob `dffce7bf7ffd799bf33d9bb0b360d7f13ad188cb`: actual application runs 0; no trusted checkout/pnpm frozen dependencies or approved isolated PG16. **A110 R21 application test command, exit, TAP: NOT_EXECUTED**.
- [A10 R20 original 38-case ledger](../A10/WEB-005_A10_R20_38_CASES_FINAL_ONLY.md), blob `860490b1a1c407ebf70b586a607de18c00c9cf42`: 29 secondary IDs, 9 original IDs `SOURCE_ID_NOT_AVAILABLE`, 0 owner-signed 38-case dispositions. Do not invent ID or accept historic PASS.
- `FINAL_HANDOFF_GO` **not granted**, `HANDOFF_WITH_RUNTIME_TEST_DEBT` **not granted**. A10/A00/A60 original-case, policy, privacy and integration QA remain separate gate owners. A source-only author report is not A60 independent release clearance.

**Final disposition:** `A110_R21_WAIT_OWNER / NO_NEW_POLICY_EVIDENCE / T055_POLICY_OPEN / UX044_POLICY_OPEN / NO_CODE_GO / RELEASE_NO_GO / SWARM006_HOLD`.

**Immediate action A00/HQ:** return the actual named choices **D1–D6 and UX044 H1/H2/H3**, or attributed risk-accepted exception(s), with link/date; THEN evaluate separate exclusive implementation/testing GO. Do not start speculative R22 A110 source rework until owner response. Formal [R21 handoff](./WEB-005_A110_R21_HANDOFF.md).
