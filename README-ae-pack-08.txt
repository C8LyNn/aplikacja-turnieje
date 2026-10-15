Animated Effects Pack 08 – Full UI QA + Batch GIF + Expansion
================================================================

WYMAGANY STAN:
- projekt aplikacja-turnieje-live
- wcześniejsze Pack 06 / Pack 07 mogą być zainstalowane
- instalator jest inkrementalny i robi własny backup

CO DODAJE:
1. Pełny pass UI / UX:
   - niezależny scroll biblioteki i inspectora
   - brak propagacji wheel między panelami
   - brak nakładania sticky nagłówka inspectora
   - poprawione dropdowny Scena / Narzędzia
   - czytelniejsze filtry, karty efektów, warstwy i suwaki
   - lepszy modal PNG / GIF
2. Batch GIF:
   - wszystkie efekty albo wybrana kategoria
   - domyślnie 10 s / efekt
   - 640×360 / 12 FPS
   - stały seed dla powtarzalności
   - render sekwencyjny
   - ZIP na końcu + manifest.json
   - anulowanie batcha i pasek postępu
3. 14 nowych efektów:
   - Black Hole Accretion
   - Orbital Debris
   - Star Tunnel
   - Energy Lattice
   - Target Lock
   - Scanner Beams
   - Digital Fragments
   - Pixel Melt
   - Wireframe Cubes
   - Floating Polyhedra
   - Shockwave Rings
   - Electric Web
   - Ribbon Streamers
   - Ink Clouds
4. Zakresy:
   - Density do 400%
   - Speed do 400%
   - Intensity do 400%

INSTALACJA:
1. Rozpakuj ZIP.
2. Skopiuj ae-pack-08-full-ui-batch-gif.mjs do:
   C:\Users\kubap\Documents\GitHub\aplikacja-turnieje-live
3. W PowerShellu w tym katalogu:
   node .\ae-pack-08-full-ui-batch-gif.mjs
4. Następnie:
   pnpm install
   pnpm --filter animated-effects run typecheck
   pnpm --filter animated-effects run build

TEST LOKALNY:
   $env:PORT="5173"
   Remove-Item Env:BASE_PATH -ErrorAction SilentlyContinue
   Remove-Item Env:MSYS2_ENV_CONV_EXCL -ErrorAction SilentlyContinue
   pnpm --filter "@workspace/tournament-manager" run dev

Potem:
   http://localhost:5173/dev/animated-effects/

BATCH GIF:
- Narzędzia -> PNG / GIF
- sekcja: Batch GIF · wszystkie efekty
- domyślnie 10 sekund na efekt
- kliknij: Generuj wszystkie do ZIP

UWAGA:
Cała biblioteka × 10 s może renderować długo. Zacznij od 640×360 / 12 FPS.
Nie commituj przed testami.
