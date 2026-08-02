# ADR: czyste przejście na `series_v1`

## Status

Zaakceptowane i wdrożone w ramach gałęzi `feat/series-v1-clean-cutover`.
Zmiana jest świadomie destrukcyjna dla danych
domeny turniejowej i nie zapewnia kompatybilności z rekordami legacy.

## Decyzje

1. Nie zachowujemy kompatybilności danych z modelem piłkarskim `3/1/0`.
2. Przy wdrożeniu operator usuwa istniejące turnieje, uczestników, mecze,
   historię wyników, logi i sesje związane z turniejami.
3. Każdy nowy turniej ma `resultModelVersion = series_v1`.
4. Każdy nowy turniej ma `rankingPolicy = match_record_v1`.
5. Podstawowy model nie ma punktów klasyfikacyjnych ani ustawień `3/1/0`.
6. Remis całego meczu nie jest obsługiwany.
7. Wynik `2:1` oznacza wygrane gry, mapy lub partie w serii, nie gole ani punkty.
8. Mecze są jedynym źródłem prawdy dla statystyk i klasyfikacji.
9. `players` nie przechowuje materializowanych `wins`, `draws`, `losses` ani
   `points`.
10. Walkower, bye i no contest nie tworzą sztucznego wyniku `1:0`.
11. Double elimination pozostaje niedostępne do czasu osobnej implementacji.
12. Backup v1 jest odrzucany i nie jest reinterpretowany.
13. Reset dotyczy wyłącznie tabel domeny turniejowej, a nie bazy PostgreSQL,
    schematu, ról, rozszerzeń ani tabel innych systemów.

## Model rozstrzygnięcia

Lifecycle meczu to `pending`, `in_progress`, `postponed`, `completed` albo
`cancelled`. Finalny `resultType` jest osobnym pojęciem: `played`, `walkover`,
`bye` lub `no_contest`.

- `played` ma wynik serii i zwycięzcę wyliczonego ze score;
- `walkover` ma zwycięzcę i nie ma score;
- systemowy `bye` ma jednego uczestnika i nie ma score;
- `no_contest` nie ma zwycięzcy ani score.

## Operacyjne wdrożenie

Wersjonowana migracja znajduje się w
`lib/db/migrations/0001_series_v1_clean_cutover.sql`. Zwykły start aplikacji
jej nie uruchamia. Operator musi wykonać osobny skrypt z jawnym potwierdzeniem:

```bash
ALLOW_DESTRUCTIVE_TOURNAMENT_RESET=true DATABASE_URL="<deployment-database-url>" \
  pnpm --filter @workspace/db reset:series-v1:destructive
```

Przed wykonaniem na środowisku wdrożeniowym wymagane są osobna zgoda i backup.
W ramach tego zadania polecenie nie jest uruchamiane na Replit ani żadnej bazie
zdalnej.
