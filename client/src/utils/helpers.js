export function getScoreColor(score) {
  const n = parseFloat(score);
  if (n >= 8) return 'text-neon-emerald';
  if (n >= 5) return 'text-neon-amber';
  return 'text-neon-red';
}

export function getScoreBg(score) {
  const n = parseFloat(score);
  if (n >= 8) return 'score-high';
  if (n >= 5) return 'score-mid';
  return 'score-low';
}

export function getObjectivityColor(score) {
  const n = parseFloat(score);
  if (n > 80) return { text: 'text-neon-emerald', bg: 'bg-neon-emerald/20', label: 'Objetivo' };
  if (n >= 50) return { text: 'text-neon-amber', bg: 'bg-neon-amber/20', label: 'Neutral' };
  return { text: 'text-neon-red', bg: 'bg-neon-red/20', label: 'Sesgado' };
}

export function getPhaseLabel(phase) {
  const labels = {
    nomination: 'Nominación',
    voting: 'Votación',
    playing: 'Jugando',
    review: 'Review',
    completed: 'Completado',
  };
  return labels[phase] || phase;
}

export function getPhaseClass(phase) {
  return `phase-indicator phase-${phase}`;
}

export function getMonthName(month) {
  const names = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return names[month - 1] || '';
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'hace un momento';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return formatDate(dateStr);
}

export const BADGE_ICONS = {
  taste_maker: { emoji: '👑', gradient: 'from-amber-400 to-yellow-600', latin: 'GUSTUS SUPREMUS' },
  the_oracle: { emoji: '🔮', gradient: 'from-violet-400 to-purple-600', latin: 'ORACULUM VERUM' },
  controversial_pick: { emoji: '🔥', gradient: 'from-red-400 to-orange-600', latin: 'IGNIS DISCORDIAE' },
  crowd_pleaser: { emoji: '🎉', gradient: 'from-cyan-400 to-blue-600', latin: 'VOX POPULI' },
  streak_master: { emoji: '⚡', gradient: 'from-emerald-400 to-green-600', latin: 'FULGUR PERPETUUM' },
  // Roles medievales
  rex_ludorum: { emoji: '♚', gradient: 'from-yellow-300 via-amber-500 to-yellow-700', latin: 'REX LUDORUM' },
  magnis_axytra: { emoji: '⚜', gradient: 'from-purple-400 via-fuchsia-500 to-violet-700', latin: 'MAGNIS AXYTTRA' },
  centurion: { emoji: '🛡', gradient: 'from-slate-300 via-zinc-400 to-slate-600', latin: 'CENTURION CONSILII' },
  pontifex: { emoji: '⛪', gradient: 'from-indigo-400 via-blue-500 to-indigo-700', latin: 'PONTIFEX MAXIMUS' },
  gladiator: { emoji: '⚔', gradient: 'from-red-500 via-rose-600 to-red-800', latin: 'GLADIATOR INVICTUS' },
  archon: { emoji: '🏛', gradient: 'from-cyan-300 via-teal-500 to-cyan-700', latin: 'ARCHON PRIMUS' },
  herald: { emoji: '📯', gradient: 'from-orange-300 via-amber-500 to-orange-600', latin: 'PRAECO MAGNUS' },
  sentinel: { emoji: '🗡', gradient: 'from-emerald-400 via-green-500 to-emerald-700', latin: 'SENTINELA AETERNA' },
};

// Sistema de rangos — todos arrancan como PLEBEIUS VULGARIS
// Se sube por puntos de recomendador O por asignacion directa del admin
export const COUNCIL_RANKS = [
  { id: 'plebeius',   min: 0,   title: 'Plebeius',             latin: 'PLEBEIUS VULGARIS',    emoji: '📜', gradient: 'from-zinc-400 to-zinc-600',                          crown: false },
  { id: 'miles',      min: 10,  title: 'Miles',                latin: 'MILES GREGARIUS',      emoji: '🗡', gradient: 'from-stone-400 to-stone-600',                         crown: false },
  { id: 'scutarius',  min: 25,  title: 'Escudero',             latin: 'SCUTARIUS',            emoji: '🛡', gradient: 'from-slate-300 to-slate-500',                          crown: false },
  { id: 'eques',      min: 50,  title: 'Caballero',            latin: 'EQUES NOBILIS',        emoji: '⚔',  gradient: 'from-sky-400 to-blue-600',                            crown: false },
  { id: 'centurion',  min: 80,  title: 'Centurion',            latin: 'CENTURION CONSILII',   emoji: '🏛', gradient: 'from-indigo-400 to-violet-600',                        crown: false },
  { id: 'legatus',    min: 120, title: 'Legatus',              latin: 'LEGATUS LEGIONIS',     emoji: '⚔',  gradient: 'from-red-500 via-rose-600 to-red-800',                crown: false },
  { id: 'magnis',     min: 170, title: 'Comandante',           latin: 'MAGNIS AXYTTRA',       emoji: '⚜',  gradient: 'from-purple-400 via-fuchsia-500 to-violet-700',        crown: false },
  { id: 'archon',     min: 230, title: 'Archon',               latin: 'ARCHON PRIMUS',        emoji: '👁',  gradient: 'from-cyan-400 via-teal-500 to-emerald-600',            crown: true },
  { id: 'pontifex',   min: 300, title: 'Sumo Pontifice',       latin: 'PONTIFEX MAXIMUS',     emoji: '⛪', gradient: 'from-amber-300 via-yellow-500 to-amber-600',            crown: true },
  { id: 'rex',        min: 400, title: 'Rey de los Juegos',    latin: 'REX LUDORUM',          emoji: '♚', gradient: 'from-yellow-300 via-amber-400 to-yellow-600',           crown: true },
];

// Obtener rango por puntos (automatico) o por override del admin
export function getUserRank(points, overrideRankId = null) {
  // Si el admin asigno un rango manualmente, ese gana
  if (overrideRankId) {
    const override = COUNCIL_RANKS.find(r => r.id === overrideRankId);
    if (override) return override;
  }
  // Sino, por puntos
  let rank = COUNCIL_RANKS[0]; // PLEBEIUS
  for (const r of COUNCIL_RANKS) {
    if (points >= r.min) rank = r;
  }
  return rank;
}

export function getNextRank(points) {
  for (const r of COUNCIL_RANKS) {
    if (points < r.min) return r;
  }
  return null; // Ya es REX LUDORUM
}

export function getRankById(id) {
  return COUNCIL_RANKS.find(r => r.id === id) || COUNCIL_RANKS[0];
}
