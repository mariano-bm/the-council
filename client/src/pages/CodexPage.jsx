import { useState } from 'react';
import { motion } from 'framer-motion';
import RanksPage from './RanksPage';
import RewardsPage from './RewardsPage';
import { ScrollText, Gift } from 'lucide-react';

const TABS = [
  { id: 'rangos', label: 'Rangos', icon: ScrollText },
  { id: 'recompensas', label: 'Recompensas', icon: Gift },
];

export default function CodexPage() {
  const [tab, setTab] = useState('rangos');

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-medieval-gold/[0.06] w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                active ? 'bg-medieval-gold/10 text-medieval-gold shadow-sm' : 'text-white/30 hover:text-white/50'
              }`}>
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {tab === 'rangos' && <RanksPage />}
        {tab === 'recompensas' && <RewardsPage />}
      </motion.div>
    </div>
  );
}
