import clsx from 'clsx';
import { BADGE_ICONS } from '../../utils/helpers';

export default function Badge({ type, name, size = 'md', showLabel = true }) {
  const badge = BADGE_ICONS[type] || { emoji: '🏆', gradient: 'from-gray-400 to-gray-600' };

  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-3xl',
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={clsx(
          'shimmer-badge rounded-xl flex items-center justify-center',
          `bg-gradient-to-br ${badge.gradient}`,
          'shadow-lg',
          sizes[size]
        )}
        title={name}
      >
        <span>{badge.emoji}</span>
      </div>
      {showLabel && (
        <span className="text-[10px] font-medium text-white/50 text-center leading-tight max-w-[80px]">
          {name}
        </span>
      )}
    </div>
  );
}
