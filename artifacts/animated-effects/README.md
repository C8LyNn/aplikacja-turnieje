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
