Animated Effects Pack 09 Mega
================================

ZAKRES
- 19 przebudowanych / mocno poprawionych istniejących efektów.
- 12 nowych efektów.
- Nowy system „Charakter efektu”: 3 suwaki specyficzne dla danego efektu.
- Szybkie akcje: Subtelnie / Naturalnie / Mocno / Losuj charakter.
- Wartości charakteru są zapisywane w scenie i eksporcie StreamElements.
- Kolejny pass UI biblioteki, inspectora, scrolli i okna eksportu.
- Batch GIF rozszerzony do 1920×1080 i 30 FPS.

NAJMOCNIEJ POPRAWIONE
Fireworks, Lightning, Lightning Storm, Gears, Liquid Blobs, Gravity Well,
Black Hole Accretion, Electric Web, Electric Arcs, Spiral Galaxy,
Growing Vines, Neon Tunnel, Scanlines, Laser Grid, VHS Static,
HUD Grid, City Lights, Embers, Dust Motes.

NOWE EFEKTY
Magnetic Field, Volumetric Rays, Plasma Filaments, Ripple Field,
Bioluminescent Plankton, Glass Shards, Aurora Curtains, Data Streams,
Orbital Rings, Prism Caustics, Ember Ribbons, Fractal Branches.

INSTALACJA
1. Rozpakuj ZIP.
2. Skopiuj wszystkie 4 pliki z ZIP do:
   C:\Users\kubap\Documents\GitHub\aplikacja-turnieje-live
3. W PowerShellu, w tym katalogu:
   node .\ae-pack-09-mega.mjs
4. Testy:
   pnpm --filter animated-effects run typecheck
   pnpm --filter animated-effects run build
5. Lokalny start:
   $env:PORT="5173"
   Remove-Item Env:BASE_PATH -ErrorAction SilentlyContinue
   Remove-Item Env:MSYS2_ENV_CONV_EXCL -ErrorAction SilentlyContinue
   pnpm --filter "@workspace/tournament-manager" run dev

NIE COMMITUJ PRZED TESTEM UI.
