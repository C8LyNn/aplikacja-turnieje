# CC-001 / W16 — CLAUDE CODE: OCENA CORE CLASH PRZED PROGRAMOWANIEM

**Data:** 2026-11-02. **Źródło dyspozycji:** właściciel Core Clash chce najpierw zobaczyć **niezależną, rzetelną ocenę gry przez Claude**, zanim zleci mu implementację.

**Nadrzędne zadanie:** [GitHub #280 — REVIEW FIRST](https://github.com/C8LyNn/aplikacja-turnieje/issues/280). **HQ:** [#97](https://github.com/C8LyNn/aplikacja-turnieje/issues/97). **Instrukcja Claude:** [CLAUDE.md](../../../../CLAUDE.md).

**Status:** PHASE 1 NOT EXECUTED. Przygotowanie dokumentu **nie oznacza**, że Claude zagrał, przeprowadził audyt lub uruchomił testy.

## A. Gra i kontekst

**Core Clash** to fizyczna turowa gra arenowa: gracze konstruują/wybierają talie 9 specjalnych kulek plus zwykłą kulkę Standard, wystrzeliwują kulki, wykorzystują kolizje/umiejętności, statusy i Replay, rywalizują o bazy. Istnieją lokalny i sieciowy tryb gry (PC1 host, PC2 klient); port do Unity nie jest równoważny ukończonej pełnej grze.

**Repo:** `C8LyNn/aplikacja-turnieje`, UWAGA: repo zawiera też aplikację turniejową, **całkowicie poza zadaniem Claude**.
**Właściwy projekt:** `unity/cc001-r16/CoreClash-V149-Unity/`. **Unity:** 6000.4.0f1, URP.
**Źródła kodu:** `Assets/CoreClash/` (Core / Physics / Networking / Presentation), `Tests/`; dane katalogu `Assets/Resources/Data/`, skrypty pomocnicze `scripts/cc001/`.

**Koniecznie sprawdź:**
- `README.md`, `HANDOFF_R16_README.md`, `MIGRATION_STATUS.md`, `FEATURED_DECK_PORT_STATUS.md`, `NETWORKING_STATUS.md`;
- `docs/R16_REPORT_PL.md`, `docs/R16_QA_PL.md`, rejestry `Evidence/R16/`, katalog i faktyczne implementacje zdolności;
- aktualne issue/PR A10 (game design), A20/A21 (UX/tutorial), A30/A31/A41 (network), A34 (render), A40/A50 (gameplay), A60 (QA), A70 (integracja), A72 (build);
- źródła i diffs w nowych rozwojowych [PR #207](https://github.com/C8LyNn/aplikacja-turnieje/pull/207) i [PR #266](https://github.com/C8LyNn/aplikacja-turnieje/pull/266), **bez utożsamiania ich z QA freeze**.

## B. Jakie wersje oceniasz?

| Stan | Źródło | Wnioski |
|---|---|---|
| R16 / podstawowa migracja | dokumenty R16 + kod | Historyczne wyniki; nie udowadniają W11 |
| Oficjalny zamrożony QA W11 | `integration/cc001-r17-w11-qa-freeze-20261030` SHA **`3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`** | Pinned source, nie wolno modyfikować |
| Rozwój po-freeze | osobne Draft PR #207, #266 i W12–W15 | Nowsze opcjonalne zmiany; mogą nie być zintegrowane, nie można im przypisać G3 na podstawie starego builda |

Każda obserwacja i wskazany bug ma podawać wersję/commit, aby odróżnić defekt obecnego źródła od już naprawionego problemu starszej wersji.

**Odnotowane wcześniej problemy dwóch PC:** ruch kulek P2 skacze/teleportuje, komunikaty tur nie są lokalne, P2 celowanie i perspektywa, zbędny pasek siły. **Nie przyjmuj automatycznie, że wszystkie problemy nadal są obecne albo zostały naprawione.** Potwierdź w kodzie, a obserwacje wymagające runtime oznacz `NOT_YET_OBSERVED`.

## C. Oceniaj grę w 7 wymiarach

1. **Gameplay i pomysł:** czy gra oferuje rozpoznawalną, ciekawą pętlę; znaczenie strategii vs przypadek, emocje związane z kolizjami i ustawieniem kulek; czy decyzje są czytelne.
2. **Mechaniki, talie i balans:** rzeczywiste możliwości kul specjalnych; 9-slotowa talia, Standard i Replay; statusy, kontrola planszy, kontrgry, snowball, tempo do końca meczu; uczciwie oddziel implementowane efekty od `UNITY_READY/PARTIAL/DATA_ONLY/NOT_PORTED`.
3. **Sterowanie, fizyka i game feel:** czy trajektoria/siła/odbicia są przewidywalne, feedback czytelny, kamera adekwatna; przy fizycznym uruchomieniu oceń też pacing, opóźnienia, animacje.
4. **UX / onboarding / accessibility:** pierwszy mecz, opis umiejętności, tryb buildowania talii, tura, kolory/oznaczenia obu graczy, wykrywanie legalnych działań, czytelność na desktopie i telefonie, prowadzenie w tutorialu.
5. **Multiplayer:** własność tury P1/P2, autorytet hosta, przyjmowanie komend, repikacja/stale snapshots, render smoothing, realny teleport vs skok animacji, reconnect; rozdziel kod i wynik QA.
6. **Jakość techniczna:** architektura, granice systemów, obszary ryzyka, rozsądne zarządzanie stanem, testy, utrzymanie, prawdziwy build Windows i bezpieczeństwo integracji; zaznacz braki dowodów.
7. **Potencjał projektu / MVP:** odbiorca docelowy, wyróżniki, co musi działać w grywalnym demo, co warto odłożyć; jak zwiększyć jakość dla gracza najmniejszym realnym nakładem.

Zbierz **3–5 mocnych stron** i **5–10 najważniejszych problemów**. Każdy problem powinien zawierać **wpływ na gracza** (nie tylko programistę), dowód, ocenę pilności P0/P1/P2, trudność S/M/L, krótką propozycję naprawy lub testu, warunki akceptacji i znane zależności.

## D. Rzeczywisty playtest, jeśli wykonalny

Możesz obejrzeć działający Player / Unity Editor, **jeśli bezpiecznie jest dostępny bez modyfikowania chronionych źródeł, automatycznego instalowania zależności czy nieautoryzowanego nadpisania builda**. Minimum:
1. Rozpoczęcie lokalnego meczu i wybranie talii P1/P2.
2. Zwykła kulka Standard, wycelowanie, strzał, kontakt z inną kulką/ścianą i tura.
3. Replay + kilka specjalnych umiejętności o różnych skutkach.
4. Inspekcja kulek, komunikaty statusów, feedback HP i warunków zwycięstwa.
5. Ocenę multiplayera PC1–PC2 wykonuj **osobno** tylko na autentycznym binarnym zestawie o jawnej wersji/SHA; brak takiego Playera to `NOT_RUN`, nie `PASS`.

**Nie ma obowiązku przygotowania nowego Windows builda w tej fazie.** Jeśli runtime niedostępny, zakończ pełną ocenę source + dokumentacji, wyraźnie oznacz jej ograniczenia i podaj krótki plan właściwego przyszłego playtestu.

## E. Jak dokumentować dowody

Używaj etykiet:
- `OBSERVED_RUNTIME` — własne rzeczywiste działanie na uruchomionej grze, z dokładną wersją.
- `VERIFIED_SOURCE` — konkretny kod/funkcja/file SHA, ale nie uruchomienie.
- `HISTORICAL_REPORT` — wcześniejszy raport innego agenta, nie własne potwierdzenie.
- `HYPOTHESIS` — prawdopodobny problem, wymagający eksperymentu.
- `NOT_RUN / NOT_VERIFIED` — brak dowodu.

Raportuj konkretny path/funkcję/warunek, nie ogólnikowe „podobno”. Wyróżnij ryzyka wynikające z braku native QA, ale **nie zastępuj recenzji gry recenzją procesu GitHub**.

## F. Co oddajesz?

**Raport po polsku** opublikowany jako komentarz do [Issue #280](https://github.com/C8LyNn/aplikacja-turnieje/issues/280), z krótkim podsumowaniem i linkiem do HQ #97. W raporcie:

- **1. Executive summary:** na ile gra jest interesująca, grywalna i gotowa do testów; uzasadnij z poziomem pewności.
- **2. Mocne strony:** 3–5 rzeczy do zachowania.
- **3. Słabe strony:** realne lub prawdopodobne, z dowodem i wpływem na gracza.
- **4. Mechaniki i balans:** co działa, co tylko istnieje jako dane, co wymaga decyzji projektowej.
- **5. UX / sterowanie / tutorial.**
- **6. Multiplayer i techniczna gotowość.**
- **7. Tablica priorytetów:** `P0/P1/P2 | problem | dowód | efekt dla gracza | rozwiązanie | S/M/L | AC`.
- **8. 3 pierwsze zadania programistyczne dla Claude:** proponowane, NIE uruchamiane automatycznie.
- **9. Pytania do właściciela:** tylko kwestie game designu, w których decyzja rzeczywiście zmienia kierunek.
- **10. Zakres wykonanej oceny:** dokładne SHAs, lista odczytanych kluczowych źródeł, co zaobserwowano w grze vs czego nie uruchomiono.

Po przekazaniu raportu **STOP** i oczekuj na decyzję właściciela, co implementować. Nie zmieniaj gry w tej fazie.

## G. Ograniczenia, które nadal obowiązują

- **Mitosis:** dokładna semantyka V148, bez nieautoryzowanego dzielenia od ścian/przeszkód.
- **Furnace:** jedna strefa ognia i okresowe FIRE DoT, **bez nowego bezpośredniego pakietu obrażeń**.
- **HP:** wartości katalogu R16 bez zmian.
- Źródła V148, R16, RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0`, Protocol149, frozen QA, `main` i release są chronione.
- Nie dotykaj innego projektu w repozytorium. Repo jest publiczne: nie publikuj prywatnych logów, IP, kont, tokenów ani surowych EXE/DLL.
- Role roju: A70 integruje, A72 buduje, A60/A31 niezależnie testują. Claude może zostać wykonawcą programistycznym w FAZIE 2, po akceptacji priorytetów. Nie używaj `git reset --hard`, force-push ani merge bez wyraźnej zgody.

## H. FAZA 2 — poprzedni plan odłożony, nie anulowany

Po otrzymaniu oceny właściciel może zaakceptować zadania. Jednym z istotnych otwartych problemów nadal jest natywny Windows QA z kanonicznego zestawu A72 [#188](https://github.com/C8LyNn/aplikacja-turnieje/pull/188), źródło frozen `3f972...`, na Windows 11 z Unity **6000.4.0f1**, Windows Build Support/licencją, Node22 i .NET9. Historyczny launcher to `scripts/cc001/w10/a72/URUCHOM_W11_PR207.cmd` (mimo nazwy buduje frozen, nie moving PR #207). Testy A60/A31 na dwóch prawdziwych komputerach pozostają oddzielną bramką. Nie wykonuj tego automatycznie w FAZIE 1.

**Stan startowy:** `W16_REVIEW_NOT_YET_RUN`; `NATIVE_W11_BUILD_NOT_ATTESTED`; `PHYSICAL_PC1_PC2_QA_HOLD`. Dokument nie jest certyfikatem funkcjonalności gry.
