import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

router.get('/current', isAuthenticated, (req, res) => {
  const month = query(`SELECT m.*, g.name as game_name, g.cover_url FROM months m LEFT JOIN games g ON m.winning_game_id = g.id WHERE m.phase IN ('review', 'playing') ORDER BY m.year DESC, m.month DESC LIMIT 1`);
  if (!month.rows.length) return res.json({ reviews: [], month: null });

  const reviews = query(`SELECT r.*, u.discord_name, u.avatar_url FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.month_id = ? ORDER BY r.created_at`, [month.rows[0].id]);
  const myReview = reviews.rows.find(r => r.user_id === req.user.id);

  const avgScores = reviews.rows.length ? {
    gameplay: avg(reviews.rows, 'gameplay'), story: avg(reviews.rows, 'story'),
    graphics: avg(reviews.rows, 'graphics'), replayability: avg(reviews.rows, 'replayability'),
    group_fun: avg(reviews.rows, 'group_fun'),
    total: +(reviews.rows.reduce((s, r) => s + (r.gameplay + r.story + r.graphics + r.replayability + r.group_fun) / 5, 0) / reviews.rows.length).toFixed(1),
  } : null;

  res.json({ reviews: reviews.rows, month: month.rows[0], myReview: myReview || null, averages: avgScores });
});

router.post('/', isAuthenticated, (req, res) => {
  const { gameplay, story, graphics, replayability, group_fun, comment, hours_played } = req.body;
  for (const s of [gameplay, story, graphics, replayability, group_fun]) {
    if (s < 1 || s > 10) return res.status(400).json({ error: 'Puntajes entre 1 y 10' });
  }

  const month = query(`SELECT * FROM months WHERE phase IN ('review', 'playing') ORDER BY year DESC, month DESC LIMIT 1`);
  if (!month.rows.length || !month.rows[0].winning_game_id) return res.status(400).json({ error: 'No hay review activa' });

  try {
    query('INSERT OR REPLACE INTO reviews (month_id, user_id, game_id, gameplay, story, graphics, replayability, group_fun, comment, hours_played) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [month.rows[0].id, req.user.id, month.rows[0].winning_game_id, gameplay, story, graphics, replayability, group_fun, comment || null, hours_played || null]);
    query(`INSERT INTO activity_log (user_id, action, details) VALUES (?, 'review', ?)`, [req.user.id, JSON.stringify({ month_id: month.rows[0].id })]);
    const created = query('SELECT * FROM reviews WHERE month_id = ? AND user_id = ?', [month.rows[0].id, req.user.id]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/month/:monthId', isAuthenticated, (req, res) => {
  const reviews = query(`SELECT r.*, u.discord_name, u.avatar_url, g.name as game_name, g.cover_url FROM reviews r JOIN users u ON r.user_id = u.id JOIN games g ON r.game_id = g.id WHERE r.month_id = ? ORDER BY r.created_at`, [req.params.monthId]);
  res.json({ reviews: reviews.rows });
});

function avg(rows, field) { return +(rows.reduce((s, r) => s + r[field], 0) / rows.length).toFixed(1); }

export default router;
