# WEB-005 R23G — A60 to A00: G0 Operational HOLD

**Date:** 2026-10-17. **C01 PR60 SHA:** fa3261b2c9510e110ac9eba21726812d3401a525 (OPEN DRAFT). **Verdict:** PG16_DESIGN_QA_BLOCKED. Read-only documentary planning is allowed. Docker G0 image pull/build is **NOT APPROVED**. G1–G5, SQL, migration, integration and cleanup all HOLD.

## Three independently confirmed P1 blockers

1. **Competing topology specifications:** Drive [no-host-port Compose](https://drive.google.com/file/d/1zLZsZ-APpSzgPwmSNsCJdU-4icwFC_jc/view) and the [application/yaml copy](https://drive.google.com/file/d/1pyAJDYsuWvNCKhnolcsqFjT9ar1dV3mY/view) are A: network_mode none/shared pg16+runner namespace, no published host ports. [A20 ZIP](https://drive.google.com/file/d/1gN1vJZlWtm-X3U_lZrESrfbA8h2W1gHX/view) and [GitHub](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/R23G/PG16_DOCKER_COMPOSE.example.yaml) are B: loopback Windows host port. Require owner design choice and one authoritative signed hash-pinned Compose, with others clearly DEPRECATED.
2. **Malformed ZIP YAML:** archived A20 ZIP Compose does not parse with independent PyYAML due to malformed pg_isready healthcheck quoting. Both Drive no-port YAML copies parse, but Docker Compose semantic/runtime validation remains UNTESTED. Do not interpret 8/8 valid ZIP SHA hashes as functional Compose PASS.
3. **G5 ownership label mismatches:** current Drive no-port Compose uses keys web005.run_id and web005.source_sha, but accompanying resource manifest cites web005.runid and web005.c01_sha; alternative B uses web005.run-nonce and web005.source-sha. Uniform literal label keys are required for proof of ownership and exact-ID cleanup before G1.

## P2 and positive boundaries

Outstanding P2: no approved actual Linux PG16/runner image digests, A50 immutable image, operator secret ACL and physical cluster/PGDATA/port certificate. These are UNKNOWN, never PASS. A20 independent ZIP rehash matches SHA256 28e92c5094a89d7d1b5d0d9e09c20a9c100469501ecd9b6b235adb6c9122d335; 8/8 internal ZIP document hashes match. Separate Drive copies are NOT byte-identical to ZIP/GitHub summaries; Windows G: synchronization not independently established.
Independent original C01 source cross-check: standard S1 drops/recreates tm_test_* schema and applies 0001–0028. S2 creates and FORCE drops three tm_catalog_test_<16hex>_{dev,prod,fresh} databases requiring independent CREATEDB consent on empty isolated cluster; S2 history 0001–0010, separate reconciliation 0011. Dedicated atomic fixture uses 0030/0031; standalone lib/db public reset test excluded. Eight code blob identities confirmed.
A50 DB-free native 426/426 PASS previously certified by A60, but zero PG16 runtime/test receipts. A30 R3 diary is source-only Backup/Steam/CAS, not signed PG isolation QA. Native Windows PostgreSQL port 5432 cannot be touched.

## A00 requested decision

Request R23G-R2 canonical revision and written D-G-01 topology selection A or B, corrected YAML, consistent labels, one immutable SHA256/URL per executable document, runner build+image digest, exact source/lock/test-list provenance, signed S1/S2 and cleanup object identities, explicit role/secret contract and expiry. Then seek independently dated A00/HQ + A20 + Windows operator **G0-only** signatures for a bounded image pull/build plan. G1, G2, G3 S1, G3 S2, G4 and G5 require separate later signatures and independent physical receipts. Never auto-escalate permissions.

**R23G result:** PG16_DESIGN_QA_BLOCKED / G0_OPERATIONAL_NO_GO / G1_G5_HOLD / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO / SWARM006_HOLD.

[Detailed A60 source QA](./WEB-005_A60_R23G_PG16_DESIGN_INDEPENDENT_QA.md) | [Evidence JSON matrix](./WEB-005_A60_R23G_PG16_DESIGN_QA_MATRIX.json)