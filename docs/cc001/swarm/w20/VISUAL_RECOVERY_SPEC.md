# CC-001 — VISUAL RECOVERY SPEC
**W20 · draft v0.1 · 2026-11-03 · SPEC FIRST / NO GAMEPLAY OR UI PATCHES**

**Decyzja właściciela:** obecne wizualia, nazwy, ikony i czytelność są głównym problemem. Odtworzyć NAJLEPSZE cechy historycznego HTML, nie całą dawną implementację. HP każdej kulki ma być liczbą POZA nią, P1/P2 na każdej kulce ma zniknąć z domyślnego HUD, a STOP preview ma pozostać dostępny ON/OFF we wszystkich trybach.

**Status:** właścicielskie wymagania są WIĄŻĄCE; poniższe położenia etykiet, język ikon/nazw, domyślne przełączniki i kolejność są propozycją do odbioru A20+A11+A10. **Nie ogłaszać FINAL_SPEC, nie rozpoczynać nowych zmian Unity i nie podnosić RUNTIME PASS przed osobnym odbiorem.**

## 0. Pochodzenie / ochrona źródeł
- W20 Unity DEV selected: 7473ceb249086e35942999c093f2c42a91afd415 (Claude #309; kod gry jak fb5eb505d861a4f8f44a34321020ad71a0ba1710). Izolowane przyjęcie SOURCE_ONLY: [Draft #310](https://github.com/C8LyNn/aplikacja-turnieje/pull/310). Oryginalne #308 i #309 bez ingerencji.
- Zamrożony HTML V148, referencyjne SHA256: bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5ef9ca4623e. Źródło w [Reference/V148_reference_original.html](../../../unity/cc001-r16/Reference/V148_reference_original.html). Nie przepisywać fizyki, zdolności, Protocol149, balansu R16 lub Mitosis/Furnace.
- Historyczny V122 istnieje jako [archiwum HTML](../../../artifacts/tournament-manager/public/portfolio/docs/evidence/core-clash-v122-archive.html) — **bezpośrednio przeczytany kod CSS/JS**; to nie jest zamiennik zatwierdzonego V148.
- V149 Legacy: [kod](../../../unity/cc001-r16/CoreClash-V149-Unity/Legacy/core_clash_v149_legacy_presentation.html), [status](../../../unity/cc001-r16/CoreClash-V149-Unity/docs/LEGACY_PRESENTATION_STATUS.md), [przegląd V149.5](../../../unity/cc001-r16/CoreClash-V149-Unity/docs/ARCHIVE_HTML_REVIEW.md).
- Materiały porównawcze: [R2](../../../unity/cc001-r16/CoreClash-V149-Unity/docs/R2_VISUAL_COMPARISON.md), [R3](../../../unity/cc001-r16/CoreClash-V149-Unity/docs/R3_VISUAL_COMPARISON.md), [R4](../../../unity/cc001-r16/CoreClash-V149-Unity/docs/R4_VISUAL_REVIEW.md), [identyfikacja](../../../unity/cc001-r16/CoreClash-V149-Unity/docs/ARCHIVE_PRESENTATION_REVIEW.md).
- UWAGA O ZAKRESIE: narzędzie odczytało pełny tekst V122 i dokumentację porównawczą; bardzo duże V148/V149 HTML nie zostały tutaj poddane pełnemu bezpośredniemu przeglądowi wszystkich linii. Wnioski z V148/V149 oparte na wymienionych raportach, nie oznaczać ich jako pełnej archeologii wersji. A11 ma potwierdzić pełną sekwencję historycznych buildów i oryginalne zrzuty.

## 1. Unity dziś — konkretne źródła problemów

| Priorytet | Fakt w kodzie na 7473ceb | Dlaczego problem UX | Decyzja / kierunek |
| --- | --- | --- | --- |
| P0 | **BallView.cs L46–52**: znak typu oraz liczbowe HP są dwiema liniami wewnątrz kulki | Typ i zdrowie walczą o najmniejszy i najważniejszy obszar rozpoznawania | Zostawić centralny *symbol roli/typu*; **dokładne bieżące HP na zewnątrz** |
| P0 | **BallView.cs L54–58**: osobny P1/P2 ponad kulką, mimo kolorowego rantu właściciela | Redundancja, szum i zajęcie miejsca potrzebnego na HP | Usunąć P1/P2 z domyślnej planszy, nadal pokazywać ownera w HUD/Inspect; dostępność osobną nienachalną geometrią |
| P0 | **BallIdentity.cs**: ASCII dwuliterowy stem + base-36 disambiguator | Stabilna unikatowość kodu ≠ znaczenie i rozpoznawalna ikona; nie naprawia semantyki nazwy | Zdefiniować ikonografię i słownik nazw, zamiast zmieniać wyłącznie generator skrótów |
| P0 | **BallView.cs L60–71**: pod kulką wiersze statusów, po lewej u góry Replay R i złoty puls | Etykiety konkurują z właścicielem, HP, STOP i banerem obrażeń | Jeden budżet overlayów i hierarchia: HP, możliwość akcji Replay, stan krytyczny, reszta w Inspect |
| P0 | **BoardView.cs L322–348**: estymowany punkt STOP, tekst i marker w celowaniu | Może zmniejszać niepewność i znaczenie praktyki w mierzeniu strzału | Zachować kod, dodać systemową możliwość ON/OFF dla każdego trybu |
| P0 | **#308**: baner obrażeń zasłaniał R/kulkę, licznik Replay wyrzutnię; **#309** zawiera planowanie bez kolizji | Poprawa jednego overlayu może wypchnąć inny, zwłaszcza w pionie/zagęszczeniu | Wykorzystać istniejące BoardOverlayPlanner/BoardLabelLayout w przyszłym projekcie; najpierw kontrakt i test |
| P1 | **MatchView.cs**: wiele opisów/copy panelu, stock i szczegóły, nazwy katalogowe na kartach | Obserwowany przez właściciela problem nazw utrudnia szybki wybór | Różnicować nazwę przyjazną, etykietę roli, pełną regułę i stabilne ID |
| P1 | **BallView**: puls/glow, badge, typ, HP, owner, statusy; board efekty i smugi | Jednoczesne efekty obniżają sygnał do szumu | Zdefiniować limit jednoczesnych kanałów, adaptację do zagęszczenia i ograniczenie animacji |

**Kategoryzacja:** nie wszystkie wizualne kolizje są dziś reprodukowane w nowym Playerze. Rozróżniać CODE_CONFIRMED, HISTORICAL_SCREENSHOT, AUTHOR_REPORTED_PLAYER oraz INDEPENDENT_NATIVE_QA (ostatnie wciąż HOLD). Nie zgadywać czytelności na podstawie kompilacji.

## 2. Historia HTML — tabela BEST-OF (tymczasowa do niezależnego A11)

| Wersja / dowód | Najlepszy element / gorszy element | Decyzja przeniesienia do Unity |
| --- | --- | --- |
| **V122 źródło, drawBall L25912–25945** | Pierścień dzielony na segmenty **po 5 rzeczywistego max HP**, aktualne **liczbowe HP NAD obrysem kulki** w trybie detail=2; przy detail=0 prosty łuk proporcji | **PRZENIEŚĆ ideę zewnętrznej liczby**; segmenty/łuk potraktować jako drugorzędną, opcjonalną wizualizację, bo liczba jest wymogiem nieusuwalnym |
| **V122 L25949–25956** | Mały geometryczny znacznik ownera pod kulką, dodatkowo drużynowy obrys; bez drukowania P1/P2 na każdej sztuce | **PRZENIEŚĆ zasadę nie-tekstowego kodowania**; docelową geometrię i czytelność na P1/P2 dobrać w QA |
| **V122 L25573–25599, 25627+** | Aura ma wariant uproszczony na zatłoczonej planszy; zmienne ogień/lód itp. prezentowane jako efekty | **PRZENIEŚĆ hierarchię i adaptację szczegółów**, nie kopiować wszystkich animacji i kosztownych halo |
| **V122 L14001–14020, CSS L203–215** | Katalogowa kulka: błyszczące tło typu, wyraźny mark, osobny **badge HP** i kontekst nazwy; obecne role/stan dostępne w kartach | **PRZENIEŚĆ rozdzielenie typu/HP/nazwy**; nie utożsamiać katalogowego max HP z HP aktualnej instancji |
| **V122 L3751–3859** | Osobne wejścia AI, Standard-only, lokalne PvP, online, Sandbox, Simulation Lab, AI vs AI; jasne obietnice funkcji | **ZACHOWAĆ ideę czytelnych kart trybu**, ale NIE kopiować listy jako deklaracji, że Unity już je obsługuje |
| **V148 z porównań R2/R3** | Arena 540:900, navy/grid/strefy/okręgi, barwne HUD HP/bars, wskazówki celowania i odbicia od ściany; wyraźnie podzielona plansza i panel | **PRZENIEŚĆ język planszy i celowania**, nie układ piksel-w-piksel ani kompletny system predykcji STOP |
| **V149 Legacy / R4 archive** | 4 featured talie i szybki AI/local wybór, zwinięte Advanced; dane kart prowadzą do istniejącego draftu | **PRZENIEŚĆ selektywną progresywną ekspozycję**, zachowując pełny custom builder |
| **R2→R3 oraz R4→R5 raporty Unity** | Wcześniejsze przycięcia tekstu „RELEASE TO LAUNCH”, HUD w wąskim pionie i długich nazw w builderze; później naprawione pomiarem tekstu/scroll | **NIE ODZYSKIWAĆ regresji**; każdy nowy układ przechodzi screenshot-diff i realne scenariusze kompaktowe |
| **V119/V122 i R4 Identity** | Historyczne losowe glify zastąpiono krótkimi kodami; starsze dwuliterowe oznaczenia miały 188/224 powtórzeń; nowe są unikalne (BO0, BO3), ale to wciąż kody | **NIE PRZENOSIĆ** przypadkowych glifów, nie traktować „unikalny skrót” jako rozpoznawalnej semantycznej ikony |
| **V149.5 przychodzący archive / ARCHIVE_HTML_REVIEW** | Auto-restore w tle mógł wywrócić nowo wybrany mecz offline; baner wyboru mógł być nieaktualny | **NIE PRZENOSIĆ** tych asynchronicznych i niespójnych ścieżek UI; brak także kopiowania legacy networking |
| **Unity #309 W19** | Collision-aware placement banera i Replay, ukrycie w trakcie drag, zewnętrzny frame fallback | **ZACHOWAĆ jako aktualny punkt wyjścia**, ale po dodaniu HP, usunięciu P1/P2 i testach gęstego pola przeliczyć keep-outy |

### Ograniczenia porównania
- Nie istnieje w tym audycie materiał pozwalający rozstrzygnąć, że **całe V122 jest ładniejsze niż całe V148**. Oceniamy **konkretną cechę / klatkę / regułę**, nie numer wygranej wersji.
- R2/R3 są wcześniejszymi raportami runtime, nie dowodami wizualnej poprawności aktualnego #309.
- 4 featured talie w V149 Legacy to prezentacja, nie balans; prawdziwe zasady V148 nadal chronione.
- A11 ma dodać screeny P1/P2 o tej samej scenie i rozmiarze, ocenę reguły pomiaru oraz pełne źródła/wersje. Bez A11 tabela pozostaje **BEST_OF_CANDIDATE**, nie wynik końcowy.

## 3. Kanoniczny kontrakt wizualny kulki — PROPOZYCJA DO A20+A10

### 3.1 Priorytety informacji (co widzę bez otwierania Inspect)
1. Czy kulka istnieje, gdzie jest jej **rzeczywiste fizyczne koło** i jaki jest jej typ — **jedna rozpoznawalna sylwetka/ikona w środku**, bez tekstowego tłoku.
2. **Bieżące numeryczne HP poza krawędzią** — zawsze prawdziwa wartość instancji, bez pokazywania max HP zamiast current HP.
3. Owner — kolor rantu P1 cyan / P2 rose + dyskretny **nie-tekstowy** kod geometrii (weryfikowany dla daltonizmu i w dwóch perspektywach); literalne P1/P2 tylko HUD, Inspektor, opcjonalny tryb accessibility/debug.
4. Aktualna możliwość Replay — złoty R/puls wyłącznie z prawdziwego CanReplay; stan akcji nie może zasłonić HP, wyrzutni ani celu dotykowego.
5. Stany ważne tu i teraz (freeze/fire/shield/ROOTED) — maksimum 1–2 sygnały pierwszoplanowe w normalnym HUD; nadmiar w Inspektorze. Nie scalać niezależnych stanów w fałszywy jeden.
6. Pełna nazwa, szczegółowy opis, max HP, shield, dokładne stany, raw ID i debug informacje — w panelu/Inspektorze, nie wewnątrz koła.

### 3.2 HP — WIĄŻĄCE
- **Każda żywa kulka** ma w normalnym gameplayu zewnętrzny, zawsze numeryczny licznik aktualnego HP; brak mechanizmu ukrywającego liczbę, gdy pole jest gęste. Nie zastępować liczby procentem, samym kolorem, segmentami ani paskiem.
- **Proponowana pierwsza kotwica:** ok. „godzina 1–2” na zewnątrz obrysu (prawa-górna ćwiartka), żeby złoty R mógł pozostać po lewej-górnej stronie; matowy neutralny capsule z bardzo czytelną białą liczbą i jasną obwódką. Nie zakrywać fizycznego obwodu kulki ani hitboxu dotykowego.
- **Fallback** przy ścianie: stała, deterministyczna kolejność kotwic zewnętrznych (górna prawa → prawa → dolna prawa → górna) i rezerwacja obszaru przed innymi overlayami; zachowanie bez migania i bez przeskoków na każdej klatce. W ekstremalnym tłoku projekt layoutu/leader-line musi **nadal pokazać dokładne HP**, a nie usuwać je.
- Numer to **BallRuntime.hp**, źródło autorytatywne, aktualizowane przy snapshotach. HP=23 renderować „23”; max HP i shield oddzielnie w Inspektorze. Nie sumować osłony do HP; nie rozciągać i nie koloryzować liczby tak, aby znikała po obrażeniach. Stan śmierci usuwa/demaskuje etykietę dopiero wraz ze stanem obiektu.
- Segmentowa obręcz 1 segment = 5 HP z V122 to **opcjonalna warstwa drugorzędna**, domyślnie wyłączona na małym ekranie, chyba że QA wskaże jasną korzyść bez zakłóceń. Nie zmieniać maksymalnych HP.

### 3.3 Owner — WIĄŻĄCE + accessibility
- **Brak P1/P2 na każdej kulce w widoku standardowym.** Kolor właściciela w rancie pozostaje niezależny od koloru typu. P1/P2 w HUD, trybie Inspect, dostępności i debug.
- Zalecany test niehue: porównać dyskretny znacznik geometryczny pod obwodem w V122 z alternatywą „różna przerwa/rytmy rantu” bez pokrywania kodu Replay ani HP. Wybrać JEDEN sygnał dodatkowy; nie wprowadzać kilku jednocześnie.
- W widoku odwróconym klienta P2 owner nadal opisuje obiekty, nie ekranową stronę; nie zakładać, że „dolna kulka = P1”.

### 3.4 Wizualizacja statusów i Replay
- Priorytet HUD: trwałość/HP > jednoznaczna akcja Replay > status grożący natychmiastowym skutkiem > historyczne efekty. Nie ukrywać rzeczywistych stanów w Inspektorze.
- Replay R i puls **złote**, nie kolor właściciela; aktywne tylko dla prawdziwego CanReplay. Licznik ma być poza wyrzutnią i nie przejmować zdarzeń myszy. W czasie przeciągania nie może zasłaniać celu.
- Zewnętrzne HP trzeba **dodać do keep-out rectangles** w BoardOverlayPlanner. Po usunięciu chipu P1/P2 zmienić odpowiednio jego rezerwację. Nie kopiować starej geometrii bez testów.
- Przy zatłoczeniu zachować czytelny centralny typ i liczbę HP; ograniczać peryferyjne VFX, a pozostałe stany przenosić na Inspect. Motion-reduced i ograniczenie emisji efektów to przyszły A20 test, nie aktualna implementacja.

## 4. Nazwy i ikony — nowy standard (propozycja)

| Warstwa | Standard | Nie robić |
| --- | --- | --- |
| **canonical ID** | stabilne oryginalne id (save, sieć, talie, logi) | żadnego renamingu identyfikatorów, migracji V148 czy balansu |
| **displayName** | nazwa widoczna dla gracza, opisuje dominującą funkcję; preferuj 1–2 słowa, zrozumiała bez lore i nie myli interakcji | wielowyrazowa poetyka nieobjaśniająca działania, niekonsekwentne człony typu Core/Relay bez potrzeby |
| **roleLabel** | 1 krótki ustandaryzowany termin: CONTROL, SUPPORT, DAMAGE, DEPLOY, MOBILITY itd. (taksonomia do weryfikacji A10) | osobne, niekompatybilne skróty role na każdej karcie |
| **board icon** | sylwetka o jednym głównym motywie mechanicznym + opcjonalny jeden modyfikator w ramach rodziny; czytelność monochromatyczna w 24–32px, przez większe 40–64px | random ASCII (np. BO0/BO3) jako docelowa ikona, emoji platformowe, wielki tekst na kulce |
| **details/rules** | pełne znaczenie, obecne ograniczenia, timing, źródła efektów | fałszywe opisy wpływu/role lub obietnice niezaimplementowanej mechaniki |

**Katalog demonstracyjny do audytu, NIE zatwierdzony rename:** Rimeburst (trigger na frozen), Blightpool (strefa toksyny), Gatekeeper (para portali), Horizon Relay (trzeci consume daje damage base), Quartermaster (periodic Standard). A10 sprawdza prawdziwe aktualne efekty, A20 porównuje z ikonami i testuje rozpoznawanie. Dopiero potem proponować czytelniejsze konkretne displayName w języku wybranym dla produktu; PL/EN mają być osobnymi warstwami, nie mieszanką na jednej karcie.

**Zakres walidacji:** najpierw rodzina i 16–24 reprezentatywne kule, w tym trzy podobne wyglądem i trzy podobne z nazwy. 224 pełnych ikon **NIE** generować masowo przed testem rozpoznania. Pomiar: wybór właściwej karty/zdolności na podstawie samej ikony, potem ikona+nazwa, 5-sekundowy ogląd na 24px i ekranach 390px. Mierzyć pomyłki, nie ogłaszać sukcesu z samej unikatowości znaków. Zachować tekstowe zamienniki dla accessibility.

## 5. STOP preview — KONTRAKT A10 DO ODBIORU

**Stan obecny:** BoardView RenderStopEstimate pokazuje predykcję swobodnego toczenia i uzupełnia opis „IF PATH CLEAR” po wykryciu przeszkód. To estymator informacji, **nie** gwarancja wyniku po kontakcie, zdolności czy kolizji; włączenie/wyłączenie nie może zmieniać fizyki.

**Owner LOCK:** nie usuwać systemu. Każdy tryb ma działać z ON i OFF, a użytkownik musi mieć dostęp do wyboru.

### 5.1 Defaults per mode — PROPOSAL, NOT OWNER-APPROVED

| Tryb (sprawdzić faktyczną dostępność w Unity) | Startowy STOP | Opcja ON/OFF | Uzasadnienie |
| --- | --- | --- | --- |
| Tutorial / nauka / pierwsze AI | **ON** | Tak | Uczy siły, tarcia, odbić; pomaga wejść w grę |
| AI casual / solo PvE | **ON** | Tak | Onboarding i samodzielna decyzja poziomu asysty |
| Standard-only / skill challenge | **OFF** | Tak | Wspiera samodzielne przewidywanie fizyki |
| Lokalny PvP / hot-seat / pass-and-play | **OFF** | Tak, wspólna sesja | Równe zasady informacji między P1 i P2 |
| LAN / online casual PvP | **OFF** | Tak, jawna polityka sesji | Nie dopuszczać ukrytej asymetrii bez decyzji o fair play |
| Sandbox / Creative / testowanie | **ON** | Tak | Eksperymentowanie i diagnostyka |
| AI vs AI / Simulation Lab | **OFF** (widok obserwatora) | Tak, do wizualizacji analitycznej | Brak manualnego celowania, ale kontrakt konfiguracji ma być kompletny |
| Przyszły ranking / turniej | **OFF** | Tak, jako jawnie wyróżniony wariant lobby/queue | Jeśli ON wpływa na wyniki, nie mieszać rankingu i trybów bez jawnej decyzji właściciela |

**Ważne:** dokument nie zakłada, że wszystkie tryby HTML V122 obecnie istnieją w Unity. Obecny SetupView potwierdza akcję START LOCAL MATCH; reszta wymaga inwentaryzacji A10/A11. Brakujący tryb ma oznaczenie NOT_IMPLEMENTED, nie pozorną działającą opcję.

### 5.2 Zachowanie przełącznika
- OFF: nie rysować punktu końcowego, pierścienia STOP, tekstu EST. STOP ani znacznika zasięgu; zachować legalne celowanie, kierunek, siłę, ewentualne odbicie ścienne jeśli jest niezależną historyczną pomocą. **Nie wykonywać kosztownej symulacji predykcyjnej tylko dla ukrytej etykiety.**
- ON: zachować aktualne prawdziwie ograniczone obietnice; tekst „estimated / if path clear”, zachować aktywny ruch i wszystkie zasady CanReplay.
- UI: wyboru dokonuje się jawnie w ustawieniach danego trybu przed meczem; ścieżka przełączenia podczas gry wymaga uczciwej decyzji A10. Pamiętać ustawienie osobno per tryb (bez przenikania do innych) i nie resetować podczas zwykłego UI reloadu.
- PvP: rekomendacja A10 to **widoczne, wspólne ustawienie meczu**, nie skryta indywidualna przewaga. Zmiany tylko w granicy tury lub przed startem, oznaczenie obu graczom. Nie modyfikować Protocol149 bez osobnej zgody: A70/A41 musi najpierw wskazać istniejący zgodny kanał lobby/settingu albo uczciwie oznaczyć ONLINE_CONFIG_HOLD.
- Brak zmian autorytatywnego GameSimulation, Step, trybu sieciowego czy wartości HP z powodu samego przełącznika.

### 5.3 Eksperyment ON versus OFF
Rejestrować bez danych wrażliwych: czas od rozpoczęcia drag do zatwierdzenia strzału, czas tury, udane własne/obce strefy, realne obrażenia, odchylenie przewidywanego STOP od realnego tylko w dopuszczalnych pustych scenach, liczbę powtórzeń Replay, porzucone próby celowania, ocenę przyjemności/pewności, FPS/GC. Testować te same mapy/seed/typy i zrównoważyć kolejność ON/OFF u graczy początkujących i doświadczonych; nie wyciągać decyzji rankingowej z kilku niekontrolowanych meczów. Ukończenie eksperymentu nie wymaga naruszenia V148/Protocol149.

## 6. Priorytety po zatwierdzeniu dokumentu (NIE TERAZ)

| Kolejność | Proponowany pakiet | Definition of done |
| --- | --- | --- |
| **P0-01** | Jednolity liczbowy zewnętrzny HP + usunięcie default P1/P2 | 100% żywych kulek pokazuje bieżącą liczbę poza fizycznym kołem; aktualizacje snapshotów i obrażeń; bez kolizji z R/launcher/banerem |
| **P0-02** | STOP preview ON/OFF per tryb | Da się rozpocząć i dokończyć match ON i OFF w każdym faktycznie zaimplementowanym trybie; OFF nie liczy/nie rysuje punktu końca, obie wersje zachowują identyczną mechanikę |
| **P0-03** | Lista konwencji nazw i ikon + weryfikacja próbki | Czytelna taksonomia, spójne source ID/displayName, test 16–24 kulek i prawdziwa rozpoznawalność |
| **P1-01** | Upraszczanie statusów i efektów, poprawa responsywności | Zewnętrzny HP nigdy nie znika, nie ma zasłonięcia interakcji, Inspect pozostaje kompletny |
| **P1-02** | Przywracanie HTML quickplay / kompozycja menu | Szybka ścieżka wejścia, dostęp do zaawansowanych trybów, nie wprowadza legacy restore/background state races |
| **P2-01** | Pełny system 224 ikon i zasoby artystyczne | Dopiero po stylu, taksonomii, teście rozpoznania i akceptacji przykładowego zestawu |

**Nie podejmować bez decyzji A70:** zmiana BoardView przez równoległego autora; port HTML physics/timing; automatyczne restore; zmiana catalog IDs/statystyk; import 224 obrazków bez wzorca; usuwanie STOP; ciche przełączenie online fair-play.

## 7. Kryteria odbioru / testy

- **Wymiary:** 1280×900, 1920×1080, 1366×768, 1024×768, 768×1024, 390×844; minimum realny mały landscape. Obie perspektywy P1/P2, osobno prawdziwy LAN klient P2. Nie utożsamiać hot-seat P2 z LAN.
- **Sytuacje:** pusta plansza, 8/22 kulek, skupisko przy wyrzutni, 2 bliskie kulki przy ścianie, duże HP/dwucyfrowe i potencjalnie trzycyfrowe, shield/burn/ice, Replay bonus, BASE DAMAGE po turze, STOP przy ścianie, dynamiczne ruchy i 50. tura.
- **Obowiązek P0:** 0 przypadków, w których bieżące HP nie jest dokładną liczbą poza obwodem; 0 P1/P2 chipów na kulkach w trybie default; 0 utraconych kliknięć/drag z winy renderowanych badge; 0 overlayów na aktywnych hitboxach przy wspomnianych scenach. Jeśli gęstość wymusza kompromis — **QA FAIL/REDESIGN**, nie ciche usunięcie HP.
- **Komunikacja:** in-game owner i tura zawsze zgodne ze stanem; wszystkie stany krytyczne czytelne z HUD lub Inspect; zwykła nazwa nie obiecuje nieistniejących efektów.
- **STOP:** dwa niezmienione mecze (ten sam seed/akcje), z ON i OFF wyłącznie różnica prezentacji / kosztu predykcji; obsługa myszy, dotyku i Replay; rzeczywista wydajność FPS/P95/GC mierzona w Playerze zamiast zgadywana ze źródła.
- **Access:** obok koloru także przynajmniej jeden przetestowany nie-hue sygnał ownera; kontrast/liczby w 24px; opcja „show owner text” przy dostępności; inspektor dostępny bez hover.
- **Brama dowodowa:** każdy test ma source SHA, raw capture frame, rozmiar, pomiar kolizji i wynik PASS/FAIL/HOLD. Screenshot review to NIE realny hit-test.

## 8. Braki do uzupełnienia przez wyspecjalizowane agenty

**A20 (visual audit):** zweryfikować autentyczne screenshoty aktualnego #309, prawa właściciela i interakcji (realne W20 native QA wciąż HOLD), oszacować footprint HP+status i kryteria rozmieszczenia; wybrać na próbce geometrię ownera/HP i rodzinę ikon.

**A11 (HTML archaeology):** dotrzeć do jak największej oryginalnej historii HTML (nie tylko V122/V148/V149) i zrobić porównanie *identycznych scen*; w tabeli BEST-OF nadać EVIDENCE=CODE / SCREENSHOT / DOC / UNVERIFIED, ustalić czy V148 również ma zewnętrzne HP lub zmienił to względem V122. Nie odtwarzać bugów z archiwów.

**A10 (design):** zatwierdzić defaults per faktycznie istniejący tryb, reguły fairness online i cel eksperymentu STOP; ocenić słownik nazw pod kątem prawdziwych zdolności, rozdzielić efekt od lore i rozstrzygnąć hierarchię HP/Replay/status.

**A70:** zestawić raporty A20 + A11 + A10, uzyskać owner review, zmienić DRAFT → APPROVED_SPEC dopiero wtedy, otworzyć małe rozłączne paczki wdrożeniowe i osobne QA; do tego czasu **INTEGRATION_GATE=HOLD**.

## 9. Status
AGENT=A00-SPEC-DRAFT | SOURCE_SHA=7473ceb249086e35942999c093f2c42a91afd415 | EXECUTED=authenticated GitHub Unity BallView/BoardView/Identity/MatchView/StopPrediction source read, V122 CSS+drawBall actual JS, V148/V149 curated documentation and past tests | STATUS=SPEC_DRAFT / HISTORICAL_BEST_OF_PARTIAL | EVIDENCE=links above | BLOCKERS=A20 screenshot audit, A11 complete history, A10 design choice and owner acceptance, A60 real W20 Player QA | NEXT=A70 spec gate after three reports | RELEASE=STOP.
