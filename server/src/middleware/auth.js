import { query } from '../config/database.js';

export function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    const result = query('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    if (result.rows.length) {
      req.user = result.rows[0];
      return next();
    }
  }
  res.status(401).json({ error: 'No autenticado. Inicia sesion.' });
}

export function isAdmin(req, res, next) {
  if (req.session.userId) {
    const result = query('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    if (result.rows.length && result.rows[0].role === 'admin') {
      req.user = result.rows[0];
      return next();
    }
  }
  res.status(403).json({ error: 'Se requieren permisos de administrador.' });
}
