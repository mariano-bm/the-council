import { Router } from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

// Cada 5 puntos apostados = +1 de peso. Peso base de cada juego = 1.
const POINTS_PER_WEIGHT = 5;

async function buildGames() {
  const games = await query(`
    SELECT g.*, u.discord_name as added_by_name,
           COALESCE((SELECT SUM(points) FROM roulette_bets WHERE roulette_game_id = g.id), 0) as total_bet
    FROM roulette_games g
    LEFT JOIN users u ON g.added_by = u.id
    ORDER BY g.created_at
  `);
  // Peso efectivo + detalle de apuestas por usuario
  const result = [];
  for (const g of games.rows) {
    const bets = await query(`
      SELECT b.user_id, u.discord_name, u.avatar_url, SUM(b.points) as points
      FROM roulette_bets b JOIN users u ON b.user_id = u.id
      WHERE b.roulette_game_id = $1 GROUP BY b.user_id, u.discord_name, u.avatar_url
      ORDER BY points DESC
    `, [g.id]);
    const weight = 1 + Number(g.total_bet) / POINTS_PER_WEIGHT;
    result.push({ ...g, total_bet: Number(g.total_bet), weight, bets: bets.rows });
  }
  return result;
}

// Lista de juegos con pesos + chances
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const games = await buildGames();
    const totalWeight = games.reduce((s, g) => s + g.weight, 0) || 1;
    res.json({ games: games.map(g => ({ ...g, chance: +(g.weight / totalWeight * 100).toFixed(1) })), points_per_weight: POINTS_PER_WEIGHT });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Busca cover + appid en Steam por nombre (mejor match). Devuelve {} si no encuentra.
async function steamCoverByName(name) {
  try {
    const r = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(name)}&l=spanish&cc=AR`);
    const d = await r.json();
    const items = d.items || [];
    if (!items.length) return {};
    // Preferir match exacto de nombre; sino el primero
    const exact = items.find(i => i.name.toLowerCase().trim() === name.toLowerCase().trim());
    const pick = exact || items[0];
    return { cover_url: pick.tiny_image || null, steam_app_id: pick.id || null };
  } catch { return {}; }
}

// Agregar juego — si no viene cover, la busca en Steam por el nombre
router.post('/games', isAuthenticated, async (req, res) => {
  try {
    const { name } = req.body;
    let { cover_url, steam_app_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre obligatorio' });
    const dup = await query('SELECT id FROM roulette_games WHERE LOWER(name) = LOWER($1)', [name]);
    if (dup.rows.length) return res.status(409).json({ error: 'Ese juego ya está en la ruleta' });

    // Auto-completar foto desde Steam si no la trajo el front
    if (!cover_url) {
      const found = await steamCoverByName(name);
      cover_url = found.cover_url || null;
      steam_app_id = steam_app_id || found.steam_app_id || null;
    }

    await query('INSERT INTO roulette_games (name, cover_url, steam_app_id, added_by) VALUES ($1,$2,$3,$4)',
      [name, cover_url, steam_app_id || null, req.user.id]);
    res.status(201).json({ ok: true, cover_url });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Sacar juego (quien lo agregó o admin) — devuelve los puntos apostados? No: se pierden al sacar.
router.delete('/games/:id', isAuthenticated, async (req, res) => {
  try {
    const g = await query('SELECT * FROM roulette_games WHERE id = $1', [req.params.id]);
    if (!g.rows.length) return res.status(404).json({ error: 'No encontrado' });
    if (g.rows[0].added_by !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Solo quien lo agregó o un admin' });
    await query('DELETE FROM roulette_games WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Apostar puntos a un juego (inclina la balanza). Los puntos se GASTAN.
router.post('/games/:id/bet', isAuthenticated, async (req, res) => {
  try {
    const points = parseInt(req.body.points);
    if (!points || points < 1) return res.status(400).json({ error: 'Apostá al menos 1 punto' });

    const g = await query('SELECT * FROM roulette_games WHERE id = $1', [req.params.id]);
    if (!g.rows.length) return res.status(404).json({ error: 'Juego no encontrado' });

    const u = await query('SELECT recommender_points FROM users WHERE id = $1', [req.user.id]);
    if ((u.rows[0]?.recommender_points || 0) < points) return res.status(400).json({ error: 'No te alcanzan los puntos' });

    // Descontar puntos y registrar apuesta
    await query('UPDATE users SET recommender_points = recommender_points - $1, updated_at = NOW() WHERE id = $2', [points, req.user.id]);
    await query('INSERT INTO roulette_bets (roulette_game_id, user_id, points) VALUES ($1,$2,$3)', [req.params.id, req.user.id, points]);
    await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'roulette_bet', $2)`,
      [req.user.id, JSON.stringify({ game: g.rows[0].name, points })]);

    res.json({ message: `Apostaste ${points} puntos a ${g.rows[0].name}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Girar — resultado PONDERADO por peso, server-side (justo, no se puede trampear)
router.post('/spin', isAuthenticated, async (req, res) => {
  try {
    const games = await buildGames();
    if (games.length < 2) return res.status(400).json({ error: 'Necesitas al menos 2 juegos' });

    const totalWeight = games.reduce((s, g) => s + g.weight, 0);
    let roll = Math.random() * totalWeight;
    let winnerIdx = 0;
    for (let i = 0; i < games.length; i++) {
      roll -= games[i].weight;
      if (roll <= 0) { winnerIdx = i; break; }
    }
    const winner = games[winnerIdx];
    await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'roulette_spin', $2)`,
      [req.user.id, JSON.stringify({ winner: winner.name })]);

    // Devolvemos el índice ganador + el orden de juegos (para que el front anime a ese segmento)
    res.json({ winner_index: winnerIdx, winner: { id: winner.id, name: winner.name, cover_url: winner.cover_url }, game_ids: games.map(g => g.id) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reset (admin) — limpia juegos y apuestas. Los puntos apostados NO se devuelven.
router.post('/reset', isAdmin, async (req, res) => {
  try {
    await query('DELETE FROM roulette_games');
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
