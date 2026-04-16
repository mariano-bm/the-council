import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

// Endpoint preparado para recomendaciones IA
router.get('/recommendations', isAuthenticated, async (req, res) => {
  try {
    // Obtener analytics de todos los juegos completados
    const analytics = await query(`
      SELECT ga.*, g.name, g.genres, g.platforms
      FROM game_analytics ga
      JOIN games g ON ga.game_id = g.id
      ORDER BY ga.total_avg DESC
    `);

    // Géneros mejor valorados
    const genreScores = {};
    for (const row of analytics.rows) {
      const genres = row.genres || [];
      for (const genre of genres) {
        if (!genreScores[genre]) genreScores[genre] = { total: 0, count: 0 };
        genreScores[genre].total += parseFloat(row.total_avg || 0);
        genreScores[genre].count += 1;
      }
    }

    const topGenres = Object.entries(genreScores)
      .map(([genre, data]) => ({ genre, avg: +(data.total / data.count).toFixed(1) }))
      .sort((a, b) => b.avg - a.avg);

    // Top juegos por diversión grupal
    const topGroupFun = analytics.rows
      .filter(r => r.avg_group_fun)
      .sort((a, b) => parseFloat(b.avg_group_fun) - parseFloat(a.avg_group_fun))
      .slice(0, 10);

    res.json({
      message: 'Endpoint preparado para integración con IA',
      data: {
        total_games_played: analytics.rows.length,
        top_genres: topGenres.slice(0, 10),
        top_group_fun_games: topGroupFun,
        all_analytics: analytics.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
