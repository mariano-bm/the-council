import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

router.get('/current', isAuthenticated, (req, res) => {
  const month = query(`SELECT * FROM months WHERE phase = 'nomination' ORDER BY year DESC, month DESC LIMIT 1`);
  if (!month.rows.length) return res.json({ nominations: [], phase: null });

  const nominations = query(`SELECT n.*, g.name as game_name, g.cover_url, g.genres, g.metacritic, g.platforms, u.discord_name, u.avatar_url, u.id as nominator_id FROM nominations n JOIN games g ON n.game_id = g.id JOIN users u ON n.user_id = u.id WHERE n.month_id = ? ORDER BY n.created_at DESC`, [month.rows[0].id]);
  res.json({ nominations: nominations.rows, month: month.rows[0] });
});

router.post('/', isAuthenticated, (req, res) => {
  const { game_id, pitch } = req.body;
  if (!game_id || !pitch) return res.status(400).json({ error: 'game_id y pitch son obligatorios' });

  const month = query(`SELECT * FROM months WHERE phase = 'nomination' ORDER BY year DESC, month DESC LIMIT 1`);
  if (!month.rows.length) return res.status(400).json({ error: 'No hay fase de nominacion activa' });

  const count = query('SELECT COUNT(*) as count FROM nominations WHERE month_id = ? AND user_id = ?', [month.rows[0].id, req.user.id]);
  if (count.rows[0].count >= 3) return res.status(400).json({ error: 'Ya nominaste 3 juegos este mes' });

  try {
    query('INSERT INTO nominations (month_id, user_id, game_id, pitch) VALUES (?, ?, ?, ?)', [month.rows[0].id, req.user.id, game_id, pitch]);
    const created = query('SELECT * FROM nominations WHERE month_id = ? AND user_id = ? AND game_id = ?', [month.rows[0].id, req.user.id, game_id]);
    const game = query('SELECT name FROM games WHERE id = ?', [game_id]);
    query(`INSERT INTO activity_log (user_id, action, details) VALUES (?, 'nomination', ?)`, [req.user.id, JSON.stringify({ game_name: game.rows[0]?.name })]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Ya nominaste este juego' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', isAuthenticated, (req, res) => {
  const nom = query('SELECT * FROM nominations WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!nom.rows.length) return res.status(404).json({ error: 'Nominacion no encontrada' });
  query('DELETE FROM nominations WHERE id = ?', [req.params.id]);
  res.json({ message: 'Nominacion eliminada' });
});

export default router;
