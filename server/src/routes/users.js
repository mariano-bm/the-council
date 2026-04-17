import { Router } from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

router.get('/', isAuthenticated, async (req, res) => {
  const result = await query('SELECT id, discord_id, discord_name, avatar_url, role, council_rank, override_rank, reputation, objectivity_score, recommender_points, created_at FROM users ORDER BY recommender_points DESC');
  res.json(result.rows);
});

router.get('/:id', isAuthenticated, async (req, res) => {
  const user = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  if (!user.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

  const badges = await query('SELECT * FROM badges WHERE user_id = $1 ORDER BY earned_at DESC', [req.params.id]);
  const reviews = await query(`SELECT r.*, g.name as game_name, g.cover_url, m.year, m.month FROM reviews r JOIN games g ON r.game_id = g.id JOIN months m ON r.month_id = m.id WHERE r.user_id = $1 ORDER BY m.year DESC, m.month DESC`, [req.params.id]);
  const nominations = await query(`SELECT n.*, g.name as game_name, g.cover_url, m.year, m.month, CASE WHEN m.winning_game_id = n.game_id THEN 1 ELSE 0 END as was_winner FROM nominations n JOIN games g ON n.game_id = g.id JOIN months m ON n.month_id = m.id WHERE n.user_id = $1 ORDER BY m.year DESC, m.month DESC`, [req.params.id]);
  const objectivityHistory = await query(`SELECT oh.*, m.year, m.month FROM objectivity_history oh JOIN months m ON oh.month_id = m.id WHERE oh.user_id = $1 ORDER BY m.year DESC, m.month DESC`, [req.params.id]);

  res.json({ ...user.rows[0], badges: badges.rows, reviews: reviews.rows, nominations: nominations.rows, objectivity_history: objectivityHistory.rows });
});

router.patch('/:id/role', isAdmin, async (req, res) => {
  const { role, override_rank } = req.body;
  if (role && !['member', 'admin'].includes(role)) return res.status(400).json({ error: 'Rol invalido' });

  if (role) await query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, req.params.id]);
  if (override_rank !== undefined) await query('UPDATE users SET override_rank = $1, updated_at = NOW() WHERE id = $2', [override_rank, req.params.id]);

  const updated = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  res.json(updated.rows[0]);
});

export default router;
