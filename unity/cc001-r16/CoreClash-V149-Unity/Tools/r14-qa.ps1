<#
CC-001 R14 isolated Windows QA. Runs tests in a copy. Never executes them in the
canonical R13 candidate or overwrites historical Evidence. Requires PowerShell 7.
Usage: pwsh -NoProfile -File .\Tools\r14-qa.ps1 [-StaticOnly] [-BuildWindows]
#>
param(
    [string]$OutputRoot = '',
    [switch]$StaticOnly,
    [switch]$BuildWindows
)
$ErrorActionPreference = 'Stop'
$source = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$sourceParent = Split-Path -Parent $source
if (-not $OutputRoot) {
    $driveFolder = 'G:\Mój dysk\ChatGPT'
    if (Test-Path -LiteralPath $driveFolder -PathType Container) {
        $OutputRoot = Join-Path $driveFolder 'CoreClash\QA\R14'
    } else {
        $OutputRoot = Join-Path $sourceParent 'CoreClash-R14-QA-Reports'
    }
}
$requested = [System.IO.Path]::GetFullPath($OutputRoot).TrimEnd([char[]]@('\','/'))
$prefix = $source.TrimEnd([char[]]@('\','/')) + [System.IO.Path]::DirectorySeparatorChar
if ($requested.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'OutputRoot must be outside the source project to prevent recursive copying and historical Evidence contamination.'
}
New-Item -Path $OutputRoot -ItemType Directory -Force | Out-Null
$runId = 'r14_' + (Get-Date -Format 'yyyyMMdd_HHmmss') + '_' + [Guid]::NewGuid().ToString('N').Substring(0,8)
$run = Join-Path $OutputRoot $runId
$workspaceParent = Join-Path $run 'isolated'
$workspace = Join-Path $workspaceParent 'CoreClash-V149-Unity'
New-Item -Path $workspace -ItemType Directory -Force | Out-Null
$results = [System.Collections.Generic.List[object]]::new()
$preserved = @('Evidence\unity-tests.json','Evidence\ability-support.json','Evidence\network-codec-tests.json')
$before = @{}
foreach ($rel in $preserved) {
    $file = Join-Path $source $rel
    if (Test-Path -LiteralPath $file -PathType Leaf) {
        $before[$rel] = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash
    }
}
$reference = Join-Path $sourceParent 'Reference\V148_reference_original.html'
if (-not (Test-Path -LiteralPath $reference)) { throw 'Missing original HTML reference in parent/Reference' }
$beforeReference = (Get-FileHash -LiteralPath $reference -Algorithm SHA256).Hash

# Only copy reproducible source inputs, excluding Library/Temp/.git/bin/obj/Builds.
foreach ($dir in @('Assets','Packages','ProjectSettings','Tests','Tools','Evidence')) {
    $src = Join-Path $source $dir
    if (-not (Test-Path -LiteralPath $src -PathType Container)) {
        throw ('Missing mandatory project directory: ' + $src)
    }
    Copy-Item -LiteralPath $src -Destination (Join-Path $workspace $dir) -Recurse -Force
}
foreach ($file in @('NuGet.Config')) {
    $src = Join-Path $source $file
    if (Test-Path -LiteralPath $src) { Copy-Item -LiteralPath $src -Destination (Join-Path $workspace $file) -Force }
}
Copy-Item -LiteralPath (Join-Path $sourceParent 'Reference') -Destination (Join-Path $workspaceParent 'Reference') -Recurse -Force

function Run-Stage {
    param([string]$Name, [string]$Executable, [string[]]$Arguments)
    $log = Join-Path $run ($Name + '.log')
    if (-not (Get-Command $Executable -ErrorAction SilentlyContinue)) {
        ('BLOCKED: missing executable ' + $Executable) | Set-Content -LiteralPath $log -Encoding utf8
        $results.Add([pscustomobject]@{step=$Name;status='BLOCKED';exitCode=$null;log=$log})
        return
    }
    Push-Location $workspace
    try {
        & $Executable @Arguments *>&1 | Out-File -LiteralPath $log -Encoding utf8
        $exit = $LASTEXITCODE
        if ($null -eq $exit) { $exit = 1 }
        $status = if ($exit -eq 0) { 'PASS' } else { 'FAIL' }
        $results.Add([pscustomobject]@{step=$Name;status=$status;exitCode=$exit;log=$log})
    } catch {
        ('FAIL: ' + $_.Exception.Message) | Add-Content -LiteralPath $log -Encoding utf8
        $results.Add([pscustomobject]@{step=$Name;status='FAIL';exitCode=$null;log=$log})
    } finally { Pop-Location }
}

Run-Stage -Name 'static_source_audit' -Executable 'node' -Arguments @('Tools/r14-static-audit.cjs',('--output=' + (Join-Path $run 'static-audit.json')))
Run-Stage -Name 'catalog_and_reference' -Executable 'node' -Arguments @('Tools/verify-data.cjs')
if (-not $StaticOnly) {
    Run-Stage -Name 'csharp_all_tests' -Executable 'dotnet' -Arguments @('run','--project','Tests/CoreClash.Tests.csproj','--','.')
    # The .NET driver is deliberately isolated: generated evidence remains here.
    if ($results[$results.Count - 1].status -eq 'BLOCKED') {
        $log = Join-Path $run 'network_codec.log'
        'SKIPPED_DEPENDENCY: dotnet is unavailable, so the wire codec cannot run.' | Set-Content -LiteralPath $log -Encoding utf8
        $results.Add([pscustomobject]@{step='network_codec';status='SKIPPED_DEPENDENCY';exitCode=$null;log=$log})
    } else {
        Run-Stage -Name 'network_codec' -Executable 'node' -Arguments @('Tools/network-codec-test.cjs')
    }
    if ($BuildWindows) {
        Run-Stage -Name 'unity_windows_build' -Executable 'pwsh' -Arguments @('-NoProfile','-File',(Join-Path $workspace 'Tools\build.ps1'),'-Target','Windows')
    }
}
$after = @{}
foreach ($rel in $preserved) {
    $file = Join-Path $source $rel
    if (Test-Path -LiteralPath $file -PathType Leaf) { $after[$rel] = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash }
}
$unchanged = ($beforeReference -eq (Get-FileHash -LiteralPath $reference -Algorithm SHA256).Hash)
foreach ($rel in $before.Keys) {
    if (-not $after.ContainsKey($rel) -or $before[$rel] -ne $after[$rel]) { $unchanged = $false }
}
$stepsPass = $results.Count -gt 0 -and @($results | Where-Object { $_.status -ne 'PASS' }).Count -eq 0
$status = if (-not $unchanged) { 'FAIL_SOURCE_CHANGED' } elseif (-not $stepsPass) { 'FAIL_OR_BLOCKED' } elseif ($StaticOnly) { 'STATIC_ONLY_PASS' } else { 'TEST_STAGES_PASS_NOT_UNITY_CERTIFIED' }
$summary = [ordered]@{
    project = 'CC-001'; candidate = 'R14 over R13'; timestamp = (Get-Date).ToString('o');
    status = $status; staticOnly = [bool]$StaticOnly; buildWindowsRequested = [bool]$BuildWindows;
    source = $source; isolatedProject = $workspace; steps = @($results.ToArray());
    originalEvidenceUnchanged = $unchanged; originalEvidenceBefore = $before;
    originalEvidenceAfter = $after; originalHtmlSha256 = $beforeReference;
    googleDriveSyncConfirmed = $false; published = $false
}
$summary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $run 'r14-results.json') -Encoding utf8
$summary | ConvertTo-Json -Depth 8
if (-not $stepsPass -or -not $unchanged) { exit 1 }
exit 0
