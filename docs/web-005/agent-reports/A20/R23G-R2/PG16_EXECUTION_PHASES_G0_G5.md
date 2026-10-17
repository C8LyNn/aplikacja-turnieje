# WEB-005 — A20 / R23G-R2 — PG16_EXECUTION_PHASES_G0_G5.md

**Task:** `WEB-005-T020-A20-R23G-R2` | **Date:** 2026-10-17 Europe/Warsaw | **Mode:** read-only design / source verification | **Authorization:** G0–G5 require A00/HQ + A20 + operator; `PG16_EXECUTION_NOT_AUTHORIZED`.

## R2 AUTHORITATIVE CORRECTIONS (supersede any contradictions below)

**R2 normative PASS/FAIL/EVIDENCE extension:** G0: PASS exact C01 Git commit, frozen lock, official 16.15 image architecture-specific 64hex digest reverified via OCI registry (not third-party alone), Node22 base image digest/rebuild declaration and dependency lock, clean scratch image; FAIL candidate digest only or Node digest PENDING; evidence tag->index->amd64 manifest digest and signed remote Docker registry HTTP response, source+lock SHA, Compose parser source receipt. G1: PASS isolated Docker context, pristine named PGDATA, confirmed images, no host ports, network_mode:none/shared runner namespace, bootstrap admin isolated, Windows PG16 host PID:5432 unchanged, rollback marker; FAIL any unknown mount/credential/routes; evidence image IDs, volume/container labels, PID, network namespace, pg_control fingerprint out-of-band. G2: PASS separate read-only certified PG16 16.x catalog via observer and matched physical fingerprint, SCRAM credentials verified; FAIL test role or unrecognized endpoint; evidence DB identity, auth role and PG_MAJOR. G3-S1: PASS owner+operator+A20 signed dedicated tm_test schema and 0001–0028 pre/post object policy, lossless rollback; FAIL reuse/foreign schema. G3-S2: PASS separate signed CREATEDB only in standalone empty cluster and exact three created names/ownership/force-drop; FAIL on shared Windows PG. G4: PASS *diagnostic evidence* exact 1 native full API integration run, complete TAP+true exit and first real causal not-ok/exception or explicitly INFRA_BLOCKER; FAIL missing scope/test skip or data leak; G4 may produce nonzero exit while diagnostic evidence PASS. G5: PASS operator-authorized exact-ID cleanup and Drive redacted readback; FAIL guessed resource names or loss of evidence. A00/A20/operator must separately sign per phase, no implicit cascading GO. No actual Docker or SQL was performed. Prior G0–G5 baseline below is retained for traceability.

---

## R23G preserved historical baseline (source text for traceability)

# WEB-005 / A20 / R23G — PG16_EXECUTION_PHASES_G0_G5

**Task:** `WEB-005-T020-A20-R23G-DOCKER-PG16-ISOLATION` · **Date:** 2026-10-17 Europe/Warsaw · **Scope:** future procedure, DOCUMENTATION ONLY.  
**Every state change requires a new phase-specific written agreement by A00/HQ, A20 and Windows operator.** Source: C01 PR60 exact `fa3261b2c9510e110ac9eba21726812d3401a525`. **Current `G0–G5 = NOT_AUTHORIZED`; no commands executed.**

## Barrier state machine

```text
DOCKER_INFRASTRUCTURE_PREFLIGHT_PASS  (already observed, documentary only)
       |
G0 SOURCE / IMAGE REVIEW, HASH + DIGEST RESERVATION [triple GO before pull/build]
       |
G1 NEW CONTAINER + NEW VOLUME + BOOTSTRAP ROLE/DB [triple GO before create/start]
       |
G2 INDEPENDENT READ-ONLY IDENTITY ATTESTATION [triple GO before database SELECT]
       |
G3 TWO INDEPENDENT DESTRUCTIVE CONSENTS: S1 schema AND S2 three DBs [triple GO for each]
       |
G4 ONE EXACT FULL API INTEGRATION RUN + evidence capture [triple GO before run]
       |
G5 SCOPED CLEANUP / RESTORE OF OWNED OBJECTS ONLY [triple GO before delete]
       |
A60 INDEPENDENT QA -> A00 release policy later. C02/RELEASE remain HOLD.
```

No phase is automatically authorized by a previous phase PASS. A denial or changed source/cluster ID returns to HOLD with no guessed remedial command. **A00 A20 operator are distinct approval authorities; a prepared A20 document is not A20's future execution signature.**

## G0 — offline source and runner-image provenance

**Proposed actions after G0 GO:** pin full exact Git commit C01 and every used test/source Git blob; verify `pnpm-lock.yaml` SHA256 `8c30be5af6c9a868bf5b24ff3b2ced9ca0b976e66c3366a8e78d9df8229c39ef` from A50/A60 prior receipt, clean disposable checkout; inspect Docker context, OS/arch, registries, image size and immutable `postgres:16@sha256:<digest>` and `Node22 runner @sha256:<digest>` manifests (and their architecture-specific digest); review exact build of runner with pinned Node22/pnpm10 and frozen lock in scratch only. No game code edits, no `latest` tag, no GitHub paid CI. **Any docker pull/image build** is separately authorized by all three, not this file.

**PASS:** exact SHA, full tree/lock/test-list fingerprints, zero tracked source drift; Docker Desktop/WSL2 actually rechecked, no unexpected preexisting objects; proposed image digests/registry trusted. **FAIL:** unpinned/mismatched image/SHA, side-effecting build, wrong Docker context, image with undisclosed mount/entrypoint, insufficient Docker VM disk. Owner record: `G0_SOURCE_IMAGE_GO`, image digests, expiry.

## G1 — physically isolated cluster provisioning

**After independent G1 GO:** owner/operator uniquely names Compose project, newly created labelled PGDATA volume and a single PG16 container. Prove **no host-published ports**, `network_mode:none`, internal `127.0.0.1:55432`, no mounted Windows data, no docker.sock in app runner, no production network. Use secrets mounted as protected files and a one-time *operator-only* privilege bootstrap to create non-superuser DB test role and one brand-new test DB. Keep admin secret away from A50; no test starts. Capture Docker engine/context, exact container ID, immutable volume ID, process PID and Linux namespace, PGDATA filesystem ID, independently obtained PostgreSQL cluster system ID and isolated listener. Do not touch Windows `postgresql-x64-16` (port 5432). Record empty-cluster baseline snapshot and rollback/disposal inventory.

**PASS:** owned new resources, empty scratch data only, exact PG16 image and localhost socket/55432 **inside** isolated namespace, no host 55432/5432 binding added, dedicated role and base DB, valid snapshot. **FAIL:** any preexisting data, identity mismatch, unexpected port/volume/route, privileges too wide, Windows service changed, no baseline. Output `G1_PHYSICAL_CERT` + independent operator observation, no secrets.

## G2 — read-only physical/SQL cross-check (separate consent)

**After separate G2 triple GO:** A20-nominated observer role may run the exact previously audited **catalog SELECT-only** queries *on the new disposable test DB exclusively*. Verify PostgreSQL 16, effective DB, target grants, schema, extension list, no unexpected objects/data, compare server evidence with operator independent `G1` container/PGDATA identity. Observer has CONNECT and limited catalog reading; cannot CREATE/ALTER/DROP, no CREATEDB, no admin/production access. After cleanup, credentials expire. No `pg_control_system()` privilege escalation just to prove instance.

**PASS:** read-only command success and exact physical cross-match, least privilege independently checked. **FAIL:** inconsistent endpoint/port, login privilege excessive, wrong DB/schema, unknown SQL ledger, need for unapproved extension. Output redacted `G2_CATALOG_IDENTITY_RECEIPT` with command/exit SHA; this is NOT application QA.

## G3 — two independently signed mutation scopes

**S1:** explicit `G3_S1_GO` for `tm_test_<nonce>` within newly owned base test DB; code `test-database.ts` executes `DROP SCHEMA IF EXISTS ... CASCADE`, creates schema, applies 0001–0028 and test fixture data, then drops schema. Target schema existence must be verified as newly owned/empty; no foreign data. Approval includes exact migration SHA set, test-only transformation and rollback. *S1 grants no cluster CREATEDB.*

**S2:** distinct `G3_S2_GO` allows ephemeral `CREATEDB` to dedicated test role in **empty isolated cluster** and **three** `tm_catalog_test_<16hex>_{dev,prod,fresh}` DBs created by exact original C01 fixture and removed with `DROP DATABASE WITH (FORCE)`. Names generated at runtime, log actual 16hex; all must be new and owned by the run. No prefix-based PostgreSQL ACL exists; physical cluster isolation contains risk. If S2 missing, full API test STOP; do not use `--test-name-pattern` or skip to counterfeit coverage.

**PASS:** signed S1+S2 independently, exact current cluster and resources, permissions verified. **FAIL:** incomplete permissions, existing target objects, orphan DBs, uncertain role ownership, source or fixture scope change. No SQL happens at this documentary phase; actual operations begin only inside separate G4 authorized tests.

## G4 — single exact diagnostic API run

**After complete G0–G3 plus distinct G4 triple signature:** A50 invokes exactly `pnpm --filter @workspace/api-server run test:integration` in pinned isolated Node22/pnpm10 runner, with `NODE_ENV=test`, `TEST_DATABASE_URL` assembled privately for `127.0.0.1:55432`, approved base DB, `TEST_DATABASE_SCHEMA=tm_test_<nonce>`, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`; parent `DATABASE_URL` unset. Process executes recursively discovered full `*.integration.test.ts`, Node `--test-concurrency=1`. No source/test edits, no hidden skips, no reuse of CI runner or Windows PG16.

Record UTC times, exact command/exit/signal, *complete raw local* stdout and stderr, sanitized Drive copies with SHA256, first genuine `not ok` or uncaught exception and test case+stack, TAP six counters, infra vs migration vs API attribution, intended fixture writes and actual DB/resource identity. If TAP incomplete or no first error, label `FIRST_FAILURE_UNRESOLVED`, not fake root cause. No automatic retry or Pack17 --full (separate GO). Tests can intentionally raise PostgreSQL errors; don't infer failing Node assertion from DB server error alone.

**PASS for diagnostic purpose:** full unmodified test inventory executed on attested PG16, first causal result and true exit preserved, log hashes and DB footprint recorded; test suite itself may **FAIL**, which is successful *diagnosis*, not `API_PASS`. **FAIL gate:** wrong target, missing S1/S2, truncated evidence, secrets leaked, unexpected write. Output `G4_A50_INTEGRATION_RECEIPT`. A60 independently validates before root-cause acceptance.

## G5 — evidence retention and exact-object cleanup

**After separate G5 triple GO:** stop test runner, preserve operator-restricted raw and cloud-redacted evidence, hash manifests and remote Drive readback; then release only specifically owned schema/DB/container/volume from G1 manifest. Verify no foreign DBs/schemas, independent volume ID and no changes to Windows PG service. If any identity or data uncertainty, STOP `CLEANUP_HOLD` and hand back to operator (do NOT use `docker system prune`, `docker volume prune`, `down -v` against ambiguous project, `DROP DATABASE` on guessed names). Preserve snapshots until A60+owner retention decision. Cleanup failure must be logged, not masked.

**PASS:** exact owned resources gone (or properly retained under signed hold), no foreign change, sanitized Drive receipt remote readback and local mirror comparison if available; operator signs final footprint. **FAIL:** leftovers, missing evidence, unexpected stop, mismatched IDs. A00 may still keep C01 integration hold after G5; **C02 and SWARM006 never auto-open**.

## Per-phase evidence schema

```yaml
task: WEB-005-T020-A20-R23G-DOCKER-PG16-ISOLATION
phase: G0 | G1 | G2 | G3_S1 | G3_S2 | G4 | G5
approval_triple:
  a00_url: null
  a20_url: null
  operator_url: null
approved_source_sha: fa3261b2c9510e110ac9eba21726812d3401a525
physical_certificate_sha256: null
actual_container_volume_db_schema_ids: null
exact_argv_redacted: null
started_utc: null
ended_utc: null
true_exit_code: null
stdout_redacted_sha256: null
stderr_redacted_sha256: null
drive_file_id_and_verified_remote_sha256: null
local_drive_mirror_sync_status: UNVERIFIED
phase_result: NOT_EXECUTED
```

**Current verdict:** `G0_G5_DESIGN_COMPLETE / ALL_RUNTIME_PHASES_HOLD / PG16_EXECUTION_NOT_AUTHORIZED`.
