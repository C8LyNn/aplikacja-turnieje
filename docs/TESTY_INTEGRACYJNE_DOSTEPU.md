# Testy automatyczne API i modelu `series_v1`

Dokument opisuje aktualny zestaw testów dostępu, atomowego CompleteMatch i
RevertMatch, klasyfikacji z meczów, Round Robin, Swiss, backupu v2 oraz
wersjonowanej migracji destrukcyjnej.

## Zestaw testów

Testy jednostkowe:

- `series-result.test.ts` — progi BO1/BO3/BO5/BO7 i błędne wyniki serii;
- `standings.test.ts` — played, walkower, bye, no contest, gameDiff, head-to-head i Buchholz;
- `round-robin.test.ts` — algorytm kołowy dla 3, 4, 5 i 6 graczy;
- `swiss.test.ts` — kolejność parowania, unikanie rewanżu i polityka bye.

Testy integracyjne:

- `access.integration.test.ts` — 64 scenariusze uprawnień;
- `complete-match.integration.test.ts` — 42 scenariusze CompleteMatch, PATCH, concurrency i rollback;
- `revert-match.integration.test.ts` — 39 scenariuszy RevertMatch i wspólnego undo-last;
- `series-v1.integration.test.ts` — 14 scenariuszy tworzenia, RR, bye, Swiss i backupu v2;
- `migration.integration.test.ts` — 3 scenariusze świeżej bazy, resetu legacy i bezpiecznika operacyjnego.

Testy używają runnera Node, Supertest, prawdziwego `app.ts` Express oraz
prawdziwego PostgreSQL przez Drizzle/`pg`. Nie używają SQLite ani bazy in-memory.

## Wymagane zmienne

Potrzebna jest osobna baza PostgreSQL, której nazwa zawiera słowo `test`, oraz
dedykowany schemat `tm_test_*`. Nie zapisuj prawdziwego URL ani hasła w repozytorium.

PowerShell:

```powershell
$env:TEST_DATABASE_URL='postgresql://tm_test:YOUR_URL_ENCODED_TEST_PASSWORD@127.0.0.1:5432/tournament_manager_test'
$env:TEST_DATABASE_SCHEMA='tm_test_series_v1'
$env:TEST_DATABASE_RESET='DROP_TM_TEST_SCHEMA'
pnpm run test:integration
```

Bash:

```bash
TEST_DATABASE_URL='postgresql://tm_test:YOUR_URL_ENCODED_TEST_PASSWORD@127.0.0.1:5432/tournament_manager_test' \
TEST_DATABASE_SCHEMA='tm_test_series_v1' \
TEST_DATABASE_RESET='DROP_TM_TEST_SCHEMA' \
pnpm run test:integration
```

Testy jednostkowe nie wymagają bazy:

```bash
pnpm --filter @workspace/api-server run test:unit
```

## Bezpiecznik bazy

Przed resetem harness wymaga jednocześnie:

1. uruchomienia pod runnerem testów Node;
2. protokołu `postgres://` albo `postgresql://`;
3. nazwy bazy zawierającej `test`;
4. braku `prod` w odcisku host/baza;
5. schematu zgodnego z `^tm_test_[a-z0-9_]+$`;
6. `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`.

Harness dodaje `search_path`, usuwa i odtwarza wyłącznie wskazany schemat oraz
uruchamia w nim wersjonowaną migrację `0001_series_v1_clean_cutover.sql`.
Zwykły start aplikacji nie wykonuje resetu.

## Pokryte polityki

- anonymous i viewer mają wyłącznie dozwolone odczyty;
- private_online wymaga tokenu widza, a private_offline pozostaje dla organizer/support;
- eksport pełnego backupu v2 jest dostępny wyłącznie dla organizatora;
- CompleteMatch przyjmuje dyskryminowane played, walkover albo no contest;
- systemowego bye nie można utworzyć publicznym CompleteMatch;
- BO3 `1:0` i BO5 `2:1` zwracają `422` bez skutków ubocznych;
- winner played wynika wyłącznie ze score;
- finalnych pól nie można przemycić przez ogólny PATCH;
- CompleteMatch i RevertMatch zachowują atomowość, blokady, concurrency i rollback;
- statystyki oraz standings są liczone wyłącznie z meczów;
- Round Robin używa matchWins, head-to-head i gameDiff;
- Swiss używa matchWins, Buchholza i kontrolowanej polityki bye;
- backup v2 przechodzi pełny round-trip, a v1 jest jawnie odrzucany;
- migracja usuwa tylko dane domeny turniejowej i zachowuje tabelę niezwiązaną.

## Zweryfikowany przebieg

Ostatni pełny przebieg na PostgreSQL 16 wykonano 14 lipca 2026:

- 50/50 testów jednostkowych;
- 162/162 testy integracyjne;
- 212/212 łącznie;
- 0 failed, 0 cancelled, 0 skipped.

Standardowy typecheck i build Windows działają z bieżącą konfiguracją workspace.

## Znane ograniczenia

- testy wymagają izolowanego PostgreSQL i dedykowanej bazy testowej;
- Swiss po ostatniej rundzie nie otrzymał jeszcze pełnej, nowej polityki automatycznej finalizacji;
- nie ma automatycznego cascade revert;
- double elimination pozostaje celowo niedostępne;
- testy nie dodają idempotency key pamiętającego odpowiedź między niezależnymi retry klienta.
