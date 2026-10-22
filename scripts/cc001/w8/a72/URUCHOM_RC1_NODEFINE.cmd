@echo off
setlocal
title CC-001 RC1 - one-shot Windows build WITHOUT diagnostic
set "PSEXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PSEXE%" (
 echo STOP: Windows PowerShell 5.1 not installed.
 pause
 exit /b 1
)
"%PSEXE%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0START_RC1_NODEFINE.ps1"
set "RESULT=%ERRORLEVEL%"
if not "%RESULT%"=="0" (
 echo.
 echo STOP: Verification or build failed. Read FAILURE.txt in Downloads\CC001_RC1_NODEFINE_* folder.
) else (
 echo.
 echo DONE: Original evidence ZIP and EVIDENCE_SHA256.txt are in Downloads\CC001_RC1_NODEFINE_* folder.
)
echo.
pause
exit /b %RESULT%
