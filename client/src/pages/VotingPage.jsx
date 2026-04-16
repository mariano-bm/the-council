import { useState, useCallback } from 'react';
import { motion, Reorder } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import Avatar from '../components/ui/Avatar';
import { Vote, GripVertical, Check, Trophy } from 'lucide-react';

export default function VotingPage() {
  const { data, loading, refetch } = useApi('/voting/current');
  const [rankings, setRankings] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const games = data?.games || [];
  const hasVoted = data?.hasVoted;

  // Inicializar rankings cuando carguen los juegos
  useState(() => {
    if (games.length && !rankings.length && !hasVoted) {
      setRankings(games.map(g => g.id));
    }
  }, [games]);

  if (!data?.month) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/40">
        <Vote className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-lg">No hay fase de votación activa</p>
      </div>
    );
  }

  async function submitVotes() {
    const orderedRankings = (rankings.length ? rankings : games.map(g => g.id))
      .map((gameId, i) => ({ game_id: gameId, rank_position: i + 1 }));

    setSubmitting(true);
    try {
      await api.post('/voting', { rankings: orderedRankings });
      setSubmitted(true);
      refetch();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (hasVoted || submitted) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Check className="w-6 h-6 text-neon-emerald" />
          Voto Registrado
        </h1>
        <GlassCard>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-neon-emerald/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-neon-emerald" />
            </div>
            <p className="text-white/60">Tu voto fue registrado. Los resultados se revelarán cuando finalice la votación.</p>
            {data?.myVotes && (
              <div className="mt-6 space-y-2">
                <p className="text-xs text-white/30 uppercase tracking-wider mb-3">Tu ranking</p>
                {data.myVotes.map((v, i) => {
                  const game = games.find(g => g.id === v.game_id);
                  return (
                    <div key={v.id} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.02]">
                      <span className={`font-mono font-bold text-sm w-6 ${
                        i === 0 ? 'text-neon-amber' : 'text-white/30'
                      }`}>
                        #{i + 1}
                      </span>
                      <span className="text-white/70">{game?.name || 'Juego'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    );
  }

  const rankedGames = (rankings.length ? rankings : games.map(g => g.id))
    .map(id => games.find(g => g.id === id))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Vote className="w-6 h-6 text-neon-violet" />
            Votación
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Arrastrá para ordenar los juegos de más a menos preferido
          </p>
        </div>
        <button
          onClick={submitVotes}
          disabled={submitting}
          className="btn-primary flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          {submitting ? 'Enviando...' : 'Confirmar Voto'}
        </button>
      </div>

      <Reorder.Group
        axis="y"
        values={rankings.length ? rankings : games.map(g => g.id)}
        onReorder={setRankings}
        className="space-y-3"
      >
        {rankedGames.map((game, i) => (
          <Reorder.Item key={game.id} value={game.id}>
            <div className="glass-card p-4 flex items-center gap-4 cursor-grab active:cursor-grabbing">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-lg ${
                i === 0 ? 'bg-gradient-gold text-white' : 'bg-white/5 text-white/30'
              }`}>
                {i + 1}
              </div>
              <GripVertical className="w-4 h-4 text-white/20" />
              {game.cover_url && (
                <img src={game.cover_url} alt="" className="w-14 h-18 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white/90">{game.name}</h3>
                <p className="text-xs text-white/40 mt-0.5">
                  Nominado por {game.nominator}
                </p>
                {game.pitch && (
                  <p className="text-xs text-white/30 mt-1 italic line-clamp-1">"{game.pitch}"</p>
                )}
              </div>
              {i === 0 && <Trophy className="w-5 h-5 text-neon-amber" />}
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}
