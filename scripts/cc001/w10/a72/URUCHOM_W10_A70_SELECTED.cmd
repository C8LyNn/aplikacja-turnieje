@echo off
setlocal
set "HERE=%~dp0"
set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS%" (
  echo STOP: Windows PowerShell 5.1 unavailable.
  pause
  exit /b 1
)
echo CC-001 R17-W10 A70 SELECTED CANDIDATE ? EXACT SHA
"%PS%" -NoProfile -ExecutionPolicy Bypass -File "%HERE%Start-W10-WindowsBuild.ps1" -IntegrationRef "integration/cc001-r17-w10-multiplayer-dev-candidate-20261030" -CandidateSha "3d377767e72473cebd90e49293a0cd5dada70464"
set "RESULT=%ERRORLEVEL%"
if not "%RESULT%"=="0" (
  echo.
  echo HOLD: read original evidence ZIP and failure markers. Do not report a Windows build PASS.
) else (
  echo.
  echo BUILD EVIDENCE ONLY: hand off original ZIP and SHA256 receipt to A60 for independent QA.
)
pause
exit /b %RESULT%
