/* =========================================================
   GHOSTLINK V12.3 — pad.js
   Mode manette (recommandé) : détection, notification, symboles Xbox / PlayStation,
   navigation spatiale dans TOUS les menus (croix ou stick, A valider, B retour,
   LB / RB onglets), réglage des curseurs à la croix, vibrations.
   Le clavier pilote aussi les menus (flèches, Entrée, Échap).
   ========================================================= */
'use strict';

const PadUI = {
  known: false, name: '', cur: null, prev: [], held: '', repT: 0, lastNow: 0,

  GLYPH: {
    xbox: { atk: 'X', jump: 'A', spe: 'B', back: 'Y', dash: 'RB / RT', star: 'LB / LT', pause: 'Menu', interact: 'View / Select', move: 'Stick G / Croix', ok: 'A', ret: 'B' },
    ps: { atk: '□', jump: '✕', spe: '○', back: '△', dash: 'R1 / R2', star: 'L1 / L2', pause: 'Options', interact: 'Share / Select', move: 'Stick G / Croix', ok: '✕', ret: '○' },
  },
  g() { return this.GLYPH[Settings.glyph === 1 ? 'ps' : 'xbox']; },

  renderMap() {
    const el = document.getElementById('padmap'); if (!el) return;
    const G = this.g();
    const rows = [['Déplacer', G.move], ['Coup (maintenir = combo)', G.atk], ['Saut / double saut', G.jump], ['Spécial', G.spe], ['Dos / parade', G.back], ['Dash / parade', G.dash], ['Coup étoile', G.star], ['Ramasser une arme', G.interact], ['Pause', G.pause]];
    el.innerHTML = rows.map((r) => `<div><span>${r[0]}</span><kbd>${r[1]}</kbd></div>`).join('');
  },
  renderStatus() {
    const st = document.getElementById('pad-status');
    if (st) st.innerHTML = this.known
      ? `<b>Manette connectée</b><span>${this.name.replace(/[<>&]/g, '').slice(0, 60)}</span>`
      : '<b>Aucune manette détectée</b><span>Branchez ou appairez une manette Bluetooth (Xbox, PlayStation, compatible), puis appuyez sur un bouton.</span>';
    st && st.classList.toggle('ok', this.known);
    const tp = document.getElementById('title-pad');
    if (tp) tp.textContent = this.known ? 'Manette connectée' : 'Casque + manette recommandés';
    document.body.classList.toggle('haspad', this.known);
  },
  note(t) {
    const el = document.getElementById('padtoast'); if (!el) { UI.toast(t); return; }
    el.textContent = t; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(this._nt); this._nt = setTimeout(() => el.classList.remove('on'), 2600);
  },

  // conteneur actif : la feuille ouverte la plus haute, sinon l'écran actif
  container() {
    const sheets = $$('.screen.sheet.active');
    if (sheets.length) return sheets[sheets.length - 1];
    return $('.screen.active');
  },
  menuActive() {
    if (UI.screen === 'game' && !UI.paused && !$$('.screen.sheet.active').length) return false;
    return true;
  },
  list(c) {
    if (!c) return [];
    return $$('button:not([disabled]), input[type=range], summary', c).filter((e) => {
      if (e.offsetParent === null) return false;
      const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2;
    });
  },
  setCur(e) {
    if (this.cur === e) return;
    if (this.cur) this.cur.classList.remove('pf');
    this.cur = e;
    if (e) {
      e.classList.add('pf');
      try { e.focus({ preventScroll: true }); } catch (x) { /* ancien navigateur */ }
      e.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  },
  ensure() {
    const c = this.container(); const L = this.list(c);
    if (this.cur && L.includes(this.cur)) return L;
    const pref = $('.hcard.sel', c) || $('.tab.on', c) || $('.stage-card.next', c) || $('#btn-boot', c) || L[0];
    this.setCur(pref && L.includes(pref) ? pref : L[0] || null);
    return L;
  },
  move(dir) {
    const L = this.ensure(); if (!L.length || !this.cur) return;
    const cur = this.cur;
    if (cur.matches('input[type=range]') && (dir === 'l' || dir === 'r')) {
      const st = +cur.step || 1; const v = clamp(+cur.value + (dir === 'r' ? st : -st), +cur.min, +cur.max);
      if (v !== +cur.value) { cur.value = v; cur.dispatchEvent(new Event('input', { bubbles: true })); Sound.ready && Sound.sfx.uiMove(); }
      return;
    }
    const a = cur.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    let best = null, bs = 1e9;
    for (const e of L) {
      if (e === cur) continue;
      const b = e.getBoundingClientRect(), bx = b.left + b.width / 2, by = b.top + b.height / 2;
      const dx = bx - ax, dy = by - ay;
      let main, ortho;
      if (dir === 'r') { main = dx; ortho = Math.abs(dy); } else if (dir === 'l') { main = -dx; ortho = Math.abs(dy); }
      else if (dir === 'd') { main = dy; ortho = Math.abs(dx); } else { main = -dy; ortho = Math.abs(dx); }
      if (main < 4) continue;
      const s = main + ortho * 2.2;
      if (s < bs) { bs = s; best = e; }
    }
    if (best) { this.setCur(best); Sound.ready && Sound.sfx.uiMove(); }
  },
  ok() {
    const scr = UI.screen;
    if (scr === 'story' && !$$('.screen.sheet.active').length) { UI.nextPanel(); return; }
    if (scr === 'chapter' && !$$('.screen.sheet.active').length) { $('#btn-chap').click(); return; }
    this.ensure(); if (this.cur) this.cur.click();
  },
  back() {
    const c = this.container(); if (!c) return;
    if (c.id === 'scr-pause') { UI.resume(); return; }
    const b = $('[data-back]', c); if (b) { b.click(); return; }
    if (c.id === 'scr-story') { const s = $('#btn-skip'); if (s) s.click(); }
  },
  tab(d) {
    const c = this.container(); if (!c || c.id !== 'scr-options') return;
    const T = $$('.tab', c); const i = T.findIndex((t) => t.classList.contains('on'));
    const n = T[(i + d + T.length) % T.length]; if (n) { n.click(); this.setCur(n); }
  },

  frame(now) {
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    let g = null; for (const x of gps) if (x && x.connected) { g = x; break; }
    if (g && !this.known) {
      this.known = true; this.name = g.id || 'Manette';
      this.note('Manette détectée : mode manette activé (recommandé)');
      Sound.ready && Sound.sfx.padOn(); Input.source = 'pad'; Input.rumble(120, 0.5, 0.5);
      this.renderStatus();
    } else if (!g && this.known) {
      this.known = false; this.note('Manette déconnectée'); this.renderStatus();
      if (UI.screen === 'game' && !UI.paused) UI.pause();
    }
    if (!g) return;
    const b = (i) => !!(g.buttons[i] && g.buttons[i].pressed);
    const edge = (i) => b(i) && !this.prev[i];
    if (this.menuActive()) {
      const ax = g.axes[0] || 0, ay = g.axes[1] || 0;
      const dir = b(12) || ay < -0.55 ? 'u' : b(13) || ay > 0.55 ? 'd' : b(14) || ax < -0.55 ? 'l' : b(15) || ax > 0.55 ? 'r' : '';
      const dt = this.lastNow ? (now - this.lastNow) / 1000 : 0;
      if (dir) {
        if (dir !== this.held) { this.held = dir; this.repT = 0.34; this.move(dir); Input.source = 'pad'; }
        else { this.repT -= dt; if (this.repT <= 0) { this.repT = 0.11; this.move(dir); } }
      } else this.held = '';
      if (edge(0) || edge(9)) { if (!(edge(9) && UI.screen === 'game')) this.ok(); }
      if (edge(1)) this.back();
      if (edge(4)) this.tab(-1);
      if (edge(5)) this.tab(1);
    }
    this.lastNow = now;
    for (let i = 0; i < g.buttons.length; i++) this.prev[i] = b(i);
  },

  init() {
    this.renderMap(); this.renderStatus();
    window.addEventListener('gamepadconnected', () => { /* détecté à la prochaine image */ });
    // clavier dans les menus
    window.addEventListener('keydown', (e) => {
      if (!this.menuActive()) return;
      const k = e.code;
      const map = { ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r' };
      if (map[k]) { e.preventDefault(); this.move(map[k]); return; }
      if (k === 'Enter' || k === 'NumpadEnter') { if (this.cur && document.activeElement === this.cur && this.cur.tagName === 'BUTTON') return; e.preventDefault(); this.ok(); return; }
      if (k === 'Escape' || k === 'Backspace') { if (UI.screen === 'game' && UI.paused && !$$('#scr-options.active').length) return; e.preventDefault(); this.back(); }
    });
    // un toucher ou un clic efface le surlignage manette
    window.addEventListener('pointerdown', () => { if (this.cur) { this.cur.classList.remove('pf'); this.cur = null; } }, true);
  },
};
PadUI.init();
window.__gl && (window.__gl.PadUI = PadUI);
