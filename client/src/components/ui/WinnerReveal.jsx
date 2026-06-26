import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Crown, Trophy, X } from 'lucide-react';

// Paleta dorada del Consejo para el confetti
const GOLD_COLORS = ['#d4a847', '#f0d078', '#8b6f2e', '#c42b2b', '#f5e6c8'];

function fireConfetti() {
  const end = Date.now() + 2200;
  // Cañones laterales dorados
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: GOLD_COLORS, scalar: 1.1 });
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: GOLD_COLORS, scalar: 1.1 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  // Estallido central al revelar
  setTimeout(() => {
    confetti({ particleCount: 140, spread: 100, startVelocity: 45, origin: { y: 0.45 }, colors: GOLD_COLORS, scalar: 1.2 });
  }, 250);
}

/**
 * Reveal épico del ganador del mes.
 * Props: game { name, cover_url }, nominator (string), onClose()
 * Secuencia: countdown 3-2-1 → estalla confetti → card dorada del ganador.
 */
const STEP = 850; // ms por número del countdown

export default function WinnerReveal({ game, nominator, onClose }) {
  const [phase, setPhase] = useState('countdown'); // countdown | reveal
  const [count, setCount] = useState(3);
  const startRef = useRef(null);
  const firedRef = useRef(false);

  // Countdown por timestamp absoluto — inmune a StrictMode double-mount y throttle
  useEffect(() => {
    if (startRef.current === null) startRef.current = Date.now();
    let raf;
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = 3 - Math.floor(elapsed / STEP);
      if (remaining <= 0) {
        setCount(0);
        setPhase('reveal');
        return;
      }
      setCount(remaining);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Confetti al entrar en reveal
  useEffect(() => {
    if (phase === 'reveal' && !firedRef.current) {
      firedRef.current = true;
      fireConfetti();
    }
  }, [phase]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-council-darker/85 backdrop-blur-md"
      onClick={phase === 'reveal' ? onClose : undefined}
    >
      {/* glows de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-medieval-gold/10 rounded-full blur-[140px]" />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'countdown' && (
          <motion.div
            key={`count-${count}`}
            initial={{ scale: 0.3, opacity: 0, rotateZ: -10 }}
            animate={{ scale: 1, opacity: 1, rotateZ: 0 }}
            exit={{ scale: 2.2, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
            className="relative text-center"
          >
            <p className="text-[10px] font-mono text-medieval-gold/40 uppercase tracking-[0.4em] mb-4">El Consejo decide</p>
            <span className="font-display text-[12rem] leading-none neon-text" style={{ filter: 'drop-shadow(0 0 30px rgba(212,168,71,0.4))' }}>
              {count > 0 ? count : '⚜'}
            </span>
          </motion.div>
        )}

        {phase === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ scale: 0.6, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 140, damping: 18 }}
            className="relative max-w-md w-full mx-6"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute -top-3 -right-3 z-10 p-2 rounded-full bg-council-darker border border-medieval-gold/20 text-white/40 hover:text-medieval-gold transition-colors">
              <X className="w-4 h-4" />
            </button>

            {/* Corona flotante */}
            <motion.div
              animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-9 left-1/2 -translate-x-1/2 z-10"
            >
              <Crown className="w-14 h-14 text-medieval-gold" style={{ filter: 'drop-shadow(0 0 16px rgba(212,168,71,0.6))' }} />
            </motion.div>

            {/* Card dorada del ganador */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-medieval-gold/40 shadow-neon-gold animate-fire-glow">
              {game?.cover_url && (
                <div className="absolute inset-0">
                  <img src={game.cover_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-council-darker via-council-darker/85 to-council-darker/40" />
                </div>
              )}
              <div className="absolute inset-0 shimmer-badge opacity-50 pointer-events-none" />

              <div className="relative p-8 pt-14 text-center">
                <p className="text-[10px] font-mono text-medieval-gold/60 uppercase tracking-[0.3em] mb-1 flex items-center justify-center gap-2">
                  <Trophy className="w-3 h-3" /> Ludus Mensis · Juego del Mes
                </p>
                {game?.cover_url && (
                  <motion.img
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}
                    src={game.cover_url} alt="" className="w-full h-36 object-cover rounded-xl my-4 ring-1 ring-medieval-gold/30"
                  />
                )}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="text-3xl font-black neon-text font-display leading-tight"
                >
                  {game?.name || 'El Ganador'}
                </motion.h2>
                {nominator && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                    className="text-sm text-white/50 mt-3"
                  >
                    Nominado por <span className="text-medieval-gold font-semibold">{nominator}</span>
                  </motion.p>
                )}
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                  className="text-[10px] font-mono text-medieval-gold/30 uppercase tracking-[0.25em] mt-5"
                >
                  "Vox Concilii, Lex Ludi"
                </motion.p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
