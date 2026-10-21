# WEB-005 / W6H FINAL — A20 server Basket CAS persistence/transaction decision

**Status:** `SCHEMA_TRANSACTION_DECISION_PACKET_READY / A00_APPROVAL_REQUIRED / NOT_IMPLEMENTED / PG16_NOT_RUN`
**Owner:** A20 architecture. **Implementation:** A50. **QA:** A30/A60. **Authorization:** A00.
**Pins:** frozen C03 `80bb4ca7a9a359fbe76dbab1478a1af16ded0174`; A50 isolated PR146 `26a188f3437a5614c866209faf674e636907d818`. A00 instruction: Issue #76 comment 6314341887. This source packet is neither executable SQL nor approval to run a migration.

## 1. Decision recommendation: use two columns on tournaments

**Recommended (owner decision, not yet approved):** amend `lib/db/src/schema/tournaments.ts` with:

```ts
basketConfigRevision: bigint("basket_config_revision", { mode: "bigint" })
  .notNull().default(0n),
basketEditEpoch: uuid("basket_edit_epoch").notNull().defaultRandom(),
// CHECK (basket_config_revision >= 0), per canonical DDL owner
```

Proposed PostgreSQL semantics: `BIGINT NOT NULL DEFAULT 0 CHECK (basket_config_revision >= 0)` and `UUID NOT NULL DEFAULT gen_random_uuid()`. PostgreSQL16 compatibility, backfill and rollback must be verified by the authorized schema owner. Every existing tournament receives revision zero and a distinct newly generated epoch, with existing basket rows untouched. Newly created tournaments start with revision zero and fresh epoch. Always use an exclusive canonical migration number allocator: **D01–D04 remain HOLD** until A00's explicit decision.

**Why columns:** present `replaceStageBasketConfiguration` already takes the parent `tournaments` row `FOR UPDATE`; one mutex and row already exist, avoiding sidecar lazy-insert race, missing record, extra delete/restore semantics. **Alternative ONLY if A00 rejects columns:** a `tournament_basket_cas_state` row keyed by tournament id with revision and epoch, created atomically/eagerly with each tournament, with parent-first lock protocol and explicit delete/restore behavior. No automatic fallback.

**Do not confuse counters:** current `basket_flow_authority_version` is restricted to values 0/1 (legacy versus authoritative flow); stage `version` is a separate stage mutator counter; neither equals durable basket CAS revision.

On every accepted PUT, **including a valid same-graph/no-op PUT**, increment revision exactly once. This is the recommended ABA defense, pending CAS-DEC-02. On overflow reject before writes; no wrapping. New clone/restore => **fresh target epoch and revision zero**, ignoring source tokens, epochs and auth context. Until owner approves in-place restore/epoch rotation semantics, **deny in-place restore when CAS is active**.

## 2. Explicit wire and ETag v1 contract, compatible with PR146

- `GET /api/tournaments/:id/stage-baskets` returns graph body + one *strong* quoted `ETag`; use `Cache-Control: private, no-store`; never rely on weak Express auto-ETag. GET graph, persisted epoch+revision and all stage/roster dependencies MUST originate from one coherent snapshot. Recommended transaction: **READ ONLY REPEATABLE READ**, since current multi-SELECT GET under default READ COMMITTED can observe mixed states.
- ETag format: `"BASE64URL_NO_PADDING(SHA256(canonical_bytes))"`; 43 URL-safe digest characters in quotes. Fits PR146 strong base64url-style regexp (16–128 characters, quoted). Canonical bytes MUST be versioned and unambiguous with explicit field lengths/order and golden vectors:
  - domain `WEB005/BASKET-CAS/ETAG/V1`, positive tournament id, UUID epoch, unsigned big-endian 64-bit revision;
  - digest of sorted stage ID/version/status and **every flow-relevant stage field**;
  - digest of sorted player IDs and **every roster/assignment field relevant to validation/visibility**, including stage-membership identities.
- Do not use unstable object `JSON.stringify`, a graph-only hash, an encoded organizer token, ETag as credential, or client-generated revision. Actual stage/roster field inventory and canonical binary vectors must be signed off before A50 calls the ETag stable.
- `PUT /api/tournaments/:id/stage-baskets` requires current authorized organizer and exactly one valid strong `If-Match`. Existing #146 primitive: absent => 428 `STAGE_BASKET_IF_MATCH_REQUIRED`; malformed/weak/wildcard/list => 400 `INVALID_STAGE_BASKET_IF_MATCH`; valid but stale/foreign => 412 `STAGE_BASKET_CONFIGURATION_STALE`; malformed internal server token => internal invariant failure, no writes. Unauthorized => current 401/403. No silent fallback to unconditional legacy PUT. No automatic client retry; #63/#130 flags stay OFF until later SWARM-006 activation.
- A successful commit returns 200, committed graph, and a **new** strong ETag. Body and header must describe the same committed state. A failed request must not mutate stage, roster, route, basket or revision.

## 3. Single-transaction A50 source implementation path

```text
BEGIN (per-tournament parent-row lock protocol)
  SELECT * FROM tournaments WHERE id = :id FOR UPDATE;
  revalidate server-side organizer role in this transaction;
  parse strict If-Match via A50 PR146 helper;
  read persisted basketConfigRevision + basketEditEpoch,
       stage rows/versions/status and canonical roster/membership state,
       basket graph, routes and dependent routing authority;
  recompute current server ETag under lock;
  if missing/malformed/stale => typed error and ZERO writes;
  reject non-draft or immutable stage state before any writes;
  validate all basket assignments, quotas, IDs and routes;
  reject overflowing revision before any writes;
  use the existing graph/routing/stage update implementation,
       in THIS SAME transaction (no nested independent transaction);
  UPDATE tournaments
    SET basket_config_revision = basket_config_revision + 1
    WHERE id=:id AND basket_config_revision=:expected_revision
    RETURNING basket_config_revision;
  require exactly one updated row; otherwise rollback;
  load committed graph and dependencies within same transaction;
  compute new ETag from resulting state;
COMMIT; respond with 200 + body + new ETag ONLY after commit
```

Retain existing application validators and authorization semantics. Source change targets after A00 GO: `artifacts/api-server/src/application/stages/stage-basket-configuration.ts` (blob `7814928721fb3b3af11ef6960c4944ef96c2d128`), `artifacts/api-server/src/routes/tournaments.ts` (blob `6767e7ac6c4d43cf39faa8a61534bdb92b898e14`, current GET/PUT around 778–811), and authorized schema file `lib/db/src/schema/tournaments.ts` (blob `0fb1a93e2ea99a5944e71ea1e7bc54d4097f60a8`). PR146 only adds the pure helper `basket-cas-precondition.ts` Git blob `2a8514fa04d99602547458ba07a44ba2ffb517e8`; its nine native tests **do not** establish transaction semantics.

**Mutator lock order:** tournament parent first → stage rows in deterministic order → roster rows in deterministic order → basket/routes → plans. Do not check ETag outside transaction then write later. READ COMMITTED for PUT is acceptable only after verifying **every** stage/roster writer takes the same parent lock before dependent writes. Otherwise use a separately approved serializable/trigger strategy with real concurrency tests: do not assert row locks alone prevent phantom roster inserts.

### Actual source-verified writer inventory (NOT exhaustive)
- `application/stages/stage-basket-configuration.ts`: tournament `FOR UPDATE` followed by stages and players `FOR UPDATE`.
- `application/players/tournament-roster.ts` (blob `1a9184d92736b5c2bcca07bb0d3067a0f7b314ce`): `lockDraftTournament` acquires tournament row `FOR UPDATE`; add/update/delete, Undo and CSV import call that helper.
- `application/stages/stage-lifecycle.ts` (blob `e344fd4198e081a3a4574d976829665bea71fb6a`): stage complete/start use tournament parent `FOR UPDATE` then stage/roster locks.
- Not yet exhaustive: `routes/tournaments.ts` has other stage mutation branches; Backup V3 restore/clone and lower-level `basket-input-roster.ts`, SQL functions/triggers and future worker paths need individual verification. Do not claim universal mutex discipline until documented by A50 and reviewed by A30/A60.

## 4. RED/GREEN and existing fail-first test coverage

**Source-only first:** A50 implement pure no-install tested ETag canonical golden vectors, persisted revision transition model with fake transaction/row lock, no-op increment/overflow, restored epoch, stage/roster drift, 428/400/412, no-write-on-failure. Record real Node22 RED/GREEN commands, exit, TAP SHA256 and exact future HEAD. Independent A30/A60 targeted source acceptance.

**PG16 NOT_RUN/HOLD:** PR55 `artifacts/api-server/test/stage-basket-cas.integration.test.ts` Git blob `f95f032f4146f33ccbba813a3d08b34dfb9bb929` defines CAS01–CAS10 and invokes schema reset/drop, so do not run without separately approved disposable PG16 G0–G4. Later add two concurrent writers 1x200/1x412, phantom roster insert, stage version drift, rolled-back route/partial insert + revision, and fresh target clone epoch. Current C03 API integration historical exit1 remains RED, first named failure unknown. Unit tests are not physical atomicity proof.

## 5. Smallest owner decision package (A00, not approved by A20)

| Gate | Question A00 must resolve | Safe pending state |
|---|---|---|
| D01–D04 existing | canonical migration DAG, exclusive number allocator, release/editor order, execution and rollback receipt | **HOLD** SQL/schema migration |
| CAS-DEC-01 | **Approve tournament columns** versus sidecar, epoch/backfill/rollback, schema owner | **CONDITIONAL** recommended columns |
| CAS-DEC-02 | Approve 43-char SHA256 base64url token, explicit canonical bytes/vectors, increment on no-op | **CONDITIONAL** |
| CAS-DEC-03 | Review complete roster/stage/restore mutator inventory and universal parent lock, GET repeatable-read | **HOLD** claims of atomic CAS |
| CAS-DEC-04 | Approve fresh target epoch for clone/restore, deny pending in-place restore, keep client OFF | **HOLD** feature activation |
| A50 source GO | Narrow isolated implementation after signed schema contract; no physical DB operations | **HOLD** until decisions |

**Overall:** `A20_PERSISTENCE_DESIGN_READY_FOR_A00 / PR146_HELPER_ONLY / A50_SERVER_CAS_NOT_IMPLEMENTED / PG16_G0_HOLD / SWARM005_NOT_DONE / SWARM006_HOLD`. No C03 edit, C04, migration, merge, API start, deploy, package install or real SQL operation performed by A20.
