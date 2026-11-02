@echo off
rem CC-001 W17-01 (#283): local managed C# + data gate. Pass-through to managed-gate.cjs.
rem Requires Node 22+ and .NET SDK 9 on PATH. See README.md in this folder.
node "%~dp0managed-gate.cjs" %*
exit /b %ERRORLEVEL%
