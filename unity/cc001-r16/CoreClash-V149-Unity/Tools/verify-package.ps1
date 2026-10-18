param([Parameter(Mandatory=$true)][string]$Archive)
$ErrorActionPreference='Stop'
$ccRoot=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$ccArchivePath=(Resolve-Path -LiteralPath $Archive).Path
Add-Type -AssemblyName System.IO.Compression.FileSystem
$ccZip=[IO.Compression.ZipFile]::OpenRead($ccArchivePath)
$ccSha=[Security.Cryptography.SHA256]::Create()
$ccSeen=[Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$ccRecords=[Collections.Generic.List[object]]::new()
try{
    foreach($ccEntry in $ccZip.Entries){
        $ccName=$ccEntry.FullName.Replace('\','/')
        if(-not $ccName.StartsWith('CoreClash-V149-Unity/') -or $ccName.Contains('/../') -or -not $ccSeen.Add($ccName)){throw "Invalid or duplicate archive path: $ccName"}
        if($ccName -match '/[^/]*(DoNotShip|DontShip)[^/]*/|/Tests/(bin|obj)/'){throw "Excluded build/debug path found: $ccName"}
        $ccRelative=$ccName.Substring('CoreClash-V149-Unity/'.Length)
        $ccSource=[IO.Path]::GetFullPath((Join-Path $ccRoot $ccRelative))
        if(-not $ccSource.StartsWith($ccRoot+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Archive path leaves the workspace.'}
        if(-not (Test-Path -LiteralPath $ccSource -PathType Leaf)){throw "Archive source missing: $ccRelative"}
        $ccStream=$ccEntry.Open()
        try{$ccHash=[BitConverter]::ToString($ccSha.ComputeHash($ccStream)).Replace('-','')}finally{$ccStream.Dispose()}
        if($ccHash -ne (Get-FileHash -LiteralPath $ccSource -Algorithm SHA256).Hash){throw "Archive bytes differ from verified workspace: $ccRelative"}
        $ccRecords.Add([pscustomobject]@{path=$ccRelative;bytes=$ccEntry.Length;sha256=$ccHash})
    }
}finally{$ccSha.Dispose();$ccZip.Dispose()}
$ccArchiveHash=(Get-FileHash -LiteralPath $ccArchivePath -Algorithm SHA256).Hash
$ccReport=[ordered]@{verifiedAt=[DateTime]::UtcNow.ToString('o');passed=$true;archive=$ccArchivePath;bytes=(Get-Item -LiteralPath $ccArchivePath).Length;sha256=$ccArchiveHash;entries=$ccRecords.Count;allEntriesMatchWorkspace=$true;files=$ccRecords}
[IO.File]::WriteAllText(($ccArchivePath+'.verification.json'),($ccReport | ConvertTo-Json -Depth 5)+[Environment]::NewLine)
[IO.File]::WriteAllText(($ccArchivePath+'.sha256'),$ccArchiveHash+'  '+[IO.Path]::GetFileName($ccArchivePath)+[Environment]::NewLine)
[pscustomobject]@{passed=$true;entries=$ccRecords.Count;bytes=$ccReport.bytes;sha256=$ccArchiveHash;archive=$ccArchivePath} | ConvertTo-Json
