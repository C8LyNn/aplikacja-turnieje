# Installs the merged stream BACKGROUND effects source files from Google Drive.
# Compatible with Windows PowerShell 5.1 and PowerShell 7+.
[CmdletBinding()]
param(
    [string]$RepoPath = (Get-Location).Path,
    [switch]$Apply,
    [switch]$Force
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$packageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifestPath = Join-Path $packageRoot 'manifest.json'
if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
    throw "Nie znaleziono manifest.json obok instalatora. Najpierw rozpakuj caly ZIP."
}
$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$payloadRoot = [System.IO.Path]::GetFullPath((Join-Path $packageRoot 'payload'))
$repoRoot = [System.IO.Path]::GetFullPath($RepoPath).TrimEnd([char[]]@('\','/'))
if (-not (Test-Path -LiteralPath (Join-Path $repoRoot 'package.json') -PathType Leaf) -or
    -not (Test-Path -LiteralPath (Join-Path $repoRoot 'artifacts/tournament-manager') -PathType Container)) {
    throw "Docelowy katalog nie wyglada jak glowny katalog repozytorium aplikacja-turnieje: $repoRoot"
}
$gitRoot = ((& git -C $repoRoot rev-parse --show-toplevel) | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or
    [System.IO.Path]::GetFullPath($gitRoot).TrimEnd([char[]]@('\','/')) -ne $repoRoot) {
    throw "Instalator wymaga katalogu glownego repozytorium Git, nie podkatalogu."
}

$allowedPaths = @(
    'artifacts/animated-effects/',
    'artifacts/tournament-manager/scripts/stage-animated-effects.mjs',
    'artifacts/tournament-manager/src/features/streaming/obs-lab/animated-effects-trigger.test.ts',
    'artifacts/tournament-manager/src/features/streaming/obs-lab/stream-elements-profiles.test.ts',
    'artifacts/tournament-manager/src/features/streaming/obs-lab/stream-elements-simulator.test.ts'
)
function AllowedPath([string]$path) {
    if ($path.StartsWith('artifacts/animated-effects/', [StringComparison]::Ordinal)) {
        return ($path -match '^artifacts/animated-effects/[a-zA-Z0-9_./-]+$' -and
                -not $path.Contains('../') -and -not $path.Contains('//'))
    }
    return $allowedPaths -ccontains $path
}
$dirty = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::Ordinal)
foreach ($argsForGit in @(
    @('diff', '--name-only'),
    @('diff', '--cached', '--name-only'),
    @('ls-files', '--others', '--exclude-standard')
)) {
    $lines = & git -C $repoRoot -c core.quotepath=false @argsForGit
    if ($LASTEXITCODE -ne 0) { throw 'Nie mozna odczytac stanu repozytorium Git.' }
    foreach ($line in $lines) {
        if ($line) { [void]$dirty.Add(($line -replace '\\', '/').Trim()) }
    }
}
$operations = New-Object System.Collections.ArrayList
$conflicts = New-Object System.Collections.ArrayList
foreach ($entry in @($manifest.files)) {
    $relative = [string]$entry.path
    if (-not (AllowedPath $relative)) { throw "Niedozwolona sciezka w manifeście: $relative" }
    $native = $relative.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    $source = Join-Path $payloadRoot $native
    $destination = Join-Path $repoRoot $native
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Brak pliku w paczce: $relative" }
    $actual = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actual -ne [string]$entry.sha256) { throw "Niezgodna suma kontrolna paczki: $relative" }
    if (Test-Path -LiteralPath $destination -PathType Container) {
        throw "Katalog blokuje plik docelowy: $relative"
    }
    $exists = Test-Path -LiteralPath $destination -PathType Leaf
    $same = $false
    if ($exists) {
        $same = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant() -eq $actual
    }
    if (-not $same) {
        [void]$operations.Add([pscustomobject]@{Relative=$relative; Source=$source; Destination=$destination; Exists=$exists})
        if ($dirty.Contains($relative)) { [void]$conflicts.Add($relative) }
    }
}
Write-Host ''
Write-Host 'Animated Effects — scalona paczka PR #8 + #9 / efekty tla streama' -ForegroundColor Cyan
Write-Host "Source commit: $($manifest.source_commit)"
Write-Host "Repo: $repoRoot"
Write-Host "Pliki w paczce: $(@($manifest.files).Count); do aktualizacji: $($operations.Count)"
if ($conflicts.Count -gt 0) {
    Write-Warning "$($conflicts.Count) plikow ma niezapisane zmiany lokalne lub jest nieśledzonych w Git:"
    foreach ($name in $conflicts) { Write-Host "  $name" -ForegroundColor Yellow }
    if (-not $Force) {
        throw 'Instalacja przerwana bez zmian. Zapisz swoje modyfikacje lub uzyj -Force (z kopia zapasowa).'
    }
}
if (-not $Apply) {
    Write-Host 'TRYB PODGLADU. Nie zmieniono zadnych plikow. Uruchom ponownie z -Apply.' -ForegroundColor Yellow
    exit 0
}
if ($operations.Count -eq 0) {
    Write-Host 'Wszystkie pliki sa juz identyczne z paczka. Nie ma nic do instalowania.' -ForegroundColor Green
    exit 0
}
$stamp = (Get-Date -Format 'yyyyMMdd_HHmmss') + '_' + [guid]::NewGuid().ToString('N').Substring(0,8)
$backup = Join-Path (Split-Path -Parent $repoRoot) ("stream-effects-backup-" + $stamp)
$backupFiles = Join-Path $backup 'files'
New-Item -ItemType Directory -Path $backupFiles -Force | Out-Null
$performed = New-Object System.Collections.ArrayList
try {
    foreach ($item in $operations) {
        $relativeNative = $item.Relative.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $oldCopy = Join-Path $backupFiles $relativeNative
        if ($item.Exists) {
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $oldCopy) | Out-Null
            Copy-Item -LiteralPath $item.Destination -Destination $oldCopy -Force
        }
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $item.Destination) | Out-Null
        Copy-Item -LiteralPath $item.Source -Destination $item.Destination -Force
        [void]$performed.Add($item)
    }
} catch {
    Write-Warning "Blad kopiowania: $($_.Exception.Message). Cofam zmiany..."
    # Include the currently failing file if the copy partially replaced it.
    foreach ($item in @($operations)) {
        $relativeNative = $item.Relative.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $oldCopy = Join-Path $backupFiles $relativeNative
        if (Test-Path -LiteralPath $oldCopy -PathType Leaf) {
            Copy-Item -LiteralPath $oldCopy -Destination $item.Destination -Force
        } elseif (-not $item.Exists -and (Test-Path -LiteralPath $item.Destination -PathType Leaf)) {
            Remove-Item -LiteralPath $item.Destination -Force
        }
    }
    throw
}
Write-Host "ZAINSTALOWANO: $($performed.Count) plikow" -ForegroundColor Green
Write-Host "Kopia zapasowa: $backup"
Write-Host 'Teraz sprawdz zmiany: git status --short'
Write-Host 'Uruchom testy i build w docelowym projekcie przed commitem.'
