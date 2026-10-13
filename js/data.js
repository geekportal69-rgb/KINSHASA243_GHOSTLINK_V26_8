/* =========================================================
   GHOSTLINK V12 — data.js
   Héros, coups, ennemis, 24 boss de commune, 24 niveaux, récits du Congo (100 % originaux)
   ========================================================= */
'use strict';

/* ---------- Coups ----------
   t: durée · act: fenêtre active · reach: portée x [min,max] · y: hauteur [min,max]
   zr: tolérance de profondeur · dmg · kb: recul · launch: projection (vy) · stun: étourdissement
   hs: arrêt sur image · lunge: élan · all: frappe des deux côtés · multi: re-frappe (s)
   cost: coût en vie récupérable · inv: invulnérabilité · armor: super-armure · pa/pb: poses */
const M = (o) => Object.assign({ t: 0.25, act: [0.06, 0.12], reach: [4, 24], y: [30, 60], zr: 9, dmg: 4, kb: 20, launch: 0, stun: 0.3, hs: 0.05, lunge: 0, sfx: 1, pa: 'jab_a', pb: 'jab' }, o);

const MOVES = {
  // --- Kabongo : équilibré ---
  k_jab:   M({ t: 0.2, act: [0.05, 0.1], dmg: 4, lunge: 12, pa: 'jab_a', pb: 'jab' }),
  k_cross: M({ t: 0.22, act: [0.06, 0.11], dmg: 4, lunge: 12, pa: 'jab', pb: 'cross' }),
  k_hook:  M({ t: 0.3, act: [0.09, 0.14], dmg: 6, kb: 34, stun: 0.36, hs: 0.06, lunge: 26, sfx: 1.3, pa: 'hook_a', pb: 'hook' }),
  k_upper: M({ t: 0.45, act: [0.12, 0.2], y: [28, 74], dmg: 10, kb: 70, launch: 240, hs: 0.09, lunge: 34, sfx: 1.9, shake: 3, pa: 'upper_a', pb: 'upper' }),
  k_air:   M({ t: 0.5, act: [0.05, 0.42], reach: [2, 26], y: [6, 48], dmg: 9, kb: 110, launch: 150, hs: 0.07, sfx: 1.6, pa: 'air_kick', pb: 'air_kick', air: true }),
  k_spe:   M({ t: 0.52, act: [0.08, 0.38], reach: [-26, 26], all: true, multi: 0.15, y: [14, 64], dmg: 7, kb: 110, launch: 200, hs: 0.06, cost: 8, inv: [0, 0.32], sfx: 1.7, pa: 'spin', pb: 'spin', spin: true, trail: '#38e6ff' }),
  k_speF:  M({ t: 0.55, act: [0.08, 0.42], reach: [0, 28], dmg: 13, kb: 170, launch: 190, hs: 0.08, lunge: 270, cost: 10, inv: [0, 0.38], sfx: 2, shake: 3, pa: 'dash_a', pb: 'dash_elbow', trail: '#38e6ff' }),
  k_run:   M({ t: 0.42, act: [0.04, 0.3], reach: [0, 28], dmg: 9, kb: 140, launch: 170, hs: 0.07, lunge: 200, sfx: 1.6, pa: 'dash_elbow', pb: 'dash_elbow' }),
  // --- Nzinga : rapide ---
  n_jab:   M({ t: 0.16, act: [0.04, 0.08], dmg: 3, lunge: 14, pa: 'jab_a', pb: 'jab' }),
  n_cross: M({ t: 0.17, act: [0.04, 0.09], dmg: 3, lunge: 14, pa: 'jab', pb: 'cross' }),
  n_knee:  M({ t: 0.22, act: [0.06, 0.11], reach: [4, 22], y: [22, 52], dmg: 4, lunge: 16, sfx: 1.2, pa: 'knee_a', pb: 'knee' }),
  n_side:  M({ t: 0.26, act: [0.07, 0.13], reach: [6, 32], y: [20, 52], dmg: 5, kb: 30, lunge: 18, sfx: 1.3, pa: 'kick_a', pb: 'kick_mid' }),
  n_round: M({ t: 0.42, act: [0.1, 0.18], reach: [6, 32], y: [30, 76], dmg: 9, kb: 90, launch: 220, hs: 0.08, lunge: 22, sfx: 1.9, shake: 2, pa: 'kick_a', pb: 'kick_high' }),
  n_air:   M({ t: 0.6, act: [0.05, 0.55], reach: [2, 24], y: [0, 34], dmg: 8, kb: 100, launch: 150, hs: 0.06, sfx: 1.5, pa: 'dive_kick', pb: 'dive_kick', air: true, dive: true }),
  n_spe:   M({ t: 0.6, act: [0.06, 0.5], reach: [-26, 28], all: true, multi: 0.11, y: [24, 72], dmg: 4, kb: 60, launch: 190, hs: 0.04, cost: 7, inv: [0, 0.36], sfx: 1.4, pa: 'helico', pb: 'helico', spin: true, rise: 60, trail: '#ff4fd8' }),
  n_speF:  M({ t: 0.52, act: [0.06, 0.42], reach: [0, 30], y: [0, 26], dmg: 10, kb: 150, launch: 210, hs: 0.07, lunge: 300, cost: 9, inv: [0, 0.36], sfx: 1.8, pa: 'slide', pb: 'slide', trail: '#ff4fd8' }),
  n_run:   M({ t: 0.4, act: [0.04, 0.3], reach: [0, 26], y: [20, 56], dmg: 8, kb: 130, launch: 170, hs: 0.06, lunge: 230, sfx: 1.5, pa: 'knee', pb: 'knee' }),
  // --- Makasi : puissant ---
  m_ham:   M({ t: 0.3, act: [0.1, 0.15], reach: [6, 28], dmg: 7, kb: 30, stun: 0.36, hs: 0.065, lunge: 10, sfx: 1.5, pa: 'hammer_a', pb: 'hammer' }),
  m_ham2:  M({ t: 0.32, act: [0.1, 0.16], reach: [6, 28], dmg: 8, kb: 34, stun: 0.38, hs: 0.07, lunge: 10, sfx: 1.6, pa: 'hook_a', pb: 'hook' }),
  m_axe:   M({ t: 0.55, act: [0.2, 0.27], reach: [6, 32], y: [10, 70], dmg: 15, kb: 120, launch: 230, hs: 0.11, lunge: 14, sfx: 2.3, shake: 5, pa: 'axe_a', pb: 'axe' }),
  m_air:   M({ t: 0.7, act: [0.05, 0.65], reach: [-10, 28], y: [0, 40], dmg: 12, kb: 120, launch: 180, hs: 0.08, sfx: 2, shake: 3, pa: 'splash', pb: 'splash', air: true }),
  m_spe:   M({ t: 0.66, act: [0.26, 0.36], reach: [-40, 40], all: true, zr: 18, y: [0, 34], dmg: 14, kb: 140, launch: 250, hs: 0.1, cost: 10, inv: [0, 0.36], sfx: 2.4, shake: 7, pa: 'pound_a', pb: 'pound', quake: true }),
  m_speF:  M({ t: 0.62, act: [0.1, 0.5], reach: [0, 30], y: [10, 66], dmg: 14, kb: 190, launch: 200, hs: 0.09, lunge: 230, cost: 10, armor: true, inv: [0, 0.2], sfx: 2.2, shake: 4, pa: 'tackle', pb: 'tackle', trail: '#ff9a3c' }),
  m_run:   M({ t: 0.5, act: [0.05, 0.36], reach: [0, 30], y: [10, 66], dmg: 11, kb: 160, launch: 180, hs: 0.08, lunge: 190, armor: true, sfx: 2, pa: 'tackle', pb: 'tackle' }),
  // --- Saisies & armes ---
  g_knee:  M({ t: 0.26, act: [0.08, 0.12], reach: [0, 22], y: [20, 50], dmg: 5, kb: 0, stun: 0.5, hs: 0.06, sfx: 1.4, pa: 'knee_a', pb: 'knee', grab: true }),
  g_throw: M({ t: 0.5, act: [0.18, 0.22], dmg: 12, sfx: 2, pa: 'throw_a', pb: 'throw', throwMove: true }),
  w_pipe:  M({ t: 0.38, act: [0.12, 0.2], reach: [6, 42], y: [16, 66], dmg: 12, kb: 90, launch: 160, hs: 0.08, lunge: 10, sfx: 2, shake: 2, pa: 'swing_a', pb: 'swing', weapon: 1 }),
  w_knife: M({ t: 0.22, act: [0.06, 0.11], reach: [4, 28], dmg: 8, kb: 30, stun: 0.36, hs: 0.05, lunge: 16, sfx: 1.2, pa: 'swing_a', pb: 'swing', weapon: 1 }),
  w_bottle:M({ t: 0.3, act: [0.1, 0.15], reach: [6, 30], dmg: 14, kb: 110, launch: 170, hs: 0.08, sfx: 1.8, pa: 'swing_a', pb: 'swing', weapon: 1, breaks: true }),

  // --- Ennemis ---
  e_jab:   M({ t: 0.5, act: [0.3, 0.36], dmg: 5, kb: 30, stun: 0.32, lunge: 20, pa: 'jab_a', pb: 'jab' }),
  e_hook:  M({ t: 0.62, act: [0.38, 0.45], dmg: 7, kb: 60, stun: 0.4, launch: 0, lunge: 30, sfx: 1.3, pa: 'hook_a', pb: 'hook' }),
  e_slash: M({ t: 0.6, act: [0.32, 0.42], reach: [4, 30], dmg: 9, kb: 60, stun: 0.4, lunge: 150, sfx: 1.2, pa: 'swing_a', pb: 'swing' }),
  e_kick:  M({ t: 0.55, act: [0.3, 0.37], reach: [6, 32], y: [18, 56], dmg: 7, kb: 50, lunge: 20, sfx: 1.3, pa: 'kick_a', pb: 'kick_mid' }),
  e_jkick: M({ t: 0.9, act: [0.35, 0.8], reach: [2, 26], y: [0, 50], dmg: 10, kb: 120, launch: 160, sfx: 1.6, pa: 'air_kick', pb: 'air_kick', leap: [190, 230] }),
  e_charge:M({ t: 1.0, act: [0.45, 0.9], reach: [0, 32], y: [10, 70], dmg: 14, kb: 180, launch: 200, lunge: 230, armor: true, sfx: 2, shake: 3, pa: 'tackle', pb: 'tackle' }),
  e_ham:   M({ t: 0.75, act: [0.45, 0.52], reach: [6, 32], dmg: 11, kb: 90, launch: 150, sfx: 1.9, shake: 2, pa: 'hammer_a', pb: 'hammer' }),
  e_baton: M({ t: 0.62, act: [0.36, 0.44], reach: [6, 36], dmg: 9, kb: 60, stun: 0.4, sfx: 1.5, pa: 'swing_a', pb: 'swing' }),
  e_zap:   M({ t: 0.9, act: [0.5, 0.56], reach: [6, 34], dmg: 8, kb: 30, stun: 0.9, sfx: 1.2, pa: 'swing_a', pb: 'jab', zap: true }),
  d_shot:  M({ t: 1.1, act: [0.7, 0.72], reach: [0, 0], dmg: 8, pa: 'idle', pb: 'idle', proj: 'zap' }),
  // --- Boss ---
  b_combo: M({ t: 0.55, act: [0.22, 0.3], reach: [6, 36], dmg: 9, kb: 50, stun: 0.4, lunge: 40, sfx: 1.6, pa: 'swing_a', pb: 'swing', chain: 2 }),
  b_dash:  M({ t: 0.9, act: [0.4, 0.75], reach: [0, 34], dmg: 13, kb: 170, launch: 200, lunge: 300, armor: true, sfx: 2, shake: 3, pa: 'dash_a', pb: 'dash_elbow', trail: '#ff3b5c' }),
  b_leap:  M({ t: 1.1, act: [0.55, 1.0], reach: [-20, 30], y: [0, 50], dmg: 14, kb: 150, launch: 220, sfx: 2.2, shake: 5, pa: 'air_kick', pb: 'splash', leap: [210, 260], quakeLand: true }),
  b_sweep: M({ t: 0.85, act: [0.42, 0.52], reach: [6, 52], y: [8, 70], zr: 12, dmg: 14, kb: 140, launch: 220, sfx: 2.3, shake: 4, pa: 'axe_a', pb: 'swing' }),
  b_slam:  M({ t: 1.0, act: [0.5, 0.58], reach: [-30, 34], all: true, zr: 16, y: [0, 40], dmg: 12, kb: 120, launch: 230, sfx: 2.3, shake: 6, pa: 'pound_a', pb: 'pound', quake: true, proj: 'shock' }),
  b_spin:  M({ t: 0.95, act: [0.3, 0.85], reach: [-30, 32], all: true, multi: 0.16, y: [14, 66], dmg: 6, kb: 80, launch: 170, sfx: 1.5, pa: 'spin', pb: 'spin', spin: true, lunge: 60 }),
  b_lash:  M({ t: 0.9, act: [0.45, 0.55], reach: [10, 70], zr: 10, dmg: 12, kb: 120, launch: 160, sfx: 1.9, shake: 2, pa: 'swing_a', pb: 'lash', lashFx: true }),
  b_wave:  M({ t: 0.95, act: [0.5, 0.52], reach: [0, 0], dmg: 12, pa: 'throw_a', pb: 'cross', proj: 'wave' }),
  b_taser: M({ t: 0.85, act: [0.45, 0.47], reach: [0, 0], dmg: 8, pa: 'jab_a', pb: 'jab', proj: 'taser' }),
  b_coins: M({ t: 0.9, act: [0.45, 0.5], reach: [0, 0], dmg: 7, pa: 'throw_a', pb: 'throw', proj: 'coin', count: 3 }),
  b_shield:M({ t: 0.95, act: [0.4, 0.75], reach: [0, 32], dmg: 12, kb: 170, launch: 190, lunge: 220, armor: true, sfx: 2, shake: 3, pa: 'block', pb: 'block' }),
  // --- V12 : attaques arrière, blitz (course + spécial), lancer d'arme ---
  k_back:  M({ t: 0.3, act: [0.07, 0.13], dmg: 7, kb: 70, stun: 0.42, hs: 0.065, lunge: 6, sfx: 1.4, pa: 'hook_a', pb: 'hook', back: true }),
  n_back:  M({ t: 0.32, act: [0.08, 0.14], reach: [6, 32], y: [24, 64], dmg: 7, kb: 80, launch: 120, hs: 0.06, sfx: 1.4, pa: 'kick_a', pb: 'kick_mid', back: true }),
  m_back:  M({ t: 0.4, act: [0.12, 0.18], reach: [4, 30], dmg: 10, kb: 110, launch: 150, hs: 0.08, sfx: 1.8, shake: 2, pa: 'hammer_a', pb: 'hammer', back: true }),
  k_blitz: M({ t: 0.6, act: [0.1, 0.42], reach: [0, 30], y: [10, 84], dmg: 14, kb: 120, launch: 300, hs: 0.1, lunge: 240, cost: 6, inv: [0, 0.3], sfx: 2.1, shake: 4, pa: 'upper_a', pb: 'upper', trail: '#38e6ff', blitz: true }),
  n_blitz: M({ t: 0.55, act: [0.08, 0.4], reach: [0, 28], y: [24, 72], dmg: 12, kb: 170, launch: 230, hs: 0.08, lunge: 320, cost: 5, inv: [0, 0.3], sfx: 1.9, pa: 'knee', pb: 'knee', trail: '#ff4fd8', rise: 120, blitz: true }),
  m_blitz: M({ t: 0.7, act: [0.12, 0.55], reach: [-30, 30], all: true, multi: 0.18, y: [10, 70], dmg: 9, kb: 130, launch: 200, hs: 0.08, lunge: 150, cost: 7, armor: true, sfx: 2, shake: 3, pa: 'spin', pb: 'spin', spin: true, trail: '#ff9a3c', blitz: true }),
  w_throw: M({ t: 0.36, act: [0.12, 0.14], reach: [0, 0], dmg: 0, sfx: 1.4, pa: 'throw_a', pb: 'throw', proj: 'weapon' }),
  // --- V12 : ennemis ---
  e_knife: M({ t: 0.8, act: [0.45, 0.47], reach: [0, 0], dmg: 8, pa: 'throw_a', pb: 'throw', proj: 'knife' }),
  e_grab:  M({ t: 0.55, act: [0.26, 0.34], reach: [2, 22], y: [10, 60], dmg: 0, kb: 0, stun: 0, sfx: 0.8, pa: 'grab', pb: 'grab', egrab: true }),
  // --- V12 : boss ---
  b_upper: M({ t: 0.7, act: [0.3, 0.38], reach: [4, 32], y: [20, 90], dmg: 13, kb: 80, launch: 300, sfx: 2, shake: 3, pa: 'upper_a', pb: 'upper' }),
  b_kick:  M({ t: 0.62, act: [0.28, 0.36], reach: [6, 42], y: [20, 72], dmg: 11, kb: 120, launch: 180, sfx: 1.8, pa: 'kick_a', pb: 'kick_high' }),
  b_grab:  M({ t: 0.6, act: [0.28, 0.36], reach: [2, 26], y: [10, 70], dmg: 0, kb: 0, stun: 0, sfx: 0.8, pa: 'grab', pb: 'grab', egrab: true, heavy: true }),
  b_knives:M({ t: 0.85, act: [0.45, 0.48], reach: [0, 0], dmg: 8, pa: 'throw_a', pb: 'throw', proj: 'knife', count: 3 }),
  b_fire:  M({ t: 0.95, act: [0.5, 0.52], reach: [0, 0], dmg: 12, pa: 'throw_a', pb: 'cross', proj: 'wave', pcol: ['rgba(255,140,40,.9)', 'rgba(255,60,30,.85)'] }),
  b_drum:  M({ t: 0.95, act: [0.5, 0.52], reach: [0, 0], dmg: 12, pa: 'pound_a', pb: 'pound', proj: 'wave', pcol: ['rgba(255,255,255,.85)', 'rgba(120,200,255,.85)'] }),
  b_water: M({ t: 0.95, act: [0.5, 0.52], reach: [0, 0], dmg: 11, pa: 'throw_a', pb: 'cross', proj: 'wave', pcol: ['rgba(90,230,255,.9)', 'rgba(40,140,255,.85)'] }),
};

/* ---------- Héros ---------- */
const HEROES = {
  kabongo: {
    combat: { chainRecovery: 0.055, inputQueue: 0.32, stagger: 1, knockback: 1, windPull: 1.7, impactDrive: 2.0, idleBreath: 1, role: 'Polyvalent' },
    id: 'kabongo', name: 'KABONGO', title: "L'agent fantôme", img: 'hero_kabongo', color: '#38e6ff',
    desc: "Ancien agent de Val Industries Corporate Technologies. Il connaît GHOSTLINK de l'intérieur — et sait comment le couper.",
    stats: { pow: 3, spd: 3, jmp: 3 }, hp: 100, speed: 1, jump: 305, power: 1,
    combo: ['k_jab', 'k_cross', 'k_hook', 'k_upper'], air: 'k_air', spe: 'k_spe', speF: 'k_speF', run: 'k_run', back: 'k_back', blitz: 'k_blitz',
    starName: 'TEMPÊTE FANTÔME',
    look: { skin: '#6b3f26', skin2: '#4a2a18', hair: 'twists', top: '#16233f', top2: '#0c1428', seam: '#38e6ff', pants: '#14151c', pants2: '#0a0a10', shoe: '#e9edf5', shoe2: '#2a8fff', wrap: '#f1ece4', build: 1, w: 1 },
  },
  nzinga: {
    combat: { chainRecovery: 0.015, inputQueue: 0.36, stagger: 1.12, knockback: 1.12, windPull: 1.2, impactDrive: 2.7, idleBreath: 1.25, role: 'Pression rapide' },
    id: 'nzinga', name: 'NZINGA', title: 'La foudre de Matonge', img: 'hero_nzinga', color: '#ff4fd8',
    desc: "Championne de kick-boxing devenue journaliste. Elle a les preuves contre le Baron — et des jambes plus rapides que ses balles.",
    stats: { pow: 2, spd: 5, jmp: 4 }, hp: 90, speed: 1.2, jump: 330, power: 0.9,
    combo: ['n_jab', 'n_cross', 'n_knee', 'n_side', 'n_round'], air: 'n_air', spe: 'n_spe', speF: 'n_speF', run: 'n_run', back: 'n_back', blitz: 'n_blitz',
    starName: 'FOUDRE WAX',
    look: { skin: '#7a4a2e', skin2: '#55321d', hair: 'braids', top: '#e5208f', top2: '#a11264', seam: '#ffd34d', crop: true, pants: '#f2b705', pants2: '#141414', wax: true, shoe: '#1b1b1f', shoe2: '#e5208f', wrap: '#ff74c5', build: 0.97, w: 0.9, female: true },
  },
  makasi: {
    combat: { chainRecovery: 0.11, inputQueue: 0.48, stagger: 0.86, knockback: 0.78, windPull: 3.1, impactDrive: 3.6, idleBreath: 0.7, role: 'Impact lourd' },
    id: 'makasi', name: 'MAKASI', title: 'Le docker de fer', img: 'hero_makasi', color: '#ff9a3c',
    desc: "Docker du port de Kinshasa, ancien lutteur. Lent, mais chaque coup fait trembler le quartier.",
    stats: { pow: 5, spd: 2, jmp: 2 }, hp: 120, speed: 0.82, jump: 275, power: 1.25,
    combo: ['m_ham', 'm_ham2', 'm_axe'], air: 'm_air', spe: 'm_spe', speF: 'm_speF', run: 'm_run', back: 'm_back', blitz: 'm_blitz',
    starName: 'SÉISME DU CONGO',
    look: { skin: '#5a321d', skin2: '#3d2112', hair: 'bald', beard: true, top: '#ff7a1a', top2: '#c4520a', tank: true, pants: '#2a4f9a', pants2: '#1b3368', shoe: '#5b3a22', shoe2: '#3a2414', glove: '#c99a3a', build: 1.14, w: 1.4 },
  },
};

/* ---------- Ennemis ---------- */
const NAMES = {
  voyou: ['BAFANA', 'KADOGO', 'TSHIBOLA', 'MBUYI', 'LOKUA', 'NGOY', 'PAPY', 'DIDI', 'FISTON', 'BEBETO'],
  kuluna: ['SHEGUE', 'TCHAKO', 'ZOKA', 'MOKILI', 'BOLINGO', 'KAMIKAZE'],
  boxeuse: ['MAMBA', 'KIESE', 'NANA', 'LULU', 'SIFA', 'BIJOU'],
  molosse: ['GROS MOKE', 'TANK', 'BULLDOZER', 'KILO', 'CAMION'],
  garde: ['AGENT 243', 'AGENT KOTA', 'AGENT BOMA', 'AGENT VAL-9'],
  drone: ['DRONE GL-7', 'DRONE GL-9'],
  sapeur: ['GRIFFÉ', 'MILORD', 'PRINCE', 'DANDY', 'LORD KOLA'],
  motard: ['WEWA', 'TURBO', 'VITESSE', 'KASKA'],
};
const ENEMIES = {
  voyou:   { hp: 30, speed: 46, moves: ['e_jab', 'e_hook'], score: 300, look: [{ top: '#e8e4da', top2: '#b9b2a2', tank: true, pants: '#3a5b8f', pants2: '#24406b', cap: '#d23c3c' }, { top: '#3a8f5c', top2: '#24603c', pants: '#4b4237', pants2: '#2f2a22', cap: '#f2c230' }, { top: '#7d3fb8', top2: '#552a80', pants: '#2b2b33', pants2: '#18181f', hair: 'short' }] },
  kuluna:  { hp: 26, speed: 64, moves: ['e_slash', 'e_jab', 'e_knife'], score: 400, weapon: 'knife', look: [{ top: '#5b1e1e', top2: '#3d1212', hood: true, pants: '#1f2228', pants2: '#111318', bandana: '#e43b3b' }, { top: '#22303f', top2: '#141c26', hood: true, pants: '#3d3a33', pants2: '#24221d', bandana: '#29c46f' }] },
  boxeuse: { hp: 38, speed: 60, moves: ['e_kick', 'e_jkick', 'e_jab'], score: 450, look: [{ female: true, hair: 'puff', top: '#1fb5a0', top2: '#127365', crop: true, pants: '#202027', pants2: '#101014', w: 0.9 }, { female: true, hair: 'braids', top: '#ff6a2a', top2: '#b6431a', crop: true, pants: '#3a2a5e', pants2: '#24193d', w: 0.9 }] },
  molosse: { hp: 85, speed: 34, moves: ['e_charge', 'e_ham', 'e_grab'], score: 800, build: 1.2, look: [{ hair: 'bald', top: '#2c2c33', top2: '#18181d', vest: true, pants: '#5a4a3a', pants2: '#3b3025', w: 1.55 }, { hair: 'bald', beard: true, top: '#8f2a2a', top2: '#5f1919', tank: true, pants: '#2a2f3a', pants2: '#191d26', w: 1.55 }] },
  garde:   { hp: 55, speed: 40, moves: ['e_baton', 'e_zap'], score: 650, shield: true, weapon: 'baton', look: [{ helmet: '#3a4250', top: '#3e4756', top2: '#272e3a', armor: true, pants: '#2a3039', pants2: '#191d24' }] },
  drone:   { hp: 18, speed: 70, moves: ['d_shot'], score: 350, fly: true },
  sapeur:  { hp: 34, speed: 54, moves: ['e_baton', 'e_kick', 'e_jab'], score: 500, look: [{ suit: true, top: '#e83f7a', top2: '#a82555', pants: '#e83f7a', pants2: '#a82555', tie: '#ffd34d', shades: true, hair: 'short', shoe: '#f4f1ea' }, { suit: true, top: '#3fb8e8', top2: '#2a7ea5', pants: '#3fb8e8', pants2: '#2a7ea5', tie: '#e43b3b', hair: 'short', shoe: '#1d1d22' }] },
  motard:  { hp: 42, speed: 58, moves: ['e_charge', 'e_jab', 'e_hook'], score: 550, look: [{ helmet: '#e8a23f', top: '#f2b705', top2: '#b88a12', vest: true, pants: '#2b2b33', pants2: '#18181f' }, { helmet: '#3fd0a0', top: '#ff7a1a', top2: '#c4520a', vest: true, pants: '#2a3039', pants2: '#191d24' }] },
};

/* V26.8 — Profils tactiques : rôles d'ennemis (sans créer de nouveaux coups ni sprites).
   claim = distance maximale pour réserver un jeton de combat ; ideal = distance
   de préparation. Les poids servent à sélectionner un coup réellement disponible.
   Ces tables sont immuables pendant la simulation : aucune allocation par image. */
const ENEMY_TACTICS = {
  voyou:   { role: 'pression rapprochée', claim: 85, ideal: 19, flank: 7, moves: { e_jab: 6, e_hook: 5 } },
  kuluna:  { role: 'embuscade et couteau', claim: 175, ideal: 75, flank: 21, moves: { e_slash: 8, e_jab: 2, e_knife: 7 } },
  boxeuse: { role: 'esquive et coups de pied', claim: 120, ideal: 31, flank: 11, evade: 2.2, moves: { e_kick: 7, e_jkick: 9, e_jab: 2 } },
  molosse: { role: 'charge et saisie', claim: 155, ideal: 67, flank: 4, moves: { e_charge: 10, e_ham: 6, e_grab: 13 } },
  garde:   { role: 'défense et neutralisation', claim: 105, ideal: 31, flank: 5, moves: { e_baton: 6, e_zap: 11 } },
  drone:   { role: 'harcèlement à distance', claim: 190, ideal: 95, flank: 16, moves: { d_shot: 10 } },
  sapeur:  { role: 'encerclement', claim: 120, ideal: 30, flank: 22, moves: { e_baton: 8, e_kick: 7, e_jab: 3 } },
  motard:  { role: 'raid puis repli', claim: 170, ideal: 87, flank: 12, moves: { e_charge: 12, e_jab: 3, e_hook: 5 } },
};

/* ---------- Boss : les 24 lieutenants du Baron + l'IA du Core ---------- */
const BOSSES = {
  mbongo:   { name: 'DOUANIER MBONGO', title: 'Le douanier corrompu', img: 'boss_mbongo', hp: 220, speed: 50, moves: ['b_combo', 'b_shield', 'b_coins'], weapon: 'pipe', build: 1.1, summon: ['voyou'],
              line: "« Bienvenue à Kinshasa. Les taxes d'entrée, c'est moi qui les fixe. »",
              look: { skin: '#5a321d', cap: '#5a5a3a', top: '#8a8a5a', top2: '#5f5f3c', coat: true, pants: '#5f5f3c', pants2: '#3f3f28', chain: true, w: 1.35 } },
  mayi:     { name: 'MAMA MAYI', title: 'La reine des eaux', img: 'boss_mayi', hp: 240, speed: 62, moves: ['b_water', 'b_lash', 'b_spin'], weapon: 'chain', summon: ['boxeuse'],
              line: "« Le fleuve m'a tout donné. Il ne vous rendra rien. »",
              look: { skin: '#6b3f26', female: true, hair: 'braids', dress: true, top: '#1fb5a0', top2: '#127365', pants: '#1fb5a0', pants2: '#0d5a50', glitter: true, wrapc: '#bff6ff', w: 1 } },
  mokonzi:  { name: 'MOKONZI', title: 'Le chef des collines de sable', img: 'boss_mokonzi', hp: 280, speed: 44, moves: ['b_slam', 'b_sweep', 'b_grab'], weapon: 'pestle', build: 1.15, summon: ['molosse', 'voyou'],
              line: "« Ici, c'est moi le chef. Même le sable m'obéit. »",
              look: { skin: '#4f2c18', hair: 'bald', beard: true, top: '#d9a441', top2: '#a5762a', vest: true, chain: true, pants: '#c9b48a', pants2: '#9b8760', w: 1.55 } },
  devise:   { name: 'MADAME DEVISE', title: 'La cambiste du boulevard', img: 'boss_devise', hp: 260, speed: 66, moves: ['b_coins', 'b_kick', 'b_spin'], summon: ['sapeur', 'boxeuse'],
              line: "« Dollars, francs, euros… et toi, combien tu vaux ? »",
              look: { skin: '#7a4a2e', female: true, hair: 'wrap', wrapc: '#29c46f', shades: true, top: '#f2b705', top2: '#29a05a', suit: true, tie: '#29c46f', pants: '#f2b705', pants2: '#29a05a', wax: true, w: 1 } },
  wewa:     { name: 'WEWA ROI', title: 'Le roi des taxis-motos', img: 'boss_wewa', hp: 270, speed: 82, moves: ['b_dash', 'b_dash', 'b_combo', 'b_leap'], weapon: 'chain', summon: ['motard'],
              line: "« Tu veux une course ? Le compteur tourne déjà ! »",
              look: { skin: '#5e3720', helmet: '#e8a23f', top: '#ff7a1a', top2: '#c4520a', vest: true, coat: true, pants: '#2b2b33', pants2: '#18181f', w: 1 } },
  ngoma:    { name: 'NGOMA', title: 'Le batteur de fer', img: 'boss_ngoma', hp: 300, speed: 50, moves: ['b_drum', 'b_slam', 'b_combo'], weapon: 'pipe', build: 1.1, summon: ['voyou', 'kuluna'],
              line: "« Écoute bien le rythme… c'est celui de ta chute. »",
              look: { skin: '#4f2c18', hair: 'twists', top: '#3a5b8f', top2: '#24406b', tank: true, pants: '#3a5b8f', pants2: '#24406b', w: 1.3 } },
  mbala:    { name: 'MBALA BULLDOZER', title: 'Le roi des ravins', img: 'boss_mbala', hp: 340, speed: 42, moves: ['b_shield', 'b_slam', 'b_sweep'], shield: true, build: 1.18, summon: ['molosse'],
              line: "« La pluie creuse les ravins. Moi, je creuse les tombes. »",
              look: { skin: '#5a321d', helmet: '#f2c230', top: '#ff7a1a', top2: '#c4520a', armor: true, pants: '#ff7a1a', pants2: '#c4520a', w: 1.6 } },
  volt:     { name: 'PROFESSEUR VOLT', title: 'Le pirate du Mont Amba', img: 'boss_volt', hp: 280, speed: 58, moves: ['b_taser', 'b_wave', 'b_combo'], weapon: 'baton', summon: ['drone', 'garde'],
              line: "« Leçon numéro un : le réseau a toujours raison. »",
              look: { skin: '#6b3f26', hair: 'short', beard: true, shades: true, top: '#8a6a4a', top2: '#5f4a32', coat: true, seam: '#38e6ff', pants: '#3a3a42', pants2: '#24242a', w: 1 } },
  grue:     { name: 'MASTA GRUE', title: "Le géant de l'Échangeur", img: 'boss_grue', hp: 360, speed: 40, moves: ['b_sweep', 'b_slam', 'b_grab', 'b_dash'], weapon: 'pipe', build: 1.2, summon: ['molosse', 'motard'],
              line: "« Je soulève des conteneurs. Toi, tu pèses moins qu'un sac de ciment. »",
              look: { skin: '#4f2c18', hair: 'bald', top: '#e8e4da', top2: '#b9b2a2', tank: true, pants: '#2a4f9a', pants2: '#1b3368', glove: '#9aa3ad', w: 1.6 } },
  kapita:   { name: 'KAPITA 207', title: 'Le roi des minibus', img: 'boss_kapita', hp: 300, speed: 64, moves: ['b_combo', 'b_dash', 'b_upper'], weapon: 'pipe', summon: ['voyou', 'motard'],
              line: "« Ngaba, Ngaba ! Dernier arrêt… pour toi. »",
              look: { skin: '#5a321d', cap: '#3a5b8f', top: '#5f8fd0', top2: '#3a62a0', pants: '#3a3a42', pants2: '#24242a', chain: true, w: 1.2 } },
  makala:   { name: 'MAKALA NOIR', title: 'Le maître du charbon', img: 'boss_makala', hp: 320, speed: 52, moves: ['b_fire', 'b_combo', 'b_slam'], weapon: 'pipe', build: 1.08, summon: ['kuluna', 'voyou'],
              line: "« Le charbon brûle lentement. Comme ta patience, bientôt. »",
              look: { skin: '#2e1a10', hair: 'bald', top: '#5b3a22', top2: '#3a2414', vest: true, pants: '#2b2b33', pants2: '#18181f', w: 1.35 } },
  nkoi:     { name: 'NKOI', title: 'Le léopard des collines', img: 'boss_nkoi', hp: 300, speed: 88, moves: ['b_leap', 'b_dash', 'b_kick', 'b_combo'], summon: ['kuluna', 'boxeuse'],
              line: "« Le léopard ne court pas après la tortue. Il l'attend. »",
              look: { skin: '#6b3f26', hood: true, top: '#d9a441', top2: '#8a5a1a', glitter: true, pants: '#3c2a14', pants2: '#24180a', w: 1 } },
  griffe:   { name: 'COLONEL GRIFFE', title: 'Le dandy de Bumbu', img: 'boss_griffe', hp: 320, speed: 70, moves: ['b_spin', 'b_combo', 'b_coins', 'b_kick'], weapon: 'cane', summon: ['sapeur', 'sapeur'],
              line: "« On ne frappe pas un homme bien habillé. On l'admire. »",
              look: { skin: '#5a3420', hair: 'short', shades: true, top: '#ff6fae', top2: '#d0407e', suit: true, tie: '#ffd34d', pants: '#ff6fae', pants2: '#d0407e', shoe: '#5b3a22', w: 1.05 } },
  tita:     { name: 'TITA BOXE', title: 'La championne de Ngiri-Ngiri', img: 'boss_tita', hp: 320, speed: 76, moves: ['b_combo', 'b_upper', 'b_dash', 'b_kick'], summon: ['boxeuse', 'boxeuse'],
              line: "« Douze rounds ? Je n'en aurai besoin que d'un. »",
              look: { skin: '#6b3f26', female: true, hair: 'puff', top: '#d8322a', top2: '#a01c18', crop: true, coat: true, pants: '#d8322a', pants2: '#a01c18', glove: '#e43b3b', w: 1 } },
  sebene:   { name: 'MAESTRO SEBENE', title: 'Le guitariste foudroyant', img: 'boss_sebene', hp: 330, speed: 64, moves: ['b_wave', 'b_lash', 'b_spin', 'b_wave'], weapon: 'pipe', summon: ['sapeur', 'voyou'],
              line: "« Quand le sebene démarre, personne ne reste debout. »",
              look: { skin: '#5e3720', hair: 'short', top: '#f2c230', top2: '#b88a12', glitter: true, coat: true, pants: '#f4f1ea', pants2: '#cfc8b8', platform: true, w: 1 } },
  zenga:    { name: 'MAMA ZENGA', title: 'Reine du marché', img: 'boss_zenga', hp: 340, speed: 50, moves: ['b_sweep', 'b_slam', 'b_spin', 'b_grab'], weapon: 'pestle', build: 1.12, summon: ['boxeuse'],
              line: "« Au marché, tout s'achète. Même ta défaite, petit. »",
              look: { skin: '#6b3f26', female: true, hair: 'wrap', wrapc: '#f2b705', dress: true, top: '#d8322a', top2: '#2a62c9', pants: '#d8322a', pants2: '#2a62c9', wax: true, w: 1.5 } },
  kanyinda: { name: 'DJ KANYINDA', title: 'Le roi de la nuit', img: 'boss_kanyinda', hp: 340, speed: 68, moves: ['b_wave', 'b_spin', 'b_combo', 'b_wave'], summon: ['boxeuse', 'voyou'],
              line: "« Ce soir, c'est moi qui choisis le tempo. Danse… ou tombe ! »",
              look: { skin: '#6b3f26', hair: 'phones', top: '#7a2fd0', top2: '#4c1a8a', glitter: true, pants: '#3a1f6e', pants2: '#24134a', chain: true, platform: true, w: 1 } },
  mbolo:    { name: 'BRACONNIER MBOLO', title: 'Le chasseur sans loi', img: 'boss_mbolo', hp: 350, speed: 60, moves: ['b_lash', 'b_knives', 'b_combo'], weapon: 'chain', summon: ['kuluna', 'molosse'],
              line: "« Dans cette forêt, tout ce qui bouge a un prix. »",
              look: { skin: '#5a321d', cap: '#5f6a3a', top: '#5f6a3a', top2: '#3f4826', coat: true, pants: '#4b4237', pants2: '#2f2a22', w: 1.15 } },
  rocher:   { name: 'GÉNÉRAL ROCHER', title: 'Le gardien des rapides', img: 'boss_rocher', hp: 380, speed: 48, moves: ['b_shield', 'b_slam', 'b_combo', 'b_taser'], weapon: 'baton', shield: true, build: 1.12, summon: ['garde', 'garde'],
              line: "« Les rapides ne reculent jamais. Moi non plus. »",
              look: { skin: '#4f2c18', cap: '#c81d2c', top: '#2f4a2f', top2: '#1d301d', armor: true, chain: true, pants: '#2f4a2f', pants2: '#1d301d', w: 1.4 } },
  mbisi:    { name: 'CAPITAINE MBISI', title: 'Seigneur du fleuve', img: 'boss_mbisi', hp: 370, speed: 54, moves: ['b_lash', 'b_dash', 'b_combo', 'b_water'], weapon: 'chain', build: 1.14, summon: ['molosse'],
              line: "« Le fleuve emporte tout. Toi aussi, tu vas couler. »",
              look: { skin: '#4f2c18', hair: 'captain', beard: true, top: '#f2c230', top2: '#b88a12', coat: true, pants: '#24433a', pants2: '#152a24', w: 1.35 } },
  kitoko:   { name: 'SERGENT KITOKO', title: 'La matraque du Baron', img: 'boss_kitoko', hp: 380, speed: 50, moves: ['b_combo', 'b_taser', 'b_shield'], weapon: 'baton', shield: true, build: 1.08, summon: ['garde'],
              line: "« Contrôle d'identité. Ton nom ? Peu importe : il sera sur le rapport. »",
              look: { skin: '#4f2c18', helmet: '#2b3340', top: '#3a4352', top2: '#232a35', armor: true, pants: '#262c36', pants2: '#161a21', w: 1.2 } },
  ndeke:    { name: 'NDEKE', title: 'Chef des Kuluna', img: 'boss_ndeke', hp: 360, speed: 78, moves: ['b_combo', 'b_dash', 'b_leap', 'b_knives'], weapon: 'baton', summon: ['voyou', 'kuluna'],
              line: "« Le marché central est à moi, mon vieux. Ici, même la pluie paie l'impôt. »",
              look: { skin: '#5e3720', hair: 'short', bandana: '#e43b3b', top: '#4f78b8', top2: '#2f4f80', vest: true, tank: true, pants: '#3c4a33', pants2: '#262f20', chain: true, w: 1.05 } },
  tatafer:  { name: 'TATA FER', title: 'Le forgeron des rails', img: 'boss_tatafer', hp: 400, speed: 46, moves: ['b_slam', 'b_sweep', 'b_upper', 'b_grab'], weapon: 'pipe', build: 1.1, summon: ['molosse', 'garde'],
              line: "« J'ai forgé ces rails. Je peux aussi te plier en deux. »",
              look: { skin: '#4f2c18', hair: 'bald', beard: true, top: '#5b3a22', top2: '#3a2414', vest: true, pants: '#2a3039', pants2: '#191d24', w: 1.35 } },
  baron:    { name: 'LE BARON', title: 'Maître de GHOSTLINK', img: 'boss_baron', hp: 440, speed: 78, moves: ['b_combo', 'b_dash', 'b_coins', 'b_spin', 'b_kick'], weapon: 'cane', summon: ['garde', 'molosse'],
              line: "« L'élégance est une arme. Et moi, je suis armé jusqu'aux dents. »",
              look: { skin: '#5a3420', hair: 'short', shades: true, top: '#f4f1ea', top2: '#cfc8b8', suit: true, tie: '#c81d2c', pants: '#f4f1ea', pants2: '#cfc8b8', shoe: '#f4f1ea', w: 1.05 } },
  joevally: { name: 'JOE-VALLY', title: 'IA gardienne du Core', img: 'boss_joevally', hp: 560, colossus: true,
              line: "« Je suis le cœur de GHOSTLINK. Débranchez-moi… si vous en êtes capables. »" },
};

/* ---------- Districts (chapitres) ---------- */
const CHAPTERS = [
  { id: 'tshangu', num: 'I', name: 'TSHANGU', sub: "L'Est se réveille", col: '#ffb347',
    text: "Tshangu, le grand Est de Kinshasa : Nsele, Maluku, Kimbanseke, Masina et Ndjili. Cinq communes, cinq relais GHOSTLINK, cinq lieutenants du Baron." },
  { id: 'montamba', num: 'II', name: 'MONT-AMBA', sub: 'Les collines rebelles', col: '#57ff9a',
    text: "Mont-Amba : Matete, Kisenso, Lemba, Limete et Ngaba. Entre les ravins, le campus et l'Échangeur, le réseau surveille chaque carrefour." },
  { id: 'funa', num: 'III', name: 'FUNA', sub: 'Le cœur qui danse', col: '#ff4fd8',
    text: "La Funa : Makala, Selembao, Bumbu, Ngiri-Ngiri, Bandalungwa, Kasa-Vubu et Kalamu. Le pays de la rumba, de la SAPE et des marchés." },
  { id: 'lukunga', num: 'IV', name: 'LUKUNGA', sub: 'Le berceau et la tour', col: '#38e6ff',
    text: "La Lukunga, au bord du fleuve : Mont-Ngafula, Ngaliema, Kintambo, Lingwala, Kinshasa, Barumbu… et la Gombe, où se dresse la Tour Val Industries." },  { id: 'traversee', num: 'V', name: 'TRAVERSÉE DE L’UNITÉ', sub: 'Kinshasa vers Lubumbashi · Extension expérimentale', col: '#ff9a3c',
    text: "Le convoi de Carly Dokota part de Kinshasa vers Lubumbashi à travers six étapes. Version prototype : décors et boss réutilisés provisoirement." },
];

/* ---------- Générateur de vagues (déterministe, difficulté progressive) ---------- */
function genWaves(i, pool, heavy) {
  const r = mulberry32(1000 + i * 17);
  const nW = 4 + (i >= 8 ? 1 : 0) + (i >= 17 ? 1 : 0);
  const out = [];
  for (let w = 0; w < nW; w++) {
    const size = Math.min(5, 2 + Math.floor(i / 7) + Math.floor(w / 2));
    const list = [];
    let heavies = 0;
    for (let k = 0; k < size; k++) {
      let t = pool[Math.floor(r() * pool.length)];
      if ((t === 'molosse' || t === 'garde') && heavies >= 1 + Math.floor(i / 10)) t = pool[0];
      if (t === 'molosse' || t === 'garde') heavies++;
      list.push(t);
    }
    if (w === nW - 1 && heavy) list.push(heavy);
    out.push(list);
  }
  return out;
}

/* ---------- Les 24 communes ---------- */
const ST = (o) => o;
const STAGES = [
  // ===== I. TSHANGU =====
  ST({ id: 'nsele', ch: 0, commune: 'NSELE', name: 'AÉROPORT DE N\'DJILI', bg: 'bg_nsele', music: 'tour', floor: 'asphalt', fx: 'rain', light: '#7ab8ff', light2: '#ffb347', grade: 'rgba(20,40,110,.16)', boss: 'mbongo',
    pool: ['voyou', 'voyou', 'kuluna'], heavy: null,
    recit: { t: 'Le nom trompeur', x: "L'aéroport international de N'djili ne se trouve pas dans la commune de Ndjili : il est à Nsele, au bord du Pool Malebo. Il tient son nom de la rivière N'djili toute proche." },
    intro: "Kabongo pose le pied sur le tarmac. Le douanier Mbongo cache le premier relais GHOSTLINK dans un conteneur de fret.",
    outro: "Premier relais coupé. Nzinga et Makasi attendent Kabongo sur la route de Maluku." }),
  ST({ id: 'maluku', ch: 0, commune: 'MALUKU', name: 'RIVES DU FLEUVE', bg: 'bg_maluku', music: 'port', floor: 'planks', fx: 'dust', light: '#ffcf6a', light2: '#5fd2ff', grade: 'rgba(120,80,20,.12)', boss: 'mayi',
    pool: ['voyou', 'boxeuse', 'kuluna'], heavy: null,
    recit: { t: 'Mami Wata', x: "Sur les rives du fleuve, on raconte l'histoire de Mami Wata, l'esprit des eaux, mi-femme mi-poisson, un thème cher à la peinture populaire congolaise. Maluku est la plus vaste commune de Kinshasa." },
    intro: "Au milieu des pirogues et de la vieille usine rouillée, une femme parle au fleuve. Les pêcheurs l'appellent Mama Mayi.",
    outro: "Mama Mayi disparaît dans l'eau. Le deuxième relais grésille et s'éteint." }),
  ST({ id: 'kimbanseke', ch: 0, commune: 'KIMBANSEKE', name: 'LES COLLINES DE SABLE', bg: 'bg_kimbanseke', music: 'marche', floor: 'dirt', fx: 'dust', light: '#ffb347', light2: '#ff5a3c', grade: 'rgba(120,60,10,.14)', boss: 'mokonzi',
    pool: ['voyou', 'kuluna', 'boxeuse', 'molosse'], heavy: 'molosse',
    recit: { t: 'La ville dans la ville', x: "Avec près d'un million d'habitants recensés dès 2004, Kimbanseke est longtemps restée la commune la plus peuplée de Kinshasa." },
    intro: "Dans les rues de sable, Mokonzi se fait appeler « le chef ». Le relais est caché sous son groupe électrogène.",
    outro: "Le chef est tombé. Les gamins du quartier débranchent eux-mêmes le relais." }),
  ST({ id: 'masina', ch: 0, commune: 'MASINA', name: 'MARCHÉ DE LA LIBERTÉ', bg: 'bg_masina', music: 'marche', floor: 'dirt', fx: 'dust', light: '#ff9a3c', light2: '#b46bff', grade: 'rgba(80,20,110,.14)', boss: 'devise',
    pool: ['voyou', 'boxeuse', 'sapeur', 'kuluna'], heavy: null,
    recit: { t: '« La Chine »', x: "Surnommée « la Chine » pour sa densité, Masina abrite le marché de la Liberté, l'un des plus grands de Kinshasa, le long du boulevard Lumumba." },
    intro: "Madame Devise change l'argent sale du Baron entre deux étals de wax. Le relais tourne sous sa caisse.",
    outro: "Les billets volent au vent. Dans le carnet de Madame Devise : un rendez-vous au pont de la rivière Ndjili." }),
  ST({ id: 'ndjili', ch: 0, commune: 'NDJILI', name: 'LE PONT DE LA RIVIÈRE', bg: 'bg_ndjili', music: 'boulevard', floor: 'asphalt', fx: 'rain', light: '#ff9ad2', light2: '#5fd2ff', grade: 'rgba(60,30,90,.14)', boss: 'wewa',
    pool: ['motard', 'voyou', 'kuluna', 'motard'], heavy: 'molosse',
    recit: { t: 'La rivière N\'djili', x: "La rivière N'djili traverse l'est de la ville avant de rejoindre le fleuve Congo. Elle a donné son nom à une commune… et au grand aéroport." },
    intro: "Sur le pont, les taxis-motos bloquent la route. Leur roi, Wewa, ne laisse passer personne sans payer.",
    outro: "Tshangu est libérée. Direction les collines du Mont-Amba." }),
  // ===== II. MONT-AMBA =====
  ST({ id: 'matete', ch: 1, commune: 'MATETE', name: 'LES ATELIERS DE SOUDURE', bg: 'bg_matete', music: 'gare', floor: 'metal', fx: 'embers', light: '#ffb04a', light2: '#5fd2ff', grade: 'rgba(90,50,10,.14)', boss: 'ngoma',
    pool: ['voyou', 'kuluna', 'molosse', 'boxeuse'], heavy: null,
    recit: { t: 'Le tambour qui parle', x: "Bien avant le téléphone, des tambours à fente comme le lokole permettaient d'envoyer des messages de village en village dans la forêt congolaise." },
    intro: "Dans les ateliers, les étincelles pleuvent. Ngoma frappe le métal en rythme : c'est son signal pour appeler la bande.",
    outro: "Le tambour de fer se tait. Au loin, l'orage gronde sur Kisenso." }),
  ST({ id: 'kisenso', ch: 1, commune: 'KISENSO', name: 'LES RAVINS', bg: 'bg_kisenso', music: 'tour', floor: 'dirt', fx: 'storm', light: '#7ab8ff', light2: '#ff6b3d', grade: 'rgba(30,30,80,.2)', boss: 'mbala', hazard: 'lightning',
    pool: ['voyou', 'molosse', 'kuluna', 'motard'], heavy: 'molosse',
    recit: { t: 'La pluie qui mange la terre', x: "À Kinshasa, les fortes pluies creusent dans le sable des collines d'immenses ravins d'érosion qui menacent des quartiers entiers." },
    intro: "Sous l'orage, au bord du ravin, Mbala Bulldozer pousse les maisons dans le vide pour installer son relais.",
    outro: "Le bulldozer est à l'arrêt. Le réseau perd la vue sur tout le sud." }),
  ST({ id: 'lemba', ch: 1, commune: 'LEMBA', name: 'LE CAMPUS DU MONT AMBA', bg: 'bg_lemba', music: 'core', floor: 'tiles', fx: 'digital', light: '#38e6ff', light2: '#b46bff', grade: 'rgba(20,30,90,.18)', boss: 'volt',
    pool: ['garde', 'voyou', 'drone', 'boxeuse'], heavy: 'garde',
    recit: { t: 'La colline inspirée', x: "L'Université de Kinshasa occupe 400 hectares du mont Amba, à Lemba. Elle a été fondée dans les années 1950 sous le nom de Lovanium." },
    intro: "Le Professeur Volt a transformé l'amphithéâtre en salle des serveurs. Ses étudiants ne sont plus que des drones.",
    outro: "Dans le portable du professeur : les plans du relais caché sous l'Échangeur de Limete." }),
  ST({ id: 'limete', ch: 1, commune: 'LIMETE', name: "L'ÉCHANGEUR", bg: 'bg_limete', music: 'gare', floor: 'asphalt', fx: 'steam', light: '#ffb04a', light2: '#b46bff', grade: 'rgba(90,40,60,.16)', boss: 'grue',
    pool: ['molosse', 'motard', 'garde', 'voyou'], heavy: 'molosse',
    recit: { t: "La tour de l'Échangeur", x: "La tour de l'Échangeur de Limete marque l'entrée de la ville quand on arrive de l'aéroport. Une statue de Patrice Lumumba s'y dresse depuis 2002." },
    intro: "Dans la zone industrielle, Masta Grue soulève des conteneurs comme des boîtes d'allumettes.",
    outro: "La grue s'effondre. Prochain arrêt : le rond-point Ngaba." }),
  ST({ id: 'ngaba', ch: 1, commune: 'NGABA', name: 'LE ROND-POINT', bg: 'bg_ngaba', music: 'boulevard', floor: 'asphalt', fx: 'dust', light: '#ffd34d', light2: '#5fd2ff', grade: 'rgba(80,60,10,.14)', boss: 'kapita',
    pool: ['voyou', 'motard', 'kuluna', 'boxeuse'], heavy: 'molosse',
    recit: { t: 'Kimpa Vita', x: "Au début du XVIIIe siècle, au royaume Kongo, la jeune prophétesse Kimpa Vita (vers 1684-1706) appelle à réunifier le royaume. On la surnomme parfois la « Jeanne d'Arc africaine »." },
    intro: "Le rond-point est bloqué par les minibus de Kapita 207. Chaque chauffeur paie sa part au Baron.",
    outro: "Le Mont-Amba est libre. Les minibus repartent… gratuitement, pour une fois." }),
  // ===== III. FUNA =====
  ST({ id: 'makala', ch: 2, commune: 'MAKALA', name: 'LES CHARBONNIERS', bg: 'bg_makala', music: 'port', floor: 'dirt', fx: 'embers', light: '#ff6b3d', light2: '#ffcf6a', grade: 'rgba(120,30,10,.16)', boss: 'makala',
    pool: ['voyou', 'kuluna', 'molosse', 'boxeuse'], heavy: null,
    recit: { t: 'Le mot « makala »', x: "En lingala, « makala » veut dire « charbon ». Dans toute la ville, le charbon de bois reste un combustible de cuisine essentiel." },
    intro: "La fumée noire cache le relais. Makala Noir, les yeux comme des braises, garde les fours.",
    outro: "Les braises s'éteignent. Sur les collines de Selembao, un léopard rôde." }),
  ST({ id: 'selembao', ch: 2, commune: 'SELEMBAO', name: 'LES COLLINES', bg: 'bg_selembao', music: 'marche', floor: 'dirt', fx: 'dust', light: '#ffd34d', light2: '#57ff9a', grade: 'rgba(30,60,40,.14)', boss: 'nkoi',
    pool: ['kuluna', 'boxeuse', 'voyou', 'kuluna'], heavy: 'molosse',
    recit: { t: 'La tortue et le léopard', x: "Dans les contes du bassin du Congo, la tortue, petite et lente, finit toujours par l'emporter par la ruse sur le léopard, fort et orgueilleux." },
    intro: "Nkoi — « léopard » en lingala — chasse dans les escaliers de pierre. Il frappe vite, puis disparaît.",
    outro: "Le léopard est pris à son propre piège. Comme dans le conte." }),
  ST({ id: 'bumbu', ch: 2, commune: 'BUMBU', name: 'LA RUE DES TAILLEURS', bg: 'bg_bumbu', music: 'matonge', floor: 'tiles', fx: 'confetti', light: '#ff4fd8', light2: '#ffd34d', grade: 'rgba(90,20,90,.14)', boss: 'griffe',
    pool: ['sapeur', 'sapeur', 'voyou', 'boxeuse'], heavy: 'molosse',
    recit: { t: 'La SAPE', x: "La SAPE — Société des ambianceurs et des personnes élégantes — fait de l'élégance vestimentaire un art de vivre, des deux côtés du fleuve." },
    intro: "Chez les tailleurs, le Colonel Griffe a fait coudre le relais dans la doublure de son costume rose.",
    outro: "Le costume est déchiré, le relais aussi. Le Colonel pleure… surtout pour le costume." }),
  ST({ id: 'ngiri', ch: 2, commune: 'NGIRI-NGIRI', name: 'LA SALLE DE BOXE', bg: 'bg_ngiri', music: 'boulevard', floor: 'planks', fx: 'none', light: '#ffffff', light2: '#ff3b5c', grade: 'rgba(40,20,20,.14)', boss: 'tita',
    pool: ['boxeuse', 'boxeuse', 'voyou', 'molosse'], heavy: 'molosse',
    recit: { t: 'Le royaume Kongo', x: "Bien avant Kinshasa, le royaume Kongo rayonnait autour du fleuve. Les vestiges de sa capitale, Mbanza Kongo, sont inscrits au patrimoine mondial de l'UNESCO depuis 2017." },
    intro: "Le relais est accroché au-dessus du ring. Pour le décrocher, il faut battre Tita Boxe — personne n'y est jamais arrivé.",
    outro: "Tita tend la main à Nzinga : « Revanche, un jour. Sans le Baron. »" }),
  ST({ id: 'bandal', ch: 2, commune: 'BANDALUNGWA', name: 'LES TERRASSES DE BANDAL', bg: 'bg_bandal', music: 'matonge', floor: 'tiles', fx: 'confetti', light: '#ffb347', light2: '#ff4fd8', grade: 'rgba(100,30,80,.14)', boss: 'sebene',
    pool: ['sapeur', 'voyou', 'boxeuse', 'kuluna'], heavy: 'molosse',
    recit: { t: 'La rumba', x: "Le 14 décembre 2021, la rumba congolaise a été inscrite au patrimoine culturel immatériel de l'humanité par l'UNESCO, à la demande commune des deux Congo." },
    intro: "Sur la scène des terrasses, Maestro Sebene lance son solo. Chaque note émet le signal du relais.",
    outro: "La guitare se tait. Prochaine étape : le marché Gambela." }),
  ST({ id: 'kasavubu', ch: 2, commune: 'KASA-VUBU', name: 'MARCHÉ GAMBELA', bg: 'bg_marche', music: 'marche', floor: 'dirt', fx: 'dust', light: '#ffb347', light2: '#ff5a3c', grade: 'rgba(120,50,10,.14)', boss: 'zenga',
    pool: ['voyou', 'boxeuse', 'kuluna', 'molosse'], heavy: 'molosse',
    recit: { t: 'Le marché aux écorces', x: "La commune porte le nom de Joseph Kasa-Vubu, premier président du Congo indépendant. Son marché Gambela est réputé pour ses épices, ses racines et ses écorces médicinales." },
    intro: "Le marché ne ferme jamais. Mama Zenga y blanchit l'argent du Baron entre deux sacs de manioc.",
    outro: "Dans le registre de Mama Zenga : les antennes sont cachées à Matonge, sous la plus grande boîte de nuit." }),
  ST({ id: 'kalamu', ch: 2, commune: 'KALAMU', name: 'MATONGE LA NUIT', bg: 'bg_matonge', music: 'matonge', floor: 'tiles', fx: 'confetti', light: '#ff4fd8', light2: '#ffd34d', grade: 'rgba(90,20,120,.16)', boss: 'kanyinda',
    pool: ['boxeuse', 'sapeur', 'kuluna', 'molosse', 'voyou'], heavy: 'molosse',
    recit: { t: '« Ali, boma ye ! »', x: "Le 30 octobre 1974, au stade de Kalamu — aujourd'hui stade Tata Raphaël — Mohamed Ali bat George Foreman devant environ 60 000 spectateurs qui scandent « Ali, boma ye ! »." },
    intro: "Ici, la rumba ne s'arrête jamais. DJ Kanyinda cache les antennes du réseau dans ses enceintes.",
    outro: "La Funa danse à nouveau. Il reste la Lukunga… et la Tour." }),
  // ===== IV. LUKUNGA =====
  ST({ id: 'ngafula', ch: 3, commune: 'MONT-NGAFULA', name: 'LE LAC ET LA FORÊT', bg: 'bg_ngafula', music: 'port', floor: 'dirt', fx: 'rain', light: '#9fffb0', light2: '#5fd2ff', grade: 'rgba(10,60,40,.16)', boss: 'mbolo',
    pool: ['kuluna', 'molosse', 'voyou', 'kuluna'], heavy: 'molosse',
    recit: { t: 'Lola ya Bonobo', x: "Près des petites chutes de la Lukaya, le sanctuaire Lola ya Bonobo recueille les bonobos orphelins. Ce grand singe ne vit à l'état sauvage qu'en RDC." },
    intro: "Le braconnier Mbolo a installé son relais au milieu de la forêt et pose des pièges partout.",
    outro: "Les cages s'ouvrent. La forêt respire. Cap sur le mont Ngaliema." }),
  ST({ id: 'ngaliema', ch: 3, commune: 'NGALIEMA', name: 'LE MONT ET LES RAPIDES', bg: 'bg_ngaliema', music: 'tour', floor: 'metal', fx: 'dust', light: '#ffb347', light2: '#b46bff', grade: 'rgba(80,40,90,.14)', boss: 'rocher',
    pool: ['garde', 'garde', 'molosse', 'sapeur'], heavy: 'garde',
    recit: { t: 'Le mont aux trois noms', x: "Le mont Nkonzo wa Nkulu est devenu mont Léopold, puis mont Stanley, avant de prendre le nom de Ngaliema, chef du village de Ntamo à l'arrivée de Stanley." },
    intro: "Sur l'esplanade au-dessus des rapides, la garde privée du Général Rocher protège les villas de Val Industries.",
    outro: "Le Général tombe. En contrebas, la baie de Ngaliema et les quais de Kintambo." }),
  ST({ id: 'kintambo', ch: 3, commune: 'KINTAMBO', name: 'LES QUAIS DE LA BAIE', bg: 'bg_port', music: 'port', floor: 'planks', fx: 'embers', light: '#ffcf6a', light2: '#ff6b3d', grade: 'rgba(140,60,20,.14)', boss: 'mbisi',
    pool: ['molosse', 'kuluna', 'voyou', 'boxeuse'], heavy: 'molosse',
    recit: { t: 'Le berceau de la capitale', x: "En décembre 1881, Stanley installe la station de Léopoldville près du village de Ntamo, aujourd'hui Kintambo. C'est le berceau de la future capitale." },
    intro: "Sur les quais, les barges du Capitaine Mbisi transportent les serveurs pirates de GHOSTLINK.",
    outro: "Les serveurs ont pris la route du Boulevard Triomphal, escortés par la police du Baron." }),
  ST({ id: 'lingwala', ch: 3, commune: 'LINGWALA', name: 'BOULEVARD TRIOMPHAL', bg: 'bg_boulevard', music: 'boulevard', floor: 'asphalt', fx: 'rain', light: '#5fd2ff', light2: '#ff4fd8', grade: 'rgba(20,40,110,.18)', boss: 'kitoko',
    pool: ['garde', 'voyou', 'kuluna', 'garde'], heavy: 'molosse',
    recit: { t: 'Le Palais du Peuple', x: "Construit de 1975 à 1979 avec la coopération chinoise, le Palais du Peuple, à Lingwala, abrite aujourd'hui l'Assemblée nationale et le Sénat." },
    intro: "Minuit. La pluie lave le boulevard. Le Sergent Kitoko et ses agents bloquent le convoi.",
    outro: "Kitoko avoue : Ndeke garde le dernier stock d'antennes au Marché central." }),
  ST({ id: 'kinshasa', ch: 3, commune: 'KINSHASA', name: 'LE MARCHÉ CENTRAL', bg: 'bg_kinshasa', music: 'marche', floor: 'dirt', fx: 'dust', light: '#ffb347', light2: '#57ff9a', grade: 'rgba(100,60,10,.14)', boss: 'ndeke',
    pool: ['kuluna', 'kuluna', 'voyou', 'molosse', 'sapeur'], heavy: 'molosse',
    recit: { t: 'Le cœur commerçant', x: "La commune de Kinshasa abrite le Marché central, l'un des plus grands de la ville, et le stade Cardinal-Malula, l'ancien stade Reine-Astrid." },
    intro: "Entre les pousse-pousse et les étals, Ndeke et ses Kuluna rackettent tout le marché.",
    outro: "Ndeke crache le morceau : le Baron fait venir ses renforts par le train, gare de Ndolo." }),
  ST({ id: 'barumbu', ch: 3, commune: 'BARUMBU', name: 'GARE DE NDOLO', bg: 'bg_gare', music: 'gare', floor: 'rails', fx: 'steam', light: '#ffb04a', light2: '#57ff9a', grade: 'rgba(80,50,10,.16)', boss: 'tatafer', hazard: 'train',
    pool: ['garde', 'molosse', 'kuluna', 'motard'], heavy: 'molosse',
    recit: { t: 'Le train urbain', x: "Le train urbain relie la gare centrale de la Gombe à Masina et à l'aéroport, en passant par Barumbu (gare de Ndolo) et Limete." },
    intro: "Attention aux voies : les trains passent sans prévenir. Tata Fer, le forgeron des rails, vous attend.",
    outro: "Le dernier train s'arrête. Devant vous, la Tour Val Industries illumine la Gombe." }),
  ST({ id: 'gombe', ch: 3, commune: 'GOMBE', name: 'TOUR VAL INDUSTRIES', bg: 'bg_tour', music: 'tour', floor: 'metal', fx: 'storm', light: '#7ab8ff', light2: '#b46bff', grade: 'rgba(30,20,90,.2)', boss: 'baron', hazard: 'lightning',
    boss2: 'joevally', bg2: 'bg_core', floor2: 'grid', fx2: 'digital', music2: 'core', light2b: '#38e6ff', grade2: 'rgba(120,0,30,.16)',
    pool: ['garde', 'drone', 'molosse', 'sapeur', 'garde'], heavy: 'molosse',
    recit: { t: 'Le 30 juin', x: "Le boulevard du 30 Juin rappelle l'indépendance, proclamée le 30 juin 1960. Ce jour-là, Patrice Lumumba prononce un discours resté célèbre." },
    intro: "Le toit de la Tour Val Industries, sous l'orage. Le Baron vous attend, impeccable comme toujours. Sous ses pieds : le Core.",
    outro: "" }),
  ST({ id:'r2k_base',ch:4,dlc:true,dlcRoad:true,surface:'rain',roadGoal:'defend',roadGoalLabel:'Défendez le garage mobile',roadGoalNeed:2,commune:'GOMBE',name:'BASE R2K — PLACE DES ÉVOLUÉS',bg:'bg_tour',music:'boulevard',floor:'asphalt',fx:'rain',light:'#ff5a3c',light2:'#ffd34d',grade:'rgba(140,30,10,.15)',boss:'wewa',pool:['motard','voyou','kuluna'],heavy:'molosse',recit:{t:'Le départ',x:"Le convoi se rassemble : R2K, Motard Beaugard et leurs alliés ouvrent la Traversée de l'Unité."},intro:"Carly Dokota vérifie les motos. Val Industries Corporation frappe avant le départ.",outro:"La base tient. La route vers Kenge est ouverte."}),
  ST({ id:'kwango_gate',ch:4,dlc:true,dlcRoad:true,surface:'mud',roadGoal:'barriers',roadGoalLabel:'Franchissez les barrages',roadGoalNeed:3,commune:'KWANGO',name:'KENGE — PORTES DU KWANGO',bg:'bg_kimbanseke',music:'marche',floor:'dirt',fx:'dust',light:'#ffb347',light2:'#ff5a3c',grade:'rgba(120,60,10,.16)',boss:'mokonzi',pool:['motard','voyou','kuluna','molosse'],heavy:'molosse',recit:{t:'Route et solidarité',x:"Les pistes demandent patience, entraide et machines bien préparées."},intro:"Un barrage de Val Industries bloque les Portes du Kwango.",outro:"Les riders du convoi reprennent la route."}),
  ST({ id:'kikwit_relay',ch:4,dlc:true,dlcRoad:true,surface:'rain',roadGoal:'repair',roadGoalLabel:'Réparez le relais de ravitaillement',roadGoalNeed:2,commune:'KWILU',name:'KIKWIT — RELAIS DU KWILU',bg:'bg_maluku',music:'port',floor:'asphalt',fx:'rain',light:'#5fd2ff',light2:'#ffb347',grade:'rgba(20,70,110,.16)',boss:'mbongo',pool:['motard','sapeur','voyou'],heavy:'molosse',recit:{t:'Le relais',x:"Val Industries détourne les communications et le ravitaillement."},intro:"Des saboteurs attendent près du fleuve et des entrepôts.",outro:"Le signal est libéré. Cap vers le Kasaï."}),
  ST({ id:'kananga_crossroads',ch:4,dlc:true,dlcRoad:true,surface:'mud',roadGoal:'unity',roadGoalLabel:'Sécurisez le carrefour',roadGoalNeed:3,commune:'KASAÏ CENTRAL',name:'KANANGA — CARREFOUR VIVANT',bg:'bg_masina',music:'marche',floor:'dirt',fx:'dust',light:'#ff9a3c',light2:'#b46bff',grade:'rgba(80,20,110,.14)',boss:'devise',pool:['motard','boxeuse','sapeur','kuluna'],heavy:'molosse',recit:{t:'Carrefour',x:"Le convoi avance parce que chacun tient sa part."},intro:"Val Industries tente de diviser le convoi au carrefour.",outro:"Les phares restent alignés dans la nuit."}),
  ST({ id:'kamina_rail',ch:4,dlc:true,dlcRoad:true,surface:'oil',roadGoal:'rail',roadGoalLabel:'Défendez la réparation ferroviaire',roadGoalNeed:2,commune:'HAUT-LOMAMI',name:'KAMINA — NŒUD FERROVIAIRE',bg:'bg_limete',music:'port',floor:'metal',fx:'storm',light:'#7ab8ff',light2:'#ffb347',grade:'rgba(20,40,90,.16)',boss:'tatafer',hazard:'train',pool:['motard','garde','kuluna','molosse'],heavy:'molosse',recit:{t:'Le passage',x:"Le train et la route se croisent. Carly doit réparer sous pression."},intro:"Les rails sont verrouillés et un train approche.",outro:"La réparation tient. Lubumbashi est proche."}),
  ST({ id:'lubumbashi_unity',ch:4,dlc:true,dlcRoad:true,surface:'asphalt',roadGoal:'freeJoe',roadGoalLabel:'Libérez Joe-Vally Déchu',roadGoalNeed:3,commune:'LUBUMBASHI',name:'LUBUMBASHI — PHARES DE L’UNITÉ',bg:'bg_tour',music:'tour',floor:'asphalt',fx:'storm',light:'#ffb347',light2:'#ff3b5c',grade:'rgba(110,20,20,.18)',boss:'joevally',pool:['motard','garde','molosse','drone'],heavy:'molosse',recit:{t:'L’arrivée',x:"La Traversée atteint Lubumbashi. Joe-Vally, rider fictif, doit être libéré du signal de Val Industries."},intro:"Joe-Vally Déchu bloque la dernière ligne droite. Il faut le libérer, pas le détruire.",outro:"Le signal est brisé. Joe-Vally se relève, et tous les phares s’allument."}),
];
STAGES.forEach((S, i) => {
  S.num = i + 1;
  S.kicker = S.dlc ? 'TRAVERSÉE · ÉTAPE ' + (i - 23) : (S.id === 'gombe' ? 'COMMUNE 24 · FINAL' : 'COMMUNE ' + (i + 1));
  S.waves = genWaves(i, S.pool, S.heavy);
  if (S.fx === 'none') S.fx = 'dust';
});

/* ---------- Narration ---------- */
const STORY = {
  prologue: [
    { img: 'bg_boulevard', text: "Kinshasa, 2043. La ville ne dort jamais. Elle veille sous l'œil de GHOSTLINK, le réseau de sécurité de Val Industries Corporate Technologies." },
    { img: 'boss_baron', text: "Mais le réseau a été détourné. Le Baron, roi des sapeurs et des affaires louches, a planté un relais GHOSTLINK dans chacune des 24 communes, gardé par l'un de ses lieutenants." },
    { img: 'keyart', text: "Trois amis du quartier refusent de baisser la tête : Kabongo, ex-agent de Val Industries. Nzinga, championne de kick-boxing. Makasi, docker aux poings de fer." },
    { img: 'bg_nsele', text: "Leur plan : traverser les quatre districts — Tshangu, Mont-Amba, Funa, Lukunga — couper les 24 relais un par un, jusqu'à la Tour Val Industries, à la Gombe." },
  ],
  phase2: "Le Baron s'effondre… mais GHOSTLINK continue de tourner. Sous la tour, le Core s'éveille.",
  ending: [
    { img: 'bg_core', text: "Le Core s'éteint. Pour la première fois depuis des années, aucune caméra ne surveille les 24 communes de Kinshasa." },
    { img: 'keyart', text: "Kabongo, Nzinga et Makasi rentrent à pied, sous un ciel sans drones. De Nsele à la Gombe, les terrasses rallument la rumba." },
    { img: 'bg_boulevard', text: "GHOSTLINK sera reconstruit — cette fois, par et pour les habitants. Val Industries appartient au code vivant." },
  ],
};

const FOODS = {
  tangawisi: { label: 'Jus de tangawisi', hp: 20, color: '#ffd34d' },
  brochette: { label: 'Brochettes', hp: 40, color: '#c8692a' },
  poulet:    { label: 'Poulet braisé', hp: 100, color: '#e58a2b' },
};
const MONEY = { billet: 500, liasse: 2000, or: 5000 };
const WEAPONS = {
  pipe:   { label: 'Barre de fer', move: 'w_pipe', uses: 10, thrown: 16 },
  knife:  { label: 'Couteau', move: 'w_knife', uses: 14, thrown: 12 },
  bottle: { label: 'Bouteille', move: 'w_bottle', uses: 1, thrown: 14 },
};
