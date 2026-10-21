/** WEB-005 W6F: streaming, DB-agnostic subprocess evidence recorder.
 * Raw streams remain in private local files. Never attach these files to a public CI artifact.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createWriteStream, mkdtempSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline, Transform } from 'node:stream';
import { promisify } from 'node:util';
import { StringDecoder } from 'node:string_decoder';

const pipe = promisify(pipeline);
const MAX_LINE = 8192;

// A30-reviewed PR #105 bounded redaction logic, ported narrowly without its runner lineage.
export function redactEvidence(value) {
  return String(value)
    .replace(/\u001b\[[0-9;]*[A-Za-z]/g, '')
    .replace(/\b[a-z][a-z0-9+.-]*:\/\/[^\s'"<>]+/gi, '[URL REDACTED]')
    .replace(/\b(Basic)(\s+)(?:"[A-Za-z0-9+/_-]+={0,2}"|'[A-Za-z0-9+/_-]+={0,2}'|[A-Za-z0-9+/_-]+={0,2})/gi, '$1$2[REDACTED]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+/gi, 'Bearer [REDACTED]')
    .replace(/\b([A-Za-z_]*(?:PASSWORD|PASSWD|SECRET|TOKEN|API_KEY|ACCESS_KEY)[A-Za-z_]*)\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, '$1=[REDACTED]')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .slice(0, 400);
}

const kinds = ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'];
export class TapStreamInspector {
  constructor() {
    this.streams = [this.newState(), this.newState()];
  }
  newState() {
    return { decoder:new StringDecoder('utf8'), pending:'', overflow:false, oversizedLine:false, headers:0,
      sections:[], firstFailure:null, firstDiagnostic:null, bytes:0 };
  }
  line(state, raw) {
    const line = raw.replace(/\u001b\[[0-9;]*[A-Za-z]/g, '').replace(/\r/g, '');
    if (/^TAP version 13\s*$/.test(line)) {
      state.headers++;
      state.sections.push(Object.assign(Object.create(null), {
        assertions:0, failedAssertions:0, rootAssertions:0, nestedAssertions:0,
        nestedPlanTests:0, rootPlan:null, malformed:false, countersStarted:false,
      }));
    }
    if (state.firstFailure === null && /^\s*not ok\s+\d+\s+-\s+\S/.test(line)) {
      state.firstFailure = redactEvidence(line.trim());
    }
    if (state.firstDiagnostic === null && /^\s*(?:failureType|error|code):\s+\S|^\s*(?:Error|TypeError|SyntaxError|ReferenceError):\s+\S/.test(line)) {
      state.firstDiagnostic = redactEvidence(line.trim());
    }
    // Node's TAP summaries can be forged without executing any test. Require
    // concrete assertions, sequential root IDs, and root/nested test plans.
    const section = state.sections.at(-1);
    if (!section) return;
    const assertion = /^([ \t]*)(not )?ok ([0-9]+) - \S/.exec(line);
    const plan = /^([ \t]*)([0-9]+)\.\.([0-9]+)\s*$/.exec(line);
    if (assertion) {
      const id = Number(assertion[3]);
      section.assertions++;
      if (assertion[2]) section.failedAssertions++;
      if (section.countersStarted || section.rootPlan !== null || !Number.isSafeInteger(id) || id < 1) {
        section.malformed = true;
      }
      if (assertion[1] === '') {
        section.rootAssertions++;
        if (id !== section.rootAssertions) section.malformed = true;
      } else section.nestedAssertions++;
    }
    if (plan) {
      const from = Number(plan[2]);
      const to = Number(plan[3]);
      if (section.countersStarted || section.rootPlan !== null || from !== 1 ||
          !Number.isSafeInteger(to) || to < 1) section.malformed = true;
      if (plan[1] === '') {
        if (section.rootPlan !== null) section.malformed = true;
        section.rootPlan = to;
      } else section.nestedPlanTests += to;
    }
    const match = /^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\s*$/.exec(line);
    if (match) {
      section.countersStarted = true;
      if (Object.hasOwn(section, match[1])) section.duplicate = true;
      else section[match[1]] = Number(match[2]);
    }
  }
  chunk(index, buf) {
    const state = this.streams[index];
    state.bytes += buf.byteLength;
    const str = state.decoder.write(buf);
    let pos = 0;
    while(pos < str.length) {
      const eol = str.indexOf('\n', pos);
      if (eol < 0) {
        if (!state.overflow) {
          const remaining = str.slice(pos);
          if (state.pending.length + remaining.length > MAX_LINE) {
            state.pending = ''; state.overflow = true; state.oversizedLine = true;
          } else state.pending += remaining;
        }
        break;
      }
      if (!state.overflow) {
        const fragment = str.slice(pos, eol);
        if (state.pending.length + fragment.length <= MAX_LINE) this.line(state, state.pending + fragment);
        else state.oversizedLine = true;
      }
      state.pending=''; state.overflow=false; pos=eol+1;
    }
  }
  end(index) {
    const state=this.streams[index];
    const tail=state.decoder.end();
    if (tail) this.chunk(index,Buffer.from(tail));
    if (!state.overflow && state.pending) this.line(state,state.pending);
    state.pending='';
  }
  summarize(expectedHeaders=1) {
    const [out,err] = this.streams;
    const sections=out.sections;
    const complete=Number.isInteger(expectedHeaders) && expectedHeaders>=1 &&
      out.headers===expectedHeaders && err.headers===0 && !out.oversizedLine && !err.oversizedLine &&
      sections.length===expectedHeaders && sections.every(s=>
        !s.duplicate && !s.malformed && kinds.every(k=>Number.isSafeInteger(s[k])) &&
        s.rootPlan !== null && s.rootPlan===s.rootAssertions && s.rootAssertions>=1 &&
        s.nestedPlanTests===s.nestedAssertions && s.assertions===s.tests &&
        s.failedAssertions===s.fail &&
        s.pass+s.fail+s.cancelled+s.skipped+s.todo===s.tests);
    const allPass=complete && !out.firstFailure && !err.firstFailure && sections.every(s=>s.tests>=1 && s.pass===s.tests &&
      s.fail===0 && s.cancelled===0 && s.skipped===0 && s.todo===0);
    const counters=Object.fromEntries(kinds.map(k=>[k,complete?sections.reduce((n,s)=>n+s[k],0):null]));
    return {firstFailingTap:out.firstFailure ?? err.firstFailure,
      firstDiagnostic:out.firstDiagnostic ?? err.firstDiagnostic,
      tapComplete:complete, tapPass:allPass, counters,
      headers:out.headers, oversizedLine:out.oversizedLine||err.oversizedLine, stdoutBytes:out.bytes, stderrBytes:err.bytes};
  }
}

/** Spawn exactly one specified subprocess. Nonzero, signal, spawn errors, incomplete TAP fail closed.
 * A caller authorizes the command and environment before invoking this generic recorder.
 */
export async function capturePrivateEvidence({command,args=[],cwd,env,expectedHeaders=1,sourceSha=null}) {
  if (!command || !Array.isArray(args) || !Number.isSafeInteger(expectedHeaders) || expectedHeaders<1 ||
      (sourceSha!==null && !/^[a-f0-9]{40}$/.test(sourceSha))) {
    throw new Error('Invalid recorder parameters');
  }
  const folder=mkdtempSync(join(tmpdir(),'web005-api-private-'));
  try { chmodSync(folder,0o700); } catch { /* ACL differs on Windows; OS user TEMP controls access. */ }
  const inspector=new TapStreamInspector();
  const hashes=[createHash('sha256'),createHash('sha256')];
  const paths=[join(folder,'stdout.raw'),join(folder,'stderr.raw')];
  let child;
  let code=null,signal=null,spawnError=null;
  try {
    child=spawn(command,args,{cwd,env:env??process.env,stdio:['ignore','pipe','pipe'],shell:false,windowsHide:true});
  } catch { spawnError='SPAWN_FAILED'; }
  if (!child) {
    for (const path of paths) writeFileSync(path,'',{mode:0o600,flag:'wx'});
  } else {
    const waitClose=new Promise(resolve=>{
      child.once('error',()=>{spawnError='SPAWN_FAILED';});
      child.once('close',(exit,bySignal)=>{code=exit;signal=bySignal;resolve();});
    });
    const streamTasks=[0,1].map(async index=>{
      const save=new Transform({transform(buf,_enc,callback){
        hashes[index].update(buf);
        inspector.chunk(index,buf);
        callback(null,buf);
      }});
      await pipe(index===0?child.stdout:child.stderr,save,createWriteStream(paths[index],{flags:'wx',mode:0o600}));
      inspector.end(index);
    });
    const settled=await Promise.allSettled([waitClose,...streamTasks]);
    if (settled.some(s=>s.status==='rejected')) spawnError='CAPTURE_IO_FAILED';
  }
  const evidence=inspector.summarize(expectedHeaders);
  const success=!spawnError && signal===null && code===0 && evidence.tapPass;
  const result={
    sourceSha,exitCode:code,signal:signal??null,errorCode:spawnError,
    success,summary:evidence,
    stdoutSha256:hashes[0].digest('hex'),stderrSha256:hashes[1].digest('hex'),
  };
  writeFileSync(join(folder,'receipt.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600,flag:'wx'});
  return { ...result, privateFolder:folder };
}
