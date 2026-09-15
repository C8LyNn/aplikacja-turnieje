# Audyt poprawności i niezawodności — 15.09.2026

## Aktualizacja po P3.1a + P3.1b

Pierwotny P0 starego formularza był rzeczywistym blockerem: po zamianie stron przez drugiego operatora można było zapisać niewłaściwego zwycięzcę. Ten konkretny blocker został zamknięty przez backend P3.1a i frontend P3.1b. Poprawki reliability sprzed P3.1 są zapisane w commicie `8a00f7c`.

Backend używa `matches.revision` i wymaga `expectedRevision` przy complete dla played, walkover i no-contest. Pod lockiem odrzuca nieaktualną wersję jako `409 CONCURRENT_MODIFICATION`, przed zapisem wyniku, historii i downstream. Host i edytor DE wysyłają wersję przypisaną do draftu; polling jej nie podmienia. Konflikt nie powoduje automatycznego retry ani sukcesu i wymaga świadomego rozpoczęcia nowej edycji.

Manual browser QA dwóch operatorów: **PASS**, potwierdzony przez użytkownika. Po swapie stary formularz został odrzucony; błędny winner nie został zapisany. Po świadomym rozpoczęciu świeżej edycji zapis przeszedł, a turniej zakończył się poprawnie. Nie oznacza to wykonania wszystkich pozostałych scenariuszy manualnych z historycznego raportu.

Backlog UX: odrzucenie starego draftu po konflikcie powinno być bardziej widoczne / wyeksponowane. Bez zmiany tego zachowania w obecnej finalizacji.

## Historyczny raport sprzed P3.1

Cała poniższa część dokumentu zachowuje stan pierwotnego audytu, w tym ówczesny otwarty blocker, TODO, wyniki runnerów i ograniczenia. Sformułowania „obecnie”, „pozostaje” oraz „niezacommitowane” w tej części odnoszą się do momentu **przed P3.1**, a nie do aktualnego stanu ochrony zapisu wyniku opisanego powyżej.

Branch: `codex/organizer-host-training`. Punkt wyjścia: czysty working tree, HEAD `5bfada2749c396456eb78a287914b9c288c25bef`. Zmiany audytu pozostają niezacommitowane. Bez pushu.

## Wniosek

Naprawiono lokalne błędy zwycięzcy RR, utraty zamrożonego seedowania, obsługi niezależnych meczów DE, publicznej orientacji wyniku DE, legalnego revertu wieloetapowego SE, ponownego otwarcia finału DE i zwycięzcy Audience.

**Audyt nie daje bezwarunkowego GREEN. Pozostaje blocker starego formularza wyniku po zmianie meczu w drugim oknie.** Deterministyczny test wykonał zapis i odczyt z DB: API przyjęło HTTP 200, a zapisany zwycięzca był innym zawodnikiem niż ten, którego operator A widział po stronie zwycięskiej. Regresja ma jawne `todo`, wykonuje się i nadal nie spełnia oczekiwanego kontraktu 409. Nie jest pomijana ani liczona jako PASS.

## Metoda i granice dowodów

- Przegląd ścieżek domenowych/API, migracji, transakcji i projekcji frontendowych; nowe testy najpierw reprodukowały błędy, następnie sprawdzały poprawki.
- Integracje używają lokalnej bazy `organizer_training_test`, użytkownika `training_qa`, portu 55440. Izolowane schematy `tm_test_reliability` i `tm_test_reliability_focused` są tworzone i usuwane przez standardowy helper. Schemat manual QA `tm_test_training_qa` nie był modyfikowany.
- Ponowny odczyt oznacza nowe żądanie API i/lub SELECT po zakończeniu transakcji. Test komponentu Audience obejmuje także refetch.
- Nie wykonano w tym audycie pełnego manualnego turnieju w przeglądarce, restartu działającego API, zabicia procesu w trakcie COMMIT ani rzeczywistego zerwania połączenia TCP. Testy rollbacku przez istniejące fault hooks i eksport/import nie są przedstawiane jako takie eksperymenty.
- Równoległe żądania w testach weryfikują reprezentatywne przebiegi; nie stanowią wyczerpującego stress testu wszystkich przeplotów.

## Znaleziska i naprawy

| Obszar | Scenariusz | Wynik | Severity | Root cause | Naprawa | Test regresyjny |
| --- | --- | --- | --- | --- | --- | --- |
| RR, jeden etap | Seeding alphabetical różni się od rejestracji; cykl trzech zwycięstw albo wszystkie no-contest | RED przed zmianą; PASS po zmianie | P0 | Automatyczne completion wybierało zwycięzcę według `players.seed`, zamiast zamrożonego `stageSeed` | Ten sam kalkulator standings otrzymuje seedy etapu; odczyty standings/stats dla jednoetapowego RR/Swiss też używają etapu | Dwa testy `single RR automatic winner uses stage seeds...` w `operational-reliability.integration.test.ts` |
| DB compatibility | Zmiana `players.status` po wyniku i późniejszy odczyt | RED przed zmianą; PASS po zmianie | P0 | Trigger `compat_sync_single_stage_participant` ponownie wykonywał resequencing i zmieniał zamrożone seedy | Migracja 0027 zatrzymuje synchronizację UPDATE dla rozpoczętego/zakończonego etapu; zachowuje INSERT legacy bootstrap i przygotowanie planowanego etapu | Te same regresje RR sprawdzają równość wszystkich seedów przed/po, wynik, standings, stats i retry; helper odtwarza migrację dwukrotnie |
| DE, dwa niezależne mecze | A: BO3, zamiana stron, LIVE; B: zapis wyniku | RED przed zmianą; PASS po zmianie | P1 | Reconciliation przepisywało wszystkie gotowe mecze wartościami domyślnymi | Przy tej samej parze pozostawia istniejący rekord; zmieniona para/reset nadal przechodzą dotychczasową synchronizację | `DE advancing an independent match preserves another match's LIVE state, BO and swapped sides` |
| DE public | Zamiana stron, potem wynik 1:0 | RED przed zmianą; PASS po zmianie | P1 | Wynik pochodził z canonical match, ale kolejność zawodników z grafu routingu | Publiczne slots dla gotowego/zakończonego meczu mają kolejność canonical match | `DE public score stays attached to the correct participant after a side swap` |
| SE, wiele etapów | Legalne cofnięcie wyniku pierwszego etapu przed qualification | RED przed zmianą; PASS po zmianie | P1 | Guard szukał globalnego `players.status=eliminated`; w multistage eliminacja jest lokalna | Guard sprawdza status membership dla multistage; single-stage zachowuje dotychczasowy guard | `multi-stage SE can revert a legal first-stage result without eliminating a player globally` |
| DE completion/revert | Complete finału i etapu, potem legalny revert ostatniego meczu | RED przed zmianą; PASS po zmianie | P1 | Reopen czyścił winnerId, ale pozostawiał finalRank oraz globalny status winner | W tej samej transakcji usuwa końcowe metadane membership i przywraca globalny status uczestników; lokalny stan eliminacji odtwarza graf | `reopening a completed DE stage removes frozen final ranks and the global winner status` |
| Audience | Lider sumarycznej tabeli nie wygrał ostatniego etapu | RED przed zmianą; PASS po zmianie | P1 | Nagłówek mistrza używał `standings[0]` | Nazwa wyłącznie dla backendowego `tournament.winnerId`, z rosteru lub pasującej pozycji tabeli | `completed Audience names the persisted winner, not the aggregate standings leader`, także refetch |
| Dwóch operatorów | A widzi parę X/Y, B zamienia strony, A zapisuje stare 1:0 | **OTWARTE, odtworzone; TODO** | **P0: błędny zwycięzca; źródło: konflikt operatorów** | Żądanie complete zawiera wynik i matchId, ale nie zawiera wersji obserwowanego meczu. Lock chroni transakcję, nie intencję ze starego formularza | Bez szerokiej zmiany kontraktów w tym audycie; propozycja poniżej | `stale operator score is rejected after another operator swaps the match sides` — obecnie 200 zamiast 409, odczyt DB potwierdza innego zwycięzcę |
| Końcowy ranking DE | Po mistrzu pozostałe miejsca | Uwaga z przeglądu kodu; bez osobnej reprodukcji UI | P2, do potwierdzenia wymagania | `completeStage` porządkuje pozostałych po stageSeed, nie po rundzie eliminacji. Mistrz wynika z grafu | Nie zmieniano polityki końcowych miejsc przy okazji. DE jest terminalny, więc nie ma tutaj dalszego qualification | Brak nowej regresji; wymaga uzgodnienia semantyki miejsc 2+ |

## Pokrycie przejść i zabezpieczeń

Poniższe PASS odnoszą się do wymienionych scenariuszy automatycznych i przeglądu kodu, nie do całego formatu bez ograniczeń.

| Obszar | Scenariusz | Wynik | Severity | Root cause | Naprawa | Test regresyjny |
| --- | --- | --- | --- | --- | --- | --- |
| Setup/start | Roster, readiness read-only, zgodność readiness/start, uszkodzona struktura, blokada istniejących matches | Pokryte istniejącymi integracjami | — | Nie stwierdzono nowego błędu tych guardów | Brak | `tournament-stages-initial-start`, `tournament-stages-lifecycle`, `stage-basket-configuration`, `basket-participant-flow` |
| Ceremonia | Prepare, reveal, GET, resume, stale roster, równoległe reveal, instant random | Pokryte istniejącymi integracjami | — | Persisted draws/seeds oraz wersja wejścia | Brak | `tournament-stages-lifecycle`, `basket-participant-flow`, `single-stage-seeding` |
| RR | Pary dokładnie raz, brak self-match, parzyste/nieparzyste liczby 3–6, h2h dwóch remisujących, pełny remis, no-contest | Pokryte unit/API; nowa regresja seedów | — | Ranking korzysta z istniejącej polityki; no-contest nie daje punktów | Wyłącznie wybór właściwych seedów i ochrona ich trwałości | `round-robin.test.ts`, `series-v1`, nowe `operational-reliability` |
| Swiss | Generacja następnej rundy, BYE rotation, równoległe generate, blokada postponed, standings/Buchholz, przejście do SE | Pokryte unit/API | — | Ranking i guard kolejnej rundy istnieją; bez gwarancji optymalnego globalnego doboru par w każdym możliwym wejściu | Brak zmiany algorytmu | `series-v1`, `stage-ranking`, `tournament-stages-lifecycle` |
| SE | BYE, awans, 17→16, skrócony qualifier 16→8/16→4, finał 8→1, downstream correction guards | Pokryte istniejącymi i nową regresją | — | Eliminacja stage-local w multistage | Poprawiony guard revertu | `complete-match`, `revert-match`, `tournament-stages-lifecycle`, nowe `operational-reliability` |
| DE | Upper/lower, 1./2. porażka, final/reset final, korekta z unieważnieniem potomnych wyników, reset/revision, eksport/import | Pokryte silnikiem i API, z ograniczeniem starego formularza | — | Canonical matches i graf mają różne role; trzeba zachować ustawienia operatora | Lokalne poprawki wymienione wyżej | `double-elimination-api`, testy `domain/tournament/v2`, nowe `operational-reliability` |
| Grupy | Snake/random deterministyczny, nierówne grupy, dokładne RR, osobne rankingi, top N/rank bands, wszystkie osoby awansują | Pokryte istniejącymi integracjami | — | Grupy i rankingi mają stage/group scope | Brak | `tournament-stages-group-stage`, pełny Swiss16→Groups8→SE4 |
| Qualification | Niepełny etap, źródło nieukończone, stale fingerprint, dwukrotne zatwierdzenie, eksport/import | Pokryte istniejącymi integracjami oraz nowym concurrency | — | Fingerprint liczony pod lockami; approved output utrwalony | Brak nowych zmian domenowych | `stage-basket-qualification`, `tournament-stages-lifecycle`, nowy test w `stage-basket-route-execution` |
| Routing | Brak approval, zła quota, rozpoczęty target, direct+routed collision, drugi route tej samej osoby, retry, restore | Pokryte integracjami | — | Unikalność provenance/target i wspólna walidacja rosteru; brak partial memberships | Brak zmian routingu | `stage-basket-route-execution`, `basket-participant-flow`, `stage-baskets` |
| Równoległe approval/route | Dwa requesty approval, następnie dwa requesty execute; odczyt DB i retry | PASS nowego testu | — | Serializacja przez tournament lock i unikalne execution/entries | Dodano test; nie zmieniano mechanizmu | `concurrent approval and concurrent routing persist one output and one arrival per qualifier` |
| Atomowość | Błąd po match update/reset, po generation, po qualification writes, po restore insert | Pokryte istniejącymi fault-injection tests | — | Całość operacji w transakcji | Brak | `complete-match`, `revert-match`, `tournament-stages-lifecycle`, `tournament-stages-group-stage`, `tournament-routing-persistence` |
| Powrót do pracy | Nowy GET po mutacji, restore backup, refetch Host/Stages/Audience | Pokryte API/component; browser/restart PENDING | — | Stan trwały w DB; frontend refetchuje źródła | Poprawki końcowego stanu opisane wyżej | Pełny frontend, integracje backupów i nowe testy |

## Transakcje i lock ordering

Complete/revert blokują turniej przed stage, canonical match i uczestnikami. Start/complete stage również zaczynają od turnieju, a stage listę pobierają w kolejności position. Approval/execute zaczynają od turnieju, potem źródła i proposal/route oraz celu. Reconciliation DE działa w transakcji wołającego, nie otwiera niezależnego zapisu.

Nowe czyszczenie końcowych metadanych DE pozostaje w istniejącej transakcji revertu. Nie dodano zewnętrznych wywołań ani oczekiwania na UI pod lockiem. Migracja nie dodaje dodatkowych blokad; usuwa zbędne zapisy compatibility po starcie. Nie stwierdzono nowego odwrócenia kolejności locków. Zaznaczone ograniczenie: serializacja nie odrzuca żądania opartego na starej wersji danych.

## Otwarty blocker: stary formularz wyniku

Reprodukcja deterministyczna przez publiczne API, bez manipulacji DB:

1. Utworzyć i rozpocząć DE4, bestOf1. Operator A pobiera gotowy mecz X/Y.
2. Operator B wykonuje `POST /api/matches/:id/swap-players` — 200.
3. A wysyła poprzedni formularz: `POST /api/matches/:id/complete`, `{resultType:"played",score1:1,score2:0}`.
4. Obecnie: 200; SELECT pokazuje `winner_id=Y`, chociaż A widział X po stronie 1.
5. Oczekiwane: konflikt 409 i ponowny odczyt przed potwierdzeniem wyniku.

Analogiczne ryzyko istnieje po reopen/reset, gdy ten sam matchId znów staje się zapisywalny. Te analogie wynikają z przeglądu kontraktu; deterministyczna nowa regresja dotyczy swap→save. Dotychczasowy test Promise.all complete/revert sprawdza tylko reprezentatywną kolejność blokad i nie dowodzi ochrony starego formularza.

Minimalny workaround operacyjny: jeden operator zapisuje/koryguje wyniki; podczas swap/reset/revert pozostali zamykają formularze, pobierają świeży stan i ponownie potwierdzają zawodników. Nie jest to techniczna gwarancja.

Docelowy fix: trwała wersja meczu zmieniana przy swap, zmianie BO/uczestników, reset/revert i zapisie wyniku; wymagane `expectedRevision` w mutation, porównywane pod istniejącym lockiem. Frontend przekazuje wersję faktycznie oglądanego formularza, po 409 wymaga świadomego ponownego potwierdzenia. Należy objąć wszystkie edytory i endpointy, wygenerowane kontrakty, support/organizer oraz kompatybilność starszych klientów. Samo dodanie opcjonalnego pola nie zabezpieczy starych klientów.

Ryzyko naprawy: skoordynowane wdrożenie kontraktu; pominięcie jednego writer-a pozostawi lukę lub zablokuje poprawną obsługę. Dlatego zgodnie z zakresem audytu nie wprowadzono tej szerszej przebudowy automatycznie.

## Migracja i istniejące dane

`lib/db/migrations/0027_preserve_started_stage_memberships.sql` jest częścią poprawki i musi zostać wdrożona do właściwego schematu razem z backendem. Zastępuje jedną funkcję; nie zmienia tabel ani enumów. Integracje stosują ją dwukrotnie, sprawdzając możliwość powtórzenia. Zachowuje tworzenie memberships przez legacy INSERT oraz synchronizację planowanego składu. Pierwsza wersja guardu obejmowała także INSERT i łamała legacy bootstrap; zawężono ją do UPDATE przed końcową walidacją, bez przepisywania fixtures.

Migracja została wykonana tylko przez helper w izolowanych schematach testowych. Nie migrowano dev/manual QA ani produkcji. Nie naprawia automatycznie historycznie nadpisanych seedów czy błędnych zwycięzców. Takie turnieje wymagają osobnego porównania z `seedingAudit.participantOrder`, historią wyników i utrwalonym downstream przed naprawą danych; nie należy masowo przeliczać zatwierdzonych kwalifikacji.

## Ocena formatów

| Format | Ocena | Uzasadnienie |
| --- | --- | --- |
| Single Elimination | YELLOW | Happy/failure/revert/rollback/BYE sprawdzone; współdzielony kontrakt wyników nie ma ochrony przed starym formularzem |
| Double Elimination | RED dla pracy wielu operatorów | Zreprodukowany zapis niewłaściwego zwycięzcy po swap; lokalne błędy reconcile/public/reopen naprawione |
| Round Robin | YELLOW | Remisy, schedule, no-contest, wynik i trwałe seedy sprawdzone; pozostaje wspólne ryzyko starego formularza i kontrola historycznych danych |
| Swiss | YELLOW | Rounds/BYE/ranking/progression/rollback sprawdzone; brak pełnego dowodu wszystkich przeplotów i wspólne ryzyko wersji |
| Group Stage | YELLOW | Nierówne grupy/rank bands/rollback/progression sprawdzone; wspólne ryzyko zapisu wyniku |

Nie nadano GREEN tylko na podstawie zielonego runnera.

## Późniejsze manual QA

1. RR3 z seedami rejestracji Zulu/Alfa/Mike i seeding alphabetical: remis cykliczny; porównać zwycięzcę, tabelę i odczyt po refreshu.
2. DE4: jeden mecz LIVE/BO3/zamienione strony; zakończyć drugi. Ustawienia pierwszego muszą pozostać; sprawdzić wynik w bracket/projector.
3. Wieloetapowe SE: cofnąć wynik przed qualification, wybrać przeciwnego zwycięzcę, porównać kolejny mecz i statusy uczestników.
4. Zakończyć finał DE i etap, cofnąć ostatni wynik; znikają mistrz i końcowe rankingi, pojawia się właściwy mecz do poprawy.
5. Turniej wieloetapowy: mistrz inny niż lider sumy wyników; Audience po refreshu wskazuje mistrza z finału.
6. Dwie sesje: approval/routing, utrata odpowiedzi i ponowienie. Bez duplikatów, docelowy roster zgodny z output.
7. Osobno przetestować restart API i rzeczywiste zerwanie połączenia; dotychczasowe API reread/rollback nie zastępują tych prób.
8. Stare formularze po swap/revert/reset sprawdzić ponownie dopiero przy wdrażaniu expectedRevision; obecnie to znany blocker.

## Końcowa walidacja

| Walidacja aktualnego working tree | Wynik |
| --- | --- |
| `node --import tsx ./test/run-tests.ts unit` | 379/379 PASS |
| `node --import tsx ./test/run-tests.ts integration` | 514 testów: **513 PASS, 1 TODO, 0 innych FAIL, 0 skipped/cancelled**; około 156 s |
| Targeted complete/revert/reliability | 88 testów: 87 PASS + 1 TODO |
| Targeted route execution | 20/20 PASS, w tym nowe concurrent approval/route |
| Targeted Audience | 6/6 PASS |
| Pełny frontend `node ./test/run-tests.mjs` | 264/264 PASS |
| API typecheck | PASS |
| API test typecheck | PASS |
| Frontend typecheck | PASS |
| Frontend Vite build | PASS; istniejące ostrzeżenia fontów i wielkości chunku |
| `git diff --check` | PASS |

Node zwraca exit 0 dla niezaliczonego testu oznaczonego TODO. **Nie oznacza to usunięcia błędu**: test naprawdę wysyła żądanie, odczytuje DB i kończy się niespełnioną asercją 200 vs 409. W zestawieniu audytu ten scenariusz pozostaje FAIL/blocker.

Końcowy pełny runner został wykonany po zawężeniu migracji do UPDATE. Wcześniejszy przebieg pełny wykrył zbyt szeroki guard INSERT; tamten wynik nie jest wynikiem końcowego kodu. Nie zmieniono fixtures ani ich oczekiwań w celu ukrycia tej regresji.

Komendy integracyjne uruchamiano z `TEST_DATABASE_URL` dla dedykowanej lokalnej bazy, `TEST_DATABASE_SCHEMA=tm_test_reliability` i `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`; targeted w drugim izolowanym schemacie. Sandbox blokował spawn, więc zwykłe istniejące runnery wykonano przez zatwierdzone uruchomienia poza sandboxem, bez zmiany runnerów i bez force-exit. Logi robocze są w katalogu TEMP (`tm-reliability-*.log`), poza repozytorium.
