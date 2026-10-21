@echo off
setlocal
title CC-001 W7 - diagnostyczny Windows Player (A72)
set "PSEXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PSEXE%" (
  echo STOP: Nie znaleziono Windows PowerShell 5.1.
  pause
  exit /b 1
)
"%PSEXE%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0START_CC001_W7.ps1"
set "RESULT=%ERRORLEVEL%"
if not "%RESULT%"=="0" (
  echo.
  echo STOP: Proces diagnostyczny zakonczyl sie bledem. Przeczytaj FAILURE.txt w nowym folderze CC001_W7_DIAG.
) else (
  echo.
  echo Gotowe. Archiwum i SHA256 znajduja sie w nowym folderze CC001_W7_DIAG w Downloads.
)
echo.
pause
exit /b %RESULT%
