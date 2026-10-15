# WEB-005 — A20 R23A · Logical T055 Reservation / Writer & Deadlock Conflict Matrix

**Task:** `WEB-005-T020-A20-R23A-MIGRATION-LEDGER` · **Mode:** DOCS / MIGRATION ARCHITECTURE · **Date:** 2026-10-15.  
**Status:** `REQUESTED_NOT_ALLOCATED / SOURCE_WRITER_MATRIX_REVIEWED / EXHAUSTIVE_DB_WRITER_AUDIT_PENDING / SQL_STOP`.

## 1. Logical reservation REQUEST ONLY

```yaml
reservation_key: WEB-005-T055-BASKET-CAS-PERSISTENCE-V1
reservation_state: REQUESTED_NOT_ALLOCATED
numeric_migration_id: null
canonical_filename: null
database_execution_receipt: null
requesting_agent: WEB-005/A20
approving_owner: WEB-005/A00
proposed_schema_owner: WEB-005/A20 (architecture), future separate code GO required
depends_on:
  - owner-ratified-release-editor-ledger-graph
  - owner-selected-physical-target-schema-lineage
  - selected-T055-D1-D6-product-contract
  - owner-reviewed-trigger-lock-order-and-full-writer-inventory
  - owner-reviewed-Backup-B1-B6-mapping
  - future-A60-independent-source-and-PG16-acceptance
environment: DISPOSABLE_PG16_FIRST_NOT_CONNECTED
sql_or_ddl_authorized: false
```

This is a **documentation request**, not a number assignment, SQL file, Git migration PR, table row, lock on a global allocator, or assertion of any applied migration. Owner A00 must ratify a **single serialized allocator** after accepting the canonical graph and inspecting physical receipts; check all contemporaneous PRs before issuing an exact immutable logical+numeric migration identity. `0032`, `0041` or any other number is NOT assigned.

Related [14-entry verified source graph](https://github.com/C8LyNn/aplikacja-turnieje/blob/74abd89158dacb2eb6d2e92fd48deb4405ee7a30/docs/web-005/agent-reports/A20/WEB-005_A20_R23A_CANONICAL_MIGRATION_GRAPH_PROPOSAL.md), P05 PR38 HEAD `2d36864f4d2f1c838073f387fd3c8efb3378c43b`, manifest `PROPOSAL_ONLY_NOT_APPROVED`.

## 2. Scope and method of writer source audit

Source pinned to `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. R23A fetched and searched **58/58 TypeScript files** in `artifacts/api-server/src/application/**` and `artifacts/api-server/src/routes/**`, plus auth/deployment TS by glob, for direct Drizzle `.insert/.update/.delete` on `tournamentsTable`, `tournamentStagesTable`, `playersTable`, `stageParticipantsTable`, `stageBasketsTable`, `stageBasketRoutesTable`, `stageBasketParticipantsTable`, output and route execution tables. Read additionally SQL source migrations `0024`, `0026`, `0027`; inspected parent/child `FOR UPDATE` sequences at selected path locations. Source scan has **no physical PostgreSQL system catalog or trigger inspection**.

**Audit boundary / completeness caveat:** This source scan is **not** an exhaustive authoritative list of dynamic SQL, indirect DB library helpers, migration-defined SQL functions, tests/scripts, ad hoc operations, background workers or branches that have not merged into release. Unmatched raw SQL, alias-named Drizzle tables and legacy PG procedures may be writers. A00 must fund a complete function-level static+PG16 catalog lock graph review before permitting a trigger migration or claiming full coverage.

## 3. Existing mutators and required T055 invalidation (exact immutable source)

| Writer / exact release path and pinned file SHA | Source-observed DML and location | CAS relevance / owner decision and deadlock exposure |
|---|---|---|
| `artifacts/api-server/src/application/stages/stage-basket-configuration.ts` SHA `7814928721fb3b3af11ef6960c4944ef96c2d128` | `replaceStageBasketConfiguration`: parent `tournaments FOR UPDATE` (~314–319), stages `FOR UPDATE` (~324–328), players `FOR UPDATE` (~337–341); route/participant/basket DELETE (~445/448/451), inserts (~454/478/486), stage update (~499), tournament update (~526). | **MUST bump** in same transaction and compare prior revision under parent lock before ANY DML; 428 missing, 412 stale; return final token. Multiple child-trigger bumps may occur in one PUT. |
| `artifacts/api-server/src/application/players/tournament-roster.ts` SHA `1a9184d92736b5c2bcca07bb0d3067a0f7b314ce` | `addTournamentPlayer` (~100), `updateTournamentPlayer` (~135–154), `deleteTournamentPlayer` (~184–197) call `lockDraftTournament` first; CSV replace deletes/inserts players (~438/444); Undo/restore (~249/277). | **MUST invalidate** when roster identity/seed/eligibility affects draft; reuse common parent-lock function, verify CSV/Undo order and compatibility trigger side effects. Parent-first on observed standard CRUD is **positive source evidence**, not all-path guarantee. |
| `artifacts/api-server/src/application/stages/basket-input-roster.ts` SHA `56b1b32b31f53076f8465331b0a7ba7a2576445f` | `stage_participants` DELETE/UPDATE/INSERT (~84/88/90); has at least one row lock. | **MUST invalidate** eligible input memberships/status/seed changes. Unverified ordering vs parent lock: **REVIEW**. |
| `artifacts/api-server/src/application/stages/stage-lifecycle.ts` SHA `e344fd4198e081a3a4574d976829665bea71fb6a` | stage participant updates/inserts (~736/752/1103/1237); tournament stage updates (~767/976/1341), tournament (~775/778/1348), players (~784/786); generates matches/BYE/history/action (~1310–1332), many locks. | **MUST invalidate** stage planned→started, eligible roster transfer and other draft-sensitive lifecycle, including qualifying starts and compatibility stage status. Verify lock order with dynamic helper calls, not just `.for("update")` count. |
| `artifacts/api-server/src/application/stages/seeding-ceremony.ts` SHA `4e06b034ad07b512f0960cc9b181d7869ce2587c` | `tournament_stages` updates (~546/595/628), row locks. | **Conditional** stage seeding and membership changes; relevant to draft fingerprint => invalidate, otherwise documented exclusion with test. |
| `artifacts/api-server/src/application/stages/double-elimination-match-runtime.ts` SHA `9a762a79b18733cc6131cb15dc0cfdac970e81ba` | stage_participants (~189/328), players (~338), stages (~343), tournaments (~349). | **Conditional/MUST** where progression affects stage/roster, inspect parent lock and round transition. |
| `artifacts/api-server/src/application/stages/marvel-elimination-stage.ts` SHA `efa6bee385dc6b6b7ed4b7fdefe0e6567097ebac` | memberships (~322/466), stages (~340/532), players (~349/353/475), tournament (~357/536). | **Conditional/MUST** for stage rosters/rules; needs common lock order and positive/negative fork tests. |
| `artifacts/api-server/src/application/matches/complete-match.ts` SHA `fa77dc80c1250766ed73db605f985abc7b2fa591` | players (~336/445/517), memberships (~346/449/521), stages (~432/474/504), tournament (~441/478/513), many row locks. | **Conditional/MUST** for stage progression and eligibility; capture parent/child acquisition. Avoid invalidating for unrelated score metadata unless owner explicitly wants conservative bumps. |
| `artifacts/api-server/src/application/matches/revert-match.ts` SHA `0cb16ad0d82da754bac0553a946a3513db70e1ee` | stage membership delete/update (~525/527/556/608/648/663), player updates (~596/642/653), stage (~538/620), tournament (~635) and multiple locks. | **MUST** for Undo that changes roster eligibility and transition. Verify newer Undo LIFO/source completion-action CAS, no stale replay; direct result_history revision ≠ basket token. |
| `artifacts/api-server/src/application/backups/backup-v3.ts` SHA `78d86246302fc8840696fd14c05c840304bc9f97` | import begins `db.transaction`, clone tournament (~1741), stages (~1792/1797/1880/1997/2454), baskets/routes (~1807/1825), players (~1905), memberships (~2016/2045), assignments (~1993), outputs/executions (~2355/2400), tournament (~2469). | **MUST** mint clone-local generation/revision and read final after writes; never transplant source ETag or source match CAS authority. Restore triggers may produce many bumps in one tx. Fault must rollback root/children and token. |
| `artifacts/api-server/src/application/backups/backup-v2.ts` SHA `9afc658b403482f3e5aa5b50878897e876b49d28` | clone tournament (~254), insert players (~272), update tournament (~313). | **MUST** ensure lawful legacy V2 initializes fresh local CAS identity, no stale token or untrusted source revision; mark degraded Undo if history insufficient. |
| `artifacts/api-server/src/application/stages/create-tournament-with-plan.ts` SHA `3d53ab665324e493fbced390091753efa03b8954` | inserts tournament (~130/182), stage (~227), players (~285/318), stage updates (~199/297/320). | **MUST** create baseline and final revision coherently for initial graph; GET cannot expose half-built tournament. |
| `artifacts/api-server/src/application/stages/stage-basket-qualification.ts` SHA `3b92b452c8a64f7fb486646a6073526dea8b2053` | qualification proposals and basket output players (~663/686/696); row locks. | **Review conditional**: outputs and proposal revisions can affect what an editor perceives as eligible graph; explicit owner scope needed before trigger/no-trigger decision. |
| `artifacts/api-server/src/application/stages/stage-basket-route-execution.ts` SHA `881619f94a46d64916607f3265f48e21d52e4d34` | route execution inserts (~400), row locks. | **Review conditional**: routing execution may transition stage eligibility/authority; don't automatically treat every new execution audit row as draft basket graph mutation. |
| `artifacts/api-server/src/application/games/tournament-game-config.ts` SHA `f3cd37b701e4e1178e9f938cbab3d4f2f08a61e7` | stage update (~144). | **Review conditional**: invalidates only when game config affects editable stage CAS contract. |
| `artifacts/api-server/src/application/auth/legacy-organizer-credentials.ts` SHA `4cdb75d506606016bbf9edab9d9a57b4f58c8ba9` | tournament UPDATE (~76/120/168); `artifacts/api-server/src/routes/auth.ts` SHA `7c7799a096b8f8d20bf198a8e4ec72b68f0a7a9a` tournament UPDATE (~187/399/476/527/559). | Do **not** bump CAS for unrelated password/session metadata automatically unless explicitly owner-approved; auth/session invalidation still must be independently enforced on any PUT, even with valid ETag. |
| `artifacts/api-server/src/routes/tournaments.ts` SHA `6767e7ac6c4d43cf39faa8a61534bdb92b898e14` | tournament state/settings and Swiss progression (~1282/1296/1575/1590/1768/1773/2378), tournament DELETE (~1371). | **MUST** audit planned-stage/roster mutation effects and base organizer authorize, plus roster/manual HTTP paths. Strict If-Match does not replace auth or transaction revalidation. |
| `lib/db/migrations/0027_preserve_started_stage_memberships.sql` SHA `90b9fd1c7297097d32ddbb546f9828c47fda02dc` | `compat_sync_single_stage_participant()` trigger function: player write triggers stage_participants INSERT/ON CONFLICT UPDATE, invokes `compat_resequence_single_stage_participants`, conditionally UPDATEs tournament_stages. | **CRITICAL INDIRECT WRITER**: can acquire child and stage locks within player DML. Adding child-trigger parent revision touch can invert lock order or recurse; inspect actual PG16 trigger graph and apply one transaction-scoped revision bump in a reviewed order. |
| `lib/db/migrations/0024_basket_flow_authority.sql` SHA `ae608376af4b76c8506d069a91e8b363676e6d82` | adds `tournaments.basket_flow_authority_version`, includes migration-runner-strip transaction/advisory lock segments. | Legacy authority-mode write and existing runner transforms must align with new T055 revision; do not infer this field is a CAS counter. |
| `lib/db/migrations/0026_basket_authority_trigger_bypass.sql` SHA `92e0c8e8e37684f7c7b1b397e1839cb5f496c7ab` | revises `validate_tournament_stage_participant_flow()` trigger function. | Verify recursion/bypass session flags and lock graph before introducing any new trigger. |

**Future additional audit mandatory:** schema migration-trigger functions in `0001–0023`, all DB/Drizzle source aliases and `sql` literal writes, scripts/legacy CLI import, external workers, partial PR code/rebased branches, and actual PG16 `pg_trigger/pg_proc/pg_depend` **read-only** catalog snapshot. The above is a **prioritized source inventory**, not a guarantee that no unknown mutator exists.

## 4. Deadlock and stale-write conflict matrix

| Conflict | Concrete source order | Required future invariant and gate |
|---|---|---|
| CAS PUT vs CAS PUT | Both enter `replaceStageBasketConfiguration`, parent lock then stage/player locks; currently no If-Match | Parent row serializes writers; compare token *after lock* and reject loser `412` with **zero mutations**; never permit last-write-wins |
| CAS PUT vs roster API | Basket locks parent→stages→players; standard roster CRUD calls `lockDraftTournament` before player lock. But indirect compat sync touches memberships and stage | Parent-first all writers, stage/roster invalidation in same tx; deterministic barrier integration test, no deadlock inversion |
| CAS PUT vs trigger on player | New T055 child-trigger could touch parent from `0027` nested player→member→stage DML | Unsafe if trigger obtains child lock before parent elsewhere: **do not authorize blind AFTER child trigger**. Audit SQL lock graph and refactor writer parent-first or use a vetted trigger protocol |
| CAS PUT vs stage lifecycle / seeding / Undo | Lifecycle touches memberships, matches, stages, tournaments and actions; `revert-match` changes stage roster | Acquire parent before children even on exceptional branches; bounded SQLSTATE deadlock handling, mandatory stale recheck after retry |
| CAS GET vs multiple writes | Existing GET has multiple SELECTs in default `db.transaction`; not proven one MVCC snapshot | Same PG16 `REPEATABLE READ READ ONLY` transaction for full graph+revision, otherwise ETag may describe incoherent graph |
| Bulk CSV / Backup import vs CAS | CSV deletes/inserts players; import clones root and writes stages/graph over many SQL statements | No token published before commit; new clone-local generation/revision; rollback must erase root/child/Undo/action and counter together |
| ABA and cross-tenant token replay | Graph A→B→A or clone ID reused; hash/stage.version can return same value | Durable monotonically increasing `BIGINT` plus tenant+generation binding in opaque strong token; strictly never reuse previously observed token |
| Missing/weak/foreign token | Current router GET/PUT no strong ETag/If-Match | Missing `428`, stale `412 STAGE_BASKET_CONFIGURATION_STALE`, weak/invalid/foreign fail-closed 4xx, zero writes; independently enforce actor/tenant auth |

## 5. Required future database and HTTP contract (NO DDL here)

**Proposed exact schema interface:**

- `tournaments.basket_config_revision BIGINT NOT NULL DEFAULT 1` plus CHECK positive and a **monotonic, server-owned write guard**. JS Drizzle `bigint(...,{mode:"bigint"})` or a verified lossless decimal string; **not** `integer` or `number`. A signed decision on per-tournament opaque generation UUID is required if ID reuse/restore-to-same-key can resurrect historical ETags; fresh clone ID + local generation is the minimum.
- Invalidation on relevant stage/roster/basket/tournament eligibility transitions **inside the same transaction**. A raw CHECK `>0` and reject-decrement trigger do not prove every writer bumps revision. Define either exhaustive parent-first writer touch or audited trigger + transaction-local recursion guard. Avoid hidden `SECURITY DEFINER` risk and unbounded trigger recursion; preserve tenant boundaries when moving records.
- GET `/tournaments/:id/stage-baskets` loads version and graph from **one verified REPEATABLE READ** snapshot; only an authenticated/authorized server issues a *strong*, quoted, tournament/generation/revision-bound ETag. Token is **not** authorization.
- PUT under `tournaments FOR UPDATE`: actor+tenant revalidation; reject missing strong If-Match `428`, stale `412` and unrecognized/foreign invalid 4xx, **before first DELETE/INSERT/UPDATE**. Revalidate roster/stage statuses inside lock. Persist graph+stage count/routing plan+revision atomically. Return final token, even if triggers bump multiple times; signed D1 requires strict monotonicity, not necessarily exactly +1. Error rollback restores all rows and revision.
- Browser/Host retains stale draft on 412, requires explicit reload/compare/confirmation, no automatic token reuse or force-overwrite; cutover of old clients requires an A00 activation plan.
- Actual release `0028_match_revision.sql` defines separate **matches.revision integer CAS**, while `result_history.revision` is a distinct sequence with unique `(match_id,revision)`. Backup B3 portable source stateRevision is **not** the basket revision. Fresh restore creates clone-local revision/generation and validated source→clone match revision/Undo identity map. Strict untrusted missing marker cannot auto-downgrade, system `system_bye_assigned` is legal and non-undoable, recognized nested player/match IDs must fail closed, and all preclone validation errors must be zero-write.

## 6. Future acceptance and operational STOP

Need owner-approved **dedicated physically isolated** disposable PG16, unique `TEST_DATABASE_URL` without application `DATABASE_URL` fallback, `tm_test_*` schema, signed separate destructive RESET scope and exact per-PR checkout; test helper currently resets only through `0028` and does real `DROP SCHEMA ... CASCADE`, so it cannot automatically certify full 0029–0031 or this future column.

Mandatory future negative oracle matrix: sequential stale CAS 412/zero writes; real barrier-driven parallel writer winner/loser; roster+stage writer concurrent read invalidates; A→B→A ABA; expired/forged/foreign/weak/absent token 400/412/428; DB trigger nested lock/deadlock injection and bounded retry; rollback after partial graph writes returns original revision; max BIGINT/overflow abort, JS >2^53 preserved; V2/V3 lawful legacy restore and modern strict system BYE with independent source state revision; source match revision vs history order; late backup clone failure full rollback including action log/Undo; read-only catalog shows correct grants/triggers/constraints.

**NO actual runtime or PG16 test done in R23A. No migration SQL file created, no number allocated and no code modified.**

**Disposition:** `REQUESTED_NOT_ALLOCATED / WRITER_MATRIX_DELIVERED / LOCK_GRAPH_PG16_PENDING / SQL_NOT_EXECUTED / SWARM006_HOLD`.
