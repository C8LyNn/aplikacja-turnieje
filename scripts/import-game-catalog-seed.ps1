# Candidate-only importer. No writes unless -Apply is explicitly supplied.
# Windows PowerShell 5.1 / PowerShell 7; no modules required.
[CmdletBinding()]
param(
    [string]$BaseUrl = 'https://C8LyNn.replit.app',
    [string]$InputFile = (Join-Path (Split-Path -Parent $PSScriptRoot) 'data/steam-catalog-seed-106.csv'),
    [ValidateRange(1,20000)][int]$Limit = 5,
    [ValidateRange(1,60)][int]$DelaySeconds = 2,
    [string]$StatePath = (Join-Path $HOME '.steam-catalog-seed-progress.json'),
    [switch]$Apply,
    [switch]$AllowLegacy
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$base = $BaseUrl.TrimEnd('/')
if ($base -notmatch '^https://[a-zA-Z0-9.-]+(?::[0-9]+)?$') {
    throw 'BaseUrl must be an HTTPS origin without path or query.'
}
if (-not (Test-Path -LiteralPath $InputFile -PathType Leaf)) {
    throw "Missing CSV: $InputFile"
}
$rows = @(Import-Csv -LiteralPath $InputFile | Select-Object -First $Limit)
$unique = New-Object 'System.Collections.Generic.HashSet[int]'
$candidates = @(
    foreach ($row in $rows) {
        $id = 0
        if (-not [int]::TryParse([string]$row.appId, [ref]$id) -or $id -le 0) {
            throw "Invalid AppID in CSV: $($row.appId)"
        }
        if ($unique.Add($id)) {
            [pscustomobject]@{ appId = $id; hint = [string]$row.titleHint }
        }
    }
)
$mode = if ($Apply) { 'APPLY' } else { 'DRY RUN' }
Write-Host ("Candidates: {0}; mode: {1}; server: {2}" -f $candidates.Count, $mode, $base)
if (-not $Apply) {
    $candidates | Format-Table -AutoSize
    Write-Host 'No writes performed. Set STEAM_CATALOG_ADMIN_TOKEN and run with -Apply.'
    return
}
$script:adminToken = [string]$env:STEAM_CATALOG_ADMIN_TOKEN
if ($script:adminToken.Length -lt 32) {
    throw 'STEAM_CATALOG_ADMIN_TOKEN must exist in this shell (at least 32 characters).'
}

function Invoke-CatalogJson {
    param([string]$Uri, [string]$Method = 'GET', [object]$Body = $null)
    $headers = @{ Accept = 'application/json' }
    $request = @{
        Uri = $Uri; Method = $Method; Headers = $headers
        TimeoutSec = 35; ErrorAction = 'Stop'
    }
    if ($Method -eq 'POST') {
        $headers['x-steam-catalog-admin-token'] = $script:adminToken
        $request.ContentType = 'application/json'
        $request.Body = ConvertTo-Json -InputObject $Body -Depth 6 -Compress
    }
    Invoke-RestMethod @request
}

function Save-Checkpoint {
    param([hashtable]$Entries)
    $parent = Split-Path -Parent $StatePath
    if ($parent -and -not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }
    $temp = "$StatePath.tmp"
    ConvertTo-Json -InputObject $Entries -Depth 3 | Set-Content -LiteralPath $temp -Encoding UTF8
    Move-Item -LiteralPath $temp -Destination $StatePath -Force
}

$done = @{}
if (Test-Path -LiteralPath $StatePath -PathType Leaf) {
    $saved = Get-Content -LiteralPath $StatePath -Raw | ConvertFrom-Json
    if ($null -ne $saved) {
        foreach ($prop in $saved.PSObject.Properties) {
            $done[$prop.Name] = [string]$prop.Value
        }
    }
}
$before = Invoke-CatalogJson -Uri "$base/api/steam-catalog/games?page=1&pageSize=1"
if ($null -eq $before.counts -or $null -eq $before.counts.all) {
    throw 'Catalog API did not return counts.all; stopping without import.'
}
Write-Host ("Games before: {0}" -f $before.counts.all)

$counts = @{ inserted = 0; existing = 0; ignored = 0; resumed = 0 }
foreach ($candidate in $candidates) {
    $id = [int]$candidate.appId
    $key = [string]$id
    if ($done.ContainsKey($key)) {
        $counts.resumed++
        continue
    }
    try {
        # Exact AppID search avoids metadata overwrites in the old importer.
        $existing = Invoke-CatalogJson -Uri "$base/api/steam-catalog/games?page=1&pageSize=1&query=$id"
        if (@($existing.games | Where-Object { $_.steamAppId -eq $id }).Count -gt 0) {
            $done[$key] = 'existing'
            $counts.existing++
            Save-Checkpoint -Entries $done
            Write-Host "AppID $id : existing"
            continue
        }

        $status = $null
        try {
            $batch = Invoke-CatalogJson -Uri "$base/api/steam-catalog/import-batch" -Method 'POST' -Body @{ appIds = @($id) }
            if ($batch.aborted -or $batch.rateLimited) {
                throw "Upstream stopped or throttled AppID $id."
            }
            if (@($batch.results).Count -ne 1 -or [int]$batch.results[0].appId -ne $id) {
                throw "Malformed import-batch response for AppID $id."
            }
            $status = [string]$batch.results[0].status
        } catch {
            $code = 0
            if ($null -ne $_.Exception.PSObject.Properties['Response']) {
                $response = $_.Exception.PSObject.Properties['Response'].Value
                if ($null -ne $response) { $code = [int]$response.StatusCode }
            }
            if ($code -ne 404 -or -not $AllowLegacy) { throw }
            # Legacy /import updates metadata on conflict and does not check
            # Steam's type field. Verify a game before opting into that route.
            $steam = Invoke-RestMethod -Uri "https://store.steampowered.com/api/appdetails?appids=$id&l=english" -TimeoutSec 35 -ErrorAction Stop
            $entry = $steam.PSObject.Properties[[string]$id].Value
            if (-not $entry.success -or $entry.data.type -ne 'game') {
                $status = 'not_game'
            } else {
                $legacy = Invoke-CatalogJson -Uri "$base/api/steam-catalog/import" -Method 'POST' -Body @{ appId = $id }
                if ([int]$legacy.game.steamAppId -ne $id) {
                    throw "Malformed legacy response for AppID $id."
                }
                $status = 'inserted'
            }
        }
        switch ($status) {
            'inserted' { $counts.inserted++; $done[$key] = $status }
            'existing' { $counts.existing++; $done[$key] = $status }
            'not_game' { $counts.ignored++; $done[$key] = $status }
            'missing' { $counts.ignored++; $done[$key] = $status }
            default { throw "Unknown import status for AppID $id : $status" }
        }
        Save-Checkpoint -Entries $done
        Write-Host ("AppID {0} : {1}" -f $id, $status)
        Start-Sleep -Seconds $DelaySeconds
    } catch {
        Write-Warning ("Paused at AppID {0} without checkpointing this item: {1}" -f $id, $_.Exception.Message)
        break
    }
}
try {
    $after = Invoke-CatalogJson -Uri "$base/api/steam-catalog/games?page=1&pageSize=1"
    Write-Host ("Games after: {0}; before: {1}" -f $after.counts.all, $before.counts.all)
} catch {
    Write-Warning 'Unable to retrieve final catalog counts.'
}
Write-Host ("This run: inserted {0}, existing {1}, ignored {2}, previously completed {3}" -f $counts.inserted, $counts.existing, $counts.ignored, $counts.resumed)
Write-Host "Local checkpoint (no credentials): $StatePath"
