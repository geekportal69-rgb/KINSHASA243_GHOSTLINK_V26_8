/** V26.6 — tests de fenêtres d'impact, SAUT anticipé, hitstop et hitbox des colosses.
 * Simulation VM Node, pas de prétention de test graphique Chrome/Android. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const ctx = vm.createContext({ console, Math });
vm.runInContext(`
function mulberry32(seed){let t=seed>>>0;return function(){t=(t+0x6d2b79f5)>>>0;let v=t;v=Math.imul(v^v>>>15,v|1);v^=v+Math.imul(v^v>>>7,v|61);return ((v^v>>>14)>>>0)/4294967296;}};
const rand=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a),pick=a=>a[0],randi=(a,b)=>Math.floor(rand(a,b+1));
const BAND=74, Settings={diff:1,gspeed:100,fx:0,heart:0,hold:1,autorun:1,assist:0,parryWin:1};
const Input={source:'keys',players:[{mx:0,my:0,atk:false,pressed:{}},{mx:0,my:0,atk:false,pressed:{}}]};
const Sound={sfx:new Proxy({}, {get(){return ()=>{};}}),setEnv(){},at(){},setIntensity(){},setLowHp(){},playMusic(){}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sign=v=>v<0?-1:1;
const approach=(a,b,d)=>a<b?Math.min(a+d,b):Math.max(a-d,b),lerp=(a,b,t)=>a+(b-a)*t;
const easeOut=t=>1-Math.pow(1-t,3),haptic=()=>{};`, ctx);
for (const f of ['js/data.js','js/rig.js','js/game.js']) vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
const run = (s) => vm.runInContext(s,ctx);
const empty = '{mx:0,my:0,jump:false,atk:false,dtap:false,pressed:{}}';
function reset() {
  run(`Game.startStage(0);Game.enemies=[];Game.items=[];Game.players[0].state='idle';
   {const p=Game.players[0];p.y=0;p.vy=0;p.x=100;p.z=37;p.face=1;p.move=null;p.dj=false;p.airDash=false;p.buffer=null;p.bufT=0;p.inv=0;p.running=false;}
   Input.players[0]={mx:0,my:0,jump:false,atk:false,pressed:{}};`);
}
// Une pression tardive SAUT en descente ne doit pas utiliser le double saut à quelques pixels du sol.
reset();
run(`{const p=Game.players[0];p.state='jump';p.y=8;p.vy=-140;p.dj=false;
Game.updatePlayer(p,{mx:0,my:0,jump:true,atk:false,pressed:{jump:true}},1/60);}`);
assert.equal(run('Game.players[0].dj'),false,'le saut très proche du sol ne doit pas consommer le double saut');
assert.equal(run('Game.players[0].buffer'),'jump','le saut anticipé doit rester en tampon');
for (let i=0;i<15 && run('Game.players[0].state') !== 'idle';i++) run(`Game.updatePlayer(Game.players[0],${empty},1/60)`);
assert.equal(run('Game.players[0].state'),'idle','atterrissage attendu');
run(`Game.updatePlayer(Game.players[0],${empty},1/60)`);
assert.equal(run('Game.players[0].state'),'jump','le tampon doit déclencher le saut après atterrissage');
assert(run('Game.players[0].vy') > 0);
console.log('OK : appui SAUT juste avant atterrissage → saut au contact, pas de double saut fantôme');
// Le double saut doit rester possible dans la partie haute d'un arc.
reset();
run(`{const p=Game.players[0];p.state='jump';p.y=55;p.vy=20;p.dj=false;
Game.updatePlayer(p,{mx:0,my:0,jump:true,atk:false,pressed:{jump:true}},1/60);}`);
assert.equal(run('Game.players[0].dj'),true);
assert(run('Game.players[0].vy') > 100);
console.log('OK : double saut conservé au milieu d’un saut');
// Un appui en plein hitstop doit exister au premier frame jouable suivant.
reset();
run(`Game.hitstop=0.04;Input.players[0].pressed={jump:true};Game.step(1/60);`);
assert.equal(run('Game.players[0].buffer'),'jump');
assert.equal(run('Game.players[0].state'),'idle','hitstop doit figer le gameplay');
run(`Input.players[0].pressed={};for(let i=0;i<5;i++)Game.step(1/60);`);
assert.equal(run('Game.players[0].state'),'jump');
console.log('OK : action de saut préservée pendant le hitstop');
reset();
run(`Game.hitstop=0.03;Input.players[0].pressed={atk:true};Game.step(1/60);`);
assert.equal(run('Game.players[0].buffer'),'atk');
run(`Input.players[0].pressed={};for(let i=0;i<4;i++)Game.step(1/60);`);
assert.equal(run('Game.players[0].state'),'attack');
console.log('OK : coup court préservé pendant le hitstop');
reset();
run(`Game.hitstop=0.04;Input.players[0].pressed={jump:true,dash:true};Game.step(1/60);`);
assert.equal(run('Game.players[0].buffer'),'dash');
console.log('OK : priorité défensive DASH > SAUT pendant le hitstop');
reset();
run(`Settings.hold=0;Game.hitstop=0.03;Input.players[0].pressed={atk:true};Game.step(1/60);`);
assert.equal(run('Game.players[0].buffer'),null,'le mode charge manuel ne doit pas déclencher un coup instantané');
// En revanche, en pleine attaque le même bouton peut entrer dans le tampon de combo.
reset();
run(`Settings.hold=0;{const p=Game.players[0];p.state='attack';p.move=M({t:0.25,act:[0.04,0.11]});p.mt=0.15;}
Game.hitstop=0.03;Input.players[0].pressed={atk:true};Game.step(1/60);`);
assert.equal(run('Game.players[0].buffer'),'atk','une suite manuelle de combo doit rester saisissable au hitstop');
run('Settings.hold=1');
console.log('OK : charge au repos préservée, combo manuel en cours reste bufférisé');
// Test d'une fenêtre d'attaque très courte (0.04-0.06) traversée en une seule simulation lente.
reset();
run(`{
const p=Game.players[0];const e=Game.makeEnemy('voyou',p.x+19,p.z);e.state='idle';e.inv=0;
Game.enemies=[e];p.state='attack';p.move=M({t:0.3,act:[0.04,0.06],reach:[1,27],y:[20,60],zr:9,dmg:5,kb:10});p.mt=0;p.lastHit=false;
Game.updateMove(p,0.08);
}`);
assert.equal(run('Game.enemies[0].hp < Game.enemies[0].maxHp'),true,'frappe courte ne doit pas disparaître');
assert.equal(run('Game.players[0].hitSet.size'),1);
run('Game.updateMove(Game.players[0],0.05)');
assert.equal(run('Game.players[0].hitSet.size'),1,'un seul contact pour une attaque non multi');
console.log('OK : fenêtre active traversée par une frame longue produit un seul impact');
// Les colosses ne doivent pas être touchables depuis toute la profondeur de l'arène.
reset();
run(`{const p=Game.players[0];Game.boss=Game.makeBoss('joevally',p.x+40,37);Game.boss.state='idle';p.z=0;}`);
assert.equal(run('Game.canHit(Game.players[0],Game.boss,M({reach:[0,40],zr:9,y:[20,60]}))'),false);
run('Game.players[0].z=37;');
assert.equal(run('Game.canHit(Game.players[0],Game.boss,M({reach:[0,40],zr:9,y:[20,60]}))'),true);
run('Game.players[0].y=140;');
assert.equal(run('Game.canHit(Game.players[0],Game.boss,M({reach:[0,40],zr:9,y:[20,60]}))'),false);
console.log('OK : hitbox colosse respecte la profondeur et la hauteur');
// La liste des groupes d’interpolation est réutilisée par niveau.
reset();
assert.equal(run('Game.interpLists()===Game.interpLists()'),true);
run('const previousGroup=Game.interpLists();Game.startStage(1);');
assert.equal(run('previousGroup===Game.interpLists()'),false);
assert.equal(run('Game.interpLists()[1]===Game.enemies'),true);
console.log('OK : cache d’interpolation par niveau, données courantes');
// Démarrage de tous les niveaux avec simulation sans intervention.
for(let i=0;i<30;i++) run(`Game.startStage(${i});for(let j=0;j<90;j++)Game.step(1/60)`);
console.log('PASS : V26.6, tests de physique ciblés et 30 étapes × 90 cycles');
