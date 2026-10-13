/* =========================================================
   GHOSTLINK V12.3 — ui.js
   V12.3 : réglages à onglets, disposition tactile en arc (façon Diablo mobile) avec anneaux
   de recharge, limite d'images par seconde, résolution dynamique, mode hors ligne (service worker).
   Écrans, carte des 24 communes, cartes de chapitre et de récit, HUD (barres de boss
   empilées, points de combo), commandes tactiles à 5 boutons, boucle, crochets de test.
   ========================================================= */
'use strict';

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
// cache des éléments interrogés à chaque image (évite les recherches DOM répétées)
const _elc = {};
const $c = (s) => _elc[s] || (_elc[s] = document.querySelector(s));

const UI = {
  screen: 'boot', paused: false, mode: 'story', pendingStage: 0, selStep: 0, selCur: 0, holdT: 0,
  story: null, overT: 0, lastHud: {},
  isTouch: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,

  /* ---------- Écrans ---------- */
  show(id) {
    $$('.screen').forEach((s) => s.classList.toggle('active', s.id === 'scr-' + id));
    this.screen = id;
    document.body.classList.toggle('playing', id === 'game' || id === 'pause' || id === 'clear' || id === 'over');
    document.body.classList.toggle('ctl', id === 'game' || id === 'pause');
  },
  sheet(id, on) { $('#scr-' + id).classList.toggle('active', on); },
  fade(fn) {
    const f = $('#fade'); f.classList.add('on');
    setTimeout(() => { fn(); requestAnimationFrame(() => f.classList.remove('on')); }, 300);
  },

  init() {
    document.body.classList.toggle('touch', this.isTouch);
    document.body.classList.toggle('notouch', !this.isTouch);
    this.applySettings();
    this.layout();
    R.init($('#game'));
    window.addEventListener('resize', () => { this.layout(); R.resize(); });
    window.addEventListener('orientationchange', () => setTimeout(() => { this.layout(); R.resize(); }, 200));
    // empêcher tout défilement de la page (bug V10)
    document.addEventListener('touchmove', (e) => { if (!e.target.closest('.sheet-in, .stage-list, .chap-in')) e.preventDefault(); }, { passive: false });
    window.addEventListener('scroll', () => window.scrollTo(0, 0));
    document.addEventListener('visibilitychange', () => { if (document.hidden) { if (this.screen === 'game') this.pause(); Sound.suspend(); } else Sound.resume(); });
    this.bind();
    this.touchControls();
    Promise.all([loadImages((k) => { $('.boot-bar i').style.width = Math.round(k * 100) + '%'; }), Sprites.loadHeroes()]).then(() => {
      const b = $('#btn-boot'); b.disabled = false; b.textContent = 'TOUCHER POUR COMMENCER';
      const missing = (typeof missingImages === 'function' ? missingImages() : []).concat(Sprites.failed || []);
      const diag = $('#boot-assets');
      if (diag) diag.textContent = missing.length ? missing.length + ' ressources indisponibles : rendu de secours actif. Vérifiez le dossier assets/.' : 'Illustrations de départ chargées. Décors et boss se chargent à la demande.';
    });
    $('#best').textContent = Progress.best.toLocaleString('fr-FR');
    this.offline();
    this.loop();
  },
  /* ---------- Hors ligne ----------
     Le service worker met en cache TOUT le jeu (code, polices, décors, sprites) à la première visite :
     ensuite le jeu se lance sans connexion. Les versions Electron / Capacitor sont déjà locales. */
  offline() {
    const el = $('#offline-state');
    const set = (t, ok) => { if (el) { el.textContent = t; el.classList.toggle('ok', !!ok); } };
    if (!/^https?:$/.test(location.protocol)) { set('Mode local file:// : aucun serveur requis · les sauvegardes dépendent du navigateur', true); return; }
    if (!('serviceWorker' in navigator)) { set('Mode hors ligne non pris en charge par ce navigateur'); return; }
    // ?nosw : mode développement, cache hors ligne désactivé et vidé
    if (/[?&]nosw/.test(location.search)) { navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())); if (window.caches) caches.keys().then((ks) => ks.forEach((k) => caches.delete(k))); set('Mode développement : cache hors ligne désactivé'); return; }
    try {
      navigator.serviceWorker.addEventListener('message', (e) => {
        const d = e.data || {};
        if (d.type === 'progress') set(`Préparation hors ligne : ${Math.round(d.done / d.total * 100)} %`);
        if (d.type === 'ready') set('Hors ligne prêt : le jeu fonctionne sans connexion', true);
      });
      // nouvelle version installée : rechargement automatique si l'on n'est pas en pleine partie
      const hadCtl = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadCtl) return;
        if (this.screen === 'boot' || this.screen === 'title') location.reload();
        else this.toast('Mise à jour installée : elle sera active au prochain lancement');
      });
      navigator.serviceWorker.register('sw.js').then((reg) => {
        if (reg.active && !reg.installing) {
          set('Hors ligne prêt : le jeu fonctionne sans connexion', true);
          if (reg.active) reg.active.postMessage({ type: 'check' });
        } else set('Préparation hors ligne…');
      }).catch(() => set('Hors ligne indisponible dans cet aperçu (fonctionne une fois publié)'));
    } catch (e) { set('Hors ligne indisponible dans cet aperçu'); }
  },
  layout() {
    const land = window.innerWidth > window.innerHeight;
    document.body.classList.toggle('landscape', land);
    document.body.classList.toggle('portrait', !land);
  },
  applySettings() {
    const B = document.body;
    document.documentElement.style.setProperty('--ctl', (Settings.size || 100) / 100);
    document.documentElement.style.setProperty('--op', (Settings.opac || 85) / 100);
    B.classList.toggle('lefty', !!Settings.lefty);
    B.classList.toggle('fx-eco', Settings.fx === 0);
    B.classList.toggle('arc', Settings.layout !== 0);
    B.classList.toggle('noflash', !!Settings.noflash);
    B.classList.toggle('ps', Settings.glyph === 1);
    Settings.showFps = /[?&]fps/.test(location.search) || !!Settings.fpsShow;
    const fe = document.getElementById('fps'); if (fe) { fe.style.display = Settings.showFps ? '' : 'none'; }
    Sound.applyVolumes && Sound.applyVolumes();
    if (typeof PadUI !== 'undefined') PadUI.renderMap();
  },

  bind() {
    const on = (sel, fn) => $(sel).addEventListener('click', (e) => { Sound.ready && Sound.sfx.ui(); fn(e); });
    on('#btn-boot', () => { Sound.init(); Sound.playMusic('menu'); this.show('title'); });
    on('#btn-story', () => { this.mode = 'story'; Game.coop = false; this.pendingStage = 0; this.openSelect(); });
    on('#btn-coop', () => { this.mode = 'story'; Game.coop = true; this.pendingStage = 0; this.openSelect(); });
    on('#btn-stages', () => { this.renderStages(); this.show('stages'); });
    on('#btn-records', () => { this.renderRecords(); this.show('records'); });
    on('#btn-records-export', () => this.exportSave());
    on('#btn-records-import', () => $('#records-file').click());
    $('#records-file').addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      try {
        if (!f) return;
        if (f.size > 1024 * 1024) throw Error('Fichier trop volumineux');
        const imported = JSON.parse(await f.text());
        const stats = Records.mergeSave(imported);
        this.renderRecords();
        $('#best').textContent = Progress.best.toLocaleString('fr-FR');
        this.toast('Sauvegarde importée · ' + (stats.clearedMain + stats.clearedRoad) + ' étapes restaurées');
      } catch (err) { this.toast('Importation refusée : ' + (err && err.message || 'fichier invalide')); }
      finally { e.target.value = ''; }
    });
    on('#btn-options', () => { this.syncOptions(); this.sheet('options', true); });
    on('#btn-credits', () => this.sheet('credits', true));
    $$('[data-back]').forEach((b) => b.addEventListener('click', () => {
      Sound.ready && Sound.sfx.ui();
      const s = b.closest('.screen');
      if (s.classList.contains('sheet')) { s.classList.remove('active'); if (s.id === 'scr-options' && this.optFromPause) { this.optFromPause = false; if (this.paused) this.sheet('pause', true); } }
      else if (s.id === 'scr-select' && this.selStep === 1) { this.selStep = 0; this.renderSelect(); }
      else this.show('title');
    }));
    on('#btn-confirm', () => this.confirmHero());
    on('#btn-skip', () => this.endStory());
    $('#scr-story').addEventListener('click', (e) => { if (e.target.id !== 'btn-skip') this.nextPanel(); });
    on('#btn-pause', () => this.pause());
    on('#btn-resume', () => this.resume());
    on('#btn-restart', () => { this.sheet('pause', false); this.paused = false; this.fade(() => this.beginStage(Game.stageIdx, false)); });
    on('#btn-p-options', () => { this.syncOptions(); this.sheet('pause', false); this.sheet('options', true); this.optFromPause = true; });
    on('#btn-quit', () => { this.sheet('pause', false); this.paused = false; this.toMenu(); });
    on('#btn-next', () => this.afterClear());
    on('#btn-continue', () => this.doContinue());
    on('#btn-over-menu', () => this.toMenu());
    on('#btn-end', () => this.toMenu());
    on('#btn-chap', () => this.closeChapter());
    $('#scr-chapter').addEventListener('click', (e) => { if (e.target.id !== 'btn-chap' && this._chapReady) this.closeChapter(); });
    $('#bosscard').addEventListener('click', () => { this.holdT = Math.min(this.holdT, 0.15); });
    // options
    $$('.seg').forEach((seg) => seg.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const k = seg.dataset.opt; Settings[k] = +b.dataset.v;
      if (k === 'fx' || k === 'dynres') { R.dyn = 1; R.resize(); }
      saveSettings(); this.applySettings(); this.syncOptions(); Sound.ready && Sound.sfx.ui();
    }));
    $$('input[type=range]').forEach((r) => r.addEventListener('input', () => {
      Settings[r.dataset.opt] = +r.value; saveSettings(); this.applySettings(); this.syncOptions();
      if (r.dataset.opt === 'rscale') { clearTimeout(this._rsT); this._rsT = setTimeout(() => R.resize(), 150); }
    }));
    // onglets des réglages
    $$('#scr-options .tab').forEach((t) => t.addEventListener('click', () => { Sound.ready && Sound.sfx.ui(); this.optTab(t.dataset.tab); }));
    on('#btn-audio-test', () => this.audioTest());
    on('#btn-reset-opts', () => {
      const keep = { lefty: Settings.lefty };
      Object.assign(Settings, { fx: 2, haptics: 1, size: 100, music: 70, sfx: 85, diff: 1, shake: 1, master: 100, amode: 1, dyn: 0, env: 1, heart: 1, layout: 1, opac: 85, hold: 1, assist: 1, autorun: 1, rumble: 1, glyph: 0, fpscap: 0, dynres: 1, rscale: 100, fpsShow: 0, noflash: 0, gspeed: 100, parryWin: 1 }, keep);
      saveSettings(); this.applySettings(); this.syncOptions(); R.dyn = 1; R.resize(); this.toast('Réglages par défaut rétablis');
    });
  },
  syncOptions() {
    $$('.seg').forEach((seg) => { const v = Settings[seg.dataset.opt]; $$('button', seg).forEach((b) => b.classList.toggle('on', +b.dataset.v === +v)); });
    $$('input[type=range]').forEach((r) => {
      const k = r.dataset.opt; r.value = Settings[k];
      r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%');
      const o = $(`[data-out="${k}"]`); if (o) o.textContent = Settings[k] + '%';
    });
    const pn = $('#perf-note');
    if (pn) pn.textContent = `Mesuré : ${this.fps || '—'} images/s · rendu ${Math.round((R.dpr || 1) * 100) / 100}× · écran ${Math.round((window.devicePixelRatio || 1) * 100) / 100}× · ${navigator.hardwareConcurrency || '?'} cœurs`;
    if (typeof PadUI !== 'undefined') PadUI.renderStatus();
  },
  optTab(id) {
    $$('#scr-options .tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === id));
    $$('#scr-options .pane').forEach((p) => p.classList.toggle('on', p.dataset.pane === id));
    this.optCur = id;
    const s = $('#scr-options .sheet-in'); if (s) s.scrollTop = 0;
  },
  // test du son 3D : un coup à gauche, au centre, à droite, puis derrière (en mode casque)
  audioTest() {
    Sound.init();
    const w = 300, pos = [-140, 0, 140];
    pos.forEach((x, i) => setTimeout(() => { Sound.setView(0, w); Sound.at(x, 0); Sound.sfx.punch(1.4); Sound.at(null); }, 200 + i * 450));
    setTimeout(() => { Sound.setView(0, w); Sound.at(-60, 80); Sound.sfx.parry(); Sound.at(null); }, 1700);
    this.toast('Gauche · centre · droite · parade');
  },

  /* ---------- Choix du héros ---------- */
  openSelect() {
    this.selStep = 0; this.selCur = 0;
    Input.coop = Game.coop;
    document.body.classList.toggle('coop', Game.coop);
    this.renderSelect(); this.show('select');
  },
  renderSelect() {
    const ids = Object.keys(HEROES);
    const wrap = $('#sel-cards'); wrap.innerHTML = '';
    $('#sel-title').textContent = Game.coop ? (this.selStep === 0 ? 'JOUEUR 1 : CHOISIS' : 'JOUEUR 2 : CHOISIS') : 'CHOISIS TON COMBATTANT';
    if (this.selStep === 1 && ids[this.selCur] === Game.heroSel[0]) this.selCur = (this.selCur + 1) % ids.length;
    ids.forEach((id, i) => {
      const H = HEROES[id];
      const c = document.createElement('button');
      c.className = 'hcard' + (i === this.selCur ? ' sel' : '');
      c.style.setProperty('--hc', H.color);
      c.innerHTML = `<img src="assets/img/${H.img}.webp" alt="${H.name}" /><span class="hc-name">${H.name}</span>`;
      if (this.selStep === 1 && Game.heroSel[0] === id) { c.classList.add('taken'); c.dataset.taken = 'J1'; }
      c.addEventListener('click', () => {
        if (c.classList.contains('taken')) return;
        if (this.selCur === i) { this.confirmHero(); return; }
        this.selCur = i; Sound.ready && Sound.sfx.select(); this.renderSelect();
      });
      wrap.appendChild(c);
    });
    const H = HEROES[ids[this.selCur]];
    $('.si-name').textContent = H.name; $('.si-name').style.color = '';
    $('.si-title').textContent = H.title;
    $('.si-desc').textContent = H.desc;
    const lab = { pow: 'PUISSANCE', spd: 'VITESSE', jmp: 'SAUT' };
    $('.si-stats').innerHTML = Object.keys(lab).map((k) => `<span>${lab[k]}</span><span class="pips">${[1, 2, 3, 4, 5].map((n) => `<i class="${n <= H.stats[k] ? 'on' : ''}"></i>`).join('')}</span>`).join('') + `<span>STYLE DE COMBAT</span><span>${H.combat.role}</span><span>COUP ÉTOILE</span><span>★ ${H.starName}</span>`;
    $('#btn-confirm').textContent = Game.coop && this.selStep === 0 ? 'CONFIRMER J1' : 'COMBATTRE';
  },
  confirmHero() {
    const ids = Object.keys(HEROES);
    Sound.ready && Sound.sfx.uiOk();
    Game.heroSel[this.selStep] = ids[this.selCur];
    if (Game.coop && this.selStep === 0) { this.selStep = 1; this.renderSelect(); return; }
    if (this.mode === 'story' && this.pendingStage === 0 && !Progress.seenIntro) {
      this.startStory(STORY.prologue, () => { Progress.seenIntro = true; saveProgress(); this.beginStage(0, false); });
    } else this.fade(() => this.beginStage(this.pendingStage, false));
  },

  /* ---------- Histoire ---------- */
  startStory(panels, done) {
    this.story = { panels, i: -1, done, typing: null };
    Sound.playMusic(panels === STORY.ending ? 'ending' : 'menu');
    this.show('story'); this.nextPanel();
  },
  nextPanel() {
    const s = this.story; if (!s) return;
    const el = $('#story-text');
    if (s.typing) { clearInterval(s.typing); s.typing = null; el.textContent = s.panels[s.i].text; return; }
    s.i++;
    if (s.i >= s.panels.length) { this.endStory(); return; }
    const P = s.panels[s.i];
    const img = $('#story-img');
    img.src = 'assets/img/' + P.img + '.webp';
    img.classList.toggle('fit', P.img.startsWith('boss_') || P.img.startsWith('hero_'));
    const scr = $('#scr-story'); scr.classList.remove('anim'); void scr.offsetWidth; scr.classList.add('anim');
    let n = 0; el.textContent = '';
    s.typing = setInterval(() => {
      n += 2; el.textContent = P.text.slice(0, n);
      if (n % 6 === 0 && Sound.ready) Sound.sfx.ui();
      if (n >= P.text.length) { clearInterval(s.typing); s.typing = null; }
    }, 24);
  },
  endStory() {
    const s = this.story; if (!s) return;
    if (s.typing) clearInterval(s.typing);
    this.story = null;
    this.fade(() => s.done());
  },

  /* ---------- Stages ---------- */
  renderStages() {
    // carte des 4 districts et 24 communes
    const L = $('#stage-list'); L.innerHTML = '';
    const done = STAGES.filter((S) => !S.dlc && Progress.ranks[S.id]).length;
    $('#map-prog').textContent = done + ' / 24';
    CHAPTERS.forEach((C, ci) => {
      const list = STAGES.map((S, i) => [S, i]).filter(([S]) => S.ch === ci);
      const sec = document.createElement('section');
      sec.className = 'dist'; sec.style.setProperty('--dc', C.col);
      const nDone = list.filter(([S]) => Progress.ranks[S.id]).length;
      if (ci === 4 && !Progress.ranks.gombe) { sec.classList.add('dlc-locked'); }
      sec.innerHTML = `<header class="dist-h"><span class="dist-n">${C.num}</span><div><b>${C.name}</b><span>${C.sub}</span></div><em>${nDone}/${list.length}</em></header><div class="dist-grid"></div>`;
      const G = $('.dist-grid', sec);
      list.forEach(([S, i]) => {
        const locked = S.dlc ? (!Progress.ranks.gombe || i - 24 >= (Progress.roadUnlocked || 0)) : i >= Progress.unlocked;
        const b = document.createElement('button');
        b.className = 'stage-card' + (locked ? ' locked' : '') + (!locked && !Progress.ranks[S.id] ? ' next' : '');
        b.innerHTML = `${locked ? '' : `<img src="assets/img/${S.bg}.webp" alt="" loading="lazy" />`}<div class="st-in"><span class="st-k">${String(S.num).padStart(2, '0')} · ${S.commune}</span><span class="st-n">${S.name}</span><span class="st-b">${locked ? 'VERROUILLÉ' : 'BOSS ' + BOSSES[S.boss].name}</span></div>${Progress.ranks[S.id] ? `<span class="st-r">${Progress.ranks[S.id]}</span>` : ''}`;
        b.addEventListener('click', () => {
          if (locked) { this.toast(S.dlc ? 'Terminez la campagne principale puis les étapes précédentes' : 'Libérez la commune précédente pour débloquer'); return; }
          Sound.ready && Sound.sfx.uiOk();
          this.mode = S.dlc ? 'road' : 'single'; Game.coop = false; this.pendingStage = i; this.openSelect();
        });
        G.appendChild(b);
      });
      L.appendChild(sec);
    });
  },

  /* ---------- Carte de chapitre (district) ---------- */
  showChapter(ci, done) {
    const C = CHAPTERS[ci];
    const scr = $('#scr-chapter'); scr.style.setProperty('--dc', C.col);
    $('#chap-num').textContent = ci === 4 ? 'EXTENSION · ÉTAPE V' : 'DISTRICT ' + C.num;
    $('#chap-name').textContent = C.name; $('#chap-sub').textContent = C.sub; $('#chap-text').textContent = C.text;
    $('#chap-communes').innerHTML = STAGES.filter((S) => S.ch === ci).map((S) => `<span>${S.commune}</span>`).join('');
    this._chapDone = done; this._chapReady = false;
    setTimeout(() => { this._chapReady = true; }, 600);
    scr.classList.remove('anim'); void scr.offsetWidth; scr.classList.add('anim');
    this.show('chapter'); Sound.ready && Sound.sfx.bossIntro();
  },
  closeChapter() {
    const d = this._chapDone; if (!d) return;
    this._chapDone = null; Sound.ready && Sound.sfx.uiOk();
    this.fade(d);
  },

  beginStage(idx, keep, skipChap) {
    const S0 = STAGES[idx];
    // carte de district au premier stage de chaque chapitre (mode histoire)
    if (!skipChap && (this.mode === 'story' || this.mode === 'road') && STAGES.findIndex((S) => S.ch === S0.ch) === idx && this.screen !== 'chapter') {
      this.showChapter(S0.ch, () => this.beginStage(idx, keep, true));
      return;
    }
    // décor et portrait du boss chargés à la demande, puis préchargement du stage suivant
    if (typeof loadStageImages === 'function') {
      const im = IMG[S0.bg];
      if (!im || !im.complete) { this.toast('Chargement de ' + S0.commune + '…'); loadStageImages(S0).then(() => { if (Game.stage && Game.stageIdx === idx) R.cache.key = ''; }); }
      else loadStageImages(S0);
      if (STAGES[idx + 1]) setTimeout(() => { loadStageImages(STAGES[idx + 1]); if (typeof Sprites !== 'undefined') Sprites.loadStage(STAGES[idx + 1]); }, 1500);
    }
    if (typeof Sprites !== 'undefined') Sprites.loadStage(S0);
    Input.coop = Game.coop;
    document.body.classList.toggle('coop', Game.coop);
    this.show('game');
    this.layout(); R.resize();
    Game.startStage(idx, { keep });
    Records.start(S0.id);
    this._clearRecordedStats = null;
    this._attemptToken = String(Date.now()) + '-' + String((this._attemptSequence = (this._attemptSequence || 0) + 1));
    const S = STAGES[idx];
    Sound.playMusic(S.music, idx + 1);
    this.lastHud = {};
    this.setupHud();
    const oldConvoy = $('#convoyhud'); if (oldConvoy) oldConvoy.remove();
    const oldGoal = $('#roadgoal'); if (oldGoal) oldGoal.remove();
    if (S.dlcRoad) { this.updateConvoyHud({ hp: Game.convoy.hp, max: Game.convoy.max }); this.updateRoadGoal(Game.roadObjective); }
    const c = $('#stagecard');
    $('.sc-kick', c).textContent = S.kicker + ' · ' + CHAPTERS[S.ch].name;
    $('.sc-commune', c).textContent = S.commune;
    $('.sc-name', c).textContent = S.name; $('.sc-text', c).textContent = S.intro;
    $('.sc-rt', c).textContent = S.recit ? S.recit.t : ''; $('.sc-rx', c).textContent = S.recit ? S.recit.x : '';
    c.style.setProperty('--dc', CHAPTERS[S.ch].col);
    c.classList.remove('on'); void c.offsetWidth; c.classList.add('on');
    $('#bosscard').classList.remove('on');
    $('#enemybar').classList.remove('on', 'boss');
    this.paused = false; this.holdT = 0;
  },
  setupHud() {
    Game.players.forEach((p, i) => {
      const card = $('#hud-p' + (i + 1));
      card.style.setProperty('--pc', p.hero.color);
      $('img', card).src = 'assets/img/' + p.hero.img + '.webp';
      $('.pc-name', card).textContent = p.hero.name;
    });
  },

  exportSave() {
    const json = JSON.stringify(Records.exportData(), null, 2);
    const blob = new Blob([json], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'GHOSTLINK_SAUVEGARDE_V26_5.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.toast('Sauvegarde exportée · conserve le fichier JSON');
  },

  /* ---------- Registre V26.2 ---------- */
  renderRecords() {
    const info = Records.summary();
    $('#record-summary').innerHTML = [
      ['Communes', info.clearedMain + '/24'], ['Traversée', info.clearedRoad + '/6'],
      ['Rangs S', info.sRanks], ['Médailles', info.medals]
    ].map(([key, value]) => '<div><b>' + value + '</b><span>' + key + '</span></div>').join('');
    const fmt = (n) => Number(n).toLocaleString('fr-FR');
    const root = $('#record-list'); root.innerHTML = '';
    for (const {stage, record} of info.records) {
      const article = document.createElement('article'); article.className = 'record-entry';
      const title = document.createElement('h3'); title.textContent = stage.commune + ' · ' + stage.name;
      article.appendChild(title);
      const desc = document.createElement('p');
      if (!record || !record.cleared) desc.textContent = 'Pas encore libéré · ' + (record ? record.attempts : 0) + ' tentative(s)';
      else desc.textContent = 'Rang ' + (record.bestRank || '—') + ' · ' + (record.bestScore == null ? 'Score historique inconnu' : fmt(record.bestScore) + ' pts') + ' · ' + (record.bestTimeMs == null ? 'Chrono inconnu' : (record.bestTimeMs / 1000).toFixed(1) + ' s') + ' · ' + record.clears + ' victoire(s)';
      article.appendChild(desc);
      if (record && record.medals.length) {
        const badges = document.createElement('div'); badges.className = 'record-medals';
        for (const medal of record.medals) { const s = document.createElement('span'); s.textContent = '★ ' + Records.MEDAL_LABELS[medal]; badges.appendChild(s); }
        article.appendChild(badges);
      }
      root.appendChild(article);
    }
  },

  /* ---------- Pause / fin ---------- */
  pause() {
    if (this.screen !== 'game' || Game.state !== 'play') return;
    this.paused = true; this.sheet('pause', true); Sound.setDuck(true); Sound.setPaused(true); Input.reset();
    const S = Game.stage, st = Game.stats;
    $('#pause-sub').textContent = S ? S.kicker + ' · ' + S.commune : '';
    const mm = Math.floor(st.time / 60), ss = String(Math.floor(st.time % 60)).padStart(2, '0');
    $('#pause-stats').innerHTML = [['Temps', mm + ':' + ss], ['K.O.', st.kills], ['Combo max', st.maxCombo], ['Parades', st.parries || 0]].map((r) => `<div><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');
  },
  resume() { this.paused = false; this.sheet('pause', false); Sound.setDuck(false); Sound.setPaused(false); },
  toMenu() {
    this.fade(() => {
      Game.state = 'menu'; Game.stage = null; Sound.setPaused(false); Sound.setLowHp(0); Sound.setDuck(false);
      $$('.sheet').forEach((s) => s.classList.remove('active'));
      $('#best').textContent = Progress.best.toLocaleString('fr-FR');
      this.show('title'); const cg = $('#carlygarage'); if (cg) cg.remove(); Sound.playMusic('menu');
    });
  },
  totalScore() { return Game.players.reduce((a, p) => a + p.score, 0); },
  onClear() {
    const S = Game.stage, st = Game.stats;
    if (!S || !st || this._clearRecordedStats === st) return;
    this._clearRecordedStats = st;
    const score = this.totalScore() - st.startScore;
    const lifeBonus = Game.players.reduce((a, p) => a + (p.out ? 0 : Math.round(p.hp / p.maxHp * 3000)), 0);
    const timeBonus = Math.max(0, Math.round((240 - st.time) * 25));
    Game.players.forEach((p) => { Game.addScore(p, Math.round((lifeBonus + timeBonus) / Game.players.length)); });
    const total = score + lifeBonus + timeBonus;
    const pts = total / 1000 + st.maxCombo * 0.4 - st.dmg / 60;
    const rank = pts > 26 ? 'S' : pts > 18 ? 'A' : pts > 11 ? 'B' : pts > 5 ? 'C' : 'D';
    const recordResult = Records.clear(S.id, {runId: this._attemptToken, rank, score: total, timeMs: Math.round(st.time * 1000), damageTaken: st.dmg, combo: st.maxCombo, convoyPct: S.dlcRoad && Game.convoy ? (Game.convoy.max > 0 ? Game.convoy.hp / Game.convoy.max * 100 : 0) : null, roadObjectiveDone: !!(Game.roadObjective && Game.roadObjective.done)});
    const order = ['D', 'C', 'B', 'A', 'S'];
    if (!Progress.ranks[S.id] || order.indexOf(rank) > order.indexOf(Progress.ranks[S.id])) Progress.ranks[S.id] = rank;
    if (S.dlc) Progress.roadUnlocked = Math.max(Progress.roadUnlocked || 0, Math.min(6, Game.stageIdx - 23));
    else Progress.unlocked = Math.max(Progress.unlocked, Math.min(24, Game.stageIdx + 2));
    Progress.best = Math.max(Progress.best, this.totalScore());
    saveProgress();
    $('#clear-kick').textContent = S.kicker + ' · ' + S.commune;
    const mm = Math.floor(st.time / 60), ss = String(Math.floor(st.time % 60)).padStart(2, '0');
    const rows = [['Score du stage', score.toLocaleString('fr-FR')], ['Combo max', st.maxCombo + ' coups'], ['Parades · esquives', (st.parries || 0) + ' · ' + (st.perfects || 0)], ['Temps', mm + ':' + ss], ['Bonus vie', '+' + lifeBonus.toLocaleString('fr-FR')], ['Bonus temps', '+' + timeBonus.toLocaleString('fr-FR')], ['TOTAL', this.totalScore().toLocaleString('fr-FR')]];
    const T = $('#tally');
    T.innerHTML = rows.map((r, i) => `<div class="${i === rows.length - 1 ? 'total' : ''}"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');
    const rk = $('#rank'); rk.classList.remove('on'); $('b', rk).textContent = rank;
    rk.style.setProperty('--rk', { S: '#ffd34d', A: '#5dffb0', B: '#38e6ff', C: '#ff9a3c', D: '#ff3b4e' }[rank]);
    const medals = recordResult ? recordResult.medalsEarned : [];
    $('#clear-medals').innerHTML = medals.length ? medals.map((m) => '<span class="medal">★ ' + Records.MEDAL_LABELS[m] + '</span>').join('') : '<span class="medal-empty">Aucune médaille cette fois</span>';
    const rec = recordResult && recordResult.record;
    $('#clear-record').textContent = rec ? ((recordResult.improved ? 'NOUVEAU RECORD · ' : 'RECORD · ') + rec.bestScore.toLocaleString('fr-FR') + ' pts' + (rec.bestTimeMs != null ? ' · Meilleur chrono ' + (rec.bestTimeMs / 1000).toFixed(1) + ' s' : '')) : '';
    $('#clear-outro').textContent = (S.outro || '') + (S.recit ? '\n\nRÉCIT : ' + S.recit.t + '.' : '');
    $('#btn-next').textContent = (S.dlc && Game.stageIdx === STAGES.length - 1) || S.id === 'gombe' ? 'VOIR LA FIN' : (this.mode === 'story' || this.mode === 'road') ? 'STAGE SUIVANT' : 'MENU';
    this.show('clear');
    Sound.stopMusic(); Sound.sfx.clear();
    $$('#tally div').forEach((d, i) => setTimeout(() => { d.classList.add('on'); Sound.ready && Sound.sfx.money(); }, 350 + i * 260));
    setTimeout(() => { rk.classList.add('on'); Sound.ready && Sound.sfx.punch(2); haptic(40); }, 350 + rows.length * 260 + 200);
  },
  afterClear() {
    const S = Game.stage;
    if (S.dlc) {
      if (Game.stageIdx === STAGES.length - 1) {
        this.startStory([{ img: 'bg_tour', text: 'La Traversée de l’Unité rejoint Lubumbashi. Carly Dokota et les riders déconnectent Joe-Vally du protocole GHOSTLINK de Val Industries Corporation. Le convoi repart uni.' }], () => this.showEnding());
      } else if (this.mode === 'road') this.fade(() => this.beginStage(Game.stageIdx + 1, true));
      else this.toMenu();
      return;
    }
    if (S.id === 'gombe') { this.startStory(STORY.ending, () => this.showEnding()); return; }
    if (this.mode === 'story') this.fade(() => this.beginStage(Game.stageIdx + 1, true));
    else this.toMenu();
  },
  showEnding() {
    $('#end-tally').innerHTML = `<div class="on"><span>Score final</span><b>${this.totalScore().toLocaleString('fr-FR')}</b></div><div class="on"><span>Communes libérées</span><b>${STAGES.filter((S) => !S.dlc && Progress.ranks[S.id]).length} / 24</b></div><div class="on"><span>Rangs S</span><b>${STAGES.filter((S) => !S.dlc && Progress.ranks[S.id] === 'S').length}</b></div><div class="on"><span>Record</span><b>${Progress.best.toLocaleString('fr-FR')}</b></div>`;
    this.show('ending'); Sound.playMusic('ending');
  },
  onGameOver() {
    this.show('over'); this.overT = 9.99; Sound.stopMusic(); Sound.sfx.over();
    Progress.best = Math.max(Progress.best, this.totalScore()); saveProgress();
  },
  doContinue() {
    Sound.ready && Sound.sfx.uiOk();
    for (const p of Game.players) {
      p.out = false; p.lives = Game.diff().lives; p.hp = p.maxHp; p.rec = 0; p.dying = false; p.alpha = 1; p.score = Math.floor(p.score / 2);
      p.state = 'jump'; p.y = 120; p.vy = 0; p.x = Game.camX + 60 + p.idx * 30; p.inv = 2.5; p.stars = Math.max(p.stars, 1);
    }
    Game.state = 'play';
    this.show('game'); if (Game.bossPhase === 'fight') Sound.playMusic(Game.phase2 ? (Game.stage.music2 || 'core') : 'boss', Game.phase2 ? 0 : (Game.stage.ch || 0) + 1); else Sound.playMusic(Game.stage.music, Game.stageIdx + 1);
  },

  /* ---------- Événements du moteur ---------- */
  handleEvents() {
    for (const ev of Game.events) {
      switch (ev.type) {
        case 'toast': this.toast(ev.text); break;
        case 'banner': this.banner(ev.text, ev.sub, ev.col); break;
        case 'go': this.banner('GO !', 'AVANCEZ', '#ffd34d'); break;
        case 'bossintro': this.bossIntro(ev.id); break;
        case 'bossko': this.banner('K.O. !', Game.boss ? Game.boss.name : '', '#ff3b4e'); haptic(120); break;
        case 'clear': setTimeout(() => this.onClear(), 200); break;
        case 'phase2': this.banner('PHASE 2', ev.text, '#ff3b5c'); haptic(150); break;
        case 'combobank': this.comboPop('+' + ev.pts.toLocaleString('fr-FR'), 'bank'); break;
        case 'combolost': this.comboPop('-' + ev.pts.toLocaleString('fr-FR'), 'lost'); break;
        case 'gameover': setTimeout(() => this.onGameOver(), 900); break;
        case 'convoy': this.updateConvoyHud(ev); break;
        case 'roadgoal': this.updateRoadGoal(ev); break;
        case 'garage': this.showCarlyGarage(ev.choices); break;
      }
    }
    Game.events.length = 0;
  },
  updateConvoyHud(ev) { let el=$('#convoyhud');if(!el){el=document.createElement('div');el.id='convoyhud';$('#hud').appendChild(el);}const pct=Math.max(0,Math.round(ev.hp/ev.max*100));el.innerHTML='<b>CONVOI</b><i><span style="width:'+pct+'%"></span></i><em>'+pct+'%</em>';el.classList.toggle('danger',pct<25); },
  updateRoadGoal(ev) { let el=$('#roadgoal');if(!el){el=document.createElement('div');el.id='roadgoal';$('#hud').appendChild(el);}el.textContent='OBJECTIF · '+ev.label+' '+ev.value+'/'+ev.need;el.classList.toggle('done',!!ev.done); },
  showCarlyGarage(choices) { const old=$('#carlygarage');if(old)old.remove();const el=document.createElement('div');el.id='carlygarage';el.innerHTML='<h2>GARAGE MOBILE — CARLY DOKOTA</h2><p>Choisissez une amélioration pour le convoi.</p><div></div>';const box=$('div',el);choices.forEach((c)=>{const b=document.createElement('button');b.innerHTML='<b>'+c.label+'</b><span>'+c.desc+'</span>';b.onclick=()=>{Game.chooseGarage(c.id);el.remove();};box.appendChild(b);});$('#hud').appendChild(el); },
  comboPop(t, cls) {
    const el = document.createElement('div'); el.className = 'cpop ' + cls; el.textContent = t;
    $('#hud').appendChild(el); setTimeout(() => el.remove(), 1300);
  },
  toast(t) {
    const el = $('#toast'); el.textContent = t; el.classList.add('on');
    clearTimeout(this._toastT); this._toastT = setTimeout(() => el.classList.remove('on'), 2200);
  },
  banner(t, sub, col) {
    const el = $('#banner'); $('b', el).textContent = t; $('span', el).textContent = sub || '';
    el.style.setProperty('--bc', col || '#ffd34d');
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  },
  bossIntro(id) {
    const B = BOSSES[id], c = $('#bosscard');
    $('img', c).src = 'assets/img/' + B.img + '.webp';
    const road = Game.stage && Game.stage.id === 'lubumbashi_unity' && id === 'joevally';
    $('.bc-title', c).textContent = road ? 'LE RIDER SOUS CONTRÔLE DE VAL INDUSTRIES' : B.title;
    $('.bc-name', c).textContent = road ? 'JOE-VALLY DÉCHU' : B.name;
    $('.bc-line', c).textContent = road ? 'LIBÉREZ-LE EN BRISANT LES BALISES' : (B.line || '');
    c.classList.add('on'); this.holdT = 2.8;
    $('#stagecard').classList.remove('on');
    Sound.sfx.bossIntro(); haptic(60);
  },

  /* ---------- HUD ---------- */
  hud() {
    const L = this.lastHud;
    Game.players.forEach((p, i) => {
      const card = $('#hud-p' + (i + 1));
      const hp = Math.max(0, p.hp / p.maxHp * 100), rec = Math.min(100, (p.hp + p.rec) / p.maxHp * 100);
      const key = [Math.round(hp), Math.round(rec), p.lives, p.stars, p.score, p.weapon && p.weapon.kind, p.out].join('|');
      if (L['p' + i] === key) return; L['p' + i] = key;
      $('.pc-hp', card).style.width = hp + '%';
      $('.pc-rec', card).style.width = rec + '%';
      $('.pc-bar', card).classList.toggle('low', hp < 25);
      $('.pc-score', card).textContent = p.score.toLocaleString('fr-FR');
      $('.pc-lives', card).textContent = p.out ? 'K.O.' : '×' + p.lives;
      $('.pc-stars', card).textContent = '★'.repeat(Math.min(p.stars, 5));
      $('.pc-weapon', card).textContent = p.weapon ? (WEAPONS[p.weapon.kind] ? WEAPONS[p.weapon.kind].label : '') : '';
      if (i === 0) { const sb = $('.tb-star'); $('em', sb).textContent = p.stars; sb.classList.toggle('empty', p.stars <= 0); }
    });
    // barre ennemie / boss
    const eb = $c('#enemybar');
    const boss = Game.boss && Game.bossPhase === 'fight' && !Game.boss.remove ? Game.boss : null;
    const f = boss || (Game.focusT > 0 && Game.focus && !Game.focus.remove ? Game.focus : null);
    if (f) {
      // barres empilées façon beat'em up moderne : une couche ≈ 120 PV
      const LAY = 120, COLS = ['#ff3b4e', '#ffb347', '#ffd34d', '#5dffb0', '#38e6ff', '#b46bff', '#ff4fd8'];
      const nL = boss ? Math.max(1, Math.ceil(f.maxHp / LAY)) : 1;
      const hp = Math.max(0, f.hp);
      const cur = nL > 1 ? Math.max(1, Math.ceil(hp / LAY)) : 1;
      const pc = nL > 1 ? (hp <= 0 ? 0 : (hp - (cur - 1) * LAY) / LAY * 100) : hp / f.maxHp * 100;
      const key = f.id + '|' + Math.round(pc) + '|' + cur;
      if (L.eb !== key) {
        const layerChanged = L.ebL !== f.id + '|' + cur;
        L.eb = key; L.ebL = f.id + '|' + cur;
        $('.eb-name b', eb).textContent = f.name;
        $('.eb-name span', eb).textContent = boss ? (f.roadJoe ? 'LIBÉRATION DU CONVOI' : (BOSSES[f.bossId] ? BOSSES[f.bossId].title : '')) : '';
        const hpEl = $('.eb-hp', eb), lag = $('.eb-lag', eb), bar = $('.eb-bar', eb);
        hpEl.style.width = pc + '%';
        if (layerChanged) { lag.style.transition = 'none'; lag.style.width = pc + '%'; void lag.offsetWidth; lag.style.transition = ''; } else lag.style.width = pc + '%';
        if (nL > 1) { hpEl.style.background = COLS[(cur - 1) % COLS.length]; bar.style.background = cur > 1 ? COLS[(cur - 2) % COLS.length] : '#1b0d12'; }
        else { hpEl.style.background = ''; bar.style.background = ''; }
        $('.eb-layers', eb).textContent = nL > 1 && cur > 1 ? '×' + cur : '';
      }
      eb.classList.add('on'); eb.classList.toggle('boss', !!boss);
    } else eb.classList.remove('on');
    // combo
    const p1 = Game.players.reduce((a, p) => (p.combo > (a ? a.combo : 0) ? p : a), null);
    const cb = $c('#combo');
    if (p1 && p1.combo >= 2) {
      if (L.combo !== p1.combo) { $('b', cb).textContent = p1.combo; cb.classList.remove('bump'); void cb.offsetWidth; cb.classList.add('bump'); L.combo = p1.combo; }
      const ptsKey = p1.comboPts | 0;
      if (L.cpts !== ptsKey) { $('.cb-pts', cb).textContent = ptsKey ? ptsKey.toLocaleString('fr-FR') : ''; L.cpts = ptsKey; }
      cb.classList.add('on'); cb.classList.toggle('hot', p1.combo >= 15);
    } else { cb.classList.remove('on'); L.combo = 0; }
    $c('#go').classList.toggle('on', Game.go > 0 && !Game.wave);
    // anneaux de recharge / disponibilité des boutons tactiles (façon Diablo mobile)
    const P = Game.players[0];
    const pickBtn = $c('#btn-pick');
    if (pickBtn) {
      const item = P && Game.nearestPickup(P);
      pickBtn.classList.toggle('available', !!item);
      pickBtn.title = item && WEAPONS[item.sub] ? 'Ramasser ' + WEAPONS[item.sub].label : 'Ramasser';
    }
    if (P) {
      const dcd = P.dashT > 0 ? 1 : P.dashCd > 0 ? P.dashCd / DASH_CD : 0;
      const dk = Math.round(dcd * 20);
      if (L.dcd !== dk) { L.dcd = dk; const d = $c('.tb-dash'); d.style.setProperty('--cd', dk / 20); d.classList.toggle('cd', dk > 0); }
      const low = P.hp <= 6 && !P.weapon;
      if (L.speLow !== low) { L.speLow = low; $c('.tb-spe').classList.toggle('low', low); }
      const par = P.parryT > 0;
      if (L.par !== par) { L.par = par; $c('#btn-zone').classList.toggle('parry', par); }
    }
    // manette en jeu : on masque les commandes tactiles
    const padMode = Input.source === 'pad';
    if (L.padMode !== padMode) { L.padMode = padMode; document.body.classList.toggle('padmode', padMode); }
  },

  /* ---------- Commandes tactiles ---------- */
  touchControls() {
    const zone = $('#stick-zone'), base = $('#stick-base'), knob = $('#stick-knob');
    let sid = null, cx = 0, cy = 0, home = null;
    const R0 = () => base.offsetWidth * 0.42;
    const setKnob = (dx, dy) => { knob.style.transform = `translate(${dx}px, ${dy}px)`; };
    zone.addEventListener('pointerdown', (e) => {
      if (sid !== null) return;
      sid = e.pointerId; zone.setPointerCapture(e.pointerId); zone.classList.add('active');
      const zr = zone.getBoundingClientRect();
      // joystick flottant : la base se place sous le doigt
      cx = clamp(e.clientX, zr.left + R0(), zr.right - R0()); cy = clamp(e.clientY, zr.top + R0(), zr.bottom - R0());
      base.style.left = (cx - zr.left) + 'px'; base.style.top = (cy - zr.top) + 'px';
      Input.source = 'touch'; move(e);
      e.preventDefault();
    });
    const move = (e) => {
      if (e.pointerId !== sid) return;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const d = Math.hypot(dx, dy), r = R0();
      if (d > r) { dx *= r / d; dy *= r / d; }
      setKnob(dx, dy);
      const nx = dx / r, ny = dy / r;
      // courbe de réponse « arcade » : pleine vitesse dès 45 % d'inclinaison
      const curve = (v, dz) => { const a = Math.abs(v); if (a < dz) return 0; return Math.sign(v) * (a >= 0.45 ? 1 : 0.6 + 0.4 * (a - dz) / (0.45 - dz)); };
      Input.touch.mx = curve(nx, 0.2);
      Input.touch.my = curve(ny, 0.28);
    };
    const end = (e) => {
      if (e.pointerId !== sid) return;
      sid = null; zone.classList.remove('active'); setKnob(0, 0);
      Input.touch.mx = 0; Input.touch.my = 0;
      base.style.left = ''; base.style.top = '';
    };
    zone.addEventListener('pointermove', move);
    zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
    $$('.tb, #btn-pick').forEach((b) => {
      const k = b.dataset.b; const ids = new Set();
      const down = (e) => { e.preventDefault(); ids.add(e.pointerId); b.setPointerCapture(e.pointerId); Input.touch[k] = true; b.classList.add('on'); Input.source = 'touch'; haptic(8); };
      const up = (e) => { ids.delete(e.pointerId); if (!ids.size) { Input.touch[k] = false; b.classList.remove('on'); } };
      b.addEventListener('pointerdown', down);
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
      b.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  },

  /* ---------- Boucle ---------- */
  acc: 0, lastT: 0,
  tick(dt) {
    // dt en secondes ; simulation à pas fixe
    if (this.screen === 'over') {
      this.overT -= dt;
      $('#count').textContent = Math.max(0, Math.floor(this.overT));
      if (this.overT <= 0) { this.overT = 999; this.toMenu(); }
    }
    const playing = this.screen === 'game' && !this.paused && Game.state === 'play';
    if (playing && this.holdT > 0) {
      this.holdT -= dt;
      if (this.holdT <= 0) $('#bosscard').classList.remove('on');
      Input.poll(performance.now() / 1000);
      return;
    }
    if (!playing) { this.acc = 0; return; }
    this.acc += Math.min(dt, 0.1);
    let first = true;
    while (this.acc >= TICK) {
      if (first) Input.poll(performance.now() / 1000);
      else for (const p of Input.players) for (const k in p.pressed) p.pressed[k] = false;
      if (Input.players[0].pressed.pause) { this.pause(); this.acc = 0; break; }
      Game.savePrev();
      Game.step(TICK);
      this.handleEvents();
      this.acc -= TICK; first = false;
      if (Game.state !== 'play') { this.acc = 0; break; }
    }
  },
  // mesure de la fréquence réelle (affichée dans Options > Performances, et via __gl.UI.fps)
  perf(dt) {
    this._fa = (this._fa || 0) + dt; this._fn = (this._fn || 0) + 1;
    if (this._fa >= 1) { this.fps = Math.round(this._fn / this._fa); this._fa = 0; this._fn = 0; const el = document.getElementById('fps'); if (el && Settings.showFps) el.textContent = this.fps + ' FPS'; }
  },
  // résolution dynamique : si la moyenne passe sous ~85 % de l'objectif pendant 2 s, on baisse le rendu ; on remonte si tout va bien
  dynRes(dt) {
    if (!Settings.dynres || this.screen !== 'game' || this.paused) { this._dA = 0; this._dN = 0; return; }
    this._dA = (this._dA || 0) + dt; this._dN = (this._dN || 0) + 1;
    if (this._dA < 2) return;
    const fps = this._dN / this._dA; this._dA = 0; this._dN = 0;
    const target = Settings.fpscap || 60;
    const cur = R.dyn || 1;
    let nx = cur;
    if (fps < target * 0.85 && cur > 0.6) nx = Math.max(0.6, cur - 0.15);
    else if (fps > target * 0.97 && cur < 1) nx = Math.min(1, cur + 0.1);
    if (nx !== cur) { R.dyn = nx; R.resize(); }
  },
  loop() {
    const f = (now) => {
      // limite d'images par seconde (30 / 60 / 120) ; « Max » suit la fréquence de l'écran
      const cap = Settings.fpscap | 0;
      if (cap && this.lastT && now - this.lastT < 1000 / cap - 1.5) { requestAnimationFrame(f); return; }
      const dt = this.lastT ? (now - this.lastT) / 1000 : TICK;
      this.lastT = now;
      if (typeof PadUI !== 'undefined') PadUI.frame(now);
      if (!window.__manual) {
        this.tick(dt);
        if (Game.stage) {
          const interp = Game.state === 'play' && !this.paused && Game.applyInterp(this.acc / TICK);
          try { R.draw(Math.min(dt, 0.05)); } finally { if (interp) Game.restoreInterp(); }
          this.hud();
        }
        this.perf(dt);
        this.dynRes(dt);
      }
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  },
};

/* ---------- Crochets de test ---------- */
window.render_game_to_text = () => JSON.stringify(Game.stage ? Game.snapshot() : { screen: UI.screen });
window.advanceTime = (ms) => {
  window.__manual = true;
  const n = Math.max(1, Math.round(ms / (1000 * TICK)));
  for (let i = 0; i < n; i++) UI.tick(TICK);
  if (Game.stage) { R.draw(TICK); UI.hud(); }
  window.__manual = false;
};
window.__gl = { Game, Input, UI, R, Settings, Progress, FX };

UI.init();
