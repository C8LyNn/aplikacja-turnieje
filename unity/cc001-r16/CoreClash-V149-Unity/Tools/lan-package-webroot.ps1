param([string]$WebGLPath,[string]$WindowsPath)
$ErrorActionPreference='Stop'
$ccProjectRoot=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
if(-not $WebGLPath){$WebGLPath=Join-Path $ccProjectRoot 'Builds/WebGL'}
if(-not $WindowsPath){$WindowsPath=Join-Path $ccProjectRoot 'Builds/Windows'}
$ccWebGL=(Resolve-Path -LiteralPath $WebGLPath).Path
$ccWindows=(Resolve-Path -LiteralPath $WindowsPath).Path
if(-not(Test-Path -LiteralPath (Join-Path $ccWebGL 'index.html'))){throw 'WebGL/index.html is missing. Build WebGL first.'}
if(-not(Test-Path -LiteralPath (Join-Path $ccWindows 'CoreClash.exe'))){throw 'Windows/CoreClash.exe is missing. Build Windows first.'}
$ccWebRoot=Join-Path $ccWindows 'WebRoot'
New-Item -ItemType Directory -Path $ccWebRoot -Force | Out-Null
Get-ChildItem -LiteralPath $ccWebGL -Force | Copy-Item -Destination $ccWebRoot -Recurse -Force
Write-Output "Packaged native browser invitations: $ccWebRoot"
