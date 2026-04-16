/**
 * Borda Count — Sistema de votación por ranking
 * Cada votante ordena los juegos de más a menos preferido.
 * El juego en posición 1 recibe N puntos (N = total de candidatos),
 * posición 2 recibe N-1, etc.
 */
export function calculateBordaCount(votes, games) {
  const totalCandidates = games.length;
  const scores = {};

  // Inicializar scores
  for (const game of games) {
    scores[game.id] = {
      game_id: game.id,
      name: game.name,
      cover_url: game.cover_url,
      points: 0,
      first_place_votes: 0,
      voters: [],
    };
  }

  // Calcular puntos Borda
  for (const vote of votes) {
    if (scores[vote.game_id]) {
      const bordaPoints = totalCandidates - vote.rank_position + 1;
      scores[vote.game_id].points += Math.max(bordaPoints, 0);
      if (vote.rank_position === 1) {
        scores[vote.game_id].first_place_votes += 1;
      }
      scores[vote.game_id].voters.push({
        user_id: vote.user_id,
        rank: vote.rank_position,
      });
    }
  }

  // Ordenar por puntos (desempate: más votos en 1er lugar)
  return Object.values(scores).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.first_place_votes - a.first_place_votes;
  });
}

export function determineWinner(votes, games) {
  const results = calculateBordaCount(votes, games);
  return results[0] || null;
}
