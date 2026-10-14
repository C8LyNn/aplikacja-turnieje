# WEB-005 — CENTRALNE PROMPTY R22 — REAL IMPLEMENTATION SLICE, SAFETY GATES

**Wersja:** R22.1 · 2026-10-14 (Europe/Warsaw)  
**Repozytorium:** C8LyNn/aplikacja-turnieje  
**Gałąź nadrzędna instrukcji:** chore/web-005/t000-wave1-control  
**Koordynator:** A00 / local Implementation Lead, podlegający jednej globalnej Queen/HQ poza WEB-005.  
**Tryb:** **R22 GO on limited self-contained test-first code; DB/Backup integration conditional**, other agents quality/gates only. No SWARM-006 activation.
**Estimated after R21:** ~4–6 additional WEB-005 waves (**R22–R25/R27**) to source closure and one final handoff if owner decisions and implementation/test reviews do not reveal major blockers; not a release estimate or commitment. More waves may be needed if schema/data migration, legacy evidence or security policy are unresolved.

## §0. Wspólny kontrakt i definicja postępu

1. Wszyscy czytają §§0–2 oraz wyłącznie swoją sekcję **AGENT Axx**. Numer Axx wynika z przypisanej roli wątku. A00 to lokalny lead, nie Queen.
2. **Najpierw weryfikuj live GitHub PR HEAD/base + pliki**. Repo release baseline znany w R21: \`release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`. P01–P21 / PR #34–54 to 21 OPEN DRAFT, unmerged, wszystkie na poprzednim exact SHA A60, **nie 21 zintegrowanych lub przetestowanych zmian**. NOWE R22 pakiety mają osobną nazwę/PR z etykietą \`R22_NEW_SOURCE_CANDIDATE\`; nie podmieniaj istniejących source SHA ani nie dopisuj nowej poprawki do cudzego PR bez przypisania własności. Przed nowym PR sprawdź brak duplikatu.
3. **Produktowe decyzje już podjęte, nie pytaj ponownie**:
   - [Sport S1–S6 i S4-H](./WEB-005_R21_OWNER_DELEGATED_SPORT_DECISIONS.md): S1 **TS-B** atomic terminal Swiss correction; S2 **generated currentRound + actionableRound**; S3 **SCORE_GROUP_FIRST** with rematch secondary; S4 stage-scoped fair BYE; S4-H completed NC/walkover as previous pairing but cancelled not; S5 decisive DE GF/reset runner-up; S6 shared ranking by second-loss elimination wave.
   - [T055 Basket optimistic concurrency](./WEB-005_R21_OWNER_T055_BASKET_CAS_APPROVAL.md): D1=B monotonic basketConfigRevision, D2=B GET ETag/PUT If-Match, D3=B stale 412/no mutation, D4=A missing 428/no mutation, D5=B atomic roster/stage mutation verification, D6=B retain local draft/manual reconcile.
   - [Backup B1-A](./WEB-005_R21_OWNER_BACKUP_B1_COMPATIBILITY_APPROVAL.md) and [Backup B2–B6 under owner topic delegation](./WEB-005_R21_OWNER_DELEGATED_BACKUP_B2_B6_DECISIONS.md): modern strict profile, safe legal old V2/V3; B2=B history contradictions reject but legal missing legacy history -> disabled unsafe Revert; B3=A portable match state revision separate from resultHistory revision; B4=A deterministic typed action provenance; B5=A strict new nested ID remap and legacy degradation; B6=A preclone 400 INVALID_BACKUP_V3 and full late rollback. This is policy, not code or executed QA.
   - **EXEC-B owner preference**: after formal WEB005 source/policy closeout, SWARM-006 inherits not-yet-executed app tests; still must pass before staging/live. A separate precise final handoff GO, test-debt inventory and A60 verdict remain mandatory; cannot use B to waive source defects or launch SWARM-006 now.
4. **R22 application-source GO has TWO fixed lanes + ONE test-contract/preflight lane**. **GO L1 A80 Swiss pairing** limited to \`artifacts/api-server/src/domain/tournament/swiss.ts\` + \`artifacts/api-server/test/swiss.test.ts\` in one new feature branch, after confirming no overlapping active unmerged PR. **GO L2 A90 new isolated pure strict-profile Backup V3 policy validator/unit tests** in dedicated new module/test file, **not** modifying existing \`backup-v3.ts\`, PR41 or PR48 source and **not** wiring import/export until separate GO and A20 evidence. **L3 A110 T055** authorizes only typed fail-first acceptance tests/DTO/API contract (not production write flow, DDL or revision schema) while A20 resolves physical migration/version design; no endpoint mutation code until a future exact reviewed GO. Independent A60 tests/review on new SHA.
5. Code lanes are **test-first**: source tests written/added ≠ tests executed. Agents must record exact commands, environment, exit/TAP if actually executed. A50 has no connected full clean checkout/pnpm or physically isolated PG16 by R21; DO NOT fabricate test passes. If code can't be safely compiled/executed from available environment mark \`NOT_EXECUTED\`; provide exact compile/test path and handoff to SWARM-006 later. Small self-contained pure Node test might be runnable by own tools only if actual checkout/imports available and authenticated.
6. **Safety:** NO merge/rebase/cherry-pick into release/main, no WEB005 composite branch, staging/live, Replit as integration authority, prod/shared DB DDL/reset, unapproved paid CI, private credential/raw backup exfiltration, security weakening, unapproved ownership of another PR. A20 may inspect \`lib/db/migrations/0028_match_revision.sql\`, \`lib/db/src/schema/tournaments.ts\` and propose future monotonic basket revision migration but **NO SQL/DDL or physical PG reset** in R22. Manual test of PG16 requires owner-provided physically isolated disposable instance, \`TEST_DATABASE_URL\`, \`tm_test_*\`, written reset scope, no DATABASE_URL fallback.
7. **Still high-impact owner questions outside delegated sport/Backup:** public Direct Revert MP2B CAS+Host rollout RA/RB/RC; Steam absent-secret 403/503; session TTL/digest/rotation; legacy PR53 raw ownerless cache erasure vs scoped retention; original WEB004 38 case IDs (29 secondary, nine missing original) and signed case-level dispositions. A00 continues owner decision collection **without inventing defaults, general authorizations or a new report-only wave**. If owner has since selected an option, record genuine source and update R22 gate; no blank option treated as signed.
8. **Quality provenance:** [Independent A60 R21](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md) = HANDOFF_NOT_READY, source-scoped/conditional for old PRs. [A10 R21 21-packet manifest](./agent-reports/A10/WEB-005_A10_R21_FINAL_ONLY_MANIFEST_GATE.md): 96 pinned per-file digests, 15 overlaps, 38 original-case evidence not fully available. [A50 R21 real receipt](./agent-reports/A50/WEB-005_A50_R21_NATIVE_TEST_OR_OWNER_BLOCKER.md): 0 native app tests. No release/composite SHA.
9. **Avoid endless reporting**: If an agent's unchanged lane has no new evidence, return concise \`NO_NEW_EVIDENCE / HOLD\` and a one-paragraph direct GitHub handoff. A00 must not declare a whole wave's success from repetitive documents alone. Lead prioritizes actual R22 source changes, QA response and owner choices.
10. Each R22 active agent publishes \`WEB-005_Axx_R22_HANDOFF.md\` in \`docs/web-005/agent-reports/Axx\` (central docs branch or own docs-only branch) with task ID, exact new/base HEAD, modified paths, source testing semantics, actually executed commands/exits (or NOT_EXECUTED), A60 independent verdict, blockers/owner actions and direct GitHub link. App code only in assigned feature branch/PR, no source commits to control doc branch. READ_ONLY agents issue brief \`R22_NO_CHANGE_RECEIPT\` only if relevant.
11. **Future SWARM-006 remains held** until original accepted WEB004 R2 backlog is source-fixed/explicitly owner-dispositioned, 38-case provenance is correctly recorded or exceptional risk accepted, A60 exact source/owner signoff, A10 final-only manifest/rollback/DAG and owner/HQ fresh \`FINAL_HANDOFF_GO\`. Tests can be transferred only as owner-approved exact-SHA debt, still a hard integrated release stop.

## §1. Precise live source inventory at R22 authorization

Existing unmerged source: PR #34–54, 21 unchanged HEAD SHAs, release base \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`. Key fixtures:
- **PR41** P08 \`f03cf3d09988a04ba9c2856e205d21f994ff67f1\` Backup QP/QPE/OP parity, source conditional, PG16 NOT_EXECUTED.
- **PR42** P09 \`021bed269f9ea8ac8ce53caeea44263c098aa2dd\` Undo roster global LIFO, source conditional, PG16 NOT_EXECUTED.
- **PR53** P20 \`d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34\` private cache verified-owner rebind, source scoped accepted, old raw orphan risk/owner decision.
- **PR54** P21 \`bfa9d075b431185aa8bbf87bf021d64dde8ae22f\` historical RR denied guards, source conditional; PR47 child frontend overlap.
- **PR45** P12 \`a7a87bc019731191dbfa44bee6939e3fa25e27f4\` terminal RR stage-limited roster, source conditional, not all Swiss TS-B rules.
- **PR47** P14 \`f09a13623faca8d7ab29b09a2c5b43907c2acd0b\` presentation DE, source conditional.
- **PR48** P15 \`2a8a4c72cb4a3a37402a346fd0acc83b03b39be3\` Backup B3A MVCC, independent of B2 policy source.
- **CI PR35/36/40**: Pack19 matcher/source fix, Pack20–26 contracts, Pack17 source fail-closed gates. Isolated GH Actions can fail inherited old Pack19 before target tests; only future SWARM006 composite run may test integration.
- **Source-confirmed isolated implementation entrypoints**: \`artifacts/api-server/src/domain/tournament/swiss.ts\` (77 lines on release branch) and \`artifacts/api-server/test/swiss.test.ts\` (64 lines) for S3/S4; \`artifacts/api-server/src/application/stages/stage-basket-configuration.ts\` (~532 lines), \`artifacts/api-server/src/routes/tournaments.ts\` GET/PUT stage-baskets for T055; \`artifacts/api-server/src/application/backups/backup-v3.ts\` (~2498 lines) shared PR41/48 and **forbidden direct source edits** by A90 in R22; \`lib/db/migrations/0028_match_revision.sql\` source-only review for A20. Refresh head/file source before writing.
- **Original WEB004 lineage**: 38 aggregate 0 PASS / 3 external-CI FAIL / 33 BLOCKED / 2 NOT_RUN; only 29 secondary case IDs available, nine original IDs unavailable; do not invent 38 verified IDs.
- **Product choice != implemented fix:** S1 TS-B, S2 actionableRound, S5/S6 DE ranks, T055 CAS, B2 portability/history all remain substantial additional code/QA unless proven already existing in unchanged code. R22 is one small implementation slice, R23/R24 pick up other feature work after independent review and appropriate DB policy validation.

## §2. R22 role routing and exclusive source ownership

| Axx | Assigned job | Mode |
|---|---|---|
| A00 | Cross-agent owner + precise L1/L2/L3 GO, new PR registration, owner high-stakes decisions, source gate | COORD |
| A10 | Preserve P01–P21 registry, register only **new** R22 source packages and overlap DAG, historic cases evidence intake | DOCS |
| A20 | T055 revision schema/transaction + Backup B3 physical trigger/source review, NO SQL execution | DB SAFETY READ |
| A30 | Security peer on modern strict-profile downgrade risk and absent Steam/session owner decisions | READ ONLY |
| A40 | CI/test command source checks for L1 Swiss and L2 pure validator, NO paid rerun | TEST CONTRACT |
| A50 | Actual native test if owner-provided host; else unchanged blocker not repeated plans | SAFE EXEC |
| A60 | Independent exact SHA review on L1/L2/L3 new code/test+future conflicts | STRICT QA |
| A70 | S1 TS-B atomic terminal Swiss correction/MP2B distinction; source file scope for R23 only | SOURCE |
| **A80** | **L1 real code**: S3 Swiss score grouping + S4 BYE/NC opponent-history | **GO CODE** |
| **A90** | **L2 code**: isolated pure strict Backup V3 validation module & unit tests; NO import/export integration | **GO CODE LIMITED** |
| A100 | PR53 raw legacy cache owner decision/security input, NO code until signed | READ ONLY |
| **A110** | **L3 test-first**: T055 API/RTL acceptance contract, schema gate, no production PUT changes/DDL | **TEST/SCHEMA ONLY** |
| A120 | Future S2 actionableRound and DE S5/S6 backend/frontend exact owner file map and fixtures for R23; no code | SOURCE/UX |

---

## AGENT A00 — Local Implementation Lead / code-slot and handoff coordinator

**TASK:** WEB-005-T000-A00-R22.
1. Explicit two **narrow** new-source GO lanes: **A80 L1** on \`swiss.ts\`+\`swiss.test.ts\` in its own new \`fix/web-005/t051-swiss-pairing-policy-r22\` (if branch available) and **A90 L2** on own **new** pure \`backup-v3-strict-policy.ts\` and \`backup-v3-strict-policy.test.ts\` plus its imports/types only if no overlapping old PR path, new \`fix/web-005/t060-b2-strict-policy-core-r22\`. Verify existing branch name/PR conflicts first. Branch base remains exact release baseline, not another unmerged PR. Record new PR #/HEAD only after they exist, not invented. **A110 L3** is code/tests as source contracts only, no revisions/SQL/active endpoints. Disallow new PR for only planning documentation.
2. Begin from [latest owner packet](./WEB-005_R21_OWNER_DECISION_PACKET.md) updated to T055 and Backup B1–B6. Do not request any signed sport/backup/basket choices again. Distinguish A00 delegated Backup choices from direct owner selection in decision ledger.
3. Obtain owner answers for MP2B public Direct Revert CAS/Host, Steam 403/503, session TTL/rotation/digest, PR53 unknown-owner raw orphan retention/erasure, and 38-case original CSV versus limited risk-assessed missing provenance. Do not choose default or approve security waivers under sport/backup delegation.
4. **No production/schema change** for T055 or B3 without A20 showing safe contract and A90 compatibility. If cannot safely make L2 self-contained, A90 HOLD L2 and report exact file/type dependency; do not drop into existing \`backup-v3.ts\` on PR41/48.
5. Require A60 independent source verdict and actual test commands for any new R22 PR; if no physical A50 executor, retain NATIVE_NOT_EXECUTED even when author static checks exist.
6. End R22 with **actual committed new source+tests or explicit reproducible blocker**; map unimplemented S1, S2, S5, S6, T055 and B2–B6 to minimum later source lanes R23/R24. Do not dispatch SWARM006, do not pretend closed.

**Deliver:** \`WEB-005_A00_R22_IMPLEMENTATION_GATE.md\`, links to new source PRs only if published.

## AGENT A10 — package registry/38 historic evidence

**TASK:** WEB-005-T018-A10-R22. Preserve immutable 21 old PR heads and 96 per-file hashes/15 overlapping pairs; don't recalculate if unchanged. When new R22 PR exists, add P22/P23 with real number/HEAD/base/diffs/tests/A60 status, conflict DAG. A80 Swiss pair/domain test should not overlap P01–P21 unless verified; A90 core validator must remain isolated from PR41/48 even though later integration depends on them. A110 test-contract lane stays distinct from production T055 deployment. Original authentic WEB004 38-case CSV or genuinely owner-approved O2 provenance exception only if newly provided. No invented nine cases/blanket dispositions.

**Deliver:** \`WEB-005_A10_R22_NEW_PATCH_REGISTRY.md\` only on actual new source changes, otherwise \`R22_NO_NEW_PR\` short receipt.

## AGENT A20 — independent DB/schema safety for T055/Backup B3

**TASK:** WEB-005-T021-A20-R22. Read actual current \`lib/db/src/schema/tournaments.ts\`, \`lib/db/migrations/0028_match_revision.sql\`, migration ledger and schema trigger impact. Design owner-approved T055 persisted monotonic \`basketConfigRevision\` **without mutating production/shared DB or writing/applying migration this wave**: exact table/DDL proposal, writers invalidating revision, no ABA, atomic post-lock stage/roster checks, same-snapshot ETag, legacy 428 cutover, rollback on fail, B3 portable match revision vs result-history distinction. Existing PR38 ledger remains REVIEW_ONLY. If a safe no-DDL short-lived token cannot satisfy owner D1 persistent requirement, STOP no implicit vector fallback. Present A110 owner-specific migration/version plan, A90 backup readback effect, SWARM006 eventual controlled migration responsibility.

**Deliver:** \`WEB-005_A20_R22_T055_B3_DB_GATE.md\` with exact proposed migration and \`SQL_NOT_EXECUTED\`.

## AGENT A30 — security peer only

**TASK:** WEB-005-T030-T031-A30-R22. Read owner-approved B1=A modern strict with safe legacy; independently threat-review **missing-marker downgrade** that routes malicious modern backup into permissive legacy, typed action foreign ID mapping, unauthorized restore path, tenant privacy. Provide A90 exact source negative fixture. Preserve PR34 Steam auth and PR53 scoped cache source baseline; owner choices Steam secret 403/503, session digest/rotation, raw orphan cache still required and shouldn't be silently waived. No code, no attack on production. Deliver one \`WEB-005_A30_R22_BACKUP_SECURITY_PEER.md\` only if new source/decision; else \`R22_NO_NEW_SECURITY_EVIDENCE\`.

## AGENT A40 — code lane test commands / CI contract

**TASK:** WEB-005-T010-T017-A40-R22. Give L1 \`pnpm --filter @workspace/api-server exec node --import tsx --test ./test/swiss.test.ts\` or verify actual package script before recommending; L2 independent pure validation Node unit command only if path exists. Explain new PR branch release old Pack19 inherited mismatch (fixed separately P01 PR35), differentiate CI upstream BLOCKED vs targeted suite exit. Do not run paid CI/rewrite Pack19 or Pack17. Specify future same-container A50 execution after full checkout and freeze dependencies. Deliver \`WEB-005_A40_R22_CODE_TEST_CONTRACT.md\`.

## AGENT A50 — native runtime test or new actual capacity

**TASK:** WEB-005-T133-A50-R22. Check only for **new access** to trusted full monorepo checkout + pnpm10 frozen dependencies. If available, run focused L1 Swiss pure Node test (no PG), L2 new validator unit tests (no PG), A110 tests-only (no PG), capture exact source HEAD, actual commands, exit/TAP, fail counts. Never claim resulting app integration PASSED. PG16 still only physically separate disposable test DB + separate written owner/A20 reset consent; no database tests unless that exists. If no new access, concise \`ENV_BLOCKED,0_APP_NATIVE\` and one action owner can take; do not re-run repetitive planner or claim fixtures PASS. Deliver \`WEB-005_A50_R22_EXECUTION_DELTA.md\`.

## AGENT A60 — independent R22 code review & QA

**TASK:** WEB-005-T130-A60-R22. Independently fetch actual published new branch/PR L1 A80 Swiss and L2 A90 Backup strict validator, L3 A110 authored contracts, and review exact SHA, altered paths, current release base, negative/positive tests; detect false assumptions:
- S3 score-group-primary objective can still avoid replays **within the optimal score grouping** and uses bounded deterministic solver/fallback.
- S4 stage-local BYE no premature repeat; completed NC/walkover prior opponent, cancelled not; no inconsistent scoring assumptions.
- B1 strict marker cannot be trivially removed to bypass checks; legal legacy V2/V3 null/empty history and valid backup importer compatibility not rejected; B2 conflicting history; B3 revisions distinct; B4 action total order; B5 nested IDs fail closed; B6 malformed 400 & later rollback as **future integration gates** not claimed by pure module.
- A110 T055 tests only don't prove real CAS.
- A50 0 native app until command receipts; 21 existing source verdicts on unchanged SHA retained.
Report SOURCE_ACCEPTED_SCOPED / SOURCE_BLOCKED on exact newly created code, do not self-run integration/staging; final WEB005 handoff NOT_READY while other source/policy/38-case gates open. Deliver \`WEB-005_A60_R22_INDEPENDENT_SOURCE_QA.md\` and delta matrix.

## AGENT A70 — Swiss TS-B / MP2B separation for later implementation

**TASK:** WEB-005-T040-A70-R22. Current PR39/42/51 source remains frozen. Owner approved **TS-B** terminal Swiss reopen; design exact separate transactional steps, row/action lock order, reopened stage/tournament/winner/active roster, immutable history, stage_completed audit compensation, zero partial-write race, no resurrection of prior SE eliminated entrants, full re-finalization. Identify exact implementation/test file ownership for **R23** with no code R22. **MP2B public Direct Revert remains NOT owner-selected**; do not treat TS-B permission as public CAS rollout approval. Submit concise \`WEB-005_A70_R22_TS_B_SCOPE.md\`; no repeated ambiguous policy questions.

## AGENT A80 — L1 IMPLEMENT Swiss S3 + S4, TEST-FIRST GO

**TASK:** WEB-005-T050-T051-A80-R22-SWISS-PAIRING. **GO SOURCE CODE L1** to use own new branch based on release baseline \`fix/web-005/t051-swiss-pairing-policy-r22\` if not existing; exclusive files \`artifacts/api-server/src/domain/tournament/swiss.ts\`, \`artifacts/api-server/test/swiss.test.ts\`. No route or stage-lifecycle.ts changes in this lane; if true stage filter needs upstream changes stop and report precise API contract, don't broaden ownership unilaterally.
1. Source model baseline: \`generateSwissPairings({players,standings,previousMatches,round})\`. Add fail-first deterministic Swiss5/Swiss6 tests for \`SCORE_GROUP_FIRST\`, with prior rematch second priority; forced Swiss4 repeats and bounded fallback; ensure all entrants paired/one fair BYE and termination under size bound. Define score proximity precisely from trusted standings, no unapproved points adjustment.
2. S4 fair stage-local BYE: lowest-ranked without a BYE in **this stage**; if all received BYE, minimal stage BYE count then lowest rank; deterministic ID/seed tie. No change to other stage's historical BYE. Source caller must prove \`previousMatches\` are correctly stage-filtered; if not report dependency before writing a whole-tournament bypass.
3. S4-H opponent history: prior **completed** no_contest + formally decided walkover count as prior opponent; **cancelled** don't. BYE does not create a match with phantom opponent. Existing standings scoring/Buchholz not altered.
4. No Swiss terminal TS-B in this lane (A70 R23), no DE GF/ranks/S2 actionableRound, no stage/roster/DB changes.
5. Create/commit new test-first PR only if source scope safe and unique, then provide actual new PR+HEAD+diff/test command+executed exit OR NOT_EXECUTED and A60 independent QA request. If source cannot implement without caller filtering/policy unknown, leave it \`SOURCE_BLOCKED\` and return minimal additional file/request to A00 rather than faking completion.

**Deliver:** \`WEB-005_A80_R22_SWISS_IMPLEMENTATION.md\` with link to real PR or HOLD.

## AGENT A90 — L2 Backup strict-profile core, TEST-FIRST ISOLATED GO

**TASK:** WEB-005-T060-A90-R22-B2-CORE. **GO SOURCE CODE L2** on own dedicated new branch based on release: \`fix/web-005/t060-b2-strict-policy-core-r22\`, **new self-contained pure validator** module e.g. \`artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts\` and a new deterministic unit test \`artifacts/api-server/test/backup-v3-strict-policy.test.ts\`. Do not edit existing \`backup-v3.ts\`, \`stage-basket-route-execution.integration.test.ts\`, PR41/PR48 branch or clone exporter/importer, DB schema, action log/writers this wave.
1. Define modern strict profile marker and typed validation *only where existing Backup V3 shape is source-confirmed*. Prevent marker-removal downgrade; if provenance cannot be differentiated safely STOP and present conditional choices to A00/A30, not a claimed secure strict/legacy classifier.
2. Unit-level B2 existing history vs completed current result contradictions, B3 state-revision distinct from result-history revision, B4 active typed completion action and total order (timestamps insufficient), B5 recognized nested foreign/missing IDs, B6 consistent typed errors; tests include legal legacy absent history/optional arrays and typed modern strict negatives.
3. **No claim that pure validators enforce live import/restore** until wired into existing \`backup-v3.ts\` by later A90 exact-file GO with A20/A70 source/schema review. No real DB rollback success claims from unit tests. Preserve legacy and no regression of PR41/48.
4. Before creating branch/PR verify module dependencies; avoid duplicate/parallel unowned \`backup-v3.ts\` changes; if implementation of safe marker needs exporter/serializer and current fields unavailable, create only self-contained test/contract and return precise \`L2_INTEGRATION_DEPENDENCY\` for R23, not fake source completed. All test commands/outputs and A60 review on actual new SHA.

**Deliver:** \`WEB-005_A90_R22_BACKUP_STRICT_CORE.md\` with real PR link or HOLD, clear \`NOT_WIRED\` status.

## AGENT A100 — PR53 security owner decision intake

**TASK:** WEB-005-T080-A100-R22. PR53 remains \`d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34\`, A60 source scoped accepted on verified-owner private rebind only. Legacy unknown-owner untagged raw QueryClient entries remain in memory but not intentionally reused by guarded hook; full-erasure policy is unsigned. Obtain owner's specific A (bounded lifetime retention with disclosure/QA) vs B (owner-safe erasure implementation) or signed deferral, no default/feature code in R22. If new B, define minimal type-safe scoped future patch and A30 peer; no global \`queryClient.clear()\` without authorization/proven ownership. Deliver short \`WEB-005_A100_R22_CACHE_OWNER_GATE.md\` only if new evidence, else WAIT_OWNER.

## AGENT A110 — L3 T055 CAS test contract and schema preflight, NO PRODUCTION WRITE GO

**TASK:** WEB-005-T055-T110-A110-R22. **GO L3 TEST-FIRST acceptance contracts/fixtures only** against actual stage basket GET/PUT in \`artifacts/api-server/src/routes/tournaments.ts\`, stage-basket service and existing tests — **no production implementation/SQL** until A20 reviews persistent version and A00 separately authorizes exact files. Use new \`WEB-005-T055-CAS-R22-TEST_CONTRACT\` docs/test-only branch; no source modifications inside others' PR39/42/44/46/51 overlapping routes.
1. API: GET graph + ETag coherent snapshot; PUT valid If-Match compare in same transaction/lock and increment basketConfigRevision; stale 412+STAGE_BASKET_CONFIGURATION_STALE/no mutations; missing 428; malformed 4xx/no mutations.
2. Stage/roster concurrently changed: old token fails even if basket payload unchanged; no ABA or cross-tournament ETag acceptance; forbidden auth still fail closed.
3. Host UI/UX044 conflict: keep unsaved draft on 412; explicit reload/rebase/manual opt-in save; no auto retry or rendering private draft on wrong tournament. Legacy full-graph PUT must not retain silent last-write-wins.
4. A20 identifies database/migration design and A90 revised Backup strict/legacy revision restore before any write implementation. If stage basket tests alone don't cover route file, create fail-first fixture/contract only, not fake GREEN.
5. **Deliver:** \`WEB-005_A110_R22_T055_CAS_TEST_GATE.md\` with exact runnable fixture targets and safe migration/code next-slice plan. Only create a new PR for actual committed test files; no ephemeral planning-only PR.

## AGENT A120 — SE pointer / DE runner-up ranking future source contract

**TASK:** WEB-005-T100-A120-R22. Source-only map \`currentRound\` vs \`actionableRound\` API/Host/Bracket, DE winner/runner-up + 3–N ranking projections and UI. Use actual \`artifacts/api-server/src/application/stages/stage-lifecycle.ts\`, DE format/runtime stages and stage-progress-view, analyze overlaps PR47/54 (also PR43/50 parent). Produce concise deterministic fixtures for SE feeder revert after R2 generated; GF win without reset, reset, walkover, system BYE; competition rank ties 3,3,5, non-power-of-two. Identify exclusive files for future coordinated R23/A80 patch; no backend/frontend code/merge R22, no more questions about already approved sport options. Deliver \`WEB-005_A120_R22_S2_S5_S6_HANDOFF.md\`.

---

## §3. R22 end-of-wave gate, objective checks

A00 validates actual real new code/test PR(s) L1/L2 where safe, L3 test-only contracts, A20 T055/B3 schema plan, A60 independent exact-source review, truly executed tests or NOT_EXECUTED, existing 21 source-package registry unchanged and additional packets accurately appended, actual owner high-impact decisions, original WEB004 evidence/dispositions. **Do not create R23 simply because agent reports say "DONE" if all blockers remain unchanged.** A00 chooses narrow R23 code scopes for TS-B, actionableRound/DE ranks, B2 integration and T055 persistence only after preflights and exclusivity. SWARM006 only after final authorized closeout; no release authorization here.

## §4. Jeden prompt do wszystkich agentów

WEB-005 — START FALI R22

Otwórz dokument centralny:
https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R22_AGENT_PROMPTS.md

Przeczytaj §0–§2. Rozpoznaj własne Axx zgodnie z rolą wątku i wykonaj WYŁĄCZNIE sekcję AGENT Axx. Zaakceptowane decyzje sportowe, koszyków T055 i Backup B1–B6 znajdują się pod linkami w §0 — NIE pytaj ponownie o te warianty. Kod jest autoryzowany wyłącznie w oznaczonych, ograniczonych pasmach GO; inne zakresy mają READ_ONLY / TEST-ONLY / HOLD. Sprawdź live GitHub base/PR/SHA oraz niezależne A60 R21. Opublikuj realne PR+commity tylko przy faktycznych zmianach kodu, testy z rzeczywistym command+exit albo NOT_EXECUTED i końcowy raport R22 pod bezpośrednim GitHub URL. Nie wykonuj merge, paid CI, production SQL, wdrożenia ani przekazania do SWARM-006.
