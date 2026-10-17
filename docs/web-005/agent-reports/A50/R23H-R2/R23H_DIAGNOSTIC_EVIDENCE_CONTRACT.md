# WEB-005 / A50 / R23H — DIAGNOSTIC EVIDENCE CONTRACT

**Scope:** prospective PostgreSQL 16 integration diagnosis of immutable C01 `fa3261b2c9510e110ac9eba21726812d3401a525`. All runtime fields currently `NOT_EXECUTED`/null. No Docker, SQL, migration, test run, cleanup or cloud raw-log upload performed.

## 1. Evidence chain and artifact types

Every phase G0/G1/G2/G3-S1/G3-S2/G4/G5 receives an *independent* receipt with: `run_id`, canonical immutable `plan_sha256`, exact C01, effective artifact digests, phase-specific 3-authority approval proof (identity, signature, timestamp, expiry, resource match), command argv redacted (array), UTC start/end, true OS exit/signal, operator, target IDs, clean source/working-copy fingerprint, ownership/rollback references. Never copy an attestation from A20's design as though it were a runtime certificate.

Proposed artifact map:

| Artifact | Issuer/required core fields | When |
|---|---|---|
| `SOURCE_RECEIPT.json` | HEAD, tree SHA, critical blob SHAs, pnpm lock SHA256, tracked-clean flag, complete `*.integration.test.ts` inventory and hashes, Node/pnpm exact versions | G0, after future authorized checkout audit |
| `G0_IMAGE_DIGESTS.json` | OCI registry, authenticated index+linux/amd64 manifest digest, Node image digest, pnpm SHA512, runner image digest, context allowlist/lock/build receipt | G0 after signed GO |
| `G1_PHYSICAL_CERT_REDACTED.json` | Docker host/context and no-host-published-port attestation, container ID/PID/netns, PGDATA volume/name+mount, hashed cluster system ID; role/db/port | G1 after signed GO |
| `G2_OBSERVER_READ_ONLY.json` | approved SELECT-only observer results binding actual PG16 SQL version+role+DB+schema grants to G1 physical certificate; no secrets/data | G2 after signed GO |
| `G3_S1_S2_SCOPE_APPROVALS.json` | independent triple signatures for **S1** and **S2**, exact schema/test DB ownership, 3 DB prefix/creation pattern, migration sources, fixture teardown authority | G3 before G4 |
| `G4_API_STDOUT.redacted.log` and `G4_API_STDERR.redacted.log` | complete sanitized independent byte streams; no raw DSN/rows; UTF-8 conversion noted; may contain TAP failure and stack | G4 after execution and secret review |
| `G4_API_RECEIPT.json` / `API_RECEIPT.json` | command, `native_exit_code`, signal, time, TAP counters, first genuine `not ok` or earliest uncaught error with test name/stack/callsite, raw/local and sanitized hashes, classification | G4 after run, never a prefilled PASS |
| `DB_SCHEMA_DATABASE_FOOTPRINT_BEFORE_AFTER.json` | approved exact owned S1 schema and actual generated S2 DB names, before/after inventory, orphan list, no foreign objects | G2/G4/G5 separately |
| `SHA256SUMS.json` | hash *each published sanitized exact byte file* and receipt; raw private hashes recorded without publishing sensitive bytes | phase receipt and final |
| `G5_ROLLBACK_CLEANUP.json` | exact resource IDs, separate G5 signatures, action/exits, no host modifications; `CLEANUP_HOLD` if any ambiguity | G5 only |
| `CLOUD_REMOTE_READBACK.json` | actual Drive file IDs, remote bytes SHA256 against published sanitized checksum, permissions scope, Windows G: status separate | after approved upload |
| `A24_READINESS_HANDOFF.md`, `A60_INDEPENDENT_QA_HANDOFF.md` | open safety gaps, immutable source+runner+cert links, first failure and classification, discrepancies, GO/HOLD recommendation | after evidence review |

## 2. TAP & process diagnostic semantics

1. Capture outer OS PID, child process group, native exit code and signal with separate **complete raw** stdout and stderr; do not use `tee` or pipeline status as the test exit. `pnpm run test:integration` invokes a nested Node test process via `stdio:inherit`; external collector must gather both streams before finalizing. Monitor truncation/disk-full/incomplete child finalization.
2. Parse Node TAP 13 from stdout with **nested `# Subtest`** support and `not ok <n> - <name>` plus YAML failure block; `# tests`, `# pass`, `# fail`, `# skipped`, `# todo`, `# cancelled`. Do not double-count nested subtests or classify an intentional PostgreSQL negative fixture log as a Node test failure. Keep original line order and raw byte offset/line index to substantiate `first_not_ok`.
3. If no `not ok` but outer exit nonzero, capture earliest meaningful unhandled exception (`Error:`, `ERR_`, process signal, setup/teardown failure), include context and stack; classification `INFRA_CONNECTIVITY`, `ROLE_PERMISSION`, `BOOTSTRAP_MIGRATION`, `API_TEST_ASSERTION`, `RUNTIME_CRASH`, `TAP_TRUNCATED`, `RUNNER_ENVIRONMENT`, or `UNKNOWN`. Do not invent the first failing test from old CI output.
4. Verify executed file inventory equals approved exact recursive C01 `*.integration.test.ts` list. Count of files, omitted file list, source manifest SHA, and test count must be present; if missing, `COVERAGE_UNVERIFIED`, even if TAP looks passing.
5. `DIAGNOSTIC_RECORDED` != `API_PASS`; raw exit 1 with first authentic failing assertion still diagnoses root cause. A60 signs independent classification; A00 retains release gate. On `exit 0`, require complete TAP, zero failures/skips and physical target evidence before considering API QA pass.

## 3. Secret redaction and exfiltration control

**Private local raw** is retained in a restricted nonsynced operator evidence location, ACL 0700 equivalent, expiry and size budget approved. The app runner must not mount Google Drive, Windows project drives, cloud credentials or Docker socket; operator collects output out of band after G4.

**Before cloud publication:** (1) treat *all raw stdout/stderr and error objects as SECRET-BEARING*; (2) sanitize PostgreSQL URI with percent-encoded user/password/query secrets, `PGPASSWORD`/`password=`, Bearer/API keys, `github_pat_`/`ghp_`, JWT, private keys, `SCHEMA_COMPARE_*` DSN values, developer machine/Windows user paths if not needed, fixture rows/PII; (3) schema/DB names and HMAC fingerprints can be shared only if whitelisted; (4) run synthetic canary tests for plaintext and encoded variants; (5) **quarantine entire artifact** if unknown binary/non-UTF8 content, undecidable PII, or canary residual; require operator manual human review before publishing; (6) upload ONLY allowlisted sanitized files; (7) remote readback and hash comparison before `CLOUD_STORED` status. Regex-only redaction cannot guarantee safety and MUST NOT automatically greenlight uploads.

**Hash semantics:** original raw bytes SHA256 are kept privately as evidence; sanitized bytes get **different** SHA256 in Drive manifest. A text-normalized Google Docs export cannot claim byte equality with local raw `.log`; publish raw sanitized files with explicit MIME, fetch their exact bytes, compute SHA256, record returned Drive ID, compare. `LOCAL_G_DRIVE_SYNC_UNVERIFIED` until actual Windows G:\ mounted path hash is checked independently; cloud upload success alone does not establish local mirror.

## 4. Machine receipt schema (values here intentionally null)

```json
{
  "schema": "web005.a50.r23h.api_receipt.v1",
  "run_id": null,
  "status": "NOT_EXECUTED",
  "source_sha": "fa3261b2c9510e110ac9eba21726812d3401a525",
  "source_tree_sha": null,
  "lock_sha256": "8c30be5af6c9a868bf5b24ff3b2ced9ca0b976e66c3366a8e78d9df8229c39ef",
  "plan_sha256": null,
  "phase_approvals": {"G0": null,"G1": null,"G2": null,"G3_S1": null,"G3_S2": null,"G4": null,"G5": null},
  "pg16_physical_certificate_sha256": null,
  "runner_image_manifest_sha256": null,
  "command_argv": ["pnpm", "--filter", "@workspace/api-server", "run", "test:integration"],
  "started_utc": null,
  "ended_utc": null,
  "native_exit_code": null,
  "signal": null,
  "tap": {"tests": null,"pass": null,"fail": null,"skipped": null,"todo": null,"cancelled": null},
  "executed_test_file_list_sha256": null,
  "first_not_ok": null,
  "first_uncaught_exception": null,
  "classification": "UNKNOWN",
  "raw_local_stdout_sha256": null,
  "raw_local_stderr_sha256": null,
  "sanitized_stdout_sha256": null,
  "sanitized_stderr_sha256": null,
  "drive_readback_verified": false,
  "database_tests_executed": 0,
  "reproduction_of_original_CI_failure": "NOT_ESTABLISHED",
  "A60_acceptance": "PENDING"
}
```

## 5. STOP / retention / rollback

At any forbidden source/target/approval/secret/mount/write event, fail closed, record reason and actual stage before abort; never retry using new host/port or widen privileges. G4 fixture teardown (S1/S2) is part of G4's approved mutation scope and may partially fail; report actual orphaned names. **G5 is a separate approval** for independent cleanup of exact resource IDs, after preserving evidence. Never call `docker system prune`, `docker volume prune`, generic `docker compose down -v`, restart native host PG16, or DROP guessed objects. Retain protected evidence per operator/A60 policy and do not claim rollback complete if unknown objects remain.

## 6. A24/A60 future acceptance checklist

**A24:** verify exact PG16, physical cluster/namespace/PGDATA/port, UID/grants, S1/S2 split, test role secret isolation, `read_only` and approved tmpfs, inherited env denial, Docker infra preservation, prior empty cluster.  
**A60:** independently validate C01/runner/OCI digests, signed phase authorizations, file inventory, native exits/TAP/first failure, per-byte raw-vs-sanitized hashes, redaction canaries, cloud readback, G5 footprint and absence of unwanted source/Windows changes.

**Final current status:** `R23H_DIAGNOSTIC_CONTRACT_READY / API_NOT_EXECUTED / PG16_EXECUTION_NOT_AUTHORIZED / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO`.
