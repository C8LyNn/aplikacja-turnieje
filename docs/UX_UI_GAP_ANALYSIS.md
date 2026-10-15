# Tournament Manager — analiza luk UX/UI

Data: 2026-09-24. Standard odniesienia: [UX_UI_STANDARDS.md](UX_UI_STANDARDS.md), wersja 1.0.
Baza analizy: `codex/replit-visual-polish-handoff`, `af26e303c3edda5a2adbf6d16c15a8bedcc7f44f`.

## Metoda i ograniczenia

Audyt jest analizą aktualnego kodu prezentacji, stanów zapytań, formularzy, nawigacji oraz istniejących testów. Nie obejmuje ponownego audytu algorytmów turnieju ani backendowych invariantów. Nie wdrożono żadnej z opisanych poprawek. Utworzono wyłącznie dokumentację; nie wykonywano operacji na bazie, commita ani pushu.

**Browser Visual QA: niedostępne.** Próba uruchomienia computer-use zakończyła się błędem `failed to write kernel assets: System nie może odnaleźć określonej ścieżki. (os error 3)`. Nie potwierdzono wyglądu na screenshotach, kontrastu, wymiarów celów dotykowych, faktycznego reflow, odczytu screen readera ani działania fokusu w przeglądarce. Wnioski HIGH opisują mechanizmy widoczne w kodzie, nie wynik manualnego testu. Ryzyka zależne wyłącznie od renderowania są osobno i nie podbijają liczby potwierdzonych luk.

Oceny compliance odnoszą się do wskazanego zachowania, nie do certyfikacji całego ekranu: **ZGODNE**, **CZĘŚCIOWO ZGODNE**, **NIEZGODNE**, **NIE DOTYCZY**. Nie stosujemy punktacji.

Severity: **P0** — blokada użycia/duże ryzyko operacyjne; **P1** — istotny problem UX; **P2** — poprawa jakości; **P3** — polish. Ograniczenie dostępu klawiaturą do konkretnej kontrolki jest opisane jako blocker dostępności tej kontrolki, nawet jeśli nie blokuje całej aplikacji.

Confidence: **HIGH** — bezpośredni dowód w kodzie; **MEDIUM** — wniosek wymagający dodatkowej reprodukcji; **VISUAL QA REQUIRED** — ocena wymaga przeglądarki. Zakres poprawki: **UI ONLY**, **UI + STATE**, **LOGIC**, **ACCESSIBILITY**, **VISUAL-QA REQUIRED**. Żadna potwierdzona luka nie wymaga w tym raporcie zmian reguł sportowych ani backendu.

**Bilans: 16 luk — P0: 0, P1: 6, P2: 9, P3: 1.** Brak nowego P0 w tym przeglądzie nie oznacza zakończonego Visual QA ani pełnej zgodności WCAG 2.2 AA.

## Pokrycie ekranów i wzorców

| Obszar | Compliance w sprawdzonym zakresie | Co działa / czego brakuje |
|---|---|---|
| Dashboard | CZĘŚCIOWO ZGODNE | Primary tworzenia, error + retry i empty CTA istnieją; otwieranie kart, akcje hover i modale: UX-001/002/012. |
| Tworzenie turnieju | CZĘŚCIOWO ZGODNE | Nazwa ma label, błąd, focus po submit; istnieje synchroniczna blokada ponownego submit i zachowanie danych po błędzie. Część selectów konfiguracji bez powiązanej etykiety: UX-003. |
| Tournament Detail | CZĘŚCIOWO ZGODNE | Główny odczyt rozróżnia błąd/404 i ma retry; odczyty podrzędne nie zawsze: UX-004. |
| Players | CZĘŚCIOWO ZGODNE | Dodawanie/import/edycja mają kontekst; etykiety pól i pusty stan po błędzie: UX-003/004. |
| Konfiguracja turnieju / reguły / bezpieczeństwo | CZĘŚCIOWO ZGODNE | Widoczna blokada reguł po starcie; błędy odczytu sesji/logów, opuszczenie draftu i toast-only write error: UX-004/006/016. |
| Etapy | CZĘŚCIOWO ZGODNE | Shared Next Step, jawny target, summary/liczby/diagnostyka, readiness retry i historyczny stan są poprawione; dostęp do pełnych nazw: UX-011. |
| Koszyki | CZĘŚCIOWO ZGODNE | Czytelna struktura tras, preview, zachowanie draftu po błędzie zapisu; brak retry odczytu, ochrony wyjścia i części etykiet: UX-003/006/007. |
| Qualification / routing | CZĘŚCIOWO ZGODNE | Confirmation, pending, blokada i ponowienie odczytu istnieją; readiness oraz nazewnictwo nie korzystają wszędzie z nowego standardu: UX-008/009. |
| Host / Prowadzenie | ZGODNE w zbadanych kontraktach operacyjnych | Primary zależne od stanu, menu rzadszych akcji, oddzielne recovery, adaptacyjny layout. Kontrast/reflow niepotwierdzone. |
| Zapis / korekta wyniku | ZGODNE w zbadanym kontrakcie draftu | Revision przypisana do draftu, brak auto-retry, jawna nowa edycja, korekta wtórna; nie zmieniamy mechanizmu. |
| Organizer navigation | ZGODNE w kodzie lokalnej nawigacji | Linki, `aria-current`, lokalny scroll i odsłanianie aktywnego elementu. Nie utożsamiać z globalnym Layout: UX-013. |
| Audience | CZĘŚCIOWO ZGODNE | Nagłówek i karty skompaktowane, kontekst etapu zachowany; odczyty, tekst/statusy i nazwy: UX-004/009/010/011. |
| Public Matches | CZĘŚCIOWO ZGODNE | Zwarta karta i hierarchia danych; brak rozróżnienia pustego wyniku i błędu odczytu: UX-004. |
| Public Standings / grupy | CZĘŚCIOWO ZGODNE | Responsywne grupy już poprawione; publiczna klasyfikacja wymaga error state i spójnych etykiet/metadata: UX-004/009/010. |
| Public Bracket | CZĘŚCIOWO ZGODNE | Geometria SE i lokalny scroll poprawione; początkowy błąd danych pozostaje loadingiem: UX-005. |
| Projector | CZĘŚCIOWO ZGODNE | Kontekst etapu i rozróżnienie błędu części odczytów bracketu; błąd tournament/stages blokuje ekran na loadingu: UX-005. Edycja/draft: NIE DOTYCZY. |
| Modale | CZĘŚCIOWO ZGODNE | Jest wspólna baza Radix; Dashboard ją omija, wspólne Close nie jest spolszczone: UX-002/015. |
| Formularze | CZĘŚCIOWO ZGODNE | Dobre wzorce w tworzeniu/hasłach nie są stosowane do wszystkich pól: UX-003; ochrona opuszczenia: UX-006. |
| Globalny feedback / loading | CZĘŚCIOWO ZGODNE | Host i Etapy mają alert/status/pending; pozostałe ścieżki wymagają wyrównania: UX-004/005/007/016. |

## Rejestr luk

### UX-001 — otwieranie turnieju z Dashboardu wymaga myszy

- **Ekran:** Dashboard, karta istniejącego turnieju. **Severity: P1. Compliance: NIEZGODNE. Zakres: ACCESSIBILITY. Confidence: HIGH.**
- **Reguły:** NAV-02, A11Y-01.
- **Obserwacja:** [dashboard.tsx](../artifacts/tournament-manager/src/pages/dashboard.tsx), linie 434–441: `Card` ma `onClick` z nawigacją, ale nie ma linku, roli ani obsługi klawiatury. [ui/card.tsx](../artifacts/tournament-manager/src/components/ui/card.tsx) renderuje zwykły `div`; tytuł również nie jest linkiem. Osobne przyciski export/delete nie otwierają turnieju.
- **Wpływ:** użytkownik klawiatury nie może wykonać podstawowej akcji karty. To blocker tej ścieżki dostępności, nie dowód zablokowania całej aplikacji.
- **Kierunek:** dostępny link z nazwą turnieju; bez zagnieżdżania przycisków w linku. Zachować osobne akcje karty.
- **Akceptacja:** Tab odnajduje nazwany link, Enter przechodzi do właściwego turnieju; export/delete nie nawigują. Rozszerzyć `pages/dashboard.test.tsx`.

### UX-002 — własne overlaye Dashboardu nie realizują kontraktu modala

- **Ekran:** Dashboard → dane testowe / usunięcie turnieju. **Severity: P1. Compliance: NIEZGODNE. Zakres: ACCESSIBILITY. Confidence: HIGH.**
- **Reguły:** DIALOG-02, DIALOG-03, A11Y-01/02.
- **Obserwacja:** [dashboard.tsx](../artifacts/tournament-manager/src/pages/dashboard.tsx), od linii 253 i 314: warunkowe fixed `div`, bez `dialog`, `aria-modal`, powiązanego tytułu i mechanizmu ograniczenia/powrotu fokusu. Plik nie implementuje Escape ani pułapki Tab. [ui/dialog.tsx](../artifacts/tournament-manager/src/components/ui/dialog.tsx) dostarcza już wspólną bazę Radix.
- **Wpływ:** interakcja z tłem pozostaje strukturalnie osiągalna, a użytkownik AT nie otrzymuje kontekstu decyzji. Szczególnie ryzykowne przy usuwaniu; backendowe potwierdzenie nie jest przez to omijane.
- **Kierunek:** użyć istniejącego dialogu, zachować aktualny opis skutków, wymagania hasła i pending. Ograniczenie wysokości sprawdzić w Preview.
- **Akceptacja:** nazwany dialog, fokus wewnątrz, Tab/Shift+Tab, Escape gdy dozwolony i powrót do triggera. Nie zmieniać semantyki usuwania. Testy Dashboard + manual keyboard.

### UX-003 — część widocznych labeli nie nadaje polom dostępnej nazwy

- **Ekran:** Players, tworzenie/konfiguracja etapów, dodawanie połączenia Koszyków. **Severity: P1. Compliance: NIEZGODNE. Zakres: ACCESSIBILITY. Confidence: HIGH.**
- **Reguły:** FORM-01/04, MSG-06, A11Y-01.
- **Obserwacja:** [tournament-detail.tsx](../artifacts/tournament-manager/src/pages/tournament-detail.tsx), 1223–1255: Nick/Ranga/Drużyna/Kraj/Rozstawienie to rodzeństwo inputów bez `htmlFor`/`id`; błąd Nick nie jest powiązany przez `aria-describedby`. [stage-plan-editor.tsx](../artifacts/tournament-manager/src/components/stage-plan-editor.tsx): selecty Format/Best of mają niepowiązany Label, podczas gdy Nazwa/Liczba uczestników mają poprawne identyfikatory. [stage-baskets-panel.tsx](../artifacts/tournament-manager/src/components/stage-baskets-panel.tsx), 661–691: źródło/cel to native selecty z niepowiązanymi labelami. Podobne selecty występują w [create-tournament.tsx](../artifacts/tournament-manager/src/pages/create-tournament.tsx); pole nazwy turnieju ma już poprawny wzorzec.
- **Wpływ:** AT nie dostaje stabilnego związku nazwy, pola i błędu; placeholder/aktualna opcja nie zastępują tego związku. Nie wszystkie formularze są wadliwe.
- **Kierunek:** lokalne id/label, opis/błąd przez ARIA, bez zmiany walidacji domenowej. Korzystać ze wzorca istniejącego w polu nazwy turnieju.
- **Akceptacja:** pola odnajdywane po labelu; błąd ogłaszany w kontekście pola. Rozszerzyć testy create-tournament, tournament-stages-ui i stage-baskets-panel; dodać celowany test formularza Players.

### UX-004 — nieudany odczyt danych podrzędnych udaje pustą listę

- **Ekran:** Detail/Players, Audience Matches/Standings, panel bezpieczeństwa. **Severity: P1. Compliance: NIEZGODNE. Zakres: UI + STATE. Confidence: HIGH.**
- **Reguły:** MSG-04, EMPTY-01/02, LOAD-01/02.
- **Obserwacja:** [tournament-detail.tsx](../artifacts/tournament-manager/src/pages/tournament-detail.tsx), od 134: hook Players pobiera tylko `data`, a widok przy braku danych pokazuje „Brak graczy”. [tournament-audience.tsx](../artifacts/tournament-manager/src/pages/tournament-audience.tsx), 149–155 i 695–700: matches/standings/players przekazywane jako `data ?? []`; sekcje Matches/Standings interpretują to jako brak meczów/tabeli. [security-panel.tsx](../artifacts/tournament-manager/src/components/security-panel.tsx), 66–80: pusty `catch` odczytu sesji/logów, początkowe tablice puste, dalej „Brak aktywnych sesji”/„Brak logów”. Przycisk odświeżenia istnieje, ale przyczyna pustki nie jest widoczna.
- **Wpływ:** po błędzie niezależnego requestu użytkownik może uznać, że roster/wyniki/sesje nie istnieją. Zapisane dane nie są kasowane. Po refetch z cache może zamiast tego oglądać stare dane bez informacji o błędzie.
- **Reprodukcja do testu:** odczyt turnieju = 200; odpowiedni odczyt podrzędny = 500 bez cache. Obecny render wybiera pusty stan, nie error.
- **Kierunek:** rozróżnić loading / udane empty / error / cached-data-with-error; retry tylko odczytu. Nie zmieniać endpointów, liczników ani auth.
- **Akceptacja:** osobne przypadki pustego 200, 500 i odzyskania po retry. Publiczne testy `tournament-audience.test.tsx`, `public-stage-views.test.tsx`, `security-panel.test.tsx` oraz celowany test Players.

### UX-005 — pierwszy błąd Public Bracket/Projector pozostaje loadingiem

- **Ekran:** publiczna drabinka, projector. **Severity: P1. Compliance: NIEZGODNE. Zakres: UI + STATE. Confidence: HIGH.**
- **Reguły:** LOAD-01, MSG-04, EMPTY-02.
- **Obserwacja:** [tournament-bracket.tsx](../artifacts/tournament-manager/src/pages/tournament-bracket.tsx), 42 i 174: odczyt turnieju bierze tylko data; `!tournament` zwraca pulsującą ikonę. [tournament-projector.tsx](../artifacts/tournament-manager/src/pages/tournament-projector.tsx), 97 i 180: `!tournament || !stages` daje „Ładowanie…”. Brak rozróżnienia początkowego failure od pending. Obsługa błędów samego bracketu dalej w plikach nie rozwiązuje tego wcześniejszego warunku.
- **Wpływ:** użytkownik czeka bez wyjaśnienia i recovery, mimo zakończonego niepowodzeniem requestu. Automatyczne późniejsze odzyskanie sieci nie zastępuje komunikatu.
- **Kierunek:** obsłużyć query status dla tournament/stages przed loading guard; rozróżnić 404/uprawnienia/sieć, zachować istniejące dane podczas refetchu.
- **Akceptacja:** 500, 404 i error stages nie pozostawiają nieskończonego loadingu; udane retry pokazuje właściwy etap. Rozszerzyć `public-stage-views.test.tsx`.

### UX-006 — niezapisana konfiguracja nie jest chroniona przy opuszczeniu ekranu

- **Ekran:** Koszyki advanced/edit, konfiguracja gry. **Severity: P1. Compliance: CZĘŚCIOWO ZGODNE. Zakres: UI + STATE. Confidence: HIGH.**
- **Reguły:** DRAFT-03; DRAFT-02 pozostaje spełnione dla błędu zapisu Koszyków.
- **Obserwacja:** [stage-baskets-panel.tsx](../artifacts/tournament-manager/src/components/stage-baskets-panel.tsx), 735, 812–823 i 920–933: draft to lokalny `useState`, catch zachowuje go. Panel znajduje się w nieutrwalanym `TabsContent` Detail. Nie ma ochrony nawigacji/refreshu ani odtworzenia draftu; mechanizm `beforeunload` znaleziono w Host, nie tutaj. [deadlock-game-config.tsx](../artifacts/tournament-manager/src/components/deadlock-game-config.tsx), `TournamentGameConfigPanel`: edytowane `value` również jest stanem lokalnym bez ochrony wyjścia.
- **Wpływ:** zmiana koszyka/trasy lub reguł, przejście do innej zakładki i powrót traci niezapisany nakład pracy. Nie jest to utrata danych już zapisanych w DB.
- **Kierunek:** dirty-state i świadome porzucenie albo bezpieczne odtworzenie; obsłużyć także Wstecz i refresh. Bez automatycznego zapisu/ponowienia mutacji. Nie przenosić mechanizmu revision meczu na konfigurację bez odrębnej potrzeby.
- **Akceptacja:** failed save nadal zachowuje draft; opuszczenie zmienionego draftu jest chronione; czysty formularz nie pyta. Rozszerzyć `stage-baskets-panel.test.tsx` i `deadlock-game-config.test.tsx`; browser test nawigacji/refreshu.

### UX-007 — błąd odczytu Koszyków nie oferuje recovery

- **Ekran:** mapa przepływu / Koszyki. **Severity: P2. Compliance: CZĘŚCIOWO ZGODNE. Zakres: UI + STATE. Confidence: HIGH.**
- **Reguły:** MSG-04, LOAD-02, FEED-02, A11Y-06.
- **Obserwacja:** [stage-baskets-panel.tsx](../artifacts/tournament-manager/src/components/stage-baskets-panel.tsx), 946: `if (error || !basketConfig)` zwraca sam komunikat „Nie udało się załadować konfiguracji koszyków”, bez retry i roli alert. Warunek może także schować istniejące dane przy błędzie background refetchu.
- **Wpływ:** operator widzi przyczynę niedostępności, lecz musi domyślić się odświeżenia strony. To inny problem niż false empty z UX-004.
- **Kierunek:** retry hooka, dostępny alert; przy zachowanych danych oznaczenie niepotwierdzonej aktualności. Nie czyścić draftu przy błędzie.
- **Akceptacja:** initial error + retry oraz cached data + error, bez utraty edycji. `stage-baskets-panel.test.tsx`.

### UX-008 — gotowość etapu docelowego po kwalifikacji ma stary model tekstu

- **Ekran:** Etapy → qualification/routing → etap docelowy. **Severity: P2. Compliance: CZĘŚCIOWO ZGODNE. Zakres: UI ONLY. Confidence: HIGH.**
- **Reguły:** FLOW-02, MSG-01/03.
- **Obserwacja:** [stage-qualification-routing.tsx](../artifacts/tournament-manager/src/components/stage-qualification-routing.tsx), 159–162: `stageReadinessMessages(...).map(...)` renderuje pełne komunikaty jako kolejne akapity. Główny [tournament-stages-panel.tsx](../artifacts/tournament-manager/src/components/tournament-stages-panel.tsx), 904–916, ma już summary/counts/action i osobną diagnostykę.
- **Wpływ:** po przekazaniu uczestników najważniejszy blocker/akcja mogą zginąć w diagnostyce; ten sam rodzaj informacji ma dwie hierarchie. Nie stwierdzono tu błędnego wyliczenia gotowości.
- **Kierunek:** wykorzystać istniejący formatter prezentacyjny; zachować nazwę etapu, expected/actual, pełne details i przycisk przejścia.
- **Akceptacja:** mismatch i configuration error pokazują summary/liczby od razu, diagnostykę osobno; bez zmiany payloadów. `lib/tournament-stages-ui.test.tsx` i `lib/stage-lifecycle-feedback.test.ts`.

### UX-009 — techniczne nazwy nadal są głównymi etykietami

- **Ekran:** qualification/routing; Audience, bilans SE. **Severity: P2. Compliance: CZĘŚCIOWO ZGODNE. Zakres: UI ONLY. Confidence: HIGH.**
- **Reguły:** STAT-02, ACT-05, A11Y-07.
- **Obserwacja:** [stage-qualification-routing.tsx](../artifacts/tournament-manager/src/components/stage-qualification-routing.tsx), 149–153: region nazywany `Routing ${route.id}`, CTA „Wykonaj routing”. [tournament-audience.tsx](../artifacts/tournament-manager/src/pages/tournament-audience.tsx), 854: badge bilansu SE renderuje bezpośrednio `standing.status`.
- **Wpływ:** użytkownik musi znać pojęcie routing i enumy; screen reader dostaje techniczny identyfikator zamiast źródła/celu.
- **Kierunek:** „Przekaż uczestników” z nazwanym źródłem/celem oraz polskie etykiety znanych statusów. ID i surowe wartości zachować w diagnostyce, nie zmieniać backendowych enumów.
- **Akceptacja:** statusy z kontraktu mają etykiety; trasy dają się odróżnić po nazwach. Testy Etapów i Audience.

### UX-010 — część publicznych statystyk omija skalę tekstu i tokeny

- **Ekran:** Audience, bilans/klasyfikacja i metadata. **Severity: P2. Compliance: CZĘŚCIOWO ZGODNE. Zakres: UI ONLY + VISUAL-QA REQUIRED. Confidence: HIGH dla deklaracji CSS.**
- **Reguły:** TYPE-01, VIS-04; A11Y-03 wymaga pomiaru, nie ma tu orzeczenia FAIL.
- **Obserwacja:** [tournament-audience.tsx](../artifacts/tournament-manager/src/pages/tournament-audience.tsx), 854–867: status/statystyki 10 px, nagłówki 11 px, literalne `text-white/35` i `/45`, mimo kontekstu presetów. To konkretne odstępstwo od proponowanej skali i ról palety, nie pomiar nieczytelności.
- **Wpływ:** mniejsza przewidywalność czytelności między fontami/presetami; wielkość i opacity wymagają obejrzenia na rzeczywistym tle.
- **Kierunek:** lokalnie ujednolicić istotne metadata z tokenami i skalą; nie rozrzedzać ponownie już skompaktowanych kart. Zmianę poprzedzić pomiarem kontrastu.
- **Akceptacja:** default/Emerald, Saira/Inter, 200% tekstu i 1024 px; testy nie mogą udawać pomiaru kontrastu przez sprawdzenie klasy.

### UX-011 — pełne nazwy nie zawsze są dostępne bez hover

- **Ekran:** lista uczestników Etapów, publiczne mecze, karty Dashboardu. **Severity: P2. Compliance: CZĘŚCIOWO ZGODNE. Zakres: ACCESSIBILITY + VISUAL-QA REQUIRED. Confidence: HIGH dla braku mechanizmu rozwinięcia.**
- **Reguły:** TABLE-04, TYPE-02.
- **Obserwacja:** [tournament-stages-panel.tsx](../artifacts/tournament-manager/src/components/tournament-stages-panel.tsx), 254: `truncate` + `title` na statycznym span. [tournament-audience.tsx](../artifacts/tournament-manager/src/pages/tournament-audience.tsx), 818/824: analogiczne nazwy graczy. Dashboard ma line-clamp nazwy, bez osobnego rozwinięcia. Kod nie zapewnia klawiaturowego/dotykowego odczytu całej nazwy w tych miejscach.
- **Wpływ:** przy faktycznym skróceniu widzący użytkownik klawiatury/dotyku ma trudność w rozróżnieniu podobnych nazw. Pełny tekst pozostaje w DOM — nie twierdzimy, że screen reader go nie odczyta.
- **Kierunek:** dostępne szczegóły/rozwinięcie lub kontrolowane zawijanie w tych kontekstach; nie usuwać elastycznej szerokości kolumn.
- **Akceptacja:** długie podobne nazwy da się odczytać bez myszy. Próg faktycznego obcięcia: Visual QA.

### UX-012 — akcje kart Dashboardu znikają również przy fokusie

- **Ekran:** Dashboard, backup/usuwanie. **Severity: P2. Compliance: NIEZGODNE. Zakres: ACCESSIBILITY. Confidence: HIGH.**
- **Reguły:** ACT-03, A11Y-02.
- **Obserwacja:** [dashboard.tsx](../artifacts/tournament-manager/src/pages/dashboard.tsx), 467/480: przyciski `opacity-0 group-hover:opacity-100`, bez odpowiednika focus/focus-within. Sam Tab nie aktywuje hover. Nie jest to ta sama kontrolka co link z UX-001.
- **Wpływ:** fokus może trafiać na niewidoczną akcję; narzędzia są również słabo odkrywalne bez hover.
- **Kierunek:** ujawnianie przy fokusie oraz czytelność na urządzeniu bez hover; zachować wtórność/destrukcyjność działań.
- **Akceptacja:** Tab ujawnia kontrolkę i wskaźnik fokusu. Test Dashboard + browser keyboard/touch.

### UX-013 — globalna nawigacja nie ogłasza bieżącej strony

- **Ekran:** wspólny Layout (Dashboard/Nowy turniej/Pomoc). **Severity: P2. Compliance: CZĘŚCIOWO ZGODNE. Zakres: ACCESSIBILITY. Confidence: HIGH.**
- **Reguły:** NAV-03/05.
- **Obserwacja:** [layout.tsx](../artifacts/tournament-manager/src/components/layout.tsx): aktywność Dashboard/Pomoc to warunkowe klasy, bez `aria-current`; brak dedykowanego linku pomijającego header, choć landmark `main` istnieje. Lokalna nawigacja organizatora i Audience mają już `aria-current` — nie zgłaszamy ich ponownie.
- **Wpływ:** stan aktualnej strony nie jest programowo opisany; użytkownik klawiatury wielokrotnie przechodzi powtarzalny header.
- **Kierunek:** semantyka aktywnego linku i prosty bypass do main; bez przerabiania routingu.
- **Akceptacja:** jeden właściwy current link, skip link widoczny na fokusie. Sprawdzenie zwijania globalnego headera pozostaje osobnym punktem Visual QA.

### UX-014 — opis motywu obiecuje niedostępny font

- **Ekran:** Wizualia / motyw Deadlock. **Severity: P2. Compliance: CZĘŚCIOWO ZGODNE. Zakres: UI ONLY + VISUAL-QA REQUIRED. Confidence: HIGH dla brakującego assetu.**
- **Reguły:** TYPE-04, MSG-01.
- **Obserwacja:** [tournament-presentation-panel.tsx](../artifacts/tournament-manager/src/components/tournament-presentation-panel.tsx), 37: opis aktywnej palety „z Valve Pulp Bold”. [index.css](../artifacts/tournament-manager/src/index.css), 8–9: URL `/fonts/valvepulp-bold.ttf`; repo ma jedynie [instrukcję assetu](../artifacts/tournament-manager/public/fonts/README.md), bez fontu. Istnieje fallback Georgia/Times.
- **Wpływ:** oczekiwanie wizualne różni się od dostępnych assetów. Nie dowodzi to zepsutego layoutu ani problemu Saira.
- **Kierunek:** osobna decyzja o dostarczeniu prawidłowego, legalnego assetu lub dokładności opisu dostępności. Nie zastępować fontu losowym plikiem ani zmieniać presetów w tej serii.
- **Akceptacja:** zgodność opisu z faktycznie ładowanym fontem; weryfikacja network/computed font w Preview. Pozostawiono bez implementacji.

### UX-015 — wspólny przycisk zamknięcia dialogu ma angielską nazwę

- **Ekran:** modale oparte na wspólnym Dialog. **Severity: P3. Compliance: CZĘŚCIOWO ZGODNE. Zakres: ACCESSIBILITY. Confidence: HIGH.**
- **Reguły:** A11Y-07.
- **Obserwacja:** [ui/dialog.tsx](../artifacts/tournament-manager/src/components/ui/dialog.tsx) ma `sr-only` „Close”. Dostępna nazwa istnieje, ale nie jest polska.
- **Wpływ:** niewielka niespójność języka odczytu; nie jest to brak możliwości zamknięcia.
- **Kierunek:** spolszczyć nazwę bez zmiany zachowania Radix.
- **Akceptacja:** przycisk odnajdywany po nazwie „Zamknij”, działanie Escape/powrót fokusu zachowane.

### UX-016 — błąd zapisu reguł gry istnieje tylko w toaście

- **Ekran:** Tournament Detail → Gra i reguły. **Severity: P2. Compliance: CZĘŚCIOWO ZGODNE. Zakres: UI + STATE. Confidence: HIGH.**
- **Reguły:** FEED-02, MSG-01, FORM-06.
- **Obserwacja:** [deadlock-game-config.tsx](../artifacts/tournament-manager/src/components/deadlock-game-config.tsx), `TournamentGameConfigPanel`, onError mutacji: jedynie `toast` z błędem; nie ma trwałego inline error przy edytowanej konfiguracji. Lokalna wartość po samej nieudanej mutacji pozostaje.
- **Wpływ:** po zniknięciu powiadomienia formularz nie przypomina, że ustawienia nie zostały zapisane; operator może wrócić do innych działań z błędnym przekonaniem o stanie.
- **Kierunek:** lokalny feedback przy formularzu, konkretny komunikat serwera i czytelne niezapisanie; toast tylko pomocniczy. Nie zmieniać reguł gry ani automatycznie ponawiać zapisu.
- **Akceptacja:** failed save pozostawia wartości i inline error; nowy udany zapis usuwa stary błąd. `deadlock-game-config.test.tsx`.

## ALREADY COMPLIANT / RECENTLY IMPROVED

Poniższe zachowania są **ZGODNE w sprawdzonym zakresie kodu**. Nie zgłaszamy ich jako nadal nierozwiązanych problemów; pomiar wyglądu pozostaje oddzielnym zadaniem.

| Poprawiony obszar | Dowód / kontrakt | Co zachować |
|---|---|---|
| Kompaktowa geometria Single Elimination | `components/bracket-view.tsx`, testy geometrii; pakiet `523eb56` | Centra rzeczywistych meczów źródłowych, karta 64 px, zwycięzca przy finale, wewnętrzny scroll. Nie wracać do wykładniczych spacerów. |
| Host adaptive layout | `pages/tournament-host.tsx` i testy; `523eb56` | Kolejka pełnej szerokości dla 0–2 wyników; od 3 wyników desktop 2:1; wężej jedna kolumna. |
| Responsywne standings | `components/tournament-stages-panel.tsx`, `pages/public-stage-views.test.tsx` | Liczba grup zależna od kontenera, elastyczna nazwa, kompaktowe liczby, status z zawijaniem, lokalny scroll awaryjny. |
| Publiczne match cards i header | `pages/tournament-audience.tsx` i testy; `523eb56` | Kompaktowe karty, wiersz od 768 px, zawijanie headera, elastyczna nazwa, lokalne przewijanie nawigacji. |
| Readiness / Next Step | `lib/organizer-next-step.ts`, `lib/stage-lifecycle-feedback.ts`, `components/tournament-stages-panel.tsx`; `af26e30` | Summary/action/counts oddzielone od pełnych komunikatów i kodu. UX-008 dotyczy innego, nadal starego miejsca renderowania. |
| Konkretny feedback konfiguracji | `lib/stage-configuration-feedback.ts` | Odczyt `error.data`, nazwa etapu, expected/actual i zachowanie backendowych szczegółów zamiast ogólnego błędu. |
| Draft po nieudanym zapisie Koszyków | `components/stage-baskets-panel.tsx`, handleSave | Catch nie zamyka edycji ani nie czyści draftu. UX-006 dotyczy opuszczenia ekranu, nie regresji tej poprawki. |
| Czytelne RouteConnector | `components/stage-baskets-panel.tsx` i testy; `af26e30` | Osobna struktura źródło → cel, nazwy etapów, kolor pomocniczy, zachowane akcje edycji. |
| Host conflict recovery | `pages/tournament-host.tsx`, `hooks/use-match-result-drafts.ts` | Aktualny mecz oddzielony od starego wyniku, jawne odrzucenie draftu i nowa edycja, brak auto-retry i podmiany revision przez polling. |
| Hierarchia Host / stan zakończony | `pages/tournament-host.tsx` | Rzadkie akcje w „Więcej akcji”, wtórna korekta, jedno główne podsumowanie z mistrzem. |
| Etapy: target, pending, historia | `components/tournament-stages-panel.tsx`, `components/stage-qualification-routing.tsx` | Jawny stage target, wspólny flow start/completion, konkretny lub neutralny prawdziwy pending, brak fałszywego dalszego kroku po zakończeniu. |
| Lokalne linki organizatora | `components/tournament-organizer-navigation.tsx` | `aria-current`, lokalny overflow i `scrollIntoView` aktywnego linku. |
| Tworzenie turnieju — podstawowa walidacja | `pages/create-tournament.tsx` i testy | Fokus pustej nazwy/hasła, powiązanie błędu nazwy, submit lock i ponowne odblokowanie po błędzie. |
| Cut / Sharp — token radius | `index.css`, `--radius-sm/md` | Istniejące `max(0px, ...)`; nie zgłaszamy ujemnego radius jako potwierdzonego błędu. |

## Visual QA wymagane — bez orzeczenia FAIL

Wszystkie poniższe pozycje mają **Confidence: VISUAL QA REQUIRED; zakres: VISUAL-QA REQUIRED**. Nie są dodatkowymi P0–P3, dopóki nie powstanie reprodukcja. Brak browsera nie jest błędem produktu.

1. **Macierz ekranów:** Dashboard, tworzenie, Detail/Players, Etapy, Koszyki, kwalifikacja, Host, Audience/Matches/Standings/Bracket, projector. Szerokości 1920/1366/1024/768; dodatkowo reflow 320 CSS px i powiększenie tekstu 200%.
2. **Presety:** default i Emerald Occult; ramki Cut/Sharp; Saira i Inter. Rzeczywisty kontrast tekstu, badge, obramowań kontrolki i focus ring; nie wyciągać wniosku AA z samych tokenów.
3. **Globalny Layout:** stały header `h-14` z kilkoma elementami flex wymaga sprawdzenia zawijania/overflow przy powiększeniu. Nie zgłaszamy ucięcia jako potwierdzonego tylko na podstawie klas. Poprawiony header Audience to inny komponent.
4. **Wybrany vs aktywny etap:** semantyka jest rozdzielona w kodzie; sprawdzić, czy wizualnie pozostaje jednoznaczna również z klawiaturą i w każdym presecie.
5. **Gęstość i długie dane:** 24+ mecze Host, 0/1/2/3+ wyników, kilka grup, długie podobne nazwy, status wielowierszowy; nazwy/CTA nie mogą być zasłonięte.
6. **Mapy:** SE 8/16/32, wiele etapów i 1–4 tras; lokalny scroll, brak globalnego overflow, kierunek linii i odczyt nazw koszyków.
7. **Feedback:** appearance error/warning/success/pending przy formularzu; wielowierszowe expected/actual/details, brak zasłonięcia CTA lub skoku fokusu. Nie usuwać szczegółów, by uzyskać krótszy screenshot.
8. **Modale i klawiatura:** Tab/Shift+Tab/Escape, powrót fokusu, sticky header, 400% zoom, lokalny scroll treści i dostęp do przycisków; uzupełnić runtime dowód do UX-002/012.
9. **Screen reader:** nazwy pól, alerty i statusy, kolejność odczytu, ogłaszanie zmian LIVE bez zalewania komunikatami. Ocenić potrzebę kontroli auto-update i ewentualny wyjątek istotności LIVE, bez automatycznego uznawania pollingu za niezgodny.
10. **Projector:** czytelność wyniku/kontekstu z dystansu, zoom/fullscreen i świeżość danych. Nie wymaga operatorskich CTA ani gęstości formularza.

## Priorytetyzacja

### P0 — wszystkie

Brak potwierdzonego nowego P0. Nie przeprowadzono manualnego flow ani pełnego audytu zgodności A/AA.

### P1 — wszystkie

| ID | Cel |
|---|---|
| UX-001 | Otwieranie kart Dashboardu klawiaturą |
| UX-002 | Dostępne modale Dashboardu |
| UX-003 | Programowo powiązane etykiety i błędy pól |
| UX-004 | Error ≠ empty w danych podrzędnych |
| UX-005 | Koniec loadingu po failure Public Bracket/Projector |
| UX-006 | Ochrona niezapisanej konfiguracji przy opuszczeniu |

### P2 — wszystkie

UX-007 retry Koszyków; UX-008 readiness w kwalifikacji; UX-009 nazewnictwo/statusy; UX-010 metadata i tokeny Audience; UX-011 pełne nazwy bez hover; UX-012 widoczność akcji na fokusie; UX-013 globalna nawigacja; UX-014 dostępność fontu; UX-016 inline error konfiguracji gry.

### P3 — wszystkie

UX-015: polska nazwa zamknięcia dialogu.

### TOP 10 NEXT IMPROVEMENTS

| Kolejność | ID | Dlaczego teraz | Koszt względny / granica |
|---|---|---|---|
| 1 | UX-004 | Fałszywy pusty roster/wyniki podczas pracy operatora; kilka często używanych ekranów | Średni; stany istniejących query, bez API |
| 2 | UX-005 | Publiczny ekran może bez końca udawać ładowanie podczas turnieju | Mały; rozróżnienie istniejących stanów odczytu |
| 3 | UX-006 | Utrata przygotowywanej konfiguracji i koszt ponownego wykonania pracy | Średni; osobny pakiet dirty/navigation state |
| 4 | UX-001 | Podstawowa nawigacja niedostępna bez myszy | Mały; semantyka linku i regresja |
| 5 | UX-002 | Fokus i kontekst decyzji destrukcyjnej | Mały/średni; istniejący Dialog, bez nowego systemu |
| 6 | UX-003 | Częste formularze i dostępność operatora | Średni; lokalne powiązania w kilku plikach |
| 7 | UX-007 | Brak prostego recovery w kluczowej konfiguracji | Mały; refetch + inline alert |
| 8 | UX-012 | Niewidoczna akcja przy fokusie; mały koszt naprawy | Mały; ekspozycja istniejących kontrolek |
| 9 | UX-016 | Operator powinien stale widzieć, że konfiguracji nie zapisano | Mały; lokalny feedback, bez zmiany danych |
| 10 | UX-008 | Ujednolicenie następnego kroku po przekazaniu uczestników | Mały; użycie istniejącego modelu prezentacyjnego |

### Rekomendowany pierwszy pakiet implementacyjny

**Odczyt i recovery bez fałszywego empty/loading — trzy powiązane problemy: UX-004, UX-005, UX-007.**

- Pliki: `pages/tournament-detail.tsx`, `pages/tournament-audience.tsx`, `pages/tournament-bracket.tsx`, `pages/tournament-projector.tsx`, `components/security-panel.tsx`, `components/stage-baskets-panel.tsx` i celowane testy.
- Kontrakt: initial loading, udane empty, initial error + retry, cached data + refetch error, udane odzyskanie. Nie zmieniać routingu, algorytmów, auth ani inicjować mutacji przez retry.
- Regresje: błąd pojedynczego odczytu przy udanym odczycie turnieju; brak fałszywych zer/pustych list; brak nieskończonego loadingu; odzyskanie bez utraty draftu; brak retry mutacji.
- Następnie osobno UX-006 (dirty configuration), pakiet dostępności UX-001/002/003/012 oraz spójność feedbacku UX-008/009/016. Zmiany typografii i kontrastu dopiero z działającym Preview i pomiarami; font pozostaje osobną zależnością.

## Status dokumentów i walidacji

Standard zawiera 18 sekcji A–R, 85 identyfikowanych reguł, tabelę Organizer/Audience, 12 kontraktów komponentów i checklistę review. Istniejący standard przeczytano w całości; nie wymagał nadpisania ani rozszerzania o implementację.

W tej sesji nie uruchamiano testów aplikacji ani builda: kod się nie zmienił, a celem jest audyt. Sprawdzono odnośniki lokalne, identyfikatory reguł oraz zakres zmian dokumentacyjnych. Wyniki wcześniejszych testów nie są przedstawiane jako nowa walidacja ani dowód dostępności. Źródła WCAG i wzorce design systems są podlinkowane w standardzie; nie powtarzano szerokiego researchu.
