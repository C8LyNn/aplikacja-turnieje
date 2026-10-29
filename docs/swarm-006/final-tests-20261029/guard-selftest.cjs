const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const net=require('node:net');
test('guard rejects external network before a socket is opened',()=>assert.throws(()=>net.connect({host:'example.invalid',port:443}),/blocked/));
test('guard rejects PostgreSQL on loopback before a socket is opened',()=>assert.throws(()=>net.connect({host:'127.0.0.1',port:5432}),/blocked/));
test('loopback ephemeral HTTP fixture works',async()=>{
 const server=http.createServer((req,res)=>res.end('ok'));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try { const response=await fetch('http://127.0.0.1:'+server.address().port); assert.equal(await response.text(),'ok'); }
 catch(error){console.error(error,error.cause);throw error;}
 finally{await new Promise(resolve=>server.close(resolve));}
});
