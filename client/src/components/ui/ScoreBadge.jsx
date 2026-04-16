import clsx from 'clsx';
import { getScoreBg } from '../../utils/helpers';

export default function ScoreBadge({ score, label, size = 'md' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={clsx('score-badge', getScoreBg(score), sizes[size])}>
        {parseFloat(score).toFixed(1)}
      </div>
      {label && (
        <span className="text-[10px] text-white/40 font-medium">{label}</span>
      )}
    </div>
  );
}
