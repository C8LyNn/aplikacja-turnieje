# WEB-005 — A24 / R23H — PG16 Readiness Handoff (A20, A50, A60)

**Task:** `WEB-005-T024-R23H-READINESS`  
**Mode:** READ-ONLY PREFLIGHT DESIGN  
**Source:** PR #60 exact C01 SHA `fa3261b2c9510e110ac9eba21726812d3401a525` (verified via GitHub)  
**Status:** `R23H_READINESS_DESIGN_COMPLETE` **for documentation only**, `PG16_EXECUTION_NOT_AUTHORIZED` and **ALL G0–G5 HOLD**. No Docker, SQL, migration, testing or cleanup executed by A24.

## Canonical upstream
A20 R23G-R2: https://drive.google.com/drive/folders/1-kR3pueqklMzu4vKqQa4EdzTbUTNsTIq

## A24 four Markdown deliverables, exact local artifact SHA256
| File | SHA256 |
| --- | --- |
| `R23H_G0_G5_READINESS_MATRIX.md` | `7abccfb8d2909174ae4004d3f75c9dcfc69a8caea08320aec7a60942817d6e71` |
| `R23H_OPERATOR_APPROVAL_TEMPLATE.md` | `d0d56751650f5cd9742120d21f47f86f3d16063035a33850efd2fc2a606746d4` |
| `R23H_EXECUTION_STOP_CONDITIONS.md` | `62c2a9731add6c714ac68719630aca143efb0d21c7759ef15504e3b33e8d6ff6` |
| `R23H_A50_HANDOFF_CONTRACT.md` | `31fdbe57f61cd85fa564e57a7588054f02c0c972c3cfc42149899a723b6c9e8f` |

These four full files are generated as user-facing artifacts in A24's ChatGPT workspace; their hashes are published for custody. **They are not claimed to have been uploaded or mirrored to Drive or committed here**. This GitHub dispatch is the shared cross-agent handoff summary, not a substitute for obtaining full reports from the A24 user artifacts.

## Objective G0–G5 gates
- **G0a/G0b — source, authenticated OCI descriptor + separately authorized immutable image pull / runner build, then produced digest attestation.** Official PostgreSQL `postgres:16.15-trixie` `linux/amd64` candidate platform manifest `sha256:75adc2a65806c96bc0e59030230bfe3f1c1b0d6d8f8181a8913e2b8b53bdc166`, but live authenticated registry read still required. Do not confuse index and architecture manifest. Node base and runner image digests **PENDING / NOT BUILT**. Full C01 tree/lock proof required (historical `pnpm-lock.yaml` SHA256 `8c30be5af6c9a868bf5b24ff3b2ced9ca0b976e66c3366a8e78d9df8229c39ef` to be rechecked).
- **G1 — physically new cluster** in Docker `network_mode:none`, node test runner `network_mode:service:pg16`, no host ports, internal `127.0.0.1:55432`; new labelled named PGDATA volume/Compose project, fresh container image/IDs, SCRAM, separate operator admin/runner role, Windows native `postgresql-x64-16` listeners `127.0.0.1:5432` and `[::1]:5432` unchanged.
- **G2 — separately authorized observer SELECT-only and physical identity correlation**, using operator-only `pg_controldata` on **new Docker PGDATA** (system_identifier) tied to volume mount/device/inode, container PID/netns and authenticated SQL endpoint. `localhost`, `PG_MAJOR`, or `pg_isready` alone cannot prove instance.
- **G3-S1 — separate triple GO** for exact owned `tm_test_<nonce>` schema `DROP SCHEMA ... CASCADE`, recreate, reviewed 0001–0028 migrations and teardown. Inventory special test-specific migrations (0030/0031) before G4.
- **G3-S2 — ANOTHER separate triple GO**, ONLY on empty physically isolated cluster for temporary cluster-wide `CREATEDB`, exactly three generated `tm_catalog_test_<16hex>_{dev,prod,fresh}` database CREATE and `DROP DATABASE WITH (FORCE)`. PostgreSQL cannot restrict CREATEDB privilege to naming prefix. **NO FULL G4 WITHOUT S2.** S2 child-generated SCHEMA_COMPARE_* values targeting its own scratch databases are permitted; inherited/foreign ones forbidden.
- **G4 — new triple GO for exactly one** unmodified `pnpm --filter @workspace/api-server run test:integration` with entire recursively discovered `*.integration.test.ts` suite. Seal test DSN/env, prohibit inherited DATABASE_URL/PG*/foreign SCHEMA_COMPARE_*. Investigate runner `read_only:true` filesystem write paths prior to GO. Record true exit, all original stdout/stderr, complete TAP counters and first genuine `not ok`/exception or explicit `INFRA_BLOCKER`. **Diagnostic evidence PASS can coexist with API suite FAIL**; old Windows DB-free 426/426 PASS is NOT PG16 QA.
- **G5 — separate cleanup triple GO** after immutable raw-private/redacted-cloud evidence; delete only resource IDs in signed G1 ownership manifest (no `prune`, guessed `down -v` or wildcard SQL). Verify Google Drive remote sanitized byte readback; Windows `G:\` local mirror remains `UNVERIFIED` until independent hash check.

## Distinct approvals required
A00/HQ + A20 + **named Windows operator** independently sign EVERY scope/phase on exact source, immutable plan SHA, actual host/context/PGDATA identity, UTC expiry, operation and exact resources. Separate action codes: G0 OCI verification, G0 image pull, G0 Node build, G1 provisioning, operator-only PGDATA read, G2 SQL SELECT observer, G3-S1 schema, G3-S2 three DBs/force-drop, G4 ONE test, G5 cleanup. An earlier phase PASS or A20 design authorship is **NOT** an execution GO.

## STOP
Hard STOP for context/source/digest drift; host 5432 or native PostgreSQL touched; Docker host published port/bridge route; reused/foreign PGDATA; inconsistent `pg_controldata` system_identifier; excessive runner privileges; schema collision; absent S2; inherited foreign DSN; wrong filesystem write; secrets in cloud logs; incomplete TAP; unverified evidence; guessed cleanup targets. Freeze progression, record evidence, notify A00+A20+operator and A60; never auto-drop/stop/cleanup. New exact-scope triple approval required for any remediation.

## Recipient actions
- **A20:** Independently review S1/S2/role/migrations and plan hash. Do **not** assume design is signed execution permission.
- **A50:** Use pre-run seal and STOP policy for future work; **do not start Docker/SQL/tests now**. No full API run until G0/G1/G2/G3-S1/G3-S2 PASS plus fresh G4 signatures.
- **A60:** Independently examine source, actual OCI manifest/runner, physical cluster and signature/evidence chain when it exists; keep `ENV_NOT_TESTED / API_NOT_RUN / CLEANUP_NOT_RUN` meanwhile. DB-free 426/426 != PG integration.
- **A00/Windows operator:** Freeze R2 no-host-port topology and decide per-operation consent; Windows 5432 must remain untouched. C02, SWARM006, release/live remain HOLD.

**Disposition:** `R23H_READINESS_DESIGN_COMPLETE` (documentary); `PG16_EXECUTION_NOT_AUTHORIZED` (runtime).
