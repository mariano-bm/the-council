// ============================================
// SISTEMA DE RECOMPENSAS DE THE COUNCIL
// Perks, Cosmeticos, Poderes y Premios por rango
// ============================================

export const RANK_PERKS = {
  plebeius: {
    nominations: 1,
    perks: [],
    cosmetics: [],
    powers: [],
    color: null,
    border: null,
    nameEffect: null,
    title: 'Plebeius',
    description: 'Recien llegado al Consejo. Demuestra tu valor.',
  },
  miles: {
    nominations: 2,
    perks: [
      { id: 'extra_nom', icon: '🎮', name: 'Nominacion Extra', desc: 'Podes nominar 2 juegos por mes' },
    ],
    cosmetics: [
      { id: 'border_iron', icon: '🛡', name: 'Borde de Hierro', desc: 'Borde gris en tu perfil', type: 'border', value: 'border-stone-500/30' },
    ],
    powers: [],
    color: null,
    border: 'ring-stone-500/30',
    nameEffect: null,
    title: 'Miles',
    description: 'Soldado raso. Ya probaste tu compromiso.',
  },
  scutarius: {
    nominations: 2,
    perks: [
      { id: 'extra_nom', icon: '🎮', name: 'Nominacion Extra', desc: '2 juegos por mes' },
      { id: 'pitch_long', icon: '📝', name: 'Pitch Extendido', desc: 'Pitch de hasta 500 caracteres' },
    ],
    cosmetics: [
      { id: 'border_silver', icon: '⚔', name: 'Borde de Acero', desc: 'Borde plateado en tu perfil', type: 'border', value: 'ring-slate-400/40' },
      { id: 'tag_scutarius', icon: '🏷', name: 'Tag Exclusivo', desc: 'Tag "Escudero" junto a tu nombre', type: 'tag', value: 'SCUTARIUS' },
    ],
    powers: [],
    color: 'text-slate-300',
    border: 'ring-slate-400/40',
    nameEffect: null,
    title: 'Escudero',
    description: 'Protector del Consejo. Tu opinion empieza a pesar.',
  },
  eques: {
    nominations: 3,
    perks: [
      { id: 'nom_3', icon: '🎮', name: '3 Nominaciones', desc: 'Maximo de nominaciones por mes' },
      { id: 'pitch_long', icon: '📝', name: 'Pitch Extendido', desc: 'Hasta 500 caracteres' },
      { id: 'early_vote', icon: '🗳', name: 'Voto Anticipado', desc: 'Podes votar 12h antes que el resto' },
    ],
    cosmetics: [
      { id: 'border_blue', icon: '💎', name: 'Borde Zafiro', desc: 'Borde azul brillante', type: 'border', value: 'ring-sky-400/50' },
      { id: 'tag_eques', icon: '🏷', name: 'Tag Caballero', desc: 'Tag dorado "EQUES NOBILIS"', type: 'tag', value: 'EQUES NOBILIS' },
      { id: 'name_glow', icon: '✨', name: 'Nombre Brillante', desc: 'Tu nombre brilla sutilmente', type: 'nameEffect', value: 'glow-subtle' },
    ],
    powers: [],
    color: 'text-sky-400',
    border: 'ring-sky-400/50',
    nameEffect: 'glow-subtle',
    title: 'Caballero',
    description: 'Guerrero honorable. El Council te respeta.',
  },
  centurion: {
    nominations: 3,
    perks: [
      { id: 'nom_3', icon: '🎮', name: '3 Nominaciones', desc: 'Maximo de nominaciones' },
      { id: 'pitch_long', icon: '📝', name: 'Pitch Extendido', desc: 'Hasta 500 caracteres' },
      { id: 'early_vote', icon: '🗳', name: 'Voto Anticipado', desc: '12h antes que el resto' },
      { id: 'create_poll', icon: '📊', name: 'Crear Encuestas', desc: 'Podes crear encuestas para el grupo' },
    ],
    cosmetics: [
      { id: 'border_violet', icon: '🔮', name: 'Borde Violeta', desc: 'Borde violeta con glow', type: 'border', value: 'ring-violet-500/50' },
      { id: 'animated_avatar', icon: '🖼', name: 'Avatar Animado', desc: 'Borde del avatar con animacion', type: 'avatarEffect', value: 'pulse-ring' },
      { id: 'name_glow', icon: '✨', name: 'Nombre Brillante', desc: 'Glow violeta en tu nombre', type: 'nameEffect', value: 'glow-violet' },
    ],
    powers: [
      { id: 'create_poll', icon: '📊', name: 'Crear Encuestas', desc: 'Lanza encuestas rapidas al grupo' },
    ],
    color: 'text-violet-400',
    border: 'ring-violet-500/50 ring-2',
    nameEffect: 'glow-violet',
    title: 'Centurion',
    description: 'Lider de legiones. Tu voz tiene autoridad.',
  },
  legatus: {
    nominations: 3,
    perks: [
      { id: 'nom_3', icon: '🎮', name: '3 Nominaciones', desc: 'Maximo de nominaciones' },
      { id: 'pitch_unlimited', icon: '📝', name: 'Pitch Ilimitado', desc: 'Sin limite de caracteres' },
      { id: 'early_vote', icon: '🗳', name: 'Voto Anticipado', desc: '12h antes que el resto' },
      { id: 'double_vote', icon: '⚖', name: 'Voto Doble', desc: 'Tu primer puesto vale x2 en Borda count' },
    ],
    cosmetics: [
      { id: 'border_crimson', icon: '🩸', name: 'Borde Carmesi', desc: 'Borde rojo sangre con glow', type: 'border', value: 'ring-red-500/50' },
      { id: 'animated_avatar', icon: '🖼', name: 'Avatar con Fuego', desc: 'Particulas de fuego alrededor', type: 'avatarEffect', value: 'fire-ring' },
      { id: 'custom_title', icon: '👑', name: 'Titulo Custom', desc: 'Escribi tu propio titulo en latin', type: 'customTitle', value: true },
    ],
    powers: [
      { id: 'create_poll', icon: '📊', name: 'Encuestas', desc: 'Crear encuestas para el grupo' },
      { id: 'pin_message', icon: '📌', name: 'Pinear Mensajes', desc: 'Fijar mensajes en el activity feed' },
    ],
    color: 'text-red-400',
    border: 'ring-red-500/50 ring-2',
    nameEffect: 'glow-crimson',
    title: 'Legatus',
    description: 'Comandante de campo. Pocos cuestionan tus decisiones.',
  },
  magnis: {
    nominations: 4,
    perks: [
      { id: 'nom_4', icon: '🎮', name: '4 Nominaciones', desc: 'Una extra sobre el maximo!' },
      { id: 'pitch_unlimited', icon: '📝', name: 'Pitch Ilimitado', desc: 'Sin limite' },
      { id: 'early_vote', icon: '🗳', name: 'Voto Anticipado', desc: '24h antes que el resto' },
      { id: 'double_vote', icon: '⚖', name: 'Voto Doble', desc: 'Primer puesto vale x2' },
      { id: 'veto_nom', icon: '🚫', name: 'Veto', desc: 'Podes vetar 1 nominacion por mes' },
    ],
    cosmetics: [
      { id: 'border_gold', icon: '👑', name: 'Borde Dorado', desc: 'Borde dorado brillante con shimmer', type: 'border', value: 'ring-amber-400/60' },
      { id: 'animated_avatar', icon: '🖼', name: 'Avatar Legendario', desc: 'Aura dorada pulsante', type: 'avatarEffect', value: 'golden-aura' },
      { id: 'custom_title', icon: '👑', name: 'Titulo Custom', desc: 'Tu propio titulo en latin' },
      { id: 'profile_bg', icon: '🎨', name: 'Fondo de Perfil', desc: 'Fondo exclusivo en tu perfil', type: 'profileBg', value: 'gradient-royal' },
    ],
    powers: [
      { id: 'create_poll', icon: '📊', name: 'Encuestas', desc: 'Crear encuestas' },
      { id: 'pin_message', icon: '📌', name: 'Pinear', desc: 'Fijar mensajes' },
      { id: 'veto', icon: '🚫', name: 'Veto', desc: 'Vetar 1 nominacion/mes' },
    ],
    color: 'text-fuchsia-400',
    border: 'ring-amber-400/60 ring-2',
    nameEffect: 'glow-gold',
    title: 'Comandante',
    description: 'MAGNIS AXYTTRA. La elite del Consejo.',
  },
  archon: {
    nominations: 4,
    perks: [
      { id: 'nom_4', icon: '🎮', name: '4 Nominaciones', desc: 'Una extra sobre el maximo' },
      { id: 'pitch_unlimited', icon: '📝', name: 'Pitch Ilimitado', desc: 'Sin limite' },
      { id: 'early_vote_48', icon: '🗳', name: 'Voto Anticipado 48h', desc: '2 dias antes que el resto' },
      { id: 'double_vote', icon: '⚖', name: 'Voto Doble', desc: 'Primer puesto vale x2' },
      { id: 'veto_nom', icon: '🚫', name: 'Veto', desc: 'Vetar 1 nominacion/mes' },
      { id: 'immunity', icon: '🛡', name: 'Inmunidad', desc: 'No podes caer al Hoyo de la Verguenza' },
    ],
    cosmetics: [
      { id: 'border_emerald_glow', icon: '💚', name: 'Borde Esmeralda', desc: 'Borde verde con particulas', type: 'border', value: 'ring-emerald-400/60' },
      { id: 'crown_icon', icon: '👑', name: 'Corona en Avatar', desc: 'Corona dorada sobre tu avatar', type: 'avatarEffect', value: 'crown' },
      { id: 'custom_title', icon: '👑', name: 'Titulo Custom', desc: 'Tu titulo en latin' },
      { id: 'profile_bg', icon: '🎨', name: 'Fondo Exclusivo', desc: 'Fondo animado en tu perfil' },
      { id: 'name_rainbow', icon: '🌈', name: 'Nombre Arcoiris', desc: 'Tu nombre cambia de color', type: 'nameEffect', value: 'rainbow' },
    ],
    powers: [
      { id: 'create_poll', icon: '📊', name: 'Encuestas', desc: 'Crear encuestas' },
      { id: 'pin_message', icon: '📌', name: 'Pinear', desc: 'Fijar mensajes' },
      { id: 'veto', icon: '🚫', name: 'Veto', desc: 'Vetar 1 nominacion/mes' },
      { id: 'emergency_vote', icon: '🚨', name: 'Votacion de Emergencia', desc: 'Convocar votacion fuera de fase' },
    ],
    color: 'text-emerald-400',
    border: 'ring-emerald-400/60 ring-2',
    nameEffect: 'rainbow',
    title: 'Archon',
    description: 'ARCHON PRIMUS. Guardian supremo del Consejo.',
  },
  pontifex: {
    nominations: 5,
    perks: [
      { id: 'nom_5', icon: '🎮', name: '5 Nominaciones', desc: 'El doble del plebeius' },
      { id: 'pitch_unlimited', icon: '📝', name: 'Pitch Ilimitado', desc: 'Sin limite' },
      { id: 'early_vote_48', icon: '🗳', name: 'Voto Anticipado 48h', desc: '2 dias antes' },
      { id: 'triple_vote', icon: '⚖', name: 'Voto Triple', desc: 'Primer puesto vale x3' },
      { id: 'veto_2', icon: '🚫', name: 'Doble Veto', desc: 'Vetar 2 nominaciones/mes' },
      { id: 'immunity', icon: '🛡', name: 'Inmunidad Total', desc: 'Inmune al Hoyo y a penalizaciones' },
      { id: 'pardon', icon: '⛪', name: 'Perdon Divino', desc: 'Sacar a alguien del Hoyo de la Verguenza' },
    ],
    cosmetics: [
      { id: 'border_divine', icon: '✨', name: 'Borde Divino', desc: 'Borde dorado animado con particulas', type: 'border', value: 'ring-yellow-400/70' },
      { id: 'crown_animated', icon: '👑', name: 'Corona Animada', desc: 'Corona flotante sobre tu avatar', type: 'avatarEffect', value: 'crown-float' },
      { id: 'custom_everything', icon: '🎨', name: 'Todo Custom', desc: 'Color, titulo, fondo, todo personalizable' },
      { id: 'name_fire', icon: '🔥', name: 'Nombre en Llamas', desc: 'Tu nombre tiene efecto de fuego', type: 'nameEffect', value: 'fire' },
    ],
    powers: [
      { id: 'all_powers', icon: '⚡', name: 'Todos los Poderes', desc: 'Acceso a todos los poderes anteriores' },
      { id: 'pardon', icon: '⛪', name: 'Perdon Divino', desc: 'Rescatar del Hoyo de la Verguenza' },
      { id: 'decree', icon: '📜', name: 'Decreto', desc: 'Publicar decretos oficiales del Consejo' },
    ],
    color: 'text-yellow-400',
    border: 'ring-yellow-400/70 ring-2',
    nameEffect: 'fire',
    title: 'Sumo Pontifice',
    description: 'PONTIFEX MAXIMUS. Voz sagrada del Consejo.',
  },
  rex: {
    nominations: 5,
    perks: [
      { id: 'unlimited', icon: '♚', name: 'Sin Limites', desc: 'Todas las restricciones removidas' },
      { id: 'triple_vote', icon: '⚖', name: 'Voto Triple', desc: 'Tu primer puesto vale x3' },
      { id: 'veto_unlimited', icon: '🚫', name: 'Veto Ilimitado', desc: 'Veta lo que quieras' },
      { id: 'immunity', icon: '🛡', name: 'Inmunidad Absoluta', desc: 'Intocable' },
      { id: 'kings_choice', icon: '👑', name: 'Eleccion del Rey', desc: 'Si hay empate en votacion, vos decidis' },
    ],
    cosmetics: [
      { id: 'border_legendary', icon: '👑', name: 'Borde Legendario', desc: 'Borde dorado animado con corona y particulas', type: 'border', value: 'ring-yellow-300/80' },
      { id: 'full_crown', icon: '👑', name: 'Corona Completa', desc: 'Corona dorada brillante animada', type: 'avatarEffect', value: 'full-crown' },
      { id: 'custom_everything', icon: '🎨', name: 'Personalizacion Total', desc: 'Cambia absolutamente todo de tu perfil' },
      { id: 'name_legendary', icon: '⚡', name: 'Nombre Legendario', desc: 'Efecto epico animado en tu nombre', type: 'nameEffect', value: 'legendary' },
      { id: 'entrance', icon: '🎭', name: 'Entrada Epica', desc: 'Animacion especial cuando entras a la plataforma', type: 'entrance', value: true },
    ],
    powers: [
      { id: 'all_supreme', icon: '♚', name: 'Poder Supremo', desc: 'Todos los poderes sin restriccion' },
      { id: 'kings_choice', icon: '👑', name: 'Eleccion del Rey', desc: 'Desempate automatico a tu favor' },
      { id: 'knight', icon: '⚔', name: 'Nombrar Caballeros', desc: 'Subir de rango a otro miembro una vez por mes' },
      { id: 'exile', icon: '💀', name: 'Exilio', desc: 'Mandar a alguien al Hoyo por 1 semana' },
    ],
    color: 'text-yellow-300',
    border: 'ring-yellow-300/80 ring-2',
    nameEffect: 'legendary',
    title: 'Rey de los Juegos',
    description: 'REX LUDORUM. El trono es tuyo. Gobierno absoluto del Consejo.',
  },
};

// Premios reales que el admin puede asignar
export const REWARD_TYPES = [
  { id: 'steam_key', icon: '🎮', name: 'Key de Steam', category: 'gaming' },
  { id: 'discord_role', icon: '💬', name: 'Rol de Discord', category: 'discord' },
  { id: 'game_pass', icon: '🎫', name: 'Game Pass', category: 'gaming' },
  { id: 'custom_badge', icon: '🏅', name: 'Badge Personalizado', category: 'cosmetic' },
  { id: 'custom_title', icon: '📜', name: 'Titulo Personalizado', category: 'cosmetic' },
  { id: 'priority_pick', icon: '⭐', name: 'Pick Prioritario', category: 'power' },
  { id: 'free_pass', icon: '🛡', name: 'Pase Libre', category: 'power' },
  { id: 'other', icon: '🎁', name: 'Otro Premio', category: 'other' },
];

export function getRankPerks(rankId) {
  return RANK_PERKS[rankId] || RANK_PERKS.plebeius;
}

// Comparar 2 rangos: que desbloquea el nuevo que no tenia el viejo
export function getNewUnlocks(oldRankId, newRankId) {
  const oldPerks = RANK_PERKS[oldRankId] || RANK_PERKS.plebeius;
  const newPerks = RANK_PERKS[newRankId] || RANK_PERKS.plebeius;

  const oldPerkIds = new Set(oldPerks.perks.map(p => p.id));
  const oldCosmeticIds = new Set(oldPerks.cosmetics.map(c => c.id));
  const oldPowerIds = new Set(oldPerks.powers.map(p => p.id));

  return {
    perks: newPerks.perks.filter(p => !oldPerkIds.has(p.id)),
    cosmetics: newPerks.cosmetics.filter(c => !oldCosmeticIds.has(c.id)),
    powers: newPerks.powers.filter(p => !oldPowerIds.has(p.id)),
    nominationChange: newPerks.nominations !== oldPerks.nominations ? newPerks.nominations : null,
  };
}
