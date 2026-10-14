# WEB-005 A50 R15 — Windows frontend-only executor. No Git clone, install, DB, CI, merge or deployment.
# Run this file OUTSIDE the application checkout. All actual execution needs out-of-band-confirmed A00 GO.
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet(43,47,50,52,53,54)][int] $PR,
    [ValidateSet('target','existing-auth','typecheck','build')][string] $Suite = 'target',
    [switch] $Execute,
    [string] $Repo = '',
    [string] $OutDir = '',
    [string] $ApprovalFile = ''
)
$ErrorActionPreference = 'Stop'
$Targets = @{
  43 = @{SHA='96a6068f69027574ac76e18d4d5a2c444b5a914a';Files=@('src/hooks/use-tournament-csv-file-reader.test.tsx')}
  47 = @{SHA='f09a13623faca8d7ab29b09a2c5b43907c2acd0b';Files=@('src/components/stage-progress-view.test.tsx','src/pages/public-stage-views.test.tsx','src/pages/tournament-audience.test.tsx')}
  50 = @{SHA='5457a74187edc263730c3a4b25a663bdf5531ee9';Files=@('src/components/backup-restore-dialog.test.tsx','src/hooks/use-scoped-backup-preview.test.tsx')}
  52 = @{SHA='cce73ec47445102b216b3f8eceb4ec9de67eb1a7';Files=@('src/components/tournament-stages-panel.test.tsx')}
  53 = @{SHA='6a8f0c3e5775eb056df75ebdd7b33df7cbc78979';Files=@('src/lib/tournament-auth-query-cache.test.tsx')}
  54 = @{SHA='dbba0eb82920b4f324866b1b983e1211459f52ec';Files=@('src/pages/tournament-detail.rr-readback.test.tsx')}
}
$t = $Targets[$PR]
if ($Suite -eq 'existing-auth' -and $PR -ne 53) { Write-Error 'existing-auth suite is only for PR53'; exit 2 }
$files = if ($Suite -eq 'existing-auth') { @('src/hooks/use-tournament-auth.test.tsx') } else { @($t.Files) }
$CmdArgs = if ($Suite -in @('target','existing-auth')) {
  @('exec','node','--import','tsx','--import','./test/setup-dom.mjs','--test','--test-reporter=tap') + $files
} elseif ($Suite -eq 'typecheck') { @('--filter','@workspace/tournament-manager','run','typecheck') }
else { @('--filter','@workspace/tournament-manager','run','build') }
if (-not $Execute) {
  [pscustomobject]@{pr=$PR;sha=$t.SHA;suite=$Suite;command=('pnpm ' + ($CmdArgs -join ' '));status='PLAN_ONLY_NOT_EXECUTED'} | ConvertTo-Json
  exit 0
}
function Stop-Test([string]$Why) { Write-Error ('BLOCKED: ' + $Why); exit 2 }
if (-not $Repo -or -not $OutDir -or -not $ApprovalFile) { Stop-Test 'Require -Repo, -OutDir and -ApprovalFile' }
if (-not (Test-Path -LiteralPath $Repo -PathType Container)) { Stop-Test 'Full checkout absent' }
$root = (Resolve-Path -LiteralPath $Repo).Path
$outside = [IO.Path]::GetFullPath($OutDir)
if ($outside -eq $root -or $outside.StartsWith(($root.TrimEnd('\') + '\'), [StringComparison]::OrdinalIgnoreCase)) { Stop-Test 'Evidence must be outside repo' }
foreach ($p in @('pnpm-workspace.yaml','pnpm-lock.yaml','artifacts/tournament-manager/package.json','artifacts/tournament-manager/test/setup-dom.mjs')) {
  if (-not (Test-Path -LiteralPath (Join-Path $root $p))) { Stop-Test ('Incomplete checkout: ' + $p) }
}
if (-not (Test-Path -LiteralPath (Join-Path $root 'node_modules/.pnpm'))) { Stop-Test 'Frozen pnpm dependencies not installed — separate owner authorization required' }
foreach ($binary in @('git','node','pnpm')) {
  if (-not (Get-Command $binary -ErrorAction SilentlyContinue)) { Stop-Test ('Missing binary: ' + $binary) }
}
$shaObserved = (& git -C $root rev-parse HEAD 2>$null | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $shaObserved -ne $t.SHA) { Stop-Test 'Checkout SHA mismatch' }
$gitRoot = (& git -C $root rev-parse --show-toplevel 2>$null | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or [IO.Path]::GetFullPath($gitRoot).TrimEnd('\') -ne $root.TrimEnd('\')) { Stop-Test 'Not a Git root' }
$dirty = (& git -C $root status --porcelain --untracked-files=all | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $dirty) { Stop-Test 'Checkout dirty' }
$remote = (& git -C $root remote get-url origin 2>$null | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $remote -notmatch '(?i)github\.com[:/]C8LyNn/aplikacja-turnieje(?:\.git)?$') { Stop-Test 'Wrong origin' }
$nodeVersion = (& node --version | Out-String).Trim()
$pnpmVersion = (& pnpm --version | Out-String).Trim()
if ($nodeVersion -notmatch '^v22\.' -or $pnpmVersion -notmatch '^10\.') { Stop-Test 'Require Node22 and pnpm10' }
$front = Join-Path $root 'artifacts/tournament-manager'
foreach ($file in $files) { if (-not (Test-Path -LiteralPath (Join-Path $front $file))) { Stop-Test ('Missing test: ' + $file) } }
if (-not (Test-Path -LiteralPath $ApprovalFile)) { Stop-Test 'Explicit approval file absent' }
try { $approval = Get-Content -LiteralPath $ApprovalFile -Raw | ConvertFrom-Json } catch { Stop-Test 'Approval unreadable' }
if ($approval.approved -ne $true -or $approval.authority -ne 'WEB-005-A00' -or $approval.scope -ne 'FRONTEND_TEST_ONLY' -or [int]$approval.pr -ne $PR -or $approval.head_sha -ne $t.SHA -or -not $approval.approval_reference) { Stop-Test 'No matching A00 GO' }
try { $expiry = [DateTimeOffset]::Parse([string]$approval.expires_at_utc) } catch { Stop-Test 'Approval expiry invalid' }
if ($expiry -le [DateTimeOffset]::UtcNow) { Stop-Test 'Approval expired' }
# An approval JSON is not a cryptographic signature: verify with A00 out-of-band before using -Execute.
# Frontend tests must never inherit production DB/API secrets.
Get-ChildItem Env: | Where-Object { $_.Name -match '(?i)(DATABASE_URL|^PGHOST$|^PGUSER$|^PGPASSWORD$|^PGDATABASE$|^PGPORT$|TOKEN|PASSWORD|SECRET|API[_-]?KEY)' } |
  ForEach-Object { Remove-Item ('Env:' + $_.Name) -ErrorAction SilentlyContinue }
$env:NODE_ENV = 'test'
$env:TSX_TSCONFIG_PATH = Join-Path $front 'test/tsconfig.json'
New-Item -ItemType Directory -Path $outside -Force | Out-Null
$prefix = 'PR' + $PR + '_' + $t.SHA.Substring(0,12) + '_' + $Suite
$log = Join-Path $outside ($prefix + '.UNSANITIZED.log')
$cwd = if ($Suite -in @('target','existing-auth')) { $front } else { $root }
Push-Location $cwd
try { & pnpm @CmdArgs 2>&1 | Out-File -FilePath $log -Encoding utf8; $exitCode = $LASTEXITCODE }
finally { Pop-Location }
if ($null -eq $exitCode) { $exitCode = 127 }
$tap = @{}
if ($Suite -in @('target','existing-auth')) {
  $logText = Get-Content -LiteralPath $log -Raw
  foreach ($key in @('tests','pass','fail','cancelled','skipped','todo')) {
    $found = [regex]::Matches($logText, '(?m)^# ' + $key + ' (\d+)\s*$')
    $tap[$key] = if ($found.Count) { [int]$found[$found.Count-1].Groups[1].Value } else { $null }
  }
}
$pass = ($exitCode -eq 0)
if ($Suite -in @('target','existing-auth')) {
  $pass = $pass -and $null -ne $tap.tests -and $tap.tests -gt 0 -and $tap.pass -eq $tap.tests -and $tap.fail -eq 0 -and $tap.cancelled -eq 0 -and $tap.skipped -eq 0 -and $tap.todo -eq 0
}
$evidence = [ordered]@{pr=$PR;head_sha=$shaObserved;kind=$Suite;command=('pnpm ' + ($CmdArgs -join ' '));exit_code=$exitCode;tap=$tap;status= $(if ($pass) {'NATIVE_TEST_PASS'} else {'FAIL_OR_INCOMPLETE'});node=$nodeVersion;pnpm=$pnpmVersion;utc=[DateTimeOffset]::UtcNow.ToString('o');approval_reference=$approval.approval_reference;log_path=$log;log_sensitivity='UNSANITIZED_REVIEW_BEFORE_SHARING'}
$evidence | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $outside ($prefix + '.json')) -Encoding utf8
$evidence | ConvertTo-Json -Depth 8
if ($pass) { exit 0 } else { exit 1 }
