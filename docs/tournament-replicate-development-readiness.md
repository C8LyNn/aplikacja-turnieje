# Tournament Replicate — trwała baza deweloperska

Data: 2026-10-13. Zakres: nowe, niezależne dane deweloperskie; bez
kopiowania danych produkcji, zmian produkcji, push i publikacji.

## Izolacja i trwałość

- Utworzono osobną bazę `tournament_replicate_development` w zarządzanym
  deweloperskim PostgreSQL Replit, nie w tymczasowym klastrze `/tmp`.
- Narzędzie bazy w środowisku development oraz bezpośrednie połączenie
  aplikacji niezależnie potwierdziły źródłową bazę `heliumdb`, rolę
  `postgres` i lokalne połączenie przez Unix socket.
- Przed DDL nowy cel potwierdził dokładną nazwę i zero tabel publicznych.
  Nie otwierano połączeń do produkcji i nie użyto jej sekretów.
- Runtime-managed `DATABASE_URL` nie został zmieniony. Ustawiono tylko
  niepoufny `TOURNAMENT_DEV_DATABASE_NAME` w środowisku **development**.
  Backend wybiera nową bazę wyłącznie w zatwierdzonym środowisku dev.
- Produkcja bez ustawienia dev zachowuje dotychczasowe połączenie.
  Próba użycia selektora w produkcji, na deployment, z nieznaną nazwą
  albo z zewnętrznym URL jest odrzucana. Testy mają własne połączenia.
- Domyślne narzędzie SQL/panel bazy nadal wskazuje `heliumdb`, a nie
  nową bazę aplikacji. Nie należy wykonywać w nim migracji nowej bazy.

## Migracje

Wykonano wszystkie **0001–0040** w kolejności; SQL źródłowy nie został
zmieniony. Każda migracja ma własną transakcję; zmiany enum są zatwierdzane
przed następną migracją. Ręczny bootstrap jest chroniony sprawdzeniem
tożsamości, pustego celu przed 0001, blokadą advisory oraz ledgerem SHA-256.

Ponowne uruchomienie zweryfikowało 40 checksumów bez ponawiania DDL
ani usunięcia danych. Nie dodano migracji do startu aplikacji lub publikacji.
Po pierwszym przebiegu ledger wskazuje commit źródłowych migracji
`1c92bc64744b41b8477c91a06a5ae837dfdee08d`.

Ręczne polecenie do weryfikacji/resume, nie do publikacji:

```sh
NODE_ENV=development \
TOURNAMENT_DEV_DATABASE_NAME=tournament_replicate_development \
APP_COMMIT=$(git rev-parse HEAD) \
pnpm --filter @workspace/db development:bootstrap
```

## Dane

Dodano wyłącznie trzy jawnie syntetyczne gry:
`DEV_SYNTHETIC Alpha`, `DEV_SYNTHETIC Beta`, `DEV_SYNTHETIC Gamma`.
AppID są fixture'ami, a `steam_raw_data.synthetic=true`.
Brak turniejów i danych użytkowników; nie kopiowano produkcji ani
nie pobierano danych ze Steam. Liczniki: 1 unclassified, 2 review, 0 ready.

## Weryfikacja wykonana

- 40 migracji na nowym, rzeczywistym celu: PASS.
- Ponowna weryfikacja ledger/checksumów bez resetowania fixture'ów: PASS.
- Cztery testy izolacji wyboru bazy: PASS.
- Workspace typecheck: PASS.
- Backend i powiązane testy jednostkowe: 867 + 25 + 32 = 924, PASS.
- Build frontendu i uruchomienie API przez zwykły workflow: PASS.
- Read-only catalog preflight na nowym celu: PASS; wymagane kolumny,
  indeksy, triggery, job/retry/throttle i dokładne liczniki obecne.
- Zwykły preview/API: wyszukiwanie `DEV_SYNTHETIC Beta` zwraca jeden
  właściwy rekord i poprawne globalne liczniki. API po restarcie nadal
  czyta trzy fixture'y z trwałej bazy, zamiast zwracać schema-not-ready.

## Zapis i konflikty w zwykłym podglądzie — PASS

Użytkownik ustawił osobny **TOURNAMENT_DEV_CATALOG_ADMIN_TOKEN** przez
bezpieczny formularz Secrets. Jego wartości nie ujawniono ani nie
zapisano w kodzie/raporcie. Edycja dev nie pożycza
`STEAM_CATALOG_ADMIN_TOKEN` ani `SESSION_SECRET`.

Test wykonano na normalnym frontendzie, normalnym API i trwałym dev,
bez mocków, przechwytywania żądań, alternatywnego API lub zmiany autoryzacji.

1. Wyszukiwanie Beta, filtr Do sprawdzenia i wejście w szczegóły Alpha:
   PASS.
2. Zapis gatunku Action przez UI, z zachowaniem statusu review:
   HTTP 200; revision **1 → 2**, dane zapisane.
3. Kontrolowany zapis tych samych danych przez rzeczywiste API:
   HTTP 200; revision **2 → 3**.
4. Próba zapisania Adventure ze starego UI: HTTP **409**.
   Serwer pozostał przy Action/revision 3; szkic Adventure zachowano
   lokalnie wraz z komunikatem konfliktu.
5. „Wczytaj aktualną wersję” przywróciło Action/revision 3 i usunęło
   konflikt ze szkicu.
6. Świeży kontekst bez klucza: HTTP **403**, szkic pozostał niezapisany
   i nie zmienił danych serwera.

Pierwsza przeglądarka nie miała dostępu do zmiennych środowiska
serwera. Pozostałe uwierzytelnione kroki wykonał lokalny Playwright
z systemowym Chromium, pobierając klucz wyłącznie wewnątrz procesu.
`playwright-core` jest zależnością deweloperską; nie dodano osobnego
serwera testowego ani automatycznych testów/migracji do startu aplikacji.
Przeglądarkę zamknięto po teście. Zrzuty miały zamaskowane pole klucza.

W części uwierzytelnionej odnotowano zero błędów strony i jeden komunikat
błędu konsoli, którego treść nie została zapisana; scenariusz celowo
wywołał HTTP 409. Część bez klucza celowo wywołała 403.

Końcowe dane Alpha: review, Action, revision 3. Pozostałe fixture'y
pozostały bez zmian. Worker/import jobs nadal są wyłączone.
Po końcowym restarcie zwykłego workflow API ponownie potwierdzono
Alpha/review/Action/revision 3 przez publiczny endpoint oraz podgląd
szczegółów. Dane zapisane przez UI przetrwały restart procesu.

## Gotowość do wdrożenia

**Gotowe do pracy na trwałym dev:** schemat 0001–0040, odczyt,
wyszukiwanie, klasyfikacja, zapis i ochrona przed konfliktem wersji.
Katalog nie jest już zablokowany brakiem schematu/klucza w zwykłym preview.

Nie jest to zgoda ani rekomendacja natychmiastowej publikacji. Produkcyjne
wydanie wymaga osobno potwierdzonego backupu/restore i docelowego schematu,
testu zalogowanego organizatora oraz zaakceptowanego SHA. Żaden z tych
warunków nie został zastąpiony utworzeniem bazy dev. Nie wykonano push,
publikacji ani produkcyjnych migracji.
