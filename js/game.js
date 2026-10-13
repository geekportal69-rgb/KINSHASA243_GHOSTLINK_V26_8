/* =========================================================
   GHOSTLINK V12 — game.js
   Simulation du beat'em up (refonte V12, mécaniques inspirées des beat'em up modernes) :
   combos avec annulations, attaque arrière, blitz, spécial aérien, saisies (genou,
   projection, saut par-dessus), lancer d'arme, points de combo à encaisser, vies bonus,
   ennemis qui saisissent, boss à barres multiples et final en deux phases.
   ========================================================= */
'use strict';

// V12.1 : déplacements plus rapides et nerveux (marche +35 %, profondeur +30 %,
// saut plus sec, attaques des héros 15 % plus rapides, course automatique).
const GRAV = 920, WALK = 100, ZWALK = 60, PLAYER_TEMPO = 1.15, JUMP_GRAV = 1.38, AUTO_RUN = 0.38;
// V12.2 : mobilité inspirée d'Ori 2 — double saut (salto) et dash (DOS + direction), au sol et en l'air.
const JUMP_K = 1.17, DASH_SPEED = 340, DASH_T = 0.2, DJUMP_K = 0.86;
// V12.3 : parade (fenêtre en secondes : désactivée / normale / large), recharge du dash
const PARRY_WIN = [0, 0.13, 0.22], DASH_CD = 0.3;
// V26.6 : anticipation d'un saut à l'atterrissage (pas de plateformes dans les niveaux actuels).
const LANDING_JUMP_BUFFER = 0.18, LANDING_JUMP_HEIGHT = 18;
/* V12.4 — physique : masse (recul et projection divisés selon le poids), adhérence du sol */
const MASS = { voyou: 1, voyou2: 1, kuluna: 0.9, boxeuse: 0.88, molosse: 1.5, garde: 1.2, sapeur: 0.95, motard: 1.15, drone: 0.7, kabongo: 1, nzinga: 0.9, makasi: 1.25 };
const FLOOR_GRIP = { asphalt: 7.5, tiles: 6.5, metal: 6, planks: 8, dirt: 9.5, sand: 11, grid: 6.5, rails: 7.5 };
function massOf(f) { if (f.kind === 'boss') return 1.25 + Math.max(0, (f.build || 1) - 1) * 1.5; return MASS[f.type] || MASS[f.hero && f.hero.id] || 1; }
const ENV_OF = { ngiri: 'hall', gombe: 'hall', lemba: 'hall', matete: 'hall', ngaliema: 'hall', barumbu: 'tunnel', limete: 'tunnel' };
const DIFF = [ // facile, normal, difficile, mania
  { edmg: 0.6, ehp: 0.8, tokens: 1, cd: 1.35, lives: 5, maxOn: 3 },
  { edmg: 1, ehp: 1, tokens: 2, cd: 1, lives: 3, maxOn: 4 },
  { edmg: 1.3, ehp: 1.15, tokens: 3, cd: 0.8, lives: 2, maxOn: 5 },
  { edmg: 1.7, ehp: 1.35, tokens: 4, cd: 0.62, lives: 1, maxOn: 6 },
];
let UID = 1;

// retire en place les éléments marqués (évite de recréer les tableaux à chaque image)
function compact(a, flag) { let w = 0; for (let i = 0; i < a.length; i++) if (!a[i][flag]) a[w++] = a[i]; a.length = w; }

const FX = {
  list: [], max: 520,
  // V12.3 : au-delà du plafond on remplace la plus vieille particule (pas de shift() en O(n))
  add(p) { p.t = 0; if (this.list.length >= this.max) { this.list[this.old = ((this.old || 0) + 1) % this.max] = p; return p; } this.list.push(p); return p; },
  spark(x, z, y, dir, big, col) {
    const q = Settings.fx;
    this.add({ k: 'spark', x, z, y, life: big ? 0.2 : 0.14, s: big ? 1.6 : 1, col: col || '#ffd34d', rot: rand(6.28), dir });
    const n = (big ? 10 : 5) * (q === 0 ? 0.4 : q === 1 ? 0.7 : 1);
    for (let i = 0; i < n; i++) {
      const a = rand(-1.1, 1.1) + (dir < 0 ? Math.PI : 0);
      const sp = rand(90, big ? 300 : 200);
      this.add({ k: 'shard', x, z, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.8 + 40, life: rand(0.15, 0.35), col: i % 2 ? '#fff' : col || '#ffd34d' });
    }
    if (big) this.add({ k: 'ring', x, z, y, life: 0.25, r0: 4, r1: 30, col: '#ffffff' });
  },
  dust(x, z, n, sz) { for (let i = 0; i < n; i++) this.add({ k: 'dust', x: x + rand(-8, 8), z: z + rand(-2, 2), y: rand(0, 4), vx: rand(-50, 50), vy: rand(10, 40), life: rand(0.35, 0.7), r: rand(3, 6) * (sz || 1) }); },
  debris(x, z, y, col, n) { for (let i = 0; i < n; i++) this.add({ k: 'debris', x, z, y: y + rand(0, 10), vx: rand(-140, 140), vy: rand(80, 260), life: rand(0.6, 1.1), col: col, w: rand(2, 5), h: rand(1.5, 4), rot: rand(6.28), vr: rand(-12, 12) }); },
  ghost(f) { this.add({ k: 'ghost', x: f.x, z: f.z, y: f.y, life: 0.22, face: f.face, pose: f._sk && f._frame ? null : f.pose.slice(), look: f.look, build: f.build, col: f.trail || '#38e6ff', hero: f._sk && f._frame ? f._sk : null, frame: f._frame }); },
  text(x, z, y, str, col) { this.add({ k: 'text', x, z, y, vy: 40, life: 0.8, str, col: col || '#fff' }); },
  shock(x, z, col) { this.add({ k: 'shock', x, z, y: 0, life: 0.45, r0: 6, r1: 60, col: col || '#ffd34d' }); },
  zap(x, z, y) { this.add({ k: 'zap', x, z, y, life: 0.25 }); },
  bolt(x, z) { this.add({ k: 'bolt', x, z, y: 0, life: 0.35 }); },
  update(dt) {
    // compactage en place : une seule passe, aucun splice
    const L = this.list; let w = 0;
    for (let i = 0; i < L.length; i++) {
      const p = L[i];
      p.t += dt;
      if (p.t >= p.life) continue;
      L[w++] = p;
      if (p.k === 'shard' || p.k === 'debris') { p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= GRAV * 0.8 * dt; if (p.y < 0) { p.y = 0; p.vy *= -0.3; p.vx *= 0.6; } if (p.vr) p.rot += p.vr * dt; }
      else if (p.k === 'dust') { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; }
      else if (p.k === 'text') { p.y += p.vy * dt; p.vy *= 0.94; }
    }
    L.length = w;
  },
};

const Game = {
  state: 'menu', stageIdx: 0, coop: false, heroSel: ['kabongo', 'nzinga'],
  players: [], enemies: [], items: [], props: [], projs: [], hazards: [],
  camX: 0, camMin: 0, lockR: Infinity, LW: 300, LH: 450, stageLen: 2000,
  t: 0, hitstop: 0, slow: 0, shake: 0, flash: 0, flashCol: '#fff',
  waves: [], waveIdx: 0, wave: null, go: 0, boss: null, bossPhase: 'none',
  stats: null, events: [], focus: null, focusT: 0, starFx: null, lightning: 0,

  diff() { return DIFF[Settings.diff] || DIFF[1]; },
  // adhérence : un sol mouillé (pluie) fait glisser plus loin
  grip() { const S = this.stage; if (!S) return 8; return (FLOOR_GRIP[S.floor] || 8) * (S.fx === 'rain' ? 0.72 : 1); },
  emit(type, data) { this.events.push(Object.assign({ type }, data || {})); },

  /* ---------------- Création des combattants ---------------- */
  makeFighter(o) {
    return Object.assign({
      id: UID++, x: 0, z: 30, y: 0, vx: 0, vz: 0, vy: 0, face: 1, state: 'idle', st: 0, move: null, mt: 0,
      hitSet: new Set(), multiT: 0, comboIdx: 0, comboT: 0, lastHit: false, buffer: null, bufT: 0, inv: 0, flash: 0,
      pose: POSES.idle.slice(), tail: 0, weapon: null, grabbing: null, grabber: null, grabT: 0, grabHits: 0, juggle: 0,
      bounced: false, dying: false, remove: false, alpha: 1, build: 1, w: 9, h: 64, power: 1, speed: 1, rec: 0,
      airUsed: false, airSpe: false, comboPts: 0, mash: 0, running: false, trail: null, ghostT: 0, walkPh: 0, leaped: false, armorNow: false, zap: 0,
      chargeT: 0, chargeReady: false, chargedMove: false, _chargePending: false, chargeFxT: 0, interactT: 0,
    }, o);
  },
  makePlayer(idx, heroId) {
    const H = HEROES[heroId];
    const p = this.makeFighter({
      kind: 'player', team: 0, idx, hero: H, look: H.look, name: H.name, hp: H.hp, maxHp: H.hp, power: H.power, speed: H.speed,
      build: H.look.build || 1, w: 9 * (H.look.w || 1), lives: this.diff().lives, stars: 1, score: 0, combo: 0, comboTimer: 0, maxCombo: 0, nextLife: 50000,
      x: this.camX + 60 + idx * 30, z: 34 + idx * 20, y: 140, vy: 0, state: 'jump', airUsed: true, rim: H.color,
    });
    return p;
  },
  makeEnemy(type, x, z, opt) {
    const D = ENEMIES[type], diff = this.diff();
    const lk = Object.assign({ skin: pick(['#6b3f26', '#5a321d', '#7a4a2e', '#4f2c18']), shoe: '#1d1d22' }, pick(D.look || [{}]));
    const e = this.makeFighter({
      kind: 'enemy', team: 1, type, def: D, look: lk, name: pick(NAMES[type] || ['?']),
      hp: Math.round(D.hp * diff.ehp), maxHp: Math.round(D.hp * diff.ehp), speed: D.speed * 1.15 / WALK, build: D.build || 1,
      w: 9 * (lk.w || 1), x, z, face: -1, ai: { cd: rand(0.4, 1.2), off: rand(-1, 1), side: 0, guard: 0, think: 0, token: false, tokenT: 0, pat: 0, dodgeCd: 0 },
      weapon: D.weapon || null, fly: !!D.fly, power: diff.edmg, shield: !!D.shield,
    });
    if (e.fly) { e.y = 34; e.h = 18; e.w = 12; }
    if (opt && opt.drop) { e.y = 90; e.state = 'jump'; }
    return e;
  },
  makeBoss(id, x, z) {
    const B = BOSSES[id], diff = this.diff();
    const hp = Math.round(B.hp * diff.ehp * (this.coop ? 1.5 : 1));
    if (B.colossus) {
      return this.makeFighter({ kind: 'boss', team: 1, colossus: true, bossId: id, def: B, name: B.name, hp, maxHp: hp, x, z: BAND / 2, w: 50, h: 120, face: -1, state: 'intro', ai: { cd: 2.5, pat: 0, stunT: 0, attack: null } });
    }
    const lk = Object.assign({ skin: '#5a321d', shoe: '#1d1d22' }, B.look);
    return this.makeFighter({
      kind: 'boss', team: 1, bossId: id, def: B, look: lk, name: B.name, hp, maxHp: hp, speed: B.speed / WALK, build: (B.build || 1) * 1.06,
      w: 10 * (lk.w || 1), x, z, face: -1, weapon: B.weapon || null, power: diff.edmg, shield: !!B.shield,
      ai: { cd: 1.2, off: 0, side: 0, guard: 0, think: 0, summoned: 0 }, rim: '#ff3b5c',
    });
  },

  /* ---------------- Niveau ---------------- */
  startStage(idx, opts) {
    const S = Object.assign({}, STAGES[idx]);
    this.events.length = 0; // V26.1 : ne pas hériter des notifications de l'étape précédente
    this.stage = S; this.stageIdx = idx; this.phase2 = false; this.zoom = 0;
    this.enemies = []; this.items = []; this.props = []; this.projs = []; this.hazards = []; FX.list.length = 0;
    this._interpLists = null; // nouveau niveau = nouveaux tableaux à interpoler
    this.camX = 0; this.camMin = 0; this.lockR = Infinity; this.t = 0; this.hitstop = 0; this.slow = 0; this.shake = 0; this.flash = 0;
    this.boss = null; this.bossPhase = 'none'; this.go = 0; this._pendingClear = false; this.garageChoices = null; this.focus = null; this.starFx = null; this.lightning = 0;
    const segW = 340;
    this.waves = S.waves.map((list, i) => ({ trig: 250 + i * segW, list: list.slice(), spawned: 0, done: false, active: false, spawnT: 0 }));
    this.bossTrig = 250 + S.waves.length * segW + 80;
    this.stageLen = this.bossTrig + Math.max(this.LW, 420) + 40;
    this.waveIdx = 0; this.wave = null;
    // objets cassables
    const r = mulberry32(idx * 31 + 7);
    const kinds = { asphalt: ['trash', 'barrel'], dirt: ['crate', 'basket'], planks: ['crate', 'drum'], tiles: ['speaker', 'crate'], rails: ['drum', 'crate'], metal: ['drum', 'crate'], grid: ['server', 'server'] }[S.floor] || ['crate', 'barrel'];
    for (let i = 0; i <= S.waves.length; i++) {
      const n = 1 + (r() < 0.6 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const x = 150 + i * segW + r() * 160;
        const roll = r();
        const content = roll < 0.3 ? ['food', 'brochette'] : roll < 0.48 ? ['food', 'tangawisi'] : roll < 0.7 ? ['money', r() < 0.7 ? 'billet' : 'liasse'] : roll < 0.86 ? ['weapon', r() < 0.55 ? 'pipe' : 'bottle'] : roll < 0.95 ? ['food', 'poulet'] : ['star', 'star'];
        this.props.push({ id: UID++, type: kinds[(k + i) % 2], x, z: 6 + r() * (BAND - 12), content, hp: 1, flash: 0 });
      }
    }
    // joueurs
    const keep = opts && opts.keep;
    const prev = this.players;
    this.players = [];
    const n = this.coop ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const p = this.makePlayer(i, this.heroSel[i]);
      if (keep && prev[i]) { p.lives = prev[i].lives; p.score = prev[i].score; p.nextLife = prev[i].nextLife || 50000; p.stars = Math.max(1, prev[i].stars); p.out = prev[i].out && prev[i].lives <= 0 ? false : false; }
      this.players.push(p);
    }
    // V26.4 — trois barrages physiques à Kenge, placés dans les secteurs existants.
    // Un barrage contourné pénalise le convoi; seuls ceux détruits comptent pour l'objectif.
    if (S.id === 'kwango_gate') {
      for (let i = 0; i < 3; i++) this.hazards.push({
        k: 'roadblock', id: UID++, x: 300 + i * segW, z: BAND * 0.48 + (i % 2 ? 10 : -10),
        hp: 3, maxHp: 3, flash: 0, dead: false,
      });
    }
    if (S.hazard === 'train') this.hazards.push({ k: 'train', t: 9, phase: 'idle', x: 0 });
    if (S.hazard === 'lightning') this.hazards.push({ k: 'lightning', t: 6, phase: 'idle' });
    Sound.setEnv && Sound.setEnv(ENV_OF[S.id] || 'rue');
    this.stats = { time: 0, maxCombo: 0, dmg: 0, kills: 0, parries: 0, perfects: 0, startScore: this.players.reduce((a, p) => a + p.score, 0) };
    if (S.dlcRoad) {
      if (idx === 24 && !keep) this.roadRun = null;
      const save = this.roadRun || { convoy: { hp: 100, max: 100, emergency: false, event: null, repair: 0, nextT: 9, saved: 0 }, upgrades: [] };
      this.roadRun = save; this.convoy = save.convoy; this.convoy.event = null; this.convoy.nextT = 9; this.carly = { name: 'Carly Dokota', active: true };
      this.roadObjective = { id: S.roadGoal || 'defend', label: S.roadGoalLabel || 'Protégez le convoi', need: S.roadGoalNeed || 1, value: 0, done: false };
      this.emit('convoy', { hp: this.convoy.hp, max: this.convoy.max }); this.emit('roadgoal', this.roadObjective);
    } else { this.convoy = null; this.carly = null; this.roadObjective = null; }
    this.roadSurface = S.surface || 'asphalt';
    this.state = 'play';
  },

  /* ---------------- Boucle ---------------- */
  step(dt) {
    if (this.state !== 'play') return;
    this.events.length = 0;
    // arrêt sur image et ralenti
    if (this.hitstop > 0) {
      // V26.6 : pendant le gel d'impact la simulation ne bouge pas, mais les
      // edges du clavier/tactile/manette doivent être conservés jusqu'à la reprise.
      // Sans ceci les coups courts tombant sur un hitstop disparaissaient.
      for (const p of this.players) this.captureHitstopInput(p, Input.players[p.idx]);
      this.hitstop = Math.max(0, this.hitstop - dt);
      this.updateTimers(dt * 0.25);
      return;
    }
    let sdt = dt * ((Settings.gspeed || 100) / 100);
    if (this.slow > 0) { this.slow -= dt; sdt *= 0.35; }
    if (Sound.setView) Sound.setView(this.camX + this.LW / 2, this.LW);
    this.t += sdt; this.stats.time += dt;
    for (const p of this.players) this.updatePlayer(p, Input.players[p.idx], sdt);
    for (const e of this.enemies) e.colossus ? this.updateColossus(e, sdt) : this.updateEnemy(e, sdt);
    this.separate(sdt);
    this.updateProjs(sdt);
    this.updateItems(sdt);
    this.updateHazards(sdt);
    this.updateRoadSurface(sdt);
    this.updateConvoy(sdt);
    this.updateWaves(sdt);
    this.updateCamera(sdt);
    FX.update(sdt);
    this.updateTimers(sdt);
    compact(this.enemies, 'remove'); compact(this.props, 'remove'); compact(this.items, 'remove'); compact(this.hazards, 'dead');
    // musique dynamique : intensité selon le combat, filtre et cœur à faible vie
    if (Sound.setIntensity) {
      let n = 0; for (const e of this.enemies) if (!e.dying) n++;
      Sound.setIntensity(this.bossPhase === 'fight' ? 1 : n ? Math.min(1, 0.62 + n * 0.1) : 0.3);
      const p0 = this.players[0]; const r = p0 && !p0.out ? p0.hp / p0.maxHp : 1;
      Sound.setLowHp(r < 0.25 && r > 0 ? (0.25 - r) / 0.25 * 0.8 + 0.2 : 0);
      Sound.at(null);
    }
    // fin de partie ?
    if (this.players.every((p) => p.out)) { this.state = 'over'; this.emit('gameover'); }
  },
  captureHitstopInput(p, inp) {
    if (!p || p.out || p.dying || !inp || !inp.pressed) return;
    if (p.state === 'down' || p.state === 'getup' || p.state === 'dead' || p.state === 'respawn' || p.state === 'star') return;
    const e = inp.pressed;
    if (e.interact) p.interactT = Math.max(p.interactT || 0, 0.18);
    // Priorité identique à updatePlayer : dash > arrière > saut > spécial > coup.
    // En mode charge manuelle, maintenir COUP ne doit PAS créer un coup instantané.
    let b = null, t = 0;
    if (e.atk && (Settings.hold || p.weapon || p.y > 0 || p.state === 'attack' || p.dashT > 0)) { b = 'atk'; t = 0.22; }
    if (e.spe) { b = 'spe'; t = 0.20; }
    if (e.jump) { b = 'jump'; t = LANDING_JUMP_BUFFER; }
    if (e.back) { b = 'back'; t = 0.20; }
    if (e.dash) { b = 'dash'; t = 0.16; }
    if (b) { p.buffer = b; p.bufT = Math.max(t, p.bufT || 0); }
  },
  updateTimers(dt) {
    this.shake = Math.max(0, this.shake - dt * 30);
    this.flash = Math.max(0, this.flash - dt * 3);
    this.lightning = Math.max(0, this.lightning - dt * 2.5);
    this.zoom = Math.max(0, (this.zoom || 0) - dt * 0.35);
    if (this.focusT > 0) this.focusT -= dt;
    // Évite une allocation de tableau à chaque pas de simulation.
    for (const f of this.players) if (f.flash > 0) f.flash -= dt;
    for (const f of this.enemies) if (f.flash > 0) f.flash -= dt;
  },

  /* ---------------- Physique commune ---------------- */
  bounds(f) {
    const L = this.camX + 14;
    let Rr = this.camX + this.LW - 14;
    if (this.boss && this.boss.colossus && !this.boss.remove && f.kind === 'player') Rr = Math.min(Rr, this.boss.x - 30);
    if (f.kind === 'player' || f.state === 'thrown') {
      if (f.x < L) { f.x = L; if (f.state === 'thrown' && Math.abs(f.vx) > 120) this.wallBounce(f); }
      if (f.x > Rr) { f.x = Rr; if (f.state === 'thrown' && Math.abs(f.vx) > 120) this.wallBounce(f); }
    } else if (f.state === 'fall' && !f.wallB && Math.abs(f.vx) > 150 && (f.x < L || f.x > Rr)) {
      // rebond sur le bord de l'écran (SoR4) : l'ennemi projeté revient vers le joueur
      f.x = f.x < L ? L : Rr; f.wallB = true; this.wallBounce(f);
    } else { f.x = clamp(f.x, this.camX - 120, this.camX + this.LW + 120); }
    f.z = clamp(f.z, 0, BAND);
  },
  wallBounce(f) {
    const d = sign(f.vx);
    f.vx = -f.vx * 0.45; f.vy = Math.max(f.vy, 140); f.y = Math.max(f.y, 6);
    this.damage(f, 5, f.thrower || f.lastHitBy || null);
    if (f.hp <= 0 && !f.dying && f.kind !== 'player') { f.dying = true; this.onKill(f, f.thrower || f.lastHitBy); }
    Sound.sfx.punch(1.6); Sound.sfx.thud && Sound.sfx.thud(); this.shake = Math.max(this.shake, 5); this.kick(d * 4, 0);
    this.hitstop = Math.max(this.hitstop, 0.06); f.hshake = 0.14;
    FX.spark(f.x, f.z, f.y + 30, -d, true); FX.add({ k: 'shock', x: f.x, z: f.z, y: f.y + 30, life: 0.3, r0: 4, r1: 34, col: '#ffffff' });
    FX.debris(f.x, f.z, f.y + 30, '#bfb4a2', 5);
    FX.text(f.x, f.z, 70, 'MUR !', '#ffffff');
  },
  // séparation douce des corps : les ennemis ne se superposent plus, ils s'écartent surtout en profondeur
  separate(dt) {
    const E = this.enemies, n = E.length;
    for (let i = 0; i < n; i++) {
      const a = E[i]; if (a.fly || a.colossus || a.dying || a.state === 'grabbed' || a.state === 'egrab' || a.y > 4) continue;
      for (let j = i + 1; j < n; j++) {
        const b = E[j]; if (b.fly || b.colossus || b.dying || b.state === 'grabbed' || b.state === 'egrab' || b.y > 4) continue;
        const dx = b.x - a.x, dz = b.z - a.z, rx = (a.w + b.w) * 0.42, rz = 8;
        if (Math.abs(dx) >= rx || Math.abs(dz) >= rz) continue;
        const ox = (rx - Math.abs(dx)) / rx, oz = (rz - Math.abs(dz)) / rz, k = Math.min(ox, oz) * 130 * dt;
        const sx = dx ? sign(dx) : (i % 2 ? 1 : -1), sz = dz ? sign(dz) : (j % 2 ? 1 : -1);
        const ma = massOf(a), mb = massOf(b), wa = mb / (ma + mb), wb = ma / (ma + mb);
        a.x -= sx * k * 0.9 * wa; b.x += sx * k * 0.9 * wb; a.z -= sz * k * wa; b.z += sz * k * wb;
        a.z = clamp(a.z, 0, BAND); b.z = clamp(b.z, 0, BAND);
      }
    }
  },
  // secousse de caméra directionnelle (coup de poing = l'image part dans le sens du coup)
  kick(x, y) { this.kickX = (this.kickX || 0) + x; this.kickY = (this.kickY || 0) + y; },
  /* ---------- Interpolation de rendu (écrans 90 / 120 / 144 Hz) ----------
     La simulation tourne à pas fixe (60 Hz, déterministe). Avant chaque pas on mémorise
     les positions ; le rendu dessine un état interpolé entre les deux derniers pas,
     ce qui donne un mouvement parfaitement fluide quelle que soit la fréquence d'écran. */
  interpLists() {
    // La liste des groupes est stable entre deux niveaux, pas de tableau neuf par rendu.
    return this._interpLists || (this._interpLists = [this.players, this.enemies, this.projs, this.items, FX.list]);
  },
  savePrev() {
    this._pcam = this.camX;
    for (const L of this.interpLists()) for (const o of L) { o._px = o.x; o._py = o.y; o._pz = o.z; }
  },
  applyInterp(a) {
    if (!(a > 0 && a < 1)) return false;
    this._icam = this.camX; if (this._pcam != null) this.camX = lerp(this._pcam, this.camX, a);
    for (const L of this.interpLists()) for (const o of L) {
      if (o._px == null) continue;
      o._rx = o.x; o._ry = o.y; o._rz = o.z;
      o.x = lerp(o._px, o.x, a); o.y = lerp(o._py, o.y, a); o.z = lerp(o._pz, o.z, a);
    }
    return true;
  },
  restoreInterp() {
    this.camX = this._icam;
    for (const L of this.interpLists()) for (const o of L) { if (o._rx == null) continue; o.x = o._rx; o.y = o._ry; o.z = o._rz; o._rx = null; }
  },
  physics(f, dt) {
    f.x += f.vx * dt; f.z += f.vz * dt;
    if (f.hshake > 0) f.hshake -= dt;
    if (f.fly) return;
    if (f.y > 0 || f.vy > 0) {
      // gravité plus forte pour les sauts des héros : arc court et lisible ; jongles : chaque coup alourdit la cible
      let g = f.kind === 'player' && (f.state === 'jump' || f.state === 'attack' && f.move && f.move.air) ? GRAV * JUMP_GRAV : GRAV;
      if (f.state === 'fall' && f.juggle > 1) g *= 1 + Math.min(0.6, (f.juggle - 1) * 0.12);
      // apex plus « flottant » (Ori) : gravité réduite près du sommet du saut
      if (f.kind === 'player' && f.state === 'jump' && Math.abs(f.vy) < 55) g *= 0.6;
      f.vy -= g * dt; f.y += f.vy * dt;
      if (f.y <= 0) { f.y = 0; this.land(f); }
    }
  },
  land(f) {
    const s = f.state;
    if (f.kind === 'player') f.squash = 0.12;
    if (s === 'fall' || s === 'thrown') {
      if (!f.bounced && f.vy < -170) {
        f.bounced = true; f.vy = -f.vy * 0.32; f.y = 0.1; f.vx *= 0.6;
        Sound.sfx.thud(); FX.dust(f.x, f.z, 6, 1.2); this.shake = Math.max(this.shake, 2);
        if (s === 'thrown') f.state = 'fall';
        return;
      }
      // glissade au sol : on garde une partie de la vitesse, freinée par l'adhérence du revêtement
      f.vy = 0; f.vx *= 0.55; f.state = 'down'; f.st = f.dying ? 0.9 : f.kind === 'boss' ? 0.55 : 0.7; f.juggle = 0; f.wallB = false; f.domino = false;
      if (!f.bounced) { Sound.sfx.thud(); FX.dust(f.x, f.z, 5, 1); }
    } else if (s === 'jump' || (s === 'attack' && f.move && (f.move.air || f.move.leap))) {
      f.vy = 0; f.vx *= 0.3;
      if (s === 'attack' && f.move && f.move.quakeLand) { this.shake = 6; FX.shock(f.x, f.z); Sound.sfx.thud(); this.areaHit(f, f.x, f.z, 34, 12, { dmg: 10, kb: 120, launch: 200 }); }
      f.state = 'idle'; f.move = null; f.airUsed = false; f.airSpe = false; f.dj = false; f.airDash = false; f.djT = 0; Sound.sfx.land(); FX.dust(f.x, f.z, 3, 0.8);
    } else { f.vy = 0; }
  },

  // V25 récupérée du fichier .txt : friction propre aux tronçons du convoi.
  updateRoadSurface(dt) {
    if (!this.stage || !this.stage.dlcRoad) return;
    for (const p of this.players) {
      if (p.out) continue;
      if (this.roadSurface === 'mud') { p.vx *= Math.max(0, 1 - 0.72 * dt); p.vz *= Math.max(0, 1 - 0.72 * dt); }
      else if (this.roadSurface === 'oil') p.vx *= 1 + 0.08 * dt;
      else if (this.roadSurface === 'rain') p.vx *= 1 + 0.025 * dt;
      if (this.roadSurface !== 'asphalt' && Math.random() < dt * 2.2) FX.dust(p.x, p.z, 1, this.roadSurface === 'mud' ? 1.1 : 0.55);
    }
  },
  /* ---------------- Joueurs ---------------- */
  updatePlayer(p, inp, dt) {
    if (p.out) return;
    // L'interaction dispose de son propre tampon et ne remplace jamais un coup.
    p.interactT = inp.pressed.interact ? 0.18 : Math.max(0, (p.interactT || 0) - dt);
    Sound.at && Sound.at(p.x, p.z);
    p.inv = Math.max(0, p.inv - dt);
    if (p.parryT > 0) p.parryT -= dt;
    if (p.dashCd > 0) p.dashCd -= dt;
    if (p.perfectT > 0) p.perfectT -= dt;
    if (p.throwT > 0) p.throwT -= dt;
    p.idleT = p.state === 'idle' ? (p.idleT || 0) + dt : 0;
    p.squash = Math.max(0, (p.squash || 0) - dt);
    p.comboTimer -= dt;
    if (p.comboTimer <= 0 && p.combo > 0) {
      if (p.comboPts > 0) { this.addScore(p, p.comboPts); this.emit('combobank', { idx: p.idx, pts: p.comboPts, n: p.combo }); }
      p.combo = 0; p.comboPts = 0;
    }
    if (p.zap > 0) p.zap -= dt;
    p.st -= dt;
    const S = p.state;
    if (S === 'respawn') { p.y = Math.max(0, p.y + p.vy * dt); p.vy -= GRAV * dt * 0.5; if (p.y <= 0) { p.state = 'idle'; Sound.sfx.land(); FX.dust(p.x, p.z, 8, 1.2); this.shake = 3; } this.animate(p, dt); return; }
    if (S === 'dead') { if (p.st <= 0) this.respawnOrOut(p); this.animate(p, dt); return; }
    if (S === 'star') { this.updateStar(p, dt); this.animate(p, dt); return; }
    if (S === 'hurt' || S === 'block') { p.vx *= Math.max(0, 1 - this.grip() * dt); this.physics(p, dt); if (p.st <= 0) p.state = 'idle'; if (inp.pressed.spe && S === 'hurt') this.trySpecial(p, inp, true); this.bounds(p); this.animate(p, dt); return; }
    // récupération aérienne : SAUT pendant une chute = rétablissement (comme dans SoR4)
    if (S === 'fall' && !p.dying && p.y > 12 && p.vy < 60 && inp.pressed.jump) {
      p.state = 'jump'; p.vy = 150; p.vx = -p.face * 40; p.inv = Math.max(p.inv, 0.35); p.airUsed = true; p.airSpe = true;
      FX.text(p.x, p.z, 60, 'RÉTABLI', '#9ff4ff'); Sound.sfx.whoosh(false); this.animate(p, dt); return;
    }
    if (S === 'fall' || S === 'thrown') { this.physics(p, dt); this.bounds(p); this.animate(p, dt); return; }
    if (S === 'down') { if (p.st <= 0) { if (p.dying) { p.state = 'dead'; p.st = 0.9; } else { p.state = 'getup'; p.st = 0.32; p.inv = 0.9; } } this.animate(p, dt); return; }
    if (S === 'getup') { if (p.st <= 0) p.state = 'idle'; this.animate(p, dt); return; }
    if (S === 'grabbed') {
      const dirNow = inp.mx > 0.5 ? 1 : inp.mx < -0.5 ? -1 : 0;
      if (inp.pressed.atk || inp.pressed.jump || inp.pressed.back || (dirNow && dirNow !== p.mashDir)) p.mash++;
      p.mashDir = dirNow;
      const g = p.grabber;
      if (inp.pressed.spe) this.trySpecial(p, inp, true);
      else if (p.mash >= 7 || p.st <= 0 || !g || (g.state !== 'egrab' && g.state !== 'attack')) {
        if (g && g.state === 'egrab') { g.state = 'hurt'; g.st = 0.45; g.vx = -g.face * 60; g.grabbing = null; if (g.ai) g.ai.cd = 1; }
        p.state = 'idle'; p.grabber = null; p.inv = Math.max(p.inv, 0.35);
        if (p.mash >= 7) { FX.text(p.x, p.z, 50, 'LIBÉRÉ !', '#5dffb0'); Sound.sfx.whoosh(false); }
      }
      this.animate(p, dt); return;
    }

    // dash (Ori) : rapide, invulnérable, annulable en attaque de course ou en saut
    if (p.dashT > 0) {
      p.dashT -= dt;
      const k = clamp(p.dashT / DASH_T, 0, 1);
      p.vx = p.face * DASH_SPEED * (0.45 + 0.55 * k); p.vz = inp.my * ZWALK * 0.6;
      if (p.y > 0) p.vy = Math.max(p.vy, -20); // le dash aérien « plane » brièvement
      p._dg = (p._dg || 0) - dt; if (p._dg <= 0 && p._frame) { p._dg = 0.035; const t0 = p.trail; p.trail = p.hero.color; FX.ghost(p); p.trail = t0; }
      if (inp.pressed.atk) { p.dashT = 0; p.running = true; this.startMove(p, MOVES[p.hero.run]); this.animate(p, dt); return; }
      if (inp.pressed.jump && p.y <= 0) { p.dashT = 0; p.running = true; p.buffer = 'jump'; this.consumeBuffer(p, inp); this.animate(p, dt); return; }
      this.physics(p, dt); this.bounds(p);
      if (p.dashT <= 0) { p.dashCd = DASH_CD; p.state = p.y > 0 ? 'jump' : 'idle'; p.running = p.y <= 0 && Math.abs(inp.mx) > 0.5; }
      this.animate(p, dt); return;
    }
    p.djT = Math.max(0, (p.djT || 0) - dt);
    if (inp.pressed.star && p.stars > 0 && S !== 'attack') { this.startStar(p); return; }
    // V26.1 : deux modes qui ne se concurrencent pas.
    // Combo auto (défaut) : attaque immédiate + maintien enchaîné inchangé.
    // Combo auto OFF : maintien au sol à mains nues = charge, relâcher = frappe.
    // Les saisies, frappes aériennes et attaques armées restent immédiates.
    const manualCharge = !Settings.hold && !p.weapon && (S === 'idle' || S === 'walk') && p.y <= 0;
    if (inp.pressed.atk) {
      if (manualCharge) { p.chargeT = 0; p.chargeReady = false; p.chargeFxT = 0; }
      else {
        p.buffer = 'atk';
        // V26.7 : les coups lourds peuvent être mis en file plus tôt sans
        // exiger des appuis répétés. Le délai n'affecte pas l'auto-combo.
        p.bufT = S === 'attack' && p.hero.combat ? p.hero.combat.inputQueue : 0.22;
      }
    }
    if (manualCharge && inp.atk) {
      p.chargeT = Math.min(1.2, p.chargeT + dt);
      if (p.chargeT >= 0.55) {
        if (!p.chargeReady) { p.chargeReady = true; FX.text(p.x, p.z, 70, 'CHARGE PRÊTE', p.hero.color); Sound.sfx.whoosh(false); }
        p.chargeFxT -= dt;
        if (p.chargeFxT <= 0) { p.chargeFxT = 0.18; FX.add({k:'ring',x:p.x,z:p.z,y:p.y+26,life:0.2,r0:8,r1:27,col:p.hero.color}); }
      }
    }
    if (p.chargeT > 0 && !inp.atk) {
      if (manualCharge) {
        p._chargePending = p.chargeReady;
        p.buffer = 'atk'; p.bufT = 0.22;
      }
      p.chargeT = 0; p.chargeReady = false;
    }
    if (!manualCharge && !inp.atk) { p.chargeT = 0; p.chargeReady = false; }

    if (inp.pressed.spe) { p.buffer = 'spe'; p.bufT = 0.2; }
    if (inp.pressed.jump) { p.buffer = 'jump'; p.bufT = LANDING_JUMP_BUFFER; }
    if (inp.pressed.back) { p.buffer = 'back'; p.bufT = 0.2; }
    if (inp.pressed.dash) { p.buffer = 'dash'; p.bufT = 0.16; }
    // parade (Ori 2) : DOS ou DASH juste avant l'impact
    if ((inp.pressed.back || inp.pressed.dash) && S !== 'grab') p.parryT = PARRY_WIN[Settings.parryWin == null ? 1 : Settings.parryWin] || 0;
    // combo automatique : maintenir COUP enchaîne les coups (façon Diablo mobile)
    if (Settings.hold && inp.atk && !inp.pressed.atk && !p.buffer && !p.weapon && (S === 'idle' || S === 'walk' || (S === 'attack' && p.move && !p.move.air && p.mt > p.move.act[1]))) { p.buffer = 'atk'; p.bufT = 0.05; p.holdAtk = true; }
    p.bufT -= dt; if (p.bufT <= 0) p.buffer = null;

    if (S === 'grab') { this.updateGrab(p, inp, dt); this.animate(p, dt); return; }
    if (S === 'attack') {
      this.updateMove(p, dt);
      if (p.state === 'attack' && p.buffer === 'spe' && p.mt > p.move.act[0] && !p.move.cost) { if (this.trySpecial(p, inp)) p.buffer = null; }
      // V26.7 : cancel de combo sur CONFIRMATION DE TOUCHE uniquement.
      // Nzinga (rush) > Kabongo (équilibré) > Makasi (impact). Pas de
      // cancel des spéciaux, armes, prises, attaques aériennes ni à vide.
      else if (p.state === 'attack' && p.lastHit && p.buffer === 'atk' &&
               this.isHeroComboMove(p, p.move) &&
               p.mt >= p.move.act[1] + p.hero.combat.chainRecovery) {
        p.comboT = 0.34;
        this.consumeBuffer(p, inp);
      }
      // annulation : un coup qui touche peut s'enchaîner sur l'attaque arrière ou le saut
      else if (p.state === 'attack' && p.lastHit && p.mt > p.move.act[1] && !p.move.cost && !p.move.grab) {
        if (p.buffer === 'back') { p.buffer = null; this.consumeBack(p, inp); }
        else if (p.buffer === 'dash' && p.y <= 0 && !(p.dashCd > 0)) { p.buffer = null; p.move = null; this.startDash(p, inp); }
        else if (p.buffer === 'jump' && p.y <= 0) { p.move = null; p.state = 'idle'; this.consumeBuffer(p, inp); }
      }
      this.physics(p, dt); this.bounds(p); this.animate(p, dt);
      if (p.state !== 'attack') this.consumeBuffer(p, inp);
      return;
    }
    if (S === 'jump') {
      // contrôle aérien avec inertie (Ori) + saut à hauteur variable : relâcher SAUT tôt coupe l'élan
      p.vx = approach(p.vx, inp.mx * WALK * p.speed * (p.running ? 1.6 : 1), (Math.abs(inp.mx) > 0.2 ? 420 : 160) * dt);
      if (!inp.jump && !p.jumpCut && p.vy > 80 && !p.dj && Input.source !== 'touch' && !p.isBot) { p.vy *= 0.78; p.jumpCut = true; }
      // En fin de chute, SAUT est mis en réserve pour le contact au sol :
      // éviter un double saut involontaire 5 pixels avant de toucher la route.
      const imminentLanding = p.vy < 0 && p.y <= LANDING_JUMP_HEIGHT;
      if (p.buffer === 'jump' && !p.dj && p.y > 6 && !imminentLanding) {
        // double saut en salto
        p.buffer = null; p.dj = true; p.djT = 0.32; p.vy = p.hero.jump * JUMP_K * DJUMP_K; p.airUsed = false;
        if (Math.abs(inp.mx) > 0.3) { p.face = sign(inp.mx); p.vx = inp.mx * WALK * p.speed * 1.1; }
        Sound.sfx.jump(); FX.add({ k: 'ring', x: p.x, z: p.z, y: p.y + 20, life: 0.28, r0: 6, r1: 26, col: p.hero.color }); FX.dust(p.x, p.z, 4, 0.6);
      }
      if (p.buffer === 'dash' && !p.airDash) { p.buffer = null; p.airDash = true; this.startDash(p, inp); this.animate(p, dt); return; }
      if (p.buffer === 'back' && !p.airDash && Math.abs(inp.mx) > 0.4) { p.buffer = null; p.airDash = true; this.startDash(p, inp); this.animate(p, dt); return; }
      if (p.buffer === 'spe' && !p.airSpe && p.y > 8) { p.buffer = null; p.airSpe = true; this.trySpecial(p, inp, true); this.physics(p, dt); this.bounds(p); this.animate(p, dt); return; }
      if (p.buffer === 'atk' && !p.airUsed) { p.buffer = null; p.airUsed = true; this.startMove(p, MOVES[p.weapon ? WEAPONS[p.weapon.kind].move : p.hero.air]); if (p.move.dive) { p.vy = -200; p.vx = p.face * 210; } }
      this.physics(p, dt); this.bounds(p); this.animate(p, dt); return;
    }
    // --- au sol : idle / walk ---
    p.comboT -= dt;
    if (p.interactT > 0 && !p.weapon && p.y <= 0 && this.tryPickup(p)) { p.interactT = 0; this.animate(p, dt); return; }
    if (this.consumeBuffer(p, inp)) { this.animate(p, dt); return; }
    const mx = inp.mx, my = inp.my;
    // Le sprint appartient à une direction : une inversion passe d'abord en marche,
    // puis un nouveau double-appui ou maintien peut déclencher la course.
    const reverseRun = p.running && Math.abs(mx) > 0.3 && sign(mx) !== p.face;
    if (reverseRun || Math.abs(mx) <= 0.2) { p.running = false; p.holdT = 0; }
    if (inp.dtap && !reverseRun) p.running = true;
    // Course automatique au stick/tactile, sans réactivation instantanée au demi-tour.
    if (Settings.autorun !== 0 && Math.abs(mx) > 0.75 && Math.abs(my) < 0.6 && !reverseRun) {
      p.holdT = (p.holdT || 0) + dt;
      if (p.holdT > AUTO_RUN && !p.weapon) p.running = true;
    } else p.holdT = 0;
    if (Math.abs(mx) > 0.2) p.face = sign(mx);
    const run = p.running && Math.abs(mx) > 0.3;
    p.vx = mx * WALK * p.speed * (run ? 1.75 : 1);
    p.vz = my * ZWALK * p.speed;
    p.state = Math.abs(mx) > 0.1 || Math.abs(my) > 0.1 ? 'walk' : 'idle';
    if (run && Settings.fx > 1) { p._gT = (p._gT || 0) - dt; if (p._gT <= 0 && p._frame) { p._gT = 0.07; const t0 = p.trail; p.trail = p.hero.color; FX.ghost(p); p.trail = t0; } }
    this.physics(p, dt); this.bounds(p);
    // saisie automatique en marchant contre un ennemi
    if (p.state === 'walk' && Math.abs(mx) > 0.4 && !p.weapon && !run) {
      for (const e of this.enemies) {
        if (e.team === p.team || e.kind === 'boss' || e.fly || e.dying) continue;
        if (!['idle', 'walk', 'hurt'].includes(e.state) || e.grabber) continue;
        const dx = (e.x - p.x) * p.face;
        if (dx > 4 && dx < 16 + e.w * 0.4 && Math.abs(e.z - p.z) < 6 && sign(mx) === p.face) { this.startGrab(p, e); break; }
      }
    }
    this.animate(p, dt);
  },
  // Les références MOVES sont constantes, donc aucune allocation pendant le combat.
  isHeroComboMove(p, move) {
    for (let i = 0; i < p.hero.combo.length; i++) {
      if (MOVES[p.hero.combo[i]] === move) return true;
    }
    return false;
  },
  consumeBuffer(p, inp) {
    if (!p.buffer) return false;
    const b = p.buffer;
    if (b === 'jump') {
      p.buffer = null; p.state = 'jump'; p.vy = p.hero.jump * JUMP_K; p.airUsed = false; p.dj = false; p.airDash = false; p.jumpCut = false;
      p.vx = inp.mx * WALK * p.speed * (p.running ? 1.7 : 1); p.vz = 0; Sound.sfx.jump(); FX.dust(p.x, p.z, 3, 0.7); return true;
    }
    if (b === 'back') { p.buffer = null; return this.consumeBack(p, inp); }
    if (b === 'dash') { p.buffer = null; if (p.dashCd > 0 || p.grabbing) return false; return this.startDash(p, inp); }
    if (b === 'spe') {
      p.buffer = null;
      if (p.weapon) { if (Math.abs(inp.mx) > 0.3) p.face = sign(inp.mx); this.startMove(p, MOVES.w_throw); return true; }
      if (p.running && Math.abs(inp.mx) > 0.3) { p.running = false; return this.trySpecial(p, inp, false, MOVES[p.hero.blitz]); }
      return this.trySpecial(p, inp);
    }
    if (b === 'atk') {
      p.buffer = null;
      if (p._chargePending) {
        // La frappe chargée est une variante du coup de course (multiplicateur sur
        // les dégâts du coup, pas sur toutes les attaques futures).
        if (Math.abs(inp.mx) > 0.3) p.face = sign(inp.mx);
        else if (Settings.assist) this.aimAssist(p);
        p.running = false;
        this.startMove(p, MOVES[p.hero.run]);
        FX.text(p.x, p.z, 78, 'COUP CHARGÉ !', p.hero.color);
        Sound.sfx.whoosh(true); haptic(25);
        return true;
      }
      if (p.running && Math.abs(inp.mx) > 0.3) { p.running = false; this.startMove(p, MOVES[p.hero.run]); return true; }
      if (p.weapon) { this.startMove(p, MOVES[WEAPONS[p.weapon.kind].move]); return true; }
      const combo = p.hero.combo;
      if (p.comboT > 0 && p.lastHit) p.comboIdx = (p.comboIdx + 1) % combo.length; else p.comboIdx = 0;
      if (Math.abs(inp.mx) > 0.3) p.face = sign(inp.mx);
      else if (Settings.assist) this.aimAssist(p);
      this.startMove(p, MOVES[combo[p.comboIdx]]);
      return true;
    }
    return false;
  },
  // V26.5 : deux armes au sol -> plus proche en distance pondérée selon la profondeur,
  // puis identifiant stable pour départager. Aucune allocation dans la recherche.
  nearestPickup(p) {
    if (!p || p.out || p.dying || p.weapon || p.y > 5) return null;
    let best = null, dist = Infinity;
    for (const it of this.items) {
      if (it.kind !== 'weapon' || it.remove || it.y >= 4 || !WEAPONS[it.sub]) continue;
      const dx = it.x - p.x, dz = it.z - p.z;
      if (Math.abs(dx) >= 14 || Math.abs(dz) >= 8) continue;
      const score = dx * dx + dz * dz * 3;
      if (score < dist || (score === dist && best && it.id < best.id)) { best = it; dist = score; }
    }
    return best;
  },
  tryPickup(p) {
    const it = this.nearestPickup(p);
    if (!it) return false;
    const w = WEAPONS[it.sub];
    it.remove = true;
    p.weapon = { kind: it.sub, uses: w.uses };
    Sound.sfx.weapon(); this.emit('toast', { text: w.label + ' ÉQUIPÉ · SPÉCIAL POUR LANCER' });
    return true;
  },
  // aide à la visée : se tourner vers l'ennemi le plus proche et s'aligner légèrement en profondeur
  aimAssist(p) {
    let best = null, bd = 1e9;
    for (const e of this.enemies) {
      if (e.dying || e.remove || e.team === p.team || ['down', 'dead', 'getup'].includes(e.state)) continue;
      const dx = Math.abs(e.x - p.x), dz = Math.abs(e.z - p.z);
      if (dx > 70 || dz > 18) continue;
      const d = dx + dz * 2.5 + (sign(e.x - p.x) === p.face ? 0 : 12);
      if (d < bd) { bd = d; best = e; }
    }
    // En phase finale, viser d'abord la balise à portée plutôt que Joe-Vally au fond.
    if (this.boss && this.boss.roadPhase3 && !this.boss.roadLiberated) {
      let beacon = null, dBest = 1e9;
      for (const h of this.hazards) {
        if (h.k !== 'roadbeacon' || h.dead) continue;
        const dx = Math.abs(h.x - p.x), dz = Math.abs(h.z - p.z);
        if (dx > 75 || dz > 22) continue;
        const d = dx + dz * 2;
        if (d < dBest) { dBest = d; beacon = h; }
      }
      if (beacon) { p.face = sign(beacon.x - p.x); p.z += clamp(beacon.z - p.z, -4, 4); return; }
    }
    if (!best) return;
    p.face = sign(best.x - p.x) || p.face;
    p.z += clamp(best.z - p.z, -5, 5);
  },
  // parade réussie : l'attaquant est sonné, ralenti et l'écran « respire »
  parry(p, a) {
    p.parryT = 0; p.face = sign(a.x - p.x) || p.face; p.inv = Math.max(p.inv, 0.35);
    this.stats.parries++;
    if (!a.colossus) {
      a.state = 'hurt'; a.st = a.kind === 'boss' ? 0.55 : 1.05; a.vx = sign(a.x - p.x) * 110; a.move = null; a.flash = 0.2;
      if (a.ai) a.ai.cd = Math.max(a.ai.cd, a.kind === 'boss' ? 0.8 : 1.3);
    }
    this.slow = Math.max(this.slow, 0.45); this.hitstop = Math.max(this.hitstop, 0.09); this.shake = Math.max(this.shake, 3);
    FX.spark((p.x + a.x) / 2, p.z, p.y + 40, p.face, true, '#9ff4ff');
    FX.add({ k: 'ring', x: p.x + p.face * 10, z: p.z, y: p.y + 40, life: 0.32, r0: 6, r1: 38, col: '#9ff4ff' });
    FX.text(p.x, p.z, 66, 'PARADE !', '#9ff4ff');
    Sound.sfx.parry && Sound.sfx.parry(); haptic(35);
    p.comboPts += 400; p.comboTimer = Math.max(p.comboTimer, 1.6);
    this.emit('parry', { idx: p.idx });
  },
  // esquive parfaite : traverser une attaque pendant le dash déclenche un ralenti et renforce le coup suivant
  perfectDodge(p) {
    p.pdUsed = true; p.perfectT = 1.6; this.stats.perfects++;
    this.slow = Math.max(this.slow, 0.6);
    FX.text(p.x, p.z, 66, 'ESQUIVE PARFAITE', '#ffd34d');
    FX.add({ k: 'ring', x: p.x, z: p.z, y: p.y + 30, life: 0.4, r0: 10, r1: 48, col: '#ffd34d' });
    Sound.sfx.perfect && Sound.sfx.perfect(); haptic(20);
    p.comboPts += 250;
    this.emit('perfect', { idx: p.idx });
  },
  startDash(p, inp) {
    if (Math.abs(inp.mx) > 0.3) p.face = sign(inp.mx);
    p.pdUsed = false;
    p.state = 'jump' === p.state && p.y > 0 ? 'jump' : 'walk';
    p.move = null; p.dashT = DASH_T; p.inv = Math.max(p.inv, DASH_T + 0.05); p.running = false;
    (Sound.sfx.dash || Sound.sfx.whoosh)(true); FX.dust(p.x, p.z, 5, 1); haptic(12);
    return true;
  },
  consumeBack(p, inp) {
    // DOS + direction = dash ; DOS seul = attaque arrière
    if (inp && Math.abs(inp.mx) > 0.5 && !p.grabbing && p.y <= 0) return this.startDash(p, inp);
    if (p.grabbing) this.releaseGrab(p);
    p.face = -p.face; p.running = false;
    this.startMove(p, MOVES[p.hero.back]);
    return true;
  },
  trySpecial(p, inp, escape, forced) {
    const fwd = Math.abs(inp.mx) > 0.4 && !escape;
    const m = forced || MOVES[fwd ? p.hero.speF : p.hero.spe];
    if (fwd) p.face = sign(inp.mx);
    if (p.grabbing) this.releaseGrab(p);
    if (p.grabber) { const g = p.grabber; g.grabbing = null; p.grabber = null; }
    const cost = m.cost || 0;
    if (p.hp > 1) { const c = Math.min(cost, p.hp - 1); p.hp -= c; p.rec = Math.min(p.rec + c, 40); }
    p.y = Math.max(p.y, 0);
    this.startMove(p, m);
    if (m.blitz) { this.emit('toast', { text: 'BLITZ !' }); FX.dust(p.x, p.z, 6, 1); }
    Sound.sfx.special();
    return true;
  },
  startMove(f, m) {
    // Statut lié à UNE attaque uniquement. Un nouveau coup ne réutilise pas
    // accidentellement le bonus de l'attaque précédente.
    f.chargedMove = f.kind === 'player' && !!f._chargePending;
    f._chargePending = false;
    f.state = 'attack'; f.move = m; f.mt = 0; f.hitSet.clear(); f.multiT = 0; f.lastHit = false; f.leaped = false; f.quaked = false; f.shot = false;
    f.trail = m.trail || null; f.swooshed = false;
    if (m.rise) f.vy = 140;
    if (m.inv) f.inv = Math.max(f.inv, m.inv[1]);
    if (!m.air && !m.leap && f.y <= 0) f.vx = 0;
    Sound.sfx.whoosh(m.dmg > 9);
  },
  updateMove(f, dt) {
    const m = f.move;
    const previousMt = f.mt;
    f.mt += dt * (f.kind === 'player' ? PLAYER_TEMPO : 1);
    f.armorNow = !!m.armor && f.mt < m.act[1];
    // élan
    if (m.lunge && f.mt < m.act[1]) f.vx = f.face * m.lunge * (f.mt < m.act[0] ? 0.3 : 1);
    else if (!m.air && !m.leap && f.y <= 0) f.vx *= 1 - 10 * dt;
    if (m.leap && !f.leaped && f.mt >= m.act[0] * 0.8) {
      f.leaped = true; const tgt = this.nearestFoe(f);
      const dist = tgt ? Math.abs(tgt.x - f.x) : 100;
      f.vy = m.leap[1]; f.vx = f.face * Math.min(m.leap[0], dist * 2.2); if (tgt) f.vz = clamp((tgt.z - f.z) * 1.8, -50, 50);
    }
    if (f.trail && (f.ghostT -= dt) <= 0) { f.ghostT = 0.04; if (Settings.fx > 0) FX.ghost(f); }
    // traînée de frappe (« smear ») au premier instant actif : arc lumineux dans la direction du coup
    if (!f.swooshed && f.mt >= m.act[0] && Settings.fx > 0 && !m.proj && (f.kind === 'player' || (m.dmg || 0) >= 9)) {
      f.swooshed = true;
      const rc = m.reach || [0, 22], yy = m.y || [24, 60];
      FX.add({ k: 'swoosh', x: f.x, z: f.z, y: f.y + (yy[0] + yy[1]) / 2, face: f.face, r: Math.max(16, rc[1] + 6) * (f.build || 1), life: m.spin ? 0.2 : 0.12,
        up: !!m.launch && !m.air, spin: !!m.spin, col: f.kind === 'player' ? (m.trail || f.hero.color) : '#ff6b5c', w: (m.dmg || 4) >= 9 ? 5 : 3 });
    }
    // fenêtre active
    // V26.6 : détection du passage à travers une fenêtre active courte.
    // Une frame lente ne doit pas faire disparaître la hitbox d'un jab / projectile.
    if (previousMt <= m.act[1] && f.mt >= m.act[0]) {
      if (m.multi) { f.multiT -= dt; if (f.multiT <= 0) { f.multiT = m.multi; f.hitSet.clear(); } }
      if (m.quake && !f.quaked) { f.quaked = true; this.shake = Math.max(this.shake, m.shake || 5); FX.shock(f.x, f.z, f.rim || '#ffd34d'); FX.dust(f.x, f.z, 10, 1.3); Sound.sfx.thud(); }
      if (m.proj && !f.shot) { f.shot = true; this.fireProj(f, m); }
      else if (!m.proj && !m.throwMove) this.resolveHits(f, m);
    }
    if (m.throwMove && f.grabbing && f.mt >= m.act[0]) this.doThrow(f);
    if (f.mt >= m.t) {
      f.move = null; f.trail = null; f.armorNow = false;
      if (f.y > 0) { f.state = 'jump'; f.airUsed = true; }
      else { f.state = f.grabbing ? 'grab' : 'idle'; }
      f.comboT = 0.34;
    }
  },
  resolveHits(a, m) {
    const foes = a.team === 0 ? this.enemies : this.players;
    for (const t of foes) {
      if (a.hitSet.has(t.id)) continue;
      if (!this.canHit(a, t, m)) {
        if (t.kind === 'player' && t.dashT > 0 && !t.pdUsed && t.inv > 0) { const iv = t.inv; t.inv = 0; const ok = this.canHit(a, t, m); t.inv = iv; if (ok) this.perfectDodge(t); }
        continue;
      }
      a.hitSet.add(t.id);
      this.applyHit(a, t, m);
    }
    if (a.team === 0) {
      this.hitRoadBeacons(a, m);
      this.hitRoadBlocks(a, m);
      for (const pr of this.props) {
        if (a.hitSet.has(pr.id)) continue;
        const dx = (pr.x - a.x) * (m.all ? sign(pr.x - a.x) : a.face);
        if (Math.abs(pr.z - a.z) < m.zr + 4 && dx > m.reach[0] - 10 && dx < m.reach[1] + 10 && m.y[0] < 30) { a.hitSet.add(pr.id); this.breakProp(pr, a); }
      }
    }
  },
  canHit(a, t, m) {
    if (t.out || t.inv > 0 || t.dying || t.remove) return false;
    if (['down', 'getup', 'dead', 'respawn', 'intro', 'star'].includes(t.state)) return false;
    if (t.colossus) {
      // Le colosse avait une collision illimitée sur l'axe Z : on pouvait le
      // frapper depuis l'autre extrémité de la route. Respecter la profondeur
      // et le chevauchement vertical sans changer sa large hitbox frontale.
      if (Math.abs(t.z - a.z) > m.zr + Math.max(10, t.w * 0.22)) return false;
      const rel = (t.x - a.x) * a.face;
      if (m.all) {
        if (Math.abs(t.x - a.x) > Math.max(-m.reach[0], m.reach[1]) + t.w) return false;
      } else if (rel < m.reach[0] - t.w * 0.5 || rel > m.reach[1] + t.w) return false;
      const ay0 = a.y + m.y[0], ay1 = a.y + m.y[1];
      return ay1 > t.y && ay0 < t.y + t.h * (t.build || 1);
    }
    if (Math.abs(t.z - a.z) > m.zr) return false;
    const rel = (t.x - a.x) * a.face;
    if (m.all) { if (Math.abs(t.x - a.x) > Math.max(-m.reach[0], m.reach[1]) + t.w) return false; }
    else if (rel < m.reach[0] - t.w || rel > m.reach[1] + t.w) return false;
    const y0 = a.y + m.y[0], y1 = a.y + m.y[1];
    const ty0 = t.y + (t.state === 'fall' ? -6 : 0), ty1 = t.y + (t.state === 'fall' ? 30 : t.h * t.build);
    return y1 > ty0 && y0 < ty1;
  },
  applyHit(a, t, m) {
    const dir = m.all ? sign(t.x - a.x) : a.face;
    Sound.at && Sound.at(t.x, t.z);
    if (t.kind === 'player' && a.kind !== 'player' && t.parryT > 0 && !['hurt', 'fall', 'grabbed', 'down', 'thrown'].includes(t.state)) { this.parry(t, a); return; }
    let dmg = m.dmg * (a.power || 1);
    if (a.kind === 'player' && a.chargedMove) dmg *= 1.6;
    if (a.kind === 'player' && a.perfectT > 0) { dmg *= 1.5; a.perfectT = 0; FX.text(t.x, t.z, 70, 'CONTRE !', '#ffd34d'); }
    if (t.roadJoe && t.roadRiding) return; // invulnérabilité pendant la charge moto (télégraphe visible)
    if (a.weapon && m.weapon) { a.weapon.uses--; if (m.breaks || a.weapon.uses <= 0) { if (a.weapon.kind === 'bottle') Sound.sfx.glass(); else Sound.sfx.metal(); FX.debris(t.x, t.z, 40, a.weapon.kind === 'bottle' ? '#5fe08a' : '#9aa3ad', 8); a.weapon = null; } }
    // bouclier
    const guarding = t.shield && (t.kind === 'boss' ? t.ai.guard > 0 : t.ai && t.ai.guard > 0) && t.face === -dir && (t.state === 'idle' || t.state === 'walk' || t.state === 'block') && !m.launch && !m.cost;
    if (guarding) {
      t.state = 'block'; t.st = 0.25; t.vx = dir * 40; Sound.sfx.block();
      FX.spark(t.x - dir * 6, t.z, a.y + (m.y[0] + m.y[1]) / 2, dir, false, '#7fd8ff');
      this.hitstop = Math.max(this.hitstop, 0.03); a.lastHit = true; return;
    }
    // saisie ennemie (molosses, certains boss)
    if (m.egrab) {
      if (t.kind !== 'player' || t.grabbing || t.state === 'attack' && t.move && (t.move.armor || t.move.cost)) return;
      t.state = 'grabbed'; t.grabber = a; t.st = 3; t.mash = 0; t.move = null; t.vx = 0; t.vz = 0; t.y = 0;
      a.state = 'egrab'; a.grabbing = t; a.st = 0.6; a.grabN = 0; a.move = null; a.vx = 0;
      t.face = -a.face; t.x = a.x + a.face * 15; t.z = a.z;
      Sound.sfx.grunt(0.9); haptic(30); this.emit('toast', { text: 'SAISI ! Martelez les boutons' });
      return;
    }
    if (t.colossus) dmg *= t.ai.stunT > 0 ? 1.5 : 0.65;
    if (t.roadJoe) {
      // Aucune élimination possible avant les trois balises. Aucun coup ne peut sauter le script.
      const floor = t.roadLiberated ? 0 : Math.ceil(t.maxHp * 0.12);
      dmg = Math.min(dmg, Math.max(0, t.hp - floor));
    }
    this.damage(t, dmg, a);
    t.flash = 0.12; t.lastHitBy = a;
    if (a.kind === 'player') {
      a.lastHit = true;
      const regain = Math.min(a.rec, dmg * 0.6); a.hp = Math.min(a.maxHp, a.hp + regain); a.rec -= regain;
      a.combo++; a.comboTimer = 1.6; a.maxCombo = Math.max(a.maxCombo, a.combo); this.stats.maxCombo = Math.max(this.stats.maxCombo, a.combo);
      a.comboPts += Math.round(dmg * 10 * (1 + Math.min(a.combo, 99) * 0.05));
      if (m.dmg >= 12 || t.hp <= 0) { this.zoom = Math.max(this.zoom, t.kind === 'boss' && t.hp <= 0 ? 0.09 : 0.035); this.zoomX = t.x; }
      this.focus = t; this.focusT = 2.5;
      haptic(m.dmg > 9 ? 22 : 10);
    } else if (t.kind === 'player') {
      Sound.sfx.hurtPlayer(); haptic(45);
    }
    // gel d'impact proportionnel aux dégâts, vibration de la cible, secousse dans le sens du coup
    this.hitstop = Math.max(this.hitstop, (m.hs || 0.05) * (t.hp <= 0 ? 2 : 1) * (0.85 + Math.min(0.5, dmg / 40)));
    if (m.shake) this.shake = Math.max(this.shake, m.shake);
    t.hshake = 0.1 + Math.min(0.12, dmg / 120);
    if (a.kind === 'player' && (dmg >= 12 || t.hp <= 0) && Settings.fx > 0) FX.add({ k: 'lines', x: t.x, z: t.z, y: t.y + 36, life: 0.22, col: t.hp <= 0 ? '#ffffff' : '#ffd34d' });
    this.kick(dir * Math.min(3, 0.6 + dmg / 8), 0);
    const hy = a.y + (m.y[0] + m.y[1]) / 2;
    t.hurtLow = hy - t.y < 40;
    FX.spark(t.x - dir * t.w * 0.4, t.z, clamp(hy, t.y + 8, t.y + 60), dir, m.dmg >= 9, m.zap ? '#7fe8ff' : a.kind === 'player' ? '#ffd34d' : '#ff6b5c');
    Sound.sfx.punch(m.sfx || 1);
    if (m.zap || a.zapNext) { t.zap = 0.6; Sound.sfx.zap(); FX.zap(t.x, t.z, t.y + 30); }
    if (t.colossus) { this.updateJoeRoadPhases(t); return; }
    // réaction
    if (t.grabbing) this.releaseGrab(t);
    if (m.grab && t.grabber === a) { t.st = 2; return; }
    if (t.grabber && t.grabber !== a) { t.grabber.grabbing = null; t.grabber = null; }
    const armored = t.armorNow || (t.kind === 'boss' && t.ai && t.ai.armorT > 0);
    if (armored && t.hp > 0) return;
    t.face = -dir;
    if (t.hp <= 0) {
      t.dying = true; t.state = 'fall'; t.vy = Math.max(m.launch || 0, 210); t.vx = dir * Math.max(m.kb, 130); t.y = Math.max(t.y, 1); t.bounced = false;
      if (t.kind !== 'player') this.onKill(t, a);
      return;
    }
    const airborne = t.y > 2 || t.state === 'fall' || t.state === 'jump';
    const ms = massOf(t);
    if (m.launch || airborne || (m.dmg >= 12 && t.kind !== 'boss')) {
      t.juggle++;
      const j = Math.max(0.35, 1 - t.juggle * 0.22);
      t.state = 'fall'; t.vy = (m.launch || 150) * j * (t.kind === 'boss' ? 0.75 : 1) / Math.sqrt(ms); t.vx = dir * (m.kb || 60) / Math.pow(ms, 0.7) * (t.kind === 'player' ? t.hero.combat.knockback : 1); t.y = Math.max(t.y, 1); t.bounced = false; t.move = null;
      // un gros coup envoie la cible dans ses alliés (effet domino)
      if (a.kind === 'player' && (m.kb || 0) >= 140) { t.domino = true; t.lastHitBy = a; }
    } else {
      t.state = 'hurt'; t.st = m.stun * (t.kind === 'boss' ? 0.6 : 1) * (ms > 1.3 ? 0.85 : 1) * (t.kind === 'player' ? t.hero.combat.stagger : 1); t.vx = dir * m.kb / Math.pow(ms, 0.7) * (t.kind === 'player' ? t.hero.combat.knockback : 1); t.move = null; t.hurtAlt = !t.hurtAlt;
      if (t.ai) t.ai.cd = Math.max(t.ai.cd, 0.25);
    }
  },
  damage(t, dmg, a) {
    t.hp = Math.max(0, t.hp - dmg);
    t.hurtLow = Math.random() < 0.45;
    if (t.kind === 'player') { t.dashT = 0; t.chargeT = 0; t.chargeReady = false; t._chargePending = false; }
    if (t.kind === 'player') {
      t.rec = 0; this.stats.dmg += dmg; if (t.hp <= 0 && !t.dying) { t.dying = true; }
      if (t.comboPts > 0) { this.emit('combolost', { idx: t.idx, pts: t.comboPts }); t.comboPts = 0; t.combo = 0; t.comboTimer = 0; }
    }
    if (t.kind === 'boss' && !t.colossus) {
      const r = t.hp / t.maxHp;
      if (r < 0.5 && !t.enraged) { t.enraged = true; t.ai.armorT = 2; this.emit('banner', { text: 'RAGE !', sub: t.name }); Sound.sfx.bossIntro(); }
    }
  },
  onKill(t, a) {
    this.stats.kills++;
    if (a && a.kind === 'player') {
      this.addScore(a, (t.def && t.def.score) || 300);
      // V16/V21 retrouvé : récompense du KO en combo de huit coups ou plus.
      // Jamais sur les boss, qui ont leur propre cinématique de victoire.
      if (t.kind === 'enemy' && a.combo >= 8) {
        this.slow = Math.max(this.slow, 0.9);
        this.zoom = Math.max(this.zoom || 0, 0.05); this.zoomX = t.x;
        this.flash = Math.max(this.flash, 0.5); this.flashCol = '#ffd34d';
        FX.text(t.x, t.z, 84, 'FINISH !', '#ffd34d');
        FX.shock(t.x, t.z, '#ffd34d'); this.shake = Math.max(this.shake, 5);
        Sound.sfx.grunt(1.3); this.addScore(a, 500);
        this.emit('finisher', {idx:a.idx,combo:a.combo,bonus:500});
      }
    }
    if (t.weapon && t.kind === 'enemy' && Math.random() < 0.55) this.spawnItem('weapon', t.weapon === 'baton' ? 'pipe' : t.weapon, t.x, t.z, 20);
    if (t.kind === 'boss') {
      this.slow = 1.4; this.flash = 1; this.flashCol = '#ffffff'; Sound.sfx.ko(); this.bossPhase = 'ko';
      for (const e of this.enemies) if (e !== t && !e.dying) { e.dying = true; e.hp = 0; e.state = 'fall'; e.vy = 200; e.vx = sign(e.x - t.x) * 120; }
      if (a && a.kind === 'player') this.addScore(a, 10000);
      this.emit('bossko');
    } else {
      let left = 0;
      for (const other of this.enemies) if (!other.dying && other !== t && !other.remove) left++;
      if (left === 0 && this.wave && this.wave.spawned >= this.wave.list.length) { this.slow = 0.5; }
    }
  },
  startGrab(p, e) {
    p.state = 'grab'; p.grabbing = e; p.grabT = 1.8; p.grabHits = 0; p.vx = 0; p.vz = 0; p.vaulted = false;
    e.state = 'grabbed'; e.grabber = p; e.move = null; e.vx = 0; e.vz = 0; e.face = -p.face; e.st = 2;
    e.x = p.x + p.face * (14 + e.w * 0.3); e.z = p.z;
    Sound.sfx.grunt(1.2);
  },
  updateGrab(p, inp, dt) {
    const e = p.grabbing;
    p.grabT -= dt;
    if (!e || e.state !== 'grabbed' || p.grabT <= 0) { this.releaseGrab(p); return; }
    e.x = p.x + p.face * (14 + e.w * 0.3); e.z = p.z;
    if (p.buffer === 'atk') {
      p.buffer = null;
      const away = Math.abs(inp.mx) > 0.4 && sign(inp.mx) !== p.face;
      if (away || p.grabHits >= 2) { if (away) p.face = -p.face; this.startMove(p, MOVES.g_throw); }
      else { p.grabHits++; this.startMove(p, MOVES.g_knee); }
    } else if (p.buffer === 'jump') {
      // saut par-dessus l'adversaire : on change de côté sans lâcher la prise
      p.buffer = null;
      if (!p.vaulted) { p.vaulted = true; p.x = e.x + p.face * (14 + e.w * 0.3); p.face = -p.face; e.face = -p.face; p.grabT = Math.max(p.grabT, 1); FX.dust(p.x, p.z, 5, 0.9); Sound.sfx.jump(); }
      else this.releaseGrab(p);
    } else if (p.buffer === 'back') { p.buffer = null; p.face = -p.face; this.startMove(p, MOVES.g_throw); }
  },
  doThrow(p) {
    const e = p.grabbing;
    if (!e) return;
    p.grabbing = null; e.grabber = null;
    e.x = p.x + p.face * 6; e.state = 'thrown'; e.vx = p.face * 270 / Math.sqrt(massOf(e)); e.vy = 170 / Math.sqrt(massOf(e)); p.throwT = 0.38; e.y = 12; e.bounced = false; e.thrower = p; e.face = -p.face;
    this.damage(e, 12 * p.power, p); e.flash = 0.12; this.shake = Math.max(this.shake, 4);
    Sound.sfx.whoosh(true); Sound.sfx.grunt(1);
    if (e.hp <= 0) { e.dying = true; this.onKill(e, p); }
    this.addScore(p, 150);
  },
  addScore(p, v) {
    p.score += v;
    if (!p.nextLife) p.nextLife = 50000;
    while (p.score >= p.nextLife) {
      p.nextLife += 50000; p.lives++; Sound.sfx.star();
      this.emit('toast', { text: 'VIE BONUS ! ' + p.name });
    }
  },
  releaseGrab(p) {
    const e = p.grabbing;
    if (e) { e.grabber = null; if (e.state === 'grabbed') { e.state = 'hurt'; e.st = 0.15; e.vx = p.face * 60; } }
    p.grabbing = null; if (p.state === 'grab') p.state = 'idle';
  },
  respawnOrOut(p) {
    if (p.lives > 0) {
      p.lives--; p.hp = p.maxHp; p.rec = 0; p.dying = false; p.state = 'respawn'; p.y = 160; p.vy = 0; p.inv = 2.6;
      p.x = this.camX + this.LW * (p.idx ? 0.62 : 0.38); p.z = BAND * 0.5; p.weapon = null; p.stars = Math.max(1, p.stars);
      this.emit('toast', { text: p.name + ' revient au combat' });
      // onde de choc protectrice
      for (const e of this.enemies) if (!e.colossus && Math.abs(e.x - p.x) < 90 && !e.dying && e.kind !== 'boss') { e.state = 'fall'; e.vy = 150; e.vx = sign(e.x - p.x) * 140; e.y = 1; }
    } else { p.out = true; p.alpha = 0; this.emit('toast', { text: p.name + ' est K.O.' }); }
  },

  /* ---------------- Coup étoile ---------------- */
  startStar(p) {
    p.stars--; p.state = 'star'; p.st = 1.15; p.inv = 1.4; p.starHit = false; p.vx = 0; p.vz = 0;
    if (p.grabbing) this.releaseGrab(p);
    this.starFx = { hero: p.hero.id, t: 0, x: p.x, z: p.z, col: p.hero.color };
    this.emit('banner', { text: p.hero.starName, sub: '★ COUP ÉTOILE', col: p.hero.color });
    Sound.sfx.star(); this.flash = 0.6; this.flashCol = p.hero.color;
  },
  updateStar(p, dt) {
    if (this.starFx) this.starFx.t += dt;
    if (!p.starHit && p.st < 0.7) {
      p.starHit = true; Sound.sfx.starMove(); this.shake = 10; this.flash = 1; this.flashCol = '#ffffff';
      for (const e of this.enemies) {
        if (e.dying || e.x < this.camX - 10 || e.x > this.camX + this.LW + 10) continue;
        const dmg = (p.hero.id === 'makasi' ? 40 : p.hero.id === 'nzinga' ? 32 : 36) * (e.kind === 'boss' ? (e.colossus ? 0.3 : 0.4) : 1);
        this.applyHit(p, e, M({ dmg, kb: 140, launch: 260, hs: 0.02, sfx: 2.4, all: true, reach: [-999, 999], y: [0, 200], zr: 999 }));
        if (p.hero.id === 'nzinga') FX.bolt(e.x, e.z);
      }
      if (p.hero.id === 'makasi') for (let i = 0; i < 6; i++) FX.shock(this.camX + rand(this.LW), rand(BAND), '#ff9a3c');
    }
    if (p.st <= 0) { p.state = 'idle'; this.starFx = null; }
  },

  /* ---------------- Ennemis ---------------- */
  nearestFoe(f) {
    let best = null, bd = 1e9;
    const list = f.team === 1 ? this.players : this.enemies;
    for (const p of list) {
      if (p.out || p.dying || p.state === 'dead') continue;
      const d = Math.abs(p.x - f.x) + Math.abs(p.z - f.z) * 2;
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  },
  updateEnemy(e, dt) {
    Sound.at && Sound.at(e.x, e.z);
    e.st -= dt; e.inv = Math.max(0, e.inv - dt);
    if (e.ai.armorT > 0) e.ai.armorT -= dt;
    if (e.zap > 0) e.zap -= dt;
    const S = e.state;
    // V26.8 : un combattant interrompu ne monopolise jamais un jeton.
    // L'attaque déjà commencée conserve sa place jusqu'à la fin du mouvement.
    if (e.kind === 'enemy') {
      if (e.ai.dodgeCd > 0) e.ai.dodgeCd -= dt;
      if (S !== 'attack' && S !== 'egrab' && S !== 'idle' && S !== 'walk') {
        e.ai.token = false; e.ai.tokenT = 0;
      } else if (S === 'idle' || S === 'walk') {
        e.ai.tokenT = Math.max(0, (e.ai.tokenT || 0) - dt);
        if (e.ai.tokenT === 0) e.ai.token = false;
      }
    }
    if (S === 'hurt' || S === 'block') { e.vx *= Math.max(0, 1 - this.grip() * dt); this.physics(e, dt); if (e.st <= 0) { e.state = 'idle'; if (e.ai) e.ai.cd = Math.max(e.ai.cd, rand(0.2, 0.5)); } this.bounds(e); this.animate(e, dt); return; }
    if (S === 'fall' || S === 'thrown') {
      if (e.fly) { e.fly = false; if (!e.dying) { e.dying = true; this.onKill(e, e.lastHitBy); } }
      this.physics(e, dt);
      if (S === 'thrown' || (e.domino && Math.abs(e.vx) > 110)) this.thrownCollide(e);
      this.bounds(e); this.animate(e, dt); return;
    }
    if (S === 'down' && Math.abs(e.vx) > 4) { e.x += e.vx * dt; e.vx *= Math.max(0, 1 - this.grip() * 1.4 * dt); if (Math.abs(e.vx) > 40 && Math.random() < 0.3) FX.dust(e.x, e.z, 1, 0.7); this.bounds(e); }
    if (S === 'down') { if (e.st <= 0) { if (e.dying) { e.state = 'dead'; e.st = 0.8; } else { e.state = 'getup'; e.st = 0.35; e.inv = 0.45; } } this.animate(e, dt); return; }
    if (S === 'dead') { e.alpha = (Math.floor(e.st * 14) % 2) ? 0.2 : 1; if (e.st <= 0) e.remove = true; this.animate(e, dt); return; }
    if (S === 'getup') { if (e.st <= 0) e.state = 'idle'; this.animate(e, dt); return; }
    if (S === 'grabbed') { if (!e.grabber) e.state = 'idle'; this.animate(e, dt); return; }
    if (S === 'egrab') { this.updateEnemyGrab(e, dt); this.animate(e, dt); return; }
    if (S === 'intro') { e.vx = -WALK * 0.6; this.physics(e, dt); if (e.x < this.camX + this.LW - 70) { e.state = 'taunt'; e.st = 1.2; e.vx = 0; } this.animate(e, dt); return; }
    if (S === 'taunt') { if (e.st <= 0) e.state = 'idle'; this.animate(e, dt); return; }
    if (S === 'attack') { this.updateMove(e, dt); this.physics(e, dt); this.bounds(e); this.animate(e, dt); if (e.state !== 'attack') { if (e.kind !== 'boss') { e.ai.token = false; e.ai.tokenT = 0; e.ai.think = Math.max(e.ai.think, 0.4); } e.ai.cd = rand(0.55, 1.3) * this.diff().cd * (e.kind === 'boss' ? (e.enraged ? 0.55 : 0.75) : e.fly ? 2.4 : 1); this.chainBoss(e); } return; }
    if (S === 'jump') { if (e.fly) { e.state = 'idle'; return; } this.physics(e, dt); this.bounds(e); this.animate(e, dt); return; }
    this.think(e, dt);
    this.physics(e, dt); this.bounds(e); this.animate(e, dt);
  },
  updateEnemyGrab(e, dt) {
    const t = e.grabbing;
    if (!t || t.state !== 'grabbed' || t.grabber !== e) { e.state = 'idle'; e.grabbing = null; if (e.kind === 'enemy') { e.ai.token = false; e.ai.tokenT = 0; } e.ai.cd = Math.max(e.ai.cd, 0.8); return; }
    t.x = e.x + e.face * 15; t.z = e.z; t.y = 0;
    if (e.st > 0) return;
    e.grabN++;
    const heavy = e.kind === 'boss';
    if (e.grabN < 3) {
      this.damage(t, (heavy ? 7 : 5) * e.power, e); t.flash = 0.12; e.knee = 0.18;
      FX.spark(t.x, t.z, 34, -e.face, false, '#ff6b5c'); Sound.sfx.punch(1.4); Sound.sfx.hurtPlayer(); haptic(35);
      this.hitstop = Math.max(this.hitstop, 0.05); e.st = 0.6;
      if (t.hp <= 0) { t.grabber = null; e.grabbing = null; e.state = 'idle'; if (e.kind === 'enemy') { e.ai.token = false; e.ai.tokenT = 0; } t.dying = true; t.state = 'fall'; t.vy = 200; t.vx = e.face * 140; t.y = 1; t.bounced = false; }
    } else {
      t.grabber = null; e.grabbing = null; e.state = 'idle'; if (e.kind === 'enemy') { e.ai.token = false; e.ai.tokenT = 0; } e.ai.cd = 1.2;
      this.damage(t, (heavy ? 12 : 8) * e.power, e); t.flash = 0.12;
      t.state = 'fall'; t.vy = 210; t.vx = e.face * 210; t.y = 1; t.bounced = false; this.shake = Math.max(this.shake, 4);
      Sound.sfx.whoosh(true); Sound.sfx.grunt(1); haptic(50);
      if (t.hp <= 0) t.dying = true;
    }
  },
  chainBoss(e) {
    if (e.kind !== 'boss' || !e.lastMove || !e.lastMove.chain) return;
    e.chainN = (e.chainN || 0) + 1;
    if (e.chainN < e.lastMove.chain) { e.ai.cd = 0.05; } else e.chainN = 0;
  },
  // V26.8 — sélection sans map/filter ni tableaux temporaires, avec distances réelles.
  tacticalMove(e, tgt, dx, dz) {
    const ai = e.ai, tactics = ENEMY_TACTICS[e.type];
    const moves = e.def.moves, ad = Math.abs(dx), az = Math.abs(dz);
    let best = null, bestScore = -Infinity;
    for (let i = 0; i < moves.length; i++) {
      const key = moves[i], m = MOVES[key];
      if (!m) continue;
      let viable = false;
      if (m.proj) viable = ad > 50 && ad < 210 && az < 10;
      else if (m.egrab) viable = ad < 25 && az < 5 && tgt.state !== 'grabbed' && tgt.state !== 'attack';
      else if (m.leap) viable = ad > 45 && ad < 150 && az < 12;
      else if (m.lunge > 150) viable = ad > 40 && ad < 155 && az < 6;
      else viable = ad < m.reach[1] + 8 && ad > Math.max(4, m.reach[0]) && az < Math.min(12, m.zr || 9);
      if (!viable) continue;
      let score = (tactics && tactics.moves[key]) || 1;
      // Un vrai rythme par rôle : charge quand la route s'ouvre, prise au corps-à-corps,
      // projectiles des kulunas à distance et coups légers sous pression.
      if (m.egrab && ad < 20) score += 5;
      if (m.proj && ad > 90) score += 6;
      if (m.lunge > 150 && ad > 65) score += 5;
      if (e.type === 'garde' && key === 'e_zap' && tgt.state === 'attack') score += 4;
      // Alternance prévisible mais non répétitive ; aucune randomisation frame-par-frame.
      if ((ai.pat + i) % moves.length === 0) score += 3;
      if (score > bestScore) { best = m; bestScore = score; }
    }
    return best;
  },
  think(e, dt) {
    const ai = e.ai, tgt = this.nearestFoe(e), tactics = ENEMY_TACTICS[e.type];
    ai.cd -= dt; ai.think -= dt;
    if (e.shield) { ai.guard -= dt; if (ai.guard < -1.5) ai.guard = rand(0.8, 1.8); }
    if (!tgt) { ai.token = false; ai.tokenT = 0; e.vx = 0; e.vz = 0; e.state = 'idle'; return; }
    const dx = tgt.x - e.x, dz = tgt.z - e.z, ad = Math.abs(dx), az = Math.abs(dz);
    const spd = WALK * e.speed * (e.enraged ? 1.15 : 1);
    // Boss : priorité conservée, mais un boss n'est pas pris dans le budget des
    // sbires lors d'une interruption ; le colosse suit son propre moteur.
    if (e.kind === 'boss') ai.token = true;
    else if (ai.token && (ad > tactics.claim + 25 || az > 28)) {
      ai.token = false; ai.tokenT = 0;
    }
    if (!ai.token && e.kind === 'enemy' && ai.think <= 0 && ai.cd <= 0.2 && ad <= tactics.claim && az <= 20) {
      let count = 0;
      for (let i = 0; i < this.enemies.length; i++) {
        const other = this.enemies[i];
        if (other !== e && other.ai && other.ai.token && !other.dying && !other.remove && other.state !== 'dead') count++;
      }
      if (count < this.diff().tokens + (this.coop ? 1 : 0)) {
        ai.token = true; ai.tokenT = 1.6 + ad / Math.max(45, spd);
      }
    }
    if (ai.think <= 0) {
      ai.think = rand(0.45, 0.9);
      if (!ai.side || Math.random() < 0.15) ai.side = Math.random() < 0.5 ? -1 : 1;
      ai.off = rand(-1, 1);
    }
    // Renforts uniques du boss : comportement d'origine préservé.
    if (e.kind === 'boss' && e.def.summon) {
      const r = e.hp / e.maxHp;
      if ((r < 0.66 && ai.summoned === 0) || (r < 0.33 && ai.summoned === 1)) {
        ai.summoned++;
        for (let i = 0; i < 2; i++) this.spawnEnemy(pick(e.def.summon), i % 2 ? 'L' : 'R');
        this.emit('toast', { text: e.name + ' appelle des renforts' });
      }
    }
    if (e.fly) {
      // Drone : conserve sa distance ; il doit aussi obtenir un jeton pour tirer.
      e.life = (e.life || 0) + dt;
      if (e.life > 16 && !e.dying) { e.dying = true; e.state = 'fall'; e.vy = 60; ai.token = false; FX.spark(e.x, e.z, e.y, 1, true, '#38e6ff'); Sound.sfx.zap(); return; }
      const want = tgt.x - sign(dx || 1) * (ai.token ? 85 : 115);
      e.vx = clamp((want - e.x) * 2, -spd * 0.75, spd * 0.75);
      e.vz = clamp(dz * 2, -ZWALK, ZWALK);
      e.face = sign(dx || e.face); e.y = 34 + Math.sin(this.t * 3 + e.id) * 4;
      if (ai.token && ai.cd <= 0 && ad < 170 && az < 7 && tgt.state !== 'down' && tgt.state !== 'getup') {
        this.startMove(e, MOVES.d_shot); e.lastMove = MOVES.d_shot; ai.pat++; return;
      }
      e.state = 'walk'; return;
    }
    // Boxeuse : recul réactif lisible à un coup adverse, pas une esquive
    // aléatoire à chaque frame. CD pour interdire la répétition abusive.
    if (e.type === 'boxeuse' && ai.dodgeCd <= 0 && ad < 38 && az < 8 && tgt.state === 'attack' &&
        tgt.move && tgt.mt < tgt.move.act[1] && e.y <= 0) {
      ai.token = false; ai.tokenT = 0; ai.dodgeCd = tactics.evade;
      e.state = 'jump'; e.vy = 195; e.vx = -sign(dx) * 105; e.vz = 0; return;
    }
    let m = null;
    if (ai.token && ai.cd <= 0 && tgt.state !== 'down' && tgt.state !== 'getup' && tgt.state !== 'respawn') {
      m = this.tacticalMove(e, tgt, dx, dz);
      if (m) {
        e.face = sign(dx || e.face); this.startMove(e, m); e.lastMove = m; ai.pat++;
        if (m.proj) e.vx = 0;
        return;
      }
    }
    if (ai.token) {
      // Avancée selon la spécialité ; les chargeurs maintiennent une distance
      // de lancement, les fantassins rejoignent la portée de frappe.
      const ideal = tactics ? tactics.ideal : MOVES[e.def.moves[0]].reach[1] - 6;
      const wantX = tgt.x + (e.x < tgt.x ? -1 : 1) * ideal;
      const ddx = wantX - e.x, ddz = tgt.z - e.z;
      e.vx = Math.abs(ddx) > 3 ? sign(ddx) * spd : 0;
      e.vz = Math.abs(ddz) > 2 ? sign(ddz) * ZWALK * e.speed * 0.9 : 0;
      if (ai.cd > 0 && ad < 35) e.vx *= -0.35;
    } else {
      // Ceux qui n'ont pas la priorité encerclent plutôt que d'attaquer tous
      // ensemble. Kulunas et sapeurs utilisent davantage la profondeur.
      const flank = tactics ? tactics.flank : 16;
      const wantX = tgt.x + ai.side * ((tactics ? tactics.ideal : 55) + 42 + ai.off * 15);
      const wantZ = clamp(tgt.z + ai.side * flank + ai.off * 7, 2, BAND - 2);
      const ddx = wantX - e.x, ddz = wantZ - e.z;
      e.vx = Math.abs(ddx) > 6 ? sign(ddx) * spd * 0.72 : 0;
      e.vz = Math.abs(ddz) > 3 ? sign(ddz) * ZWALK * 0.68 : 0;
    }
    e.face = sign(dx || e.face);
    e.state = Math.abs(e.vx) + Math.abs(e.vz) > 1 ? 'walk' : 'idle';
  },
  thrownCollide(e) {
    for (const o of this.enemies) {
      if (o === e || o.dying || o.colossus || ['fall', 'down', 'getup', 'thrown', 'dead'].includes(o.state)) continue;
      if (Math.abs(o.x - e.x) < 16 && Math.abs(o.z - e.z) < 10 && e.y < 50) {
        const thr = e.thrower || e.lastHitBy;
        this.damage(o, e.state === 'thrown' ? 10 : 6, thr); o.flash = 0.12; o.state = 'fall'; o.vy = 180 / Math.sqrt(massOf(o)); o.vx = sign(e.vx) * 140 / massOf(o); o.y = 1; o.bounced = false; o.lastHitBy = thr; o.hshake = 0.1;
        if (o.hp <= 0 && !o.dying) { o.dying = true; this.onKill(o, thr); }
        if (e.state !== 'thrown') { e.vx *= 0.55; FX.text(o.x, o.z, 66, 'DOMINO !', '#ffd34d'); }
        FX.spark(o.x, o.z, 30, sign(e.vx), true); Sound.sfx.punch(2); this.hitstop = 0.06;
        if (thr && thr.kind === 'player') { thr.combo++; thr.comboTimer = 1.6; thr.comboPts += 120; }
      }
    }
  },

  // Extension « Traversée » : transitions déclenchées sur la vraie forme colosse.
  // V26.3 : l'épilogue utilise les données du colosse mais possède ses propres patterns.
  // La version 'Core' de Gombe conserve intégralement son combat original.
  setupRoadJoe(b) {
    b.roadJoe = true; b.name = 'JOE-VALLY DÉCHU'; b.roadForm = 'moto'; b.roadPhase2 = false; b.roadPhase3 = false;
    b.roadLiberated = false; b.roadRiding = false; b.roadGuardT = 0;
    b.ai.attack = null; b.ai.cd = 1.15; b.ai.stunT = 0; b.ai.pat = 0;
  },
  updateJoeRoadPhases(b) {
    if (!b.roadJoe || b.dying) return;
    const ratio = b.hp / b.maxHp;
    if (ratio <= 0.68 && !b.roadPhase2) {
      b.roadPhase2 = true; b.roadForm = 'bequilles'; b.roadRiding = false;
      b.ai.attack = null; b.ai.cd = 1.4; b.ai.stunT = 1.5;
      for (const h of this.hazards) if (h.owner === b) h.dead = true;
      this.slow = Math.max(this.slow, 0.7); this.flash = 0.35; this.flashCol = '#ffd34d';
      FX.shock(b.x, b.z, '#ffd34d'); Sound.sfx.ko();
      this.emit('banner', { text: 'PHASE 2 — BÉQUILLES', sub: 'Le pilote résiste au contrôle de Val Industries', col: '#ffd34d' });
    }
    if (ratio <= 0.34 && !b.roadPhase3) {
      b.roadPhase3 = true; b.roadForm = 'liberation';
      b.ai.attack = null; b.ai.cd = 1.7;
      this.spawnRoadBeacons(b);
      this.slow = Math.max(this.slow, 0.65);
      this.emit('banner', { text: 'PHASE 3 — LIBÉRATION', sub: 'Détruisez les trois balises, puis libérez Joe-Vally !', col: '#38e6ff' });
    }
  },
  spawnRoadBeacons(b) {
    if (b.roadBeaconsSpawned) return;
    b.roadBeaconsSpawned = true;
    const width = Math.max(220, this.LW);
    for (let i = 0; i < 3; i++) {
      this.hazards.push({ k:'roadbeacon', id:'joe_signal_'+i, x: this.camX + width * (0.25 + i * 0.21),
        z: [16, 37, 58][i], hp: 2, maxHp: 2, t: 0, dead: false });
    }
    if (this.convoy) this.convoy.event = null; // le final ne doit pas afficher simultanément le garage
    this.emit('toast', { text: 'Frappez chaque balise deux fois avec COUP !' });
  },
  hitRoadBeacons(a, m) {
    if (!this.boss || !this.boss.roadPhase3 || this.boss.roadLiberated) return;
    for (const h of this.hazards) {
      if (h.k !== 'roadbeacon' || h.dead || a.hitSet.has(h.id)) continue;
      const dx = (h.x - a.x) * (m.all ? sign(h.x - a.x) : a.face);
      const xOK = m.all ? Math.abs(h.x - a.x) <= Math.max(-m.reach[0], m.reach[1]) + 8
        : dx >= m.reach[0] - 8 && dx <= m.reach[1] + 8;
      if (!xOK || Math.abs(h.z - a.z) > m.zr + 7 || m.y[0] > 55) continue;
      a.hitSet.add(h.id); h.hp--; h.t = 0.2;
      Sound.sfx.zap(); FX.spark(h.x, h.z, 27, a.face, true, '#38e6ff');
      if (h.hp <= 0) {
        h.dead = true; FX.shock(h.x, h.z, '#38e6ff');
        this.roadProgress(1, 'Balise neutralisée', 'beacon');
        if (this.roadObjective && this.roadObjective.done) {
          this.boss.roadLiberated = true; this.boss.ai.stunT = Math.max(this.boss.ai.stunT, 3);
          this.emit('banner', { text: 'SIGNAL ROMPU', sub: 'Joe-Vally est vulnérable : terminez le combat !', col: '#5dffb0' });
          this.convoyRepair(12, 'Balises libérées');
        } else this.emit('toast', { text: 'BALISE DÉTRUITE !' });
      }
    }
  },
  updateRoadJoe(b, dt) {
    const ai = b.ai;
    if (b.state === 'intro') { b.st -= dt; if (b.st <= 0) b.state = 'idle'; return; }
    if (b.dying) { b.st -= dt; b.alpha = Math.max(0, b.alpha - dt * 0.65); if (b.alpha <= 0) b.remove = true; return; }
    if (b.hp <= 0) { b.dying = true; this.onKill(b, b.lastHitBy); return; }
    ai.stunT = Math.max(0, ai.stunT - dt);
    if (b.roadRiding || ai.stunT > 0) return;
    const A = ai.attack;
    if (!A) {
      ai.cd -= dt;
      if (ai.cd > 0) return;
      const t = this.nearestFoe(b);
      if (b.roadForm === 'moto') {
        this.spawnBikeCharge(b);
        ai.cd = 2.4;
      } else {
        const kind = (ai.pat++ % 3 === 1) ? 'lunge' : 'crutch';
        ai.attack = { k: kind, t: 0, fired: false, z: t ? t.z : BAND/2,
          x: t ? Math.max(this.camX + 25, Math.min(b.x - 25, t.x)) : b.x - 70 };
        Sound.sfx.whoosh(true);
      }
      return;
    }
    A.t += dt;
    const wind = (this.convoy && this.convoy.lights) ? 0.95 : 0.72;
    if (!A.fired && A.t >= wind) {
      A.fired = true; Sound.sfx.thud(); this.shake = Math.max(this.shake, 4);
      const reach = A.k === 'lunge' ? 115 : 70;
      const damage = A.k === 'lunge' ? 16 : 11;
      for (const p of this.players) {
        if (p.out || p.dying || p.inv > 0 || p.y > 15 || Math.abs(p.z - A.z) > 12 ||
            p.x < b.x - reach || p.x > b.x + 8) continue;
        if (p.parryT > 0) {
          this.parry(p, b); ai.stunT = 2.0;
          this.emit('toast', { text: 'BÉQUILLES PARÉES — CONTRE-ATTAQUE !' });
        } else this.envHit(p, damage, b.x, 'bequilles');
      }
      FX.shock(b.x - 45, A.z, '#ff9a3c');
    }
    if (A.t > wind + 0.35) { ai.attack = null; ai.cd = b.roadPhase3 ? 0.85 : 1.4; }
  },
  /* ---------------- JOE-VALLY (colosse) ---------------- */
  updateColossus(b, dt) {
    if (b.roadJoe) return this.updateRoadJoe(b, dt);
    const ai = b.ai;
    if (b.state === 'intro') { b.st -= dt; if (b.st <= 0) b.state = 'idle'; return; }
    if (b.dying) { b.st -= dt; b.alpha = Math.max(0, b.alpha - dt * 0.5); if (b.alpha <= 0) b.remove = true; return; }
    if (b.hp <= 0 && !b.dying) { b.dying = true; this.onKill(b, b.lastHitBy); return; }
    ai.stunT = Math.max(0, ai.stunT - dt);
    const enr = b.hp < b.maxHp * 0.5;
    const A = ai.attack;
    if (!A) {
      ai.cd -= dt * (enr ? 1.4 : 1);
      if (ai.cd <= 0) {
        const tgt = this.nearestFoe(b);
        const pats = ['beam', 'slam', 'sweep', 'slam', 'drones', 'beam'];
        const k = pats[ai.pat++ % pats.length];
        let drones = 0; for (const other of this.enemies) if (other.fly && !other.dying && !other.remove) drones++;
        if (k === 'drones' && drones >= 2) { ai.cd = 0.4; return; }
        ai.attack = { k, t: 0, z: tgt ? tgt.z : BAND / 2, x: tgt ? tgt.x : b.x - 120, z2: tgt ? clamp(tgt.z + (Math.random() < 0.5 ? -26 : 26), 4, BAND - 4) : 20, done: false };
        if (k === 'beam') Sound.sfx.laser();
      }
      return;
    }
    A.t += dt;
    if (A.k === 'beam') {
      if (A.t > 0.95 && !A.fired) { A.fired = true; Sound.sfx.beam(); this.shake = 4; }
      if (A.fired && A.t < 1.6) {
        for (const p of this.players) if (!p.out && p.inv <= 0 && p.y < 26 && (Math.abs(p.z - A.z) < 9 || (enr && Math.abs(p.z - A.z2) < 9)) && !['down', 'getup', 'dead', 'respawn', 'star'].includes(p.state) && p.x < b.x) this.envHit(p, 14, b.x, 'beam');
      }
      if (A.t > 1.7) { ai.attack = null; ai.cd = 1.1; }
    } else if (A.k === 'slam') {
      if (A.t < 0.6) { const tgt = this.nearestFoe(b); if (tgt) { A.x = lerp(A.x, tgt.x, dt * 3); A.z = lerp(A.z, tgt.z, dt * 3); } }
      if (A.t > 1.0 && !A.fired) {
        A.fired = true; this.shake = 9; Sound.sfx.ko(); FX.shock(A.x, A.z, '#ff3b5c'); FX.debris(A.x, A.z, 2, '#6a2a3a', 12);
        this.areaHit(b, A.x, A.z, 30, 14, { dmg: 16, kb: 160, launch: 240 }, true);
        ai.stunT = 1.6; this.emit('toast', { text: 'Le bras est bloqué : frappez le Core !' });
      }
      if (A.t > 2.4) { ai.attack = null; ai.cd = 0.8; }
    } else if (A.k === 'sweep') {
      if (A.t > 1.0 && !A.fired) { A.fired = true; Sound.sfx.whoosh(true); this.shake = 5; }
      if (A.fired && A.t < 1.35) for (const p of this.players) if (!p.out && p.inv <= 0 && p.y < 14 && p.x > b.x - 170 && !['down', 'getup', 'dead', 'respawn', 'star'].includes(p.state)) this.envHit(p, 12, b.x, 'sweep');
      if (A.t > 1.6) { ai.attack = null; ai.cd = 1; }
    } else if (A.k === 'drones') {
      if (!A.fired && A.t > 0.6) { A.fired = true; for (let i = 0; i < 2; i++) { const d = this.makeEnemy('drone', b.x - 30, rand(10, BAND - 10)); this.enemies.push(d); } Sound.sfx.zap(); }
      if (A.t > 1) { ai.attack = null; ai.cd = 1.6; }
    }
  },
  envHit(p, dmg, fromX, kind) {
    const dir = sign(p.x - fromX);
    Sound.at && Sound.at(p.x, p.z);
    this.damage(p, dmg * this.diff().edmg, null); p.flash = 0.12;
    FX.spark(p.x, p.z, p.y + 30, dir, true, '#ff6b5c'); Sound.sfx.punch(2); Sound.sfx.hurtPlayer(); haptic(50);
    if (p.grabbing) this.releaseGrab(p);
    p.state = 'fall'; p.vy = 220; p.vx = dir * 120; p.y = Math.max(1, p.y); p.bounced = false; p.move = null;
    if (p.hp <= 0) p.dying = true;
    this.hitstop = 0.05;
  },
  areaHit(src, x, z, r, zr, m, playersOnly) {
    const list = src.team === 1 ? this.players : this.enemies;
    for (const t of list) {
      if (t.out || t.inv > 0 || t.dying || t.colossus || ['down', 'getup', 'dead', 'respawn', 'star'].includes(t.state)) continue;
      if (Math.abs(t.x - x) < r && Math.abs(t.z - z) < zr && t.y < 30) {
        if (t.kind === 'player') this.envHit(t, m.dmg, x, 'area');
        else this.applyHit(src, t, M(Object.assign({ all: true, reach: [-r, r], zr, y: [0, 60] }, m)));
      }
    }
  },

  /* ---------------- Projectiles ---------------- */
  fireProj(f, m) {
    const tgt = this.nearestFoe(f);
    Sound.at && Sound.at(f.x, f.z);
    const n = m.count || 1;
    for (let i = 0; i < n; i++) {
      const base = { x: f.x + f.face * 16, z: f.z, y: 32, team: f.team, dmg: m.dmg * (f.power || 1), owner: f, life: 2.4, t: 0 };
      if (m.proj === 'zap') Object.assign(base, { k: 'zap', vx: f.face * 190, vz: 0, y: f.y, r: 6 });
      if (m.proj === 'wave') Object.assign(base, { k: 'wave', vx: f.face * 160, vz: 0, y: 4, r: 10, h: 46 });
      if (m.proj === 'taser') Object.assign(base, { k: 'taser', vx: f.face * 260, vz: 0, y: 34, r: 6, stun: true });
      if (m.proj === 'coin') { const tx = tgt ? tgt.x : f.x + f.face * 120; const tz = tgt ? tgt.z + (i - 1) * 14 : f.z; const T = 0.75; Object.assign(base, { k: 'coin', vx: (tx - base.x) / T, vz: (tz - f.z) / T, y: 40, vy: 160, g: true, r: 8 }); }
      if (m.proj === 'knife') { const sp = (i - (n - 1) / 2) * 12; Object.assign(base, { k: 'knife', vx: f.face * 250, vz: sp, y: 36, r: 6 }); }
      if (m.proj === 'weapon' && f.weapon) { const W = WEAPONS[f.weapon.kind]; Object.assign(base, { k: 'weapon', sub: f.weapon.kind, vx: f.face * 330, vz: 0, y: 34, r: 9, h: 16, dmg: W.thrown * (f.power || 1), life: 1.2 }); }
      if (m.pcol) base.col = m.pcol;
      if (m.proj === 'shock') { Object.assign(base, { k: 'shock', vx: 200, vz: 0, y: 0, r: 8, h: 12 }); this.projs.push(Object.assign({}, base, { vx: -200 })); }
      this.projs.push(base);
    }
    if (m.proj === 'weapon') { f.weapon = null; Sound.sfx.whoosh(true); }
    if (m.proj === 'wave') Sound.sfx.wave(); else if (m.proj === 'taser' || m.proj === 'zap') Sound.sfx.zap(); else if (m.proj === 'coin') Sound.sfx.money();
  },
  updateProjs(dt) {
    for (const pr of this.projs) {
      pr.t += dt; pr.x += pr.vx * dt; pr.z += (pr.vz || 0) * dt;
      if (pr.g) { pr.vy -= GRAV * 0.7 * dt; pr.y += pr.vy * dt; if (pr.y <= 0) { pr.y = 0; pr.vx *= 0.3; pr.vz = 0; pr.life = Math.min(pr.life, pr.t + 0.3); } }
      if (pr.t > pr.life || pr.x < this.camX - 60 || pr.x > this.camX + this.LW + 60) { pr.dead = true; if (pr.k === 'weapon' && pr.sub !== 'bottle' && pr.x > this.camX && pr.x < this.camX + this.LW) this.spawnItem('weapon', pr.sub, pr.x, pr.z, 10); continue; }
      const list = pr.team === 1 ? this.players : this.enemies;
      Sound.at && Sound.at(pr.x, pr.z);
      for (const t of list) {
        if (t.out || t.inv > 0 || t.dying || ['down', 'getup', 'dead', 'respawn', 'star'].includes(t.state)) continue;
        const ph = pr.h || 12;
        if (Math.abs(t.x - pr.x) < pr.r + t.w * 0.6 && Math.abs(t.z - pr.z) < 8 && pr.y < t.y + t.h && pr.y + ph > t.y) {
          // parade d'un projectile : il repart vers l'ennemi
          if (t.kind === 'player' && t.parryT > 0 && pr.team === 1 && !pr.g) {
            pr.team = 0; pr.vx = -pr.vx * 1.15; pr.vz = 0; pr.owner = t; pr.t = 0; pr.life = 1.4; pr.stun = false; pr.dmg *= 1.5;
            t.parryT = 0; this.stats.parries++; FX.text(t.x, t.z, 66, 'RENVOI !', '#9ff4ff'); FX.spark(pr.x, pr.z, pr.y + 10, sign(pr.vx), true, '#9ff4ff');
            Sound.sfx.parry && Sound.sfx.parry(); haptic(30); this.slow = Math.max(this.slow, 0.3); this.emit('parry', { idx: t.idx });
            break;
          }
          pr.dead = true;
          const dir = sign(pr.vx || 1);
          if (pr.stun) { this.damage(t, pr.dmg * this.diff().edmg, null); t.flash = 0.15; t.state = 'hurt'; t.st = 0.9; t.zap = 0.8; t.vx = dir * 20; Sound.sfx.zap(); FX.zap(t.x, t.z, t.y + 30); if (t.hp <= 0) { t.dying = true; t.state = 'fall'; t.vy = 160; t.y = 1; } }
          else if (t.kind === 'player') this.envHit(t, pr.dmg, pr.x - dir * 10, pr.k);
          else if (pr.owner) {
            // arme lancée par un joueur
            this.applyHit(pr.owner, t, M({ dmg: pr.dmg / (pr.owner.power || 1), kb: 140, launch: 200, all: true, reach: [-99, 99], y: [0, 200], zr: 99, hs: 0.07, sfx: 1.9, shake: 2 }));
            if (pr.k === 'weapon') { if (pr.sub === 'bottle') { Sound.sfx.glass(); FX.debris(t.x, t.z, 40, '#5fe08a', 8); } else this.spawnItem('weapon', pr.sub, t.x, t.z, 26); }
          }
          break;
        }
      }
    }
    compact(this.projs, 'dead');
  },

  /* ---------------- Objets ---------------- */
  spawnItem(kind, sub, x, z, y) { this.items.push({ id: UID++, kind, sub, x, z, y: y || 0, vy: y ? 120 : 0, vx: rand(-30, 30), t: 0, remove: false }); },
  breakProp(pr, a) {
    pr.remove = true;
    const col = { trash: '#5c6b5e', barrel: '#a5482a', crate: '#a8773c', basket: '#c49a52', drum: '#2f6fb3', speaker: '#2b2b33', server: '#2a3346' }[pr.type] || '#888';
    FX.debris(pr.x, pr.z, 14, col, 12); FX.dust(pr.x, pr.z, 5, 1);
    if (pr.type === 'drum' || pr.type === 'trash' || pr.type === 'server') Sound.sfx.metal(); else Sound.sfx.crate();
    this.spawnItem(pr.content[0], pr.content[1], pr.x, pr.z, 8);
    if (a) this.addScore(a, 100);
    this.hitstop = Math.max(this.hitstop, 0.03);
  },
  updateItems(dt) {
    for (const it of this.items) {
      it.t += dt;
      if (it.y > 0 || it.vy > 0) { it.vy -= GRAV * 0.8 * dt; it.y += it.vy * dt; it.x += it.vx * dt; if (it.y <= 0) { it.y = 0; it.vy = 0; it.vx = 0; } }
      if (it.kind === 'weapon') { if (it.t > 14) it.remove = true; continue; }
      if (it.y > 2) continue;
      for (const p of this.players) {
        if (p.out || p.state === 'dead' || p.dying) continue;
        if (Math.abs(p.x - it.x) < 13 && Math.abs(p.z - it.z) < 8 && p.y < 6) {
          if (it.kind === 'food') { const F = FOODS[it.sub]; if (p.hp >= p.maxHp && it.sub !== 'tangawisi') continue; p.hp = Math.min(p.maxHp, p.hp + F.hp); p.rec = 0; Sound.sfx.food(); FX.text(it.x, it.z, 30, '+' + F.hp + ' ' + F.label, '#5dffb0'); }
          else if (it.kind === 'money') { const v = MONEY[it.sub]; this.addScore(p, v); Sound.sfx.money(); FX.text(it.x, it.z, 30, '+' + v, '#ffd34d'); }
          else if (it.kind === 'star') { p.stars = Math.min(3, p.stars + 1); Sound.sfx.star(); FX.text(it.x, it.z, 30, '★ +1', '#ffd34d'); }
          it.remove = true; break;
        }
      }
    }
  },

  // V26.4 — le barrage est une cible de mêlée, pas un jet de dés invisible.
  hitRoadBlocks(a, m) {
    if (!this.stage || !this.stage.dlcRoad || !a || !a.hitSet) return;
    for (const h of this.hazards) {
      if (h.k !== 'roadblock' || h.dead || a.hitSet.has(h.id)) continue;
      const dx = (h.x - a.x) * (m.all ? sign(h.x - a.x) : a.face);
      if (Math.abs(h.z - a.z) > (m.zr || 12) + 7 || dx < m.reach[0] - 14 || dx > m.reach[1] + 14 || m.y[0] >= 38) continue;
      a.hitSet.add(h.id);
      h.hp--; h.flash = 0.17;
      Sound.sfx.metal(); FX.spark(h.x, h.z, 22, a.face, h.hp <= 0, '#ffb347');
      if (h.hp <= 0) {
        h.dead = true;
        FX.debris(h.x, h.z, 22, '#f38b32', 10);
        this.convoyRepair(3, 'Barrage détruit');
        this.roadProgress(1, 'Barrage détruit', 'barrier');
        this.emit('toast', { text: 'BARRAGE NEUTRALISÉ !' });
      }
    }
  },
  // V26.4 — une réparation de Carly visible dans le décor et protégée par une embuscade.
  startRoadRepair() {
    if (!this.convoy || this.convoy.event || !this.roadObjective || this.roadObjective.done) return false;
    const c = this.convoy;
    c.event = { k: 'repair', x: this.camX + this.LW * 0.58, z: BAND * 0.55,
      t: 28, progress: 0, need: 8, heal: c.kit ? 22 : 16, fail: 12 };
    this.spawnEnemy('motard', 'R');
    this.spawnEnemy('voyou', 'L');
    this.emit('banner', { text: 'CARLY : RÉPARATION', sub: 'Éliminez les saboteurs !', col: '#ffd34d' });
    return true;
  },
  /* ---------------- Dangers ---------------- */
  updateHazards(dt) {
    for (const h of this.hazards) {
      if (h.k === 'roadblock') {
        if (h.flash > 0) h.flash = Math.max(0, h.flash - dt);
        // Le joueur peut contourner un barrage, mais le convoi en paie le prix.
        if (!h.dead && h.x < this.camX - 25) {
          h.dead = true;
          this.convoyHit(7, 'Barrage évité');
          this.emit('toast', { text: 'BARRAGE NON NEUTRALISÉ : CONVOI ENDOMMAGÉ' });
        }
        continue;
      }
      h.t -= dt;
      if (h.k === 'roadbeacon') { h.t = Math.max(0, h.t); continue; }
      if (h.k === 'bikecharge') {
        // V25 original contained a timer cancellation (`h.t -= dt; h.t += dt`). Fixed here.
        if (h.phase === 'warn') { h.t += 2 * dt; if (!h.warn && h.t > h.wind - 0.22) { h.warn = true; Sound.sfx.horn(); } if (h.t >= h.wind) { h.phase = 'charge'; h.t = 0; } continue; }
        h.x += h.dir * h.speed * dt;
        for (const p of this.players) {
          if (p.out || p.inv > 0 || p.y > 12 || h.hit) continue;
          if (Math.abs(p.x - h.x) < 18 && Math.abs(p.z - h.z) < 10) {
            h.hit = true;
            if (p.parryT > 0) {
              p.parryT = 0; this.stats.parries++; this.slow = Math.max(this.slow, 0.3);
              FX.spark(h.x, h.z, 25, 1, true, '#9ff4ff'); this.convoyRepair(4, 'Charge parée'); h.dead = true;
              if (h.owner) { h.owner.roadRiding = false; h.owner.ai.stunT = 2; h.owner.ai.cd = 1.2; }
              this.emit('toast', { text: 'MOTO PARÉE !' });
            } else { this.envHit(p, 14, h.x, 'moto'); this.convoyHit(5, 'Charge moto'); }
          }
        }
        if (h.x < this.camX - 90 || h.x > this.camX + this.LW + 90) {
          h.dead = true;
          if (h.owner) { h.owner.roadRiding = false; h.owner.ai.stunT = 1.1; h.owner.ai.cd = 1; }
        }
      } else if (h.k === 'train') {
        if (h.phase === 'idle' && h.t <= 0 && this.bossPhase !== 'intro') { h.phase = 'warn'; h.t = 1.8; Sound.sfx.horn(); this.emit('toast', { text: 'TRAIN ! Quittez la voie du fond' }); }
        else if (h.phase === 'warn' && h.t <= 0) { h.phase = 'pass'; h.t = 1.4; h.x = this.camX + this.LW + 40; Sound.sfx.train(); }
        else if (h.phase === 'pass') {
          h.x -= 820 * dt;
          for (const f of this.players.concat(this.enemies)) {
            if (f.out || f.dying || f.colossus || f.z > 24 || f.inv > 0 || ['down', 'getup', 'dead', 'fall'].includes(f.state)) continue;
            if (f.x > h.x - 10 && f.x < h.x + 360) {
              if (f.kind === 'player') this.envHit(f, 22, f.x + 40, 'train');
              else { this.damage(f, 40, null); f.state = 'fall'; f.vy = 260; f.vx = -220; f.y = 1; f.flash = 0.12; if (f.hp <= 0) { f.dying = true; this.onKill(f, null); } }
            }
          }
          if (h.t <= 0) { h.phase = 'idle'; h.t = rand(11, 16); }
        }
      } else if (h.k === 'lightning') {
        if (h.phase === 'idle' && h.t <= 0) {
          const tgt = pick(this.players.filter((p) => !p.out)) || this.players[0];
          h.phase = 'warn'; h.t = 1.1; h.x = tgt.x + rand(-20, 20); h.z = clamp(tgt.z + rand(-8, 8), 4, BAND - 4);
        } else if (h.phase === 'warn' && h.t <= 0) {
          h.phase = 'idle'; h.t = rand(5, 8); this.lightning = 1; Sound.sfx.thunder(); FX.bolt(h.x, h.z); this.shake = 6;
          for (const f of this.players.concat(this.enemies)) {
            if (f.out || f.dying || f.colossus || f.inv > 0 || ['down', 'getup', 'dead'].includes(f.state)) continue;
            if (Math.abs(f.x - h.x) < 20 && Math.abs(f.z - h.z) < 12) {
              if (f.kind === 'player') this.envHit(f, 14, h.x, 'bolt');
              else { this.damage(f, 30, null); f.state = 'fall'; f.vy = 240; f.vx = sign(f.x - h.x) * 120; f.y = 1; f.zap = 0.6; if (f.hp <= 0) { f.dying = true; this.onKill(f, null); } }
            }
          }
        }
      }
    }
  },

  // Charge moto : élément scénarisé réellement affiché par le moteur de rendu.
  spawnBikeCharge(owner) {
    const left = owner ? false : Math.random() < 0.5;
    const h = { k: 'bikecharge', x: left ? this.camX - 30 : this.camX + this.LW + 30,
      z: owner ? ((this.nearestFoe(owner) || {}).z ?? BAND / 2) : rand(8, BAND - 8),
      dir: left ? 1 : -1, speed: owner ? 380 : 315, phase: 'warn', t: 0,
      wind: this.convoy && this.convoy.lights ? 1.15 : 0.92, hit: false, dead: false,
      owner: owner || null };
    this.hazards.push(h);
    if (owner) owner.roadRiding = true;
    this.emit('toast', { text: owner ? 'JOE-VALLY CHARGE ! PHARE, ESQUIVE OU PARADE !' : 'PHARE EN APPROCHE — ESQUIVEZ OU PAREZ !' });
  },
  convoyHit(amount, why) { const c = this.convoy; if (!c) return; const k = c.armor ? 0.72 : (c.tires ? 0.85 : 1); c.hp = clamp(c.hp - amount * k, 0, c.max); if (c.hp <= 0 && !c.emergency) { c.emergency = true; this.emit('banner', { text: 'CONVOI EN URGENCE', sub: 'Protégez Carly Dokota', col: '#ff3b5c' }); } this.emit('convoy', { hp: c.hp, max: c.max, why: why || '' }); },
  convoyRepair(amount, why) { const c = this.convoy; if (!c) return; c.hp = clamp(c.hp + amount, 0, c.max); if (c.hp > 20) c.emergency = false; this.emit('convoy', { hp: c.hp, max: c.max, why: why || '' }); },
  roadProgress(n, text, kind) {
    const g = this.roadObjective;
    if (!g || g.done) return;
    // Des vagues vaincues ne réparent pas un relais, ne détruisent pas un barrage
    // et ne libèrent pas Joe-Vally : un événement concret doit être accompli.
    const accepted = { freeJoe: 'beacon', barriers: 'barrier', repair: 'repair', rail: 'repair', defend: 'wave', unity: 'wave' };
    if (accepted[g.id] && accepted[g.id] !== kind) return;
    g.value = Math.min(g.need, g.value + (n || 1));
    if (g.value >= g.need) { g.done = true; this.convoyRepair(8, 'Objectif réussi'); this.emit('toast', { text: 'OBJECTIF RÉUSSI : ' + (text || g.label) }); }
    this.emit('roadgoal', g);
  },
  updateConvoy(dt) {
    const c = this.convoy; if (!c || this.state !== 'play') return;
    if (c.event) { const ev = c.event; if (ev.k === 'repair') { ev.t -= dt; let danger = false; for (const e of this.enemies) if (!e.dying && Math.abs(e.x - ev.x) < 48 && Math.abs(e.z - ev.z) < 22) { danger = true; break; } if (!danger) ev.progress = Math.min(ev.need, ev.progress + dt); if (ev.progress >= ev.need) { this.convoyRepair(ev.heal, 'Réparation Carly'); this.roadProgress(1, 'Réparation terminée', 'repair'); this.emit('toast', { text: 'CARLY : convoi réparé +' + ev.heal + '%' }); c.event = null; } else if (ev.t <= 0) { this.convoyHit(ev.fail, 'Réparation interrompue'); this.emit('toast', { text: 'RÉPARATION INTERROMPUE' }); c.event = null; } } return; }
    // Pendant le final, seule la mécanique scénarisée de Joe-Vally génère des dangers.
    if (this.stage.id === 'lubumbashi_unity' && this.bossPhase === 'fight') return;
    c.nextT -= dt; if (c.nextT > 0 || this.enemies.length > 2) return; c.nextT = rand(12, 20);
    const roll = Math.random();
    if (roll < 0.40) { c.event = { k: 'repair', x: this.camX + this.LW * 0.58, z: BAND * 0.5, t: 20, progress: 0, need: 7, heal: c.kit ? 22 : 16, fail: 12 }; this.emit('banner', { text: 'RÉPARATION D’URGENCE', sub: 'Défendez Carly Dokota', col: '#ffd34d' }); this.emit('toast', { text: 'CARLY : gardez les ennemis loin du garage mobile !' }); }
    else if (roll < 0.7) this.spawnBikeCharge();
    else { this.convoyHit(7, 'Barrage de Val Industries'); this.emit('banner', { text: 'BARRAGE VAL INDUSTRIES', sub: 'Le convoi a été ralenti', col: '#ff5a3c' }); }
  },
  offerCarlyGarage() {
    const c = this.convoy; if (!c) return;
    const pool = [ { id:'tires', label:'PNEUS MIXTES', desc:'-15 % de dégâts de route', apply:()=>{c.tires=true;} }, { id:'armor', label:'BLINDAGE CONVOI', desc:'+20 intégrité maximale', apply:()=>{c.armor=true;c.max+=20;c.hp+=20;} }, { id:'lights', label:'PHARES LONGUE PORTÉE', desc:'Attaques ennemies plus lisibles', apply:()=>{c.lights=true;} }, { id:'kit', label:'KIT DE RÉPARATION', desc:'Réparations Carly améliorées', apply:()=>{c.kit=true;this.convoyRepair(12,'Kit Carly');} } ];
    const available = pool.filter(x => !this.roadRun.upgrades.includes(x.id));
    // Après les quatre améliorations uniques : entretien gratuit, jamais d'écran bloquant.
    if (!available.length) { this.convoyRepair(25, 'Entretien Carly'); this.garageChoices = null; if (this._pendingClear) { this._pendingClear = false; this.state = 'clear'; this.emit('clear'); } else this.state = 'play'; return; }
    const choices=[]; while(choices.length<3&&available.length) choices.push(available.splice(Math.floor(Math.random()*available.length),1)[0]);
    this.garageChoices=choices; this.state='garage'; this.emit('garage',{choices:choices.map(x=>({id:x.id,label:x.label,desc:x.desc}))});
  },
  chooseGarage(id) { if(this.state!=='garage'||!this.garageChoices)return; const x=this.garageChoices.find(q=>q.id===id);if(!x)return;x.apply();this.roadRun.upgrades.push(x.id);this.garageChoices=null;this.emit('toast',{text:'CARLY : '+x.label+' installé.'});this.emit('convoy',{hp:this.convoy.hp,max:this.convoy.max}); if(this._pendingClear){this._pendingClear=false;this.state='clear';this.emit('clear');}else this.state='play'; },
  /* ---------------- Vagues & caméra ---------------- */
  spawnEnemy(type, side) {
    const fromL = side === 'L' || (side !== 'R' && Math.random() < 0.35);
    const x = fromL ? this.camX - 26 : this.camX + this.LW + 26;
    const drop = !fromL && Math.random() < 0.25 && type !== 'drone';
    const e = this.makeEnemy(type, drop ? this.camX + rand(this.LW * 0.4, this.LW * 0.9) : x, rand(6, BAND - 6), { drop });
    e.face = fromL ? 1 : -1;
    this.enemies.push(e);
    return e;
  },
  updateWaves(dt) {
    // Laisser finir l'intervention de Carly avant le passage à la vague suivante.
    if (this.convoy && this.convoy.event && this.convoy.event.k === 'repair'
        && this.stage && ['repair', 'rail'].includes(this.stage.roadGoal) && !this.wave && this.bossPhase === 'none') return;
    const w = this.wave;
    if (w) {
      w.spawnT -= dt;
      const alive = this.enemies.filter((e) => !e.dying && !e.remove).length;
      if (w.spawned < w.list.length && w.spawnT <= 0 && alive < this.diff().maxOn + (this.coop ? 2 : 0)) {
        this.spawnEnemy(w.list[w.spawned], w.spawned % 3 === 1 ? 'L' : 'R');
        w.spawned++; w.spawnT = rand(0.35, 0.9);
      }
      if (w.spawned >= w.list.length && alive === 0) {
        w.done = true; this.wave = null; this.lockR = Infinity; this.go = 3.5;
        if (this.stage.dlcRoad) {
          this.roadProgress(1, 'Zone sécurisée', 'wave');
          // Aux relais de Kikwit et Kamina : les premières victoires ouvrent
          // une réparation défendable (en lieu et place d'un simple toast).
          if (['repair', 'rail'].includes(this.roadObjective.id) && !this.roadObjective.done) this.startRoadRepair();
        }
        Sound.sfx.go(); this.emit('go');
      }
      return;
    }
    if (this.bossPhase !== 'none') {
      if (this.bossPhase === 'ko' && !this.enemies.some((e) => e.kind === 'boss' && !e.remove && e.alpha > 0.05 && e.state !== 'dead')) {
        if (this.stage.boss2 && !this.phase2) { this.startPhase2(); return; }
        this.bossPhase = 'done'; this.clearT = 2.2;
      }
      if (this.bossPhase === 'done') { this.clearT -= dt; if (this.clearT <= 0) { this.bossPhase = 'over'; if (this.stage.dlcRoad && this.stageIdx < STAGES.length - 1) { this._pendingClear = true; this.offerCarlyGarage(); } else { this.state = 'clear'; this.emit('clear'); } } }
      return;
    }
    const right = this.camX + this.LW;
    const nw = this.waves[this.waveIdx];
    if (nw && right >= nw.trig + this.LW * 0.25) {
      this.waveIdx++; this.wave = nw; nw.active = true; nw.spawnT = 0.2; this.lockR = this.camX + this.LW; this.go = 0;
      // vague doublée en coop / difficile
      if (this.coop || Settings.diff >= 2) nw.list = nw.list.concat(nw.list.slice(0, Math.ceil(nw.list.length / 2)));
    } else if (!nw && right >= this.stageLen - 4) {
      // arène du boss
      this.lockR = this.stageLen; this.go = 0; this.bossPhase = 'intro';
      const S = this.stage;
      const B = BOSSES[S.boss];
      const b = B.colossus ? this.makeBoss(S.boss, this.stageLen - 66, BAND / 2) : this.makeBoss(S.boss, this.stageLen + 30, BAND * 0.5);
      if (B.colossus) { b.state = 'intro'; b.st = 1; }
      else b.state = 'intro';
      this.enemies.push(b); this.boss = b;
      if (S.id === 'lubumbashi_unity') this.setupRoadJoe(b);
      Sound.playMusic('boss', (this.stage.ch || 0) + 1);
      this.emit('bossintro', { id: S.boss });
      this.bossPhase = 'fight';
    }
  },
  startPhase2() {
    const S = this.stage;
    this.phase2 = true;
    S.bg = S.bg2 || S.bg; S.floor = S.floor2 || S.floor; S.fx = S.fx2 || S.fx; S.grade = S.grade2 || S.grade; S.light2 = S.light2b || S.light2;
    this.hazards = []; this.props = []; this.items = this.items.filter((i) => i.kind !== 'weapon');
    this.flash = 1; this.flashCol = '#ff3b5c'; this.shake = 10;
    for (const p of this.players) { if (!p.out) { p.inv = 2; p.state = p.dying ? p.state : 'idle'; p.x = this.camX + this.LW * (p.idx ? 0.32 : 0.22); p.z = BAND * (p.idx ? 0.7 : 0.4); } }
    const B = BOSSES[S.boss2];
    const b = this.makeBoss(S.boss2, this.stageLen - 66, BAND / 2);
    if (B.colossus) { b.state = 'intro'; b.st = 1.6; }
    this.enemies.push(b); this.boss = b; this.bossPhase = 'fight';
    Sound.playMusic(S.music2 || 'core');
    this.emit('phase2', { text: STORY.phase2 });
    this.emit('bossintro', { id: S.boss2 });
  },
  updateCamera(dt) {
    const alive = this.players.filter((p) => !p.out);
    if (!alive.length) return;
    let ax = 0; for (const p of alive) ax += p.x; ax /= alive.length;
    // anticipation : la caméra regarde un peu devant le héros (lissée)
    const lead = alive.length === 1 ? alive[0].face * this.LW * 0.06 * (alive[0].running ? 1.6 : 1) : 0;
    this.camLead = lerp(this.camLead || 0, lead, 1 - Math.pow(0.05, dt));
    let target = ax - this.LW * 0.42 + this.camLead;
    const maxR = Math.min(this.lockR, this.stageLen) - this.LW;
    target = clamp(target, this.camMin, Math.max(this.camMin, maxR));
    if (this.coop && alive.length === 2) { const lo = Math.min(alive[0].x, alive[1].x); target = Math.min(target, lo - 20); target = Math.max(target, this.camMin); }
    this.camX = Math.max(this.camMin, lerp(this.camX, target, 1 - Math.pow(0.002, dt)));
    this.camMin = this.camX;
    if (this.go > 0) this.go -= dt * 0.3;
    const kd = Math.pow(0.0005, dt); this.kickX = (this.kickX || 0) * kd; this.kickY = (this.kickY || 0) * kd;
  },

  /* ---------------- Animation (poses) ---------------- */
  animate(f, dt) {
    if (f.colossus || f.fly) return;
    const S = f.state;
    let tgt;
    const t = this.t;
    if (S === 'attack' && f.move) {
      const m = f.move;
      const pa = POSES[m.pa] || POSES.idle, pb = POSES[m.pb] || POSES.idle;
      tgt = _tmpPose;
      if (f.mt < m.act[0]) lerpPose(tgt, POSES.idle, pa, easeOut(clamp(f.mt / Math.max(0.04, m.act[0]), 0, 1)));
      else if (f.mt < m.act[1] + 0.04) lerpPose(tgt, pa, pb, clamp((f.mt - m.act[0]) / 0.045, 0, 1));
      else lerpPose(tgt, pb, POSES.idle, clamp((f.mt - m.act[1]) / Math.max(0.05, m.t - m.act[1]), 0, 1) * 0.85);
      if (m.spin) f.spinFace = Math.floor(f.mt * 14) % 2 ? -1 : 1; else f.spinFace = 1;
      f.lash = m.lashFx && f.mt > m.act[0] && f.mt < m.act[1] + 0.08;
      f.pose = tgt.slice(); return;
    }
    f.spinFace = 1; f.lash = false;
    if (S === 'walk') {
      const run = f.running && Math.abs(f.vx) > WALK * 1.2;
      const spd = Math.hypot(f.vx, f.vz);
      f.walkPh += dt * (run ? 15 : 10) * clamp(spd / (WALK * (f.speed || 1)), 0.5, 1.2);
      const s = Math.sin(f.walkPh), c = Math.cos(f.walkPh), A = run ? 13 : 8, Lf = run ? 8 : 4.5;
      tgt = _tmpPose; const b = POSES.idle;
      for (let i = 0; i < PK; i++) tgt[i] = b[i];
      tgt[1] = 29 - Math.abs(s) * (run ? 2.2 : 1) + (run ? -1 : 0);
      tgt[2] = run ? 0.32 : 0.1;
      tgt[8] = 2 + s * A; tgt[9] = Math.max(0, c) * Lf;
      tgt[10] = -2 - s * A; tgt[11] = Math.max(0, -c) * Lf;
      if (run) { tgt[4] = 6 - s * 8; tgt[5] = -2 + Math.abs(s) * 4; tgt[6] = 4 + s * 8; tgt[7] = 0; }
      else { tgt[4] = 9 + s * 1.5; tgt[5] = 2; tgt[6] = 5 - s * 1.5; tgt[7] = 5; }
    } else if (S === 'idle' || S === 'respawn') {
      tgt = _tmpPose; const b = f.state === 'respawn' && f.y > 0 ? POSES.jump : POSES.idle;
      for (let i = 0; i < PK; i++) tgt[i] = b[i];
      const br = Math.sin(t * 4 + f.id) * 0.7;
      tgt[1] += br * 0.6; tgt[5] += br; tgt[7] += br * 0.8;
      if (f.kind !== 'player' && f.hp < f.maxHp * 0.25) { tgt[2] += 0.15; }
    } else if (S === 'jump') tgt = f.vy > 60 ? POSES.jump : POSES.air_kick.map((v, i) => lerp(POSES.jump[i], v, 0.2));
    else if (S === 'hurt') tgt = f.zap > 0 ? (Math.floor(t * 30) % 2 ? POSES.hurt : POSES.hurt2) : f.hurtAlt ? POSES.hurt2 : POSES.hurt;
    else if (S === 'block') tgt = POSES.block;
    else if (S === 'fall' || S === 'thrown') tgt = POSES.fall;
    else if (S === 'down' || S === 'dead') tgt = POSES.down;
    else if (S === 'getup') tgt = POSES.getup;
    else if (S === 'grab') tgt = POSES.grab;
    else if (S === 'egrab') { if (f.knee > 0) { f.knee -= dt; tgt = POSES.knee; } else tgt = POSES.grab; }
    else if (S === 'grabbed') tgt = POSES.hurt2;
    else if (S === 'star') tgt = f.st > 0.7 ? POSES.taunt : POSES.victory;
    else if (S === 'taunt' || S === 'intro') tgt = S === 'intro' ? POSES.idle : POSES.taunt;
    else if (S === 'victory') tgt = POSES.victory;
    else tgt = POSES.idle;
    const k = S === 'fall' || S === 'down' ? 1 - Math.pow(0.0001, dt) : 1 - Math.pow(0.00002, dt);
    for (let i = 0; i < PK; i++) f.pose[i] += (tgt[i] - f.pose[i]) * k;
    if (S === 'fall' || S === 'thrown') { f.pose[12] = clamp(1.0 + (f.vy < 0 ? 0.4 : 0), 0, 1.6); }
    // tresse : inertie secondaire
    f.tail += ((-f.vx * 0.006 + (f.vy || 0) * 0.002) - f.tail) * Math.min(1, dt * 8);
  },

  /* ---------------- Test : état textuel ---------------- */
  snapshot() {
    return {
      state: this.state, stage: this.stageIdx, stageName: this.stage && this.stage.name, coop: this.coop,
      cam: Math.round(this.camX), stageLen: this.stageLen, view: [Math.round(this.LW), Math.round(this.LH)],
      wave: this.wave ? { left: this.wave.list.length - this.wave.spawned } : null, waveIdx: this.waveIdx, boss: this.boss ? { name: this.boss.name, hp: Math.round(this.boss.hp), max: this.boss.maxHp } : null, bossPhase: this.bossPhase, phase2: this.phase2,
      players: this.players.map((p) => ({ hero: p.hero.id, x: Math.round(p.x), z: Math.round(p.z), y: Math.round(p.y), hp: Math.round(p.hp), rec: Math.round(p.rec), state: p.state, lives: p.lives, stars: p.stars, score: p.score, combo: p.combo, comboPts: p.comboPts, weapon: p.weapon && p.weapon.kind })),
      enemies: this.enemies.filter((e) => !e.remove).map((e) => ({ type: e.type || e.bossId, x: Math.round(e.x), z: Math.round(e.z), hp: Math.round(e.hp), state: e.state })),
      items: this.items.length, props: this.props.length, projs: this.projs.length,
    };
  },
};
const _tmpPose = new Array(PK).fill(0);
