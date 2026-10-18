# WEB-005 — MINIMAL DISPOSABLE POSTGRESQL 16 TEST ENVIRONMENT

**Artifact:** `WEB005_MINIMAL_DISPOSABLE_PG16_PLAN.md`  
**Owner:** A20 — PostgreSQL Coordination V2 · **Decision authority:** A00/HQ + A20 + named Windows operator  
**Date:** 2026-10-18 (Europe/Warsaw) · **Priority:** HIGH · **Mode:** DESIGN / READ-ONLY / NO EXECUTION  
**Purpose:** replace the heavy PG16 certification *development workflow* with a smaller, disposable **local test environment**; do **not** mark deferred P0/P1 security findings closed.  
**C01 original source:** `fa3261b2c9510e110ac9eba21726812d3401a525` (PR #60).  
**Status:** `MINIMAL_ENV_DESIGN_READY / OPERATOR_APPROVAL_PENDING / PG16_NOT_EXECUTED / C01_DESTRUCTIVE_TEST_HOLD`. Previous `G0_NO_GO / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO` remains operative until separate owner decision.

## 1. The smallest credible architecture

**Recommended strict option: separate container + private loopback network namespace + unique named Docker volume.** No named bridge is created **on purpose**: a Docker `internal: true` bridge still has a host gateway and may permit host↔container connectivity. A namespace with `network_mode: none` has no external interface, while a second process/container may join it using `network_mode: service:pg16`. Both PG and the runner see each other only on `127.0.0.1:55432` inside that namespace. This meets the isolation intent more strongly than an ordinary custom bridge. It does **not** prevent an authorized host Docker administrator from changing attachments/configuration later; the operator must inspect actual state before test admission.

```text
Windows native PostgreSQL 16 :5432       Replit / production / internet
            [NOT ATTACHED]               [NO ROUTE / NO CREDENTIALS]
                       \
Docker project web005_pg16_<run_id>:
  container pg16 -- network_mode:none / its own isolated network namespace
     PostgreSQL 16 → 127.0.0.1:55432 → named volume <project>_pgdata
  container api-tests -- network_mode:service:pg16
     prebuilt approved test runner, no host port, no Docker socket,
     no Windows/production mounts, only dedicated test-password secret
```

The runner image must be **prepared separately and approved before launch**. Its entrypoint that reads the dedicated password file and constructs a single test DSN is a **required future implementation**, not an executable already supplied here. No third-party containers may join this namespace.

### Minimal Compose DESIGN (unexecuted; placeholders intentionally fail until supplied)

```yaml
# compose.web005-minimal.yaml — design only, not approved to run
name: ${WEB005_PROJECT:?Provide new project name}
services:
  pg16:
    image: ${WEB005_PG16_IMAGE:?Use approved immutable PostgreSQL 16 image digest}
    network_mode: none
    ports: []                  # Never publish 5432 or 55432 to the host
    environment:
      POSTGRES_USER: web005_bootstrap
      POSTGRES_DB: postgres
      POSTGRES_PASSWORD_FILE: /run/secrets/bootstrap_password
      PGDATA: /var/lib/postgresql/data/pgdata
    command:
      - postgres
      - -c
      - listen_addresses=127.0.0.1
      - -c
      - port=55432
      - -c
      - password_encryption=scram-sha-256
    secrets: [bootstrap_password]
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -h 127.0.0.1 -p 55432 -U web005_bootstrap -d postgres"]
      interval: 5s
      timeout: 3s
      retries: 12

  api-tests:
    profiles: [test]           # Not started by default
    image: ${WEB005_RUNNER_IMAGE:?Use separately prepared local test image}
    network_mode: "service:pg16"
    depends_on:
      pg16:
        condition: service_healthy
    read_only: true
    tmpfs:
      - /tmp
    environment:
      WEB005_TEST_HOST: 127.0.0.1
      WEB005_TEST_PORT: "55432"
      WEB005_TEST_DB: ${WEB005_S1_DB:?Fresh run-specific S1 DB}
      WEB005_TEST_USER: web005_runner
      WEB005_TEST_PASSWORD_FILE: /run/secrets/test_password
    secrets: [test_password]
    # The approved runner must construct TEST_DATABASE_URL internally;
    # there is no supported existing application credential-file contract.
    # Entrypoint and write-path compatibility: PENDING A50.

volumes:
  pgdata: {}

secrets:
  bootstrap_password:
    file: ./private-secrets/bootstrap_password.txt
  test_password:
    file: ./private-secrets/test_password.txt
```

**Important:** `pg_isready` is a health probe, not proof of SCRAM identity, role rights or isolation. `api-tests` depends on a prebuilt runner image whose private credential-file wrapper is NOT currently implemented; do not pass `WEB005_TEST_PASSWORD_FILE` to existing C01 and assume it will work. The official PostgreSQL image supports `POSTGRES_PASSWORD_FILE`, and Compose secrets are private file mounts rather than password literals in the YAML. Secrets must be created in an operator-controlled, access-restricted, non-Git, non-GDrive location; the `./private-secrets` reference is a packaging convention, **not proof of host permissions**. Never use Windows-native PGDATA/SQL sockets, root `C:\\`/home/G: binds, project workspace writable host binds, Docker socket, `extra_hosts`, `network_mode:host`, `ports` or a second network. Named volume data is strictly per-project; no `external:true` or hardcoded shared volume name.

**Design trade-off:** this variant has a separate *network namespace*, not a user-defined named bridge. If tooling strictly requires a user-defined network, the alternative `networks: {test_island: {internal: true}}` with both services attached can be studied, but **is not equivalent to the strict no-route design**, because internal bridges can still allow host gateway traffic. It requires additional operator network-denial proof and is NOT approved by this document. Docker docs: https://docs.docker.com/compose/how-tos/networking/ and https://docs.docker.com/reference/cli/docker/network/create/.

## 2. New ephemeral credentials and database lifecycle

- **Bootstrap identity:** `web005_bootstrap`, generated only for this brand-new PG16 cluster, PostgreSQL bootstrap superuser within it. Secret accessible only by the PG container and named operator; never mounted to `api-tests`.
- **Test identity:** separate `web005_runner`, created by the operator *inside the new cluster only*, with `LOGIN CREATEDB NOSUPERUSER NOCREATEROLE NOREPLICATION NOBYPASSRLS`, and no privileged inherited membership. No production/Replit/Windows credentials, `DATABASE_URL`, `PGHOST*`, `SCHEMA_COMPARE_*`, dotenv, `.pgpass`, or global password store forwarded to runner. PostgreSQL `CREATEDB` is **cluster-wide**; in this design it is tolerable as a bounded residual risk only because the whole cluster is isolated and disposable. The real granted privileges require later confirmation; do not infer them from this document.
- **S1 base:** one fresh operator-provisioned database `web005_c01_test_<nonce>` owned by `web005_runner`, with no pre-existing application schemas. This name is **a proposed operator contract**, not enforced by unchanged C01 source.
- **S2 dynamic during a fully approved C01 suite:** three `tm_catalog_test_<16hex>_{dev,prod,fresh}` and one `tm_drizzle_schema_test_<32hex>` (four total), with **two** Drizzle Kit `push --force` commands and four fixture `DROP DATABASE ... WITH (FORCE)` attempts **inside the test run**. These are neither ordinary CRUD nor automatically harmless in an empty cluster.
- **Passwords:** two independently random, one-run-only secrets; never reuse Windows/PostgreSQL/Replit/prod credentials. Exclude secrets from Git and cloud sync, do not print their contents; local secret ACL/private storage and lifecycle are operator tasks. No credentials in image build args, published logs or Compose interpolated DSN.
- **Cleanup:** the expected lifecycle is **destroy the whole unique Docker project and its exclusive PGDATA volume**, not individually guess SQL DB names. **Only after explicit cleanup approval and ownership verification**; do not issue `docker system prune`, `volume prune`, wildcard SQL DROP or target another Compose project. Failed/ambiguous CREATE / surprising resource ownership ⇒ `CLEANUP_HOLD`, not speculative deletion.

## 3. Minimal preflight — five essential checks, not a certification theater

| Check | Future operator / runner action | Mandatory STOP |
|---|---|---|
| **P1 project ownership** | Generate an unpredictable one-time Compose project ID; ensure no containers/network/volume with that project label already exist. Use the selected Docker context and validate no external volumes/binds. | Collision, shared project or existing PGDATA ⇒ STOP. |
| **P2 physical network isolation** | Inspect actual PG `HostConfig.NetworkMode=none`, runner `container:<PG-ID>` shared namespace, **zero host-published ports**, zero bridge/host/extra attached networks and no host PGDATA/Docker socket mounts. Check loopback-only interfaces/routes from runner. | Any external route, host network, port, host/Windows mount or foreign attached container ⇒ STOP. |
| **P3 credentials and target** | No inherited DB/PG/SCHEMA_COMPARE/dotenv variables or production secrets in runner image/env; test-only secret present; target is exactly `127.0.0.1:55432`, approved `web005_runner`, one fresh S1 DB name. Verify positive *authenticated* PG16 connection and actual effective role/DB identity **inside isolated namespace** in a separately approved read-only probe. | Unsafe env/foreign DSN, bootstrap credential in runner, wrong role/DB/server ⇒ STOP. |
| **P4 negative reachability** | From the same sealed runner namespace inspect absence of route/interface to Windows PG 5432, Replit and external addresses. Use deny checks **without any credential or actual connection to production**; combine with operator out-of-band Windows service baseline. A successful local `pg_isready` is NOT enough. | Route to host/native or evidence missing ⇒ STOP. Do not probe production with secrets. |
| **P5 test scope** | Verify fresh S1 schema, source SHA, whether B fixture guard exists, authorized command and logs destination. Start with DB-free subset. Do **not** run original destructive C01 just because physical isolation looks right. | No B guard/new SHA or separate residual-risk approval; unknown S2 owner; changed target/command ⇒ **C01 HOLD**. |

**Proof limitation:** a static Compose file cannot *prove* test processes cannot reach a real DB; the preflight must examine actual runtime network mounts/routes, effective credentials, role and source import behavior after an operator authorizes it. A Docker administrator or a compromised/privileged host can always reconfigure resources. Evidence of one state is not a perpetual guarantee. Strict no-network mode removes normal external routes; this is stronger than bridge-only rules but does not resolve code-level unsafe FORCE DROP. No P0 is closed by this checklist alone.

## 4. Procedure for the named Windows operator — PLAN ONLY / NO EXECUTION HERE

**Prerequisite:** explicit written A00/HQ + A20 + operator decision identifying **minimal disposable development environment**, chosen source SHA, host/context, future actions and whether full destructive C01 is still prohibited. An environment-creation approval is **not** an integration-run, FORCE or cleanup permission. Existing G0_NO_GO for controlled C01 is not silently overridden.

1. **Offline preparation (separately authorized):** use a disposable working directory NOT inside live game/Replit/prod or synced G:; stage only approved Compose and an already approved PostgreSQL 16 image reference/digest. Prepare two unique secrets under private ACL, a unique `WEB005_PROJECT` and `WEB005_S1_DB`. The test runner image must be prepared with its DSN secret-file wrapper and dependencies under a distinct authorized build process; this plan performs no build/pull.
2. **Static review:** inspect effective Compose config (including overrides/profiles) and project labels; confirm no ports, no external network or host data/PGDATA mounts, no inherited production environment variables. If unexpected—STOP.
3. **New PG initialization:** only with fresh approval, provision one `pg16` container and named volume; bootstrap creates its own new PGDATA. Operator creates **one** non-superuser CREATEDB test principal and its fresh S1 base DB in this container, using a reviewed bootstrap procedure. These are **future SQL actions**; no SQL/script is run or signed by this A20 document.
4. **Read-only minimal preflight:** operator confirms actual `network_mode:none`, loopback-only runner namespace, mount/volume identity, actual server endpoint and test login; records sanitized observations and Windows native PG baseline unchanged. No use of a production/Replit DSN.
5. **Development stage 1 (no PG16 required):** run only source-inspected DB-free tests listed in §5 below, normally outside this PG environment. Capture true exit/failing assertion; no full `pnpm test`.
6. **Development stage 2 (PG16 required):** even in isolated project **full C01 destructive suite remains HOLD** until a source-hardened fixture B with a new exact SHA and independent review, or a separate expressly documented disposable-only residual risk exception for unchanged C01. The suite includes its own automatic FORCE teardowns, not a passive test.
7. **Evidence:** retain short operator record: project/volume/container IDs, test-only role, effective host/no-route evidence, isolated PG identity if authorized, exact command and true exit, local test result; redact secrets before sharing. **Do not invent** image hashes/cluster IDs/OIDs or mark unperformed checks PASS.
8. **Dispose (fresh explicit operator approval):** stop only this exact known project and destroy **only its verified owned** container(s), network state and dedicated named volume; confirm their absence and that native Windows PG16 is untouched. Future example `docker compose -p <exact-owned-project> -f compose.web005-minimal.yaml down --volumes` is destructive; **DO NOT execute from this document**. If ownership unclear or a foreign resource attached ⇒ `CLEANUP_HOLD` and escalation.

**Approval state:** `ENV_PROVISION_GO = NONE`; `TEST_GO = NONE`; `CLEANUP_GO = NONE`. No delegated SQL, Docker, migration, image/build or host action occurred.

## 5. Concrete tests available without running a PostgreSQL 16 server

All commands below are **static source candidates at exact C01 SHA**, not observed local PASS. A local Node/pnpm install and workspace dependencies must already exist. **Do not use `pnpm test`** (root script invokes API `test`, which includes PG16 integration), **do not use `pnpm run test:integration`**, `lib/db push`, migrations, reset or deployment preflight as DB-free shortcuts.

| Candidate from pinned package scripts | Exact planned command (run only under separate operator permission) | Evidence / caveat |
|---|---|---|
| **Deadlock catalog** | `pnpm --filter @workspace/api-server run test:deadlock-game-catalog` | Invokes `deadlock-game-catalog.test.ts`; reviewed assertions use catalog/config and local PNG metadata, not a PG query in that file. |
| **Marvel config & groups** | `pnpm --filter @workspace/api-server run test:marvel` | Invokes `marvel-game-config.test.ts` plus `marvel-elimination-groups.test.ts`. The config test was source-inspected; other file's full import graph needs a DB-free confirmation before claiming all cases safe. |
| **Schema comparison configuration** | `pnpm --filter @workspace/db run test:schema-catalog-comparison` | `schema-catalog-comparison.test.mjs` exercises configuration validation with test URLs (no real DB required by observed test body); imported helper must be checked for import side effects. Not the separately named `test:schema-catalog-comparison:integration`. |
| **Development reset configuration** | `node --test lib/db/test/development-reset-config.test.mjs` | Inspected file validates parsing/rejection of synthetic URL/config values, not runtime mutation; imported module's side effects must be excluded in review. This is NOT the `test:reset-safety` script, which includes `reset-safety.integration.test.mjs`. |
| **Typecheck** | `pnpm run typecheck` | TypeScript/static build-time checking only; it is not proof of PG16 behavior. Existing dependencies/build graph required; do not confuse with root `build`. |
| **Broader API unit suite — CONDITIONAL** | `pnpm --filter @workspace/api-server run test:unit` | `run-tests.ts unit` finds non-`.integration.test.ts` entries plus explicit UI tests. Naming-based discovery is not a proof of DB-free transitive imports; first inventory all unit entries and ensure no socket/DB/side effects, then run only if reviewed. |

**Observed repository script anchors at immutable C01 source:** [root package.json](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/package.json), [api-server package.json](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/package.json), [lib/db package.json](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/lib/db/package.json), [run-tests.ts](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/run-tests.ts), [test-discovery.ts](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/test-discovery.ts). All command strings reflect read-only source, not newly verified command success.

## 6. Deferred risks are **OPEN**, not silently certified

| Finding | Current simplified-stage status | When it matters |
|---|---|---|
| **P0-31-04 / FORCE after failed CREATE** | **OPEN**. Original fixture teardown is triggered by stored generated name without successful CREATE receipt. Launcher/network do not fix it. Variant B source guard remains preferred. | Before destructive C01 integration |
| **P0-31-01 / SQL-01 and S1 CASCADE** | Inventory of 1 S1 + 4 dynamic S2 documentary corrected; execution safety still **OPEN**, including S1 CASCADE and two Drizzle forces. | Before PG16 integration |
| **P0-31-02/05/06/07** | Physical identity, DSN/runner, actual isolation and authorizations **UNVERIFIED**; minimal preflight narrows scope but is future work. | Before admitting PG test process |
| **P1 bootstrap secret / tempFS / logging / owner collisions** | **OPEN**, controlled through private secrets, named project/volume, preflight and human-scoped cleanup; no runtime success claimed. | Before operations / evidence upload |
| **Replit/prod/native Windows no-touch** | Network route/credential restrictions are **design**, actual runtime no-touch **NOT_TESTED**. Docker daemon and Windows host privileged actors remain outside Compose guarantees. | Operator preflight and disposal |

**Explicit separation:** this disposable development plan is NOT a replacement for independent acceptance of dangerous SQL changes, the B fixture remedy, release approval, or previously required high-assurance C01 first-failure certification. It removes process complexity only for low-risk **local setup and DB-free development**. To run the original unmodified C01 with its S2 FORCE hooks, A00 must separately choose and accept an exceptional destructive-risk envelope; absent this, `C01_INTEGRATION_HOLD`.

**FINAL RECOMMENDATION:** **`MINIMAL_ENV_DESIGN_READY / DEVELOPMENT_FIRST_RECOMMENDED / OPERATOR_APPROVAL_PENDING`**. **`DOCKER=NOT_RUN / SQL=NOT_RUN / MIGRATIONS=NOT_RUN / BUILDS=NOT_RUN / PG16_TESTS=NOT_RUN`**; all deferred P0/P1 remain OPEN. Release/C01/G0 statuses unchanged.
