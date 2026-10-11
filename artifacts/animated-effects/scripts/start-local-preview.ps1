# Local Animated Effects preview — Windows PowerShell 5.1+.
# This launcher never starts an API/database, deploys, or modifies Git branches.
[CmdletBinding()]
param(
    [ValidateSet('Integrated', 'Editor')]
    [string]$Mode = 'Integrated',

    [ValidateRange(1024, 65535)]
    [int]$Port = 4173,

    [switch]$SkipInstall,
    [switch]$SkipBuild,
    [switch]$CheckToolsOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..'))
$rootPackage = Join-Path $repoRoot 'package.json'
if (-not (Test-Path -LiteralPath $rootPackage)) {
    throw "Cannot find workspace package.json at $repoRoot."
}

$node = Get-Command 'node.exe' -ErrorAction SilentlyContinue
if (-not $node) { $node = Get-Command 'node' -ErrorAction SilentlyContinue }
if (-not $node) {
    throw 'Node.js 22+ is required. Install Node.js and rerun this script.'
}

# A local developer may use pnpm 11 for other projects. Do not overwrite
# their global pnpm: use a project-scoped pnpm 10 via npx when necessary.
$pnpm = Get-Command 'pnpm.cmd' -ErrorAction SilentlyContinue
$npx = Get-Command 'npx.cmd' -ErrorAction SilentlyContinue
$usePinnedPnpm = $false
$pnpmVersion = ''
if ($pnpm) {
    $pnpmVersion = ((& $pnpm.Source --version) | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) { $pnpmVersion = '' }
}
if (-not $pnpmVersion.StartsWith('10.')) {
    if (-not $npx) {
        throw "This workspace requires pnpm 10. Detected '$pnpmVersion', and npx.cmd is unavailable. Install npm/npx or pnpm 10."
    }
    $usePinnedPnpm = $true
    Write-Host "Detected pnpm '$pnpmVersion'. Using pnpm 10.34.6 for this preview only (npx cache)." -ForegroundColor Yellow
    $pnpmVersion = ((& $npx.Source '--yes' '--package=pnpm@10.34.6' '--' 'pnpm' '--version') | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or -not $pnpmVersion.StartsWith('10.')) {
        throw "Failed to launch pnpm 10.34.6 through npx. Check npm network access and retry."
    }
}

# Windows PowerShell 5.1 can strip nested quotes from native CLI arguments.
# --version avoids passing JavaScript code through PowerShell to node -p.
$nodeVersionText = (& $node.Source --version)
if ($LASTEXITCODE -ne 0 -or -not $nodeVersionText -or
    $nodeVersionText -notmatch '^v([0-9]+)\.') {
    throw "Could not read a valid Node.js version: '$nodeVersionText'."
}
$nodeMajor = [int]$Matches[1]
if ($nodeMajor -lt 22) {
    throw "Node.js 22 or newer is required; detected $nodeVersionText."
}

function Invoke-Pnpm {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
    if ($usePinnedPnpm) {
        & $npx.Source '--yes' '--package=pnpm@10.34.6' '--' 'pnpm' @Arguments
    }
    else {
        & $pnpm.Source @Arguments
    }
    if ($LASTEXITCODE -ne 0) {
        throw "pnpm command failed (exit $LASTEXITCODE): $($Arguments -join ' ')"
    }
}

if ($CheckToolsOnly) {
    # Exercise the exact Invoke-Pnpm code path, not only the standalone
    # npx version probe; this catches CLI argument forwarding regressions.
    Write-Host "Windows launcher prerequisites: $nodeVersionText, pnpm $pnpmVersion" -ForegroundColor Green
    Invoke-Pnpm '--version'
    Write-Host 'Windows launcher bootstrap OK.' -ForegroundColor Green
    return
}

Push-Location -LiteralPath $repoRoot
try {
    Write-Host ''
    Write-Host 'Animated Effects / StreamElements — local preview' -ForegroundColor Cyan
    Write-Host "Repo: $repoRoot"
    Write-Host "Mode: $Mode | Port: $Port | Node: $nodeMajor | pnpm: $pnpmVersion"
    Write-Host 'This script does not run the backend, use a database, or publish to Replit.' -ForegroundColor DarkGray

    if (-not $SkipInstall) {
        Write-Host '[1/3] Checking/installing workspace dependencies...' -ForegroundColor Cyan
        Invoke-Pnpm 'install' '--frozen-lockfile'
    }
    elseif (-not (Test-Path -LiteralPath (Join-Path $repoRoot 'node_modules'))) {
        throw 'node_modules is missing. Run without -SkipInstall first.'
    }

    $env:PORT = [string]$Port
    $env:BASE_PATH = '/'

    if ($Mode -eq 'Editor') {
        Write-Host '[2/3] Standalone Animated Effects dev server with hot reload.' -ForegroundColor Cyan
        Write-Host "Open: http://127.0.0.1:$Port/" -ForegroundColor Green
        Write-Host 'Changes to animated-effects source update automatically. Press Ctrl+C to stop.'
        Invoke-Pnpm '--filter' 'animated-effects' 'exec' 'vite' '--host' '127.0.0.1' '--port' ([string]$Port) '--strictPort'
    }
    else {
        $embeddedIndex = Join-Path $repoRoot 'artifacts\tournament-manager\dist\public\stream\animated-effects\index.html'
        if (-not $SkipBuild) {
            Write-Host '[2/3] Building shared libraries and embedded production preview...' -ForegroundColor Cyan
            Invoke-Pnpm 'run' 'typecheck:libs'
            Invoke-Pnpm '--filter' '@workspace/tournament-manager' 'build'
        }
        if (-not (Test-Path -LiteralPath $embeddedIndex)) {
            throw "The embedded editor was not built: $embeddedIndex. Run without -SkipBuild."
        }
        $previewUrl = "http://127.0.0.1:$Port/stream/animated-effects/index.html"
        Write-Host '[3/3] Integrated, static browser preview (no backend).' -ForegroundColor Cyan
        Write-Host "Open: $previewUrl" -ForegroundColor Green
        Write-Host 'The other application pages can show API errors because no backend is running.'
        Write-Host 'To refresh edited Animated Effects code, stop, rebuild, and rerun. Ctrl+C stops preview.'
        Invoke-Pnpm '--filter' '@workspace/tournament-manager' 'exec' 'vite' 'preview' '--config' 'vite.config.ts' '--host' '127.0.0.1' '--port' ([string]$Port) '--strictPort'
    }
}
finally {
    Pop-Location
}
