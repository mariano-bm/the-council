import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import RankBadge from '../components/ui/RankBadge';
import { COUNCIL_RANKS, getUserRank, getNextRank } from '../utils/helpers';
import { RANK_PERKS, getRankPerks, REWARD_TYPES } from '../utils/perks';
import { Gift, Lock, Check, Crown, Swords, Palette, Zap, ChevronDown, Star, ArrowRight } from 'lucide-react';
import { useState } from 'react';

function PerkCard({ perk, unlocked, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`glass-panel p-3 flex items-center gap-3 transition-all ${
        unlocked ? 'opacity-100' : 'opacity-30 grayscale'
      }`}
    >
      <span className="text-xl">{perk.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${unlocked ? 'text-white/80' : 'text-white/40'}`}>{perk.name}</p>
        <p className="text-[10px] text-white/30">{perk.desc}</p>
      </div>
      {unlocked ? (
        <Check className="w-4 h-4 text-medieval-forest-light flex-shrink-0" />
      ) : (
        <Lock className="w-3 h-3 text-white/20 flex-shrink-0" />
      )}
    </motion.div>
  );
}

export default function RewardsPage() {
  const { user } = useAuth();
  const [expandedRank, setExpandedRank] = useState(null);
  const pts = user?.recommender_points || 0;
  const currentRank = getUserRank(pts, user?.override_rank);
  const nextRank = getNextRank(pts);
  const myPerks = getRankPerks(currentRank.id);

  const currentRankIndex = COUNCIL_RANKS.findIndex(r => r.id === currentRank.id);

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center py-2">
        <Gift className="w-10 h-10 mx-auto mb-3 text-medieval-gold" />
        <h1 className="text-3xl font-black text-white medieval-display">Recompensas</h1>
        <p className="text-[10px] font-mono text-medieval-gold/30 uppercase tracking-[0.3em] mt-1">PRAEMIA CONSILII</p>
        <p className="text-white/30 text-sm mt-3 max-w-lg mx-auto">
          Cada rango desbloquea perks, cosmeticos y poderes exclusivos.
          Subi de rango nominando juegos que el grupo disfrute.
        </p>
      </div>

      {/* Tus recompensas actuales */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-medieval-gold/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-6 mb-6">
            <RankBadge points={pts} overrideRank={user?.override_rank} size="lg" showProgress />
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider">Tus recompensas como</p>
              <h2 className="text-2xl font-bold text-white">{currentRank.title}</h2>
              <p className="font-mono text-medieval-gold/40 text-xs tracking-[0.2em]">{currentRank.latin}</p>
              {nextRank && (
                <p className="text-xs text-white/20 mt-1">
                  <span className="text-medieval-gold/50 font-mono">{nextRank.min - pts}</span> pts para desbloquear recompensas de <span className="text-white/40">{nextRank.title}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Perks */}
            <div>
              <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-medieval-gold" />
                Perks ({myPerks.perks.length})
              </h3>
              <div className="space-y-2">
                {myPerks.perks.length > 0 ? myPerks.perks.map((p, i) => (
                  <PerkCard key={p.id} perk={p} unlocked delay={i * 0.05} />
                )) : (
                  <p className="text-xs text-white/20 text-center py-4">Sin perks todavia</p>
                )}
              </div>
            </div>

            {/* Cosmeticos */}
            <div>
              <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-medieval-gold" />
                Cosmeticos ({myPerks.cosmetics.length})
              </h3>
              <div className="space-y-2">
                {myPerks.cosmetics.length > 0 ? myPerks.cosmetics.map((c, i) => (
                  <PerkCard key={c.id} perk={c} unlocked delay={i * 0.05} />
                )) : (
                  <p className="text-xs text-white/20 text-center py-4">Sin cosmeticos todavia</p>
                )}
              </div>
            </div>

            {/* Poderes */}
            <div>
              <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
                <Swords className="w-4 h-4 text-medieval-gold" />
                Poderes ({myPerks.powers.length})
              </h3>
              <div className="space-y-2">
                {myPerks.powers.length > 0 ? myPerks.powers.map((p, i) => (
                  <PerkCard key={p.id} perk={p} unlocked delay={i * 0.05} />
                )) : (
                  <p className="text-xs text-white/20 text-center py-4">Sin poderes todavia</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Roadmap de rangos — que desbloquea cada uno */}
      <div>
        <h2 className="text-lg font-semibold text-white/80 mb-6 flex items-center gap-2">
          <Crown className="w-5 h-5 text-medieval-gold" />
          Todas las Recompensas por Rango
        </h2>

        <div className="space-y-3">
          {COUNCIL_RANKS.map((rank, i) => {
            const rankPerks = RANK_PERKS[rank.id];
            const isUnlocked = i <= currentRankIndex;
            const isCurrent = rank.id === currentRank.id;
            const isExpanded = expandedRank === rank.id;

            return (
              <motion.div
                key={rank.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                {/* Header clickeable */}
                <button
                  onClick={() => setExpandedRank(isExpanded ? null : rank.id)}
                  className={`w-full glass-card p-4 flex items-center gap-4 text-left transition-all ${
                    isCurrent ? 'ring-1 ring-medieval-gold/30' : ''
                  } ${!isUnlocked ? 'opacity-50' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${rank.gradient} flex items-center justify-center text-2xl flex-shrink-0 ${
                    isUnlocked ? 'shimmer-badge' : 'grayscale'
                  }`}>
                    {rank.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold ${isUnlocked ? 'text-white/90' : 'text-white/40'}`}>
                        {rank.title}
                      </h3>
                      <span className="text-[9px] font-mono text-medieval-gold/25 uppercase tracking-wider">{rank.latin}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] bg-medieval-gold/20 text-medieval-gold font-bold">ACTUAL</span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/25">{rankPerks?.description}</p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <span className="font-mono text-sm text-white/30">{rank.min} pts</span>
                      <div className="flex gap-1 mt-0.5">
                        <span className="text-[9px] text-white/20">{rankPerks?.perks.length || 0}P</span>
                        <span className="text-[9px] text-white/20">{rankPerks?.cosmetics.length || 0}C</span>
                        <span className="text-[9px] text-white/20">{rankPerks?.powers.length || 0}W</span>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-white/20 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Contenido expandido */}
                {isExpanded && rankPerks && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-1 glass-panel p-5"
                  >
                    <div className="grid grid-cols-3 gap-4">
                      {/* Perks */}
                      <div>
                        <h4 className="text-xs font-semibold text-medieval-gold/60 flex items-center gap-1.5 mb-2">
                          <Zap className="w-3 h-3" /> Perks
                        </h4>
                        {rankPerks.perks.length > 0 ? rankPerks.perks.map(p => (
                          <div key={p.id} className="flex items-center gap-2 py-1.5 border-b border-white/[0.03] last:border-0">
                            <span className="text-sm">{p.icon}</span>
                            <div>
                              <p className={`text-xs ${isUnlocked ? 'text-white/70' : 'text-white/30'}`}>{p.name}</p>
                              <p className="text-[9px] text-white/20">{p.desc}</p>
                            </div>
                          </div>
                        )) : <p className="text-[10px] text-white/15">—</p>}
                      </div>

                      {/* Cosmeticos */}
                      <div>
                        <h4 className="text-xs font-semibold text-medieval-gold/60 flex items-center gap-1.5 mb-2">
                          <Palette className="w-3 h-3" /> Cosmeticos
                        </h4>
                        {rankPerks.cosmetics.length > 0 ? rankPerks.cosmetics.map(c => (
                          <div key={c.id} className="flex items-center gap-2 py-1.5 border-b border-white/[0.03] last:border-0">
                            <span className="text-sm">{c.icon}</span>
                            <div>
                              <p className={`text-xs ${isUnlocked ? 'text-white/70' : 'text-white/30'}`}>{c.name}</p>
                              <p className="text-[9px] text-white/20">{c.desc}</p>
                            </div>
                          </div>
                        )) : <p className="text-[10px] text-white/15">—</p>}
                      </div>

                      {/* Poderes */}
                      <div>
                        <h4 className="text-xs font-semibold text-medieval-gold/60 flex items-center gap-1.5 mb-2">
                          <Swords className="w-3 h-3" /> Poderes
                        </h4>
                        {rankPerks.powers.length > 0 ? rankPerks.powers.map(p => (
                          <div key={p.id} className="flex items-center gap-2 py-1.5 border-b border-white/[0.03] last:border-0">
                            <span className="text-sm">{p.icon}</span>
                            <div>
                              <p className={`text-xs ${isUnlocked ? 'text-white/70' : 'text-white/30'}`}>{p.name}</p>
                              <p className="text-[9px] text-white/20">{p.desc}</p>
                            </div>
                          </div>
                        )) : <p className="text-[10px] text-white/15">—</p>}
                      </div>
                    </div>

                    {/* Nominaciones */}
                    <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                      <span className="text-xs text-white/30">Nominaciones por mes:</span>
                      <span className="font-mono font-bold text-medieval-gold">{rankPerks.nominations}</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Premios Reales */}
      <GlassCard>
        <h2 className="text-lg font-semibold text-white/80 mb-2 flex items-center gap-2">
          <Gift className="w-5 h-5 text-medieval-gold" />
          Premios Reales
        </h2>
        <p className="text-xs text-white/30 mb-5">
          El Viejo puede otorgar premios reales a los miembros destacados del Consejo.
        </p>
        <div className="grid grid-cols-4 gap-3">
          {REWARD_TYPES.map((reward, i) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              className="glass-panel p-4 text-center group hover:bg-white/[0.04] transition-all"
            >
              <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">{reward.icon}</span>
              <p className="text-xs font-semibold text-white/70">{reward.name}</p>
              <p className="text-[9px] text-white/20 mt-0.5 uppercase tracking-wider">{reward.category}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Footer */}
      <div className="text-center py-4">
        <div className="ornament-divider">
          <Star className="w-4 h-4 text-medieval-gold/30" />
        </div>
        <p className="text-[10px] text-white/10 font-mono uppercase tracking-[0.2em]">
          "Qui meretur, praemium accipiet"
        </p>
        <p className="text-[9px] text-white/[0.06] mt-1">Quien lo merezca, recibira su recompensa</p>
      </div>
    </div>
  );
}
