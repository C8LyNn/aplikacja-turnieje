/**
 * WEB-005 W6H / A90 — isolated Backup V3 issuer proof (SOURCE ONLY).
 *
 * SECURITY BOUNDARY: no importer, exporter, DB, HTTP route, key installation,
 * token issuance or permission grant is called here. The trusted Map must be
 * created by the future SERVER, never from untrusted request JSON.
 * Verification of source bytes != authorization of actor or clone/Undo/CAS.
 *
 * The Ed25519 canonical-envelope wire contract is a conditional prototype:
 * A00/A20/A30 must explicitly approve serialization, issuer registry, key
 * lifecycle, revocation and clock before any product wiring.
 */
import { createHash, createPublicKey, verify as verifySignature, KeyObject } from "node:crypto";

export const SIGNATURE_DOMAIN = "WEB005:BACKUP:ISSUER:ED25519:V1\u0000";
export const ENVELOPE_PROFILE = "web005.backup-v3.strict.v1";
const MAX_CHARS=1_048_576, MAX_DEPTH=32, MAX_NODES=25_000, MAX_OBJECT_KEYS=128, MAX_ARRAY=5_000;
const ALLOWED=new Set(["envelopeVersion","profile","issuerId","keyId","algorithm",
  "issuedAt","payloadDigestAlgorithm","payloadDigest","backup","signature"]);
const DISABLED=Object.freeze({importAuthorized:false,historicalUndo:false,
  historicalRevert:false,historicalCasReplay:false});
const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const utf8=s=>Buffer.from(s,"utf8");
const format=key=>typeof key==="string"&&key.length>0&&key.length<=128&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(key);
const hex=s=>typeof s==="string"&&/^[0-9a-f]{64}$/.test(s);
function outcome(code,authenticated=false){
  return Object.freeze({code,authenticated,importAuthorized:false,capabilities:DISABLED,
    requiresDomainValidation:true,requiresCallerAuthorization:true,
    requiresOwnerTrustApproval:true});
}
/**
 * Duplicate-key scanner operates on the RAW JSON, before JSON.parse erases
 * conflicting member names. JSON.parse itself validates grammar/literals.
 */
function rejectDuplicateKeys(raw){
  let i=0;
  const space=()=>{while(i<raw.length&&/[\u0020\t\r\n]/.test(raw[i]))i++};
  function quoted(){
    if(raw[i]!=='"')throw Error("JSON_QUOTE");
    const start=i++;
    while(i<raw.length){
      if(raw[i]==="\\"){i+=2;continue}
      if(raw[i++]==='"')return JSON.parse(raw.slice(start,i));
    }
    throw Error("JSON_STRING");
  }
  function value(depth){
    if(depth>MAX_DEPTH)throw Error("DEPTH");
    space();
    if(raw[i]==='"'){quoted();return}
    if(raw[i]==="{"){
      i++;space();const keys=new Set();
      if(raw[i]==="}"){i++;return}
      for(;;){
        const k=quoted();
        if(keys.has(k)||keys.size>=MAX_OBJECT_KEYS)throw Error("DUPLICATE_OR_KEYS");
        keys.add(k);space();
        if(raw[i++]!==":")throw Error("COLON");
        value(depth+1);space();
        const next=raw[i++];
        if(next==="}")return;
        if(next!==",")throw Error("COMMA");space();
      }
    }
    if(raw[i]==="["){
      i++;space();if(raw[i]==="]"){i++;return}
      let count=0;
      for(;;){
        if(++count>MAX_ARRAY)throw Error("ARRAY");
        value(depth+1);space();
        const next=raw[i++];
        if(next==="]")return;
        if(next!==",")throw Error("COMMA");space();
      }
    }
    const start=i;
    while(i<raw.length&&!/[\u0020\t\r\n,\]}\[:]/.test(raw[i]))i++;
    if(start===i)throw Error("PRIMITIVE");
  }
  value(0);space();if(i!==raw.length)throw Error("TRAILING");
}
function assertScalarString(s){
  // Canonical bytes reject invalid Unicode surrogate sequences (JCS rule).
  for(let i=0;i<s.length;i++){
    const c=s.charCodeAt(i);
    if(c>=0xd800&&c<=0xdbff){
      if(i+1>=s.length||s.charCodeAt(++i)<0xdc00||s.charCodeAt(i)>0xdfff)
        throw Error("INVALID_UNICODE");
    }else if(c>=0xdc00&&c<=0xdfff)throw Error("INVALID_UNICODE");
  }
}
function canonical(value){
  let nodes=0;
  const seen=new WeakSet();
  function write(v,depth){
    if(++nodes>MAX_NODES||depth>MAX_DEPTH)throw Error("INPUT_LIMIT");
    if(v===null)return "null";
    if(typeof v==="string"){assertScalarString(v);return JSON.stringify(v)}
    if(typeof v==="number"){
      if(!Number.isFinite(v)||(Number.isInteger(v)&&!Number.isSafeInteger(v)))
        throw Error("NUMBER_UNSAFE");
      return JSON.stringify(v);
    }
    if(typeof v==="boolean")return v?"true":"false";
    if(typeof v!=="object")throw Error("NON_JSON_TYPE");
    if(seen.has(v))throw Error("CYCLE");
    seen.add(v);
    let result;
    if(Array.isArray(v)){
      if(v.length>MAX_ARRAY)throw Error("ARRAY_LIMIT");
      result="["+v.map(item=>write(item,depth+1)).join(",")+"]";
    }else{
      if(Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null)
        throw Error("NON_JSON_OBJECT");
      const keys=Object.keys(v);
      if(keys.length>MAX_OBJECT_KEYS)throw Error("OBJECT_KEYS");
      for(const k of keys){
        assertScalarString(k);
        if(k==="__proto__"||k==="prototype"||k==="constructor")
          throw Error("POLLUTION_KEY");
      }
      // UTF-16 lexicographic key order, ECMAScript JSON string/number encoding.
      keys.sort();
      result="{"+keys.map(k=>{
        const desc=Object.getOwnPropertyDescriptor(v,k);
        if(!desc||!own(desc,"value"))throw Error("ACCESSOR");
        return JSON.stringify(k)+":"+write(desc.value,depth+1);
      }).join(",")+"}";
    }
    seen.delete(v);return result;
  }
  return write(value,0);
}
export function canonicalPayloadBytes(backup){
  const b=utf8(canonical(backup));if(b.length>MAX_CHARS)throw Error("PAYLOAD_LIMIT");
  return b;
}
export function canonicalSigningBytes(envelopeWithoutSignature){
  if(!plain(envelopeWithoutSignature)||own(envelopeWithoutSignature,"signature"))
    throw Error("SIGNING_INPUT_INVALID");
  const bytes=utf8(SIGNATURE_DOMAIN+canonical(envelopeWithoutSignature));
  if(bytes.length>MAX_CHARS)throw Error("SIGNING_LIMIT");
  return bytes;
}
function checkEnvelope(x){
  if(!plain(x)||Object.keys(x).length!==ALLOWED.size||!Object.keys(x).every(k=>ALLOWED.has(k)))
    return false;
  if(x.envelopeVersion!==1||x.profile!==ENVELOPE_PROFILE||x.algorithm!=="Ed25519"||
      x.payloadDigestAlgorithm!=="SHA-256"||!format(x.issuerId)||!format(x.keyId)||
      typeof x.issuedAt!=="string"||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x.issuedAt)||
      !Number.isFinite(Date.parse(x.issuedAt))||!hex(x.payloadDigest)||
      typeof x.signature!=="string"||!/^[A-Za-z0-9_-]{86}$/.test(x.signature))
    return false;
  return true;
}
function checkStrictBackup(b){
  if(!plain(b)||b.schemaVersion!==3||!plain(b.strictPolicy)||
      b.strictPolicy.profile!==ENVELOPE_PROFILE||b.strictPolicy.version!==1)
    return false;
  const s=b.strictPolicy;
  if(!Object.keys(s).every(k=>["profile","version","matchStateRevisions","actionOrder","completionActions"].includes(k)))
    return false;
  return Array.isArray(s.matchStateRevisions)&&Array.isArray(s.actionOrder)&&
    Array.isArray(s.completionActions);
}
/**
 * Input is raw text of the whole envelope, not req.body post-Zod.
 * Positive proof checks issuer-controlled Ed25519 keys, but returns NO
 * importer authorization, historical action rights, or caller credentials.
 */
export function evaluateRawIssuerAttestation({rawJson,trustedIssuers}={}){
  if(typeof rawJson!=="string"||rawJson.length>MAX_CHARS||rawJson.length===0)
    return outcome("RAW_JSON_REJECTED");
  let input;
  try{
    rejectDuplicateKeys(rawJson);
    input=JSON.parse(rawJson);
    if(utf8(rawJson).length>MAX_CHARS)throw Error("RAW_BYTES_LIMIT");
    canonicalPayloadBytes(input);
  }catch{return outcome("RAW_JSON_REJECTED")}
  if(!checkEnvelope(input))return outcome("ENVELOPE_REJECTED");
  if(!checkStrictBackup(input.backup))return outcome("PROFILE_REJECTED");
  let digest, message;
  try{
    digest=createHash("sha256").update(canonicalPayloadBytes(input.backup)).digest("hex");
    if(digest!==input.payloadDigest)return outcome("PAYLOAD_DIGEST_MISMATCH");
    const {signature,...protectedEnvelope}=input;
    message=canonicalSigningBytes(protectedEnvelope);
  }catch{return outcome("RAW_JSON_REJECTED")}
  // Never use public keys, trusted flags, or issuers provided inside the file.
  if(!(trustedIssuers instanceof Map))return outcome("ISSUER_NOT_TRUSTED");
  const entry=trustedIssuers.get(input.issuerId);
  if(!(entry instanceof Map))return outcome("ISSUER_NOT_TRUSTED");
  const issuerKey=entry.get(input.keyId);
  if(!issuerKey)return outcome("ISSUER_NOT_TRUSTED");
  if(issuerKey.status!=="active")return outcome("KEY_NOT_ACTIVE");
  let key;
  try{
    key=issuerKey.publicKey instanceof KeyObject
      ? issuerKey.publicKey : createPublicKey(issuerKey.publicKey);
    if(key.type!=="public"||key.asymmetricKeyType!=="ed25519")
      throw Error("INVALID_ALGORITHM");
  }catch{return outcome("KEY_INVALID")}
  let isValid=false;
  try{
    const signature=Buffer.from(input.signature,"base64url");
    if(signature.length!==64||signature.toString("base64url")!==input.signature)
      return outcome("SIGNATURE_INVALID");
    isValid=verifySignature(null,message,key,signature);
  }catch{return outcome("SIGNATURE_INVALID")}
  return isValid?outcome("SOURCE_ATTESTED_ONLY",true):outcome("SIGNATURE_INVALID");
}
/**
 * Source proof is NOT actor auth or authorization to run dangerous actions.
 * Even trusted test callback booleans never constitute a production right.
 * SWARM-006 must wire independently approved role+domain+action-local gates.
 */
export function assessSourceOperation(attestation,operation,_untrustedFlags){
  return Object.freeze({operation:typeof operation==="string"?operation:"UNKNOWN",
    sourceAuthenticated:attestation?.code==="SOURCE_ATTESTED_ONLY"&&attestation.authenticated===true,
    permitted:false,requiresFurtherAuthorization:true,
    historicalUndo:false,historicalRevert:false,historicalCasReplay:false});
}
