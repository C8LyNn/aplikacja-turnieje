# WEB-005 — A90 / DEVELOPMENT FIRST WAVE 4 — WAVE4_HANDOFF

**Agent/task:** A90 — Backup V3 Integrity & Restore / synthetic export-shaped V3 → real semantic validation → pure preclone error contract  
**Date:** 2026-10-18 · **Priority:** HIGH · **Mode:** DB-free, non-destructive, test-only improvement to existing owned PR  
**Status:** `PARTIAL: TEST_SOURCE_PUBLISHED / NATIVE_W4_CI_PENDING / FULL_IMPORT_NOT_WIRED / RELEASE_NO_GO`

## 1. Scope, source pins and changes

- **Existing Draft PR:** [#129 — raw V2/V3 ingress boundary](https://github.com/C8LyNn/aplikacja-turnieje/pull/129), **OPEN DRAFT / unmerged**. Same branch `test/web-005/a90-wave3-raw-preclone-strict-boundary`; Wave 4 builds on prior Wave 3 test-only source rather than creating another PR.
- **BASE SHA:** `a8a04f7f6656ec02c2baa0ac1027b39192da743d` (Wave 3 test-only PR129 HEAD, 14 authored cases); unchanged parent dependency PR100 `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4`.
- **HEAD SHA:** `6569b58464904b4766a26afd1a43d77839478524` (W4 current PR129 HEAD).
- **Changed path relative to W3 HEAD, EXACTLY ONE:** `artifacts/api-server/test/backup-v3-ingress-boundary.wave3.test.ts` — Git blob **`dc55e6cb68bcab1829fa3276e5899e0f1e87b6dc`**. No application/importer/exporter/HTTP/Zod/SQL/DB, game, A40 or A140 file changed.
- **Other relevant immutable source:** [PR #56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) HEAD `a7f71a7e7efdabd479b358a3cee80bc6359c4321`, strict blob `595c68b87a5361623bef6293519ed668e9d4e493`; [PR #58](https://github.com/C8LyNn/aplikacja-turnieje/pull/58) HEAD `e8100f7b0c1071c2a98880d4eb7947514fc58185`, raw profile blob `518526d8d9ff2cef368261788e12c9f8290754f5`; [PR #64 A70](https://github.com/C8LyNn/aplikacja-turnieje/pull/64) HEAD `7837e412626e88761c70f1a2ceeb822d7ed101e1`, action-local still independently isolated; [PR #66](https://github.com/C8LyNn/aplikacja-turnieje/pull/66) HEAD `7490c974b7c84404559fd590bd09817a71c2134f`; [PR #100](https://github.com/C8LyNn/aplikacja-turnieje/pull/100) HEAD `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4`.
- A40 [#101](https://github.com/C8LyNn/aplikacja-turnieje/pull/101) HEAD `a5bfd07b822c223fd995604dc2e228935ab81498` and A140 [#116](https://github.com/C8LyNn/aplikacja-turnieje/pull/116) HEAD `a0f1d8066bbcf4e4b602cb587aebf599e327d067`, active branches untouched. No changed-path collision (although C02 adapter source may diverge).

## 2. Specific functional regression reduction

**Actual release `exportBackupV3`** ([backup-v3.ts](https://github.com/C8LyNn/aplikacja-turnieje/blob/1db3734b8988940acc6be8b992420a58fc39624a/artifacts/api-server/src/application/backups/backup-v3.ts), Git blob `78d86246302fc8840696fd14c05c840304bc9f97`) selects PostgreSQL rows. Running that exporter requires DB and is **NOT_AUTHORIZED / NOT_EXECUTED** in this wave. Instead the newly added tests serialize a **synthetic, export-shaped V3 draft snapshot** with ISO timestamps and nullable stage pointer and feed it through actual source code `validateBackupV3` (pure DB-free semantic validator from the same release file) and `validateRawBackupBeforeClone` (PR100), with a lossless parser and version-specific semantic port.

**Four new synthetic test bodies WAVE4-A90-01–04** (existing 14 Wave 3 + four = **18 authored**):
- **01** source-shaped draft V3 passes **real** `validateBackupV3`, raw preflight classifies historical shape, adapter calls real V3 domain validation before returning **`LEGACY_COMPAT_RESTRICTED`** without import rights;
- **02** structurally recognizable backup with conflicting tournament ACTIVE status and missing active stage pointer is rejected by real V3 semantics → **`SEMANTIC_VALIDATION_FAILED`**, not legacy import;
- **03** source-shaped backup contains non-existent `featuredMatchBackupId` → real V3 semantic failure, no importer privileges;
- **04** valid source-looking V3 without required semantic validator → **`MISSING_DEPENDENCY`** before any permission can be granted.

**Important limits:** the synthetic fixture is not actual bytes from `exportBackupV3` nor a signed archival producer sample; `importBackupV3` and `importBackupV2` **are NOT executed**. The previous Wave 3 tests also use explicit synthetic V2 shape and callback spies. The future signed issuer trust model, action-local source binding, legacy restricted server mutations, and real raw HTTP ingress still require separate A00/A30/A70/A60 gates. The adapter intentionally keeps `authenticated=false`, `importAuthorized=false` and history Undo/Revert/CAS=false on every result.

## 3. Tests actually executed and NOT_EXECUTED

| Evidence | Real status |
|---|---|
| **Previous exact W3 HEAD native CI** | [GitHub Actions #39128441792](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39128441792) **completed FAILURE overall**, but **workspace TypeScript typecheck PASS** and each of **14/14 Wave 3 A90 native Node/TAP tests `ok 27–40` PASS**. Late aggregate `Static and database release gates` failed at `BLOCKED: API integration tests execution failed exit 1; signal none`. This is **prior W3 evidence, not W4 PASS**. |
| **W4 new author-local Node/pnpm tests** | `NOT_EXECUTED` — source connector did not include full pinned installed monorepo locally |
| **W4 automatic GitHub Actions on new HEAD** | [Run #39133233408](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133233408), status **IN_PROGRESS at report creation**. A60/A50 to use native TAP once run completes; report will be updated when retrieved. |
| **Actual exporter database query and importer transaction/HTTP** | `NOT_EXECUTED / NO_DB_GO` |
| **SQL / migrations / PG16 / Docker / production Replit / protected merge** | `NOT_EXECUTED` |
| **Independent A60 exact W4 HEAD QA** | `PENDING` |

**Suggested DB-free native targeted QA command (A60/A50 on pinned full source):**
```bash
git fetch origin test/web-005/a90-wave3-raw-preclone-strict-boundary
git switch --detach 6569b58464904b4766a26afd1a43d77839478524
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test ./test/backup-v3-ingress-boundary.wave3.test.ts
```

## 4. Conflicts, known blockers, next owner

- **No collision** with active A40/A140 changed paths. Only existing A90-owned test in #129 was edited. PR #129 remains child of #100→#66→C01 and must not be independently merged into release or cherry-picked by A40 before exact SHA A60 QA.
- **Potential functional risk:** generated import Zod strips unrecognized strict profile; route receives pre-parsed `req.body`; initial server V3/V2 Undo remap may retain `map.get(oldId) ?? oldId`. These are existing source findings; not touched in this wave.
- **Unresolved product policy:** modern issuer signature and historical restricted-mode admission/enforcement [Issue #76](https://github.com/C8LyNn/aplikacja-turnieje/issues/76); no `verified=true`, no fake signer, no positive trusted import.
- **A60:** independently verify new W4 exact SHA, real V3 validator native tests and synthetic limitations; investigate any true feature-local failure. **A10:** update pinned test blob/head register, mark W3 vs W4 execution separately. **A40:** review child PR129 only as candidate for C02 after A60 and conflict review; do not override active composite. **A00/A30:** explicit GO for actual raw HTTP ingress, trusted issuer model, restricted legacy behavior; **A50:** owns unrelated aggregate API first-failure triage.
- **No application code change, no live write, no test database reset, no game source/art changes, no merge, deploy or SWARM-006.**

**FINAL (initial):** `WAVE4_HANDOFF / PARTIAL_PENDING_CI / PR129_EXISTING_TEST_EXTENDED / NO_APP_CODE_CHANGES / DB_NOT_EXECUTED / REAL_EXPORT_IMPORT_NOT_TESTED / RELEASE_NO_GO`.
