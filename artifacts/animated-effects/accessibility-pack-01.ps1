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
Write-Host "Animated Effects - Accessibility Pack 01" -ForegroundColor Cyan
Write-Host "Backup: $backupRoot"
Write-Host ""

$currentStyle = [System.IO.File]::ReadAllText($stylePath)

$startMarker = "/* === AE_ACCESSIBILITY_PACK_01_START === */"
$endMarker = "/* === AE_ACCESSIBILITY_PACK_01_END === */"

$patch = @'
/* === AE_ACCESSIBILITY_PACK_01_START === */

/*
  Accessibility Pack 01
  Goals:
  - larger, easier-to-read text
  - larger click / pointer targets
  - stronger contrast for secondary text
  - clear keyboard focus
  - thicker sliders and larger thumbs
  - less reliance on color alone for selection
  - improved scrollbar visibility
  - reduced UI motion when the OS requests it
*/

:root {
  --ae-a11y-text: #f4f7fb;
  --ae-a11y-muted: #aab7c9;
  --ae-a11y-muted-strong: #c0cad8;
  --ae-a11y-border: rgba(255, 255, 255, 0.14);
  --ae-a11y-border-strong: rgba(255, 255, 255, 0.22);
  --ae-a11y-focus: #a88cff;
  --ae-a11y-focus-soft: rgba(168, 140, 255, 0.24);
  --ae-a11y-control-h: 44px;
}

/* Layout: give text and controls enough room ---------------- */

.ae-editor-grid {
  grid-template-columns:
    340px
    minmax(0, 1fr)
    430px;
}

.ae-app-header {
  min-height: 68px;
  padding-left: 16px;
  padding-right: 16px;
}

.ae-preview-shell {
  padding: 16px;
}

/* Core typography ------------------------------------------- */

.ae-app-shell {
  font-size: 14px;
  line-height: 1.45;
}

.ae-brand h1 {
  font-size: 17px;
  line-height: 1.25;
}

.ae-dev-context {
  font-size: 10px;
  letter-spacing: 0.08em;
}

.ae-status-pill {
  font-size: 12px;
}

.ae-sidebar-heading strong,
.ae-panel-heading strong,
.ae-stage-toolbar strong {
  font-size: 14px;
  line-height: 1.3;
}

.ae-sidebar-heading span,
.ae-panel-heading span,
.ae-stage-toolbar span {
  color: var(--ae-a11y-muted);
  font-size: 11.5px;
  line-height: 1.45;
}

.ae-effect-card-main strong,
.ae-layer-copy strong {
  font-size: 13px;
  line-height: 1.3;
}

.ae-effect-card-subline small,
.ae-layer-copy small {
  color: var(--ae-a11y-muted);
  font-size: 10.5px;
  line-height: 1.35;
}

.ae-inspector-content .inspector-label {
  color: var(--ae-a11y-text);
  font-size: 12.5px;
  line-height: 1.35;
}

.inspector-title-copy strong {
  font-size: 15px;
}

.inspector-title-copy span {
  color: var(--ae-a11y-muted);
  font-size: 11px;
}

.inspector-group-heading strong,
.inspector-variant-heading strong {
  font-size: 12.5px;
}

.inspector-group-heading span,
.inspector-variant-heading span,
.inspector-variant-description {
  color: var(--ae-a11y-muted);
  font-size: 10.5px;
  line-height: 1.45;
}

/* Larger navigation and buttons ----------------------------- */

.ae-button,
.ae-sidebar-tab,
.ae-search-wrap,
.ae-category-select,
.inspector-variant-select,
.ae-inspector-content .inspector-field select {
  min-height: var(--ae-a11y-control-h);
}

.ae-button {
  padding-left: 16px;
  padding-right: 16px;
  font-size: 12px;
}

.ae-sidebar-tab {
  height: var(--ae-a11y-control-h);
  font-size: 12px;
}

.ae-tab-count {
  min-width: 24px;
  height: 24px;
  font-size: 10px;
}

.ae-search-wrap,
.ae-category-select {
  height: var(--ae-a11y-control-h);
}

.ae-search-wrap input,
.ae-category-select {
  font-size: 12px;
}

.ae-effect-filters {
  grid-template-columns:
    minmax(0, 1fr)
    148px;

  gap: 10px;
}

/* Effect cards ---------------------------------------------- */

.ae-effect-library,
.ae-layer-list {
  gap: 7px;
}

.ae-effect-card {
  min-height: 68px;
  grid-template-columns:
    minmax(0, 1fr)
    44px;

  padding:
    10px
    10px
    10px
    12px;

  border-color: var(--ae-a11y-border);
}

.ae-effect-card:hover {
  border-color: rgba(168, 140, 255, 0.52);
}

.ae-add-icon {
  width: 44px;
  min-width: 44px;
  height: 44px;

  font-size: 22px;
  border-radius: 9px;
}

.ae-performance-dots i {
  width: 6px;
  height: 6px;
}

/* Layers ---------------------------------------------------- */

.ae-layer-row {
  min-height: 64px;
  border-color: var(--ae-a11y-border);
}

.ae-layer-row.is-selected {
  border-width: 2px;
  border-color: rgba(168, 140, 255, 0.78);

  box-shadow:
    inset 4px 0 0 #a88cff;
}

.ae-layer-actions {
  grid-template-columns:
    repeat(2, 44px);

  gap: 6px;
}

.ae-icon-button {
  width: 44px;
  height: 44px;

  border-color: var(--ae-a11y-border);

  font-size: 13px;
}

/* Stage toolbar --------------------------------------------- */

.ae-stage-panel {
  grid-template-rows:
    52px
    minmax(0, 1fr);
}

.ae-stage-toolbar {
  min-height: 52px;
  padding-left: 14px;
  padding-right: 14px;
}

.ae-stage-hint {
  min-height: 34px;
  padding-left: 11px;
  padding-right: 11px;

  font-size: 10.5px;
}

/* Inspector ------------------------------------------------- */

.ae-panel-heading {
  min-height: 56px;
  padding: 11px 14px;
}

.ae-inspector-content {
  padding:
    12px
    12px
    22px;
}

.ae-inspector-content .inspector-title {
  min-height: 72px;
  padding: 13px;
  border-radius: 11px;
}

.inspector-reset-button {
  min-width: 64px;
  min-height: 40px;
  padding: 0 12px;

  font-size: 10.5px;
}

.inspector-variant-panel {
  padding: 14px;
  gap: 12px;
}

.inspector-variant-count {
  min-width: 28px;
  height: 28px;
  font-size: 10px !important;
}

.inspector-variant-select {
  height: var(--ae-a11y-control-h);
  padding-left: 13px;

  font-size: 12px;
}

.inspector-group {
  margin-bottom: 10px;
  border-color: var(--ae-a11y-border);
}

.inspector-group-toggle {
  min-height: 58px;
  padding:
    10px
    12px
    9px;
}

.inspector-group-chevron {
  width: 24px;
  height: 24px;
}

.inspector-group-fields {
  padding:
    4px
    12px
    9px;
}

.ae-inspector-content .inspector-field {
  gap: 9px;
  margin-bottom: 16px;
}

.ae-inspector-content .inspector-label {
  min-height: 36px;
}

.inspector-field-tools {
  gap: 7px;
}

.ae-inspector-content .inspector-label output {
  min-width: 62px;
  min-height: 34px;

  display: inline-flex;
  align-items: center;
  justify-content: flex-end;

  padding:
    5px
    8px;

  border-color: var(--ae-a11y-border);

  font-size: 11px;
}

.inspector-field-reset {
  min-width: 58px;
  min-height: 34px;

  padding:
    0
    10px;

  border-color: var(--ae-a11y-border);

  font-size: 10px;
}

.inspector-field-reset:disabled {
  opacity: 0.42;
}

.ae-inspector-content
  .inspector-field
  input[type="range"] {
  height: 28px;
}

.ae-inspector-content
  .inspector-field
  input[type="range"]::-webkit-slider-runnable-track {
  height: 8px;

  border-color:
    rgba(255, 255, 255, 0.11);
}

.ae-inspector-content
  .inspector-field
  input[type="range"]::-webkit-slider-thumb {
  width: 22px;
  height: 22px;

  margin-top: -8px;

  border-width: 3px;

  box-shadow:
    0 0 0 4px
      rgba(124, 92, 255, 0.18),
    0 2px 7px
      rgba(0, 0, 0, 0.5);
}

.ae-inspector-content
  .inspector-field
  input[type="range"]::-moz-range-track {
  height: 8px;
}

.ae-inspector-content
  .inspector-field
  input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;

  border-width: 3px;
}

.ae-inspector-content .inspector-field select {
  height: var(--ae-a11y-control-h);

  padding-left: 13px;

  border-color: var(--ae-a11y-border);

  font-size: 12px;
}

/* Empty states ---------------------------------------------- */

.inspector-empty,
.ae-empty-state {
  color: var(--ae-a11y-muted);
  font-size: 11.5px;
  line-height: 1.55;
}

.inspector-empty strong {
  color: var(--ae-a11y-text);
  font-size: 13px;
}

/* Focus visibility / keyboard navigation -------------------- */

.ae-app-shell
  button:focus-visible,
.ae-app-shell
  input:focus-visible,
.ae-app-shell
  select:focus-visible,
.ae-app-shell
  [tabindex]:focus-visible {
  outline:
    3px solid
    var(--ae-a11y-focus);

  outline-offset: 3px;

  box-shadow:
    0 0 0 5px
    var(--ae-a11y-focus-soft);
}

.ae-app-shell
  input[type="range"]:focus-visible {
  outline-offset: 4px;
}

/* Contrast: muted text should still be readable ------------- */

.ae-effect-card-main small,
.ae-layer-copy small,
.inspector-group-heading span,
.inspector-variant-heading span,
.inspector-variant-description,
.ae-sidebar-heading span,
.ae-panel-heading span,
.ae-stage-toolbar span {
  color: var(--ae-a11y-muted);
}

/* Scrollbars: easier to see and grab ------------------------ */

.ae-effect-library,
.ae-layer-list,
.ae-inspector-content {
  scrollbar-width: auto;
  scrollbar-color:
    #566178
    #111722;
}

.ae-effect-library::-webkit-scrollbar,
.ae-layer-list::-webkit-scrollbar,
.ae-inspector-content::-webkit-scrollbar {
  width: 12px;
}

.ae-effect-library::-webkit-scrollbar-track,
.ae-layer-list::-webkit-scrollbar-track,
.ae-inspector-content::-webkit-scrollbar-track {
  background: #111722;
}

.ae-effect-library::-webkit-scrollbar-thumb,
.ae-layer-list::-webkit-scrollbar-thumb,
.ae-inspector-content::-webkit-scrollbar-thumb {
  min-height: 36px;

  border:
    3px solid
    #111722;

  border-radius: 999px;

  background:
    #566178;
}

/* Selection should not depend on color only ----------------- */

.ae-sidebar-tab.is-active::before {
  content: "";

  width: 6px;
  height: 6px;

  margin-right: 7px;

  border-radius: 50%;

  background: currentColor;
}

/* Reduced motion preference: UI only, not the effect canvas - */

@media (prefers-reduced-motion: reduce) {
  .ae-app-header *,
  .ae-left-panel *,
  .ae-inspector-panel *,
  .ae-stage-toolbar * {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
}

/* More contrast if requested by the OS ---------------------- */

@media (prefers-contrast: more) {
  :root {
    --ae-a11y-muted: #d4dce8;
    --ae-a11y-border: rgba(255, 255, 255, 0.30);
    --ae-a11y-border-strong: rgba(255, 255, 255, 0.42);
  }

  .ae-effect-card,
  .ae-layer-row,
  .inspector-group,
  .inspector-variant-panel,
  .ae-inspector-content .inspector-title {
    border-color: var(--ae-a11y-border);
  }

  .ae-button,
  .ae-sidebar-tab,
  .ae-icon-button,
  .inspector-field-reset {
    border-color: var(--ae-a11y-border);
  }
}

/* Responsive desktop fallbacks ------------------------------ */

@media (max-width: 1500px) {
  .ae-editor-grid {
    grid-template-columns:
      310px
      minmax(0, 1fr)
      400px;
  }
}

@media (max-width: 1260px) {
  .ae-editor-grid {
    grid-template-columns:
      280px
      minmax(0, 1fr)
      360px;
  }

  .ae-effect-filters {
    grid-template-columns: 1fr;
  }
}

/* === AE_ACCESSIBILITY_PACK_01_END === */
'@

$start = $currentStyle.IndexOf($startMarker)
$end = $currentStyle.IndexOf($endMarker)

if ($start -ge 0 -and $end -gt $start) {
  $end += $endMarker.Length
  $before = ($currentStyle.Substring(0, $start)).TrimEnd()
  $after = ($currentStyle.Substring($end)).TrimStart()

  $newStyle = $before + "`r`n`r`n" + $patch.Trim() + "`r`n"

  if ($after.Length -gt 0) {
    $newStyle += "`r`n" + $after
  }
}
else {
  $newStyle = $currentStyle.TrimEnd() + "`r`n`r`n" + $patch.Trim() + "`r`n"
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
  Write-Host "Accessibility Pack 01 zainstalowany." -ForegroundColor Green
  Write-Host "Zmiany:"
  Write-Host "  - znacznie wieksze fonty"
  Write-Host "  - wieksze cele klikniecia (ok. 44 px)"
  Write-Host "  - wieksze suwaki i uchwyty"
  Write-Host "  - mocniejszy kontrast opisow"
  Write-Host "  - wyrazny focus klawiatury"
  Write-Host "  - czytelniejsze scrollbary"
  Write-Host "  - zaznaczenie nie opiera sie tylko na kolorze"
  Write-Host "  - respektowanie prefers-reduced-motion dla UI"
  Write-Host "  - respektowanie prefers-contrast: more"
  Write-Host "  - szerszy lewy panel i Inspector"
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
