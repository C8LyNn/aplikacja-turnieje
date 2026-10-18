param([switch]$All)
$ErrorActionPreference='Stop'
$ccRoot=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
& (Join-Path $PSScriptRoot 'build.ps1') -Target Windows
$ccOutput=Join-Path $ccRoot 'Evidence/R16/Native'
New-Item -ItemType Directory -Path $ccOutput -Force|Out-Null
$ccArgs='-force-d3d11 -screen-fullscreen 0 -screen-width 1280 -screen-height 900 -logFile "'+(Join-Path $ccOutput 'player.log')+'" --cc-r16-smoke --cc-output "'+$ccOutput+'"'
# An actual game window is required: hidden D3D windows can yield black captures.
$ccPlayer=Start-Process -FilePath (Join-Path $ccRoot 'Builds/Windows/CoreClash.exe') -ArgumentList $ccArgs -WorkingDirectory $ccRoot -WindowStyle Normal -PassThru
try{
 if(-not $ccPlayer.WaitForExit(50000)){throw 'R16 player timeout'}
 if($ccPlayer.ExitCode -ne 0){throw 'R16 native smoke failed'}
 $ccReport=Get-Content -LiteralPath (Join-Path $ccOutput 'r16-native.json') -Raw|ConvertFrom-Json
 if(-not $ccReport.pass -or @($ccReport.captures).Count -ne 3){throw 'R16 native evidence invalid'}
 foreach($ccCapture in $ccReport.captures){if((Get-FileHash -LiteralPath (Join-Path $ccOutput $ccCapture.file) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ccCapture.sha256){throw 'R16 capture checksum mismatch'}}
}finally{if(-not $ccPlayer.HasExited){Stop-Process -Id $ccPlayer.Id}}
& (Join-Path $PSScriptRoot 'r6-native-smoke.ps1') -VisiblePlayer -OutputDirectory (Join-Path $ccRoot 'Evidence/R16/FullMatch')
if($All){
 & (Join-Path $PSScriptRoot 'build.ps1') -Target WebGL
 & (Join-Path $PSScriptRoot 'build.ps1') -Target Android
}
