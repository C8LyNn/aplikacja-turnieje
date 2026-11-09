# GitHub refresh — 2026-10-13, bez publikacji

## Punkt wyjścia i źródła

- Repozytorium: `C8LyNn/aplikacja-turnieje`.
- Lokalna integracja: `integration/pr32-20261013`.
- HEAD przed tym importem: `0bceebb010ec4874b48deddc40c49d5f79c4d6d4`.
- Nowa kopia punktu wyjścia: `backup/pre-gh-refresh-20261013`, na tym samym SHA.
- GitHub `main`: `c50cc48e6fa508592bda3f4838111e9cff5af80c`.
- GitHub `release/tournament-ops-20261013-01`:
  `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.
- PR #32 pozostaje otwarty, bez recenzji i bez nowych commitów.
  Jego treść była już zaimportowana; nie importowano jej ponownie.
- GitHub `codex/replit-visual-polish-handoff`:
  `2f10c39f7fa5d480e772ec2bb34b56af18d57f04`.
- GitHub `codex/game-catalog-editor-reliability`:
  `28da3ef94f3b30f90c1b3b70a88ab7f61462d99c`.

Odczytano historie, PR i drzewa przez połączone GitHub API. Nie wykonywano
push ani force push. Ten przyrost jest selektywnym importem zawartości,
nie importem oryginalnej historii upstream przez `git fetch`.

## Rzeczywiście dołączone zmiany

Porównanie blobów wykazało brak funkcji czatu ze scalonych PR #9/#12,
mimo wcześniejszego importu osobnego edytora Animated Effects.

Dołączono sześć plików PR #12: komponent wiadomości, panel OBS Lab,
konfigurację, samodzielny widget StreamElements, testy i dokumentację.
Funkcje obejmują siedem stylów wejścia, deterministyczny tryb losowy,
czas 100–1200 ms, test jednej/czterech wiadomości, zapis konfiguracji
w URL, ograniczenie ruchu oraz deduplikację i moderację bez ponownego
tworzenia istniejących wiadomości.

Dołączono też dwa brakujące workflow CI z zatwierdzonej gałęzi polish.
Nie uruchamiają migracji ani wdrożenia; ich filtry gałęzi zachowano
zgodnie z upstream. Działania Windows/Chromium w GitHub Actions nie były
uruchamiane w tej lokalnej weryfikacji.

Wszystkie osiem plików importu zweryfikowano wobec blob SHA upstream.
Dwa pliki TypeScript mają początkowy UTF-8 BOM; zachowano go, aby
końcowe hashe były zgodne. Nie nadpisano lokalnych zmian w innych
plikach, w tym eksportera Animated Effects.

## Katalog gier — niezaimportowany zakres i powód zatrzymania

Scalone PR #19–#21, #24–#26, #30–#31 trafiły do gałęzi pośredniej
katalogu, a nie do `main` lub wydania PR #32. Porównanie historii
`ahead/behind` nie jest dowodem, że cała jej zawartość jest brakująca.
Porównano ścieżki i blob SHA z lokalnym HEAD.

Gałąź zawiera brakujące moduły paginacji, kontroli dostępu, rozbudowy
katalogu, import jobs, retry/throttle, UI administracyjne, audyt staging,
testy i dziewięć migracji katalogu 0030–0038. Import wymaga przeglądu
nakładających się zmian API, UI, schematu i kolejności migracji:

- katalogowe 0030/0031 mają inne nazwy i przeznaczenie niż lokalne
  0030/0031 korekt wyników; nie można traktować numeru jako unikalnego
  identyfikatora ani wdrażać pakietu bez jawnej kolejności;
- lokalny bezpieczny import Steam pozostaje **insert-only**;
- nie wolno cofać lokalnych poprawek korekt wyników, landing/SF/Portfolio
  ani konfiguracji produkcyjnej przez nadpisanie całym drzewem gałęzi.

Pełny pakiet katalogu pozostał poza tym pierwszym przyrostem. Następnie
użytkownik zatwierdził jego lokalną integrację bez zmian produkcji;
kontynuację opisuje `docs/catalog-integration-20261013.md`.
Otwarte, niescalone PR nie zostały dołączone.

## Weryfikacja tego przyrostu

- Pełny workspace typecheck: PASS.
- Frontend: 534 testy, PASS.
- Backend i powiązane testy jednostkowe UI: 833 + 25 + 32 = 890, PASS.
- Animated Effects: 59 testów, PASS.
- Build frontendu i osadzonego Animated Effects: PASS.
- Publiczny Browser Source z losowym stylem i czasem 380 ms: renderuje się
  w podglądzie bez błędów konsoli; frontend po restarcie działa.
- Pozostają wcześniejsze ostrzeżenia builda o rozmiarze bundli,
  mapach źródeł i czcionce.
- Backend, schemat, SQL 0030/0031 i import Steam nie zostały zmienione.
  Wcześniejszy test 532 integracji PostgreSQL opisuje poprzedni przyrost;
  nie był uruchamiany ponownie w tej operacji frontendowej.
- Pełny test przeglądarkowy korekty wyniku zalogowanego organizatora
  nadal nie jest wykonany.

## Blokady wydania

Nie wykonano backupu produkcyjnego, migracji produkcyjnych, zmian danych
produkcyjnych, push do GitHub ani publikacji. Zasady i przegląd SQL
0030 → 0031 z `docs/pr32-release-readiness.md` pozostają aktualne.

Wydanie pozostaje zablokowane do potwierdzenia prywatnego backupu
z testem odtworzenia, migracji docelowego schematu, testu organizatora
i dokładnego SHA dopuszczonego do wdrożenia. Zakończenie importu kodu
nie stanowi zgody na żaden z tych kroków.
