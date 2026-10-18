param(
    [string]$OutputRoot = "",
    [switch]$BuildWindows
)
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not $OutputRoot) {
    $driveRoot = 'G:\Mój dysk\ChatGPT'
    if (Test-Path -LiteralPath $driveRoot) {
        $OutputRoot = Join-Path $driveRoot 'CoreClash\QA\R13'
    } else {
        $OutputRoot = Join-Path $root 'Evidence\R13-QA'
    }
}
New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$run = Join-Path $OutputRoot ("r13_" + $stamp)
New-Item -ItemType Directory -Force -Path $run | Out-Null
$results = New-Object System.Collections.Generic.List[object]
function Invoke-Stage {
    param([string]$Name, [string]$Executable, [string[]]$Arguments)
    $safeName = $Name -replace '[^a-zA-Z0-9_-]', '_'
    $log = Join-Path $run ($safeName + '.log')
    $cmd = Get-Command $Executable -ErrorAction SilentlyContinue
    if (-not $cmd) {
        "BLOCKED: Executable not found: $Executable" | Set-Content -LiteralPath $log -Encoding utf8
        $results.Add([pscustomobject]@{ step=$Name; status='BLOCKED'; exit_code=$null; log=$log })
        return
    }
    Push-Location $root
    try {
        & $Executable @Arguments *>&1 | Out-File -LiteralPath $log -Encoding utf8
        $code = $LASTEXITCODE
        if ($null -eq $code) { $code = 1 }
        $status = if ($code -eq 0) {'PASS'} else {'FAIL'}
        $results.Add([pscustomobject]@{ step=$Name; status=$status; exit_code=$code; log=$log })
    } catch {
        ("FAIL: " + $_.Exception.Message) | Add-Content -LiteralPath $log -Encoding utf8
        $results.Add([pscustomobject]@{ step=$Name; status='FAIL'; exit_code=$null; log=$log })
    } finally { Pop-Location }
}
Invoke-Stage -Name 'data' -Executable 'node' -Arguments @('Tools/verify-data.cjs')
Invoke-Stage -Name 'csharp' -Executable 'dotnet' -Arguments @('run','--project','Tests/CoreClash.Tests.csproj','--','.')
Invoke-Stage -Name 'network_codec' -Executable 'node' -Arguments @('Tools/network-codec-test.cjs')
if ($BuildWindows) {
    $script = Join-Path $root 'Tools/build.ps1'
    Invoke-Stage -Name 'unity_windows' -Executable 'pwsh' -Arguments @('-NoProfile','-File',$script,'-Target','Windows')
}
$summary = [pscustomobject]@{ project='CC-001'; candidate='R13 SOURCE'; timestamp=(Get-Date).ToString('o'); root=$root; results=@($results.ToArray()); deployed=$false }
$summary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $run 'qa-results.json') -Encoding utf8
$summary | ConvertTo-Json -Depth 8
if ($results.Count -eq 0 -or @($results | Where-Object { $_.status -ne 'PASS' }).Count -gt 0) { exit 1 }
exit 0
