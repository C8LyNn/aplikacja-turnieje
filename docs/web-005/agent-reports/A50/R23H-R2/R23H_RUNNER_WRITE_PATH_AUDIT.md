# WEB-005 / A50 / R23H — RUNNER WRITE-PATH AUDIT

**Mode:** static/source design only. Exact C01 `fa3261b2c9510e110ac9eba21726812d3401a525`. A20 Compose R2 is `read_only:true`, `/tmp:rw,nosuid,nodev,size=128m`, immutable `/workspace`. **Uninspected paths are blockers, not a PASS.**

## 1. Split build-time vs run-time

**G0 image build (not authorized):** writes occur in the Docker image/build cache, *not* in a running readonly container: Corepack download and package-manager shims (`/usr/local/bin` or Corepack install tree), pnpm store/cache, `node_modules` and `.pnpm`, postinstall scripts, TypeScript `lib/db/dist`, `lib/api-zod/dist`, `lib/stage-basket-flow/dist`, `tsconfig.tsbuildinfo`, potential generated files, and root `preinstall` lock-cleanup (`rm -f package-lock.json yarn.lock`). All belong strictly to disposable, secret-free build context. Freeze and rehash pnpm-lock, full image/workspace artifact listing and dependency packages after build; no build permitted before signed G0.

**G4 runtime (not authorized):** startup should run *only* prebuilt code/test command. It must never `pnpm install`, `corepack prepare`, `tsc -b`, regenerate declaration files, rebuild `node_modules`, mutate tracked workspace, or write arbitrary repository paths. Every successful writable path must be new, ephemeral, bounded and approved in G4 plan.

## 2. Static write target map (closed-world intended policy)

| Path or source | Expected actor and write risk | Runtime mode / disposition |
|---|---|---|
| `/workspace` tree, package JSON/lock, tests, migrations | Node test harness reads; source and test fixtures might attempt output beside fixture/module | **RO**; `STOP_G4_RUNNER_FILESYSTEM_WRITES` if any unredirectable write. No bind mount of checkout; image content only. |
| `/workspace/node_modules`, `/workspace/node_modules/.cache`, `.pnpm`, package build `dist` | pnpm, tsx/transpilers, TS compiler, loaders/native addons sometimes cache files | **RO**. Prebuilt dependency graph required; runtime postinstall or build prohibited. Validate tsx under readonly root separately after consent. |
| `/workspace/**/tsconfig.tsbuildinfo`, `**/dist`, `**/.cache` | TypeScript incremental/build steps write | **RO**, BuildTypes strictly at G0. Missing runtime declarations = STOP, not runtime rebuild. |
| `/home/node`, `/home/node/.cache`, `/home/node/.local/share`, `/home/node/.npm`, `/home/node/.cache/node/corepack` | runtime HOME, pnpm/corepack/npm logs and cache | Default **RO** and may trigger EACCES. Design sets `HOME=/tmp/web005/home`, `XDG_CACHE_HOME=/tmp/web005/cache`, `XDG_CONFIG_HOME=/tmp/web005/config`, `XDG_DATA_HOME=/tmp/web005/data`, `NPM_CONFIG_CACHE=/tmp/web005/cache/npm`, `PNPM_STORE_DIR=/tmp/web005/cache/pnpm`, `COREPACK_HOME=/tmp/web005/cache/corepack`; launch uses prebuilt pnpm binary so no online Corepack needed. Set and verify all at future G4, not as a claim of compatibility. |
| `/tmp` | Node `os.tmpdir()`, `mkdtemp`, temporary fixtures, JSDOM, unix sockets, process IPC | Approved prospective bounded tmpfs; reserve `TMPDIR=/tmp/web005/tmp`, `TMP=/tmp/web005/tmp`, `TEMP=/tmp/web005/tmp`, owned by uid 1000. **Existing 128 MiB is unproven sufficient.** Preallocate subdirs with nonroot-compatible tmpfs ownership; bound inode/bytes. |
| `/var/tmp` | Linux/node dependencies may use it | **RO**, not automatically writable; prevent fallback. |
| `/run/secrets/pg_test_password` | runner receives per-run test secret, read only | Readonly secret; must not be copied into `/tmp` or logs; effective ACL/UID to be checked. Never mount bootstrap `pg_admin_password` in Node runner. |
| `/run`, `/var/run`, sockets, pidfiles | process/worker unix sockets, pidfiles | **RO** unless explicit reviewed per-run tmpfs needed; no Docker socket or host bind. Prefer `/tmp/web005/run` if demanded. |
| `/dev/shm` | Node/Chromium/other native libs shared memory | Docker-provided shm semantics to verify; no automatic host shm or writable bind; list requested limits in signed plan. |
| `/proc`, `/dev`, kernel FD | OS-runtime proc/dev, read only / ephemeral | Standard OCI container virtual mounts; no host-device mounts or elevated caps. |
| `/var/log`, `/workspace/reports`, `/evidence` | stdout/stderr, TAP reports, child logs | **RO/not mounted**. A50 host/sidecar captures container stdout/stderr; do not write cloud mount or host path from app runner. |
| Docker volume PGDATA | PostgreSQL service only | **Never mounted into Node runner.** PG service writes only newly approved dedicated named volume. |
| G:\\ My Drive, Windows C:\\ PostgreSQL, project checkout | host production/user assets | **Forbidden entirely in both runtime containers**. Report export belongs to later approved operator stage only. |
| `.env*`, `.npmrc`, `.git`, SSH keys, tokens, system certs | build context and environment leakage | Exclude secrets from build context. Config files in committed tree require content scan; do not indiscriminately copy host home. |
| Child `SCHEMA_COMPARE_*` environment | S2 test's `execFileAsync` passes internal disposable DB URLs | **In-process ephemeral**, never inherited from host. `COMPARISON_SCRIPT_URL` itself reads source; output appears on captured stdout only. |
| PG16 catalog/S1/S2 storage | Test DB writes (schema & 3 catalog DBs) | Governed separately by G3-S1/G3-S2 and physically fresh PG16; not filesystem write inside app runner. |

## 3. Source-verified observations and audit gaps

1. Exact runner `run-tests.ts` (Git blob `da4188446aba4696f97eb7831fee0cc5824d212f`) only discovers tests, logs test count and spawns Node child inheriting stdout/stderr. No explicit `writeFile` in that file. Its arbitrary *discovered tests* and their imports CAN write; not a full proof of RO compatibility.
2. Exact `test-discovery.ts` (blob `dd427fdafa92c089e2edad704079d81945c4b1c1`) walks recursively with `readdir`; any nested new integration test expands the run. G0 must enumerate actual test names and import graphs, not merely trust filenames in one handoff.
3. S1 `test-database.ts` (blob `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6`) reads migration SQL from project tree; its destructive writes are to PG, not Node filesystem. S2 fixture (blob `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4`) uses `execFile` child with `env:{...process.env,...}` and reads migration SQL; child may independently write caches/temp.
4. Root package `preinstall` uses `sh -c 'rm -f package-lock.json yarn.lock; ...'` during G0. This is a code side effect requiring disposable context. It must not run in G4.
5. **NOT YET INVENTORIED** (P0 before G4): entire recursively discovered `*.integration.test.ts` set; transitive local package imports; `fs.writeFile/writeFileSync`, `mkdir/mkdtemp`, `rename`, `open('w')`, stream writes, `createWriteStream`, exec/spawn shell commands, file-backed SQLite, child process caches, native postinstall, coverage/snapshot/JS config outputs. This cannot be marked audited from the handful of confirmed source files; A24/A60 must require machine and human static full-tree inventory at approved G0.

## 4. Fail-closed write-policy closure criteria (future; not performed)

**G0 future test-source census (non-DB):** list all integration tests via exact C01 checkout, hash each path, recursively scan imports and direct/indirect filesystem APIs and process calls. Record false positives and unresolved dynamic paths explicitly. Confirm installed dependency versions from frozen lock and postinstall behavior. Only allowlist writes whose destination is *resolved under `/tmp/web005`* with owned uid and bounded resource. Any unknown path, symlink traversal, unexpected environment-controlled destination or host bind = STOP. No repo modifications to make tests pass.

**G4 future runtime verification:** signed `read_only:true` effective OCI config, rootfs RO, `/workspace` and `/home/node` denied for writes, `/tmp` mounted with correct nonroot mode (e.g. 01777 parent plus restricted per-run directory), actual `HOME/XDG/TMPDIR` paths created inside tmpfs, no unexpected mounts/sockets, no pids/cap creep. Dynamic writable-dir smoke tests require their own permission; this **R23H task forbids running them**.

**Sizing:** 128 MiB `/tmp` is a design placeholder, not capacity guarantee; calculate from G0 sourced test outputs and expected peak use, include node IPC/shm/heap and failure logs. If too small, request a *new explicit* bounded tmpfs design approval; never change to host writable mount by default. Current state `WRITE_PATH_AUDIT_DESIGN_COMPLETE / ALL_TEST_WRITES_NOT_FULLY_PROVEN / G4_STOP_UNTIL_CLOSED`.
