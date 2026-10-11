# Stream Background Effects — paczka scalona PR #8 + PR #9

Źródło: prywatne repozytorium `C8LyNn/aplikacja-turnieje`.
Zintegrowany commit: `2f10c39f7fa5d480e772ec2bb34b56af18d57f04`.
Paczka jest **wyłącznie do lokalnego testowania efektów tła streama**.
Nie publikuje Replita, nie łączy `main`, nie modyfikuje bazy danych.
Nie zawiera node_modules ani plików produkcyjnej bazy.

## 1. Gdzie jest paczka?

Google Drive: `Mój dysk/ChatGPT/Animated-Effects/`

Przykładowa lokalizacja na Windows po zakończeniu synchronizacji:
`G:\Mój dysk\ChatGPT\Animated-Effects\stream-background-effects_PR8_PR9_20261012.zip`

Jeżeli aplikacja Google Drive ma inną literę dysku, wybierz właściwą
ścieżkę do lokalnego ZIP.

## 2. Rozpakowanie

W PowerShell, na swoim komputerze:

```powershell
$zip = "G:\Mój dysk\ChatGPT\Animated-Effects\stream-background-effects_PR8_PR9_20261012.zip"
$dest = "G:\Mój dysk\ChatGPT\Animated-Effects\stream-background-effects_PR8_PR9_20261012"
Expand-Archive -LiteralPath $zip -DestinationPath $dest -Force
```

Uruchamiaj **instalator z rozpakowanego folderu**, nie z samego ZIP.

## 3. Najpierw sprawdź (bez zmian)

```powershell
$repo = "C:\Users\kubap\Documents\GitHub\aplikacja-turnieje-live"
& "$dest\INSTALL_STREAM_BACKGROUND_EFFECTS.ps1" -RepoPath $repo
```

Przed instalacją instalator porównuje SHA-256 każdego pliku paczki
i sprawdza lokalny stan Git. Jeśli wykryje niezapisane zmiany w plikach
objętych paczką, **przerwie bez kopiowania**. Nie zmienia pozostałych
plików projektu. Nie usuwa istniejących plików.

## 4. Instalacja

Jeśli tryb podglądu nie zgłosił konfliktów:

```powershell
& "$dest\INSTALL_STREAM_BACKGROUND_EFFECTS.ps1" -RepoPath $repo -Apply
```

Przed nadpisaniem istniejących plików instalator zapisuje kopię zapasową
obok repozytorium (katalog `stream-effects-backup-...`).
Na czas instalacji zalecamy zatrzymać lokalny serwer Vite/preview.

**Uwaga:** `-Force` jest dostępne, ale nadpisuje także pliki lokalnie
zmodyfikowane. Korzystaj tylko po świadomym sprawdzeniu i zapisaniu
własnych zmian (kopie zapasowe nadal powstają).

## 5. Kompilacja i podgląd

Z terminala VS Code w katalogu projektu:

```powershell
cd "C:\Users\kubap\Documents\GitHub\aplikacja-turnieje-live"
npx --yes --package=pnpm@10.34.6 -- pnpm install --no-frozen-lockfile
npx --yes --package=pnpm@10.34.6 -- pnpm --filter animated-effects build
npx --yes --package=pnpm@10.34.6 -- pnpm --filter @workspace/tournament-manager build
```

Na komputerze może nadal pozostać globalny pnpm 11 — te polecenia
tymczasowo używają pnpm 10.34.6.

Jeśli nie używasz jeszcze lokalnego serwera, w katalogu repozytorium:

```powershell
.\START_ANIMATED_EFFECTS_PREVIEW.cmd
```

Po zbudowaniu otwórz:
`http://127.0.0.1:4173/stream/animated-effects/index.html`

## 6. Co zawiera paczka?

- Pełny, śledzony przez Git katalog `artifacts/animated-effects/`.
- Edytor warstw, 104 efekty, timeline i keyframes, podgląd transportu.
- Eksport StreamElements: globalne reguły **oraz** tryb zdarzeń per warstwa.
- Podpisy/awatary, kolejkę priorytetową, profile, ZIP, symulator i diagnostykę.
- Skrypt osadzania edytora w buildzie aplikacji oraz testy integracyjne.
- Launcher lokalnego podglądu `START_ANIMATED_EFFECTS_PREVIEW.cmd`.
- `manifest.json` z SHA-256 plików i `CHECKSUMS.sha256` manifestu.

Paczka **nie zastępuje całego frontendu turniejowego**, więc nie usuwa
niezależnych prac nad turniejami, portfolio, katalogiem gier czy
Neoludologią. Nie scala ani nie resetuje bieżącej gałęzi Git.
Po instalacji zobaczysz zmianę jako lokalny diff w VS Code.
