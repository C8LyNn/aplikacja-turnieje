# CC-001 R17-W11 / A72. Windows 11 / PowerShell 5.1.
# Invokes ONE isolated Windows Standalone build for an exact A70 integration candidate.
# No RC1, main, gameplay, CI, network, firewall, merge or deployment writes.
[CmdletBinding()]
param(
 [Parameter(Mandatory=$true)][string]$IntegrationRef,
 [Parameter(Mandatory=$true)][string]$CandidateSha,
 [string]$UnityExe='C:\Program Files\Unity\Hub\Editor\6000.4.0f1\Editor\Unity.exe',
 [string]$OutputRoot=(Join-Path $env:USERPROFILE 'Downloads')
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
try {
 if($IntegrationRef -cnotmatch '^integration/cc001-r17-w11-qa-freeze-20261030$'){throw 'Use only the A70 frozen W11 QA ref; feature branches are forbidden'}
 if($CandidateSha -cne '3f972cdbaea6289a7e33ce608f5d3256cfdab0a3'){throw 'EXACT W11 QA-freeze SHA required; no substitutes'}
 $node=(Get-Command node.exe -ErrorAction Stop).Source
 $git=(Get-Command git.exe -ErrorAction Stop).Source
 $version=(& $node --version).Trim()
 if($LASTEXITCODE -ne 0 -or $version -notmatch '^v22\.'){throw ('Node22 required; got '+$version)}
 if(-not (Test-Path -LiteralPath $UnityExe -PathType Leaf)){throw ('Missing Unity Editor: '+$UnityExe)}
 if($UnityExe.Replace('/','\') -notmatch '\\6000\.4\.0f1\\Editor\\Unity\.exe$'){throw 'Wrong Unity Editor version path'}
 $root=Join-Path $OutputRoot ('CC001_W11_A72_'+(Get-Date -Format 'yyyyMMdd_HHmmss')+'_'+[Guid]::NewGuid().ToString('N').Substring(0,8))
 if(Test-Path -LiteralPath $root){throw 'Operator output folder already exists'}
 $builder=Join-Path $PSScriptRoot 'build-w10-rc1.cjs'
 if(-not (Test-Path -LiteralPath $builder -PathType Leaf)){throw 'Missing main builder'}
 $test=(& $node $builder --self-test)
 if($LASTEXITCODE -ne 0){throw ('Builder self-test FAILED: '+($test|Out-String))}
 Write-Host ('SELF-TEST: '+($test|Out-String)) -ForegroundColor Green
 Write-Host ('A72 W11 EXACT CANDIDATE: '+$CandidateSha) -ForegroundColor Cyan
 Write-Host ('A70 INTEGRATION REF: '+$IntegrationRef) -ForegroundColor Cyan
 Write-Host 'Running ONE isolated Unity Windows build; NO game release or two-PC QA.' -ForegroundColor Cyan
 & $node $builder ("--ref="+$IntegrationRef) ("--sha="+$CandidateSha) ("--unity="+$UnityExe) ("--out="+$root)
 $nativeExit=$LASTEXITCODE
 $evidence=Join-Path $root 'evidence'
 if(Test-Path -LiteralPath $evidence -PathType Container){
  $zip=Join-Path $root 'CC001_W11_A72_WINDOWS_EVIDENCE.zip'
  Compress-Archive -Path (Join-Path $evidence '*') -DestinationPath $zip -CompressionLevel Optimal
  $receipt=Join-Path $root 'EVIDENCE_SHA256.txt'
  $digest=(Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToUpperInvariant()
  [IO.File]::WriteAllText($receipt,($digest+'  '+[IO.Path]::GetFileName($zip)+"`r`n"),(New-Object System.Text.UTF8Encoding($false)))
  Write-Host ('ARCHIVE: '+$zip)
  Write-Host ('SHA256: '+$digest)
  Write-Host ('BUILDER EXIT: '+$nativeExit)
  if($nativeExit -ne 0){Write-Host 'HOLD: evidence preserved for A60; do not label build PASS.' -ForegroundColor Yellow}
 }else{Write-Host 'STOP: builder generated no evidence directory' -ForegroundColor Red;exit 1}
 exit $nativeExit
}catch{
 Write-Host ('A72 STOP: '+$_.Exception.Message) -ForegroundColor Red
 exit 1
}
