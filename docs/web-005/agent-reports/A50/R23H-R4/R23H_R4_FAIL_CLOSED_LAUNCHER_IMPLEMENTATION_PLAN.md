# WEB-005 — A50 / R23H-R4 — FAIL-CLOSED LAUNCHER IMPLEMENTATION PLAN

**Task:** `WEB-005-T050-R23H-R4-LAUNCHER-PREPARATION`  
**Owner:** A50 — Isolated Test Execution & QA Infrastructure; coordination A20; oversight A00  
**Date:** 2026-10-18 · **Mode:** SOURCE-ONLY ENGINEERING PREPARATION / NO INFRASTRUCTURE EXECUTION  
**Immutable C01:** `fa3261b2c9510e110ac9eba21726812d3401a525` · PR #60 · DO NOT MODIFY  
**Disposition:** `SOURCE_PREPARATION_READY` (**plan only, not executable safety certification**); `P0_OPEN_7 / G0_NO_GO / G1_G5_HOLD / PG16_EXECUTION_HOLD / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO / SWARM006_HOLD`.

> **Non-negotiable SQL-01:** Unmodified C01 fixtures can call `DROP DATABASE ... WITH (FORCE)` in `after()` after a failed `CREATE`, based on a stored generated name, with no causal CREATE-success/OID/ownership receipt. A process launcher cannot guarantee prevention of an already reachable in-process DROP. It is prohibited to claim that preflight, regex, nonce, physical isolation or logging *fixes* this source defect. Source-hardening is the preferred path and creates a NEW SHA; unchanged C01 is an exceptional, explicitly accepted residual-risk path only within a provably entirely disposable physical cluster.

## 1. Verified sources, source-derived facts, and unresolved decisions

- **A22 R4 SQL contract**, immutable publication [`da44df0...`](https://github.com/C8LyNn/aplikacja-turnieje/blob/da44df0f0786fe0552c91494fb168ff8f5e238d1/docs/web-005/R23H_R4_SQL_EXECUTION_SAFETY_CONTRACT.md), Git blob `086bee241bc2046d15ca291d02eb008b192d0320`; safety/fixture analysis authoritative for SQL boundaries. Distinguishes two choices, `R4-CODE-01/02/03` from launcher-only controls.
- **A30 R4 security closure plan** [`16ec9af...`](https://github.com/C8LyNn/aplikacja-turnieje/blob/16ec9af0e907c4316d57b568c5a747c8353e14b9/docs/web-005/agent-reports/A30/R23H_R4_SECURITY_P0_CLOSURE_PLAN.md): `SECURITY_BLOCKED`, seven P0 remain OPEN, A31 R4 review DISPATCHED and response pending at source review.
- **A60 R3 independent verdict** [`1f529b...`](https://github.com/C8LyNn/aplikacja-turnieje/blob/1f529b80cdc9c0e3d8bf48812365be037e0a851f/docs/web-005/agent-reports/A60/R23H_R3_FINAL_QA_VERDICT.md): `BLOCKED`, no G0 or subsequent phase authorized, DB-free 426/426 historical separate result not PG16 proof.
- **Exact C01 tree** [`GitHub Git tree API`](https://api.github.com/repos/C8LyNn/aplikacja-turnieje/git/trees/fa3261b2c9510e110ac9eba21726812d3401a525?recursive=1): `truncated=false`, 1,745 entries; **36** `artifacts/api-server/test/**/*.integration.test.ts` file entrypoints, each filename and Git blob below; this is **SOURCE INVENTORY only, not 36 test PASS**.
- C01 test discoverer `test-discovery.ts` blob `dd427fdafa92c089e2edad704079d81945c4b1c1` recursively enumerates files. `run-tests.ts` blob `da4188446aba4696f97eb7831fee0cc5824d212f` spawns `node --import tsx --test --test-concurrency=1 <all discovered files>` and inherits stdout/stderr. Root G4 command exactly `pnpm --filter @workspace/api-server run test:integration`; no test-name filters or retries.
- C01 S1 `test-database.ts` blob `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6`; S2 catalog 3 DBs blob `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4`; S2 Drizzle 1 DB blob `e008dbd9fe287632252d3fcfda246f60e4cc35d3`; Drizzle config blob `952a37a5ea123a0948cdaea68be0ee4986828fa9`; `pnpm-lock.yaml` Git blob `97ceb41938b53e8fc98f788ac1aa0c625761a2f2` (Git SHA-1, not SHA256). Historical lockfile raw SHA256 to recheck at G0: `8c30be5af6c9a868bf5b24ff3b2ced9ca0b976e66c3366a8e78d9df8229c39ef`.
- **Unresolved external contracts:** A20 owner-frozen canonical Option-A runplan and action-scope signatures, A31 R4 specialist PG safety opinion, A24 updated readiness/signed physical certificate, A60 independent acceptance, operator identity and signatures. These are dependencies, **not evidence supplied here**.

## 2. Architectures: two mutually exclusive source contracts

| Track | Scope and purpose | What launcher can guarantee | What it CANNOT guarantee | Governance |
|---|---|---|---|---|
| **U — UNCHANGED C01** | Exact `fa3261b2c9510e110ac9eba21726812d3401a525`; one original CI-reproduction attempt | Only *before-fork admission* plus external physical containment: source/lock/version/signatures, fresh empty cluster, no host route, immutable tests, bounded process+logs | Prevent source `after()` FORCE DROP after failed CREATE; prevent S1 nontransactional CASCADE/COMMIT sequence after fork; atomically bind DB OID to internal DROP | **NO_GO by default**. Only A00/HQ+A20+operator explicit *residual risk acceptance*, A30/A31/A60 review, new plan SHA, fully disposable cluster; never market as inherently fail-closed teardown. |
| **H — SOURCE-HARDENED (preferred)** | Fix unsafe hooks in isolated PR, generate **NEW exact source SHA**, re-run source-security-QA and re-sign plan | Per-create receipt, owner/OID/cluster checks before any DROP, fail closed on failed CREATE and foreign object; plus same external launcher controls | Network/control-plane isolation without external host attestor; possible races if foreign DB writers remain | Needs distinct code authorization; isolated branch, new PR, new SHA/lock & test manifest, A22/A31/A60 acceptance. **Cannot claim to reproduce unchanged C01 CI at old SHA**. |

**Decision required from A20/A00 before implementation:** select U with explicit defect exception or H with separately authorized fixture PR. **A50 cannot choose by itself.** Until then, implement **only independent admission/documentation modules**, no dormant alternate SQL execution bypass.

## 3. Proposed module/file architecture — NOT YET CREATED AS EXECUTABLE CODE

All paths below are **proposals for a future isolated review branch**, not changes to the protected repository. Prefer an inert, hermetic, independently tested package `qa/web005/r23h-r4/` with no Docker/SQL side effects merely from module import.

| Proposed file/module | Responsibility; fail-closed contract | Review owner |
|---|---|---|
| `policy/contract.schema.json` + `policy/trust_roots.json` | Fixed phase/action/runplan schema; **embedded, pinned trust anchor keys**, revocation/expiry and allowed role identities; schema not authority by itself | A00/A20/A30/A31 |
| `lib/canonical-approval.mjs` | Verify detached Ed25519 signatures over canonical signed bytes (e.g. RFC 8785 JCS), **3 different pinned issuer identities** A00/HQ, A20, named operator; phase, resource, action, expiry, nonce, signer-key policy and replay counter | A30/A31/A60 |
| `lib/source-attest.mjs` | Exact Git HEAD/tree+clean checkout/allowlisted generated outputs, immutable complete 36 entrypoint list and test discovery blob; full bytes SHA256 of lock and pinned critical source/Drizzle binary; deny tampering | A23/A24/A60 |
| `lib/plan-admission.mjs` | Match signed normalized Compose/runplan SHA, G0/G1/G2/G3_S1/G3_S2_CATALOG/G3_S2_DRIZZLE_FORCE/G4 single-run chain; pending/mismatch/expiry/replay ⇒ deny | A20/A24 |
| `lib/physical-cert.mjs` | Consume separately signed **out-of-band** physical certificate: Docker engine/context, container image digest/actual ID/PID/netns inode, PGDATA volume/system_identifier, Windows native 5432 baseline, no host routes/ports; match current signed attested renewal before fork | A20/A21/A24/A31 |
| `lib/env-seal.mjs` | Explicit allowlist from empty object (no `...process.env`); reject inherited DSNs/env loaders; create private test DSN only *after* cert; permit reviewed S1 alias and test-derived child exceptions in pinned fixture | A20/A31 |
| `lib/privilege-fs.mjs` | Verify signed effective UID/GID, RO rootfs+workspace, narrow tmpfs owned by runner, no Docker socket/host/PGDATA/admin-secret mounts, bounded caches/FDs and resource budget; no automatic chmod/fallback | A24/A31 |
| `lib/command-seal.mjs` | Pin argv/cwd/executable and actual Node22/pnpm10/tsx/Drizzle binary; one G4 invocation, no shell, no args override/skip/retry, one-use external atomic execution token | A00/A20/A24 |
| `lib/tap-evidence.mjs` | Byte-preserving private stdout/stderr, process group OS exit/signal, nested TAP first authentic `not ok`, earliest uncaught error, full test-file inventory, hash/receipt/SQL event ledger | A23/A60 |
| `lib/redact-quarantine.mjs` | Default quarantine, deterministic redaction with percent-encoded DSN/token canaries, size/PII review; **human approval mandatory** before allowlisted Drive upload and independent remote byte SHA256 | A23/A30/A60 |
| `lib/stop-receipt.mjs` | Atomic STOP code/UTC/failed gate; preserve raw evidence, no automatic destructive rollback; separate G5 exact-ID signature required | A20/A24/A60 |
| `bin/future-g4-entry.mjs` | Inert by default; rejects until **all** verified active signatures and physical cert; only then single `spawn` via fixed executable; NEVER auto-start via Compose/profile | A00/A20/A31/A60 |
| `test/unit/*.test.mjs` | **FUTURE synthetic-only** negative controls using in-memory fake signer/process/DB hooks; no PostgreSQL connections or host Docker | A31/A60 |
| `patch-plan/R4-CODE-01-03.md` | Change S2 and S1 fixtures with new SHA *only if separately authorized* | A22/A20/A31 |

### 3.1 Signature verification stronger than URLs/JSON booleans

1. Define **offline immutable trust root** with three separately controlled public verification keys, `kid`→role pinned by A00+security; public keys immutable in reviewed artifact. Verify actual Ed25519 detached signatures using pinned keys over exact canonical bytes, rejecting duplicate JSON keys, unknown fields, alg-confusion, untrusted CA/key registration, key reuse across roles, stale revocation data and clock skew. **Never** accept `approved:true`, a pasted signature URL, a GitHub username, or mutable JWK from the consent object as authority.
2. Each consent signs: immutable plan SHA256, C01 (or NEW H SHA), versioned test-manifest+lock+runner/OCI hashes (stage-appropriate), phase+exact action, host/context/PGDATA/cluster identity when it exists, S1+S2 target specs, short expiry, UUID nonce, signer identity and per-actor explicit `authorization_id`. Verify **all three signatures against matching bytes**. G0 prebuild may sign *input* base/context identifiers; do not demand impossible output runner digest prior to first approved build, but insist upon produced digest before G1.
3. Enforce a distinct owner-operated, atomic single-use **nonce ledger / CAS state machine** outside the untrusted runner; replaying the same valid G4 authorization is denied. A local JSON log alone is not a reliable one-use lock. Ledger trust, concurrency, crash recovery and signed attestor channel require A20/A30/A31 decision.
4. Independent operator-side physical observer signs current cert; runner verifies it but **does not self-attest** Docker/PGDATA based on labels/loopback strings. Cert freshness tied to specific action at G4; underlying resource identity can change between check and use (TOCTOU), so A20 must specify hold locks/renewal and permitted recheck sequence. Invalid → `STOP_PHYSICAL_ATTESTATION_MISMATCH`.
5. Approval signature authenticity proves who signed the *assertions*, **not** their truth. Operator/A24 inspection, A31 adversarial review and A60 independent acceptance remain mandatory.

### 3.2 Source, runtime, and DB admissions

- Checkout: reject HEAD != fixed SHA, dirty tracked tree, unexpected untracked executable/config files, symlinks escaping context, differing Git tree/blob hashes, modified migrations or tests, changed full inventory; compare all 36 against `R23H_R4_C01_36_INTEGRATION_ENTRYPOINTS.json`. At future G0 recompute SHA256 of raw committed `pnpm-lock.yaml` bytes and compare historical expected SHA256 above. Pin Node `v22.23.3`, pnpm `10.34.7`, `drizzle-kit 0.31.10` resolution and actual installed binary; Linux/amd64 OCI digest requires independent authenticated G0. No floating tag, no online fallback or hidden `pnpm install` at G4.
- **Deny environment before DB contact:** `DATABASE_URL`, `TEST_DATABASE_URL`, `NEON_DATABASE_URL`, `DIRECT_URL`, `PGHOST/PORT/USER/PASSWORD/PASSFILE/SERVICE/SERVICEFILE/DATABASE/OPTIONS`, arbitrary `PG*` libpq and `SCHEMA_COMPARE_*`, inherited `NODE_OPTIONS`, dotenv and npm/pnpm/Corepack config with loader/registry/token/DSN values. Strongest contract: never inherit an unreviewed parent variable; construct a minimal env from constants and independently verified typed config; read only approved private test secret. Package scripts and transitive loaders may open `.env` directly: audit positive file image manifest and reject unapproved config on disk.
- DSN: construct only inside attested runner from trusted secret, percent-encode credentials, require `127.0.0.1:55432` in shared no-network namespace, expected test role and fresh base DB, certified `tm_test_<nonce>` schema. External signed target certificate must link socket endpoint→PG `system_identifier` and PGDATA/container IDs; textual localhost/non-5432 checks never suffice. Explicit S1 `DATABASE_URL` alias only when reviewed import requires it **and byte-identical target**. Catalog child may generate own `SCHEMA_COMPARE_*` DSNs for 3 owned databases; Drizzle child may internally override `DATABASE_URL` to fourth owned database. Those child exceptions rely on exact source+binary and same cluster; **do not** replace target with arbitrary child-provided input.
- Effective C01 role truth: one shared `TEST_DATABASE_URL` principal across S1, catalog and Drizzle, with short-lived `LOGIN CREATEDB` (cluster-wide; cannot prefix-limit), `NOSUPERUSER NOCREATEROLE NOREPLICATION NOBYPASSRLS`, no dangerous memberships or admin secret; base DB CONNECT+CREATE/schema owner, new scratch DB owner. Distinct pre-signed scopes `G3_S1_SCHEMA`, `G3_S2_CATALOG`, `G3_S2_DRIZZLE_FORCE`; `CREATEDB` permitted only in an independently verified completely empty disposable cluster. Revoking CREATEDB later does **not** revoke DB ownership.
- Five contexts: one operator-provisioned base DB S1 (`web005_c01_test_<nonce>` **plan name, not C01 code invariant**); three catalog `tm_catalog_test_<16hex>_{dev,prod,fresh}`; one Drizzle `tm_drizzle_schema_test_<32hex>`; PG templates/maintenance DB separate. S1 includes `tm_test_<nonce>`, helpers `<schema>_rollback` and `<schema>_marker_drift`, migrations 0001–0028 plus specific 0030/0031 and direct DDL cases. Drizzle replays 0001–0020, two calls to `drizzle-kit push --force --verbose` with `cwd=lib/db`; the installed binary and actual DDL are **PENDING**, not presumed no-op.

## 4. Filesystem/write-path census — exact status, no pretend runtime closure

**Evidence limit:** static C01 runner/test discovery, S1/S2 fixtures, package scripts, A22 SQL R4 were read. The manifest pins **36 entrypoint filenames and Git blobs**, but the entire transitive dependency graph, all native module writes and the effective Linux/runtime FS were **NOT DYNAMICALLY AUDITED**. Thus `WRITE_PATH_CENSUS_STATIC_PARTIAL`, `READ_ONLY_RUNTIME_COMPATIBILITY=PENDING`; no claimed 36-file manual deep import graph review. Before G0, offline source tool should generate per-entrypoint import+fs/process-call graph, and A60 inspect unresolved dynamic import/eval/exec. At approved G0/G4 measure actual writes only in separately approved disposable environment.

| Actor and path | G0 build effect vs G4 runtime | Proposed destination/policy | Proof required; status |
|---|---|---|---|
| pnpm install, lifecycle scripts, Corepack/npm | G0 image layers+build caches; root `preinstall` may `rm -f package-lock.json yarn.lock` | Strict disposable positive-allowlisted build context only; pnpm frozen lock, package SHA512, SBOM; no install or remote downloads G4 | G0 lock+context signatures **PENDING** |
| `tsc -b` / TS declarations, `.tsbuildinfo`, `lib/*/dist` | Build-only G0 | Prebuilt immutable `/workspace` RO at G4; no runtime tsc | Source BuildTypes sequencing known; actual Linux outputs **PENDING** |
| Node/`tsx` import loader, ESM, V8/OS temp, subprocess IPC | G4 may read modules and write caches/tmp/socket | `HOME=/tmp/web005/home`, `TMPDIR=/tmp/web005/tmp`, `XDG_CACHE_HOME=/tmp/web005/cache`, `XDG_DATA_HOME=/tmp/web005/data` in fresh bounded tmpfs; no writable `/workspace` | Full transitive and symlink audit **PENDING** |
| pnpm runtime shims, `node_modules/.cache`, pnpm store | G4 CLI should reuse installed pinned executable, but may create logs/cache | Pin direct CLI binary, `PNPM_HOME`/cache only if needed to approved tmpfs; deny writes to `node_modules` | Image binary integrity/read-only check **PENDING** |
| Drizzle `bin.cjs`, config, generated process outputs | G4 twice `push --force` and `export`; binary/process may use HOME/XDG/tmp/workspace | `cwd=/workspace/lib/db` RO; child `DATABASE_URL` internally target-bound; cache and temp only signed tmpfs; no `--force` command substitution | Effective generated SQL and FS paths **PENDING A22/A31** |
| `execFile` comparator `compare-replit-schema-catalogs.mjs` | G4 child reads scratch DB URLs, may emit logs | Child source immutable, no user env forwarding except reviewed local scratch fields; stdout/stderr private raw | Child env/IO proof **PENDING** |
| test fixtures `writeFile`, migration readers, generated assets, report outputs | G4 direct+indirect test writes possible | Source RO, unknown writes ⇒ STOP; new per-run private scratch only; no host binds | Per-file import+write graph **PENDING** |
| `/run/secrets/pg_test_password`, PG admin password | G4 secret reads; no output | Test secret only in runner, read-only; admin secret never in runner; no cloud path | ACL/signature secret delivery **PENDING** |
| `/tmp`, `/dev/shm`, `/run`, `/var/tmp`, `/home/node`, XDG paths | G4 Node/kernel/IPC/libc | Deny anything outside reviewed bounded tmpfs; nonroot uid, `read_only:true`, cap-drop ALL, no-new-privileges, seccomp. `/tmp` size 128MiB **unproven**; owner decides max byte+inode limits | Effective mounts/UID and capacity **PENDING** |
| `/workspace`, `/workspace/node_modules`, user data/G Drive/Windows C: | G4 forbidden writes/mounts | RO image content only; no PGDATA, Docker socket, host project or cloud credential bind | Negative mount/write checks **PENDING** |
| PostgreSQL S1/S2 data, indexes, schemas, WAL | G1/G4 DB writes, **NOT Node local FS writes** | Fresh named PostgreSQL data volume inside physically certified isolated PG container; no shared/native Windows 5432 | SQL events and ownership certification **PENDING** |
| evidence raw stdout/stderr/TAP | G4 stdout/stderr stream capture by privileged *operator-side collector*, never runner cloud mount | Append-only private non-synced ACL-restricted artifact store, local SHA256; sanitized copy via review only | Collector disk-full behavior/truncation **PENDING** |
| Windows host logs, Docker image caches | Future approved operator infrastructure only | Owned exact labelled resources, no broad prune or unrelated deletion | Operator baseline and G5 scope **PENDING** |

**Write closure rule:** unknown path, symlink traversal, inaccessible nonroot tmpfs or inadequate size ⇒ `STOP_RUNNER_FILESYSTEM_WRITES`, do not silently switch `read_only:false`, add writable host mounts, run root or blanket chmod. Linux/Windows path/case/permissions/ABI divergence remains a test risk, **not** an observed defect.

## 5. Proposed pre-fork admission state machine (pseudocode only)

```text
STATE := HOLD; approval_enabled := false; test_runs := 0
L0 verify immutable trusted keys / external signature+revocation policy
L1 verify 3 distinct actual approver signatures per phase+exact action
L2 verify atomic one-use phase/nonce ledger, no previously executed G4
L3 verify exact C01 SHA (or new source-hardened SHA), Git tree, clean working tree
L4 verify lock raw SHA256, 36-entrypoint manifest, all source+installed binary hashes
L5 verify Node22/pnpm10 and signed image output digest where phase requires it
L6 verify signed Docker context/Option A no-port netns+PGDATA system ID cert
L7 verify Windows native 5432 unchanged through trusted operator attestation
L8 verify role grants + S1 fresh owned schema/aux schemas, 3 catalog + 1 Drizzle scope
L9 verify distinct S1/CATALOG/DRIZZLE-FORCE and G4 signed grants (G3 not G5)
L10 reject inherited DSNs, `PG*`, SCHEMA_COMPARE_*, dotenv and loader inputs
L11 construct only certified test DSN inside runner, pin child exceptions
L12 verify nonroot/rootfs-RO/tmpfs/cache/write paths, no host mounts/socket
L13 seal exact argv/cwd/env, operator private raw logs/capacity; no auto retry
L14 confirm external physical identity current, CAS claim one G4 execution token
STATE := G4_READY (only if every precondition true AND owner-issued GO)
spawn pinned executable + argv once, direct pipes, native exit/signal recorded
capture full stdout+stderr, nested TAP first `not ok`/earliest true exception
finalise event ledger; status DIAGNOSTIC_CAPTURED != API_PASS
quarantine+sanitize; human review; remote Drive exact bytes+SHA256 readback
G5_cleanup: ALWAYS separate distinct triple GO + exact owned object cert
```

No `docker pull/build/run`, `pg_*`, Drizzle push, SQL or shell commands are included as operative code here. Module imports must never trigger side effects; no startup without explicit signed G4 context and operator action. **Actual verification/test code is PENDING separate approval.**

## 6. First-error, stdout/stderr, SQL event evidence custody

- **Command:** literal `pnpm --filter @workspace/api-server run test:integration`, executed through immutable Node22+pnpm CLI only after signed G4; `run-tests.ts` child has `--test-concurrency=1`. `--test-name-pattern`, filtered files, automatic retries, independent Pack17 full, Drizzle direct CLI beyond fixture => STOP.
- **Native result:** collector records OS child/process group IDs, process start/end UTC, exact redacted executable path+argv+cwd, **true `waitpid` exit/signal**, pipeline-free separate byte-faithful stdout and stderr, file byte lengths+SHA256 and truncation markers; run completion requires exited child tree and drained pipes. Parent exit of a launcher is not sufficient proof of all child cleanup unless additional process tracking exists.
- **TAP first error:** parse Node TAP v13 including nested `# Subtest`, `not ok N - name`, YAML diagnostic block and source stack; record original raw stream byte offset/line and first failing assertion. If nonzero exit with no `not ok`, classify earliest runtime exception / signal / setup error, **UNKNOWN if incomplete**. Deliberate negative PostgreSQL test logs and `ERROR:` strings are not automatically the failing assertion. 36 entrypoints ≠ number of assertions.
- **Database event ledger:** one operator-created S1 base + **four successful CREATE events** expected for two S2 fixture groups, exact runtime names, OIDs/owners/cluster ID, attempts and success/fail distinction; catalog 3 FORCE DROP internal G4, Drizzle 1 FORCE DROP internal G4; **two Drizzle pushes** distinct stdout/SQL effects and pin `drizzle-kit 0.31.10`. S1 includes reset/aux schemas/migrations 0001–0028 and special 0030/0031; no fake `ALL_EFFECTS_SAFE` without server trace. Process-local observed SQL alone cannot provide a race-free stop for unchanged C01.
- **Receipts:** `SOURCE_RECEIPT.json`, `G0_IMAGE_DIGESTS.json`, `G1_PHYSICAL_CERT.json`, `G2_SCRAM_SQL_IDENTITY.json`, `G3_S1_SCOPE.json`, `G3_S2_CATALOG_SCOPE.json`, `G3_S2_DRIZZLE_FORCE_SCOPE.json`, `A50_PRE_RUN_SEAL.json`, `G4_API_RECEIPT.json`, `G4_API_STDOUT.raw` (private), `G4_API_STDERR.raw` (private), `TAP_FIRST_FAILURE.json`, `SQL_CREATE_DROP_EVENT_LEDGER.json`, `DRIZZLE_FORCE_EFFECTS.json`, `STOP_RECEIPT.json` if needed, `SHA256SUMS.json`, `CLOUD_REMOTE_READBACK.json`, `G5_EXACT_RESOURCE_CLEANUP.json` only after signed G5, `A60_HANDOFF.md`.
- **Data handling:** raw logs and DB observation receipts private/nonsynced with ACL/retention; cloud receive only allowlisted secret-redacted copies. Redact encoded DSNs/passwords, dotenv entries, `Bearer`, GitHub tokens, Drizzle `--verbose`, JWT, private keys, private fixture/user rows, Windows paths; test synthetic canaries then quarantine if undecidable. **Regex-only redaction is insufficient**; manual approval and Drive remote byte hash readback required. Separate raw vs sanitized SHA256. Windows G: sync is a separate operator proof.
- **Two independent verdict axes:** `DIAGNOSTIC_EVIDENCE_PASS/FAIL/INDETERMINATE` (genuine complete trace) versus `API_SUITE_PASS/FAIL/NOT_RUN/INDETERMINATE`. API failure with genuine first assertion can be diagnostic PASS but cannot trigger release.

## 7. Mandatory FORCE DROP review & STOP negative-test matrix (ALL PLANNED)

**No scenario was executed.** `PRE_FORK` means deny before any socket/SQL/process; `IN_PROCESS` requires source-hardened hooks or a separately reviewed SQL-enforcement layer; current unchanged C01 cannot promise the latter. The verifier/runner implementation must be subjected to *synthetic negative-only unit tests* first, and later real owner-authorized G0/G2/G4 controls if ever permitted.

| ID | Adversarial input / action | Expected enforcement / receipt | Proof status |
|---|---|---|---|
| N01 | Missing one of three signatures, wrong role key, replaced trust roots | `STOP_APPROVAL_INVALID`, zero spawn/connection | PENDING |
| N02 | Old/expired consent, wrong action/phase, changed plan hash | `STOP_APPROVAL_SCOPE`, zero spawn | PENDING |
| N03 | Valid signed bundle replay/concurrent double G4 start | Atomic nonce/one-use denial, no second fork | PENDING |
| N04 | Wrong HEAD or dirty checkout, changed migration/test, lock drift | `STOP_SOURCE_DRIFT`; no package regeneration | PENDING |
| N05 | Count 35/37, duplicate/bypassed fixture, dropped Drizzle S2, changed blob | `STOP_TEST_INVENTORY`; no filtered scope | PENDING |
| N06 | Floating Node/tag, wrong architecture, mismatch built-image digest or pnpm binary | `STOP_TOOLCHAIN_OR_IMAGE` | PENDING |
| N07 | Docker published port/bridge/host mode, Docker socket or PGDATA host bind | `STOP_TOPOLOGY_DRIFT` / `STOP_HOST_ROUTE` | PENDING |
| N08 | Switched Docker context, container, netns PID or PG system ID after G2 | `STOP_PHYSICAL_CERT` pre-fork, escalate TOCTOU | PENDING |
| N09 | Native Windows 5432 PID/service/listener changed / externally reachable target | `STOP_WINDOWS_PG_TOUCH`; no local test | PENDING |
| N10 | Inherited prod `DATABASE_URL`, `TEST_DATABASE_URL`, libpq PG* override | `STOP_INHERITED_DSN` before child creation | PENDING |
| N11 | Inherited SCHEMA_COMPARE_*, NODE_OPTIONS, dotenv loader or `.env` | `STOP_ENV_TAINT` | PENDING |
| N12 | Child-derived catalog or Drizzle DSN outside 4 owned scratch DBs | `STOP_UNEXPECTED_CHILD_TARGET` | PENDING |
| N13 | Missing/overpowered role, shared pre-existing test cluster, unknown DB owner | `STOP_ROLE_OR_CLUSTER` | PENDING |
| N14 | S1 existing foreign schema or auxiliary `tm_test_*_rollback`/`_marker_drift` collision | `STOP_UNOWNED_S1_SCHEMA` | PENDING |
| N15 | S2 name collision then failed `CREATE DATABASE` | **Unchanged C01 cannot guarantee STOP before auto FORCE DROP**; `CLEANUP_HOLD`, `P0_SOURCE_DEFECT` | SOURCE_CONFIRMED_RISK; FIX PENDING |
| N16 | CREATE returns error but name stored; `after()` still executes FORCE DROP | **H track:** guard `CREATE_CONFIRMED` and same cluster/OID/owner; U track **NO GUARANTEE** | SOURCE_CONFIRMED_RISK; FIX PENDING |
| N17 | CREATE successful but DB replaced, OID reused, third-party writer races | source guard + exclusive-cluster actor lock, else STOP; no OID-only trust | PENDING |
| N18 | Unexpected Drizzle SQL, changed `--force` binary/config/target or count != 2 | `STOP_DRIZZLE_FORCE_EFFECTS`; if already issued, preserve event evidence and incident, **not retroactive prevention** | PENDING |
| N19 | Unknown writable path, immutable workspace write, tmpfs EACCES/full | `STOP_RUNNER_FILESYSTEM_WRITES`; no writable host fallback | PENDING |
| N20 | No valid private logging, child exits by signal, truncated TAP, disk full | `STOP_EVIDENCE_GAP`; true exit/signal preserved if available | PENDING |
| N21 | Simulated encoded DSN/token survives redaction, unknown UTF-8/PII | quarantine artifact, no Drive upload | PENDING |
| N22 | Unknown cleanup ID, mismatched OID/volume/cluster or no G5 grant | `CLEANUP_HOLD`, never wildcard/drop/prune | PENDING |
| N23 | Original C01 has failure but no `not ok` due to setup or crash | Earliest real uncaught error, `DIAGNOSTIC_INDETERMINATE` if missing | PENDING |
| N24 | Runtime negative test deliberately prints PG ERROR with overall TAP PASS | **Do not** misclassify as first application failure | PENDING |

## 8. Separate source-hardening patch plan (requires NEW exact SHA)

**No fixture has been edited here.** If A00/A20 choose H and issue a narrowly scoped *separate* source-only authorization, propose these modifications in a new isolated branch (never replace current C01 SHA/PR60):

1. **`R4-CODE-01`:** `artifacts/api-server/test/replit-schema-catalog-reconciliation.integration.test.ts` and `drizzle-schema-diff.integration.test.ts`. Replace cleanup conditioned on a populated `databaseName` by stateful slot ledger: `NAME_ALLOCATED` → preflight absent → CREATE submitted → **CREATE_CONFIRMED** → actual cluster system ID, OID and owner verified → `ACTIVE` → pre-DROP current identity/lease recheck → DROP allowed → DROP confirmed. If CREATE rejected/uncertain, `CLEANUP_HOLD` and **no DROP**. No `IF EXISTS` as proof of ownership. One run-bound UUID per fixture; avoid callbacks which fire after incomplete preflight. Ensure no external role can replace DB between cert and command; otherwise explicit STOP.
2. **`R4-CODE-02`:** `test-database.ts` plus manual schema-reset test suites `migration.integration.test.ts`, `tournament-stages-production-migration.integration.test.ts`, `tournament-stages-composite-foreign-keys.integration.test.ts`, `tournament-stages-procedural-recovery.integration.test.ts`. Reject pre-existing unowned schema, its derived helper names, unexpected cross-schema dependencies and incomplete migration isolation **before** DROP; common owner/cluster certificate logic; cleanup failure not silently swallowed. Never rely on transaction rollback for CASCADE before BEGIN or post-0018 COMMIT.
3. **`R4-CODE-03`:** optional-but-required-for-strong-proof event receipts in fixture/shared test utility for CREATE-success, SQL mutation and both forced Drizzle children (child target, installed binary SHA, status; redacted). Do not log secrets; preserve negative-case results. Any new helper module must be reviewed for dependency cycles and must not itself run SQL on import.
4. Git authoring only after A00 written source-only scope; new PR + **NEW commit SHA** and new full inventory/tree/lock/built artifact hashes, explicit migration and privileges reconciling A22. Regression matrix: failed CREATE collision does not reach DROP; success only own OID/owner; foreign race rejects; S1 preexisting foreign schema denies; helper schema collision denies; Drizzle still runs twice against only owned DB; Node TAP behavior unchanged for legitimate tests. Separate A31/A22/A60 QA then new G0–G5 approvals. **Never claim patched run proves first failing test in original C01 unchanged SHA.**

## 9. Acceptance gates, owners, and work breakdown

| Milestone | Acceptance evidence to demand | Owner | Current status |
|---|---|---|---|
| **P0 design D1** | A20 single signed-ready five-context Option A plan/Compose SHA, two mutually exclusive track decision; explicit U residual defect disposition | A20 + A00/HQ | PENDING |
| **P0 security D2** | A31 R4 specialist review of source hooks/CREATEDB/FORCE/TOCTOU/signer trust | A31 via A30; A30 reconciles | PENDING |
| **P0 gate D3** | A24 current S1/helper schema and four S2 DB readiness matrix, native Windows 5432 proof design | A24 | PENDING |
| **Source engineering E1** | Separate permission for code edits, reviewed `policy`/`lib`/`bin` and static unit tests on isolated branch, lint/negative tests, provenance | A00 then A50, A31/A60 review | NOT_AUTHORIZED |
| **Source patch H (conditional)** | Fixture guard patch new SHA, R4-CODE-01/02/03 regression suite, new CI/source audit; distinct plan | A00/A20+A22+31+60 | NOT_AUTHORIZED |
| **G0 (split sub-actions)** | Actual authenticated OCI base/platform digest, frozen source+lock/build context, runner built SHA **after** separately granted G0, read-only FS design | A00/A20/operator+A24/A60 | HOLD / NOT_EXECUTED |
| **G1/G2** | Certified new PG16 physical system ID, container/volume/PID/netns↔SQL role+SCRAM, Windows native service untouched | A20+operator+A24+A31 | HOLD / NOT_EXECUTED |
| **G3 distinct scopes** | S1 / 3x catalog / Drizzle force separately signer-authorized; privilege/DB ownership proof; no unsigned FORCE | A00/HQ+A20+operator | HOLD / NOT_EXECUTED |
| **G4** | Exactly one full suite (36 entrypoints); nonroot read-only/tmpfs write validation, full native TAP + SQL ledger and first error, signed source-risk policy | A50+A24; independent A60 | HOLD / NOT_EXECUTED |
| **G5** | New triple signed exact-ID cleanup after evidence retention, before/after five-context DB footprint, no foreign resources | A20+operator+A60 | HOLD / NOT_EXECUTED |

**Handoff to A20:** freeze physical Option A, issue signed resource/phase schemas and D1 track decision; agree first what signatures and attestors are trusted, including runtime `CREATEDB`/source-defect exception.  
**Handoff to A24:** review negative N04–N14/N19, sealed env, Windows native 5432 physical cert, per-run DB/schema/aux helper OID constraints; do not promote source docs to GO.  
**Handoff to A30/A31:** review signature trust roots/replay/TOCTOU and compare launcher-only vs source-hardened source defect; return named P0 dispositions, not blanket acceptance.  
**Handoff to A60:** verify 36 pinned file blobs/manifest, risk split, 24 negative cases and provenance; source plan acceptance distinct from G4 runtime acceptance.  
**Handoff to A00:** plan ready for review only; source-code implementation and fixture patch still need separately scoped authorization, G0 remains NO_GO.

## 10. Static QA, exact source provenance and outcome

- **Performed:** read immutable A22 R4/A30 R4/A60 R3 via GitHub connector; read exact C01 Git tree API and verify `truncated=false`, 36 integration entrypoint paths+Git blobs; inspect source-grounded A22/audit and existing A50 R23H/R2 designs; create Markdown plan and JSON manifest; recompute hashes/validate document references and 36-entry count locally. These are **documentary/source checks**, not runtime tests.
- **Not performed:** Docker/Compose CLI or pull/build/up/run, PostgreSQL connection/SQL/migrations/Drizzle push, C01 API tests, actual source/fixture/CI edits, synthetic negative unit tests, G0–G5, merge, Replit/live/Unity/game mutations, Windows host or G: client sync.
- **Implementation status:** `PLAN_WRITTEN`, `LAUNCHER_IMPLEMENTED=NO`, `SOURCE_HARDENED_FIXTURE=NO`, `RUNTIME_WRITE_PATH_CENSUS=PENDING`, `NEGATIVE_TESTS_EXECUTED=0`, `AUTHORITY_VERIFIED=NO`, `A31_REVIEW=PENDING`, `A60_REVIEW=PENDING`.
- **No-go remains mandatory:** `P0_OPEN_7 / G0_NO_GO / G1_G5_HOLD / PG16_EXECUTION_HOLD / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO / SWARM006_HOLD`.

**Final disposition: `SOURCE_PREPARATION_READY` means only that A50's implementation plan is ready for independent review and future scoped engineering authorization. It is NOT a signed production-grade launcher, not an accepted admission boundary, not security-risk closure, and not permission to execute any infrastructure step.**

## Appendix A — exact 36 entrypoint inventory from Git tree (read-only)

| # | `artifacts/api-server/test/` file | Git blob SHA-1 (40 hex) |
|---:|---|---|
| 01 | `access.integration.test.ts` | `014d9581d1bd105854121fab9107e117c0f966cf` |
| 02 | `basket-participant-flow.integration.test.ts` | `4fbe0dd149245311f6a653eef3be1bb8f87d95a5` |
| 03 | `complete-match.integration.test.ts` | `5b3b8942e792d231639d3cbae88e942de166abd2` |
| 04 | `credential-rate-limit.integration.test.ts` | `14addcc79b35ff31f6d1bc13cf6d896fc5749042` |
| 05 | `deadlock-ban-pool.integration.test.ts` | `916d267c252a216bec1c408104f91f40a040af32` |
| 06 | `deadlock-game-config.integration.test.ts` | `68dbded2474170d9d9266028c12d33c81004435f` |
| 07 | `deadlock-sides.integration.test.ts` | `ce066f10a888ce16cfac99058228afd52b1f985e` |
| 08 | `double-elimination-api.integration.test.ts` | `314e1c8259d86b02e2e7f0659d0fe18cfb36b70b` |
| 09 | `double-elimination-persistence.integration.test.ts` | `420dc92d2cf1ebadbbe2112753411fdd63ab3561` |
| 10 | `drizzle-schema-diff.integration.test.ts` | `e008dbd9fe287632252d3fcfda246f60e4cc35d3` |
| 11 | `legacy-de-routing-plan.integration.test.ts` | `eeb7bcb702af96e5ca1e245d26d8807c85c8f258` |
| 12 | `marvel-elimination-stage.integration.test.ts` | `16b140cb0908415e746c24255937a4a2f0224ff8` |
| 13 | `match-revision.integration.test.ts` | `b787c06d5575ad958a309002f6af733a877b5b7f` |
| 14 | `migration.integration.test.ts` | `5f84cbb783219bbaf55c788f0e9d508cf78e3d13` |
| 15 | `operational-reliability.integration.test.ts` | `103ce3352c8a3d97296c06b65931a33b0876f029` |
| 16 | `replit-schema-catalog-reconciliation.integration.test.ts` | `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4` |
| 17 | `revert-match.integration.test.ts` | `3528c28bc3b253186e2b1c09426624b779c9a87f` |
| 18 | `security-integrity.integration.test.ts` | `5c0ccdf9e9598ceea7b14b8f1194104b566807db` |
| 19 | `series-v1.integration.test.ts` | `de72356ef9448caa324869a8ae958ddbfafbacd8` |
| 20 | `single-stage-seeding.integration.test.ts` | `a2a8ddf2e7b202f3e83f4f1b2b56e28ea9d4795f` |
| 21 | `stage-basket-qualification.integration.test.ts` | `bc988483ee50e5a8b7256b240220ee121387ac80` |
| 22 | `stage-basket-route-execution.integration.test.ts` | `f5fc8eb3ec6f534ce74e70dbb90e48f47476e02d` |
| 23 | `stage-baskets.integration.test.ts` | `27c101a195d7a33de270b4eed53eb8ff95cac17e` |
| 24 | `tournament-atomic-correction-postgresql.integration.test.ts` | `92fe7245604458aff815a6a21b2e2e19f757a54a` |
| 25 | `tournament-operations.integration.test.ts` | `a6d5ba45eec7e199eebd5395918f9bc23334f7b5` |
| 26 | `tournament-routing-persistence.integration.test.ts` | `895bc584df055557184f5306211285413a74d32e` |
| 27 | `tournament-stages-api-backup.integration.test.ts` | `a477b426ed4e39d0685e1e6bce70085b22a35059` |
| 28 | `tournament-stages-composite-foreign-keys.integration.test.ts` | `569e288b806d16ac0635a9f89f06a4bfc25844d5` |
| 29 | `tournament-stages-full-flow.integration.test.ts` | `33bc863c5dd0eddc2eb759aa35927c550121481c` |
| 30 | `tournament-stages-group-stage.integration.test.ts` | `f370fcdfcd0b9a0dea2505e1409e2fe9faa0acf2` |
| 31 | `tournament-stages-initial-start.integration.test.ts` | `536520bbe5794049932a70efb8724c340fb0be9d` |
| 32 | `tournament-stages-lifecycle.integration.test.ts` | `de05f00d21975cbe926dd6c0265e1afce04486cb` |
| 33 | `tournament-stages-procedural-recovery.integration.test.ts` | `959d9b4f168e272e9708aa9afe0f21b6814a1da6` |
| 34 | `tournament-stages-production-migration.integration.test.ts` | `409b22640bb1281deef45c133cf24c4488ac7765` |
| 35 | `tournament-stages-reconcile-migration.integration.test.ts` | `7ad29187e31c22a3efac7bd8da55dd1c3234cbde` |
| 36 | `tournament-stages-schema.integration.test.ts` | `ebad25d5f217e7cf6e17bfcf0e349afff3a431a7` |

For machine consumption, see sidecar `R23H_R4_C01_36_INTEGRATION_ENTRYPOINTS.json`, with source SHA, raw tree API reference and read-only provenance. File SHA256 of each entrypoint and complete *in-image* path discovery remain **PENDING G0**, not conflated with Git blob SHA-1.
