@echo off
setlocal
cd /d "%~dp0"
echo Starting Animated Effects preview from: %CD%
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0artifacts\animated-effects\scripts\start-local-preview.ps1" %*
if errorlevel 1 (
  echo.
  echo Preview did not start. See the error above.
  pause
)
endlocal
