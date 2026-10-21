# A72 / Windows PowerShell 5.1 bootstrap: download exact immutable GitHub source and verify before execution.
[CmdletBinding()]
param([switch]$NoPlayer)
$ErrorActionPreference='Stop'
$expected='F83DD3BA968C454A81FF0FD74B5C3964059AFABB198D37A3E8DCF90DFFA69BDE'
$uri='https://raw.githubusercontent.com/C8LyNn/aplikacja-turnieje/0dde984c41ff825aa7dd30c317f2637f3ca63db7/scripts/cc001/w7/a72/CC001_W7_PHOENIX_DIAGNOSTIC_WINDOWS.ps1'
$local=Join-Path $PSScriptRoot 'CC001_W7_PHOENIX_DIAGNOSTIC_WINDOWS.ps1'
if(-not (Test-Path -LiteralPath $local -PathType Leaf)){
 Write-Host 'Downloading immutable A72 diagnostic script from GitHub...'
 Invoke-WebRequest -UseBasicParsing -Uri $uri -OutFile $local
}
$actual=(Get-FileHash -LiteralPath $local -Algorithm SHA256).Hash.ToUpperInvariant()
if($actual -ne $expected){throw "STOP: Diagnostic script SHA256 mismatch. Expected $expected; actual $actual"}
$tokens=$null
$parseErrors=$null
[System.Management.Automation.Language.Parser]::ParseFile($local,[ref]$tokens,[ref]$parseErrors)|Out-Null
if($parseErrors.Count -gt 0){throw ("STOP: PowerShell script syntax invalid: "+($parseErrors | Out-String))}
Write-Host 'Script SHA256 and PowerShell parser: PASS.' -ForegroundColor Green
$argsList=@('-NoProfile','-ExecutionPolicy','Bypass','-File',$local)
if($NoPlayer){$argsList+='-NoPlayer'}
& "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe" @argsList
if($LASTEXITCODE -ne 0){throw "Diagnostic Windows build FAILED (exit $LASTEXITCODE). See run folder FAILURE.txt."}
