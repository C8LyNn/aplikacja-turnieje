const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root='C:/Users/kubap/Desktop/SWARM006-Final-Tests-20261029',dst=root+'/docs/swarm-006/final-tests-20261029';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.writeFileSync(__dirname+'/fix-c3f6404.patch',cp.execFileSync('git',['diff','--binary','6eb7bd6ac31a8851d08c3f50c7fed74d6b2c57f3','c3f640470262064f890774d935c1388408051d5e'],{cwd:root}));
fs.mkdirSync(dst,{recursive:true});
fs.writeFileSync(dst+'/.gitattributes','* -text -whitespace\n');
function copy(a,b){fs.mkdirSync(b,{recursive:true});for(const item of fs.readdirSync(a,{withFileTypes:true})){
 if(item.isDirectory()){if(item.name==='prior')copy(path.join(a,item.name),path.join(b,item.name));continue;}
 if(!/\.(?:json|log|md|cjs|patch|txt)$/.test(item.name))continue;
 fs.copyFileSync(path.join(a,item.name),path.join(b,item.name));
}}
copy(__dirname,dst);
function list(d,p=''){return fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?list(path.join(d,x.name),p+x.name+'/'):[p+x.name]);}
const files=list(dst).filter(x=>x!=='SHA256SUMS.txt').sort();
fs.writeFileSync(dst+'/SHA256SUMS.txt',files.map(p=>sha(fs.readFileSync(dst+'/'+p))+'  '+p).join('\n')+'\n');
for(const line of fs.readFileSync(dst+'/SHA256SUMS.txt','utf8').trim().split('\n')){const [h,p]=line.split('  ');if(sha(fs.readFileSync(dst+'/'+p))!==h)throw Error('Packaged hash mismatch '+p);}
console.log(JSON.stringify({directory:dst,files:files.length,manifest_sha256:sha(fs.readFileSync(dst+'/SHA256SUMS.txt')),status:'ALL_PACKAGED_HASHES_MATCH'}));
