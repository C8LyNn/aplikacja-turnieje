# Animated Effects — edytor animacji dla StreamElements

Moduł znajduje się w `artifacts/animated-effects`. Można go uruchamiać samodzielnie przez Vite oraz używać w aplikacji turniejowej przez osadzoną trasę narzędzi deweloperskich.

## Harmonogram warstwy (Timeline v1)

Wybierz warstwę, a następnie przejdź do **Oś czasu warstwy** w Inspektorze.

- **Ciągły**: efekt zachowuje dotychczasowe działanie; nie ma dodatkowej animacji widoczności.
- **Jeden cykl**: warstwa czeka wyznaczony czas, pojawia się, pozostaje aktywna i znika.
- **Pętla**: ten sam cykl jest powtarzany razem z opóźnieniem.
- **Start po**: czas oczekiwania przed pojawieniem się warstwy.
- **Czas aktywności**: przedział od początku pojawiania do końca zanikania (nie obejmuje opóźnienia).
- **Pojawianie / Zanikanie**: długości interpolacji opacity; suma jest ograniczona do czasu aktywności.
- **Odtwórz od początku**: restartuje podgląd wszystkich warstw (nie zmienia zapisanego projektu).

Timeline v1 steruje **widocznością całej warstwy**, nie animuje jeszcze osobnych klatek kluczowych położenia, skali, prędkości ani parametrów emitowanych przez efekty. Wewnętrzna animacja efektu nadal biegnie w czasie, także gdy warstwa czeka na pojawienie. Każda zmiana ustawień odtwarza podgląd ponownie; nie ma jeszcze przewijania osi czasu.

## StreamElements

W panelu **Eksportuj** można skopiować kod albo pobrać paczkę ZIP zawierającą:

- `widget.html`, `widget.css`, `widget.js` — trzy zakładki StreamElements Custom Widget,
- `scene.aescene.json` — edytowalna kopia ustawień do ponownego wczytania do Animated Effects,
- `README.txt` — krótką instrukcję ręcznej instalacji.

**ZIP nie jest gotowym importem widgetu StreamElements.** Kod trzech plików należy wkleić do odpowiednich zakładek w edytorze Custom Widget. Efekty startują po zdarzeniu `onWidgetLoad`. Własne triggerowanie alertami/zdarzeniami nie należy do Timeline v1.

## Kompatybilność i trwałość

- Starsze pliki `.aescene.json` bez `timeline` działają jak dotychczas.
- Wczytywanie scen odtwarza niestandardowe kontrolki istniejących efektów, obszary kompozycji i harmonogramy.
- Niezaufane wartości timingów są ograniczane do bezpiecznych przedziałów, a identyfikator warstwy jest oczyszczany przed utworzeniem nazw CSS.
- Zapis historii Undo/Redo dotyczy także ustawień harmonogramu.

## Testy lokalne

Z katalogu głównego workspace:

```bash
pnpm --filter animated-effects typecheck
pnpm --filter animated-effects test
pnpm --filter animated-effects build
pnpm --filter @workspace/tournament-manager build
```

Dodatkowy manual QA:

1. Na dwóch warstwach ustaw różne opóźnienia; sprawdź kolejność wejścia.
2. Sprawdź `once`: po wyjściu warstwa pozostaje niewidoczna.
3. Sprawdź `loop`: opóźnienie jest powtarzane w każdym cyklu.
4. Zapisz scenę, wczytaj ją, użyj Undo/Redo i porównaj harmonogramy.
5. Przełącz na `Ciągły`; sprawdź, czy dawny efekt nie otrzymuje dodatkowej animacji.
6. Wyeksportuj ZIP i sprawdź zachowanie w faktycznym Custom Widget i OBS.

> Status: implementacja i testy zostały dodane do repozytorium; ich wykonanie oraz integracyjny test z StreamElements/OBS wymagają jeszcze weryfikacji.


## Klatki kluczowe ruchu (Timeline v2)

Pod kontrolkami czasu pojawił się edytor **Klatki kluczowe**. Wspiera do 16 klatek na warstwę, każda z pełnym zestawem parametrów: moment (s), pozycja X, pozycja Y, skala, obrót oraz widoczność (%).

- Dodawanie, wybieranie, przesuwanie w czasie, edycja i usuwanie klatek.
- Interpolacja liniowa lub płynna (`ease-in-out`).
- Dwa gotowe układy ruchu: **Przesunięcie →** oraz **Pulsowanie**.
- Parametry są bezpiecznie ograniczane i zapisywane w pliku sceny, razem z trybem `once` lub `loop`.
- Wygenerowane CSS używa **oddzielnego wrappera ruchu** i wrappera widoczności. Nie nadpisuje wewnętrznej animacji kropli, iskier czy innych elementów efektu.
- Procent widoczności w klatce mnoży bazową przezroczystość efektu; nie zmienia zapisanej wartości bazowej Inspektora.

**Ograniczenia v2:** Klatki kluczowe animują właściwości całej warstwy, nie indywidualne cząsteczki ani parametry ich generowania (prędkość, gęstość). Nie ma jeszcze swobodnego przeciągania punktów na osi, scrubbingu ani zewnętrznych triggerów StreamElements. Podgląd i eksport korzystają z tej samej funkcji generującej klatki CSS.

Testy jednostkowe dodane także w `test/motion.test.mjs` — obsługują synchronizację klatek, powtórzenia, ograniczenia wartości, deduplikację i bezpieczeństwo CSS. Nadal należy wykonać polecenia testowe oraz build wymienione powyżej.


## Interaktywna oś czasu (Timeline v3)

Pod podglądem sceny jest pasek **Play/Pause / Od początku / Suwak czasu**.

- **Suwak** zatrzymuje wszystkie animacje podglądu i przenosi je do wybranej chwili; dotyczy także animacji cząsteczek odtwarzanych przez przeglądarkę. Nie zmienia wartości w zapisanej scenie.
- **▶ Odtwórz** uruchamia odtwarzanie od bieżącej chwili; **⏸ Pauza** zatrzymuje podgląd; **↺ Od początku** przewija na zero i rozpoczyna odtwarzanie.
- Starszy przycisk **Pauza** w nagłówku jest podłączony do tego samego sterowania.
- Maksymalny czas podglądu zależy od aktywnych warstw, z co najmniej 10-sekundowym oknem.
- Kliknięcie wybranej klatki kluczowej w Inspektorze automatycznie przewija podgląd do jej momentu, uwzględniając opóźnienie warstwy.
- Klatki można przeciągać po linii czasu co **0,1 s**. Alternatywnie: strzałki w lewo/prawo przesuwają o 0,1 s, a Shift+strzałki o 1 s.
- Zmiana położenia podczas przeciągania jest wizualna, a zapis następuje dopiero po puszczeniu klawisza myszy/palca — daje **jeden krok Undo**. Upuszczenie na istniejącą klatkę nie nadpisuje jej.

**Zakres:** to sterowanie tylko podglądem edytora. Nie zmienia zachowania StreamElements/OBS i nie zapisuje stanu odtwarzania do `.aescene.json`.

### Kontrola jakości

Dodano `test/transport.test.mjs` (czas trwania sceny, geometria suwaka i granice czasu) i workflow `.github/workflows/animated-effects.yml`, który sprawdza typecheck, testy, build edytora oraz osadzenie w aplikacji turniejowej. Należy dodatkowo manualnie sprawdzić wskazywanie momentu w podglądzie dla kilku warstw, wielokrotne pauza/play, ruch klatki myszką i dotykiem oraz klawiaturą.

Przy ręcznym QA uwzględnij również zachowanie na ekranach o różnych proporcjach i wydajność przy scenach z wieloma animowanymi elementami.


## StreamElements — wyzwalacze zdarzeniowe (Events v1)

W Inspektorze warstwy pojawił się panel **Wyzwalacz StreamElements**. Domyślnie każda warstwa działa jak wcześniej (`Od razu / zawsze`). Można jednak uruchamiać ją na:

- nowy follow (`follower-latest`),
- nową subskrypcję (`subscriber-latest`),
- donację/tip (`tip-latest`),
- cheer/bits (`cheer-latest`),
- raid (`raid-latest`),
- wiadomość czatu (`message`).

**Odstęp między uruchomieniami** (cooldown) jest konfigurowalny osobno dla każdej warstwy (0–60 s, domyślnie 3 s). **Minimalna kwota/liczba** filtruje tylko tipy, cheery i raidy. Wartość jest odczytywana z `detail.event.amount` bez interpretowania ani wstrzykiwania treści wiadomości do DOM.

### Zasada uruchomienia

1. Po `onWidgetLoad` widget tworzy jedynie warstwy ciągłe.
2. Kiedy `onEventReceived` przyniesie zdarzenie zgodne z wyzwalaczem, widget generuje wskazaną warstwę i odtwarza ją **jeden raz** (niezależnie od zapisanej pętli).
3. Ponowne zgodne zdarzenie po zakończeniu cooldownu restartuje tę samą warstwę, a nie dokłada następnych kopii do DOM.
4. Po zakończeniu animacji warstwa jest usuwana i zwalnia węzły DOM oraz aktywne animacje.
5. **Testuj w podglądzie** uruchamia lokalną symulację wybranej warstwy. Nie emituje zdarzenia do StreamElements, nie wykonuje operacji na koncie i nie zapisuje go w pliku sceny.

Ustawienia wyzwalacza są zapisywane w `.aescene.json` i po wczytaniu przechodzą walidację. Stare projekty bez `trigger` pozostają niezmienione. Sam eksport nie potrzebuje dodatkowego tokenu API StreamElements i nie dotyka ich kolejek alertów (`SE_API.pauseQueue` / `resumeQueue`).

**Ograniczenia:** brak własnych integracji donation/subscription API poza obsługą zdarzeń Custom Widget; dane eventu nie są jeszcze używane do dynamicznego tekstu; brak selektora konkretnych słów w wiadomości. Faktyczna dostępność rodzaju zdarzenia zależy od źródła streamu/platformy.

### QA

Dodano `test/triggers.test.mjs` i `test/streamEvents.test.mjs`; ten drugi wykonuje wygenerowany JS w symulowanym Custom Widget, weryfikuje `onWidgetLoad`, `onEventReceived`, restart, cooldown, próg donacji i sprzątanie DOM. GitHub Actions wykonuje testy, typecheck i build. Przed wdrożeniem sprawdź ręcznie podgląd StreamElements/OBS i każdy istotny rodzaj eventu.

Dokumentacja zdarzeń: https://docs.streamelements.com/overlays/events


## Dynamiczne podpisy alertów (Captions v1)

Gdy warstwa ma ustawiony **wyzwalacz StreamElements**, w Inspektorze można włączyć **Pokazuj napis na animacji**. Tekst jest pobierany ze zdarzenia w chwili uruchomienia warstwy — nie trzeba modyfikować JS ręcznie.

Obsługiwane zmienne we wzorze:
- `{name}` — nazwa widza; w czacie odczytywana z `event.data.displayName` lub `nick`.
- `{amount}` — kwota donacji, liczba bits lub widzów raidu.
- `{message}` — treść czatu (`event.data.text`), wiadomość do subskrypcji lub donacji.
- `{event}` — techniczna nazwa rodzaju zdarzenia.

Dostępne są gotowe teksty dla follow, subskrypcji, tipa, cheer, raidu i wiadomości. Można zmienić **wzór, położenie (góra/środek/dół), wielkość 14–120 px i kolor**. Opcje są zapisywane w `scene.aescene.json` oraz przenoszone do generowanego widgetu. Starsze sceny i warstwy bez wyzwalacza działają bez podpisów.

Przykłady:
- `Dzięki za follow, {name}!`
- `{name} przekazał {amount}!`
- `{name}: {message}`

**Bezpieczeństwo:** pola wiadomości i nazwy mają limity długości, a wyświetlany napis używa wyłącznie `textContent` — nigdy `innerHTML`. Wysłanie tekstu `<script>...` wyświetli go dosłownie. Nie są interpretowane dowolne zmienne, HTML, URL ani kod. Ustawienia koloru, fontu i położenia przechodzą walidację przed eksportem.

**Testuj w podglądzie** pokazuje przykładowe imię, kwotę i wiadomość. Dane rzeczywiste trafiają do widgetu wyłącznie z `onEventReceived`. Podpis jest usuwany wraz z warstwą po zakończeniu pojedynczej animacji.

Testy:
- `test/alertText.test.mjs` porównuje rezultat podstawiania w edytorze i wygenerowanym JS, w tym warianty wiadomości czatu i limit długości.
- `test/streamEvents.test.mjs` sprawdza rzeczywisty DOM wygenerowanego widgetu, podstawienie i brak wykonania wstrzykniętego HTML.
- `test/scenes.test.mjs` kontroluje pełny round-trip ustawień podpisu.

Wciąż wymagane jest ręczne QA w przeglądarce StreamElements i OBS. Referencja formatu eventów: https://docs.streamelements.com/overlays/events


## Kolejka alertów i awatary (Events v2)

W Inspektorze wyzwalacza można wybrać:

- **Kolejkuj z pozostałymi alertami** — wspólna kolejka FIFO między wszystkimi warstwami ustawionymi w tym trybie. Odtwarzany jest jeden alert na raz, kolejne czekają na zakończenie. Maksymalnie 16 alertów może czekać; następne są odrzucane zamiast blokować overlay i zużywać nieograniczoną pamięć. Zapamiętywane są wyłącznie ograniczone dane tekstowe i adresy potencjalnych awatarów.
- **Restartuj ten efekt** — dotychczasowe zachowanie warstwy; osobne efekty w tym trybie mogą działać równocześnie. Istniejące sceny bez pola `queueMode` domyślnie zachowują tę opcję, a nowe warstwy konfigurowane w edytorze proponują kolejkę.

Cooldown i minimalna kwota obowiązują **przy przyjęciu zdarzenia do kolejki**, a nie dopiero przy jego odtwarzaniu. Reset widgetu opróżnia kolejkę i kasuje jej aktywny timer. Stan kolejki jest ulotny (nie zapisuje się w edytowalnym JSON).

W konfiguracji dynamicznego podpisu jest teraz opcja **Pokaż awatar (lub inicjał widza)** z wielkością 32–144 px. Obsługiwane są wyłącznie obrazy przekazane w evencie przez HTTPS ze ściśle dozwolonych domen CDN Twitch, YouTube i StreamElements. Gdy URL nie występuje lub jest nieakceptowany, pojawi się kolorowe koło z inicjałem nazwy. Nie ma pobierania awatarów przez API ani przechowywania danych widzów po zakończeniu alertu.

**Ważne:** StreamElements nie gwarantuje URL awatara w każdym rodzaju zdarzenia. W praktyce fallback do inicjału będzie często widoczny przy followach i tipach. Pole `avatarEnabled` domyślnie jest wyłączone, co zachowuje układ starych scen.

Testy eksportowanego widgetu obejmują FIFO między dwiema warstwami, obsługę 50 jednocześnie przychodzących wiadomości, sprzątanie DOM, blokowanie HTTP/niedozwolonych hostów, renderowanie inicjału oraz zaufanego obrazu. Dodatkowo sprawdzany jest zapis tych ustawień w `.aescene.json`.

Przed publikacją wymagany test wizualny w OBS: pozycje napisów i awatarów na różnych rozdzielczościach, działanie kolejek przy prawdziwych eventach, oraz weryfikacja zewnętrznych CDN w kontekście Browser Source.


## Priorytety kolejki i wizualna kompozycja alertów (Events v3)

Każda warstwa zdarzeniowa ma teraz ustawienie **Priorytet w kolejce (0–10)**. Domyślne wartości dla nowo konfigurowanych warstw: donacje 9; cheery i raidy 8; subskrypcje 7; follow 5; czat 2. Istniejące sceny bez `priority` dostają neutralne 5, zachowując wcześniejszy porządek FIFO.

Kolejka działa następująco:
- Wyższy priorytet wyprzedza alerty **oczekujące**, nie przerywa aktualnie odtwarzanego.
- Dwa alerty o tym samym priorytecie zachowują kolejność nadejścia.
- Limit 16 oczekujących pozostaje aktywny. Po zapełnieniu ważniejszy nowy alert może zająć miejsce najnowszego alertu o najniższym priorytecie. Jeśli nie ma zdarzenia o niższym priorytecie, nowy jest odrzucany.
- Priorytet nie ma wpływu na działanie trybu `Restartuj efekt`. Reguły cooldown i minimalnej kwoty nadal są oceniane przed przyjęciem do kolejki.

### Kompozycja podpisu

Po wybraniu `Własna pozycja (X/Y)` można:
- wpisać pozycję środka podpisu w procentach obszaru sceny (X: 25–75%, Y: 10–90%),
- kliknąć `Testuj w podglądzie` i **przeciągnąć sam podpis** na scenie; współrzędne zapisują się jako jedna zmiana Undo.

Dostępne są również niezależne animacje **wejścia i wyjścia** dla podpisu: zanikanie/pokazywanie (fade), przesunięcie (slide) i powiększenie/zmniejszenie (pop). Animacje nie zmieniają właściwych klatek kluczowych efektu i są automatycznie dopasowane do długości alertu.

Wszystkie te ustawienia zapisują się w `.aescene.json`; w eksporcie StreamElements podpis i animacja są wyświetlane na podstawie przychodzącego `onEventReceived`. Stary tryb pozycjonowania góra/środek/dół i dawne sceny pozostają obsługiwane.

**QA:** rozszerzono testy wygenerowanego widgetu o kolejność priorytetów, zapełnienie kolejki, zachowanie FIFO, brak przerywania aktywnego alertu, X/Y oraz wejście i wyjście podpisu. Przeciąganie w realnej przeglądarce wymaga osobnego testu manualnego (mysz/dotyk, różne rozdzielczości). PR nie zastępuje domyślnej kolejki AlertBox StreamElements.


## Diagnostyka alertów (Events v4)

W edytorze pod głównym podglądem znajduje się zwijany panel **Diagnostyka alertów — symulator kolejki**. Jest przeznaczony do szybkiego testowania konfiguracji sceny bez konta StreamElements i bez rzeczywistej transmisji. Panel jest lokalny: **nie jest eksportowany jako widoczna warstwa streamu**.

Przebieg testu:
1. Przypisz jednej lub kilku warstwom wyzwalacz StreamElements w Inspektorze (np. follow, tip, chat) oraz ewentualny priorytet.
2. Otwórz diagnostykę, wybierz typ zdarzenia, wpisz testową kwotę/liczbę (dla tip/cheer/raid) i wybierz liczbę 1, 5 lub 20 zdarzeń.
3. Kliknij **Symuluj**. W panelu zostaną pokazane: aktywny alert w trybie kolejki, czekające warstwy (w kolejności priorytetów), liczniki i ostatnie maksymalnie 60 decyzji.
4. Kliknij **Następny alert**, aby ręcznie zakończyć aktualne odtwarzanie symulacji i wyświetlić następny w podglądzie.
5. **Wyczyść** usuwa lokalny stan symulacji. Modyfikacja wyzwalaczy, priorytetów lub aktywności warstw resetuje symulator, aby nie bazował na nieaktualnych danych.

Symulator rozróżnia **cooldown**, **zbyt niski próg donacji**, **zapełnioną kolejkę** oraz **wyparcie mniej istotnego alertu**. Zasady FIFO, priorytety i limit 16 oczekujących odpowiadają generowanemu widgetowi. Nie jest to połączenie na żywo: odtwarzanie kolejnych alertów następuje po kliknięciu, nie według rzeczywistych czasów i zdarzeń platformy.

### Dane diagnostyczne w eksportowanym widgetcie

Eksportowany JS publikuje opcjonalne zdarzenia `animated-effects:diagnostics` przez `window.dispatchEvent(new CustomEvent(...))`. Nie dodaje widocznego overlayu diagnostycznego, połączenia sieciowego ani tokenów.

Przykład nasłuchiwania z konsoli DevTools widgetu:

```javascript
window.addEventListener("animated-effects:diagnostics", (event) => {
  console.log(event.detail.action, event.detail.reason, event.detail.queueLength);
});
```

Każda migawka zawiera rodzaj decyzji (accepted/started/dropped/evicted/completed), uzasadnienie (cooldown, below-threshold, queue-full, lower-priority), rodzaj zdarzenia i ID warstwy, priorytet, długość oraz listę metadanych kolejki, a także liczniki. **Nie zawiera nazwy widza, treści czatu, kwoty donacji ani URL awatara.** Migawki są ulotne. W przypadku braku nasłuchującego `CustomEvent` diagnostyka nie wpływa na działanie animacji.

Automatyczne testy: `test/alertDiagnostics.test.mjs` (lokalny silnik i limit historii) oraz rozszerzone `test/streamEvents.test.mjs` (prawdziwy wygenerowany JS w symulowanym widgetcie, przyczyny odrzucenia, kolejka, brak danych widzów).

Przed mergem wymagane jest ręczne QA układu panelu i rzeczywistych eventów StreamElements/OBS.


## Automatyczny test obciążeniowy transmisji (Events v5)

W istniejącym panelu **Diagnostyka alertów — symulator kolejki** dodano lokalny test uruchamiany w czasie rzeczywistym. Test nie wysyła niczego do StreamElements ani OBS i nie wymaga konta, tokenu ani aktywnej transmisji.

**Scenariusze ruchu:**
- **Zwykła transmisja:** umiarkowany czat, pojedyncze followy i rzadsze donacje.
- **Nagły wzrost ruchu:** częste wiadomości, followy, donacje oraz raid.
- **Intensywny czat:** bardzo szybkie wiadomości uzupełniane followami, donacjami i cheerami.

**Obsługa:** najpierw skonfiguruj co najmniej jedną aktywną warstwę reagującą na któryś typ zdarzeń. W panelu wybierz scenariusz, czas **12 lub 30 sekund** i kliknij **Uruchom test**. Zdarzenia są emitowane do **lokalnego modelu kolejki**, który respektuje cooldown, próg donacji, priorytety, maksymalnie 16 oczekujących i długości odtwarzania warstw. Test w rzeczywistym czasie uruchamia kolejne przykładowe efekty na podglądzie. Można go zatrzymać wcześniej; po zmianie konfiguracji sceny test zostaje przerwany.

**Raport końcowy** obejmuje liczbę zaplanowanych/przetworzonych zdarzeń, maksimum długości kolejki, przyjęcia, odrzucenia, wyparcia, liczbę próbek `requestAnimationFrame`, orientacyjną liczbę FPS wyliczoną z mediany odstępów między wywołaniami oraz ich **95. percentyl i odsetek odstępów powyżej 33 ms**. Wyświetlane są ostrzeżenia o zbliżeniu do limitu kolejki, odrzuceniach i nieregularnym rytmie rAF.

### Co oznacza wynik?

To **diagnostyka lokalna i przybliżona**, a nie profesjonalny benchmark. Odstępy `requestAnimationFrame` zależą od obciążenia całej karty, harmonogramu przeglądarki, wyświetlacza oraz aktywnych rozszerzeń. Nie oznaczają bezpośrednio czasu renderowania GPU i nie przewidują dokładnie płynności w OBS Browser Source. Gdy karta przejdzie w tło, test zostanie przerwany, ponieważ ograniczanie liczby klatek w tle fałszowałoby wyniki.

Lokalna symulacja nie gwarantuje identycznego zachowania wszystkich typów zdarzeń platformy i nie używa prawdziwych wiadomości, nazw użytkowników ani zdjęć. Raport pozostaje w edytorze, a same scenariusze nie są dodawane do eksportowanego overlayu.

Testy automatyczne znajdują się w `test/alertStress.test.mjs`. Sprawdzają deterministyczność profili ruchu, limity harmonogramu, analizę rAF, zakończenie i czyszczenie timerów oraz zatrzymanie po ukryciu karty.

**Nadal wymagane:** test ręczny realnych payloadów StreamElements, zachowania OBS Browser Source oraz grafiki wybranych efektów pod pełnym obciążeniem.
