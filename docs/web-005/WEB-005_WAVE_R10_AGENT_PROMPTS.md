# WEB-005 — CENTRALNY DOKUMENT ZADAŃ / WAVE R10

**Wersja:** R10.1 / 2026-10-14 (Europe/Warsaw)  
**Właściciel:** WEB-005/00 — lokalny Implementation Lead, podległy jednej globalnej Queen/HQ  
**Repo:** C8LyNn/aplikacja-turnieje  
**Gałąź dokumentacyjna:** chore/web-005/t000-wave1-control  
**Źródła:** WEB-004_TO_WEB-005_HANDOFF_R2_2026-10-14.md, WEB-005_WAVE_NEXT_IMPLEMENTATION_PLAN_R1.md, WEB-005_WAVE_R9_AGENT_PROMPTS.md, WEB-005_NEXT_REMEDIATION_WAVE_R9.md, BACKLOG.md, DECISIONS.md, R9 raporty agentów.  
**Status:** READY FOR R10 DISPATCH / R9 completed by agent threads; app remediation NOT COMPLETE; RELEASE NO-GO.

**Jeden wspólny dokument dla wszystkich 13 wątków.** Każdy agent odczytuje §0–§2 i wyłącznie sekcję AGENT Axx zgodną z przypisaną wcześniej rolą. Nie przejmuj sąsiednich zadań. Jeśli tożsamość wątku jest niejasna, powiadom 00 i wstrzymaj wykonanie.

## §0 — Reguły wspólne / go-no-go

1. **Nie rozpoczynaj ponownie R9.** T060-B1 PR #41 i T040-MP2A PR #42 już istnieją jako draft; T017 PR #40, MP1 PR #39 i PR #34–38 również istnieją. R10 = niezależny odbiór i odrębne, wąskie nowe poprawki. Każdy agent najpierw odświeża HEAD/PR/base GitHub; SHA z §1 to snapshot, nie niezmienna przyszła prawda.
2. **Pochodzenie dowodu:** SOURCE_CONFIRMED (istniejący brak w źródle), STATIC_INFERRED/HYPOTHESIS (przewidywany efekt), PATCH_PROPOSED (draft PR), SOURCE_ACCEPTED (review kodu), RUNTIME_VERIFIED (test rzeczywiście wykonany na konkretnym SHA), BLOCKED, NOT_EXECUTED, POLICY_OPEN. Syntetyczny harness / napisany test / przeprowadzony statyczny przegląd != zaliczony test PostgreSQL/API/frontend.
3. **WOLNO:** w obrębie indywidualnej sekcji GO — mały source-code patch, odizolowana gałąź od przypiętego release baseline, test-first, draft PR, bezpieczne lokalne testy; rozdzielona niezależna weryfikacja A60. **NIE WOLNO:** merge/cherry-pick do release/main, produkcja, Replit, staging/live, migracje/DDL, mutujące testy shared DB, ręczne płatne CI bez zgody właściciela/HQ, ujawnianie sekretów.
4. **Limit 3 aktywnych implementacji:** L1 A100/T080-S1A, L2 A80/T050-RR, L3 A110/T110-UX042. Pozostali tylko QA, testy, source-only projekt, dokumentacja. Przekazanie slotu po skończeniu jednego patcha wymaga nowego jednoznacznego GO 00; nie dołączaj kolejnego obszaru automatycznie.
5. **Własność konfliktów:** A70 zamraża edycję routes/tournaments.ts i revert-match.ts na czas R10; A100 otrzymuje wyłączną własność routes/tournaments.ts w swojej wąskiej poprawce, A80 wyłączną własność revert-match.ts w swojej. A70 utrzymuje PR42 wyłącznie w review; jeśli A60 wykryje krytyczny defekt PR42 wymagający zmian w routes/tournaments.ts, A00 rozstrzyga kolejność i wstrzymuje A100 przed równoczesną edycją. A90 zachowuje backup-v3.ts w trybie review, A110 pracuje nad oddzielnym frontendem.
6. **POLICY OPEN:** nie wybieraj samodzielnie terminal Swiss deny/reopen, SE currentRound, Swiss BYE/rematches, DE 2–N, Basket CAS 409/412/token, Backup portable revisions/legacy semantics, Cancel expectedRevision/Host, Steam 403/503, auth TTL/token migration. R10 implementuje tylko niezmienniki bez zmiany niezatwierdzonej polityki.
7. **Tylko WEB-004 HANDOFF R2:** WEB-004 zakończył bieżący audyt, nie żądamy dodatkowych raportów. **SWARM-006 pozostaje HOLD aż do formalnego zakończenia całego przyjętego backlogu WEB-005**; A10 utrzymuje wewnętrzny bufor P01+ i niczego nie wysyła do SWARM-006. SWARM-007 samodzielnie projektuje zasady i fizyczne foldery Google Drive; nie domniemaj synchronizacji.
8. **Testy fizyczne:** PostgreSQL 16 wyłącznie po potwierdzonym przez A50 preflight niezależnego, jednorazowego środowiska i wyraźnej autoryzacji, z jawnie testowym URL i schematem tm_test_*. Brak środowiska = NOT_EXECUTED/BLOCKED. Nigdy nie używaj produkcyjnego/shared DATABASE_URL ani produkcyjnych backupów.
9. **Raporty:** każdy agent przygotowuje WEB-005_Axx_R10_HANDOFF.md: TASK, HEAD/base/PR, dokładne zmiany, realne test commands + exit code (lub NOT_EXECUTED), status niezależnego QA, policy/lock, zależności, następny krok. Do 00 trafia raport, nie reklama sukcesu. Nie twórz kolejnych równoległych „centralnych promptów”.
10. Dla całego roju **NO-GO** do release; A00 raportuje zakończenie samej fali, nie deklaruje całego projektu zakończonym bez pokrycia zadaniami, testami i podpisanymi wyjątkami.

## §1 — Snapshot bieżących PR / exact SHA (potwierdzone GitHub 2026-10-14)

| Paket | PR | SHA | Stan i ważny blocker |
|---|---|---|---|
| P01 | #35 | 7cb283aa82273a1e22daf9051a82311eef53760c | Pack19, scoped CI PASS, full release nie |
| P02 | #36 | 85ad0b86136fc3491c9ef18663d9b01396179349 | Pack20–26, rzeczywiste full tests niepotwierdzone |
| P03 | #34 | fae2eea2f22df3f1b02ad035a7db00bc411ea73f | Steam write auth, HTTP/PG pending |
| P04 | #37 | fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7 | proxy trust, HTTP negative pending |
| P05 | #38 | 2d36864f4d2f1c838073f387fd3c8efb3378c43b | ledger validator offline only; real SQL not authorized |
| P06 | #39 | 16053ee132756ca05b6f2cd1f0cabae823905387 | Cancel/Restore MP1, PostgreSQL/React parity pending |
| P07 | #40 | 9a8287271299a59fc9291b8d253299a8d109a35d | Pack17, scoped synthetic contracts only, --full pending |
| P08 | #41 | e847cb705296a48ab5c68ece96776cd0e0bbb417 | Backup V3 B1 fail-closed, PG16 tests NOT_EXECUTED |
| P09 | #42 | 1ae0ccb801f4177052bff1ec7041e55b8c992c8b | Global Undo LIFO MP2A, PG16 tests NOT_EXECUTED |

Wszystkie P01–P09 są aktualnie OPEN DRAFT i nie zostały scalone. PR #33 Steam alternative pozostaje konkurencyjny i HOLD. PR #32 release→main nadal nierozwiązany. **Baseline source:** release/tournament-ops-20261013-01 @ 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7; main @ c50cc48e6fa508592bda3f4838111e9cff5af80c.

## §2 — R10 ownership / execution lanes

| Agent | Zadanie | Uprawnienia |
|---|---|---|
| A00 | Fala, uzgodnienie plików/polityk, DoD, backlog | KOORDYNACJA |
| A10 | Manifest P01–P09+ / final-only handoff buffer | DOCS/READ-ONLY |
| A20 | T021 migracje / P05 / PG readiness policy | READ-ONLY |
| A30 | PR34/37 security QA + konsultacja S1 | READ-ONLY |
| A40 | PR40 Pack17 evidence / full gate | READ-ONLY |
| A50 | Real isolated test executions P01–P09 + new PRs | TEST ONLY (safe preflight) |
| A60 | niezależny odbiór exact-SHA wszystkich paczek | STRICT READ-ONLY |
| A70 | PR42 MP2A QA support + MP2B direct Revert CAS design | SOURCE-ONLY |
| A80 | T050-RR terminal Round Robin multi-stage reopen | **GO CODE-ONLY L2** |
| A90 | PR41 B1 QA support, B2/B3 follow-up design | SOURCE-ONLY |
| A100 | T080-S1A post-lock organizer revocation + bans/game-picks | **GO CODE-ONLY L1**, exclusive file |
| A110 | T110-UX042 FileReader identity safety only | **GO CODE-ONLY L3** |
| A120 | T100-DE Details/bracket/labels/overlay future small PR | SOURCE-ONLY |

## AGENT A00 — R10 Implementation Lead

**TASK:** WEB-005-T000-A00-R10 | MODE: COORDINATION.

1. Odbierz i zinwentaryzuj R9 (P08 PR41, P09 PR42, A100 HOLD, A110/A120 designs), aktualizując task→finding→agent→PR SHA→QA→status i weryfikując otwarte P01–P09.
2. Poinformuj A70, że w R10 NIE ma nowego code-lane; po zamrożeniu PR42 plik routes/tournaments.ts można wyłącznie przypisać A100; revert-match.ts A80. Konflikty rozstrzygaj przed zmianami.
3. **GO SOURCE-CODE ONLY** przyznaj A100/S1A, A80/T050-RR i A110/UX042 zgodnie z ich sekcjami. Nie zwiększaj limitu 3. W przypadku realnego konfliktu zamiast niekontrolowanych równoległych editów HOLD odpowiedni lane.
4. Priorytetyzuj rzeczywiste testy A50 oraz niezależne A60 review PR41/42 (przed orzekaniem o sukcesie).
5. Ustal brakujące product policy za zgodą owner/HQ, zwłaszcza Basket CAS, Backup revision/legacy, terminal Swiss, direct Revert CAS, Steam 403/503; wprowadź je do rejestru POLICY_OPEN jeśli nie zatwierdzone.
6. Zamykaj tylko faktycznie wykonane taski; zachowaj final-only SWARM-006 handoff i brak nowych zadań WEB-004.
7. Przygotuj po R10 plan dla kolejnej fali (preferuj B2, MP2B, T055, T100) w zależności od QA, polityki i zwolnionych slotów.

**DELIVERABLE:** WEB-005_A00_R10_COORDINATION_REPORT.md, BACKLOG+DECISIONS update, next-wave queue. STOP merge, deploy, SWARM-006 activation.

## AGENT A10 — Internal Package Registry P01–P09+

**TASK:** WEB-005-T018-A10-R5 | MODE: READ-ONLY/DOCS.

1. Zachowaj i rozszerz istniejący R9 internal manifest, checksum matrix i ancestry zamiast budować je od początku.
2. Dodaj **P08=PR41** Backup V3 B1 HEAD e847cb705296a48ab5c68ece96776cd0e0bbb417 i **P09=PR42** MP2A HEAD 1ae0ccb801f4177052bff1ec7041e55b8c992c8b, po ponownym odczycie aktualnych HEAD; uwzględnij różnicę patch commit / report commit.
3. Sprawdź rzeczywiste changed files/hash/merge-base, zależności P06↔P09, Backup P08↔schema ledger P05, security P03/P04, Pack17 P07.
4. Dla R10 nowych PR utwórz P10+ dopiero po ich realnym pojawieniu się; bez zmyślonych commitów, checksumów i QA.
5. Rozdziel SOURCE_READY, SOURCE_ACCEPTED, QA_ACCEPTED i RUNTIME_VERIFIED na podstawie A50/A60, bez przypisywania własnego approval.
6. Wymagania SWARM-007: metadane plików/wersji/agentów/potwierdzenia odbioru, bez zakładania istniejących folderów i przesyłek.
7. Finalny pakiet dla SWARM-006 pozostaje **INTERNAL_BUFFER / NOT_DISPATCHED** do formalnego zamknięcia całego WEB-005.

**DELIVERABLE:** WEB-005_A10_R10_INTERNAL_MANIFEST.md + P01–P09+ source/QA/dependency matrix. STOP cross-swarm dispatch.

## AGENT A20 — Migration Validator / Ledger Guard

**TASK:** WEB-005-T021-A20-R5 | MODE: READ-ONLY/QA SUPPORT.

1. Zweryfikuj P05 PR38 HEAD i aktualne manifest pin, 0030/0031 release/editor/correction, ewentualny drift. Nie przepisuj walidatora.
2. Wykorzystaj R9 autorskie synthetic test evidence i fail-closed tests 37/37 + uzupełnienia (o ile raport i komendy potwierdzone). Nie deklaruj realnego PG16 PASS.
3. Przygotuj A50 minimalną, bezpieczną specyfikację weryfikacji katalogu PG16 i możliwości środowiska testowego bez SQL migration GO.
4. Zdefiniuj dla A90/P08 B1 tylko schematowe zależności/import lookup. Nie przejmuj Backup code.
5. Przekaż A60 P05 negative/fail-closed matrix, A10 status manifestu i A00 otwarte decyzje o historycznych ledgerach.
6. **Zero SQL DDL/adoption/real migration** bez dodatkowej decyzji.

**DELIVERABLE:** WEB-005_A20_R10_LEDGER_GATE.md, status REVIEW_ONLY/STOP.

## AGENT A30 — Security Review + S1 Consultation

**TASK:** WEB-005-T030-T031-A30-R8 | MODE: READ-ONLY.

1. Zamknij nieduplikowany source review P03 Steam PR34 i P04 proxy PR37: trzy mutacje, brak DB/upstream on reject, XFF spoof/CIDRs, lockfile.
2. Przygotuj niezależne negatywne scenariusze dla A50, a A60 niezależny kontrakt; rozróżnij realne HTTP od autorowego source-only smoke.
3. Skonsultuj A100 S1A: organizer token old-version recheck pod lockiem, support revocation, bans/game-picks writes.
4. Nie wdrażaj TTL, token-hash migration, password rotation, ani nie zmieniaj 403/503 bez właściciela.
5. Jeśli A100 dotknie potencjalnie Steam/proxy plików, zgłoś konflikt 00; nie edytuj tych plików.
6. Wypisz krótko pozostałe security findings po S1A (delete tournament, routes/auth, controlled correction) jako future backlog, bez automatycznego code GO.

**DELIVERABLE:** WEB-005_A30_R10_SECURITY_ACCEPTANCE.md. STOP source coding.

## AGENT A40 — Pack17 PR40 Final Source Evidence

**TASK:** WEB-005-T017-A40-R5 | MODE: READ-ONLY/QA SUPPORT.

1. Zweryfikuj P07 PR40 HEAD 9a8287271299a59fc9291b8d253299a8d109a35d oraz wszystkie trzy file changes.
2. Oddziel 24/24 wykonanych synthetic contract/unit tests od prawdziwego Pack17 --full wymagającego PG16/API/frontend.
3. Przygotuj A50 preflight/TAP/skip/todo/zero tests, omitted gates, missing DB/env test commands i expected fail-closed status.
4. Po testach A50/werdykcie A60 naprawa wyłącznie potwierdzonego defektu przez osobne GO 00, bez tworzenia nowego ci-patcha.
5. Powiadom A10 o realnym statusie P07.

**DELIVERABLE:** WEB-005_A40_R10_PACK17_QA.md. STOP paid CI/merge/production.

## AGENT A50 — Reproducible Real-Execution and Database Isolation

**TASK:** WEB-005-T133-A50-R5 | MODE: TEST EXECUTION AFTER PREFLIGHT.

1. Nie odtwarzaj runnera R8/R9 od początku; wykorzystaj dotychczasowe harness evidence (50/50 harness nie świadczy o PASS aplikacji).
2. Na dokładnym SHA per PR wykonaj, jeśli środowisko pozwala, Node22/pnpm10 frozen install, API/React typecheck/build, Pack19–26, Pack17 --full, Steam/Proxy HTTP oraz PR38 validator.
3. **P08 PR41:** 12 corrupt-backup fixtures + intact positive, HTTP 400/no clone, route parity, rollback; **P09 PR42:** two deterministic queued undo LIFO races with pg_blocking_pids, 409/no-write; **P06 PR39:** Cancel/Restore/correct generated-client parity.
4. Warunek PG: fizyczny, jednorazowy PostgreSQL16, jawny TEST_DATABASE_URL/test db, schema tm_test_*, explicit reset consent, zero dostępu do shared/prod; przy braku lub niepewności -> BLOCKED, nie prowizoryczny test.
5. Dla nowych patchy A100/A80/A110 przygotuj per-branch targeted tests i negatywne fixture. Zapisuj exit code, TAP, dokładny HEAD, liczbę testów, Node/PG, timezone i logi bez sekretów.
6. Przekaż dowody A60; odróżniaj HARNESS/SYNTHETIC from ACTUAL APPLICATION TESTS. Nie uruchamiaj płatnego CI bez autoryzacji.

**DELIVERABLE:** WEB-005_A50_R10_REAL_TEST_MATRIX.md + ewidencja wyników. STOP fake PASS.

## AGENT A60 — Independent QA

**TASK:** WEB-005-T130-A60-R10 | MODE: STRICT READ-ONLY INDEPENDENT QA.

1. Recheck PR #34–42 current heads; odczytaj poprzednie R9 source review dla P01–P07; brak GitHub review submission nie unieważnia źródłowej oceny reportowej, ale nie utożsamiaj source review z release acceptance.
2. **Nowe priorytety: PR41/P08 Backup B1**: walidator QP/QPE/OP/route integrity, poprawne legacy positive, zero cloned rows on reject; **PR42/P09 Undo MP2A**: global LIFO under lock, atomic same transaction, stale X 409, Y preserved, brak regresji legal Undo.
3. Dla PR39 i PR40 zachowaj API generated-client/PG16 oraz Pack17 full execution jako obowiązkowe blokady.
4. Przygotuj lub wykonaj niezależną review przyszłych nowych PR A100 S1A, A80 RR, A110 FileReader (na exact HEAD, po ich utworzeniu).
5. Utrzymuj mapping 38 przypadków WEB-004 R2, bez podmieniania historycznych wyników na 29-case draft ani sugerowania zamknięcia wynikiem source-only.
6. Uporządkuj statusy SOURCE_CONFIRMED/PATCH_PROPOSED/SOURCE_ACCEPTED/RUNTIME_VERIFIED/FAIL/BLOCKED/NOT_EXECUTED/POLICY_OPEN. 
7. Do 00 raportuj co można zamknąć jako zakończony patch (nie produkcyjnie), co nadal zablokowane testem/polityką, czego nie wolno wciągać do integracji.
8. ZERO zmian kodu, ZERO samocertyfikacji i deploy.

**DELIVERABLE:** WEB-005_A60_R10_INDEPENDENT_QA.md + P01–P09+ matrix.

## AGENT A70 — PR42 QA Support and MP2B Source-Only Design

**TASK:** WEB-005-T040-A70-R7 | MODE: SOURCE-ONLY / MP2B DESIGN, NO CODE.

1. Zamroź PR #42 MP2A i przekaż A50/A60 precyzyjne testy, status 9/9 statycznych asercji autora kontra realny PG16 NOT_EXECUTED.
2. Recheck PR #39 MP1, #42 MP2A, #7/#27 historyczne source-only zależności; niczego nie cherry-pick.
3. Przygotuj **MP2B direct POST revert CAS** test-first: expectedMatchRevision i expectedCompletionActionId pod lockiem, ABA/stale 409 + zero-write, invalid body 422; przeanalizuj wpływ na istniejących klientów i OpenAPI/Zod/React/Host, POLICY-CANCEL/Undo.
4. Ustal z A00 ekskluzywne oddanie routes/tournaments.ts A100 i revert-match.ts A80 **na R10**; nie zmieniaj tych plików w tej fali. W razie realnego defektu PR42 zgłoś A00 i wstrzymaj kolidujący patch.
5. Nie implementuj MP2B ani MP3 bez nowego GO, nie modyfikuj PR39 ani PR42 podczas cudzej edycji wspólnych plików.

**DELIVERABLE:** WEB-005_A70_R10_MP2B_SOURCE_CONTRACT.md, PR42 QA handoff. STOP code writes.

## AGENT A80 — T050 Multi-Stage RR Reopen Fix (CODE LANE 2)

**TASK:** WEB-005-T050-A80-R3-RR | PRIORITY: P1 integrity | MODE: **GO SOURCE-CODE ONLY**.

**Narrow scope:** A52-F019: cofnięcie końcowego meczu Round Robin w wieloetapowym turnieju nie może reaktywować graczy wyeliminowanych we wcześniejszych etapach, którzy nie należą do cofanej fazy. **Nie** wdrażaj nowej polityki terminal Swiss, SE currentRound, Swiss pairing ani DE placement w tym PR.

1. Zweryfikuj release baseline, istniejące full lifecycle tests, swój R9 fixture RR8→4→RR4; dowód source gap vs runtime NOT_EXECUTED.
2. Test-first zbuduj izolowany scenariusz R1 SE/Swiss: P5–P8 eliminated; terminal RR4 reopen only current eligible participants; snapshot wszystkich players/status, stage participants, winnerId, result_history i tournament state.
3. Zaimplementuj minimalną zmianę w revert-match.ts lub właściwym serwisie, aby nie aktualizować wszystkich graczy turnieju; zachowaj poprawne jednometapowe RR, kwalifikacje oraz blokady rozpoczętego next stage.
4. Utwórz osobną gałąź z release HEAD, mały diff i draft PR; nie edytuj PR #42 ani #39.
5. Własność revert-match.ts na R10 jest przyznana A80 **po zamrożeniu A70**; jeśli istnieją nowe zmiany A70 na tej samej ścieżce, HOLD i zgłoś 00.
6. Testy PostgreSQL16 wyłącznie w zatwierdzonej izolacji; inaczej NOT_EXECUTED; oddaj A50/A60 dokładne fixture/komendy.
7. Terminal Swiss, SE pointer, Swiss/DE policies i przyszłe T051 pozostają SOURCE-ONLY poza niniejszą zmianą.

**DELIVERABLE:** WEB-005_A80_R10_T050_RR_PATCH.md + draft PR HEAD + test status. STOP rozszerzanie sportowej polityki.

## AGENT A90 — PR41 Backup B1 Review / B2-B3 Next Patch Planning

**TASK:** WEB-005-T060-A90-R3 | MODE: SOURCE-ONLY / QA SUPPORT.

1. Recheck P08 PR #41 exact HEAD e847cb705296a48ab5c68ece96776cd0e0bbb417; zachowaj oddzielność patch commit i report commit.
2. Dokończ A50/A60 handoff: 12 corrupted backups, pozytywny approved route, zero clone rows and typed rollback if mapping fails; nie podnoś statusu bez uruchomienia PG16.
3. Podziel następny zakres: B2 match/result_history/undoPayload ownership, portable revision policy; B3 consistent repeatable-read MVCC export + V2/V3 legacy compatibility.
4. Zaprojektuj test-first dwa odrębne małe przyszłe PR, preferuj źródłowo potwierdzone invarianty bez arbitralnego odrzucania legalnych historycznych backupów. Wskaż potrzebne decyzje owner/HQ POLICY-BACKUP.
5. Skonsultuj A20 migration ledger/T040 history; nie wykonuj SQL, nie edytuj backup-v3.ts równocześnie z jakimkolwiek krytycznym review bez zgody 00.
6. Przekaż A10 status P08, A00 kolejność B2/B3, A60 test expectations.

**DELIVERABLE:** WEB-005_A90_R10_B1_QA_B2_B3_PLAN.md. STOP nowej implementacji B2/B3 bez GO.

## AGENT A100 — T080-S1A Organizer/Support Revocation Under Lock (CODE LANE 1)

**TASK:** WEB-005-T080-A100-S1A-R3 | PRIORITY: P1 security | MODE: **GO SOURCE-CODE ONLY**.

**Ownership resolution:** A70 zakończył R9 source patch PR #42, który zmienia routes/tournaments.ts; na **R10 A70 nie edytuje tego pliku**, a A100 otrzymuje wyłączny code-lane dla nowej gałęzi źródłowej. **Nie** merge PR42 ani nie edytuj jego gałęzi. Jeśli A70/A60 potrzebuje pilnego fixu na tej samej ścieżce, HOLD i eskaluj 00.

1. Odczytaj własny R9 plan na gałęzi docs/web-005/a100-r9-t080-s1-hold, bez ponownego szerokiego audytu.
2. Wąskie S1A: centralny post-lock organizer credential version recheck w existing access-policy helper, preserve support session lock+version; zabezpiecz PUT player bans i PUT match game-picks tak, aby pre-auth → wait for tournament lock → token revocation → write kończyło się fail-closed i **zero writes**.
3. Dodaj kontrolowane deterministic PostgreSQL16 race tests dla organizer i support z lock barriers; legalny aktywny token nadal wykonuje uprawnioną operację, viewer/anonymous odrzucone.
4. Zachowaj istniejący token wire format, sesje, TTL, password rotation i politykę kodów API, bez raw token logging. Nie implementuj osobno DELETE tournament, routes/auth password changes ani controlled correction w ramach S1A — wypisz je jako S1B+ backlog do późniejszych małych PR.
5. Utwórz izolowaną gałąź release baseline; minimalny source patch i draft PR z testami. Nie kopiuj PR #42 do własnej gałęzi ani nie rozwiązuj konfliktów integracyjnych za SWARM-006.
6. Zapisz exact HEAD, test commands, zero-write evidence lub NOT_EXECUTED, przypisz security review A30, runtime A50, independent A60.
7. Ograniczenie: jeżeli bezpieczna implementacja wymaga nowej niezatwierdzonej semantyki, zatrzymaj tę gałąź i zgłoś konkretny policy decision.

**DELIVERABLE:** WEB-005_A100_R10_T080_S1A_PATCH.md + draft PR if safe. STOP nieautoryzowane rozszerzenie S1B/S2.

## AGENT A110 — T110 UX-042 Late FileReader Cross-Tournament (CODE LANE 3)

**TASK:** WEB-005-T110-A110-UX042-R3 | PRIORITY: P1 | MODE: **GO SOURCE-CODE ONLY**.

**Narrow scope:** źródłowo potwierdzony brak identyfikatora/epoch guard na opóźnionym FileReader w TournamentDetail CSV; nie twierdź, że A→B był runtime-confirmed. Nie implementuj T055 Basket CAS (POLICY-BASKET nadal OPEN) ani pozostałych UX-044/045/046 w tym PR.

1. Reuse R9 A110 acceptance JSON, zwłaszcza FE-CSV-01–04 i source file tournament-detail.tsx.
2. Test-first: rozpocznij FileReader CSV w turnieju A, przejdź do B w tej samej instancji komponentu, odbierz spóźnione A.onload/onerror; oczekuj zero mutacji B i brak preview/error A w B. Dodaj nowy B file selection i modal-close stale callback.
3. Minimalny guard identity/epoch / cleanup invalidates pending read, bez zmiany istniejącego CSV parsera, route loadera ani ogólnej nawigacji.
4. Pracuj wyłącznie w izolowanej gałęzi release baseline, React/RTL testy + draft PR. Brak source patch Baskets/Host/Backup.
5. Wykonaj realne RTL/typecheck w dostępnej izolacji; inaczej NOT_EXECUTED; przekaż A50 i A60 komendy i exact SHA.
6. Odnotuj pozostałe T055 / T110 UX044/045/046 jako przyszły backlog, z policy open i obowiązującą korektą: backup import tworzy nowy turniej, zwykły StageBasketsPanel A→B nie jest potwierdzonym zagrożeniem.

**DELIVERABLE:** WEB-005_A110_R10_T110_UX042_PATCH.md + draft PR if safe. STOP 4. lane rozszerzeń.

## AGENT A120 — T100 Presentation Candidate PR-A (SOURCE-ONLY)

**TASK:** WEB-005-T100-A120-R3 | MODE: SOURCE-ONLY / PATCH-READY QA CONTRACT.

1. Kontynuuj R9 plan i fixture, nie zaczynaj kolejnego ogólnego audytu. Zostaw T100 F054 jako retest existing PR32 (no duplicate).
2. Dla przyszłego minimalnego PR-A: F052 DE Details uses dedicated DE API, F053 canonical format names, F055 completed-first tournament audience overlay; rozdziel je od zależnego od lifecycle F058 RR standings polling (PR-B później).
3. Doprecyzuj 10 RTL + 4 browser scenariusze z izolowanymi fixture i file ownership stage-progress-view.tsx/tournament-bracket.tsx/tournament-audience.tsx; nie deklaruj runtime PASS bez wykonania.
4. Udokumentuj, które elementy można zakodować bez nowej polityki sportowej, a które czekają na A80/T050 i A70/T040.
5. Przygotuj dla 00 mały wyraźny wniosek GO dla następnego wolnego code-lane; **nie edytuj kodu w R10** bez osobnej decyzji.
6. Przekaż A50/A60 przejrzystą macierz expected/actual.

**DELIVERABLE:** WEB-005_A120_R10_T100_PR_A_READY.md. STOP redesign/frontend edits in R10.

## §3 — Formalny handoff i zamknięcie fali

Każdy agent zapisuje raport w istniejącej ścieżce repo/dostępnej przestrzeni projektowej, opisując precyzyjnie: agent, zadanie, datę, base SHA, current HEAD, PR/diff, faktyczne komendy i exit code lub NOT_EXECUTED, QA source vs runtime, politykę, konflikty, pozostałe ryzyka i następny krok.

A00 zbiera raporty, sprawdza niezależnie PR-y i może zaplanować R11 w **nowym jednym centralnym dokumencie**. Nie uznaj ukończenia R10 za ukończenie WEB-005 bez pełnego rozliczenia BACKLOG i podpisanych decyzji. Ani A10, ani A00 nie aktywuje SWARM-006 przed końcowym formalnym handoffem WEB-005.

## §4 — Jedyny krótki prompt startowy dla wszystkich wątków

WEB-005 — START FALI R10

Otwórz centralny dokument:
https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R10_AGENT_PROMPTS.md

Odczytaj §0–§2. Rozpoznaj swój identyfikator Axx zgodnie z przypisaną wcześniej rolą wątku. Otwórz i wykonaj wyłącznie sekcję AGENT Axx dla swojego wątku. Zweryfikuj obecne SHA i aktualny stan GitHub, zachowaj własność plików i ograniczenia GO/STOP. Przygotuj artefakty i raport R10 dla koordynatora 00. Nie przejmuj zadań innych agentów. Nie uruchamiaj SWARM-006.
