import { Router } from 'express';
import { isAdmin } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

// Get all users with full data
router.get('/users', isAdmin, (req, res) => {
  const users = query(`SELECT * FROM users ORDER BY recommender_points DESC`);
  res.json(users.rows);
});

// Update user role (admin/member)
router.patch('/users/:id/role', isAdmin, (req, res) => {
  const { role } = req.body;
  if (!['member', 'admin'].includes(role)) return res.status(400).json({ error: 'Rol invalido' });
  query('UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?', [role, req.params.id]);
  query(`INSERT INTO activity_log (user_id, action, details) VALUES (?, 'role_change', ?)`,
    [req.user.id, JSON.stringify({ target: req.params.id, role })]);
  const updated = query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json(updated.rows[0]);
});

// Update user rank override
router.patch('/users/:id/rank', isAdmin, (req, res) => {
  const { override_rank } = req.body;
  query('UPDATE users SET override_rank = ?, updated_at = datetime("now") WHERE id = ?', [override_rank || null, req.params.id]);
  query(`INSERT INTO activity_log (user_id, action, details) VALUES (?, 'rank_override', ?)`,
    [req.user.id, JSON.stringify({ target: req.params.id, rank: override_rank })]);
  const updated = query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json(updated.rows[0]);
});

// Modify points
router.patch('/users/:id/points', isAdmin, (req, res) => {
  const { amount, reason } = req.body;
  if (typeof amount !== 'number') return res.status(400).json({ error: 'amount requerido' });
  query('UPDATE users SET recommender_points = MAX(0, recommender_points + ?), updated_at = datetime("now") WHERE id = ?', [amount, req.params.id]);
  query(`INSERT INTO activity_log (user_id, action, details) VALUES (?, 'points_modified', ?)`,
    [req.user.id, JSON.stringify({ target: req.params.id, amount, reason: reason || 'Admin' })]);
  const updated = query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json(updated.rows[0]);
});

// Set points to exact value
router.patch('/users/:id/points/set', isAdmin, (req, res) => {
  const { points } = req.body;
  if (typeof points !== 'number') return res.status(400).json({ error: 'points requerido' });
  query('UPDATE users SET recommender_points = ?, updated_at = datetime("now") WHERE id = ?', [Math.max(0, points), req.params.id]);
  query(`INSERT INTO activity_log (user_id, action, details) VALUES (?, 'points_set', ?)`,
    [req.user.id, JSON.stringify({ target: req.params.id, points })]);
  const updated = query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json(updated.rows[0]);
});

// Modify reputation
router.patch('/users/:id/reputation', isAdmin, (req, res) => {
  const { amount, reason } = req.body;
  if (typeof amount !== 'number') return res.status(400).json({ error: 'amount requerido' });
  query('UPDATE users SET reputation = reputation + ?, updated_at = datetime("now") WHERE id = ?', [amount, req.params.id]);
  query(`INSERT INTO activity_log (user_id, action, details) VALUES (?, 'reputation_modified', ?)`,
    [req.user.id, JSON.stringify({ target: req.params.id, amount, reason: reason || 'Admin' })]);
  const updated = query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json(updated.rows[0]);
});

// Ban user (set reputation to -999 and role to 'member')
router.patch('/users/:id/ban', isAdmin, (req, res) => {
  const { reason } = req.body;
  query('UPDATE users SET reputation = -999, role = ?, updated_at = datetime("now") WHERE id = ?', ['member', req.params.id]);
  query(`INSERT INTO activity_log (user_id, action, details) VALUES (?, 'user_banned', ?)`,
    [req.user.id, JSON.stringify({ target: req.params.id, reason: reason || 'Baneado por admin' })]);
  const updated = query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json(updated.rows[0]);
});

// Unban user
router.patch('/users/:id/unban', isAdmin, (req, res) => {
  query('UPDATE users SET reputation = 0, updated_at = datetime("now") WHERE id = ?', [req.params.id]);
  query(`INSERT INTO activity_log (user_id, action, details) VALUES (?, 'user_unbanned', ?)`,
    [req.user.id, JSON.stringify({ target: req.params.id })]);
  const updated = query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json(updated.rows[0]);
});

// Delete user
router.delete('/users/:id', isAdmin, (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'No podes eliminarte a vos mismo' });
  const user = query('SELECT discord_name FROM users WHERE id = ?', [req.params.id]);
  query('DELETE FROM users WHERE id = ?', [req.params.id]);
  query(`INSERT INTO activity_log (user_id, action, details) VALUES (?, 'user_deleted', ?)`,
    [req.user.id, JSON.stringify({ target: req.params.id, name: user.rows[0]?.discord_name })]);
  res.json({ message: 'Usuario eliminado' });
});

// Phase management
router.patch('/months/:id/phase', isAdmin, (req, res) => {
  const { phase } = req.body;
  if (!['nomination', 'voting', 'playing', 'review', 'completed'].includes(phase)) return res.status(400).json({ error: 'Fase invalida' });
  query('UPDATE months SET phase = ? WHERE id = ?', [phase, req.params.id]);
  query(`INSERT INTO activity_log (user_id, action, details) VALUES (?, 'phase_changed', ?)`,
    [req.user.id, JSON.stringify({ month_id: req.params.id, phase })]);
  const updated = query('SELECT * FROM months WHERE id = ?', [req.params.id]);
  res.json(updated.rows[0]);
});

// Create month
router.post('/months', isAdmin, (req, res) => {
  const { year, month, nomination_start, nomination_end, voting_start, voting_end, review_start, review_end } = req.body;
  try {
    query('INSERT INTO months (year, month, nomination_start, nomination_end, voting_start, voting_end, review_start, review_end) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [year, month, nomination_start, nomination_end, voting_start, voting_end, review_start, review_end]);
    const created = query('SELECT * FROM months WHERE year = ? AND month = ?', [year, month]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    res.status(409).json({ error: 'Ya existe ese mes' });
  }
});

export default router;
