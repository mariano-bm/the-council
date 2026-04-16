import { motion } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import PhaseIndicator from '../components/ui/PhaseIndicator';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { getMonthName, timeAgo, getScoreColor } from '../utils/helpers';
import { Trophy, Gamepad2, Users, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: month } = useApi('/months/current');
  const { data: months } = useApi('/months');
  const { data: leaderboard } = useApi('/leaderboard');
  const { data: activity } = useApi('/activity?limit=8');

  const recentWinners = months?.filter(m => m.winning_game_name).slice(0, 3) || [];
  const topPlayers = leaderboard?.slice(0, 5) || [];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white">
          Bienvenido, <span className="neon-text">{user?.discord_name}</span>
        </h1>
        <p className="text-white/40 mt-1">Panel principal del Council</p>
      </motion.div>

      {/* Phase + current game */}
      {month && (
        <GlassCard className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon-violet/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-neon flex items-center justify-center">
                {month.phase === 'nomination' && <Gamepad2 className="w-8 h-8 text-white" />}
                {month.phase === 'voting' && <Users className="w-8 h-8 text-white" />}
                {month.phase === 'playing' && <Gamepad2 className="w-8 h-8 text-white" />}
                {month.phase === 'review' && <TrendingUp className="w-8 h-8 text-white" />}
                {month.phase === 'completed' && <Trophy className="w-8 h-8 text-white" />}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <PhaseIndicator phase={month.phase} />
                  <span className="text-white/30 text-sm">
                    {getMonthName(month.month)} {month.year}
                  </span>
                </div>
                <p className="text-white/60 text-sm">
                  {month.phase === 'nomination' && 'Nominá tus juegos favoritos para este mes'}
                  {month.phase === 'voting' && 'Votá tu ranking de juegos nominados'}
                  {month.phase === 'playing' && `Jugando: ${month.winning_game_name || 'TBD'}`}
                  {month.phase === 'review' && 'Dejá tu review del juego del mes'}
                  {month.phase === 'completed' && 'Mes finalizado — mirá los resultados'}
                </p>
              </div>
            </div>
            <Link
              to={
                month.phase === 'nomination' ? '/nominations'
                : month.phase === 'voting' ? '/voting'
                : '/reviews'
              }
              className="btn-primary flex items-center gap-2"
            >
              {month.phase === 'nomination' ? 'Nominar' : month.phase === 'voting' ? 'Votar' : 'Reviewear'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Recent winners */}
        <div className="col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white/80 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-neon-amber" />
            Últimos Ganadores
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {recentWinners.map((m, i) => (
              <GlassCard key={m.id} delay={i * 0.1} className="relative overflow-hidden">
                {m.winning_game_cover && (
                  <div className="absolute inset-0 opacity-10">
                    <img src={m.winning_game_cover} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="relative">
                  {i === 0 && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center text-xs shimmer-badge">
                      <Trophy className="w-4 h-4" />
                    </div>
                  )}
                  <p className="text-xs text-white/30 mb-2">
                    {getMonthName(m.month)} {m.year}
                  </p>
                  <h3 className="font-bold text-white/90 mb-1 line-clamp-2">
                    {m.winning_game_name}
                  </h3>
                  {m.nominator_name && (
                    <p className="text-xs text-neon-violet/70">
                      Nominado por {m.nominator_name}
                    </p>
                  )}
                </div>
              </GlassCard>
            ))}
            {recentWinners.length === 0 && (
              <div className="col-span-3 glass-panel p-8 text-center text-white/30">
                <Gamepad2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Todavía no hay juegos ganadores</p>
              </div>
            )}
          </div>

          {/* Activity feed */}
          <h2 className="text-lg font-semibold text-white/80 flex items-center gap-2 mt-8">
            <Clock className="w-5 h-5 text-neon-cyan" />
            Actividad Reciente
          </h2>
          <div className="glass-panel divide-y divide-white/[0.04]">
            {activity?.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Avatar src={a.avatar_url} name={a.discord_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/70">
                    <span className="font-medium text-white/90">{a.discord_name}</span>
                    {' '}
                    {a.action === 'nomination' && 'nominó un juego'}
                    {a.action === 'voted' && 'envió su voto'}
                    {a.action === 'review' && 'dejó una review'}
                    {a.action === 'badge_earned' && `ganó el badge "${a.details?.badge}"`}
                    {a.action === 'user_joined' && 'se unió al Council'}
                    {a.action === 'phase_changed' && `cambió la fase a ${a.details?.phase}`}
                    {a.action === 'winner_declared' && `declaró ganador: ${a.details?.game_name}`}
                    {a.action === 'month_created' && 'creó un nuevo mes'}
                  </p>
                </div>
                <span className="text-xs text-white/20 flex-shrink-0">
                  {timeAgo(a.created_at)}
                </span>
              </motion.div>
            ))}
            {(!activity || activity.length === 0) && (
              <p className="px-4 py-6 text-center text-white/30 text-sm">Sin actividad reciente</p>
            )}
          </div>
        </div>

        {/* Leaderboard sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white/80 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-neon-emerald" />
            Top Recomendadores
          </h2>
          <div className="glass-panel">
            {topPlayers.map((p, i) => (
              <Link
                key={p.id}
                to={`/profile/${p.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors border-b border-white/[0.04] last:border-0"
              >
                <span className={`w-6 text-center font-mono text-sm font-bold ${
                  i === 0 ? 'text-neon-amber' : i === 1 ? 'text-white/50' : i === 2 ? 'text-amber-700' : 'text-white/20'
                }`}>
                  #{i + 1}
                </span>
                <Avatar src={p.avatar_url} name={p.discord_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{p.discord_name}</p>
                  <p className="text-[10px] text-white/30">
                    {p.winning_nominations || 0} ganadores
                  </p>
                </div>
                <span className="font-mono text-sm font-bold text-neon-violet">
                  {p.recommender_points}
                  <span className="text-[10px] text-white/30 ml-0.5">pts</span>
                </span>
              </Link>
            ))}
            {topPlayers.length === 0 && (
              <p className="px-4 py-6 text-center text-white/30 text-sm">Sin datos todavía</p>
            )}
          </div>

          <Link to="/leaderboard" className="btn-secondary w-full flex items-center justify-center gap-2 mt-2">
            Ver Leaderboard completo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
