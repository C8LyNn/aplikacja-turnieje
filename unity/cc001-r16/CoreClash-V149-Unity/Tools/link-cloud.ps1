param(
    [Parameter(Mandatory=$true)][guid]$ProjectId,
    [Parameter(Mandatory=$true)][ValidatePattern('^[a-zA-Z0-9-]{1,80}$')][string]$OrganizationId,
    [ValidatePattern('^[\p{L}\p{N} ._-]{1,80}$')][string]$ProjectName='Core Clash V149',
    [string]$Unity='C:/Program Files/Unity/Hub/Editor/6000.4.0f1/Editor/Unity.exe'
)
$ErrorActionPreference='Stop'
if($ProjectId -eq [guid]::Empty){throw 'An actual Project ID is required.'}
$ccRoot=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$ccLog=Join-Path $ccRoot 'Logs/cloud-link.log'
$ccArgs='-batchmode -nographics -quit -projectPath "'+$ccRoot+'" -executeMethod CoreClash.Editor.CloudSetup.BindFromCommandLine -logFile "'+$ccLog+'" --cc-cloud-project '+$ProjectId.ToString()+' --cc-cloud-org '+$OrganizationId+' --cc-cloud-name "'+$ProjectName+'"'
$ccProcess=Start-Process -FilePath $Unity -ArgumentList $ccArgs -WorkingDirectory $ccRoot -PassThru -Wait -WindowStyle Hidden
if($ccProcess.ExitCode -ne 0){throw "Unity cloud binding failed ($($ccProcess.ExitCode)). See $ccLog"}
Get-Content -Raw -LiteralPath (Join-Path $ccRoot 'Evidence/r6-cloud-binding.json')
