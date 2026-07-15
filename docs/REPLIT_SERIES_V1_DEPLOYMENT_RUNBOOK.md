# Kontrolowany cutover `series_v1` na Replit

## Cel i granice

Ten runbook opisuje jednorazowe, destrukcyjne przejście produkcyjnej bazy Tournament Manager ze starego modelu wyników do `series_v1`. Reset usuwa dane domeny turniejowej. Nie jest zwykłą migracją danych i nie wolno uruchamiać go automatycznie podczas `git pull`, Run, build ani zwykłego startu API. Jedynym wyjątkiem jest opisany niżej jawny runner Production aktywowany przez `DEPLOYMENT_TASK`.

Skrypt `scripts/post-merge.sh` wykonuje wyłącznie instalację zależności. Każda zmiana bazy wymaga osobnej, jawnej komendy operatorskiej opisanej poniżej.

## Development DB i Production DB

Replit Development i Replit Deployment/Production mogą używać różnych baz oraz różnych wartości `DATABASE_URL`. Nie wolno zakładać, że Run w workspace i publiczny Deployment łączą się z tym samym PostgreSQL, nawet jeżeli należą do jednego projektu.

Przed cutoverem operator musi oddzielnie potwierdzić:

- konkretny projekt Replit;
- środowisko Production, a nie Development;
- oczekiwaną nazwę bazy odczytaną niezależnie od skryptu;
- że `DATABASE_URL` w powłoce operatorskiej wskazuje właśnie Production DB, bez kopiowania lub wyświetlania jego wartości.

Nie należy uruchamiać resetu równolegle w Run i Deployment.

## Stałe Secrets aplikacji

Środowisko produkcyjne musi zawierać:

- `DATABASE_URL=<production-postgresql-url>`;
- `SESSION_SECRET=<losowy-sekret-co-najmniej-32-znaki>`.

Wartości nie mogą trafić do repozytorium, logów, eksportu diagnostycznego ani zgłoszenia. Produkcyjne API odmawia startu, gdy `SESSION_SECRET` nie istnieje, ma mniej niż 32 znaki albo jest równy deweloperskiemu fallbackowi.

## Runner zadań Production

Replit nie udostępnia Deployment Shell, dlatego entrypoint API obsługuje jawne, tymczasowe tryby ustawiane w Production Secrets:

- bez `DEPLOYMENT_TASK` aplikacja startuje normalnie i nie uruchamia żadnego zadania DB;
- `DEPLOYMENT_TASK=series_v1_preflight` uruchamia `pnpm --filter @workspace/db reset:series-v1:preflight`, wypisuje bezpieczny raport i kończy proces bez uruchamiania API;
- `DEPLOYMENT_TASK=series_v1_reset` uruchamia `pnpm --filter @workspace/db reset:series-v1:destructive`; dopiero kod zakończenia `0` pozwala uruchomić API, a każdy błąd blokuje jego start.
- `DEPLOYMENT_TASK=tournament_stages_v1_preflight` uruchamia wyłącznie odczytową kontrolę migracji `0002` i kończy proces bez uruchamiania API;
- `DEPLOYMENT_TASK=tournament_stages_v1_migrate` uruchamia kontrolowaną migrację `0002`; po sukcesie uruchamia API, a każdy błąd blokuje jego start.
- `DEPLOYMENT_TASK=tournament_stages_v1_development_preflight` uruchamia wyłącznie odczytową kontrolę migracji `0002` na jawnie wskazanej Development DB i kończy proces bez uruchamiania API;
- `DEPLOYMENT_TASK=tournament_stages_v1_development_migrate` uruchamia kontrolowaną migrację `0002` na Development DB; po sukcesie uruchamia API, a każdy błąd blokuje jego start.

Runner przekazuje skryptom wyłącznie odziedziczone środowisko procesu. Nie umieszcza `DATABASE_URL`, `DEVELOPMENT_DATABASE_URL` ani innych sekretów w argumentach i nie zmienia guardów, markera, transakcji ani advisory locka istniejącego resetu. Tryby Production używają wyłącznie `DATABASE_URL`, a tryby Development wyłącznie `DEVELOPMENT_DATABASE_URL`. Nieznana wartość `DEPLOYMENT_TASK` blokuje start.

Tryby Production wybiera się przez tymczasowe ustawienie odpowiedniej wartości `DEPLOYMENT_TASK` wraz z wymaganymi niżej zmiennymi Production, a następnie uruchomienie kontrolowanego Republish. Po odczytaniu raportu preflight usuń `DEPLOYMENT_TASK`. Po udanym resecie natychmiast usuń `DEPLOYMENT_TASK` i wszystkie jednorazowe zmienne resetu, a potem wykonaj zwykły Republish. Pozostawienie `series_v1_reset` spowoduje, że kolejny restart zostanie poprawnie zablokowany przez istniejący marker i API nie wystartuje. Tryby Development uruchamia się wyłącznie w Development workspace zgodnie z oddzielną procedurą poniżej, nigdy przez Production Republish.

## Migracja Tournament Stages v1 na Replit

Migrację etapów wykonuje się dopiero na bazie ze spójnym modelem `series_v1` i markerem `series_v1_clean_cutover`. Oba tryby wymagają stałego produkcyjnego `DATABASE_URL` oraz następujących tymczasowych guardów:

```bash
export EXPECTED_DATABASE_NAME='<EXPECTED_PRODUCTION_DATABASE_NAME>'
export EXPECTED_DATABASE_SCHEMA='public'
export EXPECTED_DEPLOYMENT_ENVIRONMENT='production'
export DEPLOYMENT_ENVIRONMENT='production'
export APP_COMMIT='<DEPLOYED_RUNNER_GIT_COMMIT>'
```

`APP_COMMIT` musi być pełnym 40-znakowym SHA commita, z którego zbudowano faktycznie wdrażany artefakt zawierający runner. Nie jest identyfikatorem wersji migracji i nie należy wpisywać tu bazowego commita `30cc0195a26fe13a7d8ac7f732c55321682ba8e5`, jeżeli deployment zawiera późniejszy commit runnera. Wersję migracji identyfikują niezależnie plik `0002_tournament_stages_v1.sql` i marker `tournament_stages_v1`. Po utworzeniu commita wdrożeniowego ustaw dokładnie hash tego commita, który Replit ma zbudować.

Najpierw ustaw `DEPLOYMENT_TASK=tournament_stages_v1_preflight` i wykonaj jeden kontrolowany Republish. Preflight działa w transakcji `READ ONLY`, nie wykonuje DDL ani DML, nie uruchamia API i klasyfikuje migrację jako:

- `needed` — spójne `series_v1`, poprawny marker cutoveru i brak obiektów oraz markera `tournament_stages_v1`;
- `applied` — pełny wymagany schemat oraz marker zgodny z guardami;
- `inconsistent` — każdy stan częściowy, rozbieżny marker, błędna baza, schemat albo model bazowy.

Tylko `needed` i `applied` zwracają `safe: true`. Po odczytaniu raportu usuń `DEPLOYMENT_TASK`; nie przechodź do migracji przy `inconsistent`.

Jeżeli raport wskazuje `needed`, ustaw `DEPLOYMENT_TASK=tournament_stages_v1_migrate` i wykonaj jeden kontrolowany Republish. Runner ponawia preflight pod transakcyjnym advisory lockiem, uruchamia istniejący `migrate-tournament-stages-v1.mjs` w jednej transakcji i zapisuje marker. Błąd powoduje rollback i blokuje start API. Sukces zwraca `applied: true` i uruchamia API. Ponowne uruchomienie z tym samym, zgodnym markerem zwraca `applied: false`, nie wykonuje backfillu ponownie i również uruchamia API.

Po sukcesie usuń `DEPLOYMENT_TASK` oraz pięć tymczasowych guardów, pozostawiając wyłącznie stałe Secrets aplikacji, i wykonaj zwykły Republish. Nie uruchamiaj `db push`, nie wykonuj pliku `0002` ręcznie i nie dodawaj sposobu wywołania migracji przez HTTP.

## Migracja Tournament Stages v1 na Development

Tryb Development jest oddzielony od Production i nie odczytuje `DATABASE_URL`. W zweryfikowanej powłoce Development ustaw tymczasowy alias połączenia oraz dokładnie te same jawne nazwy guardów, ale z wartością `development`:

```bash
export DEVELOPMENT_DATABASE_URL="$DATABASE_URL"
export EXPECTED_DATABASE_NAME='<EXPECTED_DEVELOPMENT_DATABASE_NAME>'
export EXPECTED_DATABASE_SCHEMA='public'
export EXPECTED_DEPLOYMENT_ENVIRONMENT='development'
export DEPLOYMENT_ENVIRONMENT='development'
export APP_COMMIT='<FULL_40_CHARACTER_DEPLOYED_GIT_COMMIT>'
```

Nie zapisuj tych wartości w Replit Secrets. Przed uruchomieniem potwierdź niezależnie, że `DEVELOPMENT_DATABASE_URL` pochodzi z Development workspace, a oczekiwana nazwa to `heliumdb`. Loader porównuje nazwę z URL-em przed otwarciem połączenia i bezwarunkowo odrzuca `neondb`. Obecność produkcyjnego `DATABASE_URL` w procesie nie wpływa na ten tryb.

Najpierw uruchom tylko preflight:

```bash
export DEPLOYMENT_TASK='tournament_stages_v1_development_preflight'
pnpm --filter @workspace/api-server start
```

Runner wywołuje `pnpm --filter @workspace/db migrate:tournament-stages:development:preflight`. Skrypt otwiera transakcję `READ ONLY`, zwraca `needed`, `applied` albo `inconsistent`, wykonuje rollback i nie uruchamia API. Tylko `safe: true` oraz status `needed` pozwalają przejść dalej.

Jeżeli preflight zwróci `needed`, uruchom migrację dokładnie raz:

```bash
export DEPLOYMENT_TASK='tournament_stages_v1_development_migrate'
pnpm --filter @workspace/api-server start
```

Runner wywołuje `pnpm --filter @workspace/db migrate:tournament-stages:development`. Migracja ponawia preflight pod transakcyjnym advisory lockiem, wykonuje `0002` w tej samej transakcji i zapisuje marker ze środowiskiem `development`. Błąd powoduje rollback i blokuje start API. Ponowny przebieg z tym samym `APP_COMMIT` zwraca `applied: false`, nie duplikuje etapów ani backfillu i może uruchomić API.

Po kontroli usuń wszystkie zmienne sesyjne:

```bash
unset DEPLOYMENT_TASK
unset DEVELOPMENT_DATABASE_URL
unset EXPECTED_DATABASE_NAME
unset EXPECTED_DATABASE_SCHEMA
unset EXPECTED_DEPLOYMENT_ENVIRONMENT
unset DEPLOYMENT_ENVIRONMENT
unset APP_COMMIT
```

Tryb Development nie jest dozwolony dla `production` ani `neondb`. Tryby Production nadal wymagają `production`, korzystają z `DATABASE_URL` i nie przyjmują guardów Development.

## Jednorazowa synchronizacja Development DB

Reset Production celowo nie przyjmuje środowiska `development`. Jeżeli przed zwykłym Republish trzeba zsynchronizować wyłącznie Development DB, użyj osobnego wrappera. Wrapper korzysta z tego samego preflightu, transakcji, `DROP ... RESTRICT`, markera i advisory locka, ale ignoruje produkcyjne `DATABASE_URL` oraz produkcyjne guardy.

Read-only preflight wymaga jawnego Development URL i oczekiwań:

```bash
export DEVELOPMENT_DATABASE_URL="$DATABASE_URL"
export EXPECTED_DEVELOPMENT_DATABASE_NAME='<EXPECTED_DEVELOPMENT_DATABASE_NAME>'
export EXPECTED_DEVELOPMENT_DATABASE_SCHEMA='public'
export EXPECTED_DEVELOPMENT_ENVIRONMENT='development'
export DEVELOPMENT_ENVIRONMENT='development'
pnpm --filter @workspace/db reset:series-v1:development:preflight
```

Po potwierdzeniu raportu destrukcyjny reset Development wymaga osobnych guardów:

```bash
export ALLOW_DESTRUCTIVE_DEVELOPMENT_TOURNAMENT_RESET='true'
export CONFIRM_DEVELOPMENT_TOURNAMENT_DATA_DELETION='DELETE_ALL_DEVELOPMENT_TOURNAMENT_DATA'
export DEVELOPMENT_APP_COMMIT='<DEPLOYED_GIT_COMMIT>'
pnpm --filter @workspace/db reset:series-v1:development
```

Nie ustawiaj `DEVELOPMENT_DATABASE_URL` na Production DB. Nazwa bazy z połączenia i `current_database()` muszą odpowiadać `EXPECTED_DEVELOPMENT_DATABASE_NAME`. Po sukcesie nie uruchamiaj wrappera ponownie; marker blokuje drugą próbę.

## Jednorazowe zmienne resetu

Ustawia się je wyłącznie w powłoce operatorskiej na czas preflightu i jednego resetu:

```bash
export EXPECTED_DATABASE_NAME='<EXPECTED_PRODUCTION_DATABASE_NAME>'
export EXPECTED_DATABASE_SCHEMA='public'
export EXPECTED_DEPLOYMENT_ENVIRONMENT='production'
export DEPLOYMENT_ENVIRONMENT='production'
export APP_COMMIT='<DEPLOYED_GIT_COMMIT>'
```

Destrukcyjna komenda wymaga dodatkowo dwóch bezpośrednich potwierdzeń:

```bash
export ALLOW_DESTRUCTIVE_TOURNAMENT_RESET='true'
export CONFIRM_TOURNAMENT_DATA_DELETION='DELETE_ALL_LEGACY_TOURNAMENT_DATA'
```

`DATABASE_URL` musi być dostępny jako Secret, lecz nie wolno wypisywać go poleceniem `echo`, umieszczać w historii powłoki ani przekierowywać do pliku. `APP_COMMIT` identyfikuje wersję aplikacji zapisaną w markerze; nie jest sekretem.

## Obiekty objęte resetem

Docelowym schematem jest wyłącznie `public`. Reset nie usuwa bazy, schematu, ról, uprawnień, rozszerzeń ani obiektów spoza poniższej listy.

Tabele domeny:

- `public.auth_audit_log`;
- `public.support_sessions`;
- `public.action_log`;
- `public.result_history`;
- `public.matches`;
- `public.players`;
- `public.tournaments`.

Typy enum:

- `public.match_result_type`;
- `public.match_status`;
- `public.player_status`;
- `public.ranking_policy`;
- `public.result_model_version`;
- `public.tournament_status`;
- `public.tournament_format`.

Sekwencje, indeksy i constrainty należące do tych tabel są raportowane i odtwarzane razem z tabelami. Trwała tabela `public.app_schema_migrations` nie należy do obiektów usuwanych.

Migracja używa jawnie kwalifikowanych obiektów `public.*` oraz `DROP ... RESTRICT`. Jeżeli obcy widok, funkcja, tabela lub constraint zależy od obiektu domeny, preflight kończy się błędem. Operator nie może usuwać takiej zależności w ramach tego runbooka; wymaga ona oddzielnej analizy i decyzji.

## Preflight tylko do odczytu

Preflight działa w transakcji `READ ONLY` i nie wykonuje DDL ani DML:

```bash
pnpm --filter @workspace/db reset:series-v1:preflight
```

Raport nie zawiera connection stringa ani hasła. Pokazuje bezpieczną nazwę hosta, `current_database()`, schemat docelowy, `current_schema()`, `search_path`, środowisko, rozpoznany stan bazy, istniejące tabele i typy, liczniki rekordów, obiekty zależne, marker oraz pełny plan usuwania i tworzenia. Kod zakończenia inny niż zero oznacza zakaz resetu.

Raport jest bezpieczny do diagnostycznego zapisania poza repozytorium. Przykład dla powłoki Replit:

```bash
umask 077
pnpm --filter @workspace/db reset:series-v1:preflight > /tmp/tm-series-v1-preflight.json
```

Po zapisaniu operator ma ponownie obejrzeć plik, w szczególności:

- nazwę bazy i schemat `public`;
- środowisko `production`;
- stan `legacy` albo świadomie zaakceptowany stan `fresh`;
- liczniki danych;
- dokładną listę obiektów resetu;
- pustą listę `externalDependencies`;
- brak markera `series_v1_clean_cutover`.

Stan `series_v1` bez markera, stan niespójny, istniejący marker, błędna baza, błędny schemat lub jakakolwiek obca zależność blokują reset.

## Trzy oddzielne zgody użytkownika

Po pokazaniu raportu i przed ustawieniem destrukcyjnych zmiennych operator musi uzyskać trzy osobne, zapisane w przebiegu wdrożenia potwierdzenia:

1. „Potwierdzam projekt Replit, środowisko Production, oczekiwaną nazwę bazy i schemat `public`.”
2. „Potwierdzam zapoznanie się z licznikami i listą usuwanych obiektów oraz zgodę na nieodwracalne usunięcie wszystkich legacy tournament data.”
3. „Potwierdzam, że zapisy aplikacji są zatrzymane, eksport diagnostyczny jest gotowy i reset ma zostać wykonany dokładnie jeden raz.”

Brak którejkolwiek zgody oznacza przerwanie procedury. Zgody nie zastępują technicznych zmiennych potwierdzających.

## Jednorazowy reset

Po uzyskaniu trzech zgód ustaw dwie destrukcyjne zmienne i uruchom dokładnie raz:

```bash
export ALLOW_DESTRUCTIVE_TOURNAMENT_RESET='true'
export CONFIRM_TOURNAMENT_DATA_DELETION='DELETE_ALL_LEGACY_TOURNAMENT_DATA'
pnpm --filter @workspace/db reset:series-v1:destructive
```

Skrypt przed zmianami ponownie sprawdza bazę, schemat, środowisko, stan danych, marker i zależności. W transakcji pobiera stały `pg_try_advisory_xact_lock(21581, 5453361)`. Druga równoległa próba szybko kończy się błędem. Marker `series_v1_clean_cutover` jest blokowany i zapisywany w `public.app_schema_migrations` w tej samej transakcji co reset. Błąd powoduje rollback danych, struktur i markera.

Po sukcesie raport ma potwierdzić utworzone tabele i typy, brak kolumn legacy, zapisany marker, `APP_COMMIT` oraz czas wykonania. Nie wolno ponawiać resetu. Nie istnieje flaga `--force`.

Natychmiast usuń jednorazowe zmienne z powłoki i konfiguracji, pozostawiając stałe Secrets aplikacji:

```bash
unset ALLOW_DESTRUCTIVE_TOURNAMENT_RESET
unset CONFIRM_TOURNAMENT_DATA_DELETION
unset EXPECTED_DATABASE_NAME
unset EXPECTED_DATABASE_SCHEMA
unset EXPECTED_DEPLOYMENT_ENVIRONMENT
unset DEPLOYMENT_ENVIRONMENT
unset APP_COMMIT
```

## Smoke test przed Republish

Przed Republish uruchom wersję aplikacji wskazaną przez `APP_COMMIT` z produkcyjnymi Secrets i sprawdź:

1. proces API startuje bez błędu konfiguracji `SESSION_SECRET`;
2. `GET /api/healthz` zwraca HTTP 200 i `{"status":"ok","database":"ok"}`;
3. strona główna odpowiada;
4. można utworzyć testowy, nieprodukcyjny turniej i odczytać go;
5. poprawny wynik BO jest przyjmowany, a niepełny wynik BO3 jest blokowany;
6. ścieżki public/private nadal egzekwują uprawnienia;
7. w `public.app_schema_migrations` istnieje dokładnie jeden marker `series_v1_clean_cutover`;
8. nie istnieją kolumny legacy `tournaments.allow_draws` ani `players.wins/draws/losses/points`.

Nie uruchamiaj resetu w celu „naprawienia” błędu smoke testu.

## Republish i smoke test publiczny

Republish jest osobną operacją wykonywaną dopiero po zaliczeniu kontroli przed publikacją. Zwykły Publish/Republish nie uruchamia resetu.

Po Republish sprawdź publiczny adres:

1. strona główna odpowiada bez błędu 5xx;
2. `GET /api/healthz` zwraca 200 z `database: "ok"`;
3. utworzony wcześniej turniej testowy jest dostępny zgodnie z polityką widoczności;
4. logowanie organizatora/support i widok kibica działają zgodnie z rolą;
5. w logach nie ma cyklicznych błędów bazy, schematu ani sesji;
6. marker nadal występuje dokładnie raz.

Po zakończeniu kontroli usuń tymczasowy plik diagnostyczny:

```bash
rm -f /tmp/tm-series-v1-preflight.json
```

Przed usunięciem zweryfikuj literalną ścieżkę `/tmp/tm-series-v1-preflight.json`. Nie usuwaj innych plików ani żadnego backupu bez osobnej decyzji.

## Reakcja na błąd

Jeżeli preflight zwraca błąd, nie ustawiaj zmiennych destrukcyjnych. Zachowaj bezpieczny raport, zatrzymaj procedurę i przeanalizuj konkretną przyczynę.

Jeżeli reset zwraca błąd, transakcja powinna zachować stare dane i nie zapisać markera. Potwierdź ten stan poleceniami tylko do odczytu i nie ponawiaj resetu automatycznie. Nie uruchamiaj `drizzle-kit push`, nie usuwaj obcych zależności i nie stosuj `CASCADE`.

Jeżeli reset zakończył się sukcesem, ale późniejszy smoke test nie przeszedł, marker oznacza wykonany cutover. Nie uruchamiaj resetu drugi raz. Zatrzymaj zapisy, zachowaj logi bez sekretów i eskaluj naprawę aplikacji. Automatyczny rollback produkcyjny nie jest częścią tej procedury.

Jeżeli `/api/healthz` zwraca 503, sprawdź dostępność i konfigurację produkcyjnej bazy poza odpowiedzią HTTP. Healthcheck ma limit 1000 ms i celowo nie ujawnia hosta, nazwy bazy, connection stringa ani stack trace.

## Pełna kolejność wykonania

1. Pozostaw Replit na starej wersji albo zatrzymaj zapisy.
2. Potwierdź konkretny projekt i środowisko Production.
3. Potwierdź produkcyjny `DATABASE_URL` bez ujawniania wartości.
4. Potwierdź bezpieczny `SESSION_SECRET` o długości co najmniej 32 znaków.
5. Ustaw niedestrukcyjne zmienne oczekiwań i uruchom read-only preflight.
6. Zapisz eksport diagnostyczny poza repozytorium.
7. Pokaż użytkownikowi nazwę bazy, schemat, liczniki, listę obiektów i brak obcych zależności.
8. Uzyskaj trzy oddzielne zgody opisane w tym dokumencie.
9. Ustaw dwie zmienne destrukcyjne i uruchom reset dokładnie raz.
10. Natychmiast usuń wszystkie jednorazowe zmienne.
11. Zweryfikuj struktury i pojedynczy marker `series_v1`.
12. Uruchom aplikację z poprawnymi Secrets.
13. Wykonaj smoke test przed Republish.
14. Wykonaj osobny Republish.
15. Wykonaj smoke test publicznego Deploymentu.
16. Usuń tymczasowy eksport po zakończeniu kontroli.
