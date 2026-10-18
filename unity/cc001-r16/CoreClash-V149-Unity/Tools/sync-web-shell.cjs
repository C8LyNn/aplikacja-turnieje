'use strict';
// Regenerate static HTML from the selected Unity template without recompiling unchanged Wasm.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),web=path.join(root,'Builds/WebGL'),build=path.join(web,'Build');
let html=fs.readFileSync(path.join(root,'Assets/WebGLTemplates/CoreClash/index.html'),'utf8');
for(const [token,suffix]of Object.entries({LOADER_FILENAME:'.loader.js',DATA_FILENAME:'.data',FRAMEWORK_FILENAME:'.framework.js',CODE_FILENAME:'.wasm'})){
 const matches=fs.readdirSync(build).filter(f=>f.endsWith(suffix));assert.equal(matches.length,1,'One '+suffix+' artifact required');
 html=html.replaceAll('{{{ '+token+' }}}',matches[0]);
}
assert(!html.includes('{{{'),'No unresolved template values');
fs.writeFileSync(path.join(web,'index.html'),html);
const packaged=path.join(root,'Builds/Windows/WebRoot/index.html');if(fs.existsSync(packaged))fs.copyFileSync(path.join(web,'index.html'),packaged);
console.log('Regenerated responsive WebGL HTML from source; compiled runtime files unchanged.');
