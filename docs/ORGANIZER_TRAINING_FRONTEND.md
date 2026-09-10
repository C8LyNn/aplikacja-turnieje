# Frontend szkoleniowy organizatora — pierwsza seria

Zakres przeglądu: interfejs organizatora i obsługujący go kod React. Lokalny turniej testowy: Swiss → finały, ośmiu graczy, zapisany wynik i oczekujące mecze. Bez audytu silnika, zmian backendu, schematu ani głównej nawigacji.

## Mapa ekranów i priorytety

| Obszar | Najważniejsza obserwacja | Priorytet / seria |
| --- | --- | --- |
| Szczegóły / overview | Status jest widoczny, ale podpowiedzi i panel następnego kroku konkurują o uwagę; nagłówek pokazuje techniczne `series_v1`. | P2; poza pierwszą serią |
| Prowadzenie / Host | Fokus wyróżnionego meczu i listy obejmowały cały turniej zamiast aktywnego etapu. Pusty widok nie odróżniał błędu odczytu od braku meczów. | P1; poprawione |
| Etapy | Wybór etapu, ranking i potwierdzenie zakończenia już istnieją. Ranking pokazuje techniczne statusy; wskazówka następnego kroku upraszcza przejście kwalifikantów. | P1 dla komunikatu przejścia, P2 dla etykiet; seria Etapy |
| Mecze | Ekran prowadzenia jest istniejącym miejscem obsługi; kolejka ukrywała pozycje po ósmej i pomijała trwające mecze. | P2; kolejka poprawiona w Host |
| Wpisywanie wyników | Potwierdzenie zapisu istnieje. Brak wspólnej blokady pozostałych operacji na czas requestu/refetchu; część błędów trafiała tylko do ogólnego toastu. | P1; blokada i feedback poprawione w Host |
| Korekta / historia | Cofnięcie ma potwierdzenie, ale lista pokazuje techniczne typy akcji, a kontekst etapu wymaga dopracowania. | P1/P2; kolejna seria Mecze + korekta |
| Gracze | Lista i edycja są dostępne; ikonowe akcje wymagają czytelnych nazw dostępności. | P2; seria Gracze |
| Losowanie | Prepare/reveal i zabezpieczenia istnieją; operacyjne komunikaty oraz wyjaśnienia blokad wymagają osobnego scenariusza szkoleniowego. | Do weryfikacji w serii Gracze + seeding |
| Kwalifikacja / koszyki | Mapa pokazuje przepływ, a po starcie konfiguracja jest tylko do odczytu. Trzeba wyraźnie odróżnić zaplanowaną liczebność wejścia od faktycznych arrivals. | P1; seria Etapy + readiness |
| Drabinka | Wybór etapu i jego status są dostępne; nie ma potrzeby zmieniać lokalizacji tej funkcji. | Bez zmiany w pierwszej serii |
| Konfiguracja podczas prowadzenia | BO, przełożenie, anulowanie i wyróżnienie meczu są dostępne w Host; wymagają spójnego feedbacku i rozróżnienia od zakończenia etapu. | P1/P2; nazwy i feedback poprawione w Host |

Nie potwierdzono P0 w sprawdzonym przebiegu. P3 (dekoracje, drobne odstępy w pozostałych widokach) odłożone. Nie jest to deklaracja pełnego pokrycia wszystkich formatów i ustawień.

## Pięć zmian pierwszej serii

1. Kontekst aktywnego etapu: jego nazwa, status, runda i liczniki. Kolejka, ostatnie wyniki i automatyczny fokus dotyczą tego etapu; historia turnieju pozostaje dostępna.
2. Oddzielenie ładowania, błędu i pustego wejścia. Błąd odświeżania wstrzymuje operacje i daje przycisk ponowienia.
3. Wspólne pending/error/refetch dla mutacji Host. Po zapisie blokada trwa do zakończenia odświeżenia; błędy pozostają na ekranie wraz z kodem diagnostycznym. Potwierdzenia kosztownych operacji zachowane.
4. Czytelniejsza hierarchia: status etapu przed wybranym meczem, mniejszy panel wyniku, podpowiedzi w rozwijanej sekcji, neutralniejsza prezentacja ostatniej akcji. Zachowany motyw dark futuristic.
5. Cała kolejka dostępna, także mecze trwające. „Wybrany” oznacza wybór do obsługi, a „Oczekuje” / „LIVE” stan meczu. Etykiety „Rozpocznij mecz”, „Zatwierdź wynik” i „Anuluj mecz” rozróżniają operacje.

## Weryfikacja i dalszy zakres

Testy komponentu obejmują aktywny etap i starszy wyróżniony mecz, kolejkę większą niż osiem pozycji, błąd odczytu i retry, rozróżnienie błędu sieci od braku uprawnień, podwójne kliknięcie, błąd zapisu oraz blokadę do refetchu.

Weryfikacja końcowa: frontend **155/155 PASS**, bez pominiętych testów; proces zakończył się sam po około 18 s. Frontend typecheck **PASS**, build **PASS** (około 8 s). Build nadal zgłasza ostrzeżenia o sourcemapach, foncie `valvepulp-bold.ttf` i wielkości chunka; nie rozszerzano zakresu o ich naprawę.

Wykonano oględziny wcześniejszego interfejsu w lokalnym turnieju. Końcową kontrolę wizualną po zmianach zablokowała automatyczna kontrola dostępu przeglądarki z powodu limitu użycia. Pozostaje ona wymagana przed przekazaniem wersji do szkolenia; testy komponentu nie zastępują tej kontroli.

Celowo pozostawiono: układ głównej nawigacji, backendowe reguły lifecycle, algorytmy kwalifikacji, mechanikę losowania, cały edytor wyników oraz kosmetykę innych ekranów. Szczegółowe zabezpieczenie niezapisanych wyników przy opuszczeniu strony i korekta wyników należą do następnej serii.

Następny obszar: **Mecze + wpisywanie i korekta wyników**. Kolejne serie: Etapy/readiness, następnie Gracze/seeding. Układ funkcji powinien pozostać stabilny na czas szkolenia.

## Druga seria — mecze i wyniki

- P1: edycja częściowego wyniku mogła zerować drugą stronę; teraz rozpoczyna się od pobranego wyniku. Błąd zapisu zachowuje wpis, konflikt 409 odświeża dane i nie pokazuje sukcesu. Zmiana uczestników, BO lub wyniku podczas edycji wymaga odrzucenia starego wpisu przed kolejnym zapisem. Odświeżenie strony i wyjście linkiem z Host ostrzegają o niezapisanym wyniku.
- P1: korekta miała ogólne potwierdzenie i pozostawiała użytkownika w historii. Teraz wskazuje parę, zapisany wynik oraz konsekwencje; po cofnięciu otwiera ten mecz do ponownego wpisu. Dla DE pobiera liczbę zależnych wyników z API właściwego etapu i wstrzymuje potwierdzenie do jej odczytu. Odmowa backendu pozostawia dialog z wyjaśnieniem.
- P2: lista grupowała wspólnie rundy różnych etapów. Teraz pokazuje etap, parę, wynik, czytelny status oraz akcję, z LIVE na początku grupy. Lista wszystkich meczów jest dostępna także po zakończeniu etapów. Opisy historii mają pierwszeństwo przed kodami technicznymi.
- Zwykły zapis w Host ma jeden przycisk, bez dodatkowego potwierdzenia. Blokada zapisu trwa do refetchu. Formularze DE blokują także edycję podczas requestu, odświeżają zależne dane i pokazują sukces/błąd; potwierdzenie cofnięcia zawiera uczestników i konsekwencje.

Bez zmian kontraktów API, reguł backendu, nawigacji głównej i motywu. Nie wdrażano własnej synchronizacji ani wersjonowania zapisu. Ochrona integralności przy wyścigu requestów pozostaje po stronie backendu. Nie rozszerzano serii na formularz grupowego wyniku Marvel ani operacje lifecycle.

**VISUAL QA: PENDING.** Wcześniejsza odmowa automatycznej kontroli dostępu przeglądarki (limit użycia) pozostaje nierozwiązana. Przed szkoleniem trzeba obejrzeć Host, listę/LIVE, zapis, korektę i stany błędu/pending na desktopie. Nie potwierdzono nowego P0; opisane P1/P2 objęto poprawkami i testami zachowań.

Weryfikacja drugiej serii: **167/167 frontend tests PASS**, bez pominięć, proces kończy się sam (około 7 s); **typecheck PASS**, **build PASS**. Zachowano na liście także mecze legacy bez etapu i wyróżnienie zwycięzcy. Pozostały wcześniejsze ostrzeżenia buildu o sourcemapach, foncie i wielkości chunka.

Następny obszar: **Etapy + readiness + operacje lifecycle**; nie rozpoczęto go w tej serii.

## Trzecia seria — Etapy, readiness i lifecycle

- P1: start znikał bez wyjaśnienia blokady, a lokalne warunki powielały readiness. Teraz planowany etap pokazuje przycisk, gotowość, liczebność i listę problemów z API, wraz z linkami do seedów/losowania lub koszyków. Zachowano dodatkową blokadę wynikającą z odpowiedzi API ceremonii sekwencyjnej — samo readiness składu jej nie uwzględnia.
- P1: pending kończył się przed pełnym odświeżeniem. Start i zakończenie mają wspólny oczekiwany refetch oraz synchroniczną blokadę kolejnego requestu. Konflikt/błąd odświeża stan bez komunikatu sukcesu; błąd readiness i podglądu zakończenia można ponowić.
- P2: naturalna kolejność etapów, wyraźny aktywny etap, wspólne nazwy „Planowany”, „Aktywny”, „Zakończony”, odróżnienie planowanej liczebności od danych uczestników. Zakończenie wyjaśnia zamrożenie rankingu i osobny start następnego etapu. Host kieruje do weryfikacji przez API zamiast osobno rekonstruować kompletność formatów.
- Pierwszy etap korzysta z istniejącego startu turnieju; kolejne z istniejącego startu etapu. Nie zmieniono backendu ani kontraktów. Readiness, podgląd kwalifikacji, ceremonia i odczyt propozycji pozostają źródłami stanu.
- **P1 pozostające po trzeciej serii (domknięte poniżej):** dla przepływu `basket_v1` istniały API zatwierdzania propozycji i wykonania routingu, lecz brakowało obsługujących je akcji we frontendzie. Trzecia seria pokazywała jedynie status i dalsze kroki. Nie potwierdzono nowego P0.

Weryfikacja: **175/175 frontend tests PASS**, bez pominięć, proces kończy się sam (około 7 s); **typecheck PASS**, **build PASS**. Testy obejmują start, request/refetch, konflikt, blokady, ceremonię, zakończenie i oczekującą kwalifikację. Pozostały wcześniejsze ostrzeżenia buildu.

**VISUAL QA: PENDING.** Wcześniejsza automatyczna kontrola dostępu przeglądarki odrzuciła podgląd z powodu limitu użycia. Następny krok to pełna kontrola wizualna Host + Mecze + Etapy oraz próba organizatora przed przekazaniem wersji szkoleniowej. Nie rozpoczęto kolejnej przebudowy.

## Czwarta seria — zatwierdzanie kwalifikacji i routing

Panel Etapy udostępnia istniejący przebieg API: zakończenie etapu → przygotowanie propozycji → zatwierdzenie kwalifikacji → wykonanie routingu → odczyt gotowości celu. Przygotowanie jest osobnym krokiem, ponieważ zakończenie etapu nie generuje propozycji automatycznie. Widok pokazuje uczestnika, miejsce w rankingu, koszyk i pozycję w koszyku z odpowiedzi serwera. Zatwierdzenie wymaga krótkiego potwierdzenia; zmiana wersji propozycji podczas potwierdzania wymaga ponownego przeglądu.

Każda skonfigurowana trasa pokazuje źródło, cel i stan wykonania z API. Po przekazaniu uczestników panel odświeża status routingu oraz readiness celu i pozwala przejść do tego etapu. Frontend nie oblicza awansów, legalności trasy ani gotowości. Brak konfiguracji kwalifikacji nie tworzy pustego workflow, a kwalifikacja bez tras nie wymaga routingu. Operacje są dostępne tylko organizatorowi.

Blokada podwójnego wysłania trwa przez zapis i cały refetch. Konflikty oraz błędy odświeżają stan i zachowują czytelny feedback bez fałszywego sukcesu. Udany zapis z nieudanym odczytem pokazuje niepotwierdzony stan i możliwość ponownego sprawdzenia. Nieaktualną propozycję można ponownie wygenerować z wyników przez istniejące API.

Weryfikacja: **192/192 frontend tests PASS**, bez pominięć, proces kończy się sam (około 7 s); **typecheck PASS**, **build PASS**. Dodano 17 testów zachowania, w tym pełne przejście panelu do backendowego `READY` z kontrolowanymi odpowiedziami API, pending/refetch, konflikty, błędy odczytu, zmianę propozycji, wiele tras i brak wymaganych operacji. Nie zmieniono backendu, kontraktów ani reguł lifecycle. Pozostały wcześniejsze ostrzeżenia buildu o sourcemapach, foncie i wielkości chunka.

**VISUAL QA: PENDING.** Wcześniejsza odmowa automatycznej kontroli dostępu przeglądarki z powodu limitu użycia pozostaje nierozwiązana. Pełny próbny turniej wykonany wyłącznie przez frontend również oczekuje na tę weryfikację. Test komponentu z kontrolowanymi odpowiedziami API nie zastępuje próby na działającej aplikacji. Następny krok: Visual QA całego krytycznego flow Host / Mecze / Etapy oraz próbny turniej. Po tej serii nie rozpoczynano kolejnej przebudowy.
