# ADR: system etapów turnieju v1

## Status

Zaakceptowany projekt produktu. Dokument opisuje normatywny model do
implementacji; nie oznacza, że zmiany schematu, API lub UI zostały już wdrożone.

## Kontekst

Tournament Manager obsługuje dziś jeden format i jeden przebieg rywalizacji na
turniej. Format, BO, rundy, seed, status uczestnika i klasyfikacja są związane z
rekordem turnieju albo globalnym rekordem gracza. Produkt ma obsługiwać od
jednego do trzech kolejnych etapów, np. Swiss BO1 -> Single Elimination BO3 albo
Swiss BO1 -> group stage BO3 -> play-off BO5.

System pozostaje oparty na `series_v1`: wynik serii oznacza liczbę wygranych
gier/map/partii, nie gole; nie ma remisu całego meczu ani punktów 3/1/0. Double
elimination pozostaje poza zakresem.

Szczegółową mapę obecnego kodu i ryzyk zawiera
`docs/AUDYT_SYSTEMU_ETAPOW_TURNIEJU.md`.

## 1. Decyzje nadrzędne

1. Turniej ma od jednego do trzech etapów o ciągłych pozycjach 1..N.
2. Każdy turniej, również jednoetapowy, korzysta z `TournamentStage`.
3. W danej chwili istnieje najwyżej jeden aktywny etap.
4. Między zakończeniem etapu i uruchomieniem następnego może nie być aktywnego
   etapu, mimo że turniej nadal jest aktywny.
5. Cała konfiguracja wszystkich etapów zostaje zablokowana w chwili rozpoczęcia
   turnieju.
6. Każdy etap ma własny format, BO, rundy, ranking, liczbę uczestników, regułę
   kwalifikacji i seeding.
7. Statystyki i wyniki nie przechodzą między etapami.
8. Przechodzą wyłącznie uczestnik, źródło kwalifikacji i nowy seed.
9. Organizator osobno kończy etap przez `CompleteStage` i osobno uruchamia
   następny przez `StartStage`.
10. Single Elimination może być tylko ostatnim etapem.
11. `group_stage` nie może być ostatnim etapem, ponieważ ranking jest lokalny dla
    grup i nie wyłania jednego zwycięzcy całego turnieju.
12. Nie ma cascade revert między etapami.
13. Wszystkie mecze etapu, łącznie z finałem, korzystają z jednego stage BO.
14. V1 nie ma baraży, ręcznego wyboru kwalifikantów ani ręcznego override seeda.

## 2. Model danych

### 2.1. Tournament

`Tournament` jest globalnym agregatem organizacyjnym. Docelowo przechowuje:

- identyfikator, nazwę, opis i czas utworzenia;
- widoczność, hasła, tokeny i konfigurację dostępu;
- `resultModelVersion = series_v1`;
- status `draft | active | completed`;
- opcjonalny globalny limit rejestracji;
- `activeStageId`, wskazujące wyłącznie etap `active`;
- `winnerId`, oznaczające wyłącznie końcowego zwycięzcę turnieju;
- opcjonalny `featuredMatchId`, który w v1 musi wskazywać mecz aktywnego etapu.

Format, ranking, BO, rundy i etapowa liczba uczestników nie są docelowo polami
`Tournament`. Kompatybilne kolumny mogą pozostać na czas migracji, ale są tylko
projekcją i nie mogą stać się równoległym źródłem prawdy.

### 2.2. TournamentStage

`TournamentStage` zawiera:

| Pole | Reguła v1 |
|---|---|
| `id`, `tournamentId` | Etap należy do dokładnie jednego turnieju. |
| `position` | 1–3, unikalne w turnieju. |
| `name` | Domyślnie `Etap N`; edytowalne tylko w draft. |
| `format` | `swiss`, `round_robin`, `group_stage`, `single_elimination`. |
| `status` | `planned`, `active`, `completed`. |
| `participantCount` | Dokładna liczba uczestników etapu. |
| `defaultBestOf` | Dokładnie 1, 3, 5 albo 7; dotyczy także finału. |
| `plannedRounds` | Dodatnia liczba rund Swiss; dla pozostałych formatów `NULL`. |
| `currentRound`, `totalRounds` | Runtime etapu; rundy RR/group/SE są wyliczane. |
| `rankingPolicy` | Jedna z czterech polityk zgodna z formatem. |
| `qualificationMode` | `top_n`, `top_n_per_group` albo `none`. |
| `qualificationCount` | Liczba top N dla Swiss/RR. |
| `groupCount`, `groupSize` | Tylko `group_stage`: 2/4 oraz 3–8. |
| `qualifiersPerGroup` | Tylko `group_stage`: 1 albo 2. |
| `seedingPolicy` | `standings_order`, `snake_groups` albo `cross_group`. |
| `winnerId` | Zwycięzca etapu końcowego albo top 1 końcowego Swiss/RR. |
| `version` | Ochrona przed równoległą finalizacją/startem. |
| `startedAt`, `completedAt` | Granice lifecycle etapu. |

Gotowość do zakończenia jest wyliczaną właściwością i nie jest osobnym statusem.
Single Elimination musi mieć najwyższą pozycję. `group_stage` musi mieć
następcę. Ostatni etap ma `qualificationMode = none`; każdy nieostatni ma regułę
kwalifikacji.

### 2.3. StageParticipant

`StageParticipant` opisuje udział globalnego gracza w konkretnym etapie:

| Pole | Znaczenie |
|---|---|
| `id` albo `(stageId, playerId)` | Jeden udział gracza w etapie. |
| `tournamentId`, `stageId`, `playerId` | Złożone FK wymuszają wspólny turniej. |
| `seed` | Obowiązkowy, dodatni i unikalny w etapie. |
| `groupId` | Ustawione wyłącznie dla `group_stage`. |
| `status` | `active`, `eliminated`, `qualified`, `winner`. |
| `finalRank` | Całkowita pozycja Swiss/RR; dla `group_stage` nie tworzy się rankingu między grupami. |
| `groupRank` | Pozycja w grupie; tylko `group_stage`. |
| `qualificationRank` | Kolejność kwalifikacji albo slot cross-seedingu. |
| `nextStageSeed` | Zamrożony seed zaproponowany przez `CompleteStage`. |
| `sourceStageParticipantId` | Źródło udziału w etapie 2/3; `NULL` dla etapu 1. |
| `qualifiedAt` | Czas utrwalenia kwalifikacji. |

Tożsamość, nazwa, kraj, drużyna i inne dane prezentacyjne pozostają w `Player`.
Seed i status rywalizacji przestają być globalną cechą gracza.

### 2.4. StageGroup

`StageGroup` istnieje wyłącznie dla `group_stage` i zawiera:

- `id`, `stageId`;
- `position` i stabilną nazwę A–D;
- `participantCount`, wspólne dla wszystkich grup etapu;
- `qualifiersCount`, wspólne i równe 1 albo 2;
- czas utworzenia.

Dozwolone są dokładnie 2 albo 4 grupy. Każda ma 3–8 uczestników. Grupy są równe,
więc `stage.participantCount = groupCount * groupSize`.

### 2.5. Match, historia i przejście

Każdy `Match` ma obowiązkowe `stageId` i opcjonalne `stageGroupId`. Zachowany
`tournamentId` jest denormalizacją do autoryzacji i zapytań, zabezpieczoną
złożonym FK. Uczestnicy meczu muszą istnieć jako `StageParticipant` tego samego
etapu. `bestOf` jest historycznym snapshotem stage BO.

Unikalność rundy i numeru meczu obejmuje co najmniej `(stageId, round,
matchNumber)`. `nextMatchId` w Single Elimination nie może wskazywać poza etap.
`result_history` otrzymuje `stageId`, a `action_log` opcjonalny `stageId`.

`StageTransition` jest audytowalnym snapshotem granicy etapów:

- `sourceStageId`, `targetStageId`;
- `revision` i częściowa unikalność jednego nieunieważnionego snapshotu źródła;
- snapshot polityki oraz uporządkowana lista kwalifikantów/seedów;
- `completedAt`;
- `invalidatedAt`, tylko gdy wynik cofnięto przed startem celu;
- `targetStartedAt`, ustawiane przez osobne `StartStage`.

Po ustawieniu `targetStartedAt` snapshot jest niezmienny.

## 3. Lifecycle turnieju i etapu

### 3.1. Turniej

- `draft`: konfiguracja 1–3 etapów i lista graczy mogą być zmieniane;
- `active`: rozpoczęto etap 1; stan obejmuje także przerwę między etapami;
- `completed`: `CompleteStage` zakończył ostatni etap i ustawił zwycięzcę.

Pierwsze rozpoczęcie turnieju atomowo blokuje konfigurację i wykonuje
`StartStage` dla etapu 1.

### 3.2. Etap

- `planned`: konfiguracja zapisana, etap jeszcze nie ma runtime; po starcie
  turnieju konfiguracja nadal jest nieedytowalna;
- `active`: można generować rundy, prowadzić mecze i wyświetlać podgląd
  kwalifikacji;
- `completed`: ranking i kwalifikacja są zamrożone przez `CompleteStage`.

Dozwolone przejścia to `planned -> active -> completed`. Revert po zakończeniu,
ale przed startem następcy, może wykonać kontrolowane `completed -> active` i
unieważnić niewykorzystany snapshot. Po starcie następcy takie przejście jest
zabronione.

## 4. Inwariant jednej aktywnej fazy

Inwariant oznacza **co najwyżej jeden**, nie zawsze dokładnie jeden aktywny etap.
DB wymusza częściowy unique index po `tournamentId` dla `status = active`.

- `Tournament.activeStageId` jest `NULL` w draft, między etapami i po końcu;
- jeśli nie jest `NULL`, wskazany etap należy do tego turnieju i ma status
  `active`;
- `StartStage` sprawdza brak aktywnego etapu i ustawia oba pola w jednej
  transakcji;
- `CompleteStage` ustawia etap `completed` i czyści `activeStageId` w jednej
  transakcji;
- CompleteMatch, RevertMatch, generowanie rund i mutacje harmonogramu dotyczą
  wyłącznie `activeStageId`.

Kolejność blokad we wszystkich mutacjach: turniej, etapy rosnąco po pozycji,
mecz, uczestnicy etapu, globalni gracze.

## 5. Walidacja przepływu liczby uczestników

Plan jest poprawny tylko wtedy, gdy:

1. ma 1–3 etapy o pozycjach bez luk;
2. `participantCount` etapu 1 jest równe liczbie graczy przy jego starcie;
3. dla każdego nieostatniego Swiss/RR:
   `qualificationCount = nextStage.participantCount`, minimum 2 i mniej lub
   równe liczbie uczestników źródła;
4. dla `group_stage`:
   `groupCount` to 2 albo 4, `groupSize` to 3–8,
   `participantCount = groupCount * groupSize`, a liczba graczy dzieli się bez
   reszty przez liczbę grup;
5. `qualifiersPerGroup` to 1 albo 2 i jest mniejsze od `groupSize`;
6. po grupach:
   `nextStage.participantCount = groupCount * qualifiersPerGroup`;
7. ostatni etap ma `qualificationMode = none`;
8. `group_stage` nie jest ostatni, a `single_elimination` jest ostatni;
9. SE po Swiss/RR dopuszcza istniejący system bye, gdy liczba wejściowa nie jest
   potęgą dwójki;
10. wszystkie etapy mają BO1/3/5/7 i nie mają osobnego BO finału.

Walidacja działa w czystej domenie, przy zapisie draftu, ponownie przy starcie,
w imporcie Backupu oraz — gdzie możliwe — przez constrainty DB.

## 6. CompleteStage i StartStage

### 6.1. QualificationPreview

Read-only podgląd organizatora:

- blokuje się logicznie do aktywnego etapu, ale nie wykonuje zapisu;
- sprawdza, czy wszystkie wymagane mecze/rundy są zakończone;
- wylicza pełny ranking, kwalifikantów, źródło i przyszły seed;
- zwraca `stageVersion` i fingerprint wyniku;
- dla grup pokazuje grupę, `groupRank` i slot cross-seedingu.

Podgląd nie jest autorytatywnym snapshotem. CompleteStage zawsze liczy wynik
ponownie w transakcji.

### 6.2. CompleteStage

Tylko organizator może wykonać CompleteStage. Operacja:

1. blokuje turniej, etap, jego mecze i uczestników;
2. sprawdza `activeStageId`, status, oczekiwaną wersję i kompletność formatu;
3. odrzuca etap z meczami `pending`, `in_progress`, `postponed` albo `cancelled`;
4. ponownie wylicza całkowity ranking;
5. utrwala `finalRank`, kwalifikację, źródło i `nextStageSeed`;
6. zapisuje nową rewizję `StageTransition`;
7. ustawia etap `completed`, czyści `activeStageId` i zapisuje audyt;
8. dla ostatniego etapu ustawia turniej `completed` oraz zwycięzcę;
9. dla nieostatniego pozostawia turniej `active`, a następny etap `planned`.

CompleteStage nie tworzy danych runtime następnego etapu. Podwójne lub
równoległe żądanie daje dokładnie jeden sukces. Każdy błąd powoduje pełny
rollback.

### 6.3. StartStage

Tylko organizator może uruchomić następny etap. StartStage:

1. wymaga `planned` i ukończonego bezpośredniego poprzednika;
2. wymaga aktywnego, nieunieważnionego snapshotu kwalifikacji;
3. sprawdza brak innego aktywnego etapu;
4. tworzy uczestników z `playerId`, `sourceStageParticipantId` i zamrożonym
   seedem;
5. tworzy grupy i snake assignment, jeśli format to `group_stage`;
6. generuje pełny RR/group/SE albo pierwszą rundę Swiss oraz systemowe bye;
7. ustawia etap i `activeStageId` oraz oznacza snapshot `targetStartedAt`;
8. zapisuje audyt w tej samej transakcji.

Niepowodzenie nie pozostawia uczestników, grup, meczów, bye ani aktywnego etapu.

## 7. Ranking i kwalifikacja

### 7.1. Swiss

Porządek jest leksykograficzny:

1. `matchWins` malejąco;
2. Buchholz malejąco;
3. `gameDiff` malejąco;
4. `gameWins` malejąco;
5. seed etapu rosnąco.

Swiss bye jest jednym match win bez gier i bez przeciwnika do Buchholza.
Walkower jest match win/loss bez gier. `no_contest` nie zmienia bilansu.

### 7.2. Round Robin i grupa

1. `matchWins` malejąco;
2. jeżeli grupa remisu na `matchWins` zawiera dokładnie dwie osoby, wynik ich
   bezpośredniego meczu; przy braku rozstrzygającego H2H kryterium jest równe;
3. `gameDiff` malejąco;
4. `gameWins` malejąco;
5. seed etapu rosnąco.

Przy trzech lub większej liczbie osób remisujących head-to-head jest całkowicie
pomijany. W `group_stage` ranking jest liczony osobno dla każdej grupy.

Seed jest obowiązkowy i unikalny, więc oba rankingi dają kolejność całkowitą.
Nie ma barażu, losowania ani ręcznej zmiany kwalifikantów.

### 7.3. Single Elimination

Awans i zwycięzca wynikają wyłącznie z drabinki. Bilans może być prezentowany
informacyjnie, ale nie jest rankingiem kwalifikacyjnym. SE jest zawsze ostatnie.

## 8. Reguły `group_stage`

1. Format ma dokładnie 2 albo 4 grupy.
2. Grupy są równe i mają po 3–8 uczestników.
3. Każda para w grupie gra dokładnie jeden mecz.
4. Nie ma rewanżów ani spotkań między grupami.
5. Awansuje 1 albo 2 uczestników z każdej grupy.
6. Nie ma najlepszych trzecich miejsc.
7. Ranking każdej grupy używa reguł Round Robin z sekcji 7.2.
8. Uczestnicy są przydzielani metodą snake na podstawie wejściowego seeda:
   - 2 grupy: A, B, B, A, A, B, ...;
   - 4 grupy: A, B, C, D, D, C, B, A, A, B, ... .
9. Snake ma pierwszeństwo przed unikaniem ponownych spotkań z wcześniejszego
   etapu. Wyniki wcześniejszej fazy nie wpływają na grupy.

Liczba rund jednej grupy wynosi `groupSize - 1` dla parzystego rozmiaru i
`groupSize` dla nieparzystego, zgodnie z algorytmem kołowym z bye harmonogramu.

## 9. Cross-seeding do Single Elimination

### Dwie grupy

- po jednym kwalifikancie: finał A1-B1;
- po dwóch kwalifikantów: półfinały A1-B2 oraz B1-A2.

### Cztery grupy

- po jednym kwalifikancie: półfinały A1-B1 oraz C1-D1;
- po dwóch kwalifikantów:
  - QF1 A1-B2;
  - QF2 C1-D2;
  - QF3 B1-A2;
  - QF4 D1-C2.

QF1/QF2 zasilają pierwszy półfinał, a QF3/QF4 drugi. Uczestnicy tej samej grupy
znajdują się w przeciwnych połowach drabinki i mogą spotkać się ponownie
najwcześniej w finale. Seed docelowego SE odpowiada slotowi drabinki wynikającemu
z tej macierzy, nie porównaniu bilansu różnych grup.

## 10. Revert i undo

1. Revert aktywnego etapu działa tylko wewnątrz jego `stageId` i zachowuje
   obecne guardy downstream.
2. CompleteMatch i RevertMatch aktualizują `StageParticipant`, nie globalny
   status gracza.
3. Po CompleteStage, ale przed StartStage, organizator może cofnąć wynik. System
   atomowo:
   - potwierdza brak runtime następnego etapu;
   - oznacza snapshot przejścia `invalidatedAt`;
   - czyści finalne pola kwalifikacji;
   - ponownie otwiera źródłowy etap i ustawia `activeStageId`;
   - w razie ostatniego etapu ponownie otwiera turniej;
   - cofa wynik.
4. Po ustawieniu `targetStartedAt` poprzedniego etapu nie można cofnąć. API
   zwraca 409 `STAGE_ALREADY_ADVANCED`.
5. Nie ma cascade revert. Dane następnego etapu nigdy nie są usuwane przez
   revert poprzedniego.
6. `undo-last` stosuje te same granice; nie może ominąć guardu etapowego.
7. CompleteStage i StartStage nie są zwykłymi akcjami undoable.

## 11. Migracja istniejących turniejów

Migracja jest niedestrukcyjna:

1. tworzy tabele i enumy etapów;
2. dla każdego turnieju tworzy normalny `TournamentStage` o nazwie `Etap 1` i
   pozycji 1;
3. etap przejmuje format, BO, ranking, rundy, liczbę uczestników i stan;
4. draft mapuje się na `planned`, active na `active`, completed na `completed`;
5. każdy gracz otrzymuje `StageParticipant` z dotychczasowym seedem i statusem;
6. każdy istniejący mecz i historia otrzymują `stageId` tego etapu;
7. aktywny turniej otrzymuje `activeStageId`;
8. po backfillu DB włącza `matches.stageId NOT NULL` oraz złożone FK;
9. istniejące ID, wyniki, historia, logi, dostęp i tokeny pozostają bez zmian.

Nie powstaje trwała alternatywna ścieżka dla turniejów jednoetapowych. Nowe i
zmigrowane turnieje korzystają z tego samego modelu. Kompatybilne pola
`Tournament` mogą pozostać przejściowo tylko jako projekcja; późniejsza osobna
migracja je usuwa.

## 12. Backup v3

Po wdrożeniu etapów eksport zawsze używa `schemaVersion: 3`, także dla jednego
etapu. V3 zawiera:

- globalny turniej;
- etapy;
- globalnych graczy;
- stage participants i grupy;
- stage-aware mecze, historię i action log;
- przejścia, rewizje kwalifikacji i źródła seedów.

Import v3 najpierw waliduje cały graf i odtwarza go w jednej transakcji. Import
v2 pozostaje wspierany: tworzy jeden normalny `Etap 1` i przypisuje do niego
wszystkich uczestników, mecze oraz historię. Backup v1 nadal jest odrzucany.
Eksport v2 nie jest generowany po wdrożeniu etapów.

## 13. Kolejność małych etapów implementacji

1. Czysty kontrakt domenowy i testy walidacji planu/rankingów/cross-seedingu.
2. Schemat, migracja do `Etap 1` i zapis stageId dla nowych danych.
3. Stage-scoped CompleteMatch, RevertMatch, undo, generatory i odczyty przy nadal
   jednoetapowym UI.
4. QualificationPreview, CompleteStage i StartStage bez `group_stage`.
5. `group_stage`, snake seeding i cross-seeding.
6. OpenAPI oraz Backup v3.
7. Kreator i stage-aware widoki organizatora, prowadzącego i kibica.
8. Hardening, migracja na kopii, smoke testy i późniejsze usunięcie projekcji
   kompatybilności.

Każdy etap prac ma własny commit/gałąź, pełną regresję dotychczasowych testów i
nie łączy zmian schematu, domeny, Backupu i dużego UI w jeden rollout.

## 14. Wymagane testy domenowe

### Plan i przepływ

- 0, 1, 2, 3 i 4 etapy;
- pozycje ciągłe i duplikaty;
- BO1/3/5/7 oraz odrzucenie innych wartości i osobnego BO finału;
- SE tylko ostatnie, `group_stage` nieostatnie;
- liczba kwalifikantów równa liczbie uczestników następnego etapu;
- pierwszy etap zgodny z liczbą graczy;
- konfiguracja niezmienna po starcie.

### Ranking

- pełna kolejność tie-breaków Swiss;
- Buchholz, walkower, Swiss bye i no contest;
- RR/group z head-to-head dla dokładnie dwóch osób;
- pominięcie head-to-head dla trzech i więcej;
- gameDiff, gameWins oraz unikalny seed jako końcowe kryteria;
- brak wpływu meczów innego etapu lub grupy.

### Group stage

- 2/4 grupy, rozmiar 3–8, podzielność i równość;
- odrzucenie 1/3/5 grup, grup nierównych i rozmiaru poza zakresem;
- 1/2 kwalifikantów i odrzucenie najlepszych trzecich miejsc;
- snake dla pełnego cyklu 2 i 4 grup;
- dokładnie jeden mecz każdej pary, brak rewanżu i meczu między grupami;
- dokładne sloty cross-seedingu dla czterech wariantów;
- uczestnicy tej samej grupy w przeciwnych połowach drabinki.

## 15. Wymagane testy integracyjne

### Lifecycle i atomowość

- start etapu 1 i blokada konfiguracji całego planu;
- najwyżej jeden aktywny etap pod konkurencją;
- QualificationPreview bez zapisów;
- CompleteStage: sukces, duplikat, concurrency i rollback po każdym kroku;
- CompleteStage nie uruchamia następnego etapu;
- StartStage: sukces, duplikat, concurrency i rollback uczestników/grup/meczów;
- przerwa między etapami z `activeStageId = NULL`;
- zakończenie ostatniego Swiss/RR/SE i ustawienie zwycięzcy turnieju;
- CompleteMatch/CompleteStage oraz RevertMatch/CompleteStage race.

### Revert

- revert aktywnego etapu;
- revert po CompleteStage, lecz przed StartStage, z unieważnieniem snapshotu;
- ponowne CompleteStage po takim revercie tworzy nową rewizję;
- revert i undo po StartStage zwracają 409 bez skutków;
- brak cascade usuwającego dane następnego etapu;
- istniejące testy downstream, rollback i concurrency CompleteMatch/RevertMatch.

### Kombinacje

- Swiss -> SE, w tym systemowy bye;
- RR -> SE;
- Swiss -> group_stage;
- group_stage -> SE dla 2/4 grup i 1/2 kwalifikantów;
- Swiss -> group_stage -> SE;
- reset statystyk i poprawne źródło kwalifikacji na każdej granicy;
- jednoetapowe Swiss, RR i SE bez zmiany zachowania.

### Integralność, dostęp i backup

- cross-stage i cross-group FK;
- brak meczu gracza nieobecnego w etapie;
- macierz anonymous/viewer/support/host/organizer dla nowych endpointów;
- tylko organizer może CompleteStage i StartStage;
- Backup v3 round-trip wszystkich encji i przejść;
- import v2 -> `Etap 1`, odrzucenie v1;
- błędny graf v3 odrzucony przed pierwszym insertem;
- migracja draft/active/completed zachowująca istniejące ID i wyniki;
- OpenAPI codegen bez dodatkowego diffu.

## 16. Pierwsze ograniczone zadanie programistyczne

Pierwszy etap implementacji obejmuje wyłącznie czysty kontrakt domenowy:

1. enumy formatów, rankingów, kwalifikacji i seedingu;
2. `validateTournamentStagePlan()`;
3. rankingi Swiss i RR/group zgodne z niniejszym ADR;
4. `buildGroupPlayoffSlots()` dla wszystkich czterech wariantów;
5. komplet testów jednostkowych tych funkcji.

Nie obejmuje DB, migracji, API, CompleteStage, StartStage, Backupu ani frontendu.
To ograniczenie zamienia decyzje produktu w wykonywalny kontrakt przed zmianą
trwałych danych.

## 17. Konsekwencje i klasyfikacja

### BLOCKER — 0

Model jest jednoznaczny i gotowy do implementacji.

### HIGH — 6

- atomowość StartStage i CompleteStage;
- przeniesienie seed/status z gracza do udziału etapowego;
- pełne stage-scoping CompleteMatch/RevertMatch/generatorów;
- guard undo na granicy etapów;
- Backup v3 przed produkcyjnymi danymi wieloetapowymi;
- wspólna finalizacja ostatniej rundy Swiss przez CompleteStage.

### MEDIUM — 5

- stage-aware featured match/dashboard/asystent;
- czasowe pola kompatybilności jako ryzyko dwóch źródeł prawdy;
- jawne połączenia drabinki i złożone FK;
- jednakowa walidacja grup w domenie, DB i Backupu;
- szeroki fan-out zmiany OpenAPI.

### LOW — 3

- spójne nazwy i etykiety etapów;
- stabilny URL wybranego etapu;
- przyszły, wyłącznie informacyjny agregat statystyk całego turnieju.

## Werdykt

**GOTOWE DO IMPLEMENTACJI**
