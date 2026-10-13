/* =========================================================
   GHOSTLINK V12.3 — audio.js
   Bruitages et musique « électro-rumba » 100 % synthétisés en temps réel :
   house / techno années 90 + guitare sebene, une variation par commune.
   V12.3 : son spatial (stéréo, casque 3D binaural HRTF, mono), réverbération
   d'environnement par lieu (rue, hall, tunnel), limiteur maître, mode nuit,
   musique dynamique (intensité du combat, filtre en pause et à faible vie),
   battement de cœur. Dolby Atmos n'existe pas dans un navigateur : le mode
   « Casque 3D » utilise le rendu binaural HRTF de Web Audio à la place.
   ========================================================= */
'use strict';

const Sound = (function () {
  let ac = null, master, musicBus, sfxBus, comp, noiseBuf, delay, verb, musicLP, limiter, envSend, verbOut, dryOut;
  let spot = null, spotNode = null, viewX = 0, viewW = 300, inten = 1, intenT = 1, lowHp = 0, heartT = 0, paused = false, IRS = {}, envKind = '';
  let variant = 0;
  let track = null, playing = false, step = 0, nextT = 0, timer = 0, duck = 1, trackId = '';
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const SCALES = {
    minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10],
    major: [0, 2, 4, 5, 7, 9, 11], mixo: [0, 2, 4, 5, 7, 9, 10],
  };

  /* --- Pistes : tempo, tonalité, progression (4 mesures), style --- */
  const TRACKS = {
    menu:      { tempo: 112, root: 45, scale: 'dorian', prog: [0, 5, 3, 7], style: 'house', guitar: 1, lead: 0.5, seed: 11 },
    boulevard: { tempo: 122, root: 45, scale: 'minor', prog: [0, -4, -2, -5], style: 'house', guitar: 0.6, lead: 1, seed: 3 },
    marche:    { tempo: 118, root: 47, scale: 'mixo', prog: [0, 5, 7, 5], style: 'rumba', guitar: 1, lead: 0.8, seed: 21 },
    port:      { tempo: 116, root: 43, scale: 'dorian', prog: [0, 3, 5, 3], style: 'break', guitar: 0.7, lead: 1, seed: 8 },
    matonge:   { tempo: 126, root: 48, scale: 'major', prog: [0, 5, -3, 7], style: 'rumba', guitar: 1, lead: 1, seed: 42 },
    gare:      { tempo: 130, root: 40, scale: 'minor', prog: [0, 0, -2, -4], style: 'techno', guitar: 0.3, lead: 0.9, seed: 5 },
    tour:      { tempo: 134, root: 42, scale: 'phrygian', prog: [0, 1, -2, 1], style: 'techno', guitar: 0.2, lead: 1, seed: 77 },
    core:      { tempo: 140, root: 40, scale: 'phrygian', prog: [0, 1, 3, 1], style: 'boss', guitar: 0, lead: 1, seed: 99 },
    boss:      { tempo: 138, root: 41, scale: 'phrygian', prog: [0, 1, 0, -2], style: 'boss', guitar: 0.4, lead: 1, seed: 13 },
    ending:    { tempo: 104, root: 48, scale: 'major', prog: [0, 5, 9, 7], style: 'rumba', guitar: 1, lead: 0.6, seed: 64 },
  };

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2;
    master = ac.createGain(); master.gain.value = 0.9;
    musicBus = ac.createGain(); sfxBus = ac.createGain();
    delay = ac.createDelay(1);
    const fb = ac.createGain(); fb.gain.value = 0.3;
    const dl = ac.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 2600;
    delay.connect(dl); dl.connect(fb); fb.connect(delay); dl.connect(musicBus);
    // réverbe courte (impulsion bruitée)
    verb = ac.createConvolver();
    const len = ac.sampleRate * 1.4, ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    verb.buffer = ir;
    IRS.rue = ir;
    IRS.hall = makeIR(2.6, 2.2, 0);
    IRS.tunnel = makeIR(1.9, 2.6, 0.11);
    verbOut = ac.createGain(); verbOut.gain.value = 0.22; verb.connect(verbOut); verbOut.connect(master);
    envSend = ac.createGain(); envSend.gain.value = 0.12; envSend.connect(verb);
    // musique : filtre passe-bas dynamique (pause, faible vie, intensité)
    musicLP = ac.createBiquadFilter(); musicLP.type = 'lowpass'; musicLP.frequency.value = 20000; musicLP.Q.value = 0.7;
    musicBus.connect(musicLP); musicLP.connect(master); sfxBus.connect(master);
    // chaîne maître : compresseur de bus puis limiteur « brickwall »
    limiter = ac.createDynamicsCompressor();
    limiter.threshold.value = -2; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.001; limiter.release.value = 0.08;
    master.connect(comp); comp.connect(limiter); limiter.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    applyVolumes();
  }
  function makeIR(sec, pow, echo) {
    const len = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) {
        let v = (Math.random() * 2 - 1) * Math.pow(1 - i / len, pow);
        if (echo) { const e = Math.floor(ac.sampleRate * echo); if (i % e < 220) v *= 2.2; }
        d[i] = v;
      }
    }
    return b;
  }
  function applyVolumes() {
    if (!ac) return;
    const mv = (Settings.master == null ? 100 : Settings.master) / 100;
    master.gain.setTargetAtTime(0.9 * mv, ac.currentTime, 0.05);
    musicBus.gain.setTargetAtTime((Settings.music / 100) * 0.5 * duck, ac.currentTime, 0.1);
    sfxBus.gain.setTargetAtTime((Settings.sfx / 100) * 0.95, ac.currentTime, 0.05);
    // plage dynamique : « Cinéma » (large) ou « Nuit » (compressée, voix et coups au même niveau)
    const night = Settings.dyn === 1;
    comp.threshold.setTargetAtTime(night ? -30 : -16, ac.currentTime, 0.05);
    comp.ratio.setTargetAtTime(night ? 12 : 5, ac.currentTime, 0.05);
    envSend.gain.setTargetAtTime(Settings.env === 0 ? 0 : envAmt(), ac.currentTime, 0.1);
  }
  /* ---------- Spatialisation ----------
     setView(centreCaméra, largeur) à chaque image ; at(x, z) avant un bruitage pour le placer
     dans l'espace. Mode 0 = stéréo (panoramique), 1 = casque 3D (HRTF binaural), 2 = mono. */
  function setView(cx, w) { viewX = cx; viewW = w || 300; }
  function at(x, z) { spot = x == null ? null : { x, z: z || 0 }; spotNode = null; }
  function outNode(bus) {
    if (bus || !spot || Settings.amode === 2) return bus || sfxBus;
    if (spotNode) return spotNode;
    const px = clamp((spot.x - viewX) / (viewW * 0.5), -1.4, 1.4);
    let n;
    if (Settings.amode === 1 && ac.createPanner) {
      n = ac.createPanner(); n.panningModel = 'HRTF'; n.distanceModel = 'inverse'; n.refDistance = 1; n.rolloffFactor = 0.6;
      const X = px * 2.2, Z = -1.2 - (spot.z || 0) / 40;
      if (n.positionX) { n.positionX.value = X; n.positionY.value = 0; n.positionZ.value = Z; } else n.setPosition(X, 0, Z);
    } else if (ac.createStereoPanner) {
      n = ac.createStereoPanner(); n.pan.value = clamp(px * 0.8, -0.95, 0.95);
    } else return sfxBus;
    n.connect(sfxBus); n.connect(envSend);
    spotNode = n; return n;
  }
  const ENV_AMT = { rue: 0.1, hall: 0.24, tunnel: 0.2 };
  function envAmt() { return ENV_AMT[envKind] || 0.1; }
  function setEnv(kind) {
    if (!ac || kind === envKind) return;
    envKind = kind; verb.buffer = IRS[kind] || IRS.rue; applyVolumes();
  }
  function setIntensity(v) { intenT = clamp(v, 0, 1); }
  function setLowHp(r) { lowHp = r; }
  function setPaused(v) { paused = v; }
  function updateFilter() {
    if (!ac) return;
    inten += (intenT - inten) * 0.08;
    let f = 20000;
    if (lowHp > 0 && Settings.heart !== 0) f = 900 + 9000 * (1 - lowHp);
    if (paused) f = 650;
    musicLP.frequency.setTargetAtTime(f, ac.currentTime, 0.12);
    // battement de cœur sous 25 % de vie
    if (lowHp > 0 && !paused && Settings.heart !== 0 && ac.currentTime > heartT) {
      const t = ac.currentTime + 0.02, per = 0.95 - lowHp * 0.35;
      tone({ type: 'sine', f: 62, f2: 40, d: 0.16, v: 0.34 + lowHp * 0.2, t, bus: sfxBus });
      tone({ type: 'sine', f: 55, f2: 36, d: 0.14, v: 0.24 + lowHp * 0.15, t: t + 0.2, bus: sfxBus });
      heartT = ac.currentTime + per;
    }
  }

  function tone(o) {
    if (!ac) return;
    const t = o.t || ac.currentTime;
    const osc = ac.createOscillator(); const g = ac.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + (o.slide || o.d));
    if (o.detune) osc.detune.value = o.detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.v || 0.2, t + (o.a || 0.004));
    if (o.hold) g.gain.setValueAtTime(o.v || 0.2, t + o.hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.d);
    let node = osc;
    if (o.lp) {
      const f = ac.createBiquadFilter(); f.type = o.ft || 'lowpass';
      f.frequency.setValueAtTime(o.lp, t);
      if (o.lp2) f.frequency.exponentialRampToValueAtTime(o.lp2, t + (o.ld || o.d));
      f.Q.value = o.q || 1; osc.connect(f); node = f;
    }
    node.connect(g); g.connect(outNode(o.bus));
    if (o.send) g.connect(delay);
    if (o.rv) g.connect(verb);
    osc.start(t); osc.stop(t + o.d + 0.05);
  }
  function noise(o) {
    if (!ac) return;
    const t = o.t || ac.currentTime;
    const src = ac.createBufferSource(); src.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = o.ft || 'bandpass';
    f.frequency.setValueAtTime(o.f || 1000, t);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + o.d);
    f.Q.value = o.q || 0.8;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.v || 0.3, t + (o.a || 0.002));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.d);
    src.connect(f); f.connect(g); g.connect(outNode(o.bus));
    if (o.rv) g.connect(verb);
    src.start(t, Math.random() * 0.5); src.stop(t + o.d + 0.05);
  }
  const now = () => (ac ? ac.currentTime : 0);

  /* ---------------- Bruitages ---------------- */
  let lastHit = 0;
  const sfx = {
    whoosh(h) { noise({ f: h ? 900 : 1500, f2: h ? 300 : 600, d: h ? 0.16 : 0.1, v: h ? 0.16 : 0.1, q: 1.2 }); },
    punch(power) {
      if (!ac || now() - lastHit < 0.03) return; lastHit = now();
      const p = power || 1;
      noise({ ft: 'lowpass', f: 2600 + p * 600, f2: 200, d: 0.09 + p * 0.03, v: 0.35 + p * 0.1 });
      tone({ type: 'sine', f: 180 - p * 25, f2: 50, d: 0.12 + p * 0.04, v: 0.45 });
      tone({ type: 'square', f: 90, f2: 40, d: 0.06, v: 0.1, lp: 600 });
      if (p > 1.4) noise({ f: 4000, d: 0.05, v: 0.2, q: 3 });
    },
    block() { tone({ type: 'square', f: 1800, f2: 1200, d: 0.08, v: 0.08, lp: 5000 }); noise({ f: 6000, d: 0.05, v: 0.12, q: 4 }); },
    grunt(pitch) { const p = pitch || 1; tone({ type: 'sawtooth', f: 210 * p, f2: 120 * p, d: 0.16, v: 0.08, lp: 1100, q: 5 }); },
    hurtPlayer() { tone({ type: 'sawtooth', f: 300, f2: 130, d: 0.2, v: 0.1, lp: 1400, q: 6 }); },
    thud() { noise({ ft: 'lowpass', f: 700, f2: 90, d: 0.25, v: 0.45 }); tone({ type: 'sine', f: 90, f2: 35, d: 0.25, v: 0.45 }); },
    land() { noise({ ft: 'lowpass', f: 500, d: 0.07, v: 0.12 }); },
    jump() { noise({ f: 1200, f2: 2400, d: 0.08, v: 0.05 }); },
    glass() { for (let i = 0; i < 5; i++) tone({ type: 'triangle', f: rand(2500, 5200), d: rand(0.08, 0.25), v: 0.05, t: now() + i * 0.018 }); noise({ ft: 'highpass', f: 4000, d: 0.25, v: 0.2 }); },
    crate() { noise({ ft: 'lowpass', f: 1500, f2: 200, d: 0.25, v: 0.4 }); tone({ type: 'triangle', f: 160, f2: 90, d: 0.18, v: 0.25 }); noise({ f: 900, d: 0.12, v: 0.15, t: now() + 0.05 }); },
    metal() { [0, 0.02].forEach((d, i) => tone({ type: 'square', f: 1240 + i * 380, f2: 900, d: 0.3, v: 0.05, lp: 6000, t: now() + d })); },
    food() { [0, 4, 7, 12].forEach((s, i) => tone({ type: 'triangle', f: mtof(76 + s), d: 0.14, v: 0.08, t: now() + i * 0.05 })); },
    money() { [0, 7].forEach((s, i) => tone({ type: 'sine', f: mtof(88 + s), d: 0.12, v: 0.07, t: now() + i * 0.05 })); },
    weapon() { this.metal(); tone({ type: 'sawtooth', f: 400, f2: 900, d: 0.1, v: 0.05, lp: 3000 }); },
    star() { [0, 4, 7, 11, 14].forEach((s, i) => tone({ type: 'sine', f: mtof(79 + s), d: 0.5, v: 0.06, rv: true, t: now() + i * 0.04 })); },
    special() { noise({ f: 700, f2: 3200, d: 0.25, v: 0.22, q: 1.4 }); tone({ type: 'sawtooth', f: 220, f2: 660, d: 0.2, v: 0.06, lp: 2400 }); },
    starMove() {
      noise({ ft: 'lowpass', f: 3500, f2: 60, d: 1.4, v: 0.7, rv: true });
      tone({ type: 'sine', f: 110, f2: 28, d: 1.2, v: 0.6 });
      [0, 3, 7, 12].forEach((s, i) => tone({ type: 'sawtooth', f: mtof(57 + s), d: 1, v: 0.05, lp: 2400, lp2: 400, rv: true, detune: i * 5 }));
    },
    ko() { noise({ ft: 'lowpass', f: 2000, f2: 50, d: 1.6, v: 0.6, rv: true }); tone({ type: 'sine', f: 80, f2: 25, d: 1.5, v: 0.6 }); },
    go() { [0, 0.16].forEach((d) => tone({ type: 'square', f: 1320, d: 0.1, v: 0.05, lp: 4000, t: now() + d })); },
    ui() { tone({ type: 'triangle', f: 1100, f2: 900, d: 0.05, v: 0.07 }); },
    uiOk() { tone({ type: 'square', f: 660, f2: 1320, d: 0.12, v: 0.06, lp: 3000 }); noise({ f: 5000, d: 0.05, v: 0.06 }); },
    select() { this.punch(1.2); [0, 7, 12].forEach((s, i) => tone({ type: 'sawtooth', f: mtof(64 + s), d: 0.3, v: 0.05, lp: 3000, rv: true, t: now() + i * 0.03 })); },
    bossIntro() {
      noise({ ft: 'highpass', f: 3000, d: 1.6, v: 0.25, rv: true });
      [0, 1, 7].forEach((s, i) => tone({ type: 'sawtooth', f: mtof(40 + s), d: 1.6, v: 0.09, lp: 1800, lp2: 300, detune: i * 7, rv: true }));
      tone({ type: 'sine', f: 60, f2: 30, d: 1.3, v: 0.5 });
    },
    zap() { tone({ type: 'sawtooth', f: 1800, f2: 200, d: 0.18, v: 0.06, lp: 5000 }); noise({ f: 3500, d: 0.14, v: 0.12, q: 6 }); },
    wave() { tone({ type: 'sine', f: 120, f2: 60, d: 0.4, v: 0.25 }); tone({ type: 'square', f: 240, f2: 480, d: 0.3, v: 0.04, lp: 1600 }); },
    horn() { [0, 4].forEach((s) => tone({ type: 'sawtooth', f: mtof(52 + s), d: 1.1, v: 0.07, lp: 1400, hold: 0.9, a: 0.05 })); },
    train() { noise({ ft: 'lowpass', f: 400, d: 1.4, v: 0.5, a: 0.3 }); tone({ type: 'sine', f: 55, d: 1.4, v: 0.3, a: 0.3 }); },
    thunder() { noise({ ft: 'lowpass', f: 900, f2: 60, d: 2.2, v: 0.55, rv: true, a: 0.02 }); },
    laser() { tone({ type: 'sawtooth', f: 80, f2: 600, d: 0.6, v: 0.06, lp: 1400 }); },
    beam() { tone({ type: 'sawtooth', f: 220, f2: 110, d: 0.8, v: 0.1, lp: 2400 }); noise({ f: 2500, d: 0.8, v: 0.15, q: 2 }); },
    clear() { [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone({ type: 'square', f: mtof(60 + s), d: 0.25, v: 0.05, lp: 3500, rv: true, t: now() + i * 0.07 })); },
    parry() {
      [0, 0.03].forEach((d, i) => tone({ type: 'triangle', f: 2400 + i * 900, f2: 1700, d: 0.5, v: 0.09, t: now() + d, rv: true }));
      noise({ f: 5200, d: 0.12, v: 0.25, q: 5 }); tone({ type: 'sine', f: 220, f2: 70, d: 0.25, v: 0.35 });
    },
    perfect() { noise({ f: 400, f2: 4200, d: 0.35, v: 0.18, q: 1.6 }); [0, 7, 12].forEach((s, i) => tone({ type: 'sine', f: mtof(84 + s), d: 0.45, v: 0.05, rv: true, t: now() + i * 0.04 })); },
    dash() { noise({ f: 600, f2: 2600, d: 0.14, v: 0.16, q: 1.1 }); tone({ type: 'sine', f: 140, f2: 60, d: 0.1, v: 0.12 }); },
    uiMove() { tone({ type: 'triangle', f: 1500, f2: 1300, d: 0.035, v: 0.04 }); },
    padOn() { [0, 5, 12].forEach((s, i) => tone({ type: 'square', f: mtof(72 + s), d: 0.12, v: 0.04, lp: 3000, t: now() + i * 0.06 })); },
    over() { [12, 7, 3, 0].forEach((s, i) => tone({ type: 'sawtooth', f: mtof(48 + s), d: 0.5, v: 0.07, lp: 1500, rv: true, t: now() + i * 0.22 })); },
  };

  /* ---------------- Séquenceur ---------------- */
  function buildTrack(def) {
    const r = mulberry32(def.seed * 9973);
    const sc = SCALES[def.scale];
    // mélodie : 32 pas (2 mesures), notes en degrés de gamme
    const mel = [];
    let deg = 0;
    for (let i = 0; i < 32; i++) {
      const strong = i % 4 === 0;
      const on = strong ? r() < 0.85 : i % 2 === 0 ? r() < 0.45 : r() < 0.2;
      if (!on) { mel.push(null); continue; }
      deg = clamp(deg + Math.round((r() - 0.5) * 4), -2, 9);
      const len = strong && r() < 0.5 ? 3 : 1;
      mel.push({ deg, len });
    }
    mel[0] = { deg: 0, len: 3 }; mel[16] = { deg: 4, len: 2 };
    const bassPat = {
      house: [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1],
      rumba: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0],
      break: [1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0],
      techno: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
      boss: [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1],
    }[def.style];
    return Object.assign({}, def, { sc, mel, bassPat });
  }
  function noteOf(tr, degree, octave) {
    const n = tr.sc.length;
    const o = Math.floor(degree / n);
    const d = ((degree % n) + n) % n;
    return tr.root + tr.sc[d] + 12 * (o + (octave || 0));
  }

  function scheduleStep(t) {
    const tr = track;
    const s = step % 16;
    const barAbs = Math.floor(step / 16);
    // sections : 0-3 intro, 4-11 groove, 12-19 thème, 20-23 pont, boucle sur 4
    let bar = barAbs < 24 ? barAbs : 4 + ((barAbs - 4) % 20);
    const sec = bar < 4 ? 'intro' : bar < 12 ? 'groove' : bar < 20 ? 'theme' : 'bridge';
    const chord = tr.root + tr.prog[bar % 4];
    const bus = musicBus;
    const spb = 60 / tr.tempo / 4;
    const sw = s % 2 === 1 && (tr.style === 'house' || tr.style === 'rumba') ? spb * 0.18 : 0; // swing
    const tt = t + sw;
    const st = tr.style;
    const kickOn = sec !== 'bridge' || bar % 4 === 3;
    // --- batterie ---
    if (kickOn) {
      let k = false;
      if (st === 'break') k = s === 0 || s === 10 || (s === 7 && bar % 2);
      else if (st === 'boss') k = s % 4 === 0 || s === 14;
      else k = s % 4 === 0;
      if (k) { tone({ type: 'sine', f: 160, f2: 42, d: 0.26, v: 0.62, bus, t }); noise({ ft: 'highpass', f: 3000, d: 0.012, v: 0.12, bus, t }); }
    }
    if (sec !== 'intro' || bar >= 2) {
      if (s === 4 || s === 12) { // clap / snare
        noise({ f: 1500, d: 0.18, v: 0.24, bus, t, q: 0.9 });
        noise({ f: 1500, d: 0.05, v: 0.12, bus, t: t + 0.012, q: 0.9 });
        if (st === 'break' || st === 'boss') tone({ type: 'triangle', f: 200, f2: 160, d: 0.1, v: 0.18, bus, t });
      }
      if (st === 'break' && (s === 14 || (s === 9 && bar % 2))) noise({ f: 1800, d: 0.12, v: 0.15, bus, t });
    }
    // charleston
    if (s % 2 === 1 || st === 'techno' || st === 'boss') noise({ ft: 'highpass', f: 8000, d: s % 4 === 2 ? 0.12 : 0.03, v: s % 4 === 2 ? 0.06 : 0.035, bus, t: tt });
    // percussions rumba (congas)
    if (st === 'rumba' && [3, 6, 10, 11, 14].includes(s)) tone({ type: 'sine', f: s > 9 ? 260 : 200, f2: 150, d: 0.12, v: 0.16, bus, t: tt });
    // crash début de section
    if (s === 0 && (bar === 4 || bar === 12 || bar === 20)) noise({ ft: 'highpass', f: 5000, d: 1.2, v: 0.12, bus, t, rv: true });
    // --- basse ---
    if (sec !== 'bridge' && tr.bassPat[s]) {
      const oct = s === 6 || s === 14 ? 12 : 0;
      const n = chord - 24 + oct + (st === 'boss' && s % 4 === 3 ? 1 : 0);
      if (st === 'techno' || st === 'boss') {
        tone({ type: 'sawtooth', f: mtof(n), d: 0.14, v: 0.16, lp: 1400 + (bar % 4) * 300, lp2: 180, q: 9, bus, t: tt });
      } else {
        tone({ type: 'square', f: mtof(n), d: 0.2, v: 0.1, lp: 800, lp2: 220, q: 3, bus, t: tt });
        tone({ type: 'sine', f: mtof(n), d: 0.22, v: 0.22, bus, t: tt });
      }
    }
    // --- stabs d'accords (house) ---
    if ((sec === 'groove' || sec === 'theme') && (st === 'house' || st === 'rumba' || st === 'break') && (s === 2 || s === 6 || s === 10 || (s === 13 && bar % 2))) {
      [0, tr.scale === 'major' || tr.scale === 'mixo' ? 4 : 3, 7, 10].forEach((iv, i) => tone({ type: i % 2 ? 'triangle' : 'sawtooth', f: mtof(chord + 12 + iv), d: 0.16, v: 0.028 * (0.5 + 0.5 * inten), lp: 2600, lp2: 900, bus, t: tt, detune: i * 4 }));
    }
    // --- guitare sebene (arpège roulé) ---
    if (tr.guitar && sec !== 'intro' && (sec !== 'theme' || tr.guitar > 0.6)) {
      const arp = [0, 7, 12, 16, 12, 7, 4, 7, 0, 7, 12, 19, 16, 12, 7, 4];
      const third = tr.scale === 'major' || tr.scale === 'mixo' ? 4 : 3;
      const ivs = arp.map((v) => (v === 4 || v === 16 ? v - 4 + third : v));
      tone({ type: 'triangle', f: mtof(chord + 12 + ivs[s]), d: 0.14, v: 0.05 * tr.guitar * (0.55 + 0.45 * inten), lp: 3200, ft: 'lowpass', bus, t: tt, send: s % 4 === 0 });
      tone({ type: 'square', f: mtof(chord + 24 + ivs[s]), d: 0.05, v: 0.012 * tr.guitar, lp: 4000, bus, t: tt });
    }
    // --- arpège techno ---
    if ((st === 'techno' || st === 'boss') && sec !== 'intro') {
      const a = [0, 12, 7, 12, 3, 12, 7, 15][s % 8];
      tone({ type: 'square', f: mtof(chord + 12 + a), d: 0.08, v: 0.03 * (0.4 + 0.6 * inten), lp: 1800 + Math.sin(step / 16) * 1200, q: 6, bus, t, send: true });
    }
    // --- mélodie principale ---
    if (sec === 'theme' && tr.lead) {
      const ev = tr.mel[(step % 32)];
      if (ev) {
        const f = mtof(noteOf(tr, ev.deg, 1));
        const d = spb * (ev.len + 0.6);
        tone({ type: 'sawtooth', f, d, v: 0.045 * tr.lead * (0.5 + 0.5 * inten), lp: 3200, lp2: 1400, bus, t: tt, send: true, detune: -6 });
        tone({ type: 'square', f, d, v: 0.025 * tr.lead, lp: 2400, bus, t: tt, detune: 7 });
      }
    }
    // --- nappe ---
    if (s === 0 && sec !== 'intro') {
      const third = tr.scale === 'major' || tr.scale === 'mixo' ? 4 : 3;
      [0, third, 7].forEach((iv, i) => tone({ type: 'sawtooth', f: mtof(chord + iv), d: spb * 16 * 0.98, v: sec === 'bridge' ? 0.04 : 0.02, a: 0.5, lp: 1000, detune: i * 6 - 6, bus, t }));
    }
  }
  function tick() {
    updateFilter();
    if (!ac || !playing || !track) return;
    const spb = 60 / track.tempo / 4;
    while (nextT < ac.currentTime + 0.14) { scheduleStep(nextT); nextT += spb; step++; }
  }
  // variation par commune : même identité de style, tonalité, tempo et mélodie propres
  function playMusic(id, v) {
    if (!ac || !TRACKS[id]) return;
    v = v || 0;
    if (playing && trackId === id && variant === v) return;
    trackId = id; variant = v;
    const base = TRACKS[id];
    const def = v ? Object.assign({}, base, { seed: base.seed * 7 + v * 131, root: base.root + [0, 2, -2, 3, -1, 1][v % 6], tempo: base.tempo + ((v % 5) - 2) * 2 }) : base;
    track = buildTrack(def);
    step = 0; nextT = ac.currentTime + 0.08; playing = true;
    if (!timer) timer = setInterval(tick, 25);
  }
  function stopMusic() { playing = false; trackId = ''; }
  function setDuck(v) { duck = v; applyVolumes(); }
  function suspend() { if (ac && ac.state === 'running') ac.suspend(); }
  function resume() { if (ac && ac.state === 'suspended') ac.resume(); }

  return { init, sfx, playMusic, stopMusic, applyVolumes, setDuck, suspend, resume, setView, at, setEnv, setIntensity, setLowHp, setPaused,
    get mode() { return ['Stéréo', 'Casque 3D (HRTF)', 'Mono'][Settings.amode || 0]; }, get ready() { return !!ac; }, get track() { return trackId; } };
})();
