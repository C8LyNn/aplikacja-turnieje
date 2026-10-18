<#
CC-001 R15 QA — runs the cross-platform isolated runner, writes a timestamped
report outside the source tree (Google Drive Desktop when available).
Examples:
 pwsh -NoProfile -File .\Tools\r15-qa.ps1
 pwsh -NoProfile -File .\Tools\r15-qa.ps1 -StaticOnly
 pwsh -NoProfile -File .\Tools\r15-qa.ps1 -OutputRoot 'G:\Mój dysk\ChatGPT\CoreClash\QA\R15'
#>
param([string]$OutputRoot='', [switch]$StaticOnly, [switch]$BuildWindows)
$ErrorActionPreference='Stop'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 22 required to run R15 QA.' }
$argsList = @((Join-Path $PSScriptRoot 'r15-qa.cjs'))
if ($OutputRoot) { $argsList += '--output=' + $OutputRoot }
if ($StaticOnly) { $argsList += '--static-only' }
if ($BuildWindows) { $argsList += '--build-windows' }
& node @argsList
exit $LASTEXITCODE
