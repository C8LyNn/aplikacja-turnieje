# WEB-005 — A24 / R23H-R4 — INDEPENDENT G0 PREFLIGHT ACCEPTANCE

**Task:** `WEB-005-T024-R23H-R4-G0-PREFLIGHT`  
**Owner:** A24 (PG16 Test Readiness), reporting to A20  
**Date:** 2026-10-18 (Europe/Warsaw)  
**Mode:** READ-ONLY / PREFLIGHT DESIGN ONLY / NO EXECUTION  
**Frozen candidate C01:** `C8LyNn/aplikacja-turnieje@fa3261b2c9510e110ac9eba21726812d3401a525` (PR #60)  
**Document status:** `PREFLIGHT_DESIGN_READY` — criteria, sequencing, negative matrix and future receipt specifications are ready for independent review.  
**Operational decision:** `G0_NO_GO / G0_G5_HOLD / P0_OPEN_7 / SECURITY_BLOCKED / C01_INTEGRATION_HOLD / RELEASE_NO_GO`. This document does NOT decide GO or assert that A00, A20 or a Windows operator have approved anything.

**Read-only work declaration:** A24 did not call Docker, Docker Engine/CLI, PostgreSQL, SQL, migrations, image registry pull/build, package installer, test runner, GitHub Actions or an environment-changing command. Only versioned GitHub source/document retrieval and documentation publication.

## 1. Fixed references and source reconciliation

1. **A22 R4** — [`R23H_R4_SQL_EXECUTION_SAFETY_CONTRACT.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/da44df0f0786fe0552c91494fb168ff8f5e238d1/docs/web-005/R23H_R4_SQL_EXECUTION_SAFETY_CONTRACT.md); Git blob SHA-1 `086bee241bc2046d15ca291d02eb008b192d0320`. Its essential decision: five context SQL inventory is source-corrected but *destructive execution remains P0 BLOCKED*, unchanged C01 launcher-only containment cannot enforce an in-fixture CREATE-success pre-DROP guard. Preferred source-hardened alternative requires a **new source SHA**.
2. **A30 R4** — [`R23H_R4_SECURITY_P0_CLOSURE_PLAN.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/16ec9af0e907c4316d57b568c5a747c8353e14b9/docs/web-005/agent-reports/A30/R23H_R4_SECURITY_P0_CLOSURE_PLAN.md); source security plan, **7 OPEN P0 / 7 OPEN P1 / 3 OPEN P2** per its inherited A60 R3 register, independent review by A31 and A60 still required.
3. **A24 R3 baseline** — [`R23H_R3_G0_G5_READINESS_FINAL.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/b829968584d76ecc777c7d4c785748ba07036740/docs/web-005/agent-reports/A24/R23H-R3/R23H_R3_G0_G5_READINESS_FINAL.md); Git blob SHA-1 `32c97acdd50f277b89c45d3d095f48ee22035160`. Four dynamic S2 contexts + one operator-provisioned S1 base; separate S1/S2a/S2b authorization; not executable authorization.
4. A21 canonical *Option A* (historical static Compose SHA256 reported `3766de4d47c83e4bc9cb77774f627b5af9b94423c56e6ad3fdf83ad3bb9e5e70`) and A50 R2 runner evidence are background. **Effective final Compose + A20 R4 runplan, A31 R4 specialist assessment and A50 R4 executable launcher/source candidate: PENDING**, not implied by the above three documents.

**Precedence:** exact frozen source and corrected A22 R4 destructive semantics; A30 R4 security closure policy; A24 R3 static baseline. When facts concern implementation by A20/A31/A50 not yet delivered, explicitly **PENDING** rather than treating a proposal as tested implementation. An A60 independent acceptance cannot substitute any future A00/HQ+A20+named Windows operator phase/action signoff.

## 2. Four separate readiness states — prevent false GO

| Layer | Meaning | What may be accepted now | What cannot be claimed |
|---|---|---|---|
| `DOC_READY` / `PREFLIGHT_DESIGN_READY` | Criteria and source-derived threat model are written, source-pinned and reviewable | **YES — this A24 document** | No signed authority, operational evidence, runtime readiness or P0 closure |
| `AUTH_READY` | Independently authenticated, same-scope **three actor GO** for each exact action, valid time and plan SHA | **NO — PENDING** | No blanket G0, no consent inferred from GitHub issue, JSON `approved=true` or a comment |
| `EXEC_READY` | The prerequisites for the **specific** next action have been observed and independently accepted | **UNKNOWN / NOT TESTED** | Pre-build output digest, live OCI pull, engine runtime, fresh PGDATA/DB/role certainty |
| `QA_ACCEPTED` | A60 independently accepts appropriate phase receipts and disposition of critical findings | **PENDING** | Static document publication is not `G0_PASS`, `PG16_PASS`, API PASS or release GO |

**Result taxonomy:** `PASS` means source-backed, unexpired, verifiable receipt for the check at its designated stage; `FAIL` means positive observed noncompliance; `UNKNOWN` means required evidence has not been produced or independently checked; `NOT_APPLICABLE_YET` means evidence only becomes possible after a future gate. A **P0/mandatory UNKNOWN ⇒ HOLD**, not PASS. `DESIGN_READY` can coexist with `G0_NO_GO` without contradiction.

### Timeline of obtainable evidence

| Stage | Evidence appropriately available | Evidence NOT yet required |
|---|---|---|
| **Pre-G0, documentation only** | Exact source/lock/blob manifest proposed/fetched; 36-test discovery inventory subject to future clean-checkout recheck; canonical YAML file hash/option choice; approved-source provenance design, signer policy and future recipes; risk owner/PENDING ledger; offline launcher inspection once submitted | New runner *output* digest, actual Docker container, PGDATA `system_identifier`, SQL DB OIDs or actual PG ACLs, TAP, cloud runtime logs |
| **G0a — OCI inspection** (fresh signed GO) | Authenticated OCI registry response: image index digest **and** exact `linux/amd64` child manifest/config layers for pinned PG + Node bases; provenance and identity receipts | Pull/cache and runner image output |
| **G0p — image pull** (distinct GO) | Actual verified digest-bound local image pull/ID, platform and true exit, exact Docker host/context and receipt | No new container/volume or actual DB |
| **G0b — runner build** (distinct GO) | Signed build inputs/base digest/source tree/pnpm lock/SBOM/allowlisted context, output image ID/digest, build logs true exit and image config | No runtime namespace, PGDATA physical ID or SQL proof |
| **G0c — digest/Compose attestation** (separate approval as applicable) | Immutable produced runner fingerprint; effective sanitized Compose parser/config and no unsafe override; review by A20/A23/A60; source tree/lock still same | Does not authorize G1 |
| **G1** (separate future GO) | Operator observed Windows native service baseline (before/after), real Engine/context, fresh container/volume/mount/HostConfig/PID/netns/listener/ports, new PGDATA init, operator-provisioned S1 DB | G1 provisioning is not SQL catalog identity acceptance |
| **G2** (independent SQL-observer and physical-read scopes) | Operator `pg_controldata` `system_identifier` on **Docker PGDATA only**, mount device/inode and namespace/port chain; separate SCRAM SQL observer SELECT for matching endpoint/user/catalog/ACL/OIDs/preexistence | Does not permit schema mutations or G4 |
| **G3-S1 / G3-S2-CATALOG / G3-S2-DRIZZLE-FORCE** | Independent three-signature permission envelopes tied to actual G2 identities; no mutations merely by signing | Real runtime-generated S2 names/OIDs do **not** exist until future G4 fixtures |
| **G4** | One original, full 36-entrypoint source-pinned API integration suite (subject to re-enumeration), five-context SQL ledger, four CREATE outcomes, four fixture auto-DROP outcomes, two Drizzle forced pushes, true exits/raw TAP and root failure | No implicit retry, no G5 |
| **G5** | Newly signed exact-ID residual cleanup, evidence preservation, post-footprint and unchanged host native PG | Does not retroactively authorize automatic G4 fixture drops |

## 3. Pre-G0 decision checklist (independent A24 sign-off recommendation ONLY)

Each item must be explicitly marked `PASS / FAIL / UNKNOWN` with immutable receipt pointer. **Current state of all runtime-dependent checks is UNKNOWN, not PASS.**

| ID | Check / required owner-supplied proof | Immediate status | Future FAIL/STOP trigger |
|---|---|---|---|
| `G0-01` | A20 provides immutable, reviewed single R4 run-plan and source choice: **unchanged C01 residual risk** vs **source-hardened NEW SHA**; plan SHA, scope, expiry and risks | **PENDING** | Contradictory or missing plan, mixing SHA variants |
| `G0-02` | Clean exact C01 source SHA/tree; test discovery list/hashes, source fixturing, S1 helper schemas, migrations 0001–0028 and executed 0030/0031, S2 Drizzle forced path | **SOURCE DEFINED; independent clean-checkout receipt PENDING** | Dirty tree, missing test, source drift |
| `G0-03` | Lock checksum calculated from exact checkout (`pnpm-lock.yaml`; A22 Git blob `97ceb41938b53e8fc98f788ac1aa0c625761a2f2`); pnpm resolution `drizzle-kit 0.31.10`, exact Node and pnpm policy | **PENDING independent receipt** | Lock mismatch, floating deps, changed forced push binary |
| `G0-04` | A20/A21 canonical signed Option A source hash, **effective** Compose (base + all overrides + profiles) and deprecated R23G Option B quarantine | **Source topology described; final signed effective config PENDING** | Host port, bridge, host mode, unreviewed override, host bind |
| `G0-05` | Independently verified signed Windows host asset, Docker context/Engine ID/endpoint and approved architecture `linux/amd64` for future limited G0 actions | **PENDING operator read-only baseline** | Wrong context/daemon/platform, reused or cross-tenant host |
| `G0-06` | Authenticated OCI descriptors for `postgres:16.15-trixie` amd64 and pinned Node22 base incl multiarch index vs child manifest; registry trust/supply-chain acceptance policy | **PENDING scoped G0a** | Stale tag, unsigned digest, wrong arch; do not treat a candidate digest as authenticated |
| `G0-07` | Initial runner *input* seal: clean source SHA+tree, lock hash, build definition/context allowlist and Node base **input** digest; no secrets, native host PGDATA or `G:` mount in build context | **PENDING A50/A20** | Secret-bearing build context; no pinned input |
| `G0-08` | Runner *output* digest/image ID, source-in-image attestation, effective UID/config and write-path census after authorized build | **NOT_APPLICABLE_YET (G0b/G0c)** | Missing produced digest before G1, unapproved writable mount |
| `G0-09` | Approved G0a OCI inspection action `A00/HQ+A20+named Windows operator`; independent matching signed objects for exactly that action | **PENDING** | Missing signer, plan/host SHA mismatch, expired/no trust anchor |
| `G0-10` | **Separate** three signatures for G0 image pull, separate for Node runner build, separate for G0 output attestation; cannot inherit G0a | **PENDING, not GO** | Generic blanket approval or unauthorized pull/build |
| `G0-11` | A31 technical review of shared CREATEDB, forced DROP after failed CREATE, physical/role/Drizzle target risks, and accepted path choice | **PENDING A31 R4** | Unresolved source P0 silently waived |
| `G0-12` | A50 sealed launch/authorization verifier: immutable candidate SHA, design + negative test specifications; physical checks intentionally deferred until G1/G2 | **PENDING A50 R4** | Boolean approval bypass, inherited foreign DSN, unguarded source claim |
| `G0-13` | Evidence/retention plan: signed actor and timestamp, digest/hash on each receipt, private raw log path outside cloud sync, redacted Drive readback and A23 checksum index | **PENDING A20/A23/A50** | Logs/credentials leaking or no record of true exit |
| `G0-14` | Capacity/security budget and rollback/STOP: operator-certified available disk/WSL/Docker limits, reserve/VM growth, no `prune` shortcut, named operator escalation | **PENDING** | Resource shortfall or fallback to unsafe cleanup |
| `G0-15` | A30 security disposition and independent A60 *pre-G0 source/plan* verdict, explicitly not runtime acceptance | **PENDING** | Self-certified closure or purported runtime PASS |
| `G0-16` | Complete authorizing decision by A00/HQ on **one** narrowed G0 action only; no implied permission for G1/G2/SQL | **PENDING — G0 NO_GO** | Any request for blanket G0–G5 GO |

**Hard rule:** A24 never turns a planned `G0-09`/10 approval into an actual GO. The three authorities independently sign; A60 may reject evidence; A24 supplies `PASS/FAIL/UNKNOWN` analysis only. If any mandatory pre-action evidence remains UNKNOWN, future recommendation is HOLD. Signing `G0_IMAGE_PULL` while build output digest is naturally absent is allowed in principle only once **input** digests and own action signatures are independently verified; it cannot authorize runner execution.

## 4. G0 sub-action policy: three approvals, three non-substitutable scopes

| Action | Earliest logical prerequisites | Outputs after that action, only if separately authorized | Strict exclusions |
|---|---|---|---|
| `G0_OCI_INSPECT` | Signed plan/host identity, provenance procedure, approval `A00+A20+operator` specifically for registry inspection | Authenticated OCI index and platform-specific `linux/amd64` manifest/config descriptor, exact digest, registry/source receipt | No pull/cache, build, container, SQL |
| `G0_IMAGE_PULL` | Accepted OCI outputs, operator Engine/context baseline, separate three-signer pull authorization binding exact arch-specific digest(s) | Image pull exit/ID, local content-addressed image verification, no tag fallback | No build/start/network/volume/PGDATA |
| `G0_RUNNER_BUILD` | Accepted Node *input* arch/base digest, frozen C01 or newly chosen SHA, actual lock/source/context, strict build-definition and separate signatures | Real runner image ID/digest, build environment/provenance, dependency versions, original source inventory embedded; true logs/exit and redaction | No runner process/test/start/SQL, no automatic G1 |
| `G0_OUTPUT_ATTEST` | Build receipt and image registry/local-ID verifier, separately authorized read-only attestation if required by host policy | Operator/A23/A60 assessment of exact output and effective static Compose, no host port exposure by specification | No virtual PG16 cluster, no actual netns/volume proof |

**Source/OCI notes.** The PostgreSQL candidate `postgres:16.15-trixie`/`linux/amd64` may have an architecture-specific platform digest earlier reported as `sha256:75adc2a65806c96bc0e59030230bfe3f1c1b0d6d8f8181a8913e2b8b53bdc166`; this is **CANDIDATE ONLY** until G0a authenticates registry descriptors. Earlier multiarch index candidate `sha256:ca0bd484cb98bf4b24eb1010e73fb3fcbd6714d240fbc1a10eea5b7dbecb641d` must not be confused with the selected amd64 child manifest. Proposed Node `22.23.3` with pnpm `10.34.7`; Node base and produced runner digests **PENDING**. Check exact Node image tag/digest in A50/A20 future plan; no inference from host DB-free 426/426 PASS.

## 5. Physical isolation contract — evidence before G0 vs future G1/G2

**Option A immutable intent:** PG container `network_mode:none`; runner `network_mode:service:pg16`; **both `ports:[]`** and no Docker socket/host data bind; shared internal loopback `127.0.0.1:55432`/`PGPORT=55432`. No bridge, `network_mode:host`, Windows native route, Compose override or automatic host port publish. Windows native `postgresql-x64-16` on `127.0.0.1:5432` and `[::1]:5432` must be unaltered.

### Pre-G0 read-only planning (no Docker command in this A24 task)

- Named Windows operator supplies a **future** signed pre-G0 host asset identity and Docker context/Engine endpoint fingerprint, with method/provenance to show active context and no production/shared daemon. Read-only host observation **itself requires separate host-owner authority**; do not mislabel historical listener data as current.
- Approve an observation checklist for `postgresql-x64-16` service identity/state, PID/start time and both native `5432` listeners; before G1 take new signed baseline and after G5 compare. **Pre-G0 cannot assert unchanged future Windows state**.
- Statical source inspection confirms no host port mapping in the **canonical** Option A file; actual `HostConfig.PortBindings`, daemon routes, namespace and mounts are **UNOBSERVED** until G1.
- Freeze evidence budget, named PGDATA volume format and exclusive system-ID attestation protocol; never read native Windows PGDATA or issue even observer SQL during this preflight design.

### G1/G2 future identity certificate: NON-SUBSTITUTABLE

Require uniquely joined, timestamped receipts for (a) Windows asset/service/native PG listeners/PID baseline, (b) Docker context+Engine daemon identity, (c) actual project, container ID/image OS+amd64 digest/start time/labels, (d) **newly created** named volume real ID/labels/created time and mount source/destination, device/inode and PGDATA canonical path (no bind to Windows or user files), (e) container process PID/network namespace inode and actual loopback listener `127.0.0.1:55432`, **no host port publications**, (f) operator `pg_controldata` `system_identifier` on that precise fresh Docker volume under a **separately signed physical read authorization**, (g) separate observer SCRAM-authenticated `SELECT` on the same logical cluster verifying version/database/user/role ACL, DB inventory and OIDs; link SQL peer to container namespace/PID and control ID. Optionally privileged `pg_control_system()` corroboration only under explicit operator scope; do not elevate G2 observer. `pg_isready`, `localhost`, database name containing `test`, generic PG version or signed volume name alone **do not identify physical cluster**. After container restart/image/mount/context drift, invalidate old certificate and require reattestation.

**G2 real results are NOT pre-G0 GO prerequisites:** the signed *method and no-surprise STOP criteria* are. G1/G2 may not be short-circuited by obtaining an unrelated SQL connection early.

## 6. C01 five-context footprint and future independent G3 scope

One new S1 user database is **provisioned by operator G1**, then the unmodified full test runner uses it for `tm_test_<nonce>` schemas; it is not a fifth dynamic `CREATE DATABASE` from the API test. Four S2 databases are created by test fixtures during G4.

| Slot | Expected exact original C01 fixture scope | Future permission |
|---|---|---|
| `S1_BASE` | Operator-owned `web005_c01_test_<nonce>` is **a signed launcher/provisioning convention, not a C01 source-enforced fixed database name**; main schema `tm_test_<nonce>`; helper schemas `<schema>_rollback`, `<schema>_marker_drift`, manual resets; non-atomic `DROP SCHEMA CASCADE`, 0001–0028, test-specific 0030/0031, migration helpers/triggers, DML | `G3_S1_SCHEMA` distinct three signatures, exact base DB identity, main+derived helper schema generation rule, all source-visible SQL; no unconditional base DB DROP |
| `S2_CATALOG_DEV` | `tm_catalog_test_<16hex>_dev`, CREATE, migrations 0001–0010/0011 and drift SQL, fixture `DROP DATABASE IF EXISTS ... WITH (FORCE)` **inside G4** | `G3_S2_CATALOG` (covers max 3 slots) |
| `S2_CATALOG_PROD` | `tm_catalog_test_<16hex>_prod` as above | Same, distinct provenance slot |
| `S2_CATALOG_FRESH` | `tm_catalog_test_<16hex>_fresh` as above | Same, distinct provenance slot |
| `S2_DRIZZLE` | `tm_drizzle_schema_test_<32hex>`, CREATE, migrations 0001–0020, index/marker setup and cleanup; **two** pinned `drizzle-kit 0.31.10 push --config ./drizzle.config.ts --force --verbose`; automatic `DROP DATABASE ... WITH (FORCE)` **inside G4** | **`G3_S2_DRIZZLE_FORCE` independent three signatures and exact binary/config/child DSN** |

**Effective role truth for unchanged C01:** same `TEST_DATABASE_URL` credentials for S1 and both S2 fixtures. The role consequently needs `LOGIN CREATEDB NOSUPERUSER NOCREATEROLE NOREPLICATION NOBYPASSRLS` in the **new exclusively disposable cluster**, plus appropriate `CONNECT` and base DB `CREATE` for S1 schema and actual ownership of S2 created DBs. `CREATEDB` is cluster-wide, not prefix restricted. Do **NOT** sign fictional distinct S1 `NOCREATEDB` versus S2 `CREATEDB` principals or treat ownership as a name pattern. S2 names/OIDs come into existence at future G4 only; require `CREATE_ATTEMPTED`, `CREATE_CONFIRMED`, DB OID/owner/cluster ID and matched source fixture/run receipts before any source-hardened approved DROP.

**P0 remaining in unchanged C01:** both S2 fixtures save names **before** successful CREATE and may still execute `DROP DATABASE ... WITH (FORCE)` in `after()` after CREATE failed; launcher-only controls do **not** guarantee cancelling the internal DROP. A22 R4 names two mutually exclusive, separately governed future paths: (A) explicitly documented, exceptionally accepted residual risk **only on proven wholly disposable empty cluster** with A00+A20+operator consent and independent A30/A31/A60 review, default NO_GO; (B) **preferred source-hardened** fixture guard setting `createdByThisRun` only after CREATE success and matching trusted OID/owner/system ID plus no foreign writer, requiring new SHA. This preflight grants neither path.

**G4/G5 boundaries:** fixtures' four FORCE DROPs happen during G4 and must already be covered by their respective signed G3 and G4 scopes; G5 applies only to independently proven *residual* IDs after fresh three-party GO and evidence custody. No automatic retries, guessed G5 deletes, wildcard `prune`, or retroactive consent.

## 7. A50 launcher implementation acceptance (design review now, code/runtime later)

| Contract ID | Future A50 deliverable and independent reviewer | Static pre-G0 acceptance vs later runtime |
|---|---|---|
| `L-01` | Immutable launcher source SHA/manifest and trust boundary for authenticated A00/A20/operator action-specific signatures, plan digest, expiry/replay prevention, no `APPROVED=true` bypass. A20/A30/A31/A60 review. | **Design criteria now; implementation SHA PENDING**; signer tamper denials tested when authorized |
| `L-02` | Env allowlist built from empty map; scrub `DATABASE_URL`, `TEST_DATABASE_URL`, libpq `PG*` (including SERVICE/SERVICEFILE/PASSFILE/OPTIONS), `SCHEMA_COMPARE_*`, dotenv/node loaders; reinsert audited `TEST_DATABASE_URL` and source-derived S1 alias only inside namespace; allow fixture-generated S2a child `SCHEMA_COMPARE_*` and S2b child `DATABASE_URL` pointing exclusively at owned scratch DB. | Static env-flow analysis before G0; negative poison/child effective env receipts after separately authorized test scope; do not globally break source fixture exceptions |
| `L-03` | Frozen full discovered `*.integration.test.ts` (historically 36), exact original `pnpm --filter @workspace/api-server run test:integration`, no filter/skip/patch/retry/foreign lib/db suite; `tsx`, pnpm, Drizzle binary+config, container cwd/argv pinning. | Static manifest before G0, runtime proof only at G4 |
| `L-04` | Signed G1/G2 physical certificate requirement and fresh pre-SQL validation of system-ID + volume + container namespace + host/no-port + Windows native no-touch. Deny **before connect**, not just before mutations. | Specification pre-G0; real proof unavailable until G1/G2/G4 |
| `L-05` | Effective role/ACL plan for one non-superuser `CREATEDB` principal, base DB CREATE and 4 scratch ownership; no bootstrap admin in runner, no host route, force-drop guard choice with A22/A31. | Role threat model now; real grants unknown until G2; **cannot claim launcher-only cure of C01 source auto-DROP flaw** |
| `L-06` | Runner `nonroot`, `read_only:true`, narrowly budgeted tmpfs/scratch and all transitive pnpm/tsx/Drizzle cache or writing destinations inventoried; no writable host project mount, PGDATA, Docker socket or `G:` sync; supply build context secret audit. | Static source/write census can be reviewed pre-G0; actual UID/filesystem negative receipts need future authorization |
| `L-07` | Two Drizzle child process receipts (binary path+SHA/kit 0.31.10, argv/cwd/config, sanitized target, native exits) and SQL-effect trace; source source expects no changes but **do not equate `No changes detected` assertion to actual zero DDL**. | Config/lock source inspected now; actual SQL and child exits only G4 |
| `L-08` | Before-run signed seal, five-context + S1 auxiliary schema event ledger, lifecycle state machine, raw private TAP/stdout/stderr/exit/first-failure SHA and redact-before-cloud copies with remote **byte** readback. `G4_DIAGNOSTIC_EVIDENCE_PASS` separate from `API_SUITE_PASS`. | Receipt schemas now, logs later; no user DSN in cloud |
| `L-09` | Explicit denial state machine and non-bypass route for failed name CREATE/preexisting same-name database. **Requires code-patched hooks for guaranteed fail-closed internal DROP** or formally approved unmodified residual risk; no false static PASS. | Source code choice **PENDING A20/A22/A31/A50**; cannot graduate from doc spec to safety proof without code/independent receipt |
| `L-10` | Distinct `G0_OCI_INSPECT`, `G0_IMAGE_PULL`, `G0_RUNNER_BUILD`, `G0_OUTPUT_ATTEST`, G1/G2/G3-S1/G3-S2a/G3-S2b/G4/G5 signer and resource guards; no phase inheritance. | Denial policy specified, implemented verifier and independent A60 source/negative QA **PENDING** |

**Acceptance taxonomy:** `LAUNCHER_DESIGN_READY` when specs reviewed; `LAUNCHER_SOURCE_IMPLEMENTED` only with exact Git blob/diff; `LAUNCHER_STATIC_VERIFIED` after independent source + negative-test design acceptance; `LAUNCHER_RUNTIME_VERIFIED` only after separately authorized admissible runtime receipts; `LAUNCHER_QA_ACCEPTED` only after A60. None is automatically implied now.

## 8. Negative preflight tests and STOP matrix (ALL FUTURE, NONE EXECUTED)

For each negative check, future verifier must report `REJECT_BEFORE_ACTION` / `REJECT_BEFORE_CONNECTION` where applicable, immutable `STOP_RECEIPT` with actual attempted action, redacted host/plan digest and actor, and **no side effect**. A document's negative test case is not a recorded test PASS.

| N | Injected violation / independent challenge | Earliest proof stage | Mandatory reaction / STOP |
|---|---|---|---|
| N01 | Missing one of A00/A20/operator signatures, wrong signer key, expiry, scope, plan or nonce | Pre-G0 source check; runtime only if authorized | `STOP_NO_TRIPLE_GO`; deny action |
| N02 | G0 OCI inspect approved but request image pull/build | G0a | `STOP_PHASE_SCOPE_ESCALATION`; deny |
| N03 | G0 pull authorized but request runner build or container start | G0p | `STOP_PHASE_SCOPE_ESCALATION`; deny |
| N04 | C01 source/tree, 36-file manifest, lock or Drizzle package/config differs | Static and G0 | `STOP_SOURCE_LOCK_DRIFT` |
| N05 | Registry multiarch index presented as `linux/amd64` platform child, stale tag or unauthenticated OCI | G0a | `STOP_OCI_UNTRUSTED_ARCH` |
| N06 | Unknown Node input base, dirty secret-bearing context, unreviewed runner image output | G0b/c | `STOP_BUILD_PROVENANCE` |
| N07 | Wrong Docker context/Engine, native shared host or stale operator certificate | Pre-G0 operator observation / G1 | `STOP_CONTEXT_WRONG_HOST` |
| N08 | Compose override publishes `5432/55432`, host/bridge networking, docker.sock/host PG bind or writable host data mount | Static Compose / G1 | `STOP_HOST_PORT_ROUTE_BIND` |
| N09 | Windows native `postgresql-x64-16` process/PID/starttime/listeners changed or contacted | G1/G2/G4/G5 | `STOP_WINDOWS_PG_TOUCH` |
| N10 | Reused/foreign volume, PGDATA mount different, system_identifier mismatched or container netns/PID drift | G1/G2/G4 | `STOP_WRONG_PGDATA_INSTANCE` |
| N11 | SQL `localhost` DSN or `pg_isready` used without out-of-band physical/namespace/volume proof | G2 | `STOP_UNPROVEN_SQL_IDENTITY` |
| N12 | Role missing expected S1 DB CREATE/CONNECT or holds SUPERUSER/CREATEROLE/BYPASSRLS, foreign membership/CREATEDB on shared cluster | G2/G3 | `STOP_ROLE_ACL_ESCALATION` |
| N13 | S1 `tm_test_*` reused, auxiliary `_rollback`/`_marker_drift` unaccounted, other schema affected by CASCADE | G2/G3/G4 | `STOP_S1_FOREIGN_SCHEMA` |
| N14 | Old three-S2-DB-only plan/signature or G3-S2-CATALOG implicitly covers Drizzle | Static/G3 | `STOP_S2_SCOPE_STALE` |
| N15 | One S2 catalogue name collision or unconfirmed CREATE followed by fixture `after()` FORCE DROP | Source design now; G4 negative when authorized | `STOP_FAILED_CREATE_FORCE_DROP` / `CLEANUP_HOLD`; unmodified C01 **cannot assert pre-DROP interception** |
| N16 | Drizzle `--force` target not the owned new DB, injected child DATABASE_URL or changed kit/config | Source/launcher/G4 | `STOP_DRIZZLE_FORCE_FOREIGN_TARGET` |
| N17 | Fifth dynamic DB, wrong suffix/count, owner/OID not tied to run/cluster or unexpected `DROP DATABASE WITH FORCE` | G4 | `STOP_FIVE_CONTEXT_OWNER_LEDGER` |
| N18 | Inherited `PGHOST`, `PGSERVICE`, passfile, `DATABASE_URL`, malicious `SCHEMA_COMPARE_*` or dotenv loader | Launcher source/authorized negative tests | `STOP_INHERITED_DSN`; reject before connect |
| N19 | Runner writes outside approved tmpfs/scratch, nonroot cannot write but fallback host mount proposed | Source/write census/G4 | `STOP_RUNNER_FILESYSTEM_WRITES` |
| N20 | Test-name filters, skipped suite, auto retry, changed argv, missing Drizzle child exit or truncated TAP | G4 | `STOP_G4_INCOMPLETE_SCOPE` |
| N21 | Raw password/privileged secret copied to Drive or sanitized cloud hash differs | G4/G5 | `STOP_CREDENTIAL_OR_CLOUD_CUSTODY` |
| N22 | G5 `prune`, guessed volume/database prefix DROP, missing CREATE-success/OID/owner/system-ID receipt | G5 | `STOP_G5_UNOWNED_DELETE`; `CLEANUP_HOLD` |
| N23 | Source-hardened change made but execution still claims frozen `fa3261...` source SHA or inherits old approvals | Pre-G0/G0 and all gates | `STOP_SOURCE_VARIANT_MIX` |
| N24 | P0/P1 unknown misreported as PASS or pre-G1 PGDATA evidence fabricated | All phases | `STOP_EVIDENCE_FABRICATION` and independent re-review |

**STOP procedure:** Record exact violated invariant (no secrets), phase/action, actor, source/plan SHA, UTC, expected/actual IDs and SHA of restricted evidence; freeze further mutations, avoid hypothetical rollback/cleanup, notify A00/A20/operator/A30/A31/A60, and independently reassess. STOP does **not** independently permit `docker stop/kill/rm`, SQL `DROP`, `volume prune`, `compose down -v`, another test or Windows service restart. Real host emergency follows existing operator-owned incident authorization, not this document.

## 9. Dependency register and open risks

| Owner | Required next artifact / decision | Current | Admissible acceptance and consequences |
|---|---|---|---|
| **A20** | Single immutable R4 runplan/Compose choice with source-unchanged vs source-hardened decision, input digest/host binding, base DB and role, G0 action-specific authority templates; confirm safe Windows/no-port target | **PENDING** | Must be independently versioned and reconciled with A22/A30; no inferred GO |
| **A31** via A30 | R4 specialist review of combined CREATEDB/owner/FORCE/partial-CREATE, trust boundary/DSN, collision matrix and source patch vs exceptional containment | **PENDING** | Independently challenge negative cases, not rely on A22's own static confidence |
| **A50** | Versioned source implementation/launcher SHA, signed action verifier, source+lock and OCI input seal, env allowlist, filesystem/write census, exact Drizzle child receipts and pre-DROP guard decision | **PENDING** | Design-only not executable; independent A31/A24/A60 review required |
| **A23** | Append-only custody index covering A22 R4, A30 R4, A31 R4, A24 R4, A50 candidate; byte/sha evidence plan | **PENDING** | Cloud readback not proof of local Windows `G:` sync |
| **A30** | Security acceptance recommendation per seven P0 and P1 evidence, independent A31 input | **PENDING final R4 closure** | Its R4 **plan** itself exists but explicitly `SECURITY_BLOCKED` |
| **A60** | Independent pre-G0 source/approval/document accept/reject; later runtime QA separate | **PENDING** | QA cannot grant operational phase permission |
| **A00/HQ + A20 + Windows operator** | **Separate actual** authorizations for G0 OCI inspect, image pull, runner build and output attestation | **NONE OBSERVED / PENDING** | Without signed precise scope, G0 NO_GO |

### P0/P1 disposition as of this A24 document

**Seven P0 remain OPEN operationally** under A30 R4 / A60 R3:
- `P0-31-01` — fourth S2 DB and Drizzle effects *source-inventoried*, execution scope/signatures/traces missing.
- `P0-31-02` — no actual Docker PG physical identity / Windows native isolation proof.
- `P0-31-03` — S1 irreversible CASCADE and helpers, preexisting schema/recovery hazards.
- `P0-31-04` — shared cluster-wide CREATEDB, failed CREATE → fixture FORCE DROP, actual owner proof absent; source guard not implemented.
- `P0-31-05` — no verified fail-closed launcher/env/DSN denial.
- `P0-31-06` — canonical Option A static only, actual OCI/runtime provenance unverified.
- `P0-31-07` — no independently verified action-level signature enforcement and actual authorities.

**Seven P1 reported OPEN by A30 R4:** `P1-31-01` bootstrap admin secret persistence; `P1-31-02` runner filesystem write census; `P1-31-03` `pg_isready` ≠ SCRAM identity; `P1-31-04` migrations/trigger/dynamic SQL and forced pushes full effect ledger; `P1-31-05` private/raw TAP vs cloud redaction custody; `P1-31-06` freshness of actual Docker context/volume; `P1-R3-CUSTODY` newly produced evidence not appended/attested in A23 index. Additionally A30 reports 3 OPEN P2 (Docker operator privilege/seccomp and local G: mirror). Their independent closure is **PENDING**, not assumed done due to publication of this preflight.

**Blockers specifically for requesting first G0a GO:** unresolved A20 immutable phase-specific plan, A31 technical risk disposition, A50 immutable launcher/verifier architecture and source choice, A60 independent source preflight acceptance, missing three action-specific signer records and G0a authenticated OCI methodology. Detailed live PGDATA IDs, four S2 actual names/OIDs and G4 TAP are **not** legitimate prerequisites for first OCI metadata inspection, but do block their **own later phases**. No P0 is waived here.

## 10. Source-hardened C01 transition rule

If A20/A00 selects A22 R4 preferred source-hardened plan, do **not** treat it as unchanged C01; execute no migration of approvals by fiat. Before any G0 related to a patched runner/source:
1. Freeze **new immutable application Git SHA/tree** and PR, signed code diff and all changed fixture helper blobs (S1 helpers/manual resets; S2 catalog/drizzle `after()`).
2. Update source-controlled creation proof: when `CREATE DATABASE` fails, **no automatic `DROP`**; successful CREATE is logged and coupled with same-cluster generated name, OID, owner, actor, run ID, time, pre-drop recheck and physical isolation of all other writers; record `CLEANUP_HOLD` for uncertainty.
3. Revise S1 main + derived helper-schema guard, enumerate destructive DDL/migrations and exact number/discovery of integration entrypoints under new SHA.
4. Freeze new pnpm lock+Drizzle package/config/schema/filter exact versions; re-evaluate whether code changes altered child env, source DB role model or SQL footprint.
5. Reissue A20 topology/plan source and **new plan SHA**, A23 append-only provenance, A31/A30 security assessment, A24 matrix, A60 independent QA; old G0/G3/G4 signatures/digests become **invalid**, even if host remains same.
6. Only then may A00/HQ+A20+operator consider fresh, independent **G0a OCI inspection** signature for the **new** source plan. G1/G2 physical certificates cannot be carried over after actual runtime identity drift.

For unchanged `fa3261...`, A22 R4 explicitly holds launcher-only route at **NO_GO by default** because it cannot implement in-process safe teardown. Only separately documented disposable-cluster residual-risk acceptance by all named authorities, independent A30/A31/A60 scrutiny, and actual phased evidence could even make it eligible for future consideration. No such acceptance has been supplied.

## 11. Future receipt schemas (INERT SAMPLES, not authorization)

~~~yaml
preflight:
  task: WEB-005-T024-R23H-R4-G0-PREFLIGHT
  disposition: PREFLIGHT_DESIGN_READY
  operational_g0: NO_GO
  c01_original_sha: fa3261b2c9510e110ac9eba21726812d3401a525
  source_variant: UNCHANGED_OR_NEW_SHA_PENDING_A20_DECISION
  a20_final_runplan_sha256: PENDING
  a31_r4_review: PENDING
  a50_launcher_candidate_sha: PENDING
  a60_independent_source_review: PENDING
  a23_custody_manifest: PENDING
  images:
    pg_platform_amd64_oci_digest: PENDING_G0A_AUTHENTICATED_REGISTRY
    node_base_amd64_digest: PENDING_G0A_AUTHENTICATED_REGISTRY
    runner_output_digest: NOT_APPLICABLE_BEFORE_APPROVED_BUILD
  operator_host_fingerprint: PENDING_APPROVED_READONLY_ATTESTATION
  gates:
    G0_OCI_INSPECT: HOLD
    G0_IMAGE_PULL: HOLD
    G0_RUNNER_BUILD: HOLD
    G0_OUTPUT_ATTEST: HOLD
    G1: HOLD
    G2: HOLD
    G3_S1_SCHEMA: HOLD
    G3_S2_CATALOG: HOLD
    G3_S2_DRIZZLE_FORCE: HOLD
    G4: HOLD
    G5: HOLD
  execution_performed_by_a24: false
~~~

~~~yaml
future_action_approval_example_ONLY_NOT_SIGNED:
  decision: HOLD
  phase_action: G0_OCI_INSPECT
  plan_sha256: PENDING
  source_exact_sha: fa3261b2c9510e110ac9eba21726812d3401a525
  docker_host_asset_and_context: PENDING
  source_and_lock_sha256: PENDING
  allowed_operation: OCI_REGISTRY_METADATA_READ_ONLY
  explicitly_denied: [IMAGE_PULL, RUNNER_BUILD, CONTAINER_START, PGDATA_READ, SQL, G1, G4, G5]
  actor_decisions:
    A00_HQ: PENDING
    A20: PENDING
    WINDOWS_OPERATOR: PENDING
  expires_at_utc: PENDING
  effective_go: false
~~~

**Final A24 verdict:** `PREFLIGHT_DESIGN_READY / A20_A31_A50_PENDING / P0_OPEN_7 / P1_OPEN_7 / G0_NO_GO / G0_G5_HOLD / PG16_EXECUTION_NOT_AUTHORIZED / RELEASE_NO_GO`. A24 publishes acceptance *criteria*, not an approval to inspect registries, pull/build images or provision a cluster.
