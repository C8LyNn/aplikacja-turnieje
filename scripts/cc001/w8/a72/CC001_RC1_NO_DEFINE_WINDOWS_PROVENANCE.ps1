# CC-001 R17-W8 / A72: immutable production RC1 no-diagnostic one-shot Windows build.
# Source code, Git history, .gitattributes, CI, protected branches and project settings NEVER changed.
[CmdletBinding()]
param(
  [string]$UnityExe='C:\Program Files\Unity\Hub\Editor\6000.4.0f1\Editor\Unity.exe',
  [switch]$NoZip
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$SourceSHA='10f64e4d213f17a352ed8fa83bc75884a39549f0'
$TopTree='304f7f2811900c0b2b7771ec567170365f709c50'
$TreeSHA='328b6c7248c9c86f0b5910a96502915dc2234ae0'
$AppBlob='33be4b892d85bd3b68d08a1a79d5aab39d256600'
$BuildToolsBlob='d4866b0ee5e5ef9c92c94a900a5fc8f9121beab9'
$ProjectSettingsBlob='8a0952f873139d850d1a4cc3d51774038b498ac5'
$SourceBranch='integration/cc001-r17-w8-phoenix-rc1'
$ProjectSubdir='unity/cc001-r16/CoreClash-V149-Unity'
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
 $utf8=[System.Text.UTF8Encoding]::new($false,$true)
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
  Ensure ($status -ceq ' M') ('Forbidden git status '+$status+' for '+$relative)
  Ensure (Test-Path -LiteralPath $disk -PathType Leaf) ('Missing tracked file: '+$relative)
  Ensure ($relative -match '\.(cs|json|md|cjs|ps1)$') ('Non-text/unapproved changed file: '+$relative)
  $attr=Exec $git @('-C',(Quote $checkout),'check-attr','eol','--',(Quote $relative)) $script:Root 'check-eol-attribute'
  Ensure ($attr -match ': eol: lf$') ('No explicit eol=lf: '+$relative)
  $eol=Exec $git @('-C',(Quote $checkout),'ls-files','--eol','--',(Quote $relative)) $script:Root 'check-index-eol'
  Ensure ($eol -match 'i/(crlf|mixed)\s+w/(lf|crlf|mixed)\s+attr/text eol=lf') ('Index/worktree EOL mismatch: '+$relative+' '+$eol)
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
  $normalized=CanonicalLF $before
  Ensure ($before.Length -gt $normalized.Length) ('HEAD lacks CRLF: '+$relative)
  if(ByteEqual $before $work){
   Ensure ($eol -match 'w/(crlf|mixed)\s+attr/text eol=lf') ('Unchanged bytes but unexplained EOL metadata: '+$relative)
   $class='HEAD_BYTES_IDENTICAL_EOL_INDEX'
  }else{
   Ensure ($eol -match 'w/lf\s+attr/text eol=lf') ('Changed bytes but worktree is not LF: '+$relative)
   Ensure (ByteEqual $normalized $work) ('WAIT_OTHER_DIFF: non-EOL source bytes: '+$relative)
   $class='NORMALIZED_EOL_ONLY'
  }
  $audit+= [ordered]@{path=$relative;classification=$class;gitBlob=$blob;headRawSHA256=(ByteSHA $before);workSHA256=(ByteSHA $work);normalizedSHA256=(ByteSHA $normalized);headBytes=$before.Length;workBytes=$work.Length;crlfRemoved=($before.Length-$normalized.Length);eolEvidence=$eol}
 }
 Ensure ($temporaries.Count -eq 0) 'No temporary or untracked source changes are permitted in RC1'
 return [ordered]@{phase=$phase;classification=if($audit.Count){'EOL_ONLY_BYTE_PROVEN'}else{'CLEAN_EXACT'};modifiedCount=$audit.Count;verifiedFiles=@($audit);temporaries=@($temporaries);porcelainLogSHA256=(Hash $statusLog)}
}

# Git tracked project source-byte manifest, sha256 against the exact immutable ref.
function SourceInventory([string]$checkout){
 $git=(Get-Command git.exe -ErrorAction Stop).Source
 Exec $git @('-C',(Quote $checkout),'-c','core.quotePath=false','ls-files','-z','--',$ProjectSubdir) $script:Root 'tracked-source-files'|Out-Null
 $log=Join-Path $script:Root ('logs\'+('{0:D2}' -f $script:Step)+'_tracked-source-files.stdout.txt')
 $raw=[IO.File]::ReadAllBytes($log)
 $encoding=[System.Text.UTF8Encoding]::new($false,$true)
 $paths=@($encoding.GetString($raw).Split([char]0)|Where-Object {$_.Length -gt 0})
 Ensure ($paths.Count -gt 100) 'Truncated Git tracked source file list'
 $items=@()
 $pref=[IO.Path]::GetFullPath($checkout).TrimEnd('\','/')+[IO.Path]::DirectorySeparatorChar
 foreach($relative in $paths){
  Ensure ($relative.StartsWith($ProjectSubdir+'/',[StringComparison]::Ordinal)) ('Unexpected tracked path: '+$relative)
  $f=[IO.Path]::GetFullPath((Join-Path $checkout ($relative.Replace('/',[IO.Path]::DirectorySeparatorChar))))
  Ensure ($f.StartsWith($pref,[StringComparison]::OrdinalIgnoreCase)) ('Source path outside root: '+$relative)
  Ensure (Test-Path -LiteralPath $f -PathType Leaf) ('Missing tracked source: '+$relative)
  $fi=Get-Item -LiteralPath $f
  Ensure (-not (($fi.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0)) ('Reparse point in project: '+$relative)
  $items+= [ordered]@{path=$relative;bytes=$fi.Length;sha256=(Hash $f)}
 }
 return ,$items
}
function NoDiagnostic([string]$project,[string]$phase){
 $settings=Join-Path $project 'ProjectSettings\ProjectSettings.asset'
 $raw=[IO.File]::ReadAllText($settings)
 Ensure ($raw -match '(?m)^\s*scriptingDefineSymbols:\s*\{\}\s*$') 'Unexpected effective PlayerSettings defines'
 Ensure (-not $raw.Contains($Symbol)) 'Diagnostic define found in ProjectSettings'
 $core=Join-Path $project 'Assets\CoreClash\Presentation\CoreClashApp.cs'
 Ensure (-not ([IO.File]::ReadAllText($core).Contains($Symbol))) 'W7 diagnostic C# detected (wrong source)'
 $response=@(Get-ChildItem -LiteralPath $project -Filter '*.rsp' -File -Recurse -ErrorAction Stop)
 foreach($rsp in $response){
  $body=[IO.File]::ReadAllText($rsp.FullName)
  Ensure (-not $body.Contains($Symbol)) ('Diagnostic compiler response: '+$rsp.FullName)
  # For this reproducibility pass, reject ANY existing compiler response file,
  # which could introduce unrecorded #define directives or direct compiler args.
  throw ('Unapproved *.rsp compiler flags: '+$rsp.FullName)
 }
 foreach($key in @('UNITY_CSHARP_DEFINES','UNITY_EXTRA_DEFINES','CscToolPath','CscToolExe')){
  $v=[Environment]::GetEnvironmentVariable($key)
  Ensure ([string]::IsNullOrEmpty($v)) ('Unexpected external compiler override: '+$key)
 }
 return [ordered]@{phase=$phase;sourceContainsDiagnostic=$false;projectSettingsContainsDiagnostic=$false;settingsSHA256=(Hash $settings);responseFiles=@();environmentOverrides='NONE';result='PASS_SOURCE_CONFIGURATION_ONLY'}
}
function Collect([string]$folder,$sourceBefore,$auditBefore,$auditAfter,$noDefineBefore,$noDefineAfter){
 $checkout=Join-Path $folder 'source'
 $project=Join-Path $checkout $ProjectSubdir
 $player=Join-Path $project 'Builds\Windows'
 $exe=Join-Path $player 'CoreClash.exe'
 $dll=Join-Path $player 'CoreClash_Data\Managed\Assembly-CSharp.dll'
 $log=Join-Path $folder 'logs\unity-editor.log'
 $resultJson=Join-Path $project 'Evidence\R16\Unity\build-StandaloneWindows64.json'
 $receiptSource=Join-Path $folder 'logs\source-provenance.json'
 $hashExe=Hash $exe;$hashDll=Hash $dll
 $summary=Get-Content -LiteralPath $resultJson -Raw|ConvertFrom-Json
 Ensure ($summary.result -eq 'Succeeded' -and [int]$summary.errors -eq 0) 'Unity build result/errors do not attest SUCCESS'
 $text=Get-Content -LiteralPath $log -Raw
 Ensure ($text.Contains('CORE_CLASH_BUILD_PASS StandaloneWindows64')) 'Unity Windows success marker missing'
 Ensure (-not $text.Contains($Symbol)) 'Diagnostic define appears in Unity compiler/editor output'
 $data=[IO.File]::ReadAllBytes($dll)
 $marker=(Marker $data ([Text.Encoding]::ASCII.GetBytes($Symbol))) -or (Marker $data ([Text.Encoding]::Unicode.GetBytes($Symbol)))
 Ensure (-not $marker) 'Diagnostic marker embedded in compiled Assembly-CSharp.dll'
 $playerFiles=@(Get-ChildItem -LiteralPath $player -File -Recurse|Sort-Object FullName)
 Ensure ($playerFiles.Count -gt 4) 'Incomplete Windows Player file inventory'
 $inventory=@()
 foreach($f in $playerFiles){
  $rel=$f.FullName.Substring($player.Length).TrimStart('\','/').Replace('\','/')
  Ensure (-not (($f.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0)) ('Reparse/symlink in Player: '+$rel)
  $inventory+= [ordered]@{path=$rel;bytes=$f.Length;sha256=(Hash $f.FullName)}
 }
 $out=Join-Path $folder 'evidence'
 Ensure (-not (Test-Path -LiteralPath $out)) 'Refusing to overwrite evidence'
 New-Item -ItemType Directory -Path $out|Out-Null
 # Include the ENTIRE original built Player, not only the four W6 sample binaries.
 Copy-Item -LiteralPath $player -Destination (Join-Path $out 'WindowsPlayer') -Recurse
 New-Item -ItemType Directory -Path (Join-Path $out 'Logs')|Out-Null
 foreach($f in @(Get-ChildItem -LiteralPath (Join-Path $folder 'logs') -File)){
  Copy-Item -LiteralPath $f.FullName -Destination (Join-Path $out 'Logs')
 }
 $jsonOut=Join-Path $out 'UnityBuildResult.json'
 Copy-Item -LiteralPath $resultJson -Destination $jsonOut
 $included=@()
 foreach($f in @(Get-ChildItem -LiteralPath $out -Recurse -File|Sort-Object FullName)){
  $included+= [ordered]@{path=$f.FullName.Substring($out.Length).TrimStart('\','/').Replace('\','/');bytes=$f.Length;sha256=(Hash $f.FullName)}
 }
 $manifest=[ordered]@{
  schema='CC001-R17-W8-A72-RC1-PRODUCTION-NODEFINE-1'
  sourceCommit=$SourceSHA;sourceRef=$SourceBranch
  topGitTree=$TopTree;projectGitTree=$TreeSHA;coreClashAppGitBlob=$AppBlob
  unityVersion='6000.4.0f1';buildTarget='StandaloneWindows64'
  createdUTC=(Get-Date).ToUniversalTime().ToString('o')
  noDiagnosticSourceConfigurationBefore=$noDefineBefore
  noDiagnosticSourceConfigurationAfter=$noDefineAfter
  compilerLogMarkerPresent=$false;assemblyDllMarkerPresent=$false
  sourceFiles=@($sourceBefore);sourceFilesCount=@($sourceBefore).Count
  sourceSHA256Ledger=(Hash (Join-Path $folder 'logs\tracked-source-before.json'))
  checkoutEolBefore=$auditBefore;checkoutEolAfter=$auditAfter
  unityExecutableSHA256=(Get-Content -LiteralPath $receiptSource -Raw|ConvertFrom-Json).unityExeSHA256
  unityProcessExitCode=0;unityResult=$summary.result;unityErrors=[int]$summary.errors;unityWarnings=[int]$summary.warnings
  windowsEXE_SHA256=$hashExe;assemblyCSharpDLL_SHA256=$hashDll
  unityEditorLog_SHA256=(Hash $log)
  fullWindowsPlayerFileInventory=$inventory
  includedOriginalEvidenceFiles=$included
  acceptanceLimitations='This attests ONE pinned local Windows no-define build, not G3/G4 or gameplay. Independent A60 rehash/raw review still required.'
 }
 Json (Join-Path $out 'manifest.json') $manifest
 if(-not $NoZip){
  $zip=Join-Path $folder 'CC001_R17_W8_A72_RC1_NODEFINE_BUILD_EVIDENCE.zip'
  Ensure (-not (Test-Path -LiteralPath $zip)) 'Evidence ZIP already exists'
  Compress-Archive -Path (Join-Path $out '*') -DestinationPath $zip -CompressionLevel Optimal
  $h=Hash $zip
  [IO.File]::WriteAllText((Join-Path $folder 'EVIDENCE_SHA256.txt'),($h+'  '+[IO.Path]::GetFileName($zip)+[Environment]::NewLine),(New-Object System.Text.UTF8Encoding($false)))
  Write-Host ('EVIDENCE ZIP: '+$zip)
  Write-Host ('SHA256: '+$h)
 }else{Write-Host ('Evidence folder: '+$out)}
}
try{
 Ensure ([Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT) 'Windows 11 is required'
 Ensure ($PSVersionTable.PSVersion.Major -ge 5) 'Windows PowerShell 5.1+ required'
 $git=(Get-Command git.exe -ErrorAction Stop).Source
 Ensure (Test-Path -LiteralPath $UnityExe -PathType Leaf) ('Unity.exe missing: '+$UnityExe)
 Ensure ($UnityExe.Replace('/','\') -match '\\6000\.4\.0f1\\Editor\\Unity\.exe$') 'Wrong Unity editor version'
 $downloads=Join-Path $env:USERPROFILE 'Downloads'
 New-Item -ItemType Directory -Path $downloads -Force|Out-Null
 $script:Root=Join-Path $downloads ('CC001_RC1_NODEFINE_'+(Get-Date -Format 'yyyyMMdd_HHmmss')+'_'+[Guid]::NewGuid().ToString('N').Substring(0,8))
 Ensure (-not (Test-Path -LiteralPath $script:Root)) 'Run root already exists'
 New-Item -ItemType Directory -Path $script:Root|Out-Null
 New-Item -ItemType Directory -Path (Join-Path $script:Root 'logs')|Out-Null
 $checkout=Join-Path $script:Root 'source'
 Write-Host ('RUN FOLDER: '+$script:Root)
 Exec $git @('clone','--single-branch','--branch',$SourceBranch,'--no-checkout','https://github.com/C8LyNn/aplikacja-turnieje.git',(Quote $checkout)) $script:Root 'clone'|Out-Null
 $head=Exec $git @('-C',(Quote $checkout),'rev-parse','HEAD') $script:Root 'branch-head'
 Ensure ($head -ceq $SourceSHA) ('RC1 ref moved: '+$head)
 Exec $git @('-C',(Quote $checkout),'checkout','--detach',$SourceSHA) $script:Root 'pin-source'|Out-Null
 Ensure ((Exec $git @('-C',(Quote $checkout),'rev-parse','HEAD') $script:Root 'verify-source') -ceq $SourceSHA) 'Wrong detached RC1 HEAD'
 Ensure ((Exec $git @('-C',(Quote $checkout),'rev-parse','HEAD^{tree}') $script:Root 'verify-top-tree') -ceq $TopTree) 'Wrong full Git source tree'
 Ensure ((Exec $git @('-C',(Quote $checkout),'rev-parse',('HEAD:'+$ProjectSubdir)) $script:Root 'verify-project-tree') -ceq $TreeSHA) 'Wrong Unity project Git tree'
 Ensure ((Exec $git @('-C',(Quote $checkout),'rev-parse',('HEAD:'+$ProjectSubdir+'/Assets/CoreClash/Presentation/CoreClashApp.cs')) $script:Root 'verify-ui-blob') -ceq $AppBlob) 'Wrong production CoreClashApp C# Git blob'
 Ensure ((Exec $git @('-C',(Quote $checkout),'rev-parse',('HEAD:'+$ProjectSubdir+'/Assets/CoreClash/Editor/BuildTools.cs')) $script:Root 'verify-build-entrypoint') -ceq $BuildToolsBlob) 'Build entrypoint drift'
 Ensure ((Exec $git @('-C',(Quote $checkout),'rev-parse',('HEAD:'+$ProjectSubdir+'/ProjectSettings/ProjectSettings.asset')) $script:Root 'verify-settings-blob') -ceq $ProjectSettingsBlob) 'Player settings blob drift'
 $project=Join-Path $checkout $ProjectSubdir
 Ensure ((Get-Content -LiteralPath (Join-Path $project 'ProjectSettings\ProjectVersion.txt') -Raw).Contains('m_EditorVersion: 6000.4.0f1')) 'Wrong Unity source project version'
 $before=AuditWorktree $checkout 'BEFORE' '' ''
 Json (Join-Path $script:Root 'logs\checkout-eol-before.json') $before
 Write-Host ('PRE-BUILD EOL GATE: '+$before.classification+' / '+$before.modifiedCount+' tracked files') -ForegroundColor Yellow
 $noDefineBefore=NoDiagnostic $project 'BEFORE'
 $inventoryBefore=SourceInventory $checkout
 Json (Join-Path $script:Root 'logs\tracked-source-before.json') $inventoryBefore
 $settings=Join-Path $project 'ProjectSettings\ProjectSettings.asset'
 $noDefineAfter=NoDiagnostic $project 'PRE_COMPILE'
 $after=AuditWorktree $checkout 'AFTER' '' ''
 Json (Join-Path $script:Root 'logs\checkout-eol-after.json') $after
 Ensure (($before.verifiedFiles.Count -eq $after.verifiedFiles.Count)) 'Checkout EOL tracked count drift'
 foreach($item in @($before.verifiedFiles)){
  $matching=@($after.verifiedFiles|Where-Object {$_.path -ceq $item.path})
  Ensure ($matching.Count -eq 1 -and $matching[0].workSHA256 -ceq $item.workSHA256) ('EOL audit source changed: '+$item.path)
 }
 $inventoryPrecompile=SourceInventory $checkout
 Ensure ($inventoryPrecompile.Count -eq $inventoryBefore.Count) 'Source file count drift'
 for($i=0;$i -lt $inventoryBefore.Count;$i++){
  Ensure ($inventoryPrecompile[$i].path -ceq $inventoryBefore[$i].path -and $inventoryPrecompile[$i].sha256 -ceq $inventoryBefore[$i].sha256) ('Source byte drift before compile: '+$inventoryBefore[$i].path)
 }
 Json (Join-Path $script:Root 'logs\source-provenance.json') ([ordered]@{
  sourceSHA=$SourceSHA;sourceBranch=$SourceBranch;topTreeSHA=$TopTree;projectTreeSHA=$TreeSHA
  appGitBlob=$AppBlob;buildToolsGitBlob=$BuildToolsBlob;projectSettingsGitBlob=$ProjectSettingsBlob
  unityExe=$UnityExe;unityExeSHA256=(Hash $UnityExe);unityVersion='6000.4.0f1'
  checkoutPreflight=$before.classification;trackedNormalizedCount=$before.modifiedCount
  sourceCount=$inventoryBefore.Count;sourceLedgerSHA256=(Hash (Join-Path $script:Root 'logs\tracked-source-before.json'))
  noDiagnosticBefore=$noDefineBefore;noDiagnosticPrecompile=$noDefineAfter
  symbol=$Symbol;symbolRequiredAbsent=$true;noSourceWritesByOperator=$true
  hostOS=[Environment]::OSVersion.VersionString;utc=(Get-Date).ToUniversalTime().ToString('o')
 })
 $buildLog=Join-Path $script:Root 'logs\unity-editor.log'
 Write-Host 'Starting ONE no-diagnostic Unity 6000.4.0f1 Windows build...' -ForegroundColor Cyan
 Exec $UnityExe @('-batchmode','-nographics','-quit','-buildTarget','StandaloneWindows64','-projectPath',(Quote $project),'-executeMethod','CoreClash.Editor.BuildTools.BuildWindows','-logFile',(Quote $buildLog)) $project 'unity-build'|Out-Null
 # Source provenance must remain immutable after Unity's editor-side setup.
 $sourceAfter=SourceInventory $checkout
 Ensure ($sourceAfter.Count -eq $inventoryBefore.Count) 'Unity changed tracked source count'
 for($i=0;$i -lt $inventoryBefore.Count;$i++){
  Ensure ($sourceAfter[$i].path -ceq $inventoryBefore[$i].path -and $sourceAfter[$i].sha256 -ceq $inventoryBefore[$i].sha256) ('Unity mutated tracked source bytes: '+$inventoryBefore[$i].path)
 }
 $post=NoDiagnostic $project 'AFTER_UNITY_BUILD'
 $auditPost=AuditWorktree $checkout 'AFTER' '' ''
 Json (Join-Path $script:Root 'logs\checkout-eol-after-unity.json') $auditPost
 Ensure ($auditPost.verifiedFiles.Count -eq $before.verifiedFiles.Count) 'Unity modified tracked worktree status'
 Collect $script:Root $inventoryBefore $before $auditPost $noDefineBefore $post
 Write-Host 'BUILD PROVENANCE EVIDENCE READY. Give ZIP + SHA256 receipt to A60.' -ForegroundColor Green
}catch{
 Write-Host ('A72 FAIL-CLOSED: '+$_.Exception.Message) -ForegroundColor Red
 if($script:Root -and (Test-Path -LiteralPath $script:Root)){
  [IO.File]::WriteAllText((Join-Path $script:Root 'FAILURE.txt'),($_|Out-String),(New-Object System.Text.UTF8Encoding($false)))
  Write-Host ('ERROR RECORD: '+(Join-Path $script:Root 'FAILURE.txt'))
 }
 exit 1
}
