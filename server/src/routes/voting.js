import { Router } from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

router.get('/current', isAuthenticated, async (req, res) => {
  const month = await query(`SELECT * FROM months WHERE phase = 'voting' ORDER BY year DESC, month DESC LIMIT 1`);
  if (!month.rows.length) return res.json({ games: [], phase: null, hasVoted: false });

  const games = await query(`SELECT DISTINCT g.*, n.pitch, u.discord_name as nominator, u.avatar_url as nominator_avatar FROM nominations n JOIN games g ON n.game_id = g.id JOIN users u ON n.user_id = u.id WHERE n.month_id = $1 ORDER BY g.name`, [month.rows[0].id]);
  const userVotes = await query('SELECT * FROM votes WHERE month_id = $1 AND user_id = $2 ORDER BY rank_position', [month.rows[0].id, req.user.id]);

  res.json({ games: games.rows, month: month.rows[0], hasVoted: userVotes.rows.length > 0, myVotes: userVotes.rows });
});

router.post('/', isAuthenticated, async (req, res) => {
  const { rankings } = req.body;
  if (!rankings?.length) return res.status(400).json({ error: 'Rankea al menos un juego' });

  const month = await query(`SELECT * FROM months WHERE phase = 'voting' ORDER BY year DESC, month DESC LIMIT 1`);
  if (!month.rows.length) return res.status(400).json({ error: 'No hay votacion activa' });

  await query('DELETE FROM votes WHERE month_id = $1 AND user_id = $2', [month.rows[0].id, req.user.id]);
  for (const { game_id, rank_position } of rankings) {
    await query('INSERT INTO votes (month_id, user_id, game_id, rank_position) VALUES ($1, $2, $3, $4)', [month.rows[0].id, req.user.id, game_id, rank_position]);
  }

  await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'voted', $2)`, [req.user.id, JSON.stringify({ month_id: month.rows[0].id })]);
  res.json({ message: 'Votos registrados' });
});

router.get('/results/:monthId', isAuthenticated, async (req, res) => {
  const votes = await query('SELECT * FROM votes WHERE month_id = $1', [req.params.monthId]);
  const nominations = await query(`SELECT DISTINCT g.id, g.name, g.cover_url FROM nominations n JOIN games g ON n.game_id = g.id WHERE n.month_id = $1`, [req.params.monthId]);

  const totalCandidates = nominations.rows.length;
  const scores = {};
  for (const game of nominations.rows) {
    scores[game.id] = { game_id: game.id, name: game.name, cover_url: game.cover_url, points: 0, first_place_votes: 0 };
  }
  for (const vote of votes.rows) {
    if (scores[vote.game_id]) {
      scores[vote.game_id].points += Math.max(totalCandidates - vote.rank_position + 1, 0);
      if (vote.rank_position === 1) scores[vote.game_id].first_place_votes++;
    }
  }
  const results = Object.values(scores).sort((a, b) => b.points - a.points || b.first_place_votes - a.first_place_votes);
  res.json({ results, total_voters: new Set(votes.rows.map(v => v.user_id)).size });
});

export default router;
