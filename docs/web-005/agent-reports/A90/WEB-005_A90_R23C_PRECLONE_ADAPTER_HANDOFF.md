# WEB-005 / A90 R23C — pure raw-to-validated preclone adapter handoff

**Task:** WEB-005-T060-A90-R23C-PRECLONE-ADAPTER  
**Date:** 2026-10-15 · **Mode:** NARROW TEST-FIRST PURE INTEGRATION  
**Source verdict:** BACKUP_PRECLONE_ADAPTER_SOURCE_READY_FOR_QA — AUTHOR CANDIDATE ONLY  
**Integration and release verdict:** NOT_WIRED / STRICT_ATTESTATION_REQUIRED / A70_ACTION_LOCAL_NOT_IMPLEMENTED / REAL_SEMANTIC_PORTS_NOT_WIRED / RELEASE_NO_GO / SWARM006_HOLD

## 1. Exact dependency and change custody

- **New [OPEN DRAFT PR #66](https://github.com/C8LyNn/aplikacja-turnieje/pull/66)** on branch `fix/web-005/t060-r23c-preclone-adapter`, targeting A40 **disposable** composite `integration/web-005/r23c-composite-b1-20261015`; verified exact composite baseline SHA **`fa3261b2c9510e110ac9eba21726812d3401a525`**.
- **Final exact PR #66 HEAD SHA `7490c974b7c84404559fd590bd09817a71c2134f`**, 3 commits ahead of pinned composite, 0 behind. Compared to composite, exactly **two ADDED files, no modifications**:
  1. [backup-preclone-adapter.ts](https://github.com/C8LyNn/aplikacja-turnieje/blob/7490c974b7c84404559fd590bd09817a71c2134f/artifacts/api-server/src/application/backups/backup-preclone-adapter.ts) — Git blob SHA-1 **`c02ca0aa877017456142f081eff9e9f877522ca2`**; 176 added lines.
  2. [backup-preclone-adapter.test.ts](https://github.com/C8LyNn/aplikacja-turnieje/blob/7490c974b7c84404559fd590bd09817a71c2134f/artifacts/api-server/test/backup-preclone-adapter.test.ts) — Git blob SHA-1 **`dc3d44ef8bd25b5b94dbd99f5447836c000a4c6d`**; 215 added lines.
- **Source commits in test-first order:** `a48945108e6c4e385a29b922d9fdd419114c1f84` (15 Node test bodies authored BEFORE adapter); `0586f5843a5ca1d62b1936b1826707012ca92274` (standalone adapter); `7490c974b7c84404559fd590bd09817a71c2134f` (test fixture refinement: use structurally valid but semantically contradictory completed history timestamp to exercise PR56 rather than earlier raw gate).
- **A40 composite source dependencies were actually verified by GitHub blob SHA** before branch creation:
  - [PR #56 strict policy](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) OPEN DRAFT head **`a7f71a7e7efdabd479b358a3cee80bc6359c4321`**; composite `backup-v3-strict-policy.ts` Git blob **`595c68b87a5361623bef6293519ed668e9d4e493`**, exactly the PR source;
  - [PR #58 raw profile](https://github.com/C8LyNn/aplikacja-turnieje/pull/58) OPEN DRAFT head **`e8100f7b0c1071c2a98880d4eb7947514fc58185`**; composite `backup-v3-profile-gate.ts` blob **`518526d8d9ff2cef368261788e12c9f8290754f5`**, exactly the PR source.
- **No merge** of A40 composite or any PR into main/develop/release; basing the new DRAFT on composite creates only a source-review dependency branch, not a release integration candidate. Existing PR #56 and #58 source were not edited by A90 R23C.
- **A70 contract consumed:** [WEB-005_A70_R23A_ACTION_PROVENANCE_CONTRACT.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a70-r23a-action-provenance/docs/web-005/WEB-005_A70_R23A_ACTION_PROVENANCE_CONTRACT.md) Git blob `5213cbb8c2d449d855b04f94cfefc1e2981916ce`: action-local, same-match/same-stage/tournament identity, history source-action link, distinct CAS state revision, undo provenance and LIFO. **Contract is DOMAIN_CONTRACT_READY, not implemented A70 validator**.
- **A30 threat model consumed:** [A30 P23-02 security design](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A30/WEB-005_A30_BACKUP_V3_P23_02_ANTI_DOWNGRADE_SECURITY_DESIGN.md), Git blob `4890a4e41374056a6383fdad523fdbc0a2fd97d9`: Zod union strips unknown strictPolicy, marker itself untrusted, old nested remap fallback, historical-origin confusion. No A30 trusted attestation implementation or A70 source closure integrated in this task.

## 2. Pure contract and typed outcomes

**Single entry:** `validateRawBackupBeforeClone(raw: unknown, ports?: BackupPreclonePorts): BackupPrecloneDecision`. Only raw JSON **text** accepted. Its first operation is direct PR58 `preflightBackupV3Profile(raw)` BEFORE any JSON.parse or injected parser. Source-derived classification is copied into a frozen immutable result profile with fixed `authenticated:false`.

**Always disabled:** every code returns `importAuthorized:false` and immutable false `capabilities.importAuthorized`, `historicalUndo`, `historicalRevert`, `historicalCasReplay`. No parser, semantic callback, strict marker, extra client `verified:true` or port property can change that.

**Sequence for a structurally recognized raw profile:**
1. Require exact-version parser/real full semantic validator ports (`parseV2 + validateV2` or `parseV3 + validateV3`). Missing throws/rejects `MISSING_DEPENDENCY`. No default-to-pass, no implicit cross-version fallback.
2. JSON.parse occurs only after raw duplicate-member/size/depth preflight. Apply injected parser on an independent copy.
3. Check parsed profile status/version/reason **and entire key-order-neutral canonical document** against raw object. Missing `strictPolicy`, lost sidecars or changed V2/V3 version, fields and references => `PARSED_PROFILE_CONFLICT`, before semantic validation.
4. Call the correct full semantic validator port. Exceptions or post-validation mutation => `SEMANTIC_VALIDATION_FAILED`.
5. For `LEGACY_COMPAT_UNATTESTED`: terminal `LEGACY_COMPAT_RESTRICTED` after semantic port success **only**, with no import permission or historical Undo/Revert/CAS. A byte-identical fully stripped modern file cannot prove it really originated historically.
6. For `STRICT_AUTH_REQUIRED`: call actual PR56 `validateStrictBackupV3Policy` (failure => `STRICT_POLICY_FAILED`); then REQUIRE future **real A70** `validateActionLocalV3` implementation. Missing callback => `MISSING_DEPENDENCY`; rejected foreign/action-local wrong ID => `ACTION_LOCAL_CLOSURE_FAILED`. Even with all checks successful, return **`STRICT_ATTESTATION_REQUIRED`**. There is NO `verified` attester, signed receipt or other authorization path.

**Typed codes:** `RAW_JSON_REQUIRED`, `PROFILE_REJECTED`, `MISSING_DEPENDENCY`, `PARSER_FAILED`, `PARSED_PROFILE_CONFLICT`, `SEMANTIC_VALIDATION_FAILED`, `STRICT_POLICY_FAILED`, `ACTION_LOCAL_CLOSURE_FAILED`, `STRICT_ATTESTATION_REQUIRED`, `LEGACY_COMPAT_RESTRICTED`.

**Trust-critical limitation:** dependency ports are designed for *future trusted server-only bindings*. Current source does not statically bind to actual `validateBackupV2`/`validateBackupV3` because those existing files import DB and application infrastructure and cannot be included in an otherwise pure adapter without coupling. Tests use NO-OP semantic stubs only for invocation/negative path assertions, **not proofs of actual V2/V3 domain semantics**. A00/A50/A60 must not interpret a test stub as a real full validator. With no ports, the adapter denies `MISSING_DEPENDENCY`.

**Parser boundary:** comparing complete canonical raw and parsed documents is intentionally stricter than commonplace Zod normalization. The current generated `ImportTournamentBody` would remove strict metadata; integration is **not authorized** until future route/schema work preserves metadata across raw-to-schema parsing. The adapter does not persist parsed documents or return them as import credentials.

## 3. Test-first and execution evidence

**Authored** 15 distinct `node:test` bodies (plus individual assertions and table-driven variations):
- source-shaped historical V2/V3 positive with version-specific parser/full validator port invocation, but restricted-only output;
- actual PR56/58 combined modern strict + action-local callback then unconditional no-attestation denial;
- partially stripped marker with modern sidecar REJECT and **no parse call**; fully stripped but old-looking profile remains **unattested restricted** with all capabilities false;
- fake `trusted`, `verified`, signature/capabilities never attest;
- parser erasing `strictPolicy`, flipping `schemaVersion`, or silently removing actionLog => `PARSED_PROFILE_CONFLICT`, semantic not called;
- bad historic BYE => `PROFILE_REJECTED`;
- duplicate round/match V2 structurally recognized but simulated **domain semantic port rejects** => `SEMANTIC_VALIDATION_FAILED` (classification is not domain import authorization);
- strict source-valid but newest history timestamp differs => actual strict policy rejects before action-local;
- globally present source ID in wrong action's Undo payload: A70-style **test callback** rejects even when PR56 global membership can pass; hook missing => hard `MISSING_DEPENDENCY`;
- parser failure, semantic failure, malformed raw, duplicated JSON key and passed parsed-object misuse all fail closed.

**Honest author-side safe execution:** Four exact GitHub source texts (PR58, PR56, new adapter, new tests) were fetched by GitHub connector; in isolated Code Mode V8, TypeScript annotations and node:test imports were mechanically erased IN-MEMORY, imports were explicitly bound to actual retrieved PR58/PR56 function bodies, `structuredClone` was emulated by JSON roundtrip, and a minimal assertion/test shim ran the test case bodies. **On intermediate commit `0586f584...`, 14/15 passed; a flawed test injected a history winner not belonging to the declared player set and was correctly rejected at raw preflight rather than strict.** Last test-only correction at `7490c974...` replaces it with a source-valid differing completedAt timestamp. **Final isolated V8 diagnostic: 15/15 pass, 0 fail**, blobs `c02ca0aa877017456142f081eff9e9f877522ca2` and `dc3d44ef8bd25b5b94dbd99f5447836c000a4c6d`. This is real execution of JS-erased logic, **NOT** native Node22 `node:test`, **NOT** TypeScript typecheck, **NOT** full installed pnpm monorepo or HTTP/PG16 import test.

**Author-initiated local native tests:** NOT_EXECUTED; no local full checkout or manual paid CI. **Automatic GitHub Actions DID run** native TypeScript typecheck and the 15 new Node/TAP subtests at the exact PR HEAD. See the verified CI result below; do not conflate author-side V8 checks with the stronger automatic native receipt.

**Actual automatic GitHub Actions on exact HEAD:** [run 38742658793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38742658793), job [116448076305](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38742658793/job/116448076305) **completed FAILURE overall**. Frozen dependency installation, Pack19–26 and **workspace typecheck PASSED** (including `artifacts/api-server` production and test tsconfigs). The native Node/TAP transcript includes **all 15 named R23C subtests as `ok 7` through `ok 21`; 15/15 PASS, zero failed in this new suite**. Later the aggregate Static and database release gate failed: `BLOCKED: API integration tests execution failed exit 1; signal none`. This is an aggregate release blocker, not evidence that a new adapter test failed; no exact root cause of aggregate API exit was isolated. No manually triggered paid rerun.

**Future exact-HEAD isolated native test for A50/A60:**
~~~bash
git fetch origin fix/web-005/t060-r23c-preclone-adapter
git switch --detach 7490c974b7c84404559fd590bd09817a71c2134f
git rev-parse HEAD
node --version        # Node22
pnpm --version        # pnpm10
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test ./test/backup-preclone-adapter.test.ts
~~~
Only on an approved disposable full checkout. Save real stdout/TAP, exact commit, exit code. NO database/schema reset or paid manual CI rerun.

## 4. Outstanding A00 / A30 / A70 / A50 / A60 integration gates

1. **A60 exact SHA source QA** on PR #66 plus separately verified native test/typecheck. Prior acceptance PR56/PR58 does not approve this orchestration automatically.
2. **A70 action-local source module** implementing typed action-to-Undo same-match/same-stage/tenant, historical snapshots and deterministic LIFO. The *port exists*, implementation still missing. A permissive no-op port is unsafe and must be forbidden at actual application wiring.
3. **A30 + owner/HQ trusted issuance/attestation** beyond client-controlled strict marker or boolean. No Ed25519, registry or trusted export record exists. Strict modern is UNCONDITIONALLY DENIED in this module.
4. **Actual trusted server ports:** real complete version-tagged V2/V3 parse, actual `validateBackupV2`/`validateBackupV3`, no critical stripped content. Distinct from unit-test stubs. Existing Zod schemas lack marker; full importer is untouched and may still have historical Undo ID `map.get(id) ?? id` fallback.
5. **Restricted legacy enforcement** in actual server authorization + Undo/Direct Revert/CAS (not just policy data). Old unsigned identity is unprovable without future trusted evidence; never auto-promote.
6. **DB and transport work separately authorized:** original pre-parser raw bytes, malformed JSON and duplicate members, no-write-before-clone, clone-local action ID maps, transactional late rollback/HTTP 400/PG16 and full old producer archived fixtures; these are NOT executed or proven here.
7. **Composite hygiene:** this PR is based on disposable A40 B1 **not release**. It must not be independently cherry-picked without its exact verified PR56 + PR58 dependency tree and independent integrated QA.

**STOP:** no importer/exporter/HTTP or OpenAPI/Zod changes, no SQL/migrations/PG16 shared reset, no Ed25519, no merge to main/develop/release, no deployment, no SWARM-006.

**Final:** `BACKUP_PRECLONE_ADAPTER_SOURCE_READY_FOR_QA / DRAFT_PR66_TEST_FIRST / AUTO_NATIVE_TYPECHECK_PASS / AUTO_NATIVE_R23C_15_OF_15_PASS / CI_AGGREGATE_API_BLOCKED / STRICT_ATTESTATION_MISSING / REAL_A70_CLOSURE_MISSING / ACTUAL_IMPORT_NOT_CONNECTED / RELEASE_NO_GO / SWARM006_HOLD`.
