param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$packageJson = Join-Path $ProjectRoot "package.json"
$stylePath = Join-Path $ProjectRoot "src\style.css"

if (!(Test-Path $packageJson) -or !(Test-Path $stylePath)) {
  throw "Uruchom ten skrypt w katalogu glownym projektu animated-effects."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $ProjectRoot ".animated-effects-backup\$stamp"
$styleBackup = Join-Path $backupRoot "src\style.css"
$backupDir = Split-Path $styleBackup -Parent

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Copy-Item $stylePath $styleBackup -Force

Write-Host ""
Write-Host "Animated Effects - Square Preview Fix" -ForegroundColor Cyan
Write-Host "Backup: $backupRoot"
Write-Host ""

$currentStyle = [System.IO.File]::ReadAllText($stylePath)

$startMarker = "/* === AE_SQUARE_PREVIEW_START === */"
$endMarker = "/* === AE_SQUARE_PREVIEW_END === */"

$fix = @'
/* === AE_SQUARE_PREVIEW_START === */

/*
  Podglad reprezentuje prostokatny canvas OBS/StreamElements.
  Bez zaokraglonych rogow takze wtedy, gdy scena jest pusta.
*/
.effect-preview {
  border-radius: 0 !important;
}

#preview-host {
  border-radius: 0 !important;
}

/* === AE_SQUARE_PREVIEW_END === */
'@

$start = $currentStyle.IndexOf($startMarker)
$end = $currentStyle.IndexOf($endMarker)

if ($start -ge 0 -and $end -gt $start) {
  $end += $endMarker.Length
  $before = ($currentStyle.Substring(0, $start)).TrimEnd()
  $after = ($currentStyle.Substring($end)).TrimStart()

  $newStyle = $before + "`r`n`r`n" + $fix.Trim() + "`r`n"

  if ($after.Length -gt 0) {
    $newStyle += "`r`n" + $after
  }
}
else {
  $newStyle = $currentStyle.TrimEnd() + "`r`n`r`n" + $fix.Trim() + "`r`n"
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($stylePath, $newStyle, $utf8NoBom)

Push-Location $ProjectRoot

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
  Write-Host "Usunieto zaokraglenie podgladu." -ForegroundColor Green
  Write-Host "Pusta i aktywna scena maja teraz prostokatne rogi."
  Write-Host ""
  Write-Host "Odswiez aktywny localhost z Vite."
}
catch {
  Write-Host ""
  Write-Host "Walidacja nie przeszla. Przywracam backup..." -ForegroundColor Red
  Copy-Item $styleBackup $stylePath -Force
  Write-Host "Przywrocono poprzedni style.css." -ForegroundColor Yellow
  throw
}
finally {
  Pop-Location
}
