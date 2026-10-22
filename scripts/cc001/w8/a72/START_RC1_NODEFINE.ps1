# CC-001 R17-W8 / A72 authenticated PRIVATE GitHub bootstrap / Windows PowerShell 5.1.
# All source refs and the builder SHA-256 are immutable; fails before execution on mismatch.
[CmdletBinding()]
param([switch]$NoZip)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$expected='282D8BE8B79FD022C98DD7BD050B2AFC1843D31F0339706BB1DC6F31E54C8EE8'
$commit='f58b254fbd75ac4ad626743b0620c331687dcdc8'
$path='scripts/cc001/w8/a72/CC001_RC1_NO_DEFINE_WINDOWS_PROVENANCE.ps1'
$branch='feat/cc001-r17-w4-a72-managed-ci'
$repo='https://github.com/C8LyNn/aplikacja-turnieje.git'
$local=Join-Path $PSScriptRoot 'CC001_RC1_NO_DEFINE_WINDOWS_PROVENANCE.ps1'
try {
 if(-not (Test-Path -LiteralPath $local -PathType Leaf)){
  $git=(Get-Command git.exe -ErrorAction Stop).Source
  $folder=Join-Path $env:TEMP ('CC001_RC1_A72_BOOTSTRAP_'+[Guid]::NewGuid().ToString('N'))
  if(Test-Path -LiteralPath $folder){throw 'Bootstrap folder unexpectedly exists'}
  Write-Host 'Fetching exact A72 script from authenticated PRIVATE GitHub...' -ForegroundColor Cyan
  $r=Start-Process -FilePath $git -ArgumentList ('clone --single-branch --branch '+$branch+' --no-checkout '+$repo+' "'+$folder+'"') -PassThru -Wait -WindowStyle Hidden
  if($r.ExitCode -ne 0){throw ('Private Git clone failed: exit '+$r.ExitCode+'. Check Git Credential Manager authorization.')}
  $r=Start-Process -FilePath $git -ArgumentList ('-C "'+$folder+'" show "'+$commit+':'+$path+'"') -PassThru -Wait -WindowStyle Hidden -RedirectStandardOutput $local
  if($r.ExitCode -ne 0){throw ('Exact pinned A72 script blob unavailable: exit '+$r.ExitCode)}
 }
 $actual=(Get-FileHash -LiteralPath $local -Algorithm SHA256).Hash.ToUpperInvariant()
 if($actual -ne $expected){throw ('STOP: A72 script SHA256 mismatch: expected '+$expected+' got '+$actual)}
 $tokens=$null;$errors=$null
 [System.Management.Automation.Language.Parser]::ParseFile($local,[ref]$tokens,[ref]$errors)|Out-Null
 if($errors.Count -ne 0){throw ('STOP: PowerShell syntax errors: '+($errors|Out-String))}
 Write-Host 'A72 SHA256 + native PowerShell 5.1 grammar: PASS' -ForegroundColor Green
 $invoke=@('-NoProfile','-ExecutionPolicy','Bypass','-File',$local)
 if($NoZip){$invoke+='-NoZip'}
 & "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe" @invoke
 if($LASTEXITCODE -ne 0){throw ('Build provenance FAILED: exit '+$LASTEXITCODE+'. Inspect newly created Downloads\CC001_RC1_NODEFINE_* folder.')}
}catch{
 Write-Host ('BOOTSTRAP STOP: '+$_.Exception.Message) -ForegroundColor Red
 exit 1
}
