param(
    [string]$PlayerPath,
    [string]$OutputDirectory,
    [switch]$VisiblePlayer,
    [ValidateRange(30,120)][int]$TimeoutSeconds = 120
)
$ErrorActionPreference = 'Stop'
$ccProjectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
if (-not $PlayerPath) { $PlayerPath = Join-Path $ccProjectRoot 'Builds/Windows/CoreClash.exe' }
if (-not $OutputDirectory) { $OutputDirectory = Join-Path $ccProjectRoot 'Evidence' }
$ccPlayerPath = (Resolve-Path -LiteralPath $PlayerPath).Path
$ccOutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)
if ($ccPlayerPath.Contains('"') -or $ccOutputDirectory.Contains('"') -or $ccOutputDirectory.Contains("`n") -or $ccOutputDirectory.Contains("`r")) {
    throw 'Player and output paths must be ordinary filesystem paths without quotes or line breaks.'
}
New-Item -ItemType Directory -Path $ccOutputDirectory -Force | Out-Null
$ccLogPath = Join-Path $ccOutputDirectory 'r4-native-player.log'
$ccEvidencePath = Join-Path $ccOutputDirectory 'r4-native-runtime.json'
$ccRunnerPath = Join-Path $ccOutputDirectory 'r4-native-runner.json'
$ccCaptureNames = @(
    'r4-native-01-deck-selection.png', 'r4-native-02-aim.png', 'r4-native-03-gameplay.png',
    'r4-native-04-ball-details.png', 'r4-native-05-developer-details.png', 'r4-native-06-match-result.png'
)
# Delete only this runner's known output files, so an old successful run cannot satisfy verification.
foreach ($ccName in @('r4-native-player.log','r4-native-runtime.json','r4-native-runner.json') + $ccCaptureNames) {
    $ccOldPath = Join-Path $ccOutputDirectory $ccName
    if (Test-Path -LiteralPath $ccOldPath) { Remove-Item -LiteralPath $ccOldPath -Force }
}
$ccArguments = '-force-d3d11 -screen-fullscreen 0 -screen-width 1280 -screen-height 900 -logFile "' +
    $ccLogPath + '" --cc-presentation-smoke --cc-presentation-prefix r4-native --cc-output "' + $ccOutputDirectory.TrimEnd('\') + '"'
$ccPlayer = $null
$ccWindowStyle = if ($VisiblePlayer) { 'Normal' } else { 'Hidden' }
$ccTimer = [Diagnostics.Stopwatch]::StartNew()
try {
    # A real D3D11 player render is required. Do not add -nographics or desktop screenshot APIs.
    $ccPlayer = Start-Process -FilePath $ccPlayerPath -ArgumentList $ccArguments -WorkingDirectory $ccProjectRoot -WindowStyle $ccWindowStyle -PassThru
    while (-not $ccPlayer.HasExited -and $ccTimer.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
        Start-Sleep -Milliseconds 150
        $ccPlayer.Refresh()
    }
    if (-not $ccPlayer.HasExited) { throw "Native presentation smoke exceeded $TimeoutSeconds seconds. See $ccLogPath" }
    $ccPlayer.WaitForExit()
    if ($ccPlayer.ExitCode -ne 0) { throw "Native player exited with $($ccPlayer.ExitCode). See $ccLogPath" }
    if (-not (Test-Path -LiteralPath $ccEvidencePath)) { throw 'The player produced no r4-native-runtime.json evidence.' }
    $ccEvidence = Get-Content -Raw -LiteralPath $ccEvidencePath | ConvertFrom-Json
    $ccLog = Get-Content -Raw -LiteralPath $ccLogPath
    if (-not $ccLog.Contains('CC_R2_SMOKE_BOOTSTRAP release=true') -or -not $ccLog.Contains('CC_R2_SMOKE_PASS') -or $ccLog.Contains('CC_R2_SMOKE_FAIL')) {
        throw 'The player log has no unambiguous native presentation bootstrap and pass markers.'
    }
    if (-not $ccEvidence.passed -or -not $ccEvidence.automation -or $ccEvidence.developmentBuild -or $ccEvidence.defaultDeveloperOverlay) {
        throw 'Runtime evidence did not verify an automated release player with developer overlay off by default.'
    }
    if ($ccEvidence.platform -ne 'WindowsPlayer' -or $ccEvidence.graphicsApi -eq 'Null') { throw 'Evidence is not from a rendered native Windows player.' }
    if (-not $ccEvidence.renderReady -or -not $ccEvidence.splashScreenFinished -or $ccEvidence.readyRepaintFrames -lt 3 -or
        $ccEvidence.firstCaptureAfterSeconds -lt 3 -or -not $ccEvidence.captureImagesValidated -or $ccEvidence.distinctCriticalCaptures -ne 4) {
        throw 'The player did not verify splash completion, render readiness, and distinct visual captures.'
    }
    if (-not $ccEvidence.pointerLaunchAccepted -or -not $ccEvidence.aimCapturedBeforeRelease -or -not $ccEvidence.fullLocalMatchCompleted -or
        $ccEvidence.phase -ne 'Over' -or $ccEvidence.launches -lt 3 -or $ccEvidence.turns -gt 50 -or $ccEvidence.portalPairsRendered -lt 1) {
        throw 'The rendered pointer launch, portals, or full legal local match evidence is incomplete.'
    }
    if ($ccEvidence.deckA -ne 'featured_gravity_trap' -or $ccEvidence.deckB -ne 'featured_status_reactor') { throw 'The required deck choices were not exercised.' }
    if (@($ccEvidence.captures).Count -ne $ccCaptureNames.Count) { throw 'The runtime capture manifest is incomplete.' }
    $ccVerifiedCaptures = foreach ($ccName in $ccCaptureNames) {
        $ccCapturePath = Join-Path $ccOutputDirectory $ccName
        $ccManifest = @($ccEvidence.captures | Where-Object { $_.file -eq $ccName })
        if ($ccManifest.Count -ne 1 -or -not (Test-Path -LiteralPath $ccCapturePath)) { throw "Required capture is missing: $ccName" }
        $ccPng = [IO.File]::ReadAllBytes($ccCapturePath)
        if ($ccPng.Length -lt 1024 -or [BitConverter]::ToString($ccPng,0,8) -ne '89-50-4E-47-0D-0A-1A-0A') { throw "Invalid PNG: $ccName" }
        $ccWidth = ([int]$ccPng[16] -shl 24) -bor ([int]$ccPng[17] -shl 16) -bor ([int]$ccPng[18] -shl 8) -bor [int]$ccPng[19]
        $ccHeight = ([int]$ccPng[20] -shl 24) -bor ([int]$ccPng[21] -shl 16) -bor ([int]$ccPng[22] -shl 8) -bor [int]$ccPng[23]
        if ($ccWidth -ne 1280 -or $ccHeight -ne 900 -or $ccManifest[0].width -ne $ccWidth -or $ccManifest[0].height -ne $ccHeight) {
            throw "Unexpected player capture dimensions: $ccName ($ccWidth x $ccHeight)"
        }
        if ($ccName -ne 'r4-native-05-developer-details.png' -and $ccManifest[0].developerOverlay) { throw "Developer overlay leaked into player-facing capture: $ccName" }
        if (-not $ccManifest[0].imageContentValidated -or $ccManifest[0].distinctSampleColors -lt 16 -or $ccManifest[0].brightSampleFraction -lt 0.01 -or
            ($ccManifest[0].maximumSampleBrightness - $ccManifest[0].minimumSampleBrightness) -lt 24) {
            throw "The player reported a black or visually flat capture: $ccName"
        }
        if (-not $ccLog.Contains("CC_R2_CAPTURE_PASS $ccName")) { throw "No completed render capture log for $ccName" }
        $ccHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $ccCapturePath).Hash
        if ($ccHash -ne $ccManifest[0].sha256) { throw "The capture hash does not match the image the player validated: $ccName" }
        [pscustomobject]@{ file=$ccName; width=$ccWidth; height=$ccHeight; bytes=$ccPng.Length; sha256=$ccHash; sampledColors=$ccManifest[0].distinctSampleColors }
    }
    if (@($ccVerifiedCaptures | Select-Object -First 4 -ExpandProperty sha256 -Unique).Count -ne 4) {
        throw 'Deck selection, aim, gameplay, and details captures are not four distinct images.'
    }
    $ccBuildFiles = foreach ($ccRelative in @('CoreClash.exe','CoreClash_Data/Managed/Assembly-CSharp.dll','CoreClash_Data/resources.assets','CoreClash_Data/level0')) {
        $ccArtifact = Join-Path (Split-Path -Parent $ccPlayerPath) $ccRelative
        [pscustomobject]@{ path=('Builds/Windows/' + $ccRelative); bytes=(Get-Item -LiteralPath $ccArtifact).Length; sha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $ccArtifact).Hash }
    }
    [pscustomobject]@{
        passed=$true; automation=$true; elapsedSeconds=[Math]::Round($ccTimer.Elapsed.TotalSeconds,3)
        visiblePlayer=[bool]$VisiblePlayer; windowStyle=$ccWindowStyle
        player=$ccPlayerPath; playerSha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $ccPlayerPath).Hash
        buildFiles=@($ccBuildFiles)
        exitCode=$ccPlayer.ExitCode; runtimeEvidence=$ccEvidencePath; log=$ccLogPath; captures=@($ccVerifiedCaptures)
        launches=$ccEvidence.launches; turns=$ccEvidence.turns; winner=$ccEvidence.winner; baseHp=$ccEvidence.baseHp; result=$ccEvidence.resultReason
    } | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $ccRunnerPath -Encoding utf8
    Get-Content -LiteralPath $ccRunnerPath
} catch {
    [pscustomobject]@{ passed=$false; automation=$true; visiblePlayer=[bool]$VisiblePlayer; windowStyle=$ccWindowStyle; elapsedSeconds=[Math]::Round($ccTimer.Elapsed.TotalSeconds,3); error=$_.Exception.Message; runtimeEvidence=$ccEvidencePath; log=$ccLogPath } |
        ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $ccRunnerPath -Encoding utf8
    throw
} finally {
    if ($null -ne $ccPlayer -and -not $ccPlayer.HasExited) { Stop-Process -Id $ccPlayer.Id -ErrorAction SilentlyContinue }
    $ccTimer.Stop()
}
