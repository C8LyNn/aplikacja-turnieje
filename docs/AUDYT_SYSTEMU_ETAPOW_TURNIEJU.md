# Audyt systemu wieloetapowych turniejów

> Status: projekt zaktualizowany po zatwierdzeniu decyzji produktowych.
> Normatywne decyzje v1 zapisuje `docs/ADR_TOURNAMENT_STAGES_V1.md`. Dokument
> nie wprowadza zmian w kodzie, schemacie bazy ani API.
>
> Zakres: aktualny `series_v1`, maksymalnie trzy kolejne etapy, jeden aktywny
> etap naraz, bez double elimination.

## 1. Podsumowanie

Obecna aplikacja ma poprawnie rozdzielony wynik pojedynczej serii od
klasyfikacji, lecz cały turniej jest jednym etapem. Rekord `tournaments`
przechowuje format, BO, konfigurację rund, bieżącą rundę i zwycięzcę, a
`players.seed` i `players.status` opisują jedyny przebieg rywalizacji. Wszystkie
mecze, klasyfikacje, operacje CompleteMatch/RevertMatch, generatory i ekrany
filtrują dane wyłącznie po `tournament_id`.

Wieloetapowość nie powinna być dodana jako kilka opcjonalnych pól na
`tournaments`. Wymaga oddzielnego agregatu `TournamentStage` oraz przypisania
każdego meczu i każdego udziału gracza do konkretnego etapu. To pozwoli:

- mieć osobny format, BO, rundy, klasyfikację i seed w każdym etapie;
- wyliczać statystyki wyłącznie z meczów wybranego etapu;
- przenosić do następnego etapu tylko zakwalifikowanych uczestników;
- atomowo zamknąć etap, a następnie osobno uruchomić kolejny;
- nie dopuścić do cofnięcia wyniku po przekroczeniu granicy etapów;
- zachować obecne turnieje jako turnieje z jednym normalnym etapem `Etap 1`.

Przebieg pierwszej wersji jest dwuoperacyjny. Organizator najpierw pobiera
read-only podgląd kwalifikacji, a potem jawnie wywołuje atomowe `CompleteStage`.
Operacja utrwala pełny ranking, kwalifikantów, źródła kwalifikacji i proponowane
seedy, po czym zamyka etap. Nie uruchamia następnego etapu. Osobne `StartStage`
tworzy uczestników, grupy i mecze kolejnego etapu na podstawie zamrożonego
wyniku kwalifikacji. Między tymi operacjami turniej jest aktywny, ale nie ma
aktywnego etapu.

Decyzje dotyczące remisów, fazy grupowej oraz cross-seedingu zostały
zatwierdzone. Ranking zawsze daje kolejność całkowitą, `group_stage` jest
osobnym formatem, a układ play-off po grupach jest deterministyczny. Nie
pozostaje problem klasy BLOCKER i model jest gotowy do implementacji etapami.

## 2. Założenia pierwszej wersji

Audyt przyjmuje następujące wymagania jako niezmienne:

1. Turniej ma od jednego do trzech etapów w ustalonej kolejności.
2. Każdy turniej, także jednoetapowy, korzysta z normalnego
   `TournamentStage`; nie istnieje docelowa alternatywna ścieżka legacy.
3. W danym momencie aktywny jest najwyżej jeden etap.
4. Etap ma własny format, ranking, liczbę rund, regułę awansu i jednolite
   `bestOf`; dozwolone wartości to BO1, BO3, BO5 i BO7. W v1 finał nie ma
   osobnego BO.
5. Klasyfikacja i statystyki są liczone od zera w każdym etapie.
6. Między etapami przechodzą tożsamość uczestnika, źródło kwalifikacji i nowy
   seed, nie bilans meczów ani gier.
7. Organizator kończy etap przez atomowe `CompleteStage` po sprawdzeniu
   podglądu. Następny etap uruchamia osobnym `StartStage`.
8. Single Elimination może być tylko ostatnim etapem. Może być jedynym etapem.
9. Nie ma cascade revert między etapami. Po uruchomieniu następnego etapu wynik
   poprzedniego nie może zostać cofnięty.
10. Po rozpoczęciu turnieju nie można zmieniać konfiguracji żadnego etapu.
11. Istniejące turnieje jednoetapowe muszą działać po migracji bez zmiany ich
    znaczenia.
12. Double elimination pozostaje poza zakresem.

## 3. Słownik pojęć

| Pojęcie | Znaczenie |
|---|---|
| Turniej | Kontener organizacyjny, uprawnienia, widoczność, lista zgłoszonych osób i końcowy zwycięzca. |
| Etap | Jedna kolejna faza rywalizacji z własnym formatem, BO, uczestnikami, rundami i klasyfikacją. |
| Runda etapu | Jednostka harmonogramu w Swiss, Round Robin albo drabince. Numeracja zaczyna się od 1 w każdym etapie. |
| Mecz | Jedno spotkanie dwóch uczestników albo systemowy bye w konkretnym etapie. |
| Gra/mapa/partia | Składowa serii; nie jest rundą turnieju i nie ma osobnego rekordu w obecnym modelu. |
| Wynik serii | `score1:score2` walidowany względem `bestOf`, np. BO3 zakończone 2:1. |
| Klasyfikacja etapu | Bilans i tie-breaki wyliczone tylko z meczów danego etapu. |
| Seed etapu | Pozycja wejściowa uczestnika w konkretnym etapie. Nie jest globalną cechą gracza. |
| Kwalifikacja | Utrwalona decyzja, którzy uczestnicy oraz w jakiej kolejności przechodzą do następnego etapu. |

## 4. Obecny model i jego ograniczenia

### 4.1. Baza danych

Źródłem definicji jest `lib/db/src/schema/tournaments.ts`, a wdrożony schemat
odtwarza `lib/db/migrations/0001_series_v1_clean_cutover.sql`.

`tournaments` przechowuje obecnie:

- dane globalne: `name`, `description`, `status`, widoczność i dane dostępu;
- model wyniku i klasyfikacji: `result_model_version`, `ranking_policy`;
- konfigurację jedynego etapu: `format`, `max_players`, `swiss_rounds`,
  `default_best_of`;
- runtime jedynego etapu: `current_round`, `total_rounds`;
- wynik całego turnieju: `winner_id`;
- wyróżniony mecz: `featured_match_id`.

`players` jest listą uczestników turnieju, ale `seed` oraz `status`
(`active`, `eliminated`, `winner`) opisują jednocześnie stan rywalizacji. Ten
model nie potrafi wyrazić, że gracz odpadł w etapie pierwszym, zakwalifikował się
do drugiego z nowym seedem albo w ogóle nie uczestniczy w następnym etapie.

`matches` ma `tournament_id`, rundę i numer meczu, ale nie ma `stage_id` ani
grupy. Unikalność `(tournament_id, round, match_number)` uniemożliwia naturalną
numerację rund od 1 w każdym etapie. Klucze uczestników gwarantują tylko, że
gracz należy do turnieju, nie że należy do etapu.

`result_history` zachowuje historyczny wynik meczu, lecz nie ma kontekstu etapu.
`action_log` jest globalny dla turnieju i operacja `undo-last` nie ma granicy
etapu.

### 4.2. Cykl rozpoczęcia turnieju

`POST /tournaments/{id}/start` w
`artifacts/api-server/src/routes/tournaments.ts`:

1. odczytuje format i BO z `tournaments`;
2. pobiera wszystkich graczy turnieju;
3. usuwa wszystkie jego mecze;
4. generuje drabinkę, pełny harmonogram Round Robin albo pierwszą rundę Swiss;
5. zapisuje bye, historię i logi;
6. ustawia globalne `status`, `currentRound` i `totalRounds`.

Ta operacja nie jest obecnie jedną transakcją. Dla wieloetapowości nie można jej
rozszerzać w obecnym kształcie, ponieważ błąd po części zapisów może pozostawić
niepełny etap.

### 4.3. CompleteMatch

`completeMatch()` w
`artifacts/api-server/src/application/matches/complete-match.ts` wykonuje
atomowo zapis wyniku i skutki uboczne. Blokuje najpierw turniej, potem mecz i
uczestników. Walidacja serii korzysta z `match.bestOf`, ale zachowanie formatu z
`tournament.format`.

- Single Elimination wyszukuje następny mecz przez `round + 1` i numer meczu,
  eliminuje gracza przez globalne `players.status`, przesuwa globalną rundę i po
  finale kończy cały turniej.
- Round Robin po zakończeniu wszystkich meczów turnieju wylicza klasyfikację ze
  wszystkich graczy i meczów, po czym kończy cały turniej.
- Swiss nie ma w CompleteMatch odpowiednika finalizacji po ostatniej
  skonfigurowanej rundzie. Generowanie rund jest osobną operacją, a ostatnia
  runda nie prowadzi obecnie do tego samego domknięcia co Round Robin.

W modelu etapowym każdy odczyt formatu, uczestników, następnego meczu, rundy i
pozostałych spotkań musi być ograniczony do `stage_id`. Ostatni mecz etapu nie
może automatycznie oznaczać końca całego turnieju, jeśli istnieje kolejny etap.

### 4.4. RevertMatch i undo

`revertMatch()` w
`artifacts/api-server/src/application/matches/revert-match.ts` korzysta z tego
samego globalnego formatu i statusu. Dla Single Elimination sprawdza następny
mecz w całym turnieju. Dla Swiss blokuje cofnięcie, gdy istnieje późniejsza
runda albo globalny `currentRound` został przesunięty. Revert finału ponownie
otwiera cały turniej i zmienia globalny status gracza.

`POST /tournaments/{id}/undo-last` w trasie turniejów deleguje cofnięcie wyniku
do tego use case'u, ale inne typy operacji oraz wybór ostatniego wpisu są nadal
turniejowe. Po dodaniu etapów zarówno bezpośredni revert, jak i undo muszą
odrzucać operację dotyczącą zamkniętego poprzedniego etapu. Przejście etapu nie
może być operacją undoable.

### 4.5. Generatory i klasyfikacja

| Obszar | Plik/funkcja | Obecne założenie jednoetapowe |
|---|---|---|
| Single Elimination | `generateSingleElimination()` w `routes/tournaments.ts` | Globalny seed gracza, globalne rundy i arytmetyczne połączenie do następnego meczu. |
| Round Robin | `generateRoundRobin()` i `generateRoundRobinSchedule()` | Wszyscy gracze turnieju tworzą jeden harmonogram. Brak grup. |
| Swiss | `generateSwissRound()` i `generateSwissPairings()` | Wszyscy aktywni gracze, wszystkie wcześniejsze mecze turnieju i globalna runda. |
| Klasyfikacja | `calculateStandings()` i `calculateMatchRecordStandings()` | Format z turnieju; wszystkie mecze i wszyscy gracze turnieju. |
| Bracket | `GET /tournaments/{id}/bracket` | Grupowanie tylko po rundzie; brak etapu i grupy. |
| Statystyki | `GET /tournaments/{id}/stats` | Agregat całego turnieju używany jednocześnie jako statystyki etapu. |

Algorytmy Round Robin, Swiss i `series_v1` mogą zostać zachowane. Należy zmienić
ich wejście na jawny zbiór `stageParticipants`, `stageMatches` i konfigurację
etapu. Nie należy dodawać do funkcji ukrytego filtrowania po aktywnym etapie.

### 4.6. OpenAPI

`lib/api-spec/openapi.yaml` opisuje jeden format na `Tournament`, płaski
`TournamentInput`, jeden zestaw `Match`, `Standing` i `Bracket` oraz globalne
operacje `start` i `generate-round`. `Match` nie ma `stageId`, a Backup v2 ma
jedną konfigurację turnieju i płaskie tablice encji.

Zmiana kontraktu wpłynie również na generowane typy i klienty w `lib/api-zod`
oraz pozostałych pakietach generowanych z OpenAPI. Plików wygenerowanych nie
należy poprawiać ręcznie.

### 4.7. Backup v2

`validateBackupV2()` i `importBackupV2()` w
`artifacts/api-server/src/application/backups/backup-v2.ts` zakładają:

- `schemaVersion === 2`;
- jeden format, BO i stan rund na obiekcie turnieju;
- unikalność pary runda/numer meczu w całym backupie;
- płaską listę graczy, meczów, historii i akcji;
- reguły wyniku zależne od `backup.tournament.format`.

Import jest transakcyjny i poprawnie remapuje identyfikatory, co należy
zachować. Frontendowy parser
`artifacts/tournament-manager/src/lib/backup-file.ts` akceptuje wyłącznie v2, a
podgląd importu pokazuje jedną konfigurację.

### 4.8. Frontend

- `create-tournament.tsx` ma pojedynczy wybór formatu, BO, limitu graczy i liczby
  rund Swiss.
- `tournament-detail.tsx` wyświetla globalny format, rundę, klasyfikację,
  drabinkę i podgląd Backupu v2.
- `tournament-host.tsx` prowadzi wszystkie mecze turnieju i pokazuje akcję
  kolejnej rundy na podstawie globalnego formatu Swiss.
- `tournament-audience.tsx`, `tournament-bracket.tsx`, `bracket-view.tsx`,
  `round-robin-view.tsx` i `swiss-rounds-view.tsx` otrzymują jeden format oraz
  globalne rundy.
- dashboard, wyróżniony mecz i asystent nie rozróżniają etapu historycznego od
  aktywnego.

## 5. Podział pól między Tournament i TournamentStage

### 5.1. Pola pozostające w Tournament

| Pole | Decyzja |
|---|---|
| `id`, `name`, `description`, `createdAt` | Pozostają globalne. |
| `status` | Pozostaje jako stan całego turnieju: `draft`, `active`, `completed`. |
| `resultModelVersion` | Pozostaje globalne; wszystkie etapy pierwszej wersji używają `series_v1`. |
| `winnerId` | Pozostaje i oznacza wyłącznie końcowego zwycięzcę turnieju. Etap ma własne zakończenie i opcjonalnego zwycięzcę. |
| `featuredMatchId` | Pozostaje globalne, ale po starcie musi wskazywać mecz aktywnego etapu albo być jawnie historyczne. W pierwszej wersji rekomendowane jest tylko aktywne. |
| dane dostępu, widoczność i wersje haseł | Pozostają globalne dla całego turnieju. |
| limit rejestracji | Nowe, opcjonalne `registrationLimit`; nie należy utożsamiać go z liczbą graczy każdego etapu. |
| `activeStageId` | Nowe pole wskazujące wyłącznie etap o statusie `active`; `NULL` przed startem, między `CompleteStage` i `StartStage` oraz po zakończeniu turnieju. |

### 5.2. Pola przenoszone albo rozdzielane

| Obecne pole Tournament | Model docelowy |
|---|---|
| `format` | `tournament_stages.format` |
| `rankingPolicy` | `tournament_stages.ranking_policy`; polityka jest dobrana do formatu etapu |
| `defaultBestOf` | `tournament_stages.default_best_of`; wartość kopiowana do nowo generowanych meczów jako historyczny snapshot |
| `swissRounds` | `tournament_stages.planned_rounds`, wymagane dla Swiss |
| `currentRound` | `tournament_stages.current_round` |
| `totalRounds` | `tournament_stages.total_rounds`; wyliczane dla SE/RR, planowane dla Swiss |
| `maxPlayers` | Rozdzielone na globalne `registration_limit` i etapowe `participant_count` |
| `players.seed` | `stage_participants.seed` |
| `players.status` | `stage_participants.status`; rekord `players` staje się tożsamością uczestnika turnieju |

Starych kolumn nie należy usuwać w pierwszym wdrożeniu. Powinny zostać
zasilone podczas backfillu, a następnie czasowo działać jako projekcja
kompatybilności tylko do odczytu. Bezterminowe dual-write stworzyłoby dwa źródła
prawdy.

## 6. Rekomendowany model danych

### 6.1. `tournament_stages`

Rekomendowane kolumny:

| Kolumna | Znaczenie i constraint |
|---|---|
| `id` | Klucz główny. |
| `tournament_id` | FK do turnieju, `ON DELETE CASCADE`. |
| `position` | 1–3; unikalne `(tournament_id, position)`. |
| `name` | Nazwa wyświetlana, np. „Swiss” albo „Play-off”. |
| `format` | `swiss`, `round_robin`, `group_stage` albo `single_elimination`. Bez double elimination. |
| `status` | `planned`, `active` albo `completed`. Gotowość do zakończenia jest wyliczana, nie zapisywana jako osobny status. |
| `default_best_of` | Dokładnie 1, 3, 5 albo 7 w walidacji aplikacyjnej; dodatnie i nieparzyste w DB. |
| `participant_count` | Dokładna liczba uczestników etapu, minimum 2. |
| `planned_rounds` | Liczba rund Swiss. Dla RR i SE rundy są wyliczane. |
| `current_round`, `total_rounds` | Runtime etapu, dodatnie albo `NULL` przed startem. |
| `ranking_policy` | `swiss_v1`, `round_robin_v1`, `group_v1` albo `elimination_bracket_v1`, zgodne z formatem. |
| `group_count` | Tylko dla `group_stage`: dokładnie 2 albo 4. |
| `group_size` | Tylko dla `group_stage`: 3–8; `participant_count = group_count * group_size`. |
| `qualification_mode` | `top_n` albo `top_n_per_group`; `none` dla ostatniego etapu. |
| `qualification_count` | Łączna liczba awansujących dla `top_n`. |
| `qualifiers_per_group` | Liczba awansujących z grupy dla `top_n_per_group`. |
| `seeding_policy` | Polityka nadania seedów w kolejnym etapie. |
| `winner_id` | Opcjonalny zwycięzca etapu; nie zastępuje końcowego `tournaments.winner_id`. |
| `started_at`, `completed_at` | Granice czasu etapu. |
| `version` | Licznik do ochrony przed równoległym awansem i zmianą konfiguracji. |

DB powinno wymuszać:

- maksymalnie jeden etap o statusie `active` na turniej przez częściowy unique
  index;
- unikalną pozycję 1–3;
- `single_elimination` wyłącznie na najwyższej pozycji. Ponieważ wymaga to
  odczytu innych wierszy, walidacja powinna być w transakcyjnym serwisie domeny,
  a nie tylko w CHECK;
- `group_stage` nie może być ostatni, ponieważ klasyfikacja jest lokalna dla
  grup i format nie wyłania jednego zwycięzcy turnieju;
- brak zmian konfiguracji któregokolwiek etapu po przejściu turnieju z `draft`
  do `active`;
- dokładnie jeden do trzech etapów w momencie startu.

Faza grupowa jest osobnym formatem `group_stage`. Wewnątrz każdej grupy używa
generatora Round Robin, ale ma odrębne reguły konfiguracji, klasyfikacje per
grupa i cross-seeding. Dozwolone są 2 albo 4 grupy równej wielkości, po 3–8
uczestników. Każda para w grupie gra dokładnie raz, bez rewanżów. Awansuje 1 albo
2 uczestników z każdej grupy; nie ma najlepszych trzecich miejsc.

### 6.2. `stage_participants`

Rekomendowane kolumny:

| Kolumna | Znaczenie |
|---|---|
| `stage_id`, `player_id` | Złożony PK; jeden udział gracza w etapie. |
| `tournament_id` | Denormalizacja potrzebna do złożonych FK potwierdzających wspólny turniej. |
| `seed` | Seed tylko w tym etapie; unikalny w etapie. |
| `group_id` | Opcjonalne przypisanie do grupy. |
| `status` | `active`, `eliminated`, `qualified`, `winner`. |
| `final_rank` | Utrwalona pozycja Swiss/RR; dla `group_stage` nie tworzy się sztucznego rankingu między grupami. |
| `group_rank` | Całkowita pozycja we własnej grupie; tylko `group_stage`. |
| `qualification_rank` | Kolejność awansu do następnego etapu. |
| `next_stage_seed` | Seed zamrożony przez `CompleteStage` dla następnego etapu. |
| `source_stage_participant_id` | Pochodzenie udziału w etapie 2/3; `NULL` dla etapu 1. |
| `qualified_at` | Czas utrwalenia kwalifikacji. |

`players` zachowuje wyłącznie tożsamość i dane prezentacyjne. Bilanse nie powinny
być materializowane ani kopiowane — nadal mają być wyliczane z meczów, ale po
`stage_id`.

### 6.3. `stage_groups`

Rekomendowane kolumny:

| Kolumna | Znaczenie |
|---|---|
| `id`, `stage_id` | Grupa należy do jednego etapu. |
| `position` | Stabilny numer grupy; unikalny w etapie. |
| `name` | Np. „Grupa A”. |
| `participant_count` | Dokładny rozmiar grupy, wspólny dla wszystkich grup etapu, od 3 do 8. |
| `qualifiers_count` | Dokładnie 1 albo 2, wspólne dla wszystkich grup etapu. |
| `created_at` | Audyt utworzenia. |

Przynależność uczestnika przechowuje `stage_participants.group_id`. Mecz fazy
grupowej również powinien mieć `group_id`, aby DB i zapytania nie opierały się
na pośrednim wnioskowaniu z uczestników.

### 6.4. `matches.stage_id`

`matches` powinno otrzymać:

- obowiązkowe `stage_id`;
- opcjonalne `stage_group_id` dla fazy grupowej;
- zachowane `tournament_id` dla autoryzacji i wydajnych list, ze złożonym FK
  gwarantującym, że mecz i etap należą do tego samego turnieju;
- FK uczestników, które dodatkowo gwarantują ich obecność w
  `stage_participants` danego etapu;
- `best_of` jako snapshot konfiguracji etapu w chwili wygenerowania meczu.

Unikalność rund i numerów musi obejmować etap. Najprostszy bezpieczny wariant to
unikalne `(stage_id, round, match_number)` i przydzielanie numerów globalnie w
obrębie etapu, również dla grup. Jeśli produkt wymaga numeracji od 1 w każdej
grupie, potrzebne są dwa indeksy częściowe dla meczów z grupą i bez grupy.

`next_match_id` może pozostać, ale docelowo Single Elimination powinno zapisywać
jawne połączenie drabinki zamiast odtwarzać je wyłącznie z arytmetyki rundy i
numeru. Następny mecz musi zawsze należeć do tego samego etapu.

### 6.5. Historia, log i przejście

Rekomendowane jest dodanie `stage_id` do `result_history` i opcjonalnego
`stage_id` do `action_log`. Dla wyniku meczu etap można odtworzyć przez FK, lecz
jawny snapshot upraszcza backup, raporty i kontrolę integralności. Akcje globalne
mogą mieć `stage_id = NULL`.

Warto dodać tabelę `stage_transitions`:

| Kolumna | Znaczenie |
|---|---|
| `id`, `tournament_id` | Identyfikacja operacji. |
| `source_stage_id`, `revision` | Kolejne próby zakończenia po revercie są zachowane jako rewizje. |
| `target_stage_id` | Następny etap albo `NULL` przy końcu turnieju. |
| `qualification_policy_snapshot` | Bezpieczny snapshot jawnych parametrów reguły, nie dowolny kod. |
| `completed_at` | Czas atomowego `CompleteStage`. |
| `invalidated_at` | Ustawione, gdy wynik cofnięto przed uruchomieniem celu. |
| `target_started_at` | Ustawiane dopiero przez osobne `StartStage`; wcześniej `NULL`. |

Częściowy unique index dopuszcza najwyżej jeden nieunieważniony snapshot na
`source_stage_id`. Tabela wraz z `source_stage_participant_id`, finalnym rankiem
i seedem docelowym tworzy audytowalny dowód, dlaczego dana osoba znalazła się w
kolejnym etapie.

## 7. Statystyki, klasyfikacja i seedy

1. Każde wywołanie klasyfikacji otrzymuje uczestników i mecze jednego etapu.
2. `matchWins`, `matchLosses`, bilans gier, game difference, head-to-head i
   Buchholz są liczone od zera dla wybranego etapu.
3. Swiss bye jest wygraną meczu bez wygranych gier zgodnie z `series_v1`;
   eliminacyjny bye pozostaje wyłącznie awansem strukturalnym.
4. `no_contest` nie zmienia bilansu. Ranking pozostaje całkowity dzięki dalszym
   tie-breakom i unikalnemu seedowi etapu.
5. Finalna klasyfikacja etapu jest obliczana ponownie w transakcji
   `CompleteStage` i
   utrwalana jako `final_rank`/`qualification_rank`.
6. `StartStage` kopiuje do kolejnego etapu `player_id`, źródłowy udział i
   wyliczony seed. Żaden licznik z poprzedniego etapu nie wpływa na nową
   klasyfikację.
7. Ewentualny widok „statystyki całego turnieju” może później sumować etapy jako
   osobną projekcję informacyjną, ale nie może być źródłem kwalifikacji.

Zatwierdzone polityki rankingu i seedowania pierwszej wersji:

- Swiss: `matchWins`, Buchholz, `gameDiff`, `gameWins`, seed etapu;
- Round Robin: `matchWins`, head-to-head tylko dla dokładnie dwóch remisujących,
  `gameDiff`, `gameWins`, seed etapu;
- `group_stage`: ten sam ranking co Round Robin, liczony osobno w każdej grupie;
- Single Elimination: awans wynika z drabinki, a zwycięzca finału jest zwycięzcą
  etapu i turnieju;

- `standings_order`: seed 1..N według finalnej klasyfikacji źródła;
- `preserve_incoming_seed`: tylko gdy awansują wszyscy i klasyfikacja nie ma
  wpływać na rozstawienie;
- `snake_groups`: wejściowe seedy są rozdzielane po grupach w układzie
  wahadłowym;
- `cross_group`: kwalifikanci grup są układani według zatwierdzonej macierzy z
  sekcji 10.3, tak aby gracze tej samej grupy mogli spotkać się ponownie
  najwcześniej w finale.

Seed etapu jest obowiązkowy i unikalny, dlatego wymienione rankingi zawsze dają
kolejność całkowitą. V1 nie ma baraży ani ręcznego wyboru kwalifikantów.

## 8. CompleteStage i osobne uruchomienie kolejnego etapu

### 8.1. Lifecycle

```text
Tournament: draft -> active -> completed

Stage 1: planned -> active -> completed
                                  |
                                  +-- przerwa między etapami
                                      activeStageId = NULL
Stage 2: planned -----------------> active -> completed
```

Gotowość do zakończenia jest wyliczana przez podgląd kwalifikacji, a nie
zapisywana jako osobny status. Ostatni CompleteMatch pozostawia etap `active`.
Organizator sprawdza podgląd i wywołuje `CompleteStage`. Kolejny etap pozostaje
`planned` do osobnego `StartStage`.

### 8.2. Read-only podgląd kwalifikacji

Podgląd:

1. działa tylko dla aktywnego etapu;
2. weryfikuje kompletność rund i meczów właściwą dla formatu;
3. wylicza całkowity ranking według zatwierdzonej polityki;
4. pokazuje kwalifikantów, źródłową pozycję oraz proponowany seed kolejnego
   etapu;
5. dla `group_stage` pokazuje pozycję w grupie i przyszły slot cross-seedingu;
6. nie wykonuje DDL/DML i nie rezerwuje wyniku na później.

### 8.3. Atomowe `CompleteStage`

Operacja organizatora powinna:

1. zablokować `tournaments` i aktywny `tournament_stages` przez `FOR UPDATE`;
2. potwierdzić `activeStageId`, status `active` oraz oczekiwaną `version` etapu;
3. zablokować mecze i uczestników etapu;
4. sprawdzić kompletność:
   - Swiss: istnieje dokładnie planowana liczba rund i wszystkie są zakończone;
   - Round Robin: wszystkie pary rozegrały dokładnie jeden mecz;
   - `group_stage`: każda para w każdej grupie rozegrała dokładnie jeden mecz i
     nie ma meczu między grupami;
   - Single Elimination: finał i wszystkie wymagane węzły są rozstrzygnięte;
   - `pending`, `in_progress`, `postponed` i `cancelled` blokują zakończenie;
5. ponownie wyliczyć ranking i kwalifikację na transakcyjnym snapshotcie;
6. utrwalić `final_rank` albo `group_rank`, `qualification_rank`, status
   kwalifikacji, źródło oraz proponowany seed dla następnego etapu;
7. utworzyć dokładnie jeden aktywny `stage_transitions` jako zamrożony snapshot
   tej rewizji zakończenia;
8. ustawić etap na `completed`, `completed_at` i `activeStageId = NULL`;
9. jeżeli to ostatni etap, ustawić turniej `completed` oraz końcowego
   `winner_id`; w innym przypadku pozostawić turniej `active`;
10. zapisać nieodwracalny wpis audytowy `stage_completed` i zatwierdzić
    transakcję.

`CompleteStage` nie tworzy uczestników, grup ani meczów następnego etapu i go
nie aktywuje. Błąd wycofuje ranking, kwalifikację, snapshot i status etapu.
Częściowa unikalność jednego nieunieważnionego snapshotu źródła oraz kontrola
wersji zapewniają, że dwa równoległe żądania nie zakończą etapu dwukrotnie.

### 8.4. Atomowe `StartStage`

Osobna operacja organizatora:

1. blokuje turniej, poprzedni ukończony etap i docelowy etap `planned`;
2. potwierdza brak innego aktywnego etapu i brak wcześniejszego uruchomienia
   celu;
3. odczytuje wyłącznie zamrożony snapshot `CompleteStage`;
4. tworzy `stage_participants` z `player_id`, źródłem kwalifikacji i nowym
   seedem;
5. dla `group_stage` tworzy 2 albo 4 grupy i wykonuje snake seeding;
6. generuje harmonogram, drabinkę albo pierwszą rundę Swiss oraz systemowe bye;
7. ustawia etap `active`, `started_at`, `activeStageId` i
   `stage_transitions.target_started_at`;
8. zapisuje akcję `stage_started` i zatwierdza transakcję.

Każdy błąd pozostawia docelowy etap `planned`, bez częściowych uczestników i
meczów. Wspólna kolejność blokad wszystkich mutacji to: turniej, etap(y), mecz,
uczestnicy etapu, gracze.

## 9. Revert po dodaniu etapów

Revert wyniku aktywnego etapu zachowuje obecne zabezpieczenia downstream, lecz
wszystkie zapytania są ograniczone do `stage_id` i aktualizują
`stage_participants.status`.

Po `CompleteStage`, ale przed `StartStage`, organizator może cofnąć wynik
ukończonego etapu. Ta jedna transakcja:

- potwierdza, że następny etap nadal jest `planned` i nie ma uczestników ani
  meczów;
- oznacza niewykorzystany snapshot jako unieważniony i czyści zamrożone pola
  kwalifikacji;
- ponownie ustawia źródłowy etap `active` i `activeStageId`;
- dla ostatniego etapu ponownie otwiera turniej i usuwa końcowego zwycięzcę;
- cofa wynik zgodnie z obecnymi regułami formatu.

Po uruchomieniu następnego etapu każda próba cofnięcia wyniku poprzedniego etapu
zwraca 409 `STAGE_ALREADY_ADVANCED`. Nie usuwa się uczestników, seedów, grup ani
meczów następnego etapu i nie wykonuje cascade revert. Ten sam guard obowiązuje
`undo-last`; zakończenie/uruchomienie etapu nie jest zwykłą operacją undoable.

## 10. Obsługiwane kombinacje

### 10.1. Swiss -> Single Elimination

1. Swiss kończy wszystkie zaplanowane rundy.
2. Klasyfikacja używa kolejno: `matchWins`, Buchholz, `gameDiff`, `gameWins`,
   seed etapu.
3. Awansuje top N; seed play-off odpowiada pozycji Swiss.
4. Drabinka standardowo zestawia seed 1 z najniższym seedem.
5. N będące potęgą dwójki daje pełną drabinkę. Dla pozostałych wartości v1
   zachowuje obecny mechanizm eliminacyjnych bye, które nie zmieniają bilansu.

### 10.2. Swiss -> grupy

1. Awansuje top N klasyfikacji Swiss.
2. Uczestnicy otrzymują nowe seedy 1..N.
3. Są rozdzielani do grup metodą snake, aby równoważyć siłę grup.
4. `group_stage` ma 2 albo 4 grupy, każda po 3–8 uczestników.
5. N dzieli się bez reszty przez liczbę grup; wszystkie grupy są równe.
6. Każda grupa generuje własny pojedynczy Round Robin: dokładnie jeden mecz
   każdej pary i brak rewanżów.
7. Awansuje dokładnie 1 albo 2 uczestników z każdej grupy.

Snake seeding ma pierwszeństwo przed unikaniem powtórnego spotkania z etapu
Swiss. Etapy są niezależne, więc v1 nie optymalizuje przydziału grup na podstawie
historii poprzedniej fazy. Nie ma nierównych grup ani najlepszych trzecich miejsc.

### 10.3. grupy -> Single Elimination

1. Z każdej grupy awansuje skonfigurowane top 1 albo top 2.
2. Ranking w grupie to: `matchWins`, head-to-head tylko dla dokładnie dwóch
   remisujących, `gameDiff`, `gameWins`, seed etapu.
3. Klasyfikacje są lokalne dla grupy; nie porównuje się bilansów między grupami.
4. Dwie grupy i jeden kwalifikant: finał A1-B1.
5. Dwie grupy i dwóch kwalifikantów: półfinały A1-B2 oraz B1-A2.
6. Cztery grupy i jeden kwalifikant: półfinały A1-B1 oraz C1-D1.
7. Cztery grupy i dwóch kwalifikantów: ćwierćfinały w dokładnej kolejności
   drabinki:
   - QF1: A1-B2;
   - QF2: C1-D2;
   - QF3: B1-A2;
   - QF4: D1-C2.

QF1 i QF2 zasilają pierwszy półfinał, a QF3 i QF4 drugi. Dzięki temu dwie osoby
z tej samej grupy znajdują się w przeciwnych połowach drabinki i mogą zagrać
ponownie najwcześniej w finale. Wygenerowany seed SE odpowiada slotowi tej
macierzy, a nie porównaniu bilansów między grupami.

### 10.4. Round Robin -> Single Elimination

Awansuje top N klasyfikacji, a seed play-off odpowiada finalnemu miejscu.
Ranking to: `matchWins`, head-to-head tylko dla dokładnie dwóch remisujących,
`gameDiff`, `gameWins`, seed etapu. Unikalny seed domyka porządek bez barażu ani
ręcznej kwalifikacji.

### 10.5. Swiss -> grupy -> play-off

To złożenie dwóch opisanych przejść. Każda granica ma osobne `CompleteStage` i
`StartStage`. Etap grupowy nie dziedziczy bilansu Swiss, a play-off nie
dziedziczy bilansu grup; przenosi uczestnika, źródło kwalifikacji i seed z
macierzy cross-seedingu.

## 11. OpenAPI i warstwa aplikacyjna

### 11.1. Nowe zasoby

OpenAPI powinno zdefiniować co najmniej:

- `TournamentStage` i `TournamentStageInput`;
- `StageParticipant`;
- `StageGroup`;
- `StageQualificationRule` i `StageSeedingPolicy` jako zamknięte unie/enums;
- `StageTransition` oraz podgląd kwalifikantów;
- `Match.stageId` i opcjonalne `Match.stageGroupId`;
- `Bracket.stageId`, `Standing.stageId` i opcjonalne `groupId`.

Rekomendowane endpointy:

- `GET /tournaments/{id}/stages`;
- `GET /tournaments/{id}/stages/{stageId}`;
- `POST /tournaments/{id}/start` — atomowo uruchamia etap 1;
- `POST /tournaments/{id}/stages/{stageId}/generate-round` — tylko Swiss;
- `GET /tournaments/{id}/stages/{stageId}/qualification-preview`;
- `POST /tournaments/{id}/stages/{stageId}/complete` — atomowe `CompleteStage`;
- `POST /tournaments/{id}/stages/{stageId}/start` — osobne `StartStage`; dla
  pierwszego etapu może być użyte przez istniejący start turnieju;
- istniejące `matches`, `standings`, `bracket`, `stats` przyjmują `stageId` albo
  otrzymują odpowiedniki stage-scoped.

CompleteMatch i RevertMatch nadal mogą identyfikować mecz przez `matchId`, ale
serwer musi sam odczytać `stageId` i zweryfikować aktywny etap. Klient nie może
wybrać kontekstu etapu sprzecznego z rekordem meczu.

### 11.2. Zgodność endpointów

W okresie przejściowym istniejące odczyty bez `stageId` powinny:

- dla turnieju jednoetapowego zwracać jego jedyny etap;
- dla turnieju wieloetapowego domyślnie zwracać aktywny etap, a po zakończeniu
  ostatni etap;
- zwracać także jawny `resolvedStageId`, aby klient nie zgadywał;
- nie łączyć meczów ani statystyk z wielu etapów.

Stare mutacje konfiguracji `PATCH /tournaments/{id}` muszą przestać przyjmować
format/BO/rundy po rozpoczęciu. Konfiguracja etapów powinna mieć osobne endpointy
dostępne tylko w stanie draft.

## 12. Kreator 1-3 etapów

Rekomendowany kreator:

1. **Dane turnieju** — nazwa, opis, widoczność, hasła i globalny limit
   rejestracji.
2. **Plan etapów** — wybór od jednego do trzech etapów, kolejność oraz nazwy.
3. **Konfiguracja etapów** — dla każdego: format, BO, liczba uczestników,
   rundy Swiss lub grupy, reguła awansu i seeding.
4. **Walidacja przejść** — podgląd liczby kwalifikantów i uczestników następnego
   etapu, drabinki/byes oraz niespójności.
5. **Podsumowanie** — nieedytowalny plan przed utworzeniem turnieju.

Walidacje kreatora:

- 1–3 etapy;
- SE tylko na końcu;
- `group_stage` nie może być ostatni;
- BO wyłącznie 1/3/5/7;
- etap następny ma dokładnie tylu uczestników, ilu kwalifikuje poprzedni;
- liczba graczy nie rośnie między etapami;
- liczba rund Swiss jest dodatnia;
- `group_stage` ma 2 albo 4 równe grupy po 3–8 osób, a liczba uczestników dzieli
  się przez liczbę grup;
- z każdej grupy awansuje 1 albo 2 uczestników;
- ostatni etap nie ma reguły awansu;
- pierwszy etap nie ma źródła kwalifikacji;
- SE po grupach ma dokładnie jeden z zatwierdzonych układów cross-seedingu;
- jedno BO obowiązuje wszystkie mecze etapu, łącznie z finałem;
- plan musi być kompletny przed dodaniem pierwszego wyniku;
- po starcie cały plan jest read-only.

Obecna ścieżka tworzenia pozostaje domyślnie kreatorem jednego etapu, dzięki
czemu najprostszy przypadek nie staje się trudniejszy.

## 13. Widoki organizatora, prowadzącego i kibica

### 13.1. Organizator

- nagłówek otrzymuje timeline etapów ze stanami: planowany, aktywny i
  zakończony; gotowość do zakończenia jest prezentowaną właściwością aktywnego
  etapu;
- domyślnie otwiera aktywny etap, ale pozwala przeglądać zakończone etapy w
  trybie read-only;
- lista graczy turnieju pozostaje globalna, a osobna lista etapu pokazuje seed,
  grupę, status i kwalifikację;
- gdy etap spełnia warunki, pojawia się read-only podgląd kwalifikantów i jawna
  akcja `Zakończ etap`; po jej sukcesie osobna akcja `Uruchom kolejny etap`;
- po starcie nie ma edycji konfiguracji planu;
- Backup pokazuje wersję 3 i wszystkie etapy.

### 13.2. Prowadzący/support

- kolejka operacyjna zawiera wyłącznie mecze aktywnego etapu;
- CompleteMatch, cancel, restore, swap, reorder i generowanie rund są stage-aware;
- historyczne etapy są tylko do odczytu;
- support zachowuje obecne uprawnienie do prowadzenia, ale nie dostaje prawa do
  zmiany planu, `CompleteStage` ani `StartStage`; obie operacje należą do
  organizatora.

### 13.3. Kibic

- widzi timeline i może przełączać zakończone etapy;
- domyślnie trafia do aktywnego, a po końcu do ostatniego;
- klasyfikacja, mecze, drabinka i bieżąca runda zawsze mają widoczny kontekst
  etapu;
- pozostaje całkowicie read-only;
- zasady `private_online` i `private_offline` nie zmieniają się, ponieważ etap
  dziedziczy dostęp turnieju.

Wybrany etap powinien być zapisany w adresie (`stageId` albo stabilna pozycja),
aby direct URL i refresh nie wracały przypadkowo do aktywnej fazy.

Dashboard, asystent i wyróżniony mecz muszą korzystać z aktywnego etapu.
Historyczny mecz nie może zostać pokazany jako aktualnie prowadzony.

## 14. Backup v3

Wieloetapowe dane wymagają `schemaVersion: 3`. Rekomendowana struktura:

- `tournament` — tylko pola globalne;
- `stages[]` — pełna konfiguracja i stan etapów;
- `players[]` — tożsamości uczestników turnieju;
- `stageParticipants[]` — udział, seed, grupa, finalny rank i źródło;
- `stageGroups[]`;
- `matches[]` — `stageBackupId` oraz opcjonalny `groupBackupId`;
- `resultHistory[]` — stage-aware snapshoty;
- `actionLog[]` — stage-aware wpisy;
- `stageTransitions[]` — utrwalone przejścia i polityki.

Identyfikatory backupowe powinny być niezależne od lokalnych ID, a walidator
przed pierwszym insertem sprawdza:

- 1–3 etapy i ciągłe pozycje;
- najwyżej jeden aktywny etap;
- spójność turniej-etap-grupa-uczestnik-mecz;
- zgodność formatu wyniku z formatem etapu;
- unikalność rund/numerów w etapie;
- brak meczu uczestnika nieobecnego w etapie;
- spójność źródła kwalifikacji i seeda;
- niezmienność przejść oraz brak następcy bez ukończonego poprzednika.

Zgodność:

- eksport nowych danych używa wyłącznie v3;
- importer v3 działa transakcyjnie;
- importer v2 pozostaje obsługiwany i tworzy normalny etap `Etap 1` na podstawie
  pól `tournament`, przypisując do niego wszystkich graczy i mecze;
- Backup v1 pozostaje odrzucany;
- frontendowy parser jest unią rozłączną v2/v3 i pokazuje w podglądzie liczbę
  oraz konfigurację etapów.

Po wdrożeniu etapów eksport zawsze generuje v3, także dla turnieju
jednoetapowego. Nie należy generować v2 ani spłaszczać historii.

## 15. Migracja istniejących turniejów jednoetapowych

Migracja powinna być niedestrukcyjna i etapowa:

1. dodać enumy/tabele etapów oraz nullable `matches.stage_id`;
2. dla każdego turnieju utworzyć dokładnie jeden normalny etap `Etap 1` o
   pozycji 1;
3. skopiować format, BO, ranking policy, rundy i limit;
4. odwzorować status:
   - draft -> stage `planned`;
   - active -> stage `active`;
   - completed -> stage `completed`;
5. utworzyć `stage_participants` dla wszystkich graczy, kopiując seed i status;
6. przypisać wszystkie mecze i historię do `Etap 1`;
7. ustawić `active_stage_id` dla aktywnych turniejów;
8. dodać nowe FK i indeksy po zweryfikowanym backfillu;
9. ustawić `matches.stage_id NOT NULL`;
10. wdrożyć odczyty stage-aware z fasadą kompatybilności;
11. dopiero w osobnym, późniejszym wdrożeniu usunąć stare pola etapowe z
    `tournaments` i `players`.

Migracja musi zachować ID turniejów, graczy, meczów, historię, akcje, tokeny i
widoczność. Nie wymaga resetu danych `series_v1`. Po przełączeniu odczytów
`TournamentStage` jest jedynym docelowym źródłem prawdy. Kompatybilne pola
`Tournament` mogą istnieć przejściowo, ale nie tworzą osobnego modelu
jednoetapowego.

## 16. Wpływ na obecne testy

### 16.1. Testy domenowe

- `series-result.test.ts` powinien pozostać prawie bez zmian; walidator nadal
  otrzymuje snapshot `match.bestOf`.
- `standings.test.ts` musi jawnie budować dane jednego etapu oraz potwierdzić, że
  mecze innego etapu nie wpływają na wynik.
- `swiss.test.ts` musi używać seedów etapu i historii tylko z etapu.
- `round-robin.test.ts` pozostaje testem zwykłego RR; osobny moduł
  `group-stage.test.ts` obejmuje 2/4 grupy, 3–8 osób, jeden mecz pary, brak
  meczów między grupami i snake seeding.

### 16.2. CompleteMatch/RevertMatch

Obecne testy atomowości, rollbacku, konkurencji, BO, played, walkover,
no contest i bye należy zachować. Dodatkowo wymagane są:

- format i status pobierane z etapu, nie turnieju;
- downstream Single Elimination nigdy nie przekracza `stage_id`;
- aktualizowany jest `stage_participant.status`;
- ostatni wynik pozostawia etap aktywny i tylko umożliwia podgląd kwalifikacji;
- `CompleteStage` atomowo utrwala ranking i kończy etap bez uruchamiania
  następnego;
- `StartStage` atomowo uruchamia następny etap z zamrożonego snapshotu;
- ostatni etap przez `CompleteStage` poprawnie kończy turniej;
- revert w aktywnym etapie działa;
- revert ukończonego etapu przed `StartStage` ponownie go otwiera i unieważnia
  niewykorzystany snapshot;
- revert i undo poprzedniego etapu po `StartStage` zwracają 409 bez skutków;
- race CompleteMatch/CompleteStage, revert/CompleteStage i
  CompleteStage/StartStage pozostawia jeden poprawny stan;
- rollback CompleteStage nie pozostawia częściowego rankingu ani kwalifikacji;
- rollback StartStage nie pozostawia uczestników, grup, meczów ani bye;
- dwa równoległe CompleteStage i dwa równoległe StartStage mają po jednym
  sukcesie.

### 16.3. Integracje formatów

Wymagana macierz:

- Swiss -> SE, w tym N z bye;
- Swiss -> grupy, snake seeding i reset bilansu;
- grupy -> SE dla 2/4 grup oraz 1/2 kwalifikantów, z dokładnym cross-seedingiem;
- RR -> SE;
- Swiss -> grupy -> SE;
- single-stage SE, RR i Swiss jako regresja zgodności;
- blokada SE na pozycji innej niż ostatnia;
- blokada czwartego etapu i edycji konfiguracji po starcie;
- walidacja grup równych, podzielności, rozmiaru 3–8, braku rewanżów i braku
  najlepszych trzecich miejsc;
- ranking Swiss i RR/group kończący zawsze na unikalnym seedzie etapu;
- head-to-head użyty wyłącznie dla dokładnie dwóch remisujących;
- zakończenie ostatniej rundy Swiss i zamknięcie etapu/turnieju.

### 16.4. API, dostęp i backup

- nowe endpointy etapów muszą wejść do macierzy anonymous/viewer/support/host/
  organizer;
- podgląd etapów dziedziczy politykę widoczności turnieju;
- `CompleteStage` i `StartStage` są dostępne wyłącznie dla organizatora;
- v3 round-trip zachowuje wszystkie etapy, grupy, seedy, kwalifikacje, historię
  i klasyfikację;
- import v2 tworzy jeden etap bez zmiany klasyfikacji;
- v1 nadal jest odrzucany;
- błędne odwołania między etapami są odrzucane przed insertem;
- codegen OpenAPI nie może zostawiać diffu.

### 16.5. Migracja i frontend

- `migration.integration.test.ts` musi zweryfikować backfill dla draft, active i
  completed oraz zachowanie istniejących ID i wyników;
- testy UI kreatora obejmują 1–3 etapy, walidację liczby kwalifikantów, SE na
  końcu i blokadę edycji;
- widoki organizatora, hosta i kibica testują wybór etapu, direct URL/refresh,
  read-only historii i kolejkę tylko aktywnego etapu;
- `backup-file.test.ts` obejmuje v2, v3 i odrzucenie v1.

## 17. Ponowna klasyfikacja ryzyk

### BLOCKER — 0

Reguły rankingu domykają kolejność przez unikalny seed etapu. Format grupowy,
liczebność, kwalifikacja i cross-seeding są zamknięte. Nie pozostała decyzja,
która uniemożliwia rozpoczęcie implementacji.

### HIGH — 6

1. Obecne `start` nie jest transakcyjne; `StartStage` nie może powielać tego
   wzorca.
2. Globalne `players.seed/status` uszkodziłyby historię etapów, jeśli nie zostaną
   zastąpione przez `stage_participants`.
3. CompleteMatch/RevertMatch i generatory filtrują dziś po turnieju. Każde
   pominięcie `stage_id` może połączyć rundy lub statystyki różnych etapów.
4. Undo może ominąć granicę etapu, jeśli nie dostanie tego samego guardu co
   bezpośredni RevertMatch.
5. Backup v2 nie reprezentuje etapów; eksport musi przejść na v3 przed
   udostępnieniem wieloetapowego kreatora.
6. Finalizacja Swiss nie ma obecnie pełnego odpowiednika RR/SE; CompleteStage
   musi być wspólną, jedyną ścieżką finalizacji etapu.

### MEDIUM — 5

1. `featuredMatchId`, dashboard, asystent, statystyki i log akcji mogą pokazywać
   etap historyczny jako bieżący.
2. Pola kompatybilności mogą stać się drugim źródłem prawdy, jeśli nie będą
   wyłącznie przejściową projekcją.
3. Jawne `nextMatchId` i stage-scoped FK są bezpieczniejsze niż obecna arytmetyka
   drabinki.
4. Podzielność, rozmiar grup, jeden mecz pary i macierz cross-seedingu wymagają
   walidacji w domenie, DB i imporcie, aby nie powstały trzy różne interpretacje.
5. Zmiana OpenAPI ma szeroki fan-out na generowane typy, klienta i wszystkie
   widoki.

### LOW — 3

1. Nazwy etapów domyślnie przyjmują `Etap N`; można je edytować tylko w draft.
2. Historyczny wybór etapu powinien mieć stabilny URL, inaczej refresh zmieni
   kontekst.
3. Po zakończeniu turnieju domyślnie pokazywany jest ostatni etap. Przekrojowe
   statystyki mogą później powstać jako widok informacyjny, nie rankingowy.

## 18. Etapowy plan implementacji

### Etap 0 — ADR

Zamknąć dokumentację normatywną w `ADR_TOURNAMENT_STAGES_V1.md`. Ten krok jest
zrealizowany przez obecne zadanie.

### Etap 1 — kontrakt domenowy i walidatory planu

Wprowadzić czyste typy/enums i funkcje bez dostępu do DB: walidację 1–3 etapów,
BO, formatu, przepływu liczby uczestników, grup, kwalifikacji, SE na końcu,
rankingów oraz generator slotów cross-seedingu. Dodać wyłącznie testy jednostkowe.

### Etap 2 — schemat i migracja jednoetapowa

Dodać `tournament_stages`, `stage_participants`, `stage_groups`,
`stage_transitions`, `matches.stage_id` i FK. Backfill tworzy `Etap 1`, przypisuje
mecze i zachowuje dane. W tym samym ograniczonym wdrożeniu ścieżki tworzące
turniej i mecze muszą zapisywać normalny etap, aby `stage_id NOT NULL` nie
pozostawił okna niespójności.

### Etap 3 — stage-scoped domena jednoetapowa

Przenieść CompleteMatch, RevertMatch, undo, generatory, standings, bracket i
stats na jawny kontekst etapu. Zachować zachowanie wszystkich turniejów
jednoetapowych i dodać testy izolacji danych dwóch etapów.

### Etap 4 — CompleteStage i StartStage bez grup

Dodać podgląd kwalifikacji, atomowe CompleteStage i osobne StartStage dla
Swiss/RR -> Swiss/RR/SE. Objąć concurrency, rollback, idempotencję i revert przed
oraz po uruchomieniu kolejnego etapu.

### Etap 5 — `group_stage`

Dodać grupy 2/4, rozmiar 3–8, snake assignment, harmonogram jednego RR,
kwalifikację 1/2 i cztery zatwierdzone warianty cross-seedingu.

### Etap 6 — OpenAPI i Backup v3

Ustabilizować kontrakty, wygenerować klientów, dodać eksport/import v3 i import
v2 do `Etap 1`. Backup v3 musi być gotowy przed zapisaniem produkcyjnego
turnieju wieloetapowego.

### Etap 7 — kreator i widoki

Dodać kreator, timeline, wybór etapu, podgląd kwalifikacji i stage-aware widoki
organizatora, prowadzącego oraz kibica. Włączyć blokadę całej konfiguracji po
starcie.

### Etap 8 — hardening i usunięcie projekcji kompatybilności

Wykonać pełny review, test migracji na kopii, Backup v3 round-trip i smoke testy.
Po okresie zgodności usunąć stare pola etapowe z `tournaments` i `players` w
osobnej migracji.

## 19. Zamknięte decyzje wykonawcze

- Nazwa migracyjna i domyślna nazwa nowego etapu to `Etap N`.
- Snake seeding ma pierwszeństwo przed unikaniem rewanżu z poprzedniego etapu.
- SE dopuszcza istniejący mechanizm systemowych bye dla liczby niebędącej
  potęgą dwójki.
- `no_contest` nie wpływa na bilans; kolejne tie-breaki i seed nadal tworzą
  całkowity ranking.
- CompleteStage i StartStage są wyłącznie operacjami organizatora.
- Nie ma ręcznej zmiany kwalifikantów ani barażu w v1.
- Jedno BO obowiązuje każdy mecz etapu, także finał.
- Po zakończeniu domyślny widok pokazuje ostatni etap.

## 20. Pierwsze ograniczone zadanie programistyczne

Pierwsze zadanie powinno implementować wyłącznie **czysty kontrakt domenowy
konfiguracji etapów i jego testy jednostkowe**:

1. typy/enums `StageFormat`, `StageRankingPolicy`, `StageQualificationRule` i
   `StageSeedingPolicy`;
2. `validateTournamentStagePlan()` dla 1–3 etapów, blokady SE i przepływu liczby
   uczestników;
3. walidację BO1/3/5/7 i braku osobnego BO finału;
4. walidację `group_stage`: 2/4 grupy, 3–8 osób, podzielność, 1/2
   kwalifikantów;
5. czyste funkcje całkowitego rankingu Swiss oraz RR/group zgodne z ADR;
6. `buildGroupPlayoffSlots()` dla 2/4 grup i 1/2 kwalifikantów;
7. testy wszystkich poprawnych i błędnych konfiguracji oraz dokładnej kolejności
   slotów cross-seedingu.

Poza zakresem pierwszego zadania pozostają DB, migracje, API, CompleteStage,
StartStage, Backup i frontend. Takie rozcięcie najpierw utrwala zatwierdzone
reguły jako wykonywalny kontrakt, bez ryzyka dla istniejących turniejów.

## 21. Werdykt

**GOTOWE DO IMPLEMENTACJI**

Model danych, lifecycle, całkowite rankingi, przepływ uczestników, faza grupowa,
cross-seeding, revert, migracja i Backup v3 są jednoznaczne. BLOCKER: 0.
Implementację należy rozpocząć od ograniczonego kontraktu domenowego z sekcji 20,
a dopiero później zmieniać trwały model danych i ścieżki produktu.
