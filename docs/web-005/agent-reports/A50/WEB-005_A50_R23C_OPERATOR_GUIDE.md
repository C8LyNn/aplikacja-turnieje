# WEB-005 — A50 R23C: Windows 11 operator guide

**Task:** `WEB-005-T131-A50-R23C-NATIVE-EXECUTOR` · **Status:** `RUNNER_READY_AWAITING_HOST`.

Artifacts: [Executable PowerShell runner](./WEB-005_A50_R23C_EXECUTOR.ps1), [exact-SHA pin matrix](./WEB-005_A50_R23C_EXECUTION_PINS.json), [A40 composite B1 manifest](../A40/WEB-005_A40_R23C_COMPOSITE_B1_MANIFEST.json).

## Prerequisites / owner authorization

Run on a trusted **Windows 11 + PowerShell 7+** computer or VM with Node **22.x**, pnpm **10.x**, Git, full approved Git repo/mirror with desired commit objects, and permissions for an isolated disposable checkout and a **separate**, access-controlled evidence folder. Windows PowerShell 5.1 is not supported. Obtain explicit owner/A00 authorization for both **non-destructive unit tests** and **dependency installation/lifecycle scripts**. To enforce that, runner requires `-AuthorizeRun -AllowInstall`. Never pass production/shared secrets, a production DATABASE_URL, or any real customer backup.

The runner uses a **LOCAL** Git source only: it clones into a new unique folder, checks exact detached SHA, clean checkout and lockfile, runs `pnpm install --frozen-lockfile` only with GO, verifies lock hash unchanged, and then executes allowlisted DB-free tests. It does not touch original PRs, call SQL, rerun GitHub Actions, merge or deploy. It explicitly excludes Pack17 `--full` and all Basket CAS/PG16 integration.

## One-time source preparation, on authorized Windows host

Place the reviewed [runner file](./WEB-005_A50_R23C_EXECUTOR.ps1) inside `C:\WEB005\scripts` using your authenticated repo; inspect it before running. Ensure work/evidence folders are not inside the repo or each other.

~~~powershell
node --version
pnpm --version
git --version
pwsh --version
git clone --mirror https://github.com/C8LyNn/aplikacja-turnieje.git C:\WEB005\source-mirror.git
git -C C:\WEB005\source-mirror.git fetch origin refs/pull/60/head:refs/heads/a50-composite-b1
git -C C:\WEB005\source-mirror.git fetch origin refs/pull/56/head:refs/heads/a50-pr56
git -C C:\WEB005\source-mirror.git fetch origin refs/pull/57/head:refs/heads/a50-pr57
git -C C:\WEB005\source-mirror.git fetch origin refs/pull/58/head:refs/heads/a50-pr58
git -C C:\WEB005\source-mirror.git cat-file -e 'fa3261b2c9510e110ac9eba21726812d3401a525^{commit}'
~~~

## Actual A40 first composite B1 — exact PR60

Verified draft [PR60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) HEAD **`fa3261b2c9510e110ac9eba21726812d3401a525`**, parent `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; 14 blob-exact files from PR35/36/40/56/57/58. The `CompositeA40` runner profile **rejects any other SHA**.

After obtaining GO, run this **single PowerShell command**:

~~~powershell
pwsh -NoProfile -File C:\WEB005\scripts\WEB-005_A50_R23C_EXECUTOR.ps1 -RepositorySource 'C:\WEB005\source-mirror.git' -WorkspaceRoot 'C:\WEB005\isolated' -EvidenceRoot 'C:\WEB005\evidence' -Profile CompositeA40 -ExpectedSha 'fa3261b2c9510e110ac9eba21726812d3401a525' -Suites Pack19to26,Pack17Pure,BackupStrict,BackupProfile,Swiss,ApiTypecheck,FrontendUnit -AllowInstall -AuthorizeRun
~~~

Tests: Pack19–26 source contracts **plus their explicit non-destructive unit fixtures**; `qa/pack17/gate-contract.test.mjs` **pure**, never `--full`; Backup strict-policy, raw Backup profile-gate, Swiss S3/S4, API typecheck and selected frontend unit tests. Test selection is explicit; any missing selected suite on composite gets `SKIP_NOT_IN_THIS_SHA` and **cannot** make a full PASS.

Existing **automatic** [A40 PR60 GitHub run 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793) already reached successful Pack19–26 source gates and Pack17's source/PG16-ephemeral/typecheck gates, but ended **API integration exit 1** and did **not** finish frontend/build gates. This historical CI receipt is not an A50 local run or authorization to repeat destructive tests.

## Independent PR testing (separate checkout for each invocation)

~~~powershell
# Backup strict PR56
pwsh -NoProfile -File C:\WEB005\scripts\WEB-005_A50_R23C_EXECUTOR.ps1 -RepositorySource 'C:\WEB005\source-mirror.git' -WorkspaceRoot 'C:\WEB005\isolated' -EvidenceRoot 'C:\WEB005\evidence' -Profile PR56 -ExpectedSha 'a7f71a7e7efdabd479b358a3cee80bc6359c4321' -Suites BackupStrict,ApiTypecheck -AllowInstall -AuthorizeRun

# Swiss PR57
pwsh -NoProfile -File C:\WEB005\scripts\WEB-005_A50_R23C_EXECUTOR.ps1 -RepositorySource 'C:\WEB005\source-mirror.git' -WorkspaceRoot 'C:\WEB005\isolated' -EvidenceRoot 'C:\WEB005\evidence' -Profile PR57 -ExpectedSha 'a57fe31c1bc123c5217b3f58bcdd34750c64c5c6' -Suites Swiss,ApiTypecheck -AllowInstall -AuthorizeRun

# Backup raw profile gate PR58
pwsh -NoProfile -File C:\WEB005\scripts\WEB-005_A50_R23C_EXECUTOR.ps1 -RepositorySource 'C:\WEB005\source-mirror.git' -WorkspaceRoot 'C:\WEB005\isolated' -EvidenceRoot 'C:\WEB005\evidence' -Profile PR58 -ExpectedSha 'e8100f7b0c1071c2a98880d4eb7947514fc58185' -Suites BackupProfile,ApiTypecheck -AllowInstall -AuthorizeRun
~~~

## Evidence, STOP rules, and process exits

Each run creates **new** `C:\WEB005\isolated\WEB005_<profile>_<sha>_<unique>` checkout and **separate** `C:\WEB005\evidence\WEB005_A50_<profile>_<unique>`. Evidence includes complete sanitized step logs `NN_*.log` and `receipt.json`. Receipt fields: expected/observed SHA, lockfile SHA256, runner SHA256, versions, actual commands/exit, per-test Node TAP PASS/FAIL/SKIP and aggregate, classified failures, log paths/digests and timestamps. No locally executed step is marked PASS without a real process exit 0.

Runner process exit: **0** = all selected **present** safe suites exited 0; **3** = some selected suites missing/skipped on composite/custom; **2** = environment, SHA, lockfile, authorization, contract, typecheck or unit failure (or zero tests). It fails closed on the first failed step. Classifications include `ENVIRONMENT_FAILURE`, `SOURCE_CONTRACT_FAILURE`, `FEATURE_TEST_FAILURE`, `TYPECHECK_FAILURE` and `SHA_GATE_STOP`, `DB_SAFETY_STOP` etc. Full output is preserved **after best-effort credential redaction**; review files before sharing. Do not commit runtime logs to GitHub.

**A00 and A60** should receive `receipt.json` and sanitized logs via an approved channel, independently verify the current exact HEAD and classify any failures before further implementation.

## PostgreSQL 16 hard STOP

PR55 invokes `resetTestSchema` and `dropTestSchema` (actual `DROP SCHEMA CASCADE`). Pack17 `--full` also touches PostgreSQL. The runner has **no option** to execute either. A future *separate* owner/A00 and A20 written GO is needed for a physically proven isolated disposable PostgreSQL 16 host, test-only role, dedicated `TEST_DATABASE_URL`, explicit `tm_test_*` schema and documented reset scope. No fallback to shared/prod `DATABASE_URL`.

**Current state:** `RUNNER_READY_AWAITING_HOST / RELEASE_NO_GO / SWARM006_HOLD`. Publication of a script is not execution.