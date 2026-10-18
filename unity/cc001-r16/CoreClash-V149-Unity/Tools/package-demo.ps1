param([string]$Output)
$ErrorActionPreference='Stop'
$ccRoot=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
if(-not $Output){$Output=Join-Path (Split-Path -Parent $ccRoot) 'CoreClash-V149-ClassDemo.zip'}
$ccOutput=[System.IO.Path]::GetFullPath($Output)
if(Test-Path -LiteralPath $ccOutput){throw "Archive already exists; use -Output with a new filename: $ccOutput"}
if(-not (Test-Path -LiteralPath (Join-Path $ccRoot 'Evidence/delivery-manifest.json'))){throw 'Run node Tools/seal-delivery.cjs after final verification first.'}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$ccDirectories=@('Assets','Packages','ProjectSettings','Tools','Tests','docs','Evidence','Legacy','Builds')
$ccFiles=@(Get-ChildItem -LiteralPath $ccRoot -File | Where-Object {$_.Extension -eq '.md' -or $_.Name -eq 'NuGet.Config' -or $_.Name -eq '.gitignore' -or $_.Name -eq '.gitattributes'})
foreach($ccDirectory in $ccDirectories){$ccFiles+=Get-ChildItem -LiteralPath (Join-Path $ccRoot $ccDirectory) -Recurse -File | Where-Object {$_.FullName -notmatch '[\\/]Tests[\\/](bin|obj)[\\/]' -and $_.FullName -notmatch '[\\/][^\\/]*(DoNotShip|DontShip)[^\\/]*[\\/]'}}
$ccArchive=[System.IO.Compression.ZipFile]::Open($ccOutput,[System.IO.Compression.ZipArchiveMode]::Create)
try{
    foreach($ccFile in $ccFiles){$ccRelative='CoreClash-V149-Unity/'+$ccFile.FullName.Substring($ccRoot.Length+1).Replace('\','/');[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($ccArchive,$ccFile.FullName,$ccRelative,[System.IO.Compression.CompressionLevel]::Optimal) | Out-Null}
}finally{$ccArchive.Dispose()}
Write-Output "Packaged $($ccFiles.Count) files: $ccOutput"
Get-FileHash -LiteralPath $ccOutput -Algorithm SHA256 | Select-Object Path,Hash
