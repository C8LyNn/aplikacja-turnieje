# Testy integracyjne polityk dostępu

Zakres dokumentu: cztery chronione odczyty, pełny eksport, generowanie rundy Swiss oraz atomowe kończenie meczu w modelu legacy.

## Narzędzia

Testy znajdują się w:

- `artifacts/api-server/test/access.integration.test.ts` — 64 scenariusze dostępu;
- `artifacts/api-server/test/complete-match.integration.test.ts` — 34 scenariusze CompleteMatch, PATCH i revert;
- `artifacts/api-server/test/series-result.test.ts` — 35 tabelarycznych przypadków czystego walidatora BO.

Używają:

- wbudowanego runnera testów Node;
- Supertest przeciwko prawdziwemu `app.ts` Express;
- prawdziwego połączenia Drizzle/`pg` z PostgreSQL;
- rzeczywistych endpointów logowania oraz istniejących helperów tokenów.

Runner Node został wybrany zamiast Vitest, aby testy API pozostały niezależne od narzędzi frontendu. Testy nie mockują warstwy DB i nie używają SQLite ani bazy in-memory.

## Wymagane zmienne

Potrzebna jest osobna baza PostgreSQL, której nazwa zawiera słowo `test`, dedykowany schemat o nazwie zgodnej z `tm_test_*` oraz jawne potwierdzenie operacji resetu. Poniższe przykłady używają placeholdera `YOUR_URL_ENCODED_TEST_PASSWORD`, który należy zastąpić hasłem zakodowanym do użycia w URL.

Nie należy zapisywać prawdziwego URL ani hasła w repozytorium. Harness sam ustawia `DATABASE_URL` dopiero po przejściu wszystkich bezpieczników.

## Uruchomienie

PowerShell:

```powershell
$env:TEST_DATABASE_URL='postgresql://tm_test:YOUR_URL_ENCODED_TEST_PASSWORD@127.0.0.1:5432/tournament_manager_test'
$env:TEST_DATABASE_SCHEMA='tm_test_access'
$env:TEST_DATABASE_RESET='DROP_TM_TEST_SCHEMA'
pnpm run test:integration
```

Bash/Replit Shell:

```bash
TEST_DATABASE_URL='postgresql://tm_test:YOUR_URL_ENCODED_TEST_PASSWORD@127.0.0.1:5432/tournament_manager_test' \
TEST_DATABASE_SCHEMA='tm_test_access' \
TEST_DATABASE_RESET='DROP_TM_TEST_SCHEMA' \
pnpm run test:integration
```

Oba polecenia należy uruchomić z katalogu głównego repozytorium.

Sam walidator serii można uruchomić bez bazy:

```powershell
pnpm --filter @workspace/api-server run test:unit
```

`pnpm run test:integration` wykonuje oba pliki integracyjne sekwencyjnie (`--test-concurrency=1`). Wewnątrz testu CompleteMatch dwa żądania wybranego scenariusza nadal są wysyłane rzeczywiście równolegle.

## Bezpiecznik bazy

Przed wykonaniem pierwszego destrukcyjnego polecenia testy wymagają jednocześnie:

1. uruchomienia pod runnerem testów Node;
2. protokołu `postgres://` albo `postgresql://`;
3. nazwy bazy zawierającej `test`;
4. braku `prod` w host/database fingerprint;
5. nazwy schematu pasującej do `^tm_test_[a-z0-9_]+$`;
6. dokładnego potwierdzenia `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`.

Harness dodaje `search_path` do dedykowanego schematu, usuwa i odtwarza wyłącznie ten schemat, tworzy w nim tabele fixture oraz usuwa go po testach. Nie uruchamia `drizzle-kit push`.

Brak dowolnego warunku zatrzymuje testy przed SQL. Baza o nazwie bez `test`, schemat `public` oraz cel zawierający `prod` są odrzucane.

## Macierz dostępu

### Cztery odczyty

Dotyczy:

- GET `/api/tournaments/:id`;
- GET `/api/tournaments/:id/assistant`;
- GET `/api/tournaments/:id/action-log`;
- GET `/api/matches/:id`.

| Widoczność | Anonymous | Viewer | Support | Organizer |
|---|---:|---:|---:|---:|
| public_online | 200 | 200 | 200 | 200 |
| private_online | 403 | 200 | 200 | 200 |
| private_offline | 403 | 403 | 200 | 200 |

Odmowa musi być JSON-em zawierającym tylko bezpieczne pola `error` i opcjonalnie `code`.

### Pełny eksport

GET `/api/tournaments/:id/export` dla każdego trybu widoczności:

| Anonymous | Viewer | Support | Organizer |
|---:|---:|---:|---:|
| 403 | 403 | 403 | 200 |

Test organizatora sprawdza wersję backupu oraz tablice graczy, meczów, historii i logu.

### Generowanie rundy Swiss

POST `/api/tournaments/:id/generate-round`:

| Anonymous | Viewer | Support | Organizer |
|---:|---:|---:|---:|
| 403 | 403 | 200 | 200 |

Dla odmowy test porównuje przed i po: `current_round`, liczbę meczów, statystyki wszystkich graczy oraz liczbę wpisów `action_log`.

## Fixtures

Zestaw tworzy turnieje `public_online`, `private_online`, `private_offline`, mecze i wpisy action log. Osobny aktywny fixture Swiss ma czterech graczy i kompletną rundę pierwszą. Organizer i support logują się przez prawdziwe endpointy. Viewer private_online również loguje się przez endpoint; dla pozostałych trybów token powstaje istniejącym helperem `signViewerToken`, aby można było sprawdzić prawidłowe odrzucenie private_offline.

W części dostępowej zdefiniowano 64 scenariusze integracyjne. Testy odczytu nie mutują fixture, a każdy scenariusz generowania Swiss tworzy własny turniej, dzięki czemu wynik nie zależy od kolejności.

## Atomowe CompleteMatch

34 nowe scenariusze integracyjne sprawdzają:

- poprawny zapis meczu, statystyk 3/1/0, historii, logu, eliminacji, awansu i finalizacji turnieju;
- odrzucenie winnera spoza meczu, winnera z innego turnieju, uczestnika z innego turnieju i braku uczestnika;
- pojedyncze naliczenie przy ponownym oraz przy dwóch równoległych żądaniach;
- pełny rollback po kontrolowanym błędzie wewnątrz transakcji;
- walidację score i remisu w modelu legacy;
- macierz anonymous/viewer/support/organizer oraz izolację credential między turniejami;
- blokadę finalnego statusu, score, `winnerId` i `isDraw` przez ogólny PATCH;
- zachowanie bezpiecznych przejść PATCH i zmianę `bestOf` wyłącznie przed rozpoczęciem;
- charakterystykę prostego revert po jednym CompleteMatch.

Endpoint używa następujących klas odpowiedzi:

- `401/403` — brak wymaganych uprawnień;
- `404` — brak meczu albo wymaganej encji;
- `409` — mecz już zakończony lub przegrany konflikt współbieżny;
- `422` — błędny uczestnik, winner, score, remis albo stan domenowy.

Zachowana została zgodność legacy: wygrana daje `+1 win/+3 points`, porażka `+1 loss`, a dozwolony remis `+1 draw/+1 point`. Nowy ścisły walidator BO1/BO3/BO5/BO7 jest testowany osobno, ale próg `winsRequired` nie jest jeszcze stosowany do legacy CompleteMatch; historyczne i nowe wyniki takie jak BO3 `1:0` pozostają dopuszczalne w tym modelu.

## Zweryfikowany przebieg

Do weryfikacji użyto lokalnego PostgreSQL 16 i izolowanej bazy `tournament_manager_test`. Na Windows x64 workspace zachowuje natywne pakiety dla Linux x64 używanego przez Replit oraz minimalny zestaw binariów Windows x64 wymagany przez esbuild, Rollup, Lightning CSS i Tailwind Oxide.

Pełny przebieg na PostgreSQL 16 został wykonany 14 lipca 2026: 35/35 testów jednostkowych walidatora oraz 98/98 testów integracyjnych (64 istniejące + 34 nowe), 0 nieudanych, 0 anulowanych i 0 pominiętych.

Standardowy build Windows działa po zmianie konfiguracji natywnych pakietów workspace oraz zastosowaniu wartości domyślnych wyłącznie podczas `vite build`. Tryb deweloperski i preview nadal wymagają jawnej konfiguracji środowiska.

## Znane ograniczenia

- testy wymagają izolowanej usługi PostgreSQL i dedykowanej bazy testowej;
- testy nadal nie obejmują anonimowej edycji/usuwania, importu backupu, TTL/revokacji ani innych problemów poza zakresem;
- ukrycie zakładki Backup ogranicza również dostęp do znajdującego się w niej UI importu, ale publiczny endpoint importu nie został zmieniony zgodnie z zakresem zadania;
- revert ma test zgodności tylko dla pojedynczego CompleteMatch i nie został w tym etapie przepisany jako operacja atomowa; nie cofa bezpiecznie dowolnego łańcucha już rozegranych meczów downstream;
- `undo-last` pozostaje mechanizmem legacy i nie otrzymał w tym etapie nowej transakcyjności ani polityki cascade;
- ochrona przed powtórnym CompleteMatch zwraca `409` i zapobiega podwójnym skutkom, ale nie jest pełnym mechanizmem idempotency key z pamiętaniem odpowiedzi na niezależne retry klienta.
