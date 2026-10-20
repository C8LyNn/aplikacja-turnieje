# WEB-005 — A30 / R23H — INDEPENDENT SECURITY RECONCILIATION

**Task:** `WEB-005-T030-R23H-SECURITY` | **Agent:** A30 / Security Write-Auth Hardening | **Date:** 2026-10-17, Europe/Warsaw  
**Mode:** independent *source-only, read-only* audit. **No Docker, SQL, tests, image pulls, filesystem/infrastructure changes or live deployment.**  
**Required verdict:** **`BLOCKED`** — source audit of A20 R23G-R2 completed **conditionally**, but **NO separately identifiable A21 canonical design or A22 SQL contract** was accessible from the supplied folder or current GitHub governance documentation. A30 cannot certify contracts purportedly authored by agents 21 and 22 without their immutable actual artifacts.

**Execution decision:** `G0=NO_GO / G1=NO_GO / G2_G5=HOLD / PG16_PHYSICAL_ISOLATION_UNATTESTED / C01_INTEGRATION_HOLD / SWARM006_HOLD / RELEASE_NO_GO`. This is an assurance and implementation-readiness blocker, not evidence that a live exploit occurred.

## 1. Exact evidence, provenance and gap

| Referent | Checked input and confirmation | Meaning |
|---|---|---|
| [A30 prior R23G security audit](https://github.com/C8LyNn/aplikacja-turnieje/blob/bd57cb2ebcb17f9ac135cfb7a983eb23fb1e3f57/docs/web-005/agent-reports/A30/WEB-005_A30_R23G_DOCKER_PG16_SECURITY_AUDIT.md) | Commit `bd57cb2ebcb17f9ac135cfb7a983eb23fb1e3f57`, blob `9a2a6029e9723ac939b9c30741722af663bc7f5c`, PR [#80](https://github.com/C8LyNn/aplikacja-turnieje/pull/80) DRAFT | Seven prior P0, eight P1 and four optional P2; **documentary** source QA only. |
| [User-supplied R23G-R2 Google Drive folder](https://drive.google.com/drive/folders/1-kR3pueqklMzu4vKqQa4EdzTbUTNsTIq) | Folder `R23G-R2_20261017`, 13 direct files listed by connector, primarily A20, incl. [A20 independent verification addendum](https://docs.google.com/document/d/1aqrBt77HygjDb9dFtutTTrkBjm75KTo_457cXWMMPj8/edit) | **Actually fetched** R2 addendum, Compose, Dockerfile, diff/QA/hash manifest and prior A20 record. This does **not** supply the independent A21/A22 artifacts by implication. |
| [A20 R23G-R2 canonical corrections](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/R23G-R2/PG16_DOCKER_ISOLATION_PLAN.md) | Blob `ea2bcc674757594d64be529c22fb4a12f80f1194`; [S1/S2 matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/R23G-R2/PG16_S1_S2_PERMISSION_MATRIX.md) blob `278a90b38be0d128f06ab2df14ea63c9cbd48700` | R2 explicitly supersedes historical R23G contradictions, **as A20's own corrections**, not A21/A22 acceptance. |
| [A20 R23G-R2 Compose](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/R23G-R2/PG16_DOCKER_COMPOSE_EXAMPLE.yaml) | Git blob **`000bf75d8d456dcb4657dbf06c8c9f6274918c73`**, canonical UTF-8 SHA256 **`7618513028d738fd78cb1c17a9d3bf3f9d3cf61ef8df5e46470bbaba05f9a397`** per A20 manifest | Static proposed Variant A, NOT runtime deployed; A20 reports logical Google Docs text parity, not raw cloud YAML bytes. |
| [A20 R2 Dockerfile](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/R23G-R2/Dockerfile.node22-pnpm10.example) | Git blob `61094e79376e0cee730c6ffdfb540ed60d4f94fa`; proposed base `NODE_BASE_PINNED` **not pinned to an image digest**, runner NOT BUILT | Source only; Dockerfile label cannot attest copied C01 source. |
| [A20 R2 independent verification](https://docs.google.com/document/d/1aqrBt77HygjDb9dFtutTTrkBjm75KTo_457cXWMMPj8/edit) | Claims canonical text 11/11, official PostgreSQL platform-specific digest `sha256:75adc2a65806c96bc0e59030230bfe3f1c1b0d6d8f8181a8913e2b8b53bdc166`; registry OCI descriptor GET **NOT EXECUTED** | Digest appears on provider page per A20, but signed registry descriptor, image config, platform image and Node runner remain **NOT_ATTESTED**. Conflicting/stale OCI index candidates explicitly reported. |
| [C01 PR #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) | HEAD `fa3261b2c9510e110ac9eba21726812d3401a525`; OPEN/DRAFT; base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | Exact integration source unchanged as checked. Source status **not** PG16 tested. |
| **A21/A22 independently requested artifacts** | Explicit Google Drive searches for `A21`, `A22`, `R23H` and SQL contract; supplied folder listing; GitHub governance `agent-reports/A21` and `agent-reports/A22` directory reads returned **404** at checked branch. No identifiable validated 21/22 document retrieved. | **CANNOT_CERTIFY / WAIT_SOURCE**, not a statement that A21/A22 failed to author work elsewhere. Request immutable links, exact SHA and signed revision for independent reconciliation. |
| [A00 preflight](https://github.com/C8LyNn/aplikacja-turnieje/issues/76#issuecomment-6232716514) | Historical operator evidence: Docker Linux engine; Windows native `postgresql-x64-16` listening `127.0.0.1:5432` / `::1:5432`; Docker objects absent *when sampled* | Point-in-time observational receipt only. **No Windows process, Docker context or physical PGDATA sampled by A30 in R23H.** |

**Provenance boundary:** official PostgreSQL 16 [CREATE ROLE](https://www.postgresql.org/docs/16/sql-createrole.html) assigns `CREATEDB` to a **cluster-wide role**, not a naming prefix. Official Docker [network_mode](https://docs.docker.com/reference/compose-file/services/) defines `none` and `service:<name>`. These are external technical standards, not proof of the planned runtime.

## 2. R23G → R23H source reconciliation

| R23G finding | A20 R23G-R2 result verified from actual source | R23H A30 determination |
|---|---|---|
| P0-01 inconsistent no-host-port design vs old host-published example | New R2 YAML declares only **no-host-port** Variant A: `pg16.network_mode:none`, `api-tests.network_mode:service:pg16`, `ports:[]`, internal PG `127.0.0.1:55432`; top-level bridge absent | **SOURCE_MITIGATED_IN_A20_R2**, but historical R23G Option B still exists and **A21 signed canonical selection/quarantine was not located**. Do not launch either by inference. |
| P0-07 unpinned images | Candidate PostgreSQL 16.15-trixie amd64 manifest SHA reported; `pull_policy:never`, explicit `platform:linux/amd64`; Node22.23.3/pnpm10.34.7 Dockerfile | **PARTIAL**: authenticated OCI registry verification, Node base digest and actual runner digest remain PENDING; **G0 blocked**. |
| P0-03 S2 `CREATEDB` cluster scope | R2 distinguishes S2 and requires new empty PG cluster + separate signature | **DESIGN_HARDENED**, but effective runner role grants and physical empty-cluster proof absent. |
| P0-04 S1 wrong schema reset | Explicit G3-S1 run-specific `tm_test_<nonce>` required; C01 helper still has default `tm_test_access` and `DROP SCHEMA IF EXISTS ... CASCADE` | **SOURCE RISK UNCHANGED; OPERATOR GUARD PROPOSED ONLY**. Fresh schema absence and ownership required before G3-S1. |
| P0-02 wrong DB/cluster | R2 requires Docker context, volume/PGDATA system ID, DB/role G2 reconciliation | **DESIGN ONLY**. No actual new cluster or G2 certificate. |
| P0-05 inherited DATABASE_URL/child env | R2 clarifies foreign/inherited `DATABASE_URL`, PG settings, `SCHEMA_COMPARE_*` forbidden; **S2 fixture-generated child `SCHEMA_COMPARE_*` allowed** for its owned DBs | **CORRECT SOURCE CLARIFICATION**; future sealed G4 launcher still missing and unreviewed. |
| P0-06 paper-only phase barriers | R2 expands A00/A20/operator signatures, image/permission/evidence prerequisites | **PROCEDURAL IMPROVEMENT**, but actual enforcing guard/immutable plan certificate absent. |
| R23G P1 secret persistence | Separate secrets for test runner and `postgres` are still declared | **UNRESOLVED**: PG bootstrap-admin secret remains mounted throughout container life in Compose; no rotation or G1→G4 disposal described as executed. |
| R23G P1 readonly runner writes | A20 R2 requires A50 write-path census and signed tmpfs/scratch | **OPEN_G4**: `read_only:true` + 128 MiB `/tmp` is only candidate; no source-derived writable path census or actual integration success. |
| R23G cloud report confidentiality | A20 claims 11/11 *normalized text* correspondence; Drive native Doc differs from raw YAML/MD bytes | **CLAIM CORRECTLY LIMITED**; require secret-leak negative canaries/Drive ACL and exact byte hash of actual published redacted receipts at G4/G5. |

## 3. Security findings, priority and future independent verification

### P0-01 — Required A21/A22 handoffs unavailable (acceptance evidence blocker)
**Observation:** Neither independent A21 canonical design nor A22 SQL contract was present in supplied folder, discoverable Drive metadata or checked governance GitHub directories. A20 docs cannot substitute for review independence.
**Required remediation:** A21 provides immutable canonical Compose, network/port/volume/secret, host non-access and rollback contract; A22 provides exact SQL/privilege/migration/destructive S1+S2 statement inventory with provenance at C01 SHA. Both must include source SHA, signed owner, release GO/STOP map, and explicit conflict handling with historic R23G B topology.
**Verification:** A30 and A60 independently fetch these two **specific immutable** artifacts; reconcile per-section and independently compare exact output with R2 plus C01 source, without running Docker/SQL. **G0/G1 blocker.**

### P0-02 — No signed single-source runplan/topology before G0
**Observation:** R2 does use no-host-port Variant A, yet legacy different GitHub R23G Compose remains accessible. No A21-authored owner-approved irreversible choice or unambiguous immutable runplan was available. Docker CLI can bypass procedural GO documents.
**Required remediation:** A00 chooses exactly one SHA-frozen *canonical* Compose/runner/secret plan and quarantines deprecated options. A00/A20/operator independent approvals must bind **same exact plan digest, source/tree, image digests, host/context fingerprint, time bounds and allowed G-phase**. Operator should use a fail-closed preflight/check gate, with no fallback on mismatched config.
**Verification:** compare canonical source bytes and signed SHA, reject old host-published YAML, changed `-p`/project variable, unauthorized port and missing phase signatures by safe offline examination. No Docker command currently permitted. **G0/G1 blocker.**

### P0-03 — Image supply-chain incomplete for G0
**Observation:** PG image digest candidate documented, but not independently fetched via authenticated OCI registry descriptor; competing index candidates reported. Node base pinned digest and built runner artifact **missing**. `pull_policy:never` prevents implicit image pull but cannot prove provenance.
**Required remediation:** authorized G0 reads the trusted OCI manifest/index+amd64 descriptor, verifies accepted PG 16.15 image configuration; owner-approved immutable Node base, exact C01 clean checkout, lock SHA, hardened build context, final runner image digest; **no production secrets in build layers**, attest actual image bytes (not labels).
**Verification:** A60 independently checks supply-chain report and SHA/arch; fail if digest/registry/mutable tag drift. **G0 blocker.**

### P0-04 — Windows native PostgreSQL exclusion only asserted in design
**Observation:** R2 network topology **statically** forbids host published ports and Docker bridge; actual `NetworkMode`, mount IDs, Docker context, UNIX sockets, listen tables and Windows PostgreSQL PID are not attested from an R23H runtime. `pg_isready` cannot prove physical instance.
**Required remediation:** G1 future freshly created-only PGDATA volume, container ID+network namespace, cluster system identifier, approved loopback listener and zero host port bindings; operator out-of-band checks native Windows PG16 still bound to **5432 only**, without connecting to it. At G2 independently join operator physical certificate with DB logical identity on disposable test cluster.
**Verification:** read-only inspect/socket/catalog identity check *after future separate phase GO* and independent A60 evidence review; if any host, bind, Docker socket or wrong target appears STOP, no G3. **G1 plan-certification mandatory; G2 physical proof mandatory before any SQL.**

### P0-05 — S1/S2 dangerous capability cannot be trusted without A22 contract
**Observation:** [C01 S1 helper](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/test-database.ts) blob `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6` can `DROP SCHEMA IF EXISTS tm_test_* CASCADE` and executes 0001–0028. [C01 S2 fixture](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/replit-schema-catalog-reconciliation.integration.test.ts) blob `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4` creates 3 scratch databases then issues `DROP DATABASE ... WITH (FORCE)`. `CREATEDB` is cluster role privilege; schema name regex and localhost/non-5432 are insufficient. A22's exact review/acceptance not obtained.
**Required remediation:** A22 signs exhaustive SQL/fixture effects, ownership/rollback/extension/DDL dependencies; G3-S1 exact fresh owned schema and migration-input SHA; G3-S2 separate authorization for only completely new empty disposable PG cluster and short-lived `CREATEDB`, 3 generated DB names recorded and owned. Runner is `NOSUPERUSER/NOCREATEROLE/NOBYPASSRLS/NOREPLICATION`, no bootstrap admin password. No fixture-internal teardown confused with later operator G5 cleanup.
**Verification:** independent written statement diff, DB ownership/ACL catalog against actual G2-certified cluster, negative role/foreign-object outcomes after future GO; no skipped S2 tests masquerading as full integration. **G3/G4 hard block, A22 documentary blocker before G1 approval.**

### P1-01 — Bootstrap superuser credential remains persistently accessible inside PG container
**Observation:** R2 Compose keeps `POSTGRES_USER:postgres`, `POSTGRES_PASSWORD_FILE:/run/secrets/pg_admin_password` and mounts `pg_admin_password` for entire life. Separate runner only mounts `pg_test_password` — positive boundary, but G1-only admin secret claim not yet enforced.
**Required remediation:** post-bootstrap admin secret unmount/rotation plan or formally approved risk acceptance with short-lived disposable cluster; no admin secret in runner, env dump, logs or Drive; inspect only metadata, never credential contents. **G1 design and G4 risk gate.**

### P1-02 — Test runner cannot yet guarantee correct target/approved env
**Observation:** `lib/db/src/index.ts` reads `DATABASE_URL`; code S2 inherits parent env into child, then assigns scratch-only SCHEMA_COMPARE vars. Future G4 sealed launcher and admission control are not implemented.
**Required remediation:** G4 process env allowlist, forbid inherited `DATABASE_URL`, `PGHOST/PGPORT/PGSERVICE/PGPASSFILE`, untrusted `SCHEMA_COMPARE_*`; generate `TEST_DATABASE_URL` only inside sealed namespace using distinct test secret and physically attested ID. Keep S2's **test-generated own child vars**, not blanket ban. Validate no unintended `.env` and side-loaded services.
**Verification:** safe negative test plan with contradictory/untrusted parent vars must STOP **before connection**; A50/A60 independent source review after separate GO. **G4 gate.**

### P1-03 — Read-only runner and scratch write requirements unverified
**Observation:** R2 runner has `read_only:true` and only `/tmp:rw,nosuid,nodev,size=128m`. Existing integration tests may write caches/fixtures outside `/tmp`. `Dockerfile` and packaged runner never executed.
**Required remediation:** A50 performs exact C01 source-derived filesystem write census; allocate only necessary isolated tmpfs/scratch paths with labels/no host data bind, don't remove read-only protection silently.
**Verification:** independent static write inventory followed by separately authorized disposable G4 smoke; unexpectedly writable source/host path or write failure => STOP. **G4 gate.**

### P1-04 — PostgreSQL server privilege, SCRAM and PGDATA permissions are unverified
**Observation:** `--auth-host=scram-sha-256 --auth-local=scram-sha-256` is an initialization intent. Subsequent restarts on existing data may not reinitialize HBA; PG superuser exists by image bootstrap. PG container lacks explicit runner-like capability drop. No actual `pg_hba.conf`, role membership, mode/UID/ACL attestation.
**Required remediation:** fresh empty volume guarantee; verify effective HBA and SCRAM session auth, `NOSUPERUSER` test role, PGDATA host/WSL ACL, no `privileged`, host PID, docker.sock, foreign mounts; resource limits where compatible.
**Verification:** only future signed G1/G2 read-only physical/PG observations, A60 review; never infer from Compose key presence or healthcheck. **G1/G2 gate.**

### P1-05 — Orphaned S2 databases, cleanup scope and Google Drive leakage
**Observation:** S2 fixture may leave partial DBs if CREATE/migration/teardown errors; its `after()` drop operations occur in **G4**, not operator G5. Google-native Docs text parity does not imply raw byte equality; Windows G: sync unverified. Raw TAP may contain DSN/secret/local paths.
**Required remediation:** G3/G4 signatures authorize own exact fixture teardown; G5 separately approves exact-ID cleanup; no broad `compose down -v`, `prune` or guessed schema drops; private nonsynced full raw logs, cloud only redacted allowlisted fields with synthetic leakage canary checks, Drive ACL and remote-byte-hash readback.
**Verification:** genuine postrun DB/volume inventory, lossless evidence, no secret-containing URI in cloud; independent A60 acceptance. **G4/G5 gate.**

### P2-01 — Optional additional defense
Enforce bounded resource quotas/connection limits and nonroot runtime where image permits; use short role/password expiry, do not widen privileges; use static negative source-lint rule blocking `ports`, `network_mode:host`, `privileged`, Docker socket and preexisting volume reuse in chosen A configuration. Review independently at future phase, **never count these as substitution for missing P0 evidence**.

## 4. G0 / G1 decision for A00 & A60

| Phase | Source-level status | Minimum future PASS evidence | R23H A30 answer |
|---|---|---|---|
| **G0** | R2 candidate PG digest only; no Node base/final runner; 21/22 handoff absent; no one approved execution | A21 canonical selected runplan SHA, A22 signed SQL risk inventory, trusted exact OCI amd64 PG descriptor, pinned base, clean C01/lock and build context, independent A00/A20/operator exact phase GO | **NO_GO / BLOCKED** |
| **G1** | Safe-looking no-host-port Compose but only static; 21 choice not attested; bootstrap secret persists | Exact A21 architecture/compose pin + triple G1 GO, fresh project/volume labels, image config, Windows PG-preservation plan, post-create immutable physical certificate; no host port | **NO_GO / BLOCKED** |
| G2 | Physical/logical cluster identity not measured | Observer-bound test-only PG16 major/system identity, ACL, ephemeral roles, restricted PGDATA and native PG16 preservation evidence | **HOLD** |
| G3-S1 | Destructive source known, ownership/approved name not proven | A22 reviewed statements, S1 signed exact fresh `tm_test_<nonce>`, migrations hash 0001–0028 | **HOLD** |
| G3-S2 | Cluster-wide `CREATEDB`; 3 DB `DROP WITH FORCE` | A22 contract, independent S2 signature, exclusively new empty cluster proof and no data outside scope | **HOLD** |
| G4 | Sealed env/test runner unimplemented | Exact C01 unmodified test runner, expected first TAP evidence and exit; no inherited prod URLs, PG cert matched | **HOLD** |
| G5 | No disposable run objects exist | Exact objects and identifiers, clean-up signature, raw private evidence/safe cloud proof, Windows native PG preserved | **HOLD** |

**For A00:** Request direct immutable A21 + A22 links/SHAs; choose one canonical Option A and explicitly mark old R23G Option B deprecated; do not authorize G0 image pulls or G1 container creation before resolved P0-01..03. **No implicit approval from document creation or `DOCKER_INFRASTRUCTURE_PREFLIGHT_PASS`.**

**For A60:** Independent A21/A22 cross-check is **NOT POSSIBLE YET**. Review exact cited A20 R2 source as a *provisional* baseline only. Re-run the security review against the two agents' actual immutable outputs before declaring `R23H_SECURITY_REVIEW_COMPLETE`. Any future runtime QA must keep `SOURCE_PASS`, `PHYSICAL_PASS`, `PG_ACL_PASS`, `INTEGRATION_PASS` separately evidenced.

## 5. Audit execution and publication truth

- Read-only inspected: prior A30 R23G, supplied A20 Drive folder, multiple A20 R23G-R2 docs/Compose/Dockerfile, actual GitHub source blobs C01 and exact PR metadata, A00 prior Issue #76 infrastructure attestation, official Docker and PostgreSQL semantics.
- Search limitation: **no independently identifiable A21 / A22 artifacts were retrieved** from supplied folder, Drive searches or checked GitHub governance directories; do not invent their signatures or content. If a newer private location exists, owner must provide direct immutable URL.
- No Docker, SQL, network probing, test, local Windows commands, destructive operations, change to PostgreSQL, application, game, CI, merge, deployment or SWARM-006.
- Source checks are documentation/metadata comparisons; **NO SQL/PG test PASS**, **NO Docker physical isolation PASS**, `EXIT_CODES=N/A`, actual resource IDs `UNKNOWN`.
- **Final:** `BLOCKED / A21_CANONICAL_ARTIFACT_NOT_FOUND / A22_SQL_CONTRACT_NOT_FOUND / A20_R23G_R2_STATIC_REVIEW_DONE / G0_NO_GO / G1_NO_GO / PG16_EXECUTION_HOLD / A60_RECHECK_REQUIRED / RELEASE_NO_GO / SWARM006_HOLD`.
