Animated Effects Pack 07 - FX Overdrive
=====================================

Zawartość:
- ae-pack-07-fx-overdrive.mjs
- pack07Overdrive.ts
- pack07OverdriveVariants.ts

Co robi:
- poprawia / nadpisuje efekty: gears, comets, fireworks, lightning-storm,
  liquid-blobs, particle-vortex, portal-rings, radar-sweep,
  glitch-blocks, gravity-well, hex-grid, floating-cubes
- dodaje: prism-drift, neon-shards, plasma-storm, cube-swarm
- dodaje mocniejsze warianty Overdrive (preset do 320%)
- dorzuca lekki polish UI biblioteki / inspectora / exportu

Instalacja:
1. Wypakuj ZIP.
2. Skopiuj wszystkie 3 pliki do katalogu głównego repo lub uruchom instalator
   bezpośrednio z wypakowanego folderu.
3. W PowerShellu w katalogu repo:
     node .\ae-pack-07-fx-overdrive.mjs
4. Potem:
     pnpm --filter animated-effects run typecheck
     pnpm --filter animated-effects run build
     $env:PORT="5173"
     $env:BASE_PATH="/"
     pnpm --filter "@workspace/tournament-manager" run dev

Rollback:
- po instalacji powstaje plik:
    .\ae-pack-07-fx-overdrive-rollback.mjs
