#!/usr/bin/env node
'use strict';
// CC001 W12/W13 A33: source-contract and fail-closed mutation gate.
// No source inspection or synthetic test is a Unity compile, PC1/PC2 QA, or G3 signoff.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../../../..');
const CSHARP=path.join(ROOT,'unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/DetailsView.cs');
function inspect(src){
  const issues=[],need=(key,condition)=>{if(!condition)issues.push(key);};
  const helperStart=src.indexOf('static string W12QaClipboardText(');
  const renderStart=src.indexOf('void RenderDeveloper()',helperStart);
  const helper=helperStart>=0&&renderStart>helperStart?src.slice(helperStart,renderStart):'';
  const ui=renderStart>=0?src.slice(renderStart):'';
  const copyStart=ui.indexOf('string w13CopyLabel=');
  const copyEnd=ui.indexOf('string technical=',copyStart);
  const copy=copyStart>=0&&copyEnd>copyStart?ui.slice(copyStart,copyEnd):'';
  need('HELPER_MISSING',!!helper);
  need('CLIPBOARD_SIGNATURE',/DateTime capturedUtc,int captureSequence\)/.test(helper));
  need('UTC_TIMESTAMP',helper.includes('capturedUtc.ToUniversalTime().ToString("O")'));
  for(const label of ['CC001_W12_F1_QA_CAPTURE','SOURCE_SHA=UNVERIFIED','CLOCK_SYNC=UNVERIFIED','G3_STATUS=NOT_ATTESTED','TURN=','REVISION=','FRAME=','ACTION_SERIAL=','CAPTURE_SEQ='])
    need('FIELD_'+label,helper.includes(label));
  need('CAPTURE_SEQUENCE_IS_LOCAL',src.includes('int w13QaCaptureSequence;'));
  need('SEQUENCE_INCREMENT_ONCE',copy.includes('w13QaCaptureSequence=w13QaCaptureSequence==int.MaxValue?1:w13QaCaptureSequence+1;'));
  need('SHOW_TEMPORARY_COPY_FEEDBACK',copy.includes('Time.unscaledTime<w13QaCopiedUntil?"COPIED":"COPY QA"'));
  need('FEEDBACK_DURATION',copy.includes('w13QaCopiedUntil=Time.unscaledTime+2.5f;'));
  need('COPY_LABEL_BUTTON',copy.includes('Draw.Button(new Rect(x+w-152,y+8,84,44),w13CopyLabel,Draw.Gold,size:11)'));
  need('COPY_CLICK_GATED',/if\(Draw\.Button\(new Rect\(x\+w-152,y\+8,84,44\),w13CopyLabel,Draw\.Gold,size:11\)\)\s*\{[\s\S]*?GUIUtility\.systemCopyBuffer=W12QaClipboardText/.test(copy));
  need('COPY_GATED_SCOPE',copy.includes('GUIUtility.systemCopyBuffer')&&copy.lastIndexOf('}')>copy.indexOf('GUIUtility.systemCopyBuffer'));
  need('COPY_HAS_CAPTURE_SEQ',/W12QaClipboardText\(networkDebug,s\.turnNumber,s\.revision,\s*s\.frame,s\.actionSerial,DateTime\.UtcNow,w13QaCaptureSequence\)/.test(copy));
  need('SEQUENCE_BEFORE_CLIPBOARD',copy.indexOf('w13QaCaptureSequence=w13QaCaptureSequence')>=0&&copy.indexOf('w13QaCaptureSequence=w13QaCaptureSequence')<copy.indexOf('GUIUtility.systemCopyBuffer'));
  need('FEEDBACK_AFTER_CLIPBOARD',copy.indexOf('GUIUtility.systemCopyBuffer')>=0&&copy.indexOf('GUIUtility.systemCopyBuffer')<copy.indexOf('w13QaCopiedUntil=Time.unscaledTime+2.5f'));
  need('ONE_CLIPBOARD_WRITE',(src.match(/GUIUtility\.systemCopyBuffer\s*=/g)||[]).length===1);
  need('DIAGNOSTICS_ONLY',(helper.includes('networkDiagnostics??"NETWORK DIAGNOSTICS UNAVAILABLE"'))&&!/networkNotice|technical|invite|password|token|endpoint/i.test(helper+copy));
  need('NO_GAMEPLAY_MUTATION',!/NetworkLink\.Submit\(|Simulation\.Step\(|Simulation\.State\s*=/.test(src));
  need('OVERLAY_SCROLL',ui.includes('w9DeveloperScroll=Draw.ScrollView')&&ui.includes('GUI.EndScrollView()'));
  need('F1_CONTROLS',ui.includes('new Rect(x+w-60,y+8,44,44)')&&copy.includes('new Rect(x+w-152,y+8,84,44)')&&ui.includes('Mathf.Max(80,w-188)'));
  return issues;
}
function replaceOne(src,from,to){
  assert.ok(src.includes(from),'mutation anchor absent: '+from);
  return src.replace(from,to);
}
function selfTest(src){
  const negative=[
    ['no_copy_button',s=>replaceOne(s,'w13CopyLabel,Draw.Gold,size:11','"NO BUTTON",Draw.Gold,size:11')],
    ['removed_click_gate',s=>replaceOne(s,'if(Draw.Button(new Rect(x+w-152','while(Draw.Button(new Rect(x+w-152')],
    ['no_clipboard_write',s=>replaceOne(s,'GUIUtility.systemCopyBuffer=W12QaClipboardText','var unused=W12QaClipboardText')],
    ['duplicate_clipboard_write',s=>s+'GUIUtility.systemCopyBuffer="unsafe";'],
    ['false_source_claim',s=>replaceOne(s,'SOURCE_SHA=UNVERIFIED','SOURCE_SHA=VERIFIED')],
    ['false_clock_claim',s=>replaceOne(s,'CLOCK_SYNC=UNVERIFIED','CLOCK_SYNC=VERIFIED')],
    ['false_g3_claim',s=>replaceOne(s,'G3_STATUS=NOT_ATTESTED','G3_STATUS=PASS')],
    ['leak_free_text',s=>replaceOne(s,'W12QaClipboardText(networkDebug,','W12QaClipboardText(networkNotice,')],
    ['removed_utc',s=>replaceOne(s,'capturedUtc.ToUniversalTime()','capturedUtc.ToLocalTime()')],
    ['no_sequence',s=>replaceOne(s,'CAPTURE_SEQ=','SEQ_UNKNOWN=')],
    ['no_sequence_argument',s=>replaceOne(s,'DateTime.UtcNow,w13QaCaptureSequence','DateTime.UtcNow,0')],
    ['counter_increments_outside_click',s=>replaceOne(s,'w13QaCaptureSequence=w13QaCaptureSequence==int.MaxValue?1:w13QaCaptureSequence+1;','w13QaCaptureSequence++;')],
    ['no_copy_feedback',s=>replaceOne(s,'?"COPIED":"COPY QA"','?"COPY QA":"COPY QA"')],
    ['no_feedback_timeout',s=>replaceOne(s,'w13QaCopiedUntil=Time.unscaledTime+2.5f;','w13QaCopiedUntil=float.MaxValue;')],
    ['wrong_feedback_order',s=>replaceOne(s,'w13QaCopiedUntil=Time.unscaledTime+2.5f;','GUIUtility.systemCopyBuffer="copied";')],
    ['no_scroll',s=>replaceOne(s,'GUI.EndScrollView();','')],
    ['unauthorized_submit',s=>s+'NetworkLink.Submit(command,out reason);'],
    ['duplicate_w13_helper',s=>replaceOne(s,'int w13QaCaptureSequence;','int w13QaCaptureSequenceX;')]
  ];
  const originalIssues=inspect(src);
  assert.deepEqual(originalIssues,[],'original source failed: '+originalIssues.join(','));
  for(const [name,mutate] of negative){
    const problems=inspect(mutate(src));
    assert.ok(problems.length>0,'mutation undetected: '+name);
  }
  return {passed:negative.length+1,negative:negative.length};
}
if(require.main===module){
  const source=fs.readFileSync(CSHARP,'utf8');
  if(process.argv.includes('--self-test')){
    const result=selfTest(source);
    console.log('CC001_W13_A33_F1_MUTATIONS_PASS '+result.passed+'/'+result.passed+' (source-contract, NOT Unity/2PC)');
  }else{
    const problems=inspect(source);
    if(problems.length){console.error('CC001_W13_A33_F1_SOURCE_FAIL '+problems.join(','));process.exitCode=1;}
    else console.log('CC001_W13_A33_F1_SOURCE_PASS static-only');
  }
}
module.exports={inspect,selfTest};
