import { motion } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import GlassCard from '../components/ui/GlassCard';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import RankBadge from '../components/ui/RankBadge';
import { Trophy, Crown, Medal, Award } from 'lucide-react';
import { getObjectivityColor, getUserRank } from '../utils/helpers';
import { Link } from 'react-router-dom';

export default function LeaderboardPage() {
  const { data: leaderboard } = useApi('/leaderboard');
  const { data: recentBadges } = useApi('/leaderboard/badges');

  const players = leaderboard || [];
  const maxPoints = players[0]?.recommender_points || 1;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white flex items-center gap-3">
        <Trophy className="w-6 h-6 text-neon-amber" />
        Leaderboard
      </h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Main leaderboard */}
        <div className="col-span-2 space-y-3">
          {/* Top 3 podium */}
          {players.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[1, 0, 2].map(i => {
                const p = players[i];
                if (!p) return null;
                const isFirst = i === 0;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className={`${isFirst ? 'order-first col-span-1' : ''}`}
                  >
                    <Link to={`/profile/${p.id}`}>
                      <GlassCard className={`text-center ${isFirst ? 'ring-1 ring-neon-amber/30' : ''} ${i === 1 ? '-mt-4' : ''}`}>
                        <div className="relative inline-block mb-3">
                          <Avatar src={p.avatar_url} name={p.discord_name} size="xl" ring={isFirst} />
                          <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? 'bg-gradient-gold' : i === 1 ? 'bg-gray-400' : 'bg-amber-700'
                          }`}>
                            {i === 0 ? <Crown className="w-4 h-4" /> : `#${i + 1}`}
                          </div>
                        </div>
                        <h3 className="font-bold text-white/90">{p.discord_name}</h3>
                        <RankBadge points={p.recommender_points || 0} size="sm" showProgress={false} />
                        <p className="font-mono text-2xl font-black neon-text mt-1">{p.recommender_points}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-wider">puntos</p>
                      </GlassCard>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Rest of leaderboard */}
          {players.slice(3).map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
            >
              <Link to={`/profile/${p.id}`} className="block">
                <div className="glass-card p-4 flex items-center gap-4">
                  <span className="w-8 text-center font-mono text-sm font-bold text-white/20">
                    #{i + 4}
                  </span>
                  <Avatar src={p.avatar_url} name={p.discord_name} />
                  <RankBadge points={p.recommender_points || 0} size="sm" showTitle={false} showLatin={false} showProgress={false} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white/80">{p.discord_name}</p>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-white/25">
                        {getUserRank(p.recommender_points || 0).latin}
                      </span>
                    </div>
                    <ProgressBar
                      value={p.recommender_points}
                      max={maxPoints}
                      color="neon"
                      showValue={false}
                    />
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-neon-violet">{p.recommender_points}</p>
                    <p className="text-[10px] text-white/30">{p.badge_count || 0} badges</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`text-xs font-mono font-bold ${getObjectivityColor(p.objectivity_score).text}`}>
                      {parseFloat(p.objectivity_score).toFixed(0)}
                    </span>
                    <span className="text-[10px] text-white/20">OBJ</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Badges sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white/80 flex items-center gap-2">
            <Award className="w-5 h-5 text-neon-violet" />
            Badges Recientes
          </h2>
          <div className="glass-panel divide-y divide-white/[0.04]">
            {recentBadges?.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Badge type={b.badge_type} name={b.badge_name} size="sm" showLabel={false} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80">{b.badge_name}</p>
                  <p className="text-[10px] text-white/40">{b.discord_name}</p>
                </div>
              </motion.div>
            ))}
            {(!recentBadges || recentBadges.length === 0) && (
              <p className="px-4 py-6 text-center text-white/30 text-sm">Sin badges todavía</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
