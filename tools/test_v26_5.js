/** V26.5: neutralité COUP/RAMASSER, sprint, entrées PC/tactile/manette, sans matériel réel. */
'use strict';
const assert = require('assert'), fs = require('fs'), vm = require('vm');
const ctx = vm.createContext({ console, Math });
vm.runInContext(`
function mulberry32(seed){let t=seed>>>0;return function(){t=(t+0x6d2b79f5)>>>0;let v=t;v=Math.imul(v^v>>>15,v|1);v^=v+Math.imul(v^v>>>7,v|61);return ((v^v>>>14)>>>0)/4294967296;}};
const rand=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a),pick=a=>a[0],randi=(a,b)=>Math.floor(rand(a,b+1));
const BAND=74, Settings={diff:1,gspeed:100,fx:0,heart:0,hold:1,autorun:1,assist:0,parryWin:1};
const Input={source:'keys',players:[{mx:0,my:0,atk:false,pressed:{}},{mx:0,my:0,atk:false,pressed:{}}]};
const Sound={sfx:new Proxy({}, {get(){return ()=>{};}}),setEnv(){},at(){},setIntensity(){},setLowHp(){},playMusic(){}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sign=v=>v<0?-1:1;
const approach=(a,b,d)=>a<b?Math.min(a+d,b):Math.max(a-d,b);
const lerp=(a,b,t)=>a+(b-a)*t,easeOut=t=>1-Math.pow(1-t,3),haptic=()=>{};
`, ctx);
for(const f of ['js/data.js','js/rig.js','js/game.js']) vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
const run=s=>vm.runInContext(s,ctx);
function reset() { run('Game.startStage(0); Game.enemies=[]; {const p=Game.players[0];p.state="idle";p.y=0;p.vy=0;p.move=null;p.inv=0;p.running=false;p.weapon=null;p.x=100;p.z=35;p.interactT=0;}'); }
reset();
run(`Game.items=[{id:9901,kind:'weapon',sub:'pipe',x:100,z:35,y:0,remove:false}];
  Game.updatePlayer(Game.players[0],{mx:0,my:0,atk:true,pressed:{atk:true,interact:false}},1/60);`);
assert.equal(run('Game.players[0].state'),'attack','COUP should attack beside a pipe');
assert.equal(run('Game.players[0].weapon'),null);
assert.equal(run('Game.items[0].remove'),false);
console.log('OK: COUP attacks next to a weapon; no unintended pickup');
reset();
run(`Game.items=[
  {id:9911,kind:'weapon',sub:'pipe',x:110,z:35,y:0,remove:false},
  {id:9912,kind:'weapon',sub:'knife',x:101,z:35,y:0,remove:false}];
  Game.updatePlayer(Game.players[0],{mx:0,my:0,atk:false,pressed:{interact:true}},1/60);`);
assert.equal(run('Game.players[0].weapon.kind'),'knife','nearest item selected regardless of iteration order');
assert.equal(run('Game.items[0].remove'),false);
assert.equal(run('Game.items[1].remove'),true);
run('Game.updatePlayer(Game.players[0],{mx:0,my:0,atk:false,pressed:{interact:true}},1/60)');
assert.equal(run('Game.items[0].remove'),false,'holding interact must not pick a second item');
console.log('OK: nearest weapon selected, no double pickup');
reset();
run(`{const p=Game.players[0];p.running=true;p.face=1;p.holdT=2;p.vx=175;
  Game.updatePlayer(p,{mx:-1,my:0,dtap:false,atk:false,pressed:{}},1/60);}`);
assert.equal(run('Game.players[0].running'),false,'reverse direction must cancel sprint');
assert(Math.abs(run('Game.players[0].vx')) < 175,'reverse starts at walk speed');
assert.equal(run('Game.players[0].face'),-1);
for(let i=0;i<26;i++)run('Game.updatePlayer(Game.players[0],{mx:-1,my:0,dtap:false,atk:false,pressed:{}},1/60);');
assert.equal(run('Game.players[0].running'),true,'holding reverse direction should re-enable autorun');
console.log('OK: reverse sprint -> walk -> new sprint after hold');
reset();
run(`{const p=Game.players[0];p.running=false;p.face=1;
  Game.updatePlayer(p,{mx:1,my:0,dtap:true,atk:false,pressed:{}},1/60);}`);
assert.equal(run('Game.players[0].running'),true,'double tap still starts sprint');
console.log('OK: double-tap sprint preserved');
// Contrôles: DOM test double (sans navigateur réel), vérifie les mappings, les edges et la remise à zéro.
const listeners={}; const fakeWindow={addEventListener:(name,fn)=>{(listeners[name] ||= []).push(fn)},localStorage:{getItem:()=>null,setItem:()=>{}},matchMedia:()=>({matches:false})};
let gamepads=[];const inpCtx=vm.createContext({console,Math,window:fakeWindow,location:{protocol:'file:',search:''},matchMedia:()=>({matches:false}),navigator:{hardwareConcurrency:8,deviceMemory:8,getGamepads:()=>gamepads}});
vm.runInContext(fs.readFileSync('js/core.js','utf8'),inpCtx,{filename:'core.js'});
const state=s=>vm.runInContext(s,inpCtx);
function key(k,down){for(const fn of (listeners[down?'keydown':'keyup']||[]))fn({code:k,repeat:false,preventDefault(){}});}
key('KeyE',true);state('Input.poll(1)');assert.equal(state('Input.players[0].pressed.interact'),true);
state('Input.poll(1.02)');assert.equal(state('Input.players[0].pressed.interact'),false);
key('KeyE',false);state('Input.poll(1.03)');
state('Input.coop=true');key('KeyN',true);state('Input.poll(1.1)');assert.equal(state('Input.players[1].pressed.interact'),true);
key('KeyN',false);state('Input.poll(1.11)');state('Input.coop=false');
state('Input.touch.interact=true');state('Input.poll(1.2)');assert.equal(state('Input.players[0].pressed.interact'),true);
state('Input.touch.interact=false');state('Input.poll(1.22)');
// Gamepad button 8 (View/Share/Select) only: no attack.
gamepads=[{connected:true,axes:[0,0],buttons:Array.from({length:16},(_,i)=>({pressed:i===8,value:i===8?1:0}))}];
state('Input.poll(1.3)');assert.equal(state('Input.players[0].pressed.interact'),true);
assert.equal(state('Input.players[0].pressed.atk'),false);
for(const fn of listeners.blur||[])fn();
assert.equal(state('Input.players[0].prev.interact'),false);
console.log('OK: J1/J2 keyboard, touch, gamepad View/Share, blur reset');
console.log('PASS: V26.5 game input and pickup regression tests');
