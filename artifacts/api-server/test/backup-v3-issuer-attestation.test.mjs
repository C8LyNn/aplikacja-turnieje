import test from "node:test";
import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import {
  canonicalPayloadBytes, canonicalSigningBytes, evaluateRawIssuerAttestation,
  assessSourceOperation,
} from "../src/application/backups/backup-v3-issuer-attestation.mjs";

// IN-MEMORY ephemeral test-only keys. Never generate or install production keys.
const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const other = generateKeyPairSync("ed25519");
const trusted = new Map([["issuer-a", new Map([["key-a", {publicKey, status:"active"}]])]]);
const backup = () => ({
  schemaVersion: 3, resultModelVersion:"series_v1", rankingPolicy:"match_record_v1",
  tournament:{name:"synthetic"}, players:[], matches:[], resultHistory:[], actionLog:[],
  strictPolicy:{profile:"web005.backup-v3.strict.v1",version:1,
    matchStateRevisions:[],actionOrder:[],completionActions:[]},
});
function signed(b=backup(), key=privateKey) {
  const env = {
    envelopeVersion:1,profile:"web005.backup-v3.strict.v1",
    issuerId:"issuer-a",keyId:"key-a",algorithm:"Ed25519",
    issuedAt:"2026-10-21T09:00:00.000Z",payloadDigestAlgorithm:"SHA-256",
    payloadDigest:createHash("sha256").update(canonicalPayloadBytes(b)).digest("hex"),
    backup:b,
  };
  return JSON.stringify({...env,signature:sign(null,canonicalSigningBytes(env),key).toString("base64url")});
}
const verify=(raw, registry=trusted)=>evaluateRawIssuerAttestation({rawJson:raw,trustedIssuers:registry});
function denied(r,code){
  assert.equal(r.code,code);assert.equal(r.authenticated,false);
  assert.equal(r.importAuthorized,false);
  assert.deepEqual(r.capabilities,{importAuthorized:false,historicalUndo:false,
    historicalRevert:false,historicalCasReplay:false});
}
test("W6H-01 real Ed25519 valid signature attests SOURCE ONLY, not import",()=>{
  const r=verify(signed());assert.equal(r.code,"SOURCE_ATTESTED_ONLY");
  assert.equal(r.authenticated,true);assert.equal(r.importAuthorized,false);
  assert.ok(Object.isFrozen(r));assert.equal(assessSourceOperation(r,"import").permitted,false);
});
test("W6H-02 empty server registry fails closed",()=>denied(verify(signed(),new Map()),"ISSUER_NOT_TRUSTED"));
test("W6H-03 altered unknown issuer is rejected",()=>{
  const x=JSON.parse(signed());x.issuerId="attacker";
  denied(verify(JSON.stringify(x)),"ISSUER_NOT_TRUSTED");
});
test("W6H-04 wrong signed key cannot authenticate",()=>denied(verify(signed(backup(),other.privateKey)),"SIGNATURE_INVALID"));
test("W6H-05 revoked key cannot authenticate",()=>{
  const r=new Map([["issuer-a",new Map([["key-a",{publicKey,status:"revoked"}]])]]);
  denied(verify(signed(),r),"KEY_NOT_ACTIVE");
});
test("W6H-06 fake trusted flag or client public key is rejected",()=>{
  const x=JSON.parse(signed());x.trusted=true;x.publicKey=other.publicKey.export({format:"pem",type:"spki"});
  denied(verify(JSON.stringify(x)),"ENVELOPE_REJECTED");
});
test("W6H-07 invalid algorithm/profile/version rejected",()=>{
  for(const [k,v] of [["algorithm","HS256"],["profile","legacy"],["envelopeVersion",2]]){
    const x=JSON.parse(signed());x[k]=v;denied(verify(JSON.stringify(x)),"ENVELOPE_REJECTED");
  }
});
test("W6H-08 payload tamper invalidates digest",()=>{
  const x=JSON.parse(signed());x.backup.tournament.name="MODIFIED";
  denied(verify(JSON.stringify(x)),"PAYLOAD_DIGEST_MISMATCH");
});
test("W6H-09 strict marker stripping never promotes to legacy",()=>{
  const x=JSON.parse(signed());delete x.backup.strictPolicy;
  denied(verify(JSON.stringify(x)),"PROFILE_REJECTED");
});
test("W6H-10 unsigned V2/V3 are not authenticated",()=>{
  for(const schemaVersion of [2,3]){
    denied(verify(JSON.stringify({schemaVersion,players:[],matches:[]})),"ENVELOPE_REJECTED");
  }
});
test("W6H-11 duplicate JSON key in envelope and nested backup rejected before parse",()=>{
  const raw=signed();
  denied(verify(raw.replace('"envelopeVersion":1','"envelopeVersion":1,"envelopeVersion":1')),"RAW_JSON_REJECTED");
  denied(verify(raw.replace('"schemaVersion":3','"schemaVersion":3,"schemaVersion":3')),"RAW_JSON_REJECTED");
});
test("W6H-12 forged digest and unrelated signature fail",()=>{
  const x=JSON.parse(signed());x.payloadDigest="0".repeat(64);
  denied(verify(JSON.stringify(x)),"PAYLOAD_DIGEST_MISMATCH");
  const y=JSON.parse(signed());y.signature=sign(null,Buffer.from("unrelated"),privateKey).toString("base64url");
  denied(verify(JSON.stringify(y)),"SIGNATURE_INVALID");
});
test("W6H-13 operations never grant writes/Undo/CAS, even on valid source",()=>{
  const result=verify(signed());
  for(const op of ["inspect","restore","import","undo","revert","cas","delete","unknown"]){
    const decision=assessSourceOperation(result,op,{callerAuthorized:true,semanticValidated:true,actionLocalValidated:true});
    assert.equal(decision.permitted,false);assert.equal(decision.requiresFurtherAuthorization,true);
  }
});
test("W6H-14 malformed trusted key fails safely",()=>{
  const reg=new Map([["issuer-a",new Map([["key-a",{publicKey:"bogus",status:"active"}]])]]);
  denied(verify(signed(),reg),"KEY_INVALID");
});
test("W6H-15 overlimit input / excessive depth rejected before crypto",()=>{
  denied(verify(" ".repeat(1_048_577)),"RAW_JSON_REJECTED");
  const x=JSON.parse(signed());let p=x.backup;
  for(let i=0;i<40;i++){p.deep={};p=p.deep}
  denied(verify(JSON.stringify(x)),"RAW_JSON_REJECTED");
});
test("W6H-16 unsupported strict privileges are denied, not trusted",()=>{
  const x=JSON.parse(signed());x.backup.strictPolicy.capabilities=["historicalUndo"];
  denied(verify(JSON.stringify(x)),"PROFILE_REJECTED");
});
