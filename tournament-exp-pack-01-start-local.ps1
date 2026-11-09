param(
  [int]$FrontendPort = 3000,
  [int]$ApiPort = 8080
)

$ErrorActionPreference = "Stop"
$Repo = (Get-Location).Path

if (-not (Test-Path (Join-Path $Repo "pnpm-workspace.yaml"))) {
  throw "Uruchom ten skrypt z głównego katalogu repozytorium."
}

if (-not $env:DATABASE_URL) {
  Write-Warning "DATABASE_URL nie jest ustawione w tym terminalu. API może nie połączyć się z bazą."
}

$apiCommand = @"
Set-Location '$Repo'
`$env:PORT='$ApiPort'
`$env:NODE_ENV='development'
pnpm --filter @workspace/api-server run build
if (`$LASTEXITCODE -eq 0) {
  pnpm --filter @workspace/api-server run start
}
"@

Write-Host "Uruchamiam API na porcie $ApiPort w osobnym oknie..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", $apiCommand

Start-Sleep -Seconds 2

Write-Host "Uruchamiam frontend na porcie $FrontendPort..."
$env:PORT = "$FrontendPort"
pnpm --filter @workspace/tournament-manager run dev
