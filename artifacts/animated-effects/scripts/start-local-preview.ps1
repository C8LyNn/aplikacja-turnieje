# Local Animated Effects preview — Windows PowerShell 5.1+.
# This launcher never starts an API/database, deploys, or modifies Git branches.
[CmdletBinding()]
param(
    [ValidateSet('Integrated', 'Editor')]
    [string]$Mode = 'Integrated',

    [ValidateRange(1024, 65535)]
    [int]$Port = 4173,

    [switch]$SkipInstall,
    [switch]$SkipBuild
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

$pnpm = Get-Command 'pnpm.cmd' -ErrorAction SilentlyContinue
if (-not $pnpm) {
    throw 'pnpm 10 is required. Enable it with: corepack enable; corepack prepare pnpm@10 --activate'
}

$nodeMajor = [int]((& $node.Source -p 'process.versions.node.split(".")[0]').Trim())
if ($LASTEXITCODE -ne 0 -or $nodeMajor -lt 22) {
    throw 'Node.js 22 or newer is required.'
}

$pnpmVersion = (& $pnpm.Source --version).Trim()
if ($LASTEXITCODE -ne 0 -or -not $pnpmVersion.StartsWith('10.')) {
    throw "pnpm 10 is required; detected '$pnpmVersion'."
}

function Invoke-Pnpm {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
    & $pnpm.Source @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "pnpm command failed (exit $LASTEXITCODE): $($Arguments -join ' ')"
    }
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
        Invoke-Pnpm '--filter' '@workspace/tournament-manager' 'serve'
    }
}
finally {
    Pop-Location
}
