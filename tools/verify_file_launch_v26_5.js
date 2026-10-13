/** Préflight statique du mode file:// : NE remplace pas le test Chrome Windows. */
'use strict';
const fs=require('fs'), path=require('path'), assert=require('assert');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m=>m[1]);
const linked=[...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map(m=>m[1]);
let missing=[];
for(const ref of [...scripts,...linked]){
 if (/^(?:https?:|data:|#)/.test(ref)) continue;
 const filename=path.resolve(root,ref.split('?')[0]);
 if (!filename.startsWith(root+path.sep) || !fs.existsSync(filename)) missing.push(ref);
}
assert.equal(missing.length,0,'Resources missing: '+missing.join(', '));
assert(!/<script[^>]+type="module"/.test(html),'ES modules cannot be assumed to work on file://');
for(const rel of scripts){
 const js=fs.readFileSync(path.join(root,rel),'utf8');
 assert(!/\bfetch\s*\(|XMLHttpRequest\s*\(|\bimport\s*\(/.test(js),rel+' requires web loading');
}
for(const name of ['keyart','hero_kabongo','hero_nzinga','hero_makasi','joevally_sprite','bg_nsele'])
 assert(fs.existsSync(path.join(root,'assets/img',name+'.webp')),name+' image missing');
const images=fs.readdirSync(path.join(root,'assets/spr')).filter(x=>x.endsWith('.webp'));
const source=fs.readFileSync(path.join(root,'js/sprites.js'),'utf8');
const renderer=fs.readFileSync(path.join(root,'js/render.js'),'utf8');
assert(renderer.includes("location.protocol !== 'file:'")&&source.includes("location.protocol !== 'file:'"),'crossOrigin should be disabled on file://');
console.log(`PASS: ${scripts.length} classic scripts, ${linked.length} linked files, ${images.length} sprite images; file:// paths statically sound`);
console.log('LIMITATION: Does not certify browser image loading, input latency or save persistence on Windows');
