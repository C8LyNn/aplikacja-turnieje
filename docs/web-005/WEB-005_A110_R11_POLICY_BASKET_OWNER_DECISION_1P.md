# WEB-005 / A110 / R11 — POLICY-BASKET (OWNER/HQ ONE-PAGER)

**Decision requested:** `T055 / UX-047` concurrent full basket configuration PUT; **status: POLICY_OPEN**. **Owner:** A00/HQ. **Source baseline:** `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. **No implementation authority from this document.**

### What is broken (source confirmed)

`PUT /tournaments/:id/stage-baskets` replaces the entire basket graph without a client precondition. Server locks the tournament and stages and increments `stage.version`, yet two valid editors starting from V0 can both commit one after another; second commit silently loses the first edit. `basketFlowAuthorityVersion` is a binary legacy-vs-basket **mode flag**, not a CAS version. Concurrent production repro is **not runtime verified**.

### Six choices to sign (not defaults)

| ID | Alternative 1 | Alternative 2 | Decision |
|---|---|---|---|
| **D1 Token** | GET delivers **coherent stage ID/version vector** alongside graph, under a consistent snapshot; lock-checked on PUT; **no DDL** only if all mutation writers invalidate it | Add monotonic persisted `basketConfigRevision`; **requires migration + A20/A90** | ___ |
| **D2 Wire** | JSON `expectedStageVersions` / `expectedRevision` | HTTP `If-Match` against opaque basket ETag | ___ |
| **D3 Stale** | **409 Conflict** + domain `STAGE_BASKET_CONFIGURATION_STALE` | **412 Precondition Failed** + same domain code | ___ |
| **D4 Missing token** | **428 Precondition Required** | Other expressly approved **fail-closed** 4xx (never accept) | ___ |
| **D5 Other writers** | Any stage ID/version/roster change invalidates base | Basket-only revision with separately validated stage/roster constraints | ___ |
| **D6 Conflict UI** | Keep local draft, show server-vs-local diff, explicit rebase/discard | Keep local draft, require explicit reload/reconcile before retry | ___ |

**Invariant across every combination:** GET graph+token must be coherent; do not combine old graph with separately refreshed stages. Freeze editor V0; under lock, reauthorize and compare precondition **before writes**. For two editors issuing V0 PUTs, **exactly one 200** and **one controlled D3 conflict**, loser **zero writes**, persisted winner graph unchanged, loser draft preserved. No automatic resubmission/force overwrite. A missing-token legacy client fails closed. Test legacy implicit graph, changed stage set, ABA, roster drift, rollback, no partial writes.

**Sign-off fields:** `D1=__ D2=__ D3=__ D4=__ D5=__ D6=__ owner=__ approved_at=__ implementation_lane=__ A20/A90/A100_review=__`.

**GO:** owner decision and future test-first patch in a subsequently assigned lane. **STOP now:** no T055 code, SQL, merge, CI billing, deployment or SWARM-006. **Source/test detail:** [A110 R11 policy and UX queue](./WEB-005_A110_R11_T055_POLICY_AND_UX_QUEUE.md) and [20-case fixtures](./WEB-005_A110_R11_TEST_FIXTURES.json).
