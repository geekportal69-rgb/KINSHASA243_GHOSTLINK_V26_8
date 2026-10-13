/* =========================================================
   GHOSTLINK V12.3 — sprites.js
   V12.4 : chute aérienne, relevé, coup au ventre, saisi/sonné (ennemis et boss) ;
   héros : projection, revers arrière, respiration (2 poses de garde), provocation.
   V12.3 : pose de préparation (« wind ») pour ennemis et boss, coup spécial des boss,
   pose de victoire des héros, seconde apparence pour les voyous et les kulunas.
   Sprites illustrés pour TOUS les combattants humains :
   - 3 héros : 26 poses chacun (portraits du menu comme référence) ;
   - 7 types d'ennemis et 24 boss : 7 poses chacun.
   Chaque pose est choisie selon l'état du combattant, puis animée procéduralement
   (respiration, rebond, inclinaison, anticipation / étirement, écrasement, bascule).
   Le drone et le colosse JOE-VALLY gardent leur rendu dédié. Si une image manque,
   le moteur retombe automatiquement sur le rig vectoriel (aucun écran vide possible).
   ========================================================= */
'use strict';

const Sprites = {
  meta: window.SPR_META || {},
  img: {},       // img[clé][pose] = HTMLImageElement
  white: {},     // silhouettes blanches pré-calculées (flash d'impact)
  ready: {},     // ready[clé] = true quand le jeu de poses est chargé
  pending: {},
  failed: [],
  BASE: 400,     // hauteur en pixels de la pose « idle » dans les fichiers
  H: 84,         // hauteur logique d'un combattant de gabarit 1

  key(f) {
    if (f.kind === 'player') return f.hero && f.hero.id;
    if (f.kind === 'boss') return f.colossus ? null : 'b_' + f.bossId;
    if (f.fly) return null;
    // seconde apparence : un ennemi sur deux (selon son identifiant) quand elle existe
    if (f.look2 == null) f.look2 = (f.id || 0) % 2 === 1 && this.has('e_' + f.type + '2');
    return 'e_' + f.type + (f.look2 ? '2' : '');
  },
  has(k) { return !!(k && this.meta[k]); },

  load(k) {
    if (!this.has(k)) return Promise.resolve();
    if (this.pending[k]) return this.pending[k];
    this.img[k] = {}; this.white[k] = {};
    const names = Object.keys(this.meta[k]);
    this.pending[k] = Promise.all(names.map((n) => new Promise((res) => {
      const im = new Image();
      if (location.protocol !== 'file:') im.crossOrigin = 'anonymous';
      im.decoding = 'async';
      im.onload = () => { this.img[k][n] = im; this.makeWhite(k, n, im); res(); };
      im.onerror = () => { this.failed.push(k + '_' + n); res(); };
      im.src = 'assets/spr/' + k + '_' + n + '.webp';
    }))).then(() => { this.ready[k] = !!this.img[k].idle; });
    return this.pending[k];
  },
  loadHeroes() { return Promise.all(['kabongo', 'nzinga', 'makasi'].map((h) => this.load(h))); },
  // ennemis du stage + boss (+ boss de la phase 2), chargés à la demande
  loadStage(S) {
    const keys = new Set();
    (S.pool || []).forEach((t) => { keys.add('e_' + t); keys.add('e_' + t + '2'); });
    if (S.heavy) [].concat(S.heavy).forEach((t) => keys.add('e_' + t));
    if (S.boss) keys.add('b_' + S.boss);
    if (S.boss2) keys.add('b_' + S.boss2);
    const B = BOSSES[S.boss]; if (B && B.summon) B.summon.forEach((t) => keys.add('e_' + t));
    return Promise.all([...keys].map((k) => this.load(k)));
  },

  makeWhite(k, n, im) {
    try {
      const c = document.createElement('canvas');
      const s = 0.5; // demi-résolution : suffisant pour un flash de 2 images
      c.width = Math.max(1, Math.round(im.naturalWidth * s)); c.height = Math.max(1, Math.round(im.naturalHeight * s));
      const x = c.getContext('2d');
      x.drawImage(im, 0, 0, c.width, c.height);
      x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
      this.white[k][n] = c;
    } catch (e) { /* canvas indisponible : pas de flash blanc */ }
  },

  // correspondance pose d'attaque (pb) -> image des héros
  PB: {
    jab: 'jab', cross: 'hook', hook: 'hook', dash_elbow: 'dash', lash: 'hook', swing: 'hook', throw: 'hook',
    upper: 'upper', knee: 'kick', kick_mid: 'kick', kick_high: 'kick', slide: 'dash', tackle: 'run',
    spin: 'special', helico: 'special', splash: 'special', hammer: 'special', axe: 'special', pound: 'special',
    grab: 'grab', air_kick: 'airkick', dive_kick: 'airkick', block: 'idle', idle: 'idle',
  },
  // pose de préparation associée à chaque pose de frappe
  WIND: { jab: 'jab_w', hook: 'jab_w', kick: 'kick_w', upper: 'upper_w', dash: 'run', special: 'special', grab: 'jab_w' },

  // première pose disponible dans la liste
  pick(k, list) {
    const I = this.img[k];
    for (const n of list) if (n && I[n]) return n;
    return 'idle';
  },

  frameHero(f, o, t) {
    const s = f.state, m = f.move;
    if (f.dashT > 0) { o.n = 'dash'; o.sx = 1.06; o.rot = 0.05; return; }
    if (f.throwT > 0) { o.n = 'throw'; o.dx = 2; return; }
    if (s === 'attack' && m) {
      const a0 = m.act ? m.act[0] : 0.1, a1 = m.act ? m.act[1] : 0.2, mt = f.mt;
      let n = m.air || m.dive ? 'airkick' : ((m.cost && !m.blitz) || m.star) ? 'special' : (this.PB[m.pb] || 'jab');
      if (m.grab || f.grabbing) n = mt < a0 ? 'grab' : 'hook';
      if (m === MOVES.w_throw) n = 'hook';
      // revers arrière : après le demi-tour, pose de revers dédiée
      if (f.hero && m === MOVES[f.hero.back] && mt >= a0 * 0.5 && mt <= a1 + 0.06) { o.n = 'back'; o.dx = 1.5; o.sx = 1.04; return; }
      if (n === 'special' && (m.cost || m.star || m.spin || m.quake)) {
        // Seuls les véritables spéciaux ignorent la reprise standard.
        // Avant V26.7, les marteaux / haches de Makasi (PB = 'special')
        // n'avaient AUCUNE anticipation visuelle car cette branche gagnait.
        o.n = Math.floor(mt / 0.12) % 2 ? 'special2' : 'special';
        return;
      }
      const style = f.hero.combat;
      if (mt < a0 && !m.air) {
        // 4 temps : anticipation spécifique, impact, récupération, cancel.
        const wind = clamp(mt / Math.max(0.02, a0), 0, 1);
        o.n = this.WIND[n] || 'idle';
        o.dx = -style.windPull * wind;
        o.sx = 1 - 0.035 * wind;
        o.sy = 1 + 0.025 * wind;
      } else if (mt <= a1 + 0.05) {
        o.n = n; o.dx = style.impactDrive; o.sx = 1.035 + style.impactDrive * 0.005; o.sy = 0.99;
      } else {
        // Le retour en garde se termine avant le prochain coup confirmé.
        const rest = m.t || 0.3;
        o.n = m.air ? n : mt > rest * 0.88 ? 'idle' : mt > rest * 0.7 ? (this.WIND[n] || n) : n;
        o.dx = style.impactDrive * Math.max(0, 1 - (mt - a1) / Math.max(0.04, rest - a1));
      }
      return;
    }
    if (s === 'walk') {
      if (f.running && Math.abs(f.vx) > WALK * 1.2) {
        const q = Math.floor((((f.walkPh % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 2));
        o.n = ['run', 'walk3', 'run2', 'walk3'][q];
        o.rot = 0.07; o.dy = -Math.abs(Math.sin(f.walkPh)) * 2.4;
      } else {
        // cycle de marche à 4 temps : contact, passage, contact opposé, passage
        const q = Math.floor((((f.walkPh % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 2));
        o.n = ['walk1', 'walk3', 'walk2', 'walk3'][q];
        o.dy = -Math.abs(Math.sin(f.walkPh)) * 1.4;
      }
      return;
    }
    if (s === 'jump' || s === 'respawn') {
      if (f.djT > 0) { o.n = 'djump'; o.rot = (1 - f.djT / 0.32) * Math.PI * 2; o.dy = -10; return; }
      o.n = 'jump'; o.rot = clamp(-f.vy / 2400, -0.12, 0.12); return;
    }
    if (s === 'hurt' || s === 'grabbed') { o.n = f.hurtLow ? 'hurt2' : 'hurt'; o.dx = -f.hero.combat.knockback * 1.6; o.rot = f.hurtLow ? 0.035 : -0.045; if (f.flash > 0) o.dx += Math.sin(t * 90) * 1.2; return; }
    if (s === 'fall' || s === 'thrown') {
      if (f.y > 3) { o.n = 'fall'; o.rot = clamp(-0.15 - f.y / 260, -0.6, 0); } else o.n = 'down';
      return;
    }
    if (s === 'down' || s === 'dead') { o.n = 'down'; return; }
    if (s === 'getup') { o.n = 'getup'; return; }
    if (s === 'grab') { o.n = f.knee > 0 ? 'kick' : 'grab'; return; }
    if (s === 'star') { o.n = Math.floor(t * 10) % 2 ? 'special2' : 'special'; return; }
    if (f.squash > 0.04) { o.n = 'land'; return; }
    if ((Game.bossPhase === 'ko' || Game.bossPhase === 'done') && (s === 'idle' || s === 'walk') && !(Game.enemies.some((e) => !e.dying))) { o.n = 'win'; return; }
    // provocation après un long moment sans bouger, sinon garde « qui respire » sur deux poses
    if (f.idleT > 6 && f.idleT < 7.6) { o.n = 'taunt'; return; }
    o.n = Math.sin(t * 2.4) > 0.45 ? 'idle2' : 'idle'; o.sy = 1 + Math.sin(t * 3.2) * 0.012 * f.hero.combat.idleBreath; o.sx = 1 - Math.sin(t * 3.2) * 0.006 * f.hero.combat.idleBreath;
  },

  frameFoe(f, o, t) {
    const s = f.state, m = f.move;
    if (s === 'attack' && m) {
      const a0 = m.act ? m.act[0] : 0.2, a1 = m.act ? m.act[1] : 0.3, mt = f.mt;
      const heavy = (m.dmg || 0) >= 10 || m.proj || m.leap || m.charge || m.egrab;
      // coup spécial des boss : projectiles, charges, bonds et coups très lourds
      const special = f.kind === 'boss' && (m.proj || m.charge || m.leap || (m.dmg || 0) >= 14 || m.all);
      const hit = special ? 'special' : heavy ? 'heavy' : 'strike';
      if (mt < a0) {
        // télégraphie : pose de préparation + recul marqué pour que le joueur lise l'attaque (comme dans SoR4)
        const k = clamp(mt / Math.max(a0, 0.01), 0, 1);
        o.n = (heavy || special || a0 > 0.14) && k > 0.25 ? 'wind' : 'idle';
        o.dx = -3 * k; o.sx = 1 - 0.04 * k; o.sy = 1 + 0.03 * k;
      } else if (mt <= a1 + 0.08) { o.n = hit; o.dx = 2; o.sx = 1.05; }
      else o.n = mt > (m.t || 0.5) * 0.85 ? 'idle' : hit;
      return;
    }
    if (s === 'egrab') { o.n = f.knee > 0 ? 'heavy' : 'strike'; return; }
    if (s === 'walk' || s === 'intro') {
      const q = Math.floor((((f.walkPh % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 2));
      o.n = ['walk1', 'idle', 'walk2', 'idle'][q]; o.dy = -Math.abs(Math.sin(f.walkPh || 0)) * 1.3; return;
    }
    if (s === 'jump') { o.n = 'walk1'; o.sy = 0.94; return; }
    if (s === 'hurt') { o.n = f.hurtLow ? 'hurt2' : 'hurt'; if (f.flash > 0) o.dx = Math.sin(t * 90) * 1.2; return; }
    if (s === 'grabbed') { o.n = 'grabbed'; o.dy = -1.5; return; }
    if (s === 'stun') { o.n = 'grabbed'; o.rot = Math.sin(t * 6) * 0.05; return; }
    if (s === 'fall' || s === 'thrown') {
      // vraie pose de chute ; légère rotation selon la vitesse verticale (montée / descente)
      if (f.y > 3) { o.n = 'fall'; o.rot = clamp(-f.vy / 900, -0.25, 0.25); o.fallRot = clamp(-0.4 - f.y / 120, -1.3, -0.25); } else o.n = 'down';
      return;
    }
    if (s === 'down' || s === 'dead') { o.n = 'down'; return; }
    if (s === 'getup') { o.n = 'getup'; return; }
    if (s === 'block') { o.n = 'idle'; o.sx = 0.97; return; }
    if (s === 'taunt') { o.n = Math.floor(t * 2) % 2 ? 'wind' : 'idle'; return; }
    o.n = 'idle'; o.sy = 1 + Math.sin(t * 2.8) * 0.012;
  },

  frame(f, k) {
    const o = { n: 'idle', sx: 1, sy: 1, rot: 0, dx: 0, dy: 0 };
    const t = Game.t + (f.id || 0) * 0.37;
    if (f.kind === 'player') this.frameHero(f, o, t); else this.frameFoe(f, o, t);
    // écrasement à l'atterrissage
    if (f.squash > 0) { const q = f.squash / 0.12; o.sy *= 1 - 0.1 * q; o.sx *= 1 + 0.08 * q; }
    // replis si une pose intermédiaire manque
    const FB = { walk3: 'idle', run2: 'run', jab_w: 'idle', kick_w: 'idle', upper_w: 'idle', land: 'idle', getup: 'idle', hurt2: 'hurt', fall: 'hurt', dash: 'run', djump: 'jump', special2: 'special', strike: 'idle', heavy: 'strike', walk1: 'idle', walk2: 'walk1', wind: 'idle', special: 'heavy', win: 'idle', grabbed: 'hurt', idle2: 'idle', taunt: 'win', throw: 'hook', back: 'hook' };
    const want = o.n;
    o.n = this.pick(k, [o.n, FB[o.n], FB[FB[o.n]], 'idle']);
    // replis : sans pose de chute on retombe sur l'ancienne rotation ; sans pose de relevé on écrase la garde
    if (want === 'fall' && o.n !== 'fall' && o.fallRot != null) o.rot = o.fallRot;
    if (want === 'getup' && o.n !== 'getup') { o.sy = 0.86; o.sx = 1.06; }
    if (want === 'back' && o.n !== 'back') o.flip = false;
    return o;
  },

  // dessine un combattant ; renvoie false si ses images ne sont pas prêtes (repli sur le rig)
  draw(ctx, f, x, y, alpha, flash) {
    const k = this.key(f);
    if (!k || !this.ready[k]) { if (k && this.has(k)) this.load(k); return false; }
    const fr = this.frame(f, k);
    const n = fr.n, md = this.meta[k][n], im = this.img[k][n];
    if (!md || !im) return false;
    f._frame = n; f._sk = k;
    const sc = (this.H * (f.build || 1)) / this.BASE;
    const face = f.face * (f.spinFace || 1) * (fr.flip ? -1 : 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + fr.dx * face, y + fr.dy);
    if (fr.rot) {
      // rotation autour du centre du corps (saltos, chutes)
      const cy = -md.h * sc * 0.45;
      ctx.translate(0, cy); ctx.rotate(fr.rot * face); ctx.translate(0, -cy);
    }
    ctx.scale(face * fr.sx * sc, fr.sy * sc);
    ctx.drawImage(this.scaled(k, n, im, md, md.h * sc * fr.sy * (R._pxk || 1)), -md.ax, -md.h, md.w, md.h);
    if (flash) {
      const w = this.white[k][n];
      if (w) { ctx.globalAlpha = alpha * 0.85; ctx.drawImage(w, -md.ax, -md.h, md.w, md.h); }
    }
    ctx.restore();
    // arme tenue (les sprites sont dessinés mains nues)
    if (f.weapon && f.kind === 'player') this.weapon(ctx, f, x, y, face, n, sc);
    return true;
  },

  /* ---------- Pré-réduction des sprites (performance + netteté) ----------
     Les images sources font 400 px de haut ; à l'écran un combattant en fait ~150-250.
     Réduire une grande image à chaque image coûte de la bande passante GPU et crée du
     scintillement. On fabrique donc, une seule fois, une copie à la bonne taille
     (lissage haute qualité), par paliers de 24 px, avec au plus 4 créations par image. */
  scaled(k, n, im, md, th) {
    if (!Settings.fx && th > md.h * 0.5) return im;
    const b = Math.ceil((th * 1.12) / 24) * 24;
    if (b >= md.h * 0.86 || b < 24) return im;
    const C = (this._sc = this._sc || {}), key = k + '|' + n + '|' + b;
    const hit = C[key]; if (hit) return hit;
    if ((this._scN || 0) >= 4) return im;
    this._scN = (this._scN || 0) + 1;
    const r = b / md.h, cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(md.w * r)); cv.height = b;
    const x = cv.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(im, 0, 0, cv.width, cv.height);
    this._scCount = (this._scCount || 0) + 1;
    if (this._scCount > 900) { this._sc = {}; this._scCount = 0; }
    return (C[key] = cv);
  },
  frameStart() { this._scN = 0; },
  clearScaled() { this._sc = {}; this._scCount = 0; },

  weapon(ctx, f, x, y, face, n, sc) {
    const kind = f.weapon.kind || f.weapon;
    const hit = n === 'hook' || n === 'jab' || n === 'special';
    ctx.save();
    ctx.translate(x + face * (hit ? 20 : 11) * (f.build || 1), y - 46 * (f.build || 1));
    ctx.rotate(face * (hit ? 0.2 : -0.9));
    ctx.scale(face, 1);
    R.item(ctx, { x: R._cam || 0, z: -R.groundY, y: -2, kind: 'held', sub: kind, t: 0, id: 0 }, R._cam || 0, R.groundY);
    ctx.restore();
  },

  // image fantôme (traînée) : silhouette teintée mise en cache par couleur
  tint(k, n, col) {
    const W = this.white[k] && this.white[k][n]; if (!W) return null;
    const key = n + col; this._tc = this._tc || {}; const H = (this._tc[k] = this._tc[k] || {});
    if (H[key]) return H[key];
    const c = document.createElement('canvas'); c.width = W.width; c.height = W.height;
    const x = c.getContext('2d'); x.drawImage(W, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
    return (H[key] = c);
  },
  ghost(ctx, p, x, y, a) {
    const md = this.meta[p.hero] && this.meta[p.hero][p.frame];
    const T = md && this.tint(p.hero, p.frame, p.col || '#38e6ff');
    if (!T) return false;
    const sc = (this.H * (p.build || 1)) / this.BASE;
    ctx.save(); ctx.globalAlpha = a;
    ctx.translate(x, y); ctx.scale(p.face * sc, sc);
    ctx.drawImage(T, -md.ax, -md.h, md.w, md.h);
    ctx.restore();
    return true;
  },
};
