/** V26.8 — IA ennemie : identités, budget d'attaques, interruption, anti-starvation.
 * Simulation VM Node, pas un test visuel ni manette réelle. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const c = vm.createContext({console,Math,window:{SPR_META:{}},location:{protocol:'file:'}});
vm.runInContext(`
function mulberry32(seed){let t=seed>>>0;return function(){t=(t+0x6d2b79f5)>>>0;let v=t;v=Math.imul(v^v>>>15,v|1);v^=v+Math.imul(v^v>>>7,v|61);return ((v^v>>>14)>>>0)/4294967296;}};
const rand=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a),pick=a=>a[0],randi=(a,b)=>Math.floor(rand(a,b+1));
const BAND=74,Settings={diff:1,gspeed:100,fx:0,heart:0,hold:1,autorun:1,assist:0,parryWin:1};
const Input={source:'keys',players:[{mx:0,my:0,atk:false,pressed:{}},{mx:0,my:0,atk:false,pressed:{}}]};
const Sound={sfx:new Proxy({}, {get(){return ()=>{};}}),setEnv(){},at(){},setIntensity(){},setLowHp(){},playMusic(){}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sign=v=>v<0?-1:1;
const approach=(a,b,d)=>a<b?Math.min(a+d,b):Math.max(a-d,b),lerp=(a,b,t)=>a+(b-a)*t;
const easeOut=t=>1-Math.pow(1-t,3),haptic=()=>{};
`,c);
for (const f of ['js/data.js','js/rig.js','js/game.js']) vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
const run = s => vm.runInContext(s,c);
const types=['voyou','kuluna','boxeuse','molosse','garde','drone','sapeur','motard'];
assert.equal(run('Object.keys(ENEMY_TACTICS).length'),8);
for (const type of types) {
  assert(run(`!!ENEMY_TACTICS.${type}.role && ENEMY_TACTICS.${type}.ideal > 0`));
  assert(run(`ENEMIES.${type}.moves.every(k=>!!MOVES[k]&&ENEMY_TACTICS.${type}.moves[k]>0)`));
}
console.log('OK : 8 profils complets, tous les MOVES référencés');
function stage(){run(`Game.startStage(0);Game.enemies=[];Game.players[0].x=300;Game.players[0].z=35;Game.players[0].state='idle';Game.players[0].y=0;`);}
function enemy(type, x=240, z=35) {
  return run(`(()=>{let e=Game.makeEnemy('${type}',${x},${z});e.state='idle';e.ai.cd=0;e.ai.think=0;e.ai.token=false;Game.enemies.push(e);return e.id})()`);
}
stage();
for (const [type,dx,expect] of [
  ['voyou',19,'e_jab'],['kuluna',115,'e_knife'],['boxeuse',85,'e_jkick'],
  ['molosse',100,'e_charge'],['garde',25,'e_zap'],['sapeur',27,'e_baton'],['motard',100,'e_charge']
]){
 const id=enemy(type,200);
 const found=run(`(()=>{const e=Game.enemies.find(e=>e.id===${id});e.ai.pat=0;return Object.keys(MOVES).find(k=>MOVES[k]===Game.tacticalMove(e,Game.players[0],${dx},0))})()`);
 assert.equal(found,expect,`${type} should have distinct appropriate attack`);
}
console.log('OK : attaques choisies suivant rôle et distance');
// Concurrency: 8 enemies try to reserve the same player.
stage();types.forEach((t,i)=>enemy(t,252-i,35));
run(`for(const e of Game.enemies)Game.think(e,1/60)`);
let count=run('Game.enemies.filter(e=>!!e.ai.token).length');
assert(count<=2 && count>=1,'standard difficulty: at most two attack tokens');
// AI must not keep a token once injured, leaving a slot to a waiting fighter.
run(`{const holder=Game.enemies.find(e=>e.ai.token);holder.state='hurt';holder.st=0.4;Game.updateEnemy(holder,1/60);}`);
assert.equal(run('Game.enemies.some(e=>e.state===\'hurt\'&&e.ai.token)'),false);
run(`for(const e of Game.enemies){if(e.state!=='attack'&&e.state!=='hurt'){e.ai.cd=0;Game.think(e,1/60)}}`);
assert(run('Game.enemies.filter(e=>!!e.ai.token).length')<=2);
console.log('OK : jetons plafonnés ; coup reçu libère le créneau');
// Time-limited lease: no token retained if the target leaves attack range.
stage();enemy('motard',240,35);
run(`{const e=Game.enemies[0];e.ai.token=true;e.ai.tokenT=0.01;e.state='idle';e.ai.cd=2;Game.updateEnemy(e,0.05);}`);
assert.equal(run('Game.enemies[0].ai.token'),false);
run(`{const e=Game.enemies[0];e.ai.token=true;e.ai.tokenT=2;Game.players[0].x=700;Game.think(e,1/60);}`);
assert.equal(run('Game.enemies[0].ai.token'),false);
console.log('OK : bail d’attaque expiré ou cible hors portée');
// Drone must acquire a token before firing; it cannot bypass the coordination.
stage();const id=enemy('drone',210,35);
run(`{const e=Game.enemies[0];e.ai.cd=0;e.ai.token=false;e.ai.think=3;Game.think(e,1/60);}`);
assert.notEqual(run('Game.enemies[0].state'),'attack');
run(`{const e=Game.enemies[0];e.ai.cd=0;e.ai.think=0;Game.think(e,1/60);}`);
assert.equal(run('Game.enemies[0].state'),'attack');
console.log('OK : drones soumis au même budget');
// Boxeuse: evade only one attack per cooldown, no repeated random frame dodges.
stage();enemy('boxeuse',281,35);
run(`{const p=Game.players[0];p.state='attack';p.move=MOVES.k_jab;p.mt=0.02;
  const e=Game.enemies[0];e.ai.cd=1;e.ai.token=true;Game.think(e,1/60);}`);
assert.equal(run('Game.enemies[0].state'),'jump');
assert(run('Game.enemies[0].ai.dodgeCd')>2);
assert.equal(run('Game.enemies[0].ai.token'),false);
console.log('OK : esquive réactive sans monopoliser de jeton');
// Normal stage and DLC must survive a fixed update budget without exception.
for(let i=0;i<30;i++)run(`Game.startStage(${i});for(let j=0;j<90;j++)Game.step(1/60);`);
console.log('PASS : V26.8, rôles des 8 ennemis, tokens, drone, esquive, 30 stages × 90 cycles');
// Stress test: leases should rotate instead of favoring only the first enemy.
stage();
for(let i=0;i<7;i++)enemy(types[i],270-i*4,35);
run(`{const p=Game.players[0];p.inv=999;p.hp=999;p.maxHp=999;
for (let n=0;n<900;n++) {
  for(const e of Game.enemies) if (!e.dying && !e.remove) Game.updateEnemy(e,1/60);
}}`);
const participants=run('Game.enemies.filter(e=>e.ai.pat>0).map(e=>e.type)');
assert(participants.length>=3,'AI token leases must allow several enemies to attack over time');
console.log('OK : rotation de jetons en simulation 15 s : '+Array.from(participants).join(', '));
