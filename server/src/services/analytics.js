import { query } from '../config/database.js';

export async function updateGameAnalytics(monthId) {
  const month = await query('SELECT * FROM months WHERE id = $1', [monthId]);
  if (!month.rows.length || !month.rows[0].winning_game_id) return;

  const gameId = month.rows[0].winning_game_id;

  const reviews = await query(
    'SELECT * FROM reviews WHERE month_id = $1 AND game_id = $2',
    [monthId, gameId]
  );
  if (!reviews.rows.length) return;

  const n = reviews.rows.length;
  const avgGameplay = avg(reviews.rows, 'gameplay');
  const avgStory = avg(reviews.rows, 'story');
  const avgGraphics = avg(reviews.rows, 'graphics');
  const avgReplayability = avg(reviews.rows, 'replayability');
  const avgGroupFun = avg(reviews.rows, 'group_fun');
  const totalAvg = +((avgGameplay + avgStory + avgGraphics + avgReplayability + avgGroupFun) / 5).toFixed(1);

  // Varianza del puntaje total
  const totalScores = reviews.rows.map(r =>
    (parseFloat(r.gameplay) + parseFloat(r.story) + parseFloat(r.graphics) +
     parseFloat(r.replayability) + parseFloat(r.group_fun)) / 5
  );
  const variance = +(totalScores.reduce((sum, s) => sum + Math.pow(s - totalAvg, 2), 0) / n).toFixed(2);

  // Obtener géneros del juego
  const game = await query('SELECT genres FROM games WHERE id = $1', [gameId]);
  const votes = await query('SELECT COUNT(*) as count FROM votes WHERE month_id = $1', [monthId]);

  await query(`
    INSERT INTO game_analytics (game_id, month_id, avg_gameplay, avg_story, avg_graphics,
      avg_replayability, avg_group_fun, total_avg, vote_count, review_count, variance, genres_tags)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (game_id, month_id) DO UPDATE SET
      avg_gameplay = $3, avg_story = $4, avg_graphics = $5, avg_replayability = $6,
      avg_group_fun = $7, total_avg = $8, vote_count = $9, review_count = $10,
      variance = $11, genres_tags = $12
  `, [gameId, monthId, avgGameplay, avgStory, avgGraphics, avgReplayability,
      avgGroupFun, totalAvg, parseInt(votes.rows[0].count), n, variance,
      game.rows[0]?.genres || []]);
}

function avg(rows, field) {
  return +(rows.reduce((sum, r) => sum + parseFloat(r[field]), 0) / rows.length).toFixed(1);
}
