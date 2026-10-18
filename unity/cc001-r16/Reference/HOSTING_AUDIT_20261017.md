# Core Clash Unity WebGL — audyt istniejącego hostingu

Data: 17.10.2026, Europe/Warsaw. Audyt tylko do odczytu. Nie zmieniano plików żadnej gry ani strony, nie tworzono gałęzi/PR i nie wykonywano synchronizacji, buildu ani wdrożenia. Dowody zapisano wyłącznie w osobnym katalogu audytu na Pulpicie.

## Wynik

**Opublikowany WebGL uruchamia się do ekranu wyboru decków, zarówno bezpośrednio, jak i wewnątrz strony. Hosting poprawnie dostarcza wymagane obecnie pliki. Publiczny build jest jednak starszy od R7, a integracja strony nie przekazuje parametrów zaproszeń. Internetowy crossplay na tej publikacji pozostaje niepotwierdzony.**

Adres strony: https://c8lynn.replit.app/minigames/core-clash-unity

Bezpośredni działający start Unity: https://c8lynn.replit.app/prototypes/minigames/core-clash-unity/index.html

## Potwierdzone działanie

1. Replit identyfikuje aplikację **Tournament Replicate**, ID `87be406c-bc97-44fd-ac84-dfcc89b4fc8a`. Stan publikacji przed i po audycie: `success`, ten sam deployment `0ffcaf56-f80e-4568-b362-4e461242e093`. Publiczny URL zwrócony przez konektor: https://C8LyNn.replit.app.
2. Oba podane wejścia zwracają HTTP 200. W anonimowej przeglądarce rzeczywisty WebGL wypisuje `CORE_CLASH_READY V149 catalog=227 canonicalDecks=36 featured=4` i renderuje ekran wyboru decków. Zrzuty: `site-desktop.png`, `direct-desktop.png`.
3. Obserwowane pliki loader/framework JS, danych i WASM zwracają 200. MIME są prawidłowe: JS `text/javascript`, dane `application/octet-stream`, WASM `application/wasm`. Nie zaobserwowano nieudanych żądań ani wyjątków strony podczas tych startów. Nie wykryto błędu kompresji.
4. Strona osadza grę w iframe na tej samej domenie. Iframe ma dostęp do fullscreen, autoplay, pointer-lock i gamepad; nie ma atrybutu sandbox. Rzeczywisty start potwierdza, że samo osadzenie nie blokuje załadowania obecnego builda. Nie zaobserwowano blokady CSP w tym przebiegu; nie jest to test połączenia Relay.

## Ustalenia wymagające uwagi przed późniejszą publikacją

### 1. Na stronie jest starsza paczka, a nie lokalna R7

Wszystkie pięć porównanych plików — index, loader, framework, data i wasm — różni się SHA256 od lokalnego R7. Aktualny publiczny `WebGL.data` ma 5 915 937 bajtów, a WASM 21 294 320 bajtów. Publiczny index używa standardowego szablonu Unity, bez paska profili i mostka viewportu R6/R7.

Hash Git blob publicznego pliku danych to `aa9e1a09fdfa3f0c6252ab4644ad969d2a6e51b9`. Zgadza się dokładnie z plikiem na gałęzi `feat/cc001-v149-unity-webgl-showcase-20261015`, commit `d98b3805ef217b45cc882cebfd08972c5fd37fc3`. Potwierdza to zgodność tego jednego artefaktu z gałęzią, nie całego uruchomionego środowiska Replit.

Panel multiplayer obecnego builda opisuje jedną sieć lokalną i nie pokazuje przełącznika INTERNET znanego z R7. Otwarto wyłącznie panel, bez CREATE/JOIN: `direct-multiplayer-panel.png`. Nie ma podstaw do przeniesienia wyników testów Relay lokalnego R7 na tę starszą publikację.

### 2. Strona gubi parametry zaproszenia

Otworzono adres strony z celowo nieprawidłowym znacznikiem `?joinCode=READONLY_AUDIT`, aby nie inicjować prawdziwej sesji. Zarówno iframe, jak i link „Otwórz Unity WebGL” pozostały bez tego parametru.

Odczyt kodu integracji na przypiętym commicie potwierdza stały adres iframe/linku bez propagowania query. Ta sama konstrukcja nie przekazuje również `joinHost` i `joinPort`. Bezpośredni link do index.html omija tę warstwę strony; po późniejszym zatwierdzeniu R7 jego działanie multiplayer trzeba osobno przetestować.

### 3. Adres katalogu i brakujące zasoby trafiają do aplikacji SPA

Adres zakończony samym `/prototypes/minigames/core-clash-unity/` zwraca HTTP 200 z HTML aplikacji Tournament Manager, a nie bootstrap Unity. Obecnie należy zachować pełny bezpośredni adres z `index.html`.

Nieistniejący plik `Build/__cc_audit_missing__.wasm` również zwraca HTTP 200 / `text/html` aplikacji SPA. Tak samo zachowuje się wymagany przez nowszą paczkę adres `StreamingAssets/UnityServicesProjectConfiguration.json`: odpowiedź nie jest JSON-em. Ten zasób nie był żądany przez obecny starszy build podczas obserwowanego startu; nie przedstawiamy go jako przyczyny awarii tego startu.

Przy przyszłej aktualizacji trzeba zachować komplet nowych plików, sprawdzić dokładny adres wejścia i nie maskować braków statycznych HTML-em. Ewentualna korekta powinna być ograniczona do przestrzeni plików tej gry, z zachowaniem routingu pozostałych funkcji strony. Żadnej korekty teraz nie wykonano.

Uwaga do narzędzi R7: lokalny weryfikator hostingu normalizuje podane index.html do adresu katalogu. Przy obecnej konfiguracji dałoby to wynik dotyczący niedziałającego katalogu, chociaż bezpośredni index działa. W tym audycie sprawdzano więc oba adresy osobno. Narzędzie i gra pozostają niezmienione.

### 4. Publiczna wersja nie pokazuje aktualnego dostosowania do telefonu

W emulacji telefonu 390×844, DPR 3, iframe ma 390×761 CSS px, a canvas renderuje 1170×2283. Brakuje mostka viewportu R6/R7. Zrzut `site-phone.png` pokazuje układ desktopowy pomniejszony do szerokości telefonu. Nie występuje poziome przewijanie dokumentu, lecz małe kontrolki i typografia nie potwierdzają docelowego telefonu/tabletu.

To wynik emulacji przeglądarki, nie test fizycznego urządzenia. R7 ma inne pliki i warstwę prezentacji; ich zachowanie na tej publikacji nie zostało sprawdzone, ponieważ R7 nie wdrażano.

### 5. GitHub main nie jest źródłem tej integracji

Przypięty `main` to `c50cc48e6fa508592bda3f4838111e9cff5af80c`, commit z 19.08.2026. Jego kompletne drzewo nie zawiera trasy ani plików Core Clash Unity. Integracja występuje na gałęzi showcase wskazanej wyżej. Nie należy zakładać, że synchronizacja dowolnego main odtworzy aktualną publikację.

Odczyt konfiguracji gałęzi pokazuje Vite/public i katalog wynikowy frontendu; pliki builda Unity znajdują się w jej publicznych zasobach. Faktyczny stan roboczy Replit nie został potwierdzony: zapytanie wyłącznie o odczyt do agenta Replit zakończyło się timeoutem. Nie ponawiano go jako polecenia zmiany. Stan publikacji pozostał ten sam.

## NOT TESTED

- Pełny mecz w publicznym buildzie, wynik meczu i wszystkie umiejętności.
- Utworzenie/dołączenie do sesji, Relay internetowy, publiczny Windows↔WebGL crossplay, LAN z tej strony HTTPS i połączenia między różnymi sieciami.
- Fizyczny telefon/tablet, Android natywny, iPhone/iPad/Safari i obsługa utraty sieci.
- Pełna zgodność wszystkich funkcji aplikacji turniejowej; audyt był ograniczony do istniejącej integracji gry.
- Zgodność aktywnego workspace Replit z konkretną gałęzią/commitem — poza potwierdzonym hashem publicznego pliku danych.

## Następny etap po osobnej zgodzie

Wybrać właściwą gałąź integracji strony, przygotować osobny PR obejmujący uzgodniony zakres plików/integracji, porównać artefakty i zachować inne funkcje. Dopiero po weryfikacji oraz zgodzie na wdrożenie synchronizować właściwe źródła do Replit i publikować. Sam merge GitHub nie stanowi publikacji. Aktualny audyt nie udziela ani nie zakłada takiej zgody.

## Dowody

- `browser-initial.json` — rzeczywiste starty iframe i strony bezpośredniej, statusy plików i log READY.
- `http-build-audit.json` — MIME, rozmiary, SHA256 i różnice względem R7; odpowiedź HTML zamiast JSON.
- `integration-query-mobile.json` — brak propagowania query, wymiary telefonu i canvas.
- `source-artifact-comparison.json` — zgodność Git blob publicznego pliku danych z gałęzią showcase.
- `multiplayer-panel.json` i zrzuty PNG — obserwacje interfejsu bez inicjowania sesji.
- `routing-probes.json` — odpowiedzi katalogu i celowo brakującego zasobu; `audit-protection.json` — zgodność wszystkich 370 źródeł/artefaktów z manifestem R7, czyste drzewo Git i niezmieniony identyfikator publikacji.
- GitHub, odczyt przypiętych commitów: [main](https://github.com/C8LyNn/aplikacja-turnieje/tree/c50cc48e6fa508592bda3f4838111e9cff5af80c), [gałąź integracji showcase](https://github.com/C8LyNn/aplikacja-turnieje/tree/d98b3805ef217b45cc882cebfd08972c5fd37fc3). Repozytorium jest prywatne, odczytane przez połączone konto.

Projekt CoreClash-V149-Unity: HEAD `330d6a8`, czyste drzewo robocze po audycie. Lokalne paczki R6/R7 i źródłowe gry pozostają bez zmian.
