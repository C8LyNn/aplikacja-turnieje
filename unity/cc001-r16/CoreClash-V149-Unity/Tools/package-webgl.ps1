param([Parameter(Mandatory=$true)][string]$Output)
$ErrorActionPreference='Stop'
$ccRoot=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$ccWebRoot=Join-Path $ccRoot 'Builds/WebGL'
$ccOutput=[System.IO.Path]::GetFullPath($Output)
if(Test-Path -LiteralPath $ccOutput){throw "Archive already exists: $ccOutput"}
& node (Join-Path $PSScriptRoot 'verify-web-host.cjs') --write-manifest
if($LASTEXITCODE -ne 0){throw 'Manifest generation failed'}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$ccArchive=[System.IO.Compression.ZipFile]::Open($ccOutput,[System.IO.Compression.ZipArchiveMode]::Create)
try{
    foreach($ccFile in Get-ChildItem -LiteralPath $ccWebRoot -Recurse -File){
        $ccRelative=$ccFile.FullName.Substring($ccWebRoot.Length+1).Replace('\','/')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($ccArchive,$ccFile.FullName,$ccRelative,[System.IO.Compression.CompressionLevel]::Optimal)|Out-Null
    }
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($ccArchive,(Join-Path $ccRoot 'Evidence/r7-web-release-manifest.json'),'release-manifest.json',[System.IO.Compression.CompressionLevel]::Optimal)|Out-Null
}finally{$ccArchive.Dispose()}
Get-FileHash -LiteralPath $ccOutput -Algorithm SHA256 | Select-Object Path,Hash
