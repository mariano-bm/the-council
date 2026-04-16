import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import RankBadge from '../components/ui/RankBadge';
import { COUNCIL_RANKS, getUserRank, getNextRank, BADGE_ICONS } from '../utils/helpers';
import { ScrollText, Swords, Trophy, Star, TrendingUp, ArrowRight, Info, Crown } from 'lucide-react';

const POINT_RULES = [
  { action: 'Tu juego gana la votacion', points: '+10', icon: Trophy, color: 'text-medieval-gold' },
  { action: 'Puntaje grupal del juego >8', points: '+5', icon: Star, color: 'text-neon-amber' },
  { action: 'Todos los miembros jugaron', points: '+3', icon: Swords, color: 'text-medieval-forest-light' },
  { action: 'Puntaje grupal del juego <5', points: '-5', icon: TrendingUp, color: 'text-medieval-crimson-light' },
];

export default function RanksPage() {
  const { user } = useAuth();
  const currentRank = getUserRank(user?.recommender_points || 0, user?.override_rank);
  const nextRank = getNextRank(user?.recommender_points || 0);
  const pts = user?.recommender_points || 0;

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center py-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ScrollText className="w-10 h-10 mx-auto mb-3 text-medieval-gold" />
          <h1 className="text-3xl font-black text-white medieval-display">Codex de Rangos</h1>
          <p className="text-[10px] font-mono text-medieval-gold/30 uppercase tracking-[0.3em] mt-1">CODEX GRADUUM CONSILII</p>
          <p className="text-white/30 text-sm mt-3 max-w-lg mx-auto">
            Todo miembro del Consejo comienza su camino como Plebeius.
            Ascende nominando juegos que el grupo disfrute y acumulando puntos de recomendador.
          </p>
        </motion.div>
      </div>

      {/* Tu rango actual */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-medieval-gold/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="relative flex items-center gap-8">
          <RankBadge points={pts} overrideRank={user?.override_rank} size="xl" showProgress />
          <div className="flex-1">
            <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Tu rango actual</p>
            <h2 className="text-2xl font-bold text-white">{currentRank.title}</h2>
            <p className="font-mono text-medieval-gold/50 text-sm tracking-[0.2em]">{currentRank.latin}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="font-mono text-lg font-bold text-medieval-gold">{pts}</span>
              <span className="text-xs text-white/30">puntos de recomendador</span>
            </div>
            {nextRank && (
              <div className="flex items-center gap-2 mt-2 text-xs text-white/20">
                <ArrowRight className="w-3 h-3" />
                <span>Siguiente: <span className="text-white/40">{nextRank.title}</span> — te faltan <span className="text-medieval-gold/60 font-mono">{nextRank.min - pts}</span> pts</span>
              </div>
            )}
            {!nextRank && (
              <p className="text-xs text-medieval-gold/40 mt-2 flex items-center gap-1">
                <Crown className="w-3 h-3" /> Alcanzaste el rango maximo
              </p>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Mapa de rangos */}
      <div>
        <h2 className="text-lg font-semibold text-white/80 mb-6 flex items-center gap-2">
          <Crown className="w-5 h-5 text-medieval-gold" />
          Escalera de Rangos
        </h2>

        <div className="relative">
          {/* Linea vertical dorada */}
          <div className="absolute left-[39px] top-0 bottom-0 w-px bg-gradient-to-b from-medieval-gold/40 via-medieval-gold/20 to-medieval-gold/5" />

          <div className="space-y-4">
            {[...COUNCIL_RANKS].reverse().map((rank, i) => {
              const isCurrentRank = rank.id === currentRank.id;
              const isAchieved = pts >= rank.min;
              const isNext = nextRank && rank.id === nextRank.id;

              return (
                <motion.div
                  key={rank.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-5 pl-1"
                >
                  {/* Nodo en la linea */}
                  <div className={`relative z-10 w-[78px] flex-shrink-0 flex justify-center`}>
                    <div className={`
                      w-14 h-14 rounded-xl flex items-center justify-center text-2xl
                      transition-all duration-500
                      ${isCurrentRank
                        ? `bg-gradient-to-br ${rank.gradient} shadow-neon-gold ring-2 ring-medieval-gold/50 shimmer-badge`
                        : isAchieved
                          ? `bg-gradient-to-br ${rank.gradient} opacity-70`
                          : 'bg-white/[0.03] border border-white/[0.06] opacity-30'
                      }
                    `}>
                      {rank.emoji}
                    </div>
                  </div>

                  {/* Info del rango */}
                  <div className={`
                    flex-1 rounded-xl p-4 transition-all
                    ${isCurrentRank
                      ? 'bg-medieval-gold/[0.06] border border-medieval-gold/20'
                      : isNext
                        ? 'bg-white/[0.02] border border-dashed border-medieval-gold/10'
                        : 'bg-white/[0.01]'
                    }
                  `}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className={`font-bold ${isCurrentRank ? 'text-medieval-gold' : isAchieved ? 'text-white/80' : 'text-white/30'}`}>
                            {rank.title}
                          </h3>
                          {isCurrentRank && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] bg-medieval-gold/20 text-medieval-gold font-bold uppercase tracking-wider">
                              Tu rango
                            </span>
                          )}
                          {isNext && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] bg-white/5 text-white/30 font-bold uppercase tracking-wider">
                              Siguiente
                            </span>
                          )}
                          {rank.crown && (
                            <span className="text-xs">👑</span>
                          )}
                        </div>
                        <p className={`text-[10px] font-mono uppercase tracking-[0.15em] mt-0.5 ${isCurrentRank ? 'text-medieval-gold/40' : 'text-white/15'}`}>
                          {rank.latin}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono font-bold text-sm ${isAchieved ? 'text-medieval-gold/60' : 'text-white/20'}`}>
                          {rank.min} pts
                        </p>
                        {rank.crown && (
                          <p className="text-[9px] text-medieval-gold/20">Corona dorada</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Como ganar puntos */}
      <GlassCard>
        <h2 className="text-lg font-semibold text-white/80 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-medieval-gold" />
          Como ganar puntos
        </h2>
        <p className="text-sm text-white/30 mb-5">
          Los puntos se ganan nominando juegos. Si tu juego gana la votacion del mes, recibes puntos
          segun como lo reciba el grupo.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {POINT_RULES.map(({ action, points, icon: Icon, color }, i) => (
            <motion.div
              key={action}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="glass-panel p-4 flex items-center gap-3"
            >
              <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
              <div className="flex-1">
                <p className="text-sm text-white/70">{action}</p>
              </div>
              <span className={`font-mono font-bold text-sm ${points.startsWith('-') ? 'text-medieval-crimson-light' : 'text-medieval-gold'}`}>
                {points}
              </span>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Badges especiales */}
      <GlassCard>
        <h2 className="text-lg font-semibold text-white/80 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-medieval-gold" />
          Badges Especiales
        </h2>
        <p className="text-sm text-white/30 mb-5">
          Ademas de los rangos, podes ganar badges unicos por logros especificos.
        </p>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(BADGE_ICONS).filter(([k]) => !['rex_ludorum','magnis_axytra','centurion','pontifex','gladiator','archon','herald','sentinel'].includes(k)).map(([key, badge], i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="glass-panel p-4 text-center"
            >
              <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${badge.gradient} flex items-center justify-center text-2xl shimmer-badge mb-2`}>
                {badge.emoji}
              </div>
              <p className="text-xs font-semibold text-white/70">{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
              <p className="text-[8px] font-mono text-medieval-gold/25 uppercase tracking-wider mt-0.5">{badge.latin}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Nota del admin */}
      <div className="text-center py-4">
        <div className="ornament-divider">
          <ScrollText className="w-4 h-4 text-medieval-gold/30" />
        </div>
        <p className="text-[10px] text-white/15 font-mono uppercase tracking-[0.2em]">
          El Viejo puede asignar rangos manualmente desde el panel de administrador
        </p>
      </div>
    </div>
  );
}
