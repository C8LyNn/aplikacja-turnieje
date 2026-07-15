# Tournament Stages v1 — schemat i migracja zgodności

## Zakres

Migracja `0002_tournament_stages_v1.sql` wprowadza trwały model etapów bez
udostępniania publicznego API wieloetapowego. Dodaje:

- `tournament_stages` jako źródło prawdy konfiguracji i lifecycle etapu;
- `stage_participants` jako etapowy seed, status i pochodzenie kwalifikacji;
- `stage_groups` dla przyszłego formatu `group_stage`;
- `tournaments.active_stage_id` jako wewnętrzny wskaźnik aktywnego etapu;
- obowiązkowe `matches.stage_id`, opcjonalne `matches.stage_group_id` oraz
  `result_history.stage_id` i `action_log.stage_id`.

Migracja nie dodaje StartStage, CompleteStage, generatora grup, Backup v3 ani
parametrów `stageId` do istniejącego API.

## Strategia migracji

Przed migracją runner Replit udostępnia odczytowy preflight:

```text
pnpm --filter @workspace/db migrate:tournament-stages:preflight
```

Właściwa migracja jest wykonywana przez wersjonowany runner:

```text
pnpm --filter @workspace/db migrate:tournament-stages
```

Te dwa polecenia są ścieżką Production i wymagają produkcyjnego `DATABASE_URL` oraz jawnych
`EXPECTED_DATABASE_NAME`, `EXPECTED_DATABASE_SCHEMA=public`,
`EXPECTED_DEPLOYMENT_ENVIRONMENT=production`, `DEPLOYMENT_ENVIRONMENT=production`
i `APP_COMMIT=<DEPLOYED_RUNNER_GIT_COMMIT>`. `APP_COMMIT` jest pełnym
40-znakowym SHA faktycznie wdrażanego artefaktu, a nie wersją migracji. Wersję
migracji identyfikują plik `0002_tournament_stages_v1.sql` i marker
`tournament_stages_v1`.

Development używa oddzielnych poleceń
`migrate:tournament-stages:development:preflight` oraz
`migrate:tournament-stages:development`, oddzielnego
`DEVELOPMENT_DATABASE_URL`, tych samych nazw guardów z wartością
`development` i pełnego `APP_COMMIT`. Loader Development ignoruje
`DATABASE_URL`, blokuje środowisko Production oraz bazę `neondb`. Szczegółowa
procedura operatorska znajduje się w
`docs/REPLIT_SERIES_V1_DEPLOYMENT_RUNBOOK.md`.

Preflight działa w transakcji `READ ONLY` i klasyfikuje
migrację jako `needed`, `applied` albo `inconsistent`.
Runner migracji ponawia tę kontrolę pod lockiem, obejmuje całą migrację
transakcją, serializuje wykonanie advisory lockiem i zapisuje marker
`tournament_stages_v1` w `app_schema_migrations`. Powtórne uruchomienie z
istniejącym markerem jest operacją no-op dopiero po potwierdzeniu, że wymagane
tabele i obowiązkowe kolumny etapowe rzeczywiście istnieją. Marker i schemat nie
mogą więc cicho się rozjechać. Jest to jedyny obowiązujący sposób wykonania
`0002`; pliku SQL nie uruchamia się osobno. Migracja nie używa `db push` ani
`DROP CASCADE`.

Kolejność operacji:

1. utworzenie enumów, tabel, indeksów i constraints etapów;
2. utworzenie dokładnie jednego etapu dla każdego istniejącego turnieju;
3. deterministyczna normalizacja seedów i utworzenie uczestników etapu;
4. przypisanie meczów, historii i powiązanych logów do etapu;
5. ustawienie `matches.stage_id` i `result_history.stage_id` jako `NOT NULL`;
6. dodanie złożonych FK chroniących granice turnieju i etapu;
7. instalacja ograniczonej warstwy zgodności dla starego API;
8. zapis markera migracji.

## Syntetyczny Etap 1

Każdy istniejący turniej otrzymuje normalny, a nie „legacy”, etap:

- `stage_key = stage-1`;
- `position = 1`;
- `name = Etap 1`;
- format, BO, rundy, ranking i zwycięzca pochodzą z turnieju;
- `draft`, `active`, `completed` mapują się odpowiednio na `planned`, `active`,
  `completed`;
- aktywny turniej otrzymuje `active_stage_id` wskazujące Etap 1.

Stary model nie przechowuje wiarygodnego czasu rozpoczęcia turnieju, dlatego
backfill nie podstawia `tournaments.created_at` do `started_at`: dla
historycznych etapów pozostaje ono `NULL`. `completed_at` ukończonego etapu
pochodzi wyłącznie z najpóźniejszego ukończonego meczu. Jeżeli ukończony stary
turniej nie ma takiego źródła, migracja przerywa się i wycofuje zamiast wymyślać
timestamp. Constraint nadal wymaga `completed_at` dla statusu `completed` i
odrzuca `completed_at` dla statusów `planned` oraz `active`.
Ta sama reguła obowiązuje import Backup v2: nieznane `started_at` pozostaje
`NULL`, a `completed_at` może pochodzić tylko z najpóźniejszego ukończonego
meczu; brak takiego dowodu wycofuje cały import.

`participant_count` jest rzeczywistą liczbą graczy. Dla Swiss bez zapisanej
liczby rund bezpieczny fallback to kolejno `total_rounds`, a następnie `1`, aby
nie odrzucać danych zgodnych ze starym schematem.

## Backfill seedów

Każdy gracz otrzymuje dokładnie jeden `StageParticipant`. Kolejność jest stabilna:

1. dodatni istniejący `players.seed`, rosnąco;
2. brak seeda na końcu;
3. `players.id` jako deterministyczny tie-breaker.

Wynik jest numerowany ponownie jako ciągłe `1..N`. Ten sam seed zostaje zapisany
do tymczasowej projekcji `players.seed` i do `stage_participants.stage_seed`.
Zapewnia to ciągłość i unikalność również dla starych nulli, duplikatów i luk.

## Pola zgodności Tournament

Po migracji źródłem prawdy etapu jest `TournamentStage`. Istniejące pola
`Tournament.format`, `defaultBestOf`, `swissRounds`, `currentRound`,
`totalRounds`, `status` i etapowy `winnerId` pozostają czasowo projekcją dla
niezmienionego OpenAPI, frontendu i Backup v2.

Stare operacje zapisują projekcję, a ograniczone triggery synchronizują jedyny
Etap 1 w tej samej transakcji. Kod startu, generowania Swiss, CompleteMatch i
RevertMatch odczytuje już konfigurację etapu oraz jawnie zapisuje `stageId`.
Triggery przypisujące etap do legacy insertów są konieczne, ponieważ domyślnej
wartości zależnej od innej tabeli nie da się wyrazić deklaratywnie. Obsługują one
także niezmieniony import Backup v2.

Pola zgodności mogą zostać usunięte dopiero po wdrożeniu stage-aware OpenAPI,
Backupu v3, wszystkich odczytów oraz StartStage/CompleteStage. Do tego czasu nie
wolno tworzyć drugiego niezależnego zapisu konfiguracji przez publiczne API.

## Integralność

DB wymusza między innymi:

- 1–3 pozycje, unikalny klucz i pozycję etapu;
- najwyżej jeden aktywny etap i zgodny `active_stage_id`;
- zakaz usunięcia ostatniego etapu istniejącego turnieju;
- unikalnego uczestnika i seed w etapie;
- wspólny turniej etapu, uczestnika, gracza i meczu;
- grupę należącą do `group_stage` i zgodną z jego konfiguracją;
- uczestników, zwycięzcę, następną parę i historię z tego samego etapu;
- dodatnie, nieparzyste BO zgodne z obecnym jednoetapowym API;
- spójne statusy oraz znaczniki `started_at` i `completed_at`.

Przejścia lifecycle aktualizują `TournamentStage`, `Tournament` i
`active_stage_id` w jednej transakcji. Odroczony constraint odczytuje przy
wykonaniu końcowy stan wiersza `Tournament`, więc nie waliduje pośredniej,
historycznej wartości `NEW.status`, ale nadal odrzuca częściowe przejście.

## Wycofanie przed wdrożeniem produkcyjnym

Migracja nie ma destrukcyjnego automatycznego `down`. Przed wdrożeniem
produkcyjnym wycofanie polega na porzuceniu izolowanego schematu testowego albo
odtworzeniu środowiska przedprodukcyjnego z migawki wykonanej przed migracją,
a następnie uruchomieniu poprzedniego commita aplikacji. Nie należy ręcznie
usuwać kolumn ani enumów z bazy zawierającej dane.

Po wdrożeniu na bazę współdzieloną rollback wymaga osobno zaprojektowanej,
przetestowanej procedury i aktualnej kopii bezpieczeństwa; nie jest częścią tego
zadania.
