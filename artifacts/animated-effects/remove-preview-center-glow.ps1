param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'

$packageJson = Join-Path $ProjectRoot 'package.json'
$stylePath = Join-Path $ProjectRoot 'src\style.css'

if (!(Test-Path $packageJson) -or !(Test-Path $stylePath)) {
  throw 'Uruchom ten skrypt w katalogu glownym projektu animated-effects.'
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupRoot = Join-Path $ProjectRoot ".animated-effects-backup\\$stamp"
$styleBackup = Join-Path $backupRoot 'src\style.css'
$backupDir = Split-Path $styleBackup -Parent
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Copy-Item $stylePath $styleBackup -Force

Write-Host ''
Write-Host 'Animated Effects - Remove Preview Center Glow' -ForegroundColor Cyan
Write-Host "Backup: $backupRoot"
Write-Host ''

$currentStyle = [System.IO.File]::ReadAllText($stylePath)

$startMarker = '/* === AE_REMOVE_CENTER_GLOW_START === */'
$endMarker = '/* === AE_REMOVE_CENTER_GLOW_END === */'

$patch = @'
/* === AE_REMOVE_CENTER_GLOW_START === */

/*
  Usuwa centralna jasna poswiate z pustego / aktywnego preview.
  Zostawia ciemne tlo bez bialego kola na srodku.
*/
.effect-preview {
  background: #050914 !important;
}

/* === AE_REMOVE_CENTER_GLOW_END === */
'@

$existingStart = $currentStyle.IndexOf($startMarker)
$existingEnd = $currentStyle.IndexOf($endMarker)

if ($existingStart -ge 0 -and $existingEnd -gt $existingStart) {
  $existingEnd += $endMarker.Length
  $before = ($currentStyle.Substring(0, $existingStart)).TrimEnd()
  $after = ($currentStyle.Substring($existingEnd)).TrimStart()
  $newStyle = $before + "`r`n`r`n" + $patch.Trim() + "`r`n"
  if ($after.Length -gt 0) {
    $newStyle += "`r`n" + $after
  }
} else {
  $newStyle = $currentStyle.TrimEnd() + "`r`n`r`n" + $patch.Trim() + "`r`n"
}

# Dodatkowo usun stary radial-gradient, jezeli jeszcze siedzi bezposrednio w .effect-preview
$pattern = '(?s)(\.effect-preview\s*\{.*?background\s*:\s*)(radial-gradient\s*\(.*?\)\s*,\s*linear-gradient\s*\(.*?\)|linear-gradient\s*\(.*?\))([\s\S]*?\})'
if ($newStyle -match $pattern) {
  $newStyle = [regex]::Replace($newStyle, $pattern, '$1#050914$3', 1)
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($stylePath, $newStyle, $utf8NoBom)

Push-Location $ProjectRoot
try {
  Write-Host 'Uruchamiam TypeScript check...' -ForegroundColor Cyan
  & npx.cmd tsc --noEmit
  if ($LASTEXITCODE -ne 0) { throw 'TypeScript check failed' }

  Write-Host 'TypeScript: PASS' -ForegroundColor Green
  Write-Host 'Uruchamiam build...' -ForegroundColor Cyan
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw 'Build failed' }

  Write-Host ''
  Write-Host 'BUILD: PASS' -ForegroundColor Green
  Write-Host ''
  Write-Host 'Usunieto biale kolo / centralna poswiate z preview.' -ForegroundColor Green
  Write-Host 'Odswiez aktywny localhost z Vite.'
}
catch {
  Write-Host ''
  Write-Host 'Walidacja nie przeszla. Przywracam backup...' -ForegroundColor Red
  Copy-Item $styleBackup $stylePath -Force
  Write-Host 'Przywrocono poprzedni style.css.' -ForegroundColor Yellow
  throw
}
finally {
  Pop-Location
}
