import { Router } from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

router.get('/current', isAuthenticated, async (req, res) => {
  const result = await query(`SELECT m.*, g.name as winning_game_name, g.cover_url as winning_game_cover FROM months m LEFT JOIN games g ON m.winning_game_id = g.id ORDER BY m.year DESC, m.month DESC LIMIT 1`);
  res.json(result.rows[0] || null);
});

router.get('/', isAuthenticated, async (req, res) => {
  const result = await query(`SELECT m.*, g.name as winning_game_name, g.cover_url as winning_game_cover FROM months m LEFT JOIN games g ON m.winning_game_id = g.id ORDER BY m.year DESC, m.month DESC`);
  res.json(result.rows);
});

router.get('/:id', isAuthenticated, async (req, res) => {
  const month = await query(`SELECT m.*, g.name as winning_game_name, g.cover_url as winning_game_cover FROM months m LEFT JOIN games g ON m.winning_game_id = g.id WHERE m.id = $1`, [req.params.id]);
  if (!month.rows.length) return res.status(404).json({ error: 'Mes no encontrado' });

  const nominations = await query(`SELECT n.*, g.name as game_name, g.cover_url, g.genres, g.metacritic, u.discord_name, u.avatar_url FROM nominations n JOIN games g ON n.game_id = g.id JOIN users u ON n.user_id = u.id WHERE n.month_id = $1 ORDER BY n.created_at`, [req.params.id]);
  res.json({ ...month.rows[0], nominations: nominations.rows });
});

router.post('/', isAdmin, async (req, res) => {
  const { year, month, nomination_start, nomination_end, voting_start, voting_end, review_start, review_end } = req.body;
  try {
    await query(`INSERT INTO months (year, month, nomination_start, nomination_end, voting_start, voting_end, review_start, review_end) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [year, month, nomination_start, nomination_end, voting_start, voting_end, review_start, review_end]);
    const created = await query('SELECT * FROM months WHERE year = $1 AND month = $2', [year, month]);
    await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'month_created', $2)`, [req.user.id, JSON.stringify({ year, month })]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ya existe ese mes' });
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/phase', isAdmin, async (req, res) => {
  const { phase } = req.body;
  if (!['nomination', 'voting', 'playing', 'review', 'completed'].includes(phase)) return res.status(400).json({ error: 'Fase invalida' });
  await query('UPDATE months SET phase = $1 WHERE id = $2', [phase, req.params.id]);
  await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'phase_changed', $2)`, [req.user.id, JSON.stringify({ month_id: req.params.id, phase })]);
  const updated = await query('SELECT * FROM months WHERE id = $1', [req.params.id]);
  res.json(updated.rows[0]);
});

export default router;
