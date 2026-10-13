/* =========================================================
   GHOSTLINK V12 — render.js
   Rendu Canvas 2D : décor peint en parallaxe, sols procéduraux avec reflets,
   tri en profondeur, ombres, effets d'impact BD, météo, post-traitement.
   ========================================================= */
'use strict';

const DRAW_SCALE = 1.1;
const IMG = {};
const IMG_FAILED = new Set();
function missingImages() { return [...IMG_FAILED]; }
// V12 : seules les images de l'interface sont préchargées ; les décors des 24 communes
// sont chargés à la demande (loadStageImages) pour un démarrage rapide sur mobile.
const IMG_LIST = ['keyart', 'hero_kabongo', 'hero_nzinga', 'hero_makasi', 'joevally_sprite', 'bg_nsele'];
function loadImg(n) {
  if (IMG[n]) return IMG[n]._p;
  const im = new Image();
  if (location.protocol !== 'file:') im.crossOrigin = 'anonymous';
  im._p = new Promise((res) => {
    im.onload = () => { IMG_FAILED.delete(n); res(); };
    im.onerror = () => { IMG_FAILED.add(n); console.warn('[GHOSTLINK] Image indisponible : assets/img/' + n + '.webp'); res(); };
  });
  im.src = 'assets/img/' + n + '.webp';
  IMG[n] = im;
  return im._p;
}
function loadStageImages(S) {
  const l = [S.bg, S.bg2, 'boss_' + S.boss, S.boss2 && 'boss_' + S.boss2].filter(Boolean);
  return Promise.all(l.map(loadImg));
}
function loadImages(onProgress) {
  let done = 0;
  return Promise.all(IMG_LIST.map((n) => loadImg(n).then(() => { done++; onProgress && onProgress(done / IMG_LIST.length); })));
}

const byZ = (a, b) => a.z - b.z;
const R = {
  cv: null, ctx: null, dpr: 1, dyn: 1, scale: 1, LW: 300, LH: 450, groundY: 360, cssW: 0, cssH: 0,
  cache: { key: '', back: null, floor: null, vign: null, half: null },
  weather: [], t: 0,

  init(cv) { this.cv = cv; this.ctx = cv.getContext('2d', { alpha: false }); this.resize(); },
  resize() {
    if (typeof Sprites !== 'undefined' && Sprites.clearScaled) Sprites.clearScaled();
    const view = document.getElementById('view');
    const r = view.getBoundingClientRect();
    const w = Math.max(200, r.width), h = Math.max(160, r.height);
    this.cssW = w; this.cssH = h;
    // V12 : personnages plus grands en portrait (cadrage « vrai jeu mobile »)
    let scale = w < h ? Math.min(w / 250, h / 250) : Math.min(w / 300, h / 270);
    let LW = w / scale;
    if (LW > 600) { scale = w / 600; LW = 600; }
    let LH = h / scale;
    this.scale = scale; this.LW = LW; this.LH = LH;
    this.groundY = Math.round(LH - BAND - (LH > 380 ? 22 : 14));
    const cap = Settings.fx === 0 ? 1 : Settings.fx === 1 ? 1.5 : 2;
    // échelle de rendu (réglage) × résolution dynamique (baisse automatique si le jeu ralentit)
    const rs = clamp((Settings.rscale || 100) / 100, 0.5, 1) * (Settings.dynres ? (this.dyn || 1) : 1);
    this.dpr = Math.max(0.5, Math.min(window.devicePixelRatio || 1, cap) * rs);
    this.cv.width = Math.round(w * this.dpr); this.cv.height = Math.round(h * this.dpr);
    this.cv.style.width = w + 'px'; this.cv.style.height = h + 'px';
    Game.LW = LW; Game.LH = LH;
    this.cache.key = '';
    this.initWeather();
  },
  px() { return this.scale * this.dpr; },

  /* ---------- Caches par niveau ---------- */
  buildCache(S) {
    const bi = IMG[S.bg];
    const key = S.id + '|' + S.bg + '|' + S.floor + '|' + (bi && bi.naturalWidth ? 1 : 0) + '|' + this.LW + '|' + this.LH + '|' + this.dpr + '|' + Settings.fx;
    if (this.cache.key === key) return;
    this.cache.key = key;
    const k = this.px();
    // décor peint, assombri et légèrement désaturé pour détacher les combattants
    const img = IMG[S.bg];
    const H = this.groundY + 14;
    const W = img && img.naturalWidth ? H * (img.naturalWidth / img.naturalHeight) : this.LW;
    const back = document.createElement('canvas');
    back.width = Math.ceil(W * k); back.height = Math.ceil(H * k);
    const b = back.getContext('2d');
    if (img && img.naturalWidth) {
      b.filter = 'saturate(0.88) brightness(0.78) contrast(1.05)';
      b.drawImage(img, 0, 0, back.width, back.height);
      b.filter = 'none';
    } else { b.fillStyle = '#111827'; b.fillRect(0, 0, back.width, back.height); }
    b.fillStyle = S.grade; b.fillRect(0, 0, back.width, back.height);
    // brume au pied du décor pour fondre avec le sol
    const g = b.createLinearGradient(0, back.height * 0.7, 0, back.height);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(6,6,14,.55)');
    b.fillStyle = g; b.fillRect(0, 0, back.width, back.height);
    this.cache.back = back; this.cache.backW = W; this.cache.backH = H;
    this.cache.floor = this.buildFloor(S, k);
    // vignette
    const v = document.createElement('canvas'); v.width = Math.ceil(this.LW * k / 2); v.height = Math.ceil(this.LH * k / 2);
    const vc = v.getContext('2d');
    const rg = vc.createRadialGradient(v.width / 2, v.height * 0.55, Math.min(v.width, v.height) * 0.3, v.width / 2, v.height * 0.55, Math.max(v.width, v.height) * 0.75);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,.55)');
    vc.fillStyle = rg; vc.fillRect(0, 0, v.width, v.height);
    this.cache.vign = v;
    // trame demi-teinte (effet papier BD)
    const h = document.createElement('canvas'); h.width = h.height = 6;
    const hc = h.getContext('2d'); hc.fillStyle = 'rgba(0,0,0,1)'; hc.beginPath(); hc.arc(3, 3, 1.1, 0, Math.PI * 2); hc.fill();
    this.cache.half = this.ctx.createPattern(h, 'repeat');
  },
  buildFloor(S, k) {
    const TW = 240, FH = this.LH - this.groundY + 8;
    const c = document.createElement('canvas');
    c.width = Math.ceil(TW * k); c.height = Math.ceil(FH * k);
    const g = c.getContext('2d');
    g.scale(k, k);
    const rr = mulberry32(S.id.length * 97);
    const top = 8; // bordure supérieure (trottoir / quai)
    const grad = (a, b) => { const gr = g.createLinearGradient(0, 0, 0, FH); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
    const f = S.floor;
    if (f === 'asphalt') {
      g.fillStyle = '#3a3f4c'; g.fillRect(0, 0, TW, top);
      for (let x = 0; x < TW; x += 20) { g.fillStyle = '#2b2f3a'; g.fillRect(x, 0, 1, top); }
      g.fillStyle = '#585e6c'; g.fillRect(0, top - 2, TW, 2);
      g.fillStyle = grad('#1b1e27', '#101219'); g.fillRect(0, top, TW, FH);
      g.fillStyle = '#e8c547'; for (let x = 10; x < TW; x += 60) g.fillRect(x, top + 38, 30, 2.2);
      for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${rr() * 0.05})`; g.fillRect(rr() * TW, top + rr() * FH, rr() * 3, 1); }
      for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(90,140,220,.08)'; g.beginPath(); g.ellipse(rr() * TW, top + 20 + rr() * (FH - 30), 18 + rr() * 20, 3 + rr() * 3, 0, 0, Math.PI * 2); g.fill(); }
    } else if (f === 'dirt') {
      g.fillStyle = grad('#6b4a2e', '#3c2817'); g.fillRect(0, 0, TW, FH);
      for (let i = 0; i < 160; i++) { g.fillStyle = rr() < 0.5 ? 'rgba(0,0,0,.12)' : 'rgba(255,220,160,.07)'; g.fillRect(rr() * TW, rr() * FH, 1 + rr() * 3, 1); }
      for (let i = 0; i < 18; i++) { g.strokeStyle = 'rgba(230,190,90,.35)'; g.lineWidth = 0.6; const x = rr() * TW, y = rr() * FH; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rr() * 6 - 3, y + 2); g.stroke(); }
      g.fillStyle = '#4a3220'; g.fillRect(0, 0, TW, 3);
      for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(120,150,190,.14)'; g.beginPath(); g.ellipse(rr() * TW, 20 + rr() * (FH - 30), 14 + rr() * 14, 3, 0, 0, Math.PI * 2); g.fill(); }
    } else if (f === 'planks') {
      g.fillStyle = '#5b3b22'; g.fillRect(0, 0, TW, FH);
      for (let y = 0, row = 0; y < FH; y += 9, row++) {
        g.fillStyle = row % 2 ? '#6a4527' : '#5e3d22'; g.fillRect(0, y, TW, 8);
        g.fillStyle = '#2e1d10'; g.fillRect(0, y + 8, TW, 1);
        for (let x = (row % 2) * 30; x < TW; x += 60) { g.fillRect(x, y, 1, 8); g.fillStyle = '#c9a36a'; g.fillRect(x + 3, y + 3, 1, 1); g.fillStyle = '#2e1d10'; }
        for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(rr() * TW, y + 1 + rr() * 6, 8 + rr() * 16, 0.6); }
      }
      g.fillStyle = '#3b2615'; g.fillRect(0, 0, TW, 3); g.fillStyle = '#8a6a40'; g.fillRect(0, 3, TW, 1);
    } else if (f === 'tiles') {
      g.fillStyle = '#140c22'; g.fillRect(0, 0, TW, FH);
      const cols = ['#3a1a5e', '#2a1446', '#5a1f6e', '#1f1638'];
      for (let y = 4; y < FH; y += 12) for (let x = 0; x < TW; x += 20) { g.fillStyle = cols[((x / 20) + (y / 12)) % 4 | 0]; g.fillRect(x + 0.5, y + 0.5, 19, 11); }
      g.fillStyle = '#ff4fd8'; g.fillRect(0, 2, TW, 1.2); g.fillStyle = 'rgba(255,79,216,.25)'; g.fillRect(0, 3, TW, 3);
    } else if (f === 'rails') {
      g.fillStyle = grad('#3d3a36', '#24221f'); g.fillRect(0, 0, TW, FH);
      // voie du fond (z 0–24)
      g.fillStyle = '#2a241f'; g.fillRect(0, 2, TW, 26);
      for (let x = 0; x < TW; x += 12) { g.fillStyle = '#4a3423'; g.fillRect(x, 4, 7, 22); }
      g.fillStyle = '#9aa0a8'; g.fillRect(0, 8, TW, 1.6); g.fillRect(0, 20, TW, 1.6);
      g.fillStyle = '#d6b23a'; for (let x = 0; x < TW; x += 16) g.fillRect(x, 29, 8, 2.4);
      g.fillStyle = '#1b1916'; g.fillRect(0, 31.4, TW, 1);
      for (let i = 0; i < 80; i++) { g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(rr() * TW, 34 + rr() * (FH - 34), 2, 1); }
    } else if (f === 'metal') {
      g.fillStyle = grad('#3a4150', '#22262f'); g.fillRect(0, 0, TW, FH);
      for (let y = 4; y < FH; y += 6) for (let x = (y / 6 % 2) * 6; x < TW; x += 12) { g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x, y, 4, 1); }
      for (let x = 0; x < TW; x += 10) { g.fillStyle = (x / 10) % 2 ? '#141414' : '#e8c12f'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 10, 0); g.lineTo(x + 6, 4); g.lineTo(x - 4, 4); g.closePath(); g.fill(); }
      for (let x = 0; x < TW; x += 80) { g.fillStyle = '#ff3b5c'; g.fillRect(x + 20, 6, 2, 1.4); }
    } else if (f === 'grid') {
      g.fillStyle = grad('#140810', '#06030a'); g.fillRect(0, 0, TW, FH);
      g.strokeStyle = 'rgba(255,59,92,.45)'; g.lineWidth = 0.7;
      for (let y = 4, s = 6; y < FH; y += s, s *= 1.12) { g.beginPath(); g.moveTo(0, y); g.lineTo(TW, y); g.stroke(); }
      g.strokeStyle = 'rgba(56,230,255,.3)';
      for (let x = 0; x < TW; x += 20) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, FH); g.stroke(); }
      g.fillStyle = '#38e6ff'; g.fillRect(0, 1, TW, 1);
    }
    // ombre de contact sous la bordure
    const sg = g.createLinearGradient(0, 0, 0, 14); sg.addColorStop(0, 'rgba(0,0,0,.45)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sg; g.fillRect(0, 0, TW, 14);
    return { c, TW, FH, wet: ['asphalt', 'tiles', 'metal', 'grid'].includes(f) };
  },

  initWeather() {
    this.weather = [];
    const n = Settings.fx === 0 ? 30 : Settings.fx === 1 ? 70 : 120;
    for (let i = 0; i < n; i++) this.weather.push({ x: rand(this.LW), y: rand(this.LH), v: rand(0.6, 1.4), s: rand(0.5, 1.5), c: rand(1) });
  },

  /* ---------- Rendu principal ---------- */
  draw(dt) {
    const ctx = this.ctx, G = Game, S = G.stage;
    this.t += dt;
    const k = this.px();
    ctx.setTransform(k, 0, 0, k, 0, 0);
    this._pxk = k * (1 + (G.zoom || 0));
    if (typeof Sprites !== 'undefined') Sprites.frameStart();
    if (!S) { ctx.fillStyle = '#05050a'; ctx.fillRect(0, 0, this.LW, this.LH); return; }
    this.buildCache(S);
    // secousse « traumatisme » : bruit lisse (pas d'à-coups à 120 Hz) + recul directionnel du dernier coup
    const sh = G.shake * (Settings.shake ? 1 : 0.2), tt = G.t * 60;
    const kx = (G.kickX || 0) * (Settings.shake ? 1 : 0.3), ky = (G.kickY || 0) * (Settings.shake ? 1 : 0.3);
    const ox = (sh ? (Math.sin(tt * 1.7) + Math.sin(tt * 2.9 + 1.3)) * sh * 0.25 : 0) + kx, oy = (sh ? (Math.sin(tt * 2.3 + 0.7) + Math.sin(tt * 3.7)) * sh * 0.25 : 0) + ky;
    ctx.save(); ctx.translate(ox, oy);
    const cam = G.camX, gy = this.groundY;
    this._cam = cam;
    // pulsation de zoom sur les gros impacts (style beat'em up moderne)
    const zm = 1 + (G.zoom || 0);
    if (zm > 1.001) { const fx0 = G.zoomX != null ? G.zoomX - cam : this.LW / 2; ctx.translate(fx0, gy); ctx.scale(zm, zm); ctx.translate(-fx0, -gy); }
    // --- fond peint (parallaxe en miroir) ---
    const bw = this.cache.backW, bh = this.cache.backH, back = this.cache.back;
    const off = cam * 0.3;
    let i0 = Math.floor(off / bw);
    for (let i = i0; i * bw - off < this.LW + 2; i++) {
      const x = i * bw - off;
      if (i % 2 === 0) ctx.drawImage(back, x, -2, bw + 0.6, bh);
      else { ctx.save(); ctx.translate(x + bw, -2); ctx.scale(-1, 1); ctx.drawImage(back, 0, 0, bw + 0.6, bh); ctx.restore(); }
    }
    this.backLayer(ctx, S, cam, gy);
    // --- sol ---
    const fl = this.cache.floor;
    const fy = gy - 8;
    const foff = ((cam % fl.TW) + fl.TW) % fl.TW;
    for (let x = -foff; x < this.LW; x += fl.TW) ctx.drawImage(fl.c, x, fy, fl.TW + 0.5, fl.FH);
    if (fl.wet && Settings.fx > 0) {
      // reflets du décor sur sol mouillé
      ctx.save(); ctx.beginPath(); ctx.rect(0, fy + 6, this.LW, this.LH - fy); ctx.clip();
      ctx.globalAlpha = S.floor === 'asphalt' ? 0.22 : 0.16; ctx.globalCompositeOperation = 'screen';
      for (let i = i0; i * bw - off < this.LW + 2; i++) {
        const x = i * bw - off;
        ctx.save(); ctx.translate(x + (i % 2 ? bw : 0), fy + 8); ctx.scale(i % 2 ? -1 : 1, -0.55); ctx.drawImage(back, 0, -bh, bw + 0.6, bh); ctx.restore();
      }
      ctx.restore();
    }
    // --- dangers d'arrière-plan & avertissements au sol ---
    this.groundMarks(ctx, G, cam, gy);
    // Motards alliés en fond de scène : un convoi vivant, léger à dessiner.
    if (S.dlcRoad) this.convoyEscort(ctx, G, cam, gy);
    // --- entités triées en profondeur ---
    // V12.3 : réutilisation d'un pool d'entrées (aucune allocation par image)
    const pool = this._entPool || (this._entPool = []), ents = this._ents || (this._ents = []);
    ents.length = 0; let pi = 0;
    const put = (z, k, o) => { const e = pool[pi] || (pool[pi] = { z: 0, k: '', o: null }); pi++; e.z = z; e.k = k; e.o = o; ents.push(e); };
    for (const p of G.props) put(p.z, 'prop', p);
    for (const it of G.items) put(it.z - 0.5, 'item', it);
    for (const f of G.players) if (!f.out) put(f.z + 0.2, 'f', f);
    for (const e of G.enemies) put(e.colossus ? -100 : e.z, e.colossus ? 'colossus' : e.type === 'drone' ? 'drone' : 'f', e);
    for (const pr of G.projs) put(pr.z + 0.1, 'proj', pr);
    for (const h of G.hazards) {
      if (h.k === 'train' && h.phase === 'pass') put(4, 'train', h);
      if (h.k === 'bikecharge' && h.phase === 'charge' && !h.dead) put(h.z, 'bikecharge', h);
      if (h.k === 'roadbeacon' && !h.dead) put(h.z, 'roadbeacon', h);
      if (h.k === 'roadblock' && !h.dead) put(h.z, 'roadblock', h);
    }
    if (G.convoy && G.convoy.event && G.convoy.event.k === 'repair')
      put(G.convoy.event.z, 'roadrepair', G.convoy.event);
    ents.sort(byZ);
    // ombres
    for (const e of ents) this.shadow(ctx, e, cam, gy);
    for (const e of ents) {
      const o = e.o;
      if (e.k === 'f') this.fighter(ctx, o, cam, gy);
      else if (e.k === 'drone') { const flash = o.flash > 0 && Math.floor(o.flash * 40) % 2 === 0; ctx.save(); ctx.globalAlpha = o.alpha; const dx = o.x - cam, dy = gy + o.z - o.y - (o.fly ? 0 : 6); if (!o.fly) { ctx.translate(dx, dy); ctx.rotate(o.face * 0.9); ctx.translate(-dx, -dy); } Rig.drone(ctx, dx, dy, o.face, G.t + o.id, flash, S.light); ctx.restore(); }
      else if (e.k === 'colossus') { if (o.roadJoe) this.roadJoe(ctx, o, cam, gy); else this.colossus(ctx, o, cam, gy); }
      else if (e.k === 'prop') this.prop(ctx, o, cam, gy);
      else if (e.k === 'item') this.item(ctx, o, cam, gy);
      else if (e.k === 'proj') this.proj(ctx, o, cam, gy);
      else if (e.k === 'train') this.train(ctx, o, cam, gy);
      else if (e.k === 'bikecharge') this.bikeCharge(ctx, o, cam, gy);
      else if (e.k === 'roadbeacon') this.roadBeacon(ctx, o, cam, gy);
      else if (e.k === 'roadblock') this.roadBlock(ctx, o, cam, gy);
      else if (e.k === 'roadrepair') this.roadRepair(ctx, o, cam, gy);
    }
    // attaques du colosse au premier plan
    if (G.boss && G.boss.colossus) {
      if (G.boss.roadJoe) this.roadJoeFx(ctx, G.boss, cam, gy);
      else this.colossusFx(ctx, G.boss, cam, gy);
    }
    // --- particules ---
    this.particles(ctx, cam, gy);
    // --- premier plan & météo ---
    this.frontLayer(ctx, S, cam, gy);
    this.weatherFx(ctx, S, dt);
    ctx.restore();
    this.post(ctx, G, S);
  },

  backLayer(ctx, S, cam, gy) {
    // éléments lumineux animés devant le décor (néons, guirlandes)
    const t = this.t;
    if (S.fx === 'confetti' || S.bg === 'bg_marche' || S.bg === 'bg_masina' || S.bg === 'bg_kinshasa') {
      const off = cam * 0.8;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let x = -((off) % 60) - 60; x < this.LW + 60; x += 60) {
        const y0 = gy * 0.28;
        ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + 30, y0 + 14, x + 60, y0); ctx.stroke();
        for (let j = 0; j < 5; j++) { const px = x + 6 + j * 12, py = y0 + Math.sin((j + 0.5) / 5 * Math.PI) * 10 + 1; const c = ['#ffd34d', '#ff4fd8', '#5dffb0', '#38e6ff', '#ff6a2a'][(j + Math.floor(x / 60)) % 5 | 0]; ctx.fillStyle = c; ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 3 + j + x); ctx.beginPath(); ctx.arc(px, py, 1.6, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.restore();
    }
    if (S.fx === 'confetti' && Settings.fx > 0) {
      // projecteurs de boîte de nuit
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const a = Math.sin(t * 0.7 + i * 2) * 0.5;
        const x = this.LW * (0.2 + i * 0.3);
        const g = ctx.createLinearGradient(x, 0, x, gy);
        const c = ['255,79,216', '255,211,77', '56,230,255'][i];
        g.addColorStop(0, `rgba(${c},.22)`); g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 3, 0); ctx.lineTo(x + 3, 0); ctx.lineTo(x + Math.sin(a) * gy + 40, gy + 30); ctx.lineTo(x + Math.sin(a) * gy - 40, gy + 30); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  },

  frontLayer(ctx, S, cam, gy) {
    // silhouettes de premier plan (parallaxe 1.3) : poteaux, piliers, câbles
    if (Settings.fx === 0) return;
    const sp = 520, off = cam * 1.3;
    const kind = { asphalt: 'pole', dirt: 'post', planks: 'bollard', tiles: 'pole', rails: 'pillar', metal: 'antenna', grid: 'cable' }[S.floor] || 'pole';
    ctx.save(); ctx.globalAlpha = 0.72;
    for (let x = -((off % sp) + sp) % sp - 40; x < this.LW + 60; x += sp) {
      const X = x + 200;
      ctx.fillStyle = '#05040a';
      if (kind === 'pole' || kind === 'antenna') {
        ctx.fillRect(X, 0, 5, this.LH); ctx.fillStyle = S.light; ctx.globalAlpha = 0.4; ctx.fillRect(X + 4, 0, 1, this.LH); ctx.globalAlpha = 0.72;
      } else if (kind === 'pillar') {
        ctx.fillRect(X, 0, 12, this.LH); ctx.fillStyle = 'rgba(255,176,74,.25)'; ctx.fillRect(X + 11, 0, 1.5, this.LH);
      } else if (kind === 'post' || kind === 'bollard') {
        const h = kind === 'bollard' ? 22 : 60; ctx.beginPath(); ctx.roundRect(X, this.LH - h, 16, h + 4, 4); ctx.fill();
        ctx.fillStyle = 'rgba(255,190,110,.3)'; ctx.fillRect(X + 14, this.LH - h + 3, 1.5, h);
      } else if (kind === 'cable') {
        ctx.strokeStyle = '#05040a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X - 120, this.LH - 6); ctx.quadraticCurveTo(X, this.LH - 40, X + 120, this.LH - 4); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,59,92,.6)'; ctx.lineWidth = 0.8; ctx.stroke();
      }
    }
    ctx.restore();
  },

  shadow(ctx, e, cam, gy) {
    const o = e.o;
    if (e.k === 'colossus' || e.k === 'train') return;
    let w = 11, a = 0.42;
    if (e.k === 'f') { if (o.alpha < 0.3) return; w = 11 * (o.look && o.look.w ? Math.sqrt(o.look.w) : 1) * (o.build || 1); }
    else if (e.k === 'drone') { w = 10; a = 0.25; }
    else if (e.k === 'prop') w = 12;
    else if (e.k === 'item') w = 7;
    else if (e.k === 'proj') { if (o.k === 'shock' || o.k === 'wave') return; w = 5; a = 0.3; }
    const y = o.y || 0;
    const s = 1 / (1 + y / 70);
    const lx = -2; // lumière principale légèrement à droite → ombre décalée à gauche
    ctx.fillStyle = `rgba(0,0,0,${a * s})`;
    ctx.beginPath(); ctx.ellipse(o.x - cam + lx * (1 + y / 30), gy + o.z + 1, w * s, 3.2 * s, 0, 0, Math.PI * 2); ctx.fill();
  },

  fighter(ctx, f, cam, gy) {
    if (f.alpha <= 0.01) return;
    const S = Game.stage;
    let alpha = f.alpha;
    if (f.inv > 0 && f.kind === 'player' && f.state !== 'attack' && f.state !== 'star' && Math.floor(f.inv * 16) % 2) alpha *= 0.45;
    // vibration d'impact de la cible (pendant le gel d'image)
    const hs = f.hshake > 0 ? Math.sin(performance.now() * 0.09) * Math.min(1, f.hshake * 10) * 2.2 : 0;
    const x = f.x - cam + hs, y = gy + f.z - f.y;
    // aura (boss enragé, coup étoile, armure)
    if ((f.enraged || f.state === 'star' || f.armorNow) && Settings.fx > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const col = f.state === 'star' ? f.hero.color : f.armorNow && f.kind === 'player' ? f.rim : '#ff3b5c';
      const g = ctx.createRadialGradient(x, y - 34, 4, x, y - 34, 46);
      g.addColorStop(0, col + '66'); g.addColorStop(1, col + '00');
      ctx.fillStyle = g; ctx.globalAlpha = 0.7 + Math.sin(this.t * 12) * 0.2; ctx.fillRect(x - 50, y - 84, 100, 100);
      ctx.restore();
    }
    const flash = f.flash > 0 && Math.floor(f.flash * 50) % 2 === 0;
    // héros, ennemis et boss : sprites illustrés (repli sur le rig si non chargés)
    if (typeof Sprites !== 'undefined' && Sprites.draw(ctx, f, x, y, alpha, flash)) { this.fighterExtras(ctx, f, x, y); return; }
    ctx.save(); ctx.globalAlpha = alpha;
    Rig.draw(ctx, {
      x, y, face: f.face * (f.spinFace || 1), pose: f.pose, look: f.look, build: (f.build || 1) * DRAW_SCALE,
      flash, weapon: f.weapon ? (f.weapon.kind || f.weapon) : null, t: Game.t + f.id, tail: f.tail, rim: f.kind === 'player' ? f.rim : S.light,
      shieldOn: f.shield, lash: f.lash, zap: f.zap > 0, fx: Settings.fx,
    });
    ctx.restore();
    this.fighterExtras(ctx, f, x, y);
  },
  fighterExtras(ctx, f, x, y) {
    if (f.zap > 0) { ctx.save(); ctx.strokeStyle = '#9ff4ff'; ctx.lineWidth = 0.9; ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { ctx.beginPath(); let px = x + rand(-10, 10), py = y - rand(10, 60); ctx.moveTo(px, py); for (let j = 0; j < 4; j++) { px += rand(-6, 6); py += rand(-6, 6); ctx.lineTo(px, py); } ctx.stroke(); } ctx.restore(); }
    // repère joueur
    if (f.kind === 'player' && (Game.coop || f.state === 'respawn')) {
      const col = f.hero.color;
      ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 1;
      const ty = y - 82 * (f.build || 1);
      ctx.beginPath(); ctx.moveTo(x - 4, ty); ctx.lineTo(x + 4, ty); ctx.lineTo(x, ty + 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.font = 'italic 800 7px "Barlow Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 2; ctx.strokeText((f.idx + 1) + 'P', x, ty - 2); ctx.fillText((f.idx + 1) + 'P', x, ty - 2);
      ctx.restore();
    }
  },

  // V26.4 — silhouettes simples animées pour les motos de soutien en arrière-plan.
  convoyEscort(ctx, G, cam, gy) {
    if (!G.convoy) return;
    const ratio = G.convoy.hp / Math.max(1, G.convoy.max);
    const count = ratio < .25 ? 1 : ratio < .60 ? 2 : 3;
    ctx.save();ctx.globalAlpha = 0.52;
    for (let i = 0; i < count; i++) {
      const x = 34 + i * (this.LW * .28) + Math.sin(this.t * .6 + i * 2) * 7;
      const y = gy + 8 + i * 3;
      ctx.save();ctx.translate(x,y);ctx.scale(.78,.78);
      const bob = Math.sin(this.t * 7 + i * 2) * 1.2;
      ctx.fillStyle = '#10141f'; ctx.strokeStyle = '#d5e8f8'; ctx.lineWidth = 2;
      for (const wx of [-14,16]) {ctx.beginPath();ctx.arc(wx,0,6.2,0,Math.PI*2);ctx.fill();ctx.stroke();}
      ctx.strokeStyle = i % 2 ? '#f5b044' : '#ef4a3b';ctx.lineWidth = 3;
      ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(-1,-11+bob);ctx.lineTo(16,0);ctx.stroke();
      ctx.fillStyle = i%2 ? '#c78b25' : '#b32737';ctx.fillRect(-4,-28+bob,9,14);
      ctx.fillStyle = '#ecceac';ctx.beginPath();ctx.arc(0,-33+bob,5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff2ae';ctx.beginPath();ctx.arc(20,-6,3,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  },
  // Barrage Val Industries : trois impacts nécessaires, HUD intégré sur l'objet.
  roadBlock(ctx, h, cam, gy) {
    const x=h.x-cam,y=gy+h.z;
    ctx.save();ctx.translate(x,y);
    ctx.fillStyle=h.flash>0?'#fff4cd':'#c64f27';ctx.strokeStyle='#191b26';ctx.lineWidth=2;
    ctx.beginPath();ctx.roundRect(-26,-22,52,20,3);ctx.fill();ctx.stroke();
    ctx.fillStyle='#f9cd48';
    for(let i=0;i<4;i++)ctx.fillRect(-23+i*13,-19,7,5);
    ctx.fillStyle='#0f1724';ctx.font='bold 7px sans-serif';ctx.textAlign='center';ctx.fillText('VAL INDUSTRIES',0,-10);
    ctx.fillStyle='#dceef9';ctx.fillRect(-23,-30,46,4);
    ctx.fillStyle='#48e2ff';ctx.fillRect(-23,-30,46*Math.max(0,h.hp)/h.maxHp,4);
    ctx.restore();
  },
  // Garage mobile : Carly et la progression d'une réparation défendue.
  roadRepair(ctx, ev, cam, gy) {
    const x=ev.x-cam,y=gy+ev.z;
    ctx.save();ctx.translate(x,y);
    ctx.fillStyle='#1f3444';ctx.strokeStyle='#ffc74d';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.roundRect(-31,-28,62,22,4);ctx.fill();ctx.stroke();
    for(const w of [-21,20]){ctx.fillStyle='#0a1118';ctx.beginPath();ctx.arc(w,-4,6,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#ffe6ab';ctx.fillRect(-24,-23,18,7);
    ctx.fillStyle='#ffe6ab';ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.fillText('CARLY',6,-16);
    ctx.strokeStyle='#7ef3ff';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(23,-30);ctx.lineTo(22,-44);ctx.stroke();
    ctx.fillStyle='#e3b98b';ctx.beginPath();ctx.arc(23,-50,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#172431';ctx.fillRect(17,-44,12,12);
    ctx.fillStyle='#171d22';ctx.fillRect(-31,-39,62,5);
    ctx.fillStyle='#7ef3ff';ctx.fillRect(-31,-39,62*Math.min(1,ev.progress/Math.max(1,ev.need)),5);
    ctx.restore();
  },
  // V26.3 : silhouette temporaire originale (aucune image externe requise).
  roadJoe(ctx, b, cam, gy) {
    if (b.roadRiding || b.alpha <= 0.01) return;
    const x = b.x - cam, y = gy + BAND * .5;
    const bike = b.roadForm === 'moto';
    const suspension = bike ? Math.sin(this.t*13) * 1.3 : Math.sin(this.t*3.2)*.65;
    ctx.save(); ctx.translate(x, y+suspension); ctx.globalAlpha = b.alpha;
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(0,3,bike?30:17,5,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#141722'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    if (bike) {
      ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 3;
      for (const w of [-20,20]) {ctx.beginPath(); ctx.arc(w,-5,8,0,Math.PI*2);ctx.stroke();}
      ctx.beginPath();ctx.moveTo(-20,-5);ctx.lineTo(-4,-19);ctx.lineTo(9,-6);ctx.lineTo(20,-5);ctx.lineTo(-20,-5);ctx.stroke();
    } else {
      ctx.strokeStyle = '#8ddcf5'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-10,-27);ctx.lineTo(-19,-2);ctx.moveTo(11,-27);ctx.lineTo(20,-2);ctx.stroke();
      ctx.strokeStyle = '#171d2a';ctx.lineWidth = 6;
      ctx.beginPath();ctx.moveTo(-4,-32);ctx.lineTo(-9,-9);ctx.moveTo(4,-32);ctx.lineTo(8,-10);ctx.stroke();
    }
    ctx.fillStyle = b.roadPhase3?'#a7183a':'#c43d33'; ctx.strokeStyle='#11151e';ctx.lineWidth=3;
    ctx.beginPath(); ctx.roundRect(-13,bike?-47:-57,26,29,6);ctx.fill();ctx.stroke();
    ctx.strokeStyle = '#fee3bd';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-12,bike?-39:-48);ctx.lineTo(-21,bike?-27:-32);ctx.moveTo(11,bike?-39:-48);ctx.lineTo(20,bike?-25:-33);ctx.stroke();
    ctx.fillStyle='#7b4b36';ctx.beginPath();ctx.arc(0,bike?-56:-65,10,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#151724';ctx.beginPath();ctx.ellipse(0,bike?-63:-72,12,7,0,0,Math.PI*2);ctx.fill();
    for (let i=0;i<5;i++){ctx.strokeStyle='#161827';ctx.lineWidth=2;ctx.beginPath();const xx=-8+i*4;ctx.moveTo(xx,bike?-61:-69);ctx.lineTo(xx+Math.sin(this.t*4+i)*3,bike?-46:-53);ctx.stroke();}
    if (b.ai.stunT>0) {ctx.strokeStyle='#ffd34d';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-45,30,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  },
  roadBeacon(ctx, h, cam, gy) {
    const x=h.x-cam, y=gy+h.z, pulse=.6+.4*Math.sin(this.t*10);
    ctx.save();ctx.translate(x,y);ctx.shadowColor='#38e6ff';ctx.shadowBlur=12*pulse;
    ctx.fillStyle='#101c27';ctx.strokeStyle=h.t>0?'#ffffff':'#38e6ff';ctx.lineWidth=2;
    ctx.beginPath();ctx.roundRect(-9,-35,18,33,4);ctx.fill();ctx.stroke();
    ctx.fillStyle='#ff3b5c';ctx.beginPath();ctx.arc(0,-23,4+pulse*2,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.fillStyle='#38e6ff';ctx.fillRect(-9,-41,18*h.hp/h.maxHp,3);
    ctx.restore();
  },
  roadJoeFx(ctx, b, cam, gy) {
    const A=b.ai.attack;
    if (!A || b.dying) return;
    const x=b.x-cam, y=gy+A.z;
    ctx.save();ctx.fillStyle=`rgba(255,95,60,${.12+.10*Math.sin(this.t*28)})`;
    ctx.fillRect(Math.max(0,x-(A.k==='lunge'?115:70)),y-12,Math.min(x,A.k==='lunge'?115:70),24);
    ctx.strokeStyle='#ffb347';ctx.lineWidth=2;ctx.setLineDash([6,4]);
    ctx.beginPath();ctx.moveTo(Math.max(0,x-(A.k==='lunge'?115:70)),y);ctx.lineTo(x,y);ctx.stroke();
    ctx.setLineDash([]); ctx.font='bold 9px sans-serif';ctx.fillStyle='#fff1b0';ctx.fillText('PAREZ OU ESQUIVEZ',Math.max(4,x-111),y-18);
    ctx.restore();
  },
  colossus(ctx, b, cam, gy) {
    const img = IMG.joevally_sprite;
    if (!img || !img.naturalWidth) return;
    const H = Math.min(gy + BAND * 0.4, 300);
    const W = H * (img.naturalWidth / img.naturalHeight);
    const bob = Math.sin(this.t * 1.6) * 4;
    const x = b.x - cam, by = gy + BAND * 0.42 + bob;
    ctx.save(); ctx.globalAlpha = b.alpha;
    // halo
    if (Settings.fx > 0) {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, by - H * 0.55, 10, x, by - H * 0.55, H * 0.6);
      g.addColorStop(0, `rgba(255,40,70,${0.35 + (b.ai.stunT > 0 ? 0.3 : 0)})`); g.addColorStop(1, 'rgba(255,40,70,0)');
      ctx.fillStyle = g; ctx.fillRect(x - H, by - H * 1.2, H * 2, H * 1.3);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.drawImage(img, x - W / 2, by - H, W, H);
    if (b.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 * b.alpha; ctx.drawImage(img, x - W / 2, by - H, W, H); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = b.alpha; }
    // cœur vulnérable
    const cy = by - H * 0.62, cx = x + W * 0.04;
    const pulse = b.ai.stunT > 0 ? 1 : 0.5 + 0.2 * Math.sin(this.t * 6);
    ctx.globalCompositeOperation = 'lighter';
    const cg = ctx.createRadialGradient(cx, cy, 1, cx, cy, 22 * pulse + 6);
    cg.addColorStop(0, b.ai.stunT > 0 ? 'rgba(255,240,140,1)' : 'rgba(255,90,110,.9)'); cg.addColorStop(1, 'rgba(255,40,70,0)');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  colossusFx(ctx, b, cam, gy) {
    const A = b.ai.attack;
    if (!A || b.dying) return;
    ctx.save();
    if (A.k === 'beam') {
      const lanes = b.hp < b.maxHp * 0.5 ? [A.z, A.z2] : [A.z];
      for (const z of lanes) {
        const y = gy + z;
        if (!A.fired) {
          ctx.strokeStyle = `rgba(255,59,92,${0.4 + 0.4 * Math.sin(this.t * 30)})`; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(b.x - cam, y); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(255,59,92,.12)'; ctx.fillRect(0, y - 9, b.x - cam, 18);
        } else if (A.t < 1.6) {
          ctx.globalCompositeOperation = 'lighter';
          const g = ctx.createLinearGradient(0, y - 22, 0, y - 2);
          g.addColorStop(0, 'rgba(255,40,70,0)'); g.addColorStop(0.5, 'rgba(255,230,240,.95)'); g.addColorStop(1, 'rgba(255,40,70,0)');
          ctx.fillStyle = g; ctx.fillRect(0, y - 24 + rand(-1, 1), b.x - cam - 20, 24);
          ctx.fillStyle = 'rgba(255,59,92,.25)'; ctx.fillRect(0, y - 4, b.x - cam, 8);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
    } else if (A.k === 'slam') {
      const x = A.x - cam, y = gy + A.z;
      if (!A.fired) {
        ctx.strokeStyle = 'rgba(255,59,92,.9)'; ctx.lineWidth = 1.4;
        const r = 30 * (0.6 + 0.4 * (A.t / 1));
        ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.32, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(255,59,92,.18)'; ctx.fill();
      }
      // poing géant
      const drop = A.t < 0.6 ? -200 : A.t < 1 ? lerp(-200, 0, easeOut((A.t - 0.6) / 0.4)) : 0;
      if (A.t > 0.4 && A.t < 2.4) {
        ctx.save(); ctx.translate(x, y - 22 + drop);
        ctx.fillStyle = '#1c1c24'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(-8, -260); ctx.lineTo(8, -260); ctx.lineTo(14, -30); ctx.lineTo(-14, -30); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(-22, -32, 44, 34, 8); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#ff3b5c'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-14, -20); ctx.lineTo(14, -20); ctx.moveTo(-14, -8); ctx.lineTo(14, -8); ctx.moveTo(0, -250); ctx.lineTo(0, -34); ctx.stroke();
        if (b.ai.stunT > 0) { ctx.fillStyle = '#ffd34d'; ctx.font = 'italic 800 9px "Barlow Condensed"'; ctx.textAlign = 'center'; ctx.fillText('FRAPPEZ LE CORE !', 0, -40); }
        ctx.restore();
      }
    } else if (A.k === 'sweep') {
      const x0 = b.x - cam - 170, x1 = b.x - cam;
      if (!A.fired) { ctx.fillStyle = `rgba(255,59,92,${0.12 + 0.1 * Math.sin(this.t * 25)})`; ctx.fillRect(x0, gy - 4, x1 - x0, BAND + 8); ctx.fillStyle = '#ffd34d'; ctx.font = 'italic 800 10px "Barlow Condensed"'; ctx.textAlign = 'center'; ctx.fillText('SAUTEZ !', (x0 + x1) / 2, gy - 10); }
      else if (A.t < 1.4) {
        const k = (A.t - 1) / 0.35;
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255,90,110,.85)'; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.ellipse(x1, gy + BAND / 2, 175, BAND * 0.7, 0, Math.PI * (1 - k * 0.6), Math.PI * (1.05 - k * 0.6) + 0.5); ctx.stroke();
      }
    }
    ctx.restore();
  },

  prop(ctx, p, cam, gy) {
    const x = p.x - cam, y = gy + p.z;
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.lineJoin = 'round';
    const L = Game.stage.light;
    const box = (w, h, col, r) => { ctx.beginPath(); ctx.roundRect(-w / 2, -h, w, h, r || 1.5); ctx.fillStyle = col; ctx.fill(); ctx.stroke(); };
    switch (p.type) {
      case 'trash': box(17, 22, '#5c6b5e', 2); ctx.fillStyle = '#4a574c'; ctx.fillRect(-8, -20, 4, 19); ctx.beginPath(); ctx.roundRect(-10, -25, 20, 4, 1.5); ctx.fillStyle = '#7d8c7f'; ctx.fill(); ctx.stroke(); break;
      case 'barrel': box(16, 22, '#a5482a', 4); ctx.fillStyle = '#3a2a22'; ctx.fillRect(-8, -17, 16, 1.6); ctx.fillRect(-8, -6, 16, 1.6); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-5, -21, 2, 20); break;
      case 'crate': box(22, 20, '#a8773c', 1); ctx.beginPath(); ctx.moveTo(-10, -19); ctx.lineTo(10, -1); ctx.moveTo(10, -19); ctx.lineTo(-10, -1); ctx.stroke(); ctx.strokeRect(-11, -20, 22, 20); break;
      case 'basket': ctx.beginPath(); ctx.moveTo(-11, -16); ctx.lineTo(11, -16); ctx.lineTo(8, 0); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fillStyle = '#c49a52'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ff7a1a'; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * 4, -17, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); } break;
      case 'drum': box(16, 23, '#2f6fb3', 3); ctx.fillStyle = '#ffd34d'; ctx.fillRect(-8, -14, 16, 4); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-5, -22, 2, 21); break;
      case 'speaker': box(20, 26, '#202027', 2); ctx.fillStyle = '#0d0d12'; ctx.beginPath(); ctx.arc(0, -9, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -20, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#ff4fd8'; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(this.t * 8); ctx.beginPath(); ctx.arc(0, -9, 7.5, 0, Math.PI * 2); ctx.stroke(); break;
      case 'server': box(16, 30, '#1a2030', 1.5); for (let i = 0; i < 5; i++) { ctx.fillStyle = (Math.floor(this.t * 4 + i * 1.7) % 3) ? '#38e6ff' : '#ff3b5c'; ctx.fillRect(-5, -27 + i * 5.5, 2, 1.5); ctx.fillStyle = '#2c3548'; ctx.fillRect(-1, -27 + i * 5.5, 6, 1.5); } break;
    }
    // liseré de lumière
    ctx.strokeStyle = L; ctx.globalAlpha = 0.55; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-8, -1); ctx.lineTo(-8, -18); ctx.stroke();
    ctx.restore();
  },

  item(ctx, it, cam, gy) {
    const x = it.x - cam, y = gy + it.z - it.y;
    if (it.kind === 'weapon' && it.t > 11 && Math.floor(it.t * 8) % 2) return;
    ctx.save(); ctx.translate(x, y - 2); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const bob = it.y <= 0 ? Math.sin(this.t * 4 + it.id) * 0.8 : 0;
    ctx.translate(0, bob);
    // halo d'objet
    if (Settings.fx > 0 && it.kind !== 'held' && it.kind !== 'proj') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + 0.15 * Math.sin(this.t * 5 + it.id); ctx.fillStyle = it.kind === 'food' ? '#5dffb0' : it.kind === 'weapon' ? '#9fe8ff' : '#ffd34d'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    const s = it.sub;
    if (s === 'tangawisi') { ctx.beginPath(); ctx.roundRect(-3, -14, 6, 13, 2); ctx.fillStyle = '#f2b705'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e04a2a'; ctx.fillRect(-3, -9, 6, 3); ctx.beginPath(); ctx.roundRect(-1.5, -17, 3, 3, 0.5); ctx.fillStyle = '#ddd'; ctx.fill(); ctx.stroke(); }
    else if (s === 'brochette') { ctx.strokeStyle = '#c9a36a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-11, -3); ctx.lineTo(11, -7); ctx.stroke(); ctx.strokeStyle = INK; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.ellipse(i * 6, -5 - i * 0.7, 3.2, 3, 0, 0, Math.PI * 2); ctx.fillStyle = i ? '#8a4a22' : '#c8692a'; ctx.fill(); ctx.stroke(); } }
    else if (s === 'poulet') { ctx.beginPath(); ctx.ellipse(0, -2, 12, 3, 0, 0, Math.PI * 2); ctx.fillStyle = '#e8e4da'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(-1, -7, 8, 5.5, -0.2, 0, Math.PI * 2); ctx.fillStyle = '#d07a28'; ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-5, -10, 4, 1.4); ctx.beginPath(); ctx.moveTo(6, -8); ctx.lineTo(11, -11); ctx.strokeStyle = '#f5efe0'; ctx.lineWidth = 2; ctx.stroke(); }
    else if (s === 'billet' || s === 'liasse') { const n = s === 'liasse' ? 3 : 1; for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.roundRect(-8, -6 - i * 2.2, 16, 6, 1); ctx.fillStyle = '#3f9b5a'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#bfe8c8'; ctx.fillRect(-2, -5 - i * 2.2, 4, 4); } }
    else if (s === 'star') { ctx.rotate(this.t * 2); this.starShape(ctx, 0, -6, 7, 3, '#ffd34d'); }
    else if (s === 'pipe') { ctx.rotate(-0.15); ctx.beginPath(); ctx.roundRect(-15, -4, 30, 3.4, 1.5); ctx.fillStyle = '#9aa3ad'; ctx.fill(); ctx.stroke(); }
    else if (s === 'bottle') { ctx.rotate(-1.3); ctx.beginPath(); ctx.roundRect(-3, -12, 6, 12, 2); ctx.fillStyle = '#2f9e5a'; ctx.fill(); ctx.stroke(); ctx.fillRect(-1.2, -16, 2.4, 4); }
    else if (s === 'knife') { ctx.beginPath(); ctx.moveTo(-6, -3); ctx.lineTo(6, -4); ctx.lineTo(8, -2.5); ctx.lineTo(-6, -1.5); ctx.closePath(); ctx.fillStyle = '#dfe6ee'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#3a2a22'; ctx.fillRect(-10, -3.4, 4, 2.4); }
    ctx.restore();
  },
  starShape(ctx, x, y, r, r2, col) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? r2 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
  },

  proj(ctx, p, cam, gy) {
    const x = p.x - cam, y = gy + p.z - p.y;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (p.k === 'zap') { ctx.fillStyle = '#7fe8ff'; ctx.shadowColor = '#7fe8ff'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(x, y, 3.4 + Math.sin(this.t * 40), 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - 8 * sign(p.vx), y); ctx.lineTo(x, y + rand(-2, 2)); ctx.stroke(); }
    else if (p.k === 'knife' || p.k === 'weapon') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.save(); ctx.translate(x, y); ctx.rotate(p.k === 'weapon' ? this.t * 22 * sign(p.vx) : 0); if (p.k === 'knife') ctx.scale(sign(p.vx), 1);
      if (Settings.fx > 0) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-18 * (p.k === 'knife' ? 1 : 0), 0); ctx.lineTo(-6, 0); ctx.stroke(); }
      this.item(ctx, { x: cam, z: -gy, y: -2, kind: 'proj', sub: p.k === 'knife' ? 'knife' : p.sub, t: 0, id: 0 }, cam, gy);
      ctx.restore();
    }
    else if (p.k === 'wave') { const pc = p.col || ['rgba(255,79,216,.85)', 'rgba(255,211,77,.8)']; for (let i = 0; i < 3; i++) { ctx.strokeStyle = pc[i % 2]; ctx.lineWidth = 2.2 - i * 0.5; ctx.beginPath(); ctx.ellipse(x - i * 6 * sign(p.vx), y - 22, 5 + i * 2, 22 + i * 2, 0, sign(p.vx) > 0 ? -1.2 : Math.PI - 1.2, sign(p.vx) > 0 ? 1.2 : Math.PI + 1.2); ctx.stroke(); } }
    else if (p.k === 'taser') { ctx.strokeStyle = '#9ff4ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 14 * sign(p.vx), y); for (let i = 0; i < 4; i++) ctx.lineTo(x - (14 - i * 4) * sign(p.vx), y + rand(-2.5, 2.5)); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill(); }
    else if (p.k === 'coin') { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#ffd34d'; ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, 3.6 * Math.abs(Math.cos(this.t * 14 + p.x)), 3.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    else if (p.k === 'shock') { ctx.strokeStyle = 'rgba(255,211,77,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y - 4, 6, 9, 0, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = 'rgba(255,140,40,.4)'; ctx.fill(); }
    ctx.restore();
  },

  // Silhouette originale temporaire : moto lisible en jeu jusqu'aux assets dédiés.
  bikeCharge(ctx, h, cam, gy) {
    const x = h.x - cam, y = gy + h.z;
    ctx.save(); ctx.translate(x, y); ctx.scale(h.dir, 1);
    ctx.shadowColor = '#ffd34d'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#111520'; ctx.strokeStyle = '#d2eaff'; ctx.lineWidth = 1.6;
    for (const wx of [-14, 13]) { ctx.beginPath(); ctx.arc(wx, -3, 6, 0, 2*Math.PI); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#f38b2c'; ctx.beginPath(); ctx.moveTo(-16,-12); ctx.lineTo(7,-15); ctx.lineTo(19,-8); ctx.lineTo(1,-5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#263248'; ctx.fillRect(-5,-26,10,14);
    ctx.fillStyle = '#f5d9a6'; ctx.beginPath(); ctx.arc(-1,-31,5,0,2*Math.PI); ctx.fill();
    ctx.fillStyle = '#fff4b4'; ctx.beginPath(); ctx.arc(19,-13,3,0,2*Math.PI); ctx.fill();
    ctx.restore();
  },
  train(ctx, h, cam, gy) {
    const x = h.x - cam, y = gy + 26;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#2f4a3a'; ctx.beginPath(); ctx.roundRect(x, y - 76, 360, 72, [10, 4, 4, 4]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d6b23a'; ctx.fillRect(x, y - 20, 360, 4);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = 'rgba(255,214,120,.8)'; ctx.fillRect(x + 20 + i * 38, y - 62, 22, 16); ctx.strokeRect(x + 20 + i * 38, y - 62, 22, 16); }
    ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(x + 6, y - 30, 4, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,240,200,.25)'; ctx.beginPath(); ctx.moveTo(x + 6, y - 32); ctx.lineTo(x - 120, y - 60); ctx.lineTo(x - 120, y); ctx.closePath(); ctx.fill();
    ctx.restore();
    // traînées de vitesse
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 0.8;
    for (let i = 0; i < 8; i++) { const yy = y - 70 + i * 9; ctx.beginPath(); ctx.moveTo(x + 360, yy); ctx.lineTo(x + 360 + rand(30, 90), yy); ctx.stroke(); }
    ctx.restore();
  },

  groundMarks(ctx, G, cam, gy) {
    for (const h of G.hazards) {
      if (h.k === 'roadblock' && !h.dead && h.x >= cam - 30 && h.x < cam + this.LW + 30) {
        const x=h.x-cam,y=gy+h.z;
        ctx.fillStyle='rgba(255,170,55,.20)';ctx.beginPath();ctx.ellipse(x,y+1,28,8,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#ffe0a0';ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.fillText('DÉTRUIRE',x,y-38);
      }
      if (h.k === 'bikecharge' && h.phase === 'warn') {
        const x = clamp(h.x - cam, 12, this.LW - 12), y = gy + h.z;
        ctx.save(); ctx.globalAlpha = 0.55 + Math.sin(this.t * 22) * 0.3;
        ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.ellipse(x, y-7, 9, 3, 0, 0, 2*Math.PI); ctx.fill();
        ctx.font = 'bold 10px sans-serif'; ctx.fillText('!', x-2, y-15); ctx.restore();
      }
      if (h.k === 'train' && h.phase === 'warn') {
        const a = 0.25 + 0.25 * Math.sin(this.t * 22);
        ctx.fillStyle = `rgba(255,59,92,${a})`; ctx.fillRect(0, gy - 2, this.LW, 26);
        ctx.fillStyle = '#ff3b5c'; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(this.LW - 12, gy - 40 + i * 9, 3, 0, Math.PI * 2); ctx.globalAlpha = (Math.floor(this.t * 6) + i) % 2 ? 1 : 0.2; ctx.fill(); } ctx.globalAlpha = 1;
      }
      if (h.k === 'lightning' && h.phase === 'warn') {
        const x = h.x - cam, y = gy + h.z;
        ctx.strokeStyle = `rgba(180,160,255,${0.5 + 0.5 * Math.sin(this.t * 30)})`; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.ellipse(x, y, 20, 6.5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = 'rgba(180,160,255,.15)'; ctx.fill();
      }
    }
  },

  particles(ctx, cam, gy) {
    for (const p of FX.list) {
      const x = p.x - cam, y = gy + p.z - p.y, k = p.t / p.life;
      if (x < -60 || x > this.LW + 60) continue;
      switch (p.k) {
        case 'spark': {
          const s = p.s * (k < 0.3 ? lerp(0.5, 1.2, k / 0.3) : lerp(1.2, 0.2, (k - 0.3) / 0.7));
          ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot);
          ctx.beginPath();
          for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; const r = (i % 2 ? 4 : i % 4 ? 9 : 14) * s; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
          ctx.closePath(); ctx.fillStyle = p.col; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, 4 * s, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
          ctx.restore(); break;
        }
        case 'swoosh': {
          // arc de frappe : épais au départ, s'amincit et s'efface (lissé, additif)
          const e = 1 - k, r = p.r * (0.85 + k * 0.25);
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.scale(p.face, 1);
          ctx.strokeStyle = p.col; ctx.lineCap = 'round';
          const a0 = p.spin ? -Math.PI : p.up ? 0.9 : -0.9, a1 = p.spin ? Math.PI : p.up ? -1.3 : 0.7;
          for (let i = 0; i < 3; i++) {
            ctx.globalAlpha = e * (0.55 - i * 0.15); ctx.lineWidth = p.w * e * (1 - i * 0.28) + 0.4;
            ctx.beginPath(); ctx.ellipse(-p.r * 0.35, 0, r - i * 3, r * 0.55 - i * 2, 0, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke();
          }
          ctx.restore(); break;
        }
        case 'lines': {
          // lignes de vitesse radiales sur les gros impacts (style manga / SoR4)
          const e = 1 - k;
          ctx.save(); ctx.globalAlpha = e * 0.8; ctx.strokeStyle = p.col; ctx.lineWidth = 1.1; ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 14; i++) {
            const an = (i / 14) * Math.PI * 2 + (p.id || 0), r0 = 14 + k * 26, r1 = r0 + 18 * e + 6;
            ctx.beginPath(); ctx.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0 * 0.7); ctx.lineTo(x + Math.cos(an) * r1, y + Math.sin(an) * r1 * 0.7); ctx.stroke();
          }
          ctx.restore(); break;
        }
        case 'shard': ctx.strokeStyle = p.col; ctx.globalAlpha = 1 - k; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - p.vx * 0.03, y + p.vy * 0.03); ctx.stroke(); ctx.globalAlpha = 1; break;
        case 'ring': ctx.strokeStyle = p.col; ctx.globalAlpha = 1 - k; ctx.lineWidth = 2 * (1 - k) + 0.5; ctx.beginPath(); ctx.arc(x, y, lerp(p.r0, p.r1, easeOut(k)), 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; break;
        case 'dust': ctx.fillStyle = `rgba(200,195,190,${0.35 * (1 - k)})`; ctx.beginPath(); ctx.arc(x, y, p.r * (0.6 + k), 0, Math.PI * 2); ctx.fill(); break;
        case 'debris': ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot); ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; ctx.fillStyle = p.col; ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); break;
        case 'ghost': if (p.hero && typeof Sprites !== 'undefined' && Sprites.ghost(ctx, p, x, y, 0.32 * (1 - k))) break; if (!p.pose) break; ctx.save(); ctx.globalAlpha = 0.45 * (1 - k); ctx.globalCompositeOperation = 'lighter'; Rig.draw(ctx, { x, y, face: p.face, pose: p.pose, look: p.look, build: (p.build || 1) * DRAW_SCALE, ghost: p.col, t: 0 }); ctx.restore(); break;
        case 'text': ctx.save(); ctx.globalAlpha = 1 - k * k; ctx.font = 'italic 800 8px "Barlow Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 2.4; ctx.strokeStyle = INK; ctx.strokeText(p.str, x, y); ctx.fillStyle = p.col; ctx.fillText(p.str, x, y); ctx.restore(); break;
        case 'shock': ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = p.col; ctx.globalAlpha = 1 - k; ctx.lineWidth = 3 * (1 - k) + 0.6; const r = lerp(p.r0, p.r1, easeOut(k)); ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.3, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); break;
        case 'zap': ctx.save(); ctx.strokeStyle = '#bff8ff'; ctx.lineWidth = 1; ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { ctx.beginPath(); let px = x, py = y; ctx.moveTo(px, py); for (let j = 0; j < 4; j++) { px += rand(-7, 7); py += rand(-7, 7); ctx.lineTo(px, py); } ctx.stroke(); } ctx.restore(); break;
        case 'bolt': {
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - k;
          ctx.strokeStyle = '#e6e0ff'; ctx.lineWidth = 3 * (1 - k) + 1; ctx.shadowColor = '#b46bff'; ctx.shadowBlur = 10;
          ctx.beginPath(); let px = x + rand(-20, 20), py = -10; ctx.moveTo(px, py);
          while (py < y) { px += rand(-12, 12); py += rand(14, 30); ctx.lineTo(px, Math.min(py, y)); }
          ctx.lineTo(x, y); ctx.stroke(); ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(200,180,255,.5)'; ctx.beginPath(); ctx.ellipse(x, y, 24, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore(); break;
        }
      }
    }
  },

  weatherFx(ctx, S, dt) {
    if (Settings.fx === 0 && S.fx !== 'rain') return;
    const W = this.LW, H = this.LH, w = this.weather;
    ctx.save();
    if (S.fx === 'rain' || S.fx === 'storm') {
      ctx.strokeStyle = 'rgba(180,210,255,.35)'; ctx.lineWidth = 0.7;
      ctx.beginPath();
      for (const p of w) {
        p.y += (S.fx === 'storm' ? 520 : 420) * p.v * dt; p.x -= 90 * p.v * dt;
        if (p.y > H) { p.y = -10; p.x = rand(W + 40); }
        if (p.x < -10) p.x += W + 20;
        ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 3 * p.v, p.y - 9 * p.v);
      }
      ctx.stroke();
      // éclaboussures au sol
      ctx.strokeStyle = 'rgba(200,225,255,.35)';
      for (let i = 0; i < 6; i++) { const x = rand(W), y = this.groundY + rand(BAND); ctx.beginPath(); ctx.ellipse(x, y, 2.4, 0.8, 0, 0, Math.PI * 2); ctx.stroke(); }
    } else if (S.fx === 'dust' || S.fx === 'embers') {
      for (const p of w.slice(0, 50)) {
        p.y -= (S.fx === 'embers' ? 22 : 6) * p.v * dt; p.x += Math.sin(this.t + p.c * 9) * 8 * dt;
        if (p.y < 0) { p.y = H; p.x = rand(W); }
        ctx.fillStyle = S.fx === 'embers' ? `rgba(255,${140 + p.c * 80 | 0},60,${0.5 + 0.4 * Math.sin(this.t * 4 + p.c * 9)})` : `rgba(255,230,180,${0.18 + p.c * 0.15})`;
        ctx.fillRect(p.x, p.y, p.s * 1.2, p.s * 1.2);
      }
    } else if (S.fx === 'confetti') {
      for (const p of w.slice(0, 50)) {
        p.y += 26 * p.v * dt; p.x += Math.sin(this.t * 2 + p.c * 9) * 14 * dt;
        if (p.y > H) { p.y = -5; p.x = rand(W); }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(this.t * 3 * p.v + p.c * 6);
        ctx.fillStyle = ['#ff4fd8', '#ffd34d', '#38e6ff', '#5dffb0'][(p.c * 4) | 0]; ctx.globalAlpha = 0.75; ctx.fillRect(-1.4, -0.7, 2.8, 1.4); ctx.restore();
      }
    } else if (S.fx === 'steam') {
      for (const p of w.slice(0, 18)) {
        p.y -= 10 * p.v * dt; p.x += 6 * dt;
        if (p.y < this.groundY - 120) { p.y = this.groundY + rand(BAND); p.x = rand(W); }
        const a = clamp((p.y - (this.groundY - 120)) / 120, 0, 1) * 0.12;
        const rr = 16 + p.s * 14, sg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr); sg.addColorStop(0, `rgba(235,230,225,${a * 0.8})`); sg.addColorStop(1, 'rgba(235,230,225,0)'); ctx.fillStyle = sg; ctx.fillRect(p.x - rr, p.y - rr, rr * 2, rr * 2);
      }
    } else if (S.fx === 'digital') {
      for (const p of w.slice(0, 60)) {
        p.y += 40 * p.v * dt; if (p.y > H) { p.y = -4; p.x = rand(W); }
        ctx.fillStyle = p.c < 0.6 ? `rgba(255,59,92,${0.3 + p.c * 0.4})` : `rgba(56,230,255,${0.3 + p.c * 0.3})`;
        ctx.fillRect(Math.round(p.x / 4) * 4, Math.round(p.y / 4) * 4, 2, 2);
      }
    }
    ctx.restore();
  },

  post(ctx, G, S) {
    const W = this.LW, H = this.LH;
    // trame demi-teinte
    if (Settings.fx > 0 && this.cache.half) { ctx.save(); ctx.globalAlpha = 0.045; ctx.fillStyle = this.cache.half; ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); ctx.fillRect(0, 0, this.cssW, this.cssH); ctx.restore(); }
    ctx.drawImage(this.cache.vign, 0, 0, W, H);
    // coup étoile
    if (G.starFx) {
      const f = G.starFx, k = clamp(f.t / 1.1, 0, 1);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const a = Math.sin(k * Math.PI) * 0.6;
      ctx.strokeStyle = f.col; ctx.globalAlpha = a; ctx.lineWidth = 1.4;
      const cx = f.x - G.camX, cy = this.groundY + f.z - 40;
      for (let i = 0; i < 28; i++) { const ang = i * Math.PI * 2 / 28 + f.t; const r0 = 30 + k * 40, r1 = 400; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0); ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1); ctx.stroke(); }
      ctx.restore();
    }
    // éclair
    if (G.lightning > 0) { ctx.fillStyle = `rgba(220,210,255,${G.lightning * (Settings.noflash ? 0.08 : 0.4)})`; ctx.fillRect(0, 0, W, H); }
    if (G.flash > 0) { ctx.save(); ctx.globalAlpha = Math.min(Settings.noflash ? 0.18 : 0.75, G.flash * (Settings.noflash ? 0.15 : 0.6)); ctx.fillStyle = G.flashCol; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    // ralenti : bandes cinéma
    if (G.slow > 0) { const b = Math.min(1, G.slow * 2) * H * 0.07; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, b); ctx.fillRect(0, H - b, W, b); }
    // vie basse
    const p = G.players[0];
    if (p && !p.out && p.hp < p.maxHp * 0.25 && p.hp > 0) {
      const a = 0.18 + 0.12 * Math.sin(this.t * 7);
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.7);
      g.addColorStop(0, 'rgba(255,0,40,0)'); g.addColorStop(1, `rgba(255,0,40,${a})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  },
};
