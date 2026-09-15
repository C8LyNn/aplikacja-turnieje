# P3.1a — backendowa ochrona zapisu wyniku

Poniższy opis i wyniki walidacji dokumentują zakończenie backendowego P3.1a, przed integracją frontendu. Aktualny stan P3.1b opisuje sekcja follow-up na końcu; historyczne ograniczenia UI poniżej nie opisują już bieżących formularzy.

Zmiana rozszerza niezacommitowany reliability audit. Nie zmienia Host, DE UI ani obsługi draftów. Bez commit/push.

## Kontrakt

Każdy odczyt standardowego `Match` zawiera wymagane `revision`. `POST /api/matches/:id/complete` wymaga dodatniej całkowitej `expectedRevision` we wszystkich wariantach: played, walkover, no-contest. Brak wersji jest błędem walidacji 422; nie istnieje domyślna wersja w endpointcie ani w domenowym `completeMatch`.

Przykład: `{ "resultType": "played", "score1": 1, "score2": 0, "expectedRevision": 3 }`.

OpenAPI oraz klient/Zod zostały odtworzone istniejącym Orval. Wrapper pnpm próbował uruchomić preinstall wymagający niedostępnego `sh`, więc uruchomiono ten sam generator bezpośrednio: `node node_modules/orval/dist/bin/orval.mjs --config ./orval.config.ts` w `lib/api-spec`, następnie `tsc --build` dla bibliotek. Nie dopisywano ręcznie opcjonalności pola w wygenerowanych kontraktach.

## Migracja 0028

`lib/db/migrations/0028_match_revision.sql` dodaje `matches.revision integer NOT NULL DEFAULT 1` oraz warunek dodatniej wartości. Istniejące mecze dostają bazową wersję 1; wyniki i historia nie są przeliczane. Migracja jest powtarzalna i nie resetuje istniejących wersji.

Trigger BEFORE UPDATE ustawia `NEW.revision = OLD.revision + 1` tylko przy rzeczywistej zmianie przynajmniej jednej z kolumn:

- `stage_id`, `stage_group_id`;
- `player1_id`, `player2_id`;
- `best_of`, `status`;
- `score1`, `score2`, `winner_id`;
- `result_type`, `result_reason`, `completed_at`;
- `next_match_id`, `routing_match_key`.

Porównanie `ROW(...) IS DISTINCT FROM ROW(...)` uwzględnia NULL. Zmiany `note`, `sort_order`, `scheduled_at` nie zwiększają wersji. Bez zmiany semantycznej trigger zachowuje OLD.revision także wtedy, gdy writer próbuje podać inną wartość revision. Jeden semantyczny UPDATE zwiększa wersję o jeden; operacja resetu wykonująca kilka UPDATE może zwiększyć ją więcej niż o jeden. Wersja jest monotoniczna, a nie licznikiem requestów.

Mechanizm obejmuje także istniejące wewnętrzne aktualizacje: awans do downstream, zmianę stron, cancel/restore, revert/undo, reset DE. Nie trzeba dodawać inkrementacji do każdego writer-a. W razie błędu transakcji rollback obejmuje również revision.

## Guard i atomowość

`completeMatch` sprawdza poprawność typu/range wersji również przy bezpośrednim wywołaniu domenowym. W istniejącej transakcji zachowuje kolejność blokad: tournament, stages, opcjonalny DE runtime, match. Bezpośrednio po pobraniu match `FOR UPDATE` porównuje `input.expectedRevision` i `match.revision`.

Niezgodność kończy operację błędem `CONCURRENT_MODIFICATION`, mapowanym przez route na HTTP 409. Porównanie poprzedza interpretację wyniku względem zawodników, wszystkie zapisy, historię, action log i downstream. Sprawdzenie stanu active/completed następuje po porównaniu wersji, więc drugi request ze starą wersją nie jest mylony ze świeżym requestem do już zakończonego meczu.

## Regresje

Istniejący TODO P0 został zmieniony w zwykły test. Przed poprawką rzeczywiście FAIL: 200 zamiast 409. Po poprawce test wymaga 409 i `CONCURRENT_MODIFICATION`, revision po swap r+1 oraz identycznego snapshotu po odrzuceniu: mecze, memberships, etapy, result history, action log, tournament i DE routing execution. Brak operacyjnych skutków starego żądania.

Nowy plik `match-revision.integration.test.ts` sprawdza:

1. Stary played/walkover/no-contest → 409; świeży request → poprawny zapis i revision.
2. Dwa jednoczesne requesty tej samej revision → jeden 200, jeden 409, jeden wynik/historia/action.
3. ABA: swap i swap z powrotem nie przywracają ważności starego formularza.
4. Brak, NULL, zero, liczba ujemna, ułamek i string zamiast revision → 422 bez zapisów; wywołanie domeny bez revision również odrzucone.
5. Zmiana BO/statusu, cancel/restore/revert zwiększa wersję; pola prezentacyjne jej nie zmieniają. Revert nie pozwala ponownie użyć wersji starego formularza.
6. Migracja na dotychczasowym schemacie z wynikami: baseline 1, zachowane wyniki i historia, ponowne wykonanie nie resetuje revision.

Reset pustego schematu standardowym helperem instaluje pełny łańcuch migracji i dwukrotnie 0028. Nowe fixture po starcie sprawdzają revision 1. Dodatkowy test reliability sprawdza reset DE do tej samej pary i odrzucenie starej wersji.

Dotychczasowe testy flow zostały dostosowane do wymaganego payloadu. Pomocnicze `matchRevision` służy tylko testom do jawnego odczytu wersji przed żądaniem. Testy stale/ABA/dwóch writerów przechowują oryginalną wersję; nie odświeżają jej przed badanym zapisem. Nie zmieniono oczekiwań testów na łagodniejsze kody błędów.

## Granice zadania i wdrożenie

- Brak backendowej ścieżki zwykłego zapisu nowego played/walkover/no-contest przez complete bez wersji. PATCH nadal odrzuca pola wyniku. Automatyczne BYE i przywracanie backupu nie są zapisami formularza operatora; ich writerów obejmuje mechanizm revision przy UPDATE.
- Revert/undo/swap/reset nie dostały nowych wymagań klienta w tym zadaniu. Ich zmiany unieważniają stare complete requests. Ochrona samej intencji starego revert/undo pozostaje osobnym zadaniem; brak jej nie pozwala ominąć guardu complete starą revision.
- Wdrożenie wymaga migracji 0028 przed użyciem nowego backendu. Nie migrowano bazy manual QA ani produkcji — tylko izolowane schematy testowe.
- Frontend pozostawiono celowo bez integracji revision. Dotychczasowe formularze nie podają expectedRevision i zostaną odrzucone 422. Nowe wymagane typy wskazują miejsca wymagające pracy P3.1b; nie dodano fallbacku do klienta, który ukrywałby problem.
- Historyczny raport reliability opisuje stan sprzed P3.1a; jego otwarty TODO swap→complete jest zamknięty przez tę backendową zmianę. Nie oznacza to zakończenia ochrony wszystkich starych intencji użytkownika ani gotowości UI.

## Walidacja

- Celowane stale-write/complete/reliability: **58/58 PASS**, bez TODO.
- Pełne API unit: **379/379 PASS**.
- Pełne API integration: **523/523 PASS**, 0 FAIL, 0 TODO, 0 skipped/cancelled (około 161 s).
- API typecheck i API test typecheck: **PASS**.
- Frontend suite/build nie były uruchamiane; źródła UI nie były zmieniane w P3.1a.
- `git diff --check`: **PASS**; diff kodu, kontraktów i testów sprawdzony.

Test DB: `organizer_training_test` na 127.0.0.1:55440; schematy `tm_test_revision` i `tm_test_revision_targeted`. Manual QA schema `tm_test_training_qa` zachowany.

## Follow-up — P3.1b ukończony

Host i edytor Double Elimination wysyłają `expectedRevision` dla wszystkich zapisów complete: played, walkover i no-contest. Revision jest przypisana do konkretnego draftu; polling/background refetch nie podmienia jej ani nie interpretuje starych punktów względem nowych stron meczu.

`409 CONCURRENT_MODIFICATION` zachowuje stary draft, pokazuje wspólny komunikat konfliktu i odświeża dane bez sukcesu i automatycznego ponowienia mutation. Ponowny zapis wymaga świadomego rozpoczęcia świeżej edycji z aktualną revision; po revercie nowa edycja również korzysta z odświeżonej wersji.

Manual QA dwóch operatorów w przeglądarce: **PASS**, potwierdzony przez użytkownika. Swap unieważnił stary formularz, request został odrzucony 409, błędny winner nie został zapisany, świeża edycja zakończyła się poprawnym zapisem, a turniej został prawidłowo zakończony.

Backlog UX: mocniej wyeksponować odrzucenie starego draftu po konflikcie. Nie implementowano tej dodatkowej zmiany.

## Walidacja po odzyskaniu P3.1a + P3.1b ze stash

Ponowna walidacja na HEAD `8a00f7c` z przywróconymi zmianami P3.1a/P3.1b:

| Kontrola | Wynik |
| --- | --- |
| Pełne API unit | 379/379 PASS |
| Pełne API integration | 523/523 PASS; 0 FAIL, TODO, skipped i cancelled |
| API typecheck / API test typecheck | PASS / PASS |
| Pełny frontend runner | 272/272 PASS |
| Frontend typecheck / frontend test typecheck | PASS / PASS |
| Frontend build | PASS; ostrzeżenia sourcemap, fontu i rozmiaru chunku |
| `git diff --check` | PASS |

Integracje używały dedykowanego schematu `tm_test_commit2` w lokalnej bazie `organizer_training_test`. Test setup zachowuje migrację 0027 z Commit 1 i dodaje migrację 0028; obie są celowo wykonywane dwukrotnie. Sześć regresji reliability pozostaje zachowanych, z wymaganym expectedRevision w żądaniach, obok dwóch dodatkowych regresji starego formularza i resetu DE. Biblioteki przebudowano z aktualnych źródeł przed typecheckami, aby deklaracje nie pochodziły z izolowanego Commit 1.
