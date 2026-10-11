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
