# WEB-005 — A90 R23B / P58-P2-01 Legacy Backup Semantic Hardening

**Task:** \`WEB-005-T060-A90-R23B-LEGACY-SEMANTICS\` · **Date:** 2026-10-15, Europe/Warsaw  
**Role:** A90 — Backup V3 Integrity & Restore  
**Authorized scope:** narrow test-first **source fix on existing PR #58**, only its two dedicated files; PR #56, import/export, API routes, OpenAPI/Zod, SQL/migrations and all other PRs **frozen**.  
**Author result:** \`LEGACY_PROFILE_SEMANTICS_SOURCE_READY_FOR_QA / A60_NEW_SHA_REVIEW_PENDING / NOT_WIRED / RELEASE_NO_GO / SWARM006_HOLD\`.

## 1. Sources and exact GitHub custody

| Item | Verified identity |
|---|---|
| Existing candidate | **[PR #58](https://github.com/C8LyNn/aplikacja-turnieje/pull/58)**, OPEN DRAFT, unmerged; branch \`fix/web-005/t060-r23a-profile-preflight\` |
| Release baseline | \`release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\` |
| Previous independently reviewed PR58 SHA | \`14204bc9ec24f5902fddc3deb48d7592747d450a\` |
| **New current PR58 HEAD** | **\`e8100f7b0c1071c2a98880d4eb7947514fc58185\`** |
| Modified source | [backup-v3-profile-gate.ts](https://github.com/C8LyNn/aplikacja-turnieje/blob/e8100f7b0c1071c2a98880d4eb7947514fc58185/artifacts/api-server/src/application/backups/backup-v3-profile-gate.ts), **Git blob SHA-1 \`518526d8d9ff2cef368261788e12c9f8290754f5\`**, 463 lines |
| Modified tests | [backup-v3-profile-gate.test.ts](https://github.com/C8LyNn/aplikacja-turnieje/blob/e8100f7b0c1071c2a98880d4eb7947514fc58185/artifacts/api-server/test/backup-v3-profile-gate.test.ts), **Git blob SHA-1 \`04f6dc8834f11d63f1b3710ae75c4ad7f6419f19\`**, 419 lines |
| Exact GitHub diff vs previous SHA | 3 commits ahead, 0 behind, **exactly 2 previously authorized files**: source **+63/−3**, test **+210/−6**; zero other edits |
| Unaffected [PR #56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) | HEAD \`a7f71a7e7efdabd479b358a3cee80bc6359c4321\`, OPEN DRAFT, unmerged and unchanged |

**Independent first-pass source QA:** [A60 R23A PR58 raw-profile review](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R23A_PR58_RAW_PROFILE_INDEPENDENT_QA.md), Git blob \`cb69ce4d3e9569f7c4aca1608b5a5c5d9e791b20\`, \`PASS_WITH_CONDITIONS\` at **old SHA only**, finding \`P58-P2-01\`: V2 positive \`completed/bye/system_bye\` specimen omitted required participant, winner and \`completedAt\`. This is a real *test-fixture validity* and *classification-scope* defect, **not evidence of a live privilege escalation**. [A70 R23A action provenance contract](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a70-r23a-action-provenance/docs/web-005/WEB-005_A70_R23A_ACTION_PROVENANCE_CONTRACT.md), blob \`5213cbb8c2d449d855b04f94cfefc1e2981916ce\`, distinguishes valid completed system BYE, manual results, historic Undo/Revert and action-local closure. Neither document authorizes importer integration.

**Real release source reconfirmed:** \`artifacts/api-server/src/application/backups/backup-v2.ts\` \`validateBackupV2\` and \`backup-v3.ts\` \`validateBackupV3\` require completed result type plus valid timestamp; \`bye\` requires player1, player2 absent/null, winner=player1, null scores, \`resultReason=system_bye\`. V2 source additionally validates history timestamps/revision and legitimate result history after revert. V3 source enforces stage participant graph and stage action relationships. **Actual historical exporter archives were NOT supplied or verified**; reconstructed fixtures derive from release source/contracts, not a signed archived producer corpus.

## 2. Implemented narrow fix, not full semantic import validation

**Test-first sequence (actual commits):**
1. \`160c33e8966547eb34affb2085efb0c64c354d16\` — corrected semantically coherent V2 system-BYE fixture (participant, winner, null opponent/scores, required completion time, matching historical result and nonundoable system action); aligned V3 stage/player/membership exemplar to current declared enums, added \`v3Bye\` with matching stage/match/history/system action; **8 new source-confirmed positive/negative tests before validator edit**.
2. \`3470762ac8635b63a15a18f7a18300c66876cbfb\` — minimal pure-source \`plausibleResult\` + \`plausibleMatchLifecycle\` predicates: reject clearly contradictory completed/missing-time/system-BYE/winner/entrant/score/reason conditions, reject stale current result on pending/cancelled, retain authentic old history after revert, check essential history result/time coherence. No DDL or state/writer changes.
3. \`e8100f7b0c1071c2a98880d4eb7947514fc58185\` — **2 additional non-restrictive legal positives**: source-valid played/walkover/no_contest and pending-with-past-history after Revert; **26 authored test bodies total** (original 16 + 10), table-driven subcases are not extra TAP counts.

**Scope guard:** the pure preflight now checks only a small subset of **unambiguously source-confirmed** lifecycle/result consistency. It still returns \`LEGACY_COMPAT_UNATTESTED\` solely as **restricted historical-shape identification**; it **does not call \`validateBackupV2\`/\`validateBackupV3\`**, determine true issuer/archival provenance, check unique round/match pairs or implement state/action-local Undo semantics. The fixture \`invalidDomain\` deliberately has distinct backup IDs but a **duplicate V2 round/match number** that the real \`validateBackupV2\` rejects; preflight *still* returns \`LEGACY_COMPAT_UNATTESTED\`, with \`authenticated=false\` and all authority flags false. This is an intentional executable test of **classification != domain PASS != import permission**.

**No accidental backward incompatibility:** For completed \`bye/system_bye\`, a correctly present player1 and winner are essential, but optional nullable second player and scores may remain **omitted** (not only explicit \`null\`), matching generated V2/V3 old schemas and writer null semantics. Old \`resultHistory:[]\`/\`actionLog:[]\`, nullable \`undoPayload\`, omitted optional V3 phase arrays remain supported. Prior valid reverted matches may be currently pending while preserving legitimate older result-history rows; do not require newest-history parity against a pending current match at this preflight gate.

## 3. Regression and actual execution ledger

**26 source-authored \`node:test\` bodies:** original 16 + R23B 10 cover:

- **positive** V2 and V3 source-contract coherent completed \`system_bye\`, corresponding result-history and nonundoable source system action; raw JSON/object acceptance;
- **negative** absent \`completedAt\`, missing/null first player, absent/foreign/mismatched winner, added second entrant, score in BYE, incompatible \`resultType\`/\`resultReason\`, unknown or stale completed/pending state, malformed completion timestamp;
- **positive** legitimate omitted nullable BYE second-player/scores, valid played (best-of score), walkover and no_contest representations, pending after historic manual Revert with earlier history preserved;
- **boundary** structural-only preflight accepts an intentionally **domain-invalid duplicate V2 round/match pair** but cannot approve import;
- **security regressions** marker-stripped modern with modern-only sidecar **REJECT**, V2/V3 hybrid **REJECT**, client \`trusted=true\` **REJECT**, intact strict with marker **STRICT_AUTH_REQUIRED**, and every classification has \`authenticated=false\` and immutable false \`importAuthorized\`/\`historicalUndo\`/\`historicalRevert\`/\`historicalCasReplay\`;
- all previous raw JSON duplicate-key, size/depth, unknown profile and sidecar protections retained.

**Safe isolated execution in the connected JS evaluator, not a native Node test run:** The exact GitHub source and test *contents* were independently retrieved at the named commit/blobs; TypeScript-only syntax was mechanically erased in-memory, and the 26 test functions were evaluated with a minimal JavaScript assertion/test shim inside isolated V8. This is **NOT** official Node \`node:test\`, is **NOT** a full TypeScript typecheck, and does **NOT** use pinned installed repo dependencies or any actual database.

| Test stage | SHA / outcome | Meaning |
|---|---|---|
| **RED, test-first commit** | \`160c33e8966547eb34affb2085efb0c64c354d16\`; old source blob \`c180da5b9d8aaedb44d83fcc8831aeb6fa70b988\`; new first test blob \`3a15a6809862bdbad2a688f54275651386a9d4e6\` | **20/24 isolated V8 checks pass, 4 fail** on exactly the missing-time/participant-winner/result reason/completion-lifecycle cases that motivated the source change |
| **GREEN, current PR58 HEAD** | \`e8100f7b0c1071c2a98880d4eb7947514fc58185\`; source blob \`518526d8d9ff2cef368261788e12c9f8290754f5\`; test blob \`04f6dc8834f11d63f1b3710ae75c4ad7f6419f19\` | **26/26 isolated V8 JS-erasure checks pass; 0 failed** |
| **Actual native pinned \`pnpm\` typecheck/Node22 \`node:test\`** | NOT_EXECUTED; exit / TAP = N/A | No full exact-SHA checkout with frozen dependency installation available in authoring connection |
| **HTTP/import/PostgreSQL16/Undo** | NOT_EXECUTED | Outside R23B authorization; module still NOT_WIRED |
| **Automatic GitHub Actions on current SHA** | [Run 38728665362](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38728665362), job \`116400707261\`: FAILURE at inherited **Pack19 snapshot consistency** step, static/database gates SKIPPED | Not a P58-P2-01 native feature PASS or FAIL. No manual paid rerun |

**Exact next authorized native test commands (A50 or A60 clean pinned full repo checkout, no DB required):**
~~~sh
git fetch origin fix/web-005/t060-r23a-profile-preflight
git switch --detach e8100f7b0c1071c2a98880d4eb7947514fc58185
git rev-parse HEAD
node --version                   # target Node22
pnpm --version                   # target pnpm10
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test ./test/backup-v3-profile-gate.test.ts
~~~
Record actual exit/TAP, Node/pnpm/TS versions, test environment and byte-exact SHA. **Do not backfill native PASS from the V8 isolated erasure experiment.**

## 4. Archived fixture gaps and residual source-integrity risks

1. **No proven archival corpus:** the new V2/V3 positive samples are synthetic, reconstructed from versioned release schema and validator/writer semantics; actual saved pre-modern V2/V3 exports with dates, producer binary/SHA, archived manifest and associated domain database snapshots remain unverified. A60 must not label synthetic data \`ARCHIVAL_AUTHENTICATED\`.
2. **No full real-semantic attestation:** \`validateBackupV2\`/\`validateBackupV3\` include more constraints (e.g. unique round/match, participant/stage graph, action/history consistency, routing). Confirm archive cases against the real validators with an authorized full checkout, then full import on separately authorized disposable PG16 only after future wiring GO. Matching preflight status by itself proves none of this.
3. **No provenance / downgrade guarantee:** a strictly modern backup stripped byte-for-byte to recognized old format remains indistinguishable from unsigned historic. \`LEGACY_COMPAT_UNATTESTED\` never grants trust or old permissions; no issuer signature/Ed25519/trusted registry exists.
4. **No real privilege enforcement:** the current importer is unchanged and may retain historical source undoPayload remap fallback; false capabilities on an unwired pure return object do not disable any actual server-side operations. A30/A00/A70 own future trust and action-local/Undo/CAS integration.
5. **No transport bridge:** raw JSON duplicate-key detection and 1MiB/32-depth bounds have pure-function scope; actual HTTP parsing/Zod union may already strip marker or duplicate members. Future ingress must use raw-before-parse and retain immutable classification, separately authorized.
6. **Independent A60 exact new SHA review PENDING**, unlike the previous R23A source acceptance that covers only \`14204bc...\`.

**A60 review focus:** exact SHA + 2-file diff, positive V2/V3 semantic source shape, V3 membership/action provenance source consistency, legal optional-absent fields, no false old Undo or CAS authority, sufficient fail-closed lifecycle parity without over-rejecting actual archived formats, and review of isolated RED/GREEN versus native NOT_EXECUTED receipts. A00/A10 to update P25/PR58 registry only after independent source acceptance.

**Final:** \`LEGACY_PROFILE_SEMANTICS_SOURCE_READY_FOR_QA / P58_P2_01_AUTHOR_FIX_PUBLISHED / A60_EXACT_SHA_PENDING / NOT_WIRED / TRUE_ARCHIVAL_FIXTURES_UNAVAILABLE / NATIVE_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD\`. No importer/PR56/other PR edits, no merge, SQL, staging/prod, deployment or SWARM-006.
