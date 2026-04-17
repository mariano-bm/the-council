import { Router } from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

// Get all council games with guide count
router.get('/', isAuthenticated, async (req, res) => {
  const games = await query(`
    SELECT cg.*, u.discord_name as added_by_name,
           (SELECT COUNT(*) FROM game_guides WHERE council_game_id = cg.id) as guide_count
    FROM council_games cg
    LEFT JOIN users u ON cg.added_by = u.id
    ORDER BY cg.name
  `);
  res.json(games.rows);
});

// Get single game with all guides
router.get('/:id', isAuthenticated, async (req, res) => {
  const game = await query('SELECT * FROM council_games WHERE id = $1', [req.params.id]);
  if (!game.rows.length) return res.status(404).json({ error: 'Juego no encontrado' });

  const guides = await query(`
    SELECT gg.*, u.discord_name, u.avatar_url,
           (SELECT COALESCE(SUM(vote), 0) FROM guide_votes WHERE guide_id = gg.id) as upvotes
    FROM game_guides gg
    JOIN users u ON gg.user_id = u.id
    WHERE gg.council_game_id = $1
    ORDER BY upvotes DESC, gg.created_at DESC
  `, [req.params.id]);

  res.json({ ...game.rows[0], guides: guides.rows });
});

// Add a council game
router.post('/', isAuthenticated, async (req, res) => {
  const { name, steam_app_id, cover_url, genres, synopsis, tryhard_info } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre obligatorio' });

  await query(`INSERT INTO council_games (name, steam_app_id, cover_url, genres, synopsis, tryhard_info, added_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [name, steam_app_id || null, cover_url || null, JSON.stringify(genres || []), synopsis || null, tryhard_info || null, req.user.id]);

  const created = await query('SELECT * FROM council_games ORDER BY id DESC LIMIT 1');
  await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'game_added', $2)`,
    [req.user.id, JSON.stringify({ game: name })]);

  res.status(201).json(created.rows[0]);
});

// Submit a guide
router.post('/:id/guides', isAuthenticated, async (req, res) => {
  const { title, content, category } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Titulo y contenido obligatorios' });

  await query(`INSERT INTO game_guides (council_game_id, user_id, title, content, category)
    VALUES ($1, $2, $3, $4, $5)`,
    [req.params.id, req.user.id, title, content, category || 'general']);

  const game = await query('SELECT name FROM council_games WHERE id = $1', [req.params.id]);
  await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'guide_posted', $2)`,
    [req.user.id, JSON.stringify({ game: game.rows[0]?.name, title })]);

  // +2 points for contributing a guide
  await query('UPDATE users SET recommender_points = recommender_points + 2, updated_at = NOW() WHERE id = $1', [req.user.id]);

  const created = await query('SELECT * FROM game_guides ORDER BY id DESC LIMIT 1');
  res.status(201).json(created.rows[0]);
});

// Upvote a guide
router.post('/guides/:guideId/vote', isAuthenticated, async (req, res) => {
  const existing = await query('SELECT * FROM guide_votes WHERE guide_id = $1 AND user_id = $2', [req.params.guideId, req.user.id]);

  if (existing.rows.length) {
    // Remove vote (toggle)
    await query('DELETE FROM guide_votes WHERE guide_id = $1 AND user_id = $2', [req.params.guideId, req.user.id]);
    res.json({ voted: false });
  } else {
    await query('INSERT INTO guide_votes (guide_id, user_id) VALUES ($1, $2)', [req.params.guideId, req.user.id]);
    res.json({ voted: true });
  }
});

// Delete guide (author or admin)
router.delete('/guides/:guideId', isAuthenticated, async (req, res) => {
  const guide = await query('SELECT * FROM game_guides WHERE id = $1', [req.params.guideId]);
  if (!guide.rows.length) return res.status(404).json({ error: 'Guia no encontrada' });
  if (guide.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No podes borrar esta guia' });
  }
  await query('DELETE FROM guide_votes WHERE guide_id = $1', [req.params.guideId]);
  await query('DELETE FROM game_guides WHERE id = $1', [req.params.guideId]);
  res.json({ message: 'Guia eliminada' });
});

// Delete council game (admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  await query('DELETE FROM guide_votes WHERE guide_id IN (SELECT id FROM game_guides WHERE council_game_id = $1)', [req.params.id]);
  await query('DELETE FROM game_guides WHERE council_game_id = $1', [req.params.id]);
  await query('DELETE FROM council_games WHERE id = $1', [req.params.id]);
  res.json({ message: 'Juego eliminado' });
});

export default router;
