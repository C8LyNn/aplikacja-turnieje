# WEB-005 — R23C / NEXT SAFE INTEGRATION BATCHES AND CONFLICT RECONCILIATION

**Plan only.** Task `WEB-005-T018-A10-R23C-COMPOSITE-REGISTRY` · Source state 2026-10-15. No batch operation, merge, rebase or SWARM006 is authorized by this plan.

**Completed isolated composition:** C01 / PR60 `fa3261b2c9510e110ac9eba21726812d3401a525`, 6 source packets copied, 14 exact blobs, 0 manual conflict rewrites, **0/15 historical path conflicts jointly resolved**, API integration EXIT_1. The six included packages remain OPEN/DRAFT at their own heads. Current baseline source set 25 historic + five R23C sources P26–P30.

## Dependency-ordered candidate batches

### B02 — CI & API integration repair

**Lead:** A40/A50/A60. **Source scope:** C01 PR60 exact failed integration TAP root cause isolate; A50 exact full source checkout Native runner and per-suite TAP; Pack17 full fail-closed parser review.

**Dependencies:** C01. **Blockers:** B1-QA-01.

**Safety:** NO paid CI rerun without A00. **Acceptance:** exact PR HEAD pins, conflict hunk map, source+integration commit separation, independent A60 QA, named native TAP and actual exits. No release claim.
### B03 — Tournament API routes + Undo

**Lead:** A70/A100/A30/A60. **Source scope:** P06 PR39; P09 PR42; P11 PR44; P13 PR46; P18 PR51; P28 PR64.

**Dependencies:** domain acceptance; routes/tournaments.ts joint conflict handling; exact history and LIFO semantics. **Blockers:** 7 pairwise routes path overlaps + shared Undo test.

**Safety:** A00 explicit disposable integration GO. **Acceptance:** exact PR HEAD pins, conflict hunk map, source+integration commit separation, independent A60 QA, named native TAP and actual exits. No release claim.
### B04 — Backup V3 qualification, transport, action provenance

**Lead:** A90/A70/A30/A20/A60. **Source scope:** P08 PR41; P15 PR48; C01 P23 PR56/P25 PR58; P28 PR64; P29 PR66; P30 PR67.

**Dependencies:** real issuer/anti-downgrade; raw-before-Zod; full V2/V3 validators; clone-local action ID closure; zero-write HTTP 400/rollback. **Blockers:** same backup-v3.ts and integration test conflict; not-wired modules; unexecuted fail-first security.

**Safety:** SECURITY_HARD_STOP no privileged import before controls. **Acceptance:** exact PR HEAD pins, conflict hunk map, source+integration commit separation, independent A60 QA, named native TAP and actual exits. No release claim.
### B05 — Basket CAS + DB schema/migrations

**Lead:** A20/A110/A00/A60. **Source scope:** P05 PR38; P22 PR55; P27 PR63.

**Dependencies:** A00 D01-D04 signed; physical PG16 ledger verification; T055 numeric id reserved only after graph; server ETag/If-Match D1-D5; writer lock order and deadlock tests. **Blockers:** A110 P2 auth-revoked draft; schema migration absent.

**Safety:** no SQL or PG reset without separate authorization. **Acceptance:** exact PR HEAD pins, conflict hunk map, source+integration commit separation, independent A60 QA, named native TAP and actual exits. No release claim.
### B06 — Frontend tournament detail, stage progress, standings

**Lead:** A110/A120/A80/A60. **Source scope:** P10 PR43; P17 PR50; P21 PR54; P14 PR47; P24 PR57; P26 PR61; P27 PR63 (only after FIX).

**Dependencies:** tournament-detail.tsx 3-way reconciliation; stage-progress-view.tsx reconciliation; Swiss stage caller/Undo API stabilization; auth revocation client fix; native/browser tests. **Blockers:** frontend overlap pairs; disabled client privacy P2.

**Safety:** no client feature activation without server CAS and security GO. **Acceptance:** exact PR HEAD pins, conflict hunk map, source+integration commit separation, independent A60 QA, named native TAP and actual exits. No release claim.
### B07 — Security, auxiliary and release packaging

**Lead:** A00/A30/A100/A50/A60. **Source scope:** P03 PR34; P04 PR37; P16 PR49; P19 PR52; P20 PR53.

**Dependencies:** independent HTTP checks; session/private cache; security regression; remaining original P01-P25 tasks; WEB004 38-case closure. **Blockers:** no full CI/browser integrated SHA.

**Safety:** no release/transfer without HQ. **Acceptance:** exact PR HEAD pins, conflict hunk map, source+integration commit separation, independent A60 QA, named native TAP and actual exits. No release claim.

## Known file conflict groups — each retained UNRESOLVED

| Historic pair | Both in C01? | Shared file(s) | Status |
|---|---|---|---|
| P06↔P09 (#39/#42) | NO | `artifacts/api-server/src/routes/tournaments.ts` | **UNRESOLVED** |
| P06↔P11 (#39/#44) | NO | `artifacts/api-server/src/routes/tournaments.ts` | **UNRESOLVED** |
| P06↔P13 (#39/#46) | NO | `artifacts/api-server/src/routes/tournaments.ts` | **UNRESOLVED** |
| P06↔P18 (#39/#51) | NO | `artifacts/api-server/src/routes/tournaments.ts` | **UNRESOLVED** |
| P08↔P15 (#41/#48) | NO | `artifacts/api-server/src/application/backups/backup-v3.ts`; `artifacts/api-server/test/stage-basket-route-execution.integration.test.ts` | **UNRESOLVED** |
| P09↔P11 (#42/#44) | NO | `artifacts/api-server/src/routes/tournaments.ts` | **UNRESOLVED** |
| P09↔P13 (#42/#46) | NO | `artifacts/api-server/src/routes/tournaments.ts` | **UNRESOLVED** |
| P09↔P18 (#42/#51) | NO | `artifacts/api-server/src/routes/tournaments.ts`; `artifacts/api-server/test/revert-match.integration.test.ts` | **UNRESOLVED** |
| P10↔P17 (#43/#50) | NO | `artifacts/tournament-manager/src/pages/tournament-detail.tsx` | **UNRESOLVED** |
| P10↔P21 (#43/#54) | NO | `artifacts/tournament-manager/src/pages/tournament-detail.tsx` | **UNRESOLVED** |
| P11↔P13 (#44/#46) | NO | `artifacts/api-server/src/routes/tournaments.ts` | **UNRESOLVED** |
| P11↔P18 (#44/#51) | NO | `artifacts/api-server/src/routes/tournaments.ts` | **UNRESOLVED** |
| P13↔P18 (#46/#51) | NO | `artifacts/api-server/src/routes/tournaments.ts` | **UNRESOLVED** |
| P14↔P21 (#47/#54) | NO | `artifacts/tournament-manager/src/components/stage-progress-view.tsx` | **UNRESOLVED** |
| P17↔P21 (#50/#54) | NO | `artifacts/tournament-manager/src/pages/tournament-detail.tsx` | **UNRESOLVED** |

### Composition precedence and stacking

- PR61/P26 directly uses PR57/P24 as Git base; C01 already carries exact P24 source. Apply only the PR61 delta/one test path in a future authorized C02; do **not** blindly reapply the parent patch.
- PR66/P29 directly bases on C01 composite SHA, not the original release. Future authorized composer must preserve its baseline and detect existing inherited blobs, not count them as fresh PR66 source modifications.
- PR63/P27 is a feature-gated client and not eligible for activation or combined feature acceptance until P2 revoked GET fix, backend D1–D5 and owner permission. It can remain source-inventory-only.
- PR64/P28 and PR66/P29 must be interoperably tested using actual action-local and full validator callbacks; stub-only suites cannot qualify strict import privileges.
- PR67/P30 is fail-first anti-downgrade tests, not an importer or green suite; a true implementation must later turn expected RED into native verified GREEN without weakening detection.

## Conflict and quality controls for each future batch

1. Freeze refs/SHA; obtain A00 exact file allowlist and forbidden actions. Read old and new trees, build `origin-pr, origin-SHA, blob-SHA, target SHA` matrix.
2. In disposable branch/worktree only, apply compatible blobs and explicitly record semantic hunks where source PRs edit the same path. Keep original P01–P30 untouched.
3. Test source API/schema type compatibility, Undo idempotency and stage lifecycle before combining frontend state with dependent routes.
4. Run approved DB-free unit/source suites; secure owner-authenticated separate isolated PG16 authority before any schema creation/reset or migration. Save TAP, tool versions, sha256 and exact exit.
5. A60 independently examines new composite SHA and every conflict resolution; mark a collision RESOLVED only if both sources co-exist correctly in a reviewed commit and required tests pass.
6. Freeze composite and produce signed rollback/handoff evidence; owner separately decides new batch and eventual FINAL_HANDOFF_GO.

**Stop on first failed gate**; don't convert existing CI failure, incomplete WEB-004 evidence or required security control into accepted debt by assertion.

`C01_INTEGRATION_BLOCKED / NO_PROTECTED_MERGE / RELEASE_NO_GO / SWARM006_HOLD`.