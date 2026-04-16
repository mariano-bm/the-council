import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

router.get('/search', isAuthenticated, async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.status(400).json({ error: 'Minimo 2 caracteres' });
  // Search local DB first
  const local = query('SELECT * FROM games WHERE name LIKE ? LIMIT 10', [`%${q}%`]);
  if (local.rows.length) return res.json(local.rows);
  // Fallback: return empty (RAWG/Steam need API keys)
  res.json([]);
});

router.post('/', isAuthenticated, (req, res) => {
  const { name, steam_app_id, rawg_slug, cover_url, genres, platforms, metacritic, description, release_date } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre obligatorio' });

  if (steam_app_id) {
    const existing = query('SELECT * FROM games WHERE steam_app_id = ?', [steam_app_id]);
    if (existing.rows.length) return res.json(existing.rows[0]);
  }

  query('INSERT INTO games (name, steam_app_id, rawg_slug, cover_url, genres, platforms, metacritic, description, release_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, steam_app_id || null, rawg_slug || null, cover_url || null, JSON.stringify(genres || []), JSON.stringify(platforms || []), metacritic || null, description || null, release_date || null]);
  const created = query('SELECT * FROM games ORDER BY id DESC LIMIT 1');
  res.status(201).json(created.rows[0]);
});

router.get('/:id', isAuthenticated, (req, res) => {
  const game = query('SELECT * FROM games WHERE id = ?', [req.params.id]);
  if (!game.rows.length) return res.status(404).json({ error: 'Juego no encontrado' });
  res.json(game.rows[0]);
});

export default router;
