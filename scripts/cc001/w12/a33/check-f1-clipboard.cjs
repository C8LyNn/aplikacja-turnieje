#!/usr/bin/env node
'use strict';
// CC-001 W12 A33. Static source-contract validation, never a Unity/PC QA verdict.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
function inspect(source){
  const issues=[];
  const require=(label,condition)=>{if(!condition)issues.push(label);};
  const helperStart=source.indexOf('static string W12QaClipboardText(');
  const renderStart=source.indexOf('void RenderDeveloper()');
  const helper=helperStart>=0&&renderStart>helperStart?source.slice(helperStart,renderStart):'';
  const ui=renderStart>=0?source.slice(renderStart):'';
  require('HELPER_MISSING',!!helper);
  require('COPY_BUTTON_MISSING',ui.includes('Draw.Button(new Rect(x+w-152,y+8,84,44),"COPY QA",Draw.Gold,size:11)'));
  require('CLIPBOARD_NOT_BUTTON_GATED',/if\(Draw\.Button\(new Rect\(x\+w-152,y\+8,84,44\),"COPY QA",Draw\.Gold,size:11\)\)\s*GUIUtility\.systemCopyBuffer=W12QaClipboardText\(/.test(ui));
  require('CLIPBOARD_WRITES_NOT_SINGLE', (source.match(/GUIUtility\.systemCopyBuffer\s*=/g)||[]).length===1);
  require('UTC_MISSING',helper.includes('capturedUtc.ToUniversalTime().ToString("O")'));
  for(const name of ['CC001_W12_F1_QA_CAPTURE','SOURCE_SHA=UNVERIFIED','CLOCK_SYNC=UNVERIFIED','G3_STATUS=NOT_ATTESTED'])
    require('DECLARATION_'+name,helper.includes(name));
  for(const name of ['TURN=','REVISION=','FRAME=','ACTION_SERIAL='])require('STATE_FIELD_'+name,helper.includes(name));
  require('NETWORK_DIAGNOSTICS_ABSENT',helper.includes('networkDiagnostics??"NETWORK DIAGNOSTICS UNAVAILABLE"'));
  require('NETWORK_DEBUG_MISSING',/W12QaClipboardText\(networkDebug,s\.turnNumber,s\.revision,\s*s\.frame,s\.actionSerial,DateTime\.UtcNow\)/.test(ui));
  require('POTENTIAL_SECRET_LEAK',!/networkNotice|technical|invite|password|token|endpoint/i.test(helper));
  require('SCROLL_REMOVED',ui.includes('w9DeveloperScroll=Draw.ScrollView')&&ui.includes('GUI.EndScrollView()'));
  require('HEAD_BUTTON_OVERLAP',ui.includes('new Rect(x+w-60,y+8,44,44)')&&ui.includes('new Rect(x+w-152,y+8,84,44)'));
  require('TITLE_SPACE_MISSING',ui.includes('Mathf.Max(80,w-188)'));
  require('SIMULATION_NETWORK_MUTATION',!/NetworkLink\.Submit\(|Simulation\.Step\(|Simulation\.State\s*=/.test(source));
  return issues;
}
if(require.main===module){
  if(process.argv.includes('--self-test')){
    const fixture=\`static string W12QaClipboardText(string networkDiagnostics,int turn,int revision,int frame,int actionSerial,DateTime capturedUtc){return "CC001_W12_F1_QA_CAPTURE"+"SOURCE_SHA=UNVERIFIED"+"CLOCK_SYNC=UNVERIFIED"+"G3_STATUS=NOT_ATTESTED"+"TURN="+turn+"REVISION="+revision+"FRAME="+frame+"ACTION_SERIAL="+actionSerial+capturedUtc.ToUniversalTime().ToString("O")+(networkDiagnostics??"NETWORK DIAGNOSTICS UNAVAILABLE");}void RenderDeveloper(){Draw.Text(new Rect(1,2,Mathf.Max(80,w-188),26),"F1");if(Draw.Button(new Rect(x+w-60,y+8,44,44),"X")){} if(Draw.Button(new Rect(x+w-152,y+8,84,44),"COPY QA",Draw.Gold,size:11))GUIUtility.systemCopyBuffer=W12QaClipboardText(networkDebug,s.turnNumber,s.revision,s.frame,s.actionSerial,DateTime.UtcNow);w9DeveloperScroll=Draw.ScrollView(content,w9DeveloperScroll,view);GUI.EndScrollView();}\`;
    const mutations=[
      ['positive',fixture,true],
      ['removed button',fixture.replace('"COPY QA"','"COPY"'),false],
      ['no clipboard gate',fixture.replace('if(Draw.Button(new Rect(x+w-152','while(Draw.Button(new Rect(x+w-152'),false],
      ['duplicate copy',fixture+'GUIUtility.systemCopyBuffer="x";',false],
      ['no utc',fixture.replace('ToUniversalTime()','ToLocalTime()'),false],
      ['source sha false claim',fixture.replace('SOURCE_SHA=UNVERIFIED','SOURCE_SHA=CONFIRMED'),false],
      ['clock sync false claim',fixture.replace('CLOCK_SYNC=UNVERIFIED','CLOCK_SYNC=PASS'),false],
      ['G3 false claim',fixture.replace('G3_STATUS=NOT_ATTESTED','G3_STATUS=PASS'),false],
      ['missing action serial',fixture.replace('"ACTION_SERIAL="','"SERIAL="'),false],
      ['leak notice',fixture.replace('(networkDiagnostics??','networkNotice+(networkDiagnostics??'),false],
      ['no scroll',fixture.replace('GUI.EndScrollView();',''),false],
      ['missing source helper',fixture.replace('W12QaClipboardText(string','W12Clipboard(string'),false],
      ['unauthorized submit',fixture+'NetworkLink.Submit(command,out reason);',false]
    ];
    let passed=0;for(const [name,input,expected] of mutations){const errs=inspect(input);const actual=errs.length===0;assert.equal(actual,expected,\`\${name}: \${errs.join(',')}\`);passed++;}
    console.log(\`W12_A33_F1_STATIC_SELFTEST PASS \${passed}/\${mutations.length} (synthetic fixtures only)\`);
  }else{
    const file=process.argv[2];if(!file){console.error('Usage: node check-f1-clipboard.cjs <DetailsView.cs> OR --self-test');process.exit(64);}
    const result=inspect(fs.readFileSync(path.resolve(file),'utf8'));
    if(result.length){console.error('W12_A33_F1_SOURCE_FAIL '+result.join(','));process.exit(1);}
    console.log('W12_A33_F1_SOURCE_PASS (static-only, not Windows/Unity/2PC)');
  }
}
module.exports={inspect};
