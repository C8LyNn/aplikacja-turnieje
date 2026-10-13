$ErrorActionPreference = "Stop"
node (Join-Path $PSScriptRoot "rollback.mjs") $args
