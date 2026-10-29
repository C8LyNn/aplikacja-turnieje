// Additional execution guard. No DB or external network; temporary test HTTP only.
const net=require('node:net');
const tls=require('node:tls');
const dns=require('node:dns');
const {syncBuiltinESMExports}=require('node:module');
const deny=()=>{throw Object.assign(new Error('SWARM006: external network/database access blocked'),{code:'SWARM006_NETWORK_BLOCKED'});};
const loopback=h=>['127.0.0.1','::1','localhost','::ffff:127.0.0.1'].includes(h);
const forbiddenPort=p=>[5432,5433,55432,6432,3306,6379,27017].includes(Number(p));
const connect=net.Socket.prototype.connect;
net.Socket.prototype.connect=function(...args){
  let a=Array.isArray(args[0])?args[0][0]:args[0];
  if(a&&typeof a==='object') { if(a.path) return connect.apply(this,args); if(!loopback(a.host??'localhost')||forbiddenPort(a.port)) return deny(); }
  else if(typeof a==='number') { if(!loopback(typeof args[1]==='string'?args[1]:'localhost')||forbiddenPort(a)) return deny(); }
  else if(typeof a==='string'&&!a.startsWith('\\\\.\\pipe\\')) return deny();
  return connect.apply(this,args);
};
// Restrict default temporary supertest listeners to loopback; never load app startup.
const listen=net.Server.prototype.listen;
net.Server.prototype.listen=function(...args){
  if(typeof args[0]==='number') {
    if(args[0]!==0) return deny();
    if(typeof args[1]==='string') {if(!loopback(args[1])) return deny();}
    else args.splice(1,0,'127.0.0.1');
  } else if(args[0]&&typeof args[0]==='object') {
    if(args[0].path) return listen.apply(this,args);
    if(args[0].port!==0||!loopback(args[0].host??'127.0.0.1')) return deny();
    args[0]={...args[0],host:args[0].host??'127.0.0.1'};
  } else if(typeof args[0]==='string'&&!args[0].startsWith('\\\\.\\pipe\\')) return deny();
  return listen.apply(this,args);
};
tls.connect=deny;
const lookup=dns.lookup;
dns.lookup=function(host,...args){if(!loopback(host)) return deny(); return lookup.call(this,host,...args);};
for(const k of ['resolve','resolve4','resolve6','resolveAny','reverse']) dns[k]=deny;
if(dns.promises) for(const k of ['lookup','resolve','resolve4','resolve6','resolveAny','reverse']) dns.promises[k]=deny;
if(globalThis.fetch){const fetch=globalThis.fetch;globalThis.fetch=(input,init)=>{const u=new URL(typeof input==='string'||input instanceof URL?input:input.url);if(!loopback(u.hostname)||forbiddenPort(u.port)) return Promise.reject(Object.assign(new Error('SWARM006 fetch blocked'),{code:'SWARM006_NETWORK_BLOCKED'}));return fetch(input,init);};}
syncBuiltinESMExports();
