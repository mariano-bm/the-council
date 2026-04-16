import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

// Search games — Steam + CheapShark in parallel (both free, no key)
router.get('/search', isAuthenticated, async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.status(400).json({ error: 'Minimo 2 caracteres' });

  // Launch both searches in parallel
  const [steamResults, cheapResults] = await Promise.all([
    searchSteam(q).catch(() => []),
    searchCheapShark(q).catch(() => []),
  ]);

  // Merge: Steam first, then CheapShark games not already in Steam results
  const steamIds = new Set(steamResults.map(g => g.steam_app_id).filter(Boolean));
  const uniqueCheap = cheapResults.filter(g => !g.steam_app_id || !steamIds.has(g.steam_app_id));
  const merged = [...steamResults, ...uniqueCheap].slice(0, 12);

  if (merged.length) return res.json(merged);

  // Fallback: local DB
  const local = query('SELECT * FROM games WHERE name LIKE ? LIMIT 10', [`%${q}%`]);
  res.json(local.rows.map(g => ({ ...g, source: 'local' })));
});

// Get deals/suggestions from CheapShark
router.get('/deals', isAuthenticated, async (req, res) => {
  try {
    const dealsRes = await fetch('https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=15&pageSize=12&sortBy=Deal%20Rating');
    const deals = await dealsRes.json();
    res.json(deals.map(d => ({
      name: d.title,
      steam_app_id: d.steamAppID ? parseInt(d.steamAppID) : null,
      cover_url: d.thumb?.replace('capsule_sm_120', 'header'),
      sale_price: `$${d.salePrice}`,
      normal_price: `$${d.normalPrice}`,
      discount: Math.round((1 - d.salePrice / d.normalPrice) * 100),
      metacritic: d.metacriticScore ? parseInt(d.metacriticScore) : null,
      deal_rating: parseFloat(d.dealRating),
      steam_rating: d.steamRatingPercent ? `${d.steamRatingPercent}%` : null,
    })));
  } catch (err) {
    res.json([]);
  }
});

async function searchSteam(q) {
  const steamRes = await fetch(
    `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=spanish&cc=AR`
  );
  const steamData = await steamRes.json();
  if (!steamData.items?.length) return [];

  return Promise.all(
    steamData.items.slice(0, 6).map(async (item) => {
      let genres = [], description = '';
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
        platforms: [item.platforms?.windows && 'PC', item.platforms?.mac && 'Mac', item.platforms?.linux && 'Linux'].filter(Boolean),
        price: item.price?.final ? `$${(item.price.final / 100).toFixed(2)}` : 'Free to Play',
        description,
      };
    })
  );
}

async function searchCheapShark(q) {
  const cheapRes = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(q)}&limit=8`);
  const cheapData = await cheapRes.json();
  if (!cheapData?.length) return [];

  return cheapData.map(game => ({
    source: 'cheapshark',
    steam_app_id: game.steamAppID ? parseInt(game.steamAppID) : null,
    name: game.external,
    cover_url: game.steamAppID
      ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamAppID}/header.jpg`
      : game.thumb,
    metacritic: null,
    genres: [],
    platforms: ['PC'],
    price: game.cheapest ? `$${game.cheapest}` : null,
    cheapest_deal: game.cheapestDealID || null,
  }));
}

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
