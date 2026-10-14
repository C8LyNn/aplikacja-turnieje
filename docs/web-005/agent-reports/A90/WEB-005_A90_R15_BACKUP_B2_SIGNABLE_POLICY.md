# WEB-005 / A90 / R15 — Backup B2 SIGNABLE POLICY + B1/B3A QA

**WAVE / DATE:** R15.1 / 2026-10-14 (Europe/Warsaw)  
**AGENT / TASK:** A90 — Backup V3 Integrity & Restore / \`WEB-005-T060-A90-R8\`  
**MODE:** SOURCE-ONLY; owner/HQ signoff packet. **This document does not approve or select a policy.**  
**REPORT OWNER:** A90; **decision authority:** A00 → global HQ/owner; review dependencies A20, A50, A60, A70.  
**REPO:** \`C8LyNn/aplikacja-turnieje\`  
**RELEASE SOURCE BASE:** \`release/tournament-ops-20261013-01\` @ \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`.  
**GO/STOP:** documentation and source QA **GO**; V3 source code/SQL/migrations, cross-PR merge, shared DB/prod backups, staging/live and SWARM-006 **STOP**.

## 1. R15 exact-SHA evidence inventory (verified live GitHub)

| Packet | PR / exact HEAD | Scope and current state |
|---|---|---|
| **P08, B1 preclone** | [PR #41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41), \`e847cb705296a48ab5c68ece96776cd0e0bbb417\` | OPEN DRAFT, unmerged, base \`1fdc401...\`; 4 changed files. \`PATCH_PROPOSED\`. |
| **P15, B3A MVCC export** | [PR #48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48), \`2a8a4c72cb4a3a37402a346fd0acc83b03b39be3\` | OPEN DRAFT, unmerged, base \`1fdc401...\`; 2 changed files. \`PATCH_PROPOSED\`. |
| **P01, Pack19 matcher** | [PR #35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35), \`7cb283aa82273a1e22daf9051a82311eef53760c\` | Separate unmerged draft fix for an obsolete test matcher, not part of B1/B3A. |

**PR41 exact changed paths:** \`artifacts/api-server/src/application/backups/backup-v3-flow-integrity.ts\`; \`artifacts/api-server/src/application/backups/backup-v3.ts\`; \`artifacts/api-server/test/stage-basket-route-execution.integration.test.ts\`; \`docs/web-005/WEB-005_A90_R9_HANDOFF.md\`.  
**PR48 exact changed paths:** \`artifacts/api-server/src/application/backups/backup-v3.ts\`; \`artifacts/api-server/test/stage-basket-route-execution.integration.test.ts\`.

**Current CI:** PR41 [run 38585495598](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38585495598) = FAILURE; PR48 [run 38596228642](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38596228642) = FAILURE. The failure is the **earlier Pack19 source matcher** looking for \`readOnly:true\` where Drizzle code correctly uses \`accessMode:"read only"\`; downstream static/database release gates were skipped. **This neither passes nor fails feature-specific B1/B3A PG16 tests.** Do not manually rerun paid CI or duplicate PR35.

**Independent evidence:** zero submitted GitHub review events on both PRs at R15 readback. Searches of central \`docs/web-005/agent-reports/A50/WEB-005_A50_R15_HANDOFF.md\`, corresponding A60 R15 and R14 files, plus branch searches, did not establish direct, text-verifiable A50 physical PG16 receipts or A60 signed exact-SHA verdicts. This is **NOT_VERIFIED_BY_COORDINATOR in accessible evidence**, not proof that the agents performed no off-repo work.

**R15 A90 application test execution:** **NOT_EXECUTED**. No checkout, Node/pnpm run, PostgreSQL session, HTTP test, TypeScript typecheck, test exit code, TAP PASS or exported snapshot hash by A90. This report contains source findings and precise instructions for an **authorized** executor.

## 2. B2 source facts — referential gaps versus product policy

\`SOURCE_CONFIRMED\` on release baseline (generated public V3 types, \`backup-v3.ts\`, \`revert-match.ts\`):

1. \`TournamentBackupV3.matches[*]\` carries result tuple, status and \`completedAt\`, **not** DB \`matches.revision\` (match-state/CAS version). \`resultHistory[*].revision\` is a distinct per-match **completion-history sequence**. Never impose \`matches.revision === MAX(resultHistory.revision)\`.
2. \`resultHistory: TournamentBackupV3ResultHistoryItem[]\` and \`actionLog: TournamentBackupV3ActionLogItem[]\` are **required properties** in the current generated V3 type. Each array may be **empty**. An action's \`undoPayload: Record<string,unknown>|null\` may be \`null\`. Contrast optional V3 Phase2/3 \`qualificationProposals?\` and \`routeExecutions?\`. A historically omitted JSON \`actionLog\` property is a **distinct malformed/current-schema-vs-older-producer compatibility investigation**, not equivalent to legal \`actionLog:[]\`; do not call it optional without evidence.
3. Existing \`validateBackupV3\` checks history row match/stage references, positive unique \`(matchBackupId,revision)\`, dates, referenced membership, and individual played/walkover/bye/no-contest result shape. It does **not** require history to exist for **every** currently completed match or require its latest row to match the current match result.
4. \`revertMatch.historyMatchesCurrentResult\` compares stage/tournament context, round, match number, player1/player2, scores, winner, bestOf, result type/reason and \`completedAt\`. An imported snapshot with wrong or missing latest history can later be non-revertible (\`STATIC_INFERRED\`; **no PG16 repro at R15**).
5. Existing action-log outer \`matchBackupId\` and \`stageBackupId\` are validated. The recursive \`remapUndoPayload\` recognizes numeric \`playerId\`, \`player1Id\`, \`player2Id\`, \`winnerId\`, \`matchId\`, \`prevFeaturedMatchId\`, with fallback \`map.get(oldId) ?? oldId\`. When old ID is unknown it can survive unchanged. This is a **SOURCE_CONFIRMED fallback / STATIC_INFERRED invalid-or-colliding-new-ID risk**, not demonstrated cross-tournament corruption.
6. Portable action log lacks original DB action \`id\` or a strict tie-break. Current export orders \`createdAt DESC\`, clone assigns new IDs. Equal timestamps make total order ambiguous. Existing importer restores \`actionType\`, \`matchId\`, \`stageId\`, \`undoPayload\`, \`isUndone\`, \`createdAt\`, but **does not persist export-only derived \`canUndo\` as a separate action-log column**. A70 owns precise active completion/LIFO and public Direct Revert semantics.
7. The Phase3 synthetic route fixture directly inserts completed matches but does not explicitly insert \`result_history\` there. A20/A50 must check actual PG16 migrations/triggers before asserting universally that every legacy completed match has history.

**SOURCE_CONFIRMED gaps:** no universal latest-history parity check, nested payload ID fallback, nonportable original action IDs, absent match-state revision. **POLICY_OPEN:** whether these observable gaps should cause import rejection, warning, restricted Undo or a new strict-profile rule. No blanket rejection of historically lawful V3 has been authorized.

## 3. SIGNABLE owner/HQ policy card — D1–D6 (leave all choices unselected)

**POLICY ID:** \`POLICY-BACKUP-B2-PORTABILITY-R15\`  
**Decision request:** Choose one coherent profile/legacy contract for future source implementation. This is an *approval form inside the Markdown document*, not proof of signature.

| Decision | Alternatives requiring owner/HQ signature | Owner selection |
|---|---|---|
| **D1 — Strict profile and legacy detection** | **A:** explicit forward-only optional capability/version marker for newly produced strict V3; old schema V3 remains compatible. **B:** strict rule for all V3 only after audited complete historical corpus and migration policy. **C:** no strict importer; use warnings/diagnostics only. In all cases decide treatment of omitted-now-required JSON fields and V2 separately. | \`[A/B/C: ____]\` |
| **D2 — Match/history consistency** | **A:** strict-profile completed match requires nonempty history and latest \`MAX(history.revision)\` tuple parity, with explicit BYE/walkover/NC/reverted exceptions. **B:** reject mismatch only *when history exists*; missing history yields warning/restricted Revert. **C:** diagnostic only. Explicitly choose legacy \`resultHistory:[]\` behavior. | \`[A/B/C: ____]\` |
| **D3 — Portable match CAS revision** | **A:** new optional portable \`matches.revision\` field, clearly versioned, validated and restored. **B:** intentional DB default/rebase after restore, documenting CAS semantics. **C:** never preserve CAS version, restrict affected Undo/Direct Revert until safe regeneration. A20 must first confirm actual migration 0028 and trigger behavior. **Do not equate with history revision.** | \`[A/B/C: ____]\` |
| **D4 — Completion/Undo provenance** | **A:** strict profile requires typed \`match_result_submitted\` + \`{type:"revert_match",matchId}\` referent and a portable active-action order token/ID. **B:** legacy unknown/empty/null action metadata accepted but Undo disabled when unverifiable. **C:** only runtime A70 guard, no new import rule. Set equal-\`createdAt\` tie-break and \`actionLog:[]\` handling. | \`[A/B/C: ____]\` |
| **D5 — Nested numeric ID remapping** | **A:** strict profile rejects any recognized missing/foreign player/match ID before clone; legacy recognized payloads may be accepted only with documented safe degradation. **B:** admit legacy payloads, but neutralize unsafe Undo entries with explicit diagnostic. **C:** retain existing fallback, acknowledging unresolved referential risk. Unknown nonstandard historic object keys are not assumed recognized. | \`[A/B/C: ____]\` |
| **D6 — Error and rollback/compatibility UX** | **A:** strict violations return \`400 INVALID_BACKUP_V3\` **before clone**; any late failure rolls back **all** clone tables; separately preserve positive V2/V3 legacy and safe diagnostic messaging. **B:** owner-approved restricted import with warnings and disabled affected Undo; specify nonpartial restore semantics. Choose user messaging and support path. | \`[A/B: ____]\` |

**Required signature block (unfilled):**

- **Decision authority:** owner/HQ: \`________________\`
- **Local coordinator acknowledgment:** WEB-005/A00: \`________________\`
- **Decision version / date:** \`________________\`
- **GitHub policy/DECISIONS direct URL:** \`________________\`
- **Chosen D1–D6 option codes:** \`________________\`
- **Explicit legacy V2 + legacy V3 matrix disposition:** \`________________\`
- **A20 migration/CAS proof link:** \`________________\`
- **A70 active-Undo/LIFO signoff link:** \`________________\`
- **Independent A60 and physical A50 acceptance criteria agreed:** \`________________\`
- **Future bounded B2 code authorization:** \`NOT GRANTED BY THIS DOCUMENT\`.

**Unresolved = POLICY_OPEN/HOLD**. This form offers alternatives without selecting them. A00/HQ must choose internally consistent combinations (e.g. D4 strict provenance requires D1's supported strict discriminator); options involving new serialized fields or version markers require separate API-contract review.

## 4. A50: deterministic B1 12-corruption/legacy PG16 fixture (existing PR41, not executed here)

**Source fixture:** \`artifacts/api-server/test/stage-basket-route-execution.integration.test.ts\`, test named \`Backup V3 B1: qualification and route corruption rejects before clone\` on PR41 SHA. Synthetic \`buildRouteFixture({qualifierCount:2})\` → approve QP → execute route → GET exported V3 → clone by \`structuredClone(valid)\`, mutate **one** field and check preclone type + HTTP 400.

**The 12 exact current scenario labels (source-authored; not 12 individual TAP subtests):**

| ID | Mutation label from PR41 | Expected on approved disposable PG16 |
|---|---|---|
| B1-N01 | missing approved output | typed preclone error; \`400 INVALID_BACKUP_V3\`; no cloned rows |
| B1-N02 | wrong approved output player | same |
| B1-N03 | wrong approved output rank | same |
| B1-N04 | output in target input basket | same |
| B1-N05 | orphaned source proposal | same |
| B1-N06 | pending proposal has materialised output | same |
| B1-N07 | stale source proposal revision | same |
| B1-N08 | incomplete arrival set | same |
| B1-N09 | wrong execution target | same |
| B1-N10 | wrong entry source basket | same |
| B1-N11 | extra arrival not in approved output | same |
| B1-N12 | duplicate arrival | same |

**Current test evidence precision:** PR41 loops over these 12 scenarios **inside one Node \`test(...)\`**, and checks before/after **tournament root count by clone name**. A50/A60 must add or independently instrument zero new *child-table rows* and a **separate late transaction rollback** test to prove full clone-transaction atomicity; this is an acceptance requirement, **not an existing assertion**. Do not report "12 TAP passes" on the basis of that one test.

**Positive B1/legacy matrix:** (P1) valid approved/route synthetic V3 export→restore→reload→idempotent reroute, staged participants and receipts; (P2) older V3 with no optional Phase2/3 arrays still accepted; (P3) approved but *unexecuted* route with previously valid underfill not rejected on new executed-only qualifierCount condition; (P4) typed V3 \`resultHistory:[]\` and \`actionLog:[]\` valid when other constraints permit, versus \`undoPayload:null\` for an appropriate log entry; (P5) omitted \`actionLog\` JSON field handled by documented parser/owner compatibility decision **without treating absence as type-valid**. Add V2 positive through its existing separate path, not via V3 strict mode.

## 5. A50: deterministic B3A two-connection MVCC cases (existing PR48)

On **PR48 HEAD**, test file \`artifacts/api-server/test/stage-basket-route-execution.integration.test.ts\` has two distinct test titles:

1. \`Backup V3 export uses one repeatable-read snapshot across root, stage and match\`. Exporter E root SELECT → test-only \`afterTournamentRead\` barrier → writer W commits new tournament name + planned stage name + source match note (independent DB transaction) → E resumes. Assert E root/stage/match **all old**, then fresh E2 **all new**.
2. \`Backup V3 export never mixes pre-approval and post-routing receipts\`. E root SELECT → writer generates/approves qualification, materializes OP and executes route → E resumes. Assert E has **none** of later QP/route receipt; fresh E2 has approved QP, 2 OP rows and complete receipt with 2 entries.

**Additional proposed fixtures (not in PR48, no R15 code GO):** (MVCC-H1) while E paused, W commits a result and its corresponding \`resultHistory\` update; E old match+history, E2 new match+history. (MVCC-S1) W commits stage state/participant/route changes coherently; E and E2 never interleave cohorts. (MVCC-D1) within exporter transaction inspect \`SHOW transaction_isolation\` and \`SHOW transaction_read_only\` or \`current_setting(...)\`, and verify the routing-plan helper uses the same transaction/client. (LEG-EX1) unknown tournament returns null, older V3 export/import and Phase3 round-trip remain intact. Any new fixture changes need a future scoped GO to alter test source.

**B3A source guard:** actual config is \`db.transaction(..., { isolationLevel: "repeatable read", accessMode: "read only" })\`; test-only barrier is an internal optional JS callback, **not an HTTP input**. Failures should stop export without a partially valid-looking V3; this is not B1 import rollback.

## 6. A20/A50: safe executable PG16 preflight and targeted commands

**Mandatory before any mutation:** physically independent, explicit owner-approved **disposable PostgreSQL16 database**; verify connection's real host/database, scope, ownership and permissions through secure channels; get A20 migration 0001–0028/trigger proof, particularly \`0028_match_revision.sql\`. Validate that \`TEST_DATABASE_URL\` points **only** to that approved DB, never share or print credential URL, never fall back to \`DATABASE_URL\`. Ensure \`TEST_DATABASE_SCHEMA=tm_test_a90_r15\` or another approved \`tm_test_*\` name and \`TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA\`. **The harness executes \`DROP SCHEMA IF EXISTS ... CASCADE\` and recreates/migrates schema**, so logical test-schema naming alone does not prove physical isolation. Halt if any condition is unproven.

**A50 runbook, execute separately in two isolated clean checkouts** (commands illustrative, **NOT_EXECUTED by A90**):

~~~sh
# PR41 exact checkout from verified remote:
git switch --detach e847cb705296a48ab5c68ece96776cd0e0bbb417
git rev-parse HEAD
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run typecheck
# Only after A20/A50+owner signed physical disposable PG16 preflight;
# TEST_DATABASE_URL supplied privately; never echo secrets:
TEST_DATABASE_SCHEMA=tm_test_a90_r15 TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA \
  pnpm --filter @workspace/api-server exec node --import tsx --test \
  --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts

# Repeat from clean exact PR48 HEAD on same approved disposable PG16 only
# once previous harness has completed cleanup, no concurrent shared schema use:
git switch --detach 2a8a4c72cb4a3a37402a346fd0acc83b03b39be3
git rev-parse HEAD
pnpm --filter @workspace/api-server run typecheck
TEST_DATABASE_SCHEMA=tm_test_a90_r15 TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA \
  pnpm --filter @workspace/api-server exec node --import tsx --test \
  --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts
~~~

A50 shall capture real \`git rev-parse HEAD\`, Node22/pnpm10/PG16 versions, redacted isolation/role/schema confirmation, exact commands and **exit codes**, test TAP totals, B1 zero-root+child counts and late rollback evidence, B3A E/E2 coherent-state field hashes after normalizing nondeterministic \`exportedAt\` and verifying writer commit order. No PASS without the real receipt. **Do not combine PR41 and PR48 into one intermediate or composite branch**; future integration is SWARM-006 only after final closeout.

## 7. A60 source acceptance contract and conflicts

**A60 exact SHA source review:** For PR41 verify B1 input validation is *before* first clone INSERT, errors typed for bad QP/QPE/OP/route receipts, false positives on legacy absent optional Phase2/3 avoided, intended count checks, late rollback not merely preclone zero-root. For PR48 verify **all exporter queries**, nested subqueries, compiled routing plan and receipts use same \`tx\`; no parallel pool-level queries or hidden second session; internal hook doesn't leak into HTTP; verify PostgreSQL16 actual config. Require each acceptance event/URL explicitly state reviewed commit SHA and distinguish \`SOURCE_ACCEPTED\` from \`RUNTIME_VERIFIED\`.

**Files in collision:** PR41 **and** PR48 both modify \`artifacts/api-server/src/application/backups/backup-v3.ts\` and \`artifacts/api-server/test/stage-basket-route-execution.integration.test.ts\`. Candidate future B2 validator would also touch \`backup-v3.ts\`. No current R15 merge, cherry-pick, rebase or composite QA; A00 tracks integration conflict, SWARM-006 future owner after formal single closeout.

## 8. Minimum next B2 patch request — future, policy-gated, no code now

**Request ID:** \`WEB-005-T060-B2-STRICT-PROFILE-PRECLONE-RNEXT\`. This is **not** an authorized task or a new PR.

**Prerequisites:** signed D1–D6 owner policy above, A20 confirmed migration/history triggers/CAS semantics, A70 completion-action/Undo/LIFO contract, A50 physical PG16 preflight availability, A60 independent review of PR41/#48, and **separate precise A00 CODE GO** with file ownership.

**Proposed small change only after GO:** (i) pure \`application/backups/backup-v3-history-integrity.ts\` side-effect-free validator for the owner-approved **strictly recognizable** modern profile, (ii) one preclone \`validateBackupV3\` call-site hook in \`backup-v3.ts\`, (iii) focused typed negative+positive/legacy test cases. If D1 needs a new serialized marker, update API contract explicitly within approved scope; if D3 requires DDL or broad importer redesign, **STOP** and ask for distinct scoped plan rather than sneak it into this small patch.

**Test-first acceptance:** 1 modern strict exact parity / older nonlatest history allowed; 2 newest tuple mismatches (scores/winner/date/etc) rejected before clone; 3 strict missing history according to D2; 4 outer action ID valid but nested match/player ID foreign causes D5-approved handling; 5 import correctly maps old→new IDs and A70 Undo to restored match; 6 tied createdAt/duplicate active completion provenance according to D4; 7 legal typed V3 \`resultHistory:[]\` and \`actionLog:[]\` legacy positive; 8 nullable or unknown legacy payload accepted/degraded only per owner; 9 omitted JSON properties tested under explicit parser/legacy policy; 10 late failure rolls back root+all children; 11 full positive V3 export/restore round-trip and V2 separate path; 12 no accidental equivalence between CAS revision and history revision. All tests executed on exact future SHA with A50 logs and independently signed by A60; authored fixture alone is **not a PASS**.

**Unblockers, in order:** (1) **A00+HQ sign D1–D6**; (2) **A20** verify schema/trigger and disposable PG16; (3) **A50** run exact-head B1/B3A targeted tests, publish logs; (4) **A60** independently review exact tested SHA; (5) only then A00 may authorize one narrow B2 future source patch.

**FINAL:** A90 R15 SOURCE-ONLY **DELIVERED** upon GitHub publication; B1/B3A remain \`PATCH_PROPOSED\` without verified application runtime/independent verdict; B2 \`POLICY_OPEN\`. WEB-005 \`RELEASE_NO_GO\`; SWARM-006 \`HOLD\`.
