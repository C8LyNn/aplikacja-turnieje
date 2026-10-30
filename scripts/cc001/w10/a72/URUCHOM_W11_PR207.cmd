@echo off
setlocal
set "HERE=%~dp0"
set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS%" (
  echo A72 STOP: Windows PowerShell 5.1 unavailable.
  exit /b 1
)
if not exist "%HERE%Start-W10-WindowsBuild.ps1" (
  echo A72 STOP: required PowerShell launcher missing.
  exit /b 1
)
echo CC-001 R17-W11 A72: PINNED FINAL A70 PR207
"%PS%" -NoProfile -ExecutionPolicy Bypass -File "%HERE%Start-W10-WindowsBuild.ps1" -IntegrationRef "integration/cc001-r17-w11-multiplayer-qa-candidate-20261030" -CandidateSha "173273122c11cbf738e8b954e32506a6196fe8ec"
set "STATUS=%ERRORLEVEL%"
if not "%STATUS%"=="0" (
  echo A72 HOLD: Build or integrity gate failed. Send ORIGINAL evidence and SHA receipt to A60.
) else (
  echo A72: Builder PASS_BUILD_EVIDENCE_ONLY, pending independent A60 PC1-PC2 QA.
)
pause
exit /b %STATUS%
