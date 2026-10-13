/** Test de reprise V26.1 : moteur sans DOM, contrôles et score. node tools/test_v26_1.js */
'use strict';
const fs=require('fs'), vm=require('vm'), assert=require('assert');
const c=vm.createContext({ console, Math });
vm.runInContext(`
function mulberry32(seed){let t=seed>>>0;return function(){t=(t+0x6d2b79f5)>>>0;let v=t;v=Math.imul(v^v>>>15,v|1);v^=v+Math.imul(v^v>>>7,v|61);return ((v^v>>>14)>>>0)/4294967296;}};
const rand=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);const pick=a=>a[0];const randi=(a,b)=>Math.floor(rand(a,b+1));const BAND=74;
const Settings={diff:1,gspeed:100,fx:0,heart:0,hold:0,autorun:0};
const Input={source:'keyboard', players:[{mx:0,my:0,atk:false,pressed:{}},{mx:0,my:0,atk:false,pressed:{}}]};
const Sound={sfx:new Proxy({}, {get(){return ()=>{};}}),setEnv(){},at(){},setIntensity(){},setLowHp(){}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));const sign=v=>v<0?-1:1;
const approach=(a,b,step)=>a<b?Math.min(a+step,b):Math.max(a-step,b);
const lerp=(a,b,t)=>a+(b-a)*t;const easeOut=t=>1-Math.pow(1-t,3);const haptic=()=>{};
`,c);
for(const f of ['js/data.js','js/rig.js','js/game.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
function run(js){return vm.runInContext(js,c)}
function reset(){run(`Game.startStage(0); Game.players[0].y=0;Game.players[0].vy=0;Game.players[0].state='idle';Game.players[0].st=0;Game.players[0].vx=0;Game.players[0].z=30;`)}
function frames(n,atk,press){return run(`(()=>{let i=Input.players[0];i.atk=${!!atk};i.pressed={atk:${!!press}};for(let k=0;k<${n};k++){if(k)i.pressed.atk=false;Game.updatePlayer(Game.players[0],i,1/60);}})()`)}
reset();run('Settings.hold=0');frames(12,true,true);
assert.equal(run('Game.players[0].move'),null,'manual hold never attacks while charging');
frames(1,false,false);
assert.equal(run('Game.players[0].state'),'attack','short tap attacks on release');
assert.equal(run('Game.players[0].chargedMove'),false,'short tap not charged');
console.log('OK: short tap');
reset();frames(40,true,true);
assert.equal(run('Game.players[0].chargeReady'),true,'charge ready after 0.55s');
frames(1,false,false);
assert.equal(run('Game.players[0].chargedMove'),true,'release triggers charged attack');
assert.equal(run('Game.players[0].move===MOVES[Game.players[0].hero.run]'),true,'charged attack uses run move');
// Direct hit damage multiplier check: target freshly created in front of p, unarmored.
run(`Game.players[0].face=1; Game.players[0].x=100; Game.players[0].z=30;
 Game.enemies=[Game.makeEnemy('voyou',125,30)];Game.enemies[0].state='idle';Game.enemies[0].inv=0;Game.enemies[0].hp=200;Game.enemies[0].maxHp=200;
 Game.players[0].power=1;Game.players[0].perfectT=0;`);
const moveDamage=run(`MOVES[Game.players[0].hero.run].dmg`);
run(`Game.applyHit(Game.players[0],Game.enemies[0],MOVES[Game.players[0].hero.run])`);
assert(Math.abs(run('200-Game.enemies[0].hp')-moveDamage*1.6)<1e-5,'charged damage ×1.6');
run('Game.startMove(Game.players[0],MOVES[Game.players[0].hero.combo[0]])');
assert.equal(run('Game.players[0].chargedMove'),false,'new move clears charge');
console.log('OK: charged attack & reset');
reset();run('Settings.hold=1');frames(1,true,true);
assert.equal(run('Game.players[0].state'),'attack','automatic mode attacks on press');
console.log('OK: automatic mode preserved');
reset();run('Settings.hold=1;Game.players[0].combo=8; Game.players[0].score=0;Game.stats.kills=0;Game.enemies=[Game.makeEnemy("voyou",130,30)];');
run('Game.onKill(Game.enemies[0],Game.players[0])');
assert.equal(run('Game.players[0].score'),800,'finisher +500 in addition to kill base 300');
assert.equal(run('Game.stats.kills'),1);assert.equal(run('Game.events.filter(e=>e.type==="finisher").length'),1);
console.log('OK: finisher 8+');
reset();run('Game.players[0].combo=7;Game.players[0].score=0;Game.enemies=[Game.makeEnemy("voyou",130,30)]');
run('Game.onKill(Game.enemies[0],Game.players[0])');assert.equal(run('Game.players[0].score'),300);
assert.equal(run('Game.events.filter(e=>e.type==="finisher").length'),0);
console.log('OK: no finisher below 8');
reset();run('Game.players[0].combo=16;Game.players[0].score=0;Game.enemies=[];Game.bossPhase="fight"');
run('Game.onKill(Game.makeBoss("wewa",650,30),Game.players[0])');
assert.equal(run('Game.bossPhase'),'ko');assert.equal(run('Game.events.filter(e=>e.type==="finisher").length'),0);
console.log('OK: boss KO remains separate');
run('Game.startStage(29,{keep:true}); const b=Game.makeBoss("joevally",650,30);Game.setupRoadJoe(b); b.hp=b.maxHp*0.29;Game.updateJoeRoadPhases(b);');
assert.equal(run('b.roadPhase3'),true,'Joe road phase starts');
assert.equal(run('Game.roadObjective.done'),false,'Joe road phase no longer auto-completes objective');
console.log('OK: six-stage DLC final requires real beacon destruction');
console.log('PASS: V26.1 combat restoration smoke tests');
