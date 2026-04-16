import { motion } from 'framer-motion';
import clsx from 'clsx';
import { getUserRank, getNextRank } from '../../utils/helpers';

export default function RankBadge({ points, overrideRank = null, size = 'md', showTitle = true, showLatin = true, showProgress = false }) {
  const rank = getUserRank(points, overrideRank);
  const next = getNextRank(points);

  const sizes = {
    sm: { badge: 'w-10 h-10', emoji: 'text-lg', title: 'text-xs', latin: 'text-[8px]' },
    md: { badge: 'w-16 h-16', emoji: 'text-3xl', title: 'text-sm', latin: 'text-[10px]' },
    lg: { badge: 'w-24 h-24', emoji: 'text-5xl', title: 'text-lg', latin: 'text-xs' },
    xl: { badge: 'w-32 h-32', emoji: 'text-6xl', title: 'text-xl', latin: 'text-sm' },
  };

  const s = sizes[size];
  const progressPct = next ? ((points - rank.min) / (next.min - rank.min)) * 100 : 100;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Badge principal */}
      <motion.div
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative"
      >
        {/* Glow exterior */}
        <div className={clsx(
          'absolute inset-0 rounded-2xl blur-xl opacity-40',
          `bg-gradient-to-br ${rank.gradient}`
        )} />

        {/* Corona animada para rangos altos */}
        {rank.crown && (
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl z-20"
          >
            {'👑'}
          </motion.div>
        )}

        {/* Badge body */}
        <div className={clsx(
          'relative rounded-2xl flex items-center justify-center shimmer-badge',
          `bg-gradient-to-br ${rank.gradient}`,
          'shadow-lg ring-2 ring-white/10',
          s.badge
        )}>
          {/* Inner shine */}
          <div className="absolute inset-[2px] rounded-[14px] bg-gradient-to-b from-white/20 to-transparent" />
          <span className={clsx('relative z-10', s.emoji)}>{rank.emoji}</span>
        </div>

        {/* Sparkle particles para rangos altos */}
        {rank.crown && (
          <>
            <motion.div
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-300"
            />
            <motion.div
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
              className="absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full bg-amber-400"
            />
            <motion.div
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1.4 }}
              className="absolute top-1/2 -right-2 w-1 h-1 rounded-full bg-yellow-200"
            />
          </>
        )}
      </motion.div>

      {/* Título y latín */}
      {showTitle && (
        <div className="text-center">
          <p className={clsx('font-bold text-white/90', s.title)}>{rank.title}</p>
          {showLatin && (
            <p className={clsx(
              'font-mono uppercase tracking-[0.2em] mt-0.5',
              rank.crown ? 'text-amber-400/70' : 'text-white/30',
              s.latin
            )}>
              {rank.latin}
            </p>
          )}
        </div>
      )}

      {/* Progress bar hacia siguiente rango */}
      {showProgress && next && (
        <div className="w-full max-w-[140px] mt-1">
          <div className="flex justify-between text-[9px] text-white/30 mb-1">
            <span>{points} pts</span>
            <span>{next.min} pts</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className={clsx('h-full rounded-full bg-gradient-to-r', rank.gradient)}
            />
          </div>
          <p className="text-[9px] text-white/20 text-center mt-1">
            Siguiente: <span className="text-white/40">{next.title}</span>
          </p>
        </div>
      )}
    </div>
  );
}
