import { query } from '../config/database.js';

const BADGE_TYPES = {
  TASTE_MAKER: { type: 'taste_maker', name: 'Taste Maker', description: '3 juegos ganadores seguidos' },
  THE_ORACLE: { type: 'the_oracle', name: 'The Oracle', description: 'Juego con puntaje grupal >9' },
  CONTROVERSIAL: { type: 'controversial_pick', name: 'Controversial Pick', description: 'Mayor varianza de puntajes' },
  CROWD_PLEASER: { type: 'crowd_pleaser', name: 'Crowd Pleaser', description: 'Todos pusieron >7' },
  STREAK_MASTER: { type: 'streak_master', name: 'Streak Master', description: 'Mayor racha de juegos con >7 grupal' },
};

export async function updateRecommenderPoints(monthId) {
  const month = await query('SELECT * FROM months WHERE id = $1', [monthId]);
  if (!month.rows.length || !month.rows[0].winning_game_id) return;

  const winningGameId = month.rows[0].winning_game_id;

  // Quién nominó el juego ganador
  const nominators = await query(
    'SELECT DISTINCT user_id FROM nominations WHERE month_id = $1 AND game_id = $2',
    [monthId, winningGameId]
  );

  // Reviews del juego
  const reviews = await query(
    'SELECT * FROM reviews WHERE month_id = $1 AND game_id = $2',
    [monthId, winningGameId]
  );

  const totalMembers = await query('SELECT COUNT(*) as count FROM users');
  const allPlayed = reviews.rows.length >= parseInt(totalMembers.rows[0].count);

  const groupAvg = reviews.rows.length
    ? reviews.rows.reduce((sum, r) => {
        return sum + (parseFloat(r.gameplay) + parseFloat(r.story) + parseFloat(r.graphics) +
                      parseFloat(r.replayability) + parseFloat(r.group_fun)) / 5;
      }, 0) / reviews.rows.length
    : 0;

  for (const nom of nominators.rows) {
    let points = 10; // Base: juego ganó la votación

    if (groupAvg > 8) points += 5;    // Bonus puntaje alto
    if (allPlayed) points += 3;       // Bonus todos jugaron
    if (groupAvg < 5) points -= 5;    // Penalización puntaje bajo

    await query(
      'UPDATE users SET recommender_points = recommender_points + $1 WHERE id = $2',
      [points, nom.user_id]
    );
  }
}

export async function checkAndAwardBadges(monthId) {
  const month = await query('SELECT * FROM months WHERE id = $1', [monthId]);
  if (!month.rows.length || !month.rows[0].winning_game_id) return;

  const winningGameId = month.rows[0].winning_game_id;

  // Reviews del juego ganador
  const reviews = await query(
    'SELECT * FROM reviews WHERE month_id = $1 AND game_id = $2',
    [monthId, winningGameId]
  );

  if (!reviews.rows.length) return;

  const groupAvg = reviews.rows.reduce((sum, r) => {
    return sum + (parseFloat(r.gameplay) + parseFloat(r.story) + parseFloat(r.graphics) +
                  parseFloat(r.replayability) + parseFloat(r.group_fun)) / 5;
  }, 0) / reviews.rows.length;

  // Varianza
  const scores = reviews.rows.map(r =>
    (parseFloat(r.gameplay) + parseFloat(r.story) + parseFloat(r.graphics) +
     parseFloat(r.replayability) + parseFloat(r.group_fun)) / 5
  );
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - groupAvg, 2), 0) / scores.length;

  // Nominadores del ganador
  const nominators = await query(
    'SELECT DISTINCT user_id FROM nominations WHERE month_id = $1 AND game_id = $2',
    [monthId, winningGameId]
  );

  for (const nom of nominators.rows) {
    // THE ORACLE: puntaje grupal >9
    if (groupAvg > 9) {
      await awardBadge(nom.user_id, BADGE_TYPES.THE_ORACLE, monthId, winningGameId);
    }

    // CROWD PLEASER: todos pusieron >7
    const allAbove7 = scores.every(s => s > 7);
    if (allAbove7) {
      await awardBadge(nom.user_id, BADGE_TYPES.CROWD_PLEASER, monthId, winningGameId);
    }

    // CONTROVERSIAL PICK: varianza alta (>3)
    if (variance > 3) {
      await awardBadge(nom.user_id, BADGE_TYPES.CONTROVERSIAL, monthId, winningGameId);
    }

    // TASTE MAKER: 3 ganadores seguidos
    const recentWins = await query(`
      SELECT m.id FROM months m
      JOIN nominations n ON n.month_id = m.id AND n.user_id = $1 AND n.game_id = m.winning_game_id
      WHERE m.phase = 'completed'
      ORDER BY m.year DESC, m.month DESC
      LIMIT 3
    `, [nom.user_id]);

    if (recentWins.rows.length >= 3) {
      await awardBadge(nom.user_id, BADGE_TYPES.TASTE_MAKER, monthId, winningGameId);
    }

    // STREAK MASTER: racha de juegos con >7 grupal
    const completedMonths = await query(`
      SELECT m.id, ga.total_avg
      FROM months m
      JOIN game_analytics ga ON ga.month_id = m.id AND ga.game_id = m.winning_game_id
      JOIN nominations n ON n.month_id = m.id AND n.user_id = $1 AND n.game_id = m.winning_game_id
      WHERE m.phase = 'completed'
      ORDER BY m.year DESC, m.month DESC
    `, [nom.user_id]);

    let streak = 0;
    for (const cm of completedMonths.rows) {
      if (parseFloat(cm.total_avg) > 7) streak++;
      else break;
    }
    if (streak >= 3) {
      await awardBadge(nom.user_id, BADGE_TYPES.STREAK_MASTER, monthId, winningGameId);
    }
  }
}

async function awardBadge(userId, badgeInfo, monthId, gameId) {
  // Evitar duplicados del mismo badge para el mismo mes
  const existing = await query(
    'SELECT id FROM badges WHERE user_id = $1 AND badge_type = $2 AND month_id = $3',
    [userId, badgeInfo.type, monthId]
  );
  if (existing.rows.length) return;

  await query(`
    INSERT INTO badges (user_id, badge_type, badge_name, badge_description, month_id, game_id)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [userId, badgeInfo.type, badgeInfo.name, badgeInfo.description, monthId, gameId]);

  await query(
    `INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'badge_earned', $2)`,
    [userId, JSON.stringify({ badge: badgeInfo.name })]
  );
}
