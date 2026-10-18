/**
 * WEB-005 R23H-R5-R2 SOURCE ONLY crash-consistent, operator-local event copies.
 * Not a trusted PG server audit. Must be independently reconciled at G2/G4.
 * Volume /run/web005/evidence must be pre-created by an authenticated observer
 * as non-symlink dedicated per-run tmpfs/bind with appropriate ACL/retention.
 */
import { openSync, writeSync, fsyncSync, closeSync, readFileSync, lstatSync } from "node:fs";
import { randomUUID, createHash } from "node:crypto";
const DIR="/run/web005/evidence";
const valid=x=>typeof x==="string" && /^[a-z0-9_:-]{1,120}$/.test(x);
function stop(message){throw new Error("WEB005_CLEANUP_HOLD:JOURNAL_"+message)}
function checkedDir(){
 let d;try{d=lstatSync(DIR)}catch{stop("MISSING_DIR")}
 if(!d.isDirectory()||d.isSymbolicLink())stop("DIR_NOT_ISOLATED");
 return DIR;
}
export function persistSafetyEvent(event){
 if(!event||!valid(event.event)||!valid(event.slot) ||
    !/^[0-9a-f]{32}$/.test(event.run_id)|| !/^[0-9a-f]{64}$/.test(event.cluster_cert_sha256))
   stop("BAD_EVENT");
 const safe=checkedDir();
 const payload=Buffer.from(JSON.stringify({schema:"web005.a50.r23h-r5-r2.event.v1",
   timestamp_utc:new Date().toISOString(),event_id:randomUUID(),...event})+"\n","utf8");
 if(payload.length>16384)stop("EVENT_TOO_LARGE");
 const name=event.run_id+"-"+event.slot+"-"+randomUUID()+".json";
 const path=safe+"/"+name;
 let fd;
 try{
   fd=openSync(path,"wx",0o600);
   let off=0;
   while(off<payload.length){const n=writeSync(fd,payload,off,payload.length-off); if(n<=0)stop("SHORT_WRITE");off+=n;}
   fsyncSync(fd);
 }catch(error){stop("FILE_PERSIST_FAILED")}finally{if(fd!==undefined)closeSync(fd)}
 let dirfd;
 try{dirfd=openSync(safe,"r");fsyncSync(dirfd)}catch{stop("DIR_FSYNC_FAILED")}
 finally{if(dirfd!==undefined)closeSync(dirfd)}
 return Object.freeze({path,sha256:createHash("sha256").update(payload).digest("hex")});
}
export function verifyPersistedEvent(receipt,expected){
 if(!receipt||typeof receipt.path!=="string"||!receipt.path.startsWith(DIR+"/")||
    !/^[0-9a-f]{64}$/.test(receipt.sha256))stop("INVALID_RECEIPT");
 checkedDir();
 let bytes;try{const st=lstatSync(receipt.path);if(!st.isFile()||st.isSymbolicLink())stop("BAD_FILE");bytes=readFileSync(receipt.path)}
 catch{stop("EVENT_UNREADABLE")}
 if(createHash("sha256").update(bytes).digest("hex")!==receipt.sha256)stop("EVENT_TAMPERED");
 let observed;try{observed=JSON.parse(bytes.toString("utf8"))}catch{stop("EVENT_BAD_JSON")}
 if(Object.entries(expected).some(([k,v])=>observed[k]!==v))stop("EVENT_CONTENT_MISMATCH");
 return true;
}
