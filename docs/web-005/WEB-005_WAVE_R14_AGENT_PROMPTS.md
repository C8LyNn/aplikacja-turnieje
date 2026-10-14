# WEB-005 — FALA R14 — CENTRALNY DOKUMENT PROMPTÓW WSZYSTKICH AGENTÓW

**Wersja:** R14.1 · 2026-10-14 (Europe/Warsaw)  
**Lokalny koordynator:** A00 — WEB-005 / Implementation Lead, podległy jednej globalnej Królowej/HQ  
**Repozytorium:** \`C8LyNn/aplikacja-turnieje\`  
**Gałąź planistyczna:** \`chore/web-005/t000-wave1-control\`  
**Źródła wiążące:** \`WEB-004_TO_WEB-005_HANDOFF_R2_2026-10-14.md\`, \`docs/web-005/BACKLOG.md\`, \`DECISIONS.md\`, \`WEB-005_WAVE_R13_AGENT_PROMPTS.md\`, istniejące raporty agentów R13, PR-y i job logs GitHub.  
**Stan startowy:** R13 zakończona operacyjnie przez wątki, **WEB-005 nadal nie jest formalnie zakończony**; 21 draft source patches; brak zintegrowanego SHA; \`RELEASE_NO_GO\`; \`SWARM006_FINAL_HANDOFF_DEFERRED\`.

> **JEDEN dokument dla A00 oraz A10–A120.** Każdy agent czyta §0–§2 i wykonuje WYŁĄCZNIE własną sekcję \`AGENT Axx\` rozpoznaną po nazwie/roli wątku. Nie przejmuj pracy innych agentów. Ten dokument jest planem R14, nie potwierdzeniem wykonania testów lub prac innych wątków.

## §0 — Wspólny kontrakt R14: QUALITY GATE, nie produkcja kolejnych PR

1. **W R14 zamrażamy otwieranie nowych implementacyjnych PR-ów.** Zero z góry autoryzowanych code lanes, aby nie zwiększać kolejki 21 nieodebranych patchy. Agent może analizować, testować, przygotować minimalną propozycję naprawy defektu QA; do zmiany aplikacyjnego kodu/nowego PR potrzebuje **osobnego, precyzyjnego GO A00** po dowodzie FAIL na exact SHA i rezerwacji wyłącznej własności pliku. Czas zwolniony przez innego agenta nie daje automatycznego GO.
2. **Przed pracą GitHub recheck:** HEAD SHA/base, PR state, changed files i aktualny CI. Snapshot §1 może się zmienić. Nie przepisywać kodu PR #34–54, które już istnieją; autorzy mogą dostarczać repro lub poprawkę wyłącznie po odrębnym defektowym GO.
3. **Poziomy evidence:** \`SOURCE_CONFIRMED\`, \`STATIC_INFERRED\`, \`HYPOTHESIS\`, \`PATCH_PROPOSED\`, \`SOURCE_ACCEPTED\` (podpisana niezależna A60 ocena exact HEAD), \`RUNTIME_VERIFIED\` (wykonane polecenie, wyjście, wersje i izolowane środowisko), \`FAIL\`, \`NOT_EXECUTED\`, \`BLOCKED\`, \`POLICY_OPEN\`, \`WITHDRAWN\`. Test napisany ≠ uruchomiony; test harnessu != rzeczywisty test aplikacji; wynik CI wcześniejszego kontraktu nie jest wynikiem późniejszego testu.
4. **CI baseline Pack19:** nowo tworzone release-based draft PR mają stary matcher \`readOnly:true\`, gdy realny kod używa \`accessMode:"read only"\`. Rozwiązanie źródłowe jest już w PR **#35**. Na bieżącym GitHubie Actions na **PR #52, #53, #54** zakończyły się \`FAIL\` na etapie **Pack 19 snapshot consistency tests**, zatem nie wykonały dalszego runtime QA tych PR. Nie duplikuj PR35, nie fałszuj wymaganych bramek; osobna, w pełni zintegrowana walidacja kompozytu pozostaje zadaniem SWARM-006 po końcowym handoffie. A40/A50 mogą wykonywać bezpieczne niezależne targeted testy bez tworzenia composite release branch.
5. **P0 test environment:** A50 odróżnia możliwość wykonania React RTL/typecheck bez DB od PG16-integracji. PostgreSQL 16 tylko na jednoznacznie odizolowanej testowej bazie, \`TEST_DATABASE_URL\`, schemacie \`tm_test_*\`, jawnym zakresie resetu i zgodzie owner/HQ; NIE używaj współdzielonej/produkcyjnej bazy ani nie uruchamiaj destrukcyjnych skryptów bez dowodu izolacji. Brak workspace/deps albo PG16 = \`BLOCKED/NOT_EXECUTED\` z dokładną instrukcją odblokowania, nie PASS.
6. **P0 independent QA:** A60 nie pisze poprawek, dokonuje rzeczywistego source acceptance/FAIL per exact SHA, wyróżnia wykonane testy z A50, priorytetyzuje blokujące bezpieczeństwo/integralność/kontrakty oraz utrzymuje 38 historycznych przypadków WEB-004 (0 PASS/3 external CI FAIL/33 BLOCKED/2 NOT RUN w historycznym handoffie) jako bazę, nie nadpisuje ich automatycznie.
7. **Polityki niezdecydowane:** Terminal Swiss deny 409 vs atomic reopen, SE currentRound actionable/generated, Swiss optimal rematch/BYE, DE runner-up i 3–N, T055 Basket CAS 409/412/version token + legacy, Backup V3 B2 portable revisions/legacy snapshots, T040 public Direct Revert request-level CAS/Host clients/completion ID, Steam absent-secret 403/503, session TTL/hash/rotation. Nie wybieraj arbitralnie i nie koduj ich w R14.
8. **Twardy STOP:** brak merge/cherry-pick/rebase z release/main, własnej gałęzi kompozytowej, Replit jako integrator, deploy/staging/live, prod SQL/DDL/migrations/adoption, płatnego manual GitHub CI bez GO, sekretów w artefaktach, realnych kopii danych użytkowników, samocertyfikacji autora jako A60.
9. **Cross-swarm policy owner:** WEB-004 skończył audyt, nie prosimy o więcej raportów. WEB-005 pracuje **wyłącznie na otrzymanym HANDOFF R2**, aż zamknie zaakceptowany backlog: każdy ticket jest \`PATCHED+INDEPENDENT_QA\` albo jawnie owner/HQ \`BLOCKED/POLICY_OPEN/WONT_FIX\`. Dopiero po formalnym \`WEB005_FINAL_CLOSEOUT\`, A10/00 przygotują **JEDNO** końcowe przekazanie do SWARM-006, które zrobi faktyczną integrację, composite tests, staging/release. SWARM-007 organizuje architekturę komunikacji/Google Drive osobno, bez domniemanego automatycznego transferu.
10. **Raport R14** każdego agenta: \`WEB-005_Axx_R14_HANDOFF.md\`, \`TASK/ROLE/MODE, BASE/HEAD/PR, files/evidence reviewed, real tests with command/exit or NOT_EXECUTED, independent verdict or pending, blockers/policy choices, conflict/dependency, exact NEXT ACTION, RELEASE_NO_GO\`. Raport do A00; nie edytuj wspólnego master prompts w trakcie fali. Nie obiecuj niezależnego wykonywania zadań w tle.

## §1 — Snapshot GitHub po R13 / preflight do ponownego sprawdzenia

**Base:** \`release/tournament-ops-20261013-01\` HEAD \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`; \`main\` osobno, release PR32 OPEN; competing Steam PR33 HOLD.

| Paczka / PR | Zadanie | HEAD SHA (2026-10-14) | Weryfikacja R14 |
|---|---|---|---|
| P01 / #35 | Pack19 CI matcher | \`7cb283aa82273a1e22daf9051a82311eef53760c\` | scoped contract, final full gate brak |
| P02 / #36 | Pack20–26 gate | \`85ad0b86136fc3491c9ef18663d9b01396179349\` | native full brak |
| P03 / #34 | Steam Catalog write auth | \`fae2eea2f22df3f1b02ad035a7db00bc411ea73f\` | negative HTTP/security |
| P04 / #37 | trusted Proxy CIDRs | \`fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7\` | HTTP spoof/positive |
| P05 / #38 | offline migration ledger validator | \`2d36864f4d2f1c838073f387fd3c8efb3378c43b\` | REVIEW_ONLY, NO SQL GO |
| P06 / #39 | Cancel/Restore MP1 | \`16053ee132756ca05b6f2cd1f0cabae823905387\` | PG+client parity |
| P07 / #40 | Pack17 full fail-closed gate | \`9a8287271299a59fc9291b8d253299a8d109a35d\` | real \`--full\` |
| P08 / #41 | Backup B1 preclone | \`e847cb705296a48ab5c68ece96776cd0e0bbb417\` | PG positive/corrupt/zero-clone |
| P09 / #42 | Undo MP2A global LIFO | \`1ae0ccb801f4177052bff1ec7041e55b8c992c8b\` | PG blocked-race/LIFO |
| P10 / #43 | CSV FileReader route guard | \`96a6068f69027574ac76e18d4d5a2c444b5a914a\` | React RTL/browser |
| P11 / #44 | post-lock organizer auth bans/picks | \`2f0187b7242681c394c09058b5ef647667206bd6\` | PG/security |
| P12 / #45 | terminal RR roster reopen | \`a7a87bc019731191dbfa44bee6939e3fa25e27f4\` | PG sport state |
| P13 / #46 | protected tournament DELETE | \`7f60849e389a7ed35fdd39dd5493c4c4c267d860\` | PG positive/403 zero-write |
| P14 / #47 | DE Details/labels/final overlay | \`f09a13623faca8d7ab29b09a2c5b43907c2acd0b\` | React RTL/browser |
| P15 / #48 | Backup B3A read-only MVCC export | \`2a8a4c72cb4a3a37402a346fd0acc83b03b39be3\` | PG consistent snapshot |
| P16 / #49 | organizer password/visibility post-lock | \`99298b81501c3e7764d653604923522a19b9f05c\` | PG + A30 security |
| P17 / #50 | scoped Backup preview/credential form | \`5457a74187edc263730c3a4b25a663bdf5531ee9\` | React RTL/browser |
| P18 / #51 | malformed persisted Undo payload fail-closed | \`2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a\` | PG 409/no writes |
| R13 NEW / #52 | A110 stage lifecycle stale modal | \`cce73ec47445102b216b3f8eceb4ec9de67eb1a7\` | 7 authored RTL **NOT_EXECUTED** |
| R13 NEW / #53 | A100 auth-dependent private query cache | \`6a8f0c3e5775eb056df75ebdd7b33df7cbc78979\` | 9 authored React tests **NOT_EXECUTED** |
| R13 NEW / #54 | A120 RR canonical readback/refetch | \`dbba0eb82920b4f324866b1b983e1211459f52ec\` | 6 authored RTL **NOT_EXECUTED** |

**Weryfikacja:** 21 kandydatów PR #34–54 OPEN DRAFT / unmerged. Formalne identyfikatory P19–P21 dla #52–54 A10 potwierdza w aktualnym wewnętrznym manifeście, nie przyjmuj za istniejące bez sprawdzenia. Brak finalnego composite SHA, wspólnych testów, staging lub merge. CI runs:
- PR52 @ HEAD → Actions run \`38605694664\` FAILURE: Pack 19 snapshot consistency tests.
- PR53 @ HEAD → run \`38606179795\` FAILURE: Pack 19 snapshot consistency tests.
- PR54 @ HEAD → run \`38606249912\` FAILURE: Pack 19 snapshot consistency tests.
- Brak eventów GitHub \`APPROVED\` dla tych 3 PR w aktualnym readback. Mogą istnieć osobne raporty A60 — potwierdź je przed przypisaniem statusu.

## §2 — Właściciele, uprawnienia, kolejność bramek

| Agent | R14 scope | GO/STOP |
|---|---|---|
| A00 | priority QA, exact evidence triage, owner signoff, backlog closure | COORDINATION |
| A10 | rolling internal manifest P01–P21+ & dependency/conflict graph | DOCS ONLY |
| A20 | T020/T021 migration history/isolated PG16 preflight | SOURCE QA |
| A30 | Steam/proxy/post-lock auth/cache privacy security peer | SOURCE QA |
| A40 | Pack19 old regex/PR35 + Pack17 physical full gate | CI QA |
| A50 | **P0** real targeted Node/pnpm/frontend/PG16 execution and logs | SAFE TEST ONLY |
| A60 | **P0** independent exact-SHA source verdicts and runtime evidence mapping | STRICT READ-ONLY |
| A70 | PR51 and MP2B Revert CAS policy/contract; no code | SOURCE ONLY |
| A80 | PR45 sports, terminal Swiss/SE/Swiss/DE signoff packet | SOURCE ONLY |
| A90 | PR41/48 Backup QA + B2 portability/history decision packet | SOURCE ONLY |
| A100 | PR53 S2A source/security QA; uncovered cache surfaces inventory | SOURCE ONLY |
| A110 | PR52 lifecycle + PR50 backup QA; Basket CAS decision & UX backlog | SOURCE ONLY |
| A120 | PR54 RR readback + PR47 DE UI QA; scope test matrix | SOURCE ONLY |

**R14 no new code lane until exact independent evidence and A00 explicit new GO.** Each agent supplies one unambiguous blocker/unblocker and hands test commands to A50 and expected behavior to A60.

---

## AGENT A00 — R14 Implementation Lead / Closure Control

**TASK:** \`WEB-005-T000-A00-R14\` | **MODE:** COORDINATION.

1. Reconciling R13: verify new PR52/53/54 HEAD, all 21 draft states, agent reports and any independent A60 source reviews; distinguish report-based QA from empty GitHub review arrays. No invented approvals.
2. **Explicitly freeze new source implementation PRs for R14** until A50/A60 clarify baseline and quality; prioritize evidence rather than accumulating draft commits. Only distinct FAIL at exact SHA plus file ownership and written 00 GO may open a narrow repair slot.
3. Publish **per-PR status ledger** (SOURCE_READY, SOURCE_ACCEPTED, RUNTIME_VERIFIED, FAIL/BLOCKED/POLICY_OPEN) and remaining WEB-004 R2 finding→owner→PR→QA mapping. Track withdrawn/review-only separately.
4. Prioritize **frontend-only executable tests** (PR43/47/50/52/53/54) and strict PG16 preflight (PR39/41/42/44/45/46/48/49/51); do not ask A50 to destroy unverified DB or invent PASS.
5. Resolve actual Pack19 CI failure origin PR35 and plan how SWARM-006 later integrates/fixes source matcher, but **do not merge or create composition branch within WEB-005**.
6. Prepare **one owner/HQ decision packet** on terminal Swiss, SE, Swiss/DE, Basket CAS, Backup portability and Revert CAS/Host, with consequence/diff/compatibility, and solicit policy signatures independently of testing.
7. Confirm which findings are already SOURCE_FIXED in release or WITHDRAWN, which still need a code patch after policy, and which are only missing QA. Do not equate 21 PR with 21 closed tasks.
8. Decide after R14, based on real evidence, whether next wave is narrowed patch/repair or further testing; final-only SWARM-006 remains HOLD.

**DELIVERABLE:** \`WEB-005_A00_R14_COORDINATION_AND_CLOSURE_GATE.md\`, revised backlog/decision queue after actual results. **STOP:** all merge/deploy/SQL/production/forward to SWARM-006.

## AGENT A10 — Manifest P01–P21+ Internal Only

**TASK:** \`WEB-005-T018-A10-R9\` | **MODE:** DOCS / READ ONLY.

1. Reuse R13 internal \`WEB-005_A10_R13_PACKAGE_MANIFEST.json\`; recheck P01–P18 actual mapping and add real PR52/53/54 after HEAD/content checksum and lineage; set P19–P21 only if identifier allocation verified, otherwise mark UNASSIGNED_PENDING.
2. For all 21 candidate patches include base/head SHAs, changed paths, dependency, risk, test evidence, A60 verdict (or pending), exact checksum/manifest freshness, and compatibility with latest control docs.
3. Conflict hotspots: \`routes/tournaments.ts\` PR39/42/44/46/51; \`backup-v3.ts\` PR41/48; \`tournament-detail.tsx\` PR43/50/54; \`auth-context.tsx\` and query helpers PR53; \`stage-progress-view.tsx\` PR47 vs PR54 flow; no actual merge.
4. Build test receipt matrix A50 command/executed SHA + A60 signed verdict; don't self-promote \`PATCH_PROPOSED\` to \`QA_ACCEPTED\`.
5. Prepare **read-only integration dependency DAG** and final eventual SWARM-006 single handoff manifest requirements, no intermediate transfer or composite SHA.
6. Document SWARM-007 custody/version/Drive receipt requirements, not fictional folders or synchronization.
7. Report exact new/old SHA drift to A00, author-specific proposed fix ownership for any QA FAIL.

**DELIVERABLE:** \`WEB-005_A10_R14_INTERNAL_MANIFEST.md\` and machine-readable 21-packet table. **STOP:** no dispatch.

## AGENT A20 — Ledger / PG16 Physical Preflight Source Verification

**TASK:** \`WEB-005-T021-A20-R9\` | **MODE:** SOURCE-ONLY QA.

1. Pin PR38 exact HEAD, source/migration chain 0030/0031 and \`REVIEW_ONLY\` ledger rules; no SQL adoption, DDL or migrations.
2. Work with A50 to specify the **exact** dedicated physical PG16 schema + reset exclusions: database identity/host, test-only credentials, tm_test_* schema, no production fallback, required relations/triggers and source snapshot.
3. Prepare reproducible nonmutating catalog preflight for PR39/41/42/44/45/46/48/49/51; identify missing env before tests.
4. Validate PR38 offline negative fixtures for release/editor/mixed/drift. Author synthetic test PASS never implies actual PG acceptance.
5. Provide A60 expected failure modes, A00 one concrete DB-unblock decision if physical target missing.

**DELIVERABLE:** \`WEB-005_A20_R14_PG16_PRECHECK.md\`. **STOP:** no migration execution or production access.

## AGENT A30 — Security Peer Exact-SHA Review

**TASK:** \`WEB-005-T030-T031-A30-R12\` | **MODE:** READ-ONLY SECURITY QA.

1. Recheck PR34 Steam 3 protected writes and PR37 trusted proxy CIDRs; distinguish source hardening from positive/negative HTTP and 403/503 product policy.
2. Review PR44/46/49 organizer/support post-lock race and PR53 auth-dependent cache. Include 401/403, stale queued writes, double submit, no side effects, no leaking secrets/query data between tourney A/B.
3. Verify PR53 scope covers tournament-keyed caches while PR body acknowledges possible match/player-id-only caches and component-local private state; classify residual as SOURCE_GAP/HYPOTHESIS, no invented exploit.
4. Provide A50 deterministic negative test cases and A60 peer threat verdict at exact SHA, including legal authorized positive controls.
5. Track S2 privacy closeout and remaining TTL/rotation policy separately; no code, no vulnerability exploitation outside authorized test setting.

**DELIVERABLE:** \`WEB-005_A30_R14_SECURITY_PEER.md\`. **STOP:** no code/production.

## AGENT A40 — Pack19/17 CI and Evidence Breakpoint

**TASK:** \`WEB-005-T010-T017-A40-R14\` | **MODE:** READ-ONLY CI SOURCE + LOG VERIFICATION.

1. Verify baseline Pack19 \`qa/pack19/source-contract.test.mjs\` expects outdated \`readOnly:true\`; PR35 exact SHA is existing correction. Examine CI logs for PR52/53/54 runs \`38605694664\`, \`38606179795\`, \`38606249912\` and failed jobs \`Pack19 snapshot consistency tests\`. Record exact failures, not just CI red.
2. Confirm PR40 Pack17 fail-closed contract and what \`--full\` requires from Node22/pnpm10/PG16. No downgrade of test gates.
3. Provide exact per-SHA targeted frontend test commands for PR43/47/50/52/53/54, including avoiding accidental broad run whose first Pack19 failure prevents intended test.
4. For future eventual SWARM-006 integration, prepare NON-EXECUTED gate-order/dependency note P01 first. Do not cherry-pick P01 into another branch or create integration.
5. If an additional genuine CI contract problem is found, give exact proof to A00/A60; code fix separate GO only after triage.

**DELIVERABLE:** \`WEB-005_A40_R14_PACK19_PACK17_QA_GATE.md\`. **STOP:** new runner/source code, paid reruns/merge.

## AGENT A50 — P0: Real Test Execution or Definitive Infrastructure Blocker

**TASK:** \`WEB-005-T133-A50-R9\` | **MODE:** TEST EXECUTION IF SAFE / ENVIRONMENT PREFLIGHT.

1. **First** verify whether you can access an actual full checkout and locked Node22/pnpm10 dependencies in current tool environment, rather than assuming user-local PC or cloud execution. If not, document exact missing mounting/connector/runner mechanism and hand the owner an executable command packet for a trusted local/CI test executor; no invented test results.
2. **Frontend P0 sequence** (no PostgreSQL required when checkout+dependencies available): PR43 CSV, PR47 DE presentation, PR50 Backup preview, PR52 stage lifecycle (7 RTL), PR53 auth query cache (9 RTL), PR54 RR readback (6 RTL). Run actual per-SHA typecheck, targeted RTL and backend-independent browser regressions, exact exit/TAP + skip status.
3. **Physical PG16** only when A20 preflight/owner approved disposable test database: PR39 MP1, PR41 Backup B1, PR42 global Undo LIFO, PR44 auth bans/picks, PR45 RR roster, PR46 DELETE, PR48 consistent export, PR49 password/visibility, PR51 malformed undo; run positive/negative and zero-write snapshot where relevant. No production/shared DB fallback.
4. Recheck PR35 Pack19 matcher and PR40 Pack17 real full gate only when permitted; failed GitHub CI at earlier Pack19 cannot stand in for test success or regression fail of target patch.
5. For each executed item save \`repository SHA, command, test fixture, Node/PG environment, test DB fingerprint (sanitized), exit code, pass/fail/skip counts, observed behavior\`; don't invent SHA or run status.
6. If tooling cannot run real tests, provide **one minimal self-contained authorized test runner plan for user PC or approved isolated GitHub Actions**, including non-destructive safety preflight and requested permission; do not repeatedly generate abstract harnesses without a concrete executable path.
7. Deliver exact independent evidence to A60 and manifest receipt list to A10. Release remains NO-GO.

**DELIVERABLE:** \`WEB-005_A50_R14_EXECUTION_OR_BLOCKER.md\` + per-packet machine-readable status and safe runbook. **STOP:** shared DB, paid CI without GO, claims of PASS without execution.

## AGENT A60 — P0: Independent Source Verdict / QA Matrix

**TASK:** \`WEB-005-T130-A60-R14\` | **MODE:** STRICT READ-ONLY, INDEPENDENT FROM AUTHORS.

1. On real GitHub HEADs review **new PR52/53/54 first** (source logic + authored tests) and source negative/positive cases:
   - #52 stale lifecycle modal snapshot/status/version, no POST on invalid, fresh stage & ceremony/readiness GET, valid start/complete.
   - #53 private auth cache eviction on logout/token rotation/401/403, delayed response, unrelated public cache retained; residual unscoped ID-only caches.
   - #54 RR stage-detail canonical invalidation N→N+1, late response, 401/403 hide private, non-RR no refetch storm.
2. Review existing P01–P18 statuses exact SHA; prioritize high-severity PR41/42/44/46/48/49/50/51 then PR39/45/47/43 and infrastructure PR35–40. Don't automatically redo already signed unchanged source acceptance; reference exact previous independent report if available.
3. For each package produce \`SOURCE_ACCEPTED\` or \`SOURCE_BLOCKED/FAIL\` with precise file/line/contract, independent of runtime readiness. Separate \`RUNTIME_VERIFIED\` only when A50 proves execution with command+exit and exact SHA.
4. Keep original 38 WEB-004 handoff cases as immutable historical provenance (0 PASS,3 external FAIL,33 blocked,2 not run at original evaluation), map new evidence separately to finding→PR without retroactively rewriting the original.
5. Triaging Pack19 CI: reject false inference of PR52/53/54 target test FAIL when workflow stopped earlier; also never waive the full final integration gate.
6. Give 00 a ranked list: immediate source regressions (need fix-specific GO), tests physically blocked, policy decisions, candidates accepted source-only, and exact closeout criteria.
7. No code fix or self-acceptance; release NO-GO.

**DELIVERABLE:** \`WEB-005_A60_R14_INDEPENDENT_QA_MATRIX.md\` + explicit A00 signoff advice.

## AGENT A70 — T040 Source-only Undo/Direct Revert CAS Gate

**TASK:** \`WEB-005-T040-A70-R14\` | **MODE:** SOURCE ONLY.

1. Verify PR39 MP1, PR42 global latest-action LIFO, PR51 malformed undo history current SHA and exact A50/A60 test receipts. Don't patch/rewrite them in R14.
2. Finalize one owner decision on Direct Revert CAS: expectedMatchRevision and expectedCompletionActionId required vs gradual Host compatibility; status codes for omitted/malformed vs stale; completion action lookup beyond first page/50 logs.
3. Preserve test-first stale X/Y LIFO 409 zero-write and allowed normal Undo; include legacy result_history/action_log migration risk. Do not change existing frontend API wire without policy.
4. Provide A50 isolated PG/rollback fixture for PR39/42/51, A60 regression and conflict notes (\`routes/tournaments.ts\` overlaps PR39/42/44/46/51). Do not merge.
5. Draft **future code lane request** only after owner signature and QA evidence.

**DELIVERABLE:** \`WEB-005_A70_R14_MP2B_POLICY_AND_QA.md\`. **STOP:** code/merge/release.

## AGENT A80 — Sporting Rules / Owner Policy Signoff

**TASK:** \`WEB-005-T050-T051-A80-R7\` | **MODE:** SOURCE ONLY.

1. Recheck PR45 RR terminal roster exact SHA and its A50/A60 PG16 outcome (or NOT_EXECUTED). No duplicate source patch.
2. Consolidate **TS-A** terminal Swiss deny 409/no writes versus **TS-B** atomic reopen (stage/tournament/winner/roster + audit) as a one-page binding owner decision, leaving status POLICY_OPEN until signed.
3. Other policy decisions: SE currentRound actionable/generated; Swiss5/6 optimal unavoidable rematch vs greedy/BYE/NC weights, DE runner-up/GF Reset + ranks 3–N; preserve historical withdrawn findings as WITHDRAWN.
4. Provide A50 runnable deterministic fixtures only on approved test DB; model-check != runtime PASS, don't need another sweeping sport audit.
5. Define one next minimal policy-approved patch candidate, exact files/conflicts with PR42/45/51, awaiting explicit future code GO.

**DELIVERABLE:** \`WEB-005_A80_R14_OWNER_SPORTING_DECISIONS.md\`. **STOP:** sport-rule code without owner policy.

## AGENT A90 — Backup B2 Policy + B1/B3A Independent Evidence

**TASK:** \`WEB-005-T060-A90-R7\` | **MODE:** SOURCE-ONLY / BACKUP QA SUPPORT.

1. Pin PR41 B1 fail-closed preclone and PR48 B3A read-only MVCC snapshot exact SHA and real tests by A50 if any. Don't claim PG PASS from source.
2. Prioritize positive imported legacy V3 + 12 corrupted reference/route cases, zero cloned rows after reject; B3A concurrent exporter writes must yield one repeatable-read snapshot, never mixed.
3. Prepare owner/HQ B2 decision comparing strict match revision/history/undo payload validation vs compatibility with historically valid portable snapshots and missing optional action logs. Distinguish SOURCE_CONFIRMED referential defects from policy choices.
4. Give A50 B2 fixture for future execution, A60 invariant/legacy acceptance, A20 schema/history dependencies. No new source patch for B2 without policy and future code GO.
5. Document cross-PR collision PR41/48 \`backup-v3.ts\` for eventual SWARM-006 integration only, not current merge.
6. Report exact next owner choice needed and minimal patch proposal after approval.

**DELIVERABLE:** \`WEB-005_A90_R14_B2_POLICY_GATE.md\`. **STOP:** backup code/SQL/import production.

## AGENT A100 — PR53 S2A Cache Source/Privacy QA, no coding

**TASK:** \`WEB-005-T080-A100-R14\` | **MODE:** SOURCE-ONLY / AUTHOR QA HANDOFF.

1. Pin PR53 S2A \`6a8f0c3e5775eb056df75ebdd7b33df7cbc78979\`; freeze code branch. Distinguish nine authored React tests from zero executed RTL if none actually ran.
2. Give A50 exact Node22/pnpm10 targeted tests and A60/30 independent security acceptance: explicit logout, token replacement, 401/403 revocation, late in-flight response A, private query cache purge only for A, public B unaffected.
3. Inspect disclosed residual concern of unscoped player/match ID-only private caches and component-local data. Create a **bounded source-backed residual inventory**, not a speculative fourth code lane. If concrete privacy defect remains, give 00 minimal ownership/priority proposal and race fixture.
4. Reconcile POST-lock backend PR44/46/49 as separate source patches; no TTL/token policy rewrite or merging these fixes into frontend S2A.
5. A00 receives exact source QA status and next required evidence, no author-countersign.

**DELIVERABLE:** \`WEB-005_A100_R14_S2A_SECURITY_QA_AND_RESIDUAL.md\`. **STOP:** new code PR without new GO.

## AGENT A110 — Stage Modal and Backup Preview QA + Basket CAS Owner Gate

**TASK:** \`WEB-005-T055-T110-A110-R14\` | **MODE:** SOURCE-ONLY.

1. Pin PR52 lifecycle modal (7 authored RTL cases), PR50 Backup UX045 (10 authored RTL), PR43 CSV (5 authored RTL) at latest SHA; no duplicate patch.
2. Hand A50 executable per-PR RTL/typecheck commands; A60 review no stale confirm POST, modal version refetch, correct organizer positive; Backup FileReader epoch+scope and credentials reset; CSV A→B stale read.
3. Reconcile PR43/50/54 path overlap \`tournament-detail.tsx\`; no merge, no editing. PR52 \`tournament-stages-panel.tsx\` standalone source-only QA.
4. Present **T055 Basket CAS owner/HQ decision in one page**: conflict status 409 vs 412, revision/version token, legacy client upgrade, stale PUT reject + retain draft/allow explicit retry, no silent overwrite. Retain WITHDRAWN StageBasketsPanel normal navigation claim.
5. Track UX044 Host dirty navigation and remaining UX016/other R2 scoped findings as backlog only if source verified; no new PR without 00 GO.
6. Deliver A50/A60 negative and valid positive test contracts, preserve privacy boundaries.

**DELIVERABLE:** \`WEB-005_A110_R14_FRONTEND_QA_BASKET_POLICY.md\`. **STOP:** coding or changing basket concurrency semantics.

## AGENT A120 — RR/DE Presentation QA and Cross-PR Collisions

**TASK:** \`WEB-005-T100-A120-R14\` | **MODE:** SOURCE-ONLY / AUTHOR QA SUPPORT.

1. Pin PR54 F058 RR readback (6 authored RTL) and PR47 PR-A DE Details/labels/completed hero (authored RTL) at actual HEAD; freeze both source branches.
2. Provide A50 targeted frontend commands and A60 strict independent test expectations: N→N+1 standings/detail freshness, old response cannot replace new, 401/403 private hiding, non-RR no extra refetch; DE correct API, label map and champion precedence.
3. Distinguish prior source-confirmed missing invalidation from runtime reproduction; do not label feature PASS from static invariant checks or failed upstream CI Pack19.
4. Record PR54/PR43/PR50 same \`tournament-detail.tsx\` merge conflict risk, PR47 \`stage-progress-view.tsx\` presentation dependency, and PR45 sports API canonical changes; do not resolve by cherry-pick.
5. Avoid new F054 champion-bug patch (already source-corrected PR32); only regression. No rearchitecture.
6. Provide A00 evidence of whether further T100 work is genuinely open or only waiting QA and eventual integration.

**DELIVERABLE:** \`WEB-005_A120_R14_T100_SOURCE_ACCEPTANCE_HANDOFF.md\`. **STOP:** new PR/merge/release.

---

## §3 — R14 completion gate and coordination decision

A00 collects all 13 agent reports and publishes one **R14 QA readout**:
- Number of **source patches** (21 starting, updated only by actual GitHub),
- Number with **independent SOURCE_ACCEPTED** on pinned SHA,
- Number with **RUNTIME_VERIFIED** actual app tests and environment,
- Number **BLOCKED/POLICY_OPEN/WITHDRAWN** with owner/disposition,
- List of high-severity source FAIL needing scoped next implementation,
- Specific owner/HQ policy signoffs required before further patches,
- A10 internal final-packet coverage.

**R14 itself does not authorize the final SWARM-006 transfer.** Even if all 21 drafts source accepted, formal closeout requires all accepted WEB-004 R2 findings dispositioned and final A60/owner signoff. SWARM-006 later integrates all approved fixes in Git/GitHub, resolves conflicts, runs composite full regression/staging and deploy only after HQ authorization.

## §4 — Short identical prompt for all 13 threads

WEB-005 — START FALI R14

Open the central document:
https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R14_AGENT_PROMPTS.md

Read §0–§2. Identify your Axx based on the thread role. Execute only the matching AGENT Axx section, with its GO/STOP permissions. Recheck live PR HEADs/SHA and relevant evidence. Deliver assigned artifacts and your R14 end-of-wave report to A00. Do not take another agent's work, merge/release, or activate SWARM-006.
