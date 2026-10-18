param([int]$Port=47891)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
$networkLog=Join-Path $projectRoot 'Evidence/network-native-startup.log'
$networkEvidence=Join-Path $projectRoot 'Evidence/network-native-startup.json'
$playerPath=Join-Path $projectRoot 'Builds/Windows/CoreClash.exe'
$networkProcess=Start-Process -FilePath $playerPath -ArgumentList @('-batchmode','-nographics','-logFile',$networkLog,'--cc-network-host','--cc-network-smoke','--cc-network-port',"$Port") -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
try {
    $ready=$false
    for($attempt=0;$attempt -lt 100;$attempt++){
        Start-Sleep -Milliseconds 100
        if(Test-Path -LiteralPath $networkLog){$output=Get-Content -Raw -LiteralPath $networkLog;if($output.Contains('CC_NET_HOST_READY')){$ready=$true;break}}
        if($networkProcess.HasExited){break}
    }
    [pscustomobject]@{pass=$ready;pid=$networkProcess.Id;port=$Port;networkLines=@(($output -split "`n")|Where-Object{$_ -like '*CC_NET_*'})}|ConvertTo-Json -Depth 4|Set-Content -LiteralPath $networkEvidence
    Get-Content -LiteralPath $networkEvidence
    if(-not $ready){throw 'Native NGO host failed startup; inspect network-native-startup.log'}
}finally{if(-not $networkProcess.HasExited){Stop-Process -Id $networkProcess.Id}}
