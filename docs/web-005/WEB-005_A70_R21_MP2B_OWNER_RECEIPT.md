# WEB-005 — A70 R21 / MP2B Owner Decision Receipt

**Task:** WEB-005-T040-A70-R21 · **Role:** A70 Match Lifecycle & Undo · **Date:** 2026-10-14 Europe/Warsaw  
**Status:** **WAIT_OWNER / NO_NEW_OWNER_CHOICE / NO_CODE_GO**  
**Decision ID:** WEB-005-T040-MP2B-OWNER-DECISION-R21  
**Owner decision source:** [WEB-005_R21_OWNER_DECISION_PACKET.md](./WEB-005_R21_OWNER_DECISION_PACKET.md) §4, Git blob `18dcc781f420c2aaa1f9839b6bf61e5db467d065`.  
**Source rules:** [R21 AGENT A70](./WEB-005_WAVE_R21_AGENT_PROMPTS.md) and §0–§2. Local coordinator A00, global HQ/Queen external.

## 1. Actual owner receipt: unsigned, NOT an agent choice

Read the owner packet from central `chore/web-005/t000-wave1-control` and [DECISIONS.md](./DECISIONS.md), entries D160–D166. The §4 decision cells are literally:

- `MP2B=___` → **NO RA/RB/RC owner selection**.
- `wire field name=___` → **NO external request contract selected**.
- `legacy sunset (RB)=___` → **NO RB transition date/authorization**.
- `review/defer (RC)=___` → **NO signed deferral owner/date/risk**.
- Overall `OWNER/HQ: signature / role / date / permalink` → **EMPTY**.
- Central D163: `POLICY_OPEN`; D165 explicitly requires `WAIT_OWNER` if absent. No separate actual owner/HQ signed decision permalink was provided or verified during A70 R21 intake.

**Receipt fields:** `selected_option=null`; `signed_by=null`; `signed_at=null`; `source_permalink=null`; `approved_wire_name=null`; `authorized_read_contract=null`; `host_rollout=null`; `accepted_residual_risk=null`; `implementation_GO=false`. The owner packet is a draft questionnaire, not a signed instruction. **No default RA is inferred from technical recommendation. RC is not silently approved merely because the work is blocked.**

## 2. Frozen A70 source and independent QA

| Package | Verified exact HEAD on R21 | GitHub state | Independent / native evidence |
|---|---|---|---|
| [P09 PR #42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) global LIFO/roster | **021bed269f9ea8ac8ce53caeea44263c098aa2dd** | OPEN DRAFT, unmerged, identical to R20; compare old→branch: 0 commits, 0 file changes | [A60 R20 independent QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R20_INDEPENDENT_QA.md): carried exact-head R18 `SOURCE_ACCEPTED_CONDITIONAL`; PG16 queued X/newer Y 409/zero-write `NOT_EXECUTED` |
| [P06 PR #39](https://github.com/C8LyNn/aplikacja-turnieje/pull/39) Cancel/Restore | `16053ee132756ca05b6f2cd1f0cabae823905387` | OPEN DRAFT, unmerged | Separate source package, no PG16 R21 claim |
| [P18 PR #51](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) historical Undo | `2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a` | OPEN DRAFT, unmerged | Separate source package, no PG16 R21 claim |

**R20 QA & runtime:** A60 direct report Git blob `bdcb24f0eb572bc58e65b4022d4490f3d6237ba1` returned `HANDOFF_NOT_READY`; [A50 R20 receipt](./agent-reports/A50/WEB-005_A50_R20_RECEIPT.md) Git blob `dffce7bf7ffd799bf33d9bb0b360d7f13ad188cb` confirms **0 native app tests**, no approved full checkout/pnpm10/isolated PostgreSQL16. A70 R21 executed **no native application command**, exit/TAP/HTTP/SQL: **NOT_EXECUTED**.

[Previous R20 owner policy (not signed)](./WEB-005_A70_R20_MP2B_OWNER_SIGNOFF.md) remains technically informative; do not republish its alternatives as new progress.

## 3. Conditional future code-lane request — NOT AUTHORIZED

Only **after** a genuine dated/signable HQ selection, A00 may open a separate narrow test-first source task on a newly pinned exact SHA and exclusive file/hunk window:

- **If signed RA (strict cutover):** public POST `/matches/:id/revert` validates and forwards both selected required CAS tokens; authorized match-specific current completion action ID paired with revision; synchronized OpenAPI, generated backend Zod, React client and Host confirmation with explicit old-tab refresh/reconfirmation; negative 422, stale/ABA 409, zero-write, lawful success once and preservation of internal T050 correction receipts.
- **If signed RB (time-boxed legacy):** same strict new public path **plus** explicitly named versioned/gated legacy route with signed role restrictions, hard sunset, monitoring/rollback and responsible deprecation owner. No silent optional CAS bypass.
- **If signed RC (defer):** **NO MP2B CODE TASK** until the named review trigger/date; record residual stale-reversal risk, release disposition and responsible owner. A signed deferral is not an implementation, source fix or unconditional handoff waiver.
- **Still owner-unresolved in all implementation choices:** external `expectedMatchRevision` vs `expectedRevision` spelling; `expectedCompletionActionId` pairing; 422 vs malformed raw JSON parser 400 policy; stale revision/action 409 precedence; authorized completion read roles (including >50 entries); generated client/Host cutover and access restrictions. Do not fill these via agent inference.

The future API change would touch `artifacts/api-server/src/routes/tournaments.ts`, already overlapping PR #39/#42/#44/#46/#51, plus selected OpenAPI/Zod/React/Host/read-model scope; A00 must reserve owners and integration-aware base. Neither a signature on policy nor this request authorizes coding, merging or running SWARM-006.

## 4. FINAL-ONLY gate and owner action

A10 R20 original 38-case registry shows 29 secondary identifiers and **9 SOURCE_ID_NOT_AVAILABLE**; the A70-related original cases `CC-01`–`CC-04` lack signed per-row owner dispositions. A60 R20 `HANDOFF_NOT_READY`. Runtime-debt transfer/one final SWARM-006 authorization are not signed. Hence **WEB-005 IN_PROGRESS / RELEASE_NO_GO / SWARM-006 HOLD**.

**One exact next action:** HQ/owner chooses **RA, RB or RC** in [R21 packet §4](./WEB-005_R21_OWNER_DECISION_PACKET.md), fills required wire/Host/read/422–409/expiry-or-deferral fields, signs with accountable identity/date/permalink and sends to A00. If no response, preserve `WAIT_OWNER` and do not issue another speculative code/report wave.

**R21 activity:** documentation-only status intake; **PR42/39/51 unchanged**, no application code, merge, SQL, paid CI, staging/live, Replit, SWARM-006 or ownership takeover.
