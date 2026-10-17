# WEB-005 / A20 / R23G — PG16_ROLLBACK_AND_CLEANUP

**Task:** `WEB-005-T020-A20-R23G-DOCKER-PG16-ISOLATION` · **Date:** 2026-10-17 Europe/Warsaw · **Type:** read-only operations design · **Signatures:** A00/HQ+A20+Windows operator required for every state-changing cleanup. **State:** `NOT_EXECUTED`.

## 1. Hard invariant

**Never touch native Windows PostgreSQL `postgresql-x64-16` on `127.0.0.1:5432` or `[::1]:5432`. Never delete an object because its name merely resembles `web005`, `tm_test_*`, `postgres` or the project.** Source under test remains original C01 SHA `fa3261b2c9510e110ac9eba21726812d3401a525`. Operator operates exclusively on new Docker resources created after G1 per-run signed identity manifest, on **the identical verified Docker context**.

## 2. Before creation — no-op rollback design

Before G1, operator must document:
- exact disposable Compose `project` / run ID, Docker context+host ID, intended container and **one new named PGDATA volume**, image digests and local scratch paths; verify all exact names **DO NOT EXIST** in current context;
- fresh PostgreSQL cluster identifier after G1 (out-of-band), data-dir/volume inode/ID, isolated TCP namespace PID and port **55432 inside**;
- **no host published port**, native Windows service state and PID unchanged, no host data mounts or production route;
- encrypted or operator-access-controlled snapshot of **disposable test baseline only** before G3; no import/copy of live user data;
- allowed **S1** named disposable schema + **S2** three generated owned DBs, exact API command, operator-only cleanup/noop escalation contract;
- snapshot and evidence retention policy, expiry, low-disk and interrupted-process procedure.

If before state contains existing `pgdata` with nonzero user data, foreign container/DB, other project labels or mismatched Docker context, **STOP before G1**, never repurpose it.

## 3. Failure class -> response (no automatic state change)

| Failure point | Report and what is allowed only after separate written cleanup GO | Never do |
|---|---|---|
| G0 hash/digest/provenance mismatch | `STOP_SHA`, no Docker actions; archive read-only observations | Pull random latest image / patch C01 |
| G1 cannot create/verify cluster, port/volume, Windows service changed | Stop preparing; operator investigates OS/container processes, preserves logs, may delete only exact newly created G1 resource IDs after G5 consent | Restart existing Windows PG, kill host PID, prune volumes |
| G2 observer/cert mismatch | `STOP_WRONG_INSTANCE` no schema SQL, no test; retain instance for independent check, then operator G5 exact cleanup | Switch DB URLs until something works |
| G3 S1 reset denied or unexpected schema exists | No test; preserve baseline; owner decides whether fresh run ID required | `DROP SCHEMA` guessed name |
| G3 S2 CREATEDB/three DB denied or existing fixture db collision | Full API suite MUST NOT RUN; report scope blocked; revoke temporary privilege if already granted via operator G5 | Quietly omit S2 test or run on host 5432 |
| G4 migration/fixture exception, TAP failure, process crash, OOM | Capture raw local evidence and sanitized logs FIRST, stop all further tests/retries, classify infra vs application only with evidence; operator decides restore disposable baseline snapshot or *full new* sandbox | Alter assertions, skip, widen rights, migrate live |
| G4 app tests pass | Independently inventory S1+S2 poststate, secure logs, then G5 cleanup on exact list | Treat green as C02/release approval |
| Cloud folder unavailable / hash readback missing | Keep immutable redacted local scratch, mark `CLOUD_SYNC_UNVERIFIED`, postpone cleanup until evidence preservation authorized | Claim Drive sync from local folder existence |
| Docker/PG volume ownership drift on G5 | `CLEANUP_HOLD`, no destructive command, escalate to Windows operator + A00 | `docker system prune`, `docker volume prune`, `down -v` without per-resource proof |

## 4. G5 ordered clean shutdown / exact identity requirement

**Only after A00+A20+operator G5 approval scoped to the exact immutable G1 manifest:**
1. A50 hands off native exit/TAP/first error and local raw logs in owner-private ACL directory. Operator creates redacted copies; obtains SHA256 and Drive IDs, verifies remote content/readback against local bytes. No secret/DSN/player data to Drive.
2. Operator verifies G1 container/runner IDs, labels, project ID, network namespace and volume IDs still match; enumerate all DBs/schemas on **certified disposable cluster only**; protect foreign/unowned objects even if names match convention.
3. Stop **only per-run test runner**; close its pools cleanly and confirm no hung work. Allow fixture's own teardown only within signed S1/S2 execution scope. A failed fixture `DROP DATABASE WITH (FORCE)` is not automatically retried on an unknown target. If leftover resources exist, classify `CLEANUP_PENDING` and require their real owners/IDs and independent evidence.
4. Capture postrun S1 and S2 object list. To restore, **prefer operator-owned disposable cluster snapshot/recreation** to manual cleanup SQL. Do not run arbitrary `DROP/TRUNCATE`; if future operator chooses exact SQL cleanup, it requires *new* separate G5 approval with owner signed object IDs/names.
5. Stop ONLY the exact G1 PostgreSQL container; verify PID and listener (inside namespace) gone. Delete ONLY the uniquely labelled, G1-created Compose project resources explicitly listed. To remove named volume, require equality of actual Docker volume name, ID, creation timestamp and run labels with signed G1 record. **No wildcard/host-root cleanup**.
6. Post-cleanup re-inventory Docker context; verify Windows `postgresql-x64-16` still running and both `127.0.0.1:5432`, `[::1]:5432` unchanged from operator baseline. Confirm no host 55432 publish/forwarder, no leftover S2 databases in cluster (or cluster is fully destroyed by exact-object proof).
7. Operator signs `G5_CLEANUP_RECEIPT` with exact commands, true exits, redacted evidence; A60 later reviews, A00 keeps C01/C02 gates independently.

**Operator-only cleanup commands are intentionally NOT embedded as copy/paste executable destructive commands in this design.** After real G5 consent operator produces exact-ID commands from signed manifest; a template `docker compose down --volumes` on wrong context is **forbidden**.

## 5. Windows Google Drive reporting and SHA boundary

Proposed folder: `G:\Mój dysk\ChatGPT\WEB-005\Raporty\PG16_DOCKER_ISOLATION\`. Never store raw DB password/URL, host secrets, tokens, production rows in sync root. Sanitize in private scratch, hash UTF-8 redacted bytes, write to local Drive path (operator only). Then verify **actual cloud file identity and bytes via Google Drive readback**, not mere local file appearance. If creating Google Docs surrogate copies, Google document **text digest** isn't byte-equivalent to original `.md` unless exported raw and hashed — record both separately. Re-check Windows mirrored files later; otherwise `LOCAL_DRIVE_SYNC_UNVERIFIED`. Source GitHub blob SHA-1 != raw SHA256 and cannot substitute for remote data verification.

**Rollback actually performed in R23G:** **NONE**. No Docker object/image/container/volume, DB/schema/role, migration or integration test was created by A20; folder/document publications are not DB state changes.

**Status:** `ROLLBACK_DESIGN_READY / CLEANUP_G5_NOT_AUTHORIZED / NATIVE_WINDOWS_PG_UNTOUCHED`.
