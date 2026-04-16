import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function ProgressBar({ value, max = 100, color = 'violet', label, showValue = true }) {
  const pct = Math.min((value / max) * 100, 100);

  const colors = {
    violet: 'from-neon-violet to-purple-600',
    cyan: 'from-neon-cyan to-cyan-600',
    emerald: 'from-neon-emerald to-green-600',
    amber: 'from-neon-amber to-yellow-600',
    neon: 'from-neon-cyan via-neon-violet to-neon-emerald',
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-white/50">{label}</span>}
          {showValue && <span className="text-xs font-mono text-white/60">{value}/{max}</span>}
        </div>
      )}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={clsx('h-full rounded-full bg-gradient-to-r', colors[color])}
        />
      </div>
    </div>
  );
}
