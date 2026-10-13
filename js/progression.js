/* =========================================================
   GHOSTLINK V26.2 — progression & records v3
   Extension NON DESTRUCTRICE : conserve v12.progress et v12.settings.
   Sauvegarde distincte : v12.recordsV3.
   ========================================================= */
'use strict';
const Records = (() => {
  const VERSION = 3;
  const VALID_RANKS = ['D', 'C', 'B', 'A', 'S'];
  const MEDAL_LABELS = Object.freeze({
    NO_DAMAGE: 'Intouchable', SPEEDRUN: 'Chrono', COMBO_MASTER: 'Maître combo',
    CONVOY_75: 'Convoi 75 %', ROAD_OBJECTIVE: 'Mission accomplie',
    PERFECT_CLEAR: 'Sans faute'
  });
  const positive = (n) => Number.isFinite(Number(n)) ? Math.max(0, Number(n)) : 0;
  const finiteMin = (a, b) => a == null ? b : Math.min(a, b);
  const rankIndex = (r) => VALID_RANKS.indexOf(r);
  const known = new Set(STAGES.map((s) => s.id));
  const stored = Store.get('recordsV3', null);
  const state = { version: VERSION, levels: Object.create(null) };

  function cleanLevel(rec) {
    const r = rec && typeof rec === 'object' && !Array.isArray(rec) ? rec : {};
    const bestRank = VALID_RANKS.includes(r.bestRank) ? r.bestRank : null;
    return {
      cleared: !!r.cleared, attempts: Math.floor(positive(r.attempts)), clears: Math.floor(positive(r.clears)),
      bestRank, bestScore: r.bestScore == null ? null : positive(r.bestScore),
      bestTimeMs: r.bestTimeMs == null || positive(r.bestTimeMs) === 0 ? null : positive(r.bestTimeMs),
      bestCombo: Math.floor(positive(r.bestCombo)), minDamage: r.minDamage == null ? null : positive(r.minDamage),
      bestConvoyPct: r.bestConvoyPct == null ? null : clamp(positive(r.bestConvoyPct), 0, 100),
      medals: Array.isArray(r.medals) ? [...new Set(r.medals.filter((m) => typeof m === 'string' && MEDAL_LABELS[m]))] : [],
      lastRunId: typeof r.lastRunId === 'string' ? r.lastRunId.slice(0, 100) : null
    };
  }
  // Migration additive. Une ancienne médaille S ne permet pas d'inventer un temps/score.
  if (stored && stored.version === VERSION && stored.levels && typeof stored.levels === 'object') {
    for (const stage of STAGES) if (Object.prototype.hasOwnProperty.call(stored.levels, stage.id)) {
      state.levels[stage.id] = cleanLevel(stored.levels[stage.id]);
    }
  }
  for (const stage of STAGES) {
    const rank = Progress.ranks && Progress.ranks[stage.id];
    if (VALID_RANKS.includes(rank)) {
      const rec = state.levels[stage.id] || cleanLevel({});
      rec.cleared = true;
      if (!rec.bestRank || rankIndex(rank) > rankIndex(rec.bestRank)) rec.bestRank = rank;
      state.levels[stage.id] = rec;
    }
  }
  function persist() {
    // Copie simple sérialisable, limite à 30 niveaux connus.
    const levels = {};
    for (const s of STAGES) if (state.levels[s.id]) levels[s.id] = state.levels[s.id];
    Store.set('recordsV3', {version: VERSION, levels});
  }
  function get(id) {
    if (!known.has(id)) return null;
    return state.levels[id] ? cleanLevel(state.levels[id]) : null;
  }
  function start(id) {
    if (!known.has(id)) return;
    const r = state.levels[id] || cleanLevel({});
    r.attempts++;
    state.levels[id] = r;
    persist();
  }
  function award(input, stage) {
    const medals = [];
    if (input.damageTaken === 0) medals.push('NO_DAMAGE');
    if (input.timeMs > 0 && input.timeMs <= (Number(stage.parTimeMs) || 240000)) medals.push('SPEEDRUN');
    if (input.combo >= 8) medals.push('COMBO_MASTER');
    if (stage.dlcRoad && input.convoyPct != null && input.convoyPct >= 75) medals.push('CONVOY_75');
    if (stage.dlcRoad && input.roadObjectiveDone === true) medals.push('ROAD_OBJECTIVE');
    if (input.damageTaken === 0 && (!stage.dlcRoad || (input.convoyPct >= 75 && input.roadObjectiveDone === true))) medals.push('PERFECT_CLEAR');
    return medals;
  }
  function clear(id, input) {
    if (!known.has(id) || !input || !VALID_RANKS.includes(input.rank) ||
        !Number.isFinite(input.score) || input.score < 0 ||
        !Number.isFinite(input.timeMs) || input.timeMs <= 0 ||
        !Number.isFinite(input.damageTaken) || input.damageTaken < 0 ||
        !Number.isFinite(input.combo) || input.combo < 0 ||
        (input.convoyPct != null && (!Number.isFinite(input.convoyPct) || input.convoyPct < 0 || input.convoyPct > 100))) return null;
    const stage = STAGES.find((s) => s.id === id);
    const r = state.levels[id] || cleanLevel({});
    // Empêche un résultat de niveau compté deux fois pour la même partie.
    const token = typeof input.runId === 'string' ? input.runId.slice(0, 100) : null;
    if (token && r.lastRunId === token) return { record: get(id), medalsEarned: [], improved: false, duplicate: true };
    const time = positive(input.timeMs), score = positive(input.score);
    const damage = positive(input.damageTaken), combo = Math.floor(positive(input.combo));
    const convoy = stage.dlcRoad && input.convoyPct != null ? clamp(positive(input.convoyPct), 0, 100) : null;
    const rank = VALID_RANKS.includes(input.rank) ? input.rank : 'D';
    const medals = award({ timeMs: time, score, damageTaken: damage, combo, convoyPct: convoy, roadObjectiveDone: input.roadObjectiveDone === true }, stage);
    const improved = r.bestScore == null || score > r.bestScore;
    r.cleared = true; r.clears++;
    if (!r.bestRank || rankIndex(rank) > rankIndex(r.bestRank)) r.bestRank = rank;
    r.bestScore = Math.max(r.bestScore || 0, score);
    if (time > 0) r.bestTimeMs = finiteMin(r.bestTimeMs, Math.round(time));
    r.bestCombo = Math.max(r.bestCombo, combo);
    r.minDamage = finiteMin(r.minDamage, damage);
    if (convoy != null) r.bestConvoyPct = Math.max(r.bestConvoyPct || 0, convoy);
    r.medals = [...new Set([...r.medals, ...medals])];
    r.lastRunId = token;
    state.levels[id] = r;
    persist();
    return {record: get(id), medalsEarned: medals, improved, duplicate: false};
  }
  function summary() {
    const records = STAGES.map((s) => ({stage: s, record: get(s.id)}));
    return {
      clearedMain: records.filter((x) => !x.stage.dlc && x.record && x.record.cleared).length,
      clearedRoad: records.filter((x) => x.stage.dlc && x.record && x.record.cleared).length,
      sRanks: records.filter((x) => x.record && x.record.bestRank === 'S').length,
      medals: records.reduce((n, x) => n + (x.record ? x.record.medals.length : 0), 0),
      attempts: records.reduce((n, x) => n + (x.record ? x.record.attempts : 0), 0),
      records
    };
  }
  function exportData() {
    const ranks = {};
    for (const stage of STAGES) if (VALID_RANKS.includes(Progress.ranks[stage.id])) ranks[stage.id] = Progress.ranks[stage.id];
    const levels = {};
    for (const stage of STAGES) if (state.levels[stage.id]) levels[stage.id] = cleanLevel(state.levels[stage.id]);
    return {kind:'GHOSTLINK_SAVE', version:VERSION, exportedAt:new Date().toISOString(),
      progress:{unlocked:Progress.unlocked, roadUnlocked:Progress.roadUnlocked, best:Progress.best,
        seenIntro:!!Progress.seenIntro, ranks}, records:{version:VERSION,levels}};
  }
  function mergeSave(data) {
    if (!data || data.kind !== 'GHOSTLINK_SAVE' || data.version !== VERSION || !data.progress ||
        !data.records || data.records.version !== VERSION || !data.records.levels ||
        typeof data.records.levels !== 'object') throw Error('Format de sauvegarde non reconnu');
    const from = data.progress;
    if (!from || typeof from !== 'object' || !from.ranks || typeof from.ranks !== 'object') throw Error('Progression invalide');
    const next = Object.create(null);
    for (const stage of STAGES) {
      const old = state.levels[stage.id] || cleanLevel({});
      const imported = Object.prototype.hasOwnProperty.call(data.records.levels,stage.id) ? cleanLevel(data.records.levels[stage.id]) : null;
      if (!imported && !state.levels[stage.id]) continue;
      if (!imported) {next[stage.id]=old; continue;}
      const combined = cleanLevel(old);
      combined.cleared = old.cleared || imported.cleared;
      // Maximum, pas somme, pour ne pas multiplier les comptes lors d'importations répétées.
      combined.attempts = Math.max(old.attempts, imported.attempts);
      combined.clears = Math.max(old.clears, imported.clears);
      if (imported.bestRank && (!combined.bestRank || rankIndex(imported.bestRank) > rankIndex(combined.bestRank))) combined.bestRank = imported.bestRank;
      combined.bestScore = old.bestScore == null ? imported.bestScore : imported.bestScore == null ? old.bestScore : Math.max(old.bestScore,imported.bestScore);
      combined.bestTimeMs = old.bestTimeMs == null ? imported.bestTimeMs : imported.bestTimeMs == null ? old.bestTimeMs : Math.min(old.bestTimeMs, imported.bestTimeMs);
      combined.bestCombo = Math.max(old.bestCombo,imported.bestCombo);
      combined.minDamage = old.minDamage == null ? imported.minDamage : imported.minDamage == null ? old.minDamage : Math.min(old.minDamage, imported.minDamage);
      combined.bestConvoyPct = old.bestConvoyPct == null ? imported.bestConvoyPct : imported.bestConvoyPct == null ? old.bestConvoyPct : Math.max(old.bestConvoyPct, imported.bestConvoyPct);
      combined.medals = [...new Set([...old.medals, ...imported.medals])];
      combined.lastRunId = null; // identifiants de tentative provenant d'un autre navigateur
      next[stage.id] = combined;
    }
    const rawRanks = {};
    for (const stage of STAGES) {
      const importedRank = from.ranks[stage.id];
      const oldRank = Progress.ranks[stage.id];
      const nextRank = VALID_RANKS.includes(importedRank) && (!VALID_RANKS.includes(oldRank) || rankIndex(importedRank) > rankIndex(oldRank)) ? importedRank : oldRank;
      if (VALID_RANKS.includes(nextRank)) rawRanks[stage.id] = nextRank;
      // Les rangs importés sont aussi répercutés sur le registre v3.
      if (VALID_RANKS.includes(nextRank)) {
        const r = next[stage.id] || cleanLevel({});r.cleared=true;
        if (!r.bestRank || rankIndex(nextRank) > rankIndex(r.bestRank)) r.bestRank=nextRank;
        next[stage.id]=r;
      }
    }
    Progress.unlocked = clamp(Math.max(positive(Progress.unlocked), positive(from.unlocked)), 1, 24);
    Progress.roadUnlocked = clamp(Math.max(positive(Progress.roadUnlocked), positive(from.roadUnlocked)), 0, 6);
    Progress.best = Math.max(positive(Progress.best), positive(from.best));
    Progress.seenIntro = !!Progress.seenIntro || !!from.seenIntro;
    Progress.ranks = rawRanks;
    for (const stage of STAGES) if (next[stage.id]) state.levels[stage.id] = next[stage.id];
    saveProgress(); persist();
    return summary();
  }
  return Object.freeze({VERSION, MEDAL_LABELS, get, start, clear, summary, exportData, mergeSave});
})();
