param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$packageJson =
  Join-Path $ProjectRoot "package.json"

$mainPath =
  Join-Path $ProjectRoot "src\main.ts"

$inspectorPath =
  Join-Path $ProjectRoot "src\editor\inspector.ts"

$stylePath =
  Join-Path $ProjectRoot "src\style.css"

$variantsPath =
  Join-Path $ProjectRoot "src\effects\variants.ts"

if (
  !(Test-Path $packageJson) -or
  !(Test-Path $mainPath) -or
  !(Test-Path $inspectorPath) -or
  !(Test-Path $stylePath)
) {
  throw "Uruchom ten skrypt w katalogu glownym projektu animated-effects."
}

$currentMain =
  [System.IO.File]::ReadAllText(
    $mainPath
  )

$currentInspector =
  [System.IO.File]::ReadAllText(
    $inspectorPath
  )

if (
  !$currentMain.Contains(
    'class="ae-app-shell"'
  ) -or
  !$currentInspector.Contains(
    'inspector-group-toggle'
  )
) {
  throw "Nie wykryto aktualnego UI v5. Nie nadpisuje plikow."
}

$stamp =
  Get-Date -Format "yyyyMMdd-HHmmss"

$backupRoot =
  Join-Path
    $ProjectRoot
    ".animated-effects-backup\$stamp"

$mainBackup =
  Join-Path
    $backupRoot
    "src\main.ts"

$inspectorBackup =
  Join-Path
    $backupRoot
    "src\editor\inspector.ts"

$styleBackup =
  Join-Path
    $backupRoot
    "src\style.css"

$variantsBackup =
  Join-Path
    $backupRoot
    "src\effects\variants.ts"

New-Item
  -ItemType Directory
  -Force
  -Path (
    Split-Path $mainBackup -Parent
  ) |
  Out-Null

New-Item
  -ItemType Directory
  -Force
  -Path (
    Split-Path $inspectorBackup -Parent
  ) |
  Out-Null

New-Item
  -ItemType Directory
  -Force
  -Path (
    Split-Path $variantsBackup -Parent
  ) |
  Out-Null

$hadVariants =
  Test-Path $variantsPath

Copy-Item
  $mainPath
  $mainBackup
  -Force

Copy-Item
  $inspectorPath
  $inspectorBackup
  -Force

Copy-Item
  $stylePath
  $styleBackup
  -Force

if ($hadVariants) {
  Copy-Item
    $variantsPath
    $variantsBackup
    -Force
}

Write-Host ""
Write-Host "Animated Effects - Variants Pack 01" -ForegroundColor Cyan
Write-Host "Backup: $backupRoot"
Write-Host ""

$newVariants = @'
import type {
  EffectSettings,
} from "../core/types";

export interface EffectVariant {
  id: string;
  name: string;
  description: string;
  settings: Partial<EffectSettings>;
}

export const effectVariantCatalog: Record<
  string,
  EffectVariant[]
> = {
  "rainfall": [
    {
      id: "drizzle",
      name: "M\u017cawka",
      description: "Rzadki, spokojny deszcz w tle.",
      settings: {
        opacity: 55,
        density: 30,
        speed: 65,
        scale: 80,
        blur: 0,
        brightness: 95,
      },
    },
    {
      id: "steady",
      name: "R\u00f3wny deszcz",
      description: "Klasyczny, r\u00f3wnomierny opad.",
      settings: {
        opacity: 72,
        density: 65,
        speed: 105,
        scale: 100,
        blur: 0,
        brightness: 100,
      },
    },
    {
      id: "storm",
      name: "Ulewa",
      description: "G\u0119sty i szybki deszcz.",
      settings: {
        opacity: 90,
        density: 100,
        speed: 175,
        scale: 110,
        blur: 1,
        brightness: 115,
        blendMode: "screen",
      },
    },
    {
      id: "windy",
      name: "Deszcz z wiatrem",
      description: "Szybszy opad z wyra\u017anym pochyleniem warstwy.",
      settings: {
        opacity: 78,
        density: 72,
        speed: 145,
        scale: 105,
        rotation: -10,
        brightness: 105,
      },
    },
  ],
  "snow": [
    {
      id: "gentle",
      name: "Lekki \u015bnieg",
      description: "Powolne, delikatne p\u0142atki.",
      settings: {
        opacity: 62,
        density: 35,
        speed: 45,
        scale: 90,
        blur: 0,
        brightness: 110,
      },
    },
    {
      id: "classic",
      name: "Klasyczny",
      description: "Zbalansowany \u015bnieg.",
      settings: {
        opacity: 78,
        density: 60,
        speed: 75,
        scale: 100,
        blur: 0,
        brightness: 115,
      },
    },
    {
      id: "blizzard",
      name: "Zamie\u0107",
      description: "Bardzo g\u0119sty i szybki opad.",
      settings: {
        opacity: 92,
        density: 100,
        speed: 165,
        scale: 90,
        blur: 1,
        brightness: 125,
      },
    },
    {
      id: "large",
      name: "Du\u017ce p\u0142atki",
      description: "Wi\u0119ksze, bardziej widoczne p\u0142atki.",
      settings: {
        opacity: 84,
        density: 45,
        speed: 60,
        scale: 150,
        blur: 1,
        brightness: 120,
      },
    },
  ],
  "lightning": [
    {
      id: "distant",
      name: "Odleg\u0142a burza",
      description: "Rzadsze i subtelniejsze b\u0142yski.",
      settings: {
        opacity: 52,
        density: 30,
        speed: 60,
        scale: 100,
        blur: 2,
        brightness: 115,
      },
    },
    {
      id: "classic",
      name: "Burza",
      description: "Zbalansowane wy\u0142adowania.",
      settings: {
        opacity: 78,
        density: 58,
        speed: 105,
        scale: 100,
        blur: 1,
        brightness: 130,
      },
    },
    {
      id: "violent",
      name: "Gwa\u0142towna",
      description: "Cz\u0119ste i bardzo jasne b\u0142yski.",
      settings: {
        opacity: 100,
        density: 95,
        speed: 175,
        scale: 110,
        blur: 0,
        brightness: 190,
      },
    },
    {
      id: "purple",
      name: "Fioletowa burza",
      description: "Magiczny, fioletowy wariant wy\u0142adowa\u0144.",
      settings: {
        opacity: 88,
        density: 70,
        speed: 125,
        scale: 105,
        hue: 115,
        brightness: 150,
        blendMode: "screen",
      },
    },
  ],
  "hearts": [
    {
      id: "soft",
      name: "Delikatne",
      description: "Rzadkie, spokojnie unosz\u0105ce si\u0119 serca.",
      settings: {
        opacity: 58,
        density: 28,
        speed: 55,
        scale: 90,
        blur: 0,
        brightness: 105,
      },
    },
    {
      id: "classic",
      name: "Klasyczne",
      description: "Zbalansowany romantyczny efekt.",
      settings: {
        opacity: 78,
        density: 55,
        speed: 85,
        scale: 110,
        brightness: 110,
      },
    },
    {
      id: "shower",
      name: "Deszcz serc",
      description: "Du\u017co szybko poruszaj\u0105cych si\u0119 serc.",
      settings: {
        opacity: 90,
        density: 95,
        speed: 145,
        scale: 100,
        brightness: 120,
      },
    },
    {
      id: "giant",
      name: "Du\u017ce serca",
      description: "Mniej element\u00f3w, ale znacznie wi\u0119kszych.",
      settings: {
        opacity: 82,
        density: 35,
        speed: 70,
        scale: 175,
        blur: 1,
        brightness: 120,
      },
    },
  ],
  "leaves": [
    {
      id: "breeze",
      name: "Lekki wiatr",
      description: "Spokojnie opadaj\u0105ce li\u015bcie.",
      settings: {
        opacity: 68,
        density: 35,
        speed: 60,
        scale: 95,
        rotation: 0,
        brightness: 100,
      },
    },
    {
      id: "autumn",
      name: "Jesie\u0144",
      description: "G\u0119stszy, ciep\u0142y opad li\u015bci.",
      settings: {
        opacity: 82,
        density: 65,
        speed: 90,
        scale: 105,
        hue: -18,
        brightness: 110,
      },
    },
    {
      id: "gust",
      name: "Podmuch",
      description: "Szybki i dynamiczny ruch.",
      settings: {
        opacity: 85,
        density: 75,
        speed: 160,
        scale: 100,
        rotation: 8,
        brightness: 105,
      },
    },
    {
      id: "close",
      name: "Li\u015bcie z bliska",
      description: "Du\u017ce li\u015bcie przechodz\u0105ce blisko kamery.",
      settings: {
        opacity: 86,
        density: 38,
        speed: 80,
        scale: 180,
        blur: 1,
        brightness: 115,
      },
    },
  ],
  "matrix": [
    {
      id: "sparse",
      name: "Rzadki kod",
      description: "Niewiele kolumn i spokojniejszy ruch.",
      settings: {
        opacity: 58,
        density: 28,
        speed: 70,
        scale: 90,
        brightness: 95,
      },
    },
    {
      id: "classic",
      name: "Klasyczny Matrix",
      description: "Zbalansowana zielona \u015bciana kodu.",
      settings: {
        opacity: 78,
        density: 58,
        speed: 105,
        scale: 100,
        hue: 0,
        brightness: 110,
      },
    },
    {
      id: "dense",
      name: "G\u0119sty kod",
      description: "Wi\u0119cej kolumn i szybszy przep\u0142yw.",
      settings: {
        opacity: 88,
        density: 95,
        speed: 150,
        scale: 95,
        brightness: 125,
      },
    },
    {
      id: "blue",
      name: "Niebieski kod",
      description: "Ch\u0142odniejsza, cybernetyczna wersja.",
      settings: {
        opacity: 82,
        density: 68,
        speed: 110,
        scale: 100,
        hue: 95,
        brightness: 120,
        blendMode: "screen",
      },
    },
  ],
  "comets": [
    {
      id: "rare",
      name: "Pojedyncze",
      description: "Rzadkie komety przecinaj\u0105ce t\u0142o.",
      settings: {
        opacity: 65,
        density: 25,
        speed: 75,
        scale: 90,
        brightness: 110,
      },
    },
    {
      id: "classic",
      name: "Klasyczne",
      description: "Zbalansowane komety.",
      settings: {
        opacity: 80,
        density: 52,
        speed: 100,
        scale: 100,
        brightness: 125,
      },
    },
    {
      id: "shower",
      name: "Deszcz meteor\u00f3w",
      description: "Du\u017co szybkich smug.",
      settings: {
        opacity: 92,
        density: 95,
        speed: 155,
        scale: 95,
        brightness: 145,
      },
    },
    {
      id: "giant",
      name: "Wielkie komety",
      description: "Mniej, ale wi\u0119kszych i ja\u015bniejszych smug.",
      settings: {
        opacity: 88,
        density: 32,
        speed: 90,
        scale: 175,
        blur: 1,
        brightness: 155,
      },
    },
  ],
  "starfield": [
    {
      id: "distant",
      name: "Odleg\u0142e gwiazdy",
      description: "Subtelne, drobne punkty.",
      settings: {
        opacity: 50,
        density: 35,
        speed: 45,
        scale: 75,
        brightness: 95,
      },
    },
    {
      id: "classic",
      name: "Pole gwiazd",
      description: "Zbalansowane kosmiczne t\u0142o.",
      settings: {
        opacity: 72,
        density: 62,
        speed: 75,
        scale: 100,
        brightness: 115,
      },
    },
    {
      id: "dense",
      name: "G\u0119ste niebo",
      description: "Znacznie wi\u0119cej gwiazd.",
      settings: {
        opacity: 82,
        density: 100,
        speed: 70,
        scale: 90,
        brightness: 120,
      },
    },
    {
      id: "bright",
      name: "Jasne gwiazdy",
      description: "Mniej punkt\u00f3w, ale mocniej \u015bwiec\u0105cych.",
      settings: {
        opacity: 90,
        density: 48,
        speed: 65,
        scale: 125,
        blur: 1,
        brightness: 160,
        blendMode: "screen",
      },
    },
  ],
  "fog": [
    {
      id: "wisps",
      name: "Smugi mg\u0142y",
      description: "Lekkie, przejrzyste pasma.",
      settings: {
        opacity: 38,
        density: 35,
        speed: 50,
        scale: 100,
        blur: 8,
        brightness: 95,
      },
    },
    {
      id: "low",
      name: "Niska mg\u0142a",
      description: "Mg\u0142a skupiona przy dolnej kraw\u0119dzi.",
      settings: {
        opacity: 58,
        density: 58,
        speed: 55,
        scale: 120,
        y: 35,
        blur: 10,
        area: "bottom",
        brightness: 100,
      },
    },
    {
      id: "heavy",
      name: "G\u0119sta mg\u0142a",
      description: "Ci\u0119\u017cka mg\u0142a pokrywaj\u0105ca kadr.",
      settings: {
        opacity: 78,
        density: 95,
        speed: 40,
        scale: 135,
        blur: 13,
        brightness: 92,
      },
    },
    {
      id: "ghost",
      name: "Widmowa",
      description: "Ch\u0142odniejsza i bardziej \u015bwietlista mg\u0142a.",
      settings: {
        opacity: 62,
        density: 68,
        speed: 65,
        scale: 125,
        blur: 12,
        hue: 105,
        brightness: 125,
        blendMode: "screen",
      },
    },
  ],
  "embers": [
    {
      id: "smolder",
      name: "\u017bar",
      description: "Niewiele powolnych iskier.",
      settings: {
        opacity: 58,
        density: 30,
        speed: 55,
        scale: 90,
        brightness: 105,
      },
    },
    {
      id: "firepit",
      name: "Ognisko",
      description: "Zbalansowane unosz\u0105ce si\u0119 \u017carz\u0105ce drobiny.",
      settings: {
        opacity: 78,
        density: 58,
        speed: 90,
        scale: 100,
        brightness: 120,
      },
    },
    {
      id: "inferno",
      name: "Inferno",
      description: "G\u0119sty i szybki strumie\u0144 \u017caru.",
      settings: {
        opacity: 92,
        density: 100,
        speed: 160,
        scale: 105,
        brightness: 150,
        blendMode: "screen",
      },
    },
    {
      id: "large",
      name: "Du\u017cy \u017car",
      description: "Wi\u0119ksze, wolniejsze drobiny.",
      settings: {
        opacity: 84,
        density: 40,
        speed: 65,
        scale: 165,
        blur: 1,
        brightness: 135,
      },
    },
  ],
  "clouds": [
    {
      id: "wispy",
      name: "Pierze",
      description: "Lekkie, rzadkie ob\u0142oki.",
      settings: {
        opacity: 35,
        density: 30,
        speed: 45,
        scale: 105,
        blur: 8,
        brightness: 105,
      },
    },
    {
      id: "classic",
      name: "Chmury",
      description: "Zbalansowana warstwa chmur.",
      settings: {
        opacity: 55,
        density: 58,
        speed: 65,
        scale: 120,
        blur: 9,
        brightness: 100,
      },
    },
    {
      id: "overcast",
      name: "Zachmurzenie",
      description: "G\u0119ste i ciemniejsze chmury.",
      settings: {
        opacity: 78,
        density: 95,
        speed: 55,
        scale: 135,
        blur: 11,
        brightness: 75,
      },
    },
    {
      id: "dreamy",
      name: "Senna mgie\u0142ka",
      description: "Jasne, mi\u0119kkie i wolne ob\u0142oki.",
      settings: {
        opacity: 52,
        density: 48,
        speed: 35,
        scale: 150,
        blur: 14,
        brightness: 135,
        blendMode: "screen",
      },
    },
  ],
  "rain-glass": [
    {
      id: "mist",
      name: "Drobne krople",
      description: "Subtelne krople na szybie.",
      settings: {
        opacity: 48,
        density: 35,
        speed: 55,
        scale: 80,
        blur: 0,
        brightness: 95,
      },
    },
    {
      id: "classic",
      name: "Mokra szyba",
      description: "Zbalansowane smugi deszczu.",
      settings: {
        opacity: 72,
        density: 62,
        speed: 85,
        scale: 100,
        brightness: 105,
      },
    },
    {
      id: "downpour",
      name: "Ulewa na szybie",
      description: "Du\u017co szybkich smug.",
      settings: {
        opacity: 88,
        density: 100,
        speed: 145,
        scale: 105,
        blur: 1,
        brightness: 115,
      },
    },
    {
      id: "slow",
      name: "Powolne smugi",
      description: "Du\u017ce krople wolno zsuwaj\u0105ce si\u0119 po szybie.",
      settings: {
        opacity: 80,
        density: 45,
        speed: 35,
        scale: 155,
        blur: 1,
        brightness: 110,
      },
    },
  ],
  "bouncing-balls": [
    {
      id: "calm",
      name: "Spokojne",
      description: "Kilka wolnych kulek.",
      settings: {
        opacity: 65,
        density: 30,
        speed: 55,
        scale: 90,
        brightness: 105,
      },
    },
    {
      id: "arcade",
      name: "Arcade",
      description: "Zbalansowana liczba i tempo.",
      settings: {
        opacity: 82,
        density: 58,
        speed: 105,
        scale: 100,
        brightness: 125,
      },
    },
    {
      id: "chaos",
      name: "Chaos",
      description: "Du\u017co szybkich odbijaj\u0105cych si\u0119 kulek.",
      settings: {
        opacity: 90,
        density: 100,
        speed: 175,
        scale: 90,
        brightness: 140,
      },
    },
    {
      id: "giant",
      name: "Wielkie kule",
      description: "Mniej obiekt\u00f3w o du\u017cej skali.",
      settings: {
        opacity: 86,
        density: 32,
        speed: 75,
        scale: 190,
        blur: 1,
        brightness: 130,
      },
    },
  ],
  "neon-lines": [
    {
      id: "minimal",
      name: "Minimal",
      description: "Kilka subtelnych neonowych linii.",
      settings: {
        opacity: 52,
        density: 28,
        speed: 60,
        scale: 90,
        brightness: 110,
      },
    },
    {
      id: "classic",
      name: "Neon",
      description: "Zbalansowane linie cyberpunkowe.",
      settings: {
        opacity: 78,
        density: 58,
        speed: 100,
        scale: 100,
        brightness: 135,
        blendMode: "screen",
      },
    },
    {
      id: "dense",
      name: "Sie\u0107 neon\u00f3w",
      description: "G\u0119sty uk\u0142ad \u015bwiec\u0105cych linii.",
      settings: {
        opacity: 86,
        density: 95,
        speed: 125,
        scale: 100,
        brightness: 150,
        blendMode: "screen",
      },
    },
    {
      id: "violet",
      name: "Fioletowy neon",
      description: "Fioletowo-r\u00f3\u017cowy wariant kolorystyczny.",
      settings: {
        opacity: 82,
        density: 65,
        speed: 95,
        scale: 105,
        hue: 95,
        brightness: 145,
        blendMode: "screen",
      },
    },
  ],
  "energy-orbs": [
    {
      id: "ambient",
      name: "Ambient",
      description: "Rzadkie, spokojne kule energii.",
      settings: {
        opacity: 55,
        density: 28,
        speed: 50,
        scale: 90,
        blur: 2,
        brightness: 110,
      },
    },
    {
      id: "classic",
      name: "Energia",
      description: "Zbalansowane \u015bwietliste kule.",
      settings: {
        opacity: 75,
        density: 58,
        speed: 85,
        scale: 105,
        blur: 1,
        brightness: 130,
        blendMode: "screen",
      },
    },
    {
      id: "storm",
      name: "Burza energii",
      description: "Du\u017co szybkich i jasnych kul.",
      settings: {
        opacity: 90,
        density: 100,
        speed: 155,
        scale: 100,
        blur: 1,
        brightness: 165,
        blendMode: "screen",
      },
    },
    {
      id: "giant",
      name: "Wielkie orbsy",
      description: "Mniej, ale znacznie wi\u0119kszych kul.",
      settings: {
        opacity: 84,
        density: 32,
        speed: 60,
        scale: 190,
        blur: 3,
        brightness: 145,
        blendMode: "screen",
      },
    },
  ],
  "petals": [
    {
      id: "gentle",
      name: "Delikatne",
      description: "Spokojnie spadaj\u0105ce p\u0142atki.",
      settings: {
        opacity: 62,
        density: 30,
        speed: 55,
        scale: 90,
        brightness: 105,
      },
    },
    {
      id: "classic",
      name: "Kwiatowy opad",
      description: "Zbalansowany efekt p\u0142atk\u00f3w.",
      settings: {
        opacity: 78,
        density: 58,
        speed: 85,
        scale: 100,
        brightness: 115,
      },
    },
    {
      id: "storm",
      name: "Burza p\u0142atk\u00f3w",
      description: "G\u0119sty i szybki opad.",
      settings: {
        opacity: 88,
        density: 100,
        speed: 150,
        scale: 95,
        brightness: 125,
      },
    },
    {
      id: "large",
      name: "Du\u017ce p\u0142atki",
      description: "Mniej element\u00f3w, ale wi\u0119kszych.",
      settings: {
        opacity: 84,
        density: 38,
        speed: 65,
        scale: 170,
        blur: 1,
        brightness: 120,
      },
    },
  ],
  "sparks": [
    {
      id: "welding",
      name: "Spawanie",
      description: "Szybkie, jasne i rzadkie iskry.",
      settings: {
        opacity: 88,
        density: 42,
        speed: 170,
        scale: 80,
        brightness: 165,
        blendMode: "screen",
      },
    },
    {
      id: "fire",
      name: "Ogie\u0144",
      description: "Zbalansowane ciep\u0142e iskry.",
      settings: {
        opacity: 78,
        density: 60,
        speed: 105,
        scale: 100,
        brightness: 130,
      },
    },
    {
      id: "burst",
      name: "Rozb\u0142ysk",
      description: "G\u0119sty strumie\u0144 dynamicznych iskier.",
      settings: {
        opacity: 94,
        density: 100,
        speed: 195,
        scale: 95,
        brightness: 180,
        blendMode: "screen",
      },
    },
    {
      id: "slow",
      name: "Powolny \u017car",
      description: "Du\u017ce i spokojniejsze iskry.",
      settings: {
        opacity: 72,
        density: 35,
        speed: 45,
        scale: 155,
        blur: 1,
        brightness: 120,
      },
    },
  ],
  "plasma": [
    {
      id: "calm",
      name: "Spokojna plazma",
      description: "Wolniejszy i mi\u0119kki ruch.",
      settings: {
        opacity: 58,
        density: 38,
        speed: 45,
        scale: 110,
        blur: 4,
        brightness: 110,
      },
    },
    {
      id: "classic",
      name: "Plazma",
      description: "Zbalansowany efekt energetyczny.",
      settings: {
        opacity: 78,
        density: 62,
        speed: 90,
        scale: 115,
        blur: 2,
        brightness: 135,
        blendMode: "screen",
      },
    },
    {
      id: "hot",
      name: "Gor\u0105ca",
      description: "Ja\u015bniejsza i bardziej intensywna plazma.",
      settings: {
        opacity: 90,
        density: 82,
        speed: 120,
        scale: 125,
        blur: 2,
        brightness: 175,
        hue: -35,
        blendMode: "screen",
      },
    },
    {
      id: "electric",
      name: "Elektryczna",
      description: "Szybka, ch\u0142odniejsza plazma.",
      settings: {
        opacity: 86,
        density: 72,
        speed: 165,
        scale: 105,
        blur: 1,
        brightness: 160,
        hue: 95,
        blendMode: "screen",
      },
    },
  ],
  "energy-waves": [
    {
      id: "soft",
      name: "Mi\u0119kkie fale",
      description: "Powolne i subtelne fale energii.",
      settings: {
        opacity: 48,
        density: 35,
        speed: 45,
        scale: 110,
        blur: 3,
        brightness: 105,
      },
    },
    {
      id: "pulse",
      name: "Puls",
      description: "Zbalansowane pulsuj\u0105ce fale.",
      settings: {
        opacity: 72,
        density: 60,
        speed: 90,
        scale: 120,
        blur: 2,
        brightness: 130,
        blendMode: "screen",
      },
    },
    {
      id: "fast",
      name: "Szybkie fale",
      description: "Dynamiczny, energetyczny ruch.",
      settings: {
        opacity: 84,
        density: 78,
        speed: 160,
        scale: 110,
        blur: 1,
        brightness: 150,
        blendMode: "screen",
      },
    },
    {
      id: "wide",
      name: "Szerokie fale",
      description: "Du\u017ce, wolniejsze pasma energii.",
      settings: {
        opacity: 75,
        density: 42,
        speed: 60,
        scale: 175,
        blur: 4,
        brightness: 140,
        blendMode: "screen",
      },
    },
  ],
  "runes": [
    {
      id: "drifting",
      name: "W\u0119druj\u0105ce",
      description: "Runy Elder Futhark swobodnie unosz\u0105ce si\u0119 po ekranie.",
      settings: {
        opacity: 72,
        density: 45,
        speed: 55,
        scale: 100,
        blur: 0,
        brightness: 120,
      },
    },
    {
      id: "ancient",
      name: "Staro\u017cytne",
      description: "Wolne, wi\u0119ksze i ci\u0119\u017csze wizualnie symbole.",
      settings: {
        opacity: 82,
        density: 30,
        speed: 35,
        scale: 150,
        blur: 1,
        brightness: 105,
      },
    },
    {
      id: "ritual",
      name: "Rytua\u0142",
      description: "G\u0119stsza, bardziej \u015bwietlista warstwa run.",
      settings: {
        opacity: 90,
        density: 75,
        speed: 65,
        scale: 115,
        blur: 1,
        brightness: 155,
        blendMode: "screen",
      },
    },
    {
      id: "ghost",
      name: "Widmowe",
      description: "Subtelne, ch\u0142odne i rozmyte znaki.",
      settings: {
        opacity: 52,
        density: 58,
        speed: 45,
        scale: 125,
        blur: 3,
        hue: 90,
        brightness: 135,
        blendMode: "screen",
      },
    },
  ],
  "magic-dust": [
    {
      id: "wisps",
      name: "Smugi py\u0142u",
      description: "Rzadki, spokojny magiczny py\u0142.",
      settings: {
        opacity: 50,
        density: 28,
        speed: 45,
        scale: 90,
        blur: 1,
        brightness: 115,
      },
    },
    {
      id: "fairy",
      name: "Ba\u015bniowy py\u0142",
      description: "Zbalansowane migocz\u0105ce drobiny.",
      settings: {
        opacity: 76,
        density: 58,
        speed: 80,
        scale: 100,
        brightness: 135,
        blendMode: "screen",
      },
    },
    {
      id: "dense",
      name: "Magiczna chmura",
      description: "G\u0119sty i ja\u015bniejszy py\u0142.",
      settings: {
        opacity: 88,
        density: 100,
        speed: 105,
        scale: 105,
        blur: 1,
        brightness: 160,
        blendMode: "screen",
      },
    },
    {
      id: "gold",
      name: "Z\u0142oty py\u0142",
      description: "Ciep\u0142y, z\u0142ocisty wariant kolorystyczny.",
      settings: {
        opacity: 82,
        density: 65,
        speed: 75,
        scale: 105,
        hue: -55,
        brightness: 150,
        blendMode: "screen",
      },
    },
  ],
  "laser-grid": [
    {
      id: "minimal",
      name: "Minimal",
      description: "Rzadkie, spokojne linie siatki.",
      settings: {
        opacity: 50,
        density: 30,
        speed: 55,
        scale: 100,
        brightness: 110,
      },
    },
    {
      id: "classic",
      name: "Laser Grid",
      description: "Zbalansowana futurystyczna siatka.",
      settings: {
        opacity: 75,
        density: 60,
        speed: 90,
        scale: 105,
        brightness: 135,
        blendMode: "screen",
      },
    },
    {
      id: "dense",
      name: "G\u0119sta siatka",
      description: "Wi\u0119cej linii i mocniejsze \u015bwiat\u0142o.",
      settings: {
        opacity: 86,
        density: 95,
        speed: 105,
        scale: 100,
        brightness: 155,
        blendMode: "screen",
      },
    },
    {
      id: "fast",
      name: "Szybka siatka",
      description: "Dynamiczny, klubowy wariant.",
      settings: {
        opacity: 82,
        density: 72,
        speed: 170,
        scale: 110,
        brightness: 150,
        hue: 75,
        blendMode: "screen",
      },
    },
  ],
  "scanlines": [
    {
      id: "subtle",
      name: "Subtelne",
      description: "Lekka faktura monitora CRT.",
      settings: {
        opacity: 32,
        density: 35,
        speed: 30,
        scale: 100,
        brightness: 100,
      },
    },
    {
      id: "crt",
      name: "CRT",
      description: "Klasyczne linie starego ekranu.",
      settings: {
        opacity: 58,
        density: 62,
        speed: 55,
        scale: 100,
        brightness: 105,
      },
    },
    {
      id: "vhs",
      name: "VHS",
      description: "Mocniejszy i szybszy analogowy szum.",
      settings: {
        opacity: 72,
        density: 82,
        speed: 115,
        scale: 105,
        blur: 1,
        brightness: 110,
      },
    },
    {
      id: "harsh",
      name: "Mocne linie",
      description: "Bardzo widoczna faktura skanowania.",
      settings: {
        opacity: 88,
        density: 100,
        speed: 70,
        scale: 100,
        brightness: 120,
        blendMode: "overlay",
      },
    },
  ],
  "pong": [
    {
      id: "classic",
      name: "Klasyczny Pong",
      description: "Spokojny mecz w klasycznym tempie.",
      settings: {
        opacity: 82,
        density: 72,
        speed: 100,
        scale: 100,
        brightness: 115,
        hue: 0,
        intensity: 0,
      },
    },
    {
      id: "chill",
      name: "Chill",
      description: "Wolniejszy, ambientowy Pong.",
      settings: {
        opacity: 62,
        density: 55,
        speed: 65,
        scale: 100,
        brightness: 105,
        hue: 40,
        intensity: 0,
      },
    },
    {
      id: "arcade",
      name: "Arcade",
      description: "Szybszy mecz z lekkim przyspieszaniem.",
      settings: {
        opacity: 90,
        density: 82,
        speed: 145,
        scale: 105,
        brightness: 140,
        hue: 0,
        intensity: 18,
        blendMode: "screen",
      },
    },
    {
      id: "neon",
      name: "Neon Pong",
      description: "Fioletowo-neonowa wersja arcade.",
      settings: {
        opacity: 92,
        density: 78,
        speed: 125,
        scale: 105,
        brightness: 155,
        hue: 105,
        intensity: 10,
        blendMode: "screen",
      },
    },
  ],
  "bubbles": [
    {
      id: "gentle",
      name: "Delikatne",
      description: "Rzadkie i spokojne b\u0105belki.",
      settings: {
        opacity: 48,
        density: 28,
        speed: 45,
        scale: 85,
        blur: 0,
        brightness: 105,
      },
    },
    {
      id: "aquarium",
      name: "Akwarium",
      description: "Zbalansowany strumie\u0144 b\u0105belk\u00f3w.",
      settings: {
        opacity: 68,
        density: 60,
        speed: 75,
        scale: 100,
        brightness: 115,
      },
    },
    {
      id: "dense",
      name: "G\u0119ste",
      description: "Du\u017co szybko unosz\u0105cych si\u0119 b\u0105belk\u00f3w.",
      settings: {
        opacity: 78,
        density: 100,
        speed: 125,
        scale: 95,
        brightness: 125,
      },
    },
    {
      id: "giant",
      name: "Wielkie b\u0105ble",
      description: "Mniej, ale bardzo du\u017cych element\u00f3w.",
      settings: {
        opacity: 70,
        density: 30,
        speed: 55,
        scale: 195,
        blur: 1,
        brightness: 120,
      },
    },
  ],
  "fireflies": [
    {
      id: "sparse",
      name: "Kilka \u015bwietlik\u00f3w",
      description: "Rzadkie i spokojne punkty \u015bwiat\u0142a.",
      settings: {
        opacity: 55,
        density: 25,
        speed: 45,
        scale: 90,
        blur: 1,
        brightness: 120,
      },
    },
    {
      id: "meadow",
      name: "\u0141\u0105ka",
      description: "Zbalansowany, naturalny r\u00f3j.",
      settings: {
        opacity: 75,
        density: 58,
        speed: 70,
        scale: 100,
        blur: 1,
        brightness: 135,
        blendMode: "screen",
      },
    },
    {
      id: "swarm",
      name: "R\u00f3j",
      description: "Du\u017co aktywnych \u015bwietlik\u00f3w.",
      settings: {
        opacity: 86,
        density: 100,
        speed: 120,
        scale: 95,
        brightness: 155,
        blendMode: "screen",
      },
    },
    {
      id: "dreamy",
      name: "Senny",
      description: "Du\u017ce, powolne i mi\u0119kkie \u015bwiat\u0142a.",
      settings: {
        opacity: 68,
        density: 38,
        speed: 35,
        scale: 160,
        blur: 3,
        brightness: 145,
        blendMode: "screen",
      },
    },
  ],
  "confetti": [
    {
      id: "light",
      name: "Lekki opad",
      description: "Niewiele konfetti i spokojne tempo.",
      settings: {
        opacity: 62,
        density: 30,
        speed: 60,
        scale: 90,
        brightness: 105,
      },
    },
    {
      id: "party",
      name: "Impreza",
      description: "Zbalansowane kolorowe konfetti.",
      settings: {
        opacity: 82,
        density: 65,
        speed: 105,
        scale: 100,
        brightness: 115,
      },
    },
    {
      id: "celebration",
      name: "Celebracja",
      description: "G\u0119sty i szybki wybuch konfetti.",
      settings: {
        opacity: 92,
        density: 100,
        speed: 165,
        scale: 105,
        brightness: 130,
      },
    },
    {
      id: "slow",
      name: "Slow motion",
      description: "Wi\u0119ksze elementy opadaj\u0105ce powoli.",
      settings: {
        opacity: 80,
        density: 45,
        speed: 35,
        scale: 150,
        blur: 1,
        brightness: 115,
      },
    },
  ],
  "dust-motes": [
    {
      id: "subtle",
      name: "Subtelny kurz",
      description: "Prawie niewidoczne drobiny w tle.",
      settings: {
        opacity: 30,
        density: 30,
        speed: 35,
        scale: 85,
        blur: 1,
        brightness: 95,
      },
    },
    {
      id: "sunbeam",
      name: "Promie\u0144 s\u0142o\u0144ca",
      description: "Ja\u015bniejsze drobiny zawieszone w powietrzu.",
      settings: {
        opacity: 55,
        density: 55,
        speed: 45,
        scale: 100,
        blur: 1,
        brightness: 135,
        blendMode: "screen",
      },
    },
    {
      id: "dense",
      name: "G\u0119sty kurz",
      description: "Wi\u0119cej widocznych drobin.",
      settings: {
        opacity: 65,
        density: 100,
        speed: 55,
        scale: 95,
        brightness: 120,
      },
    },
    {
      id: "cinematic",
      name: "Filmowy",
      description: "Du\u017ce, wolne i mi\u0119kkie drobiny.",
      settings: {
        opacity: 48,
        density: 42,
        speed: 30,
        scale: 155,
        blur: 2,
        brightness: 145,
        blendMode: "screen",
      },
    },
  ],
  "aurora": [
    {
      id: "soft",
      name: "Delikatna zorza",
      description: "Subtelne, powolne pasma.",
      settings: {
        opacity: 48,
        density: 35,
        speed: 35,
        scale: 110,
        blur: 4,
        brightness: 110,
      },
    },
    {
      id: "nordic",
      name: "Nordycka",
      description: "Zbalansowana klasyczna zorza.",
      settings: {
        opacity: 72,
        density: 58,
        speed: 55,
        scale: 120,
        blur: 3,
        brightness: 130,
        blendMode: "screen",
      },
    },
    {
      id: "intense",
      name: "Intensywna",
      description: "Jasne i g\u0119ste pasma \u015bwiat\u0142a.",
      settings: {
        opacity: 90,
        density: 95,
        speed: 70,
        scale: 130,
        blur: 2,
        brightness: 170,
        blendMode: "screen",
      },
    },
    {
      id: "fast",
      name: "Szybka zorza",
      description: "Dynamiczne, wyra\u017anie przemieszczaj\u0105ce si\u0119 pasma.",
      settings: {
        opacity: 82,
        density: 72,
        speed: 125,
        scale: 120,
        blur: 2,
        brightness: 150,
        hue: 45,
        blendMode: "screen",
      },
    },
  ],
};

export function getEffectVariants(
  effectId: string,
): EffectVariant[] {
  return effectVariantCatalog[effectId] ?? [];
}

export function findMatchingEffectVariant(
  effectId: string,
  settings: EffectSettings,
): EffectVariant | undefined {
  return getEffectVariants(
    effectId,
  ).find(
    (variant) =>
      Object.entries(
        variant.settings,
      ).every(
        ([key, value]) =>
          settings[
            key as keyof EffectSettings
          ] === value,
      ),
  );
}

'@

$newMain = @'
import "./style.css";

import type {
  EffectInstance,
} from "./core/types";

import {
  createPreview,
  renderEffect,
} from "./editor/preview";

import {
  renderInspector,
} from "./editor/inspector";

import {
  openExportPanel,
  setupExportPanel,
} from "./editor/exportPanel";

import {
  addEffect,
  clearEffects,
  getEditorState,
  moveEffectDown,
  moveEffectUp,
  removeEffect,
  selectEffect,
  subscribe,
  toggleEffect,
} from "./editor/state";

import {
  getAllEffectDefinitions,
  getEffectDefinition,
} from "./effects/registry";

import {
  getEffectVariants,
} from "./effects/variants";

const app =
  document.querySelector<HTMLDivElement>(
    "#app",
  );

if (!app) {
  throw new Error(
    "Nie znaleziono elementu #app.",
  );
}

app.innerHTML = `
  <main class="ae-app-shell">
    <header class="ae-app-header">
      <div class="ae-brand">
        <div class="ae-brand-mark">DEV</div>

        <div class="ae-brand-copy">
          <span class="ae-dev-context">DEV / NARZ\u0118DZIA</span>
          <h1>Animated Effects</h1>
        </div>
      </div>

      <div class="ae-header-status">
        <span
          id="library-summary"
          class="ae-status-pill"
        ></span>

        <span
          id="active-summary"
          class="ae-status-pill"
        ></span>
      </div>

      <div class="ae-header-actions">
        <button
          id="clear-preview"
          class="ae-button ae-button-secondary"
          type="button"
        >
          Wyczy\u015B\u0107 scen\u0119
        </button>

        <button
          id="export-stream-elements"
          class="ae-button ae-button-primary"
          type="button"
        >
          Eksportuj
        </button>
      </div>
    </header>

    <div class="ae-editor-grid">
      <aside class="ae-left-panel">
        <div class="ae-sidebar-tabs" role="tablist">
          <button
            class="ae-sidebar-tab is-active"
            type="button"
            data-sidebar-tab="effects"
            aria-selected="true"
          >
            Efekty
          </button>

          <button
            class="ae-sidebar-tab"
            type="button"
            data-sidebar-tab="layers"
            aria-selected="false"
          >
            Warstwy
            <span id="layer-count" class="ae-tab-count">0</span>
          </button>
        </div>

        <section
          id="effects-sidebar"
          class="ae-sidebar-view is-active"
          data-sidebar-view="effects"
        >
          <div class="ae-sidebar-heading">
            <div>
              <strong>Biblioteka efekt\u00F3w</strong>
              <span id="effect-result-count"></span>
            </div>
          </div>

          <div class="ae-effect-filters">
            <label class="ae-search-wrap">
              <span aria-hidden="true">\u2315</span>
              <input
                id="effect-search"
                type="search"
                placeholder="Szukaj efektu..."
                autocomplete="off"
              >
            </label>

            <select
              id="effect-category"
              class="ae-category-select"
              aria-label="Kategoria efektu"
            ></select>
          </div>

          <div
            id="effect-library"
            class="ae-effect-library"
          ></div>
        </section>

        <section
          id="layers-sidebar"
          class="ae-sidebar-view"
          data-sidebar-view="layers"
          hidden
        >
          <div class="ae-sidebar-heading">
            <div>
              <strong>Warstwy sceny</strong>
              <span>Najwy\u017Csza warstwa jest na g\u00F3rze listy</span>
            </div>
          </div>

          <div
            id="layers-list"
            class="ae-layer-list"
          ></div>
        </section>
      </aside>

      <section class="ae-stage-panel">
        <div class="ae-stage-toolbar">
          <div>
            <strong>Podgl\u0105d</strong>
            <span id="preview-meta"></span>
          </div>

          <div class="ae-stage-hint" title="Proporcje podgl\u0105du">
            16:9
          </div>
        </div>

        <div class="ae-preview-shell">
          <div id="preview-host"></div>
        </div>
      </section>

      <aside class="ae-inspector-panel">
        <div class="ae-panel-heading">
          <div>
            <strong>Ustawienia</strong>
            <span>Parametry zaznaczonej warstwy</span>
          </div>
        </div>

        <div
          id="inspector"
          class="ae-inspector-content"
        ></div>
      </aside>
    </div>
  </main>

  <dialog
    id="stream-elements-export"
    class="export-dialog"
  >
    <div class="export-header">
      <div>
        <strong>StreamElements</strong>
        <span data-export-metrics></span>
      </div>

      <button
        type="button"
        data-export-close
      >
        \u00D7
      </button>
    </div>

    <div class="export-section">
      <div class="export-section-header">
        <strong>HTML</strong>
        <button type="button" data-copy="html">
          Kopiuj
        </button>
      </div>

      <textarea
        data-export="html"
        readonly
      ></textarea>
    </div>

    <div class="export-section">
      <div class="export-section-header">
        <strong>CSS</strong>
        <button type="button" data-copy="css">
          Kopiuj
        </button>
      </div>

      <textarea
        data-export="css"
        readonly
      ></textarea>
    </div>

    <div class="export-section">
      <div class="export-section-header">
        <strong>JavaScript</strong>
        <button type="button" data-copy="javascript">
          Kopiuj
        </button>
      </div>

      <textarea
        data-export="javascript"
        readonly
      ></textarea>
    </div>
  </dialog>
`;

function getRequiredElement<
  T extends HTMLElement
>(
  selector: string,
): T {
  const element =
    document.querySelector<T>(
      selector,
    );

  if (!element) {
    throw new Error(
      `Nie znaleziono elementu: ${selector}`,
    );
  }

  return element;
}

const previewHost =
  getRequiredElement<HTMLElement>(
    "#preview-host",
  );

const layersList =
  getRequiredElement<HTMLElement>(
    "#layers-list",
  );

const layerCount =
  getRequiredElement<HTMLElement>(
    "#layer-count",
  );

const inspector =
  getRequiredElement<HTMLElement>(
    "#inspector",
  );

const effectLibrary =
  getRequiredElement<HTMLElement>(
    "#effect-library",
  );

const effectSearch =
  getRequiredElement<HTMLInputElement>(
    "#effect-search",
  );

const effectCategory =
  getRequiredElement<HTMLSelectElement>(
    "#effect-category",
  );

const effectResultCount =
  getRequiredElement<HTMLElement>(
    "#effect-result-count",
  );

const librarySummary =
  getRequiredElement<HTMLElement>(
    "#library-summary",
  );

const activeSummary =
  getRequiredElement<HTMLElement>(
    "#active-summary",
  );

const previewMeta =
  getRequiredElement<HTMLElement>(
    "#preview-meta",
  );

const exportDialog =
  getRequiredElement<HTMLDialogElement>(
    "#stream-elements-export",
  );

setupExportPanel(
  exportDialog,
);

const preview =
  createPreview(
    previewHost,
  );

const effectDefinitions =
  getAllEffectDefinitions();

let searchQuery = "";
let selectedCategory = "all";

/*
  Range inputs emit "input" many times while dragging.
  State updates re-render the whole editor, so without this guard
  the inspector DOM would be replaced after the first movement and
  the thumb could no longer be dragged continuously.
*/
let isInspectorRangeDragging = false;

const categoryLabels: Record<
  string,
  string
> = {
  calm: "Spokojne",
  energy: "Energia",
  "sci-fi": "Sci-Fi",
  fantasy: "Fantasy",
  steampunk: "Steampunk",
  botanical: "Natura",
  urban: "Urban",
  cosmic: "Kosmos",
  tech: "Tech",
  solar: "Solar",
  retro: "Retro",
  weather: "Pogoda",
  cinematic: "Filmowe",
  abstract: "Abstrakcyjne",
  other: "Inne",
};

function categoryLabel(
  category: string,
): string {
  return (
    categoryLabels[category] ??
    category
  );
}

function effectNumber(
  current: EffectInstance,
): number {
  const sameType =
    getEditorState().effects.filter(
      (effect) =>
        effect.effectId ===
        current.effectId,
    );

  return (
    sameType.findIndex(
      (effect) =>
        effect.instanceId ===
        current.instanceId,
    ) + 1
  );
}

function renderCategoryOptions(): void {
  const categories = [
    ...new Set(
      effectDefinitions.map(
        (definition) =>
          definition.category,
      ),
    ),
  ].sort(
    (a, b) =>
      categoryLabel(a)
        .localeCompare(
          categoryLabel(b),
          "pl",
        ),
  );

  effectCategory.innerHTML = `
    <option value="all">
      Wszystkie kategorie
    </option>

    ${categories
      .map(
        (category) => `
          <option value="${category}">
            ${categoryLabel(category)}
          </option>
        `,
      )
      .join("")}
  `;

  effectCategory.value =
    selectedCategory;
}

function renderEffectLibrary(): void {
  const normalizedQuery =
    searchQuery
      .trim()
      .toLocaleLowerCase("pl");

  const filtered =
    effectDefinitions.filter(
      (definition) => {
        const matchesCategory =
          selectedCategory === "all" ||
          definition.category ===
            selectedCategory;

        if (!matchesCategory) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const searchable = [
          definition.name,
          definition.id,
          definition.description,
          ...definition.tags,
          categoryLabel(
            definition.category,
          ),
        ]
          .join(" ")
          .toLocaleLowerCase("pl");

        return searchable.includes(
          normalizedQuery,
        );
      },
    );

  effectResultCount.textContent =
    `${filtered.length} z ${effectDefinitions.length}`;

  effectLibrary.replaceChildren();

  if (filtered.length === 0) {
    effectLibrary.innerHTML = `
      <div class="ae-empty-state">
        Nie znaleziono efekt\u00F3w dla tych filtr\u00F3w.
      </div>
    `;

    return;
  }

  filtered.forEach(
    (definition) => {
      const button =
        document.createElement(
          "button",
        );

      button.type = "button";
      button.className =
        "ae-effect-card";

      button.title =
        definition.description;

      const performanceLabel =
        `Koszt wydajno\u015Bci: ${definition.performanceCost}/5`;

      const variantCount =
        getEffectVariants(
          definition.id,
        ).length;

      const performanceDots =
        Array.from(
          { length: 5 },
          (_, index) => `
            <i class="${
              index < definition.performanceCost
                ? "is-filled"
                : ""
            }"></i>
          `,
        ).join("");

      button.innerHTML = `
        <span class="ae-effect-card-main">
          <strong>${definition.name}</strong>

          <span class="ae-effect-card-subline">
            <small>
              ${categoryLabel(
                definition.category,
              )}
            </small>

            <span
              class="ae-performance-dots"
              title="${performanceLabel}"
              aria-label="${performanceLabel}"
            >
              ${performanceDots}
            </span>

            ${
              variantCount > 0
                ? `
                  <span
                    class="ae-variant-badge"
                    title="${variantCount} warianty efektu"
                  >
                    ${variantCount}V
                  </span>
                `
                : ""
            }
          </span>
        </span>

        <span
          class="ae-add-icon"
          aria-hidden="true"
        >
          +
        </span>
      `;

      button.addEventListener(
        "click",
        () => {
          addEffect(
            definition.id,
          );
        },
      );

      effectLibrary.appendChild(
        button,
      );
    },
  );
}

function renderPreview(): void {
  preview.replaceChildren();

  const state =
    getEditorState();

  state.effects.forEach(
    (effect) => {
      if (!effect.enabled) {
        return;
      }

      renderEffect(
        preview,
        effect,
      );
    },
  );
}

function renderLayers(): void {
  const state =
    getEditorState();

  layersList.replaceChildren();

  layerCount.textContent =
    String(
      state.effects.length,
    );

  if (
    state.effects.length === 0
  ) {
    layersList.innerHTML = `
      <div class="ae-empty-state">
        Brak warstw.
        <br>
        Przejd\u017A do zak\u0142adki Efekty i dodaj pierwszy efekt.
      </div>
    `;

    return;
  }

  [...state.effects]
    .reverse()
    .forEach(
      (instance) => {
        const definition =
          getEffectDefinition(
            instance.effectId,
          );

        if (!definition) {
          return;
        }

        const row =
          document.createElement(
            "div",
          );

        row.className =
          "ae-layer-row";

        if (!instance.enabled) {
          row.classList.add(
            "is-disabled",
          );
        }

        if (
          state
            .selectedEffectInstanceId ===
          instance.instanceId
        ) {
          row.classList.add(
            "is-selected",
          );
        }

        const number =
          effectNumber(
            instance,
          );

        row.innerHTML = `
          <button
            class="ae-layer-select"
            type="button"
          >
            <span class="ae-layer-color-dot"></span>

            <span class="ae-layer-copy">
              <strong>
                ${definition.name} #${number}
              </strong>

              <small>
                ${categoryLabel(
                  definition.category,
                )}
              </small>
            </span>
          </button>

          <div class="ae-layer-actions">
            <button
              class="ae-icon-button ae-toggle-button layer-toggle"
              type="button"
              title="W\u0142\u0105cz / wy\u0142\u0105cz"
              aria-label="W\u0142\u0105cz lub wy\u0142\u0105cz warstw\u0119"
            >
              ${instance.enabled ? "ON" : "OFF"}
            </button>

            <button
              class="ae-icon-button layer-up"
              type="button"
              title="Przenie\u015B wy\u017Cej"
              aria-label="Przenie\u015B warstw\u0119 wy\u017Cej"
            >
              &#8593;
            </button>

            <button
              class="ae-icon-button layer-down"
              type="button"
              title="Przenie\u015B ni\u017Cej"
              aria-label="Przenie\u015B warstw\u0119 ni\u017Cej"
            >
              &#8595;
            </button>

            <button
              class="ae-icon-button ae-icon-danger layer-remove"
              type="button"
              title="Usu\u0144"
              aria-label="Usu\u0144 warstw\u0119"
            >
              &#215;
            </button>
          </div>
        `;

        row
          .querySelector(
            ".ae-layer-select",
          )
          ?.addEventListener(
            "click",
            () => {
              selectEffect(
                instance.instanceId,
              );
            },
          );

        row
          .querySelector(
            ".layer-toggle",
          )
          ?.addEventListener(
            "click",
            () => {
              toggleEffect(
                instance.instanceId,
              );
            },
          );

        row
          .querySelector(
            ".layer-up",
          )
          ?.addEventListener(
            "click",
            () => {
              moveEffectUp(
                instance.instanceId,
              );
            },
          );

        row
          .querySelector(
            ".layer-down",
          )
          ?.addEventListener(
            "click",
            () => {
              moveEffectDown(
                instance.instanceId,
              );
            },
          );

        row
          .querySelector(
            ".layer-remove",
          )
          ?.addEventListener(
            "click",
            () => {
              removeEffect(
                instance.instanceId,
              );
            },
          );

        layersList.appendChild(
          row,
        );
      },
    );
}

function renderStatus(): void {
  const state =
    getEditorState();

  const activeCount =
    state.effects.filter(
      (effect) => effect.enabled,
    ).length;

  librarySummary.textContent =
    `${effectDefinitions.length} efekt\u00F3w`;

  activeSummary.textContent =
    `Aktywne: ${activeCount} \u00B7 Warstwy: ${state.effects.length}`;

  previewMeta.textContent =
    `${state.resolution.width} \u00D7 ${state.resolution.height} \u00B7 aktywne: ${activeCount}`;
}

function renderEditor(): void {
  renderPreview();
  renderLayers();
  renderStatus();

  if (!isInspectorRangeDragging) {
    renderInspector(
      inspector,
    );
  }
}

function setSidebarTab(
  tab: "effects" | "layers",
): void {
  document
    .querySelectorAll<HTMLButtonElement>(
      "[data-sidebar-tab]",
    )
    .forEach(
      (button) => {
        const isActive =
          button.dataset.sidebarTab ===
          tab;

        button.classList.toggle(
          "is-active",
          isActive,
        );

        button.setAttribute(
          "aria-selected",
          String(isActive),
        );
      },
    );

  document
    .querySelectorAll<HTMLElement>(
      "[data-sidebar-view]",
    )
    .forEach(
      (view) => {
        const isActive =
          view.dataset.sidebarView ===
          tab;

        view.hidden = !isActive;
        view.classList.toggle(
          "is-active",
          isActive,
        );
      },
    );
}

renderCategoryOptions();
renderEffectLibrary();

subscribe(
  renderEditor,
);

/*
  Keep the actual <input type="range"> alive for the whole pointer gesture.
  updateEffectSettings() may re-render preview/layers/status on every "input",
  but the inspector itself is not replaced until pointerup/pointercancel.
*/
inspector.addEventListener(
  "pointerdown",
  (event) => {
    const target = event.target;

    if (
      target instanceof HTMLInputElement &&
      target.type === "range"
    ) {
      isInspectorRangeDragging = true;
    }
  },
);

const finishInspectorRangeDrag = (): void => {
  if (!isInspectorRangeDragging) {
    return;
  }

  isInspectorRangeDragging = false;

  /*
    One final inspector render synchronizes its markup with state
    after the continuous drag has finished.
  */
  renderInspector(
    inspector,
  );
};

window.addEventListener(
  "pointerup",
  finishInspectorRangeDrag,
);

window.addEventListener(
  "pointercancel",
  finishInspectorRangeDrag,
);

effectSearch.addEventListener(
  "input",
  () => {
    searchQuery =
      effectSearch.value;

    renderEffectLibrary();
  },
);

effectCategory.addEventListener(
  "change",
  () => {
    selectedCategory =
      effectCategory.value;

    renderEffectLibrary();
  },
);

document
  .querySelectorAll<HTMLButtonElement>(
    "[data-sidebar-tab]",
  )
  .forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          const tab =
            button.dataset.sidebarTab;

          if (
            tab === "effects" ||
            tab === "layers"
          ) {
            setSidebarTab(tab);
          }
        },
      );
    },
  );

document
  .querySelector<HTMLButtonElement>(
    "#clear-preview",
  )
  ?.addEventListener(
    "click",
    clearEffects,
  );

document
  .querySelector<HTMLButtonElement>(
    "#export-stream-elements",
  )
  ?.addEventListener(
    "click",
    () => {
      openExportPanel(
        exportDialog,
      );
    },
  );

addEffect(
  "rainfall",
);

'@

$newInspector = @'
import type {
  EffectSettings,
} from "../core/types";

import {
  getSelectedEffect,
  updateEffectSettings,
} from "./state";

import {
  getEffectDefinition,
} from "../effects/registry";

import {
  findMatchingEffectVariant,
  getEffectVariants,
} from "../effects/variants";

type NumericSettingKey =
  | "opacity"
  | "density"
  | "speed"
  | "scale"
  | "x"
  | "y"
  | "rotation"
  | "blur"
  | "brightness"
  | "hue"
  | "intensity";

interface RangeField {
  key: NumericSettingKey;
  label: string;
  min: number;
  max: number;
  step?: number;
  suffix: string;
}

interface InspectorGroup {
  id: string;
  title: string;
  description: string;
  fields: RangeField[];
}

const collapsedGroups =
  new Set<string>();

const opacityField: RangeField = {
  key: "opacity",
  label: "Krycie",
  min: 0,
  max: 100,
  suffix: "%",
};

const densityField: RangeField = {
  key: "density",
  label: "G\u0119sto\u015B\u0107",
  min: 10,
  max: 100,
  suffix: "%",
};

const speedField: RangeField = {
  key: "speed",
  label: "Pr\u0119dko\u015B\u0107",
  min: 20,
  max: 300,
  suffix: "%",
};

const accelerationField: RangeField = {
  key: "intensity",
  label: "Przyspieszenie",
  min: 0,
  max: 100,
  suffix: "%",
};

const scaleField: RangeField = {
  key: "scale",
  label: "Skala",
  min: 25,
  max: 250,
  suffix: "%",
};

const xField: RangeField = {
  key: "x",
  label: "Pozycja X",
  min: -100,
  max: 100,
  suffix: "%",
};

const yField: RangeField = {
  key: "y",
  label: "Pozycja Y",
  min: -100,
  max: 100,
  suffix: "%",
};

const rotationField: RangeField = {
  key: "rotation",
  label: "Obr\u00F3t",
  min: -180,
  max: 180,
  suffix: "\u00B0",
};

const blurField: RangeField = {
  key: "blur",
  label: "Rozmycie",
  min: 0,
  max: 30,
  suffix: "px",
};

const brightnessField: RangeField = {
  key: "brightness",
  label: "Jasno\u015B\u0107",
  min: 25,
  max: 250,
  suffix: "%",
};

const hueField: RangeField = {
  key: "hue",
  label: "Odcie\u0144",
  min: -180,
  max: 180,
  suffix: "\u00B0",
};

function rangeTemplate(
  field: RangeField,
  settings: EffectSettings,
): string {
  const value = settings[field.key];

  return `
    <label class="inspector-field">
      <span class="inspector-label">
        <span>${field.label}</span>

        <output
          data-output="${field.key}"
          aria-live="off"
        >
          ${value}${field.suffix}
        </output>
      </span>

      <input
        type="range"
        min="${field.min}"
        max="${field.max}"
        step="${field.step ?? 1}"
        value="${value}"
        data-setting="${field.key}"
        data-suffix="${field.suffix}"
        aria-label="${field.label}"
      >
    </label>
  `;
}

function groupTemplate(
  group: InspectorGroup,
  settings: EffectSettings,
): string {
  const collapsed =
    collapsedGroups.has(
      group.id,
    );

  return `
    <section
      class="inspector-group ${
        collapsed
          ? "is-collapsed"
          : ""
      }"
    >
      <button
        class="inspector-group-toggle"
        type="button"
        data-inspector-group-toggle="${group.id}"
        aria-expanded="${String(!collapsed)}"
      >
        <span class="inspector-group-heading">
          <strong>${group.title}</strong>
          <span>${group.description}</span>
        </span>

        <span
          class="inspector-group-chevron"
          aria-hidden="true"
        ></span>
      </button>

      <div
        class="inspector-group-fields"
        ${collapsed ? "hidden" : ""}
      >
        ${group.fields
          .map(
            (field) =>
              rangeTemplate(
                field,
                settings,
              ),
          )
          .join("")}
      </div>
    </section>
  `;
}

export function renderInspector(
  container: HTMLElement,
): void {
  const selected =
    getSelectedEffect();

  if (!selected) {
    container.innerHTML = `
      <div class="inspector-empty">
        <strong>Brak zaznaczonej warstwy</strong>
        <span>
          Wybierz warstw\u0119 po lewej stronie albo dodaj nowy efekt.
        </span>
      </div>
    `;

    return;
  }

  const definition =
    getEffectDefinition(
      selected.effectId,
    );

  if (!definition) {
    container.innerHTML = `
      <div class="inspector-empty">
        Nie znaleziono definicji efektu.
      </div>
    `;

    return;
  }

  const variants =
    getEffectVariants(
      selected.effectId,
    );

  const matchingVariant =
    findMatchingEffectVariant(
      selected.effectId,
      selected.settings,
    );

  const primaryFields = [
    opacityField,
    densityField,
    speedField,
  ];

  if (
    selected.effectId === "pong"
  ) {
    primaryFields.push(
      accelerationField,
    );
  }

  const groups: InspectorGroup[] = [
    {
      id: "primary",
      title: "Podstawowe",
      description:
        "Widoczno\u015B\u0107, liczba element\u00F3w i tempo animacji",
      fields: primaryFields,
    },
    {
      id: "transform",
      title: "Transformacja",
      description:
        "Rozmiar, pozycja i obr\u00F3t ca\u0142ej warstwy",
      fields: [
        scaleField,
        xField,
        yField,
        rotationField,
      ],
    },
    {
      id: "appearance",
      title: "Wygl\u0105d",
      description:
        "Rozmycie, jasno\u015B\u0107 i przesuni\u0119cie barwy",
      fields: [
        blurField,
        brightnessField,
        hueField,
      ],
    },
  ];

  container.innerHTML = `
    <div class="inspector-title">
      <div class="inspector-title-copy">
        <strong>
          ${definition.name}
        </strong>

        <span>
          ${selected.effectId}
        </span>
      </div>

      <button
        class="inspector-reset-button"
        type="button"
        data-inspector-reset
      >
        Resetuj
      </button>
    </div>

    ${
      variants.length > 0
        ? `
          <section class="inspector-variant-panel">
            <div class="inspector-variant-heading">
              <div>
                <strong>Wariant</strong>
                <span>
                  Gotowy styl bazowy efektu
                </span>
              </div>

              <span class="inspector-variant-count">
                ${variants.length}
              </span>
            </div>

            <select
              class="inspector-variant-select"
              data-effect-variant
              aria-label="Wariant efektu"
            >
              <option value="">
                W\u0142asny / r\u0119czny
              </option>

              ${variants
                .map(
                  (variant) => `
                    <option
                      value="${variant.id}"
                      ${
                        matchingVariant?.id === variant.id
                          ? "selected"
                          : ""
                      }
                    >
                      ${variant.name}
                    </option>
                  `,
                )
                .join("")}
            </select>

            <p class="inspector-variant-description">
              ${
                matchingVariant?.description ??
                "Wybierz wariant, aby zastosowa\u0107 gotowy zestaw parametr\u00F3w. Potem mo\u017Cesz dalej zmienia\u0107 suwaki."
              }
            </p>
          </section>
        `
        : ""
    }

    ${groups
      .map(
        (group) =>
          groupTemplate(
            group,
            selected.settings,
          ),
      )
      .join("")}

    <section
      class="inspector-group ${
        collapsedGroups.has("composition")
          ? "is-collapsed"
          : ""
      }"
    >
      <button
        class="inspector-group-toggle"
        type="button"
        data-inspector-group-toggle="composition"
        aria-expanded="${String(
          !collapsedGroups.has("composition"),
        )}"
      >
        <span class="inspector-group-heading">
          <strong>Kompozycja</strong>
          <span>
            Spos\u00F3b \u0142\u0105czenia warstwy z pozosta\u0142ymi
          </span>
        </span>

        <span
          class="inspector-group-chevron"
          aria-hidden="true"
        ></span>
      </button>

      <div
        class="inspector-group-fields"
        ${
          collapsedGroups.has("composition")
            ? "hidden"
            : ""
        }
      >
        <label class="inspector-field">
          <span class="inspector-label">
            <span>Tryb mieszania</span>
          </span>

          <select data-setting="blendMode">
            <option value="normal">Normalny</option>
            <option value="screen">Ekran</option>
            <option value="lighten">Rozja\u015Bnianie</option>
            <option value="multiply">Mno\u017Cenie</option>
            <option value="overlay">Nak\u0142adka</option>
          </select>
        </label>

        <label class="inspector-field">
          <span class="inspector-label">
            <span>Obszar</span>
          </span>

          <select data-setting="area">
            <option value="full">Ca\u0142o\u015B\u0107</option>
            <option value="left">Lewa strona</option>
            <option value="center">\u015Arodek</option>
            <option value="right">Prawa strona</option>
            <option value="top">G\u00F3ra</option>
            <option value="bottom">D\u00F3\u0142</option>
          </select>
        </label>
      </div>
    </section>
  `;

  const blendModeSelect =
    container.querySelector<HTMLSelectElement>(
      '[data-setting="blendMode"]',
    );

  if (blendModeSelect) {
    blendModeSelect.value =
      selected.settings.blendMode;
  }

  const areaSelect =
    container.querySelector<HTMLSelectElement>(
      '[data-setting="area"]',
    );

  if (areaSelect) {
    areaSelect.value =
      selected.settings.area;
  }

  container
    .querySelectorAll<HTMLButtonElement>(
      "[data-inspector-group-toggle]",
    )
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            const groupId =
              button.dataset
                .inspectorGroupToggle;

            if (!groupId) {
              return;
            }

            if (
              collapsedGroups.has(
                groupId,
              )
            ) {
              collapsedGroups.delete(
                groupId,
              );
            } else {
              collapsedGroups.add(
                groupId,
              );
            }

            renderInspector(
              container,
            );
          },
        );
      },
    );

  const variantSelect =
    container.querySelector<HTMLSelectElement>(
      "[data-effect-variant]",
    );

  variantSelect?.addEventListener(
    "change",
    () => {
      const variant =
        variants.find(
          (item) =>
            item.id ===
            variantSelect.value,
        );

      if (!variant) {
        return;
      }

      updateEffectSettings(
        selected.instanceId,
        {
          ...variant.settings,
        },
      );
    },
  );

  container
    .querySelectorAll<HTMLInputElement>(
      'input[type="range"][data-setting]',
    )
    .forEach((input) => {
      input.addEventListener(
        "input",
        () => {
          const key =
            input.dataset.setting as
              NumericSettingKey;

          const value =
            Number(input.value);

          const output =
            container.querySelector<HTMLOutputElement>(
              `[data-output="${key}"]`,
            );

          if (output) {
            output.value =
              `${value}${input.dataset.suffix ?? ""}`;
          }

          updateEffectSettings(
            selected.instanceId,
            {
              [key]: value,
            } as Partial<EffectSettings>,
          );
        },
      );
    });

  blendModeSelect?.addEventListener(
    "change",
    () => {
      updateEffectSettings(
        selected.instanceId,
        {
          blendMode:
            blendModeSelect.value as
              EffectSettings["blendMode"],
        },
      );
    },
  );

  areaSelect?.addEventListener(
    "change",
    () => {
      updateEffectSettings(
        selected.instanceId,
        {
          area:
            areaSelect.value as
              EffectSettings["area"],
        },
      );
    },
  );

  container
    .querySelector<HTMLButtonElement>(
      "[data-inspector-reset]",
    )
    ?.addEventListener(
      "click",
      () => {
        updateEffectSettings(
          selected.instanceId,
          {
            ...definition.defaultSettings,
          },
        );
      },
    );
}

'@

$variantCss = @'
/* === AE_EFFECT_VARIANTS_UI_START === */

.inspector-variant-panel {
  display: grid;

  gap: 8px;

  margin-bottom: 8px;
  padding: 10px;

  border:
    1px solid
    rgba(124, 92, 255, 0.24);

  border-radius: 9px;

  background:
    linear-gradient(
      180deg,
      rgba(124, 92, 255, 0.075),
      rgba(124, 92, 255, 0.025)
    );
}

.inspector-variant-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 10px;
}

.inspector-variant-heading > div {
  min-width: 0;

  display: grid;

  gap: 2px;
}

.inspector-variant-heading strong {
  color: #e7e2ff;

  font-size: 9.5px;
  font-weight: 760;
}

.inspector-variant-heading span {
  color: #6f7e94;

  font-size: 8px;
}

.inspector-variant-count {
  min-width: 20px;
  height: 20px;

  display: grid;
  place-items: center;

  padding: 0 5px;

  border:
    1px solid
    rgba(124, 92, 255, 0.22);

  border-radius: 6px;

  background:
    rgba(124, 92, 255, 0.09);

  color: #bfb4ff !important;

  font-size: 8px !important;
  font-weight: 760;
}

.inspector-variant-select {
  width: 100%;
  height: 34px;

  padding:
    0
    34px
    0
    10px;

  border:
    1px solid
    rgba(255, 255, 255, 0.09);

  border-radius: 8px;

  background-color: #151b27;
  color: #eef3ff;

  font-size: 9.5px;
  font-weight: 680;

  cursor: pointer;
}

.inspector-variant-select:hover {
  border-color:
    rgba(124, 92, 255, 0.38);
}

.inspector-variant-select:focus-visible {
  outline:
    2px solid
    rgba(124, 92, 255, 0.48);

  outline-offset: 2px;
}

.inspector-variant-description {
  min-height: 24px;

  margin: 0;

  color: #77869b;

  font-size: 8.5px;
  line-height: 1.45;
}


.ae-variant-badge {
  flex: 0 0 auto;

  padding: 2px 5px;

  border:
    1px solid
    rgba(124, 92, 255, 0.18);

  border-radius: 5px;

  background:
    rgba(124, 92, 255, 0.07);

  color: #9f92f0;

  font-size: 7.5px;
  font-weight: 760;

  line-height: 1.2;
}

/* === AE_EFFECT_VARIANTS_UI_END === */

'@

$currentStyle =
  [System.IO.File]::ReadAllText(
    $stylePath
  )

$startMarker =
  "/* === AE_EFFECT_VARIANTS_UI_START === */"

$endMarker =
  "/* === AE_EFFECT_VARIANTS_UI_END === */"

$start =
  $currentStyle.IndexOf(
    $startMarker
  )

$end =
  $currentStyle.IndexOf(
    $endMarker
  )

if (
  $start -ge 0 -and
  $end -gt $start
) {
  $end +=
    $endMarker.Length

  $before = (
    $currentStyle.Substring(
      0,
      $start
    )
  ).TrimEnd()

  $after = (
    $currentStyle.Substring(
      $end
    )
  ).TrimStart()

  $newStyle =
    $before +
    "`r`n`r`n" +
    $variantCss.Trim() +
    "`r`n"

  if ($after.Length -gt 0) {
    $newStyle +=
      "`r`n" +
      $after
  }
}
else {
  $newStyle =
    $currentStyle.TrimEnd() +
    "`r`n`r`n" +
    $variantCss.Trim() +
    "`r`n"
}

$utf8NoBom =
  New-Object
    System.Text.UTF8Encoding(
      $false
    )

[System.IO.File]::WriteAllText(
  $variantsPath,
  $newVariants,
  $utf8NoBom
)

[System.IO.File]::WriteAllText(
  $mainPath,
  $newMain,
  $utf8NoBom
)

[System.IO.File]::WriteAllText(
  $inspectorPath,
  $newInspector,
  $utf8NoBom
)

[System.IO.File]::WriteAllText(
  $stylePath,
  $newStyle,
  $utf8NoBom
)

Push-Location
  $ProjectRoot

try {
  Write-Host "Uruchamiam TypeScript check..." -ForegroundColor Cyan

  & npx.cmd tsc --noEmit

  if ($LASTEXITCODE -ne 0) {
    throw "TypeScript check failed"
  }

  Write-Host "TypeScript: PASS" -ForegroundColor Green
  Write-Host "Uruchamiam build..." -ForegroundColor Cyan

  & npm.cmd run build

  if ($LASTEXITCODE -ne 0) {
    throw "Build failed"
  }

  Write-Host ""
  Write-Host "BUILD: PASS" -ForegroundColor Green
  Write-Host ""
  Write-Host "Variants Pack 01 zainstalowany." -ForegroundColor Green
  Write-Host "Zakres:"
  Write-Host "  - 29 efektow"
  Write-Host "  - 4 warianty na kazdy efekt"
  Write-Host "  - 116 wariantow lacznie"
  Write-Host "  - dropdown Wariant w Inspectorze"
  Write-Host "  - opis wybranego wariantu"
  Write-Host "  - oznaczenie 4V na kartach efektow"
  Write-Host "  - reczne suwaki nadal dzialaja po wybraniu wariantu"
  Write-Host "  - eksport korzysta z ustawien wariantu automatycznie"
  Write-Host ""
  Write-Host "Odswiez aktywny localhost z Vite."
}
catch {
  Write-Host ""
  Write-Host "Walidacja nie przeszla. Przywracam backup..." -ForegroundColor Red

  Copy-Item
    $mainBackup
    $mainPath
    -Force

  Copy-Item
    $inspectorBackup
    $inspectorPath
    -Force

  Copy-Item
    $styleBackup
    $stylePath
    -Force

  if ($hadVariants) {
    Copy-Item
      $variantsBackup
      $variantsPath
      -Force
  }
  elseif (Test-Path $variantsPath) {
    Remove-Item
      $variantsPath
      -Force
  }

  Write-Host "Przywrocono poprzednie pliki." -ForegroundColor Yellow

  throw
}
finally {
  Pop-Location
}
