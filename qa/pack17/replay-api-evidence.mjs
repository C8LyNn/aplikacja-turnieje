#!/usr/bin/env node
/** Single explicit API replay recorder. Never run without approved disposable PG16 G0. */
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { assertSafeTestDatabaseEnv } from './gate-contract.mjs';
import { capturePrivateEvidence } from './private-api-evidence.mjs';

async function main() {
  if (process.argv.length!==3 || process.argv[2]!=='--integration') {
    console.error('HOLD: usage --integration only; operator/database authorization required');
    process.exitCode=2;return;
  }
  if (!existsSync('pnpm-workspace.yaml') || !existsSync('artifacts/api-server/package.json')) {
    console.error('HOLD: exact repo root required');process.exitCode=2;return;
  }
  if (process.env.WEB005_PRIVATE_REPLAY_OPERATOR_GO!=='APPROVED') {
    console.error('HOLD: separate operator replay authorization required');process.exitCode=2;return;
  }
  // The operator must approve the EXACT instrumented HEAD, not an old C03/C01 SHA.
  let actualHead;
  try { actualHead=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(); }
  catch { console.error('HOLD: cannot identify exact source SHA');process.exitCode=2;return; }
  if (!/^[a-f0-9]{40}$/.test(process.env.WEB005_APPROVED_SOURCE_SHA??'') ||
      process.env.WEB005_APPROVED_SOURCE_SHA!==actualHead) {
    console.error('HOLD: approved source SHA mismatch');process.exitCode=2;return;
  }
  try { assertSafeTestDatabaseEnv(process.env); }
  catch { console.error('HOLD: test DB environment gate failed; no process spawned');process.exitCode=2;return; }
  const r=await capturePrivateEvidence({
    // Exact target of artifacts/api-server package.json test:integration script.
    // Use the already running, explicitly selected Node executable; no cmd.exe/shell.
    command:process.execPath,
    args:['--import','tsx','./test/run-tests.ts','integration'],
    cwd:join(process.cwd(),'artifacts','api-server'),expectedHeaders:1,sourceSha:actualHead,
  });
  // These are intentionally the ONLY fields printed to shared logs.
  console.log('W6F_API_REPLAY: '+JSON.stringify({
    sourceSha:actualHead,exitCode:r.exitCode,signal:r.signal,errorCode:r.errorCode,success:r.success,
    firstFailingTap:r.summary.firstFailingTap,firstDiagnostic:r.summary.firstDiagnostic,
    tapComplete:r.summary.tapComplete,counters:r.summary.counters,headers:r.summary.headers,
    stdoutBytes:r.summary.stdoutBytes,stderrBytes:r.summary.stderrBytes,
    stdoutSha256:r.stdoutSha256,stderrSha256:r.stderrSha256,
    privateEvidenceId:r.privateFolder.split(/[\\/]/).at(-1),
  }));
  if (!r.success) process.exitCode=Number.isInteger(r.exitCode) && r.exitCode>0?r.exitCode:1;
}
main().catch(()=>{console.error('HOLD: recorder internal error; keep private evidence restricted');process.exitCode=1;});
