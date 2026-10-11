# Lokalny podgląd Animated Effects / StreamElements na Windows

Ten dokument umożliwia przetestowanie **już zintegrowanej** paczki z PR #9 i #11
bez publikacji na Replit oraz bez uruchamiania API, PostgreSQL czy jakiejkolwiek
bazy danych.

## Krok 1 — bezpiecznie pobierz aktualny kod

Otwórz **PowerShell** w istniejącym lokalnym repozytorium (katalogu z `.git`).
Zanim cokolwiek przełączysz, sprawdź bieżące zmiany:

```powershell
git status --short
git remote -v
```

Sprawdź, czy `origin` wskazuje na `C8LyNn/aplikacja-turnieje`.
Jeżeli tak, pobierz zintegrowaną gałąź i umieść ją w osobnym katalogu:

```powershell
git fetch origin codex/replit-visual-polish-handoff
git worktree add -b local/animated-effects-preview ..\aplikacja-turnieje-preview origin/codex/replit-visual-polish-handoff
cd ..\aplikacja-turnieje-preview
```

**Git Worktree nie zmienia aktywnej gałęzi, plików ani niescommitowanych
modyfikacji** w dotychczasowym folderze. Użyj innej nazwy katalogu/gałęzi,
jeżeli te nazwy już istnieją. Nie korzystaj z `git reset --hard`, `git clean -fd`
ani `git merge` w swoim repo tylko po to, żeby uruchomić podgląd.

Gdy `origin` wskazuje na inne repozytorium lub nie używasz Worktree,
możesz sklonować aktualną paczkę oddzielnie (dostęp do prywatnego repozytorium
wymaga uwierzytelnienia GitHub):

```powershell
cd C:\Users\kubap\Documents\GitHub
git clone --branch codex/replit-visual-polish-handoff --single-branch https://github.com/C8LyNn/aplikacja-turnieje.git aplikacja-turnieje-preview
cd .\aplikacja-turnieje-preview
```

## Krok 2 — uruchom lokalny podgląd zintegrowanej aplikacji

Wymagania: **Node.js 22+**, **pnpm 10**, PowerShell 5.1+.
Jeśli pnpm nie jest aktywny:

```powershell
corepack enable
corepack prepare pnpm@10 --activate
```

W katalogu `aplikacja-turnieje-preview` uruchom:

**Najprościej:** w Eksploratorze Windows dwukrotnie kliknij
`START_ANIMATED_EFFECTS_PREVIEW.cmd` w głównym katalogu pobranej kopii.
Plik wywołuje skrypt PowerShell z tymi samymi ustawieniami.

Alternatywnie, w terminalu PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\artifacts\animated-effects\scripts\start-local-preview.ps1
```

Skrypt działa wyłącznie na `127.0.0.1` (nie wystawia podglądu do sieci lokalnej).

Skrypt:
1. Weryfikuje Node.js i pnpm, instaluje zależności `pnpm install --frozen-lockfile`.
2. Buduje referencje TypeScript i **frontend aplikacji z osadzonym Animated Effects**.
3. Uruchamia wyłącznie lokalny serwer statycznego podglądu Vite.

**Adres testowy:**

http://127.0.0.1:4173/stream/animated-effects/index.html

Nie ma potrzeby uruchamiania backendu. W katalogu `dist/public` pojawia
się build zgodny z tym, który przetestowano w GitHub Actions. Jeżeli wejdziesz
na inne strony aplikacji, mogą wyświetlać błędy API — to normalne,
ponieważ backend jest celowo wyłączony.

Zatrzymanie: **Ctrl+C** w terminalu. Zmiana portu: `-Port 4174`.
Przy kolejnym uruchomieniu możesz użyć `-SkipInstall`.
Po pierwszym poprawnym buildzie `-SkipBuild` przyspiesza ponowne otwarcie
podglądu, ale **nie uwzględnia nowych zmian w kodzie**, dopóki nie wykonasz
budowania ponownie.

## Krok 3 — szybka iteracja w edytorze (hot reload)

Gdy zaczniesz modyfikować Animated Effects, możesz używać osobnego trybu:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\artifacts\animated-effects\scripts\start-local-preview.ps1 -Mode Editor -SkipInstall
```

Otwórz **http://127.0.0.1:4173/**. Ten tryb obsługuje automatyczne
odświeżanie po zmianie plików Animated Effects, ale jest widokiem edytora
samodzielnego, nie zintegrowaną trasą strony.

Aby sprawdzić integrację po modyfikacjach, wróć do domyślnego trybu
`Integrated`, który ponownie buduje aplikację.

## Co warto przetestować ręcznie?

- Otwórz eksport StreamElements i sprawdź podgląd.
- Wybierz `chat-command`, wpisz `!fire`, uruchom symulację i sprawdź cooldown.
- Dodaj drugą regułę `raid` z inną warstwą efektu.
- Zapisz profil i odtwórz go po zmianie sceny.
- Pobierz JSON, zaimportuj ponownie; sam import nie powinien nadpisać sceny.
- Zmień rozmiar okna przeglądarki i przetestuj widok mobilny.

Podgląd w przeglądarce jest już wspierany testami automatycznymi Chromium,
ale **nie jest zastępstwem testu rzeczywistego OBS / StreamElements**.

## Co z aktualną lokalną gałęzią projektu?

Ta metoda **nie scala automatycznie** paczki do Twojej istniejącej lokalnej
gałęzi. Pozwala najpierw spokojnie sprawdzić kompletną, zintegrowaną wersję
w odrębnym folderze. Po akceptacji można przenieść zmiany do wybranej gałęzi
świadomym mergem/cherry-pickiem, po sprawdzeniu różnic i konfliktów z innymi
pracami. Nie łącz całej gałęzi `codex/replit-visual-polish-handoff` z `main`
bez sprawdzenia jej pozostałych zmian.

Podgląd nie publikuje niczego w Replit i nie ma dostępu do produkcyjnej bazy.
