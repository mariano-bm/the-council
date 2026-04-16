import { Router } from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

// Get all activities for current month
router.get('/', isAuthenticated, (req, res) => {
  const month = query('SELECT * FROM months ORDER BY year DESC, month DESC LIMIT 1');
  if (!month.rows.length) return res.json([]);

  const activities = query(`
    SELECT a.*, u.discord_name as creator_name, u.avatar_url as creator_avatar,
           (SELECT COUNT(*) FROM activity_signups WHERE activity_id = a.id) as signup_count
    FROM activities a
    LEFT JOIN users u ON a.created_by = u.id
    WHERE a.month_id = ?
    ORDER BY a.created_at DESC
  `, [month.rows[0].id]);

  // Get signups for each activity
  const result = activities.rows.map(act => {
    const signups = query(`
      SELECT s.*, u.discord_name, u.avatar_url
      FROM activity_signups s
      JOIN users u ON s.user_id = u.id
      WHERE s.activity_id = ?
      ORDER BY s.created_at
    `, [act.id]);
    return { ...act, signups: signups.rows };
  });

  res.json(result);
});

// Get single activity
router.get('/:id', isAuthenticated, (req, res) => {
  const act = query('SELECT * FROM activities WHERE id = ?', [req.params.id]);
  if (!act.rows.length) return res.status(404).json({ error: 'Actividad no encontrada' });

  const signups = query(`
    SELECT s.*, u.discord_name, u.avatar_url, u.recommender_points
    FROM activity_signups s
    JOIN users u ON s.user_id = u.id
    WHERE s.activity_id = ?
    ORDER BY s.created_at
  `, [req.params.id]);

  res.json({ ...act.rows[0], signups: signups.rows });
});

// Create activity (admin or high rank)
router.post('/', isAuthenticated, (req, res) => {
  const { name, type, description, cover_url, points_join, points_skip, max_participants } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'Nombre y tipo son obligatorios' });

  const month = query('SELECT * FROM months ORDER BY year DESC, month DESC LIMIT 1');
  if (!month.rows.length) return res.status(400).json({ error: 'No hay mes activo' });

  query(`INSERT INTO activities (name, type, description, cover_url, points_join, points_skip, max_participants, created_by, month_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, type, description || null, cover_url || null, points_join || 5, points_skip || -3, max_participants || null, req.user.id, month.rows[0].id]);

  const created = query('SELECT * FROM activities ORDER BY id DESC LIMIT 1');

  query(`INSERT INTO activity_log (user_id, action, details) VALUES (?, 'activity_created', ?)`,
    [req.user.id, JSON.stringify({ name, type })]);

  res.status(201).json(created.rows[0]);
});

// Sign up for activity
router.post('/:id/join', isAuthenticated, (req, res) => {
  const act = query('SELECT * FROM activities WHERE id = ?', [req.params.id]);
  if (!act.rows.length) return res.status(404).json({ error: 'Actividad no encontrada' });
  if (act.rows[0].status === 'closed') return res.status(400).json({ error: 'Actividad cerrada' });

  // Check if already signed up
  const existing = query('SELECT * FROM activity_signups WHERE activity_id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (existing.rows.length) return res.status(409).json({ error: 'Ya estas anotado' });

  // Check max participants
  if (act.rows[0].max_participants) {
    const count = query('SELECT COUNT(*) as c FROM activity_signups WHERE activity_id = ?', [req.params.id]);
    if (count.rows[0].c >= act.rows[0].max_participants) return res.status(400).json({ error: 'Actividad llena' });
  }

  query('INSERT INTO activity_signups (activity_id, user_id) VALUES (?, ?)', [req.params.id, req.user.id]);

  // Give points for joining
  const pointsJoin = act.rows[0].points_join || 5;
  query('UPDATE users SET recommender_points = recommender_points + ?, updated_at = datetime("now") WHERE id = ?', [pointsJoin, req.user.id]);

  query(`INSERT INTO activity_log (user_id, action, details) VALUES (?, 'activity_joined', ?)`,
    [req.user.id, JSON.stringify({ activity: act.rows[0].name, points: pointsJoin })]);

  res.json({ message: `Anotado! +${pointsJoin} puntos` });
});

// Leave activity
router.post('/:id/leave', isAuthenticated, (req, res) => {
  const act = query('SELECT * FROM activities WHERE id = ?', [req.params.id]);
  if (!act.rows.length) return res.status(404).json({ error: 'Actividad no encontrada' });

  const existing = query('SELECT * FROM activity_signups WHERE activity_id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!existing.rows.length) return res.status(400).json({ error: 'No estas anotado' });

  query('DELETE FROM activity_signups WHERE activity_id = ? AND user_id = ?', [req.params.id, req.user.id]);

  // Remove points that were given + penalty
  const pointsJoin = act.rows[0].points_join || 5;
  const penalty = pointsJoin + 2; // Lose what you gained + extra
  query('UPDATE users SET recommender_points = recommender_points - ?, updated_at = datetime("now") WHERE id = ?', [penalty, req.user.id]);

  query(`INSERT INTO activity_log (user_id, action, details) VALUES (?, 'activity_left', ?)`,
    [req.user.id, JSON.stringify({ activity: act.rows[0].name, points: -penalty })]);

  res.json({ message: `Saliste de la actividad. -${penalty} puntos` });
});

// Close activity and penalize non-participants (admin)
router.post('/:id/close', isAdmin, (req, res) => {
  const act = query('SELECT * FROM activities WHERE id = ?', [req.params.id]);
  if (!act.rows.length) return res.status(404).json({ error: 'Actividad no encontrada' });

  query('UPDATE activities SET status = ? WHERE id = ?', ['closed', req.params.id]);

  // Penalize users who didn't sign up
  const signedUp = query('SELECT user_id FROM activity_signups WHERE activity_id = ?', [req.params.id]);
  const signedUpIds = new Set(signedUp.rows.map(s => s.user_id));

  const allUsers = query('SELECT id, discord_name FROM users WHERE reputation > -999');
  const pointsSkip = act.rows[0].points_skip || -3;

  let penalized = 0;
  for (const u of allUsers.rows) {
    if (!signedUpIds.has(u.id)) {
      query('UPDATE users SET recommender_points = recommender_points + ?, updated_at = datetime("now") WHERE id = ?', [pointsSkip, u.id]);
      query(`INSERT INTO activity_log (user_id, action, details) VALUES (?, 'activity_skipped', ?)`,
        [u.id, JSON.stringify({ activity: act.rows[0].name, points: pointsSkip })]);
      penalized++;
    }
  }

  query(`INSERT INTO activity_log (user_id, action, details) VALUES (?, 'activity_closed', ?)`,
    [req.user.id, JSON.stringify({ activity: act.rows[0].name, penalized })]);

  res.json({ message: `Actividad cerrada. ${penalized} usuarios penalizados con ${pointsSkip} pts` });
});

// Complete activity (admin)
router.post('/:id/complete', isAdmin, (req, res) => {
  query('UPDATE activities SET status = ? WHERE id = ?', ['completed', req.params.id]);
  const act = query('SELECT * FROM activities WHERE id = ?', [req.params.id]);
  query(`INSERT INTO activity_log (user_id, action, details) VALUES (?, 'activity_completed', ?)`,
    [req.user.id, JSON.stringify({ activity: act.rows[0]?.name })]);
  res.json({ message: 'Actividad completada' });
});

// Delete activity (admin)
router.delete('/:id', isAdmin, (req, res) => {
  query('DELETE FROM activity_signups WHERE activity_id = ?', [req.params.id]);
  query('DELETE FROM activities WHERE id = ?', [req.params.id]);
  res.json({ message: 'Actividad eliminada' });
});

export default router;
