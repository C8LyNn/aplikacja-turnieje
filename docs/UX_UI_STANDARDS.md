# Tournament Manager — standard UX/UI

Data: 2026-09-23. Wersja: 1.0 — standard proponowany do stosowania w kolejnych zmianach i code review.
Baza: `codex/replit-visual-polish-handoff`, `af26e303c3edda5a2adbf6d16c15a8bedcc7f44f`.

To kontrakt zachowania produktu, nie projekt nowych ekranów ani deklaracja obecnej zgodności aplikacji. Implementacja nie jest częścią tego dokumentu. Ocena aktualnego kodu znajduje się w [UX_UI_GAP_ANALYSIS.md](UX_UI_GAP_ANALYSIS.md).

## Jak stosować standard

- Każde kryterium ma identyfikator. W review wskazujemy identyfikator, ekran, konkretny stan i dowód.
- Oceny: **zgodne**, **częściowo zgodne**, **niezgodne**, **nie dotyczy**. Osobno zapisujemy metodę i ograniczenia dowodu; brak pomiaru nie oznacza zgodności.
- „Zgodne w kodzie” nie potwierdza kontrastu, rozmiaru celu dotykowego, kolejności odczytu screen readera ani reflow w przeglądarce.
- Cel dostępności: WCAG 2.2 AA. Reguły oznaczone jako projektowe są dodatkową decyzją Tournament Managera, nie wymaganiem normy. Nie stosujemy arbitralnego score.
- Nie tworzymy frontendowej kopii zasad turnieju. Dane, uprawnienia, readiness, kwalifikacja, kolejność i legalność operacji pozostają oparte na istniejącym kontrakcie backendu.

## Organizer a Audience

| Wymiar | Organizer / Host | Public / Audience / projector |
|---|---|---|
| Główne pytanie | Co robię teraz i co może mnie blokować? | Kto gra, jaki jest wynik i kto prowadzi? |
| Gęstość | Kompaktowe listy i tabele; działania obok kontekstu | Większy nacisk na zawodników, wynik, LIVE i etap |
| Główne działanie | Jedna bieżąca operacja dla konkretnego celu | Nawigacja między wynikami, meczami, tabelą, drabinką |
| Status | Stan operacyjny, gotowość, blokada, zapis/refetch | Stan rozgrywek; techniczny request nie jest statusem meczu |
| Diagnostyka | Konkretne przyczyny, expected/actual, kod w szczegółach | Krótkie wyjaśnienie niedostępności i retry; bez wewnętrznych ID |
| Dane robocze | Chroniony draft i świadoma obsługa konfliktu | Brak kontrolek zapisu wyniku |
| Aktualizacje | Refetch nie zmienia znaczenia rozpoczętej edycji | Zachowuje wybrany widok, scroll i czytelność wyniku |
| Projector | Nie dotyczy zwykłego prowadzenia | Osobny kontekst odległości oglądania; brak operatorskiej diagnostyki na pierwszym planie |

## A. Hierarchia akcji

| Poziom | Zastosowanie | Warunek review / zakaz |
|---|---|---|
| **ACT-01 Primary** | Najważniejsza czynność w aktualnym kontekście: start, zapis albo recovery | Jedna wizualnie dominująca akcja na formularz/dialog/sekcję workflow. Nie oznacza zakazu osobnej akcji w innym niezależnym kontekście. |
| **ACT-02 Secondary** | Alternatywa, nawigacja pomocnicza, korekta, anulowanie edycji | Styl outline/secondary; nie konkuruje z primary tej samej operacji. |
| **ACT-03 Tertiary** | Rzadkie narzędzia, szczegóły, dodatkowe opcje | Ghost/link/menu; dostępne również z klawiatury, nie wyłącznie po hover. Nie ukrywamy w nim krytycznego recovery. |
| **ACT-04 Destructive** | Usunięcie, reset lub operacja z kosztownymi skutkami | Skutek nazwany tekstem; kolor destructive jest dodatkiem. W dialogu potwierdzenia może być dominującą akcją. Poza nim pozostaje wtórna. |

- **ACT-05:** etykieta opisuje efekt. „Rozpocznij etap” uruchamia flow startu wskazanego etapu; sama nawigacja nazywa się „Przejdź do etapu”.
- **ACT-06:** kilka legalnych działań nie oznacza kilku primary. Bieżący workflow wyznacza primary, pozostałe są wtórne. Przy równorzędnych niezależnych trasach pokazujemy osobny kontekst każdej z nich, bez wymyślania kolejności biznesowej.
- **ACT-07:** pending blokuje powtórzenie tej samej mutacji; widoczna etykieta mówi, co trwa. Sam szary przycisk nie zastępuje przyczyny blokady.

Hierarchia primary/secondary/destructive jest syntezą projektową; wykorzystuje rozróżnienie działań opisane w [GOV.UK Button](https://design-system.service.gov.uk/components/button/), bez przejmowania jego wyglądu.

## B. Next Step / workflow

- **FLOW-01:** przed działaniem widać nazwę turnieju, oglądany etap, aktywny etap (jeśli inny), stan danych i następny krok. „Wybrany” oznacza kontekst przeglądania, nie aktywność sportową.
- **FLOW-02:** Next Step ma: krótki tytuł, jeden główny powód, istotne liczby, konkretną akcję. Diagnostyka znajduje się niżej. Nie powtarzamy pełnej listy problemów w trzech panelach.
- **FLOW-03:** ekran gotowy do startu wymaga potwierdzenia backendu; brak danych/error/refetch nie może tworzyć pozornej gotowości. Po mutacji dopiero potwierdzony odczyt uzasadnia komunikat o nowym stanie.
- **FLOW-04:** Host, Detail i Etapy używają wspólnej interpretacji bieżącego kroku. Wyświetlany target i target akcji są identyczne, niezależnie od zaznaczenia historycznego etapu.
- **FLOW-05:** historyczny/zakończony widok nie sugeruje nieistniejącego kolejnego etapu. Korekta pozostaje akcją wtórną, gdy backend ją dopuszcza.
- **FLOW-06:** reguła prezentacji przejść: planowany → sprawdzenie readiness → start; aktywny → mecze/wyniki → sprawdzenie zakończenia; zakończony → kwalifikacja/przekazanie, jeśli wymagane → readiness następnego. To opis ekranów, nie algorytm wyznaczania legalności.

## C. Wspólny język statusów

| Stan | Tekst dla użytkownika | Forma i ikona | Semantyka koloru / ekspozycja |
|---|---|---|---|
| planned | Planowany | Neutralny badge, kalendarz | Niska; żadnej sugestii gotowości |
| ready | Gotowy do rozpoczęcia / Gotowy do zatwierdzenia | Badge z check | Pozytywny akcent; zawsze dopowiedzieć „do czego” |
| active | Aktywny etap / Turniej trwa | Badge, znacznik aktywności | Wyraźny przy kontekście operacji |
| live | W toku · LIVE | Badge i stały znacznik lub ikona odtwarzania | Silny przy meczu; miganie nie jest wymagane |
| pending — request | Zapisywanie wyniku… / Przekazywanie uczestników… | Tekst statusu i spinner | Informacyjny; obok operacji |
| pending — mecz | Oczekuje | Neutralny badge, zegar | Nie mylić z zapisem sieciowym |
| completed | Zakończony | Badge, check | Spokojny; mistrz i wynik mają pierwszeństwo |
| blocked | Wymaga przygotowania / Zablokowany | Badge + powód, ikona blokady | Prominentny przy niedostępnej akcji |
| warning | Sprawdź… | Panel z trójkątem | Ostrzeżenie nie oznacza nieudanego zapisu |
| error | Nie zapisano… / Nie pobrano… | Alert, wykrzyknik | Prominentny w kontekście nieudanej operacji |
| success | Zapisano… / Etap zakończony | Status, check | Widoczny po potwierdzeniu skutku |

- **STAT-01:** tekst zawsze przenosi znaczenie; ikona i kolor tylko je wzmacniają. Selected, active i focus to trzy niezależne stany.
- **STAT-02:** w UI nie pokazujemy surowych enumów (`qualified`, `winner`, `in_progress`) ani route ID jako głównej nazwy. Nieznany status ma bezpieczną etykietę i szczegóły diagnostyczne dla organizatora.
- **STAT-03:** nie kodujemy success jako „zawsze primary”, ponieważ preset zmienia primary. Korzystamy z istniejących ról palety; brak semantycznego tokena zgłaszamy jako lukę, nie dokładamy lokalnej palety.

## D. Error / warning / info / success

- **MSG-01:** komunikat problemu ma kolejno **summary → context → action → details**. Summary odpowiada „co się stało”; context identyfikuje etap/mecz/uczestnika.
- **MSG-02:** przy znanej przyczynie wykorzystujemy backendowe validation details. Nazwa etapu i expected/actual są widoczne bez otwierania accordionu; nie obliczamy ich ponownie w UI.
- **MSG-03:** kod i pełne komunikaty trafiają do diagnostyki. Dodatkowe szczegóły można zwinąć; powodu blokady, liczb i recovery nie można schować.
- **MSG-04:** błąd odczytu różni się od pustej listy i 404. Sieć/5xx dostaje bezpieczny komunikat i retry. Retry ponawia odczyt, nie starą mutację.
- **MSG-05:** po częściowym powodzeniu rozdzielamy „operacja zapisana” od „nie udało się potwierdzić nowego stanu”. Nie zachęcamy do powtórzenia zapisu w ciemno.
- **MSG-06:** błąd pola stoi obok pola; podsumowanie wielu błędów prowadzi do właściwych pól. Wpisane dane pozostają. To adaptacja wzorca [GOV.UK Error summary](https://design-system.service.gov.uk/components/error-summary/).

## E. Formularze

- **FORM-01:** każde pole ma widoczną, programowo powiązaną etykietę. Placeholder jest przykładem, nigdy jedyną nazwą. W grupie należy podać wspólny kontekst, np. etap i format. Zob. [W3C Labels or Instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html).
- **FORM-02:** hint opisuje ograniczenie przed wpisywaniem. Wymagalność oznaczamy konsekwentnie słowem „wymagane”/„opcjonalne” albo objaśnioną gwiazdką; wymagalność jest też dostępna programowo.
- **FORM-03:** walidacja podstawowa następuje przy submit; po pierwszym błędzie poprawiamy feedback na blur/zmianę. Nie zgłaszamy błędu pustego pola, którego użytkownik jeszcze nie zaczął wypełniać. Backend pozostaje ostateczną walidacją.
- **FORM-04:** błąd jest przypisany do pola; fokus po submit trafia do podsumowania lub pierwszego błędnego pola. Screen reader otrzymuje nazwę, hint i błąd bez zgadywania związku.
- **FORM-05:** disabled ma widoczną przyczynę poza tooltipem. Pending nie kasuje formularza; zachowuje wysokość/położenie przycisku i blokuje double-submit.
- **FORM-06:** sukces następuje po zapisie; wymagany refetch jest osobnym etapem feedbacku. Failed save nie czyści wartości ani zaznaczeń.

## F. Empty states

- **EMPTY-01:** empty state jest dozwolony dopiero po udanym odczycie. Zawiera powód i działanie, jeśli użytkownik może coś zrobić; w Audience wystarcza wyjaśnienie oczekiwania.
- **EMPTY-02:** odróżniamy brak rekordów, brak wyników filtra, brak uprawnień i awarię odczytu. Akcja pasuje do przyczyny: utwórz / usuń filtr / zaloguj / retry.
- **EMPTY-03:** pusta sekcja pomocnicza nie rezerwuje połowy ekranu. Host z 0–2 wynikami może eksponować kolejkę; próg jest decyzją prezentacyjną, nie regułą sportową.

## G. Loading / pending

| Reguła | Stan | Wymaganie |
|---|---|---|
| LOAD-01 | Initial loading | Skeleton/krótki opis bez fałszywych zer i wyników; po błędzie stan kończy się error + retry. |
| LOAD-02 | Background refetch | Zachowaj poprzednie dane, fokus, scroll i draft. Gdy odczyt zawiedzie, oznacz brak potwierdzenia aktualności zamiast wyświetlać pusty ekran. |
| LOAD-03 | Mutation pending | Konkretna nazwa operacji i blokada ponownego submit do ustalenia jej skutku; nie wszystkie operacje nazywają się „Uruchamianie etapu”. |
| LOAD-04 | Aktualizacje LIVE | Bez automatycznego przemieszczania fokusu i bez ogłaszania całego ekranu przy każdym pollingu. Zapewnij sterowanie aktualizacją tam, gdzie wymaga tego kontekst dostępności; wyjątek niezbędnej informacji LIVE trzeba uzasadnić. |

LOAD-04 wymaga osobnej oceny [WCAG 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html); nie oznacza automatycznie wyłączenia pollingu w aplikacji turniejowej.

## H. Tabele i gęstość danych

- **TABLE-01:** nazwa jest elastyczna; wartości liczbowe mają kompaktowe kolumny i cyfry tabelaryczne. Liczby wyrównujemy konsekwentnie do prawej lub środka, nazwy do lewej.
- **TABLE-02:** nazwa tabeli i nagłówki są dostępne programowo. Jeśli sortowanie istnieje, aktywny kierunek jest widoczny i dostępny; nie dodajemy sortowania zmieniającego ranking domenowy pod pozorem UI.
- **TABLE-03:** status może się zawijać; nie jest obcinany razem z nazwą. Jednostka i znaczenie skrótu są dostępne także bez hover.
- **TABLE-04:** ellipsis tylko przy rzeczywistym ograniczeniu. Pełna nazwa musi być możliwa do odczytania klawiaturą i dotykiem (np. szczegóły lub rozwinięcie). Sam `title` na statycznym tekście nie realizuje tej reguły projektu.
- **TABLE-05:** najpierw kompaktujemy padding/metadata, potem dopuszczamy lokalny scroll tabeli. Nie usuwamy statystyk tylko dla dopasowania. Kilka grup dopasowuje liczbę kolumn do kontenera, nie wyłącznie viewportu.

Inspiracja: rozróżnianie danych, nagłówków i narzędzi tabeli w [Carbon Data table](https://carbondesignsystem.com/components/data-table/usage/). Rozmiary i reguły turniejowe są decyzją tego projektu.

## I. Listy meczów

- **MATCH-01:** hierarchia: zawodnicy → wynik → LIVE/status → runda/numer/BO. Niedokończony mecz nie udaje wyniku 0:0, jeśli dane nie oznaczają wyniku.
- **MATCH-02:** played, walkower i brak rozstrzygnięcia pozostają rozpoznawalne tekstowo; BYE nie staje się sztucznym wynikiem.
- **MATCH-03:** operator widzi zaznaczony mecz oraz jasną akcję start/zapis. Rzadkie akcje są w istniejącym menu; nie zmieniamy kolejności listy ani algorytmu „Następny”.
- **MATCH-04:** Public ma zwartą kartę/wiersz bez operatorskich kontrolek; nie rezerwuje wysokiego pustego panelu na oczekujący mecz.
- **MATCH-05:** po ukończeniu wynik dominuje, korekta jest wtórna. W konflikcie jedyną dominującą akcją formularza staje się świadome rozpoczęcie świeżej edycji.

## J. Nawigacja

- **NAV-01:** globalna nawigacja prowadzi między obszarami aplikacji; nawigacja organizatora między Prowadzeniem, Etapami, Koszykami i danymi turnieju; publiczna między widokami konsumpcyjnymi. Nie mieszamy zapisu z nawigacją.
- **NAV-02:** link służy do przejścia, przycisk do zmiany stanu. Klikalna karta ma dostępny link i nazwę; sam `onClick` na kontenerze nie wystarcza.
- **NAV-03:** aktualna strona ma stan programowy (np. aria-current), nie tylko inny kolor. Prawdziwe tabs zachowują semantykę i klawiaturę tabs; nie nadajemy jej zwykłym linkom.
- **NAV-04:** header może się zawijać; jego akcje pozostają w viewport. Lokalny scroll tabs jest dopuszczalny, a aktywna/fokusowana zakładka musi dać się odsłonić bez myszy.
- **NAV-05:** kolejność DOM odpowiada kolejności działania. Wspólny shell zapewnia prosty sposób ominięcia powtarzalnej nawigacji i przejścia do głównej treści.

## K. Modale i potwierdzenia

| Ryzyko | Przykład | Kontrakt |
|---|---|---|
| LOW | Zmiana oglądanego etapu, filtr, zwykły zapis wyniku przed dalszymi operacjami | Bez dodatkowego confirmation; czytelny feedback i istniejąca korekta. |
| MEDIUM | Zamiana stron, walkower, brak rozstrzygnięcia, porzucenie zmienionego draftu | Krótkie potwierdzenie w kontekście, gdy koszt pomyłki to uzasadnia; zachowaj istniejące potwierdzenie. |
| HIGH | Reset DE, usunięcie, approval zamrażający skład, start wiążący dane downstream | Nazwa celu, istotna konsekwencja, granica odwracalności i jedno confirmation. Nie dodawaj drugiego dialogu dla tego samego skutku. |

- **DIALOG-01:** ryzyko zależy od faktycznej semantyki backendu, nie samej nazwy operacji. Routing z istniejącym wystarczającym opisem/ochroną nie wymaga automatycznie nowego modala.
- **DIALOG-02:** dialog ma dostępną nazwę, sensowny początkowy fokus, zamknięty cykl Tab, powrót fokusu oraz bezpieczne anulowanie/Escape. Podczas nieodwracalnego pending nie umożliwia udawania anulowania zapisu. Wzorzec: [WAI APG Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
- **DIALOG-03:** treść ma lokalny scroll i mieści się przy powiększeniu; nagłówek oraz akcje są osiągalne klawiaturą. Modal nie zastępuje zwykłego błędu pola.

## L. Responsive

| Punkt kontrolny | Organizer | Audience |
|---|---|---|
| 1920 px | Ograniczona szerokość robocza, wykorzystanie miejsca przez dane | Wynik i kontekst wyróżnione; mapa może być pozioma |
| 1366 px | Proporcjonalne kolumny; statystyki i CTA nadal czytelne | Kompaktowe karty, header mieści wszystkie działania |
| 1024 px | Dopuszczalna jedna kolumna Host; mapy lokalnie przewijane | Tabele kompaktowe, scroll lokalny dopiero gdy potrzebny |
| 768 px | Zachowana kolejność workflow, zawijanie narzędzi | Bez osobnego redesignu; nazwy, wynik, status nadal pierwszoplanowe |

- **RESP-01:** globalny poziomy scroll strony jest błędem projektu. Nie „naprawiamy” go globalnym ukrywaniem treści. Bracket/tabela/mapa mogą mieć własny scroll bez ściskania kart.
- **RESP-02:** reflow dostępności sprawdzamy dodatkowo przy szerokości 320 CSS px (np. 1280 px przy 400% zoom). Wyjątek dla treści wymagającej układu dwuwymiarowego, np. tabeli, dotyczy komponentu, nie całej strony. Cztery powyższe rozdzielczości nie wystarczają do potwierdzenia AA. Źródło: [W3C Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
- **RESP-03:** test obejmuje długie nazwy, 0/1/wiele rekordów, błąd i pending. Nie akceptujemy układu wyłącznie dla jednej krótkiej nazwy i happy path.

## M. Accessibility — baza AA i reguły projektu

| ID | Kryterium review | Podstawa |
|---|---|---|
| A11Y-01 | Wszystkie działania osiągalne klawiaturą; brak pułapek. Kontrolki mają właściwą rolę, nazwę i stan; wizualny tekst jest częścią dostępnej nazwy. | [W3C Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html), WCAG 2.1.1 / 4.1.2 / 2.5.3 |
| A11Y-02 | Fokus widoczny i nie całkowicie zasłonięty przez sticky/fixed UI. Projektowo: wyraźny obrys; nie usuwamy outline bez równoważnego wskaźnika. | [Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html), 2.4.7 / 2.4.11. Nie mylić z wymogami AAA 2.4.13. |
| A11Y-03 | Tekst co najmniej 4.5:1; duży tekst 3:1 (24 CSS px regular lub około 18.67 px bold). Pomiar uwzględnia rzeczywiste tło, opacity i preset. | [Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), 1.4.3; wyjątki m.in. dekoracje/nieaktywne kontrolki |
| A11Y-04 | Istotne granice kontrolek, stany i grafika muszą mieć wymagany kontrast 3:1 względem przyległego koloru; znaczenie nie opiera się wyłącznie na kolorze. | [Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), 1.4.11 / 1.4.1 |
| A11Y-05 | Cel interakcji minimum 24×24 CSS px albo spełniony wyjątek SC 2.5.8 (m.in. odpowiedni odstęp, inline, równoważna kontrolka). Projektowo preferujemy 44×44 dla głównych akcji i dotyku. | [Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). 44×44 nie jest ogólnym minimum AA. |
| A11Y-06 | Sukces/pending ogłaszane jako status, istotny błąd jako alert lub kontrolowane przeniesienie fokusu. Nie dodajemy alert do każdego ticku pollingu. | [Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html), 4.1.3 |
| A11Y-07 | Nagłówki oddają strukturę; główna treść ma landmark i nazwę strony. Ikony dekoracyjne nie zaśmiecają odczytu; icon-only ma polską nazwę działania. | Projektowa implementacja semantyki 1.3.1 / 2.4.6 / 4.1.2 |
| A11Y-08 | Tekst powiększony 200% i nadpisane odstępy nie powodują utraty treści/funkcji. Sprawdź line-height 1.5, odstęp akapitów 2×, liter .12em i słów .16em. | [Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html), 1.4.12; także 1.4.4 |

Normatywna podstawa: [WCAG 2.2](https://www.w3.org/TR/WCAG22/). Powyższa lista nie zastępuje pełnej oceny A/AA, w tym formularzy, błędów, uwierzytelniania i treści warunkowych. Nie deklarujemy certyfikacji na podstawie testów React.

## N. Hierarchia wizualna

- **VIS-01:** pięć ról tekstu: tytuł strony, tytuł sekcji, tytuł karty, treść główna, metadata. Ta sama rola ma zbliżoną wagę w danym kontekście.
- **VIS-02:** jeden poziom ramki wyznacza region; kolejne ramki tylko jeśli oddzielają samodzielną treść lub kontrolkę. Nie każda linia diagnostyki jest osobnym alertem.
- **VIS-03:** selected pokazuje aktualnie oglądany obiekt; active opisuje rozgrywkę; focus pokazuje pozycję klawiatury. Żaden nie zastępuje drugiego.
- **VIS-04:** stosujemy istniejące tokeny `background`, `foreground`, `card`, `card-border`, `muted`, `primary`, `destructive`, `ring`, `surface-1/2`. Presety zmieniają paletę, font i ramkę, nie strukturę ekranu.

## O. Spacing / density

- **SPACE-01:** projektowa skala bazuje na istniejących odstępach Tailwind: 4, 8, 12, 16, 24, 32 px (odpowiedniki rem). 6/10/14 px są dozwolone lokalnie dla kontrolek, gdy wynikają z wymiaru celu/typografii; nie tworzymy arbitralnych dużych spacerów.
- **SPACE-02:** Organizer: zwykle 8–12 px wewnątrz wiersza, 12–16 px w karcie, 16–24 px między sekcjami. Audience: 12–16 / 16–24 / 24–32 px. To zakresy projektowe, nie wymóg identycznego paddingu wszędzie.
- **SPACE-03:** wysokość wynika z danych. Pusta kolumna, placeholder lub geometryczny mnożnik nie może zwiększać ekranu o kilkaset pikseli bez funkcji.
- **SPACE-04:** w ramkach Cut/Sharp radius nie spada poniżej zera; korzystamy z obecnych clampowanych tokenów. Nie wprowadzamy osobnego layoutu dla ramki.

## P. Typography

| Rola | Organizer — punkt startowy | Audience — punkt startowy |
|---|---|---|
| Tytuł strony | 24–32 px, 600–700 | 24–36 px, poza celowo kompaktowym headerem |
| Sekcja / karta | 18–22 / 16–18 px | 20–24 / 16–20 px |
| Treść / tabela | 14–16 px | 14–18 px |
| Metadata | 12–14 px | 12–14 px |
| Wynik | Cyfry tabelaryczne, rozmiar zależny od karty | Pierwszoplanowy; projector dobierany do dystansu |

- **TYPE-01:** zakresy są regułą projektu, nie minimalnym rozmiarem WCAG. Informacje operacyjne nie są domyślnie tekstem 10–11 px. Odstępstwo wymaga uzasadnienia i sprawdzenia czytelności.
- **TYPE-02:** line-height około 1.2–1.3 dla nagłówków, 1.4–1.6 dla treści; długie nazwy zawijają się albo mają dostępne rozwinięcie. Liczby używają tabular-nums; font mono tylko tam, gdzie pomaga.
- **TYPE-03:** Saira i alternatywny Inter muszą zachować układ. Testujemy domyślny preset oraz Emerald Occult, Cut i Sharp, bez równoległych implementacji ekranów.
- **TYPE-04:** `valvepulp-bold.ttf` nie istnieje w repo. Nie traktujemy fallbacku jako dowodu wyglądu ValvePulp; standard nie wymaga tego fontu. Dostarczenie legalnego assetu jest osobną zależnością, nie zadaniem tego audytu.

## Q. Toast a feedback inline

| Reguła | Kanał | Zastosowanie |
|---|---|---|
| FEED-01 | Toast | Krótkie, niekrytyczne potwierdzenie pomocnicze, np. kopia linku. Nie jest jedyną informacją o konflikcie lub utracie zapisu. |
| FEED-02 | Inline alert | Błąd zapisu, wymagane poprawki, konflikt. Pozostaje przy formularzu do rozwiązania/świadomego odrzucenia. |
| FEED-03 | Inline status | Pending, powodzenie i wynik odczytu. Nie przejmuje fokusu bez powodu. |
| FEED-04 | Modal | Decyzja wymagająca przerwania pracy zgodnie z ryzykiem z sekcji K. Nie służy do każdego komunikatu backendu. |

Rozdzielenie walidacji formularza i globalnego powiadomienia odpowiada wskazówkom [GOV.UK Notification banner](https://design-system.service.gov.uk/components/notification-banner/).

## R. Unsaved data

- **DRAFT-01:** draft należy do konkretnego meczu/konfiguracji i wersji danych. Polling/refetch nie podmienia jego revision, stron ani wartości wpisanych przez operatora.
- **DRAFT-02:** nieudany zapis zachowuje dane oraz lokalny błąd. Wyjątkiem jest jawnie opisane, świadome porzucenie danych przez użytkownika.
- **DRAFT-03:** przed utratą zmienionej, niezapisanej konfiguracji przez nawigację/refresh zapewniamy ostrzeżenie lub bezpieczne odtworzenie. Obejmuje linki, tabs powodujące unmount, Wstecz i zamknięcie karty; mechanizm nie obiecuje odporności na awarię procesu bez persystencji.
- **DRAFT-04:** `409 CONCURRENT_MODIFICATION`: brak sukcesu i auto-retry; aktualny stan oraz stary draft są rozdzielone. Primary brzmi jednoznacznie „Odrzuć stary draft i rozpocznij nową edycję”. Nie mapujemy starego score na nowych graczy.
- **DRAFT-05:** świeża edycja powstaje z aktualnej revision dopiero po decyzji operatora. Po revert obowiązuje wersja po revercie. UX nie omija backendowej ochrony.

## Kontrakty komponentów

| Komponent | Wymagane zachowanie UX | Dowód akceptacji |
|---|---|---|
| Primary button | Etykieta opisuje skutek i cel; jedna dominująca akcja; pending blokuje powtórkę | Dwukrotne kliknięcie = jeden zapis; prawidłowy target |
| Next Step | Nazwa kontekstu, stan, główna przeszkoda/liczby, działanie; szczegóły osobno | Ten sam stan daje spójny krok w Host/Detail/Etapach |
| Error panel | Summary/context/remediation; kod i pełne details niżej; retry tylko właściwej operacji | Znana przyczyna nie ginie w ogólnym tekście; draft pozostaje |
| Readiness panel | Stan pochodzi z backendu; expected/actual widoczne; error nie udaje NOT READY | 0 uczestników i błąd odczytu dają różne widoki |
| Empty state | Powód braku danych i adekwatny następny krok | Osobno pusty sukces, filtr i error |
| Data table | Elastyczna nazwa, kompaktowe liczby, nagłówki, pełne nazwy, lokalny scroll | Długie nazwy i wiele grup bez utraty danych |
| Match row/card | Gracze/wynik przed metadata; status czytelny; wybrany mecz rozpoznawalny | Pending/live/completed/WO/NC bez fałszywego wyniku |
| Stage card | Wybrany i aktywny są niezależne; akcja operuje na jawnym celu | Wybrany etap historyczny nie zmienia celu startu |
| Route connector | Źródło i cel z nazwami etapów, kierunek i osobny obszar każdej trasy; kolor pomocniczy | 0/1/4 trasy i trasa pomijająca etap są jednoznaczne |
| Draft/conflict panel | Stary draft oznaczony jako niezapisany, aktualny stan osobno, świadome recovery | Polling nie „naprawia” revision draftu |
| Confirmation | Cel, konsekwencje, anulowanie i dostępny fokus | Tab/Escape/powrót fokusu; bez interakcji z tłem |
| Navigation | Linki dla przejść; aktywny stan programowy; lokalny scroll dostępny | Cały flow możliwy bez myszy |

## Checklista review i QA

1. Zapisz kontekst Organizer/Audience, cel akcji, źródło statusu i granicę odpowiedzialności backendu.
2. Sprawdź initial load, pusty sukces, read error, background refetch, mutation pending, write error, 409, sukces i powrót po refresh.
3. Potwierdź widoczność liczb, zachowanie draftu i brak fałszywego sukcesu/double-submit.
4. Sprawdź klawiaturę, nazwy pól, fokus dialogu, odczyt statusów i aktywną nawigację.
5. W przeglądarce wykonaj 1920/1366/1024/768, 320 CSS px reflow oraz powiększenie tekstu; long names i wielogrupowy turniej.
6. Zmierz kontrast na faktycznych powierzchniach dla default/Emerald Occult oraz ramek Cut/Sharp; sprawdź Saira/Inter. Sama obecność tokena nie dowodzi zgodności.
7. Regresje zachowania nie powinny zależeć od każdej klasy CSS. Geometrię/overflow potwierdza test układu lub screenshot; JSDOM nie mierzy layoutu.
8. Nie ruszaj algorytmów wyników, routingu ani lifecycle w zadaniu prezentacyjnym. Zauważoną rozbieżność domenową zgłoś oddzielnie.
