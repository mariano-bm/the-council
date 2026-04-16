import { query } from '../config/database.js';

/**
 * Calcula el índice de objetividad de cada miembro para un mes.
 *
 * Criterios:
 * - Si votaste EN CONTRA de un juego (rank bajo) pero le diste buen puntaje → alta objetividad
 * - Si votaste EN CONTRA y le pusiste puntaje bajo → baja objetividad (sesgo confirmatorio)
 * - Outlier: si tu puntaje se desvía >2 puntos del promedio grupal → penalización
 */
export async function updateObjectivity(monthId) {
  const month = await query('SELECT * FROM months WHERE id = $1', [monthId]);
  if (!month.rows.length || !month.rows[0].winning_game_id) return;

  const winningGameId = month.rows[0].winning_game_id;

  // Obtener todas las reviews del mes
  const reviews = await query(
    'SELECT * FROM reviews WHERE month_id = $1',
    [monthId]
  );
  if (!reviews.rows.length) return;

  // Calcular promedios grupales
  const avgScores = {
    gameplay: avgField(reviews.rows, 'gameplay'),
    story: avgField(reviews.rows, 'story'),
    graphics: avgField(reviews.rows, 'graphics'),
    replayability: avgField(reviews.rows, 'replayability'),
    group_fun: avgField(reviews.rows, 'group_fun'),
  };
  const groupAvg = (avgScores.gameplay + avgScores.story + avgScores.graphics +
                    avgScores.replayability + avgScores.group_fun) / 5;

  // Obtener votos del mes
  const votes = await query(
    'SELECT * FROM votes WHERE month_id = $1',
    [monthId]
  );

  // Todos los usuarios que participaron
  const userIds = [...new Set([
    ...reviews.rows.map(r => r.user_id),
    ...votes.rows.map(v => v.user_id),
  ])];

  const totalGames = await query(
    'SELECT COUNT(DISTINCT game_id) as count FROM nominations WHERE month_id = $1',
    [monthId]
  );
  const totalCandidates = parseInt(totalGames.rows[0].count);

  for (const userId of userIds) {
    let score = 50; // Base

    const userReview = reviews.rows.find(r => r.user_id === userId);
    const userVotes = votes.rows.filter(v => v.user_id === userId);
    const winnerVote = userVotes.find(v => v.game_id === winningGameId);

    // ¿Votó en contra del ganador? (rank alto = menos preferido)
    const votedAgainst = winnerVote
      ? winnerVote.rank_position > Math.ceil(totalCandidates / 2)
      : false;

    if (userReview) {
      const userAvg = (parseFloat(userReview.gameplay) + parseFloat(userReview.story) +
                       parseFloat(userReview.graphics) + parseFloat(userReview.replayability) +
                       parseFloat(userReview.group_fun)) / 5;
      const deviation = Math.abs(userAvg - groupAvg);

      // Alta objetividad: votó en contra pero dio buen puntaje
      if (votedAgainst && userAvg >= groupAvg - 1) {
        score += 25;
      }
      // Baja objetividad: votó en contra y puso puntaje bajo
      else if (votedAgainst && userAvg < groupAvg - 2) {
        score -= 20;
      }
      // Neutral: votó a favor
      else if (!votedAgainst) {
        score += 10;
      }

      // Outlier penalty
      if (deviation > 2) {
        score -= Math.min((deviation - 2) * 10, 30);
      }

      // Bonus por participar (review + voto)
      if (userVotes.length > 0) score += 5;
      if (userReview.hours_played && parseFloat(userReview.hours_played) >= 5) score += 5;

      // Clamp 0-100
      score = Math.max(0, Math.min(100, score));

      // Guardar historial
      await query(`
        INSERT INTO objectivity_history (user_id, month_id, score, voted_against, review_score, group_avg, deviation)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, month_id) DO UPDATE SET
          score = $3, voted_against = $4, review_score = $5, group_avg = $6, deviation = $7
      `, [userId, monthId, score, votedAgainst, userAvg, groupAvg, deviation]);

      // Actualizar score promedio del usuario
      const history = await query(
        'SELECT AVG(score) as avg_score FROM objectivity_history WHERE user_id = $1',
        [userId]
      );
      await query(
        'UPDATE users SET objectivity_score = $1 WHERE id = $2',
        [parseFloat(history.rows[0].avg_score).toFixed(2), userId]
      );
    }
  }
}

function avgField(rows, field) {
  return rows.reduce((sum, r) => sum + parseFloat(r[field]), 0) / rows.length;
}
