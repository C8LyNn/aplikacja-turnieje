# WEB-005 / A50 / R23H — FAIL-CLOSED LAUNCHER DESIGN

**Mode:** security contract/pseudocode, deliberately **NOT EXECUTABLE**. No privileged shell/SQL/Docker invocation is contained here. Exact SHA `fa3261b2c9510e110ac9eba21726812d3401a525`.

## 1. Separation of trust domains

- **Operator/A00/A20** independently verify phase-specific approval **signatures** and exact immutable plan SHA; a JSON boolean, URL or image label cannot prove signer identity. A24 verifies environment and S1/S2 role/grants; A60 independently verifies evidence. A50 launcher is a technical guard, not the signer or authorizer.
- **Control plane** (operator-controlled, future approved G0/G1/G2) checks Docker engine identity, container/volume/image digests, PGDATA physical certificate and network mode independently. App runner may only consume a **signed, verified read-only attestation** with fixed exact identifiers. Do not give runner Docker socket or PG bootstrap superuser credentials.
- **Data plane** (future G4-only) executes Node test command exactly once *after* external attestation; it cannot inspect host Docker without a socket, so cannot independently establish physical isolation using just `127.0.0.1` or a local URL. Such validation must be proven by operator/A24 independent G2 data.
- No GO present now. Set `RUN_AUTHORIZED=false`, all phase results `NOT_EXECUTED` in design artifacts.

## 2. Before-fork checks (must all succeed, else STOP without any API test or DB contact)

| Gate | Exact future match | Failure |
|---|---|---|
| L00 | Phase G0/G1/G2/G3-S1/G3-S2/G4 signatures from A00/HQ, A20, operator validated by trusted external checker; same plan SHA, run_id, expiry, exact resources | `STOP_APPROVAL_MISSING_OR_UNTRUSTED` |
| L01 | One canonical A20-R2 Option A Compose SHA, **not** older bridge/host-publish example; `ports=[]`, PG `network_mode=none`, runner `network_mode=service:pg16` | `STOP_TOPOLOGY_DRIFT` |
| L02 | Exact PG container ID/PID/netns inode/PGDATA mounted volume/system ID, immutable image digests, Docker context, no host 5432/55432 publication; fresh G1/G2 read-only physical cert and no identity change | `STOP_PHYSICAL_ATTESTATION_MISMATCH` |
| L03 | Git HEAD exact C01, clean tracked checkout, matching **root tree + test blobs**, full integration test inventory, pnpm-lock SHA256 `8c30be5af6c9a868bf5b24ff3b2ced9ca0b976e66c3366a8e78d9df8229c39ef` | `STOP_SOURCE_DRIFT` |
| L04 | Node `v22.23.3`, pnpm `10.34.7`, linux/amd64 pinned Node and runner digests, frozen install already done at G0, `BuildTypes` already emitted declarations | `STOP_TOOLCHAIN_OR_BUILD_NOT_ATTESTED` |
| L05 | Runtime rootfs RO, no writable `/workspace`, no host bind, only signed tmpfs paths, uid=node, effective no-new-privileges and cap-drop, adequate resource cap | `STOP_RUNNER_FS_OR_PRIVILEGE` |
| L06 | Fully isolated PG test role `NOSUPERUSER NOCREATEROLE NOREPLICATION NOBYPASSRLS`; S1 own fresh tm_test nonce and S2 explicit `CREATEDB` window for 3 ephemeral DBs, no foreign preexisting names | `STOP_S1_S2_SCOPE` |
| L07 | Exactly `TEST_DATABASE_URL` (constructed in runner from private test secret), `127.0.0.1:55432`, base DB `web005_c01_test_<nonce>`, schema `tm_test_<nonce>`, reset literal `DROP_TM_TEST_SCHEMA`; URL decode/canonical comparison; permitted `NODE_ENV=test` | `STOP_DB_TARGET_MISMATCH` |
| L08 | Inherited environment allowlist only; no inherited `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGPASSFILE`, `PGSERVICE`, `PGSERVICEFILE`, `PGDATABASE`, `PGOPTIONS`, `PGCONNECT_TIMEOUT`, `NEON_DATABASE_URL`, `DIRECT_URL`, `SCHEMA_COMPARE_*`, `DOTENV_CONFIG_*`, custom loader/`NODE_OPTIONS` | `STOP_FORBIDDEN_PARENT_ENV` |
| L09 | No alternative libpq URI/socket/host fallback, no unapproved `.env` loader/module injection; secrets are readable only in private G4 runner; effective env **names and fingerprints only** logged | `STOP_ENV_TAINT` |
| L10 | Writable-path census completed by A50+24/60 and positive-approved tmpfs plan; current unclosed unknown writes are **blocking** | `STOP_G4_RUNNER_FILESYSTEM_WRITES` |
| L11 | Local **restricted non-Drive** raw log capacity, redaction plan, validated first-error extractor, final hash manifest exporter and cleanup plan | `STOP_EVIDENCE_NOT_READY` |

**Important conflict resolution:** The C01 `lib/db/src/index.ts` opens a PostgreSQL Pool directly from `DATABASE_URL` if imported; do **not** supply a host-origin `DATABASE_URL`. Some integration paths may need a test-derived `DATABASE_URL` to import `@workspace/db`. If proven by exact-source import analysis, A20 must explicitly approve an *internally constructed alias* equal to the certified **same disposable test DB**; an absolute prohibition of all `DATABASE_URL` could produce false failures. This exception is **NOT pre-approved** and must be gated, signed and tested without expanding target scope. S2 fixture may set its own `SCHEMA_COMPARE_*` in a scoped child; do not prohibit that known internal behavior.

## 3. Future G4 state machine (illustrative, non-running pseudocode)

```text
state := HOLD
verify_external_signatures_or_STOP()       # manual/cryptographic verifier, trusted identities
assert_no_prior_G4_run_for_plan_or_STOP()
assert_source_images_tools_cert_or_STOP()
assert_physically_attested_pg16_or_STOP()   # external observer's signed G1/G2 facts
assert_s1_s2_grants_and_owned_objects_or_STOP()
reject_foreign_inherited_env_or_STOP()
construct_PRIVATE_TEST_URL_from_signed_cert_and_secret_or_STOP()
assert_readonly_mounts_and_tmpfs_write_census_or_STOP()
prepare_private_raw_evidence_sink_or_STOP()
state := G4_READY                  # NOT an approval by itself
spawn_exact_command_once_approved_by_operator:
    [pinned_node22, pinned_pnpm10_cli, '--filter', '@workspace/api-server',
      'run', 'test:integration']
    cwd := /workspace
    stdout/stderr := distinct raw append-only local sinks
    process_exit := OS waitpid / signal handling, not shell pipeline status
capture_first_not_ok_and_earliest_uncaught_exception()
write_machine_receipt_with_real_exit_and_full_TAP()
redact_and_quarantine_outputs_for_human_review()
state := DIAGNOSTIC_RECORDED    # even when test suite exit!=0
G5_cleanup_requires_NEW_approval_and_exact_owned_object_ids()
```

Only full unmodified integration command counts as original CI reproduction. S2 missing -> STOP not partial run. No automatic retry, no `--test-name-pattern`, no altered assertions/migrations, no parallel test split or force-cleanup. The nested Node runner uses `stdio:inherit`, so outer stdout/stderr capturing can preserve all output if started as a process with dedicated pipes; capture all child processes' final signal and actual outer code. Force-kill only after separately approved timeout; report timeout as `RUNTIME_TIMEOUT` not assertion failure.

## 4. Secure environment construction

- Begin with a **minimal explicit env map** (not `{...process.env}`): `PATH` only image binaries; stable `LANG=C.UTF-8`, `TZ=UTC`, `NODE_ENV=test`, required HOME/XDG/TMPDIR under tmpfs. Drop runtime package-manager auto-install and programmatic dotenv loads; no network egress, no `NODE_OPTIONS` inherited.
- Test secret is loaded from approved `/run/secrets/pg_test_password` **without printing**. Construct percent-encoded DSN for exactly certified role/127.0.0.1/55432/base DB (and optional identical DATABASE_URL alias only after G3/G4 approval). Enforce no query-string overrides for host/port/service; add schema search_path only as per original C01 helper. Validate role/database/schema nonce exactly.
- Explicitly recognize difference between exact `TEST_DATABASE_SCHEMA` string and PostgreSQL URL `options=-c search_path=...`; reject unapproved `PGOPTIONS` inherited. C01 uses `NODE_TEST_CONTEXT` set by Node `--test`, not a user-supplied gate flag.
- Never log secret path bytes, DSN, password, partial tokens. Environment receipt records only safe keys or salted key-presence fingerprints; keep salt private to evidence folder.

## 5. Source immutability and coverage

Expect HEAD and `git status --porcelain` clean **before build**. After built image, `git` may not be copied; compare signed **positive manifest** of all Git-tracked files and `git ls-tree` against in-image read-only tree, excluding only separately enumerated generated build outputs; record immutable input file hashes. The lockfile SHA must match both prior Windows receipt and in-image bytes. Image `LABEL web005.source_sha` alone is untrusted metadata. A24/A60 independently review exact test file inventory including S2 and no accidental opt-in lib/db destructive suite.

**Current state:** launcher contract is prepared as source design; neither approval verifier nor runtime launcher is implemented/validated on Linux. `LAUNCHER_DESIGN_READY / IMPLEMENTATION_UNVERIFIED / ALL_PHASES_HOLD`.
