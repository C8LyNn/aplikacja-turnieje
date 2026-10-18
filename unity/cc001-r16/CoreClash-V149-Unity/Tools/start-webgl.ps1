param([ValidateRange(1,65535)][int]$Port=8080)
$ErrorActionPreference='Stop'
$ccNode=Get-Command node -ErrorAction Stop
Write-Output "Open http://127.0.0.1:$Port/ . Keep this terminal open; Ctrl+C stops the local server."
& $ccNode.Source (Join-Path $PSScriptRoot 'serve-web.cjs') --port $Port
