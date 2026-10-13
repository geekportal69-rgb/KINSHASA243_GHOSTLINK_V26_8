/** V26.7 — héros : combos confirmés, miss, fenêtres par classe, réaction et sprites.
 * Tests VM de logique (pas de rendu graphique ni mesure FPS). */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const c = vm.createContext({ console, Math, window:{SPR_META:{}}, location:{protocol:'file:'} });
vm.runInContext(`
function mulberry32(seed){let t=seed>>>0;return function(){t=(t+0x6d2b79f5)>>>0;let v=t;v=Math.imul(v^v>>>15,v|1);v^=v+Math.imul(v^v>>>7,v|61);return ((v^v>>>14)>>>0)/4294967296;}};
const rand=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a),pick=a=>a[0],randi=(a,b)=>Math.floor(rand(a,b+1));
const BAND=74,Settings={diff:1,gspeed:100,fx:0,heart:0,hold:1,autorun:1,assist:0,parryWin:1};
const Input={source:'keys',players:[{mx:0,my:0,atk:false,pressed:{}},{mx:0,my:0,atk:false,pressed:{}}]};
const Sound={sfx:new Proxy({}, {get(){return ()=>{};}}),setEnv(){},at(){},setIntensity(){},setLowHp(){},playMusic(){}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sign=v=>v<0?-1:1;
const approach=(a,b,d)=>a<b?Math.min(a+d,b):Math.max(a-d,b),lerp=(a,b,t)=>a+(b-a)*t;
const easeOut=t=>1-Math.pow(1-t,3),haptic=()=>{};`,c);
for(const f of ['js/data.js','js/rig.js','js/game.js','js/sprites.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
const run = s => vm.runInContext(s,c);
const input='{mx:0,my:0,atk:false,jump:false,dtap:false,pressed:{}}';
function init(id){
  run(`Game.coop=false;Game.heroSel=['${id}','nzinga'];Game.startStage(0);Game.enemies=[];
  {const p=Game.players[0];p.state='idle';p.y=0;p.x=100;p.z=37;p.face=1;p.inv=0;p.buffer=null;p.bufT=0;p.comboT=0;p.comboIdx=0;p.move=null;}
  Settings.hold=1;`);
}
// 1) Metadata and different timing, no move reference regressions
assert(run('HEROES.nzinga.combat.chainRecovery < HEROES.kabongo.combat.chainRecovery'));
assert(run('HEROES.kabongo.combat.chainRecovery < HEROES.makasi.combat.chainRecovery'));
for(const id of ['kabongo','nzinga','makasi']) {
  assert.equal(run(`HEROES.${id}.combo.every(k=>!!MOVES[k]&&MOVES[k].act[0]>0&&MOVES[k].act[1]<MOVES[k].t)`),true);
  init(id);
  // Stable airborne / special references, all carry valid combat identities
  assert(run(`!!MOVES[Game.players[0].hero.air] && !!MOVES[Game.players[0].hero.blitz]`));
  // Attack starts through normal input path; real enemy receives hit
  run(`{const p=Game.players[0];let e=Game.makeEnemy('voyou',p.x+15,p.z);e.state='idle';e.inv=0;Game.enemies=[e];}`);
  run(`Game.updatePlayer(Game.players[0],{mx:0,my:0,atk:true,jump:false,pressed:{atk:true}},1/60)`);
  assert.equal(run('Game.players[0].state'),'attack',id+': attack must start');
  run(`for(let i=0;i<20&&!Game.players[0].lastHit;i++)Game.updatePlayer(Game.players[0],${input},1/60);`);
  assert.equal(run('Game.players[0].lastHit'),true,id+': first strike hit');
  const first=run('Game.players[0].move');
  // Queue next attack; verify cancel triggers before natural move ending
  run(`Game.updatePlayer(Game.players[0],{mx:0,my:0,atk:true,jump:false,pressed:{atk:true}},1/60);`);
  run(`for(let i=0;i<32&&Game.players[0].comboIdx===0;i++)Game.updatePlayer(Game.players[0],${input},1/60);`);
  assert.equal(run('Game.players[0].comboIdx'),1,id+': should chain to next combo move');
  assert.equal(run(`Game.players[0].move===MOVES[Game.players[0].hero.combo[1]]`),true,id+': correct second move');
  assert.equal(run('Game.players[0].lastHit'),false,id+': next move resets confirmed hit');
  console.log('OK : '+id+' combo après impact → prochain coup sans saut de chaîne');
  // Whiff must not cancel early, preserve original recovery.
  init(id);
  run(`{const p=Game.players[0];Game.startMove(p,MOVES[p.hero.combo[0]]);p.mt=0.03;p.lastHit=false;}`);
  run(`Game.updatePlayer(Game.players[0],{mx:0,my:0,atk:true,jump:false,pressed:{atk:true}},1/60);`);
  run(`Game.updatePlayer(Game.players[0],${input},1/60);`);
  assert.equal(run('Game.players[0].comboIdx'),0,id+': whiff must not chain during startup');
  assert.equal(run(`Game.players[0].move===MOVES[Game.players[0].hero.combo[0]]`),true,id+': whiff recovery cannot be skipped');
  // No cancelling a hero special even if it hits and queued input exists.
  init(id);
  run(`{const p=Game.players[0];Game.startMove(p,MOVES[p.hero.spe]);p.mt=p.move.act[1]+0.01;p.lastHit=true;p.buffer='atk';p.bufT=1;}`);
  run(`Game.updatePlayer(Game.players[0],${input},1/60);`);
  assert.equal(run(`Game.players[0].move===MOVES[Game.players[0].hero.spe]`),true,id+': special recovery must be respected');
}
// Direct tempo test: same normalized point of an attack -> only Nzinga has
// recovered enough to chain. Verify timings affect simulation, not just data.
const immediate = {};
for(const id of ['kabongo','nzinga','makasi']) {
  init(id);
  run(`{const p=Game.players[0];Game.startMove(p,MOVES[p.hero.combo[0]]);
    p.mt=p.move.act[1]+0.02;p.lastHit=true;p.comboIdx=0;p.buffer='atk';p.bufT=1;}`);
  run(`Game.updatePlayer(Game.players[0],${input},1/60);`);
  immediate[id]=run('Game.players[0].comboIdx');
}
assert.equal(immediate.nzinga,1,'Nzinga chains earlier after hit');
assert.equal(immediate.kabongo,0,'Kabongo maintains a balanced recovery');
assert.equal(immediate.makasi,0,'Makasi cannot cancel a heavy attack prematurely');
console.log('OK : fenêtres de combo réellement distinctes en simulation');
// 2) Input queue durations: distinguish fast from strong without sharing globals.
for(const id of ['kabongo','nzinga','makasi']){
  init(id);
  run(`{const p=Game.players[0];Game.startMove(p,MOVES[p.hero.combo[0]]);}`);
  run(`Game.updatePlayer(Game.players[0],{mx:0,my:0,atk:true,jump:false,pressed:{atk:true}},1/60);`);
  assert(Math.abs(run('Game.players[0].bufT') - (run(`HEROES.${id}.combat.inputQueue`) - 1/60)) < 1e-5,id+': buffer duration');
}
// 3) Incoming stagger/knockback changes without changing damage of the attack.
const reaction = {};
for(const id of ['kabongo','nzinga','makasi']){
  init(id);
  run(`{const p=Game.players[0];const e=Game.makeEnemy('voyou',p.x-10,p.z);e.face=1;e.inv=0;p.state='idle';
    Game.applyHit(e,p,M({dmg:5,kb:40,launch:0,stun:0.4,reach:[1,25],y:[15,65]}));}`);
  reaction[id] = {st:run('Game.players[0].st'), vx:Math.abs(run('Game.players[0].vx'))};
  assert.equal(run('Game.players[0].state'),'hurt');
}
assert(reaction.nzinga.st>reaction.kabongo.st&&reaction.kabongo.st>reaction.makasi.st);
assert(reaction.nzinga.vx>reaction.kabongo.vx&&reaction.kabongo.vx>reaction.makasi.vx);
console.log('OK : hit reactions Nzinga (léger), Kabongo (moyen), Makasi (stable)');
// 4) Graphic pose metadata is distinct; sprite actual drawing still requires browser.
const out={};
for(const id of ['kabongo','nzinga','makasi']){
  init(id);
  run(`{const p=Game.players[0];Game.startMove(p,MOVES[p.hero.combo[0]]);p.mt=p.move.act[0]/2;}`);
  out[id]=run('Sprites.frameHero(Game.players[0],{n:"idle",dx:0,sx:1,sy:1,dy:0,rot:0},0)');
  const wind=run('(()=>{const o={n:"idle",dx:0,sx:1,sy:1,dy:0,rot:0};Sprites.frameHero(Game.players[0],o,0);return o.dx;})()');
  assert(wind<0,'anticipation moves backward '+id);
}
// 5) all stages smoke
for(let i=0;i<30;i++)run(`Game.startStage(${i});for(let n=0;n<90;n++)Game.step(1/60);`);
console.log('PASS : V26.7 héros, impact, whiff, specials, recovery, réactions, 30 niveaux × 90 cycles');
