TOURNAMENT EXP PACK 03 FIX
==========================

Cel:
Naprawia Pack 03, dodając brakujący wybór starego i nowego frontendu turniejowego.

Naprawione względem wadliwej paczki:
1. Instalator działa uruchomiony z ROOT repo:
   C:\Users\kubap\Documents\GitHub\aplikacja-turnieje-live
2. Można też jawnie podać ścieżkę do artifacts\tournament-manager.
3. /tournaments/stable jest dodawane PRZED /tournaments/:id.
   To ważne, aby "stable" nie zostało potraktowane jako ID turnieju.
4. Instalator po zmianie wykonuje twardą weryfikację routingu.
5. Tworzony jest backup App.tsx i istniejącego selektora.

INSTALACJA Z ROOT REPO:
powershell -ExecutionPolicy Bypass -File .\install.ps1

Jeżeli pliki paczki są w innym folderze:
powershell -ExecutionPolicy Bypass -File "C:\SCIEZKA\DO\PACZKI\install.ps1" "C:\Users\kubap\Documents\GitHub\aplikacja-turnieje-live\artifacts\tournament-manager"

WERYFIKACJA:
powershell -ExecutionPolicy Bypass -File .\verify.ps1

Po instalacji:
cd artifacts\tournament-manager
pnpm typecheck
pnpm test
$env:PORT=5173
pnpm dev

Oczekiwane:
Projekty -> Turnieje -> [Stabilny interfejs] [Nowy interfejs]
