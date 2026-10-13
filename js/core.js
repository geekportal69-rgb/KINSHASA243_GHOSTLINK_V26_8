/* =========================================================
   GHOSTLINK V12 « LES 24 COMMUNES » — core.js
   Utilitaires, stockage, réglages, entrées (clavier / tactile / manettes)
   ========================================================= */
'use strict';

const TICK = 1 / 60;
const BAND = 74;            // profondeur jouable (axe z)
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const sign = (v) => (v < 0 ? -1 : 1);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const approach = (v, t, d) => (v < t ? Math.min(v + d, t) : Math.max(v - d, t));
function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- Stockage : mémoire + adaptateur optionnel window.GHOSTLINK_STORE {get,set} ---------- */
const Store = (function () {
  const mem = Object.create(null);
  const ext = window.GHOSTLINK_STORE;
  const key = (k) => 'v12.' + k; // compatibilité sauvegardes existantes
  return {
    get(k, d) {
      try { if (ext) { const v = ext.get(key(k)); if (v != null) return v; } } catch (_e) { /* adaptateur externe indisponible */ }
      try { const raw = window.localStorage.getItem(key(k)); if (raw != null) return JSON.parse(raw); } catch (_e) { /* fichiers privés / stockage bloqué */ }
      return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : d;
    },
    set(k, v) {
      mem[k] = v;
      try { if (ext) ext.set(key(k), v); } catch (_e) { /* application externe */ }
      try { window.localStorage.setItem(key(k), JSON.stringify(v)); } catch (_e) { /* navigation privée */ }
    },
  };
})();

const Settings = Object.assign(
  { fx: 2, haptics: 1, lefty: 0, size: 100, music: 70, sfx: 85, diff: 1, shake: 1,
    // V12.3
    master: 100, amode: 1, dyn: 0, env: 1, heart: 1,           // audio (casque 3D par défaut : le jeu se joue au casque)
    layout: 1, opac: 85, hold: 1, assist: 1, autorun: 1,         // contrôles (1 = disposition en arc façon Diablo mobile)
    rumble: 1, glyph: 0,                                          // manette (0 = Xbox, 1 = PlayStation)
    fpscap: 0, dynres: 1, rscale: 100, fpsShow: 0,                 // vidéo (0 = illimité / fréquence de l'écran)
    noflash: 0, gspeed: 100, parryWin: 1 },                        // accessibilité
  Store.get('settings', {})
);
(function autoQuality() {
  if (Store.get('settings', null)) return;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  if (cores <= 4 || mem <= 2) Settings.fx = 1;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { Settings.fx = 0; Settings.shake = 0; }
})();
Settings.showFps = /[?&]fps/.test(location.search) || !!Settings.fpsShow;
function saveSettings() { Store.set('settings', Object.assign({}, Settings)); }

const Progress = Object.assign({ unlocked: 1, roadUnlocked: 0, best: 0, ranks: {}, seenIntro: false }, Store.get('progress', {}));
function saveProgress() { Store.set('progress', JSON.parse(JSON.stringify(Progress))); }

function haptic(ms) {
  if (!Settings.haptics) return;
  try { if (navigator.vibrate && Input.source === 'touch') navigator.vibrate(ms); } catch (e) { /* bloqué */ }
  if (Settings.rumble) Input.rumble(ms);
}

/* =========================================================
   ENTRÉES
   Boutons logiques : atk (coup), jump (saut), spe (spécial), back (attaque arrière), dash, star (étoile), pause
   ========================================================= */
const Input = (function () {
  const keys = Object.create(null);
  const touch = { mx: 0, my: 0, atk: false, jump: false, spe: false, back: false, dash: false, star: false, interact: false };
  const BTN = ['atk', 'jump', 'spe', 'back', 'dash', 'star', 'interact', 'pause'];
  const players = [mk(), mk()];
  let coop = false, lastSource = 'touch';
  const pads = [];
  function mk() { return { mx: 0, my: 0, atk: false, jump: false, spe: false, back: false, dash: false, star: false, interact: false, pause: false, prev: {}, pressed: {}, tapX: 0, tapT: 0, lastMx: 0 }; }

  const MAP1 = { left: ['KeyA', 'KeyQ'], right: ['KeyD'], up: ['KeyW', 'KeyZ'], down: ['KeyS'], atk: ['KeyF', 'KeyJ'], jump: ['Space', 'KeyG', 'KeyK'], spe: ['KeyH', 'KeyL'], back: ['KeyR', 'KeyU'], dash: ['ShiftLeft', 'KeyO'], star: ['KeyT', 'KeyI'], interact: ['KeyE', 'KeyV'] };
  const MAP2 = { left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'], atk: ['Numpad1', 'Comma'], jump: ['Numpad2', 'Period'], spe: ['Numpad3', 'Slash'], back: ['Numpad4', 'KeyM'], dash: ['Numpad6', 'Quote'], star: ['Numpad5', 'Semicolon'], interact: ['Numpad0', 'KeyN'] };
  const MAP2SOLO = { left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'], atk: [], jump: [], spe: [], back: [], dash: [], star: [], interact: [] };
  const any = (list) => list.some((k) => keys[k]);

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    keys[e.code] = true; lastSource = 'keys';
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', reset);
  function reset() {
    for (const k in keys) keys[k] = false;
    Object.assign(touch, { mx: 0, my: 0, atk: false, jump: false, spe: false, back: false, dash: false, star: false, interact: false });
    for (const p of players) { for (const k of BTN) { p.prev[k] = false; p.pressed[k] = false; p[k] = false; } p.mx = 0; p.my = 0; p.lastMx = 0; p.tapX = 0; }
  }

  function readPad(gp, out) {
    const dz = 0.22;
    let ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    // zone morte radiale (plus précise qu'une zone morte par axe) + courbe de réponse
    const mag = Math.hypot(ax, ay);
    if (mag < dz) { ax = 0; ay = 0; } else { const k = Math.min(1, (mag - dz) / (0.85 - dz)) / mag; ax *= k; ay *= k; }
    const b = (i) => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.4));
    let mx = ax, my = ay;
    if (b(14)) mx = -1; if (b(15)) mx = 1; if (b(12)) my = -1; if (b(13)) my = 1;
    out.mx = mx || out.mx; out.my = my || out.my;
    out.atk = out.atk || b(2); out.jump = out.jump || b(0); out.spe = out.spe || b(1); out.back = out.back || b(3);
    out.dash = out.dash || b(5) || b(7); out.star = out.star || b(4) || b(6); out.interact = out.interact || b(8); out.pause = out.pause || b(9);
    if (mx || my || b(0) || b(1) || b(2) || b(3)) lastSource = 'pad';
  }

  function poll(now) {
    pads.length = 0;
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const g of gps) if (g && g.connected) pads.push(g);
    for (const p of players) { p.mx = 0; p.my = 0; for (const k of BTN) p[k] = false; }
    const p1 = players[0], p2 = players[1];
    const kb = (p, M) => {
      const l = any(M.left), r = any(M.right), u = any(M.up), d = any(M.down);
      if (l || r) p.mx = (r ? 1 : 0) - (l ? 1 : 0);
      if (u || d) p.my = (d ? 1 : 0) - (u ? 1 : 0);
      for (const k of ['atk', 'jump', 'spe', 'back', 'dash', 'star', 'interact']) p[k] = p[k] || any(M[k]);
    };
    kb(p1, MAP1);
    if (coop) kb(p2, MAP2); else kb(p1, MAP2SOLO);
    if (keys.Escape || keys.KeyP) p1.pause = true;
    if (touch.mx || touch.my) { p1.mx = touch.mx; p1.my = touch.my; }
    for (const k of ['atk', 'jump', 'spe', 'back', 'dash', 'star', 'interact']) p1[k] = p1[k] || touch[k];
    if (!coop) { for (const g of pads) readPad(g, p1); }
    else if (pads.length >= 2) { readPad(pads[0], p1); readPad(pads[1], p2); }
    else if (pads.length === 1) readPad(pads[0], p2);
    for (const p of players) {
      for (const k of BTN) { p.pressed[k] = p[k] && !p.prev[k]; p.prev[k] = p[k]; }
      // double-tap horizontal → course
      const dir = p.mx > 0.5 ? 1 : p.mx < -0.5 ? -1 : 0;
      p.dtap = false;
      if (dir && !p.lastMx) { if (p.tapX === dir && now - p.tapT < 0.28) p.dtap = true; p.tapX = dir; p.tapT = now; }
      p.lastMx = dir;
    }
  }

  // vibrations de la manette : intensité proportionnelle à la durée (petit coup = léger, gros coup = fort)
  function rumble(ms, strong, weak) {
    const list = pads.length ? pads : (navigator.getGamepads ? Array.from(navigator.getGamepads()).filter((g) => g && g.connected) : []);
    const s = strong != null ? strong : Math.min(1, 0.25 + ms / 60), w = weak != null ? weak : Math.min(1, 0.35 + ms / 80);
    for (const g of list) {
      try { if (g.vibrationActuator && g.vibrationActuator.playEffect) g.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: s, weakMagnitude: w }); } catch (e) { /* non supporté */ }
    }
  }

  return {
    keys, touch, players, poll, reset, rumble,
    set coop(v) { coop = v; }, get coop() { return coop; },
    get source() { return lastSource; }, set source(v) { lastSource = v; },
    get padCount() { return pads.length; },
  };
})();
