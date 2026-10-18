// Behavioral import checks: missing/truncated catalogs, stale values and invalid deck references fail.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'Assets/Resources/Data');
try{
 const read=n=>JSON.parse(fs.readFileSync(path.join(dir,n+'.json'),'utf8'));
 const c=read('catalog'),f=read('featured-decks'),ids=new Set(c.balls.map(b=>b.id));
 assert.equal(c.balls.length,227);assert.equal(ids.size,227);assert.equal(c.balls.filter(b=>!b.hidden&&b.id!=='normal').length,224);
 assert.equal(c.archetypes.length,12);assert.equal(c.decks.length,36);
 for(const d of [...c.decks,...f.decks]){assert.equal(d.balls.length,9,d.id);assert.equal(new Set(d.balls).size,9,d.id);for(const id of d.balls)assert(ids.has(id),`${d.id}: ${id}`);}
 assert.equal(f.decks.length,4);assert(f.decks.every(d=>d.provisional===true));
 const byId=Object.fromEntries(c.balls.map(b=>[b.id,b]));
 for(const b of c.balls)assert(Number.isInteger(b.stockCopies),`${b.id} stock must use an integer sentinel for infinity`);
 assert.equal(byId.fire.hp,35);assert.equal(byId.normal.hp,30);assert.equal(byId.anchor.hp,35);assert.equal(byId.dart.radius,17.5);assert.equal(byId.fire.radius,21.25);assert.equal(byId.anchor.radius,25);
 const abilities=Object.fromEntries(c.abilities.map(a=>[a.id,a]));
 assert.deepEqual(abilities['fire:primary'].events,['TOUCH']);assert(abilities['splitter:primary'].events.includes('STOP'));
 assert.equal(c.sourceSha256,'bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e');
 const reference=fs.existsSync(c.sourcePath)?c.sourcePath:path.join(root,'../Reference/V148_reference_original.html');
 const hash=crypto.createHash('sha256').update(fs.readFileSync(reference)).digest('hex');assert.equal(hash,c.sourceSha256);
 console.log('PASS: 227 records / 224 specials / 12 archetypes / 36 canonical + 4 provisional decks; runtime HP/size/contracts and source hash verified.');
}catch(e){console.error('FAIL:',e.message);process.exitCode=1;}
