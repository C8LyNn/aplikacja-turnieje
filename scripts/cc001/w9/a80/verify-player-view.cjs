'use strict';
/**
 * CC-001 R17-W9 A80: operator-annotated, paired-player VIEW contract checker.
 * Scope: observable UX consistency, not network traffic parsing or gameplay code.
 * All state and screenshot annotations are supplied by the operator. A positive
 * result is NOT physical G3 or independent A60 QA.
 * Node.js built-ins only; no network access or source modification.
 */
const fs = require('node:fs');
const crypto = require('node:crypto');

const SCHEMA = 'cc001-r17-w9-player-view-v1';
const PHASES = new Set(['Aiming', 'Moving', 'Over']);
function isOwner(n) { return Number.isInteger(n) && (n === 0 || n === 1); }
function isRev(n) { return Number.isSafeInteger(n) && n >= 0; }
function nonempty(s) { return typeof s === 'string' && s.trim().length > 0; }
function digest(s) { return crypto.createHash('sha256').update(s).digest('hex'); }

function assess(input) {
  const errors = [], gaps = [], notes = [], checks = [];
  const observations = input && Array.isArray(input.observations) ? input.observations : [];
  function error(code, device) { errors.push({code, device:device || null}); }
  function gap(code, device) { gaps.push({code, device:device || null}); }
  function check(code, ok, device) { checks.push({code, pass:ok, device:device || null}); if (!ok) error(code, device); }
  if (!input || input.schema !== SCHEMA) gap('SCHEMA_UNKNOWN');
  if (input?.policy?.perspective !== 'local-player-bottom' && input?.policy?.perspective !== 'unconstrained') gap('PERSPECTIVE_POLICY_UNDECLARED');
  if (observations.length !== 2) gap('TWO_DEVICE_OBSERVATIONS_REQUIRED');
  const byDevice = new Map();
  for (const o of observations) {
    if (!o || !['PC1','PC2'].includes(o.device) || byDevice.has(o.device)) {
      gap('INVALID_OR_DUPLICATE_DEVICE'); continue;
    }
    byDevice.set(o.device, o);
  }
  if (!byDevice.has('PC1')) gap('PC1_OBSERVATION_MISSING');
  if (!byDevice.has('PC2')) gap('PC2_OBSERVATION_MISSING');

  for (const [device,o] of byDevice) {
    if (!nonempty(o.evidence?.screenshotPath)) gap('SCREENSHOT_PATH_MISSING', device);
    if (!nonempty(o.evidence?.logPath)) gap('PLAYER_LOG_PATH_MISSING', device);
    if (!nonempty(o.evidence?.captureUtc)) gap('CAPTURE_UTC_MISSING', device);
    if (!isOwner(o.localOwner)) { gap('LOCAL_OWNER_UNVERIFIED',device); continue; }
    if (!isOwner(o.authoritative?.turn) || !PHASES.has(o.authoritative?.phase) || !isRev(o.authoritative?.revision)) {
      gap('AUTHORITATIVE_STATE_UNVERIFIED',device); continue;
    }
    const ui=o.ui||{}, a=o.authoritative;
    if (isOwner(ui.turnBannerOwner)) check('TURN_BANNER_OWNER_MISMATCH',ui.turnBannerOwner===a.turn,device);
    else gap('TURN_BANNER_OWNER_UNVERIFIED',device);
    if (typeof ui.yourTurnShown === 'boolean') {
      const actualCanAct = a.phase==='Aiming' && a.turn===o.localOwner;
      check('YOUR_TURN_LABEL_MISMATCH', ui.yourTurnShown===actualCanAct,device);
    } else gap('YOUR_TURN_LABEL_UNVERIFIED',device);
    if (isOwner(ui.deckOwner)) check('DECK_OWNER_MISMATCH',ui.deckOwner===o.localOwner,device);
    else gap('DECK_OWNER_UNVERIFIED',device);
    if (input?.policy?.perspective==='local-player-bottom') {
      if (typeof ui.localPlayerAtBottom === 'boolean') check('LOCAL_PERSPECTIVE_NOT_BOTTOM',ui.localPlayerAtBottom,device);
      else gap('PERSPECTIVE_UNVERIFIED',device);
    }
    if (ui.aim && typeof ui.aim.dragActive === 'boolean') {
      if (ui.aim.dragActive && a.phase==='Aiming' && a.turn===o.localOwner) {
        if (typeof ui.aim.arrowVisible!=='boolean') gap('AIM_ARROW_VISIBILITY_UNVERIFIED',device);
        else check('AIM_ARROW_ABSENT',ui.aim.arrowVisible,device);
        if (typeof ui.aim.arrowAlignedWithDrag!=='boolean') gap('AIM_ARROW_ALIGNMENT_UNVERIFIED',device);
        else check('AIM_ARROW_MISALIGNED',ui.aim.arrowAlignedWithDrag,device);
      }
      // Shot-power UI design is not asserted before A10 approval.
    } else gap('AIM_ANNOTATION_MISSING',device);
    if (a.phase!=='Aiming' && ui.aim?.dragActive===true) error('DRAG_ACTIVE_DURING_NON_AIMING_PHASE',device);
  }
  const p1=byDevice.get('PC1'),p2=byDevice.get('PC2');
  if (p1 && p2) {
    if (isOwner(p1.localOwner) && isOwner(p2.localOwner)) {
      check('LOCAL_SEAT_COLLISION',p1.localOwner!==p2.localOwner);
      // RC1 trusted LAN convention: host P1 owner=0, client P2 owner=1.
      check('PC1_PC2_SEAT_MAPPING_MISMATCH',p1.localOwner===0 && p2.localOwner===1);
    }
    const a=p1.authoritative,b=p2.authoritative;
    if (isRev(a?.revision) && isRev(b?.revision)) {
      if (a.revision===b.revision) {
        if (isOwner(a.turn)&&isOwner(b.turn)) check('SAME_REV_TURN_DIVERGENCE',a.turn===b.turn);
        if (PHASES.has(a.phase)&&PHASES.has(b.phase)) check('SAME_REV_PHASE_DIVERGENCE',a.phase===b.phase);
        if (nonempty(a.stateDigest) && nonempty(b.stateDigest)) check('SAME_REV_STATE_DIVERGENCE',a.stateDigest===b.stateDigest);
        else gap('SAME_REV_WORLD_DIGEST_MISSING');
      } else {
        notes.push('UNALIGNED_REVISIONS_NO_STATE_PARITY_CLAIM');
        gap('SAME_REVISION_PAIR_NOT_CAPTURED');
      }
    }
  }
  const verdict=errors.length?'OBSERVED_CONTRACT_FAIL':gaps.length?'INSUFFICIENT_EVIDENCE':'OBSERVATION_CONTRACT_CONSISTENT';
  return {schema:SCHEMA,verdict,physicalG3Status:'NOT_ASSESSED',
    source:'operator annotations; screenshot/log contents NOT independently verified',
    summary:{checks:checks.length,passed:checks.filter(x=>x.pass).length,errors:errors.length,gaps:gaps.length},
    errors,gaps,notes,checks};
}
module.exports={SCHEMA,assess};

if (require.main===module) {
  const args=process.argv.slice(2),i=args.indexOf('--input'),out=args.indexOf('--out');
  if (i<0 || !args[i+1]) {console.error('Usage: node verify-player-view.cjs --input observations.json [--out report.json]');process.exitCode=2;}
  else {
    try {
      const raw=fs.readFileSync(args[i+1],'utf8');const report=assess(JSON.parse(raw));
      report.inputSha256=digest(raw);const rendered=JSON.stringify(report,null,2)+'\n';
      if(out>=0&&args[out+1]) fs.writeFileSync(args[out+1],rendered,'utf8'); else process.stdout.write(rendered);
      process.exitCode=report.verdict==='OBSERVED_CONTRACT_FAIL'?1:report.verdict==='INSUFFICIENT_EVIDENCE'?3:0;
    } catch(e){console.error('A80_VIEW_CHECK_ERROR '+e.message);process.exitCode=4;}
  }
}
