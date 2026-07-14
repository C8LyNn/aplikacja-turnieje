# Audyt modelu wyników, punktacji i klasyfikacji

Data audytu: 2026-07-14

Zakres: aktualny kod Tournament Manager, bez zmiany zachowania produktu, migracji i danych.

Cel: opisać stan faktyczny oraz przygotować drogę od domyślnego modelu 3/1/0 do modelu turniejów 1 na 1, w którym wynik serii oznacza liczbę wygranych gier/map/partii, a podstawą klasyfikacji jest bilans wygranych i przegranych meczów.

## 1. Wniosek wykonawczy

Obecny model nie jest neutralnym modelem turniejowym. Jest zbudowany wokół dwóch nakładających się założeń:

1. wynik `score1:score2` jest sumowany jak wynik bramkowy (`gamesFor`, `gamesAgainst`, `pointDiff`);
2. każdy wynik meczu jest przeliczany na stałe punkty klasyfikacyjne: wygrana `+3`, remis `+1`, porażka `+0`.

Punkty są dziś jednocześnie:

- zapisywane proceduralnie w `players.points`;
- ponownie liczone z meczów przez `calculateStandings()`;
- używane do parowania Swiss;
- używane do wyboru zwycięzcy round robin;
- pokazywane jako główna kolumna tabel i statystyk we wszystkich formatach.

To tworzy dwa źródła prawdy. Endpoint standings zwraca punkty wyliczone z meczów, ale `wins`, `draws` i `losses` pobiera z liczników gracza. Inne widoki oraz pairing Swiss korzystają bezpośrednio z zapisanych liczników gracza. Te reprezentacje mogą się rozjechać i istnieją już ścieżki, które taki rozjazd powodują.

Najważniejsza odpowiedź na pytanie o BO3 brzmi: **tak, obecnie mecz BO3 może zostać zakończony wynikiem 1:0**. Frontend ogranicza pojedynczy licznik do `ceil(bestOf / 2)`, ale ani frontend, ani backend nie wymagają, aby zwycięzca osiągnął tę wartość. Backend przyjmuje również inne sprzeczne wyniki opisane w sekcji 7.

Najbezpieczniejszy kierunek to:

- uznać rekordy meczów za kanoniczne źródło wyniku;
- rozdzielić cykl życia meczu, sposób rozstrzygnięcia i wynik serii;
- wprowadzić wersjonowaną politykę klasyfikacji;
- dla nowych turniejów użyć domyślnie `match_record_v1` bez remisów i bez 3/1/0;
- pozostawić stare turnieje w jawnej polityce `legacy_points_3_1_0`, dopóki ich dane nie zostaną sprawdzone i ewentualnie zrekoncyliowane.

## 2. Metoda i granice audytu

Sprawdzone zostały:

- schemat PostgreSQL i schemat testowy;
- kontrakt OpenAPI oraz wygenerowane walidatory Zod i typy klienta;
- cały router turniejów, graczy i meczów;
- ekrany tworzenia turnieju, prowadzenia meczu, szczegółów, widza i drabinki;
- generatory single elimination, round robin i Swiss;
- przepływy complete, revert, undo, historia, eksport i import;
- istniejące testy integracyjne i dokumentacja architektury.

Nie wykonywano mutujących prób na działającym środowisku manualnym, aby nie zmieniać przygotowanych fixture UX. Wnioski o dopuszczalnych payloadach wynikają bezpośrednio z kontraktu, wygenerowanych walidatorów i kodu handlerów.

## 3. Słownik domenowy — pojęcia, które trzeba rozdzielić

| Pojęcie | Znaczenie docelowe | Stan obecny |
|---|---|---|
| Runda turnieju | Etap drabinki albo kolejna tura parowań Swiss/RR | `matches.round`, `tournaments.currentRound`, `totalRounds`; w RR wszystkie mecze mają `round = 1` |
| Gra/mapa/partia | Jedna składowa serii BO | Brak osobnego modelu; istnieje tylko suma wygranych składowych |
| Wynik serii | Liczba gier/map/partii wygranych przez obu uczestników, np. `2:1` | `matches.score1`, `score2`; nazwy nie wyjaśniają semantyki |
| Wynik meczu | Rozstrzygnięcie całej serii: wygrana gracza 1/2, ewentualnie remis lub brak rozstrzygnięcia | Kombinacja `status`, `winnerId`, `isDraw` i score; kombinacje nie są walidowane razem |
| Sposób rozstrzygnięcia | Rozegrany mecz, walkower, bye, anulowanie/no contest | Częściowo zakodowany w `status`; UI walkower zapisuje zwykły `completed 1:0` |
| Bilans meczów | Liczba wygranych, przegranych i ewentualnie remisów całych meczów | Proceduralne `players.wins/draws/losses` |
| Bilans gier/map | Suma składowych serii wygranych i przegranych | Wyliczane jako `gamesFor/gamesAgainst`; różnica nazywa się `pointDiff` |
| Punkty klasyfikacyjne | Opcjonalna wartość wynikająca z polityki regulaminowej | Obowiązkowe założenie całego modelu: 3/1/0 |
| Buchholz | Suma wyniku przeciwników, typowo tie-break Swiss | Suma punktów 3/1/0 przeciwników, liczona i wyświetlana dla wszystkich formatów |

Pole `round` nie oznacza numeru gry/mapy w BO. BO3 jest jednym rekordem meczu w jednej rundzie turnieju, a `score1 = 2`, `score2 = 1` powinno oznaczać trzy rozegrane składowe serii.

## 4. Obecny model danych i kontrakt

### 4.1. PostgreSQL / Drizzle

Źródło: `lib/db/src/schema/tournaments.ts`.

`tournaments` zawiera:

- `format`: single elimination, double elimination, round robin lub Swiss;
- `allowDraws`, domyślnie `false`;
- `defaultBestOf`, domyślnie `1`;
- `currentRound`, `totalRounds`, `swissRounds`;
- `winnerId`.

`players` zawiera materializowane liczniki:

- `wins`, `draws`, `losses`, `points` — wszystkie `NOT NULL`, domyślnie `0`;
- `status`: active, eliminated albo winner.

`matches` zawiera:

- uczestników `player1Id`, `player2Id`;
- `round`, `matchNumber`;
- `score1`, `score2`, `winnerId`, `isDraw`, `bestOf`;
- statusy m.in. completed, bye, walkover, postponed i cancelled;
- nieużywane domenowo `nextMatchId` — awans jest wyliczany z numeru rundy i meczu.

`result_history` kopiuje uczestników, wynik, zwycięzcę, remis i status, ale nie przechowuje:

- `bestOf` obowiązującego w chwili wyniku;
- sposobu rozstrzygnięcia;
- nazw uczestników z chwili zapisu;
- numeru rewizji wyniku.

W obecnym schemacie nie ma ograniczeń wymuszających:

- `bestOf > 0` i nieparzyste `bestOf`;
- nieujemne score;
- dojście zwycięzcy do wymaganej liczby wygranych gier;
- zgodność `winnerId` ze score i uczestnikami meczu;
- równość score przy `isDraw = true`;
- brak remisu, gdy turniej go nie dopuszcza;
- zgodność uczestników i zwycięzcy z `tournamentId` meczu;
- unikalność `(tournamentId, round, matchNumber)`;
- spójność statusu completed/bye/walkover z wynikiem.

Repozytorium nie ma wersjonowanych migracji dla tego modelu; środowisko deweloperskie używa `drizzle-kit push`. Dodanie constraintów wymaga najpierw audytu istniejących danych i normalnej, wersjonowanej migracji.

### 4.2. OpenAPI i walidacja runtime

Źródła:

- `lib/api-spec/openapi.yaml`;
- `lib/api-zod/src/generated/api.ts` i `lib/api-zod/src/generated/types/*`;
- `lib/api-client-react/src/generated/api.ts` i `api.schemas.ts`.

`MatchResult` wymaga tylko `score1` i `score2`. `winnerId` oraz `isDraw` są opcjonalne. Kontrakt nie ma ograniczeń minimum, maksimum ani zależności między polami. `MatchUpdate` pozwala niezależnie zmieniać score, status i `bestOf`.

OpenAPI opisuje score i `bestOf` jako integer, ale wygenerowany Zod używa ogólnego `zod.number()` bez `.int()`, `.min()` i walidacji krzyżowej. PostgreSQL nadal wymusza typ integer przy zapisie, ale API nie odrzuca odpowiednio wcześnie liczb ujemnych ani nieprawidłowych wartości domenowych.

`Standing` zawsze wymaga `points`, `wins`, `draws`, `losses`, `buchholz` i `pointDiff`. Już sam kontrakt utrwala punkty jako obowiązkowy, uniwersalny element klasyfikacji.

`TournamentInput` i `TournamentUpdate` dopuszczają dowolne całkowite `defaultBestOf`; ustawienia `format`, `allowDraws` i `defaultBestOf` można zmienić także po starcie bez rekalkulacji istniejących wyników.

## 5. Pełny przepływ obecnej logiki

### 5.1. Konfiguracja i start

1. `create-tournament.tsx` pozwala wybrać BO1/BO3/BO5/BO7 i opcję remisów. Opis opcji mówi wprost, że remis daje 1 punkt.
2. `POST /tournaments/:id/start` pobiera `defaultBestOf` i generuje mecze.
3. Single i double elimination trafiają do tego samego `generateSingleElimination()`.
4. Round robin tworzy każdą parę dokładnie raz, ale wszystkie mecze zapisuje w rundzie 1.
5. Swiss tworzy pierwszą rundę przez `generateSwissRound()`.
6. Bye w pierwszej rundzie eliminacji lub Swiss natychmiast zwiększa graczowi `wins + 1` i `points + 3`.

Start, generacja, naliczenie bye i zmiana statusu turnieju nie są jedną transakcją.

### 5.2. Wpisywanie score w panelu prowadzącego

`tournament-host.tsx`:

- przechowuje robocze `s1/s2` lokalnie;
- przyciskami ogranicza każdy score do zakresu `0..ceil(bestOf / 2)`;
- pozwala zmienić BO przyciskami BO1/BO3/BO5; BO7 dostępne przy tworzeniu nie jest dostępne w tym selektorze;
- nie sprawdza, czy jedna strona osiągnęła próg zwycięstwa;
- przy zwykłym zakończeniu blokuje równy score tylko wtedy, gdy `allowDraws` jest fałszywe;
- prosi o dodatkowe potwierdzenie dla 0:0 albo nadpisania wyniku, ale nie naprawia reguł serii.

Wartość `ceil(bestOf / 2)` działa dla nieparzystych BO, lecz przy dopuszczonym przez API parzystym BO ma błędną semantykę większości. Przykładowo dla BO2 daje próg 1.

### 5.3. Zakończenie meczu

`POST /matches/:id/complete`:

1. waliduje tylko kształt payloadu;
2. pobiera mecz i turniej;
3. jeśli `winnerId` nie podano i nie zaznaczono remisu, wybiera uczestnika z większym score;
4. zapisuje status completed, score, `winnerId`, `isDraw` i czas;
5. dla remisu dodaje obu graczom `draws + 1`, `points + 1`;
6. dla zwycięstwa dodaje zwycięzcy `wins + 1`, `points + 3`, a wyliczonemu przegranemu `losses + 1`;
7. tylko w single elimination ustawia przegranego jako eliminated;
8. dodaje rekord `result_history` i `action_log`;
9. w formatach innych niż RR/Swiss przenosi zwycięzcę do kolejnej rundy;
10. próbuje przesunąć rundę lub zakończyć turniej.

Handler nie blokuje ponownego zakończenia meczu już mającego status completed i nie używa transakcji ani blokady rekordu. Ponowienie żądania lub dwa równoległe żądania mogą wielokrotnie naliczyć statystyki i historię.

`PATCH /matches/:id` jest drugą, równoległą ścieżką: pozwala ustawić `status: completed` i score bez naliczania statystyk, historii, awansu i zakończenia turnieju.

### 5.4. Statystyki i klasyfikacja

`calculateStandings()`:

- przyjmuje wszystkie formaty i nie wykorzystuje parametru `tournament`;
- analizuje status completed oraz bye, ale pomija walkover;
- liczy od zera punkty 3/1/0 z meczów;
- sumuje `score1/score2` do `gamesFor/gamesAgainst`;
- liczy Buchholz jako sumę punktów 3/1/0 przeciwników;
- zwraca jednak W/D/L z `players`, zamiast policzyć je z tych samych meczów;
- sortuje: points, Buchholz, `pointDiff`, seed.

`GET /tournaments/:id/stats` tworzy `topPlayers` z zapisanych `players.points`, potem wins i losses. Widoki graczy również pokazują zapisane liczniki. W rezultacie tabela standings i karta gracza mogą pokazywać różne punkty albo logicznie niemożliwą kombinację punktów i W/D/L.

### 5.5. Awans i zakończenie turnieju

Single/double elimination:

- kolejny mecz jest odnajdywany przez `floor((matchNumber - 1) / 2)`;
- `nextMatchId` nie uczestniczy w tej logice;
- po finale turniej kończy się, jeżeli nie ma już meczu o statusie innym niż completed/bye/walkover;
- zwycięzca finału staje się `tournaments.winnerId` i graczem o statusie winner.

Round robin:

- po zakończeniu wszystkich meczów zwycięzcą zostaje gracz o najwyższym **zapisanym** `players.points`;
- remis punktowy rozstrzyga kolejność zwrócona z bazy: redukcja wybiera ostatniego z równym wynikiem;
- nie są używane standings, Buchholz, bilans gier ani head-to-head.

Swiss:

- ukończenie meczu nie ma gałęzi kończącej turniej;
- po rozegraniu ostatniej dozwolonej rundy nie można wygenerować następnej, ale turniej pozostaje active i nie dostaje zwycięzcy;
- assistant jedynie informuje, że można zakończyć turniej lub sprawdzić tabelę; nie ma dedykowanego, spójnego przypadku użycia finalizacji Swiss.

### 5.6. Historia, revert i undo

`result_history` jest dopisywane przy każdym wywołaniu complete. Nazwy graczy są dociągane z bieżącej tabeli players, więc usunięcie/zmiana gracza wpływa na czytelność historycznego wpisu.

Zarówno `POST /matches/:id/revert`, jak i undo z payloadem `revert_match`:

- odejmują 1 remis i 1 punkt albo 1 wygraną i 3 punkty oraz 1 porażkę;
- używają `GREATEST(..., 0)`, przez co maskują wcześniejszą niespójność zamiast wykonać dokładne odwrócenie konkretnej rewizji;
- czyszczą slot gracza w kolejnym meczu bez sprawdzenia, czy ten mecz już się rozpoczął lub zakończył;
- resetują mecz do pending;
- usuwają **wszystkie** rekordy `result_history` dla tego matchId;
- wykonują wiele operacji bez transakcji.

Dodatkowo revert dowolnego meczu w ukończonym turnieju ponownie ustawia cały turniej jako active i usuwa zwycięzcę — kod nie sprawdza, czy cofany był finał.

Jeśli ten sam mecz zakończono wielokrotnie, revert odejmuje statystyki tylko raz, ale usuwa całą historię i oznacza wszystkie niecofnięte logi wyniku tego meczu jako undone. Nadmiarowe statystyki pozostają.

### 5.7. Walkower

UI `doWalkover()` wywołuje zwykły endpoint complete z wynikiem 1:0 lub 0:1 i `isDraw: false`. Rekord kończy jako status completed, a nie walkover.

Konsekwencje:

- nie da się odróżnić rozegranego BO1 1:0 od walkowera;
- walkower sztucznie dodaje jedną wygraną grę/mapę do bilansu;
- istniejący status walkover jest praktycznie martwy w ścieżce produktu;
- gdyby status walkover ustawiono przez PATCH, standings go pomija i nie nalicza wyniku.

### 5.8. Backup

Backup w wersji 1 zachowuje:

- liczniki W/D/L/points graczy;
- score, winner, `isDraw`, `bestOf` i status meczu;
- score/winner/draw/status historii.

Nie zachowuje w obiekcie turnieju m.in. `allowDraws`, `defaultBestOf` i `winnerId`. Historia nie zachowuje BO ani rodzaju rozstrzygnięcia. Import wstawia zapisane liczniki bez rekalkulacji i nie sprawdza ich zgodności z meczami. Nie jest transakcyjny.

Import kojarzy historię z meczem przez parę `(round, matchNumber)`, mimo że baza nie wymusza jej unikalności. Stare, nieprawidłowe albo wielokrotnie zakończone wyniki są więc przenoszone dalej bez diagnozy.

## 6. Miejsca z założeniem 3/1/0

| Miejsce | Założenie |
|---|---|
| `calculateStandings()` | stałe `pointsForWin = 3`, `pointsForDraw = 1`, `pointsForLoss = 0` |
| `POST /matches/:id/complete` | wygrana dodaje 3 punkty, remis dodaje po 1 |
| start turnieju, obsługa bye | bye dodaje wygraną i 3 punkty |
| revert oraz undo | odejmują 3 za wygraną albo 1 za remis |
| `generateSwissRound()` | sortuje po zapisanych points, potem wins |
| zakończenie round robin | wybiera zwycięzcę po zapisanych points |
| `GET /stats` | top players sortowani po points |
| OpenAPI `Standing`, `Player`, backup | points jest trwałym i obowiązkowym polem modelu |
| create tournament | opis „Remisy dozwolone” obiecuje „1 pkt” |
| host/detail/audience/RR view | punkty są eksponowane jako główna kolumna lub wyróżniona statystyka |
| `replit.md` | opis RR mówi „most wins”, co jest sprzeczne z kodem wybierającym po points |

Buchholz nie jest założeniem piłkarskim, ale obecnie jest sprzęgnięty z piłkarskimi punktami 3/1/0 i stosowany jako uniwersalny tie-break także poza Swiss.

## 7. Dopuszczane nieprawidłowe wyniki

Dla standardowej serii BO3 liczba wygranych potrzebna do zwycięstwa wynosi 2. Prawidłowe wyniki rozegranej serii bez remisów to wyłącznie:

- 2:0;
- 2:1;
- 0:2;
- 1:2.

Obecnie możliwe są między innymi:

| Przykład | Obecny skutek |
|---|---|
| BO3, 1:0 | mecz completed, gracz 1 wygrywa cały mecz |
| BO5, 1:0 albo 2:1 | mecz completed przed osiągnięciem 3 wygranych |
| BO3, 3:0 przez API | brak limitu score w API i DB |
| BO3, 1:1 z `isDraw: true` | przyjęte niezależnie od polityki turnieju |
| BO3, 2:2 z `isDraw: true` | obie strony mogą osiągnąć próg i dostać remis |
| 2:1 z `isDraw: true` | nierówny wynik zapisany jako remis |
| 1:1 z `isDraw: false`, `winnerId` podanym ręcznie | remisowe score z arbitralnym zwycięzcą |
| 0:0 z `isDraw: false` | completed bez zwycięzcy przez API; przy `allowDraws = true` zwykła akcja UI tylko prosi o potwierdzenie, a przy `false` UI blokuje wynik |
| score ujemny | brak minimum; może zostać zapisany i wpłynąć na automatyczny winner/bilans |
| winner sprzeczny z większym score | podany `winnerId` ma pierwszeństwo nad score |
| winner spoza meczu lub innego turnieju | dostaje win/+3 i może awansować do drabinki tego meczu |
| complete meczu bez kompletu uczestników | brak warunku obecności obu graczy |
| ponowny complete tego samego meczu | ponowne W/L/points, historia i log |
| PATCH score + `status: completed` | completed bez statystyk, historii i awansu |

`allowDraws` jest egzekwowane tylko częściowo w kliencie. Backend w ogóle go nie sprawdza. Gdy `allowDraws = true`, zwykły przycisk zakończenia może zaakceptować równy score z `isDraw = false`; osobny przycisk remisu jest tylko konwencją UI.

## 8. Zachowanie według formatu

### 8.1. Single elimination

Stan działający:

- generacja drabinki do potęgi 2;
- bye i awans do kolejnej rundy;
- awans zwycięzcy po complete;
- zakończenie po finale.

Problemy modelu wyniku:

- identyczne 3/1/0 i uniwersalne standings jak w formatach ligowych;
- można dopuścić remis i wtedy brak zwycięzcy do awansu;
- nieprawidłowy/obcy winner może awansować;
- brak walidacji BO;
- revert może uszkodzić rozegrany downstream;
- bye jest liczone jako win/+3, choć mecz nie został rozegrany.

W eliminacji champion powinien wynikać z drabinki, nie z tabeli punktowej. Tabela może być wyłącznie informacyjna.

### 8.2. Double elimination

Format jest dostępny w enumie i UI, którego opis obiecuje dwie porażki, winners bracket, losers bracket i grand final. Backend używa jednak `generateSingleElimination()`, a awans ma tę samą matematykę co single elimination.

Nie istnieją:

- losers bracket;
- połączenia zwycięzców i przegranych;
- licznik dwóch porażek sterujący eliminacją;
- grand final/reset;
- osobny model rund winners/losers.

Co więcej, complete ustawia `status: eliminated` tylko dla formatu `single_elimination`, więc w double przegrany znika z faktycznej drabinki single, ale może pozostać active. Tego formatu nie należy migrować „przy okazji” punktacji; wymaga osobnej specyfikacji drabinki. Do czasu implementacji powinien być jawnie uznany za niedostępny lub eksperymentalny.

### 8.3. Round robin

Każda para gra raz, lecz harmonogram nie rozdziela meczów na rundy. Klasyfikacja jest liczona uniwersalnym 3/1/0, a końcowy champion jest wybierany osobnym algorytmem tylko po `players.points`.

Ryzyka:

- dwa różne algorytmy tabeli i wyboru championa;
- arbitralny zwycięzca przy równych punktach;
- brak head-to-head i jawnej kolejności tie-breaków;
- `replit.md` mówi o największej liczbie wygranych, ale implementacja używa punktów;
- RR view nie pokazuje remisów/Buchholza, podczas gdy ogólna tabela je pokazuje;
- wszystkie mecze mają `round = 1`, więc pole nie reprezentuje kolejek harmonogramu.

Docelowo ranking RR powinien zaczynać się od bilansu meczów. Dokładne tie-breaki wymagają decyzji produktowej.

### 8.4. Swiss

Pairing sortuje graczy po zapisanych points, następnie wins. Buchholz sumuje punkty 3/1/0 przeciwników.

Problemy specyficzne:

- pairing zależy od materializowanych liczników, a standings od częściowo przeliczonych danych;
- bye pierwszej rundy nalicza win/+3, ale bye rund tworzonych przez `/generate-round` nie aktualizuje `players`;
- standings mimo to dolicza takim późniejszym bye 3 punkty z meczu, więc tabela i następne parowanie się rozchodzą;
- `generateSwissRound()` dostaje wszystkie wcześniejsze mecze i traktuje każdą zapisaną parę jako już rozegraną, niezależnie od statusu;
- postponed jest uznane za „rundę zakończoną”, więc można parować następną rundę bez wyniku;
- algorytm nie śledzi przyznanych bye, więc nie chroni przed wielokrotnym bye tego samego gracza;
- status walkover jest uznawany za zakończenie rundy, ale nie wchodzi do standings;
- ostatnia runda nie finalizuje turnieju i nie wybiera zwycięzcy;
- brak ochrony transakcyjnej przed równoległą generacją rundy.

Docelowy Swiss nie potrzebuje 3/1/0: grupy pairingowe mogą wynikać z `matchWins` (oraz polityki bye), a Buchholz z sumy `matchWins` przeciwników. Szczegółowa definicja Buchholza, bye i remisów musi być zatwierdzona przed implementacją.

## 9. Mapa plików i funkcji

### 9.1. Kanoniczna logika backendu

| Plik / funkcja | Odpowiedzialność |
|---|---|
| `artifacts/api-server/src/routes/tournaments.ts` — `generateSingleElimination()` | drabinka single używana także przez double |
| ten sam — `generateRoundRobin()` | wszystkie pary, jedna techniczna runda |
| ten sam — `generateSwissRound()` | pairing po points/wins, bye 1:0 |
| ten sam — `calculateStandings()` | 3/1/0, Buchholz, game totals, sortowanie |
| ten sam — `POST /tournaments/:id/start` | generacja, bye W/+3, stan turnieju |
| ten sam — `POST /tournaments/:id/generate-round` | następna runda Swiss |
| ten sam — `GET /bracket`, `/standings`, `/stats`, `/results-history`, `/assistant` | reprezentacje i pochodne wyniku |
| ten sam — `PATCH /matches/:id` | bezpośrednia zmiana score/status/BO |
| ten sam — `POST /matches/:id/complete` | zapis wyniku, statystyki, historia, awans, finalizacja |
| ten sam — `POST /matches/:id/revert` | cofnięcie wyniku i awansu |
| ten sam — `POST /tournaments/:id/undo-last` | alternatywna ścieżka revert |
| ten sam — export/import | serializacja i odtworzenie modelu legacy |

### 9.2. Dane i kontrakty

| Plik | Znaczenie |
|---|---|
| `lib/db/src/schema/tournaments.ts` | tabele, enumy, brakujące constrainty |
| `lib/api-spec/openapi.yaml` | Tournament, Player, Match, MatchResult, Standing, backup |
| `lib/api-zod/src/generated/api.ts` | rzeczywista walidacja requestów backendu |
| `lib/api-zod/src/generated/types/*` | wygenerowane typy wyników, statusów, standings i backupu |
| `lib/api-client-react/src/generated/api.ts` | hooki complete/revert/standings/generate round |
| `lib/api-client-react/src/generated/api.schemas.ts` | typy używane przez frontend |

### 9.3. Frontend

| Plik | Użycie modelu |
|---|---|
| `pages/create-tournament.tsx` | format, allowDraws, BO1/3/5/7, komunikat o 1 pkt za remis |
| `pages/tournament-host.tsx` | wpisywanie score, BO1/3/5, complete, walkower 1:0, revert/undo, tabela |
| `pages/tournament-detail.tsx` | W/R/L/points, wyniki, standings, historia i backup |
| `pages/tournament-audience.tsx` | win dots dla BO, score, winner, W/L/points, Buchholz |
| `components/bracket-view.tsx` | wynik i winner drabinki single/double |
| `components/round-robin-view.tsx` | lista meczów i punktowa tabela RR |
| `components/swiss-rounds-view.tsx` | rundy, bye, score i winner Swiss |
| `pages/tournament-bracket.tsx` | wybór rendererów per format; double wpada do zwykłego bracket view |
| `components/tournament-checklist.tsx` | manualny scenariusz walkowera i BO |
| `pages/help.tsx` | dokumentacja BO ograniczona głównie do BO1/3/5 |

### 9.4. Testy i dokumentacja

| Plik | Stan pokrycia |
|---|---|
| `artifacts/api-server/test/access.integration.test.ts` | testy polityk dostępu; fixture wpisują W/L/points 3/0 i wyniki 1:0, ale nie testują reguł serii ani complete/revert |
| `artifacts/api-server/test/test-database.ts` | odtwarza luźny schemat bez constraintów wyniku |
| `docs/AUDYT_STRUKTURY_APLIKACJI.md` | wcześniej sygnalizuje foreign winner, brak idempotencji, double i Swiss |
| `docs/MAPA_FUNKCJI_I_POLACZEN.md` | mapuje complete, standings, historię i ryzyka |
| `docs/PLAN_NAPRAWY_STRUKTURY.md` | wymienia potrzebę walidacji score/draw/walkover/BO |
| `replit.md` | zawiera nieaktualne twierdzenie, że RR wybiera po liczbie wygranych |

Obecne 64 testy integracyjne dotyczą przede wszystkim dostępu i bezpieczeństwa. Nie stanowią ochrony regresyjnej dla modelu wyniku, punktacji, awansu ani końcowej klasyfikacji.

## 10. Problemy integralności — priorytety

### Krytyczne

1. **Zwycięzca nie musi być uczestnikiem meczu ani należeć do turnieju.** Może dostać statystyki i awans, a niewłaściwy uczestnik zostaje uznany za przegranego.
2. **Complete nie jest idempotentne ani atomowe.** Powtórzenie nalicza dane ponownie; błąd w środku zostawia stan częściowy.

### Wysokie

1. Brak domenowej walidacji BO, score, winner, draw i obecności uczestników.
2. PATCH pozwala ominąć cały przypadek użycia complete.
3. Dwa źródła prawdy: mecze kontra materializowane W/D/L/points.
4. Revert/undo mogą uszkodzić downstream i nie odwracają dokładnie konkretnej rewizji.
5. Double elimination jest faktycznie single elimination.
6. Swiss ma rozjazd bye, dopuszcza postponed do następnej rundy i nie finalizuje turnieju.
7. Round robin może wybrać arbitralnego championa przy remisie punktowym.

### Średnie

1. Walkower jest nierozróżnialny od rozegranego 1:0 i fałszuje bilans gier.
2. Historia nie jest trwałym dziennikiem: revert ją usuwa, brak BO i rewizji.
3. Backup v1 traci część polityki wyniku i przenosi niespójne liczniki bez walidacji.
4. Ustawienia formatu/remisów/BO można zmieniać po starcie bez wersjonowania reguł.
5. `pointDiff` oznacza różnicę wygranych gier/map, nie punktów.
6. `nextMatchId` istnieje w modelu, lecz awans używa niejawnej matematyki numerów.
7. RR nie modeluje kolejek; wszystkie mecze są rundą 1.

### Niskie / semantyczne

1. BO7 jest dostępne przy tworzeniu, ale nie w selektorze prowadzącego; pomoc mówi głównie o BO1/3/5.
2. Tabele eksponują Buchholz również tam, gdzie nie jest właściwą metryką.
3. Nazwy `score1/score2`, `gamesFor/gamesAgainst` i `pointDiff` nie wyjaśniają, czy chodzi o gole, mapy czy partie.
4. Dokument `replit.md` przeczy implementacji RR.

## 11. Proponowany model docelowy

### 11.1. Zasady

1. **Mecz jest źródłem prawdy.** Bilans i tabela wynikają z rozstrzygniętych meczów albo z kontrolowanej projekcji możliwej do pełnego przebudowania.
2. **Brak domyślnych punktów.** Nowy turniej używa `match_record_v1`.
3. **Brak domyślnego remisu.** Dla pierwszego targetu 1 na 1 rozegrana seria ma dokładnie jednego zwycięzcę.
4. **Score oznacza wygrane składowe serii.** Nie oznacza goli ani punktów klasyfikacyjnych.
5. **Status nie opisuje rodzaju wyniku.** Cykl życia i sposób rozstrzygnięcia to osobne pojęcia.
6. **Polityka jest wersjonowana.** Wynik historyczny interpretuje się według reguł obowiązujących przy jego zapisie.
7. **Complete/revert są atomowymi przypadkami użycia.** Jedna transakcja, blokada meczu i kontrola downstream.

### 11.2. Minimalny model dla nowych turniejów

Na poziomie turnieju:

- `resultModelVersion`: `legacy_v1` albo `series_v1`;
- `rankingPolicy`: `legacy_points_3_1_0`, `match_record_v1`, w przyszłości `custom_points_v1`;
- `drawPolicy`: domyślnie `forbidden`; opcjonalne warianty dopiero po decyzji produktowej;
- `defaultBestOf`: dodatnia, nieparzysta liczba;
- osobna konfiguracja tie-breaków per format.

Na poziomie meczu:

- `status`: pending/ready/in_progress/completed/postponed/cancelled;
- `resultType`: played/bye/walkover/no_contest;
- `winnerId`: uczestnik meczu albo null tylko dla jawnie dozwolonego remisu/no contest;
- `score1`, `score2`: liczba wygranych gier/map/partii, nullable dla bye/walkowera;
- `bestOf`: nieparzyste i niezmienne po pierwszej zapisanej grze, chyba że użyty zostanie jawny przypadek korekty;
- `resultRevision` lub oddzielna tabela rewizji;
- opcjonalnie `completedBy`/reason do audytu.

Nie trzeba od razu tworzyć tabeli pojedynczych gier. Dla pierwszego przypadku wystarczy poprawnie nazwany i walidowany agregat score. Osobne `match_games` ma sens dopiero, gdy produkt ma przechowywać mapy, kolejność, remisy map lub szczegółowe statystyki.

### 11.3. Inwariant rozegranej serii

Dla dodatniego, nieparzystego `bestOf = N`:

`winsRequired = floor(N / 2) + 1`

Przy `resultType = played`, bez remisów:

- score są całkowite i nieujemne;
- dokładnie jeden score równa się `winsRequired`;
- score przegranego mieści się w `0..winsRequired-1`;
- winner odpowiada stronie z większym score;
- winner jest `player1Id` albo `player2Id`;
- obaj uczestnicy istnieją i należą do turnieju meczu;
- nie można ponownie zakończyć meczu o statusie completed bez jawnej operacji korekty.

Bye i walkower nie powinny fabrykować wyniku mapowego 1:0. Mogą dawać wygraną całego meczu, jeśli zatwierdzona polityka formatu tak stanowi, ale ich wpływ na Buchholz, bilans gier i tie-breaki musi być jawny.

### 11.4. Docelowa klasyfikacja

Wspólna projekcja standings powinna zwracać semantyczne pola:

- `matchWins`, `matchLosses`, opcjonalnie `matchDraws`;
- `gameWins`, `gameLosses`, `gameDiff`;
- opcjonalne `rankingPoints` tylko dla polityki punktowej;
- nazwane tie-breaki, np. `buchholz`, `headToHead`, zależnie od formatu;
- `rank` wraz z informacją, czy pozycja jest współdzielona albo wymaga dogrywki.

Formaty powinny mieć różne reguły:

- single elimination: champion i awans wyłącznie z drabinki; standings informacyjne;
- double elimination: osobny graph winners/losers, po dwóch porażkach;
- round robin: przede wszystkim match wins/losses, dalej zatwierdzone tie-breaki;
- Swiss: score grupy po match wins, następnie zatwierdzony Buchholz i kolejne tie-breaki.

Nie należy zastępować 3/1/0 ukrytym `1 punkt za wygraną`. Pole podstawowe ma nazywać się `matchWins`; ewentualna prezentacja „wyniku meczowego” nie może ponownie stać się uniwersalnym systemem punktów.

## 12. Zgodność ze starymi danymi

### 12.1. Zasada bezpiecznej zgodności

Nie wolno masowo interpretować wszystkich starych wyników według nowych reguł. Obecne dane mogą zawierać BO3 1:0, sprzeczne winner/score, wielokrotne complete, ręczny PATCH i walkowery zapisane jako zwykłe 1:0.

Nowe pola powinny być wdrożone addytywnie:

- istniejące turnieje dostają `resultModelVersion = legacy_v1`;
- ich klasyfikacja pozostaje `legacy_points_3_1_0` do czasu audytu;
- nowe turnieje dostają `series_v1` i `match_record_v1`;
- nie usuwa się od razu `players.points` ani W/D/L.

### 12.2. Audyt i rekonsyliacja danych

Przed constraintami potrzebny jest raport per turniej i mecz:

- bestOf null/nieparzyste/dodatnie;
- completed bez dwóch uczestników;
- winner spoza uczestników/turnieju;
- isDraw sprzeczne ze score/winner/polityką;
- score ujemne, ponad próg lub bez osiągniętego progu;
- duplikaty `(round, matchNumber)`;
- wiele wpisów historii dla jednego meczu;
- różnica między bilansem wyliczonym z meczów a `players.W/D/L/points`;
- downstream z uczestnikiem niezgodnym z wynikiem poprzedniej rundy;
- completed 1:0, którego nie wolno automatycznie oznaczać jako walkower.

Rekonsyliacja powinna automatycznie naprawiać wyłącznie przypadki jednoznaczne. Ambiguous wyniki muszą zostać oznaczone do decyzji organizatora lub pozostawione w trybie legacy.

### 12.3. Backup

Potrzebna jest wersja 2 backupu zawierająca:

- model/politykę wyniku i tie-breaki;
- `allowDraws`, `defaultBestOf`, winner turnieju;
- `resultType`, bestOf i rewizję w historii;
- jawne mapowanie historii do backupId meczu;
- wersję schematu oraz raport walidacji przy imporcie.

Importer v1 powinien pozostać obsługiwany, ale zawsze tworzyć turniej `legacy_v1`. Nie należy zgadywać, że każdy completed 1:0 był walkowerem.

## 13. Wpływ zmian

### 13.1. Baza danych

- addytywne pola polityki i rodzaju wyniku;
- constrainty score/BO/status możliwe po audycie danych;
- kompozytowa integralność uczestników względem turnieju;
- unikalność numeru meczu w rundzie;
- wersjonowana historia/revision zamiast usuwania historii;
- docelowe usunięcie lub oznaczenie W/D/L/points jako cache/projection dopiero po okresie zgodności;
- wersjonowane migracje zamiast samego schema push.

### 13.2. API

- jeden przypadek użycia `CompleteMatch` zamiast PATCH statusu completed;
- centralny walidator zależności score/winner/resultType/policy;
- 409 dla already completed/idempotency conflict, 422 dla błędu domenowego;
- transakcja i row lock dla complete/revert/generate round;
- nowe semantyczne standings; tymczasowy adapter odpowiedzi legacy;
- dedykowana finalizacja Swiss i RR oparta na tej samej projekcji rankingu;
- jawny endpoint korekty wyniku z kontrolą downstream.

### 13.3. Frontend

- score opisany jako wygrane mapy/gry/partie;
- przycisk complete aktywny tylko dla pełnego, prawidłowego wyniku serii;
- brak remisu w domyślnym profilu 1v1;
- walkower jako osobna akcja bez sztucznego 1:0;
- W/L jako główna informacja, gameDiff jako tie-break, points tylko gdy polityka je włącza;
- różne tabele/kolumny dla eliminacji, RR i Swiss;
- BO7 i większe obsługiwane spójnie albo jawnie ograniczone;
- korekta wyniku pokazuje wpływ na kolejne mecze.

### 13.4. Backup i integracje

- format v2 i importer v1→legacy;
- żadnego przeliczania legacy przy samym imporcie;
- preview powinien pokazywać politykę i ostrzeżenia integralności;
- eksport musi zachować wszystkie pola niezbędne do identycznego odtworzenia klasyfikacji.

### 13.5. Testy

Potrzebne są co najmniej:

1. unit tests czystego walidatora serii dla BO1/3/5/7;
2. macierz poprawnych i niepoprawnych score, winner, draw, bye i walkower;
3. test powtórnego i równoległego complete;
4. fault-injection potwierdzający rollback całej transakcji;
5. test foreign winner i cross-tournament participants;
6. complete→standings→history→revert z dokładnym odwróceniem;
7. blokada albo kontrolowany cascade revert, gdy downstream już ruszył;
8. golden tests drabinki single oraz osobno przyszłego double;
9. RR: remis bilansu, head-to-head i wszystkie zatwierdzone tie-breaki;
10. Swiss: 5/6/7/8 graczy, bye, powtórne bye, Buchholz, postponed, walkower, finalna runda i concurrency;
11. zgodność v1 backup jako legacy oraz pełny round-trip v2;
12. test rekonsyliacji zapisanych liczników względem meczów;
13. testy UI: BO3 1:0 nie może zostać zakończone, 2:1 może; walkower nie tworzy mapy 1:0.

## 14. Etapowy plan implementacji

### Etap 0 — decyzje domenowe

Zatwierdzić odpowiedzi z sekcji 16 i spisać krótki ADR dla `series_v1`/`match_record_v1`. Bez tego nie należy implementować tie-breaków, bye ani migracji.

### Etap 1 — testy charakterystyki i walidator serii

- dodać czysty, niezależny od Express/DB walidator wyniku;
- pokryć BO1/3/5/7 i wszystkie sprzeczne przypadki;
- dodać testy obecnych ścieżek complete/revert, które najpierw ujawnią legacy behavior;
- nie zmieniać jeszcze schematu ani klasyfikacji.

### Etap 2 — bezpieczny przypadek użycia complete/revert

- transakcja, blokada rekordu i idempotency guard;
- participant/winner/policy validation;
- zakaz `status: completed` przez ogólny PATCH;
- kontrola downstream przy korekcie;
- zachowanie obecnego 3/1/0 wyłącznie jako adapter legacy.

### Etap 3 — wersjonowanie modelu i audyt danych

- dodać addytywne pola model/policy/resultType;
- oznaczyć stare turnieje jako legacy;
- uruchomić raport rekonsyliacji;
- dodać constrainty dopiero po obsłużeniu naruszeń.

### Etap 4 — projekcja `match_record_v1`

- liczyć W/L oraz bilans gier z meczów;
- usunąć points z domyślnego sortowania i prezentacji nowych turniejów;
- format-specific standings;
- ujednolicić końcowego championa RR/Swiss z tą samą projekcją.

### Etap 5 — Swiss, bye i walkower

- pairing po match record;
- jawna polityka bye i Buchholza;
- niedopuszczanie postponed jako zakończonego;
- finalizacja ostatniej rundy;
- osobny resultType dla walkowera/bye bez sztucznego score.

### Etap 6 — frontend i backup v2

- semantyczne etykiety i walidacja UX;
- kolumny zależne od polityki;
- kontrolowana korekta wyniku;
- pełny backup v2 oraz importer v1 jako legacy.

### Etap 7 — usunięcie starego źródła prawdy

Po okresie dual-read i potwierdzeniu zgodności:

- przestać mutować `players.points` i proceduralne W/D/L;
- pozostawić je czasowo jako przebudowywalną projekcję albo usunąć migracją;
- usunąć adaptery 3/1/0 tylko wtedy, gdy nie ma już turniejów legacy wymagających tej interpretacji.

Double elimination powinno być osobnym strumieniem po ustabilizowaniu wyniku serii i grafu awansu. Nie należy pozorować jego naprawy przez samą zmianę klasyfikacji.

## 15. Rekomendowany pierwszy krok

Najpierw należy zatwierdzić minimalny kontrakt domenowy:

- nowe turnieje 1v1 używają `match_record_v1`;
- remis całego meczu jest domyślnie zabroniony;
- `bestOf` jest dodatnie i nieparzyste;
- rozegrana seria kończy się dopiero po osiągnięciu `floor(bestOf / 2) + 1`;
- walkower i bye mają osobny typ i nie tworzą fikcyjnego score;
- stare turnieje pozostają `legacy_points_3_1_0`.

Pierwszym krokiem inżynierskim po tej decyzji powinien być **czysty walidator wyniku serii wraz z testami BO1/3/5/7 i testami complete/retry/foreign winner**, a następnie wpięcie go do atomowego przypadku użycia complete. To zamyka najgroźniejsze źródło nowych błędnych danych, zanim zacznie się przebudowę tabeli i migrację starych rekordów.

## 16. Pytania produktowe wymagające decyzji

1. Czy remis całego meczu ma być całkowicie niedostępny w `series_v1`, czy opcjonalny tylko dla wybranych dyscyplin?
2. Jeżeli pojedyncza mapa/partia może zakończyć się remisem, czy trzeba przechowywać jej wynik osobno, czy nadal wystarczy agregat wygranych map?
3. Czy bye liczy się jako match win w RR/Swiss, czy tylko jako osobny wynik używany do pairingu? Jaki ma wpływ na Buchholz i gameDiff?
4. Czy walkower liczy się do W/L całych meczów? Czy wpływa na Buchholz? Rekomendacja: nie wpływa na gameDiff.
5. Jakie są dokładne tie-breaki RR i ich kolejność: head-to-head, gameDiff, game wins, dodatkowy mecz, wspólne miejsce?
6. Jakie są dokładne tie-breaki Swiss: Buchholz, median Buchholz, Sonneborn-Berger, gameDiff? Jak traktować bye i walkower?
7. Co zrobić przy równym wyniku na pierwszym miejscu po ostatniej rundzie Swiss: współdzielone miejsce, dogrywka czy kolejny tie-break?
8. Czy w eliminacjach w ogóle pokazywać ogólną tabelę, czy wyłącznie drabinkę i bilans informacyjny?
9. Czy format double elimination ma zostać tymczasowo ukryty/zablokowany do czasu pełnej implementacji?
10. Czy BO może być konfigurowane osobno dla rundy/finału, czy tylko per mecz i domyślnie per turniej?
11. Czy wspierać dowolne nieparzyste BO (np. BO9), czy zamknięty zestaw BO1/3/5/7?
12. Czy zmiana BO jest dozwolona po rozpoczęciu meczu? Jeśli tak, jakie są reguły dla już wpisanego score?
13. Czy korekta wyniku z rozegranym downstream ma być blokowana, czy ma uruchamiać kontrolowany cascade unieważniający kolejne mecze?
14. Jak organizator ma rozstrzygać stare, niejednoznaczne dane, np. completed BO3 1:0 albo completed 1:0, które mogło być walkowerem?
15. Czy przyszła opcja punktowa ma pozwalać na dowolne wartości za win/draw/loss, czy na gotowe profile regulaminowe?

## 17. Kryterium gotowości do migracji

Migracji modelu nie należy rozpoczynać, dopóki nie są spełnione łącznie:

- zatwierdzony ADR polityki `series_v1` i tie-breaków pierwszego obsługiwanego formatu;
- testy walidatora oraz complete/revert/concurrency;
- raport jakości istniejących danych;
- strategia dla rekordów niejednoznacznych;
- wersjonowana migracja i rollback;
- zdefiniowany backup v2 oraz zachowanie importu v1;
- jasna decyzja o bye, walkowerze, remisie i finalizacji Swiss/RR.

Do tego momentu punkty 3/1/0 powinny być traktowane jako jawny model legacy, a nie jako neutralna baza dla nowych funkcji.
