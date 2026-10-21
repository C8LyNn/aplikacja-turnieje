# WEB-005 / W6H — A20 server Basket CAS implementation contract (CANDIDATE)

**Role:** A20 — architecture/contract owner; implementation: **A50**; independent QA: **A30/A60**; A110 consult only; A00 owns D01–D04 and go/no-go.  
**Status:** `SOURCE_CONTRACT_READY / PERSISTENCE_SCHEMA_OWNER_GO_REQUIRED / HTTP_INTEGRATION_NOT_RUN`. This file is a specification, **not a server implementation or migration**.  
**Pinned source:** frozen C03 Draft PR #134 HEAD `80bb4ca7a9a359fbe76dbab1478a1af16ded0174`; PR #55 fail-first test-only HEAD `c3a4ea00ba933cbab36b3582859cb3eff20f0204`; inactive client #63 HEAD `52f3e1db334fc5b178fb3f4ed21d4099a0d6558f`; #130 test child `295783b8d7af907a5adfe3c6a3c1d199e29408e9`.

## 1. Confirmed starting code — no redesign of existing functionality

- Current `artifacts/api-server/src/application/stages/stage-basket-configuration.ts` source Git blob `7814928721fb3b3af11ef6960c4944ef96c2d128`: `getStageBasketConfiguration` returns a transactionally loaded graph. `replaceStageBasketConfiguration` already locks tournament `FOR UPDATE`, revalidates actor, locks stages and players, validates basket/stage/routing models, deletes/reinserts graph and revisions projected stage rows in one DB transaction. It **does not** accept expected basket revision or emit an atomic CAS ETag.
- `lib/db/src/schema/tournaments.ts` blob `0fb1a93e2ea99a5944e71ea1e7bc54d4097f60a8` has `basketFlowAuthorityVersion` restricted to 0/1. This is **the business flow mode, NOT the basket edit revision**; never repurpose it.
- `artifacts/api-server/test/stage-basket-cas.integration.test.ts` Git blob `f95f032f4146f33ccbba813a3d08b34dfb9bb929` contains **ten fail-first CAS01–CAS10** behaviors and physically resets/tears down PG test schema: do **not** run it without independent approved disposable PG16 G0.
- `artifacts/tournament-manager/src/lib/stage-basket-cas-client.ts` blob `4fca09e22ef58fc38a2ca34a8386a6fadad06ae8` is unactivated. It requires `featureEnabled === true` AND `serverCasVerified === true`, single strong quoted server ETag, per-tournament/auth-context provenance, and never automatically retries a 412. Keep flags OFF until later integration.

## 2. Proposed frozen wire contract for A50 — owner's acceptance required

`GET /api/tournaments/:tournamentId/stage-baskets`

- Authorize access per existing read-policy; do not include organizer credential in URL/ETag.
- Return current graph (`baskets` and `routes`) with **one strong quoted ETag**, e.g. `"sbcas-v1-<opaque>"`; `W/"..."`, bare values, comma lists, "*" are not legal CAS tokens. Graph, server basket revision, stage versions and relevant roster snapshot **must** be read from one coherent transaction/snapshot; otherwise retry or fail closed without issuing a token.
- `Cache-Control: private, no-store` for authenticated graph views; no reverse proxy-generated weak ETag. Stable graph + unchanged relevant state => stable validator. Different tournaments and new restore epochs => distinct validators.

`PUT /api/tournaments/:tournamentId/stage-baskets` with existing JSON graph and header `If-Match: "<opaque-from-GET>"`

- Require an authenticated, currently authorized organizer and a **single** strong token. Missing => `428 PRECONDITION_REQUIRED`; malformed, weak, wildcard or multiple tokens => `400 INVALID_BASKET_IF_MATCH`; stale/mismatched relevant state => `412 STAGE_BASKET_CONFIGURATION_STALE`; unauthorized => existing `401/403`, no mutation. No auto-retry on conflict; present the editor's intact local draft to the client with reload/reconcile option.
- Validate body (IDs, stage membership, basket type, input assignments, quotas, routes and graph), keep existing immutable status rule for non-draft or started stages. A400/422 validation error must have zero writes.
- Successful PUT commits graph and revision **exactly once** and returns fresh graph and ETag from the committed state. A no-op authenticated save: **proposed** increment revision anyway (write attempt accepted), to avoid ambiguous idempotency/ABA; A00 must ratify in decision D03.
- Do not use a hash of the graph alone as the revision or a client-computed token. ETag is a concurrency validator, **never authentication authority**.

Minimal suggested A50 types (illustrative, not yet implemented):

```ts
type ExpectedBasketVersion = Readonly<{ rawStrongEtag: string; tournamentId: number }>;
type BasketSnapshot = Readonly<{
  tournamentId: number;
  graph: { baskets: readonly unknown[]; routes: readonly unknown[] };
  basketConfigRevision: bigint;
  basketEditEpoch: string;
  stageVersions: readonly { stageId: number; version: number }[];
  rosterFingerprint: string;
}>;
type BasketCasResult =
  | { kind: "committed"; snapshot: BasketSnapshot; etag: string }
  | { kind: "stale"; code: "STAGE_BASKET_CONFIGURATION_STALE" };
```

## 3. Persisted CAS state and lock order — **migration NOT authorized**

**Default minimal proposal for D01–D04 review:** add `basket_config_revision BIGINT NOT NULL DEFAULT 0 CHECK (basket_config_revision >= 0)` and `basket_edit_epoch UUID NOT NULL` to **tournaments** through a separately allocated canonical migration; account for table creation, backfill and preservation across restore. Keep `basket_flow_authority_version` unchanged. **Alternative** (if table mutation is disallowed): companion `tournament_basket_cas_state(tournament_id PK/FK, revision BIGINT NOT NULL, epoch UUID NOT NULL)` with explicit row lifecycle and cascade rules. Neither schema change is authorized by this document.

Required semantics:

1. **Per-tournament mutex:** take one tournament row `FOR UPDATE` (or one sidecar row in alternative) before checking saved validator and loading/locking graph dependencies. Actor authorization must be revalidated inside the same transaction.
2. **Full dependency set:** stage `id/version/status`, current roster IDs+relevant state, graph rows, routing authority and transaction epoch must be read after lock acquisition. The current code reads stages/players with row locks; **inserts or future writers not honoring the same parent lock can phantom-change the roster**. Inventory stage/roster mutators and make *all relevant writers* acquire the same tournament lock **before** their mutation; until verified, stage/roster drift assurance stays conditional. PostgreSQL serializable retry is an alternative but must be separately approved and tested for serialization/phantom behavior, not silently assumed.
3. Compare supplied `If-Match` to a server-generated current validator computed from `domain="WEB005-SBCAS-v1" || tournamentId || basketEditEpoch || basketConfigRevision || canonical stage version vector || canonical roster fingerprint`. Cryptographic SHA-256 digest with unambiguous, versioned binary encoding is sufficient for opacity and cross-tournament binding; never encode authorization secrets. If relevant mutation changes, validator changes even when basket graph bytes are identical.
4. Under the lock, if stale => throw typed 412 **before any deletion or revision update**. If valid, call existing graph validator/save flow without changing its tournament/stage/route semantics; atomically update revision **exactly once**, even when other rows are replaced; return transaction-consistent committed snapshot. Rollback on any failure, including routing plan or constraint error. Strong ETag computed from committed version.
5. Overflow => typed safe fail-closed 409/500 with no mutation, **never wrap revision**. Delete/re-create or clone a tournament => new random `basket_edit_epoch`; never transplant a source tournament's ETag/revision/epoch. Backup V3 must treat any imported revision as inert historical metadata until the target has newly minted epoch and server-owned revision.
6. Existing blind `PUT` callers must stay feature-gated/inactive or move to conditional PUT only after A00/A110 approval; **do not preserve an unguarded write escape hatch** that bypasses CAS once server feature is enabled.

## 4. Atomicity invariants

- C1: two PUTs based on the same validator => exactly one successful 200, one 412, no loser DB writes; initial graph and stage revisions in loser transaction remain untouched.
- C2: missing/malformed/weak/foreign `If-Match`, revoked organizer, non-draft stage, roster/stage drift => zero graph, routing, stage or revision mutation.
- C3: successful GET header and body describe one transactionally coherent state (including stage/roster dependencies).
- C4: every accepted graph mutation advances monotonic revision and changes validator, even if graph returns to an old value (ABA prevention).
- C5: failed validation or failure after intermediate basket INSERT rolls back **all** graph rows, stage version bumps, routing plan and CAS revision.
- C6: auth credential rotation or role change must invalidate effective write authority; client `authContextId` is only a local scoping mechanism, not server proof.
- C7: restored/duplicated tournament rejects source-tournament validator irrespective of graph/revision equality.

## 5. Test-first RED/GREEN handoff owned by A50/A60 (not executed)

**Unit/DB-free RED first:** pure strict `If-Match` parser; strong vs weak/list/wildcard; deterministic per-tournament/epoch/version ETag; stale detection on version/stage/roster change; overflows; rollback decision model. Use injected in-memory snapshot/transaction test adapter, not production DB.

**Integration future PG16 G0 HOLD:** retain ten existing `CAS-01..CAS-10` test cases from PR55; extend for restore/new-epoch ABA, same bytes after edit, no-op revision, stage/roster concurrent writers, routing error rollback, code/ETag/body parity. Tests in PR55 contain destructive `resetTestSchema/dropTestSchema` and `TEST_DATABASE_URL`; do not run now. Record true exits, TAP and exact HEAD in A50's isolated code branch; independent A30/A60 review.

**Separate SWARM-006 later:** combine client #63/#130, API routes, OpenAPI client generation and current application state. Until that later composition, no "APPLICATION_PASS" and CAS UI stays OFF.

## 6. A00 owner decisions and separate migration gates

The **existing A00 D01–D04 migration gate** is not redefined here: canonical migration DAG, release-first/editor-second sequencing, independently auditable database execution/rollback receipts, and exclusive migration-number allocator all require the owner-signed decision packet. **No column/sidecar migration, SQL, PG16 or deployment is authorized by A20.**

| CAS decision | Required choice | Minimal safe default while pending |
|---|---|---|
| `CAS-DEC-01` | Persisted revision location: dedicated `tournaments` column vs sidecar row, initial/retry/overflow behavior | Prefer new bigint column + UUID epoch; **not implemented / HOLD until A00+DB owner signoff** |
| `CAS-DEC-02` | A no-op authenticated PUT increments revision? ETag binary format/compatibility | Prefer increment on every accepted PUT and a single strict server ETag; **CONDITIONAL** |
| `CAS-DEC-03` | Stage/roster writer inventory and shared per-tournament lock discipline; read isolation for coherent GET | **HOLD** full concurrency guarantee until all mutators reviewed |
| `CAS-DEC-04` | Cloning/restore epoch regeneration, backup revision discard and client activation sequence | Fresh target epoch, no replay; feature flag **OFF** until separately approved integration |

**Disposition:** `IMPLEMENTABLE_ARCHITECTURE_CONTRACT_READY / CAS_BACKEND_NOT_IMPLEMENTED_BY_A20 / A50_BLOCKED_ON_D01_D04 / PG16_HOLD / SWARM006_HOLD`. A20 creates no migration and does not change C03.
