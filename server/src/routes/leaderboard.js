import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

router.get('/', isAuthenticated, async (req, res) => {
  const result = await query(`SELECT u.id, u.discord_name, u.avatar_url, u.recommender_points, u.objectivity_score, u.override_rank, (SELECT COUNT(*) FROM badges WHERE user_id = u.id) as badge_count FROM users u ORDER BY u.recommender_points DESC`);
  res.json(result.rows);
});

router.get('/badges', isAuthenticated, async (req, res) => {
  const result = await query(`SELECT b.*, u.discord_name, u.avatar_url FROM badges b JOIN users u ON b.user_id = u.id ORDER BY b.earned_at DESC LIMIT 20`);
  res.json(result.rows);
});

export default router;
