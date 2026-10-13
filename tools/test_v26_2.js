/** GHOSTLINK V26.2 — tests du stockage progressif avec legacy et sélecteur de stage. */
'use strict';
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const disk = new Map();
disk.set('v12.progress', JSON.stringify({ranks:{gombe:'A', nsele:'C'}, unlocked:24, roadUnlocked:0, best:76500, seenIntro:true}));
const localStorage = { getItem:k => disk.has(k)?disk.get(k):null, setItem:(k,v) => disk.set(k,v) };
function makeContext(){
 const sandbox = {console, Math, JSON, Number, Array, Object, Set,
   location:{search:''}, navigator:{hardwareConcurrency:8,deviceMemory:8,maxTouchPoints:0},
   window:{localStorage,addEventListener(){},matchMedia(){return {matches:false}}},
   matchMedia(){return {matches:false}}};
 const c=vm.createContext(sandbox);
 for(const f of ['js/core.js','js/data.js','js/progression.js']) vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
 return {c,run:js=>vm.runInContext(js,c)};
}
const {run}=makeContext();
assert.equal(run('Progress.unlocked'),24);
assert.equal(run('Records.VERSION'),3);
assert.equal(run('Records.get("gombe").bestRank'),'A');
assert.equal(run('Records.get("gombe").bestScore'),null,'ne pas fabriquer un score historique');
assert.equal(run('Records.get("nsele").bestRank'),'C');
assert.equal(run('Records.summary().clearedMain'),2);
assert.equal(run('Records.get("unlisted")'),null);
console.log('OK: migration conservatrice V12 -> Records V3');

run('Records.start("nsele")');
let rec=run(`Records.clear('nsele',{runId:'play1',rank:'B',score:18000,timeMs:92000,damageTaken:0,combo:13})`);
assert.equal(rec.record.bestRank,'B');
assert.equal(rec.record.bestScore,18000);
assert.equal(rec.record.bestTimeMs,92000);
assert.equal(rec.record.attempts,1);
assert(rec.medalsEarned.includes('NO_DAMAGE'));
assert(rec.medalsEarned.includes('SPEEDRUN'));
assert(rec.medalsEarned.includes('COMBO_MASTER'));
assert(rec.medalsEarned.includes('PERFECT_CLEAR'));
assert.equal(run(`Records.clear('nsele',{runId:'play1',rank:'S',score:21000,timeMs:81000,damageTaken:0,combo:20}).duplicate`), true);
assert.equal(run('Records.get("nsele").clears'),1);
console.log('OK: records et médailles uniquement sur clear explicite; anti-doublon');

run('Records.start("nsele")');
rec=run(`Records.clear('nsele',{runId:'play2',rank:'D',score:9000,timeMs:310000,damageTaken:50,combo:2})`);
assert.equal(rec.record.bestRank,'B');assert.equal(rec.record.bestScore,18000);
assert.equal(rec.record.bestTimeMs,92000);assert.equal(rec.record.attempts,2);
assert.equal(rec.record.clears,2);assert.equal(rec.record.minDamage,0);
console.log('OK: performances plus faibles ne remplacent pas les records');

run('Records.start("r2k_base")');
rec=run(`Records.clear('r2k_base',{runId:'road1',rank:'A',score:22000,timeMs:230000,damageTaken:4,combo:11,convoyPct:82,roadObjectiveDone:true})`);
assert(rec.medalsEarned.includes('CONVOY_75'));
assert(rec.medalsEarned.includes('ROAD_OBJECTIVE'));
assert(!rec.medalsEarned.includes('PERFECT_CLEAR'));
assert.equal(rec.record.bestConvoyPct,82);
assert.equal(run('Records.summary().clearedRoad'),1);
console.log('OK: médailles DLC et intégrité du convoi');

const again=makeContext();
assert.equal(again.run('Records.get("nsele").attempts'),2);
assert.equal(again.run('Records.get("r2k_base").bestConvoyPct'),82);
assert.equal(again.run('Progress.best'),76500);
assert.equal(JSON.parse(disk.get('v12.progress')).seenIntro,true);
assert(disk.has('v12.recordsV3'));
console.log('OK: persistance après rechargement, clé historique intacte');

assert.equal(again.run(`Records.clear('__proto__',{runId:'evil'});`),null);
assert.equal(again.run(`Records.clear('nsele',{runId:'bad',rank:'HACK',score:NaN,timeMs:-50,damageTaken:Infinity,combo:-2})`),null);
console.log('OK: identifiants et valeurs invalides filtrés');

const bundle=run('Records.exportData()');
assert.equal(bundle.kind,'GHOSTLINK_SAVE');
assert.equal(bundle.records.version,3);
assert.equal(bundle.progress.ranks.gombe,'A');
const before=disk.get('v12.recordsV3');
assert.throws(()=>run('Records.mergeSave({kind:"HACK",version:3})'),/non reconnu/);
assert.equal(disk.get('v12.recordsV3'),before,'rejected import must not touch current records');
const savedCopy=JSON.stringify(bundle);
run('Records.start("kananga_crossroads")');
let merged=run(`Records.mergeSave(${savedCopy})`);
assert.equal(merged.clearedMain,2);
assert.equal(run('Records.get("nsele").bestScore'),18000);
assert.equal(run('Records.get("nsele").clears'),2,'import must not double historic wins');
assert.equal(run('Records.get("kananga_crossroads").attempts'),1);
assert.equal(run('Progress.unlocked'),24);
console.log('OK: export + fusion non destructive / import répété');
console.log('PASS: V26.2 progression, sauvegarde et migration');
