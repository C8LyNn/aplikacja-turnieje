'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const mime={'.html':['text/html'],'.js':['application/javascript','text/javascript'],'.wasm':['application/wasm'],'.data':['application/octet-stream'],'.json':['application/json'],'.png':['image/png'],'.svg':['image/svg+xml'],'.ico':['image/x-icon']};
function createBuildManifest(directory){
 const walk=folder=>fs.readdirSync(folder,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(folder,e.name)):[path.join(folder,e.name)]);
 return {createdAt:new Date().toISOString(),version:149,scope:'Exact static WebGL build files; does not prove physical devices or cross-NAT gameplay.',files:walk(directory).sort().map(file=>({path:path.relative(directory,file).replaceAll('\\','/'),bytes:fs.statSync(file).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}))};
}
async function verifyHostedBuild({url,manifest,allowLocalHttp=false}){
 const base=new URL(url);
 if(base.username||base.password||base.search||base.hash)throw Error('Use a base URL without credentials, query or fragment.');
 const loopback=['localhost','127.0.0.1','[::1]'].includes(base.hostname);
 if(base.protocol!=='https:'&&!(allowLocalHttp&&loopback&&base.protocol==='http:'))throw Error('A published game requires HTTPS. HTTP is allowed only for explicit loopback tests.');
 if(base.pathname.endsWith('/index.html'))base.pathname=base.pathname.slice(0,-10);
 if(!base.pathname.endsWith('/'))base.pathname+='/';
 if(!Array.isArray(manifest?.files)||manifest.files.length===0)throw Error('Manifest has no build files.');
 for(const file of manifest.files)if(typeof file.path!=='string'||file.path.startsWith('/')||file.path.includes('\\')||file.path.split('/').some(p=>!p||p==='.'||p==='..')||!Number.isSafeInteger(file.bytes)||file.bytes<0||!/^[a-f0-9]{64}$/i.test(file.sha256))throw Error('Invalid manifest entry.');
 const report={testedAt:new Date().toISOString(),url:base.href,pass:false,files:[],errors:[],warnings:[]};
 for(const file of manifest.files){
  const item={path:file.path,errors:[]};report.files.push(item);
  try{
   // Invitations use the folder URL. A direct index.html success must not hide a broken directory route.
   item.requestPath=file.path==='index.html'?'./':file.path;
   const response=await fetch(new URL(item.requestPath.split('/').map(encodeURIComponent).join('/'),base),{redirect:'manual',signal:AbortSignal.timeout(45000),headers:{'Cache-Control':'no-cache'}});
   item.status=response.status;item.contentType=response.headers.get('content-type')||'';item.cacheControl=response.headers.get('cache-control')||'';
   if(response.status!==200){item.errors.push('Expected HTTP 200, received '+response.status);await response.body?.cancel();continue;}
   const expected=mime[path.extname(file.path).toLowerCase()]||['application/octet-stream'];
   if(!expected.includes(item.contentType.split(';')[0].trim().toLowerCase()))item.errors.push('Expected MIME '+expected.join(' or ')+', received '+item.contentType);
   const digest=crypto.createHash('sha256');let received=0;
   for await(const chunk of response.body){received+=chunk.length;digest.update(chunk);if(received>file.bytes+65536){item.errors.push('Response exceeds expected build size');break;}}
   item.bytes=received;item.sha256=digest.digest('hex');
   if(received!==file.bytes)item.errors.push('Byte count differs from the tested build');
   if(item.sha256!==file.sha256.toLowerCase())item.errors.push('SHA256 differs from the tested build');
   if(/immutable|(?:s-maxage|max-age)\s*=\s*[1-9]/i.test(item.cacheControl))report.warnings.push(file.path+': long cache lifetime on a filename reused by Unity builds; use a versioned deployment folder or revalidation.');
  }catch(e){item.errors.push(e.message);}
 }
 report.errors=report.files.flatMap(f=>f.errors.map(error=>f.path+': '+error));report.pass=report.errors.length===0;return report;
}
module.exports={createBuildManifest,verifyHostedBuild};
