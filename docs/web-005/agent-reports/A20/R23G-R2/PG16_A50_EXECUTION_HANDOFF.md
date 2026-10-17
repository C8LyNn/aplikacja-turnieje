# WEB-005 — A20 / R23G-R2 — PG16_A50_EXECUTION_HANDOFF.md

**Task:** `WEB-005-T020-A20-R23G-R2` | **Date:** 2026-10-17 Europe/Warsaw | **Mode:** read-only design / source verification | **Authorization:** G0–G5 require A00/HQ + A20 + operator; `PG16_EXECUTION_NOT_AUTHORIZED`.

## R2 AUTHORITATIVE CORRECTIONS (supersede any contradictions below)

**R2 revised A50/A60 handoff:** No runner image has been built. Node22.23.3+pnpm10.34.7 are prior Windows DB-free baselines, not an existing immutable runner image. Proposed Dockerfile R2 uses G0-only build from selected digest-pinned Node22 Debian image (`NODE_IMAGE_DIGEST=PENDING`), exact C01 clean context and frozen lock; capture resulting arch-specific Docker image digest and full package tree SHA, do not claim reproducible binary identity without verified base image and artifact signatures. No host ports; PostgreSQL isolated loopback 55432 in `none` namespace shared with Node runner using `network_mode:service:pg16`. Test writable output directories unresolved: source has `read_only:true`; audit all local writes before G4; permit only new dedicated ephemeral tmpfs/scratch and never host data, else fail gate. For S1 dedicated tm_test schema; for S2 3 CREATE/DROP WITH FORCE and child fixture-generated `SCHEMA_COMPARE_*` vars within own URLs allowed; no inherited variables. G4 first actual named Node assertion or earliest exception with full native exit and original TAP; A60 independent source/checksum/signature review. STOP if A00+A20+operator G0–G5 independent approvals not signed. Windows PostgreSQL 127.0.0.1:5432 must remain untouched. Source-only QA does not open G0 or C02.

---

## R23G preserved historical baseline (source text for traceability)

# WEB-005 / A20 / R23G — PG16_A50_EXECUTION_HANDOFF

**Task:** `WEB-005-T020-A20-R23G-DOCKER-PG16-ISOLATION` · **Date:** 2026-10-17 Europe/Warsaw · **Recipient:** A50, with A60 independent QA / A00 owner.  
**C01 PR60 source exactly `fa3261b2c9510e110ac9eba21726812d3401a525`**, draft, no merge. **This is a FUTURE procedure**, not executable approval; **G0–G5 HOLD**.

## What is already proven, what is not

- A50 owner Windows 11 R23E-R2 native DB-free **426/426 PASS 0 FAIL/0 SKIP**, 36/36 logs/exit 0, Node22.23.3, pnpm10.34.7, BuildTypes and API Typecheck exit 0. A60 independently attested `DBFREE_QA_ACCEPTED`. Do **not** conflate with PG acceptance.
- Old GitHub Actions run `38736073793`, job `116425579970`, API Integration returned exit 1. First genuine failing TAP named case/exception is still **UNKNOWN**; previous last visible TAP entries are passing. No invented source diagnosis.
- Owner Drive preflight shows Docker engine 29.8.2 Linux, no active-context resources and Windows native PostgreSQL 16 **running ::1/127.0.0.1:5432**. A00 granted `DOCKER_INFRASTRUCTURE_PREFLIGHT_PASS`, not PG16 start.
- Source triggers S1 `test-database.ts` blob `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6`, S2 `replit-schema-catalog-reconciliation.integration.test.ts` blob `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4`. S2 creates/force-drops 3 DBs, requires separate `CREATEDB` consent. `run-tests.ts` blob `da4188446aba4696f97eb7831fee0cc5824d212f` recursively runs all integration fixtures.

## Mandatory receipt acceptance BEFORE running a Docker command

A50 gets **real signed phase records** A00/HQ+A20+operator with matching SHA, project/instance/PGDATA/container ID/volume and port/role/DB/schema/evidence retention. A prepared A20 Markdown does not count. G0 image pull/build requires separate GO; G1 new disposable PG instance needs separate GO; G2 read-only catalog queries need GO; G3 S1 schema **and** G3 S2 three databases need independent GO; G4 exact full API integration needs separate GO; G5 exact-ID cleanup needs separate GO. No hidden automatic advancement.

**Topology contract:** proposed no host ports, PostgreSQL `network_mode:none` with internal PG listener `127.0.0.1:55432`, Node runner `network_mode: service:pg16`. This allows test's S2 `localhost` and nondefault-port guard while preserving host `127.0.0.1:5432`. Image/runner digests, secrets and PGDATA volume names must be filled from signed actual G0/G1 evidence, never sample placeholders.

**Source contract:** new disposable exact-SHA checkout and immutable source: `git rev-parse HEAD` full `fa3261b2c9510e110ac9eba21726812d3401a525`, clean tracked tree, pnpm-lock SHA256 expected previous A50 receipt `8c30be5af6c9a868bf5b24ff3b2ced9ca0b976e66c3366a8e78d9df8229c39ef`, pinned Node22/pnpm10, frozen lock and `pnpm exec tsc -b lib/db lib/api-zod lib/stage-basket-flow` before typecheck if performed. Build/injected artifacts in new scratch only. No source changes even to fix old CI failure until actual first cause independently recorded.

**Test env:** set `NODE_ENV=test`, exact `TEST_DATABASE_URL` assembled **inside isolated runner** for approved runner role, `127.0.0.1:55432`, fresh `web005_c01_test_<nonce>` DB, `TEST_DATABASE_SCHEMA=tm_test_<nonce>`, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA` ONLY after G3-S1. No inherited `DATABASE_URL` or libpq/SCHEMA_COMPARE_ alternate DSNs; `NODE_TEST_CONTEXT` automatically from Node test runner. Test role has NO production credentials and no connection beyond shared loopback. Bootstrap superuser secret never mounted to Node runner.

**Exact G4 test only after all GO:**
```text
pnpm --filter @workspace/api-server run test:integration
# expands to: node --import tsx ./test/run-tests.ts integration
# recursively collects *.integration.test.ts, --test-concurrency=1.
```
No `skip`, `--test-name-pattern`, modifying assertions/timeouts, ignoring S2 or broadening to Pack17 --full. If G3 S2 missing, DO NOT RUN FULL SUITE. Narrow independently approved file tests are `PARTIAL_TEST_SCOPE`, not reproduction of original complete job.

## Evidence bundle — local raw vs synced redacted

**Private local raw:** exact child exit/signal, unaltered stdout/stderr, container logs (can include fixture-injected PII-like strings), G0–G5 operator certificates, original secret files in locked scratch only; never sync raw DSNs/tokens/passwords or actual user rows. **Redacted Google Drive destination:** `G:\Mój dysk\ChatGPT\WEB-005\Raporty\PG16_DOCKER_ISOLATION\C01_R23G_<UTC>_<nonce>\`; cloud folder parent ID `1aZxxG11bF4QtmQyZQpiqSdUAHtWUJi36`.

Required filenames in redacted output: `SOURCE_RECEIPT.json` (exact SHA and blob SHA), `G0_IMAGE_DIGESTS.json`, `G1_PHYSICAL_CERT_REDACTED.json`, `G2_OBSERVER_READ_ONLY.json`, `G3_S1_S2_SCOPE_APPROVALS.json`, `G4_API_STDOUT.redacted.log`, `G4_API_STDERR.redacted.log`, `G4_API_RECEIPT.json`, `DB_SCHEMA_DATABASE_FOOTPRINT_BEFORE_AFTER.json`, `SHA256SUMS.json`, `G5_ROLLBACK_CLEANUP.json`, `CLOUD_REMOTE_READBACK.json`, `A60_INDEPENDENT_QA_HANDOFF.md`. Each command log has exact UTC, redacted argv, true native exit, process signal, SHA256, test file set/TAP tests/pass/fail/skipped/todo/cancelled, **first real `not ok` or exception and stack**.

**Classification:** `INFRA_CONNECTIVITY`, `ROLE_PERMISSION`, `BOOTSTRAP_MIGRATION`, `API_TEST_ASSERTION`, `RUNTIME_CRASH`, `TAP_TRUNCATED`, `UNKNOWN`. Capturing first named fail with full evidence is valid diagnosis even if overall suite exit 1; never call fail PASS. Distinguish PostgreSQL error messages intentionally raised by negative fixtures from Node assertion failures.

**Cloud verification:** after local redacted write, verify actual Drive cloud file IDs and retrieve bytes/checksums independently. `CLOUD_STORED` only on readback; `WINDOWS_G_MIRROR_VERIFIED` only after local Windows bytes hash equal remote. If not verifiable `LOCAL_G_DRIVE_SYNC_UNVERIFIED`. A50 must not claim sync from folder icon or local mount existence alone.

**A60 independence:** review exact-source/hash and G0–G5 signatures, host/no-port proof, full test inventory including S2, first error, native exit, object cleanup and source non-modification; source correction requires separately authorized new PR and exact SHA. **C01/C02/release/SWARM006 remains HOLD** absent A00 subsequent release decision.

**A50 current action:** **none on host/DB**. Seek actual G0–G5 signatures from A00+A20+operator only after owner reviews this design. No Docker command/test is authorized by this file.

**Status:** `A50_HANDOFF_PREPARED / DOCKER_DESIGN_ONLY / PG16_EXECUTION_NOT_AUTHORIZED / C01_INTEGRATION_HOLD / C02_HOLD`.
