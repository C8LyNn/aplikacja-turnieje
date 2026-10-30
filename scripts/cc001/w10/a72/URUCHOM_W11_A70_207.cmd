@echo off
setlocal
rem CC-001 W11 exact A70 PR207, A72 local Windows operator only. No merge/release.
powershell.exe -NoProfile -File "%~dp0Start-W10-WindowsBuild.ps1" -IntegrationRef "integration/cc001-r17-w11-multiplayer-qa-candidate-20261030" -CandidateSha "173273122c11cbf738e8b954e32506a6196fe8ec"
exit /b %ERRORLEVEL%
