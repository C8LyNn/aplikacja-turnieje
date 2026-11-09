param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$packageJson =
  Join-Path
    $ProjectRoot
    "package.json"

$effectPath =
  Join-Path
    $ProjectRoot
    "src\effects\effectModules.ts"

if (
  !(Test-Path $packageJson) -or
  !(Test-Path $effectPath)
) {
  throw "Uruchom ten skrypt w katalogu glownym projektu animated-effects."
}

$currentEffects =
  [System.IO.File]::ReadAllText(
    $effectPath
  )

if (
  !$currentEffects.Contains(
    'id: "runes"'
  )
) {
  throw "Nie znaleziono efektu Runes. Nie nadpisuje pliku."
}

$stamp =
  Get-Date
    -Format
    "yyyyMMdd-HHmmss"

$backupRoot =
  Join-Path
    $ProjectRoot
    ".animated-effects-backup\$stamp"

$effectBackup =
  Join-Path
    $backupRoot
    "src\effects\effectModules.ts"

New-Item
  -ItemType Directory
  -Force
  -Path (
    Split-Path
      $effectBackup
      -Parent
  ) |
  Out-Null

Copy-Item
  $effectPath
  $effectBackup
  -Force

Write-Host ""
Write-Host "Animated Effects - Real Runes Fix" -ForegroundColor Cyan
Write-Host "Backup: $backupRoot"
Write-Host ""

$newRunesCss = @'
const runesCss = `
.ae-rune {
  position: absolute;

  color: rgba(176, 124, 255, .96);

  font-family:
    "Segoe UI Historic",
    "Noto Sans Runic",
    "Segoe UI Symbol",
    sans-serif;

  font-weight: 600;
  font-style: normal;
  font-variant-ligatures: none;

  line-height: 1;

  text-shadow:
    0 0 7px rgba(190, 135, 255, .95),
    0 0 18px rgba(135, 90, 255, .72),
    0 0 30px rgba(80, 210, 255, .28);

  animation:
    ae-rune-float
    9s
    ease-in-out
    infinite;

  user-select: none;
  pointer-events: none;

  will-change:
    transform,
    opacity;
}

@keyframes ae-rune-float {
  0%,
  100% {
    transform:
      translate(0, 0)
      rotate(-8deg)
      scale(.86);

    opacity: .24;
  }

  50% {
    transform:
      translate(
        var(--ae-rune-x, 24px),
        var(--ae-rune-y, -34px)
      )
      rotate(10deg)
      scale(1.10);

    opacity: 1;
  }
}
`.trim();
'@

$newRunesModule = @'
const runes: EffectModule = {
  definition: makeDefinition({
    id: "runes",
    name: "Runes",
    description:
      "\u015Awiec\u0105ce runy Elder Futhark unosz\u0105ce si\u0119 w tle.",
    category: "fantasy",
    tags: [
      "runes",
      "elder-futhark",
      "magic",
      "fantasy",
      "symbols",
    ],
    defaultSettings: {
      ...defaultSettings,
      opacity: 78,
      density: 50,
      speed: 55,
      blendMode: "screen",
    },
    performanceCost: 2,
    requiresJavaScript: true,
  }),

  css: runesCss,

  streamElementsRendererName:
    "aeRenderRunes",

  renderPreview(
    layer,
    settings,
    random,
  ) {
    const chars = ["\u16A0","\u16A2","\u16A6","\u16A8","\u16B1","\u16B2","\u16B7","\u16B9","\u16BA","\u16BE","\u16C1","\u16C3","\u16C7","\u16C8","\u16C9","\u16CA","\u16CF","\u16D2","\u16D6","\u16D7","\u16DA","\u16DC","\u16DE","\u16DF"];

    const count =
      particleCount(
        24,
        settings,
        1,
      );

    const speed =
      Math.max(
        .1,
        settings.speed / 100,
      );

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const rune =
        document.createElement(
          "span",
        );

      rune.className =
        "ae-rune";

      rune.textContent =
        chars[
          Math.floor(
            random() *
              chars.length,
          )
        ] ?? "\u16A0";

      rune.style.left =
        `${random() * 95}%`;

      rune.style.top =
        `${random() * 92}%`;

      rune.style.fontSize =
        `${18 + random() * 36}px`;

      rune.style.animationDelay =
        `${-random() * 9}s`;

      rune.style.animationDuration =
        `${
          (6 + random() * 7) /
          speed
        }s`;

      rune.style.setProperty(
        "--ae-rune-x",
        `${
          -45 +
          random() * 90
        }px`,
      );

      rune.style.setProperty(
        "--ae-rune-y",
        `${
          -55 +
          random() * 110
        }px`,
      );

      layer.appendChild(
        rune,
      );
    }
  },

  streamElementsRendererSource: `
function aeRenderRunes(effect, root) {
  const layer =
    aeCreateLayer(
      effect,
      root
    );

  const random =
    aeCreateSeededRandom(
      effect.seed
    );

  const s =
    effect.settings;

  const chars = ["\\u16A0","\\u16A2","\\u16A6","\\u16A8","\\u16B1","\\u16B2","\\u16B7","\\u16B9","\\u16BA","\\u16BE","\\u16C1","\\u16C3","\\u16C7","\\u16C8","\\u16C9","\\u16CA","\\u16CF","\\u16D2","\\u16D6","\\u16D7","\\u16DA","\\u16DC","\\u16DE","\\u16DF"];

  const count =
    Math.max(
      1,
      Math.round(
        24 *
        (s.density / 100)
      )
    );

  const speed =
    Math.max(
      .1,
      s.speed / 100
    );

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const rune =
      document.createElement(
        "span"
      );

    rune.className =
      "ae-rune";

    rune.textContent =
      chars[
        Math.floor(
          random() *
          chars.length
        )
      ] || "\\u16A0";

    rune.style.left =
      random() * 95 +
      "%";

    rune.style.top =
      random() * 92 +
      "%";

    rune.style.fontSize =
      (
        18 +
        random() * 36
      ) +
      "px";

    rune.style.animationDelay =
      -random() * 9 +
      "s";

    rune.style.animationDuration =
      (
        (
          6 +
          random() * 7
        ) /
        speed
      ) +
      "s";

    rune.style.setProperty(
      "--ae-rune-x",
      (
        -45 +
        random() * 90
      ) +
      "px"
    );

    rune.style.setProperty(
      "--ae-rune-y",
      (
        -55 +
        random() * 110
      ) +
      "px"
    );

    rune.style.fontFamily =
      '"Segoe UI Historic", "Noto Sans Runic", "Segoe UI Symbol", sans-serif';

    layer.appendChild(
      rune
    );
  }
}
`.trim(),

  estimateDomNodes(
    settings,
  ) {
    return particleCount(
      24,
      settings,
      1,
    );
  },
};
'@

$cssPattern =
  '(?s)const runesCss = `.*?`\.trim\(\);\s*(?=const magicDustCss = `)'

$modulePattern =
  '(?s)const runes: EffectModule = \{.*?\n\};\s*(?=const magicDust: EffectModule = \{)'

$afterCss =
  [regex]::Replace(
    $currentEffects,
    $cssPattern,
    $newRunesCss.Trim() +
      "`r`n`r`n",
    1
  )

if ($afterCss -eq $currentEffects) {
  throw "Nie udalo sie znalezc bloku CSS efektu Runes."
}

$afterModule =
  [regex]::Replace(
    $afterCss,
    $modulePattern,
    $newRunesModule.Trim() +
      "`r`n`r`n",
    1
  )

if ($afterModule -eq $afterCss) {
  throw "Nie udalo sie znalezc modulu efektu Runes."
}

$utf8NoBom =
  New-Object
    System.Text.UTF8Encoding(
      $false
    )

[System.IO.File]::WriteAllText(
  $effectPath,
  $afterModule,
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
  Write-Host "Real Runes Fix zainstalowany." -ForegroundColor Green
  Write-Host "Zmiany:"
  Write-Host "  - 24 znaki Elder Futhark"
  Write-Host "  - runy zapisane przez Unicode escape, bez mojibake"
  Write-Host "  - font stack z Segoe UI Historic"
  Write-Host "  - poprawka obejmuje preview i StreamElements export"
  Write-Host ""
  Write-Host "Odswiez localhost i dodaj nowa warstwe Runes."
}
catch {
  Write-Host ""
  Write-Host "Walidacja nie przeszla. Przywracam backup..." -ForegroundColor Red

  Copy-Item
    $effectBackup
    $effectPath
    -Force

  Write-Host "Przywrocono poprzedni effectModules.ts." -ForegroundColor Yellow

  throw
}
finally {
  Pop-Location
}
