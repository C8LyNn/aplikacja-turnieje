param([string]$OutputDirectory)
$ErrorActionPreference='Stop'
$ccRoot=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
if(-not $OutputDirectory){$OutputDirectory=Join-Path $ccRoot 'Evidence/r8-native-html'}
$ccOutput=[IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Path $ccOutput -Force|Out-Null
foreach($ccName in @('r8-html-native.json','r8-html-player.log','r8-html-01-bumper.png','r8-html-02-launches.png','r8-html-runner.json')){
    $ccOld=Join-Path $ccOutput $ccName
    if(Test-Path -LiteralPath $ccOld){Remove-Item -LiteralPath $ccOld}
}
$ccLog=Join-Path $ccOutput 'r8-html-player.log'
$ccExe=Join-Path $ccRoot 'Builds/Windows/CoreClash.exe'
$ccArguments='-force-d3d11 -screen-fullscreen 0 -screen-width 1280 -screen-height 900 -logFile "'+$ccLog+'" --cc-html-smoke --cc-output "'+$ccOutput.TrimEnd('\')+'"'
$ccPlayer=Start-Process -FilePath $ccExe -ArgumentList $ccArguments -WorkingDirectory $ccRoot -WindowStyle Normal -PassThru
try{
    if(-not $ccPlayer.WaitForExit(40000)){throw 'R8 staged native render timed out'}
    $ccRuntime=Get-Content -LiteralPath (Join-Path $ccOutput 'r8-html-native.json') -Raw|ConvertFrom-Json
    $ccLogText=Get-Content -LiteralPath $ccLog -Raw
    if($ccPlayer.ExitCode -ne 0 -or -not $ccRuntime.pass -or -not $ccLogText.Contains('CC_R8_HTML_PASS') -or $ccLogText.Contains('CC_R8_HTML_FAIL')){throw 'R8 staged native rendering failed'}
    if(@($ccRuntime.captures).Count -ne 2){throw 'Both new-mechanic captures are required'}
    foreach($ccCapture in $ccRuntime.captures){
        $ccImage=Join-Path $ccOutput $ccCapture.file
        if((Get-FileHash -LiteralPath $ccImage -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ccCapture.sha256){throw 'Capture hash mismatch'}
        $ccBytes=[IO.File]::ReadAllBytes($ccImage)
        if([BitConverter]::ToString($ccBytes,0,8) -ne '89-50-4E-47-0D-0A-1A-0A' -or $ccBytes.Length -lt 10000){throw 'Invalid rendered capture'}
    }
    $ccBuildFiles=foreach($ccRelative in @('Builds/Windows/CoreClash.exe','Builds/Windows/CoreClash_Data/Managed/Assembly-CSharp.dll','Builds/Windows/CoreClash_Data/resources.assets','Builds/Windows/CoreClash_Data/level0')){[ordered]@{path=$ccRelative;sha256=(Get-FileHash -LiteralPath (Join-Path $ccRoot $ccRelative) -Algorithm SHA256).Hash.ToLowerInvariant()}}
    $ccReport=[ordered]@{testedAt=[DateTime]::UtcNow.ToString('o');pass=$true;scope=$ccRuntime.scope;buildFiles=@($ccBuildFiles);captures=@($ccRuntime.captures)}
    $ccReport|ConvertTo-Json -Depth 6|Set-Content -LiteralPath (Join-Path $ccOutput 'r8-html-runner.json') -Encoding utf8
    Write-Output 'PASS R8 staged native rendering: bumper and simultaneous launch/ram, two verified captures.'
}finally{if(-not $ccPlayer.HasExited){Stop-Process -Id $ccPlayer.Id}}
