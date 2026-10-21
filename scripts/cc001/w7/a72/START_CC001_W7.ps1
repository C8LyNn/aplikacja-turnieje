# A72 Windows PowerShell 5.1 bootstrap; supports PRIVATE authenticated GitHub repository.
# Fetches exact immutable Git blob from authenticated clone, SHA256-checks, parses, runs.
[CmdletBinding()]
param([switch]$NoPlayer)
$ErrorActionPreference='Stop'
$expected='181B250E35FDC3DA06BC32F8041C7B45AA8E2BE5751C2A33DBBAB587A6B9D771'
$scriptCommit='a17966133899c82d87c9a805cfcb0d09682d3650'
$scriptPath='scripts/cc001/w7/a72/CC001_W7_PHOENIX_DIAGNOSTIC_WINDOWS.ps1'
$repo='https://github.com/C8LyNn/aplikacja-turnieje.git'
$branch='feat/cc001-r17-w4-a72-managed-ci'
$local=Join-Path $PSScriptRoot 'CC001_W7_PHOENIX_DIAGNOSTIC_WINDOWS.ps1'
if(-not (Test-Path -LiteralPath $local -PathType Leaf)){
 $git=(Get-Command git.exe -ErrorAction Stop).Source
 $folder=Join-Path $env:TEMP ('CC001_W7_A72_BOOTSTRAP_'+[Guid]::NewGuid().ToString('N'))
 if(Test-Path -LiteralPath $folder){throw 'Unexpected existing bootstrap folder'}
 $cl=Start-Process -FilePath $git -ArgumentList ('clone --single-branch --branch '+$branch+' --no-checkout '+$repo+' "'+$folder+'"') -Wait -PassThru -WindowStyle Hidden
 if($cl.ExitCode -ne 0){throw "Private Git clone failed (exit $($cl.ExitCode)). Authenticate with Git Credential Manager; no source executed."}
 $sh=Start-Process -FilePath $git -ArgumentList ('-C "'+$folder+'" show "'+$scriptCommit+':'+$scriptPath+'"') -Wait -PassThru -WindowStyle Hidden -RedirectStandardOutput $local
 if($sh.ExitCode -ne 0){throw 'Pinned script commit/blob not available. No script executed.'}
}
$actual=(Get-FileHash -LiteralPath $local -Algorithm SHA256).Hash.ToUpperInvariant()
if($actual -ne $expected){throw "STOP: Diagnostic script SHA256 mismatch. Expected $expected; got $actual"}
$tokens=$null
$parseErrors=$null
[System.Management.Automation.Language.Parser]::ParseFile($local,[ref]$tokens,[ref]$parseErrors)|Out-Null
if($parseErrors.Count -gt 0){throw ("STOP: PowerShell script syntax invalid: "+($parseErrors | Out-String))}
Write-Host 'Pinned script SHA256 and Windows PowerShell 5.1 parser: PASS.' -ForegroundColor Green
$argsList=@('-NoProfile','-ExecutionPolicy','Bypass','-File',$local)
if($NoPlayer){$argsList+='-NoPlayer'}
& "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe" @argsList
if($LASTEXITCODE -ne 0){throw "Diagnostic Windows build FAILED (exit $LASTEXITCODE). Check FAILURE.txt in the CC001_W7_DIAG folder."}
