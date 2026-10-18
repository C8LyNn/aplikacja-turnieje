param()
$ErrorActionPreference='Stop'
$ccRoot=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$ccSettings=Get-Content -Raw -LiteralPath (Join-Path $ccRoot 'ProjectSettings/ProjectSettings.asset')
$ccIdMatch=[regex]::Match($ccSettings,'(?m)^[ \t]*cloudProjectId:[ \t]*([^\r\n]*)')
$ccProjectId=$ccIdMatch.Groups[1].Value.Trim()
$ccGuid=[guid]::Empty
$ccLinked=[guid]::TryParse($ccProjectId,[ref]$ccGuid) -and $ccGuid -ne [guid]::Empty
$ccServiceVerified=$false
$ccMatchCurrent=$false
$ccRevision=if(Test-Path -LiteralPath (Join-Path $ccRoot 'Evidence/r9-internet-smoke.json')){'r9'}elseif(Test-Path -LiteralPath (Join-Path $ccRoot 'Evidence/r8-internet-smoke.json')){'r8'}elseif(Test-Path -LiteralPath (Join-Path $ccRoot 'Evidence/r7-internet-smoke.json')){'r7'}else{'r6'}
$ccInternetEvidence=Join-Path $ccRoot ('Evidence/'+$ccRevision+'-internet-smoke.json')
if(Test-Path -LiteralPath $ccInternetEvidence){
    $ccInternet=Get-Content -Raw -LiteralPath $ccInternetEvidence | ConvertFrom-Json
    $ccServiceVerified=$ccInternet.pass -and $ccInternet.projectId -eq $ccProjectId
    $ccMatchCurrent=$ccServiceVerified
    foreach($ccEntry in $ccInternet.buildFiles.PSObject.Properties){
        $ccFile=Join-Path $ccRoot $ccEntry.Name
        if(-not (Test-Path -LiteralPath $ccFile) -or (Get-FileHash -LiteralPath $ccFile -Algorithm SHA256).Hash -ne $ccEntry.Value.sha256){$ccMatchCurrent=$false}
    }
}
$ccStatus=[ordered]@{
    checkedAt=[DateTime]::UtcNow.ToString('o')
    projectId=$ccProjectId
    projectIdConfigured=$ccLinked
    serviceAccessVerified=$ccServiceVerified
    internetMatchTested=$ccMatchCurrent
    evidenceRevision=$ccRevision
    physicalCrossDeviceTested=$false
    note='Service proof comes from the real native Windows / WebGL Relay test on one computer; physical devices and separate networks remain untested.'
}
$ccJson=$ccStatus | ConvertTo-Json
[IO.File]::WriteAllText((Join-Path $ccRoot ('Evidence/'+$ccRevision+'-cloud-status.json')),$ccJson+[Environment]::NewLine)
Write-Output $ccJson
