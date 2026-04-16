import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Shield, Gamepad2, Trophy, Star } from 'lucide-react';
import EmberBackground from '../components/ui/EmberBackground';
import CultistStatue from '../components/ui/CultistStatue';

// Rafaga de viento — linea horizontal que cruza la pantalla
function WindStreak({ delay, y, duration, width }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        height: '1px',
        width: `${width}px`,
        top: `${y}%`,
        left: '-15%',
        background: `linear-gradient(to right, transparent, rgba(212,168,71,0.12), rgba(255,255,255,0.06), transparent)`,
      }}
      animate={{
        x: ['0vw', '130vw'],
        opacity: [0, 0.8, 0.6, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// Particula arrastrada por el viento
function WindParticle({ delay, y, duration, yDrift }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: 2,
        height: 2,
        top: `${y}%`,
        left: '-5%',
        background: 'rgba(212,168,71,0.4)',
        boxShadow: '0 0 4px rgba(212,168,71,0.3), -8px 0 6px rgba(212,168,71,0.1), -16px 0 4px rgba(212,168,71,0.05)',
      }}
      animate={{
        x: ['0vw', '120vw'],
        y: [0, yDrift],
        opacity: [0, 0.9, 0.7, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: [0.2, 0.0, 0.3, 1],
      }}
    />
  );
}

// Runa decorativa animada
function Rune({ char, x, y, delay }) {
  return (
    <motion.span
      className="absolute text-medieval-gold/[0.04] text-6xl font-display select-none pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        opacity: [0.02, 0.08, 0.02],
        scale: [0.9, 1.05, 0.9],
        rotate: [0, 5, -5, 0],
      }}
      transition={{ duration: 8, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      {char}
    </motion.span>
  );
}

const RUNES = [
  { char: '⚔', x: 8, y: 15 },
  { char: '⚜', x: 85, y: 20 },
  { char: '♚', x: 12, y: 70 },
  { char: '🛡', x: 90, y: 65 },
  { char: '⛪', x: 50, y: 8 },
  { char: '🏛', x: 75, y: 80 },
  { char: '📜', x: 20, y: 85 },
  { char: '🗡', x: 80, y: 45 },
];

export default function LoginPage() {
  const { login, loginDemo, backendOnline } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-medieval-royal/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-medieval-gold/6 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-medieval-crimson/4 rounded-full blur-[120px]" />
      </div>

      {/* Runas flotantes de fondo */}
      {RUNES.map((r, i) => (
        <Rune key={i} {...r} delay={i * 1.2} />
      ))}

      {/* Brasas / particulas */}
      <EmberBackground count={35} />

      {/* Efecto de viento */}
      {[
        { delay: 1, y: 20, duration: 3.5, width: 350 },
        { delay: 5, y: 45, duration: 3, width: 500 },
        { delay: 9, y: 70, duration: 4, width: 280 },
        { delay: 13, y: 30, duration: 3.2, width: 420 },
        { delay: 17, y: 60, duration: 3.8, width: 300 },
      ].map((props, i) => (
        <WindStreak key={`ws-${i}`} {...props} />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <WindParticle
          key={`wp-${i}`}
          delay={i * 2.5 + i * 0.3}
          y={10 + (i * 10)}
          duration={2.5 + (i % 3)}
          yDrift={(i % 2 === 0 ? 1 : -1) * (15 + i * 3)}
        />
      ))}

      {/* Lineas decorativas laterales */}
      <motion.div
        className="absolute left-12 top-1/2 -translate-y-1/2 w-px h-[300px]"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(212,168,71,0.15), transparent)' }}
        animate={{ height: ['200px', '350px', '200px'], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-12 top-1/2 -translate-y-1/2 w-px h-[300px]"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(212,168,71,0.15), transparent)' }}
        animate={{ height: ['250px', '300px', '250px'], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 6, delay: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Estatuas cultistas */}
      <CultistStatue side="left" />
      <CultistStatue side="right" />

      {/* Contenido principal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="relative z-10 text-center max-w-xl mx-auto px-6"
      >
        {/* Espadas cruzadas encima del shield */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
          className="relative mx-auto mb-6 w-32 h-32"
        >
          {/* Glow pulsante atras */}
          <motion.div
            className="absolute inset-0 rounded-3xl blur-2xl"
            style={{ background: 'radial-gradient(circle, rgba(212,168,71,0.3) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Anillo exterior giratorio lento */}
          <motion.div
            className="absolute inset-2 rounded-2xl border border-medieval-gold/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          />
          {/* Shield principal */}
          <motion.div
            className="absolute inset-4 rounded-2xl flex items-center justify-center shadow-neon-gold"
            style={{ background: 'linear-gradient(135deg, #8b6f2e, #d4a847, #8b6f2e)' }}
            animate={{ boxShadow: [
              '0 0 20px rgba(212,168,71,0.3)',
              '0 0 40px rgba(212,168,71,0.5)',
              '0 0 20px rgba(212,168,71,0.3)',
            ]}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Shield className="w-12 h-12 text-council-darker" />
          </motion.div>
        </motion.div>

        {/* Ornamento superior */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex items-center justify-center gap-3 mb-6"
        >
          <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, rgba(212,168,71,0.4))' }} />
          <motion.span
            className="text-medieval-gold/40 text-lg"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >⚜</motion.span>
          <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, rgba(212,168,71,0.4))' }} />
        </motion.div>

        {/* Titulo principal con entrada cinematica */}
        <motion.h1
          initial={{ opacity: 0, y: 30, letterSpacing: '0.5em' }}
          animate={{ opacity: 1, y: 0, letterSpacing: '0.08em' }}
          transition={{ delay: 0.3, duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-5xl font-black mb-1 font-display"
        >
          <motion.span
            className="neon-text"
            animate={{
              textShadow: [
                '0 0 10px rgba(212,168,71,0.2)',
                '0 0 30px rgba(212,168,71,0.4), 0 0 60px rgba(212,168,71,0.15)',
                '0 0 10px rgba(212,168,71,0.2)',
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            The Council
          </motion.span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-xl font-semibold text-medieval-gold/40 mb-1 tracking-[0.15em]"
        >
          El Consejo
        </motion.p>

        {/* Ornamento inferior */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex items-center justify-center gap-3 mb-3"
        >
          <div className="h-px w-24" style={{ background: 'linear-gradient(to right, transparent, rgba(212,168,71,0.3))' }} />
          <span className="text-medieval-gold/20 text-xs">♦</span>
          <div className="h-px w-24" style={{ background: 'linear-gradient(to left, transparent, rgba(212,168,71,0.3))' }} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="text-white/30 text-base mb-14 tracking-wide"
        >
          Juego del Mes — Votaciones, Reviews & Rankings
        </motion.p>

        {/* Feature cards con entrada escalonada */}
        <div className="grid grid-cols-3 gap-4 mb-14">
          {[
            { icon: Gamepad2, label: 'Nominar', desc: 'Juegos del mes' },
            { icon: Trophy, label: 'Rankear', desc: 'Votacion ranked' },
            { icon: Star, label: 'Reviewear', desc: '5 categorias' },
          ].map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.4 + i * 0.15, type: 'spring', stiffness: 100 }}
              whileHover={{ y: -4, scale: 1.03 }}
              className="glass-panel p-5 group cursor-default"
            >
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Icon className="w-7 h-7 text-medieval-gold/70 mx-auto mb-2 group-hover:text-medieval-gold transition-colors" />
              </motion.div>
              <p className="text-sm font-semibold text-white/80">{label}</p>
              <p className="text-[10px] text-white/25 mt-0.5">{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Boton Discord con entrada epica */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.6, type: 'spring' }}
          whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(88,101,242,0.5)' }}
          whileTap={{ scale: 0.96 }}
          onClick={login}
          className="relative inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-white
                     bg-[#5865F2] hover:bg-[#4752C4] transition-colors duration-300"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          Iniciar sesion con Discord
        </motion.button>

        {/* Pie */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="text-white/10 text-[10px] mt-14 uppercase tracking-[0.3em] font-mono"
        >
          Hecha por El Viejo
        </motion.p>
      </motion.div>
    </div>
  );
}
