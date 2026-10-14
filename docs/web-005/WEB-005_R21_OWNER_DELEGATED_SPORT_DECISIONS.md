# WEB-005 — R21 / decyzje sportowe właściciela i delegacja szczegółów do A00

**Data rejestracji:** 2026-10-14 (Europe/Warsaw)  
**Źródło autoryzacji:** bezpośrednie wypowiedzi właściciela projektu w aktualnym wątku WEB-005/A00; nie podano zewnętrznego permalinku do samych wiadomości. A00 zapisuje treść wyboru i zakres delegacji, NIE podszywa się pod podpis kryptograficzny ani zgodę niezależnego HQ na wykonanie działań operacyjnych.  
**Podstawa specyfikacji:** [WEB-005_R21_OWNER_DECISION_PACKET.md](./WEB-005_R21_OWNER_DECISION_PACKET.md) §2, [A80 R20 sport](./agent-reports/A80/WEB-005_A80_R20_SPORT_DECISIONS.md), [WEB-005_WAVE_R21_AGENT_PROMPTS.md](./WEB-005_WAVE_R21_AGENT_PROMPTS.md).  
**Status:** OWNER_SELECTED / OWNER_DELEGATED_GAME_RULE; IMPLEMENTATION_NOT_AUTHORIZED; APP_NATIVE_TESTS_NOT_EXECUTED; RELEASE_NO_GO; SWARM006_HOLD.

## I. Zakres delegacji

Właściciel napisał (sens wypowiedzi): „jak pytania są tego typu, zezwalam na to, byś sam zdecydował”. Odczytujemy to w kontekście kolejnych pytań o **drobne/szczegółowe reguły turniejowe, dobór par i miejsca w klasyfikacji**. A00 może wybrać dobrze uzasadnione reguły projektowe i oznaczać je jako `A00_DECIDED_UNDER_OWNER_DELEGATION` z jawną proweniencją, bez kolejnego osobnego pytania do użytkownika.

**Delegacja nie obejmuje**: decyzji o ryzyku bezpieczeństwa/autoryzacji, migracji lub destrukcyjnych operacji DB, naruszenia kompatybilności danych backupów, podpisania WONT_FIX dla nierozstrzygniętych historycznych błędów, wypuszczenia produkcyjnego, merge/cherry-pick do release/main, wykonania płatnego CI, przekazania między rojami bez warunków, zatwierdzenia długu testowego jako zaliczenia testów. Te wymagają osobnego owner/HQ GO według bramek R21. Sama decyzja game designu nie potwierdza, że kod ją już implementuje.

## II. Potwierdzone bezpośrednie wybory właściciela

| Policy | Treść | Decydent/status |
|---|---|---|
| **EXEC-B — strategia testów** | Po formalnym zamknięciu WEB-005 SWARM-006 ma przejąć niewykonane testy; pełne testy integracyjne pozostają twardą blokadą wdrożenia. Bezpośredni wybór właściciela **nie** jest automatycznym `FINAL_HANDOFF_GO` ani deklaracją, że testy przeszły. | `OWNER_SELECTED_CONDITIONAL` |
| **S1 / TS-B — Swiss terminal match correction** | Dopuszczalna korekta po zakończeniu etapu Swiss: w jednej transakcji ponowne otwarcie i zgodna aktualizacja match, stage, tournament, champion/winners, active stage i stage-limited roster; bez kasowania/rozjeżdżania historii; pełny rollback i concurrent correctness. | `OWNER_EXPLICIT` |
| **S2-B — SE rounds** | `currentRound` zachowuje informację o najdalszej wygenerowanej rundzie, `actionableRound` wskazuje rundę wymagającą rozegrania meczów i napędza odpowiedni frontend/Host. | `OWNER_EXPLICIT` |
| **S3-B — Swiss SCORE_GROUP_FIRST** | Główny priorytet to podobny bilans/punkty, kolejny unikanie powtórek. Jeśli nie da się spełnić obu, powtórka może być legalna; wybór ma być deterministyczny, z udokumentowanym bounded solver/fallback. | `OWNER_EXPLICIT` |
| **S4-A — BYE** | Najniżej sklasyfikowany uczestnik bez wcześniejszego BYE w bieżącym etapie Swiss jest pierwszym kandydatem. Powtórzenie BYE dopiero gdy każdy uprawniony uczestnik w tym etapie miał przynajmniej jedno; zakres nie obejmuje poprzednich etapów. | `OWNER_EXPLICIT` |
| **S4-H-A — previous-opponent history** | Formalnie zakończone `no_contest` i walkowery liczą się jako wcześniejsze skojarzenie przeciwników; mecze anulowane nie. Nie narzuca to automatycznie punktowania, Buchholza, awansu ani odrębnej polityki bez rozegranego pojedynku. | `OWNER_EXPLICIT` |

## III. Wybór A00 pod bezpośrednią delegacją właściciela

### S5 — Double Elimination runner-up / decisive GF or GF Reset

**WYBÓR:** runner-up to przegrany **decydującego legalnie rozstrzygniętego Grand Final albo Grand Final Reset**; o miejscu nie decyduje pierwsza przegrana finału, jeśli system wymaga resetu.

- Rzeczywiście rozegrany decydujący mecz: przegrany jest drugi; zwycięzca pierwszy.
- Regulaminowy walkower w decydującym GF/GF Reset ma ten sam skutek dla rozstrzygnięcia miejsca (ale ma oddzielną proweniencję rozstrzygnięcia).
- Automatycznie wygenerowane techniczne `BYE` **nie liczy się jako rozegrany finał ani sztucznie nadana druga pozycja**; należy wyprowadzić miejsca z ostatniego rzeczywistego wiążącego rozstrzygnięcia w drabince.
- Jeżeli nie istnieje legalne decydujące rozstrzygnięcie i nie można go jednoznacznie wywnioskować, stan klasyfikacji jest `UNRESOLVED`, nie przyznajemy miejsca fikcyjną heurystyką.
- Testy: finał bez resetu, wymagany i rozegrany reset, walkower jako finał, techniczny reset BYE, błędne/cancelled no_contest, niekompletna historia.

**Status:** `A00_DECIDED_UNDER_OWNER_DELEGATION` / future implementation+QA necessary.

### S6 — Double Elimination places 3–N

**WYBÓR:** ranking na podstawie **fali drugiej porażki / faktycznego momentu eliminacji**. Uczestnik odpadający później plasuje się wyżej. Gracze odpadający w tej samej fali **dzielą miejsce**, jeśli nie ma odrębnego rozegranego meczu o pozycję.

- Walkower będący formalną porażką w lower bracket może stanowić drugą porażkę i eliminację; techniczne BYE nie generuje porażki ani sztucznej eliminacji.
- Nie przełamujemy współdzielonej lokaty `stageSeed` ani kolejnością ID bez explicite odrębnego zatwierdzonego tie-breaker contract.
- Standardowy układ miejsc: po finaliście/runner-up następna najpóźniejsza eliminacja to miejsce 3; wspólne miejsca przy eliminacjach równoczesnych przechodzą do kolejnej numeracji według liczby uczestników przed nimi (competition ranking, np. 3,3,5).
- Testy: DE4/DE8, liczby niebędące potęgą 2, system BYE, reset GF i walkower, odbudowa rankingu po cofnięciu wyniku i ponownym rozstrzygnięciu.

**Status:** `A00_DECIDED_UNDER_OWNER_DELEGATION` / future implementation+QA necessary.

### Doprecyzowanie techniczne S3/S4 bez zmiany zaakceptowanej semantyki

- Dla S3 najpierw minimalizujemy odejścia od grup punktowych, następnie liczbę rewanżów, potem stosujemy stabilny deterministyczny tie-break. Zastosuj ograniczony czas/rozmiar rozwiązywania i jawny fallback; dokładne wagi solvera wymagają testowej walidacji, nie są tu przyjętym parametrem implementacji.
- Dla S4, gdy wszyscy mieli już BYE, wybieramy najmniejszą liczbę historycznych BYE w **tym etapie**, a dalej najniższą klasyfikację; remis rozstrzygamy stabilnym identyfikatorem/rozstawieniem zgodnie z istniejącym legalnym tie-break, bez przypadkowości. To techniczne rozwinięcie reguły właściciela, nie nowe punktowanie.
- Historie `no_contest/walkover/cancelled` dotyczą kryterium powtórnych skojarzeń; ich punkty, SOS/Buchholz i przepisy awansu muszą wynikać z odrębnego aktualnego regulaminu, nie są ustalone tym zapisem.

## IV. Procedura wdrożeniowa / QA

1. A80 bierze tę kartę jako **decision input**, mapuje S1–S6 do realnych braków kodu, fixtures i regresji na aktualnych SHA; nie twierdzi, że PR45/47 implementują wszystkie te nowe reguły.
2. A00 dopiero po niezależnej ocenie zakresu wydaje **osobne precyzyjne GO** na własne gałęzie/plik kontraktu. R21 nadal ma ZERO automatycznych code lanes.
3. A60 weryfikuje aktualny kod na exact SHA; A50 obecnie 0 natywnych app tests, więc nie twierdzimy PASS.
4. WRĘCZENIE DO SWARM-006: realizujemy wybraną przez właściciela opcję **EXEC-B po formalnym zamknięciu WEB-005**, z osobnym finalnym owner/HQ gate i twardym zakazem staging/live bez composite QA. Brak merge/deploy w WEB-005.
5. Pozostały R21 owner packet: Basket D1–D6, Backup B1–B6, public Direct Revert RA/RB/RC, Steam/session, historyczny raw cache i brakujące oryginalne case-ID pozostają do podjęcia przez właściciela, **nie wchodzą w powyższą delegację**.

**Provenance:** decyzje S1–S4 i EXEC-B to jawne wypowiedzi właściciela w tej rozmowie; S5/S6 i podane doprecyzowania S3/S4 to decyzje koordynatora A00 **wprost delegowane** w kolejnej wypowiedzi. Nie przypisuj wyborów S5/S6 do bezpośrednio wypowiedzianych przez właściciela opcji. Dokument sam nie jest autoryzacją merge, płatnego CI, DB reset ani deploy.

**Status końcowy tej karty:** `OWNER_EXPLICIT_S1_TO_S4_AND_EXEC_B / A00_DELEGATED_S5_S6 / POLICY_IMPLEMENTATION_PENDING / R21_OTHER_OWNER_DECISIONS_OPEN / SWARM006_HOLD`.
