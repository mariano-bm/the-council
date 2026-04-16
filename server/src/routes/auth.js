import { Router } from 'express';
import { query } from '../config/database.js';

const router = Router();

// Login directo (modo dev — después se reemplaza por Discord OAuth)
router.get('/discord', (req, res) => {
  // Sin Discord configurado, login como El Viejo
  req.session.userId = 1;
  res.redirect(process.env.CLIENT_URL || 'http://localhost:5174');
});

router.get('/discord/callback', (req, res) => {
  req.session.userId = 1;
  res.redirect(process.env.CLIENT_URL || 'http://localhost:5174');
});

// Info del usuario actual
router.get('/me', (req, res) => {
  if (req.session.userId) {
    const result = query('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    if (result.rows.length) {
      return res.json({ user: result.rows[0] });
    }
  }
  res.json({ user: null });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Sesion cerrada' });
});

export default router;
