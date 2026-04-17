import { Router } from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

// Get all activities for current month
router.get('/', isAuthenticated, async (req, res) => {
  const month = await query('SELECT * FROM months ORDER BY year DESC, month DESC LIMIT 1');
  if (!month.rows.length) return res.json([]);

  const activities = await query(`
    SELECT a.*, u.discord_name as creator_name, u.avatar_url as creator_avatar,
           (SELECT COUNT(*) FROM activity_signups WHERE activity_id = a.id) as signup_count
    FROM activities a
    LEFT JOIN users u ON a.created_by = u.id
    WHERE a.month_id = $1
    ORDER BY a.created_at DESC
  `, [month.rows[0].id]);

  // Get signups for each activity
  const result = await Promise.all(activities.rows.map(async act => {
    const signups = await query(`
      SELECT s.*, u.discord_name, u.avatar_url
      FROM activity_signups s
      JOIN users u ON s.user_id = u.id
      WHERE s.activity_id = $1
      ORDER BY s.created_at
    `, [act.id]);
    return { ...act, signups: signups.rows };
  }));

  res.json(result);
});

// Get single activity
router.get('/:id', isAuthenticated, async (req, res) => {
  const act = await query('SELECT * FROM activities WHERE id = $1', [req.params.id]);
  if (!act.rows.length) return res.status(404).json({ error: 'Actividad no encontrada' });

  const signups = await query(`
    SELECT s.*, u.discord_name, u.avatar_url, u.recommender_points
    FROM activity_signups s
    JOIN users u ON s.user_id = u.id
    WHERE s.activity_id = $1
    ORDER BY s.created_at
  `, [req.params.id]);

  res.json({ ...act.rows[0], signups: signups.rows });
});

// Create activity (admin or high rank)
router.post('/', isAuthenticated, async (req, res) => {
  const { name, type, description, cover_url, points_join, points_skip, max_participants } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'Nombre y tipo son obligatorios' });

  const month = await query('SELECT * FROM months ORDER BY year DESC, month DESC LIMIT 1');
  if (!month.rows.length) return res.status(400).json({ error: 'No hay mes activo' });

  await query(`INSERT INTO activities (name, type, description, cover_url, points_join, points_skip, max_participants, created_by, month_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [name, type, description || null, cover_url || null, points_join || 5, points_skip || -3, max_participants || null, req.user.id, month.rows[0].id]);

  const created = await query('SELECT * FROM activities ORDER BY id DESC LIMIT 1');

  await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'activity_created', $2)`,
    [req.user.id, JSON.stringify({ name, type })]);

  res.status(201).json(created.rows[0]);
});

// Sign up for activity
router.post('/:id/join', isAuthenticated, async (req, res) => {
  const act = await query('SELECT * FROM activities WHERE id = $1', [req.params.id]);
  if (!act.rows.length) return res.status(404).json({ error: 'Actividad no encontrada' });
  if (act.rows[0].status === 'closed') return res.status(400).json({ error: 'Actividad cerrada' });

  // Check if already signed up
  const existing = await query('SELECT * FROM activity_signups WHERE activity_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (existing.rows.length) return res.status(409).json({ error: 'Ya estas anotado' });

  // Check max participants
  if (act.rows[0].max_participants) {
    const count = await query('SELECT COUNT(*) as c FROM activity_signups WHERE activity_id = $1', [req.params.id]);
    if (count.rows[0].c >= act.rows[0].max_participants) return res.status(400).json({ error: 'Actividad llena' });
  }

  await query('INSERT INTO activity_signups (activity_id, user_id) VALUES ($1, $2)', [req.params.id, req.user.id]);

  // Give points for joining
  const pointsJoin = act.rows[0].points_join || 5;
  await query('UPDATE users SET recommender_points = recommender_points + $1, updated_at = NOW() WHERE id = $2', [pointsJoin, req.user.id]);

  await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'activity_joined', $2)`,
    [req.user.id, JSON.stringify({ activity: act.rows[0].name, points: pointsJoin })]);

  res.json({ message: `Anotado! +${pointsJoin} puntos` });
});

// Leave activity
router.post('/:id/leave', isAuthenticated, async (req, res) => {
  const act = await query('SELECT * FROM activities WHERE id = $1', [req.params.id]);
  if (!act.rows.length) return res.status(404).json({ error: 'Actividad no encontrada' });

  const existing = await query('SELECT * FROM activity_signups WHERE activity_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!existing.rows.length) return res.status(400).json({ error: 'No estas anotado' });

  await query('DELETE FROM activity_signups WHERE activity_id = $1 AND user_id = $2', [req.params.id, req.user.id]);

  // Remove points that were given + penalty
  const pointsJoin = act.rows[0].points_join || 5;
  const penalty = pointsJoin + 2; // Lose what you gained + extra
  await query('UPDATE users SET recommender_points = recommender_points - $1, updated_at = NOW() WHERE id = $2', [penalty, req.user.id]);

  await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'activity_left', $2)`,
    [req.user.id, JSON.stringify({ activity: act.rows[0].name, points: -penalty })]);

  res.json({ message: `Saliste de la actividad. -${penalty} puntos` });
});

// Close activity and penalize non-participants (admin)
router.post('/:id/close', isAdmin, async (req, res) => {
  const act = await query('SELECT * FROM activities WHERE id = $1', [req.params.id]);
  if (!act.rows.length) return res.status(404).json({ error: 'Actividad no encontrada' });

  await query('UPDATE activities SET status = $1 WHERE id = $2', ['closed', req.params.id]);

  // Penalize users who didn't sign up
  const signedUp = await query('SELECT user_id FROM activity_signups WHERE activity_id = $1', [req.params.id]);
  const signedUpIds = new Set(signedUp.rows.map(s => s.user_id));

  const allUsers = await query('SELECT id, discord_name FROM users WHERE reputation > -999');
  const pointsSkip = act.rows[0].points_skip || -3;

  let penalized = 0;
  for (const u of allUsers.rows) {
    if (!signedUpIds.has(u.id)) {
      await query('UPDATE users SET recommender_points = recommender_points + $1, updated_at = NOW() WHERE id = $2', [pointsSkip, u.id]);
      await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'activity_skipped', $2)`,
        [u.id, JSON.stringify({ activity: act.rows[0].name, points: pointsSkip })]);
      penalized++;
    }
  }

  await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'activity_closed', $2)`,
    [req.user.id, JSON.stringify({ activity: act.rows[0].name, penalized })]);

  res.json({ message: `Actividad cerrada. ${penalized} usuarios penalizados con ${pointsSkip} pts` });
});

// Complete activity (admin)
router.post('/:id/complete', isAdmin, async (req, res) => {
  await query('UPDATE activities SET status = $1 WHERE id = $2', ['completed', req.params.id]);
  const act = await query('SELECT * FROM activities WHERE id = $1', [req.params.id]);
  await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'activity_completed', $2)`,
    [req.user.id, JSON.stringify({ activity: act.rows[0]?.name })]);
  res.json({ message: 'Actividad completada' });
});

// Delete activity (admin)
router.delete('/:id', isAdmin, async (req, res) => {
  await query('DELETE FROM activity_signups WHERE activity_id = $1', [req.params.id]);
  await query('DELETE FROM activities WHERE id = $1', [req.params.id]);
  res.json({ message: 'Actividad eliminada' });
});

export default router;
