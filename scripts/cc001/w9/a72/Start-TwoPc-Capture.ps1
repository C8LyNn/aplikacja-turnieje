# CC-001 R17-W9 A72 — independent PC1/PC2 original native Player evidence capture.
# No installation, firewall changes, Unity Editor, builds, source edits, network injection or process termination.
[CmdletBinding()]
param(
 [Parameter(Mandatory=$true)][ValidateSet('host','client')][string]$Role,
 [Parameter(Mandatory=$true)][string]$RunId,
 [Parameter(Mandatory=$true)][string]$PlayerExe,
 [int]$Seconds=180,
 [string]$OutputRoot=(Join-Path $env:USERPROFILE 'Documents\CC001_W9_A72_Captures')
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$RC1='10f64e4d213f17a352ed8fa83bc75884a39549f0'
$ExpectedExe='97845574417B7FC4DB70BFBAA4D3F941EAB8628DF2BCC9424DBA328D3A6549C3'
$ExpectedDll='D80AB677155F44FF05BD9FE0972F8833F37BA25AB79CDF7D1F77D60FB418883F'
$where=$null
try {
 if(-not ($RunId -cmatch '^[a-zA-Z0-9_-]{6,64}$')){throw 'RunId must be 6-64 alphanumeric/underscore/hyphen characters and identical on both PCs'}
 if($Seconds -lt 15 -or $Seconds -gt 900){throw 'Seconds must be between 15 and 900'}
 if(-not [IO.Path]::IsPathRooted($PlayerExe)){throw 'PlayerExe must be absolute'}
 $exe=(Resolve-Path -LiteralPath $PlayerExe -ErrorAction Stop).Path
 if([IO.Path]::GetFileName($exe) -cne 'CoreClash.exe'){throw 'Expected CoreClash.exe'}
 $folder=[IO.Path]::GetDirectoryName($exe)
 $dll=Join-Path $folder 'CoreClash_Data\Managed\Assembly-CSharp.dll'
 if(-not (Test-Path -LiteralPath $dll -PathType Leaf)){throw 'Production Assembly-CSharp.dll missing'}
 $exeSha=(Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash.ToUpperInvariant()
 $dllSha=(Get-FileHash -LiteralPath $dll -Algorithm SHA256).Hash.ToUpperInvariant()
 if($exeSha -cne $ExpectedExe -or $dllSha -cne $ExpectedDll){throw ('HOLD WRONG RC1 BINARY: exe='+$exeSha+' dll='+$dllSha)}
 $where=Join-Path $OutputRoot ($RunId+'_'+$Role)
 if(Test-Path -LiteralPath $where){throw ('REFUSE OVERWRITE EXISTING CAPTURE: '+$where)}
 New-Item -Path $where -ItemType Directory -Force|Out-Null
 $log=Join-Path $where 'Player.log'
 $csv=Join-Path $where 'samples.csv'
 $fail=Join-Path $where 'FAILURE.txt'
 $utcStart=[DateTime]::UtcNow.ToString('o')
 Write-Host ('A72 CAPTURE: '+$Role+' run='+$RunId+' duration='+$Seconds+'s') -ForegroundColor Cyan
 Write-Host 'Launch game and perform ONE consented trusted-LAN PC1/PC2 trial; close game normally before the capture deadline.' -ForegroundColor Cyan
 $p=Start-Process -FilePath $exe -WorkingDirectory $folder -ArgumentList ('-logFile "'+$log+'"') -PassThru
 $start=Get-Date
 # The sampled fields intentionally do not include raw private IPv4 addresses.
 [IO.File]::WriteAllText($csv,"utc,processId,workingSetBytes,processorSeconds,tcpEstablished`r`n",(New-Object System.Text.UTF8Encoding($false)))
 $n=0
 while(((Get-Date)-$start).TotalSeconds -lt $Seconds){
  $p.Refresh();if($p.HasExited){break}
  $current=Get-Process -Id $p.Id -ErrorAction SilentlyContinue
  if($null -eq $current){break}
  $tcp=-1
  try {$tcp=@(Get-NetTCPConnection -OwningProcess $p.Id -State Established -ErrorAction Stop).Count}
  catch {$tcp=-1}
  $line=[DateTime]::UtcNow.ToString('o')+','+$p.Id+','+[long]$current.WorkingSet64+','+$current.CPU.ToString('F3',[Globalization.CultureInfo]::InvariantCulture)+','+$tcp+"`r`n"
  [IO.File]::AppendAllText($csv,$line,(New-Object System.Text.UTF8Encoding($false)))
  $n++;Start-Sleep -Milliseconds 500
 }
 $p.Refresh();$partial=-not $p.HasExited
 if($partial){Write-Host 'Game still running: capture will be marked PARTIAL, not a successful NET-W6-01 proof.' -ForegroundColor Yellow}
 if(-not (Test-Path -LiteralPath $log -PathType Leaf)){throw 'Unity -logFile did not create Player.log; no evidence can be accepted'}
 if($n -lt 1){throw 'No process health samples captured'}
 $utcEnd=[DateTime]::UtcNow.ToString('o')
 $logSha=(Get-FileHash -LiteralPath $log -Algorithm SHA256).Hash.ToUpperInvariant()
 $samplesSha=(Get-FileHash -LiteralPath $csv -Algorithm SHA256).Hash.ToUpperInvariant()
 $capture=[ordered]@{
  schema='CC001-W9-A72-CAPTURE-1';rc1=$RC1;runId=$RunId;role=$Role
  utcStart=$utcStart;utcEnd=$utcEnd;durationSeconds=$Seconds
  playerExeSha256=$exeSha;playerDllSha256=$dllSha
  logSha256=$logSha;samplesSha256=$samplesSha;sampleCount=$n
  captureMayBePartial=$partial
  note='Original log and resource sampling only. No packet timing, interpolation quality or frame timing measurement; local IPv4 is omitted from samples.'
 }
 $json=Join-Path $where 'capture.json'
 [IO.File]::WriteAllText($json,($capture|ConvertTo-Json -Depth 5),(New-Object System.Text.UTF8Encoding($false)))
 Write-Host ('EVIDENCE FOLDER: '+$where) -ForegroundColor Green
 Write-Host ('LOG SHA256: '+$logSha)
 Write-Host ('SAMPLES SHA256: '+$samplesSha)
 Write-Host 'Copy both PC capture folders to one offline workstation; run Node22 verify-two-pc.cjs HOST_FOLDER CLIENT_FOLDER.'
 if($partial){exit 2}
 exit 0
}catch{
 Write-Host ('A72 STOP: '+$_.Exception.Message) -ForegroundColor Red
 if($where -and (Test-Path -LiteralPath $where)){
  [IO.File]::WriteAllText((Join-Path $where 'FAILURE.txt'),($_|Out-String),(New-Object System.Text.UTF8Encoding($false)))
 }
 exit 1
}
