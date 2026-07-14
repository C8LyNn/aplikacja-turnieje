# ADR: `series_v1` i atomowe `CompleteMatch`

Data: 2026-07-14
Status: zaakceptowane jako kierunek; wdrożenie etapowe

## Kontekst

Obecny model legacy łączy wynik serii, status meczu i klasyfikację 3/1/0. Pozwala też zakończyć mecz bez pełnej walidacji uczestników i wykonać jego skutki w wielu niezależnych zapisach. Istniejące dane mogą zawierać historyczne wyniki, takie jak BO3 `1:0`, dlatego nie wolno objąć ich nową interpretacją bez wersjonowania i audytu.

## Decyzje

1. `score1:score2` oznacza liczbę wygranych gier, map albo partii w jednej serii, nie gole ani punkty klasyfikacyjne.
2. Dla `series_v1` `bestOf` jest dodatnią, nieparzystą liczbą całkowitą.
3. Liczba wygranych potrzebna do zwycięstwa wynosi `floor(bestOf / 2) + 1`.
4. Normalnie rozegrana seria bez remisów ma dokładnie jednego zwycięzcę. Jedna strona osiąga próg, druga pozostaje w zakresie od `0` do `winsRequired - 1`.
5. `winnerId` zawsze wskazuje jednego z dwóch uczestników meczu, a obaj uczestnicy należą do turnieju meczu.
6. Bye i walkower będą docelowo osobnymi rodzajami rozstrzygnięcia i nie będą tworzyć sztucznego wyniku mapowego `1:0`.
7. `CompleteMatch` jest pojedynczym atomowym przypadkiem użycia. Zapis meczu, statystyki, historia, log, awans, eliminacja i finalizacja odbywają się w jednej transakcji.
8. Powtórne lub równoległe zakończenie już rozstrzygniętego meczu jest konfliktem `409`; nie nalicza ponownie żadnych skutków.
9. Docelowym źródłem prawdy będą rekordy meczów. Materializowane liczniki graczy mogą pozostać wyłącznie kontrolowaną, przebudowywalną projekcją.
10. Obecne W/D/L oraz punkty `3/1/0` pozostają tymczasowym modelem legacy: wygrana `+1 win/+3 points`, porażka `+1 loss`, dozwolony remis `+1 draw/+1 point`.

## Zakres bieżącego etapu

Ten etap dodaje czysty, ścisły walidator rozegranej serii oraz zabezpiecza nowe wywołania legacy `CompleteMatch` pod względem score, remisu, zwycięzcy, uczestników, atomowości i współbieżności. Ścisły próg BO nie jest jeszcze podłączany do istniejących turniejów.

Ten etap nie dodaje:

- `resultModelVersion` ani automatycznego przypisania `series_v1`;
- migracji lub reinterpretacji historycznych wyników;
- nowej klasyfikacji, standings ani polityki punktowej;
- osobnego pola `resultType` w bazie;
- pełnej obsługi bye, walkowera i `no_contest`;
- backupu v2.

## Konsekwencje

Nowe operacje legacy nie mogą zapisywać ujemnych lub ułamkowych score, sprzecznego winnera ani niedozwolonego remisu. Historyczne dane pozostają czytelne bez walidacji wstecznej. Włączenie pełnego progu BO wymaga kolejnego etapu: wersjonowania modelu, migracji addytywnej, raportu jakości danych i jawnego wyboru polityki dla nowych turniejów.
