import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

// Search games — Steam Store API (no key needed)
router.get('/search', isAuthenticated, async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.status(400).json({ error: 'Minimo 2 caracteres' });

  try {
    // Steam store search (free, no API key)
    const steamRes = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=spanish&cc=AR`
    );
    const steamData = await steamRes.json();

    if (steamData.items?.length) {
      const results = await Promise.all(
        steamData.items.slice(0, 8).map(async (item) => {
          // Get details for each game
          let genres = [];
          let description = '';
          try {
            const detailRes = await fetch(
              `https://store.steampowered.com/api/appdetails?appids=${item.id}&l=spanish&cc=AR`
            );
            const detailData = await detailRes.json();
            const detail = detailData[item.id]?.data;
            if (detail) {
              genres = detail.genres?.map(g => g.description) || [];
              description = detail.short_description || '';
            }
          } catch {}

          return {
            source: 'steam',
            steam_app_id: item.id,
            name: item.name,
            cover_url: `https://cdn.cloudflare.steamstatic.com/steam/apps/${item.id}/header.jpg`,
            metacritic: item.metascore || null,
            genres,
            platforms: [
              item.platforms?.windows && 'PC',
              item.platforms?.mac && 'Mac',
              item.platforms?.linux && 'Linux',
            ].filter(Boolean),
            price: item.price?.final ? `$${(item.price.final / 100).toFixed(2)}` : 'Free to Play',
            description,
          };
        })
      );
      return res.json(results);
    }

    // Fallback: search local DB
    const local = query('SELECT * FROM games WHERE name LIKE ? LIMIT 10', [`%${q}%`]);
    res.json(local.rows.map(g => ({ ...g, source: 'local' })));
  } catch (err) {
    console.error('Game search error:', err.message);
    // Fallback local
    const local = query('SELECT * FROM games WHERE name LIKE ? LIMIT 10', [`%${q}%`]);
    res.json(local.rows.map(g => ({ ...g, source: 'local' })));
  }
});

router.post('/', isAuthenticated, (req, res) => {
  const { name, steam_app_id, cover_url, genres, platforms, metacritic, description, release_date } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre obligatorio' });

  if (steam_app_id) {
    const existing = query('SELECT * FROM games WHERE steam_app_id = ?', [steam_app_id]);
    if (existing.rows.length) return res.json(existing.rows[0]);
  }

  query('INSERT INTO games (name, steam_app_id, cover_url, genres, platforms, metacritic, description, release_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, steam_app_id || null, cover_url || null, JSON.stringify(genres || []), JSON.stringify(platforms || []), metacritic || null, description || null, release_date || null]);
  const created = query('SELECT * FROM games ORDER BY id DESC LIMIT 1');
  res.status(201).json(created.rows[0]);
});

router.get('/:id', isAuthenticated, (req, res) => {
  const game = query('SELECT * FROM games WHERE id = ?', [req.params.id]);
  if (!game.rows.length) return res.status(404).json({ error: 'Juego no encontrado' });
  res.json(game.rows[0]);
});

export default router;
