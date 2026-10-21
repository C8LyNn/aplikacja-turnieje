# WEB-005 / SWARM-005 — A30 W6F-R3 — PR #143 INDEPENDENT SECURITY QA

**Role:** A30 — Security Coordination. **Task:** `WEB005-W6F-R3-A30-PR143-SECURITY-QA`. **Date:** 2026-10-21.  
**Verdict:** **`SECURITY_HOLD`** for shared diagnostic-log publication / real API replay. **Reason:** three reproducible synthetic failures on quoted Bearer redaction, plus Windows TEMP/DACL security not attested. **Not evidence of a real credential incident.**  
**Reviewed target:** [Draft PR #143](https://github.com/C8LyNn/aplikacja-turnieje/pull/143), **BASE frozen C03** `80bb4ca7a9a359fbe76dbab1478a1af16ded0174`, **HEAD** `f7e2abfd60b94b31be138becc8763b82239c3145`, OPEN/DRAFT at review. No C03 change. Exactly three added `qa/pack17` files, no source SQL/API/CI changes.  
**Checked Git blobs:** `qa/pack17/private-api-evidence.mjs` = `c4840222f8210e3111f827be90806c066c7d06c6`; `qa/pack17/private-api-evidence.test.mjs` = `98ee27c7573f7042350ba4f5f88c81773c7f582c`; `qa/pack17/replay-api-evidence.mjs` = `06ac16b2b8cce7063996c44e28f6b610b03ee6c7`. Independent local security tests used a **byte-exact, `git hash-object` verified copy** of the recorder blob, not a rewritten stand-in; upstream author-side `21/21 PASS` is a separate, not independently replayed by A30, receipt.

## 1. Executed synthetic DB-free tests — true result
- Environment: **Linux Node v22.16.0, Git 2.47.3**, isolated scratch; *zero real secrets*. Local exact source Git blob matched `c4840222f8210e3111f827be90806c066c7d06c6`.
- Command: `cd /mnt/data/web005_a30_w6f_r3 && node --test --test-reporter=tap a30-security.test.mjs > a30_security.tap 2>&1` → **process exit 1; 12 tests, 9 PASS, 3 FAIL, 0 skipped/todo/cancelled**. `node --check private-api-evidence.mjs` → exit 0.
- TAP SHA256 **`49ba1936c433305d805e680d6f6b7f53a5b81b5c5606b8ac765c4788838294ae`**; evidence ZIP **`WEB005_A30_W6F_R3_SECURITY_EVIDENCE.zip`** SHA256 **`74aeab2aba67b7ab04b945f4f378cd27097d061846568912e89fce6370e15aa3`**, recorded as a private conversation artifact (NOT uploaded to GitHub/CI).
- PASS on synthetic ordinary/padded/quoted Basic, ordinary unquoted Bearer/Proxy, PostgreSQL and HTTPS URL userinfo, `PGPASSWORD` and `API_KEY`, supported redacted first TAP failure + stderr, SHA256 equivalence of preserved raw files, Linux directory `0700` / file `0600`, 400-char bound, no raw path in receipt, counters-only TAP fail-closed.
- **FAIL A30-03:** `redactEvidence('Error: Authorization: Bearer "SYNTHONLY.abc_123"')` retains the quoted synthetic token.
- **FAIL A30-04:** `redactEvidence("not ok 1 - Proxy-Authorization: Bearer 'SYNTHONLY.abc_123'")` retains the single-quoted synthetic token.
- **FAIL A30-08 (end-to-end recorder path):** a child writing `Error: Authorization: Bearer "SYNTHONLY.abc_123"` to stderr results in `receipt.json` with the synthetic token in `summary.firstDiagnostic`. The replay CLI later prints `firstDiagnostic` into shared `W6F_API_REPLAY` JSON; the leakage route is source-confirmed. The receipt itself is local/private by design; this issue is that its field is **not actually redacted**.

**Root cause:** source `redactEvidence` handles optional single/double quotes **for Basic**, but Bearer uses `/\bBearer\s+[A-Za-z0-9._~+/-]+/gi` and does not consume any quoted token. A30's 3 negative FAIL outcomes are **intentional security assertions**: do not report them as QA PASS or regression of TAP parser. Standard Basic and ordinary Bearer PASS do not supersede them.

## 2. Raw stdout/stderr and receipt confidentiality

- `capturePrivateEvidence` streams **complete unredacted raw** `stdout.raw` and `stderr.raw` to `mkdtempSync(join(tmpdir(), 'web005-api-private-'))`; SHA256s cover complete bytes, and `receipt.json` carries bounded first failure, diagnostic and source/exit/counter/digest metadata. Keeping raw complete is diagnostically justified, **but those files must never be public CI artifacts, GitHub attachments or unreviewed handoffs**.
- POSIX code writes mode `0600` and attempts `chmodSync(folder,0700)`. **A Linux synthetic test passed these mode checks, but this does not verify a Windows NTFS DACL**. The Windows-effective ACL is not inspected, `chmodSync` failure is swallowed, and files remain on disk without in-code retention/cleanup. Therefore the source does **not** establish Windows confidentiality.
- `replay-api-evidence.mjs` correctly requires an exact approved HEAD SHA, operator flag and `assertSafeTestDatabaseEnv`, but the recording function falls back to **inheriting process.env** if no explicit environment is passed. It neither proves network/PG16 isolation nor guarantees no inherited production secrets. No database replay was authorized or executed.
- **Reproduction scope:** no personal credentials used; the string `SYNTHONLY.abc_123` is an invented literal.

## 3. A50 minimal code/test action, A60 and operator follow-up

**A50 (code owner):** in `qa/pack17/private-api-evidence.mjs` add **minimal test-first masking** of quoted Bearer token values (single and double quote), mirroring the existing quote-safe Basic treatment. Extend `private-api-evidence.test.mjs` with negative examples for quoted Bearer in first failing TAP stdout, stderr `Error:` and complete receipt/public `W6F_API_REPLAY` fields. Preserve bounded 400-char excerpts, raw-file SHA256, true exit code, streaming, forged-TAP rejection and large-buffer path. Do not rewrite the whole parser. Publish new exact HEAD and real Node test-first RED/GREEN receipts. A30 rechecks the changed exact blob; A60 owns independent parser/integration synthetic QA.

**A20/named Windows operator (BEFORE any real API replay):**
1. Verify resolved `os.tmpdir()` is on a trusted **local NTFS volume**, not a UNC share, junction, symlink/reparse point or public/common temp folder. Choose a secure per-user evidence root by explicit configuration/preflight rather than relying on a generic inherited TEMP.
2. Inspect *effective* DACL/owner with **read-only** PowerShell `Get-Acl -LiteralPath <exact-private-folder>` and `icacls <exact-private-folder>` and independently inspect `stdout.raw`, `stderr.raw`, `receipt.json`. STOP for broad read ACEs (Everyone/Users/Authenticated Users/untrusted identities), unexpected inheritance or ownership; do not treat Unix-style `chmod` as proof. Do not print ACLs with usernames to shared logs if sensitive.
3. Confirm selected account, no inherited production DB/PG/REPLIT/DEPLOYMENT env (check *names only*), approved exact instrumented source SHA, separate disposable PG16 and G0–G4 authorization. Inspect byte counts, SHA256 and TAP/exit after run; raw outputs remain private, excluded from sync/backup/public artifacts. Define review-limited retention and approved exact-folder cleanup. **None performed by A30**.
4. Make permission inspection **fail closed before recording real secrets**; any inability to verify ACL or secure path means `OPERATOR_REQUIRED / SECURITY_HOLD`, never conditional automatic GO. Windows host/DACL and any real raw output: **NOT_RUN**.

## 4. Narrow handoff
| Field | Result |
|---|---|
| STATUS | **DONE review / SECURITY_HOLD acceptance** |
| Source BASE → HEAD | C03 `80bb4ca7a9a359fbe76dbab1478a1af16ded0174` → PR143 `f7e2abfd60b94b31be138becc8763b82239c3145` |
| Changed by A30 | **Documentation only**; no A50 source, C03, SQL, GitHub workflow or tests in repo modified |
| Test | `node --test --test-reporter=tap a30-security.test.mjs` exit **1**, **9 PASS / 3 FAIL**, TAP SHA256 above; syntax exit 0 |
| Blocking defect | Quoted Bearer leaked into `redactEvidence`, TAP first failure and receipt's `firstDiagnostic` |
| Other blocker | Windows TEMP/NTFS ACL and retention **OPERATOR_REQUIRED / NOT_RUN** |
| Next owners | **A50** minimal redaction fix, **A30** renewed security review, **A60** independent parser QA, **A20 + Windows operator** ACL evidence, **A00** approvals |
| Integration verdict | `SECURITY_HOLD / PR143_NO_REAL_REPLAY / C03_FROZEN / PG16_G0_HOLD / SWARM006_HOLD` |

This security verdict is not a general R23H audit. It does **not** assert that A50's TAP parser tests failed, and it grants no PG16/replay, merger, deployment or release authority.
