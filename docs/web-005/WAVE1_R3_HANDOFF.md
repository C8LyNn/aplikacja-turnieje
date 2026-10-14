# WEB-005-00-WAVE1-R3 — COORDINATION & QA HANDOFF

**Issued:** 2026-10-14 by 00 — Implementation Lead  
**GitHub state verified:** R3. No merges, no deployment, no Replit, no production connection.  
**Scope:** WAVE1 only, max three active implementation/analysis lanes.

## Pinned references

- release base: `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`
- main: `c50cc48e6fa508592bda3f4838111e9cff5af80c`
- catalog editor reference: `28da3ef94f3b30f90c1b3b70a88ab7f61462d99c`
- T010 / [PR #35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35): `7cb283aa82273a1e22daf9051a82311eef53760c`
- T030 / [PR #34](https://github.com/C8LyNn/aplikacja-turnieje/pull/34): `030d0f5f51df6731cff8135a793abc2d51b0b775`
- Competing [PR #33](https://github.com/C8LyNn/aplikacja-turnieje/pull/33): `79fc25971a53641a704fa052a2b8d937d140fa7d`, SUPERSEDED/HOLD, not closed
- T020 unchanged analysis branch: `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`
- T015 branch created `fix/web-005/t015-pack20-26-contracts`: release base, no changes yet.
- T131 infrastructure agent has no assigned code branch. Environment preflight/support only.

## Binding coordinator decisions

**T010:** Pack19 ownership stays A10; accepted as a real CI test pass **for Pack19**: SE 23/23, readiness 26/26, Pack19 contract 8/8. A60 must still review diff and contract. PR35 draft, NO MERGE. A10 should enter closeout not broaden scope.

**T015:** A40 exclusively owns source contracts in `qa/pack20/**` through `qa/pack26/**`; no changes to Pack19, no backend behavior modification to please tests. Pack20 actual CI failure 6/7 due to stale `readOnly:true`; Pack21/25/26 source inspection reveals same obsolete assertion. Replace brittle source literals with robust Drizzle `accessMode:"read only"` + `isolationLevel:"repeatable read"` and absence-of-mutation controls; independent review A60. Other packs inspect but only change when necessary.

**T020:** Conceptual manifest 0027–0040 acknowledged **only for test-fixture design**. 0027–0029 common; release 0030/0031; editor source 0030–0038 becomes canonical 0032–0040. Raw source SHA-256 and logical IDs are in `WEB-005_T020_A10_R2_TARGET_MANIFEST_PROPOSAL.json`; this is a non-GitHub source attachment, not executable migration. Before SQL authorization: independent raw source checksum verification; migration ledger/attestation; 0031 embedded `BEGIN/COMMIT` reconciliation with runner-atomicity; SQL render hash; clean + R30/R31 + E30–E38 historical upgrades; FK/triggers/idempotency/recovery; PostgreSQL 16 isolation. NO AUTOMATIC ADOPTION of unknown history; no SQL edits/prod execution.

**T030:** PR34 selected for QA (not merged). Three guarded writes: POST taxonomy, POST import, PUT classification; public GETs unchanged. 503 missing or too-short server token, 403 invalid/absent client key; server-only `STEAM_CATALOG_ADMIN_TOKEN` not configured. PR34 has 8 changed files, integration test with full-row fingerprints, public GET, invalid token non-disclosure, mocked upstream. Runtime tests/typecheck NOT_EXECUTED by worker. PR33 HOLD; don't close or merge it without separate coordinator action.

**T131:** A50 checks feasibility and safety of actual PostgreSQL 16 test setup; requires dedicated TEST_DATABASE_URL pointing nonproduction test DB, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`, and disposable `tm_test_*` schema. Execute only when sandbox and authority truly verified, otherwise mark NOT_EXECUTED/BLOCKED; logs/exit codes and commit pins delivered to A60. No real tokens or production URLs.

**T130:** A60 independently assesses T010, T015, T020, T030 with statuses PASS, FAIL, BLOCKED, NOT_EXECUTED and provenance SOURCE vs ACTUAL_RUNTIME. No worker self-certification. Expected evidence matrix below.

## A60 review intake checklist

| Candidate | Independent checks | Current verified evidence |
|---|---|---|
| T010 `7cb283aa...` | Difference one source-contract line; Drizzle read-only & snapshot isolation; negative source controls; check PR35 CI | [Actions #38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899) Pack19 PASS, Pack20 FAIL |
| T015 `1fdc401d...` at dispatch | Source list Pack20/21/25/26, no weakened negative checks, exact diff + CI | No implementation or CI yet |
| T020 R2 proposal | canonical source lineage/dep graph, runner ledger, explicit transactions, historical states and upgrade tests | Manifest source-only; DB tests NOT_EXECUTED |
| T030 `030d0f5f...` | 403/503 matrix; anonymous/viewer/support/organizer denial; catalog admin success; 3 mutations; no DB changes or Steam requests on deny; public GET; frontend credential exposure/typecheck | [Actions #38550962951](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550962951) Pack19 FAIL because missing PR35; catalog-specific runtime tests NOT_EXECUTED |

## Execution commands (for A50/A60 after safe preflight)

- Pack19: `node --test qa/pack19/source-contract.test.mjs`
- Pack20/21/25/26: `node --test qa/pack20/source-contract.test.mjs qa/pack21/source-contract.test.mjs qa/pack25/source-contract.test.mjs qa/pack26/source-contract.test.mjs` (execute only at correct candidate SHA)
- Backend Steam access and middleware: `pnpm --filter @workspace/api-server exec node --import tsx --test test/steam-catalog-access.test.ts test/steam-catalog-admin-middleware.test.ts`
- Steam PostgreSQL HTTP fixture: `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA pnpm --filter @workspace/api-server exec node --import tsx --test test/steam-catalog-admin.integration.test.ts` with independently validated `TEST_DATABASE_URL` (never use production)
- Full Pack17: `node qa/pack17/run-gates.mjs --full` only with safe Postgres16 TEST and required environment guards
- Workspace backend typecheck, test: choose exact scripts after reading `package.json`, capture exit codes. Do not invent PASS for unevaluated scripts.

## Future integration sequence — NOT EXECUTED

Planned only on a separate, disposable, previously approved integration branch based on release SHA:
1. exact independent PR35 patch (Pack19),
2. exact independently reviewed T015 patch (Pack20–26),
3. after A60 signoff selected PR34 (Steam Catalog auth),
4. isolated CI and DB gates including full Pack17 and auth negative/positive,
5. T020 migration integration only after separate technical authorization, not by default.

**A dedicated branch `test/web-005/wave1-integration` was attempted but the GitHub creation tool was blocked by security safeguards. No branch created, no cherry-picks or merge. Do not bypass tool safety restrictions.** The test branch must remain a planned item until the platform permits a supported, approved flow.

## Current coordinator blockers

- B001 missing WEB-004 consolidated handoff.
- B002 Pack20 CI FAIL and Pack21/25/26 stale source text.
- B003 conflicting migrations and missing verified ledger/transaction safety.
- B004 owner secret provisioning for catalog-admin.
- B005 deployed Replit SHA unknown; Replit frozen.
- B006 full independent real HTTP/DB/frontend QA outstanding.
- B007 branch protection absent; no rule changes.
- B008 duplicate PR33/34; selected PR34, PR33 HOLD.
- B009 safe test DB not yet proven; A50 to preflight.
- B010 integration branch creation blocked.

## Acceptance / archival

- T010 can be marked QA_ACCEPTED and archived by 00 only after A60 review; PR35 may remain draft/unmerged and release gate still NO-GO.
- T015 must present exact commit and CI pass-through to downstream Pack17 or honest BLOCKED.
- T020 cannot be called implemented or migrated without clean/historical runtime upgrade evidence and separate decision.
- T030 cannot be called secured in production merely from source guarded PR; A60 runtime approval + separate operator configuration/rollout permission required.
- Final wave1 GO requires all task gates and CI; currently **NO-GO**.

### How to dispatch

The coordinator cannot insert messages into independent ChatGPT agent conversations via GitHub. The user/owner must provide this handoff link or copy the per-agent sections; creation of the T015 branch does not itself start an agent. All assignments are documented, not silently executed.
