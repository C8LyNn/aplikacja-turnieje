const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),source=path.join(root,'Assets/CoreClash/Networking/NgoWireProtocol.cs');
if(!fs.existsSync(source)){console.error('FAIL: bounded multiplayer snapshot codec is not implemented');process.exit(1);}
const scratch=path.join(root,'Tests/obj');fs.mkdirSync(scratch,{recursive:true});
const temp=fs.mkdtempSync(path.join(scratch,'wire-smoke-'));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;');
fs.writeFileSync(path.join(temp,'WireTests.csproj'),`<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net9.0</TargetFramework><ImplicitUsings>enable</ImplicitUsings></PropertyGroup><ItemGroup><Compile Include="${escape(source)}" Link="NgoWireProtocol.cs"/></ItemGroup></Project>`);
fs.writeFileSync(path.join(temp,'Program.cs'),String.raw`
using CoreClash.Networking;
using System.Text;
using System.Linq;
class Program {
 static int n; static void Check(bool b,string name){if(!b)throw new Exception(name);n++;Console.WriteLine("PASS "+name);}
 static void Main(){
  string json="{\"state\":\""+string.Concat(Enumerable.Range(0,18000).Select(i=>"球"+i+"🙂"))+"\"}";
  var packed=NgoWireProtocol.Encode(json);Check(packed.Length<Encoding.UTF8.GetByteCount(json),"compression reduces a representative large state");
  Check(NgoWireProtocol.Decode(packed)==json,"UTF8 compressed state round trip");
  var chunks=NgoWireProtocol.Split(packed);Check(chunks.Length>1&&chunks.All(c=>c.Length<=NgoWireProtocol.ChunkBytes),"all RPC chunks stay bounded");
  var rx=new NgoSnapshotAssembler();string decoded=null;bool complete=false;
  for(int i=chunks.Length-1;i>=0;i--)complete=rx.Add(4,i,chunks.Length,chunks[i],out decoded)||complete;
  Check(complete&&decoded==json,"out-of-order chunks reconstruct exact snapshot");
  Check(!rx.Add(3,0,1,new byte[]{1},out _),"stale revision rejected");
  Check(!rx.Add(5,-1,2,new byte[]{1},out _),"negative index rejected");
  Check(!rx.Add(5,0,100000,new byte[]{1},out _),"unbounded chunk count rejected");
  Check(!rx.Add(5,0,2,new byte[NgoWireProtocol.ChunkBytes+1],out _),"oversized fragment rejected");
  var large=new string('x',NgoWireProtocol.MaxJsonBytes+1);bool limited=false;try{NgoWireProtocol.Encode(large);}catch(System.IO.InvalidDataException){limited=true;}
  Check(limited,"outgoing raw state size limit");
  using(var output=new System.IO.MemoryStream()){
   using(var gzip=new System.IO.Compression.GZipStream(output,System.IO.Compression.CompressionLevel.Fastest,true)){var bytes=Encoding.UTF8.GetBytes(large);gzip.Write(bytes,0,bytes.Length);}
   limited=false;try{NgoWireProtocol.Decode(output.ToArray());}catch(System.IO.InvalidDataException){limited=true;}
   Check(limited,"incoming compressed expansion exceeds raw budget and is rejected");
  }
  limited=false;try{NgoWireProtocol.Decode(new byte[]{1,2,3});}catch(System.IO.InvalidDataException){limited=true;}
  Check(limited,"corrupt gzip rejected");
  var rx2=new NgoSnapshotAssembler();Check(!rx2.Add(1,0,chunks.Length,chunks[0],out _),"partial snapshot never applies");
  Check(!rx2.Add(1,0,chunks.Length,chunks[0],out _),"duplicate fragment never completes early");
  Console.WriteLine("RESULT: "+n+" network wire tests passed");
 }
}`);
try{const result=cp.spawnSync('dotnet',['run','--project',path.join(temp,'WireTests.csproj'),'--configuration','Release'],{encoding:'utf8',cwd:root});process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
 if(result.error)process.stderr.write('BLOCKED: dotnet runner unavailable: '+result.error.message+'\n');
 process.exitCode=result.error||result.status===null?1:result.status;
 fs.mkdirSync(path.join(root,'Evidence'),{recursive:true});fs.writeFileSync(path.join(root,'Evidence/network-codec-tests.json'),JSON.stringify({at:new Date().toISOString(),exitCode:result.status,output:result.stdout,error:result.error?.message||result.stderr},null,2));
}catch(e){console.error(e);process.exitCode=1;}
