# Minimalna procedura 0030–0040 — 2026-10-13

**Dev przygotowany. STOP przed produkcją: sam Publish nie przenosi pełnego SQL.**

## Potwierdzono

- Aktualny kod bazowy: `e85365b45da5fba10e04c4caa72ba591b88df2fe`.
- Publikacja jest aktywna; Production Database przypisana temu projektowi
  to Neon (`neondb`). Platforma oznacza produkcyjny `DATABASE_URL` jako
  runtime-managed; kod używa tego klucza, nie `PRODUCTION_DATABASE_URL`
  ani starego sekretu transferowego. Cel administrator wybiera w Settings
  **Production Database tego projektu**, nie z historycznego connection stringa.
  Healthcheck nie jest niezależnym dowodem tożsamości połączenia procesu live.
- Odczyt schematu: brak operacji korekt, revision, import jobs, liczników
  i limitera. Nie zastosowano produkcyjnych migracji.
- Po przygotowaniu właściwego managed dev podgląd Publish:
  `success=true`, `hasDiff=true`, **15 instrukcji SQL**, bez usuwania
  tabel/kolumn. CHECK, FK i indeksy są w planie, ale brakuje funkcji,
  triggerów i inicjalizacji. Plan zawiera trzy indeksy GIN bez instalacji
  `pg_trgm`; rozszerzenie jest dostępne, ale jeszcze nieobecne w produkcji.
- Baza `tournament_replicate_development` jest osobnym celem aplikacji,
  nie domyślnym celem panelu dev. Konfiguracja Drizzle dodatkowo pomija
  tabele aplikacji. Nie zmieniano tych zabezpieczeń ani ustawień publikacji.
  No-op ORM push nie wyłącza natywnego porównania schematów baz przy Publish.

## Bieżące przygotowanie

Odczytowy test terminala potwierdził, że istniejący `PRODUCTION_DATABASE_URL`
prowadzi do tego samego celu co produkcyjny dostęp platformy: porównano
łącznie tożsamość projektu Neon, gałęzi i bazy. Połączenie nie jest fizyczną
repliką i ma ACL do CREATE w public, ALTER katalogu i INSERT markerów.
W teście wymuszono read-only i nie wykonano DDL. Ograniczenie odczytowe
narzędzia Agenta nie oznacza braku uprawnień tego poświadczenia; nie
upoważnia to jednak Agenta do bezpośrednich zmian zarządzanego schematu
produkcyjnego. Sekretu nie trzeba wymieniać z powodu tego testu.

Wykonano 0030–0040 wyłącznie na zweryfikowanym lokalnym managed dev
`heliumdb` (Unix socket, rola `postgres`). Cały zakres był objęty jedną
transakcją i blokadą advisory. Dodano 11 markerów do istniejącego
`app_schema_migrations`, bez zmiany jego struktury i wcześniejszych wpisów.
Porównanie liczebności/checksumów potwierdziło zachowanie istniejących
danych w 45 tabelach oraz ról. Zamierzone dodatki to revision, termin
abstrakcyjnego świata i nowe tabele. Preflight katalogu: PASS.
Nie zmieniono produkcji ani osobnego `tournament_replicate_development`.

## Minimalna kolejność

1. Administrator wybiera Production Database tego projektu w Database →
   Settings i używa jej aktualnego połączenia w zewnętrznym, zgodnym
   z PostgreSQL kliencie. Poświadczenia nie trafiają do czatu/repo/logów.
   Nie używa starego sekretu transferowego. Przed DDL potwierdza wybrany cel.
2. **Właściwy dev używany przez Publish jest już przygotowany**
   niedestrukcyjnymi zmianami wymaganymi przez 0030–0040.
   Nie uruchamiać 0001, resetu, overwrite-data ani pełnego bootstrapu na
   istniejącej bazie. Nie usuwać turniejów, danych dostępu lub konfiguracji.
3. Ponownie odczytać plan Publish. Musi obejmować:
   - 0030–0031: tabelę, FK, indeks, pola receipt i oba końcowe CHECK;
   - 0032: inicjalizację `world / abstract-no-setting`;
   - 0033–0034: dwa indeksy paginacji oraz revision z domyślną wartością 1;
   - 0035: opcjonalne `pg_trgm` i trzy GIN, jeśli rozszerzenie jest dostępne;
   - 0036: tabelę/wiersz liczników, funkcję i trzy triggery;
   - 0037–0040: jobs, indeksy/CHECK, source/page, retry i limiter.
   DDL samej tabeli nie zastępuje funkcji, triggerów ani inicjalizacji.
   Obecny plan ich nie przenosi. **Nie uruchamiać samego Publish jako migracji.**
   Do zastosowania pełnego zakresu potrzebna jest osobno autoryzowana
   operacja administratora w jego kliencie PostgreSQL: istniejące pliki
   `lib/db/migrations/0030_*.sql` do `0040_*.sql`, w kolejności, atomowo
   per plik, z przerwaniem po pierwszym błędzie. 0031 ma własne
   BEGIN/COMMIT; nie zagnieżdżać ich w transakcji obejmującej cały zakres.
   Agent nie tworzy produkcyjnego runnera i nie uruchamia DDL na produkcji.
   Nie dodawać SQL do startup/build. Przed późniejszą publikacją ponownie
   sprawdzić diff, zwłaszcza zgodność indeksów GIN z dostępnością `pg_trgm`.
4. Kompletny finalny plan sprawdzić na osobnym środowisku ze stanem
   sprzed zmian; zachować dane dostępu i konfigurację. Sprawdzić też
   ścieżkę korekty zalogowanego organizatora.
5. Dopiero potem operator osobno autoryzuje plan zmiany schematu
   i publikację dokładnego finalnego SHA. Ten dokument niczego nie wdraża.

## Wykonany test izolowany — PASS

Test: `lib/db/test/release-migrations-0030-0040.integration.test.mjs`.
Własny, lokalny PostgreSQL 16; nowa pusta baza i wyłącznie syntetyczne dane.
Baseline 0001–0029 utworzono tylko w pustej bazie testowej, a następnie
zastosowano 0030–0040, po jednej transakcji na plik, i powtórzono ten zakres.

- Liczebności/checksumy istniejących danych w 45 tabelach zachowane.
- Dane dostępu/sesje/konfiguracja i role zachowane.
- CHECK korekt zwalidowane; preflight katalogu PASS.
- INSERT/UPDATE/DELETE uruchamiają właściwe zmiany liczników.
  Te operacje dotyczyły tylko syntetycznej gry i zostały wycofane.
- Zamierzone dodatki: revision i termin `abstract-no-setting`.
- Brak zmian w stałym dev, produkcji, konfiguracji i SQL źródłowym.

Uruchomienie wymaga świeżej pustej bazy w własnym lokalnym klastrze,
roli `release_test_owner` i wolnego portu; test nie tworzy ani nie resetuje
istniejącej bazy i odrzuca połączenia zewnętrzne/deployment:

```sh
NODE_ENV=test TEST_DATABASE_RESET=EMPTY_RELEASE_TEST_DATABASE \
TEST_DATABASE_URL='postgresql://release_test_owner@127.0.0.1:57331/tm_release_0030_0040_test_new' \
pnpm --filter @workspace/db exec node --test \
  ./test/release-migrations-0030-0040.integration.test.mjs
```

**Nie jest to polecenie migracji produkcyjnej.**
Nie wykonano commita, push, merge, publikacji, restartu live ani backupu.
