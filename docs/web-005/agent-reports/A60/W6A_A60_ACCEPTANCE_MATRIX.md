# WEB-005 / W6A — A60 ACCEPTANCE MATRIX (W6A_HANDOFF)

- **Task ID:** WEB005-W6A-A60-INDEPENDENT-QA
- **Role:** A60 — Independent QA & Release Gates (identity derived from direct assignment in this thread)
- **Date:** 2026-10-19 (Europe/Warsaw)
- **Status:** **PARTIAL** — independent source acceptance #129 completed; A50 NEW HEAD unavailable, full isolated checkout/operator unavailable
- **Modes:** SOURCE_ONLY / DB_FREE / READ_ONLY; no application code changed
- **Final verdict:** **CONDITIONAL SOURCE REVIEW PASS for one #129 test blob; #105 NEEDS_FIX; C03/API/RELEASE HOLD. NO C04 GO.**
- **Source of dispatch:** https://docs.google.com/document/d/1ujc0yc5MRoe4wPr07y9op029B8s8U8rGd9TNhJB-AEs/edit

## Exact active references — verified in GitHub on this W6A review

| PR / content | BASE full SHA | HEAD full SHA | Role/branch |
|---|---|---|---|
| #60 C01 | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | `fa3261b2c9510e110ac9eba21726812d3401a525` | integration/web-005/r23c-composite-b1-20261015 |
| #101 C02 | `fa3261b2c9510e110ac9eba21726812d3401a525` | `a5bfd07b822c223fd995604dc2e228935ab81498` | integration/web-005/c02-dbfree-pure-source-20261018 |
| #134 frozen C03 | `a5bfd07b822c223fd995604dc2e228935ab81498` | `80bb4ca7a9a359fbe76dbab1478a1af16ded0174` | integration/web-005/wave4-c03-pr100-dbfree-20261018 |
| #129 A90 test-only | `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4` | `35449b148aa782139a5327164cb6ed5d6aa3bfdd` | test/web-005/a90-wave3-raw-preclone-strict-boundary |
| #105 A50 redaction | `fa3261b2c9510e110ac9eba21726812d3401a525` | `be2b9557e7c555925b1c1e64755042e35c536932` | fix/web005-c01-api-first-failure-evidence |
| #142 A120 route | `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` | `b289cbd75ebc828d3e562eabef5ae40d1e92cce5` | fix/web-005/a120-w5r-route-async-exists-20261018 |
| #135 A20 readiness | `1db3734b8988940acc6be8b992420a58fc39624a` | `cb261868f68b5bab3559398e514013dbd2a21078` | feat/web005/a20-wave4-local-readiness-20261018 |
| #103 route parent | `1db3734b8988940acc6be8b992420a58fc39624a` | `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` | feat/web-005/a120-development-first-static-route-policy-20261018 |
| #120 route sibling | `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` | `e97e9d582e76cc4c4b6ba5bb784c89feb6be50ab` | test/web-005/a120-wave2-presentation-route-reload-20261018 |
| #116 Replit stop | `1db3734b8988940acc6be8b992420a58fc39624a` | `e89798e5a553c738428d61e37a20dc72685f7e8e` | feat/web005-a140-development-first-preservation-20261018 |

All checked PRs were DRAFT and unmerged. No ref changes detected at final #105 / #129 recheck; A50 corrected W6A redaction head **NOT AVAILABLE**.

## Acceptance matrix — separate four evidence dimensions

| Component / exact SHA | SOURCE | NATIVE DB-FREE | API+PG16 | BROWSER+LIVE |
|---|---|---|---|---|
| C03 #134 `80bb4ca...` | **PASS: frozen 2 paths, inherited PR100 blobs** | **PARTIAL: historic targeted adapter 20/20 receipt; workspace typecheck PASS; isolated independent complete C03 rerun NOT_RUN** | **FAIL: full Actions 39133034753 API integration exit 1; first failing named TAP UNKNOWN** | **NOT_RUN / Replit published bytes UNKNOWN** |
| #129 `35449b...` single test addition | **PASS: independently reviewed Git blob `643fcc876d793b9d86c5d3700f599c4eab88c8db`; 18 cases; no own runtime/IO authorizing behavior** | **PASS in official exact-head GitHub Actions 39133733273: 18/18 named cases, typecheck PASS. A60 local native exact-head execution NOT_RUN** | **FAIL for entire #129 workflow: inherited API integration exit 1, not attributable to this test** | **NOT_RUN; no HTTP/real exporter/importer coverage** |
| #105 `be2b955...` existing diagnostics | **FAIL A30 confidentiality oracle: quoted Basic credential not redacted** | **Existing A60 23/23 plain-pattern + 3/3 exit PASS; A30 independent security-negative 5/10 PASS, 5 FAIL true exit1; no new corrected SHA; A60 W6A rerun NOT_RUN** | **UNKNOWN/NOT_RUN; original C01 API first failing assertion UNKNOWN** | **NOT_RUN** |
| #142 `b289cbd...` pure routing | **PASS prior W5R; unwired pure helper** | **Prior A60 independent 17/17 PASS, not duplicated** | **NOT_RUN** | **NOT_RUN: no real host/reload/404 verification** |
| #135 `cb261...` A20 preflight | **PASS source only; A20 W5R full materialization remains blocked** | **Prior A20 genuine 13/13 native on exact tested blobs; complete monorepo preflight NOT_RUN here** | **NOT_RUN / PG16 HOLD** | **NOT_RUN / local service not authorized** |

The `NATIVE DB-FREE` column distinguishes authentic official native CI or prior independent native execution from **new A60 local execution**. Neither CI unit PASS nor source review implies C03+129 combined PASS or release GO.

## #129 independent one-blob negative/source QA (A60)

PR: https://github.com/C8LyNn/aplikacja-turnieje/pull/129
Only PR diff path: `artifacts/api-server/test/backup-v3-ingress-boundary.wave3.test.ts`, **ADDED**, 371 changed lines, Git blob `643fcc876d793b9d86c5d3700f599c4eab88c8db`; the path returns 404 on frozen C03. PR129 descends from exact PR100 `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4`, ahead by four commits with **only that path** changed. Test is not already present in C03; PR66/PR100 MUST NOT be applied again.

A60 read the exact 371-line file and enumerated **18 `test(...)` registrations**: WAVE3-A90-01..14 and WAVE4-A90-01..04. No `test.skip`, `test.todo`, `test.only`, `process.env`, file writes, process spawn, HTTP calls, `exportBackupV3(`, or `importBackupV3(` in this test file. Each case checks the frozen `assertNoAuthority` helper and no `authenticated` / `importAuthorized` / `historicalUndo` / `historicalRevert` / `historicalCasReplay` capability elevation; objects/capability records are asserted frozen.

Negative/deny tests cover: raw modern marker stripping with sidecar; duplicate JSON key; strict extension stripping by parser; schema confusion; invalid V2 BYE; duplicated round/match; strict last-history conflict; missing action-local port; async semantic/A70 callback; client-supplied `trusted` and `verified`; contradictory stage pointer; stale featured match; missing semantic port. Positive V3 draft case invokes **real `validateBackupV3` function** with synthetic export-*shaped* data, not actual DB exporter bytes. Synthetic port spies do not prove producer authenticity or real action-local validation. These tests do not grant import authority and do not exercise actual importer/DB.

**Dependency compatibility proven at Git blob level:** all four direct source dependencies have IDENTICAL blobs at PR129 HEAD and frozen C03 HEAD:
- `backup-preclone-adapter.ts`: `0465e11b2420fa00f2de5cc14fa4d81858c76ff0`
- `backup-v3-profile-gate.ts`: `518526d8d9ff2cef368261788e12c9f8290754f5`
- `backup-v3.ts`: `78d86246302fc8840696fd14c05c840304bc9f97`
- `backup-v3-strict-policy.ts`: `595c68b87a5361623bef6293519ed668e9d4e493`

**Limit:** `backup-v3.ts` has runtime imports from `drizzle-orm`, `@workspace/db/schema`, game-catalog and domain functions. The tests themselves do not call DB functions, but independent installed-workspace import/load and any transitive initialization is **NOT_REEXECUTED** here. Source compatibility ≠ native combined-tree PASS.

Authentic official exact-head Actions https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133733273, job `correction-qa`, ID `117693928028`: A60 fetched decoded original job log and independently counted `ok 27` through `ok 44` for all **18 named A90 cases**, no failure among these; `PASS workspace typecheck`; later `BLOCKED: API integration tests execution failed exit 1; signal none`, entire job **FAIL**. This is stronger evidence than author text alone, but not a separate A60 native rerun.

**A60 source decision #129:** **SOURCE PASS / CONDITIONAL READY FOR ISOLATED DB-FREE COMPOSITION QA**, only this one added test file; **NOT READY FOR MERGE/RELEASE**; no GO to create C04 without explicit separate A00 authorization and A10 allowlist. A40 can use this source evidence in a candidate gate document while preserving native combined-test NOT_RUN.

## #105 mandatory confidentiality hold (A30 overrides narrower green)

Existing exact HEAD `be2b9557e7c555925b1c1e64755042e35c536932`; NO new A50 W6A HEAD at this review. A30 exact SHA independent review: https://github.com/C8LyNn/aplikacja-turnieje/blob/22d12222104907ab08e8bcc18033dcdf7f5f11f6/docs/web-005/agent-reports/A30/W5R_A30_REDACTION_ACCEPTANCE.md

Synthetic oracle, **not real credentials**: `Authorization: Basic "YTpi"`, `Authorization: Basic 'YTpi'`, `Proxy-Authorization=Basic "YTpi"`; `YTpi` must disappear from `redactEvidence`, first failing `not ok` TAP, and stderr `Error:` diagnostics. A30 native security-negative: 10 tests, **5 PASS / 5 FAIL / exit 1**, proving quoting gap at exact old HEAD. The previously accepted standard Basic + Bearer + DSN 23/23 A60 PASS and exit 3/3 PASS remain scoped truths, NOT a superseding security result. No diagnostics inclusion, shared-public log release, or source PASS until **new** #105 SHA + native A60 redaction/runner suites + quoted negative oracle and independently **A30 CONFIDENTIALITY PASS**. No unapproved runner changes to suppress failures or skipped tests.

## Actual execution, environment and blockers

Read-only operations A60 actually performed:
- GitHub connector: exact PR base/HEAD/branch reads, exact file/blob reads, native Actions job/log interpretation, one-file commit comparison and source-static test case/capability audit.
- Local shell `node --version`: **v22.16.0**, exit 0; `git --version`: **2.47.3**, exit 0.
- `git ls-remote https://github.com/C8LyNn/aplikacja-turnieje.git HEAD`: **exit 128**, `Could not resolve host: github.com`. Local `/mnt/data/aplikacja-turnieje` absent. `pnpm` not available on PATH.
- Actual independent A60 `node --test` #129 / A50 *new HEAD*: **NOT_RUN**, TAP/exit **N/A**, because complete source/pnpm deps and a newer A50 SHA unavailable. No synthetic test count invented.
- Existing W5R A60 native 43/43 from prior report remains authenticated *for prior exact blobs only*; it is NOT W6A new execution.
- Full C03+#129 composed-source/typecheck/native test: **NOT_RUN**; C04 branch not created.
- PostgreSQL/integration/browser/live: **NOT_RUN**; original C01 first failing named test **UNKNOWN**.

**OPERATOR_REQUIRED** (A20/Windows owner first): safe disposable full isolated checkout with exact SHA, verified Node22/pnpm version and lock SHA256; check/redact inherited DB/PG/REPLIT/DEPLOYMENT_TASK env **names only**, perform real full source preflight (capture JSON/status/exit, no real DB), then A60 read-only negative QA with pinned exact source. No package installation or app/server startup is implicitly authorized.

### Exact DB-free native executor proposal (NOT_EXECUTED)

On a trusted complete **isolated** checkout with reviewed dependency installation and scrubbed credentials, validate #129 at HEAD first, using package-local cwd semantics:
```sh
git rev-parse HEAD        # must equal 35449b148aa782139a5327164cb6ed5d6aa3bfdd for PR129 suite
pnpm --filter @workspace/api-server exec node --import tsx --test test/backup-v3-ingress-boundary.wave3.test.ts
pnpm --filter @workspace/api-server run typecheck
```
Capture exact Node/pnpm/lock SHA256, stdout/stderr/TAP, skip counts and actual process exits. This PR129-only check is **not** equivalent to C03+#129. **Only after separately authorized A00 GO to produce one exact C03+129 composed candidate**, pin that new HEAD, verify *only* the test blob added and all original C03 blobs untouched, rerun the same targeted test and existing 20 backup adapter tests plus source typecheck. Do not run umbrella `pnpm test` (database integration) or physically access PostgreSQL. No C04 creation is authorized by this report.

## File ownership, conflicts, decisions and next owners

**A60 changed paths:** ONLY `docs/web-005/agent-reports/A60/W6A_A60_ACCEPTANCE_MATRIX.md` on existing A60 docs-only branch, no tested code edits. No path overlap among scoped A60 report, PR129 one test, PR105 `qa/pack17`, PR142 `scripts/deployment`. PR105 *whole* history overlaps inherited C03 gate runner and must never be blindly cherry-picked. PR142 based on newer release, sibling #120 separate. PR116 Replit NO_COPY policies and game/Unity/portfolio/static asset exclusion enforced.

**Next owner matrix:**
- **A50:** publish new quoted-Basic test-first fix with exact PR105 HEAD, native TAP and exit. **A30:** independent confidentiality acceptance on that SHA. **A60:** rerun *modified* SHA old+new redaction and true exit/skip suites + A30 oracle, record PASS/FAIL.
- **A20/operator:** deliver physically complete, safe isolated checkout and verified DB-free preflight or explicit OPERATOR_REQUIRED blocker.
- **A10:** immutable one-file #129 path allowlist and C03 ancestry; no parent PR66/100 replay.
- **A40:** source-only **candidate plan** (not new C04) based on A10 allowlist and this conditional A60 #129 source acceptance; preserve C03 API fail.
- **A00:** decide separately any permission to form C04 source-only and later physical PG16/runtime gates. Until then **SOURCE READINESS CONDITIONAL / RELEASE NO-GO / C01 API ROOT CAUSE UNKNOWN**.

**No protected merge, SQL, PostgreSQL, production migrations, live deploy, Replit sync, Steam admin/auth, game code/assets, or C04 creation performed.**
