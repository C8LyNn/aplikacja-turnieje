# Core Clash — Unity Starter v05

v05 rozwija tę samą paczkę migracyjną. Największy nacisk tej iteracji:
- pełniejsze authoritative snapshots,
- wykrywanie desynchronizacji,
- dalszy port mechanik z HTML,
- przygotowanie builda WebGL do osadzenia na własnej stronie.

## Nowe mechaniki

### Chainburst
- STOP,
- do 6 przeciwników,
- pierwszy cel MEDIUM,
- dalsze przeskoki SHORT,
- obrażenia rosną z każdym trafieniem.

### Chain Medic
- STOP,
- do 5 sojuszników,
- leczenie maleje z każdym przeskokiem.

### Rover
- może użyć Replay niezależnie od strefy.

### Raider
- jeśli zatrzyma się w strefie przeciwnika,
- zadaje 3 obrażenia bazie,
- wraca na swoją stronę.

Generator zawiera teraz co najmniej 32 definicje kulek.

## Networking — największa zmiana v05

Snapshot autorytatywny zawiera teraz również:
- stock obu graczy,
- map preset,
- wynik meczu,
- structures,
- traps,
- structure ammo,
- runtime IDs,
- checksum.

### Full reconciliation

Po odebraniu snapshotu klient potrafi teraz:
- utworzyć brakującą kulkę,
- usunąć nieistniejącą kulkę,
- zaktualizować HP/velocity/anchor,
- utworzyć brakującą strukturę,
- usunąć nieistniejącą strukturę,
- zaktualizować durability/ammo,
- utworzyć brakującą pułapkę,
- usunąć nieistniejącą pułapkę,
- zaktualizować charges,
- zsynchronizować stock,
- zsynchronizować mapę.

### Checksum

Snapshot ma deterministyczny FNV-1a 64-bit checksum oparty o skwantyzowany stan.

Panel debug pokazuje:
- `Sync: LOCAL`
- `Sync: OK`
- `Sync: DIFF`

To jest fundament pod wykrywanie desynchronizacji przy prawdziwym Web PvP.

## Web bootstrap

v05 czyta query string strony hostującej WebGL:

- `?mode=cpu`
- `?mode=hotseat`
- `?seed=12345`
- `?room=ABC123`

`room` jest na razie placeholderem transportowym, ale kod jest już gotowy do przekazania go później do NGO/Relay.

Przykład:

`https://twoja-strona.pl/games/core-clash/?mode=hotseat&seed=12345&room=TEST01`

## Instalacja

1. Unity 6 / 2D Core.
2. Skopiuj folder `Assets` z paczki.
3. W Unity:

`Tools > Core Clash > 05 - Build / Reset Starter Scene`

4. Potem:

`Tools > Core Clash > 05 - Validate Starter`

## Audyty

Kontrakt komend:

`Tools > Core Clash > 05 - Audit Network Contract`

Checksum snapshotów:

`Tools > Core Clash > 05 - Audit Snapshot Checksum`

## WebGL

`Tools > Core Clash > 05 - Build WebGL Prototype`

wynik:

`Builds/CoreClashWeb_v05`

Dodatkowe przykłady osadzenia na własnej stronie są w `WebDeployExamples/`.

## Status migracji

To nadal starter, ale warstwa sieciowa przestaje być tylko placeholderem.
`CoreClashMatch` potrafi już przyjąć zdalną komendę, zwalidować ją, wykonać oraz rekoncyliować praktycznie cały stan planszy na podstawie snapshotu.

Kolejnym logicznym etapem jest implementacja prawdziwego `ICoreClashNetworkBridge` opartego o NGO + Unity Transport + Relay.