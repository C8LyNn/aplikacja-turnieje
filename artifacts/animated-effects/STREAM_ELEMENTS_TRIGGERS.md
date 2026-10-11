# StreamElements — uruchamianie Animated Effects przez zdarzenia

## Konfiguracja

1. Otwórz `/stream/animated-effects/index.html` w aplikacji i przygotuj scenę z efektami.
2. Kliknij **Eksport StreamElements**.
3. W sekcji **Uruchamianie animacji** wybierz zdarzenie, a w trybie komendy wpisz np. `!hype`.
4. Określ **czas wyświetlania** (0,5–60 s) i **przerwę między aktywacjami** (0–300 s).
5. Skopiuj HTML, CSS i JavaScript do odpowiadających zakładek **StreamElements → Overlay → Custom Widget**.
6. Dodaj adres overlay StreamElements do OBS jako Browser Source. W natywnym widżecie nie jest potrzebny iframe, token API ani połączenie z witryną edytora.
7. Przetestuj komendę lub zdarzenie w rzeczywistym podglądzie StreamElements/OBS.

## Obsługiwane wyzwalacze

| Tryb | Listener StreamElements | Zachowanie |
| --- | --- | --- |
| Zawsze aktywna | `onWidgetLoad` | Dotychczasowe, ciągłe działanie |
| Komenda czatu | `message` | Pełny pierwszy token wiadomości odpowiada komendzie (np. `!hype` albo `!hype test`) |
| Nowy obserwujący | `follower-latest` | Nowy follower |
| Subskrypcja | `subscriber-latest` | Zdarzenie subskrypcji |
| Donacja | `tip-latest` | Zdarzenie donacji |
| Cheer / Bits | `cheer-latest` | Zdarzenie cheer |
| Raid | `raid-latest` | Zdarzenie raid |

W trybach zdarzeń po załadowaniu widget jest **przezroczysty i pusty**. Po poprawnym zdarzeniu wszystkie włączone warstwy efektów startują od nowa. Po wybranym czasie są usuwane z DOM; pętle symulacyjne zależne od obecności warstwy zatrzymują się po jej odłączeniu.

**Cooldown** blokuje dodatkowe uruchomienia przez określoną liczbę milisekund. Po jego upływie nowa aktywacja restartuje scenę i jej licznik. W trybie czatu widget pamięta ostatnie 128 niepustych `msgId`, aby duplikat zdarzenia nie uruchamiał animacji drugi raz.

Komendy są normalizowane do małych liter i muszą spełniać wzór `![a-z0-9_]{1,24}`. Niepoprawna komenda przyjmuje bezpieczną wartość `!hype`. **Każdy widz może wywołać komendę**; ta wersja nie weryfikuje uprawnień moderatora/subskrybenta ani nie filtruje stawki donacji. Nie wpisuj do wywołania tokenów ani sekretów.

## Kompatybilność

- Domyślny tryb `always` zachowuje się jak poprzedni eksport.
- Ustawienia triggerów dotyczą **tego eksportu**. Nie stanowią na razie osobnej, zapisanej definicji sceny.
- Eksport tworzy samodzielny widget z HTML, CSS i JS, bez zależności od dostępności aplikacji po wklejeniu kodu.
- Camera + Chat Overlay i Animated Effects są obecnie **dwoma niezależnymi widgetami**; oba mogą odbierać zdarzenia StreamElements, ale jeden widget nie wysyła poleceń bezpośrednio do drugiego.
- Wielokrotna aktywacja ciężkich efektów może obciążać OBS Browser Source. Najpierw sprawdzaj scenę w podglądzie, szczególnie na 1080p/60 FPS.

## Weryfikacja

Testy regresyjne znajdują się w `artifacts/tournament-manager/src/features/streaming/obs-lab/animated-effects-trigger.test.ts`. Są uruchamiane przez istniejący test runner frontendowy:

```bash
pnpm --filter @workspace/tournament-manager test
pnpm --filter @workspace/tournament-manager build
```

Dodatkowo skontroluj w StreamElements prawdziwe `message`, `follower-latest`, `subscriber-latest`, `tip-latest`, `cheer-latest` i `raid-latest`. W szczególności zweryfikuj brak animacji bez zdarzenia, obsługę cooldownu, usuwanie po czasie i przezroczyste tło w OBS.

Zdarzenia bazują na [oficjalnej dokumentacji StreamElements](https://docs.streamelements.com/overlays/events).
