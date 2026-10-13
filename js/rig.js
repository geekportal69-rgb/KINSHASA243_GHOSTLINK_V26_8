/* =========================================================
   GHOSTLINK V12 — rig.js
   Squelette vectoriel animé (cinématique inverse 2 os), poses,
   dessin « bande dessinée » : encrage épais, ombrage en aplats, liseré de lumière.
   ========================================================= */
'use strict';

/* Pose = [hx, hy, tor, hd, fhx, fhy, bhx, bhy, ffx, ffy, bfx, bfy, rot]
   repère : pieds à l'origine, y vers le haut, personnage tourné vers +x */
const PK = 13;
function P(hx, hy, tor, hd, fh, bh, ff, bf, rot) { return [hx, hy, tor, hd, fh[0], fh[1], bh[0], bh[1], ff[0], ff[1], bf[0], bf[1], rot || 0]; }
const POSES = {
  idle:       P(0, 29, 0.06, 0, [9, 2], [5, 5], [6, 0], [-7, 0]),
  jab_a:      P(0, 28, 0.02, 0, [5, 3], [5, 6], [8, 0], [-8, 0]),
  jab:        P(2, 28, 0.16, 0.05, [21, 4], [4, 5], [9, 0], [-9, 0]),
  cross:      P(3, 28, 0.28, 0.05, [6, 2], [22, 5], [9, 0], [-10, 0]),
  hook_a:     P(-1, 28, -0.1, 0, [-3, 4], [6, 6], [8, 0], [-9, 0]),
  hook:       P(3, 27, 0.36, 0.1, [18, 8], [2, 4], [10, 0], [-10, 0]),
  upper_a:    P(0, 23, 0.32, 0.1, [6, -9], [6, 4], [9, 0], [-9, 0]),
  upper:      P(2, 31, -0.06, -0.15, [8, 23], [3, 2], [7, 0], [-8, 2]),
  kick_a:     P(0, 29, -0.15, 0, [6, 4], [0, 6], [8, 16], [-4, 0]),
  kick_mid:   P(-2, 30, -0.36, 0.05, [4, 6], [-6, 2], [29, 22], [-6, 0]),
  kick_high:  P(-3, 30, -0.56, 0.1, [2, 8], [-8, 0], [26, 41], [-5, 0]),
  knee_a:     P(0, 29, 0.05, 0, [10, 8], [10, 10], [2, 0], [-6, 0]),
  knee:       P(1, 30, 0.18, 0.05, [13, 6], [12, 8], [3, 12], [-6, 0]),
  air_kick:   P(0, 29, -0.25, 0, [6, 6], [-4, 4], [23, 8], [-4, 14]),
  dive_kick:  P(0, 29, -0.35, 0, [0, 8], [-6, 4], [20, -3], [-2, 14]),
  jump:       P(0, 30, 0.05, 0, [8, 8], [2, 10], [6, 7], [-6, 11]),
  splash:     P(0, 22, 0.1, 0, [15, 0], [12, 2], [4, 0], [-7, 0], -1.25),
  spin:       P(-2, 30, -0.36, 0, [-10, 6], [10, 6], [28, 24], [-6, 0]),
  helico:     P(0, 34, -0.42, 0, [-8, 10], [8, 10], [25, 30], [-8, 10]),
  dash_a:     P(-1, 26, -0.1, 0, [-4, 2], [4, 4], [8, 0], [-10, 0]),
  dash_elbow: P(4, 27, 0.46, 0.1, [12, 6], [-10, -4], [12, 0], [-14, 4]),
  slide:      P(0, 10, -1.05, 0.3, [-10, -8], [-12, -6], [27, 2], [8, 1]),
  hammer_a:   P(-1, 29, -0.16, 0, [-2, 15], [2, 15], [8, 0], [-9, 0]),
  hammer:     P(3, 27, 0.42, 0.1, [22, -2], [6, 4], [10, 0], [-9, 0]),
  axe_a:      P(-1, 30, -0.32, -0.1, [2, 27], [0, 27], [8, 0], [-9, 0]),
  axe:        P(4, 24, 0.58, 0.15, [22, -6], [20, -4], [11, 0], [-10, 0]),
  pound_a:    P(0, 34, -0.1, -0.1, [4, 25], [-2, 25], [4, 6], [-6, 6]),
  pound:      P(0, 20, 0.62, 0.2, [18, -18], [10, -20], [11, 0], [-11, 0]),
  tackle:     P(3, 26, 0.76, 0.2, [14, -4], [6, -2], [12, 0], [-16, 4]),
  throw_a:    P(-1, 29, -0.22, 0, [10, 10], [8, 10], [8, 0], [-9, 0]),
  throw:      P(3, 28, 0.5, 0.1, [18, 14], [16, 10], [10, 0], [-10, 0]),
  swing_a:    P(-1, 29, -0.26, 0, [-6, 16], [2, 6], [8, 0], [-9, 0]),
  swing:      P(3, 27, 0.42, 0.05, [20, -2], [4, 2], [10, 0], [-10, 0]),
  lash:       P(2, 28, 0.3, 0, [22, 8], [0, 4], [10, 0], [-10, 0]),
  grab:       P(2, 29, 0.2, 0, [14, 0], [14, 2], [8, 0], [-9, 0]),
  block:      P(-1, 27, -0.05, 0.1, [8, 9], [9, 11], [8, 0], [-9, 0]),
  hurt:       P(-3, 28, -0.42, -0.45, [-2, -6], [-6, -4], [6, 0], [-8, 0]),
  hurt2:      P(1, 26, 0.5, 0.25, [6, -10], [2, -10], [7, 0], [-8, 0]),
  fall:       P(0, 24, -0.2, -0.3, [-8, 10], [-12, 6], [12, 8], [4, 4], 1.0),
  down:       P(0, 5, 0, -0.1, [-12, 3], [-16, 1], [8, 2], [2, 4], 1.52),
  getup:      P(0, 16, 0.62, 0.1, [10, -14], [4, -14], [10, 0], [-4, 0]),
  victory:    P(0, 29, -0.05, -0.15, [4, 26], [6, 4], [6, 0], [-7, 0]),
  taunt:      P(0, 29, -0.04, -0.1, [6, -15], [-5, -15], [7, 0], [-7, 0]),
  dizzy:      P(0, 27, 0.25, 0.3, [6, -12], [0, -12], [5, 0], [-6, 0]),
};

/* ---------- Mathématiques ---------- */
function ik(rx, ry, tx, ty, l1, l2, bend) {
  let dx = tx - rx, dy = ty - ry;
  let d = Math.hypot(dx, dy);
  const max = (l1 + l2) * 0.999;
  if (d > max) { dx *= max / d; dy *= max / d; d = max; }
  if (d < 0.001) d = 0.001;
  const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const base = Math.atan2(dy, dx);
  const j = base + bend * a;
  return [rx + Math.cos(j) * l1, ry + Math.sin(j) * l1, rx + dx, ry + dy];
}
function lerpPose(out, a, b, t) { for (let i = 0; i < PK; i++) out[i] = a[i] + (b[i] - a[i]) * t; return out; }
function shade(hex, k) {
  // k < 0 assombrit, k > 0 éclaircit
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1, 7).replace(/\./g, '0');
}
const _shadeCache = new Map();
function sh(hex, k) {
  const key = hex + k;
  let v = _shadeCache.get(key);
  if (!v) { v = shade(hex, k); v = '#' + v.slice(1).padStart(6, '0'); _shadeCache.set(key, v); }
  return v;
}

/* ---------- Dessin ---------- */
const INK = '#0b0710';
const Rig = {
  ink: 1.35,
  /* f : { x, y(écran pieds), face, pose(array), look, build, w, flash, ghost, alpha, weapon, t, tail, rim, shieldOn } */
  draw(ctx, o) {
    const L = o.look, pz = o.pose;
    const s = o.build || 1, wv = L.w || 1;
    const ghost = o.ghost;
    const flash = o.flash;
    const ink = this.ink;
    const C = (c) => (ghost ? ghost : flash ? '#ffffff' : c);
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.scale(o.face * s, s);
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // repère : y vers le haut → on dessine en négatif
    const hx = pz[0], hy = pz[1], tor = pz[2], hd = pz[3], rot = pz[12];
    const T = 21, TH = 15, SH = 15, UA = 11.5, FA = 11;
    ctx.translate(hx, -hy);
    if (rot) ctx.rotate(-rot);
    // positions relatives à la hanche (y vers le haut)
    const sx = Math.sin(tor) * T, sy = Math.cos(tor) * T;
    const shF = [sx + 1.6 * Math.cos(tor), sy - 1.6 * Math.sin(tor)], shB = [sx - 2.2 * Math.cos(tor), sy + 2.2 * Math.sin(tor)];
    const footOff = -hy; // les pieds sont exprimés depuis l'origine sol
    const fF = [pz[8] - hx, pz[9] + footOff], fB = [pz[10] - hx, pz[11] + footOff];
    const hpF = [1.8, 0], hpB = [-1.8, 0];
    const legF = ik(hpF[0], hpF[1], fF[0], fF[1], TH, SH, 1);
    const legB = ik(hpB[0], hpB[1], fB[0], fB[1], TH, SH, 1);
    const armF = ik(shF[0], shF[1], shF[0] + pz[4], shF[1] + pz[5], UA, FA, -1);
    const armB = ik(shB[0], shB[1], shB[0] + pz[6], shB[1] + pz[7], UA, FA, -1);
    const neck = [sx + Math.sin(tor + hd * 0.5) * 3.5, sy + Math.cos(tor + hd * 0.5) * 3.5];
    const head = [neck[0] + Math.sin(tor + hd) * 6.3, neck[1] + Math.cos(tor + hd) * 6.3];

    // V12 : membres en « capsule effilée » (épais à l'attache, fins à l'extrémité),
    // ombrés par un dégradé perpendiculaire au membre — rendu plus proche d'un dessin animé
    // peint que des simples traits d'un vieux jeu Flash.
    const limb = (ax, ay, bx, by, w, col, hi) => {
      ay = -ay; by = -by;
      const dx = bx - ax, dy = by - ay, L0 = Math.hypot(dx, dy) || 0.001;
      const nx = -dy / L0, ny = dx / L0;
      const ra = w * 0.54, rb = w * 0.43, ang = Math.atan2(dy, dx);
      const path = (pad) => {
        ctx.beginPath();
        ctx.arc(ax, ay, ra + pad, ang + Math.PI / 2, ang - Math.PI / 2);
        ctx.arc(bx, by, rb + pad, ang - Math.PI / 2, ang + Math.PI / 2);
        ctx.closePath();
      };
      if (!ghost) { path(ink); ctx.fillStyle = INK; ctx.fill(); }
      path(0); ctx.fillStyle = C(col); ctx.fill();
      if (!ghost && !flash && Settings.fx > 0) {
        const mx = (ax + bx) / 2, my = (ay + by) / 2;
        const g = ctx.createLinearGradient(mx + nx * ra, my + ny * ra, mx - nx * ra, my - ny * ra);
        g.addColorStop(0, 'rgba(255,255,255,.16)'); g.addColorStop(0.38, 'rgba(255,255,255,0)');
        g.addColorStop(0.62, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.34)');
        ctx.fillStyle = g; ctx.fill();
      }
      if (hi && !ghost && !flash) {
        ctx.strokeStyle = hi; ctx.lineWidth = w * 0.24;
        const ox = nx * w * 0.24, oy = ny * w * 0.24;
        ctx.beginPath(); ctx.moveTo(ax + ox * 1.1, ay + oy * 1.1); ctx.lineTo(bx + ox * 0.85, by + oy * 0.85); ctx.stroke();
      }
    };
    const disc = (x, y, r, col, line = true) => {
      ctx.beginPath(); ctx.arc(x, -y, r, 0, Math.PI * 2);
      ctx.fillStyle = C(col); ctx.fill();
      if (line && !ghost) { ctx.strokeStyle = INK; ctx.lineWidth = ink; ctx.stroke(); }
    };
    const poly = (pts, col, line = true) => {
      ctx.beginPath(); ctx.moveTo(pts[0][0], -pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], -pts[i][1]);
      ctx.closePath(); ctx.fillStyle = C(col); ctx.fill();
      if (line && !ghost) { ctx.strokeStyle = INK; ctx.lineWidth = ink; ctx.stroke(); }
    };
    const rim = o.rim || '#9fe8ff';
    const skin = L.skin || '#6b3f26', skin2 = L.skin2 || sh(skin, -0.3);
    const top = L.top || '#333', top2 = L.top2 || sh(top, -0.35);
    const pants = L.pants || '#222', pants2 = L.pants2 || sh(pants, -0.35);
    const sleeve = L.tank || L.crop || L.vest ? skin : top;
    const sleeveB = L.tank || L.crop || L.vest ? skin2 : top2;
    const fist = L.glove || L.wrap || skin;

    // --- couches arrière : tresse / pans de manteau ---
    if (L.hair === 'braids' && !ghost) this.braidTail(ctx, head, o, L, C);
    if (L.coat) {
      const kneeY = Math.min(legF[1], legB[1]) - 2;
      poly([[shB[0] - 3, shB[1] - 2], [-7 - wv * 2, kneeY - 4], [8 + wv * 2, kneeY - 2], [shF[0] + 2, shF[1] - 2]], sh(top, -0.45));
    }
    // --- bras arrière ---
    limb(shB[0], shB[1], armB[0], armB[1], 6.3 * wv, sleeveB);
    limb(armB[0], armB[1], armB[2], armB[3], 5.6 * wv, L.tank || L.crop || L.vest ? skin2 : sleeveB);
    if (o.shieldOn) this.shield(ctx, armB, C, ink, ghost);
    else disc(armB[2], armB[3], 3.5 * Math.max(1, wv * 0.85), sh(fist, -0.25));
    // --- jambe arrière ---
    limb(hpB[0], hpB[1], legB[0], legB[1], 7.4 * wv, pants2);
    limb(legB[0], legB[1], legB[2], legB[3], 6.3 * wv, pants2);
    this.shoe(ctx, legB, L, true, C, ink, ghost);
    // --- torse ---
    const cx = Math.cos(tor), cy = -Math.sin(tor); // vecteur perpendiculaire (vers l'avant)
    const hw = 5.4 * wv, cw = 7.6 * wv;
    const torsoPts = [[-hw * cx, -hw * cy], [hw * cx, hw * cy], [sx + cw * cx + 0.6, sy + cw * cy], [sx - cw * cx, sy - cw * cy]];
    poly(torsoPts, L.suit || L.armor ? top : L.vest ? skin : top);
    if (!ghost && !flash) {
      // ombrage en aplat (moitié arrière)
      poly([[-hw * cx, -hw * cy], [0, 0], [sx, sy], [sx - cw * cx, sy - cw * cy]], L.vest ? skin2 : top2, false);
      if (L.crop) poly([[-hw * cx, -hw * cy], [hw * cx, hw * cy], [sx * 0.45 + hw * 1.1 * cx, sy * 0.45 + hw * 1.1 * cy], [sx * 0.45 - hw * 1.1 * cx, sy * 0.45 - hw * 1.1 * cy]], skin, true);
      if (L.vest) {
        poly([[sx * 0.1 - hw * cx, sy * 0.1 - hw * cy], [sx * 0.1 - 1 * cx, sy * 0.1], [sx - 1.5 * cx, sy], [sx - cw * cx, sy - cw * cy]], top, true);
        poly([[sx * 0.1 + 2 * cx, sy * 0.1 + 2 * cy], [sx * 0.1 + hw * cx, sy * 0.1 + hw * cy], [sx + cw * cx, sy + cw * cy], [sx + 2.5 * cx, sy]], top, true);
      }
      if (L.tank) { // bretelles débardeur visibles sur les épaules
        ctx.strokeStyle = C(skin); ctx.lineWidth = 2.6 * wv;
        ctx.beginPath(); ctx.moveTo(sx + cw * 0.85 * cx, -(sy + cw * 0.85 * cy) + 1); ctx.lineTo(sx + cw * 0.5 * cx, -(sy - 2)); ctx.stroke();
      }
      if (L.suit) {
        poly([[sx + 0.5, sy - 1], [sx * 0.55 + 1.6 * cx, sy * 0.55], [sx + 3.5 * cx, sy + 3.5 * cy]], '#ffffff', false);
        limb(sx + 1 * cx, sy - 1.5, sx * 0.5 + 1.2 * cx, sy * 0.5, 1.6, L.tie || '#c81d2c');
      }
      if (L.armor) { poly([[sx * 0.35 - 2 * cx, sy * 0.35], [sx * 0.35 + cw * 0.9 * cx, sy * 0.35 + cw * 0.9 * cy], [sx + cw * 0.8 * cx, sy - 1 + cw * 0.8 * cy], [sx - 2 * cx, sy - 1]], sh(top, 0.18)); }
      if (L.seam) { // coutures lumineuses
        ctx.strokeStyle = L.seam; ctx.lineWidth = 0.9; ctx.shadowColor = L.seam; ctx.shadowBlur = o.fx > 1 ? 4 : 0;
        ctx.beginPath(); ctx.moveTo(sx * 0.9 + cw * 0.7 * cx, -(sy * 0.9 + cw * 0.7 * cy)); ctx.lineTo(hw * 0.6 * cx, -(hw * 0.6 * cy) - 2);
        ctx.moveTo(sx * 0.6 - 1 * cx, -(sy * 0.6)); ctx.lineTo(sx * 0.6 + 4 * cx, -(sy * 0.6 + 4 * cy)); ctx.stroke(); ctx.shadowBlur = 0;
      }
      if (L.glitter) { ctx.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { const k = (o.t * 3 + i * 1.7) % 1; ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(o.t * 6 + i)); ctx.fillRect(sx * k + (i - 2) * 1.6 * cx, -(sy * k) - 1, 0.9, 0.9); } ctx.globalAlpha = o.alpha != null ? o.alpha : 1; }
      if (L.chain) { ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(sx + 1.5 * cx, -(sy - 2), 3.4 * wv, 0.2, Math.PI - 0.2); ctx.stroke(); }
      // ceinture
      limb(-hw * cx, -hw * cy + 1, hw * cx, hw * cy + 1, 1.6, L.dress ? top2 : '#1a1a1a');
      // liseré de lumière (rim light) côté dos
      ctx.strokeStyle = rim; ctx.globalAlpha *= 0.75; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(-hw * cx - 0.4, -(-hw * cy) - 1); ctx.lineTo(sx - cw * cx - 0.4, -(sy - cw * cy) + 1); ctx.stroke();
      ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
    }
    // jupe / robe
    if (L.dress) {
      const kneeY = (legF[1] + legB[1]) / 2 - 3;
      poly([[-hw * cx - 1, -hw * cy + 2], [hw * cx + 1, hw * cy + 2], [Math.max(legF[0], legB[0]) + 4, kneeY], [Math.min(legF[0], legB[0]) - 5, kneeY]], top);
      if (!ghost && !flash) this.waxDots(ctx, (Math.min(legF[0], legB[0]) - 2), kneeY + 2, (Math.max(legF[0], legB[0]) + 2), hw * 2, L.wrapc || '#f2b705');
    }
    // --- jambe avant ---
    const hiL = ghost || flash ? null : sh(pants, 0.25);
    limb(hpF[0], hpF[1], legF[0], legF[1], 7.6 * wv, pants, hiL);
    limb(legF[0], legF[1], legF[2], legF[3], 6.5 * wv, pants, hiL);
    if (L.wax && !L.dress && !ghost && !flash) { this.legDots(ctx, hpF, legF, pants2); }
    this.shoe(ctx, legF, L, false, C, ink, ghost);
    // --- tête ---
    this.head(ctx, head, tor + hd, L, C, ink, ghost, flash, o);
    // --- bras avant + arme ---
    const hiA = ghost || flash ? null : sh(sleeve, 0.25);
    limb(shF[0], shF[1], armF[0], armF[1], 6.7 * wv, sleeve, hiA);
    if (L.armor && !ghost) disc(shF[0], shF[1] + 0.5, 3.6 * wv, sh(top, 0.12));
    limb(armF[0], armF[1], armF[2], armF[3], 5.9 * wv, L.tank || L.crop || L.vest ? skin : sleeve, hiA);
    if (o.weapon) this.weapon(ctx, armF, o.weapon, C, ink, ghost, o);
    disc(armF[2], armF[3], 3.8 * Math.max(1, wv * 0.85), fist);
    ctx.restore();
  },

  shoe(ctx, leg, L, back, C, ink, ghost) {
    const x = leg[2], y = leg[3];
    const ang = Math.atan2(leg[3] - leg[1], leg[2] - leg[0]) + Math.PI / 2; // perpendiculaire au tibia
    ctx.save(); ctx.translate(x, -y); ctx.rotate(-ang);
    const col = back ? sh(L.shoe || '#222', -0.3) : (L.shoe || '#222');
    const h = L.platform ? 4.4 : 3;
    ctx.beginPath(); ctx.roundRect(-2.6, -h + 1.2, 8.4, h, 1.6);
    ctx.fillStyle = C(col); ctx.fill();
    if (!ghost) { ctx.strokeStyle = INK; ctx.lineWidth = ink; ctx.stroke(); }
    if (!ghost && L.shoe2) { ctx.fillStyle = C(L.shoe2); ctx.fillRect(-2, 0, 7.4, 0.9); }
    ctx.restore();
  },

  head(ctx, h, ang, L, C, ink, ghost, flash, o) {
    const skin = L.skin || '#6b3f26';
    ctx.save(); ctx.translate(h[0], -h[1]); ctx.rotate(ang);
    const fill = (c) => { ctx.fillStyle = C(c); ctx.fill(); if (!ghost) { ctx.strokeStyle = INK; ctx.lineWidth = ink; ctx.stroke(); } };
    const hair = L.hair || 'short';
    // éléments arrière de coiffure
    if (hair === 'puff') { ctx.beginPath(); ctx.arc(-3, -5, 6.2, 0, Math.PI * 2); fill('#1a110c'); }
    if (hair === 'wrap') { ctx.beginPath(); ctx.ellipse(-1.5, -7.5, 6.5, 6.5, -0.3, 0, Math.PI * 2); fill(L.wrapc || '#f2b705'); }
    if (L.hood) { ctx.beginPath(); ctx.ellipse(-1.2, -0.6, 7.6, 8, 0, 0, Math.PI * 2); fill(sh(L.top, -0.2)); }
    // visage
    ctx.beginPath(); ctx.ellipse(0.3, 0, 5.8, 6.7, 0, 0, Math.PI * 2); fill(skin);
    if (!ghost && !flash) {
      // ombre de joue
      ctx.beginPath(); ctx.ellipse(-2.2, 0.8, 3, 5.2, 0, 0, Math.PI * 2); ctx.fillStyle = sh(skin, -0.22); ctx.fill();
      // mâchoire avant
      ctx.beginPath(); ctx.moveTo(5.2, 0.5); ctx.lineTo(4.6, 4.6); ctx.lineTo(1, 6.2); ctx.strokeStyle = INK; ctx.lineWidth = ink * 0.8; ctx.stroke();
      // oreille
      ctx.beginPath(); ctx.ellipse(-1.2, 0.6, 1, 1.4, 0, 0, Math.PI * 2); ctx.fillStyle = sh(skin, -0.12); ctx.fill(); ctx.stroke();
      // yeux / sourcil
      if (L.shades) { ctx.fillStyle = '#05050a'; ctx.beginPath(); ctx.roundRect(1.4, -1.6, 4.4, 2.1, 0.8); ctx.fill(); ctx.fillStyle = '#9fe8ff'; ctx.fillRect(2.4, -1.2, 1.2, 0.5); }
      else {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(3.6, -0.7, 1.15, 0.85, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0b0710'; ctx.beginPath(); ctx.arc(4.1, -0.6, 0.55, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(1.8, -2.6); ctx.lineTo(5.6, -1.7); ctx.stroke();
      }
      if (L.female) { ctx.strokeStyle = INK; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(4.8, -0.9); ctx.lineTo(6, -1.5); ctx.stroke(); }
      // nez et bouche
      ctx.strokeStyle = INK; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(5.5, 0.2); ctx.lineTo(6.2, 1.8); ctx.lineTo(5.2, 2.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(3.2, 4); ctx.lineTo(5, 3.7); ctx.stroke();
      if (L.beard) { ctx.beginPath(); ctx.moveTo(-0.8, 1.5); ctx.quadraticCurveTo(-0.5, 7.8, 3, 7.2); ctx.quadraticCurveTo(5.6, 6.8, 5.6, 3.2); ctx.lineTo(4.4, 3.4); ctx.quadraticCurveTo(2.5, 5, 0.6, 2.5); ctx.closePath(); ctx.fillStyle = '#2a2420'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = ink * 0.8; ctx.stroke(); }
      if (L.bandana) { ctx.fillStyle = L.bandana; ctx.beginPath(); ctx.moveTo(-5.2, -3.5); ctx.lineTo(5.4, -3.2); ctx.lineTo(5.2, -1.6); ctx.lineTo(-5.4, -1.8); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-5, -2.6); ctx.lineTo(-9, -1 + Math.sin(o.t * 9) * 1.2); ctx.lineTo(-8.4, 0.6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    }
    // coiffures
    ctx.strokeStyle = INK; ctx.lineWidth = ink;
    if (hair === 'twists') {
      for (let i = 0; i < 6; i++) { const a = -2.5 + i * 0.36; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 4.6 - 0.4, Math.sin(a) * 5.2 - 1.6, 1.8, 2.6, a + 1.57, 0, Math.PI * 2); fill('#151010'); }
    } else if (hair === 'short' || hair === 'phones') {
      ctx.beginPath(); ctx.ellipse(0, -3, 5.6, 4.2, 0, Math.PI, Math.PI * 2); ctx.lineTo(-5.4, 0); ctx.closePath(); fill('#151010');
    } else if (hair === 'braids') {
      ctx.beginPath(); ctx.ellipse(0, -3.2, 5.8, 4, 0, Math.PI, Math.PI * 2); ctx.closePath(); fill('#1a110c');
      ctx.beginPath(); ctx.arc(-2.6, -7.2, 2.6, 0, Math.PI * 2); fill('#1a110c');
      if (!ghost && !flash) { ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-4.4, -5.6); ctx.lineTo(-0.8, -5.2); ctx.stroke(); }
    } else if (hair === 'bald') {
      if (!ghost && !flash) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(1.6, -4.6, 1.8, 0.9, -0.3, 0, Math.PI * 2); ctx.fill(); }
    } else if (hair === 'wrap') {
      ctx.beginPath(); ctx.ellipse(0, -4, 6, 3.4, -0.1, Math.PI, Math.PI * 2); ctx.closePath(); fill(L.wrapc || '#f2b705');
      if (!ghost && !flash) { ctx.fillStyle = '#d8322a'; ctx.fillRect(-4, -6.6, 7, 1.2); }
    } else if (hair === 'captain') {
      ctx.beginPath(); ctx.roundRect(-5.6, -9.4, 11.2, 5, 1.4); fill('#f1f1f1');
      ctx.beginPath(); ctx.moveTo(-5, -4.4); ctx.lineTo(8.2, -4.2); ctx.lineTo(7.2, -3); ctx.lineTo(-5, -3.4); ctx.closePath(); fill('#141414');
      if (!ghost && !flash) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(0, -7.6, 2.4, 1.6); }
    }
    if (hair === 'phones') {
      ctx.lineWidth = 1.6; ctx.strokeStyle = C('#1b1b1f'); ctx.beginPath(); ctx.arc(-0.5, -1, 6.6, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(-3.6, -2.6, 3.6, 5, 1.4); fill('#7a2fd0');
      if (!ghost && !flash) { ctx.fillStyle = '#ffd34d'; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(o.t * 8); ctx.fillRect(-2.8, -1.2, 2, 2); ctx.globalAlpha = 1; }
    }
    if (L.cap) {
      ctx.beginPath(); ctx.ellipse(0, -3.6, 5.8, 3.8, 0, Math.PI, Math.PI * 2); ctx.closePath(); fill(L.cap);
      ctx.beginPath(); ctx.moveTo(3, -3.8); ctx.lineTo(9, -3.2); ctx.lineTo(8.4, -2.2); ctx.lineTo(3, -2.6); ctx.closePath(); fill(sh(L.cap, -0.3));
    }
    if (L.helmet) {
      ctx.beginPath(); ctx.arc(0, -1.2, 6.6, Math.PI * 0.95, Math.PI * 2.05); ctx.closePath(); fill(L.helmet);
      if (!ghost && !flash) { ctx.beginPath(); ctx.moveTo(1, -2.4); ctx.lineTo(7, -2.2); ctx.lineTo(6.6, 1.6); ctx.lineTo(1.6, 1.4); ctx.closePath(); ctx.fillStyle = 'rgba(120,200,255,.35)'; ctx.fill(); ctx.stroke(); }
    }
    ctx.restore();
  },

  braidTail(ctx, head, o, L, C) {
    const tail = o.tail || 0;
    const bx = head[0] - 3, by = head[1] + 6;
    ctx.save(); ctx.lineCap = 'round';
    let px = bx, py = by, a = -2.2 + tail;
    ctx.strokeStyle = INK; ctx.lineWidth = 4.6;
    const pts = [[px, py]];
    for (let i = 0; i < 5; i++) { a += 0.18 + tail * 0.12; px += Math.cos(a) * 4.2; py += Math.sin(a) * 4.2; pts.push([px, py]); }
    ctx.beginPath(); ctx.moveTo(pts[0][0], -pts[0][1]); for (const p of pts) ctx.lineTo(p[0], -p[1]); ctx.stroke();
    ctx.strokeStyle = C('#1a110c'); ctx.lineWidth = 2.4; ctx.stroke();
    ctx.restore();
  },

  waxDots(ctx, x0, y0, x1, h, col) {
    ctx.fillStyle = col;
    for (let x = x0; x < x1; x += 3.2) for (let y = y0; y < y0 + h; y += 3.2) { ctx.beginPath(); ctx.arc(x, -y, 0.9, 0, Math.PI * 2); ctx.fill(); }
  },
  legDots(ctx, hp, leg, col) {
    ctx.fillStyle = col;
    for (let k = 0.15; k < 1; k += 0.22) {
      ctx.beginPath(); ctx.arc(lerp(hp[0], leg[0], k), -lerp(hp[1], leg[1], k), 1.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(lerp(leg[0], leg[2], k), -lerp(leg[1], leg[3], k), 1.1, 0, Math.PI * 2); ctx.fill();
    }
  },

  shield(ctx, arm, C, ink, ghost) {
    ctx.save(); ctx.translate(arm[2] + 3, -arm[3] - 2);
    ctx.beginPath(); ctx.roundRect(-2, -12, 7, 26, 2.4);
    ctx.fillStyle = ghost ? ghost : 'rgba(150,190,230,.55)'; ctx.fill();
    if (!ghost) { ctx.strokeStyle = INK; ctx.lineWidth = ink; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(0, -10, 1.2, 20); }
    ctx.restore();
  },

  weapon(ctx, arm, kind, C, ink, ghost, o) {
    const ex = arm[0], ey = arm[1], hx = arm[2], hy = arm[3];
    let a = Math.atan2(hy - ey, hx - ex);
    const spec = {
      pipe: { len: 30, w: 2.6, col: '#9aa3ad', back: 6 }, baton: { len: 22, w: 2.6, col: '#1e1e24', back: 4 },
      knife: { len: 11, w: 1.8, col: '#dfe6ee', back: 2 }, pestle: { len: 40, w: 4, col: '#8a5a2b', back: 10 },
      cane: { len: 26, w: 1.8, col: '#e8b923', back: 4 }, bottle: { len: 12, w: 3.2, col: '#2f9e5a', back: 2 },
      chain: { len: o.lash ? 64 : 0, w: 1.6, col: '#b9c0c8', back: 0 },
    }[kind];
    if (!spec) return;
    if (kind === 'chain') {
      if (!o.lash) { ctx.strokeStyle = '#b9c0c8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(hx, -hy, 4, 0, Math.PI * 2); ctx.stroke(); return; }
      a = 0.05;
    }
    // l'arme prolonge l'avant-bras, tenue perpendiculairement au poing pour les bâtons
    if (kind !== 'knife' && kind !== 'bottle' && kind !== 'chain') a += 0.9;
    const bx = hx - Math.cos(a) * spec.back, by = hy - Math.sin(a) * spec.back;
    const tx = hx + Math.cos(a) * spec.len, ty = hy + Math.sin(a) * spec.len;
    ctx.lineCap = 'round';
    if (kind === 'chain') {
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hx, -hy);
      for (let i = 1; i <= 10; i++) { const k = i / 10; ctx.lineTo(lerp(hx, tx, k), -(lerp(hy, ty, k) + Math.sin(k * 9 + o.t * 30) * 3 * (1 - k))); }
      ctx.stroke(); ctx.strokeStyle = C('#cfd6de'); ctx.lineWidth = 1.4; ctx.stroke(); return;
    }
    if (!ghost) { ctx.strokeStyle = INK; ctx.lineWidth = spec.w + ink * 2; ctx.beginPath(); ctx.moveTo(bx, -by); ctx.lineTo(tx, -ty); ctx.stroke(); }
    ctx.strokeStyle = C(spec.col); ctx.lineWidth = spec.w; ctx.beginPath(); ctx.moveTo(bx, -by); ctx.lineTo(tx, -ty); ctx.stroke();
    if (!ghost) {
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = spec.w * 0.3; ctx.beginPath(); ctx.moveTo(lerp(bx, tx, 0.3), -lerp(by, ty, 0.3) - 0.5); ctx.lineTo(tx, -ty - 0.5); ctx.stroke();
      if (kind === 'cane') { ctx.beginPath(); ctx.arc(bx, -by, 2.2, 0, Math.PI * 2); ctx.fillStyle = '#ffd34d'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = ink; ctx.stroke(); }
      if (kind === 'baton' && o.zap) { ctx.strokeStyle = '#7fe8ff'; ctx.lineWidth = 0.9; ctx.beginPath(); for (let i = 0; i < 4; i++) ctx.lineTo(tx + rand(-4, 4), -ty + rand(-4, 4)); ctx.stroke(); }
    }
  },

  /* Drone GHOSTLINK */
  drone(ctx, x, y, face, t, flash, rim) {
    ctx.save(); ctx.translate(x, y); ctx.scale(face, 1);
    ctx.lineWidth = this.ink; ctx.strokeStyle = INK;
    const bob = Math.sin(t * 7) * 1.2;
    ctx.translate(0, bob);
    ctx.fillStyle = flash ? '#fff' : '#20252e';
    ctx.beginPath(); ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = flash ? '#fff' : '#39414e'; ctx.beginPath(); ctx.ellipse(-1, -2.2, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
    // rotors
    ctx.strokeStyle = 'rgba(220,230,255,.6)'; ctx.lineWidth = 1;
    for (const sx of [-10, 10]) { ctx.beginPath(); ctx.ellipse(sx, -7, 7 * Math.abs(Math.sin(t * 40 + sx)), 1.2, 0, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(sx, -6); ctx.lineTo(sx * 0.6, -2); ctx.stroke(); ctx.strokeStyle = 'rgba(220,230,255,.6)'; }
    // œil
    ctx.fillStyle = '#ff2a4a'; ctx.shadowColor = '#ff2a4a'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(7, 0.5, 2.4, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = rim || '#9fe8ff'; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.ellipse(0, 0, 12, 6, 0, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
    ctx.restore();
  },
};
