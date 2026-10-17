# WEB-005 / A20 / R23F — PG16_OWNER_APPROVAL_REQUEST

**To:** A00/HQ, A20 DB gate, Windows 11 host operator (three **separate** approvals). **Runner:** A50. **Independent QA:** A60.  
**Task:** `WEB-005-T020-A20-R23F-PG16-INTEGRATION-PREFLIGHT`.  
**Current decision:** **`PG16_EXECUTION_NOT_AUTHORIZED`** — this request is unsigned by owner/operator and not an execution permit. DB-free `DBFREE_QA_ACCEPTED` has different scope from PG16 integration. [Contract](./PG16_ISOLATION_CONTRACT.md), [preflight](./PG16_PREFLIGHT_CHECKLIST.md), [execution/rollback](./PG16_EXECUTION_AND_ROLLBACK_PLAN.md), [A50 handoff](./PG16_A50_DIAGNOSTIC_HANDOFF.md).

## A. Approve or deny THESE five separable gates, not one blanket "GO"

| Gate | Requested authorization | A00/HQ signature | A20 signature | Operator signature | Current state |
|---|---|---|---|---|---|
| **G0 SOURCE CHECKOUT** | Recreate EXACT C01 SHA `fa3261b2c9510e110ac9eba21726812d3401a525` into **new scratch only**, pin Node22/pnpm10 and lockfile, source-test discovery, no DB | Missing | Missing | Missing | `PENDING` |
| **G1 PHYSICAL PG16 PROVISION** | Create **new disposable isolated PG16 cluster/DB/volume**; owner-certified process/container/port/network/empty state, no existing PostgreSQL/shared/prod, no real data | Missing | Missing | Missing | `PENDING` |
| **G2 READ_ONLY CATALOG** | Observer-only read permission in **identified test** instance with host/DB/schema and strict metadata/redaction; no schema/DB modification | Missing | Missing | Missing | `PENDING` |
| **G3-S1 TM TEST SCHEMA RESET** | A50 may run scoped API fixture that **DROP/CREATEs exactly owned `tm_test_<nonce>` schema** and installs 0001–0028 in test-only database | Missing | Missing | Missing | `PENDING` |
| **G3-S2 CATALOG 3-DB FIXTURE** | Grant scoped `CREATEDB` solely in new disposable cluster for `tm_catalog_test_<16hex>_{dev,prod,fresh}` and authorize tests' **DROP DATABASE WITH (FORCE)** cleanup of only newly created three DBs | Missing | Missing | Missing | `PENDING` |
| **G4 EXACT API FULL SUITE** | `pnpm --filter @workspace/api-server run test:integration` on certified target, Node `--test-concurrency=1`, no skip, no CI runner; A50 logs first failure and true exit | Missing | Missing | Missing | `PENDING` |
| **G5 CLEANUP / RETENTION** | Destroy ONLY resources in signed per-run manifest after evidence retention; fail-closed on preexisting/foreign resources; remote Drive sync verification | Missing | Missing | Missing | `PENDING` |

**Dependency graph:** G0 → G1 → G2 → (G3-S1 and **G3-S2**) → G4 → G5. If S2 is denied, **G4 full integration MUST be denied**; a separately authorized exact-file subset is **PARTIAL**, does not reproduce the full old CI failure and cannot silently skip catalogue tests. No endorsement of source modifications, old CI rerun, T055 allocation/SQL deployment, C02 or SWARM-006.

## B. Minimum physical operator-supplied certificate (redacted in report)

Supply signed confidential original and safe shared fingerprint:
```yaml
request_id: WEB-005-T020-A20-R23F-PG16-INTEGRATION-PREFLIGHT
source_pr: 60
source_sha: fa3261b2c9510e110ac9eba21726812d3401a525
physical_operator: null
windows_host_identifier_hash: null
instance_method: null                 # isolated Docker/VM/native isolated process
image_digest_or_pg_binary_sha256: null
postgres_major: 16
cluster_system_identifier_hash: null # independently obtained, no test superuser
container_or_process_id: null
data_directory_realpath_and_created_marker: null # private owner evidence
network_namespace_and_firewall_attestation: null
listening_host: null                  # verified 127.0.0.1/::1 only
listening_nondefault_port: null
owning_database_name: null            # must contain test; never prod
schema_name: null                     # regex ^tm_test_[a-z0-9_]+$
catalogue_three_database_scope: null  # exact created DBs / no preexisting collisions
allowed_create_drop_ops: null         # S1 and S2 separately
backup_of_disposable_baseline: null
rollback_resource_inventory_hash: null
node_pnpm_and_lockfile_fingerprints: null
host_start_and_expiration_utc: null
evidence_redaction_owner: null
google_drive_folder: G:/Mój dysk/ChatGPT/WEB-005/Raporty
google_drive_sync_proof: PENDING
```
The above is a **template, not actual attestation**. Do not paste passwords, tokens, full URLs with userinfo or live data into GitHub. Independently verify claimed PG host-port->PID->PGDATA->isolated volume and absence of external routes **before** any SQL. Require owner-certified per-run nonce and zero preexisting target schema/catalog databases. Owner/operator must not provide a connection to live/Replit, even for read-only checks under this R23F scope.

## C. Signature object each approver must publish separately

```yaml
decision_id: null
approver_role: A00_HQ | A20_DB_SAFETY | WINDOWS_OPERATOR
approver_identity: null
signed_at_utc: null
expires_at_utc: null
source_sha: fa3261b2c9510e110ac9eba21726812d3401a525
physical_certificate_hash: null
allowed_gate_ids: []
allowed_database_and_schema: null
allowed_create_drop_object_names: []
allowed_commands_exact: []
maximum_execution_footprint: null
rollback_instruction_reference: null
evidence_destination_and_retention: null
signature_record_url: null
decision: PENDING   # explicitly GO or DENY after review
```
**All three must agree on identical source, physical certificate hash, target, commands and reset/cleanup scope**. A20 author of this request does not confer their own signature, and document commit/review is not a future DB execution permit. Approvals are invalid if signer absent, source changed, window elapsed or process/volume fingerprint drifted.

## D. Decisions A00 must explicitly resolve

1. Can the operator prove **physically independent PG16**, non-shared port/process/PGDATA, constrained new DB and absence of production routes, without bringing user data? If not, answer **DENY**.
2. Does A00 authorize **three transient databases CREATEDB/DROP DATABASE WITH FORCE** in addition to schema reset? If not, full C01 API command **HOLD**. The catalogue fixture is part of recursively discovered API tests, not a separate lib/db opt-in.
3. Who maintains the authoritative approval audit (GitHub Issue #73 or owner decision repo path), certificate lifespan, clear expiry and cleanup/no-op fallback? Are signed non-secret certificate SHA and allowlists ready for A50/A60 review?
4. Is evidence path `G:\Mój dysk\ChatGPT\WEB-005\Raporty` writable on owner Windows, is Google Drive Desktop sync enabled, and can Drive readback+hash be independently verified? If not, local-only reports permitted but status `SYNC_UNVERIFIED`, not false cloud upload success.
5. Which exact suite and exit/root-cause policy? Suggested **one full C01 API Integration** under S1+S2, preserving first `not ok`, no suite disabling; any follow-up Pack17 full or C02 needs distinct approval.
6. Separate open **R23B migration D01–D04** (source DAG/ledger/numeric allocation) from THIS disposable 0001–0028 fixture. Signing this PG16 test gate does **NOT** assign T055 migration number nor approve production migration.
7. At which outcome does operator dispose the scratch database? Authorize only owned resources after redacted logs and checkpoint preserved; if cleanup mismatch, mark `CLEANUP_HOLD` and operator inspects privately; no broad deletion.

## E. A20 recommendation and current verdict

**Recommend documentary `PREFLIGHT_READY_TO_BE_SIGNED`**, contingent on owner/operator providing missing original physical target and independent signature evidence. **Do not grant GO now.** The request can be signed by A00, A20 and operator only after G1 physical evidence is reviewed, in that order or via formal multi-party cross-signing. No automatic approval if one party signs.

**Current:** `PG16_EXECUTION_NOT_AUTHORIZED / A00_SIGNATURE_MISSING / A20_EXECUTION_SIGNATURE_MISSING / OPERATOR_SIGNATURE_MISSING / INSTANCE_UNCERTIFIED / S1_UNAUTHORIZED / S2_UNAUTHORIZED / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO / SWARM006_HOLD`.
