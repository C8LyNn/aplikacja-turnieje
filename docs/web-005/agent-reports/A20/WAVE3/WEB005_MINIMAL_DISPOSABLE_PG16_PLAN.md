# WEB-005 / A20 — WAVE 3 — MINIMAL DISPOSABLE PG16

**Task:** A20 — DISPOSABLE PG16 PLAN (DEVELOPMENT FIRST / WAVE 3)  
**Authority:** [2026-10-18 shared WAVE 3 dispatch](https://docs.google.com/document/d/10cKgkk3XZTwudRMIQ620Q5DAYEsMZIb8zmqgBoRnmEE/edit)  
**Mode:** DESIGN ONLY / READ-ONLY TO INFRASTRUCTURE. **No Docker, SQL, migrations, PG16 tests, build, deploy, merge or cleanup performed.**  
**Decision:** `MINIMAL_PG16_DESIGN_READY / OPERATOR_APPROVAL_PENDING / PG16_NOT_RUN / C01_DESTRUCTIVE_HOLD`. All SECURITY-DEFERRED P0/P1 remain **OPEN**, not implicitly accepted.  
**Previous full variant:** [A20 minimal plan at immutable commit `4183b8e`](https://github.com/C8LyNn/aplikacja-turnieje/blob/4183b8ee799b13bb1978737bd95b814cb549e623/docs/web-005/agent-reports/A20/DEVELOPMENT-FIRST/WEB005_MINIMAL_DISPOSABLE_PG16_PLAN.md). This WAVE 3 document is a **shorter operator-facing design**, not an additional R23H certification stage.

## 1. Architecture: one isolated temporary PostgreSQL 16 and one temporary test runner

**Preferred minimum is two containers sharing a dedicated Linux network namespace but no host/network route:**

```text
Windows native PostgreSQL:5432     Replit / cloud / production
       [NO ATTACHMENT]                  [NO ROUTE]
       └──────── Docker project `web005-pg16-<nonce>` ────────┐
          pg16 [its own network namespace; network_mode:none]  │
              127.0.0.1:55432 ↔ api-tests [service:pg16]        │
              one fresh project-scoped PGDATA named volume      │
              one fresh bootstrap secret; one test-only secret  │
          No published ports; no bind to host PGDATA/G: or      │
          Docker socket; no production credentials.            │
       └───────────────────────────────────────────────────────┘
```

This is an **independent isolated network namespace**, not a user-defined bridge. It is stricter than a conventional `internal: true` bridge, which may still permit host-gateway reachability. If a future task explicitly requires a named Docker network, submit a *new* network risk proposal; do **not** silently substitute bridge networking or publish 5432/55432 to Windows. Docker administrative privilege and actual runtime configuration remain separate host/operator trust boundaries.

### Small Compose template — DOCUMENTATION ONLY, NOT DEPLOYED

```yaml
name: ${WEB005_PROJECT:?unique disposable project ID required}
services:
  pg16:
    image: ${WEB005_PG16_IMAGE:?approved PostgreSQL 16 immutable digest required}
    network_mode: none
    ports: []
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: web005_bootstrap
      POSTGRES_PASSWORD_FILE: /run/secrets/pg_bootstrap
      PGDATA: /var/lib/postgresql/data/pgdata
      POSTGRES_INITDB_ARGS: --auth-host=scram-sha-256
    command: ["postgres", "-c", "listen_addresses=127.0.0.1",
              "-c", "port=55432", "-c", "password_encryption=scram-sha-256"]
    volumes:
      - pgdata:/var/lib/postgresql/data
    secrets: [pg_bootstrap]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -h 127.0.0.1 -p 55432 -U web005_bootstrap -d postgres"]
      interval: 5s
      timeout: 3s
      retries: 12

  api-tests:
    profiles: [tests]
    image: ${WEB005_RUNNER_IMAGE:?separately approved prebuilt test image required}
    network_mode: "service:pg16"
    depends_on:
      pg16:
        condition: service_healthy
    read_only: true
    tmpfs:
      - /tmp
    cap_drop: [ALL]
    security_opt: ["no-new-privileges:true"]
    environment:
      WEB005_TEST_HOST: 127.0.0.1
      WEB005_TEST_PORT: "55432"
      WEB005_TEST_DB: ${WEB005_S1_DB:?new one-run test DB required}
      WEB005_TEST_USER: web005_runner
      WEB005_TEST_PASSWORD_FILE: /run/secrets/pg_test
    secrets: [pg_test]
    # The test image MUST implement a reviewed wrapper which reads
    # the private test secret and constructs TEST_DATABASE_URL itself.
    # The unchanged C01 suite does NOT natively consume this file var.

volumes:
  pgdata: {}

secrets:
  pg_bootstrap:
    file: ${WEB005_SECRET_DIR:?non-repo secret directory required}/pg_bootstrap.txt
  pg_test:
    file: ${WEB005_SECRET_DIR:?non-repo secret directory required}/pg_test.txt
```

**Design preconditions (not present/verified):** approved immutable PG image digest + prebuilt runner image; operator-generated secrets in a private **non-Git / non-cloud-sync** directory; reviewed entrypoint secret-file wrapper, nonroot user and actual `read_only`/tmpfs compatibility. `pg_isready` is only a liveness probe, **not** an authenticated identity check. The Compose template does not create `web005_runner` or S1 by itself; those are future controlled operator bootstrap steps. `WEB005_PG16_IMAGE` and image digest are deliberately blank until separately authorized verification.

**Avoid** `docker.sock`, host/Windows PGDATA mounts, host published ports, `network_mode:host`, shared/external volume, connecting host credentials, Replit env, `.env` from live or production, `G:` backup mounts and globally named PGDATA volumes.

## 2. Test-only credentials and database

- **Two freshly generated per-run secrets**: privileged **bootstrap** password only in `pg16`, and different **test** password only in `api-tests`. No old/shared/production/Replit/Windows password is usable in this project. Do not commit/log/upload secrets.
- Operator would create `web005_runner` with `LOGIN CREATEDB NOSUPERUSER NOCREATEROLE NOREPLICATION NOBYPASSRLS` and no privileged membership. The role may act only in this one disposable cluster; **PostgreSQL CREATEDB is cluster-wide**, and a name prefix cannot limit it.
- Operator would provision one S1 `web005_c01_test_<nonce>` owned by `web005_runner`, with `tm_test_<nonce>` and helper schema names reserved for the suite. This creates no connection to any existing database. Real bootstrap privilege/role checks are future approved SQL only.
- Exact full original C01 source `fa3261b2c9510e110ac9eba21726812d3401a525` still creates **four additional S2 DBs** (three catalog, one Drizzle), executes **two `drizzle-kit push --force`**, and has four fixture `DROP DATABASE ... WITH (FORCE)` during test teardown. A failed CREATE can still trigger force DROP against an existing same-role database. **The physical disposable environment contains the potential damage but does not fix the source defect.**
- [Draft PR #89](https://github.com/C8LyNn/aplikacja-turnieje/pull/89) is a separate **unmerged PG16 source-hardening candidate**; checked HEAD `8b1b708d4b24cd94de4d15b2beed516b21da711a`. Do not represent it as the old SHA or as a verified runtime remediation; any use requires independent review and approval.

## 3. Operator's five-check preflight — sufficient for limited disposable setup, NOT a full C01 GO

| # | Operator check before separately approved test start | Hard STOP |
|---|---|---|
| **1** | Unique `WEB005_PROJECT`, exclusively owned new PGDATA volume, no preexisting project resources | Existing, reused, foreign or ambiguous volume/project |
| **2** | Effective PG `network_mode:none`, runner joins only the PG namespace, **no published host ports, bridge, extra network, PGDATA host mount or Docker socket** | Any route/mount/port capable of reaching Windows/Replit/live |
| **3** | Separate passwords and approved test-only env; launcher blocks inherited `DATABASE_URL`, `TEST_DATABASE_URL`, `PG*`, `SCHEMA_COMPARE_*`, dotenv/loader sources and unreviewed child DSNs | Any production/live DSN or secret reaches the test process |
| **4** | Only after separate permission: authenticated connection to **local isolated** `127.0.0.1:55432` under expected test role/DB; host Windows PostgreSQL socket/service unchanged, no external route reachable from runner. Negative network check **without trying production credentials or connecting to real DBs** | Wrong role/DB, Windows 5432/native access, uncertain physical target or missing observation |
| **5** | Source & command match selected review scope; DB-free commands allowed separately; full C01 withheld unless source-hardening accepted or exceptional disposable-only risk expressly authorized | Unpatched failed-CREATE→DROP accepted by assumption, unreviewed migration, additional CLI, missing test approvals |

**Evidence floor:** write down exact project, image/source SHA, project/volume/container IDs observed *later*, role name, no host ports/route, selected command, actual exit code and one-line summary. `Unknown` is not `PASS`. Do not copy secrets to the record. No real container/cluster IDs, SQL OIDs or actual network checks exist at design time.

## 4. Short future operator playbook — three independent permissions

1. **SETUP approval** (not granted): Windows operator with A00/A20 scope confirmation selects a disposable Docker context, one new project, **only** signed-off image inputs and isolated local secret directory. Confirm preflight items 1–3 and resource ownership. Create new PG16+volume and test account/S1 **only after specific setup + bootstrap SQL authorization**. This design does no such action.
2. **TEST approval** (not granted): before any optional DB-dependent suite, do physical/no-route and test-role preflight 4–5. Begin with DB-free tests outside PG. For complete destructive C01, obtain new separate decision on a reviewed source-hardened SHA (PR #89 remains draft) **or** exceptional explicit residual-risk acceptance on fully disposable cluster. Never imply full C01 permission from setup approval.
3. **DISPOSE approval** (not granted): retain brief private/redacted evidence, verify exact owned project/volume, then remove **only that project and its own volume**. Operator may use a future exact-project `docker compose -p <approved-id> -f <reviewed-compose> down --volumes` *only after confirming target identity and receiving cleanup permission*. No `prune`, wildcard DROP, generic `down -v` on another project, or retries after ambiguity. If ownership is uncertain ⇒ `CLEANUP_HOLD`.

**Do not launch automatically via Compose profiles.** Production Windows PG service, Replit and existing DB volumes are never cleanup targets. Bootstrap and cleanup are intentionally not automated by this document.

## 5. DB-free development: concrete source-defined candidates (NONE RUN IN THIS WAVE)

All commands below are sourced from [original API package.json](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/package.json), [DB package.json](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/lib/db/package.json), [root package.json](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/package.json), not runtime evidence:

| Command candidate | Scope | Caveat |
|---|---|---|
| `pnpm --filter @workspace/api-server run test:deadlock-game-catalog` | Deadlock config, local game assets | Source test itself uses local assets/assertions; require installed deps |
| `pnpm --filter @workspace/api-server run test:marvel` | Marvel rules/config | Imported group test and dependency graph should be screened for DB side effects |
| `pnpm --filter @workspace/db run test:schema-catalog-comparison` | Config-only schema-catalog validation | **Not** `test:schema-catalog-comparison:integration` |
| `node --test lib/db/test/development-reset-config.test.mjs` | Synthetic development reset-input rejection | Do NOT use `test:reset-safety`, which also includes an `.integration.test.mjs` |
| `pnpm run typecheck` | Static TS compilation/type checks | No PG16 DB proof; workspace dependencies required |
| `pnpm --filter @workspace/api-server run test:unit` | Wider unit + client UI suite | **Conditional**: screen imports for implicit DB/side effects before first invocation |

**Do not confuse `pnpm test` (API unit + integration), `pnpm run test:integration`, schema push, migration scripts or reset scripts with DB-free work.** This WAVE contains no executed test, so results for all commands = **NOT RUN**. A static Compose/document review is not a Docker startup or test PASS.

## 6. WAVE 3 closure, safety debt and isolation from other agents

**Non-overlap check as of WAVE 3:** current Draft PRs #101 (A40), #116 (A140), #105 (A50) changed paths were fetched; none touches this A20-owned `docs/web-005/agent-reports/A20/WAVE3/` path. We do not edit their branches, existing C01 files or #89 fixture code. This separate A20 documentation branch targets `release/tournament-ops-20261013-01` for review **only**; Draft PR is NOT an authorization to merge/deploy.

**What remains OPEN / SECURITY-DEFERRED:** `P0-31-01…07` including cluster-wide CREATEDB, unsafe failed-CREATE/FORCE DROP, unproved native Windows exclusion, runner/DSN isolation and signer/operational controls. `P1-31-01…06` incl bootstrap secret lifetime, write-path/tmpfs, authenticated target, SQL-effect uncertainty, redaction and resource preexistence remain **deferred, not closed**; also late custody P1 and P2 backlog. The comprehensive G0–G5 R23H path is *not* made mandatory for DB-free source work; equally, **this minimalist project does not authorize original C01 PG16 integration**.

**WAVE3 outcome:** `DESIGN_DONE / DOCS_ONLY / NO_CODE_CHANGES / NO_TESTS_RUN / DB_OPERATIONS_HOLD / NEXT_OWNER=A00+named_Windows_operator`. Suggested next action: independent owner approval of the **minimal setup** scope, separately from any C01 test/cleanup permission. No risk closure inferred.
