#requires -Version 7.0
<#
.SYNOPSIS
  WEB-005 A50 R23C: safe exact-SHA local Windows 11 native test executor.
.DESCRIPTION
  Clones a LOCAL, already-authorized Git repository into a NEW disposable
  checkout. Never runs SQL, Pack17 --full, migrations, API integration tests,
  GitHub Actions, or deploy. Never changes the source repository.
  It intentionally has NO PostgreSQL / destructive-test switch.
.EXAMPLE
  pwsh -NoProfile -File .\WEB-005_A50_R23C_EXECUTOR.ps1 -RepositorySource 'C:\WEB005\source-mirror' -WorkspaceRoot 'C:\WEB005\isolated' -EvidenceRoot 'C:\WEB005\evidence' -ExpectedSha 'FULL40CHARSHA' -Profile CompositeA40 -AllowInstall -AuthorizeRun
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$RepositorySource,
  [Parameter(Mandatory=$true)][string]$WorkspaceRoot,
  [Parameter(Mandatory=$true)][string]$EvidenceRoot,
  [Parameter(Mandatory=$true)][ValidatePattern('^[0-9a-fA-F]{40}$')][string]$ExpectedSha,
  [ValidateSet('CompositeA40','PR36','PR56','PR57','PR58','Custom')][string]$Profile='CompositeA40',
  [ValidateSet('Pack19to26','Pack17Pure','BackupStrict','BackupProfile','Swiss','ApiTypecheck','FrontendUnit')]
  [string[]]$Suites=@('Pack19to26','Pack17Pure','BackupStrict','BackupProfile','Swiss','ApiTypecheck','FrontendUnit'),
  [switch]$AllowInstall,
  [switch]$AuthorizeRun
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$PSNativeCommandUseErrorActionPreference=$false
$script:Events=[System.Collections.Generic.List[object]]::new()
$script:Serial=0
$script:Checkout=$null
$script:Evidence=$null
$script:Outcome='NOT_EXECUTED'
$script:ErrorMessage=$null
$script:Head=$null
$script:Versions=[ordered]@{}
$script:LockSha256=$null
$script:StartTime=(Get-Date).ToUniversalTime().ToString('o')
$script:UnsafeEnvironment=@('DATABASE_URL','TEST_DATABASE_URL','TEST_DATABASE_SCHEMA',
  'TEST_DATABASE_RESET','PGHOST','PGPORT','PGDATABASE','PGUSER','PGPASSWORD',
  'PGSERVICE','PGSERVICEFILE','NEON_DATABASE_URL','DIRECT_URL')
function FullPath([string]$p) { return [IO.Path]::GetFullPath($p).TrimEnd([char[]]@('\','/')) }
function IsInside([string]$p,[string]$parent) {
  $p=FullPath $p; $parent=FullPath $parent
  return $p.Equals($parent,[StringComparison]::OrdinalIgnoreCase) -or
    $p.StartsWith(($parent+[IO.Path]::DirectorySeparatorChar),[StringComparison]::OrdinalIgnoreCase)
}
function Redact([string]$body) {
  if ($null -eq $body) { return '' }
  $s=[regex]::Replace($body,'(?i)\b(postgres(?:ql)?://)[^\s"''<>]+','$1[REDACTED_URL]')
  $s=[regex]::Replace($s,'(?i)\b(https?://)[^\s"''<>@]+:[^\s"''<>@]+@','$1[REDACTED_AUTH]@')
  $s=[regex]::Replace($s,'(?i)\b(authorization\s*[:=]\s*bearer\s+)[A-Za-z0-9_\-.+/=]+','$1[REDACTED]')
  $s=[regex]::Replace($s,'(?i)\b((?:password|passwd|api[_-]?key|secret|token|connectionstring|client_secret)\s*[:=]\s*)["'']?[^,\s"'';]+','$1[REDACTED]')
  $s=[regex]::Replace($s,'(?i)\b(gh[pousr]_[A-Za-z0-9]{15,}|github_pat_[A-Za-z0-9_]{20,})','[REDACTED_TOKEN]')
  $s=[regex]::Replace($s,'-----BEGIN [^-]+PRIVATE KEY-----[\s\S]*?-----END [^-]+PRIVATE KEY-----','[REDACTED_PRIVATE_KEY]')
  return $s
}
function TapStats([string]$output) {
  $obj=[ordered]@{ tests=$null; pass=$null; fail=$null; skipped=$null; todo=$null; cancelled=$null }
  $matches=[regex]::Matches($output,'(?m)^\s*#\s*(tests|pass|fail|skipped|todo|cancelled)\s+(\d+)\s*$')
  foreach ($m in $matches) { $k=$m.Groups[1].Value; $obj[$k]=[int]$m.Groups[2].Value }
  return $obj
}
function RecordSkipped([string]$name,[string]$why) {
  $script:Events.Add([ordered]@{step=$name; classification='SKIP_NOT_IN_THIS_SHA';
    reason=$why; command=$null; exit_code=$null; tap=$null; log=$null})
}
function Run([string]$name,[string]$tool,[string[]]$argv,[string]$cwd,[string]$failureKind='ENVIRONMENT') {
  $script:Serial++
  $safeName=($name -replace '[^A-Za-z0-9_-]','_')
  $file=Join-Path $script:Evidence ('{0:D2}_{1}.log' -f $script:Serial,$safeName)
  $text=''
  $exitCode=9001
  $start=Get-Date
  Push-Location -LiteralPath $cwd
  try {
    # Strip database credentials and endpoint selection from every child process.
    $saved=@{}
    foreach($k in $script:UnsafeEnvironment) {
      $saved[$k]=[Environment]::GetEnvironmentVariable($k,'Process')
      [Environment]::SetEnvironmentVariable($k,$null,'Process')
    }
    try {
      $global:LASTEXITCODE=$null
      $text=(& $tool @argv 2>&1 | Out-String -Width 32767)
      if ($null -ne $LASTEXITCODE) { $exitCode=[int]$LASTEXITCODE }
      else { $exitCode=0 }
    } catch {
      $text+=($_ | Out-String)
      $exitCode=9001
    } finally {
      foreach($k in $script:UnsafeEnvironment) {
        [Environment]::SetEnvironmentVariable($k,$saved[$k],'Process')
      }
    }
  } finally { Pop-Location }
  $clean=Redact $text
  $header="STEP: $name" + [Environment]::NewLine +
    "COMMAND: " + (($tool)+ ' '+($argv -join ' ')) + [Environment]::NewLine +
    "EXIT: $exitCode" + [Environment]::NewLine + '---- output (sanitized) ----' + [Environment]::NewLine
  [IO.File]::WriteAllText($file,($header+$clean),[Text.UTF8Encoding]::new($false))
  $tap=TapStats $clean
  $cls=if($exitCode -eq 0){'COMMAND_PASS'}else{
    if($clean -match '(ERR_MODULE_NOT_FOUND|MODULE_NOT_FOUND|ERR_PNPM|ENOENT|Cannot find (module|package)|not recognized as the name of a cmdlet)'){'ENVIRONMENT_FAILURE'}
    elseif($failureKind -eq 'CONTRACT'){'SOURCE_CONTRACT_FAILURE'}
    elseif($failureKind -eq 'TYPECHECK'){'TYPECHECK_FAILURE'}
    elseif($failureKind -eq 'UNIT'){'FEATURE_TEST_FAILURE'}
    else{'ENVIRONMENT_FAILURE'}
  }
  $rec=[ordered]@{step=$name;classification=$cls;command=(($tool)+' '+($argv -join ' '));
    exit_code=$exitCode;tap=$tap;log=$file;log_sha256=(Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash;
    duration_sec=[math]::Round(((Get-Date)-$start).TotalSeconds,3)}
  $script:Events.Add($rec)
  Write-Host "$name :: $cls :: exit $exitCode :: $file"
  if($exitCode -ne 0){throw "STEP_FAILURE: $name exit $exitCode ($cls). See $file"}
  return $rec
}
function NeedFile([string]$rel,[string]$group) {
  $p=Join-Path $script:Checkout ($rel -replace '/',[IO.Path]::DirectorySeparatorChar)
  if(-not (Test-Path -LiteralPath $p -PathType Leaf)) {
    if($Profile -eq 'CompositeA40' -or $Profile -eq 'Custom') {
      RecordSkipped $group "Not present in current exact candidate SHA: $rel"
      return $false
    }
    throw "MANDATORY_SOURCE_MISSING: $rel at $script:Head"
  }
  return $true
}
function AssertUnitOnly([string]$rel) {
  $p=Join-Path $script:Checkout ($rel -replace '/',[IO.Path]::DirectorySeparatorChar)
  $txt=[IO.File]::ReadAllText($p)
  if($txt -match '(?i)\b(resetTestSchema|dropTestSchema|DROP\s+SCHEMA|TEST_DATABASE_RESET|TEST_DATABASE_URL|createTestDatabase)\b') {
    throw "DB_SAFETY_STOP: forbidden destructive/database operation text in test file $rel"
  }
}
function TestNode([string]$id,[string]$path,[string]$kind='UNIT') {
  if(-not(NeedFile $path $id)){return}
  AssertUnitOnly $path
  $localPath=$path.Substring('artifacts/api-server/'.Length)
  [void](Run $id 'pnpm' @('--filter','@workspace/api-server','exec','node','--import','tsx','--test','--test-reporter=tap',$localPath) $script:Checkout $kind)
}
function TestFrontend([string]$id,[string]$path,[switch]$tsconfig) {
  if(-not(NeedFile $path $id)){return}
  AssertUnitOnly $path
  $fromApi='../tournament-manager/'+$path.Substring('artifacts/tournament-manager/'.Length)
  $args=@('--filter','@workspace/api-server','exec','node','--import','tsx','--test','--test-reporter=tap',$fromApi)
  if($tsconfig){$args=@('--filter','@workspace/api-server','exec','tsx','--tsconfig','../tournament-manager/tsconfig.json','--test','--test-reporter=tap',$fromApi)}
  [void](Run $id 'pnpm' $args $script:Checkout 'UNIT')
}
$packs=@(
  @{id='19'; test='artifacts/api-server/test/se-correction-readiness.test.ts'},
  @{id='20'; test='artifacts/api-server/test/se-correction-action-plan.test.ts'},
  @{id='21'; test='artifacts/api-server/test/se-correction-diagnostic.test.ts'},
  @{id='22'; test='artifacts/tournament-manager/src/lib/se-diagnostic-comparison.test.ts'},
  @{id='23'; test='artifacts/tournament-manager/src/lib/se-assessment-history.test.ts'},
  @{id='24'; test='artifacts/tournament-manager/src/lib/se-remediation-priority.test.ts'},
  @{id='25'; test='artifacts/api-server/test/se-correction-impact-graph.test.ts'},
  @{id='26'; test='artifacts/api-server/test/se-correction-impact-risk-report.test.ts'}
)
try {
  if(-not $AuthorizeRun){throw 'AUTHORIZATION_STOP: operator must explicitly supply -AuthorizeRun'}
  if($Profile -eq 'CompositeA40' -and $ExpectedSha.ToLowerInvariant() -cne 'fa3261b2c9510e110ac9eba21726812d3401a525'){throw 'COMPOSITE_PIN_STOP: first A40 composite is PR60@fa3261b2c9510e110ac9eba21726812d3401a525'}
  if(-not $AllowInstall){throw 'INSTALL_STOP: fresh checkout needs explicit -AllowInstall'}
  if($RepositorySource -match '^(https?://|ssh://|git@)'){throw 'SOURCE_STOP: RepositorySource must be a LOCAL trusted Git repository'}
  $src=(Resolve-Path -LiteralPath $RepositorySource -ErrorAction Stop).ProviderPath
  $wr=FullPath $WorkspaceRoot; $er=FullPath $EvidenceRoot
  if((IsInside $wr $src) -or (IsInside $er $src) -or (IsInside $er $wr) -or (IsInside $wr $er)) {
    throw 'ISOLATION_STOP: workspace and evidence directories must be disjoint and outside source repository'
  }
  if(-not (Test-Path -LiteralPath $wr)){[void](New-Item -ItemType Directory -Path $wr -Force)}
  if(-not (Test-Path -LiteralPath $er)){[void](New-Item -ItemType Directory -Path $er -Force)}
  $id=(Get-Date -Format 'yyyyMMdd_HHmmss')+'_'+[guid]::NewGuid().ToString('N').Substring(0,8)
  $script:Evidence=Join-Path $er ('WEB005_A50_'+$Profile+'_'+$id)
  [void](New-Item -ItemType Directory -Path $script:Evidence -ErrorAction Stop)
  $script:Checkout=Join-Path $wr ('WEB005_'+$Profile+'_'+$ExpectedSha.Substring(0,12)+'_'+$id)
  $script:Versions.powershell=$PSVersionTable.PSVersion.ToString()
  $v=Run 'node-version' 'node' @('--version') $src
  $script:Versions.node=(& node --version).Trim()
  $v=Run 'pnpm-version' 'pnpm' @('--version') $src
  $script:Versions.pnpm=(& pnpm --version).Trim()
  [void](Run 'git-version' 'git' @('--version') $src)
  $script:Versions.git=(& git --version).Trim()
  $nodeVersion=(& node --version).Trim()
  $pnpmVersion=(& pnpm --version).Trim()
  if($nodeVersion -notmatch '^v22\.'){throw "VERSION_STOP: requires Node 22; found $nodeVersion"}
  if($pnpmVersion -notmatch '^10\.'){throw "VERSION_STOP: requires pnpm 10; found $pnpmVersion"}
  [void](Run 'source-has-commit' 'git' @('-C',$src,'cat-file','-e',($ExpectedSha+'^{commit}')) $src)
  [void](Run 'clone-isolated' 'git' @('clone','--no-local','--no-checkout',$src,$script:Checkout) $src)
  # Local fetch may be needed for reachable-but-unadvertised commit objects; never network.
  [void](Run 'fetch-pinned-from-local-only' 'git' @('-C',$script:Checkout,'fetch','--no-tags',$src,$ExpectedSha) $script:Checkout)
  [void](Run 'detach-exact-sha' 'git' @('-C',$script:Checkout,'checkout','--detach',$ExpectedSha) $script:Checkout)
  $script:Head=(& git -C $script:Checkout rev-parse HEAD).Trim()
  if($LASTEXITCODE -ne 0 -or $script:Head -cne $ExpectedSha.ToLowerInvariant()) {
    throw "SHA_GATE_STOP: checkout=$script:Head required=$ExpectedSha"
  }
  $dirty=(& git -C $script:Checkout status --porcelain)
  if($LASTEXITCODE -ne 0 -or $dirty){throw 'CLEAN_WORKTREE_STOP: source checkout is dirty before install'}
  foreach($n in @('package.json','pnpm-workspace.yaml','pnpm-lock.yaml','artifacts/api-server/package.json')) {
    if(-not (Test-Path -LiteralPath (Join-Path $script:Checkout $n) -PathType Leaf)){throw "MONOREPO_STOP: missing $n"}
  }
  $script:LockSha256=(Get-FileHash -LiteralPath (Join-Path $script:Checkout 'pnpm-lock.yaml') -Algorithm SHA256).Hash
  $lock=Get-Content -LiteralPath (Join-Path $script:Checkout 'pnpm-lock.yaml') -TotalCount 8
  if(($lock -join [Environment]::NewLine) -notmatch "lockfileVersion:\s*['""]?9"){throw 'LOCKFILE_STOP: pnpm10 workspace lockfileVersion 9 expected'}
  [void](Run 'install-frozen-lockfile' 'pnpm' @('install','--frozen-lockfile') $script:Checkout)
  if((Get-FileHash -LiteralPath (Join-Path $script:Checkout 'pnpm-lock.yaml') -Algorithm SHA256).Hash -cne $script:LockSha256){throw 'LOCKFILE_DRIFT_STOP: frozen lockfile changed during install'}
  [void](Run 'workspace-typescript-version' 'pnpm' @('--filter','@workspace/api-server','exec','tsc','--version') $script:Checkout)
  $script:Outcome='RUNNING'
  foreach($suite in $Suites){
    switch($suite){
      'Pack19to26' {
        foreach($p in $packs) {
          $c='qa/pack'+$p.id+'/source-contract.test.mjs'
          if(NeedFile $c ('Pack'+$p.id+'-contract')){
            [void](Run ('Pack'+$p.id+'-contract') 'node' @('--test','--test-reporter=tap',$c) $script:Checkout 'CONTRACT')
          }
          if($p.test.StartsWith('artifacts/api-server/')) {
            TestNode ('Pack'+$p.id+'-unit') $p.test
          } else {
            if(NeedFile $p.test ('Pack'+$p.id+'-unit')){
              AssertUnitOnly $p.test
              $testArg='../tournament-manager/'+$p.test.Substring('artifacts/tournament-manager/'.Length)
              [void](Run ('Pack'+$p.id+'-unit') 'pnpm' @('--filter','@workspace/api-server','exec','node','--import','tsx','--test','--test-reporter=tap',$testArg) $script:Checkout 'UNIT')
            }
          }
        }
      }
      'Pack17Pure' {
        $rel='qa/pack17/gate-contract.test.mjs'
        if(NeedFile $rel 'Pack17Pure') {
          AssertUnitOnly $rel
          [void](Run 'Pack17Pure' 'node' @('--test','--test-reporter=tap',$rel) $script:Checkout 'CONTRACT')
        }
      }
      'BackupStrict' {TestNode 'BackupStrict' 'artifacts/api-server/test/backup-v3-strict-policy.test.ts'}
      'BackupProfile' {TestNode 'BackupProfile' 'artifacts/api-server/test/backup-v3-profile-gate.test.ts'}
      'Swiss' {TestNode 'Swiss' 'artifacts/api-server/test/swiss.test.ts'}
      'ApiTypecheck' {
        [void](Run 'ApiTypecheck' 'pnpm' @('--filter','@workspace/api-server','run','typecheck') $script:Checkout 'TYPECHECK')
      }
      'FrontendUnit' {
        TestFrontend 'Frontend-backup-file' 'artifacts/tournament-manager/src/lib/backup-file.test.ts'
        TestFrontend 'Frontend-stage-utils' 'artifacts/tournament-manager/src/lib/stage-utils.test.ts'
        TestFrontend 'Frontend-query-invalidation' 'artifacts/tournament-manager/src/lib/tournament-query-invalidation.test.ts'
        TestFrontend 'Frontend-stages-ui' 'artifacts/tournament-manager/src/lib/tournament-stages-ui.test.tsx' -tsconfig
        TestFrontend 'Frontend-seeding-ui' 'artifacts/tournament-manager/src/lib/seeding-ceremony-view.test.ts' -tsconfig
      }
    }
  }
  $skipCount=@($script:Events | Where-Object {$_.classification -eq 'SKIP_NOT_IN_THIS_SHA'}).Count
  $testCount=@($script:Events | Where-Object {$_.step -match '^(Pack\d+-(?:unit|contract)|Pack17Pure|BackupStrict|BackupProfile|Swiss|Frontend-.+|ApiTypecheck)$' -and $_.exit_code -eq 0}).Count
  if($testCount -eq 0){throw 'NO_TEST_EXECUTED: did not run any requested safe tests on selected SHA'}
  $script:Outcome=if($skipCount -gt 0){'PARTIALLY_EXECUTED_MISSING_SUITES'}else{'NONDESTRUCTIVE_QA_EXECUTED_PASS'}
} catch {
  $script:ErrorMessage=Redact ($_ | Out-String)
  if($script:Outcome -ne 'PARTIALLY_EXECUTED_MISSING_SUITES'){$script:Outcome='BLOCKED_OR_FAILED'}
  Write-Warning $script:ErrorMessage
} finally {
  if($script:Evidence) {
    $report=[ordered]@{
      schema='web005.a50.r23c.native-executor.v1'
      profile=$Profile
      suites=$Suites
      required_sha=$ExpectedSha.ToLowerInvariant()
      observed_sha=$script:Head
      source_path=$RepositorySource
      isolated_checkout=$script:Checkout
      evidence_directory=$script:Evidence
      started_utc=$script:StartTime
      finished_utc=(Get-Date).ToUniversalTime().ToString('o')
      node22_pnpm10_git_required=$true
      frozen_lock_sha256=$script:LockSha256
      tool_versions=$script:Versions
      runner_sha256=(Get-FileHash -LiteralPath $PSCommandPath -Algorithm SHA256).Hash
      verdict=$script:Outcome
      application_qa_complete=$false
      database_tests_executed=0
      pack17_full_executed=$false
      steps=@($script:Events.ToArray())
      aggregate_tap=[ordered]@{
        tests=@($script:Events | Where-Object { $null -ne $_.tap.tests } | ForEach-Object { $_.tap.tests } | Measure-Object -Sum).Sum
        pass=@($script:Events | Where-Object { $null -ne $_.tap.pass } | ForEach-Object { $_.tap.pass } | Measure-Object -Sum).Sum
        fail=@($script:Events | Where-Object { $null -ne $_.tap.fail } | ForEach-Object { $_.tap.fail } | Measure-Object -Sum).Sum
        skipped=@($script:Events | Where-Object { $null -ne $_.tap.skipped } | ForEach-Object { $_.tap.skipped } | Measure-Object -Sum).Sum
      }
      error=$script:ErrorMessage
    }
    $file=Join-Path $script:Evidence 'receipt.json'
    [IO.File]::WriteAllText($file,($report|ConvertTo-Json -Depth 10),[Text.UTF8Encoding]::new($false))
    Write-Host "WEB005 RECEIPT: $file"
    Write-Host "WEB005 RESULT: $script:Outcome"
  } else {
    Write-Warning 'Preflight stopped before evidence directory was created. No test executed.'
  }
}
if($script:Outcome -eq 'NONDESTRUCTIVE_QA_EXECUTED_PASS'){exit 0}
if($script:Outcome -eq 'PARTIALLY_EXECUTED_MISSING_SUITES'){exit 3}
exit 2
