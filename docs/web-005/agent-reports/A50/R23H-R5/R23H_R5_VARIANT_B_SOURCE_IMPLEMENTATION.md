# WEB-005 — A50 / R23H-R5 — VARIANT B SOURCE IMPLEMENTATION

**Task:** `WEB-005-T050-R23H-R5-VARIANT-B-SOURCE-HARDENING`  
**Authorization:** A00 `R23H-R5-VARIANT-B-SOURCE-ONLY`  
**Mode:** controlled SOURCE ONLY; Docker=0, PostgreSQL=0, SQL=0, migrations=0, image builds=0, CI manually initiated=0, integration tests=0, merge/deploy=0.  
**Original immutable C01:** `fa3261b2c9510e110ac9eba21726812d3401a525` (PR #60; unchanged).  
**Source branch:** `codex/web005-a50-r23h-r5-variant-b-source-only`, created from exact C01.  
**Review-only baseline branch:** `review/web005-r23h-r5-c01-baseline` (points to exact C01).  
**Source implementation checkpoint (before this report):** `9fc28a41e582ce4107e57d8472910f68d7e64d31`; authoritative final HEAD is the Draft PR head after documentation commit. This is a **NEW SHA**, not original C01.  

**Decision:** `R23H_R5_VARIANT_B_SOURCE_CANDIDATE / PARTIAL_STATIC_VERIFIED / RUNTIME_NOT_TESTED / INDEPENDENT_QA_PENDING`. **This is not P0 security closure or PG16 GO.**

## 1. Source baseline and change ownership

A60's [R23H-R4 independent corrective QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/R23H_R4_INDEPENDENT_CORRECTIVE_QA.md) recommended Variant B after separate A00 permission; A22's [R4 SQL contract](https://github.com/C8LyNn/aplikacja-turnieje/blob/da44df0f0786fe0552c91494fb168ff8f5e238d1/docs/web-005/R23H_R4_SQL_EXECUTION_SAFETY_CONTRACT.md) identifies in-fixture unsafe `DROP DATABASE ... WITH (FORCE)` following failed `CREATE`. This source-only engineering action does not supersede A20 physical safety, A31 destructive-path review or A60 acceptance.

The changed/new files **before this report** are only:

| Path relative to repo | Change |
|---|---|
| `artifacts/api-server/test/pg16-test-ownership.ts` | NEW shared run-scoped S1/S2 guards, name/OID/current-role/schema marker checks, machine-readable safety event stderr |
| `artifacts/api-server/test/replit-schema-catalog-reconciliation.integration.test.ts` | Replace 3 catalog bare CREATE and unconditional FORCE cleanup with creation receipts, checked pool shutdown and pre-DROP attestation |
| `artifacts/api-server/test/drizzle-schema-diff.integration.test.ts` | Replace Drizzle scratch bare CREATE and unconditional FORCE cleanup with its own receipt and pre-DROP checks; retain both push --force invocations |
| `artifacts/api-server/test/test-database.ts` | Enforce `tm_test_<run_id>` and eliminate blind startup CASCADE; setup failure preserves partial state |
| `artifacts/api-server/test/migration.integration.test.ts` | Main schema reset ownership guard + helper rollback and marker_drift schema lifecycle ownership guard |
| `artifacts/api-server/test/tournament-stages-production-migration.integration.test.ts` | Guard manual S1 schema setup |
| `artifacts/api-server/test/tournament-stages-composite-foreign-keys.integration.test.ts` | Guard manual S1 schema setup |
| `artifacts/api-server/test/tournament-stages-procedural-recovery.integration.test.ts` | Guard manual S1 schema setup |
| `qa/web005/r23h-r5/guarded-g4-launcher.mjs` | NEW source-only locked admission candidate; reject foreign inherited connections, absent signatures, phase/target drift |
| `qa/web005/r23h-r5/NEGATIVE_CASE_NAMESPACE.md` | Canonical namespace for colliding A50/A24/A31 N15/N16 cases; planned negative tests, all NOT_EXECUTED |
| `docs/web-005/agent-reports/A50/R23H-R5/R23H_R5_VARIANT_B_SOURCE_IMPLEMENTATION.md` | This source/provenance/QA handoff |

**Not changed:** product/business code, frontend, games, Unity, migrations, SQL data, lockfile, Dockerfile/Compose, GitHub workflows, PR #60, protected C01, production or Replit/live. GitHub source modifications are isolated to the new branch and an unmerged Draft PR.

## 2. Security behavior / what the patch actually enforces

### R4-CODE-01 — S2 CREATE-before-DROP proof

- Both S2 fixtures create an object receipt **only after successful CREATE response and a positive pg_database OID/current-owner lookup**. If CREATE fails, times out, returns ambiguously, or the post-CREATE catalog query fails, no receipt is stored and fixture teardown refuses to issue DROP for that slot.
- Before each actual FORCE DROP, code demands a recorded same-run/same-cluster-certificate token plus current exact database name, OID and owner matching the receipt and current effective DB role. It uses `DROP DATABASE "<verified_name>" WITH (FORCE)`, not `IF EXISTS` as a substitute for proof.
- The catalog fixture handles dev/prod/fresh independently. Pool shutdown must be positively confirmed; a rejected close raises `WEB005_CLEANUP_HOLD`, not best-effort force deletion. Drizzle scratch uses independent receipt and retains both expected `push --force --verbose` child calls.
- Source-level **limitations**: catalog lookup followed by DROP is **not atomic** against a foreign concurrent writer; PG OID may be recycled; an environment-provided `clusterCertificateSha256` field is not a physically authenticated cluster identity. An **externally sealed, fresh and exclusive-writer PG16**, trusted G2 physical attestation, privileged SQL effect ledger and A31 review remain mandatory. No claim of race-free proof or P0 closure is made. If CREATE succeeds in PG but its response is lost, **orphan is kept**, not force-dropped; only an independent G5 exact-ID procedure may clean it.

### R4-CODE-02 — S1 and auxiliary schema protection

- The source-hardened S1 naming contract requires fresh `TEST_DATABASE_SCHEMA=tm_test_<32hex run_id>`, plus only `_rollback` and `_marker_drift` derived helpers. Missing run/fingerprint fails closed.
- `resetRunSchema` denies **every pre-existing main schema** (including same-run leftovers with potentially committed migration stages) instead of startup `DROP SCHEMA IF EXISTS ... CASCADE`.
- `createRunSchema` verifies absence before CREATE and records a same-run marker in PostgreSQL schema COMMENT; `dropRunSchema` checks marker, OID and matching current owner before CASCADE teardown. The helper schemas must be freshly absent; failed CREATE/marker write never triggers blind DROP.
- On failed `resetTestSchema` setup, previous best-effort cleanup was removed, preventing destruction of partially committed migration evidence. Manually resetting entrypoints now use common helper.
- **Known compatibility risk:** legacy tests and scripts that reused `tm_test_access` or depended on repeated startup reset will STOP rather than silently continue. That is intentional until a future *explicitly authorized* test review. Successful full 36-entrypoint G4 compatibility is **UNKNOWN**.

### R4-CODE-03 — observable safety events

- Shared helper writes parseable `WEB005_SAFETY_EVENT` JSON records (event name, run id, cluster-cert fingerprint, verified object name/OID/owner where known) on stderr for a **future restricted operator-side append-only capture**.
- On failed preconditions it emits `CLEANUP_HOLD` and raises the error; it does not automatically retry/re-grant/mutate unknown resources.
- **Not yet sufficient** to prove real SQL effects: stderr events are process-originated and not independently signed server audit; unexpected process death may omit events. A20/A22/A23/A31 must define a separate SQL/server event ledger, before/after S1/S2 catalog fingerprinting and special 0030/0031 migration/event handling.

### Source-only launcher candidate

- `qa/web005/r23h-r5/guarded-g4-launcher.mjs` contains pure admission helpers for inherited `DATABASE_URL`, `TEST_DATABASE_URL`, libpq `PG*`, `SCHEMA_COMPARE_*`, dotenv and loader rejection; signed-phase and target assertions, a future minimal internally derived disposable test DSN and a full-suite 36/5/2 command-scope validator.
- The entrypoint has **`SOURCE_ONLY_LOCK=true` and zero spawn, Docker or SQL implementations**, and trust roots are intentionally empty. It must **always STOP**, including with user-supplied approvals; no supplied flag can unlock it. This meets SOURCE-ONLY prohibition on executable tests, **not** production-ready launcher completion.
- Missing independent modules: A00/A20/operator Ed25519 trust-root provisioning/rotation and canonicalization acceptance, actual cryptographic signature quorum test, external atomic one-use G4 CAS ledger, signed physical observer, fresh SQL role/cert evidence, child Drizzle DSN enforcement, positive readonly/tmpfs Linux write-path audit, full native TAP process collector and secret-redaction/human cloud review. These are **PENDING**, not implemented security PASS.

## 3. Immutable source inventory / test coverage

- Exact original C01 Git tree (1,745 entries, untruncated) had **36 recursive `artifacts/api-server/test/**/*.integration.test.ts` files**. A50 R4 manifest: [exact old-file path + Git blob inventory](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web005-a50-r23h-r2-runner-publication/docs/web-005/agent-reports/A50/R23H-R4/R23H_R4_C01_36_INTEGRATION_ENTRYPOINTS.json).
- After the source patch Git tree was re-read **statically**; there are still **36 filenames**, with two modified S2 fixture blobs and four S1 manual suite blobs, no skipped/deleted integration entrypoints.
- Test command remains `pnpm --filter @workspace/api-server run test:integration`, run-tests/test-discovery unaffected; Drizzle still has two force calls. **Zero integration tests executed**, so there are **no TAP PASS, exit code or root-cause findings for this new B SHA**.
- Source-hardened B is **not** valid reproduction at the old C01 `fa3261...`; its scope must be re-approved under new source SHA and new locked manifest/OCI digest.

## 4. Negative matrix and static controls

[Namespaced case catalog](../../../../qa/web005/r23h-r5/NEGATIVE_CASE_NAMESPACE.md) covers: A50-R4-N15 catalog name collision; A50-R4-N16 lost/failed CREATE; A31-R4-N15 unkillable FORCE sessions; A31-R4-N16 inherited production DSN; A24-R4-N16 foreign Drizzle target; new S1 partial-migration, wrong marker, S2 OID/owner/replay, physical cluster, trust roots, tmpfs and redaction scenarios. **Every case is DESIGNED / NOT_EXECUTED**.

**Static evidence already observed (source-only, not executable tests):**
1. Compare original C01 to isolated branch: no behind commits; only fixture test files, one fixture helper, and `qa/web005/r23h-r5`.
2. Bare `DROP DATABASE IF EXISTS` removed from the two original S2 fixture teardown sites; positive receipts and source guards inserted.
3. No startup unguarded `DROP SCHEMA IF EXISTS` remains in modified reset/helper files; auxiliary marker/rollback test paths use common owned helper.
4. Guarded launcher is intentionally locked and contains **no subprocess execution primitive**; untrusted parent variables are rejected.
5. Entry point count remains exactly 36; original fixture test discovery and Drizzle force calls remain unchanged.
6. Static controls are **not** TypeScript typecheck, AST parse, unit tests, G0 nor security acceptance. Those all remain **NOT_EXECUTED / PENDING**.

## 5. Risk matrix for independent owners

| Review owner | Required next step | State |
|---|---|---|
| **A22 SQL** | Check positive CREATE→OID/owner→PRE-DROP invariants, OID reuse/TOCTOU and exact SQL side effects; S1 marker/CASCADE, migration 0029 vs special 0030/0031; Drizzle two push effects | PENDING |
| **A31 PG16 security** | Review effective CREATEDB cluster-wide principal, ownership/member/SET ROLE and exclusive-writer assumption, environment-provided cert spoofability, schema COMMENT marker attack, edge cases of failed CREATE and partial cleanup | PENDING |
| **A30 coordination** | Reconcile P0-31-01..07; source controls do not close an operational P0, no G0 go/no-go authority delegated | PENDING |
| **A23 evidence** | Verify old/new exact SHA and Git tree/file provenance, error-state event reliability and stderr/SQL ledger custody, source/manifest hashes | PENDING |
| **A60 independent QA** | Code review and eventual separately approved synthetic negative unit/TS checks; 36 entrypoints completeness, no merged/changed production code, full scope and STOP matrix | PENDING |
| **A20 coordination / A24 readiness** | Authoritatively decide final role/privileges, source B run plan and physical cert, nonroot/rootfs-RO/tmpfs paths and G0–G5 trust chain | PENDING |
| **A00/HQ + operator** | New source SHA-based signed G0 and later independent G1–G5 approvals only after independent source QA; **none granted** | HOLD |

## 6. Failure behavior and deferred runtime proof

**Missing runtime proofs:** compiler/AST parse; unit negative controls; exact node 22/pnpm 10 and Linux module compatibility; early exit without DB/socket on forged env/signature; immutable image/lock/cert/namespace identity; real OID/owner observation; exclusive PG writer; S1 helper schema collision; catalog+Drizzle true force-drop and SQL DDL; Drizzle push/no-op uncertainty; installed `drizzle-kit 0.31.10` binary; 36-entrypoint execution/TAP/first failure; SQL/server audit; immutable secret scrubbing and Google Drive readback; G5 exact-resource cleanup.

**Refusal states:** `WEB005_CLEANUP_HOLD`, `STOP_INHERITED_ENV`, `STOP_TRUST_ROOTS_UNPROVISIONED`, `STOP_SOURCE_ONLY_NO_G4_AUTHORIZATION`, `STOP_EXECUTION_PLAN_DRIFT`. On ambiguous created object, do not force DROP or broaden permissions; preserve evidence and request separately signed resource-specific G5. New PR does not imply an approval.

**Current operational status:** `P0_OPEN_7 / PG16_EXECUTION_HOLD / G0_NO_GO / G1_G5_HOLD / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO / SWARM006_HOLD`.

**Final source-only recommendation:** request A22+A31+A30+A23+A60 independent review of this NEW SHA, then source-only corrective iterations and separately authorized static compiler/synthetic negative evaluation. Do NOT execute the launcher, Docker, PostgreSQL, SQL/migrations, CI or test suites merely to complete this PR.


## 7. Post-A22 issue #88 corrective delta (append-only; source-only)

A22 independently reviewed **earlier** code checkpoint `3517658652a01c133ab1bf8c790128ec62d14bd6` and reported six must-fix P0 items in [Issue #88](https://github.com/C8LyNn/aplikacja-turnieje/issues/88). Its verdict **`B_SOURCE_NOT_APPROVED` remains valid for that SHA**; the newer branch needs new independent review.

Changes made AFTER the reviewed checkpoint:
1. **S1:** in-memory `createdSchemaReceipts` now captures positive CREATE+COMMENT+OID/owner/marker observation before any DROP; existing main/helper schemas STOP. Still no external signed/durable creation receipt or full CASCADE dependency audit.
2. **S2:** `S2_CREATE_ATTEMPTED`, failed/ambiguous CREATE and `CLEANUP_HOLD` explicitly logged. Catalog denies all hook DROPs if any attempted CREATE lacks receipt; Drizzle likewise. Potential orphans preserved for separately signed G5.
3. **S2 physical:** name/OID/owner/current principal and run-cert fingerprint checked; signed real cluster system ID and exclusive-writer/TOCTOU defense still **PENDING**. OID alone is not unforgeable authority.
4. **S2 child DSNs:** comparator and Drizzle no longer spread `process.env`; `sealedFixtureChildEnv()` limits child variables to an explicit allowlist and owned scratch DBs at `127.0.0.1:55432`. Actual Drizzle 0.31.10 SQL effects and two `--force` invocations remain **UNKNOWN**.
5. **S1/DB grants:** runtime launcher is intentionally locked; effective base DB, server catalog permissions and cluster-wide CREATEDB are NOT verified. Migration 0029 exists but is not included in the reviewed normal 0001–0028 S1 reset nor S2-Drizzle 0001–0020, S2-catalog 0001–0011; special 0030/0031 need independent mapping.

**20/20 current textual source/changed-path checks satisfied**. This is static string-based validation only, **NOT compiler/AST/runtime/negative unit/API test PASS**. N15/N16 namespaced cases remain DESIGN ONLY. All six A22 issues require fresh A22+A31+A30+A23+A60 review; no P0 operational closure or G0 authorization.

**Outstanding review blockers:** durable external SQL and owner/OID receipts; cross-schema CASCADE dependents; signed physical cert and exclusive writer; atomic single-use phase/approvals; actual installed Drizzle binary/effects; private raw event custody and secure cloud redaction; source-compatibility TS and 36-file integration still NOT_EXECUTED.

**Updated status:** `R23H_R5_VARIANT_B_SOURCE_PATCH_READY_FOR_INDEPENDENT_REVIEW / STATIC_20_OF_20 / B_SOURCE_NOT_APPROVED / G0_NO_GO / RUNTIME_NOT_EXECUTED`. The canonical new exact SHA is the Draft PR #89 HEAD, as this report cannot safely include its own containing commit SHA.
