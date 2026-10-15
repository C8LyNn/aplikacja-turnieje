# WEB-005 — A50 / R23 Native Test Execution Readiness

**Task:** `WEB-005-T131-A50-R23-TEST-GATE-PREPARATION`  
**Agent:** A50, isolated test infrastructure/execution · **Date:** 2026-10-15 Europe/Warsaw  
**Scope:** READ-ONLY GitHub/CI and safe local non-destructive preflight. No application-source edits, paid CI reruns, SQL, DB schema reset, merges or SWARM-006 dispatch.  
**Release baseline:** `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**Overall verdict:** **`PARTIALLY_READY` for isolated, dependency-light TypeScript/Node tests; full native monorepo QA = `BLOCKED`; PG16 Basket CAS = `STOP`.** This label is *not* full RUNTIME_VERIFIED or release approval.

## 1. Immutable source identity / actual changed-file scope

| PR | HEAD reverified | Status | Changed paths |
|---|---|---|---|
| [#55 P22 T055](https://github.com/C8LyNn/aplikacja-turnieje/pull/55) | `c3a4ea00ba933cbab36b3582859cb3eff20f0204` | OPEN DRAFT/unmerged | `artifacts/api-server/test/stage-basket-cas.integration.test.ts` only |
| [#56 P23 Backup strict](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) | `a7f71a7e7efdabd479b358a3cee80bc6359c4321` | OPEN DRAFT/unmerged | `artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts`, `test/backup-v3-strict-policy.test.ts` |
| [#57 P24 Swiss](https://github.com/C8LyNn/aplikacja-turnieje/pull/57) | `a57fe31c1bc123c5217b3f58bcdd34750c64c5c6` | OPEN DRAFT/unmerged | `artifacts/api-server/src/domain/tournament/swiss.ts`, `test/swiss.test.ts` |
| [#35 Pack19 contract](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) | `7cb283aa82273a1e22daf9051a82311eef53760c` | OPEN DRAFT/unmerged | `qa/pack19/source-contract.test.mjs` only |

All four PR bases equal the release SHA above. Treat each HEAD as independent; none includes PR35's separate CI matcher correction.

## 2. Physically observed local environment, 2026-10-15 UTC

Actual commands on available **ChatGPT Linux container, NOT owner PC**:

| Executed command | Exit | Output |
|---|---:|---|
| `node --version` | `0` | `v22.16.0` |
| `npm --version` | `0` | `10.9.2` |
| `git --version` | `0` | `git version 2.47.3` |
| `tsc --version` | `0` | `Version 5.8.3` |
| `ts-node --version` | `0` | `v10.9.2` |
| `corepack --version` | `0` | `0.32.0` |
| `timeout 8 git ls-remote https://github.com/C8LyNn/aplikacja-turnieje.git HEAD` | `128` (git) | `Could not resolve host: github.com` |

`typescript` global module resolvable at version **5.8.3**, so `typescript.transpileModule` is technically available. `pnpm`, `tsx`, Vitest, `psql`, `pg_isready`, Docker, Podman and PowerShell missing. No full `.git` monorepo / `pnpm-workspace.yaml` / `pnpm-lock.yaml` found under searched `/mnt/data`, `/home/oai/share` (maximum depth four); no frozen dependencies. `TEST_DATABASE_URL`, `TEST_DATABASE_SCHEMA`, `TEST_DATABASE_RESET`, `DATABASE_URL` **UNSET**. Do not treat existence of global TypeScript as the repository's pinned compiler or a semantic `tsc -p` PASS.

**This A50 task executed ZERO original application test cases:** per-PR Node test commands `NOT_EXECUTED`, exits/TAP/passes/skips `null`. Non-destructive runtime/tool preflight and source inspection do NOT constitute native feature tests.

## 3. Accurate PR56 A60 post-fix evidence (do not misattribute)

Read independently published [A60 PR56 P23-01 post-fix report](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_PR56_P23_01_POST_FIX_INDEPENDENT_QA.md), Git blob `d8c900df075903413ca3d0ce4fec3b4aa2d18e84`, and [machine TAP receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_PR56_P23_01_POST_FIX_TEST_EVIDENCE.json), blob `f6513706ac09a212e9f357bb28a95be1213ccfb2`.

On **exact PR56 HEAD** A60 reconstructed Git-blob-identical source+test files and emitted CommonJS using **TypeScript 5.8.3 `transpileModule`**, 0 transform diagnostics, then actually executed:
- `node --test dist/test/backup-v3-strict-policy.test.js` — exit **0**, **14/14 PASS**, 0 fail/skip.
- `node --test independent-negative.js` — exit **0**, **8/8 PASS**, 0 fail/skip.
- Combined **22/22 PASS**, **A60 EXTERNAL INDEPENDENT EVIDENCE**; **NOT a new A50 R23 run**. P23-01 lawful system-BYE source bug repaired; **PASS WITH CONDITIONS** for pure isolated validator.

`transpileModule` strips/transforms types; it **does not perform semantic TS typechecking or package/workspace resolution**. A60 explicitly recorded attempted full `tsc` without reliable exit: `FULL_TSC_NOT_VERIFIED`. The strict validator remains **NOT_WIRED** to importer/exporter/HTTP/PG16; no authentic legacy import, strict 400 before clone, persistent CAS or transaction rollback proven.

## 4. Inherited CI Pack19 versus PR35: direct GitHub workflow proof

Read release `qa/pack19/source-contract.test.mjs` Git blob `8d5e8466cbc651a510acf3c072fac4d6821b56b5`: line 12 expects text `isolationLevel:"repeatable read",readOnly:true`. Actual immutable release route `tournament-se-correction-readiness.ts` Git blob `bcd4413c1df18aef8bcc3399a9272fd3e6332757` instead has `isolationLevel:"repeatable read",accessMode:"read only"`. Existing PR35 source contract Git blob `5726986dca6a6fd7309bb883eb1106d2d19fb14e` corrects expected matcher to read-only `accessMode`.

**Latest exact-HEAD workflow observations** (read-only GitHub Actions API and job steps/logs, no reruns):

| PR | Run / job | CI conclusion | First blocking step | Interpretation |
|---|---|---|---|---|
| #55 | [38646040840](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38646040840) / `116133014455` | FAILURE | Pack 19 | Upstream inherited contract, not a measured Basket CAS outcome |
| #56 | [38698700862](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38698700862) / `116301422802` | FAILURE | Pack 19 | Feature validator tests **NOT_EXECUTED_IN_CI**; separate 22 A60 tests valid only isolated |
| #57 | [38646317948](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38646317948) / `116133937701` | FAILURE | Pack 19 | Swiss feature tests **NOT_EXECUTED_IN_CI** |
| #35 | [38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899) / `115807143959` | FAILURE | **Pack 20**, after Pack19 SUCCESS | Matcher repair locally verified by CI; Pack20 still upstream from its isolated base |

Direct PR56 job log: Pack19 contract **7 pass, 1 fail**, assertion mismatch above; subsequent Pack20–26 skipped. PR35 CI Pack19 **8/8 pass**, but Pack20 fails (another inherited matcher in `Readiness endpoint keeps a read-only repeatable-read transaction`). Therefore **PR35 does not make full CI green by itself**. Avoid duplicating PR35, changing another agent's PR, cherry-picking a composite, or assuming a feature PASS from early generic 23/23 and 26/26 CI tests.

## 5. Readiness split, exact authorized commands and STOP rules

Source-derived package scripts: `artifacts/api-server/package.json` blob `bf931f87a7b0d5532b949f44c7e091878fe6db52`; `test/run-tests.ts` blob `da4188446aba4696f97eb7831fee0cc5824d212f`. Monorepo `typecheck` includes library+artifact references; owner must supply full frozen pnpm10 install and separate *clean exact-SHA* checkout for each PR. Execute from each checkout root **after owner execution GO**:

```bash
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server exec node --import tsx --test test/backup-v3-strict-policy.test.ts  # PR56 checkout ONLY
pnpm --filter @workspace/api-server exec node --import tsx --test test/swiss.test.ts                    # PR57 checkout ONLY
pnpm --filter @workspace/api-server run typecheck
pnpm run typecheck
```

**All these native checkout commands are `NOT_EXECUTED` by A50**, except environment-only `node --version` above. Run commands against correct per-PR checkout; do not run PR56's file on PR57 or assume both exist on a single base. Backups pure validator and Swiss unit are **DB-FREE** at source level. Swiss has imported **TYPE-ONLY** standings projection and uses built-in `node:test`; PR57 authored 12 top-level test cases, including 64/65 field bounded fallback. New target CI source does not automatically run these suites.

**Optional isolation tier with only globally available TypeScript** (NOT full native QA): approved operator can reconstruct verified Git blob-identical TS into disposable folder, call `typescript.transpileModule` and execute emitted JS with `node --test`. This worked in A60 PR56 proof; no full-semantic typecheck and no monorepo dependency graph. An equivalent PR57 isolated run requires exact TS source/test and import-path verification. **A50 did not repeat this test because current container does not have those source bytes on disk**; GitHub connector file reads do not mount them.

**PR55 Basket T055 CAS**: `stage-basket-cas.integration.test.ts` has ten test-first HTTP/DB fixtures CAS-01…CAS-10, not a pure unit suite. Imports `supertest`, `drizzle-orm`, `@workspace/db` and `./test-database`; `before` explicitly calls `resetTestSchema`, `after` calls `dropTestSchema`, both destructive. Current production endpoint lacks approved D1–D6 persisted CAS semantics; its tests are expected RED pending implementation — NOT a demonstrated failure because NEVER RUN.

**HARD PG16 STOP**: test helper `getSafeTestDatabaseConfig` Git blob `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6`, lines 141–189, demands `NODE_TEST_CONTEXT`, dedicated `TEST_DATABASE_URL` whose database name contains `test` and host/db fingerprint excludes `prod`, schema `tm_test_[a-z0-9_]+`, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`; `resetTestSchema` actually executes `DROP SCHEMA IF EXISTS "<schema>" CASCADE`. Built-in string guards alone are **NOT evidence of physical isolation**. Before any DB command A20 and owner must verify physically separate disposable PostgreSQL 16 server/volume, least-privilege role, exact DB/schema identity and explicitly approve reset in writing. No fallback to shared/prod `DATABASE_URL`, no SQL migration/adoption here.

**Only after that separate owner+A20 DB GO**, the intended native test command (NOT_EXECUTED) in PR55's isolated checkout is:

```bash
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 test/stage-basket-cas.integration.test.ts
```

Do not execute without all gates; capture exit, TAP, fail and skip, HTTP 428/412/4xx, before-after DB snapshots, reset/teardown result and leaks/sanitized logs. Post-implementation may still need deterministic true concurrent interleaving, persisted revision/ABA and frontend D6 tests beyond these authored fixtures.

## 6. Sequence and precise gates for A00

1. **Acquire trusted executor:** owner/A00 makes a real, authorized full repository filesystem+shell available with Node22, pnpm10, frozen lockfile and independent PR55/56/57 (and PR35 for CI prerequisite) checkouts. Pin HEAD immediately before run; sanitize evidence; do not install packages to shared/prod. **STOP** if checkout/deps/GO absent.
2. **No-DB smoke first:** PR56 isolated exact module/unit (A60 already 22/22 proof), then PR57 Swiss unit, collect actual TAP/exit on each head. Follow with PR-specific typecheck and root/TS library typecheck. **STOP** on semantic TS failure; `transpileModule` success is insufficient.
3. **CI reconciliation separately:** record PR35 Pack19 green yet Pack20 red, upstream baseline drift; A40/A00 controls code owner and later authorized composite integration. No paid rerun, no cherry-pick PR35 into #55–57 here. **STOP** if mandatory CI gating remains inherited red; do not label new suites passed.
4. **PG16 only after A20+owner physical/signature GO:** PR55 CAS-01…10 test-first, then future implemented endpoint regression and other backend positive/negative/zero-write tests. Expect RED before D1–D6 source implementation; store actual HTTP/SQL evidence, not speculative results. **STOP** for absent DB identity/reset consent, shared endpoint, unexpected schema target, unsafe privileges or missing rollback.
5. **Release/integration hard gate:** A60 independent source QA on exact current heads, A10 24-PR manifest + original WEB004 case dispositions/owner policy, explicit final `FINAL_HANDOFF_GO`. EXEC-B is only a conditional owner preference; future SWARM006 must execute complete integrated composite QA/Pack17/20–26/PG16/browser before staging/live. **No dispatch here.**

**Owner unblocker to start DB-FREE tests:** grant A50 one actual trusted shell+filesystem/checkout+pnpm10 frozen deps connection with written exact-SHA test GO. PG16 is a **separate** signed safety gate.

**Final:** `PARTIALLY_READY_ISOLATED_TS / FULL_NATIVE_MONOREPO_BLOCKED / PR55_PG16_STOP / CI_PACK19_INHERITED_RED / RELEASE_NO_GO / SWARM006_HOLD`.
