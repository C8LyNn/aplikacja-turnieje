'use strict';
// A31 offline RC1 Player.log analyzer. This is NOT a G3 PASS test.
function number(line,key) {
  var token=String(line).split(/\s+/).find(function(x){return x.startsWith(key+'=');});
  if (!token) return null;
  var n=Number(token.slice(key.length+1));
  return Number.isFinite(n) ? n : null;
}
function parse(text) {
  var x={hostReady:0,peerConnected:0,seatReleased:0,clientFirstSnapshot:0,
    accept:[],reject:0,clientAccept:0,clientLaunch:0,failures:0,tx:[],rx:[],w10Host:[],w10Client:[]};
  for (var line of String(text||'').split(/\r?\n/)) {
    if (line.includes('CC_NET_HOST_READY')) ++x.hostReady;
    if (line.split(/\s+/).includes('CC_NET_PEER_CONNECTED')&&number(line,'owner')===1) ++x.peerConnected;
    if (line.includes('CC_NET_SEAT_RELEASED')) ++x.seatReleased;
    if (line.includes('CC_NET_STATE_APPLIED')) ++x.clientFirstSnapshot;
    if (line.split(/\s+/).includes('CC_NET_INTENT_ACCEPT')&&number(line,'owner')===1)
      x.accept.push({seq:number(line,'seq'),action:number(line,'action')});
    if (line.includes('CC_NET_INTENT_REJECT')) ++x.reject;
    if (line.includes('P2 · host accepted intent')) ++x.clientAccept;
    if (line.split(/\s+/).includes('CORE_CLASH_LAUNCH')&&number(line,'owner')===1) ++x.clientLaunch;
    if (line.includes('CC_LAN_CONNECTION_FAILED')||line.includes('CC_NET_SNAPSHOT_ERROR')) ++x.failures;
    if (line.includes('CC_NET_TRACE_TX ')||line.includes('CC_NET_TRACE_RX ')) {
      var e={rev:number(line,'rev'),serial:number(line,'serial'),
        tms:number(line,'tms'),turn:number(line,'turn')};
      (line.includes('CC_NET_TRACE_TX ')?x.tx:x.rx).push(e);
    }
    var tokens=line.trim().split(/\s+/);
    if(tokens.includes('CC_W10_NET_HOST'))x.w10Host.push(sampledRow(line,true));
    if(tokens.includes('CC_W10_NET_CLIENT'))x.w10Client.push(sampledRow(line,false));
  }
  return x;
}
// W10 A41 emits approximately one sampled diagnostic line per second. It is
// not a per-snapshot stream, and periodMs is the scheduler target, not an
// observed network inter-arrival or end-to-end latency measurement.
function positiveOrZero(line,key) {
  var token=String(line).split(/\s+/).find(function(t){return t.startsWith(key+'=');});
  if(!token) return null;
  var v=token.slice(key.length+1);
  return /^\d+$/.test(v)&&Number.isSafeInteger(Number(v))?Number(v):null;
}
function sampledRow(line,host) {
  return {
    revision:positiveOrZero(line,'revision'),
    action:positiveOrZero(line,'action'),
    turn:positiveOrZero(line,'turn'),
    balls:positiveOrZero(line,'balls'),
    phase:(String(line).split(/\s+/).find(function(t){return t.startsWith('phase=');})||'').slice(6)||null,
    ...(host?{
      packedBytes:positiveOrZero(line,'packedBytes'),
      chunks:positiveOrZero(line,'chunks'),
      scheduledPeriodMs:positiveOrZero(line,'periodMs')
    }:{
      received:positiveOrZero(line,'received'),
      skippedRevisions:positiveOrZero(line,'skippedRevisions')
    })
  };
}
function strictlyIncreasing(series) {
  if(series.length<2) return 'INSUFFICIENT';
  if(series.some(function(x){return x===null;})) return 'INSUFFICIENT';
  return series.every(function(x,i){return !i||x>series[i-1];})?'INCREASING':'NON_INCREASING';
}
function nonDecreasing(series) {
  if(series.length<2) return 'INSUFFICIENT';
  if(series.some(function(x){return x===null;})) return 'INSUFFICIENT';
  return series.every(function(x,i){return !i||x>=series[i-1];})?'NON_DECREASING':'REGRESSION';
}
function summarizeW10(rows,host) {
  var revisions=rows.map(function(x){return x.revision;});
  var actions=rows.map(function(x){return x.action;});
  var summary={
    count:rows.length,
    revisionOrder:strictlyIncreasing(revisions),
    actionOrder:nonDecreasing(actions),
    firstRevision:revisions.length?revisions[0]:null,
    lastRevision:revisions.length?revisions[revisions.length-1]:null,
    lastAction:actions.length?actions[actions.length-1]:null,
    missingOrInvalidFields:rows.some(function(x){
      return x.revision===null||x.action===null||x.turn===null||x.balls===null||
        x.phase===null||(host?x.scheduledPeriodMs===null||x.packedBytes===null||x.chunks===null:
        x.received===null||x.skippedRevisions===null);
    })
  };
  if(host){
    var periods=rows.map(function(x){return x.scheduledPeriodMs;}).filter(function(x){return x!==null;});
    summary.scheduledPeriodMsValues=[...new Set(periods)].sort(function(a,b){return a-b;});
    summary.scheduledCadenceOnly=true;
  }else{
    summary.receivedOrder=strictlyIncreasing(rows.map(function(x){return x.received;}));
    summary.skippedRevisionsOrder=nonDecreasing(rows.map(function(x){return x.skippedRevisions;}));
    summary.lastSkippedRevisions=rows.length?rows[rows.length-1].skippedRevisions:null;
  }
  return summary;
}
function monotonic(a) {
  if(a.length<2) return 'INSUFFICIENT';
  for(var i=1;i<a.length;i++) {
    if(a[i].rev===null||a[i-1].rev===null) return 'INSUFFICIENT';
    if(a[i].rev<=a[i-1].rev) return 'NON_MONOTONIC';
  }
  return 'MONOTONIC';
}
function intervals(a) {
  if(a.length<2||a.some(function(e){return e.tms===null;})) return null;
  var d=[];
  for(var i=1;i<a.length;i++) d.push(a[i].tms-a[i-1].tms);
  if(d.some(function(v){return v<0;})) return null;
  return {count:d.length,minMs:Math.min.apply(Math,d),maxMs:Math.max.apply(Math,d),
    meanMs:d.reduce(function(x,y){return x+y;},0)/d.length};
}
function analyze(hostText,clientText) {
  var h=parse(hostText),c=parse(clientText),seen=new Set(),dup=[],previous=null,badAction=false;
  for(var a of h.accept) {
    if(a.seq!==null){if(seen.has(a.seq))dup.push(a.seq);seen.add(a.seq);}
    if(a.action!==null){if(previous!==null&&a.action<=previous)badAction=true;previous=a.action;}
  }
  var blockers=[];
  if(!String(hostText||'').trim()) blockers.push('MISSING_PC1_LOG');
  if(!String(clientText||'').trim()) blockers.push('MISSING_PC2_LOG');
  if(!h.peerConnected) blockers.push('HOST_P2_BIND_NOT_LOGGED');
  if(!h.accept.length) blockers.push('HOST_P2_ACCEPT_NOT_LOGGED');
  if(!c.clientFirstSnapshot) blockers.push('CLIENT_FIRST_SNAPSHOT_NOT_LOGGED');
  if(h.tx.length<2||c.rx.length<2) blockers.push('NO_PER_SNAPSHOT_TIMING_MARKERS_IN_RC1');
  if(h.w10Host.length<2||c.w10Client.length<2)blockers.push('W10_PAIRED_SAMPLED_TRACE_INSUFFICIENT');
  // Throttled 1Hz rows can show counters but cannot certify each intervening
  // packet, action time alignment, positional parity or rendering smoothness.
  blockers.push('W10_TRACE_IS_SAMPLED_NOT_PER_SNAPSHOT');
  blockers.push('NO_INDEPENDENT_FINAL_STATE_PARITY');
  return {
    identity:'CC-001/A31/R17-W11',gate:'INSUFFICIENT_FOR_G3_PASS',
    note:'RC1 CC_NET_STATE_APPLIED is logged for the FIRST snapshot only. tms is local per-device; never infer one-way network latency by subtracting unsynchronized clocks.',
    host:{peerConnected:h.peerConnected,seatReleased:h.seatReleased,
      acceptedP2:h.accept,rejectedLines:h.reject,txCount:h.tx.length,txIntervals:intervals(h.tx)},
    client:{firstSnapshotMarkers:c.clientFirstSnapshot,acceptedResults:c.clientAccept,
      launchLines:c.clientLaunch,failures:c.failures,rxCount:c.rx.length,
      rxRevisionOrder:monotonic(c.rx),rxIntervals:intervals(c.rx)},
    w10:{host:summarizeW10(h.w10Host,true),client:summarizeW10(c.w10Client,false),
      actionParity:'UNALIGNED_NOT_ASSESSED',stateParity:'NOT_ASSESSED'},
    anomalies:{duplicateAcceptedP2Sequences:dup,nonIncreasingAcceptedActionSerial:badAction,
      w10HostRevisionRegression:summarizeW10(h.w10Host,true).revisionOrder==='NON_INCREASING',
      w10ClientRevisionRegression:summarizeW10(c.w10Client,false).revisionOrder==='NON_INCREASING',
      w10ClientSkippedCounterRegression:summarizeW10(c.w10Client,false).skippedRevisionsOrder==='REGRESSION'},
    blockers:blockers
  };
}
module.exports={parse:parse,analyze:analyze,monotonic:monotonic,intervals:intervals,summarizeW10:summarizeW10};
if(typeof require==='function' && require.main===module) {
  var fs=require('fs'),crypto=require('crypto'),args=process.argv.slice(2);
  var hi=args.indexOf('--host'),ci=args.indexOf('--client'),oi=args.indexOf('--out');
  if(hi<0||ci<0||!args[hi+1]||!args[ci+1]){
    process.stderr.write('Usage: node analyze-network-logs.cjs --host PC1_Player.log --client PC2_Player.log [--out report.json]\n');
    process.exitCode=2;
  } else {
    try {
      var h=fs.readFileSync(args[hi+1]),c=fs.readFileSync(args[ci+1]);
      var report=analyze(h.toString('utf8'),c.toString('utf8'));
      report.inputSha256={host:crypto.createHash('sha256').update(h).digest('hex'),
        client:crypto.createHash('sha256').update(c).digest('hex')};
      var output=JSON.stringify(report,null,2)+'\n';
      if(oi>=0&&args[oi+1])fs.writeFileSync(args[oi+1],output);
      else process.stdout.write(output);
      process.exitCode=(report.anomalies.duplicateAcceptedP2Sequences.length||
        report.anomalies.nonIncreasingAcceptedActionSerial||
        report.client.rxRevisionOrder==='NON_MONOTONIC'||report.anomalies.w10HostRevisionRegression||
        report.anomalies.w10ClientRevisionRegression||report.anomalies.w10ClientSkippedCounterRegression)?1:0;
      // Exit 0 means the analyzer ran; it DOES NOT mean G3 PASS.
    } catch(e){process.stderr.write('ANALYZER_ERROR '+e.message+'\n');process.exitCode=3;}
  }
}
