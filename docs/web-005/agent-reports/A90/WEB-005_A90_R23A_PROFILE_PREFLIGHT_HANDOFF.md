# WEB-005 — A90 / R23A P23-02 raw Backup V2/V3 profile preflight handoff

**Task:** \`WEB-005-T060-A90-R23A-P23-02-PREFLIGHT\` · **Date:** 2026-10-15 (Europe/Warsaw)  
**Owner:** A90 / Backup V3 Integrity & Restore · **Mode:** NARROW TEST-FIRST / NEW PURE FILES ONLY  
**Final source classification:** \`PROFILE_PREFLIGHT_SOURCE_READY_FOR_QA / A60_EXACT_SHA_QA_PENDING / NOT_WIRED / TESTS_AUTHORED_NOT_EXECUTED / BACKUP_V3_NOT_INTEGRATED\`

## 1. Exact live repository custody

| Item | Value |
|---|---|
| New source candidate | **[Draft PR #58](https://github.com/C8LyNn/aplikacja-turnieje/pull/58)**; head branch \`fix/web-005/t060-r23a-profile-preflight\`; no merge |
| Verified release baseline | \`release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\` |
| **Exact final HEAD SHA** | **\`14204bc9ec24f5902fddc3deb48d7592747d450a\`** |
| New source | [\`artifacts/api-server/src/application/backups/backup-v3-profile-gate.ts\`](https://github.com/C8LyNn/aplikacja-turnieje/blob/14204bc9ec24f5902fddc3deb48d7592747d450a/artifacts/api-server/src/application/backups/backup-v3-profile-gate.ts), **blob SHA1 \`c180da5b9d8aaedb44d83fcc8831aeb6fa70b988\`**, 402 added lines |
| New test | [\`artifacts/api-server/test/backup-v3-profile-gate.test.ts\`](https://github.com/C8LyNn/aplikacja-turnieje/blob/14204bc9ec24f5902fddc3deb48d7592747d450a/artifacts/api-server/test/backup-v3-profile-gate.test.ts), **blob SHA1 \`bf328acae3f3c4659f95f0fa1df4a836ceb15d0a\`**, 214 added lines |
| Git diff vs release | **5 commits, exactly 2 newly added files, zero modifications of existing source** |
| Unaffected [PR56 strict-validator](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) | \`a7f71a7e7efdabd479b358a3cee80bc6359c4321\` when this task started, separate OPEN DRAFT; no edit, cherry-pick, rebase or merge |

**Test-first commit order:**
1. \`5e7476855d2dc2dd80caa0cf8bc9d1e9ddf6f3d4\` — first 14 positive and fail-closed negative \`node:test\` test bodies, before source module existed.
2. \`815207759e203edd42ed4a9e0a37b357e978eb18\` — new pure raw-preflight source.
3. \`43d6928ccd45d8daad9c1066556278221297e4f8\` — two additional strict/hybrid/source-reference negative tests FIRST.
4. \`f0c9ba1e68d6502d0ed5d469fea55f57dfb09426\` — ensure self-marked strict also has coherent V3 structure; not just known marker.
5. \`14204bc9ec24f5902fddc3deb48d7592747d450a\` — narrow TypeScript PropertyDescriptor safe-check correction.

No existing importer/exporter/route/OpenAPI/Zod/SQL/PR56 source modified.

## 2. Grounded security design and pure classification contract

**Design read:** [A30 R23A / P23-02 security design](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A30/WEB-005_A30_BACKUP_V3_P23_02_ANTI_DOWNGRADE_SECURITY_DESIGN.md), Git blob \`4890a4e41374056a6383fdad523fdbc0a2fd97d9\`. Actual V2/V3 required fields and positive producer shape cross-checked against release \`lib/api-zod/src/generated/types/tournamentBackupV2.ts\`, \`tournamentBackupV3.ts\`, \`TournamentBackupV2/3\` original OpenAPI schema and \`backup-v2.ts\`/\`backup-v3.ts\`. **These source-derived synthetic fixtures are NOT authenticated archived originals.**

Pure exported API: \`preflightBackupV3Profile(raw: unknown): BackupProfilePreflight\`, with \`status\`, **fixed bounded reason code**, V2/V3/null schema version, constant \`authenticated:false\`, constant \`capabilities:{importAuthorized:false,historicalUndo:false,historicalRevert:false,historicalCasReplay:false}\`.

| Decision | Exact meaning |
|---|---|
| \`LEGACY_COMPAT_UNATTESTED\` | Only positive fingerprint of **historical shape**: literal schemaVersion 2 or 3, \`series_v1\`, \`match_record_v1\`, timestamp, required top-level V2 or V3 arrays and source-specific tournament/stage/match/history/action fields; legal old empty \`resultHistory:[]\`, \`actionLog:[]\`, null \`undoPayload\` and omitted *optional* phases. **Not issuer/origin authentication or authorization for legacy Undo.** |
| \`STRICT_AUTH_REQUIRED\` | Strict marker \`strictPolicy.profile="web005.backup-v3.strict.v1"\` and \`version=1\`, expected three sidecar arrays, and basic valid V3 structure. Even \`producer:"web005"\` is merely client-provided text; no trusted key/issuer verified. **Never fall back to legacy.** |
| \`REJECT\` | Unknown/broken marker, unsupported schema/producer/version, contradicting critical V2/V3 fields, marker-free modern-only sidecar, hybrid V2/V3, forged \`trusted\`/signature/profile/capabilities metadata, structurally malformed or oversized/deep/cyclic payload, duplicate JSON object members in actual raw JSON text, or inconsistent references. |

**Fail-closed resource limits** baked into the pure source: \`maxJsonChars=1_048_576\`, \`maxDepth=32\`, \`maxNodes=25_000\`, \`maxArrayItems=5_000\`, \`maxObjectKeys=128\`; rejects non-JSON JS functions/bigints/nonfinite values, prototype-sensitive keys and property getters. For a **raw JSON string** the bounded key scanner rejects duplicate object members *before* \`JSON.parse\` could silently choose the last value. If a caller supplies an **already parsed JS object**, duplicate members have already been irreversibly lost: **future ingress MUST pass actual raw text and must enforce the request-body byte limit independently**. No size/duplicate guarantee for upstream parsers is claimed.

**Important scope difference:** a matching historical shape is **only preflight suitability**, not full semantic correctness or an old issuer proof. The future importer must still run exact-version Zod/OpenAPI common validation, graph/ID checks, domain invariants, authorization and approved restricted-legacy capability enforcement. The pure classifier never returns \`LEGACY_ATTESTED\`, \`VERIFIED_STRICT\` or \`TRUSTED\`.

**Information-theoretic limitation:** once an attacker removes every modern-only field to produce a byte-identical legal old producer shape, structural inspection alone cannot distinguish it from an actual unsigned V2/V3 file. Under owner-approved B1-A compatibility, it can only be considered **unattested restricted data recovery**, never inherited source Undo/Global Undo/Direct Revert/CAS replay privileges. **No anti-downgrade GUARANTEE**, Ed25519, canonical signing, trusted issuance ledger or key registry has been implemented. A00/HQ still owns the future trust architecture/legacy admission decision.

## 3. Test matrix and real execution receipt

**Authored test count:** **16** distinct \`node:test\` bodies; table-driven mutations within tests are not additional TAP totals.

- legal source-shaped V2 and V3 \`LEGACY_COMPAT_UNATTESTED\`; empty old V3 history/action, optional phases absent and null Undo payload; both raw object and raw JSON text;
- modern strict valid self-marker \`STRICT_AUTH_REQUIRED\`, even if it contains \`producer:"web005"\`; caller \`trusted=true\` rejected and **never** authenticated;
- marker-stripped modern still carrying modern-only \`matchStateRevisions\` or match-state \`stateRevision\` **REJECT**; fully stripped byte-compatible historical shape returns only restricted/unattested legacy classification;
- forged/partial/unknown strict profile, unsupported version/producer, spoofed signature \`REJECT\`;
- V2 carrying V3 stages, V3 carrying V2 tournament fields, inconsistent schemaVersion/critical policy strings, missing required V3 stage/phase/records, forged referenced stage/participant \`REJECT\`;
- unknown critical action-level portable IDs cannot be laundered as opaque historical fields; unknown numeric key **inside old opaque Undo payload** does not grant authority but may remain a legal historical extension;
- invalid syntax, duplicate raw JSON object keys, >1MiB text, excess depth/array, cyclic JavaScript object \`REJECT\`.

**Actually executed on author side:** none of the pinned application-unit commands — \`pnpm install --frozen-lockfile\` **NOT_EXECUTED**, \`pnpm --filter @workspace/api-server run typecheck\` **NOT_EXECUTED**, \`node --import tsx --test\` **NOT_EXECUTED**. No exact-HEAD native TAP pass/fail or exit exists; **do not count authored tests as PASS**. No real authenticated full monorepo checkout with frozen pnpm dependencies was available to A90 through connected GitHub source writer. This work does not require or authorize database resets.

**Actual automatic CI (separate evidence):** [GitHub workflow 38718588832](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38718588832), job \`116367250970\`: **FAIL** at \`Pack 19 snapshot consistency tests\` inherited pre-existing CI blocker; \`Static and database release gates\` and downstream steps **SKIPPED**. **Neither feature-specific test PASS nor feature-specific FAIL.** No manually triggered paid rerun.

**Reproducible trusted test commands for A50 / A60 independent runnable environment:**
~~~bash
git fetch origin fix/web-005/t060-r23a-profile-preflight
git switch --detach 14204bc9ec24f5902fddc3deb48d7592747d450a
git rev-parse HEAD
node --version     # Node 22 target
pnpm --version     # pnpm 10 target
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test \
  ./test/backup-v3-profile-gate.test.ts
~~~
**Capture:** actual exit codes, Node/pnpm/TS versions, TAP cases and failures/skip, exact \`git rev-parse HEAD\`. Pure gate tests need no \`TEST_DATABASE_URL\`, no PG16, no schema reset; do not rerun paid CI.

## 4. Independent QA, remaining risks, STOP

**A60 new SHA review requested** on the entire exact PR #58: actual source/test pair, raw JSON duplicate-key scanner, positive historical-shape requirements versus real old export corpus, typed fields, strict/hybrid anti-confusion, provenance flags, budgets, and runtime TAP. Independent verdict is **PENDING**; author does NOT self-approve.

**Security/high-consequence unresolved blockers:**
1. Real original historical V2/V3 fixture corpus not yet attested; current positive fixtures reconstruct fields from release schemas.
2. No authenticated modern issuer, Ed25519, canonical serialization or key registry; raw marker never proof of authentic strict issuer.
3. Zod could strip unknown strict sidecars and union could misclassify a V3 payload until future raw→typed version-tag bridge; current PR does not wire or fix parser.
4. Existing V2/V3 importers still have source-known nested Undo remap \`?? oldId\` fallback; this pure gate grants **no capability**, but does **not enforce** disabled legacy operations in the live server.
5. No action-local Undo/stage provenance or clone-local portable revision/rollback tested here; PR #56 separate strict validator continues independently, no integration.
6. Limits are pure function limits, **not** configured production HTTP transport/body limits. Parsed-JS-object inputs cannot reveal duplicate raw JSON keys.

**Next owner/A00 GO only (future):** approve trust/issuance strategy and restricted historical recovery UX; reserve exact importer/transport/schema files; bind raw preflight **before** Zod and preserve immutable classification through import, enforce no historical destructive authority server-side and complete API/PG16 regressions. **No such integration GO in R23A**. No merge, DDL/SQL, deploy, SWARM-006.

**Final:** \`PROFILE_PREFLIGHT_SOURCE_READY_FOR_QA / DRAFT_PR58_NEW_SOURCE_ONLY / REAL_UNIT_NOT_EXECUTED / A60_INDEPENDENT_QA_PENDING / BACKUP_V3_NOT_INTEGRATED / RELEASE_NO_GO / SWARM006_HOLD\`.
