# Frontend szkoleniowy organizatora — wdrożenie i walidacja

Aktualny wynik: **manualne Visual QA wykonane 2026-09-11, z problemami opisanymi w sekcji „Walidacja manualna” poniżej**. Próbny turniej zakończony. Historyczne wpisy `VISUAL QA: PENDING` dotyczą wcześniejszych serii; nie opisują już dostępności przeglądarki. Nie jest to zatwierdzenie wszystkich formatów do użycia produkcyjnego.

## Historia — pierwsza seria

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

## Walidacja manualna — 2026-09-11

Testowany kod: `codex/organizer-host-training`, `7c957aacf973e0e6647a36a76b663ea6de0e7e56`. Commit był na origin. Potwierdzony przodek backendowy: `64c81cada1d0ed0db2b5f570ef2e4fb9c0e8d456`. Bez zmian kodu produkcyjnego, ponownego audytu ani przebudowy lifecycle.

### Manual QA scenario

Wznowiono ten sam turniej lokalny #1: „QA szkolenie 11.09 — kwalifikacja i finał”. PostgreSQL 16, baza `organizer_training_test`, schemat `tm_test_training_qa`, wyłącznie `127.0.0.1:55440`; aplikacja na `127.0.0.1:4173`. Przeglądarka desktopowa, oględziny rzeczywistych ekranów i dialogów, dwie sesje organizatora oraz Audience/projector. Nie korzystano z produkcyjnej bazy.

Przez UI: utworzenie turnieju i czterech graczy, konfiguracja RR BO3 → finał SE BO3 dla dwóch osób, koszyki i trasa, start, siedem wyników, korekta pierwszego wyniku, zakończenie RR, wygenerowanie i zatwierdzenie kwalifikacji, routing dwóch osób, READY i start finału, LIVE, wynik finału, zakończenie ostatniego etapu. Dodatkowo sprawdzono kwalifikację skonfigurowanego końcowego koszyka bez dalszej trasy.

| Etap | Końcowe wyniki / ranking |
| --- | --- |
| Eliminacje | Alicja–Dawid 2:1; Celina–Bartek 0:2; Celina–Alicja 0:2; Dawid–Bartek 0:2; Alicja–Bartek 2:0; Dawid–Celina 0:2. |
| Ranking RR | Alicja 3–0 (gry 6:1), Bartek 2–1 (4:2), Celina 1–2 (2:4), Dawid 0–3 (1:6). Alicja i Bartek w zatwierdzonej propozycji i routingu. |
| Finał | Alicja–Bartek **2:0**; zamrożony ranking finału: Alicja #1, Bartek #2. |
| Turniej | **completed**, oba etapy zakończone, **7/7 meczów completed**. Audience pokazuje zwyciężczynię Alicję. Końcowe wyniki potwierdzone dodatkowym odczytem DB. |

**Cały lifecycle turnieju wykonano przez UI. Cała próba nie była jednak wyłącznie UI:** po utracie pierwotnej sesji turnieju bez hasła użytkownik wyraźnie zatwierdził jednorazowe odzyskanie dostępu skryptem `recover-legacy-organizer`. Nadano początkowe hasło tylko temu turniejowi w lokalnej bazie. Nie zmieniano skryptem wyników, uczestników ani lifecycle. Dalsze logowania odbywały się normalnie przez UI.

### Passed flows

- Start pokazuje blokery i potwierdzenie; odświeżenie zachowuje aktywny etap. Host rozróżnia gotowe, LIVE i zakończone mecze. Korekta 2:0 → cofnięcie → 2:1 zachowuje poprawny zapis po refreshu.
- Odrzucone przedwczesne zakończenie RR pokazuje `STAGE_INCOMPLETE`, blokuje potwierdzenie i udostępnia ponowienie. Po zapisaniu ostatniego meczu w drugiej karcie „Ponów sprawdzenie wyników” pokazuje kwalifikantów i odblokowuje zakończenie.
- Propozycja pokazuje nazwiska, miejsca, koszyk i kolejność. Potwierdzenie approval wyjaśnia utrwalenie składu i osobny routing. Po sukcesie akcja zatwierdzenia znika; refresh zachowuje stan.
- Routing pokazuje źródło Eliminacje i cel Finał. Po wykonaniu wyświetla liczbę **2** i „Etap gotowy do startu”; readiness oraz panel następnego kroku aktualizują się bez ręcznego refreshu. Kolejny refresh zachowuje READY. Routing nie ma osobnego confirmation; liczby osób nie podaje wprost przed wykonaniem (skład jest w tabeli propozycji).
- Finał: start → LIVE → robocze 1:0 → zapis 2:0 → zakończenie etapu → zakończony turniej. Organizatorska drabinka poprawnie pokazuje tylko finał i zwyciężczynię.
- Szybkie dwa kliknięcia startu, zapisu wyniku, zakończenia RR i approval RR nie spowodowały podwójnego zapisu. Logi potwierdzają po jednym właściwym POST. Dla routingu zarejestrowano jeden udany POST, ale **nie wykonano skutecznej manualnej próby podwójnego kliknięcia**; nie zaliczamy jej na podstawie samego logu. Ochrona routingu pozostaje pokryta wcześniejszym testem komponentu.
- Kwalifikacja końcowego koszyka nie wymaga pustego routingu. Nie testowano osobnego turnieju całkowicie bez kwalifikacji ani ceremonii seeding; użyto istniejących seedów i zachowania kolejności wejścia.

### P0

**P0-01 — utrata jedynego dostępu do turnieju bez hasła.** Po zamknięciu pierwotnej karty/sesji nie można było kontynuować zapisów. Token organizatora jest w `sessionStorage`, a znacznik zarządzania w `localStorage` nie jest poświadczeniem. Nowa karta nie ma odziedziczyć takiego tokena; samo to jest zamierzonym zachowaniem auth. Problem operacyjny: utworzenie turnieju bez hasła nie zapewnia później samodzielnego odzyskania dostępu przez UI. W tej próbie potrzebna była administracyjna interwencja za zgodą użytkownika. Dane pozostały nienaruszone, QA odblokowano, **przyczyny produktowej nie naprawiono**. Przed użyciem trzeba ustawić hasło w dostępnej sesji i sprawdzić ponowne logowanie. Nie zaobserwowano innego P0 w tym scenariuszu.

### P1

- **P1-01 — automatyczny wybór meczu zmienia formularz podczas edycji.** A: automatycznie wybrany Celina–Alicja, robocze 1:0 bez kliknięcia karty meczu. B zapisuje ten mecz 0:2. Polling A przełącza formularz na Dawid–Bartek; następne kliknięcie w tym samym miejscu edytuje już inną parę. Stary draft pozostaje ukryty. Nie zapisano błędnego wyniku, ale ryzyko jest bezpośrednie. W `tournament-host.tsx` automatyczny fokus zależy od oczekujących meczów, a `adjustScore` nie utrwala jawnego wyboru. Przy jawnym wyborze meczu ochrona działa — szczegóły poniżej.
- **P1-02 — publiczna drabinka i projektor mieszają etapy RR → SE.** Otworzyć `/tournaments/1/bracket` podczas RR, następnie uruchomić finał. Po pollingu pojawia się siódmy mecz w terminarzu RR, a nagłówek nadal pokazuje RR 1/3. Po refreshu format zmienia się na SE, ale wszystkie siedem meczów tworzy pozorny ćwierćfinał/półfinał/finał. Tak samo zachowuje się `audience?section=bracket`, również po zakończeniu. Organizatorskie `?tab=bracket` pokazuje poprawny pojedynczy finał. Celowane sprawdzenie kodu projektora potwierdza odczyt drabinki całego turnieju i brak okresowego odświeżania metadanych turnieju. Bez naprawy.

### P2

- Sprzeczne dalsze kroki: po RR checklista mówi „Wszystkie mecze zakończone. Możesz zakończyć turniej”, gdy finał jeszcze nie wystartował. Panel następnego kroku akcentuje brak seedów zamiast oczekującej kwalifikacji. Właściwa akcja znajduje się poniżej rankingu i sześciu meczów.
- Po routingu readiness podaje 2/2 i gotowość, lecz sekcja składu nadal mówi „Uczestnicy pojawią się po kwalifikacji”. Po końcowym finale feedback zakończenia nadal odsyła do kolejnego etapu. Kontekst komunikatów wymaga dopracowania.
- Udanym startom/zakończeniu/approval towarzyszy krótki stan zamykanego dialogu z tekstem „Etap został już uruchomiony”, `STAGE_NOT_ACTIVE` lub „Propozycja zmieniła się”. Nie było drugiego POST ani trwałego błędu, ale wygląda to jak konflikt własnej poprawnej operacji.
- Nagłówek RR pozostaje „Runda 1/3” podczas rundy 3. Audience „Ostatnie wyniki” po finale nadal pokazuje pięć wyników RR i pomija dopiero zapisany finał. Historyczne i bieżące wyniki wymagają jednoznacznego kontekstu etapu/czasu.
- Gęstość: checklista, panel następnego kroku, stan logowania i nagłówek Etapów odsuwają właściwe czynności pod pierwszy ekran. Zielone znaczniki „Planowany” i „Zakończony” są zbyt podobne.
- Słaby kontrast czerwonych akcji/błędów na granatowym tle (np. „Anuluj mecz”, błąd kompletności). Dialogi startu, korekty i approval mieściły się w sprawdzonym widoku; nie zaobserwowano ucięcia ich treści.
- Techniczne `series_v1`, `active`, `eliminated` oraz „Awans” przy zwyciężczyni ostatniego etapu utrudniają odczyt pod presją.

### P3

Drobne teksty: „1 meczów”, brak polskich znaków w części checklisty, powtórzone komunikaty „Kwalifikacja zatwierdzona”. Nie wykonywano osobnego przeglądu kosmetycznego.

### Multi-window

Po ustanowieniu hasła dwie niezależnie zalogowane karty działają. Przy **jawnym wyborze** meczu A zachowała parę i pokazała: wynik roboczy 1:0, aktualny 0:2 oraz akcję odrzucenia draftu po zapisie B. Edycja/zapis zostały zablokowane, bez fałszywego sukcesu. Automatyczny wybór ma P1-01.

Dodatkowo A otworzyła approval końcowej propozycji v1; B wygenerowała v2 przez „Odśwież propozycję z wyników”. A pokazała zmianę propozycji i zablokowała zatwierdzenie. Zamknięcie, przegląd v2 i ponowne potwierdzenie zakończyły się sukcesem. To test wykrycia stale state przez odświeżenie; **nie uzyskano odpowiedzi HTTP 409 w wyścigu zapisów** i nie deklarujemy jej ręcznej walidacji.

### Refresh/recovery

PASS: refresh aktywnego etapu, LIVE, zakończonego RR, wygenerowanej niezatwierdzonej propozycji, zatwierdzonej propozycji, wykonanego routingu/READY, aktywnego finału i zakończonego turnieju. Dane trwałe odpowiadały backendowi.

BO3 1:0 jest jawnie oznaczonym **niezapisanym draftem**; przycisk zapisu jest wyłączony do osiągnięcia wyniku końcowego. Audience pokazuje w tym czasie zapisane 0:0. Próba refreshu z draftem nie opuściła formularza w użytej automatyzacji; draft 1:0 pozostał i został później uzupełniony do 2:0. Kod instaluje `beforeunload` i ostrzeżenie przy opuszczeniu Host; draft jest stanem React. **Nie potwierdzono ręcznie zachowania po zaakceptowaniu natywnego ostrzeżenia przeglądarki** — nie traktujemy tej próby jako dowodu trwałego zapisywania częściowych wyników ani jako P1 utraty danych.

Backend rejection i skuteczne ponowienie: `STAGE_INCOMPLETE` jak wyżej. Bezpiecznie zatrzymano wyłącznie lokalne API po zakończeniu turnieju: Host zachował dane, pokazał błąd odświeżania i wstrzymał operacje. Po uruchomieniu tego samego serwera polling sam przywrócił aktualny stan i odblokował UI, bez odświeżania strony. Nie zmieniano DB podczas tego testu. Recovery dostępu wymagało wyjątku opisanego w P0-01.

### Audience/projector

Audience Na żywo aktualizuje LIVE i zakończenie przez polling; zwyciężczynię pokazuje także po refreshu i zakończeniu ładowania. Częściowy draft nie jest publikowany. Audience Etapy aktualizuje statusy i nazwę aktywnego finału, zachowując wcześniej wybraną kartę Eliminacji; nie przełącza automatycznie oglądanego etapu. To jawny wybór w interfejsie, nie zatrzymany polling. Organizatorska drabinka ma poprawny zakres etapu. **Publiczna drabinka i projektor: FAIL (P1-02)**. Nie deklarujemy poprawności widoków publicznych dla całego flow.

### Excel benchmark

Ocena jakościowa tej próby względem prostego, przygotowanego arkusza. Nie przeprowadzono mierzonego testu szybkości w Excelu ani nie otrzymano arkusza najbliższego turnieju; ocena nie dotyczy dowolnego zaawansowanego szablonu.

| Kategoria | Ocena | Uzasadnienie |
| --- | --- | --- |
| Wprowadzanie uczestników | EXCEL BETTER | Prosta lista jest szybsza do zbiorczej edycji; sprawdzony flow aplikacji wymaga konfiguracji i formularzy. |
| Rozpoczęcie turnieju | EXCEL BETTER | Dla prostego formatu koszt nauki etapów, koszyków i readiness nie daje jeszcze jednoznacznej korzyści. |
| Wprowadzanie wyniku | SIMILAR | Plusy BO3 i jeden zapis są czytelne; nie wykazano przewagi czasowej nad wpisem do komórki. |
| Korekta błędu | APP BETTER | Potwierdzenie pary i konsekwencji, cofnięcie i ponowny zapis chronią wynik. |
| Tabela / ranking | APP BETTER | Automatyczne statystyki i zamrożenie rankingu ograniczają ręczne operacje. |
| Kolejne mecze | APP BETTER | Generowanie par, kolejka i LIVE ograniczają ręczne pilnowanie terminarza przy jednym operatorze. |
| Wieloetapowość | APP BETTER | Sprawdzony przepływ kwalifikacja → routing → READY jest realną automatyzacją. |
| Widoczność aktualnego stanu | SIMILAR | Host ma użyteczne liczniki, lecz sprzeczne wskazówki i numer rundy osłabiają przewagę. |
| Praca wielu operatorów | EXCEL BETTER | P1-01 stwarza ryzyko zmiany obsługiwanego meczu pod ręką operatora. |
| Widok publiczny | SIMILAR | LIVE i ekran zwycięzcy są zaletą; błędna drabinka/projector odbierają pewność całego rozwiązania. |
| Odporność na błędy | APP BETTER | Backendowe blokady, potwierdzenia, pending i wykrywanie starej propozycji rzeczywiście zadziałały. |
| Recovery | EXCEL BETTER | Utrata sesji turnieju bez hasła wymagała interwencji administracyjnej; recovery odczytu działa. |

### Current verdict

**Najbliższy prosty turniej: EXCEL PREFERRED. Czy aplikacja już wyraźnie przebija Excel: NO.** Nie znamy dokładnego arkusza i pełnych ustawień tego wydarzenia; to konserwatywny werdykt na podstawie obecnego produktu. Udany turniej testowy nie usuwa P0 dostępu i P1 operacyjnych. **Nie zatwierdzamy jeszcze wersji do samodzielnej obsługi turnieju przez przeszkolonego tylko z UI operatora (NOT READY).** Możliwa jest kontrolowana próba szkoleniowa z wcześniej sprawdzonym hasłem i znajomością ograniczeń.

### Product readiness for later tournaments

Rdzeń jest użyteczną podstawą: reprezentatywny RR → kwalifikacja → routing → finał ukończono bez ręcznych zmian lifecycle. Dla dwóch późniejszych, bardziej złożonych wydarzeń potrzebne są poprawki i ponowna próba ich rzeczywistych formatów. To nie jest jeszcze walidacja DE/Swiss, ceremonii, dużej obsady, mobile, obciążenia ani restartu całego hostingu podczas aktywnego meczu.

Kolejne zmiany, w kolejności wartości — **nie rozpoczęto ich podczas QA**:

1. Trwała ścieżka odzyskania dostępu i jednoznaczne przygotowanie poświadczeń przed startem (P0-01).
2. Utrwalenie kontekstu edytowanego meczu przy automatycznym fokusie i pracy dwóch operatorów (P1-01).
3. Zakres aktywnego etapu i odświeżanie metadanych w publicznej drabince/projectorze (P1-02).
4. Spójne dalsze kroki RR → kwalifikacja → routing → finał oraz komunikaty po własnym udanym zapisie.
5. Czytelność pod presją: kontrast, hierarchia Etapów, poprawne rundy i kolejność ostatnich wyników.

### Weryfikacja techniczna i cleanup

Nie zmieniono kodu produkcyjnego, dlatego zgodnie z zakresem QA nie powtarzano pełnych suite'ów. Ostatnia weryfikacja testowanego commita: **192/192 frontend PASS, typecheck PASS, build PASS**; to wcześniejsze wyniki, nie nowe uruchomienie. Manualne ograniczenia (routing double-click, zaakceptowany refresh draftu, HTTP 409) zapisano jawnie powyżej.

Zatrzymano lokalne API i tymczasowy PostgreSQL. Usunięto nieśledzone helpery `.training-qa-server.mts` i `.training-qa-setup.mts`. Testowa baza pozostała poza repozytorium w zatrzymanym klastrze; nie dodano jej ani helperów do commita. Jedyna zmiana w repozytorium to ten dokument.

## P0-01 — trwałe poświadczenie i ponowne logowanie (12.09.2026)

Poniższa weryfikacja aktualizuje wyłącznie P0-01 z powyższego historycznego raportu. P1 wyboru meczu i publicznej drabinki pozostają otwarte; nie wykonano ponownego audytu ani kolejnego pełnego turnieju.

### Przyczyna i model dostępu

Przed poprawką utworzenie turnieju bez hasła dawało twórcy podpisany, ograniczony do turnieju token organizatora w `sessionStorage`. Rola i flaga zarządzania w `localStorage` służą nawigacji, nie są dowodem uprawnień. Po utracie tokenu nie pozostawało poświadczenie, które organizator mógł przedstawić serwerowi. Istniejący endpoint logowania działał poprawnie dla turniejów z hasłem; frontend dodatkowo ukrywał wejście do logowania przy utracie zapisanej roli lub roli kibica.

Nowe turnieje wymagają hasła organizatora o długości co najmniej 8 znaków zarówno w UI, jak i `POST /api/tournaments`. API, OpenAPI i wygenerowani klienci mają ten sam kontrakt. Starszy klient tworzący turniej bez hasła otrzyma 400 i musi uzupełnić dane. Nie zmieniono schematu DB ani mechanizmu weryfikacji istniejących sesji.

Hasło jest trwałym poświadczeniem ponownego logowania; serwer przechowuje wyłącznie solony hash scrypt. Formularz tworzenia informuje, że hasło należy zachować, aplikacja nie pokaże go ponownie i nie oferuje w tej wersji zmiany ani resetu hasła. Po utracie sesji ścieżka to: link do turnieju → „Masz dostęp tylko do podglądu.” → „Wejdź jako organizator” → hasło → istniejące logowanie API → dostęp do zapisu. Wejście do logowania jest dostępne także bez zapisanej roli, przy roli kibica i na bramce prywatnego turnieju. Rola organizatora jest ustawiana dopiero po poprawnej odpowiedzi logowania. Formularz blokuje równoczesne wysłanie i umożliwia ponowienie po błędzie.

### Zgodność i granica odzyskiwania

- Istniejące turnieje z hasłem i już wydane sesje nadal działają. Drugie logowanie nie zmienia hasła ani nie unieważnia pierwszej sesji.
- Właściciel starszego turnieju bez hasła, który nadal ma ważną sesję, widzi w Host i szczegółach wskazówkę prowadzącą do istniejącego formularza ustawienia pierwszego hasła. Ta jawna zmiana poświadczenia zastępuje stare sesje bez hasła; formularz uprzedza, że pozostałe sesje muszą zalogować się nowym hasłem. Bieżąca sesja otrzymuje nowy token.
- Istniejąca ścieżka ulepszenia dostępu za pomocą historycznego kodu hosta pozostaje dostępna.
- Już osierocony turniej bez hasła, kodu i ważnej sesji nie ma dowodu własności umożliwiającego samodzielne odzyskanie. UI zachowuje komunikat o konieczności interwencji administracyjnej. Nie dodano przejęcia po ID ani obejścia uprawnień. Poprawka zapobiega tworzeniu kolejnych takich turniejów; nie oznacza automatycznego odzyskania wszystkich historycznych rekordów.

### Security review

Hasło trafia w ciele istniejącego żądania POST; nie dodano sekretów do adresów URL ani query params. Aplikacja nie zapisuje hasła w browser storage. Token pozostaje w dotychczasowym `sessionStorage`; `localStorage` zawiera wyłącznie rolę i flagę nawigacji. Zwykły publiczny odczyt nie zwraca tokenu ani hasha. Serializer żądań loguje ID, metodę i ścieżkę bez query, bez ciała i nagłówków; wpis audytu logowania nie zawiera poświadczeń.

Wykorzystano istniejące limity prób: 5 nieudanych prób ze źródła i 25 dla turnieju w oknie 15 minut, z blokadą na 15 minut. Istniejący dummy hash i ogólna odpowiedź błędnych poświadczeń pozostają; regresja porównuje odpowiedź błędnego hasła z odpowiedzią nieistniejącego turnieju. Viewer bez sekretu nie uzyskuje zapisu. Nie dodano kont, nowego endpointu recovery, migracji ani równoległego mechanizmu auth.

### Automatyczna weryfikacja

| Zakres | Wynik |
| --- | --- |
| API unit/regression bez `DATABASE_URL` | 432/432 PASS: 377 runner API + 25 współdzielonych + 30 UI używanych przez skrypt API |
| Pełne integracje API | 499/499 PASS, 0 skipped |
| Wyodrębnione integracje security-integrity, access i credential-rate-limit | 109/109 PASS; zawarte także w pełnym przebiegu |
| Frontend | 198/198 PASS, proces kończy się sam, około 9 s |
| Typecheck bibliotek, API, testów API i frontendu | PASS |
| Build API i frontendu | PASS |

Nowe regresje obejmują utratę wszystkich wpisów storage, brak roli i rolę kibica, logowanie przez link publicznego/prywatnego turnieju, błędne hasło bez fałszywego sukcesu, retry, blokadę double-submit, brak publicznego przejęcia osieroconego turnieju, brak sekretów w storage i publicznej odpowiedzi oraz zapis z pierwotnej i dwóch zalogowanych sesji. Testy tworzenia wymagają hasła, także przy bezpośrednim POST. Test zgodności pierwszego hasła używa historycznego rekordu i wcześniej wydanej sesji. Dotychczasowe fixture'y DE i series_v1 dostosowano do wymaganego hasła; nie zmieniono logiki rozgrywek.

### Manual QA — PASS

Po automatycznych PASS użyto lokalnego `organizer_training_test`, dotychczasowego schematu QA i nowego turnieju #2 „QA P0 — powrót organizatora 12.09”. Wszystkie zapisy i logowania wykonano przez frontend, bez skryptu, SQL ani ręcznego API do odzyskiwania. Poprzedni ukończony turniej #1 pozostał nienaruszony.

Scenariusz A: utworzenie z hasłem → zapis gracza „P0 Twórca” → „Wyloguj” usuwające lokalny token i flagę zarządzania → reload → tylko podgląd bez formularza dodawania → „Wejdź jako organizator” → błędne hasło odrzucone czytelnym komunikatem → poprawne hasło → zapis „P0 Po odzyskaniu”. Obejrzano ekran podglądu, formularz i błąd. Pełne wyczyszczenie również roli z obu storage potwierdzają testy automatyczne; ręczna próba użyła produktowego wylogowania.

Scenariusz B: nowa karta z oddzielnym `sessionStorage` zaczęła od podglądu i logowania, mimo zalogowanej pierwszej karty. Poprawne hasło umożliwiło zapis „P0 Druga sesja”. Pierwsza karta po reload nadal była zalogowana i zapisała „P0 Pierwsza nadal działa”. Druga karta po reload zachowała uprawnienia i pokazała wszystkich czterech graczy. To ręczna próba dwóch niezależnych sesji kart; nie deklarujemy testu na fizycznym drugim urządzeniu.

P0 tworzenia turnieju bez trwałego poświadczenia i ponownego wejścia dla turniejów z hasłem jest zamknięte w powyższym zakresie. Historyczne rekordy bez jakiegokolwiek dowodu własności mają opisane ograniczenie. Po tym commicie STOP; P1-01 nie został rozpoczęty.

## P1-01 — stabilny wybór edytowanego meczu (13.09.2026)

Przed rozpoczęciem potwierdzono czysty working tree i P0 `1bb342bf2eb1bd0b5c83b5a72dfb330275f69e84` na `origin/codex/organizer-host-training`. Ta osobna poprawka dotyczy wyłącznie selekcji i formularza Host. Backend, auth, kwalifikacja, routing, lifecycle i widoki publiczne nie zostały zmienione.

### Przyczyna i zachowanie po poprawce

Host przechowywał jawny wybór w `selectedMatchId`, a draft w `scores[matchId]`. Gdy wybór był pusty, `focusedMatchId` był wyliczany przy każdym renderze z wyróżnionego meczu, LIVE lub pierwszej gotowej pary. Rozpoczęcie edycji tak zasugerowanego meczu nie zapisywało `selectedMatchId`. Polling mógł więc wyświetlić inną parę, mimo pozostającego w pamięci draftu poprzedniej. Nie był to effect nadpisujący jawnie wybrane ID — problemem było niewykonane przypięcie przy interakcji z automatyczną sugestią.

Teraz kliknięcie/fokus w panelu meczu, zmiana wyniku i otwarcie korekty utrwalają ID. Polling aktualizuje dane tej pary, zachowując wybór. Bez interakcji dotychczasowa automatyczna sugestia nadal działa. Draft pozostaje przypisany do `matchId`; jawne przełączenie i powrót zachowuje właściwy draft, a inny mecz nie dziedziczy jego wyniku. Zdalna zmiana tego samego meczu uruchamia istniejące porównanie stanu początkowego i blokadę starego wyniku, bez zmiany pary.

Po udanym zapisie lub przełożeniu bieżącego meczu można ponownie użyć automatycznej sugestii dopiero po zakończonym odświeżeniu podstawowych danych i przy niezmienionej wersji interakcji użytkownika. Wybór następnego meczu korzysta wtedy z aktualnych danych. Powtórne kliknięcie podczas pending nie jest nową interakcją. Korekta nadal ma osobne ID i przypina także panel. Jeżeli poprawnie pobrana, zakończona lista naprawdę nie zawiera wybranego meczu, UI zamyka jego edycję/korektę, usuwa osierocony draft i pokazuje wyjaśnienie przed ponowną sugestią. Błąd pobrania ani zwykła zmiana statusu nie oznaczają usunięcia.

### Weryfikacja automatyczna

Najpierw dodano test edycji automatycznej sugestii A, po której B staje się LIVE. Po oczekiwaniu na odmalowanie odświeżonej kolejki test na kodzie sprzed poprawki miał **FAIL**: brak formularza A. Po poprawce przechodzi.

- **Frontend: 208/208 PASS**, około 10 s, proces kończy się sam.
- **Frontend typecheck: PASS.**
- **Frontend build: PASS.** Pozostaje dotychczasowe ostrzeżenie o rozmiarze bundla.
- Dziesięć nowych behavioral tests obejmuje reprodukcję, jawny wybór i draft 1:0, nadal działającą sugestię bez interakcji, zdalne zakończenie tego samego meczu, korektę podczas zmiany innego meczu, usunięcie meczu i draftu, błąd refetchu, fokus klawiatury, HTTP 409 bez przeskoku i usunięcie meczu przy otwartej korekcie. Istniejący test pending aż do refetchu i przejścia do następnego meczu również PASS.

### Manual two-session QA — PASS

Użyto dotychczasowej lokalnej bazy `organizer_training_test` i turnieju QA #2 z czterema graczami. Użytkownik potwierdził rozpoczęcie etapu i zapisy dwóch sesji. Obie karty zalogowano przez UI istniejącym hasłem. Nie tworzono ani nie zmieniano poświadczeń, nie używano SQL/skryptu/API do operacji turniejowych. BO3 dla R1M1 ustawiono istniejącym przyciskiem w Host przed edycją. Następnie przeładowano kartę A, aby zacząć od automatycznej sugestii bez wcześniejszego przypięcia.

1. A rozpoczęła edycję R1M1 „P0 Twórca – P0 Pierwsza nadal działa”: draft **1:0 w BO3**, przycisk zapisu wyłączony.
2. B wybrała R1M2 „P0 Po odzyskaniu – P0 Druga sesja” i rozpoczęła go jako LIVE. Po zwykłym pollingu A nadal pokazywała R1M1 i draft 1:0, mimo zmiany priorytetu kolejki.
3. B zapisała R1M2 jako 1:0. A odebrała zmianę liczników, historii i kolejki, zachowując R1M1 i draft. Po swoim zapisie B poprawnie przeszła do następnej dostępnej pary.
4. B zapisała R1M1 jako **0:2**. A pozostała przy R1M1, pokazała wynik serwera 0:2 i komunikat „Twój wynik roboczy: 1:0. Aktualny wynik: 0:2”, zablokowała edycję i nie pokazała fałszywego sukcesu. Nie przeskoczyła do dostępnego finału R2M1.
5. Przy R2M1 już LIVE A otworzyła korektę R1M1. B wyróżniła R2M1 istniejącym przyciskiem Host. Po pollingu A pokazała nową ostatnią akcję w tle, a dialog nadal identyfikował R1M1 i zapisane 0:2. Wybrano „Zachowaj wynik”; panel pozostał przy R1M1 bez cofania wyniku.

Ręczna próba potwierdza konflikt wykryty przez polling; wymuszony HTTP 409 i rzeczywiste usunięcie wybranego meczu zweryfikowano behavioral tests, nie osobnym ręcznym wyścigiem. Nie przeprowadzano ponownie pełnego turnieju ani ponownego audytu. P1-01 zamknięte; P1-02 (publiczna drabinka/projector) pozostaje otwarte i nie zostało rozpoczęte.

## P1-02 — oddzielenie etapów w widokach publicznych (13.09.2026)

Punkt wyjścia: czysty `codex/organizer-host-training`, HEAD `84ec21800a6798d32fb863473e9b2ed335493104`. Zakres: public bracket, projector, Audience Drabinka, wspólny helper i behavioral tests. Host, auth, qualification, routing, backend lifecycle i layout ogólny pozostają bez zmian.

### Przyczyna i model prezentacji

Endpoint turniejowego bracketu zwraca mecze wszystkich etapów pogrupowane po numerze rundy. Public bracket i Audience przekazywały te rundy bez filtrowania, a komponent formatu wybierały na podstawie `tournament.format`. Dodatkowo public bracket nie odświeżał okresowo metadanych turnieju. Projector w aktualnym kodzie obsługiwał wyłącznie DE i wybierał pierwszy DE o statusie innym niż planned; bez takiego etapu pozostawał na ładowaniu. Wcześniejszy raport QA nie opisywał dokładnie tej ostatniej implementacji projektora.

Wspólna reguła wybiera aktywny etap (preferując zgodny z `activeStageId`), następnie ostatni ukończony według `position`. Nie zależy od kolejności odpowiedzi API ani formatu etapu. Same planned nie dają aktywnej drabinki. Statusy etapów pozwalają przełączyć widok także przed dogonieniem ich przez turniejowy `activeStageId`.

Każda runda publicznego bracketu zawiera wyłącznie mecze z wybranym `stageId`; puste rundy są pomijane. Format, numer rundy i nazwa kontekstu pochodzą z tego samego etapu. Zwycięzca jest prezentowany według backendowego `stage.winnerId`, bez obliczania awansu na froncie. DE nadal korzysta z istniejącego endpointu konkretnego etapu i istniejącego canvasu. Projector używa także istniejących komponentów RR/SE/Swiss/Marvel zamiast wymuszać DE. Wieloetapowy Swiss nie otrzymuje zbiorczej klasyfikacji całego turnieju.

Tournament, stages i bracket pozostają odświeżane przez query polling; dla public bracket dodano polling tournament. Nierównoczesne odpowiedzi mogą chwilowo pozostawić pusty zakres nowego etapu, ale filtr nie dopuści meczów poprzedniego. W tych trzech widokach nie było jawnego selektora stage ani parametru URL stage; nie dodano nowej nawigacji. Historia pozostaje w dotychczasowych Audience Etapy/Mecze. Istniejący wybór historycznego etapu w panelu Etapy nie został zmieniony.

### Weryfikacja automatyczna — PASS

- Reprodukcja przed poprawką: **3/3 FAIL** — historyczne RR w public bracket i Audience, brak finału w projectorze.
- Po poprawce: **229/229 frontend tests PASS**, w tym 21 nowych behavioral tests trzech widoków; proces kończy się sam (około 14 s).
- **Frontend typecheck PASS; build PASS.** Dotychczasowe ostrzeżenie o wielkości bundla pozostaje.
- Nowe przypadki: RR completed → SE active, transition z opóźnionym tournament metadata, tylko planned, finalny stage przy odwróconej kolejności rekordów, single-stage SE, wybór aktywnego DE spośród dwóch DE z zachowaniem Upper/Lower/Grand Final oraz odejście od cache DE po starcie SE.

### Manual QA — PASS widoków publicznych (domknięcie 14.09.2026)

Użyto zbudowanego frontendu z lokalną bazą `organizer_training_test` i turnieju QA „QA P1 — etapy publiczne 13.09”. Przez panel Etapy przygotowano i uruchomiono RR, zakończono etap z kwalifikacją QA Alfa i QA Beta, a następnie uruchomiono finał SE. Wcześniej otwarte karty public bracket, projector i Audience wykryły zmianę aktywnego etapu przez polling bez ręcznego refreshu (**PASS**): przeszły z Stage 1 RR na finał, pokazały wyłącznie mecze finału i poprawny kontekst etapu, bez mieszania meczów RR.

Poprzednie oznaczenie **MANUAL QA PENDING — blocked by browser tool usage limit** zostało rozstrzygnięte 14.09.2026 na istniejącym turnieju #3, bez odtwarzania danych. Repozytorium wskazywało commit `9e14a0bbc8c6343110d21f24fab046530fef1c23`. Środowisko i sesja organizatora działały. Publiczne karty otwarto ponownie, ponieważ poprzednie zostały zamknięte; wcześniejszego testu pollingu RR → finał nie powtarzano.

- **Refresh podczas aktywnego finału: PASS** we wszystkich trzech widokach; kontekst „Finał — Etap 2”, wyłącznie QA Alfa–QA Beta, bez sześciu historycznych meczów RR.
- **Wynik i zwycięzca: PASS.** W Host rozpoczęto mecz, ustawiono i zapisano QA Alfa 2:0 QA Beta (BO3). W Etapach potwierdzono zakończenie finału; turniej przeszedł do ZAKOŃCZONY, zamrożony ranking wskazał QA Alfa na pierwszym miejscu.
- **Finalny public bracket / projector / Audience Drabinka: PASS.** Bez reloadu pojawiły się wynik 2:0 oraz „ZWYCIĘZCA QA Alfa”, przy zachowanym kontekście finału i bez historycznych meczów.
- **Refresh po zakończeniu: PASS** we wszystkich trzech widokach. Po zakończeniu ładowania Audience również pokazało finał, wynik i zwycięzcę. AX oraz zrzuty ekranów potwierdziły poprawny stan.

Nie zmieniano kodu produkcyjnego, nie uruchamiano ponownie testów i nie zapisywano wyników przez ręczne HTTP/SQL. Lokalny helper QA pozostaje usunięty.

### Obserwacja P2 — chwilowy błędny komunikat przy zakończeniu etapu

Reprodukcja zaobserwowana podczas powyższej próby: turniej #3, aktywny Finał SE BO3, jedyny mecz zapisany 2:0; otworzyć Etapy, wybrać Finał, kliknąć „Zakończ etap”, następnie jednokrotnie „Potwierdź zakończenie etapu”. Dialog chwilowo pokazał „Ten etap nie jest obecnie aktywny. Kod diagnostyczny: STAGE_NOT_ACTIVE”, po czym sam zniknął i pojawiło się potwierdzenie zakończenia. Etap oraz turniej zostały poprawnie zakończone, wynik i zwycięzca zachowane. Nie jest to blocker publicznych widoków ani utrata danych; to **P2 — mylący przejściowy feedback organizatora**. Czasu widoczności nie mierzono; nie powtarzano mutacji.

Prawdopodobna przyczyna: `tournament-stages-panel.tsx` odświeża zapytania w `lifecycleFeedback.onSuccess` przed zamknięciem dialogu w callbacku mutacji. `invalidateTournamentDependentQueries` obejmuje również preview kwalifikacji. Preview może więc ponownie trafić do serwera już po zakończeniu etapu, zanim dialog i lokalny status zostaną odświeżone. To wniosek z celowanego odczytu kodu, bez potwierdzenia śladem sieciowym. Zgodnie z instrukcją po znalezieniu błędu zatrzymano pracę bez naprawy i bez commita/pushu raportu.

## P2 — kolejność zamykania etapu i odświeżania preview (14.09.2026)

Root cause potwierdzono testem regresyjnym: po sukcesie `/complete` zablokowano odpowiedź odświeżenia listy etapów, a preview zakończonego etapu zwracało `STAGE_NOT_ACTIVE`. Przed poprawką test **FAIL**: odnotował jedno niedozwolone ponowne pobranie preview. Dwa pozostałe nowe testy (rzeczywisty błąd mutacji i preview aktywnego etapu) już wtedy przeszły.

Zmiana dotyczy wyłącznie sukcesu mutacji zakończenia etapu w panelu Etapy: zamknięcie dialogu → anulowanie i usunięcie nieaktualnego preview konkretnego etapu z cache → dotychczasowe odświeżenie zależnych danych. Usunięcie preview zabezpiecza również moment przed zatwierdzeniem renderu React. Blokada ponownego zapisu pozostaje do końca odświeżania. Obsługa rzeczywistych błędów mutacji, preview aktywnego etapu i backendowy lifecycle nie zostały zmienione; brak timerów i globalnego ukrywania kodów błędów.

Walidacja po poprawce: **28/28 testów panelu Etapy PASS**, **232/232 frontend tests PASS**, **frontend typecheck PASS**, **build PASS**. Build zgłosił ostrzeżenia sourcemap, fontu rozwiązywanego w runtime i rozmiaru bundla, bez błędu wykonania. Test regresyjny potwierdza brak preview po sukcesie, zamknięcie dialogu przed końcem refetchu i utrzymanie blokady zapisu; osobne testy potwierdzają widoczny rzeczywisty `STAGE_NOT_ACTIVE` oraz preview po ponownym otwarciu aktywnego etapu.

Manual QA poprawki P2: **PASS** na lokalnym buildzie `index-ienEfnnk.js`. Po zalogowaniu przez użytkownika zakończono ostatni mecz QA #2 wynikiem P0 Pierwsza nadal działa 1:0 P0 Po odzyskaniu; ten turniej zakończył się automatycznie, więc nie posłużył do testu dialogu. W zachowanej sesji QA #3 użyto istniejącej korekty finału i ponownie zapisano identyczny wynik QA Alfa 2:0 QA Beta. Następnie wykonano dokładnie **Etapy → Zakończ etap → Potwierdź zakończenie etapu**. Odczyt bezpośrednio po potwierdzeniu nie pokazał `STAGE_NOT_ACTIVE`; dialog zamknął się i pojawiło się potwierdzenie sukcesu. Etap i turniej są ZAKOŃCZONE, zamrożony ranking wskazuje QA Alfa na pierwszym miejscu, a finał zachował 2:0. Wszystkie zapisy wykonano przez UI. Nie powtarzano testów automatycznych po samej aktualizacji raportu.

Podczas przygotowawczej korekty wyniku zaobserwowano osobny chwilowy komunikat „Ten mecz nie ma już zapisanego wyniku do cofnięcia”, po czym dialog sam zniknął i korekta poprawnie otworzyła mecz. Odnotowano go poza zakresem tej poprawki; nie analizowano ani nie zmieniano Host.

## P2 — spójność informacji operacyjnej organizatora (14.09.2026, w toku)

Punkt wyjścia: czysty `codex/organizer-host-training`, lokalny i zdalny HEAD `8299f88bbba2254fd47ac5ce1364687a2527f60e`. Zakres obejmuje wyłącznie prezentację informacji Host/Detail/Etapy, helpery i testy. Backend lifecycle, auth, public bracket/projector oraz design system pozostają bez zmian.

Źródłem sprzecznych wskazówek były równoległe komunikaty turniejowego assistant i etapowego next-step, dodatkowy tekst Host po zakończeniu meczów oraz nieuwzględnianie statusu proposal/routingu przed sugestią startu następnego etapu. Numer rundy pochodził z metadanych etapu/turnieju, mimo że lista meczów wskazywała już następną rundę. Detail nie odświeżał okresowo wszystkich danych używanych w tych wskazówkach.

Wspólny `useOrganizerOperation` dostarcza wskazówkę dla Host i Detail (w tym zakładki Etapy). Odczytuje istniejące readiness, konfigurację koszyków, proposal i route status. Dla jawnego `basket_v1` brak zatwierdzenia kwalifikacji lub wykonania routingu poprzedza wskazówkę startu. Nie oblicza awansujących ani legalności operacji. Błąd lub brak potwierdzenia danych daje komunikat sprawdzenia stanu. Link do operacji wskazuje właściwy etap, także zakończony etap źródłowy. Przy aktywnym etapie pierwszeństwo mają jego mecze, następna runda Swiss lub sprawdzenie zakończenia etapu. Starszy assistant nie emituje już równoległej głównej sugestii.

Wspólny opis rundy filtruje mecze po `stageId`. W RR/SE/Swiss pokazuje najwcześniejszą rundę meczu LIVE, a gdy takich nie ma — najwcześniejszą rundę niezakończonego meczu. Po rozegraniu wszystkich pokazuje ostatnią zmaterializowaną rundę; dla completed podpis brzmi „Ostatnia runda”. Planned i brak danych mają jawne etykiety, bez odtwarzania starej rundy z metadanych. DE ma rundy osobno w drabinkach, a format grupowy osobno w grupach. To prezentacja istniejących meczów, nie wyliczanie następnej rundy ani zmiana harmonogramu.

Komunikaty pomocnicze nie twierdzą już, że ręcznie odhaczona lista oznacza readiness serwera, że po każdym finale koniecznie istnieje kolejny etap ani że pusty jeszcze zapis uczestników docelowego etapu oznacza brak składu mimo READY z backendu.

Automatyczna walidacja aktualnej implementacji: **7/7 celowanych testów PASS; 239/239 frontend tests PASS; frontend typecheck PASS; build PASS**. Trzy behavioral tests renderują kolejno Host, Detail i Etapy i przechodzą gotowość → mecze → zmiana rundy przy starych metadanych i historycznych meczach → zakończenie meczów → kwalifikacja → routing → start właściwego finału. Cztery testy helpera obejmują formaty, stan planned/completed i brak danych rundy. Build zachowuje dotychczasowe ostrzeżenia, bez błędu wykonania.

**Manual QA: PENDING.** Przywrócono istniejącą lokalną bazę QA i uruchomiono aktualny build. Przygotowano formularz „QA P2 — spójność operacyjna 14.09” (3 uczestników RR, 2 finalistów SE); przed kontynuowaniem użytkownik musi wpisać i zatwierdzić nowe hasło organizatora. Flow start → wyniki → runda → complete → qualification → routing → next READY nie został jeszcze manualnie potwierdzony dla tej serii. Nie wykonano commita ani pushu niezweryfikowanej manualnie zmiany.
