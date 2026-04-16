import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

router.get('/', isAuthenticated, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const result = query(`SELECT al.*, u.discord_name, u.avatar_url FROM activity_log al LEFT JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT ?`, [limit]);
  res.json(result.rows);
});

export default router;
