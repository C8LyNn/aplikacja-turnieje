const fs=require('node:fs'),crypto=require('node:crypto');
let b=fs.readFileSync(__dirname+'/network-guard.cjs','utf8').replaceAll('\r\n','\n');
b=b.replace('// supertest reads server.address() synchronously after listen(0). Preserve this\n// behavior, but reject all non-loopback accepted sockets on temporary listeners.','// Restrict default temporary supertest listeners to loopback; never load app startup.')
 .replace("  this.prependListener('connection',socket=>{if(!loopback(socket.remoteAddress))socket.destroy();});\n",'')
 .replace("    if(typeof args[1]==='string') {if(!loopback(args[1])) return deny();}\n","    if(typeof args[1]==='string') {if(!loopback(args[1])) return deny();}\n    else args.splice(1,0,'127.0.0.1');\n")
 .replace("    if(args[0].port!==0||!loopback(args[0].host??'127.0.0.1')) return deny();\n","    if(args[0].port!==0||!loopback(args[0].host??'127.0.0.1')) return deny();\n    args[0]={...args[0],host:args[0].host??'127.0.0.1'};\n");
let found=false;
for(const text of [b,b.replaceAll('\n','\r\n')]){
 const h=crypto.createHash('sha256').update(text).digest('hex');
 if(h==='83ebaeecad5334907c4d97b273798b9df2987d241924d34c59f039c5fa56ec27'){fs.writeFileSync(__dirname+'/network-guard-v1.cjs',text);console.log(h);found=true;}
}
if(!found)throw Error('Original guard could not be reproduced');
