# WEB-005 — A20 R23G / PG16_OWNER_APPROVAL_REQUEST

**Task:** `WEB-005-T020-A20-R23G-DOCKER-PG16-ISOLATION` · **Date:** 2026-10-17 Europe/Warsaw · **Mode:** DESIGN ONLY · **Execution:** `PG16_EXECUTION_NOT_AUTHORIZED`.  
**Source:** [PR60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) `fa3261b2c9510e110ac9eba21726812d3401a525`, OPEN DRAFT/UNMERGED.  
**Recipients:** A00/HQ, A20 DB safety, Windows host operator, then A50 executor/A60 independent QA. A00's [Issue76 decision](https://github.com/C8LyNn/aplikacja-turnieje/issues/76#issuecomment-6232716514) approves **Docker infrastructure preflight ONLY** — not image pull, VM, container, database or test.

**Path note:** this file uses `agent-reports/A20/R23G/` because the historical R23F document with the same basename `agent-reports/A20/PG16_OWNER_APPROVAL_REQUEST.md` must not be overwritten.

## D-G-01–06 documentary decisions for A00

| Decision | Recommended A20 option | Approval scope now |
|---|---|---|
| D-G-01 networking | **Option A:** PostgreSQL `network_mode:none`, runner `network_mode:service:pg16`, PG internal `127.0.0.1:55432`, **no host published ports**. Windows 5432 unchanged | DOCUMENTARY ONLY |
| D-G-02 storage | New random-run-labelled Compose project, one new named PGDATA volume; **no host data bind**, no prior Docker service reuse | DOCUMENTARY ONLY |
| D-G-03 credentials | Dedicated ephemeral runner login, `NOSUPERUSER NOCREATEROLE NOREPLICATION NOBYPASSRLS`; operator bootstrap admin secret separate, not mounted into runner | DOCUMENTARY ONLY |
| D-G-04 destructive limits | S1 owned `tm_test_*` schema DROP/CREATE + 0001–0028, S2 **separately** `CREATEDB` + 3 temporary `tm_catalog_test_<16hex>_{dev,prod,fresh}` DB CREATE/DROP WITH FORCE | DOCUMENTARY ONLY |
| D-G-05 logs | Full raw private Windows scratch; sanitized reports cloud Drive folder `PG16_DOCKER_ISOLATION`, immutable SHA256 and remote readback; local G: sync needs separate proof | DOCUMENTARY ONLY |
| D-G-06 rollback | Stop/clean ONLY exact G1 created container, role/DB/schema/volume IDs after G5 consent, A60 evidence preserved. No Docker prune or existing PG restart | DOCUMENTARY ONLY |

## Exact phase-by-phase request — THREE signatures for EACH

| Phase | Operation requiring future separate triple GO | Current |
|---|---|---|
| G0 | Exact C01 SHA/frozen lock + preapproved **image pull/build** of pinned Linux/amd64 PG16 and Node22 runner | `HOLD` |
| G1 | Create new isolated Docker PG16 project/volume/container and operator-run role/base test DB provisioning | `HOLD` |
| G2 | Catalog SELECT-only and independent physical identity/privilege verification on new disposable cluster | `HOLD` |
| G3-S1 | Allow test fixture to DROP/CREATE *one exactly named owned* `tm_test_<nonce>` schema and 0001–0028 migration sequence | `HOLD` |
| G3-S2 | Separately allow test-created 3 temporary DATABASEs with cluster-wide CREATEDB role and DROP DATABASE WITH FORCE on new empty cluster only | `HOLD` |
| G4 | Run exactly `pnpm --filter @workspace/api-server run test:integration` at exact C01 in air-gapped Node runner; full stdout/stderr, true exit, first actual `not ok` | `HOLD` |
| G5 | After evidence retention, exact-owned-resource cleanup, no wider Docker/system mutation | `HOLD` |

**All three** A00/HQ, A20 and Windows host operator MUST publish their own dated/expires/signed approval record for **same** C01 SHA, Docker context/host, verified PGDATA+volume+cluster ID, internal port/network, role/DB/schema and exact allowed commands/objects. A20 authoring is **not** execution GO. Any mismatch -> revoke.

## Mandatory owner/operator certificate (unfilled, never infer)

```yaml
task_id: WEB-005-T020-A20-R23G-DOCKER-PG16-ISOLATION
c01_sha: fa3261b2c9510e110ac9eba21726812d3401a525
operator_id: PENDING
owner_A00_signature_url: PENDING
A20_DB_safety_signature_url: PENDING
operator_signature_url: PENDING
docker_host_context_engine_fingerprint: PENDING
postgres16_linux_amd64_image_digest: PENDING
runner_image_digest_and_exact_checkout_sha: PENDING
project_and_nonce: PENDING
pg_container_pid_and_vol_created_labels: PENDING
pgdata_inode_realpath_and_cluster_system_id_hash: PENDING
network_mode: none
host_port_publications: []
internal_pg_loopback: 127.0.0.1:55432
native_windows_postgresql_service_pid_port5432: RE_ATTEST_BEFORE_GO
test_base_db_name: PENDING
tm_test_schema_name: PENDING
catalog_three_names: GENERATED_IN_G4_REQUIRES_S2_GO
cluster_empty_no_prod_data_certificate: PENDING
test_role_acl_createdb_scope: PENDING
retention_and_rollback_evidence_hash: PENDING
cloud_folder_id: 1aZxxG11bF4QtmQyZQpiqSdUAHtWUJi36
G_drive_local_mirror_verified: false
phase_requested: NONE
expiry_utc: PENDING
```

## Blocking questions A00 must decide

1. Pin immutable `postgres:16` *linux/amd64* digest and Node runner image digest. No `latest` pull. Validate Docker context again at G0; empty object list was snapshot-only.
2. Approve no-host-port shared namespace; if not, explicitly request *separate* `127.0.0.1:55432:55432` Windows loopback exception with firewall/proxy proof. Never `5432` or `0.0.0.0`.
3. Confirm all new data exclusively scratch and no production/data directory mount. Who creates one-time runner role without leaking superuser secret?
4. **S2 CREATEDB cannot be limited to naming pattern by PostgreSQL**: only new physically empty isolated cluster makes this tolerable. If cannot prove, DENY full suite.
5. Supply operator-owned snapshot, disk budget, unmodified native Windows PG evidence before and after, and G5 exact-ID cleanup authority.
6. Confirm remote Drive byte readback and SHA256, plus Windows `G:\Mój dysk\ChatGPT\WEB-005\Raporty\PG16_DOCKER_ISOLATION\` local file mirror: cloud file existence != local mirroring.
7. A50 must collect first authentic API TAP `not ok` or earliest exception. Current old CI 38736073793 exit 1 is unclassified; A60 DB-free 426/426 is not PG QA.

**Owner response format:** `D-G-01..06: APPROVE_DESIGN|DEFER|REJECT; G0: SEPARATE_GO|HOLD; G1–G5: HOLD; operator=<named>; evidence_url=<redacted>; image_digests=<sha>; expiry=<UTC>`.

**Verdict:** `PG16_DOCKER_ISOLATION_PLAN_READY_FOR_A00_REVIEW`. Actual `PG16_EXECUTION_NOT_AUTHORIZED / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO`. No Docker, SQL, migration, game, CI or live actions authorized by this record.
