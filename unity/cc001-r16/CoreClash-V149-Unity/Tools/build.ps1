param(
    [ValidateSet('Windows','WebGL','Android')][string]$Target='Windows',
    [string]$Unity='C:/Program Files/Unity/Hub/Editor/6000.4.0f1/Editor/Unity.exe'
)
$ErrorActionPreference='Stop'
$ccProject=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
if(-not (Test-Path -LiteralPath $Unity)){throw "Unity editor not found: $Unity"}
$ccLogDirectory=Join-Path $ccProject 'Logs'
New-Item -ItemType Directory -Path $ccLogDirectory -Force | Out-Null
$ccLog=Join-Path $ccLogDirectory ($Target.ToLowerInvariant()+'-build.log')
$ccPlatform=if($Target -eq 'Windows'){'StandaloneWindows64'}else{$Target}
$ccArguments='-batchmode -nographics -quit -buildTarget '+$ccPlatform+' -projectPath "'+$ccProject+'" -executeMethod CoreClash.Editor.BuildTools.Build'+$Target+' -logFile "'+$ccLog+'"'
$ccBuildProcess=Start-Process -FilePath $Unity -ArgumentList $ccArguments -WorkingDirectory $ccProject -PassThru -Wait -WindowStyle Hidden
if($ccBuildProcess.ExitCode -ne 0){throw "Unity build failed ($($ccBuildProcess.ExitCode)). See $ccLog"}
Write-Output "Built $Target. Log: $ccLog"
