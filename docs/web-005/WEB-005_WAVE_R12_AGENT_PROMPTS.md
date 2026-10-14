# WEB-005 — FALA R12 — CENTRALNY DOKUMENT PROMPTÓW AGENTÓW

**Wersja:** R12.1 — 2026-10-14 (Europe/Warsaw)  
**Koordynator:** WEB-005/A00 Implementation Lead — nie globalna Queen; jedyna globalna Queen działa w HQ.  
**Repozytorium:** \`C8LyNn/aplikacja-turnieje\`  
**Gałąź kontrolna:** \`chore/web-005/t000-wave1-control\`  
**Wejścia:** WEB-004 Bug Hunting 002 \`WEB-004_TO_WEB-005_HANDOFF_R2_2026-10-14.md\`; WEB-005 BACKLOG/DECISIONS, WAVE_R11_AGENT_PROMPTS, R10/R11 handoff agentów, aktualne PR-y GitHub.  
**Stan:** R11 zakończony operacyjnie; WEB-005 nadal IN_PROGRESS; RELEASE NO-GO; SWARM-006 FINAL HANDOFF DEFERRED.

**Instrukcja identyfikacyjna:** każdy wątek czyta wspólne §0–§2 oraz **tylko swoją sekcję \`AGENT Axx\`**. Wątek A80 nie jest A08, A00 nie jest Queen. Brak pewnego przypisania roli → nie wykonuj cudzych działań i zgłoś problem A00. Dokument jest centralnym i niezmiennym podczas fali źródłem R12; aktualizacje zadań wymagają nowej decyzji A00.

## §0 — Wspólne zasady pracy, bezpieczeństwo i dowody

1. **Najpierw GitHub.** Potwierdź aktualne HEAD/base/zmienione pliki i source raporty, ponieważ §1 to punkt kontrolny. R11 stworzył **PR #46, #47 i #48**; nie implementuj ich po raz drugi. P01–P12 z wcześniejszych fal pozostają odrębnymi kandydatami.
2. **Dowody:** SOURCE_CONFIRMED (potwierdzony stan kodu), STATIC_INFERRED/HYPOTHESIS (skutek nieudowodniony runtime), PATCH_PROPOSED (kod/PR istnieje), SOURCE_ACCEPTED (niezależny source verdict), RUNTIME_VERIFIED (faktycznie wykonany test na dokładnym SHA z command, env, exit code), FAIL, BLOCKED, NOT_EXECUTED i POLICY_OPEN. Testy napisane ≠ testy wykonane. Nie podmieniaj historycznej macierzy WEB-004 A60 (38 przypadków: 0 PASS / 3 external-CI FAIL / 33 BLOCKED / 2 NOT_RUN) nowymi wynikami testów ani dawną wersją 29-case.
3. **Twardy STOP:** brak merge/cherry-pick do release/main, composite integration branch, SQL DDL/adoption/migrations, produkcji, Replit, staging/live, mutujących testów wspólnej bazy, płatnego CI rerun bez zgody owner/HQ, logowania sekretów lub używania realnych backupów. Code-only GO dotyczy małej gałęzi i draft PR, nie integracji.
4. **Jedynie 3 równoległe R12 code lanes:** L1 A70/T040-HIST-PARSE (malformed Undo payload, fail-closed), L2 A100/T080-S1B-P (post-lock revalidation password/visibility routes), L3 A110/T110-UX045 (asynchronous backup preview identity and credentials hygiene). Każda jest GO wyłącznie w swoim wąskim zakresie, test-first i na osobnej gałęzi od wskazanego release baseline. Jeśli źródła wymagają nieuzgodnionej polityki lub cudzej ścieżki pliku, HOLD ten fragment i zgłoś 00; nie rozpoczynaj czwartego patcha automatycznie.
5. **Wyłączność plików:** A70 \`routes/tournaments.ts\` w obszarze global Undo i testu Undo, bez dotykania PR42/MP2A, PR39/MP1. A100 \`routes/auth.ts\` i ewentualnie \`access-policy.ts\` w obszarze credential mutations, bez PR44/46 i bez \`routes/tournaments.ts\`; jeśli konieczny konflikt z PR44 -> HOLD + A00. A110 frontend \`tournament-detail.tsx\`/ \`backup-restore-dialog.tsx\` wyłącznie obszar Backup preview, bez zmian PR43 CSV; jeśli konflikt w tym samym hunku, HOLD. A90 Backup V3 i A120 presentation **nie piszą kodu R12**.
6. **Policies (nie wybierać samodzielnie):** terminal Swiss deny vs atomic reopen, Swiss/BYE/rematch, SE pointer, DE final/ranking, Basket CAS 409 vs 412 and token/legacy, Backup revision/legacy, public Direct Revert strict CAS & Host rollout/active completion ID, Steam missing secret 403/503, auth TTL/token hashing/rotation model. W R12 nie wolno maskować braku decyzji pod pozorem poprawki technicznej.
7. **Rozdział rojów:** WEB-004 audyt zakończony, bez nowych raportów; WEB-005 implementuje i testuje przyjęty HANDOFF R2; **SWARM-006 dostaje tylko jedną FINALNĄ paczkę po formalnym zakończeniu całego backlogu WEB-005**; A10 zbiera wewnętrzny INTERNAL_BUFFER bez wysyłki. SWARM-007 buduje standardy i strukturę plików/Google Drive, lecz synchronizacja nie jest tu domniemana.
8. **Realny QA:** A50 ma priorytet P0 dla powtarzalnego Node22/pnpm10/Front oraz odizolowanego fizycznie PostgreSQL16. Testy destrukcyjne wyłącznie na jawnie zatwierdzonej disposable bazie/schema tm_test_* z \`TEST_DATABASE_URL\`, bez fallbacku do produkcyjnego/shared DATABASE_URL, po potwierdzeniu reset-scope. Wymagana niezależna ocena A60 na exact SHA. Brak środowiska = BLOCKED/NOT_EXECUTED, a nie PASS.
9. **Ważny CI Pack19:** PR #35 już naprawia test/regex. R11 autoryzowane osobne PR-y #46–48 bazują na release **bez** #35, dlatego ich automatyczne CI wciąż uruchamia historyczny test \`/isolationLevel:"repeatable read",readOnly:true/\` i FAIL na rzeczywistym \`{isolationLevel:"repeatable read",accessMode:"read only"}\`. To konkretna niezgodność starego kontraktu testowego, **nie dowód porażki patchy #46–48**. Nie twórz duplikatu PR #35 ani nie osłabiaj fail-closed; A40/A50 mają wykazać poprawkę P01 i preintegracyjne ograniczenie per-PR CI. Własną integrację wykona później wyłącznie SWARM-006.
10. **Raport:** każdy agent kończy \`WEB-005_Axx_R12_HANDOFF.md\` z TASK/GO/STOP, dokładnym SHA/PR/base, plikami, realnymi testami/exit code lub NOT_EXECUTED, evidence classification, QA pending, policy, owner, konfliktem, warunkiem dalszych prac; nie obiecuj pracy asynchronicznej.

## §1 — Rejestr istniejących paczek / snapshot GitHub na 2026-10-14

**Release baseline:** \`release/tournament-ops-20261013-01\` = \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`. \`main\` odrębny. Aktualne PR-y 34–48 poniżej są **OPEN DRAFT i unmerged**; PR #32 release→main nadal otwarty; PR #33 alternatywny Steam patch nadal HOLD.

| PR | Zakres | HEAD SHA | Bramka |
|---|---|---|---|
| #35 (P01) | Pack19 source contract | \`7cb283aa82273a1e22daf9051a82311eef53760c\` | scoped PASS, brak pełnego composite |
| #36 (P02) | Pack20–26 contracts | \`85ad0b86136fc3491c9ef18663d9b01396179349\` | full native not verified |
| #34 (P03) | Steam Catalog write auth | \`fae2eea2f22df3f1b02ad035a7db00bc411ea73f\` | HTTP/PG independent pending |
| #37 (P04) | proxy trusted CIDRs | \`fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7\` | HTTP/security pending |
| #38 (P05) | offline migration ledger validator | \`2d36864f4d2f1c838073f387fd3c8efb3378c43b\` | REVIEW_ONLY, no SQL GO |
| #39 (P06) | Cancel/Restore MP1 | \`16053ee132756ca05b6f2cd1f0cabae823905387\` | PG/API/React parity pending |
| #40 (P07) | Pack17 fail-closed | \`9a8287271299a59fc9291b8d253299a8d109a35d\` | synthetic contract ≠ --full |
| #41 (P08) | Backup V3 B1 preclone | \`e847cb705296a48ab5c68ece96776cd0e0bbb417\` | PG/rollback pending |
| #42 (P09) | Global Undo MP2A | \`1ae0ccb801f4177052bff1ec7041e55b8c992c8b\` | PG LIFO race pending |
| #43 (P10) | CSV late FileReader | \`96a6068f69027574ac76e18d4d5a2c444b5a914a\` | actual RTL/browser pending |
| #44 (P11) | post-lock S1A auth bans/picks | \`2f0187b7242681c394c09058b5ef647667206bd6\` | PG/security pending |
| #45 (P12) | terminal RR roster scope | \`a7a87bc019731191dbfa44bee6939e3fa25e27f4\` | PG statuses pending |
| #46 (R11 NEW) | post-lock tournament DELETE | \`7f60849e389a7ed35fdd39dd5493c4c4c267d860\` | PG/security pending |
| #47 (R11 NEW) | DE Details / labels / final overlay | \`f09a13623faca8d7ab29b09a2c5b43907c2acd0b\` | RTL/browser pending |
| #48 (R11 NEW) | Backup V3 B3A consistent MVCC export | \`2a8a4c72cb4a3a37402a346fd0acc83b03b39be3\` | PG MVCC concurrency pending; CI Pack19 baseline failure |

**P13–P15 ID mapping:** A10 must confirm current existing internal R11 manifest before assigning canonical identifiers to PR46/47/48; do not invent mapping if the live manifest differs. A10 owns these IDs and any P16+ new PRs.  
**CI proof:** GitHub Actions job 115963545435 on run 38596228642 returned Pack19 \`not ok 1 - transaction is explicitly read-only and snapshot isolation\` with expected outdated \`readOnly:true\`; actual release uses \`accessMode:"read only"\`. Do not reinterpret this as a failure of exporter code or complete native PG evidence. Old PR #35 updates the matcher but is not integrated.

## §2 — R12 ownership, execution priorities and conflict gates

| Wątek | Zadanie | Tryb |
|---|---|---|
| 00 | Koordynacja, zamknięcie R11, policy queue i R12 gate | COORD |
| 10 | Internal rolling P01–P15(+), manifest SHA/conflicts, final-only | DOCS |
| 20 | T020/T021 ledger/PG schema prerequisites and API assumptions | SOURCE QA |
| 30 | Steam/proxy + S1A/S1B security QA | SOURCE QA |
| 40 | Pack19 actual CI mismatch root-cause and P01 proof; Pack17 | QA ONLY |
| 50 | **P0** real test infrastructure, pg16/React/API execution, artifact logs | SAFE TEST ONLY |
| 60 | **P0** independent exact-SHA source/runtime QA, prioritize #41–48 | STRICT READ ONLY |
| 70 | T040 malformed historical Undo payload guard | **GO CODE-ONLY L1** |
| 80 | Swiss terminal/SE/DE policies and PR45 QA | SOURCE ONLY |
| 90 | Backup B1/B3A QA, B2 match/history policy-safe design | SOURCE ONLY |
| 100 | T080 S1B-P password/visibility post-lock auth | **GO CODE-ONLY L2** |
| 110 | T110 UX045 backup preview async identity/credential hygiene | **GO CODE-ONLY L3** |
| 120 | T100 PR-A QA, F058 RR freshness PR-B test-first plan | SOURCE ONLY |

**Ważna granica:** Nowe patche autorów nie stają się QA_ACCEPTED automatycznie. Trzy code lanes pracują niezależnie w dozwolonym zakresie; A50/A60 stopniowo odbierają wszystkie 15 aktualnych draftów. Nie wykonuj żadnego cross-PR merge ani composite test integration za SWARM-006.

---

## AGENT A00 — Implementation Lead R12

**TASK ID:** \`WEB-005-T000-A00-R12\`. **MODE:** COORDINATION.

1. Zweryfikuj PR #46–48 oraz raporty A90/A100/A120 z R11, przypnij ich exact HEAD i zmiany; poprzednich PR #34–45 nie otwieraj od zera.
2. Zbierz raport A10 R11 internal manifest, odróżniaj źródłowy patch od niezależnego QA/runtime; otwarty draft != DONE.
3. Ustal 3 code-only lanes: A70 Undo malformed payload, A100 S1B-P auth routes, A110 UX045 preview. **Nie nadaj czwartego GO**, a kolizje z istniejącym PR #44/46/42/43 rozwiązuj przez HOLD+precyzyjny file window, bez samodzielnego merge.
4. Priorytet **P0 real QA** A50 i A60. Nie traktuj blokady starego Pack19 jako nowego defektu PR46/47/48, ale nie przechodź do release PASS.
5. Wydziel decyzje owner/HQ: POLICY-TERMINAL-SWISS, SE, Swiss/DE, Basket, Backup portable revision, strict public Revert/Host, Steam 403/503; nie wybieraj ich bez autoryzacji.
6. Track \`finding→task→owner→PR/HEAD→source QA→runtime→status\` dla całego WEB-004 R2. WEB-004 nie zamawia dodatkowych raportów.
7. Po R12 dokumentuj P01–P15+ internal buffer, stan całego backlogu, test blockers i następne małe zadania; nie aktywuj SWARM-006.

**DELIVERABLE:** \`WEB-005_A00_R12_COORDINATION.md\`, BACKLOG/DECISIONS reconciliation, report R12, remaining DoD. **STOP:** merge/deploy/CI billing/SQL/SWARM-006 dispatch.

## AGENT A10 — Internal Manifests P01–P15+

**TASK ID:** \`WEB-005-T018-A10-R7\`. **MODE:** READ-ONLY/DOCS.

1. Odczytaj swój R11 \`WEB-005_A10_R11_PACKAGE_MANIFEST.json\` oraz matrix SHA. Nie twórz od nowa danych już zatwierdzonych.
2. Odśwież P01–P12 i **ustal prawidłową kolejność/pakietowe ID** PR46 (DELETE), PR47 (presentation), PR48 (B3A) zgodnie z istniejącym R11 manifestem; P13–P15 tylko po faktycznym SHA/pakiecie.
3. Przygotuj SHA/paths/ancestry, dependency/conflict matrix. Szczególnie PR44 + PR46 auth, PR42 + PR44 routes/tournaments, PR41 + PR48 backup-v3, PR47 vs przyszły PR-B, PR43 vs UX045 backup code.
4. Dla nowych R12 PR wpisz P16+ tylko po realnym utworzeniu; nigdy nie fikcyjne SHAs czy test PASS.
5. Zapisz różnicę \`SOURCE_READY\` vs \`SOURCE_ACCEPTED\` vs \`QA_ACCEPTED\` vs \`RUNTIME_VERIFIED\` według A60/A50; nie podpisuj QA sam.
6. Przedstaw przyszły cross-PR conflict plan **do użycia przez SWARM-006 kiedyś**, ale nie integruj ani nie wysyłaj teraz niczego. SWARM-007 metadane: artefakt, właściciel, source SHA, odbiór, wersja, retencja.

**DELIVERABLE:** \`WEB-005_A10_R12_INTERNAL_MANIFEST.md\`, exact internal P01–P15+ matrix. **STOP:** no SWARM-006 send.

## AGENT A20 — PostgreSQL migration ledger guard

**TASK ID:** \`WEB-005-T021-A20-R7\`. **MODE:** SOURCE-ONLY.

1. Zweryfikuj PR #38 fail-closed offline validator, source checksum, history release/editor/0030–0031 i status \`REVIEW_ONLY\`. Autorowe syntetyczne 37/37 + uzupełniające nie są PG real-run PASS.
2. Przygotuj A50 niewykonawczy preflight katalogu PG16 / bezpieczne test-only schema, wymagane dla Backup B1+B3A, Undo/Revert i S1 auth. Wyklucz nieautoryzowaną historię adopted SQL.
3. Zweryfikuj, czy nowy PR48 B3A (read-only REPEATABLE READ) nie deklaruje nieistniejących tabel w niezatwierdzonym ledgerze; przypnij exact source paths.
4. Przekaż A60 negatywne testy \`MANIFEST_PIN_MISMATCH\`, history drift, orphaned ledger, unresolved 0030/0031.
5. Żadnego SQL runner, DDL, applied ledger adoption ani produkcyjnego katalogu.

**DELIVERABLE:** \`WEB-005_A20_R12_DB_GATE.md\` + exact STOP/REVIEW_ONLY.

## AGENT A30 — Security peer and auth consistency

**TASK ID:** \`WEB-005-T030-T031-A30-R10\`. **MODE:** STRICT SOURCE QA.

1. Odśwież PR34 Steam, PR37 proxy i PR44 S1A, PR46 S1B-D; porównaj napięcie auth semantics \`SUPPORT_SESSION_EXPIRED\` dla organizer i istniejące 403.
2. Niezależnie oceń PR46 DELETE under same locked transaction: stale organizer rejects 403/zero cascade, 204 valid authorized, denied viewer/support, no token logging; sprawdź ryzyko deadlock.
3. Nadzoruj nowy A100 S1B-P: chronione zmiany support/viewer password/visibility mają rewalidować stale organizer pod lockiem, bez eskalacji i bez zmiany własności tokenów. Jeśli sam projekt wymaga POLICY OPEN, poinformuj 00.
4. Dostarcz A50 bezpieczne scenariusze API/PG, A60 negative matrix. Nie przejmuj implementacji A100 i nie twórz kodu w tej fali.
5. Zostaw TTL/support-token digest/rotation strategy i frontend S2 jako odrębny backlog, nie udawaj zamknięcia ich przez S1B-P.

**DELIVERABLE:** \`WEB-005_A30_R12_SECURITY_QA.md\`; SOURCE/RUNTIME separated. **STOP:** NO CODE.

## AGENT A40 — Pack19 CI root cause + Pack17 gate

**TASK ID:** \`WEB-005-T010-T017-A40-R12\`. **MODE:** READ-ONLY / GATE RECOVERY CONTRACT.

**Confirmed CI cause:** runs 38596228642 / 38596198607 / 38595739665 fail at baseline Pack19 matcher \`/isolationLevel:"repeatable read",readOnly:true/\`; inspected source has \`{isolationLevel:"repeatable read",accessMode:"read only"}\`. P01 PR35 already updates the matcher; other independent PRs derive from release without P01. This is **not** a new independent Pack19 patch task.

1. Verify exact Pack19 logs, compare \`qa/pack19/source-contract.test.mjs\` in release vs PR35; show which expected invariants remain equivalent, including read-only actual DB behavior.
2. Confirm PR35 Pack19 scoped CI PASS on its SHA and PR40 Pack17 synthetic 24/24, but no full suite. Do not equate P01 test PASS with new PR46–48 tests.
3. Propose a **non-mutating acceptance strategy**: targeted per-PR tests on actual SHA where feasible, plus final verified Pack19 source-contract path when SWARM-006 later assembles packages. Do not create temporary release/composite branch inside WEB-005.
4. Check Pack17 --full paths, frontend/Animated Effects, API typecheck/codegen, PostgreSQL test preflight, negative fail-closed 0/skip/todo/TAP.
5. If a new true Pack19 defect is found beyond old source matcher, report it with precise reproduction to 00/A60; don't edit P01 or weaken assertions without separate code GO.
6. Give A50/A60 concise precise commands and CI failure provenance.

**DELIVERABLE:** \`WEB-005_A40_R12_PACK19_CI_RECONCILIATION.md\` + Pack17 blockers. **STOP:** NO CODE, no paid CI reruns.

## AGENT A50 — P0 actual test execution / environment

**TASK ID:** \`WEB-005-T133-A50-R7\`. **MODE:** SAFE TEST RUNNER / EVIDENCE.

1. Use existing harness/runner and R10/R11 evidence; do not rebuild from scratch. Establish actual test environment and physical isolation: Node22, pnpm10, frozen deps, read-only Git checkout exact HEAD; for destructive integration PostgreSQL16 dedicated host/db, schema \`tm_test_*\`, explicit reset approval, no shared/prod fallback.
2. Execute feasible **frontend-only** targeted RTL/typecheck/browser evidence on PR43 (CSV) and PR47 (presentation) first, with actual commands/exits. No DB needed to run isolated RTL.
3. Execute PG16-backed targeted suites for PR41 (B1 clone/12 corruption, positive/rollback), PR42 (Undo LIFO), PR44 (revocation bans/picks), PR45 (RR roster), PR46 (DELETE), PR48 (export MVCC) when safe; test PR39 MP1 and PR34/37 where relevant. Record failures at exact SHA and zero-write.
4. Explain CI Pack19 baseline failure separately: old regex in release vs P01 PR35; do not manually re-run billable GitHub Actions or claim PR48 failed targeted B3A tests. Targeted suites may bypass unrelated failing CI stage **but never** waive full integrated release gate.
5. For R12 A70/A100/A110 new PR run corresponding targeted tests after source patch. Collect command/sha/env/exit/TAP/PG snapshot and sanitized logs. No mock PASS.
6. If physical isolated PG16 or full repo checkout is unavailable, deliver precise **safe execution package and explicit blocker** rather than rewriting source or resetting a potentially shared DB.
7. Send A60 independent verification inputs, A10 manifests. Note that actual GitHub Actions uses a PG16 container, but a failed upstream Pack19 does not establish actual execution of downstream tests; manual reruns are not authorized.

**DELIVERABLE:** \`WEB-005_A50_R12_RUNTIME_RESULTS.md\` + machine-readable matrix (RUN/FAIL/BLOCKED). **STOP:** unsafe DB, fabricated success, paid CI without consent.

## AGENT A60 — Independent QA / release no-go

**TASK ID:** \`WEB-005-T130-A60-R12\`. **MODE:** STRICT READ ONLY, INDEPENDENT.

1. Pin latest HEAD all 15 PRs. Prioritize new PR #46 DELETE security, PR #47 presentation and PR #48 B3A snapshot; also PR #41–45 still source/PG/RTL gates.
2. For PR46: verify under-lock proof and 403/zero-delete race, valid DELETE positive, no cross-tournament token reuse; PR44 shared auth future conflict.
3. For PR47: canonical DE API read, loading/403/500, stale response handling, stage format label map, completed hero summary; authored React tests ≠ executed.
4. For PR48: exactly one repeatable-read/read-only tx, no nested/bypassing reads, two-barrier snapshot tests, real PG evidence, compatibility with B1 separately; note CI Pack19 historical matcher mismatch.
5. Check P01 PR35 Pack19 actual source fix and P07 PR40 negative release gates, distinguish unrelated CI blocker from regressions; all per PR reviews bound to exact SHA.
6. Independent source/runtime acceptance for new R12 A70 Undo parser, A100 S1B-P and A110 UX045 when real PRs appear.
7. Maintain WEB-004 A60 38 historical rows; avoid claiming runtime verification without commands/exit and environment. Compile blockers (policy, physical PG16, API client codegen, unmerged PR dependencies) and honest proposed closeout state.
8. Never implement or self-certify. NO GO for integration/release.

**DELIVERABLE:** \`WEB-005_A60_R12_INDEPENDENT_QA.md\`, per-package source/runtime/stop matrix.

## AGENT A70 — T040 fail-closed historical Undo payload (CODE L1)

**TASK ID:** \`WEB-005-T040-A70-HIST-PARSE-R12\`. **MODE:** **GO NARROW SOURCE-CODE ONLY / TEST-FIRST**.

**MISSION:** Fix one existing source-confirmed Undo robustness gap: malformed historical \`action_log.undoPayload\` should fail closed in a controlled manner **without** uncaught JSON parse error/500 or partial DB writes. Do NOT implement Direct Revert public strict CAS/MP2B (POLICY OPEN) or change MP1/MP2A behavior.

1. Inspect release baseline and R11 A70 source contract for exact \`JSON.parse\` call sites on generic Undo/action replay. Enumerate malformed JSON/object shape/foreign match id payloads, unknown action types; distinguish true source gap from already caught parse locations.
2. Test-first create fail-closed negative cases with one malformed stored action at top of Undo history: expect existing stable controlled 409 (\`UNDO_ACTION_CHANGED\` or another **already defined** error mapping) and \`zero writes\` to match/result_history/actionLog/players/stages. If existing API contract cannot support a controlled rejection without a new policy, HOLD code and report to A00.
3. Minimal typed \`safeParseUndoPayload\` handling or equivalent within authorized Undo path, catch parse errors and reject **before state mutation inside same transaction**. Preserve all valid historical payload variants that can be interpreted safely; never auto-fix/delete unknown data.
4. Separate isolated branch from release, not PR #42 or #39. Do not cherry-pick PR27/PR7, implement new CAS preconditions, change client API or force migration.
5. File owner: \`routes/tournaments.ts\` Undo hunks only in R12; A100 owns \`routes/auth.ts\` and any access-policy helper, no shared mutation. If tests reveal need to edit A80's \`revert-match.ts\`, HOLD and request 00 exclusive window.
6. Add negative tests for valid Undo remains intact, malformed JSON/array/null/foreign match target; A50 PG16 run if safely available, otherwise record NOT_EXECUTED; A60 exact-SHA independent verdict.
7. Create DRAFT PR with precise diff/test command/rollback and history migration risks; don't mark QA PASS from test-source alone.

**DELIVERABLE:** \`WEB-005_A70_R12_HIST_PAYLOAD_PATCH.md\` + PR if safe. **STOP:** no global Undo rewrite, policy choice, merge, deploy.

## AGENT A80 — Terminal Swiss / sport policy and PR45 QA

**TASK ID:** \`WEB-005-T050-T051-A80-R5\`. **MODE:** SOURCE ONLY.

1. Recheck PR45 RR scoped-reopen at exact HEAD, audit A52-F019 and author test first, hand A50/A60 the definitive PG16 fixture, not self-certify.
2. Submit POLICY-TERMINAL-SWISS to 00/owner: DENY_409/no writes vs ATOMIC_REOPEN stage+tournament+winner, exact expected UX/reversal; no default choice.
3. Preserve SE currentRound actionable/max-generated policy, Swiss5/6 rematch/BYE/no-contest tie-break, DE GF/reset loser runner-up and positions 3–N separate decisions.
4. Provide next single code-lane candidate after actual owner signature: terminal Swiss DENY guard if chosen, preserving corrective audit history, no simultaneous modification of A70 Undo source.
5. Recheck determinism of your R11 model fixtures but distinguish MODEL_CHECKED from test suite PASS.
6. No code edits R12 without separate GO, no changes to PR45.

**DELIVERABLE:** \`WEB-005_A80_R12_SPORT_POLICY_AND_QA.md\`.

## AGENT A90 — Backup B1/B3A QA + B2 integrity design

**TASK ID:** \`WEB-005-T060-A90-R5\`. **MODE:** SOURCE-ONLY/QA SUPPORT.

1. Confirm PR41 B1 and PR48 B3A live HEAD, paths and current CI run; B1 preclone checks and B3A single MVCC read-only transaction are independent source patches. Both await A50 PG16 and A60 exact SHA.
2. B1 cases: QP/QPE/OP, route arrivals/receipts, invalid 400/no clone, late transaction rollback, valid legacy positive.
3. B3A: two-connection deterministic barrier for root vs stages/history/route updates; old-snapshot-only and later-new snapshot, typed fixture, no leakage of transaction handle.
4. B2 future source contract: completed match ↔ latest result_history equality, action_log match IDs/undo payload remap, revision monotonicity. **POLICY-BACKUP portable match revision/legacy** remains owner/HQ; no reject of historically valid snapshot without approval. Preserve fallback/existing V3 imports.
5. Prepare two minimal next-patch options: pure validation that is valid for all documented modern V3 backups vs conditional legacy acceptance requiring policy. Do not implement B2 in R12 or amend PR41/48.
6. A20 schema/ledger, A70 history and A50/A60 tests are dependencies; send exact B2 test-first matrix, risks and GO/STOP to A00.

**DELIVERABLE:** \`WEB-005_A90_R12_B2_POLICY_AND_B1_B3A_QA.md\`. **STOP:** no source code/SQL.

## AGENT A100 — T080-S1B-P post-lock auth/password visibility (CODE L2)

**TASK ID:** \`WEB-005-T080-A100-S1B-P-R12\`. **MODE:** **GO NARROW SOURCE-CODE ONLY / TEST-FIRST**.

**MISSION:** Protect existing organizer-authenticated **support/viewer password and visibility mutations** against a stale organizer credential that was initially authorized but revoked while queued for tournament lock. Do not change token schema/TTL, public API body, or private frontend cache.

1. Reuse R9 S1 inventory \`routes/auth.ts\` password/visibility functions; check initial \`requireOrganizer\`, tournament lock, and whether **post-lock** authorization actor is currently revalidated. Don't redesign existing set-password semantics or first-organizer installation.
2. Select only identified routes in \`routes/auth.ts\` with actual missing post-lock guard, create deterministic delayed-A/rotating-B race with existing credential hash change, stale A resumes → 403 (stable error) + no password/visibility/token mutations. Include valid organizer positive, unprivileged viewer/support denial.
3. Keep lock and mutation in **same transaction**; preserve existing token type, hashing, revocation, privilege rules and numeric error contracts. Avoid introducing deadlocks/ nested transaction.
4. If a route needs a helper introduced **only** in unmerged PR44, choose a safe standalone minimal equivalent based on release or HOLD with dependency report; do not cherry-pick/integrate PR44 or PR46. Do not modify \`routes/tournaments.ts\` (A70 exclusive Undo).
5. Add test-first PG16 suite for supported route set. If live correct behavior already exists, report SOURCE_RECONCILED and **do not** invent a patch; release lane remains unspent pending 00.
6. Draft PR only for confirmed gap. A30 peer review, A50 real runtime if safe, A60 independent exact SHA. Record NOT_EXECUTED if no approved PG16.
7. Leave DELETE PR46, bans/picks PR44, correction intent, S2 React private cache, TTL/token digest/migration and broad auth policies as separate work.

**DELIVERABLE:** \`WEB-005_A100_R12_S1B_PASSWORD_VISIBILITY_PATCH.md\` + draft PR if verified gap. **STOP:** cross-route expansion/merge/production.

## AGENT A110 — T110 UX045 Backup preview read isolation (CODE L3)

**TASK ID:** \`WEB-005-T110-A110-UX045-R12\`. **MODE:** **GO NARROW FRONTEND SOURCE-CODE ONLY / TEST-FIRST**.

**MISSION:** Prevent a stale backup-preview FileReader callback from one tournament or chosen file from populating a later/new preview, and prevent stale *new credential form values* from carrying to a different newly selected backup. Backup import creates a **new** tournament; never claim it overwrites an existing tournament.

1. Reuse R11 UX045 source inventory: both \`tournament-detail.tsx\` Backup import preview path and \`backup-restore-dialog.tsx\` path. PR43 protects **CSV** FileReader only; don't reimplement or edit its existing hook.
2. Write deterministic RTL tests for A backup selected→read pending, switch tournament A→B or choose newer backup B, stale A onload/onerror after abort, close/open dialog, new credential fields reset on different backup selection. Verify no stale data/secret/preview under B, no invalid silent import. Test valid current new-backup flow unchanged.
3. Implement minimal scope/epoch or active FileReader ownership, cleanup and form reset on backup/owner context changes. Preserve current backend, file schema V2/V3 parser, import creates new tournament, existing auth error behavior and public UI API. No new credential policy; where exact reset semantics contested, HOLD that subcase for A00 instead of guessing.
4. Isolated release-based branch/PR with small diff. \`tournament-detail.tsx\` may overlap PR43 different hunks; document conflict, do not modify PR43 branch and no cherry-pick. Do not change Host drafts, Stage modals or Basket CAS in R12.
5. Run real frontend typecheck and targeted RTL if environment exists; otherwise NOT_EXECUTED. A50 receives page/route tests, A60 source/runtime review exact HEAD including privacy.
6. New PR only for UX045; T055 baskets and UX044/046 remain separate, WITHDRAWN StageBasketsPanel navigation/backup overwrite claims stay withdrawn.

**DELIVERABLE:** \`WEB-005_A110_R12_UX045_BACKUP_PREVIEW_PATCH.md\` + draft PR if safe. **STOP:** no backend/data migrations, no credential redesign.

## AGENT A120 — Presentation PR47 QA + F058 future readback plan

**TASK ID:** \`WEB-005-T100-A120-R5\`. **MODE:** SOURCE ONLY / QA HANDOFF.

1. Recheck existing PR47 exact HEAD; F052 DE Details API, F053 canonical format labels, F055 completed hero precedence, F054 winnerId regression only. **No duplicate implementation**.
2. Hand A50 targeted React test commands, 403/500 and stale response fixture; A60 independent source review of DE cross-stage leak, audience winnerId and loading transitions. React tests remain NOT_EXECUTED until actual run; do not claim green on CI that never reached frontend.
3. For F058 external RR stage detail freshness, design a **future** PR-B minimal polling/invalidation path that refetches canonical API only, no local ranking recomputation, no change of sporting lifecycle semantics; assert latest tournament/stage identity and no stale data after 401/403.
4. Check dependency on PR45 RR roster state and PR39/42 Undo behavior and potential \`stage-progress-view.tsx\` collision with PR47; PR-B only after A60 review and new A00 code-lane GO.
5. No code changes R12, no redesign, no claims about live site without browser evidence.

**DELIVERABLE:** \`WEB-005_A120_R12_PR47_QA_F058_PLAN.md\`. **STOP:** no new frontend patch without GO.

---

## §3 — Końcowy raport i następna fala

Agent przy końcu R12 dostarcza: **AGENT / TASK / WAVE, source base + PR + exact HEAD, changed files, tests actually RUN (commands, exit) vs NOT_EXECUTED, A60 verdict or pending, code/policy blockers, safe rollback/expected behavior, next action, MERGE/DEPLOY=NOT_AUTHORIZED**.

A00 porównuje wszystkie raporty z bieżącym GitHub i prowadzi backlog WEB-004 R2 do końca, bez uruchamiania SWARM-006. Następny jeden centralny dokument R13 powstaje dopiero po zakończeniu R12 i sprawdzeniu realnych efektów.

## §4 — Krótki prompt do uruchomienia we wszystkich 13 wątkach

WEB-005 — START FALI R12

Otwórz centralny dokument:
https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R12_AGENT_PROMPTS.md

1. Przeczytaj wspólne zasady (§0–§2).
2. Rozpoznaj swój identyfikator Axx z przypisanej roli wątku.
3. Odszukaj sekcję AGENT Axx i wykonaj wyłącznie swoje zadania zgodnie z GO/STOP.
4. Zweryfikuj aktualne SHA/PR i źródła dowodów na GitHub.
5. Przygotuj wskazane artefakty i końcowy raport R12 dla 00.
6. Nie przejmuj cudzych zadań i nie uruchamiaj SWARM-006.
