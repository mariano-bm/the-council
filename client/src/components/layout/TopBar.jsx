import { useApi } from '../../hooks/useApi';
import PhaseIndicator from '../ui/PhaseIndicator';
import { getMonthName } from '../../utils/helpers';
import { Bell } from 'lucide-react';

export default function TopBar() {
  const { data: month } = useApi('/months/current');

  return (
    <header className="h-16 border-b border-white/[0.06] bg-council-darker/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {month && (
          <>
            <PhaseIndicator phase={month.phase} />
            <span className="text-sm text-white/40">
              {getMonthName(month.month)} {month.year}
            </span>
            {month.winning_game_name && (
              <span className="text-sm text-white/60">
                — <span className="text-neon-cyan font-medium">{month.winning_game_name}</span>
              </span>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-xl hover:bg-white/5 transition-colors">
          <Bell className="w-4 h-4 text-white/40" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-neon-violet rounded-full" />
        </button>
      </div>
    </header>
  );
}
