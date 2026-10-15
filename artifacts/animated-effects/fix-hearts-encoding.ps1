param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$packageJson = Join-Path $ProjectRoot "package.json"
$effectPath = Join-Path $ProjectRoot "src\effects\effectModules.ts"

if (!(Test-Path $packageJson) -or !(Test-Path $effectPath)) {
  throw "Uruchom ten skrypt w katalogu glownym projektu animated-effects."
}

$currentEffects = [System.IO.File]::ReadAllText($effectPath)

if (!$currentEffects.Contains('id: "hearts"')) {
  throw "Nie znaleziono efektu Hearts. Nie nadpisuje pliku."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $ProjectRoot ".animated-effects-backup\$stamp"
$effectBackup = Join-Path $backupRoot "src\effects\effectModules.ts"
$backupDir = Split-Path $effectBackup -Parent

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Copy-Item $effectPath $effectBackup -Force

Write-Host ""
Write-Host "Animated Effects - Hearts Encoding Fix" -ForegroundColor Cyan
Write-Host "Backup: $backupRoot"
Write-Host ""

# ASCII-only HTML entity avoids future UTF-8/mojibake corruption.
$pattern = 'heart\.textContent\s*=\s*"[^"]*";'
$replacement = 'heart.innerHTML = "&#10084;";'

$matches = [regex]::Matches($currentEffects, $pattern)

if ($matches.Count -lt 2) {
  throw "Nie znaleziono obu rendererow Hearts (preview + StreamElements)."
}

$fixedEffects = [regex]::Replace(
  $currentEffects,
  $pattern,
  $replacement
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText(
  $effectPath,
  $fixedEffects,
  $utf8NoBom
)

Push-Location $ProjectRoot

try {
  Write-Host "Naprawiono wystapienia Hearts: $($matches.Count)" -ForegroundColor Cyan
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
  Write-Host "Hearts naprawione." -ForegroundColor Green
  Write-Host "Serce jest teraz generowane z encji HTML &#10084;."
  Write-Host "Poprawka obejmuje preview i eksport StreamElements."
  Write-Host ""
  Write-Host "Odswiez localhost i przetestuj Hearts ponownie."
}
catch {
  Write-Host ""
  Write-Host "Walidacja nie przeszla. Przywracam backup..." -ForegroundColor Red
  Copy-Item $effectBackup $effectPath -Force
  Write-Host "Przywrocono poprzedni effectModules.ts." -ForegroundColor Yellow
  throw
}
finally {
  Pop-Location
}
