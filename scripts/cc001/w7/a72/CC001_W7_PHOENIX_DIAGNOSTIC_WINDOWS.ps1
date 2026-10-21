# CC-001 R17-W7 A72 / Windows PowerShell 5.1 / isolated one-off diagnostic only.
[CmdletBinding()]
param([ValidateSet('Build','Collect')][string]$Mode='Build',
      [string]$RunFolder='',
      [string]$UnityExe='C:\Program Files\Unity\Hub\Editor\6000.4.0f1\Editor\Unity.exe',
      [switch]$NoPlayer)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$SourceSHA='e30e471f25005954f3e234d82afdbe15193a7a4a'
$TreeSHA='4ab2eb0eb2cfd6f2393233ef7e18d831f06ce652'
$AppBlob='a4a729e7a20bd0c6f5a89a466c1139b68cb1778c'
$OldW6Dll='909D71C3C2641657B887C496CBC7CDBB817070BCA22250F758F334C0811B4698'
$ProjectSubdir='unity/cc001-r16/CoreClash-V149-Unity'
$Branch='diag/cc001-r17-w7-a20-phoenix-hand-trace'
$Symbol='CC001_PHOENIX_DIAGNOSTIC'
$script:Root=''
$script:Step=0
function Ensure([bool]$ok,[string]$reason){if(-not $ok){throw ('STOP: '+$reason)}}
function Hash([string]$f){Ensure (Test-Path -LiteralPath $f -PathType Leaf) ('File missing: '+$f);return (Get-FileHash -LiteralPath $f -Algorithm SHA256).Hash.ToUpperInvariant()}
function Json([string]$f,$data){[IO.File]::WriteAllText($f,($data|ConvertTo-Json -Depth 20)+[Environment]::NewLine,(New-Object System.Text.UTF8Encoding($false)))}
function Quote([string]$s){Ensure (-not $s.Contains('"')) 'Invalid quote in path';return '"'+$s+'"'}
function Exec([string]$exe,[string[]]$arguments,[string]$cwd,[string]$label){
 $script:Step++
 $n=('{0:D2}_{1}' -f $script:Step,$label)
 $stdout=Join-Path $script:Root ('logs\'+$n+'.stdout.txt')
 $stderr=Join-Path $script:Root ('logs\'+$n+'.stderr.txt')
 $start=(Get-Date).ToUniversalTime().ToString('o')
 $proc=Start-Process -FilePath $exe -ArgumentList ($arguments -join ' ') -WorkingDirectory $cwd -PassThru -Wait -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr
 Json (Join-Path $script:Root ('logs\'+$n+'.json')) ([ordered]@{command=@($exe)+$arguments;startUtc=$start;endUtc=(Get-Date).ToUniversalTime().ToString('o');exitCode=$proc.ExitCode;stdout=$stdout;stderr=$stderr})
 Ensure ($proc.ExitCode -eq 0) "$label failed (exit $($proc.ExitCode)); see $stderr"
 return [IO.File]::ReadAllText($stdout).Trim()
}
function Marker([byte[]]$data,[byte[]]$mark){
 for($i=0;$i -le $data.Length-$mark.Length;$i++){
  if($data[$i] -ne $mark[0]){continue}
  $equal=$true
  for($j=1;$j -lt $mark.Length;$j++){if($data[$i+$j] -ne $mark[$j]){$equal=$false;break}}
  if($equal){return $true}
 }
 return $false
}
# HEAD byte oracle: accept exactly complete CRLF->LF normalization of tracked text blobs.
function ByteEqual([byte[]]$a,[byte[]]$b){
 if($a.Length -ne $b.Length){return $false}
 for($i=0;$i -lt $a.Length;$i++){if($a[$i] -ne $b[$i]){return $false}}
 return $true
}
function CanonicalLF([byte[]]$a){
 $buffer=New-Object System.IO.MemoryStream
 try{
  for($i=0;$i -lt $a.Length;$i++){
   if($a[$i] -eq 13 -and ($i+1) -lt $a.Length -and $a[$i+1] -eq 10){$buffer.WriteByte([byte]10);$i++}
   else{$buffer.WriteByte($a[$i])}
  }
  return ,($buffer.ToArray())
 }finally{$buffer.Dispose()}
}
function ByteSHA([byte[]]$a){
 $sha=[Security.Cryptography.SHA256]::Create()
 try{return [BitConverter]::ToString($sha.ComputeHash($a)).Replace('-','')}
 finally{$sha.Dispose()}
}
function AuditWorktree([string]$checkout,[string]$phase,[string]$settingsHash,[string]$rspHash){
 $git=(Get-Command git.exe -ErrorAction Stop).Source
 $label=if($phase -eq 'BEFORE'){'initial-eol-status'}else{'configured-eol-status'}
 Exec $git @('-C',(Quote $checkout),'-c','core.quotePath=false','status','--porcelain=v1','-z','--untracked-files=all') $script:Root $label|Out-Null
 $statusLog=Join-Path $script:Root ('logs\'+('{0:D2}' -f $script:Step)+'_'+$label+'.stdout.txt')
 $utf8=New-Object System.Text.UTF8Encoding($false,$true)
 $records=@($utf8.GetString([IO.File]::ReadAllBytes($statusLog)).Split([char]0)|Where-Object {$_.Length -gt 0})
 $audit=@();$temporaries=@();$paths=@{}
 $setRel=$ProjectSubdir+'/ProjectSettings/ProjectSettings.asset'
 $rspRel=$ProjectSubdir+'/Assets/csc.rsp'
 $root=[IO.Path]::GetFullPath($checkout).TrimEnd('\','/')+[IO.Path]::DirectorySeparatorChar
 foreach($r in $records){
  Ensure ($r.Length -ge 4 -and $r[2] -eq ' ') 'Malformed porcelain -z record'
  $status=$r.Substring(0,2);$relative=$r.Substring(3)
  Ensure (-not $paths.ContainsKey($relative)) ('Duplicate Git status path: '+$relative)
  $paths[$relative]=$true
  Ensure ($relative.Length -gt 0 -and -not $relative.StartsWith('/') -and -not $relative.Contains('\') -and -not $relative.Contains(':') -and -not (@($relative.Split('/')) -contains '..')) ('Unsafe path: '+$relative)
  $disk=[IO.Path]::GetFullPath((Join-Path $checkout ($relative.Replace('/',[IO.Path]::DirectorySeparatorChar))))
  Ensure ($disk.StartsWith($root,[StringComparison]::OrdinalIgnoreCase)) ('Escaped checkout root: '+$relative)
  if($phase -eq 'AFTER' -and $status -ceq ' M' -and $relative -ceq $setRel){
   Ensure ((Hash $disk) -ceq $settingsHash) 'Temporary ProjectSettings byte drift'
   $temporaries+= [ordered]@{path=$relative;kind='EXPECTED_PROJECT_SETTINGS';sha256=(Hash $disk)}
   continue
  }
  if($phase -eq 'AFTER' -and $status -ceq '??' -and $relative -ceq $rspRel){
   Ensure ((Hash $disk) -ceq $rspHash) 'Temporary csc.rsp byte drift'
   $temporaries+= [ordered]@{path=$relative;kind='EXPECTED_CSC_RSP';sha256=(Hash $disk)}
   continue
  }
  Ensure ($status -ceq ' M') ('Forbidden git status '+$status+' for '+$relative)
  Ensure (Test-Path -LiteralPath $disk -PathType Leaf) ('Missing tracked file: '+$relative)
  Ensure ($relative -match '\.(cs|json|md|cjs|ps1)$') ('Non-text/unapproved changed file: '+$relative)
  $attr=Exec $git @('-C',(Quote $checkout),'check-attr','eol','--',(Quote $relative)) $script:Root 'check-eol-attribute'
  Ensure ($attr -match ': eol: lf$') ('No explicit eol=lf: '+$relative)
  $eol=Exec $git @('-C',(Quote $checkout),'ls-files','--eol','--',(Quote $relative)) $script:Root 'check-index-eol'
  Ensure ($eol -match 'i/(crlf|mixed)\s+w/lf\s+attr/text eol=lf') ('Index/worktree EOL mismatch: '+$relative+' '+$eol)
  $blob=Exec $git @('-C',(Quote $checkout),'rev-parse',('HEAD:'+$relative)) $script:Root 'head-blob-id'
  Ensure ($blob -match '^[0-9a-f]{40}$') ('Invalid pinned Git blob: '+$relative)
  $tmp=Join-Path $script:Root ('logs\raw-head-'+[Guid]::NewGuid().ToString('N')+'.tmp')
  $err=$tmp+'.err'
  $proc=Start-Process -FilePath $git -ArgumentList ('-C '+(Quote $checkout)+' cat-file blob '+$blob) -WorkingDirectory $script:Root -RedirectStandardOutput $tmp -RedirectStandardError $err -Wait -PassThru -WindowStyle Hidden
  Ensure ($proc.ExitCode -eq 0) ('Cannot retrieve Git HEAD raw bytes: '+$relative)
  $before=[IO.File]::ReadAllBytes($tmp)
  [IO.File]::Delete($tmp);[IO.File]::Delete($err)
  $work=[IO.File]::ReadAllBytes($disk)
  Ensure (-not ($before -contains [byte]0) -and -not ($work -contains [byte]0)) ('Binary NUL content: '+$relative)
  Ensure (-not (ByteEqual $before $work)) ('Modified flag but identical bytes: '+$relative)
  $normalized=CanonicalLF $before
  Ensure ($before.Length -gt $normalized.Length) ('HEAD lacks CRLF: '+$relative)
  Ensure (ByteEqual $normalized $work) ('WAIT_OTHER_DIFF: non-EOL source bytes: '+$relative)
  $audit+= [ordered]@{path=$relative;classification='NORMALIZED_EOL_ONLY';gitBlob=$blob;headRawSHA256=(ByteSHA $before);workSHA256=(ByteSHA $work);normalizedSHA256=(ByteSHA $normalized);headBytes=$before.Length;workBytes=$work.Length;crlfRemoved=($before.Length-$normalized.Length);eolEvidence=$eol}
 }
 if($phase -eq 'BEFORE'){Ensure ($temporaries.Count -eq 0) 'Pre-build config files unexpectedly present'}
 else{Ensure ($temporaries.Count -eq 2) 'Exactly two disposable diagnostic config files required'}
 return [ordered]@{phase=$phase;classification=if($audit.Count){'NORMALIZED_EOL_ONLY'}else{'CLEAN_EXACT'};modifiedCount=$audit.Count;verifiedFiles=@($audit);temporaries=@($temporaries);porcelainLogSHA256=(Hash $statusLog)}
}
function Collect([string]$folder){
 $source=Join-Path $folder 'source'
 $project=Join-Path $source $ProjectSubdir
 $player=Join-Path $project 'Builds\Windows'
 $exe=Join-Path $player 'CoreClash.exe'
 $dll=Join-Path $player 'CoreClash_Data\Managed\Assembly-CSharp.dll'
 $buildLog=Join-Path $folder 'logs\unity-editor.log'
 $buildJson=Join-Path $project 'Evidence\R16\Unity\build-StandaloneWindows64.json'
 $provenance=Join-Path $folder 'logs\source-provenance.json'
 Ensure (Test-Path -LiteralPath $provenance -PathType Leaf) 'Source attestation missing'
 $identity=Get-Content -LiteralPath $provenance -Raw|ConvertFrom-Json
 Ensure ($identity.sourceSHA -eq $SourceSHA -and $identity.projectTreeSHA -eq $TreeSHA) 'Wrong source identity'
 $exeHash=Hash $exe;$dllHash=Hash $dll
 Ensure ($dllHash -ne $OldW6Dll) 'Old W6 DLL reused: diagnostic build is unverified'
 Ensure ((Get-Content -LiteralPath $buildLog -Raw).Contains('CORE_CLASH_BUILD_PASS StandaloneWindows64')) 'Build PASS log marker missing'
 $summary=Get-Content -LiteralPath $buildJson -Raw|ConvertFrom-Json
 Ensure ($summary.result -eq 'Succeeded' -and [int]$summary.errors -eq 0) 'Unity build result not SUCCESS/0 errors'
 $binary=[IO.File]::ReadAllBytes($dll)
 $compiled=(Marker $binary ([Text.Encoding]::Unicode.GetBytes($Symbol))) -or (Marker $binary ([Text.Encoding]::ASCII.GetBytes($Symbol)))
 Ensure $compiled 'Diagnostic marker absent in the compiled DLL'
 $evidence=Join-Path $folder 'evidence'
 Ensure (-not (Test-Path -LiteralPath $evidence)) 'Existing evidence folder must never be overwritten'
 New-Item -ItemType Directory -Path $evidence|Out-Null
 foreach($item in @(
    @($exe,'player-binaries\CoreClash.exe'),
    @($dll,'player-binaries\CoreClash_Data\Managed\Assembly-CSharp.dll'),
    @($buildLog,'unity-editor.log'),
    @($buildJson,'build-StandaloneWindows64.json'),
    @($provenance,'source-provenance.json')
 )){
  $dest=Join-Path $evidence $item[1]
  New-Item -ItemType Directory -Path (Split-Path -Parent $dest) -Force|Out-Null
  Copy-Item -LiteralPath $item[0] -Destination $dest
 }
 $playerExitLog=Join-Path $folder 'logs\player-exit.json'
 $playerExitCode=$null
 if(Test-Path -LiteralPath $playerExitLog -PathType Leaf){
  $exitRecord=Get-Content -LiteralPath $playerExitLog -Raw|ConvertFrom-Json
  $playerExitCode=[int]$exitRecord.exitCode
  Copy-Item -LiteralPath $playerExitLog -Destination (Join-Path $evidence 'player-exit.json')
 }
 $playerLog=Join-Path $folder 'logs\Player.log'
 $runtimeStatus='NOT_RUN'
 if(Test-Path -LiteralPath $playerLog -PathType Leaf){
  $logText=Get-Content -LiteralPath $playerLog -Raw
  $runtimeStatus=if($logText.Contains('CC001_PHOENIX_DIAGNOSTIC') -and $logText.Contains('stage=MATCH_START')){'MATCH_START_OBSERVED'}else{'WAIT_MATCH_START'}
  Copy-Item -LiteralPath $playerLog -Destination (Join-Path $evidence 'Player.log')
 }
 $screenNames=@()
 foreach($png in @(Get-ChildItem -LiteralPath (Join-Path $folder 'Screenshots') -File -Filter '*.png'|Sort-Object Name)){
  Ensure ($png.Length -gt 1024) ('Suspicious screenshot: '+$png.Name)
  $bytes=[IO.File]::ReadAllBytes($png.FullName)
  Ensure ([BitConverter]::ToString($bytes,0,8) -eq '89-50-4E-47-0D-0A-1A-0A') ('Bad PNG: '+$png.Name)
  $dest=Join-Path $evidence ('Screenshots\'+$png.Name)
  New-Item -ItemType Directory -Path (Split-Path -Parent $dest) -Force|Out-Null
  Copy-Item -LiteralPath $png.FullName -Destination $dest
  $screenNames+= $png.Name
 }
 $inventory=@()
 foreach($f in @(Get-ChildItem -LiteralPath $player -File -Recurse|Sort-Object FullName)){
  $inventory+= [ordered]@{path=$f.FullName.Substring($player.Length).TrimStart('\','/').Replace('\','/');bytes=$f.Length;sha256=(Hash $f.FullName)}
 }
 Ensure ($inventory.Count -gt 4) 'Windows Player output is incomplete'
 $payload=@()
 foreach($f in @(Get-ChildItem -LiteralPath $evidence -Recurse -File|Sort-Object FullName)){
  $payload+= [ordered]@{path=$f.FullName.Substring($evidence.Length).TrimStart('\','/').Replace('\','/');bytes=$f.Length;sha256=(Hash $f.FullName)}
 }
 Json (Join-Path $evidence 'manifest.json') ([ordered]@{
  schema='CC001-W7-A72-PHOENIX-DIAGNOSTIC-1'
  sourceSHA=$SourceSHA;projectTreeSHA=$TreeSHA;sourceBlob=$AppBlob
  generatedUtc=(Get-Date).ToUniversalTime().ToString('o')
  unityEditorVersion='6000.4.0f1';target='StandaloneWindows64';scriptingDefine=$Symbol
  markerInCompiledAssembly=$compiled
  unityBuild=$summary.result;unityErrors=$summary.errors;unityWarnings=$summary.warnings
  exeSHA256=$exeHash;assemblyCSharpSHA256=$dllHash;unityBuildLogSHA256=(Hash $buildLog)
  playerLogStatus=$runtimeStatus;playerProcessExitCode=$playerExitCode;screenshotNames=$screenNames
  playerFileInventory=$inventory;includedFiles=$payload
  phoenixUIResult='NOT_EVALUATED_BY_A72'
  limitations='Screenshots are checked for PNG signature only; A60 must inspect actual game window and match BEFORE/AFTER same run/match/trace. ZIP is evidence, not a complete runnable Windows Player installation.'
 })
 $zip=Join-Path $folder 'CC001_W7_A72_DIAGNOSTIC_EVIDENCE.zip'
 Ensure (-not (Test-Path -LiteralPath $zip)) 'Existing evidence ZIP: refuse overwrite'
 Compress-Archive -Path (Join-Path $evidence '*') -DestinationPath $zip -CompressionLevel Optimal
 $receipt='ZIP: '+$zip+[Environment]::NewLine+'SHA256: '+(Hash $zip)+[Environment]::NewLine+'SOURCE: '+$SourceSHA+[Environment]::NewLine+'PHOENIX_REAL_UI: NOT_EVALUATED_BY_A72'+[Environment]::NewLine
 [IO.File]::WriteAllText((Join-Path $folder 'EVIDENCE_SHA256.txt'),$receipt,(New-Object System.Text.UTF8Encoding($false)))
 Write-Host $receipt -ForegroundColor Green
}
try {
 Ensure ([Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT) 'Windows required'
 Ensure ($PSVersionTable.PSVersion.Major -ge 5) 'PowerShell 5.1+ required'
 if($Mode -eq 'Collect'){
  Ensure (-not [string]::IsNullOrWhiteSpace($RunFolder)) 'Collect requires -RunFolder'
  $script:Root=[IO.Path]::GetFullPath($RunFolder)
  Ensure (Test-Path -LiteralPath $script:Root -PathType Container) 'RunFolder missing'
  Ensure ((Get-Process CoreClash -ErrorAction SilentlyContinue|Measure-Object).Count -eq 0) 'Close Windows Player first'
  Collect $script:Root
  return
 }
 Ensure ([string]::IsNullOrWhiteSpace($RunFolder)) 'Build creates its own fresh folder'
 $git=(Get-Command git.exe -ErrorAction Stop).Source
 Ensure (Test-Path -LiteralPath $UnityExe -PathType Leaf) ('Missing Unity.exe: '+$UnityExe)
 Ensure ($UnityExe.Replace('/','\') -match '\\6000\.4\.0f1\\Editor\\Unity\.exe$') 'Unity must be version 6000.4.0f1'
 $downloads=Join-Path $env:USERPROFILE 'Downloads'
 New-Item -ItemType Directory -Path $downloads -Force|Out-Null
 $script:Root=Join-Path $downloads ('CC001_W7_DIAG_'+(Get-Date -Format 'yyyyMMdd_HHmmss')+'_'+[Guid]::NewGuid().ToString('N').Substring(0,8))
 Ensure (-not (Test-Path -LiteralPath $script:Root)) 'Run directory unexpectedly exists'
 New-Item -ItemType Directory -Path $script:Root|Out-Null
 New-Item -ItemType Directory -Path (Join-Path $script:Root 'logs')|Out-Null
 New-Item -ItemType Directory -Path (Join-Path $script:Root 'Screenshots')|Out-Null
 $checkout=Join-Path $script:Root 'source'
 Write-Host ('RUN: '+$script:Root)
 Exec $git @('clone','--single-branch','--branch',$Branch,'--no-checkout','https://github.com/C8LyNn/aplikacja-turnieje.git',(Quote $checkout)) $script:Root 'clone'|Out-Null
 $head=Exec $git @('-C',(Quote $checkout),'rev-parse','HEAD') $script:Root 'head'
 Ensure ($head -ceq $SourceSHA) ('Branch moved: '+$head)
 Exec $git @('-C',(Quote $checkout),'checkout','--detach',$SourceSHA) $script:Root 'checkout'|Out-Null
 Ensure ((Exec $git @('-C',(Quote $checkout),'rev-parse','HEAD') $script:Root 'recheck') -ceq $SourceSHA) 'Detached SHA wrong'
 $tree=Exec $git @('-C',(Quote $checkout),'rev-parse',('HEAD:'+$ProjectSubdir)) $script:Root 'tree'
 Ensure ($tree -ceq $TreeSHA) ('Source tree mismatch: '+$tree)
 $blob=Exec $git @('-C',(Quote $checkout),'rev-parse',('HEAD:'+$ProjectSubdir+'/Assets/CoreClash/Presentation/CoreClashApp.cs')) $script:Root 'blob'
 Ensure ($blob -ceq $AppBlob) 'Diagnostic C# blob mismatch'
 $auditBefore=AuditWorktree $checkout 'BEFORE' '' ''
 Json (Join-Path $script:Root 'logs\checkout-eol-before.json') $auditBefore
 Write-Host ('CHECKOUT: '+$auditBefore.classification+' / '+$auditBefore.modifiedCount+' tracked paths') -ForegroundColor Yellow
 $project=Join-Path $checkout $ProjectSubdir
 Ensure ((Get-Content -LiteralPath (Join-Path $project 'ProjectSettings\ProjectVersion.txt') -Raw).Contains('m_EditorVersion: 6000.4.0f1')) 'Project Unity version wrong'
 Ensure ((Get-Content -LiteralPath (Join-Path $project 'Assets\CoreClash\Presentation\CoreClashApp.cs') -Raw).Contains('#if CC001_PHOENIX_DIAGNOSTIC')) 'Diagnostic source guard missing'
 $rsp=Join-Path $project 'Assets\csc.rsp'
 Ensure (-not (Test-Path -LiteralPath $rsp)) 'Existing csc.rsp; refusing overwrite'
 [IO.File]::WriteAllText($rsp,('-define:'+$Symbol+[Environment]::NewLine),(New-Object System.Text.UTF8Encoding($false)))
 $settings=Join-Path $project 'ProjectSettings\ProjectSettings.asset'
 $settingsText=[IO.File]::ReadAllText($settings)
 Ensure ($settingsText.Contains('  scriptingDefineSymbols: {}')) 'Unexpected existing scripting defines'
 $settingsText=$settingsText.Replace('  scriptingDefineSymbols: {}',('  scriptingDefineSymbols:'+[Environment]::NewLine+'    Standalone: '+$Symbol))
 [IO.File]::WriteAllText($settings,$settingsText,(New-Object System.Text.UTF8Encoding($false)))
 $auditAfter=AuditWorktree $checkout 'AFTER' (Hash $settings) (Hash $rsp)
 Json (Join-Path $script:Root 'logs\checkout-eol-after.json') $auditAfter
 $beforePaths=@($auditBefore.verifiedFiles|ForEach-Object {$_.path}|Sort-Object)
 $afterPaths=@($auditAfter.verifiedFiles|ForEach-Object {$_.path}|Sort-Object)
 Ensure (($beforePaths -join [char]0) -ceq ($afterPaths -join [char]0)) 'Normalized path list changed during config'
 foreach($old in $auditBefore.verifiedFiles){
  $new=@($auditAfter.verifiedFiles|Where-Object {$_.path -ceq $old.path})
  Ensure ($new.Count -eq 1 -and $new[0].workSHA256 -ceq $old.workSHA256) ('Tracked source bytes changed after temporary config: '+$old.path)
 }
 Json (Join-Path $script:Root 'logs\source-provenance.json') ([ordered]@{
  sourceSHA=$SourceSHA;projectTreeSHA=$TreeSHA;coreClashAppBlob=$AppBlob
  sourceBranch=$Branch;initialGitClean=($auditBefore.modifiedCount -eq 0);checkoutClassification=$auditBefore.classification;checkoutNormalizedFileCount=$auditBefore.modifiedCount;eolBeforeAuditSHA256=(Hash (Join-Path $script:Root 'logs\checkout-eol-before.json'));eolAfterAuditSHA256=(Hash (Join-Path $script:Root 'logs\checkout-eol-after.json'));changesAreDisposable=$true
  unityExe=$UnityExe;unityExeSHA256=(Hash $UnityExe);unityVersion='6000.4.0f1'
  buildTarget='StandaloneWindows64';define=$Symbol
  defineConfiguredVia='temporary Assets/csc.rsp and Standalone PlayerSettings'
  rspSHA256=(Hash $rsp);modifiedProjectSettingsSHA256=(Hash $settings)
  hostOS=[Environment]::OSVersion.VersionString
  utc=(Get-Date).ToUniversalTime().ToString('o')
 })
 $buildLog=Join-Path $script:Root 'logs\unity-editor.log'
 Write-Host 'Building Unity StandaloneWindows64 via CoreClash.Editor.BuildTools.BuildWindows...' -ForegroundColor Cyan
 Exec $UnityExe @('-batchmode','-nographics','-quit','-buildTarget','StandaloneWindows64','-projectPath',(Quote $project),'-executeMethod','CoreClash.Editor.BuildTools.BuildWindows','-logFile',(Quote $buildLog)) $project 'unity-build'|Out-Null
 if(-not $NoPlayer){
  $exe=Join-Path $project 'Builds\Windows\CoreClash.exe'
  Ensure (Test-Path -LiteralPath $exe -PathType Leaf) 'Player exe missing'
  $playerLog=Join-Path $script:Root 'logs\Player.log'
  Write-Host ''
  Write-Host 'OFFLINE: Choose fire_3, spend Phoenix x1, wait for HAND READY at stock0.' -ForegroundColor Yellow
  Write-Host 'Mouse-click Phoenix. Press 0 then 1. Aim and RELEASE. Close game normally.'
  Write-Host ('Save real GAME WINDOW PNGs in: '+(Join-Path $script:Root 'Screenshots'))
  Write-Host 'Capture with Alt+PrintScreen+Paint or Win+Shift+S WINDOW mode; inspect image.'
  Read-Host 'Press ENTER to start visible diagnostic Player'|Out-Null
  $playerArgs='-force-d3d11 -screen-fullscreen 0 -screen-width 1280 -screen-height 900 -logFile '+(Quote $playerLog)
  $p=Start-Process -FilePath $exe -ArgumentList $playerArgs -WorkingDirectory (Split-Path -Parent $exe) -Wait -PassThru -WindowStyle Normal
  Json (Join-Path $script:Root 'logs\player-exit.json') ([ordered]@{exitCode=$p.ExitCode;endUtc=(Get-Date).ToUniversalTime().ToString('o');arguments=$playerArgs})
 }
 Collect $script:Root
 Write-Host ('DONE: See '+$script:Root) -ForegroundColor Green
} catch {
 Write-Host ('A72 STOP: '+$_.Exception.Message) -ForegroundColor Red
 if($script:Root -and (Test-Path -LiteralPath $script:Root)){
  [IO.File]::WriteAllText((Join-Path $script:Root 'FAILURE.txt'),($_|Out-String),(New-Object System.Text.UTF8Encoding($false)))
 }
 exit 1
}
