param([string]$ProjectRoot = (Get-Location).Path)
$ErrorActionPreference = "Stop"

$stylePath = Join-Path $ProjectRoot "src\style.css"
if (!(Test-Path $stylePath)) { throw "Uruchom skrypt w katalogu glownym animated-effects." }

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $ProjectRoot ".animated-effects-backup\$stamp\src"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Copy-Item $stylePath (Join-Path $backupDir "style.css") -Force

$startMarker = "/* === AE_INSPECTOR_UI_START === */"
$endMarker   = "/* === AE_INSPECTOR_UI_END === */"

$fix = @'
/* === AE_INSPECTOR_UI_START === */

.inspector-panel { padding: 18px; }

.inspector-title {
  margin-bottom: 16px;
  padding: 14px 16px;
  border: 1px solid rgba(124, 92, 255, 0.5);
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(124,92,255,.14), rgba(124,92,255,.05));
}

.inspector-title strong { font-size: 14px; }
.inspector-title span { margin-top: 5px; font-size: 10px; }

.inspector-field { gap: 8px; margin-bottom: 15px; }

.inspector-label {
  align-items: center;
  font-size: 11px;
  font-weight: 600;
}

.inspector-label output {
  min-width: 52px;
  padding: 3px 7px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 7px;
  background: #151b27;
  color: #f7f9ff;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 10px;
  font-weight: 700;
  text-align: right;
}

.inspector-field input[type="range"] {
  width: 100%;
  height: 20px;
  margin: 0;
  padding: 0;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  accent-color: #7c5cff;
}

.inspector-field input[type="range"]::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, #303950, #252d40);
  border: 1px solid rgba(255,255,255,.07);
}

.inspector-field input[type="range"]::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  margin-top: -6px;
  border: 2px solid rgba(255,255,255,.92);
  border-radius: 50%;
  background: #7c5cff;
  box-shadow: 0 0 0 3px rgba(124,92,255,.16), 0 2px 6px rgba(0,0,0,.45);
  appearance: none;
  -webkit-appearance: none;
}

.inspector-field input[type="range"]:hover::-webkit-slider-thumb { background: #9278ff; }

.inspector-field input[type="range"]:focus-visible {
  outline: 2px solid rgba(124,92,255,.7);
  outline-offset: 3px;
  border-radius: 999px;
}

.inspector-field input[type="range"]::-moz-range-track {
  height: 6px;
  border-radius: 999px;
  background: #293248;
  border: 1px solid rgba(255,255,255,.07);
}

.inspector-field input[type="range"]::-moz-range-progress {
  height: 6px;
  border-radius: 999px;
  background: #7c5cff;
}

.inspector-field input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,.92);
  border-radius: 50%;
  background: #7c5cff;
}

.inspector-field select {
  height: 40px;
  padding: 0 34px 0 12px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 10px;
  background-color: #151b27;
  color: #eef3ff;
  font-size: 11px;
  font-weight: 600;
}

.inspector-field select:hover { border-color: rgba(124,92,255,.5); }
.inspector-field select:focus-visible {
  outline: 2px solid rgba(124,92,255,.65);
  outline-offset: 2px;
}

/* === AE_INSPECTOR_UI_END === */
'@

$content = Get-Content -Raw -Path $stylePath
$start = $content.IndexOf($startMarker)
$end = $content.IndexOf($endMarker)

if ($start -ge 0 -and $end -gt $start) {
  $end += $endMarker.Length
  $before = $content.Substring(0, $start).TrimEnd()
  $after = $content.Substring($end).TrimStart()
  $content = $before + "`r`n`r`n" + $fix.Trim() + "`r`n"
  if ($after.Length -gt 0) { $content += "`r`n" + $after }
} else {
  $content = $content.TrimEnd() + "`r`n`r`n" + $fix.Trim() + "`r`n"
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($stylePath, $content, $utf8NoBom)

Push-Location $ProjectRoot
try {
  & npx.cmd tsc --noEmit
  if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed." }
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw "Build failed." }
  Write-Host "Inspector UI poprawiony. TypeScript: PASS, BUILD: PASS" -ForegroundColor Green
  Write-Host "Backup: $backupDir\style.css"
}
finally { Pop-Location }
