import clsx from 'clsx';

export default function Avatar({ src, name, size = 'md', ring = false }) {
  const sizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div className={clsx(
      'rounded-full overflow-hidden flex-shrink-0',
      sizes[size],
      ring && 'ring-2 ring-neon-violet/50 ring-offset-2 ring-offset-council-dark'
    )}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-neon-violet to-neon-cyan flex items-center justify-center text-white font-bold text-sm">
          {name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  );
}
