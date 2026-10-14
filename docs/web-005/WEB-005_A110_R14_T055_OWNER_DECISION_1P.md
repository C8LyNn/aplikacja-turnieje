# WEB-005 / A110 / R14 — T055 Basket CAS: OWNER/HQ DECISION (1 PAGE)

**Status:** `POLICY_OPEN / SOURCE_CONFIRMED_NO_CLIENT_CAS / IMPLEMENTATION_NOT_AUTHORIZED`  
**Owner:** A00 → global HQ/product owner. **Source baseline:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. **No R14 code GO.**

### Problem, not a decision

The [GET/PUT stage-baskets routes](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/routes/tournaments.ts#L778-L815) expose/accept full basket graphs but the PUT passes only `baskets/routes` into `replaceStageBasketConfiguration`. The existing lock serializes writes but there is **no client expected-revision check**. Two editors with the same old graph may both receive success, and the later full replace can erase the earlier edit. That is **SOURCE_CONFIRMED absence of a precondition**, while a live two-editor collision is **NOT_EXECUTED**, not a demonstrated incident. `basketFlowAuthorityVersion` is a legacy/explicit mode marker, **not** a CAS revision.

### Six explicit choices — owner to select, not A110

| ID | A | B | Signed selection |
|---|---|---|---|
| **D1 token** | Same-snapshot `stageId/version` vector; only if all mutation writers invalidate it, without SQL | Persisted monotonic basket-config revision; requires migration + A20/A90/Backup contracts | ___ |
| **D2 wire** | JSON `expectedStageVersions`/`expectedRevision` | HTTP `If-Match`/opaque ETag | ___ |
| **D3 stale response** | 409 Conflict + stable domain code | 412 Precondition Failed + stable domain code | ___ |
| **D4 missing token (legacy)** | 428 Precondition Required | Another **approved fail-closed** 4xx + upgrade guide | ___ |
| **D5 invalidation** | Changed stage set/version/roster invalidates base | Basket-only revision with separate stage/roster checks | ___ |
| **D6 client conflict UX** | Keep draft, show server-vs-local diff and explicit reconcile/rebase/discard | Keep draft, require explicit reload/reconcile then opt-in retry | ___ |

### Non-negotiable acceptance, whichever options are signed

- Atomic coherent **GET basket graph + base token**, never mix old graph with fresh separately fetched versions.
- **POST/PUT fail-closed:** organizer reauthorized, precondition checked **under DB lock before any graph mutation**; missing token rejected; stale editor **zero writes**.
- Two valid V0 editors: exactly **one 200** and **one owner-selected 409/412**; winner graph intact, loser local draft retained, no blind auto-retry or forced overwrite.
- Negative coverage: ABA, stage-set mismatch, roster edit, legacy implicit graph/first save, malformed/missing token, unauthorized client, partial-write/rollback error. Positive: single fresh PUT, subsequent GET token advance, explicit user-managed conflict resolution.
- **No premature backend semantics choice**, no migrations, no R14 draft PR, no integrations. Run tests only on authorized physically isolated PG16.

**Approval record:** `D1=__ D2=__ D3=__ D4=__ D5=__ D6=__ OWNER=__ APPROVED_AT=__ A20/A90/A100_CONSULT=__ NEW_GO_TASK_ID=__`.

**Next unblocker:** owner/HQ signs D1–D6 and A00 assigns a separate exclusive test-first code lane **in a later wave**. Until then T055 `POLICY_OPEN`. Previously withdrawn StageBasketsPanel ordinary A→B advanced draft transfer remains **WITHDRAWN**; backup import creates a **new** tournament and never overwrites existing B.

**Context:** [A110 R14 QA packet](./WEB-005_A110_R14_FRONTEND_QA_BASKET_POLICY.md) · [R11 detailed six-choice decision](./WEB-005_A110_R11_T055_POLICY_AND_UX_QUEUE.md).
