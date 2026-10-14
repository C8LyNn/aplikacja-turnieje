# WEB-005 / A90 R22 — L2 Backup V3 strict-policy core

**Task:** `WEB-005-T060-A90-R22-B2-CORE` · **Role:** A90 — Backup V3 Integrity & Restore · **Date:** 2026-10-15 (Europe/Warsaw)  
**Mode:** `GO CODE LIMITED / TEST-FIRST ISOLATED`, exactly two NEW files on a separate new PR; **NO import/export wiring, schema or migrations**.  
**Status:** `NEW_SOURCE_CANDIDATE / NOT_WIRED / SOURCE_QA_PENDING / NATIVE_TESTS_NOT_EXECUTED / L2_INTEGRATION_DEPENDENCY`.

## 1. Verified package, precise GitHub custody

| Evidence | Grounded identity |
|---|---|
| New isolated candidate | **[PR #56 — modern Backup V3 strict policy core](https://github.com/C8LyNn/aplikacja-turnieje/pull/56)**, OPEN DRAFT, label `R22_NEW_SOURCE_CANDIDATE` |
| Base | `release/tournament-ops-20261013-01` @ **`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`** |
| Exact R22 new HEAD | **`77707092202ca79277de7bc57cc4e37e4c033171`** |
| Source branch | `fix/web-005/t060-b2-strict-policy-core-r22`, created directly from pinned release base, NOT a merge of prior candidates |
| New module | `artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts`, +285 lines, source blob **`c663c3d8347f22caf9375ae48a6f7670a6629d34`** |
| New unit test | `artifacts/api-server/test/backup-v3-strict-policy.test.ts`, +171 lines, test blob **`fdd1f5a7efc95f87ef4fcf38eb0393563bf56adc`** |
| Sequence | **test-first** `95f6ceddd029cad77df82218076433905438e6e9` → isolated validator `1b55e0788ec995db306d637e63bf3fb15e5bdd71` → test-only typing correction `77707092202ca79277de7bc57cc4e37e4c033171` |
| Existing unaffected B1 | [PR #41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) exact `f03cf3d09988a04ba9c2856e205d21f994ff67f1`, OPEN DRAFT, conditional A60 source acceptance |
| Existing unaffected B3A | [PR #48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) exact `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3`, OPEN DRAFT, conditional A60 source acceptance |

**Exact diff:** 3 commits, 2 new files, **zero modifications** to `backup-v3.ts`, `stage-basket-route-execution.integration.test.ts`, PR41/PR48, DTO/OpenAPI, DB schema, migrations or HTTP routes. No new integration/composite branch.

## 2. Product authorization and what was actually implemented

**Policy sources:** [owner B1=A](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_BACKUP_B1_COMPATIBILITY_APPROVAL.md), [owner-delegated B2=B/B3=A/B4=A/B5=A/B6=A](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_DELEGATED_BACKUP_B2_B6_DECISIONS.md) (decision Git blob `e6da9f88f1b4e520bae1f1b6183e862a0ff51c1a`). Delegation belongs to A00 under the owner's explicit Backup-topic authority; it is not a separate code/DB/release GO.

**Pure, new strict entrypoint:** `validateStrictBackupV3Policy(input: unknown): void` throws typed `BackupV3StrictPolicyError` containing `code="INVALID_BACKUP_V3"` and error issues. This is **only a TypeScript error code**, not an HTTP 400 or preclone guarantee. Source marker `strictPolicy.profile="web005.backup-v3.strict.v1"`, `version=1` is a **proposed** extension, not a verified current generated V3 property. No API serializer currently emits this marker.

| Chosen policy | Bounded implemented pure semantics | Remaining integration |
|---|---|---|
| **B1=A** modern/legacy | `classifyBackupV3StrictProfile`: `STRICT_MARKED` only for exact marker+version; malformed becomes `INVALID_PROFILE`, marker absent `UNATTESTED`. Strict-only validator rejects marker removal. **Never returns a trusted `LEGACY`** | Without trusted producer provenance, an attacker can strip the marker and try an existing permissive legacy path. Pure module **does not prevent LIVE-import downgrade**. Requires A30/A00 positive legacy-authenticity design / allowlist / versioned envelope or equivalent, before wiring |
| **B2=B** history | Require a completed new-strict match to have latest result history; compare existing serialized stage/round/player/winner/score/type/reason/bestOf/time fields, reject contradictions. Strict missing history rejects; legacy allowed outside this entrypoint | Exact domain exceptions for BYE/NC/walkover/revert and old producer corpus acceptance need A70/A60 review; no legal-legacy rejection implemented |
| **B3=A** revision | Proposed `strictPolicy.matchStateRevisions[]` requires one unique positive `stateRevision` for each match. **No equality** with `resultHistory.revision` | Actual state-version serializer, clone-local CAS rebase, `0028_match_revision.sql` physical proof with A20; no direct DB revision restoration |
| **B4=A** action provenance | Proposed `strictPolicy.actionOrder[]` has complete action indexes, unique portable IDs, contiguous total ordinals (handles equal timestamps). `completionActions[]` binds an indexed typed `match_result_submitted` source log action to a history revision and active/undone status | A70 must verify real action type, Global Undo top action and tie-break/writer semantics; portable clone action ID remapping and active state not integrated |
| **B5=A** nested IDs | Recursively inspect only exact recognized Undo remap keys `playerId/player1Id/player2Id/winnerId/matchId/prevFeaturedMatchId`, fail on unknown/foreign/malformed referenced numeric backup IDs; other opaque keys not inferred | No live importer mapping changes; legacy restricted unsafe Undo/Revert path to be implemented later |
| **B6=A** errors/rollback | Errors typed `INVALID_BACKUP_V3`, unit-only; marker/profile malformed fail strict validator | No HTTP `400 INVALID_BACKUP_V3`, no preclone hook, no PostgreSQL transaction, no full late rollback implemented or claimed |

**Security blocker `L2_INTEGRATION_DEPENDENCY`:** A raw JSON marker is not trusted provenance. Removing it causes `UNATTESTED` (the strict path throws), but the current importer is completely **unmodified**. Without an authenticated/allowlisted legacy discriminator the full product could silently accept stripped modern JSON as legacy. **This PR does NOT claim secure downgrade-resistant import classification.** A30 and A00 must approve the compatibility discriminator; A60 must review exact new SHA; A20/A70/A110 confirm CAS/Undo/T055 compatibility. Do not call `SOURCE_ACCEPTED` on author's behalf.

## 3. Test-first deterministic unit contract — authored vs executed

Eight `node:test` test bodies are authored, including table-driven negatives **inside** individual bodies; they are not measured PASS. Contract:

- valid completed result/history with `stateRevision=7`, `resultHistory.revision=2` (intentional distinction);
- unmarked legal historical V3 projection `UNATTESTED` and rejected by strict-only entrypoint, **not** rejected by an actual legacy importer (not wired);
- stripped marker and unknown strict version rejected by strict-only entrypoint;
- B2 contradictory winner, score, type, completedAt or missing newest history rejected;
- B3 missing/zero/duplicate/foreign portable CAS revision rejected;
- B4 equal timestamp with two different action ordinals accepted, duplicated ordinal rejected; bad completion provenance, stale history link, incorrect active flags and missing payload rejected;
- B5 recognized foreign nested player/match IDs and mistyped recognized ID rejected, arbitrary numeric diagnostic in unknown field is not misclassified;
- B6 typed error without any claim of HTTP response/SQL rollback.

**Test fixture scope:** focused source-confirmed match/history/action projections; it is **NOT** a complete generated Backup V3 request fixture and deliberately does not claim importability. The full baseline `validateBackupV3` and actual V2/old V3 compatibility are separate integration obligations.

**Actual R22 execution by A90:** source compilation on a complete pinned checkout **NOT_EXECUTED**; `pnpm` frozen deps **NOT_EXECUTED**; native unit test **NOT_EXECUTED**; DB/API tests **NOT_EXECUTED**. No actual app command exit code or TAP totals. Reading GitHub code, committing source and a minimal local TypeScript syntax probe do not constitute native tests of this PR.

**Exact test instructions for a trusted complete PR56 checkout:**
~~~sh
git fetch origin fix/web-005/t060-b2-strict-policy-core-r22
git switch --detach 77707092202ca79277de7bc57cc4e37e4c033171
git rev-parse HEAD
node --version                    # Node 22
pnpm --version                    # pnpm 10
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test ./test/backup-v3-strict-policy.test.ts
~~~
This pure test requires **no DB URL and no schema reset**. A50/owner runner supplies real command, exit, TAP and environment. Avoid unapproved paid CI reruns. Full PG16 B1 positive/legacy-null/corrupt/rollback and B3A two-writer MVCC remain separate SHA-bound tests on PR41 and PR48.

## 4. Independent QA gate, code freeze and next exact GO

- **A60** independently review this NEW PR56 SHA (not A60 R21 acceptance for old PR41/48): strict marker classification/downgrade impossibility without provenance, newest history parity, source completion-action types, CAS distinction, recognized nested IDs, and unit test/typecheck evidence.
- **A30** must sign off on positive historical producer provenance: `UNATTESTED` alone is NOT a safe legacy grant.
- **A20** review migration 0028 and match revision trigger, safe clone revision remapping; **A70** action semantics/global Undo; **A110** owner-approved T055 `basketConfigRevision` export/restore.
- **A00** may issue **separate future exact-file source GO** only after decisions and A60 findings, to update generated V3/OpenAPI producer, strict-policy serialization and validated safe legacy classification, then separately preclone importer hook and transactional fixtures. PR41 and PR48 remain frozen; no edit of their shared files under this R22 assignment.
- **Risk owner:** A00/HQ remains responsible for accepting or solving security-positive old producer provenance, with A30 peer and A60 independent review. **No automatic legacy downgrade.**

**STOP:** no merge/cherry-pick/rebase, no shared/prod DB, no SQL/DDL/migration, no exporter/importer code edits, no app deployment, no SWARM-006 activation.

**FINAL:** `R22_L2_SOURCE_CANDIDATE_CREATED / NOT_WIRED / L2_INTEGRATION_DEPENDENCY / A60_EXACT_SHA_PENDING / TESTS_NOT_EXECUTED / WEB005_RELEASE_NO_GO / SWARM006_HOLD`.
