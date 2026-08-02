# Tournament Routing Persistence V2

Migracja `0012_tournament_routing_persistence_v2.sql` zapisuje wersjonowaną,
skompilowaną definicję grafu routingu Tournament Engine V2. Jest to model
definicji, a nie wykonania: nie tworzy meczów runtime, nie przypisuje
uczestników do tras ani slotów i nie zapisuje historii wykonania.

Zapis jest append-only dla pary `(tournament_id, revision)`. Usługa
`saveCompiledRoutingPlanV2()` waliduje plan, blokuje turniej i jego etapy,
zapisuje cały graf w jednej transakcji oraz sprawdza relacyjny round-trip,
canonical payload i SHA-256. Ponowny zapis identycznej wersji jest
idempotentny; inna treść tej samej wersji jest konfliktem.

Odczyt rekonstruuje plan wyłącznie z tabel relacyjnych, ponownie uruchamia
publiczny walidator Patcha 01 i odrzuca nieznaną wersję, discriminant,
uszkodzony graf, payload lub checksum.

Nowa persystencja nie jest importowana przez runtime V1, publiczne API,
frontend ani Backup V2/V3. Istniejące i aktywne turnieje pozostają bez
backfillu w ścieżce `legacy_v1`. Dopiero osobny Patch 03 może podłączyć
resolver wykonawczy do CompleteMatch i pozostałego lifecycle.

Read-only preflight katalogu:

```text
EXPECTED_DATABASE_NAME=<database>
EXPECTED_DATABASE_SCHEMA=<schema>
DATABASE_URL=<connection>
pnpm --filter @workspace/db migrate:tournament-routing-persistence:preflight
```

Preflight wykonuje wyłącznie zapytania katalogowe w transakcji `READ ONLY` i
zwraca jeden ze stanów `needed`, `applied`, `conflict` albo `unsafe`.
`safe=true` jest możliwe wyłącznie dla pustego katalogu (`needed`) lub
katalogu dokładnie zgodnego z manifestem (`applied`). Preflight nie stosuje
migracji ani nie naprawia katalogu.

Wspólny manifest znajduje się w
`lib/db/scripts/tournament-routing-persistence-v2-catalog.mjs`. Kanoniczna
sygnatura obejmuje 273 uporządkowane fakty: relkind i właściciela 15 tabel,
wszystkie kolumny z typem, typmodem, nullability i defaultem, PK/UNIQUE/FK/CHECK
oraz wszystkie indeksy z kolejnością kluczy, metodą, predykatem i informacją,
czy indeks należy do constraintu. Test deploymentowy dowodzi, że 0012 tworzy
dokładnie ten katalog. Migracja przed jakimkolwiek DDL odrzuca stan częściowy,
konflikt definicji, obcy relkind, niedozwolone zależności oraz redundantne
indeksy; po DDL ponownie sprawdza pełną sygnaturę.

Wewnętrzne klucze obce grafu z semantyką `NO ACTION` są wdrażane jako
`DEFERRABLE INITIALLY DEFERRED`. Bezpośrednie usunięcie używanego węzła lub
slotu nadal jest blokowane przy zatwierdzeniu transakcji, natomiast usunięcie
zapieczętowanego planu może atomowo skaskadować wszystkie jego rekordy potomne
bez zależności od kolejności uruchamiania triggerów PostgreSQL.
