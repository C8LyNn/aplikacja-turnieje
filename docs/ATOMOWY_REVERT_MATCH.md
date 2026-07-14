# Atomowy RevertMatch

## Zakres

`POST /api/matches/{id}/revert` oraz cofnięcie ostatniej akcji typu
`match_result_submitted` używają jednego przypadku użycia `RevertMatch`. Operacja
odwraca dokładnie jedną rewizję zapisaną przez legacy `CompleteMatch` i nie
wprowadza modelu `series_v1`.

## Transakcja i blokady

Cała operacja działa w jednej transakcji PostgreSQL. Blokady są pobierane w
kolejności zgodnej z `CompleteMatch`:

1. turniej;
2. cofany mecz;
3. obaj uczestnicy według rosnącego identyfikatora;
4. mecz downstream, jeżeli istnieje;
5. najnowsza rewizja `result_history` i właściwy aktywny wpis
   `match_result_submitted`.

Przed pierwszym zapisem sprawdzane są: spójność wyniku legacy, uczestników,
liczników, historii, logu zakończenia, finalizacji turnieju oraz downstream.
Kontrolowany błąd w dowolnym późniejszym kroku wycofuje mecz, statystyki,
drabinkę, finalizację i logi razem.

## Downstream

Dla formatów eliminacyjnych slot awansu może zostać wyczyszczony tylko wtedy,
gdy kolejny mecz jest nadal `pending`, nie ma wyniku, zwycięzcy ani czasu
zakończenia, a zwycięzca cofanej pary znajduje się dokładnie w oczekiwanym
slocie. Drugi slot pozostaje bez zmian.

Mecz rozpoczęty, przełożony, anulowany, zakończony, walkower, bye, częściowo
wpisany wynik lub nieoczekiwany uczestnik blokują revert kodem `409`. Nie ma
automatycznego cascade revert.

Round Robin i Swiss nie mają klasycznego slotu downstream. Cofnięcie wyniku
Round Robin przywraca ukończony turniej do `active`, czyści `winnerId` i status
zwycięzcy, ale nie wybiera nowego zwycięzcy. Logika parowania i finalizacji Swiss
nie jest przebudowywana. Jeżeli istnieją już pary z późniejszej rundy Swiss,
revert wcześniejszego wyniku jest blokowany kodem `409`, aby nie pozostawić
pairingu wyliczonego z cofniętych statystyk.

## Statystyki, historia i audyt

Zachowany jest model legacy:

- zwycięzca: `wins - 1`, `points - 3`;
- przegrany: `losses - 1`;
- remis: obu uczestnikom `draws - 1`, `points - 1`.

Liczniki są sprawdzane po zablokowaniu rekordów. Nie używa się
`GREATEST(..., 0)` do ukrywania niespójności.

`result_history` pozostaje trwałym zapisem zatwierdzonych wyników i nie jest
usuwane. Oznaczany jako `undone` jest dokładnie jeden aktywny wpis
`match_result_submitted`, którego payload wskazuje cofany mecz. Następnie
powstaje osobny, nieundoowalny wpis `match_result_reverted`. Ponowne zakończenie
meczu tworzy kolejną rewizję historii.

## Błędy HTTP

- `404` — brak meczu, turnieju, uczestnika albo wymaganej rewizji historii;
- `409` — mecz nie jest zakończony, wynik został już cofnięty, zmieniła się
  akcja undo, wystąpiła konkurencyjna modyfikacja albo downstream blokuje revert;
- `422` — niespójny wynik, uczestnicy, statystyki, historia, log lub finalizacja;
- `401/403` — zgodnie z istniejącą polityką zapisu turnieju.

## Świadome ograniczenia

Legacy BO3 `1:0` nadal jest akceptowane, nie ma walidacji progu serii ani zmiany
punktacji `3/1/0`. Zadanie nie naprawia modelu double elimination, nie
przelicza standings, nie zmienia backupu i nie migruje starych danych. Te
elementy pozostają do rozwiązania wraz z wersjonowanym modelem `series_v1`.
Revert nie wykonuje również globalnej rekalkulacji `currentRound`; zachowuje
dotychczasową semantykę wskaźnika rundy i odwraca wyłącznie konkretny awans.
