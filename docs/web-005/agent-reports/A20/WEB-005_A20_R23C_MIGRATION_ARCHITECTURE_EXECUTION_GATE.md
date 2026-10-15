# WEB-005 / A20 / R23C — MIGRATION ARCHITECTURE EXECUTION GATE

**Task:** `WEB-005-T020-A20-R23C-MIGRATION-GATE`  
**Date:** 2026-10-15 Europe/Warsaw · **Agent:** A20 / PostgreSQL Migration Reconciliation · **Mode:** ARCHITECTURE FREEZE + NON-DESTRUCTIVE PREFLIGHT (documentation/source only)  
**Addressees:** A00/HQ owner decision, A110 T055 API, A90 Backup, A50 future native execution, A60 independent QA.

**Overall verdict: `MIGRATION_OWNER_BLOCKED`** for any migration implementation or numeric reservation, **`MIGRATION_SOURCE_PREFLIGHT_PREPARED`** for owner review. There is **NO** `MIGRATION_SOURCE_GATE_READY` until A00/HQ signs D01–D04. No connection, SQL execution, test reset, native PostgreSQL acceptance, migration file or merge took place.

## 1. Current evidence, exact PR HEAD and signed D01–D04 status

- [Previous D01–D04 packet](https://github.com/C8LyNn/aplikacja-turnieje/blob/2401cdcadba8ebe808fb38d461d856b0726e0f38/docs/web-005/agent-reports/A20/WEB-005_A20_R23B_A00_DECISION_PACKET.md), previous P05 [PR #38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38) **OPEN / DRAFT / UNMERGED, current HEAD `2d36864f4d2f1c838073f387fd3c8efb3378c43b`**, base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. No change from R23B.
- [R23A 14-source graph and checksums](https://github.com/C8LyNn/aplikacja-turnieje/blob/74abd89158dacb2eb6d2e92fd48deb4405ee7a30/docs/web-005/agent-reports/A20/WEB-005_A20_R23A_CANONICAL_MIGRATION_GRAPH_PROPOSAL.md): 14/14 Git SHA-1 and 14/14 raw UTF-8 SHA-256 verified for original migrations. P05 manifest SHA `28f493263a2cbfb919db1f99b220058175b46ba0`; status `PROPOSAL_ONLY_NOT_APPROVED`.
- Release baseline `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` and editor source `codex/game-catalog-editor-reliability@28da3ef94f3b30f90c1b3b70a88ab7f61462d99c` matched pinned SHA in R23B. Original release/editor **0030/0031 are two unrelated pairs of SQL**, not interchangeable by filename prefix.
- Latest inspected central [`DECISIONS.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/DECISIONS.md), Git blob `f90a2f1dfabfce4e288d472839265a22ee7bad64`, has **D005 conceptual fixture-design approval only / migration implementation STOP**, *not signed D01–D04*. The latest [R21 owner packet](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_DECISION_PACKET.md), blob `c2f13d829b860172d3cfcb9363ffa1a0204b1f1d`, records **other** signed product policies (T055 D1–D6, some Backup/sport), not D01–D04 execution-graph approvals. Inspected PR38 discussion includes no subsequent signed owner choice for these four IDs.
- [PR #55](https://github.com/C8LyNn/aplikacja-turnieje/pull/55) current HEAD `c3a4ea00ba933cbab36b3582859cb3eff20f0204`: tests-only. [PR #56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) current HEAD `a7f71a7e7efdabd479b358a3cee80bc6359c4321`: isolated strict Backup V3 validator NOT_WIRED, not a PostgreSQL migration.

| A00/HQ decision | Prepared recommended architectural policy | Signed outcome found in verified sources | Exact remaining signer action |
|---|---|---|---|
| **D01** source graph | `APPROVE_SOURCE_GRAPH_ONLY`, 14 distinct original identities, raw SHA checksums, release/editor 0030/0031 collision separation | **`PENDING_OWNER_APPROVAL`** | A00/HQ signs approved source graph version and pins 14-entry SHA register |
| **D02** total order | `RELEASE_FIRST_EDITOR_SECOND`: release 0027→0029 + 0030→0031, then editor proposed canonical 0032→0040 | **`PENDING_OWNER_APPROVAL`** | A00/HQ explicitly approves additional **policy order** release 0031→editor 0032; do not invent hard SQL dependency |
| **D03** physical history | `SOURCE_AND_RUNTIME_RECEIPT_REQUIRED`, unknown/orphan/mismatch=STOP | **`PENDING_OWNER_APPROVAL`** | A00/HQ names allowed instance(s), reviewer, database identity, ledger & runner evidence standard, missing-log policy and independent read-only authority |
| **D04** exclusive allocator | `A00-CONTROLLED_SERIALIZED_ALLOCATOR`; only logical T055 `REQUESTED_NOT_ALLOCATED` | **`PENDING_OWNER_APPROVAL`** | A00/HQ names single versioned allocator/owner and conflict protocol without allocating any new number |

**No A20 owner proxy signature.** A separate signed document with ID, approver, date, chosen option, original source links, residual risk, scope, expiration and next gate is required to move a row to `OWNER_APPROVED`. Existing D005 is narrower; don't upgrade it.

## 2. Owner-authorization-only SELECT preflight (two independent phases)

Published byte-pinned source **Phase A**: [`WEB-005_A20_R23C_PG16_CATALOG_SELECT_ONLY.sql`](https://github.com/C8LyNn/aplikacja-turnieje/blob/ee25edb9a6296e256005d477d3d5fadfa1d1859d/docs/web-005/agent-reports/A20/WEB-005_A20_R23C_PG16_CATALOG_SELECT_ONLY.sql) (commit `ee25edb9a6296e256005d477d3d5fadfa1d1859d`). **12 read-only SELECT statements** Q01–Q12: actual endpoint/role/PG version, database/schema privileges, ledger existence+permission, catalog relations/columns/defaults, constraints, indexes, trigger enablement/definitions, relevant function-definition **MD5 fingerprint** (NOT original SQL checksum), trigger dependencies, installed extensions.

Published source **Phase B**: [`WEB-005_A20_R23C_PG16_LEDGER_SELECT_ONLY.sql`](https://github.com/C8LyNn/aplikacja-turnieje/blob/640113a78a04b730f6333caf9882deb1bfbcb7e3/docs/web-005/agent-reports/A20/WEB-005_A20_R23C_PG16_LEDGER_SELECT_ONLY.sql) (commit `640113a78a04b730f6333caf9882deb1bfbcb7e3`). **3 read-only SELECT statements** L01–L03: five legacy ledger columns `migration_key, applied_at, app_commit, target_schema, deployment_environment`, apparent prefix conflicts and environment/schema grouping. It uses psql quoted identifier `:"schema"` and intentionally **fails closed** if the exact table/columns do not exist. Run B only after owner separately approves reading migration metadata, A's catalog verifies schema/object and the observer has SELECT on that **specific** ledger. No reads of player/match/customer rows in either source. **Do not invent an empty migration history from a missing ledger table.**

**Static audit performed on authored source (not server parser):** catalog 12/12 and ledger 3/3 statements start with SELECT; checked no DDL/DML/control verbs outside literals, no `SELECT INTO`, no client backslash commands, no dynamic SQL calls. **No PostgreSQL parser/runtime validation or DB connection has occurred**; A50/A60 must independently review exact files before any future execution. The observer must have no DDL privileges regardless of this static review.

### Physical gate BEFORE executing any SELECT

A00/actual DB owner issues **separate signed `READ_ONLY_CATALOG_GO`** specifying: named A50 executor, permission/expiry, immutable PG16 VM/container ID + digest, independently attested actual host/IP/port/proxy destination, exact disposable database, named `tm_test_<suffix>` schema (regex `^tm_test_[a-z0-9_]+$`), fixture/version lineage, database owner, read-only observer role, secure out-of-band password delivery, no shared/prod/staging/Replit/real data. Verify physical isolation independently from SELECT results; test-looking DB names or returned addresses **are not proof**. A00 selects disclosure/redaction of DB host/role/catalog metadata. `pg_control_system()`/superuser privileges are **not** required or requested of the observer; independently supplied host/container/system ID comes from operator, not app SQL.

Minimal observer rights: LOGIN + CONNECT to that one approved DB, USAGE on approved schema, SELECT **only** on legacy migration ledger for Phase B, catalog-reading ability available to ordinary non-superusers. Observer must have `rolsuper=false`, `rolcreatedb=false`, `rolcreaterole=false`, `rolreplication=false`, `rolbypassrls=false`, database/schema CREATE=false, and no membership/GRANT path to higher authority; public grants must not undermine the boundary. All access otherwise STOP.

**Possible future invocation by authorized A50 only, not executed by A20** (use a tightly restricted shell with `psql` from trusted PG16 client; validate all placeholders and observer certificate beforehand):

~~~powershell
# Owner certificate has already established physically disposable PG16 and exact endpoint.
$ErrorActionPreference = 'Stop'
$schema = '<OWNER_CERTIFIED_tm_test_schema>'
if ($schema -cnotmatch '^tm_test_[a-z0-9_]+$') { throw 'STOP: schema not certified' }
# Owner must also ensure values of host/port/database/observer match signed receipt.
# Operator configures default_transaction_read_only=on, statement_timeout=10000,
# lock_timeout=2000 at connection start and verifies settings out of band.
psql -X -W -1 -v ON_ERROR_STOP=1 -v schema=$schema -h '<HOST>' -p <PORT> -U '<OBSERVER>' -d '<DISPOSABLE_DB>' -f 'docs/web-005/agent-reports/A20/WEB-005_A20_R23C_PG16_CATALOG_SELECT_ONLY.sql'
if ($LASTEXITCODE -ne 0) { throw 'STOP: catalog phase failed' }
# Owner checks output against independent certificate. Only on separate Phase B scope approval
# and confirmed app_schema_migrations relation+columns+SELECT permission, run ledger file
# with the same read-only session settings and exact endpoint, then save sanitized evidence.
~~~

Do not paste credentials, DSNs or unredacted identity into logs or GitHub. Note: `-1` opens a client transaction; correctness of server read-only settings must be checked by the responsible operator **before** running; a nonprivileged observer is an independent defense. If `pg_catalog` objects are under a different approved schema, do not silently switch to `public`; stop and request revised certificate.

### Execution evidence classification

- `SOURCE_VERIFIED` = Git blob SHA-1 / UTF-8 SHA-256 matched to source commit.
- `LEDGER_CLAIM` = actual target's read-only ledger row seen, *not proof that those source bytes executed*.
- `CATALOG_STATE_CONSISTENT` = columns/constraints/triggers/indexes compatible with migration postconditions; *not execution receipt*.
- `ATTESTED_APPLIED` ONLY if A00-approved combination matches **exact target+schema, runner commit/version+normalization, original raw SHA-256, executed-input SHA-256, approved order, archived transaction success/commit receipt, ledger key/time and catalog postconditions**. Missing independent logs => `EXECUTION_NOT_ATTESTABLE / OWNER_REVIEW`, not auto-adopted.
- Original release/editor **0030/0031** share ordinals but have different SQL source hashes; classify distinct identities. A numeric key cannot resolve the collision. Partial/mixed/orphan/unknown identities or mismatched SHA => STOP without backfill.
- The original release `0031_atomic_correction_receipts.sql` includes `BEGIN; COMMIT;`. Future runner must pin and review exact transform and transaction semantics; never infer execution checksum equals raw file checksum after normalization.

Physical target status today: **`PG16_NOT_CONNECTED / CATALOG_NOT_EXECUTED / LEDGER_NOT_EXECUTED / ACTUAL_HISTORY_UNKNOWN`**.

## 3. Future CAS migration and A110 DB/API contract — design frozen for review, NOT GO

**Logical reservation:** `WEB-005-T055-BASKET-CAS-PERSISTENCE-V1` **`REQUESTED_NOT_ALLOCATED`**, `numeric_id=null`, `sql_filename=null`, `physical_ledger_receipt=null`. Future serial allocator procedure:
1. D01/D02 signed source graph and total order with strict SHA pins.
2. D03 signed evidence policy and actual owner-certified physical target read-only receipts; if incompletely attestable => separate owner risk/STOP decision, not assumed executed.
3. D04 names one authoritative exclusive registry; owner validates concurrent PRs/branches, existing numeric and logical IDs, and reserves under optimistic expected-branch-SHA/lease, atomically including logical ID, predecessor dependencies, source UTF-8 checksum, actual filename and owner ticket; simultaneous requests conflict to STOP.
4. Only **after** owner signs future separate `NUMERIC_ALLOCATION_GO` assign specific new prefix. Never compute from `MAX(migration_key)` or guess `0032`/`0041`. Reservation record `RESERVED_NOT_APPLIED` must not be inserted into live `app_schema_migrations`.
5. New **implementation GO** after D05–D10, exact file allowlist, isolated PR, A60 source QA, A50 native tests; no merge/deploy implied.

**Future additive database shape:** server-owned `tournaments.basket_config_revision BIGINT NOT NULL DEFAULT 1 CHECK (>0)` with Drizzle lossless `bigint(..., {mode:'bigint'})` or equivalent decimal encoding; no JS `number` overflow. Owner separately decides epoch/generation to prevent reused tournament ID/rebased restore from accepting an old token. DB must prevent committed decreases/reuse and require bump on **every relevant committed graph/eligibility change**, including stage, players/roster, stage_participants, baskets, routes and assignments; inspect qualification/routing/Undo/legacy compatibility triggers and clone imports before excluding a writer. A bare positive check or decrement-preventing trigger does **not** prove coverage.

**Lock order freeze candidate:** **tournaments parent FOR UPDATE → stage rows → roster/player/membership rows → basket graph/route rows**, same order for all relevant API/worker/Undo/Backup paths. `lib/db/migrations/0027_preserve_started_stage_memberships.sql` contains compatibility triggers that can write stages/memberships indirectly on player updates; adding child-trigger→parent revision bump without all-writer lock audit could reverse this order and deadlock. Protect trigger recursion, `SECURITY DEFINER` search_path, tenant boundaries and transactions; enforce bounded deadlock retries without silently replaying stale CAS. Exact lock graph remains **UNVERIFIED**, so no SQL trigger GO.

**A110 exact endpoint acceptance contract** (implement in separate authorized source lane, do NOT edit PR55 here):

| Operation / source | Future acceptance requirement |
|---|---|
| GET `/tournaments/:id/stage-baskets` | Organizer/tenant authorized; one `REPEATABLE READ READ ONLY` MVCC snapshot for graph, stage, roster and revision; send a strong, quoted, opaque ETag bound to tournament ID, epoch/generation and revision. No second SELECT on a newer transaction. |
| PUT missing `If-Match` | **428 Precondition Required**, ZERO graph/stage/roster/route/revision writes. |
| PUT stale `If-Match` | Lock parent **before compare/mutations**; **412 `STAGE_BASKET_CONFIGURATION_STALE`**, ZERO writes; winner commit and revision remain intact. |
| PUT weak, malformed, wildcard, multi or foreign-tenant token | Explicit fail-closed 4xx, ZERO writes; ETag is no substitute for organizer/session authorization. |
| Parallel requests / roster / stage change | Deterministic barriers, exactly one CAS winner, no last-write-wins. Any relevant stage/roster mutation invalidates previously issued ETag. DB revision strictly increases even for A→B→A ABA. |
| Authorized valid PUT | Recheck stage/roster under same parent lock; graph+routing+derived stage+revision commit atomically, new ETag from **final** revision (multiple trigger bumps per PUT allowed unless owner explicitly chooses stricter semantics); rollback all data and revision on error. |
| Frontend | Keep editor draft on 412, explicit reconciliation/reload, never auto-force stale If-Match. |
| Backup V3 import/export | `0028 matches.revision` is **match-state CAS** distinct from `result_history.revision` and basket revision. New strict source match revision must be checked then mapped to new clone-local CAS; legal historical restores get fresh basket epoch/version. Strict marker/downgrade, `system_bye_assigned` nonundoable, preclone 400, nested-ID closure, late-failure full rollback including Undo/action log must be tested after wiring. Current [PR56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) is NOT_WIRED. |

Evidence source: [A20 R23A writer/deadlock matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/1ce5a0e9eb11b6a926357d9acfd59f597df4d7a2/docs/web-005/agent-reports/A20/WEB-005_A20_R23A_T055_RESERVATION_WRITER_CONFLICT_MATRIX.md), [A20 R22 CAS/Backup DB design](https://github.com/C8LyNn/aplikacja-turnieje/blob/3ec67447b272e679a29002e4980898bd1debf86d/docs/web-005/agent-reports/A20/WEB-005_A20_R22_T055_B3_DB_GATE.md), and separate owner-approved T055 D1–D6 policy (not SQL authorization).

## 4. Minimal safe test/rollback and A00 remaining decisions

| Future gate | Named owner approval required | Test/proof before next stage |
|---|---|---|
| **G0** | A00/HQ signs D01–D04 and source graph total order + exclusive allocator | Signed immutable decision with link; logical T055 still unnumbered |
| **G1** | Owner certifies disposable PG16 physical instance + Phase A `READ_ONLY_CATALOG_GO` | A50 actual read-only catalogue receipt, source SQL SHA, exact host/DB/role/fixture sanitized, exit 0; no DDL |
| **G2** | Owner signs Phase B `READ_ONLY_LEDGER_GO` with table/column privilege | A50 0027–0040 declared ledger rows/ambiguous IDs + catalogue postconditions and external runner executed-input checksum; unknown history STOP |
| **G3** | A00 signs explicit `NUMERIC_ALLOCATION_GO`, one exclusive allocator / atomic registry update | Unique physical number and filename `RESERVED_NOT_APPLIED` (still NO SQL applied) |
| **G4** | A00 issues exact migration/schema+ORM **code GO**, full writer lock/trigger design review | Isolated new PR at pinned SHA, fail-first DB tests; no changes to historic 0027–0040 SQL |
| **G5** | Separately signed **DISPOSABLE_PG16_DDL_AND_TM_TEST_RESET_GO** for one exact isolated target and schema | A50 real PG16 catalog+fixture upgrade, concurrent CAS/stage/roster ABA, >2^53, missing 428/stale 412, trigger/lock deadlock, rollback and failed restore tests. A60 independent exact SHA review. |
| **G6** | Separately signed integration/merge/deploy/release and SWARM-006 handoff by A00/HQ | Only after actual full app+DB tests, Backup strict/legacy positive and negative import tests, rollback/forward repair; no automatic GO from prior docs |

Rollback/failure plan: abort transaction leaves graph and revision unchanged; on partial migration failure capture catalogue and runner state then owner-reviewed forward repair. After CAS activation **never decrement/reseed** the version or silently return to unconditional PUT (ABA/stale-write safety). Pre-activation additive column may remain dormant on halted rollout. Post-activation repairs use a separately reviewed forward-only migration/epoch invalidation plan; never guess a DROP COLUMN rollback. During strict Backup restore, all clone root/children/history/Undo/action/revision changes must commit or roll back atomically.

**Hard STOP:** no authorized concrete target => no SELECT; no signed D01–D04 => no numeric ID or migration code; no independent A60 or A50 runtime receipt => no full PASS. No existing target Docker/PG16/credentials were available or used in R23C.

**Final:** `WEB-005-T020-A20-R23C-MIGRATION-GATE / MIGRATION_OWNER_BLOCKED / SELECT_15_OF_15_STATIC_PASS / CATALOG_NOT_EXECUTED / LEDGER_NOT_EXECUTED / REQUESTED_NOT_ALLOCATED / NO_SQL_DDL / NO_MERGE / NO_DEPLOY / SWARM006_HOLD`.
