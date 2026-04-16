import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

const JWT_SECRET = process.env.SESSION_SECRET || 'the-council-secret-dev';

export function isAuthenticated(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No autenticado.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = query('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    if (result.rows.length) {
      req.user = result.rows[0];
      return next();
    }
  } catch {}

  res.status(401).json({ error: 'Token invalido.' });
}

export function isAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(403).json({ error: 'No autenticado.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = query('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    if (result.rows.length && result.rows[0].role === 'admin') {
      req.user = result.rows[0];
      return next();
    }
  } catch {}

  res.status(403).json({ error: 'Se requieren permisos de administrador.' });
}
