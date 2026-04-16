import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import GlassCard from '../components/ui/GlassCard';
import PhaseIndicator from '../components/ui/PhaseIndicator';
import { Calendar, ChevronLeft, ChevronRight, Trophy, Gamepad2, Vote, Star } from 'lucide-react';
import { getMonthName } from '../utils/helpers';

const PHASE_ICONS = {
  nomination: { icon: Gamepad2, label: 'Nominacion', color: 'text-medieval-gold' },
  voting: { icon: Vote, label: 'Votacion', color: 'text-medieval-royal-light' },
  playing: { icon: Gamepad2, label: 'Jugando', color: 'text-medieval-forest-light' },
  review: { icon: Star, label: 'Review', color: 'text-neon-amber' },
  completed: { icon: Trophy, label: 'Completado', color: 'text-white/50' },
};

export default function CalendarPage() {
  const { data: months } = useApi('/months');
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  // Buscar si hay data para este mes
  const monthData = months?.find(m => m.year === year && m.month === month + 1);

  const days = useMemo(() => {
    const result = [];
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    return result;
  }, [firstDay, daysInMonth]);

  function getPhaseForDay(day) {
    if (!monthData) return null;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (monthData.nomination_start && monthData.nomination_end) {
      if (dateStr >= monthData.nomination_start.substring(0, 10) && dateStr <= monthData.nomination_end.substring(0, 10)) return 'nomination';
    }
    if (monthData.voting_start && monthData.voting_end) {
      if (dateStr >= monthData.voting_start.substring(0, 10) && dateStr <= monthData.voting_end.substring(0, 10)) return 'voting';
    }
    if (monthData.review_start && monthData.review_end) {
      if (dateStr >= monthData.review_start.substring(0, 10) && dateStr <= monthData.review_end.substring(0, 10)) return 'review';
    }
    return null;
  }

  const today = new Date();
  const isToday = (day) => day && today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-3 medieval-text">
        <Calendar className="w-6 h-6 text-medieval-gold" />
        Calendario del Consejo
      </h1>

      <GlassCard>
        {/* Header con navegación */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1))}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white/50" />
          </button>
          <h2 className="text-xl font-bold text-white/90 medieval-text">
            {getMonthName(month + 1)} {year}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1))}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white/50" />
          </button>
        </div>

        {/* Fase actual */}
        {monthData && (
          <div className="flex items-center justify-center gap-3 mb-6">
            <PhaseIndicator phase={monthData.phase} />
            {monthData.winning_game_name && (
              <span className="text-sm text-medieval-gold">
                {monthData.winning_game_name}
              </span>
            )}
          </div>
        )}

        {/* Days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(d => (
            <div key={d} className="text-center text-[10px] text-white/30 uppercase tracking-wider font-semibold py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const phase = getPhaseForDay(day);
            const phaseInfo = phase ? PHASE_ICONS[phase] : null;

            return (
              <motion.div
                key={day}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.01 }}
                className={`
                  relative p-2 rounded-xl text-center min-h-[60px] transition-all
                  ${isToday(day) ? 'ring-1 ring-medieval-gold/50 bg-medieval-gold/10' : 'hover:bg-white/[0.03]'}
                  ${phase === 'nomination' ? 'bg-medieval-gold/5' : ''}
                  ${phase === 'voting' ? 'bg-medieval-royal/5' : ''}
                  ${phase === 'review' ? 'bg-neon-amber/5' : ''}
                `}
              >
                <span className={`text-sm font-mono ${isToday(day) ? 'text-medieval-gold font-bold' : 'text-white/50'}`}>
                  {day}
                </span>
                {phaseInfo && (
                  <div className={`mt-1 ${phaseInfo.color}`}>
                    <phaseInfo.icon className="w-3 h-3 mx-auto" />
                    <p className="text-[8px] mt-0.5">{phaseInfo.label}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </GlassCard>

      {/* Leyenda */}
      <div className="flex items-center justify-center gap-6">
        {Object.entries(PHASE_ICONS).map(([key, info]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${
              key === 'nomination' ? 'bg-medieval-gold' :
              key === 'voting' ? 'bg-medieval-royal-light' :
              key === 'playing' ? 'bg-medieval-forest-light' :
              key === 'review' ? 'bg-neon-amber' : 'bg-white/30'
            }`} />
            <span className="text-[10px] text-white/40">{info.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
