'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.wasm':'application/wasm','.data':'application/octet-stream','.png':'image/png','.ico':'image/x-icon','.svg':'image/svg+xml'};

function createWebServer(directory=path.resolve(__dirname,'../Builds/WebGL')){
  const root=fs.realpathSync(directory);
  const inside=file=>file===root||file.startsWith(root+path.sep);
  return http.createServer((req,res)=>{
    const fail=(status,message)=>{res.writeHead(status,{'Content-Type':'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff'});res.end(message);};
    if(req.method!=='GET'&&req.method!=='HEAD')return fail(405,'GET or HEAD required');
    let decoded;
    try{decoded=decodeURIComponent((req.url||'/').split('?')[0]);}catch{return fail(400,'Invalid URL encoding');}
    if(decoded.includes('\0')||decoded.includes('\\')||decoded.split('/').some(p=>p==='..'))return fail(403,'Path denied');
    const target=path.resolve(root,'.'+(decoded==='/'?'/index.html':decoded));
    if(!inside(target))return fail(403,'Path denied');
    let real,stat;
    try{real=fs.realpathSync(target);if(!inside(real))return fail(403,'Path denied');stat=fs.statSync(real);}catch{return fail(404,'Not found');}
    if(!stat.isFile())return fail(404,'Not found');
    res.writeHead(200,{'Content-Type':mime[path.extname(real).toLowerCase()]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    if(req.method==='HEAD')return res.end();
    const stream=fs.createReadStream(real);stream.on('error',()=>res.destroy());stream.pipe(res);
  });
}
module.exports={createWebServer};
if(require.main===module){
  const args=process.argv.slice(2),portIndex=args.indexOf('--port'),rootIndex=args.indexOf('--root');
  const port=portIndex>=0?Number(args[portIndex+1]):8080;
  if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid --port');
  const server=createWebServer(rootIndex>=0?path.resolve(args[rootIndex+1]):undefined);
  server.listen(port,'127.0.0.1',()=>console.log('Core Clash WebGL: http://127.0.0.1:'+port+'/ (loopback only)'));
  process.on('SIGINT',()=>server.close());process.on('SIGTERM',()=>server.close());
}
