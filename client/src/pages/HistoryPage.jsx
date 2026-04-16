import { motion } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import GlassCard from '../components/ui/GlassCard';
import PhaseIndicator from '../components/ui/PhaseIndicator';
import { History, Trophy, Calendar } from 'lucide-react';
import { getMonthName } from '../utils/helpers';
import { Link } from 'react-router-dom';

export default function HistoryPage() {
  const { data: months } = useApi('/months');
  const allMonths = months || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-3">
        <History className="w-6 h-6 text-neon-cyan" />
        Historial — Juego del Mes
      </h1>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[23px] top-0 bottom-0 w-px bg-gradient-to-b from-neon-violet/50 via-neon-cyan/30 to-transparent" />

        <div className="space-y-6">
          {allMonths.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-6 pl-2"
            >
              {/* Timeline dot */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                m.winning_game_name
                  ? 'bg-gradient-neon shadow-neon-violet'
                  : 'bg-white/5 border border-white/10'
              }`}>
                {m.winning_game_name ? (
                  <Trophy className="w-4 h-4 text-white" />
                ) : (
                  <Calendar className="w-4 h-4 text-white/30" />
                )}
              </div>

              {/* Card */}
              <GlassCard className="flex-1 relative overflow-hidden" delay={i * 0.05}>
                {m.winning_game_cover && (
                  <div className="absolute inset-0 opacity-[0.03]">
                    <img src={m.winning_game_cover} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-white/80">
                        {getMonthName(m.month)} {m.year}
                      </span>
                      <PhaseIndicator phase={m.phase} />
                    </div>
                    {m.winning_game_name ? (
                      <div className="flex items-center gap-3">
                        {m.winning_game_cover && (
                          <img src={m.winning_game_cover} alt="" className="w-16 h-22 rounded-xl object-cover" />
                        )}
                        <div>
                          <h3 className="font-bold text-neon-cyan text-lg">{m.winning_game_name}</h3>
                          {m.nominator_name && (
                            <p className="text-xs text-white/40">
                              Nominado por <span className="text-neon-violet">{m.nominator_name}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-white/30 text-sm">En progreso...</p>
                    )}
                  </div>
                  {m.phase === 'completed' && (
                    <Link to={`/reviews`} className="btn-secondary text-xs">
                      Ver Reviews
                    </Link>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {allMonths.length === 0 && (
          <div className="text-center py-20 text-white/30">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Sin historial todavía</p>
          </div>
        )}
      </div>
    </div>
  );
}
