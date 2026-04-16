import { motion } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import GlassCard from '../components/ui/GlassCard';
import Avatar from '../components/ui/Avatar';
import { Skull, Flame, AlertTriangle, Clock, ThumbsDown, Ghost, Ban } from 'lucide-react';

// Datos mock en modo demo
const MOCK_SHAMED = [
  {
    id: 99,
    discord_name: 'Fantasma404',
    avatar_url: null,
    reasons: ['Sin conexion hace 30 dias', 'No voto en 3 meses seguidos'],
    shame_score: -45,
    last_seen: '2026-02-10T00:00:00Z',
    category: 'desertor',
  },
  {
    id: 98,
    discord_name: 'ToxicGamer',
    avatar_url: null,
    reasons: ['Reputacion negativa (-12)', 'Puntaje sesgado 4 meses seguidos'],
    shame_score: -30,
    last_seen: '2026-04-01T00:00:00Z',
    category: 'toxico',
  },
  {
    id: 97,
    discord_name: 'AFKLord',
    avatar_url: null,
    reasons: ['No jugo el juego del mes 3 veces', 'No dejo review 5 meses'],
    shame_score: -20,
    last_seen: '2026-03-25T00:00:00Z',
    category: 'afk',
  },
];

const CATEGORIES = {
  desertor: { icon: Ghost, label: 'DESERTOR', latin: 'FUGITIVUS', color: 'text-white/50', bg: 'bg-white/5' },
  toxico: { icon: Ban, label: 'TOXICO', latin: 'VENENUM', color: 'text-medieval-crimson-light', bg: 'bg-medieval-crimson/10' },
  afk: { icon: Clock, label: 'AFK', latin: 'IGNAVUS', color: 'text-neon-amber', bg: 'bg-neon-amber/5' },
};

export default function ShameHolePage() {
  const { data: users } = useApi('/users');

  // En modo demo sin backend, usar mock data
  const shamed = MOCK_SHAMED;

  return (
    <div className="space-y-8">
      {/* Header dramatico */}
      <div className="text-center py-6">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 12 }}
          className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-crimson flex items-center justify-center shadow-crimson animate-torch-flicker"
        >
          <Skull className="w-10 h-10 text-white/90" />
        </motion.div>
        <h1 className="text-3xl font-black text-medieval-crimson-light medieval-display uppercase tracking-wider">
          Hoyo de la Verguenza
        </h1>
        <p className="text-xs font-mono text-medieval-crimson-light/40 uppercase tracking-[0.3em] mt-1">
          FOVEA IGNOMINIAE
        </p>
        <div className="ornament-divider mt-4">
          <Flame className="w-4 h-4 text-medieval-crimson/40" />
        </div>
        <p className="text-white/30 text-sm max-w-md mx-auto">
          Aqui yacen los nombres de quienes abandonaron al Consejo,
          envenenaron la comunidad, o simplemente desaparecieron sin dejar rastro.
        </p>
      </div>

      {/* Shame cards */}
      <div className="space-y-4 max-w-2xl mx-auto">
        {shamed.map((user, i) => {
          const cat = CATEGORIES[user.category] || CATEGORIES.afk;
          const CatIcon = cat.icon;

          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15, type: 'spring' }}
            >
              <div className="shame-card">
                <div className="relative flex items-start gap-4">
                  {/* Avatar con efecto de "quemado" */}
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-medieval-crimson/40 grayscale opacity-60">
                      <Avatar src={user.avatar_url} name={user.discord_name} size="lg" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-medieval-crimson flex items-center justify-center">
                      <CatIcon className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  <div className="flex-1">
                    {/* Nombre y categoria */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white/70 line-through decoration-medieval-crimson/50">
                        {user.discord_name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold ${cat.color} ${cat.bg}`}>
                        {cat.label}
                      </span>
                      <span className="text-[9px] font-mono text-medieval-crimson-light/30 uppercase tracking-[0.2em]">
                        {cat.latin}
                      </span>
                    </div>

                    {/* Razones */}
                    <div className="space-y-1.5">
                      {user.reasons.map((reason, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3 text-medieval-crimson-light/50 flex-shrink-0" />
                          <span className="text-sm text-white/40">{reason}</span>
                        </div>
                      ))}
                    </div>

                    {/* Shame score */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5">
                        <ThumbsDown className="w-3 h-3 text-medieval-crimson-light/50" />
                        <span className="font-mono font-bold text-medieval-crimson-light text-sm">
                          {user.shame_score}
                        </span>
                        <span className="text-[9px] text-white/20">reputacion</span>
                      </div>
                      <span className="text-[10px] text-white/15">
                        Visto: {new Date(user.last_seen).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {shamed.length === 0 && (
        <div className="text-center py-20">
          <Ghost className="w-12 h-12 mx-auto mb-3 text-white/10" />
          <p className="text-white/20 medieval-text">El Hoyo esta vacio... por ahora.</p>
        </div>
      )}

      {/* Footer siniestro */}
      <div className="text-center py-6">
        <div className="ornament-divider">
          <Flame className="w-4 h-4 text-medieval-crimson/30" />
        </div>
        <p className="text-[10px] text-medieval-crimson/20 font-mono uppercase tracking-[0.3em]">
          "Qui deserit consilium, meretur ignominiam"
        </p>
        <p className="text-[9px] text-white/10 mt-1">
          Quien abandona al Consejo, merece la verguenza
        </p>
      </div>
    </div>
  );
}
