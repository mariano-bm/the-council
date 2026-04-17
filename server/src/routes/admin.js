import { Router } from 'express';
import { isAdmin } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

// Get all users with full data
router.get('/users', isAdmin, async (req, res) => {
  const users = await query(`SELECT * FROM users ORDER BY recommender_points DESC`);
  res.json(users.rows);
});

// Update user role (admin/member)
router.patch('/users/:id/role', isAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['member', 'admin'].includes(role)) return res.status(400).json({ error: 'Rol invalido' });
  await query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, req.params.id]);
  await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'role_change', $2)`,
    [req.user.id, JSON.stringify({ target: req.params.id, role })]);
  const updated = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  res.json(updated.rows[0]);
});

// Update user rank override
router.patch('/users/:id/rank', isAdmin, async (req, res) => {
  const { override_rank } = req.body;
  await query('UPDATE users SET override_rank = $1, updated_at = NOW() WHERE id = $2', [override_rank || null, req.params.id]);
  await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'rank_override', $2)`,
    [req.user.id, JSON.stringify({ target: req.params.id, rank: override_rank })]);
  const updated = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  res.json(updated.rows[0]);
});

// Modify points
router.patch('/users/:id/points', isAdmin, async (req, res) => {
  const { amount, reason } = req.body;
  if (typeof amount !== 'number') return res.status(400).json({ error: 'amount requerido' });
  await query('UPDATE users SET recommender_points = GREATEST(0, recommender_points + $1), updated_at = NOW() WHERE id = $2', [amount, req.params.id]);
  await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'points_modified', $2)`,
    [req.user.id, JSON.stringify({ target: req.params.id, amount, reason: reason || 'Admin' })]);
  const updated = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  res.json(updated.rows[0]);
});

// Set points to exact value
router.patch('/users/:id/points/set', isAdmin, async (req, res) => {
  const { points } = req.body;
  if (typeof points !== 'number') return res.status(400).json({ error: 'points requerido' });
  await query('UPDATE users SET recommender_points = $1, updated_at = NOW() WHERE id = $2', [Math.max(0, points), req.params.id]);
  await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'points_set', $2)`,
    [req.user.id, JSON.stringify({ target: req.params.id, points })]);
  const updated = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  res.json(updated.rows[0]);
});

// Modify reputation
router.patch('/users/:id/reputation', isAdmin, async (req, res) => {
  const { amount, reason } = req.body;
  if (typeof amount !== 'number') return res.status(400).json({ error: 'amount requerido' });
  await query('UPDATE users SET reputation = reputation + $1, updated_at = NOW() WHERE id = $2', [amount, req.params.id]);
  await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'reputation_modified', $2)`,
    [req.user.id, JSON.stringify({ target: req.params.id, amount, reason: reason || 'Admin' })]);
  const updated = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  res.json(updated.rows[0]);
});

// Ban user (set reputation to -999 and role to 'member')
router.patch('/users/:id/ban', isAdmin, async (req, res) => {
  const { reason } = req.body;
  await query('UPDATE users SET reputation = -999, role = $1, updated_at = NOW() WHERE id = $2', ['member', req.params.id]);
  await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'user_banned', $2)`,
    [req.user.id, JSON.stringify({ target: req.params.id, reason: reason || 'Baneado por admin' })]);
  const updated = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  res.json(updated.rows[0]);
});

// Unban user
router.patch('/users/:id/unban', isAdmin, async (req, res) => {
  await query('UPDATE users SET reputation = 0, updated_at = NOW() WHERE id = $1', [req.params.id]);
  await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'user_unbanned', $2)`,
    [req.user.id, JSON.stringify({ target: req.params.id })]);
  const updated = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  res.json(updated.rows[0]);
});

// Delete user
router.delete('/users/:id', isAdmin, async (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'No podes eliminarte a vos mismo' });
  const user = await query('SELECT discord_name FROM users WHERE id = $1', [req.params.id]);
  await query('DELETE FROM users WHERE id = $1', [req.params.id]);
  await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'user_deleted', $2)`,
    [req.user.id, JSON.stringify({ target: req.params.id, name: user.rows[0]?.discord_name })]);
  res.json({ message: 'Usuario eliminado' });
});

// Phase management
router.patch('/months/:id/phase', isAdmin, async (req, res) => {
  const { phase } = req.body;
  if (!['nomination', 'voting', 'playing', 'review', 'completed'].includes(phase)) return res.status(400).json({ error: 'Fase invalida' });
  await query('UPDATE months SET phase = $1 WHERE id = $2', [phase, req.params.id]);
  await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'phase_changed', $2)`,
    [req.user.id, JSON.stringify({ month_id: req.params.id, phase })]);
  const updated = await query('SELECT * FROM months WHERE id = $1', [req.params.id]);
  res.json(updated.rows[0]);
});

// Create month
router.post('/months', isAdmin, async (req, res) => {
  const { year, month, nomination_start, nomination_end, voting_start, voting_end, review_start, review_end } = req.body;
  try {
    await query('INSERT INTO months (year, month, nomination_start, nomination_end, voting_start, voting_end, review_start, review_end) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [year, month, nomination_start, nomination_end, voting_start, voting_end, review_start, review_end]);
    const created = await query('SELECT * FROM months WHERE year = $1 AND month = $2', [year, month]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    res.status(409).json({ error: 'Ya existe ese mes' });
  }
});

export default router;
