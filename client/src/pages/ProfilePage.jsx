import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import ScoreBadge from '../components/ui/ScoreBadge';
import ProgressBar from '../components/ui/ProgressBar';
import RankBadge from '../components/ui/RankBadge';
import { User, Trophy, Target, Gamepad2, Star } from 'lucide-react';
import { getObjectivityColor, getMonthName, formatDate } from '../utils/helpers';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const userId = id || currentUser?.id;
  const { data: profile, loading } = useApi(`/users/${userId}`);

  if (loading || !profile) {
    return <div className="text-white/40 text-center py-20">Cargando perfil...</div>;
  }

  const objColor = getObjectivityColor(profile.objectivity_score);

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-neon-violet/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="relative flex items-center gap-6">
          <Avatar src={profile.avatar_url} name={profile.discord_name} size="xl" ring />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">{profile.discord_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider bg-neon-violet/10 text-neon-violet font-semibold">
                {profile.role === 'admin' ? 'Admin' : 'Council Member'}
              </span>
            </div>
            <p className="text-sm text-white/30">
              Miembro desde {formatDate(profile.created_at)}
            </p>
          </div>

          {/* Rango medieval */}
          <RankBadge points={profile.recommender_points || 0} size="lg" showProgress />

          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <p className="font-mono text-2xl font-black text-neon-violet">{profile.recommender_points}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Puntos</p>
            </div>
            <div className="text-center">
              <p className={`font-mono text-2xl font-black ${objColor.text}`}>
                {parseFloat(profile.objectivity_score).toFixed(0)}
              </p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Objetividad</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl font-black text-neon-cyan">
                {profile.badges?.length || 0}
              </p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Badges</p>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-3 gap-6">
        {/* Badges */}
        <GlassCard>
          <h3 className="font-semibold text-white/80 mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-neon-amber" />
            Badges
          </h3>
          {profile.badges?.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {profile.badges.map(b => (
                <Badge key={b.id} type={b.badge_type} name={b.badge_name} />
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-4">Sin badges todavía</p>
          )}
        </GlassCard>

        {/* Objectivity history */}
        <GlassCard>
          <h3 className="font-semibold text-white/80 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-neon-emerald" />
            Historial de Objetividad
          </h3>
          <ProgressBar value={parseFloat(profile.objectivity_score)} max={100} color="emerald" label="Score actual" />
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
            {profile.objectivity_history?.map(oh => (
              <div key={oh.id} className="flex items-center justify-between text-sm py-1.5 border-b border-white/[0.03]">
                <span className="text-white/40 text-xs">
                  {getMonthName(oh.month)} {oh.year}
                </span>
                <div className="flex items-center gap-2">
                  {oh.voted_against && (
                    <span className="text-[10px] text-neon-red/60">Votó en contra</span>
                  )}
                  <span className={`font-mono font-bold text-xs ${getObjectivityColor(oh.score).text}`}>
                    {parseFloat(oh.score).toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
            {(!profile.objectivity_history || profile.objectivity_history.length === 0) && (
              <p className="text-white/30 text-xs text-center py-2">Sin historial</p>
            )}
          </div>
        </GlassCard>

        {/* Nominations history */}
        <GlassCard>
          <h3 className="font-semibold text-white/80 mb-4 flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-neon-cyan" />
            Nominaciones
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {profile.nominations?.map(n => (
              <div
                key={n.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  n.was_winner ? 'bg-neon-amber/5 border border-neon-amber/20' : 'bg-white/[0.02]'
                }`}
              >
                {n.cover_url && (
                  <img src={n.cover_url} alt="" className="w-8 h-10 rounded object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">{n.game_name}</p>
                  <p className="text-[10px] text-white/30">
                    {getMonthName(n.month)} {n.year}
                  </p>
                </div>
                {n.was_winner && <Trophy className="w-4 h-4 text-neon-amber" />}
              </div>
            ))}
            {(!profile.nominations || profile.nominations.length === 0) && (
              <p className="text-white/30 text-xs text-center py-4">Sin nominaciones</p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Reviews */}
      <GlassCard>
        <h3 className="font-semibold text-white/80 mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-neon-amber" />
          Historial de Reviews
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {profile.reviews?.map(r => (
            <div key={r.id} className="glass-panel p-3">
              <div className="flex items-center gap-2 mb-2">
                {r.cover_url && (
                  <img src={r.cover_url} alt="" className="w-8 h-10 rounded object-cover" />
                )}
                <div>
                  <p className="text-sm font-medium text-white/80 line-clamp-1">{r.game_name}</p>
                  <p className="text-[10px] text-white/30">
                    {getMonthName(r.month)} {r.year}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <ScoreBadge score={r.gameplay} label="GP" size="sm" />
                <ScoreBadge score={r.story} label="HI" size="sm" />
                <ScoreBadge score={r.graphics} label="GR" size="sm" />
                <ScoreBadge score={r.replayability} label="RE" size="sm" />
                <ScoreBadge score={r.group_fun} label="FG" size="sm" />
              </div>
            </div>
          ))}
          {(!profile.reviews || profile.reviews.length === 0) && (
            <p className="col-span-4 text-white/30 text-sm text-center py-6">Sin reviews todavía</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
