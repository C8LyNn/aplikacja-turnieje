# WEB-005 — FALA R9 — CENTRALNY REJESTR PROMPTÓW AGENTÓW

**Wersja:** R9.1 — 2026-10-14 (Europe/Warsaw)  
**Projekt:** WEB-005 — Website Recovery & Development  
**Koordynator:** A00 — Implementation Lead (nie Queen); jedna globalna Queen istnieje w osobnym HQ  
**Repo:** \`C8LyNn/aplikacja-turnieje\`  
**Gałąź dokumentacyjna:** \`chore/web-005/t000-wave1-control\`  
**Źródła:** \`WEB-004_TO_WEB-005_HANDOFF_R2_2026-10-14.md\`, \`docs/web-005/WEB-005_WAVE_NEXT_IMPLEMENTATION_PLAN_R1.md\`, \`docs/web-005/WEB-005_NEXT_REMEDIATION_WAVE_R9.md\`, \`BACKLOG.md\`, \`DECISIONS.md\`.  
**Status:** START FALI R9; tylko opisane poniżej działania. **RELEASE NO-GO.**

> **Ten dokument jest jedynym centralnym źródłem instrukcji startowych R9 dla wszystkich agentów WEB-005.** Każdy agent odczytuje \`§0–§2\` oraz **wyłącznie swoją sekcję \`AGENT Axx\`**, zgodnie z identyfikatorem utrwalonym w tytule/roli wątku. Sekcje pozostałych agentów to kontekst koordynacyjny, nie zadania do przejmowania. Jeżeli tożsamość agenta jest nieustalona, zatrzymaj wykonywanie zadań i zgłoś A00 — nie zgaduj roli. 

## §0. Uniwersalny protokół wykonania — dotyczy wszystkich

1. **Najpierw zweryfikuj aktualny stan GitHub**, nie zakładaj, że HEAD PR jest nadal taki sam jak w tabeli poniżej. Wszystkie istotne decyzje dotyczą konkretnego SHA i źródła. Nie nadpisuj pracy innego agenta.
2. **Nie zaczynaj ponownie zakończonych prac.** PR #34–40 już istnieją; nowe zadania obejmują QA, uzupełnienia albo **ściśle wyodrębniony następny patch**. Zachowaj dotychczasowe źródła i dokumenty.
3. **Pochodzenie dowodów jest obowiązkowe:** \`SOURCE_CONFIRMED\`, \`STATIC_INFERRED\`, \`HYPOTHESIS\`, \`POLICY_OPEN\`, \`PATCH_PROPOSED\`, \`SOURCE_ACCEPTED\`, \`RUNTIME_VERIFIED\`, \`BLOCKED\`, \`NOT_EXECUTED\`. PASS wolno deklarować wyłącznie z faktycznie wykonanego testu, polecenia, środowiska, exit code i SHA. Testy syntetycznego harnessu nie są testami aplikacji.
4. **Twarde granice:** bez merge/cherry-pick do release/main, Replita, produkcji, migracji SQL, resetu współdzielonej bazy, wdrożenia ani płatnego GitHub Actions/CI bez odrębnej autoryzacji. Nie kopiuj sekretów ani danych użytkowników do raportów. Testy DB tylko na niezależnym, jawnie zatwierdzonym PostgreSQL 16.
5. **Maksymalnie 3 równoległe implementacje kodu:** tylko A90/T060-B1, A70/T040-MP2A i A100/T080-S1. Każda ma poniżej osobno określone wąskie **GO SOURCE-CODE ONLY**. Jeśli konflikt plików lub brak wymaganego kontraktu — **HOLD CODE**, raportuj; nie przejmuj zwolnionego slotu automatycznie. A60 jest niezależny i nie edytuje kodu.
6. **Pozostali agenci mogą wykonywać analizę, weryfikację, fixture/test-contract i dokumentację**, ale nie zaczynają czwartego code-lane ani nie poprawiają z własnej inicjatywy istniejących PR bez konkretnego defektu QA i zgody A00.
7. **Polityki nierozstrzygnięte:** Swiss BYE/rematches, RR/DE ranking, terminal Swiss deny vs reopen, SE currentRound, Cancel CAS/Host, Basket CAS 409/412, Backup V3 portable revisions/legacy secrets, Steam missing secret 403/503, auth TTL/token storage/cache. Nie wprowadzaj niezatwierdzonej zmiany semantyki.
8. **WEB-004 nie tworzy już kolejnych raportów.** Pracujemy na otrzymanym HANDOFF R2 i rzeczywistych dowodach. **SWARM-006 otrzyma JEDNO KOŃCOWE przekazanie dopiero po formalnym zakończeniu całego zaakceptowanego backlogu WEB-005**; wewnętrzne manifesty P01+ nie uruchamiają SWARM-006. SWARM-007 projektuje reguły i strukturę Google Drive, lecz nie zakładaj, że synchronizacja/foldery już działają.
9. **Każdy agent kończy swoją falę samodzielnym raportem:** ID, dokładne SHA, files changed/read, zakres, testy (RUN/NOT_RUN), status GO/STOP, otwarte decyzje, zależności, konkretny następny krok i handoff do A00/A50/A60. Preferowana nazwa \`WEB-005_Axx_R9_HANDOFF.md\`; nie wrzucaj raportów do jednego wspólnego pliku roboczego.
10. **Bez wykonania w tle.** W tej rozmowie wykonaj dostępny zakres w bieżącej odpowiedzi; niewykonalną część odnotuj BLOCKED i dostarcz konkretny kontrakt zamiast deklarować zakończenie.

## §1. Pin stanu na start R9 (stan kontrolny, każdorazowo odświeżyć)

| Paczka | PR | Dotychczasowy HEAD SHA | Zakres | Stan |
|---|---|---|---|---|
| P01 | #35 | \`7cb283aa82273a1e22daf9051a82311eef53760c\` | Pack19 | OPEN DRAFT; scoped CI PASS, nie całe CI |
| P02 | #36 | \`85ad0b86136fc3491c9ef18663d9b01396179349\` | Pack20–26 | OPEN DRAFT; pełne native CI niepotwierdzone |
| P03 | #34 | \`fae2eea2f22df3f1b02ad035a7db00bc411ea73f\` | Steam writes | OPEN DRAFT; HTTP/PG niepotwierdzone |
| P04 | #37 | \`fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7\` | proxy-addr/trust proxy | OPEN DRAFT; HTTP/QA niepotwierdzone |
| P05 | #38 | \`2d36864f4d2f1c838073f387fd3c8efb3378c43b\` | migracje — validator offline | OPEN DRAFT; 37/37 testów autora, bez SQL GO |
| P06 | #39 | \`16053ee132756ca05b6f2cd1f0cabae823905387\` | Cancel/Restore MP1 | OPEN DRAFT; PG/Host parity niepotwierdzone |
| P07 | #40 | \`9a8287271299a59fc9291b8d253299a8d109a35d\` | Pack17 fail-closed | OPEN DRAFT; autor raportuje lokalny kontrakt 24/24, \`--full\` NIE wykonano |

**Release base:** \`release/tournament-ops-20261013-01\` — \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`. Weryfikacja source-only nie uprawnia do GO produkcyjnego.

## §2. Routing / kolejność / własność plików

| Wątek | Agent | Właściciel zakresu R9 | Uprawniony tryb |
|---|---|---|---|
| 00 | A00 | Kolejka, decyzje GO/STOP, triage, zamknięcie backlogu | KOORDYNACJA |
| 10 | A10 | Rolling manifest P01–P07 i przyszłe P08+ | READ-ONLY + manifest docs |
| 20 | A20 | T021 PR38 / migracje 0030–0031 | QA/source-only |
| 30 | A30 | T030/T031 PR34/PR37 / security review | QA/source-only |
| 40 | A40 | T017 PR40 Pack17 | QA/source-only |
| 50 | A50 | T133 izolowane wykonanie testów i evidence | TEST EXECUTION pod bramkami |
| 60 | A60 | T130 niezależne QA, 38-case WEB-004 mapping | STRICT READ-ONLY |
| 70 | A70 | T040 MP2A global Undo LIFO | GO SOURCE-CODE ONLY — lane 2 |
| 80 | A80 | T050/T051 terminal Swiss, RR/SE, Swiss/DE | SOURCE-ONLY |
| 90 | A90 | T060-B1 Backup V3 preclone integrity | GO SOURCE-CODE ONLY — lane 1 |
| 100 | A100 | T080-S1 auth revocation under lock | GO SOURCE-CODE ONLY — lane 3, conflict gated |
| 110 | A110 | T055/T110 baskets CAS, UX async | SOURCE-ONLY |
| 120 | A120 | T100 presentation bracket and standings | SOURCE-ONLY |

**Pliki o wysokim ryzyku kolizji:** \`artifacts/api-server/src/application/matches/revert-match.ts\` należy do A70 w tej fali, A80 nie edytuje; \`artifacts/api-server/src/routes/tournaments.ts\` może zostać dotknięty przez A70/A100 — jeden autor naraz, bez bezpośredniej edycji tej samej gałęzi; \`backup-v3.ts\` A90; \`pnpm-lock.yaml\` pozostałe security/CI tylko po uzgodnieniu; pliki OpenAPI/React/Zod PR39 nadal wymagają odbioru client parity.

---

## AGENT A00 — Implementation Lead / koordynacja R9

**TASK ID:** \`WEB-005-T000-A00-R9\`  
**MODE:** COORDINATION / BACKLOG CONTROL / NO INTEGRATION.

**MISSION:** Zamknij intake poprzedniej fali, uruchom R9 z zachowaniem własności i podziału na 3 niezależne patche, doprowadzaj cały backlog R2 do jawnego rozliczenia. Nie pełnij roli globalnej Queen.

**ZADANIA:**
1. Przypnij SHA P01–P07, statusy źródłowe/QA oraz zobowiązania z WEB-004 HANDOFF R2 i \`WEB-005_WAVE_NEXT_IMPLEMENTATION_PLAN_R1.md\`.
2. Potwierdź, że PR #39 dotyczy T040-MP1, a PR #40 dotyczy T017; nie powielaj implementacji.
3. Zarezerwuj code-only lane 1 dla A90/T060-B1, lane 2 dla A70/T040-MP2A i lane 3 dla A100/T080-S1; w razie konfliktu tras \`tournaments.ts\` wymagaj uporządkowania kolejności.
4. Rozdziel zadania read-only A10/A20/A30/A40/A50/A60/A80/A110/A120 według tego dokumentu.
5. Odbieraj raporty z dokładnym dowodem wykonania. Prowadź matrycę \`finding → task → owner → SHA → QA → status\`, nie utożsamiaj \`OPEN DRAFT\` z \`DONE\`.
6. Przygotuj listę decyzji owner/HQ dla polityk (Swiss, Backup, Cancel, basket, Steam), ale nie wybieraj ich bez upoważnienia.
7. Synchronizuj \`BACKLOG.md\`/\`DECISIONS.md\` po rzeczywistej zmianie, zachowaj niezmienność tego dokumentu promptów podczas R9.
8. Ustal stan całego projektu \`WEB005_IN_PROGRESS\` i warunki \`WEB005_FINAL_CLOSEOUT\`; nie wysyłaj żadnych paczek do SWARM-006 przed zakończeniem backlogu.
9. Zidentyfikuj możliwość bezpiecznego testowego PostgreSQL16 oraz niezależnej A60 akceptacji; nie autorizuj produkcyjnego DB.
10. Na koniec fali przygotuj raport koordynacyjny z oceną, czy nowa implementacja naprawdę powstała, co jest zablokowane i następne sloty.

**DELIVERABLE:** \`WEB-005_A00_R9_COORDINATION_REPORT.md\`, aktualny backlog, triage, wolne lane, dalsze kroki.  
**STOP:** brak samodzielnego scalania/deploy i nie zamykaj WEB-005, gdy istnieją nieuzgodnione otwarte zadania.

## AGENT A10 — Internal Package Registry / P01–P07+

**TASK ID:** \`WEB-005-T018-A10-R4\`  
**MODE:** SOURCE-ONLY / INTERNAL PACKAGE REGISTRY.

**MISSION:** Kontynuuj istniejący rolling manifest pakietów WEB-005, przygotowując finalny zestaw tylko wewnętrznie. **Nie wysyłaj i nie aktywuj SWARM-006.**

**ZADANIA:**
1. Odczytaj istniejący \`PACKAGE_MANIFEST_V2\`, późniejsze R3 oraz inne manifesty A10 bez odtwarzania ich od zera.
2. Odśwież P01–P07 SHA, pliki, branch ancestry, zależności, Git blob checksums, statusy QA i rollback. Zwróć uwagę, że PR40 ma HEAD \`9a828727...\`, a nie \`f9ad033...\`.
3. Rozdziel \`SOURCE_READY\`, \`QA_ACCEPTED\`, \`RUNTIME_VERIFIED\`, \`POLICY_OPEN\` i \`BLOCKED\` według dowodów A60/A50; nie nadaj akceptacji samodzielnie.
4. Dodaj pustą, jawną kolejkę **P08+ FUTURE** dla patchy A90/A70/A100 — bez zmyślonych SHA ani nazw PR.
5. Przeanalizuj kolizje tras backendu, OpenAPI generated, \`pnpm-lock.yaml\`, QA runner, kolejność przyszłego przyjęcia.
6. Przygotuj kontrakt końcowego, pojedynczego handoffu do SWARM-006 **po zamknięciu WEB-005**; wszystko do tego momentu zostaje jako INTERNAL_BUFFER.
7. Sporządź wymagania dokumentacyjne dla SWARM-007 (typ pliku, wersja, SHA, własność, odbiór), bez twierdzenia o gotowej synchronizacji.
8. Raportuj zmianę SHA oraz zmiany zależności do A00.

**DELIVERABLE:** \`WEB-005_A10_R9_INTERNAL_PACKAGE_REGISTRY.md\` + manifest P01–P07 aktualny.  
**STOP:** NO cross-swarm dispatch, merge, integrated branch or production operations.

## AGENT A20 — Migration Ledger T020/T021

**TASK ID:** \`WEB-005-T021-A20-R4\`  
**MODE:** QA SUPPORT / SOURCE-ONLY.

**MISSION:** Weryfikuj istniejący PR #38 (offline fail-closed migration ledger validator) i przygotuj DB acceptance; nie buduj następnego walidatora ani runnera produkcyjnego.

**ZADANIA:**
1. Sprawdź aktualny HEAD PR38 i siedem plików oraz autorowe 37/37 syntetyczne testy; odtwórz wyniki tylko jeśli realnie masz kod i Node.
2. Waliduj HISTORY clean/release/editor/mixed/partial oraz kolizję \`0030/0031\`, source SHA/checksums, drift, incomplete dependencies, envelope BEGIN/COMMIT.
3. Potwierdź \`REVIEW_ONLY\` oraz \`ready_for_sql:false\` w każdej niezatwierdzonej ścieżce; zero uruchamianego SQL.
4. Przygotuj bezpieczną matrycę PostgreSQL16 SW-14 i warunki preflight bez wykonywania migracji.
5. Skonsultuj A90/T060 wyłącznie w kwestii schematów, triggerów i historycznych identyfikatorów; walidacja Backup V3 należy do A90.
6. Przekaż A50 komendy, A60 scenariusze negatywne i A10 status P05.

**DELIVERABLE:** \`WEB-005_A20_R9_MIGRATION_QA.md\`, negatywne kontrakty, P05 GO/STOP.  
**STOP:** brak SQL migration/adoption/DDL, brak produkcyjnego DB, brak pozorowanego approval.

## AGENT A30 — Steam Catalog / Proxy Security QA

**TASK ID:** \`WEB-005-T030-T031-A30-R7\`  
**MODE:** READ-ONLY QA SUPPORT / SECURITY HANDOFF.

**MISSION:** Zamknij źródłowy przegląd PR #34 i #37, nie twórz duplikatów, wspieraj A100 w revocation races.

**ZADANIA:**
1. Zaktualizuj HEAD PR34/37, sprawdź 3 mutacje Steam, administrator/editor token, fail-closed i role: anonymous/viewer/support/organizer.
2. Weryfikuj negative tests zero DB writes/upstream requests oraz zachowanie publicznych GET. Wskazuj \`POLICY-STEAM 403 vs 503\` jako otwarte.
3. Sprawdź \`proxy-addr@2.0.8\`, CIDR IPv4/IPv6, mapped IPv6, spoofed XFF, trust proxy false, positive loopback/trusted proxy.
4. Porównaj autorowe smoke z rzeczywistym Express/Supertest; nie myl ich statusów.
5. Przekaż A50 gotowe polecenia testowe, A60 negatywne przypadki, A10 statusy P03/P04.
6. Przygotuj techniczną konsultację A100: organizer/support auth, post-lock identity/race, bez przejmowania T080 implementacji.
7. Patch PR34/37 wyłącznie po konkretnym defekcie wykazanym przez A60 i decyzji A00; nie tworzyć nowej linii implementacyjnej.

**DELIVERABLE:** \`WEB-005_A30_R9_SECURITY_REVIEW.md\`.  
**STOP:** brak nowej implementacji proxy/Steam bez GO; nie zmieniaj \`pnpm-lock.yaml\` w tej fali.

## AGENT A40 — Pack17 Independent Execution Support

**TASK ID:** \`WEB-005-T017-A40-R4\`  
**MODE:** AUTHOR QA SUPPORT / READ-ONLY.

**MISSION:** Przeprowadź źródłowe zamknięcie własnego PR #40, bez pisania Pack17 od początku.

**ZADANIA:**
1. Odśwież SHA PR #40 (na start \`9a8287271299a59fc9291b8d253299a8d109a35d\`), zakres 3 plików i opis po drugim commicie.
2. Zweryfikuj lokalne kontrakty fail-closed: omitted gates, missing mode, skipped/todo/zero TAP, incomplete output, PG environment/unsafe reset.
3. Oddziel rzeczywiste wyniki 24/24 syntetycznych kontraktów od \`--full\` na prawdziwym repo z PG16 (NOT_EXECUTED, jeśli nie wykonano).
4. Zweryfikuj FE tests/build, backend tests/build/typecheck i spodziewane liczniki TAP dla pełnego runnera; przygotuj pozytywne i negatywne test commands.
5. Przekaż A50 exact SHA, env/gates i A60 dokładną listę odmów; odbierz QA i przygotuj poprawkę tylko jeśli A60 wskaże konkretny błąd i A00 dopuści ją do kodowego slotu.
6. Zaktualizuj A10 status P07 i formalny \`GO/STOP\`.

**DELIVERABLE:** \`WEB-005_A40_R9_PACK17_ACCEPTANCE.md\`.  
**STOP:** no new Pack17 PR, no CI billing or merge; brak domniemanego PASS dla pełnego release.

## AGENT A50 — Isolated Runtime Test Execution

**TASK ID:** \`WEB-005-T133-A50-R4\`  
**MODE:** TEST INFRA / REAL EXECUTION IF SAFE.

**MISSION:** Użyj istniejącego runnera (nie odbudowuj) do realnych testów przy zapewnionej izolacji. Wspieraj QA A60 i nowych autorów patchy.

**ZADANIA:**
1. Sprawdź dotychczasowe raporty harnessu; wyniki 50/50 harnessu nie dowodzą PASS aplikacji.
2. Zweryfikuj działający Node22, pnpm10, locked dependencies, \`git HEAD\` i rzeczywistą dostępność izolowanego PostgreSQL16. Zabezpiecz preflight przeciw produkcyjnemu/shared DB, explicit \`TEST_DATABASE_URL\` + schema \`tm_test_*\`.
3. Jeśli izolacja jest autoryzowana, uruchom realne \`Pack19–26\`, \`Pack17 --full\`, API typecheck/build, frontend/Animated Effects, Steam HTTP i Proxy Supertest, PR39 MP1 PG, PR38 validator tests; zapisuj polecenia, SHA, wyniki i exit code.
4. Jeśli nie ma bezpiecznego środowiska, nie uruchamiaj destrukcyjnych testów; dostarcz reprodukowalny pakiet/skrypt z preflight oraz \`BLOCKED\` i brakującymi wymaganiami.
5. Dla nowych patchy A90 (Backup V3), A70 (Undo LIFO) i A100 (revocation race) przygotuj negatywne fixture i test runner konfigurację.
6. Raportuj do A60 każdą różnicę pomiędzy niezależnym runtime a lokalnymi testami autora, bez fikcyjnych PASS.
7. Dostarcz A10 manifest test evidence, dla SWARM-007 metadane do archiwizacji (bez faktycznego transferu, o ile brak uzgodnionej infrastruktury).

**DELIVERABLE:** \`WEB-005_A50_R9_TEST_EVIDENCE.md\` + machine-readable matrix.  
**STOP:** no shared/prod DB reset, no paid CI, no false runtime PASS.

## AGENT A60 — Independent QA / Release Gates

**TASK ID:** \`WEB-005-T130-A60-R9\`  
**MODE:** STRICT READ-ONLY INDEPENDENT QA.

**MISSION:** Zachowaj niezależność od implementacji. Przyjmij wszystkie istniejące P01–P07 i nowe R9 PR-y, wydaj werdykty na konkretnych HEAD, uwzględniając 38 przypadków końcowej macierzy WEB-004.

**ZADANIA:**
1. Sprawdź HEAD P01–P07; nie powtarzaj niezmienionego QA, tylko adnotuj \`prior review unchanged\`. Nie utożsamiaj braku GitHub Review z brakiem niezależnej analizy raportowej.
2. Dla PR39: sprawdź generic PATCH 422, dedicated cancel/restore 409/422, revision, audit history, zero-write, OpenAPI/backend Zod i brakującą React client parity.
3. Dla PR40: negatywne TAP/skip/failure, missing PG, gate omission i pełne zadania FE/API/DB; autorowy synthetic PASS ≠ full gate.
4. Dla PR37/38 oraz PR34–36 sprawdź source-to-test mapping i A50 real runtime evidence.
5. Przygotuj test-first niezależne kryteria dla T060-B1 pre-clone, T040-MP2A global LIFO i T080-S1 post-lock revocation; po pojawieniu się nowych PR recenzuj konkretny HEAD.
6. Utrzymuj związanie z oryginalną macierzą WEB-004 A60 38-case (nie zastępuj jej wcześniejszymi 29-case ani grupami Q01–Q15).
7. Raportuj \`SOURCE_ACCEPTED\`, \`RUNTIME_VERIFIED\`, \`FAIL\`, \`BLOCKED\`, \`NOT_EXECUTED\` i \`POLICY_OPEN\` osobno. Nie samocertyfikuj implementacji.
8. Dostarcz 00 status gotowości kolejnych kodowych lane, bez sugerowania przedwczesnego SWARM-006 dispatch; finalny niezależny odbiór integracji to późniejszy etap w SWARM-006.

**DELIVERABLE:** \`WEB-005_A60_R9_INDEPENDENT_QA.md\` + P01–P07+ matrix + new patch verdicts.  
**STOP:** no code, merge, release or production tests.

## AGENT A70 — T040 MP2A Global Undo LIFO (CODE LANE 2)

**TASK ID:** \`WEB-005-T040-A70-MP2A-R6\`  
**PRIORITY:** P0  
**MODE:** **GO SOURCE-CODE ONLY, limited to MP2A**.

**MISSION:** Po zakończonym źródłowym MP1 PR39 zaimplementuj pojedynczą niezależną poprawkę: atomową ponowną walidację globalnego ostatniego undoable action (LIFO) już po uzyskaniu tournament mutation lock. Obejmij wariant \`revert_match\`; nie zakładaj, że wstępnie wybrany action jest nadal najnowszy.

**ZADANIA:**
1. Zbadaj release \`undo-last\` i \`revert-match.ts\`, audyt OPS-01 A50-F008/A52-F010 i ograniczone hunks PR #27 (jego ancestry od PR #7).
2. Przygotuj test-first deterministyczną wyścigową sytuację X queued, Y committed before X lock; expected 409 + zero-write for X, Y preserved.
3. Wprowadź minimalną kontrolę \`latest undoable action id/revision\` pod lockiem, także \`revert_match\`, z kontrolowanymi odpowiedziami 409 i 100% rollback on reject; preserve 1:1 history.
4. Nie przenoś całego PR #27 ani PR #7; nie zmieniaj MP1 PR39 (opcja \`expectedRevision\` na MP1 pozostaje nietknięta).
5. Nie implementuj direct Revert request-level CAS (MP2B) jako dodatkowego scope; przygotuj osobny plan i fixture.
6. **Ownership:** \`revert-match.ts\` zarezerwowany dla A70; A80 nie edytuje. Jeżeli wymagane zmiany \`routes/tournaments.ts\` kolidują z A100, natychmiast HOLD część wspólną, zgłoś A00 przed zmianą.
7. Utwórz własną izolowaną gałąź z release baseline, testy i draft PR tylko dla MP2A; nie merge/cherry-pick i nie edytuj istniejących PR39/#27.
8. Uruchom tylko bezpieczne testy dostępne lokalnie; PG16 tylko po izolacji, inaczej \`NOT_EXECUTED\`.
9. Oddaj A50 command/fixture, A60 exact HEAD+diff, A10 oznaczenie przyszłej paczki \`P08+ CONDITIONAL\` bez transmitowania do SWARM-006.

**DELIVERABLE:** \`WEB-005_A70_R9_MP2A_PATCH.md\`, exact PR HEAD, tests, zero-write evidence/blockers, MP2B follow-up.  
**STOP:** no MP1 reimplementation; no global Undo redesign, no product policy default, no concurrent file edits.

## AGENT A80 — T050/T051 Sporting and Lifecycle Source Contracts

**TASK ID:** \`WEB-005-T050-T051-A80-R2\`  
**MODE:** SOURCE-ONLY / TEST-FIRST / POLICY OPTIONS.

**MISSION:** Po R1 fixture dopracuj plan najbliższych małych zmian logiki sportowej i lifecycle bez ingerencji w pliki A70.

**ZADANIA:**
1. Odśwież release, swoje R1 matryce i \`WEB-005-T050-T051-A80-FIXTURES-R1.json\`; nie powtarzaj całej analizy.
2. Dla terminal Swiss (A52-F022): przygotuj dwie jawne opcje owner/HQ \`409 + no writes\` kontra \`atomic reopen stage/tournament/winner\`, z rzetelną macierzą walidacji po revert.
3. Dla RR8→4→RR4 (A52-F019): pokaż źródłowo minimalną zmianę, która **nie** reaktywuje wcześniejszych P5–P8, z testem DB status snapshot.
4. Dla SE currentRound (A52-F018): \`actionable\` vs \`max generated\` i wpływ na UI/API; bez wybrania polityki.
5. Dla T051 Swiss5/6: zachowaj deterministyczność, BYE/no_contest, brak możliwych do uniknięcia rewanżów według zatwierdzonego kontraktu. Dla DE4/GF Reset runner-up, miejsca 3–N polityka. RR stageSeed — retest only.
6. Zidentyfikuj pliki i potencjalne testy, które nie wymagają zmiany \`revert-match.ts\`. Nie edytuj kodu w R9 (A70 jest właścicielem tego pliku).
7. Przekaż A50 fixtures, A60 expected/result, A00 decyzje i plan następnego **jednego małego** patcha po wolnym slotcie.

**DELIVERABLE:** \`WEB-005_A80_R9_T050_T051_NEXT_PATCH_PLAN.md\`.  
**STOP:** NO CODE; nie wdrażaj polityki automatycznie.

## AGENT A90 — T060-B1 Backup V3 Integrity (CODE LANE 1)

**TASK ID:** \`WEB-005-T060-A90-B1-R2\`  
**PRIORITY:** P0  
**MODE:** **GO SOURCE-CODE ONLY / TEST-FIRST**.

**MISSION:** Implementuj najmniejszy niezależny fail-closed patch walidacji **przed klonowaniem** Backup V3: wszystkie approved qualification outputs i route arrivals muszą tworzyć spójny, kompletny graf. Nie rozszerzaj patcha na B2/B3 ani na politykę historii.

**ZADANIA:**
1. Przejrzyj własny R1 oraz A51-F034/F021/F022/F027; sprawdź import V3 i tabele QP→QPE→OP, route executions/entries, source/target lineage.
2. Skonstruuj deterministyczne kopie syntetyczne: (a) poprawny approval+routing round-trip, (b) brak OP, (c) zły player/target, (d) niekompletne route entry, (e) orphaned source proposal/receipt, (f) cross-stage/tournament mismatch.
3. Zadbaj o walidację **przed pierwszym zapisem klonującym**; błędne kopie kończą się kontrolowanym 4xx i **0 sklonowanych rekordów**, w tym w scenariuszu ze stroną bazodanową po atomowym rollbacku.
4. Porównuj liczebność, relacje i provenance; nie pomijaj rekordów przez ciche \`continue\` po niekompletnym mapowaniu.
5. Nie wybieraj nowej niezatwierdzonej polityki \`portable revision\` albo legacy backup compatibility. Jeśli przypadek wymaga nowej polityki wstecznej, HOLD tylko tę gałąź, pokaż test/ryzyko A00.
6. Użyj wyodrębnionej gałęzi od release, minimalny patch i draft PR B1; żadnych migracji, SQL DDL, realnych backupów ani bezpośredniego dostępu do produkcji.
7. Zależności T020/T021 i T040 wpisz do manifestu, ale nie poprawiaj ich kodu.
8. Zademonstruj test-first oraz poziom dowodów; jeśli PG16 niedostępny, \`NOT_EXECUTED\`, nie PASS. Przekaż A50/A60 fixtures i polecenia.
9. Przedstaw A00 wyniki i osobną, niezaimplementowaną kolejkę B2 result_history/revisions i B3 MVCC export/legacy.

**DELIVERABLE:** \`WEB-005_A90_R9_T060_B1_PATCH.md\`, test fixtures, exact PR HEAD, negative/rollback status, file manifest, B2/B3 pending.  
**STOP:** no broad Backup V3 rewrite, no direct SQL/import production, no invented acceptance.

## AGENT A100 — T080-S1 Session Revocation Races (CODE LANE 3)

**TASK ID:** \`WEB-005-T080-A100-S1-R2\`  
**PRIORITY:** P1 security  
**MODE:** **GO SOURCE-CODE ONLY / CONDITIONAL ON FILE OWNERSHIP**.

**MISSION:** Implementuj minimalną ponowną autoryzację organizer/support pod właściwą blokadą turnieju tuż przed mutacją, aby wcześniej zweryfikowany, lecz już unieważniony token nie wykonywał spóźnionego zapisu. Nie mieszaj z frontend cache (S2).

**ZADANIA:**
1. Odczytaj własny R1 (SEC-006/SEC-021), PR34/PR37 tylko jako security boundaries oraz autoryzację zapisów bans/game picks/organizer/support.
2. Zrób minimalny inventory wszystkich mutacji wymagających ponownej walidacji tożsamości po lock; zaznacz miejsca, gdzie check-before-lock otwiera race.
3. Przygotuj deterministyczne testy: A przechodzi początkowy auth; A czeka na lock; B cofa support/rotuje uprawnienie; A uzyskuje lock i **musi zostać odrzucony bez zapisu**, nie cichy sukces.
4. Minimalna implementacja fail-closed powinna zachować legalne operacje oraz nie wprowadzać deadlocków. Nie loguj tokenów.
5. **File ownership gate:** jeżeli plan zmienia \`routes/tournaments.ts\`, przed pisaniem uzgodnij z A00 i A70, kto edytuje go w tym momencie; nie edytuj równocześnie z A70. Gdy konflikt nieustalony, HOLD CODE, dostarcz konkretny diff/test plan.
6. Nie zmieniaj TTL, przechowywania support tokenu, password rotation czy globalnych modeli sesji bez owner policy. Nie implementuj S2 private cache; oddzielny frontend task.
7. Utwórz izolowaną gałąź i tylko mały patch S1 + testy; Pg16 only if safe, otherwise \`NOT_EXECUTED\`.
8. Przekaż A50/A60 scenariusze revocation + zero writes, A30 review security, A00/10 manifest po PR.

**DELIVERABLE:** \`WEB-005_A100_R9_T080_S1_PATCH.md\`, patch/PR if safe, race contract, file ownership and remaining S2/policy.  
**STOP:** no new auth architecture unapproved; no file conflicts/production writes.

## AGENT A110 — Basket CAS and Frontend Async UX Source Contracts

**TASK ID:** \`WEB-005-T055-T110-A110-R2\`  
**MODE:** SOURCE-ONLY / TEST-FIRST.

**MISSION:** Przygotuj dwie małe, niezależne implementacje na następną falę: basket optimistic concurrency (T055) oraz frontend asynchronous state/draft safety (T110). Nie rozpocznij równoległego czwartego patcha.

**ZADANIA:**
1. Zaktualizuj R1 T055 i UX-047, full-config PUT, stage.version/revision, możliwości atomowego compare-and-set oraz status 409/412 jako POLlCY OPEN.
2. Przygotuj dwa editory V0 → jednoczesny PUT: dokładnie jeden commit, drugi controlled reject, stare dane zachowane, draft użytkownika retained.
3. W T110 usuń wyłącznie wcześniej wycofane twierdzenia (StageBasketsPanel draft A→B via ordinary route; backup V3 overwrite existing B). Aktualne scope: CSV FileReader late A→B, Host Back/Forward unsaved draft, backup preview/new passwords creates NEW T, stale stage modal.
4. Przygotuj test contracts RTL/browser + invalidation/abort, nie implementuj nowego stanu backendowego bez polityki CAS.
5. Skonsultuj cache/private risk z A100 i stage/lifecycle z A80; trzymaj T055 i T110 jako osobne przyszłe patche.
6. Przekaż A50/A60 fixture, A00 owner decision oraz plan minimalnego patcha, który nie koliduje z A70/A100.

**DELIVERABLE:** \`WEB-005_A110_R9_T055_T110_NEXT_PATCH_PLAN.md\`.  
**STOP:** no code modification, no guessed status code.

## AGENT A120 — Presentation State Reliability

**TASK ID:** \`WEB-005-T100-A120-R2\`  
**MODE:** SOURCE-ONLY / REGRESSION CONTRACT.

**MISSION:** Zamknij ograniczony projekt napraw A20-F052/F053/F055/F058 widoków DE Bracket, standings i overlays, nie uruchamiając dużego redesignu. A20-F054 champion banner ma tylko regresyjne sprawdzenie poprawki z PR32.

**ZADANIA:**
1. Zrewiduj własny R1, aktualny release i API związane z bracket DE, RR standings, stage-format labels i final overlay.
2. Przygotuj precyzyjne expected/actual source-based i minimalny test dla każdego findingu; odróżnij server state od stale frontend rendering.
3. Zidentyfikuj zależności: T050/T051 state semantics; T040 Cancel/Revert; T080 privacy cache. Wskazanie tych zadań nie oznacza prawa do ich implementacji.
4. Dopracuj matrycę 10 scenariuszy React + 4 scenariusze browser (lub uzasadnij weryfikowaną faktycznie liczbę), z priorytetami P2 i reprodukowalnymi fixture.
5. Zdefiniuj małe odizolowane pliki i 1–2 przyszłe PR zamiast wielkiego redesignu.
6. Przekaż A50/A60 regresję, A00 zależności/politykę i nieimplementowane błędy.

**DELIVERABLE:** \`WEB-005_A120_R9_T100_REGRESSION_PLAN.md\`.  
**STOP:** no new frontend code this wave and no misleading runtime claim.

---

## §3. Protokół raportowania końca fali

Każdy agent kończy pracę następującym krótkim rekordem (bez pomijania pól):

- **AGENT / TASK / WAVE:** Axx / ID / R9
- **BASE / HEAD / PR:** dokładne SHA i URL albo \`NO PR — SOURCE-ONLY\`
- **ACTUAL CHANGES:** konkretne pliki i zakres; \`NO CHANGES\` jeśli analiza
- **TEST EVIDENCE:** polecenie, środowisko, exit code, PASS/FAIL; oddzielnie \`NOT_EXECUTED\`
- **FINDING DISPOSITION:** naprawione źródłowo / policy open / blocker / withdrawn / not reproduced
- **DEPENDENCIES / FILE CONFLICTS:** kto musi przejąć i kiedy
- **A50 / A60 HANDOFF:** komendy + expected/result do niezależnych testów
- **NEXT ACTION:** jeden konkretny następny krok
- **MERGE / DEPLOY:** \`NOT AUTHORIZED\`

A00, po zebraniu wszystkich raportów, aktualizuje backlog, sprawdza prawdziwe PR-y i przygotowuje kolejny **jeden** dokument fali R10. Żaden agent samowolnie nie dopisuje sobie zadań z sekcji innych agentów.

## §4. Jedna komenda startowa do wszystkich wątków

> Otwórz centralny dokument WEB-005 R9 \`docs/web-005/WEB-005_WAVE_R9_AGENT_PROMPTS.md\` na gałęzi \`chore/web-005/t000-wave1-control\` repozytorium \`C8LyNn/aplikacja-turnieje\`. Odczytaj §0–§2, rozpoznaj swój identyfikator agenta z roli tego wątku i wykonaj **tylko** odpowiednią sekcję \`AGENT Axx\`. Zweryfikuj aktualne GitHub HEAD, nie przejmuj cudzych zadań i przestrzegaj trybu GO/STOP. Zakończ raportem R9 z dowodami i statusem dla 00. Nie uruchamiaj SWARM-006.
