param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$stylePath = Join-Path $ProjectRoot "src\style.css"
$packageJson = Join-Path $ProjectRoot "package.json"

if (!(Test-Path $stylePath) -or !(Test-Path $packageJson)) {
  throw "Uruchom ten skrypt w katalogu glownym projektu animated-effects."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $ProjectRoot ".animated-effects-backup\$stamp\src"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Copy-Item $stylePath (Join-Path $backupDir "style.css") -Force

$startMarker = "/* === AE_LAYOUT_FIX_START === */"
$endMarker   = "/* === AE_LAYOUT_FIX_END === */"

$fix = @'
/* === AE_LAYOUT_FIX_START === */

/*
  Stabilny viewport edytora:
  liczba warstw nie moze zwiekszac wysokosci workspace.
  Panele boczne przewijaja sie niezaleznie.
*/
html,
body,
#app {
  height: 100%;
  min-height: 0;
}

body {
  height: 100vh;
  min-height: 0;
  overflow: hidden;
}

.editor {
  height: 100vh;
  min-height: 0;
  overflow: hidden;

  grid-template-rows:
    auto
    minmax(0, 1fr);
}

.workspace {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.layers-panel,
.inspector-panel,
.preview-shell {
  min-height: 0;
}

.layers-panel,
.inspector-panel {
  overflow-y: auto;
  overscroll-behavior: contain;
}

.preview-shell {
  overflow: hidden;
}

#preview-host {
  max-width: 100%;
}

/* === AE_LAYOUT_FIX_END === */
'@

$content = Get-Content -Raw -Path $stylePath

$start = $content.IndexOf($startMarker)
$end = $content.IndexOf($endMarker)

if ($start -ge 0 -and $end -gt $start) {
  $end += $endMarker.Length
  $before = $content.Substring(0, $start).TrimEnd()
  $after = $content.Substring($end).TrimStart()
  $content = $before + "`r`n`r`n" + $fix.Trim() + "`r`n"
  if ($after.Length -gt 0) {
    $content += "`r`n" + $after
  }
} else {
  $content = $content.TrimEnd() + "`r`n`r`n" + $fix.Trim() + "`r`n"
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($stylePath, $content, $utf8NoBom)

Write-Host ""
Write-Host "Layout fix zapisany." -ForegroundColor Green
Write-Host "Backup: $backupDir\style.css"
Write-Host ""
Write-Host "Uruchamiam TypeScript check..." -ForegroundColor Cyan

Push-Location $ProjectRoot

try {
  & npx.cmd tsc --noEmit
  if ($LASTEXITCODE -ne 0) {
    throw "npx tsc --noEmit zakonczyl sie bledem."
  }

  Write-Host "TypeScript: PASS" -ForegroundColor Green
  Write-Host "Uruchamiam build..." -ForegroundColor Cyan

  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) {
    throw "npm run build zakonczyl sie bledem."
  }

  Write-Host "BUILD: PASS" -ForegroundColor Green
  Write-Host ""
  Write-Host "Gotowe. Odswiez localhost:5175." -ForegroundColor Green
  Write-Host "Panel Warstwy powinien teraz przewijac sie niezaleznie,"
  Write-Host "a preview pozostac na stalej wysokosci."
}
finally {
  Pop-Location
}
