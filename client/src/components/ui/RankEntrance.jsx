import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserRank, COUNCIL_RANKS } from '../../utils/helpers';

// Color principal por rango (para glow y partículas temáticas)
const RANK_COLOR = {
  plebeius: '#a1a1aa', miles: '#a8a29e', scutarius: '#cbd5e1', eques: '#38bdf8',
  centurion: '#818cf8', legatus: '#ef4444', magnis: '#d946ef', archon: '#2dd4bf',
  pontifex: '#fbbf24', rex: '#fde047',
};

/**
 * Entrada épica al perfil, escalada según el rango.
 * tier 0 (rangos bajos) → no muestra nada.
 * tier 1 → destello sutil. tier 2 → partículas. tier 3 (coronados) → máximo épico.
 * Se muestra 1 vez por perfil por sesión.
 */
export default function RankEntrance({ points, overrideRank, userId }) {
  const rank = getUserRank(points, overrideRank);
  const idx = COUNCIL_RANKS.findIndex(r => r.id === rank.id);
  const tier = idx <= 2 ? 0 : idx <= 5 ? 1 : idx <= 7 ? 2 : 3;
  const color = RANK_COLOR[rank.id] || '#d4a847';
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (tier === 0 || !userId) return;
    const key = `rank_intro_${userId}_${rank.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    setShow(true);
    const dur = tier === 3 ? 2800 : tier === 2 ? 2300 : 1700;
    const t = setTimeout(() => setShow(false), dur);
    return () => clearTimeout(t);
  }, [userId, rank.id, tier]);

  const particles = useMemo(() => {
    const n = tier * 6;
    return Array.from({ length: n }).map((_, i) => ({
      id: i,
      x: 6 + Math.random() * 88,
      delay: Math.random() * 0.5,
      dur: 1.4 + Math.random() * 1.2,
      size: 3 + Math.random() * 6,
      drift: (Math.random() - 0.5) * 120,
    }));
  }, [tier]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none overflow-hidden"
          style={{ background: `radial-gradient(ellipse at center, ${color}14 0%, rgba(6,5,10,0.92) 60%)` }}
        >
          {/* Rayos de luz girando — solo tier 3 (coronados). Contenido + GPU-accelerated. */}
          {tier >= 3 && (
            <motion.div
              className="absolute w-[700px] h-[700px] rounded-full"
              style={{
                background: `conic-gradient(from 0deg, transparent 0deg, ${color}26 12deg, transparent 26deg, transparent 62deg, ${color}1c 74deg, transparent 88deg)`,
                willChange: 'transform',
                maskImage: 'radial-gradient(circle, black 0%, transparent 70%)',
                WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 70%)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            />
          )}

          {/* Halo pulsante (tier 2+) */}
          {tier >= 2 && (
            <motion.div
              className="absolute rounded-full"
              style={{ width: 420, height: 420, background: `radial-gradient(circle, ${color}33 0%, transparent 70%)` }}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.6, 1.4, 1.1], opacity: [0, 0.9, 0.5] }}
              transition={{ duration: 1.6, ease: 'easeOut' }}
            />
          )}

          {/* Partículas temáticas */}
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: p.size, height: p.size, left: `${p.x}%`, bottom: '8%',
                background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                boxShadow: `0 0 ${p.size * 2}px ${color}`,
              }}
              initial={{ y: 0, opacity: 0, scale: 0.3 }}
              animate={{ y: -340 - Math.random() * 200, x: p.drift, opacity: [0, 1, 0], scale: [0.3, 1, 0.2] }}
              transition={{ duration: p.dur, delay: p.delay, ease: 'easeOut' }}
            />
          ))}

          {/* Emoji + título + latín del rango */}
          <div className="relative text-center">
            <motion.div
              initial={{ scale: 0, rotate: -25, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 14 }}
              className="text-[9rem] leading-none mb-2"
              style={{ filter: `drop-shadow(0 0 40px ${color}) drop-shadow(0 0 16px ${color})` }}
            >
              {rank.emoji}
            </motion.div>

            {rank.crown && (
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: [-6, -14, -6], opacity: 1 }}
                transition={{ y: { duration: 2, repeat: Infinity, ease: 'easeInOut' }, opacity: { delay: 0.3 } }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 text-4xl"
                style={{ filter: `drop-shadow(0 0 16px ${color})` }}
              >
                👑
              </motion.div>
            )}

            <motion.h2
              initial={{ y: 20, opacity: 0, letterSpacing: '0.5em' }}
              animate={{ y: 0, opacity: 1, letterSpacing: '0.08em' }}
              transition={{ delay: 0.25, duration: 0.7 }}
              className="font-display text-4xl font-black"
              style={{ color, textShadow: `0 0 30px ${color}99` }}
            >
              {rank.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="font-mono uppercase tracking-[0.4em] text-sm mt-2"
              style={{ color: `${color}aa` }}
            >
              {rank.latin}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
