/** V26.4 : barrages physiques, objectifs authentiques, réparation, dessin et non régression. */
'use strict';
const assert = require('assert'), fs = require('fs'), vm = require('vm');
const ctx = vm.createContext({ console, Math });
vm.runInContext(`
function mulberry32(seed){let t=seed>>>0;return function(){t=(t+0x6d2b79f5)>>>0;let v=t;v=Math.imul(v^v>>>15,v|1);v^=v+Math.imul(v^v>>>7,v|61);return ((v^v>>>14)>>>0)/4294967296;}};
const rand=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a),pick=a=>a[0],randi=(a,b)=>Math.floor(rand(a,b+1));
const BAND=74,Settings={diff:1,gspeed:100,fx:0,heart:0,hold:1,autorun:1};
const Input={source:'keys',players:[{mx:0,my:0,atk:false,pressed:{}},{mx:0,my:0,atk:false,pressed:{}}]};
const Sound={sfx:new Proxy({}, {get(){return ()=>{};}}),setEnv(){},at(){},setIntensity(){},setLowHp(){},playMusic(){}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sign=v=>v<0?-1:1;
const approach=(a,b,d)=>a<b?Math.min(a+d,b):Math.max(a-d,b);
const lerp=(a,b,t)=>a+(b-a)*t,easeOut=t=>1-Math.pow(1-t,3),haptic=()=>{};
`,ctx);
for(const f of ['js/data.js','js/rig.js','js/game.js','js/render.js']) vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
const run=s=>vm.runInContext(s,ctx);
run('Game.startStage(25);');
assert.equal(run('Game.hazards.filter(h=>h.k==="roadblock").length'),3);
run('Game.roadProgress(9,"Vagues","wave");Game.roadProgress(9,"Risque","repair");');
assert.equal(run('Game.roadObjective.value'),0,'Kenge cannot auto-complete through waves or repairs');
for(let i=0;i<3;i++){
  run(`{ const h=Game.hazards.filter(x=>x.k==='roadblock'&&!x.dead)[0]; const p=Game.players[0];p.x=h.x-20;p.z=h.z;p.face=1;
     for(let j=0;j<3;j++){p.hitSet.clear();Game.hitRoadBlocks(p,{all:false,reach:[0,45],zr:15,y:[0,25]});}
   }`);
  assert.equal(run('Game.roadObjective.value'),i+1);
}
assert.equal(run('Game.roadObjective.done'),true);
assert.equal(run('Game.hazards.filter(h=>h.k==="roadblock"&&!h.dead).length'),0);
console.log('OK: three tangible Kenge barrages, no phantom progress');
run('Game.startStage(25);Game.camX=400;Game.updateHazards(1/60)');
assert.equal(run('Game.hazards.filter(h=>h.k==="roadblock"&&!h.dead).length'),2);
assert.equal(run('Game.convoy.hp < 100'),true);
assert.equal(run('Game.roadObjective.value'),0);
console.log('OK: missed barrage damages convoy, does not advance objective');
run('Game.startStage(26);Game.roadProgress(9,"Vagues","wave");');
assert.equal(run('Game.roadObjective.value'),0);
run('Game.startRoadRepair();');
assert.equal(run('Game.convoy.event.k'),'repair');
assert.equal(run('Game.enemies.length'),2);
// Repair freezes while saboteurs are near Carly.
run('Game.enemies[0].x=Game.convoy.event.x;Game.enemies[0].z=Game.convoy.event.z;Game.enemies[1].dying=true;Game.updateConvoy(1);');
assert.equal(run('Game.convoy.event.progress'),0);
run('Game.enemies=[];for(let t=0;t<8;t++)Game.updateConvoy(1);');
assert.equal(run('Game.roadObjective.value'),1);
assert.equal(run('Game.convoy.event'),null);
run('Game.startRoadRepair();Game.enemies=[];for(let t=0;t<8;t++)Game.updateConvoy(1);');
assert.equal(run('Game.roadObjective.done'),true);
console.log('OK: Carly repair combat, visible progress and two real successes');
run('Game.startStage(26);Game.wave={list:[],spawned:0,spawnT:0,active:true};Game.enemies=[];Game.updateWaves(1/60);');
assert.equal(run('Game.convoy.event.k'),'repair','a completed wave must spawn an actual repair');
assert.equal(run('Game.enemies.length'),2,'ambush attackers accompany Carly');
run('Game.updateWaves(1/60);');
assert.equal(run('Game.wave'),null,'no overlapping wave while Carly repairs');
// Timeout should damage the convoy and let normal progression resume.
run('Game.convoy.event.t=0.1;Game.enemies[0].x=Game.convoy.event.x;Game.enemies[0].z=Game.convoy.event.z;Game.updateConvoy(1);');
assert.equal(run('Game.convoy.event'),null);
assert.equal(run('Game.convoy.hp < 100'),true);
console.log('OK: wave-to-repair integration, ambush and retryable timeout');
run('Game.startStage(28);Game.roadProgress(2,"Vagues","wave");');
assert.equal(run('Game.roadObjective.value'),0);
run('Game.startStage(29);Game.roadProgress(100,"Vagues","wave");');
assert.equal(run('Game.roadObjective.value'),0);
console.log('OK: Kamina and Lubumbashi objectives remain correctly gated');
// Drawing paths against a minimal Canvas2D test-double (not a pixel-perfect browser test).
const calls=[];const dummy=new Proxy({},{get(t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop(){}});return (...args)=>{calls.push(String(k));};},set(t,k,v){t[k]=v;return true;}});
ctx.fakeCtx=dummy;
run(`Game.startStage(25); R.t=2; R.LW=400; R.roadBlock(fakeCtx,Game.hazards.filter(h=>h.k==='roadblock')[0],0,350);
      R.convoyEscort(fakeCtx,Game,0,350);Game.startRoadRepair();R.roadRepair(fakeCtx,Game.convoy.event,0,350);`);
assert(calls.includes('roundRect') && calls.includes('arc') && calls.includes('fillRect'));
console.log('OK: vector fallback drawing methods can execute');
for(let i=0;i<30;i++) run(`Game.startStage(${i});for(let j=0;j<60;j++) Game.step(1/60)`);
console.log('PASS: V26.4 gameplay/regression, 30 stages × 60 ticks');
