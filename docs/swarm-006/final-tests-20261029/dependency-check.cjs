const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root='C:/Users/kubap/Desktop/SWARM006-Final-Tests-20261029';
const source='C:/Users/kubap/Documents/GitHub/aplikacja-turnieje';
const yaml=require(source+'/node_modules/.pnpm/yaml@2.8.4/node_modules/yaml');
const lock=yaml.parse(fs.readFileSync(root+'/pnpm-lock.yaml','utf8'));
const entries=[];
for(const [importer,groups] of Object.entries(lock.importers))for(const group of ['dependencies','devDependencies','optionalDependencies'])for(const [name,entry] of Object.entries(groups[group]??{})){
 if(entry.version.startsWith('link:'))continue;
 const expected=entry.version.split('(')[0];
 const p=path.join(root,importer,'node_modules',name,'package.json');
 let actual=null;try{actual=JSON.parse(fs.readFileSync(p,'utf8')).version;}catch{}
 entries.push({importer,group,name,expected,actual,match:actual===expected});
}
const report={lock_lf_sha256:crypto.createHash('sha256').update(fs.readFileSync(root+'/pnpm-lock.yaml','utf8').replaceAll('\r\n','\n')).digest('hex'),entries,total:entries.length,match:entries.filter(x=>x.match).length,mismatches:entries.filter(x=>!x.match)};
fs.writeFileSync(__dirname+'/dependency-check.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,entries:undefined}));
