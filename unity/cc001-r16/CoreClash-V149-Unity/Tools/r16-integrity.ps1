param([string]$InputArchive=(Join-Path $PSScriptRoot '../../../Input/CoreClash-V149-R15-Source-Candidate.zip'))
$ErrorActionPreference='Stop'
$ccRoot=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$ccOutput=Join-Path $ccRoot 'Evidence/R16'
New-Item -ItemType Directory -Path $ccOutput -Force|Out-Null
$ccZipHash=(Get-FileHash -LiteralPath $InputArchive -Algorithm SHA256).Hash.ToLowerInvariant()
if($ccZipHash -ne 'f70497f8be326e34e2f87bbe54c0716294e35887ef5ab9d993a5ae5cade3e21e'){throw 'Wrong R15 input ZIP'}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$ccArchive=[IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $InputArchive).Path)
try{
 $ccEntries=[ordered]@{}
 foreach($ccEntry in $ccArchive.Entries){
  if(-not $ccEntry.Name){continue}
  $ccStream=$ccEntry.Open()
  try{$ccSha=[Security.Cryptography.SHA256]::Create();$ccHash=[Convert]::ToHexString($ccSha.ComputeHash($ccStream)).ToLowerInvariant()}finally{$ccStream.Dispose();$ccSha.Dispose()}
  $ccEntries[$ccEntry.FullName]=[ordered]@{bytes=$ccEntry.Length;sha256=$ccHash}
 }
}finally{$ccArchive.Dispose()}
$ccHistory=@()
foreach($ccVersion in @('R10','R11','R12')){
 $ccManifest=Get-Content -LiteralPath (Join-Path $ccRoot "../${ccVersion}_CANDIDATE_MANIFEST.json") -Raw|ConvertFrom-Json
 foreach($ccItem in $ccManifest.changed_files.PSObject.Properties){
  $ccExpected=if($ccItem.Value -is [string]){$ccItem.Value}else{$ccItem.Value.sha256}
  $ccPath='CoreClash-V149-Unity/'+$ccItem.Name
  $ccActual=$ccEntries[$ccPath].sha256
  $ccHistory+=[ordered]@{manifest=$ccVersion;path=$ccItem.Name;expected=$ccExpected;actualR15=$ccActual;status=if($ccExpected -eq $ccActual){'MATCH'}else{'DIFFERS_IN_LATER_CANDIDATE_NOT_A_CURRENT_MANIFEST'}}
 }
}
$ccProtected=@('Reference/V148_reference_original.html')+@($ccEntries.Keys|Where-Object {$_ -like 'CoreClash-V149-Unity/Assets/Resources/Data/*' -or $_ -like 'CoreClash-V149-Unity/Evidence/*' -or $_ -like '*CANDIDATE*REPORT*' -or $_ -like '*HANDOFF*'})
$ccChecks=foreach($ccPath in $ccProtected){$ccLocal=Join-Path (Split-Path $ccRoot) $ccPath;[ordered]@{path=$ccPath;pass=(Test-Path -LiteralPath $ccLocal) -and ((Get-FileHash -LiteralPath $ccLocal -Algorithm SHA256).Hash.ToLowerInvariant() -eq $ccEntries[$ccPath].sha256)}}
$ccPass=@($ccChecks|Where-Object {-not $_.pass}).Count -eq 0
$ccReport=[ordered]@{date=[DateTime]::UtcNow.ToString('o');inputSha256=$ccZipHash;inputEntryCount=$ccEntries.Count;protectedFiles=$ccChecks;protectedUnchanged=$ccPass;historicalManifests=$ccHistory;note='R9 handoff and R10–R12 changed-file manifests are historical; differences in files modified by R13–R15 do not establish corruption. R15 has no full current SHA256 ledger. This audit records actual input bytes.';inputFiles=$ccEntries}
$ccReport|ConvertTo-Json -Depth 12|Set-Content -LiteralPath (Join-Path $ccOutput 'input-integrity.json') -Encoding utf8
Write-Output "R15 ZIP entries $($ccEntries.Count); protected files $(@($ccChecks).Count); unchanged=$ccPass"
if(-not $ccPass){exit 1}
