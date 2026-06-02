// API URL — defaults to Railway backend, can be overridden via URL param ?api=
const API_BASE = (() => {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('api');
  if (fromQuery) return fromQuery.replace(/\/$/, '');
  return 'https://the-council-production-1381.up.railway.app/api/brawlhalla';
})();

const $ = (id) => document.getElementById(id);

const els = {
  topBar: $('topBar'),
  matchBar: $('matchBar'),
  tournament: $('tournamentName'),
  round: $('roundLabel'),
  p1: {
    name: $('p1Name'),
    country: $('p1Country'), flagImg: $('p1FlagImg'),
    region: $('p1Region'),
    legend: $('p1Legend'), tier: $('p1Tier'), rating: $('p1Rating'),
    kd: $('p1Kd'),
    wr: $('p1Wr'), wrScope: $('p1WrScope'),
    score: $('p1Score'), pips: $('p1Pips')
  },
  p2: {
    name: $('p2Name'),
    country: $('p2Country'), flagImg: $('p2FlagImg'),
    region: $('p2Region'),
    legend: $('p2Legend'), tier: $('p2Tier'), rating: $('p2Rating'),
    kd: $('p2Kd'),
    wr: $('p2Wr'), wrScope: $('p2WrScope'),
    score: $('p2Score'), pips: $('p2Pips')
  },
  bo: $('boLabel')
};

const legendMap = { byName: new Map(), byId: new Map(), info: new Map() };

async function loadLegendCatalog() {
  try {
    const r = await fetch(`${API_BASE}/legends`);
    if (!r.ok) return;
    const list = await r.json();
    for (const l of list) {
      if (l.bio_name) legendMap.byName.set(l.bio_name.toLowerCase(), l.legend_id);
      if (l.legend_name) legendMap.byName.set(l.legend_name.toLowerCase(), l.legend_id);
      legendMap.byId.set(l.legend_id, l.bio_name || l.legend_name);
      legendMap.info.set(l.legend_id, {
        name: l.bio_name || l.legend_name || '',
        weapon_one: l.weapon_one || '',
        weapon_two: l.weapon_two || ''
      });
    }
    if (lastState) render(lastState);
  } catch (e) { console.warn('legend catalog failed', e); }
}

let lastState = null;

const statsCache = new Map();

async function loadStats(playerId) {
  if (!playerId || playerId === 0) return null;
  if (statsCache.has(playerId)) return statsCache.get(playerId);
  try {
    const [stats, ranked] = await Promise.all([
      fetch(`${API_BASE}/player/${playerId}/stats`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/player/${playerId}/ranked`).then(r => r.ok ? r.json() : null).catch(() => null)
    ]);
    const data = { stats, ranked };
    statsCache.set(playerId, data);
    setTimeout(() => statsCache.delete(playerId), 60_000);
    return data;
  } catch (e) {
    console.warn('stats load failed', e);
    return null;
  }
}

function sumLegendField(stats, field) {
  if (!stats || !Array.isArray(stats.legends)) return 0;
  let total = 0;
  for (const l of stats.legends) total += Number(l[field] || 0);
  return total;
}

function findLegendEntry(stats, legendName) {
  if (!stats || !Array.isArray(stats.legends) || !legendName) return null;
  const id = legendMap.byName.get(legendName.toLowerCase());
  if (!id) return null;
  return stats.legends.find(l => l.legend_id === id) || null;
}

function computeKd(stats, legendEntry) {
  if (legendEntry) {
    const k = Number(legendEntry.kos || 0);
    const f = Number(legendEntry.falls || 0);
    if (f === 0) return k > 0 ? k.toFixed(2) : '—';
    return (k / f).toFixed(2);
  }
  if (!stats) return '—';
  const kos = sumLegendField(stats, 'kos');
  const falls = sumLegendField(stats, 'falls');
  if (falls === 0) return kos > 0 ? kos.toFixed(2) : '—';
  return (kos / falls).toFixed(2);
}

function computeWinRate(stats, legendEntry) {
  if (legendEntry) {
    const g = Number(legendEntry.games || 0);
    if (g === 0) return '—';
    return Math.round((Number(legendEntry.wins || 0) / g) * 100) + '%';
  }
  if (!stats || !stats.games) return '—';
  return Math.round((Number(stats.wins) / Number(stats.games)) * 100) + '%';
}

function computeGames(stats, legendEntry) {
  if (legendEntry) return Number(legendEntry.games || 0);
  if (!stats) return 0;
  return Number(stats.games || 0);
}

function tierFromRating(rating) {
  if (rating == null || rating === '') return null;
  const r = Number(rating);
  if (r >= 2000) return 'Valhallan';
  if (r >= 1800) return 'Diamond';
  if (r >= 1600) return 'Platinum';
  if (r >= 1400) return 'Gold';
  if (r >= 1300) return 'Silver';
  if (r >= 1150) return 'Bronze';
  return 'Tin';
}

function setFlash(el, value) {
  if (el.textContent === String(value)) return;
  el.textContent = value;
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
}

function renderPips(rowEl, score, bestOf, who) {
  const need = Math.ceil(bestOf / 2);
  rowEl.innerHTML = '';
  for (let i = 0; i < need; i++) {
    const pip = document.createElement('div');
    pip.className = `score__pip score__pip--${who}` + (i < score ? ` score__pip--on` : '');
    rowEl.appendChild(pip);
  }
}

function applyTier(tierEl, subEl, rankedData) {
  if (!rankedData || rankedData.rating == null) {
    tierEl.textContent = 'UNRANKED';
    tierEl.setAttribute('data-tier', 'Unranked');
    if (subEl) subEl.textContent = '';
    return;
  }
  const tier = tierFromRating(rankedData.rating) || '—';
  tierEl.textContent = tier;
  tierEl.setAttribute('data-tier', tier);
  if (subEl) {
    const peak = rankedData.peak_rating && rankedData.peak_rating !== rankedData.rating
      ? `  ·  PEAK ${rankedData.peak_rating}`
      : '';
    subEl.textContent = `${rankedData.rating}${peak}`;
  }
}

function renderPlayer(side, p, statsBundle) {
  const e = els[side];
  setFlash(e.name, (p.display_name || '').toUpperCase());

  e.country.textContent = (p.country || '').toUpperCase();
  const flagCode = (p.country_code || '').toLowerCase();
  if (flagCode) {
    e.flagImg.src = `https://flagcdn.com/w80/${flagCode}.png`;
    e.flagImg.alt = flagCode;
  } else {
    e.flagImg.removeAttribute('src');
    e.flagImg.alt = '';
  }

  const region = statsBundle?.ranked?.region || '';
  e.region.textContent = region.toUpperCase();

  setFlash(e.legend, (p.legend || '—').toUpperCase());

  if (statsBundle) {
    applyTier(e.tier, e.rating, statsBundle.ranked);
    const legendEntry = findLegendEntry(statsBundle.stats, p.legend);
    e.kd.textContent = computeKd(statsBundle.stats, legendEntry);
    e.wr.textContent = computeWinRate(statsBundle.stats, legendEntry);
    const games = computeGames(statsBundle.stats, legendEntry);
    const scopeLabel = legendEntry
      ? `${(p.legend || '').toUpperCase()} · ${games} partidas`
      : `${games} partidas`;
    e.wrScope.textContent = scopeLabel;
    e.wrScope.classList.toggle('stat__sub--legend', !!legendEntry);
  } else {
    e.tier.textContent = '—';
    e.tier.setAttribute('data-tier', '—');
    e.rating.textContent = '';
    e.kd.textContent = '—';
    e.wr.textContent = '—';
    e.wrScope.textContent = '';
  }
}

function renderPartner(side, p) {
  const id = side === 'p1' ? 'p1b' : 'p2b';
  const nameEl = document.getElementById(`${id}Name`);
  const legendEl = document.getElementById(`${id}Legend`);
  const flagImg = document.getElementById(`${id}FlagImg`);
  const countryEl = document.getElementById(`${id}Country`);
  nameEl.textContent = (p?.display_name || '').toUpperCase();
  legendEl.textContent = (p?.legend || '').toUpperCase();
  countryEl.textContent = (p?.country || '').toUpperCase();
  const code = (p?.country_code || '').toLowerCase();
  if (code) { flagImg.src = `https://flagcdn.com/w80/${code}.png`; }
  else { flagImg.removeAttribute('src'); }
}

async function render(state) {
  lastState = state;
  els.tournament.textContent = (state.tournament?.name || '').toUpperCase();
  const bo = state.tournament?.best_of || 5;
  const mode = state.mode || '1v1';
  els.matchBar.dataset.mode = mode;
  els.round.textContent = `${(state.tournament?.round || '').toUpperCase()} · BO${bo} · ${mode.toUpperCase()}`;
  els.bo.textContent = `BEST OF ${bo}`;

  const [s1, s2] = await Promise.all([
    loadStats(state.players.p1.brawlhalla_id),
    loadStats(state.players.p2.brawlhalla_id)
  ]);

  renderPlayer('p1', state.players.p1, s1);
  renderPlayer('p2', state.players.p2, s2);

  if (mode === '2v2') {
    renderPartner('p1', state.players.p1b);
    renderPartner('p2', state.players.p2b);
  }

  els.p1.score.textContent = state.players.p1.score;
  els.p2.score.textContent = state.players.p2.score;
  renderPips(els.p1.pips, state.players.p1.score, bo, 'p1');
  renderPips(els.p2.pips, state.players.p2.score, bo, 'p2');

  els.matchBar.classList.toggle('hidden', !state.match_visible);
  els.topBar.classList.toggle('hidden', !state.match_visible);

  renderPostgame(state, s1, s2);
}

function fmtNum(n) {
  const v = Number(n || 0);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return String(v);
}

function fmtTime(seconds) {
  const s = Number(seconds || 0);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function renderTopLegends(listEl, stats) {
  if (!stats || !Array.isArray(stats.legends) || stats.legends.length === 0) {
    listEl.innerHTML = '<div class="postgame__top-row"><span class="postgame__top-rank">—</span><span class="postgame__top-name">SIN DATOS</span><span></span><span></span><span></span></div>';
    return;
  }
  const top = [...stats.legends]
    .filter(l => Number(l.games || 0) > 0)
    .sort((a, b) => Number(b.games || 0) - Number(a.games || 0))
    .slice(0, 3);
  if (top.length === 0) { listEl.innerHTML = ''; return; }
  listEl.innerHTML = top.map((l, i) => {
    const info = legendMap.info.get(l.legend_id);
    const name = (info?.name || `Legend ${l.legend_id}`).toUpperCase();
    const games = Number(l.games || 0);
    const wins = Number(l.wins || 0);
    const wr = games ? Math.round((wins / games) * 100) : 0;
    const kd = Number(l.falls || 0) > 0
      ? (Number(l.kos || 0) / Number(l.falls || 0)).toFixed(2)
      : Number(l.kos || 0).toFixed(2);
    return `
      <div class="postgame__top-row">
        <span class="postgame__top-rank">#${i + 1}</span>
        <span class="postgame__top-name">${name}</span>
        <span class="postgame__top-stat">GAMES <b>${games}</b></span>
        <span class="postgame__top-stat">WR <b>${wr}%</b></span>
        <span class="postgame__top-stat">K/D <b>${kd}</b></span>
      </div>
    `;
  }).join('');
}

function renderWeapon(el, name, kos, dmg, time) {
  if (!name) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <span class="postgame__weapon-name">${name}</span>
    <span class="postgame__weapon-spacer"></span>
    <span class="postgame__weapon-stat">KOs <b>${fmtNum(kos)}</b></span>
    <span class="postgame__weapon-stat">DMG <b>${fmtNum(dmg)}</b></span>
  `;
}

function renderPostgameSide(side, p, statsBundle) {
  const $w = (id) => document.getElementById(id);
  $w(`pg${side === 'p1' ? '1' : '2'}Name`).textContent = (p.display_name || '').toUpperCase();

  const flagCode = (p.country_code || '').toLowerCase();
  const flagEl = $w(`pg${side === 'p1' ? '1' : '2'}Flag`);
  if (flagCode) flagEl.src = `https://flagcdn.com/w80/${flagCode}.png`;
  else flagEl.removeAttribute('src');

  $w(`pg${side === 'p1' ? '1' : '2'}Country`).textContent = (p.country || '').toUpperCase();

  const tierEl = $w(`pg${side === 'p1' ? '1' : '2'}Tier`);
  const r = statsBundle?.ranked;
  if (r?.rating != null) {
    tierEl.textContent = `${tierFromRating(r.rating)} ${r.rating}`;
  } else { tierEl.textContent = ''; }

  const legendEntry = findLegendEntry(statsBundle?.stats, p.legend);
  const info = legendEntry ? legendMap.info.get(legendEntry.legend_id) : null;
  const legendName = info?.name || p.legend || '—';

  $w(`pg${side === 'p1' ? '1' : '2'}Legend`).textContent = legendName.toUpperCase();

  const statsEl = $w(`pg${side === 'p1' ? '1' : '2'}Stats`);
  const w1 = $w(`pg${side === 'p1' ? '1' : '2'}Weapon1`);
  const w2 = $w(`pg${side === 'p1' ? '1' : '2'}Weapon2`);

  const topListEl = document.getElementById(`pg${side === 'p1' ? '1' : '2'}TopLegends`);

  if (!legendEntry) {
    statsEl.innerHTML = `
      <div class="pg-row"><span class="pg-row__label">Sin datos</span><span class="pg-row__value">—</span></div>
      <div class="pg-row"><span class="pg-row__label">Elegí la legend en el control</span><span class="pg-row__value">—</span></div>
    `;
    $w(`pg${side === 'p1' ? '1' : '2'}LegendMeta`).textContent = '';
    w1.innerHTML = ''; w2.innerHTML = '';
    renderTopLegends(topListEl, statsBundle?.stats);
    return;
  }

  const games = Number(legendEntry.games || 0);
  const wins = Number(legendEntry.wins || 0);
  const wr = games ? Math.round((wins / games) * 100) : 0;
  $w(`pg${side === 'p1' ? '1' : '2'}LegendMeta`).textContent = `${games} partidas · ${wr}% WR`;

  const rows = [
    ['KOs',          fmtNum(legendEntry.kos)],
    ['Caídas',       fmtNum(legendEntry.falls)],
    ['Suicidios',    fmtNum(legendEntry.suicides)],
    ['Daño infligido', fmtNum(legendEntry.damage_dealt)],
    ['Daño recibido',  fmtNum(legendEntry.damage_taken)],
    ['Tiempo en juego', fmtTime(legendEntry.match_time)],
  ];
  statsEl.innerHTML = rows.map(([l, v]) =>
    `<div class="pg-row"><span class="pg-row__label">${l}</span><span class="pg-row__value">${v}</span></div>`
  ).join('');

  renderWeapon(w1, info?.weapon_one, legendEntry.ko_weapon_one, legendEntry.damage_weapon_one, legendEntry.time_held_weapon_one);
  renderWeapon(w2, info?.weapon_two, legendEntry.ko_weapon_two, legendEntry.damage_weapon_two, legendEntry.time_held_weapon_two);

  renderTopLegends(topListEl, statsBundle?.stats);
}

function computeWinProb(s1, s2, p1Legend, p2Legend) {
  const r1 = Number(s1?.ranked?.rating);
  const r2 = Number(s2?.ranked?.rating);
  const wr1 = (() => {
    const le = findLegendEntry(s1?.stats, p1Legend);
    if (le && le.games > 0) return le.wins / le.games;
    if (s1?.stats?.games > 0) return s1.stats.wins / s1.stats.games;
    return null;
  })();
  const wr2 = (() => {
    const le = findLegendEntry(s2?.stats, p2Legend);
    if (le && le.games > 0) return le.wins / le.games;
    if (s2?.stats?.games > 0) return s2.stats.wins / s2.stats.games;
    return null;
  })();

  if (Number.isFinite(r1) && Number.isFinite(r2)) {
    const e1 = 1 / (1 + Math.pow(10, (r2 - r1) / 400));
    return { p1: e1, p2: 1 - e1, basis: `Elo · ${Math.round(r1)} vs ${Math.round(r2)}` };
  }
  if (wr1 != null && wr2 != null) {
    const tot = wr1 + wr2;
    if (tot > 0) return { p1: wr1 / tot, p2: wr2 / tot, basis: `winrate ranked (${Math.round(wr1 * 100)}% vs ${Math.round(wr2 * 100)}%)` };
  }
  return { p1: 0.5, p2: 0.5, basis: 'sin datos suficientes' };
}

function renderWinProb(state, s1, s2) {
  const { p1, p2, basis } = computeWinProb(s1, s2, state.players.p1.legend, state.players.p2.legend);
  const p1Pct = Math.round(p1 * 100);
  const p2Pct = 100 - p1Pct;
  document.getElementById('winprobP1Name').textContent = (state.players.p1.display_name || 'P1').toUpperCase();
  document.getElementById('winprobP2Name').textContent = (state.players.p2.display_name || 'P2').toUpperCase();
  document.getElementById('winprobP1Pct').textContent = `${p1Pct}%`;
  document.getElementById('winprobP2Pct').textContent = `${p2Pct}%`;
  document.getElementById('winprobP1').style.flex = `${Math.max(p1Pct, 12)} 0 0`;
  document.getElementById('winprobP2').style.flex = `${Math.max(p2Pct, 12)} 0 0`;
  document.getElementById('winprobBasis').textContent = basis;
}

function renderPostgame(state, s1, s2) {
  const root = document.getElementById('postgame');
  if (!root) return;
  root.classList.toggle('hidden', !state.postgame_visible);
  if (!state.postgame_visible) return;
  renderWinProb(state, s1, s2);
  renderPostgameSide('p1', state.players.p1, s1);
  renderPostgameSide('p2', state.players.p2, s2);
}

function connect() {
  const es = new EventSource(`${API_BASE}/events`);
  es.onmessage = (ev) => {
    try {
      const state = JSON.parse(ev.data);
      render(state);
    } catch (_) {}
  };
  es.onerror = () => {
    es.close();
    setTimeout(connect, 1500);
  };
}

loadLegendCatalog();
connect();
