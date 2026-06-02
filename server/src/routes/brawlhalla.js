import { Router } from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import { query } from '../config/database.js';
import { cachedGet, getPlayerStats, getPlayerRanked, getAllLegends } from '../services/brawlhallaApi.js';

const router = Router();

// ============================================
// STATE (broadcast via SSE)
// ============================================

const DEFAULT_STATE = {
  tournament: { name: 'BRAWLHALLA TOURNAMENT', round: 'GRAND FINAL', best_of: 5 },
  mode: '1v1',
  players: {
    p1: { brawlhalla_id: 0, display_name: 'PLAYER 1', country: 'ARG', country_code: 'ar', score: 0, legend: '', legend_id: null },
    p1b: { brawlhalla_id: 0, display_name: '', country: '', country_code: '', score: 0, legend: '', legend_id: null },
    p2: { brawlhalla_id: 0, display_name: 'PLAYER 2', country: 'ARG', country_code: 'ar', score: 0, legend: '', legend_id: null },
    p2b: { brawlhalla_id: 0, display_name: '', country: '', country_code: '', score: 0, legend: '', legend_id: null },
  },
  match_visible: true,
  stats_visible: true,
  postgame_visible: false,
};

let currentState = null;
const sseClients = new Set();

async function loadState() {
  if (currentState) return currentState;
  try {
    const r = await query('SELECT state FROM brawlhalla_state WHERE id = 1');
    currentState = r.rows[0]?.state || JSON.parse(JSON.stringify(DEFAULT_STATE));
  } catch {
    currentState = JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
  return currentState;
}

async function persistState() {
  try {
    await query(
      `INSERT INTO brawlhalla_state (id, state, updated_at) VALUES (1, $1, NOW())
       ON CONFLICT (id) DO UPDATE SET state = $1, updated_at = NOW()`,
      [JSON.stringify(currentState)]
    );
  } catch (e) {
    console.error('Failed to persist brawlhalla state:', e.message);
  }
}

function broadcast() {
  const payload = `data: ${JSON.stringify(currentState)}\n\n`;
  for (const res of sseClients) {
    try { res.write(payload); } catch {}
  }
}

// Initialize state on first request
await loadState();

// ============================================
// PUBLIC ENDPOINTS (no auth for overlay)
// ============================================

// SSE stream — overlay subscribes here, no auth (it's local to OBS or public stream)
router.get('/events', async (req, res) => {
  await loadState();
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.flushHeaders();
  res.write(`data: ${JSON.stringify(currentState)}\n\n`);
  sseClients.add(res);

  // Keep-alive ping every 25s
  const ping = setInterval(() => {
    try { res.write(': ping\n\n'); } catch {}
  }, 25000);

  req.on('close', () => {
    clearInterval(ping);
    sseClients.delete(res);
  });
});

// Get current state (no auth — overlay needs it on load)
router.get('/state', async (req, res) => {
  await loadState();
  res.json(currentState);
});

// Player stats — no auth, overlay needs them
router.get('/player/:id/stats', async (req, res) => {
  try {
    const data = await getPlayerStats(req.params.id);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/player/:id/ranked', async (req, res) => {
  try {
    const data = await getPlayerRanked(req.params.id);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/legends', async (req, res) => {
  try {
    const all = await getAllLegends();
    res.json(all);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================
// CONTROL ENDPOINTS (require auth)
// ============================================

// Update state — only authenticated (typically admin from control panel)
router.post('/state', isAuthenticated, async (req, res) => {
  await loadState();

  Object.assign(currentState.tournament, req.body.tournament || {});
  if (req.body.mode === '1v1' || req.body.mode === '2v2') currentState.mode = req.body.mode;
  if (req.body.players) {
    for (const k of ['p1', 'p1b', 'p2', 'p2b']) {
      if (req.body.players[k]) {
        Object.assign(currentState.players[k], req.body.players[k]);
      }
    }
  }
  if (typeof req.body.match_visible === 'boolean') currentState.match_visible = req.body.match_visible;
  if (typeof req.body.stats_visible === 'boolean') currentState.stats_visible = req.body.stats_visible;
  if (typeof req.body.postgame_visible === 'boolean') currentState.postgame_visible = req.body.postgame_visible;

  broadcast();
  persistState();
  res.json(currentState);
});

// Reset state to defaults
router.post('/state/reset', isAuthenticated, async (req, res) => {
  currentState = JSON.parse(JSON.stringify(DEFAULT_STATE));
  broadcast();
  persistState();
  res.json(currentState);
});

// ============================================
// ROSTER (DB-backed, can link to Council users)
// ============================================

router.get('/roster', isAuthenticated, async (req, res) => {
  const r = await query(`
    SELECT br.*, u.discord_name, u.avatar_url
    FROM brawlhalla_roster br
    LEFT JOIN users u ON br.user_id = u.id
    ORDER BY br.name
  `);
  res.json({ players: r.rows });
});

router.post('/roster', isAuthenticated, async (req, res) => {
  const { name, brawlhalla_id, country_code, user_id } = req.body || {};
  if (!name || !brawlhalla_id) return res.status(400).json({ error: 'name y brawlhalla_id requeridos' });

  const id = Number(brawlhalla_id);
  await query(
    `INSERT INTO brawlhalla_roster (name, brawlhalla_id, country_code, user_id) VALUES ($1, $2, $3, $4)
     ON CONFLICT (brawlhalla_id) DO UPDATE SET name = $1, country_code = $3, user_id = $4`,
    [String(name).trim(), id, country_code || 'ar', user_id || null]
  );

  const r = await query('SELECT * FROM brawlhalla_roster ORDER BY name');
  res.json({ players: r.rows });
});

router.delete('/roster/:id', isAdmin, async (req, res) => {
  await query('DELETE FROM brawlhalla_roster WHERE brawlhalla_id = $1', [Number(req.params.id)]);
  const r = await query('SELECT * FROM brawlhalla_roster ORDER BY name');
  res.json({ players: r.rows });
});

export default router;
