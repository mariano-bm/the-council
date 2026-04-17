import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import { Gamepad2, ChevronDown, Zap, ExternalLink, Plus, X, Search, Send, BookOpen } from 'lucide-react';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';

// Juegos del grupo hardcodeados + los que se agreguen
const DEFAULT_GAMES = [
  { name: 'Warframe', steam_app_id: 230410, cover_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/230410/header.jpg', genres: ['Action', 'Free to Play', 'RPG'], synopsis: 'Shooter cooperativo free-to-play con parkour ninja y looter. Misiones, frames con habilidades unicas, y grind infinito.', tryhard: 'Usa la wiki de Warframe (warframe.fandom.com). Farmea mods esenciales primero (Serration, Hornet Strike). Enfocate en un frame y un arma. Market para tradear plata.' },
  { name: 'Brawlhalla', steam_app_id: 291550, cover_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/291550/header.jpg', genres: ['Fighting', 'Free to Play'], synopsis: 'Plataforma de pelea estilo Smash Bros. Free to play con leyendas rotativas y ranked competitivo.', tryhard: 'Aprende a leer dodges y gravity cancel. Practica combos en training mode. Passive play gana en ranked bajo. Busca guias de Cosolix y Boomie en YouTube.' },
  { name: 'Rainbow Six Siege', steam_app_id: 359550, cover_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/359550/header.jpg', genres: ['FPS', 'Tactical', 'Multiplayer'], synopsis: 'FPS tactico 5v5 con destruccion de entorno. Cada operador tiene gadget unico. Comunicacion y estrategia son clave.', tryhard: 'Aprende los callouts de cada mapa. Usa R6Tracker para stats. Drone siempre antes de entrar. Vertical play (abrir pisos) es meta. Mira videos de Coconut Brah para trucos.' },
  { name: 'Age of Empires II: DE', steam_app_id: 813780, cover_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/813780/header.jpg', genres: ['Strategy', 'RTS'], synopsis: 'RTS clasico remasterizado. Civilizaciones historicas, economia, combate. Ranked 1v1 y team games.', tryhard: 'Practica build orders en Cicero interactive build order guide (mod de Steam). Fast Castle es basico. Usa aoe2.net para ver tu ELO y meta. Spirit of the Law en YouTube para stats de unidades.' },
  { name: 'League of Legends', steam_app_id: null, cover_url: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg', genres: ['MOBA', 'Free to Play', 'Competitive'], synopsis: 'MOBA 5v5 competitivo. Elige un campeon, farmea, teamfight. Ranked es vida o muerte.', tryhard: 'Usa op.gg para builds y counters. One-trick un campeon para subir. CS es mas importante que kills. Mira replays de tus derrotas. Ward. WARD.' },
];

export default function GamesPage() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(null);
  const [tryhardMode, setTryhardMode] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [customGames, setCustomGames] = useState([]);
  const [newSynopsis, setNewSynopsis] = useState('');
  const [newTryhard, setNewTryhard] = useState('');

  const allGames = [...DEFAULT_GAMES, ...customGames];

  async function searchGames() {
    if (searchQuery.length < 2) return;
    setSearching(true);
    try {
      const results = await api.get(`/games/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(results);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }

  function addGame(game) {
    setCustomGames(prev => [...prev, {
      name: game.name,
      steam_app_id: game.steam_app_id,
      cover_url: game.cover_url,
      genres: game.genres || [],
      synopsis: newSynopsis || game.description || '',
      tryhard: newTryhard || '',
    }]);
    setShowAdd(false);
    setSearchResults([]);
    setSearchQuery('');
    setNewSynopsis('');
    setNewTryhard('');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Gamepad2 className="w-6 h-6 text-medieval-gold" />
            Juegos del Council
          </h1>
          <p className="text-white/40 text-sm mt-1">Los juegos que jugamos — info, guias y modo tryhard</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Agregar Juego
          </button>
        )}
      </div>

      {/* Add game form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard className="space-y-3">
              <div className="flex gap-2">
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchGames()}
                  placeholder="Buscar juego en Steam..." className="input-field flex-1" />
                <button onClick={searchGames} disabled={searching} className="btn-secondary">
                  <Search className="w-4 h-4" />
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {searchResults.map((g, i) => (
                    <button key={i} onClick={() => { setSearchResults([]); setSearchQuery(g.name); setNewSynopsis(g.description || ''); }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-medieval-gold/5 transition-all text-left">
                      {g.cover_url && <img src={g.cover_url} alt="" className="w-20 h-9 rounded object-cover" />}
                      <span className="text-sm text-white/80">{g.name}</span>
                    </button>
                  ))}
                </div>
              )}
              <textarea value={newSynopsis} onChange={e => setNewSynopsis(e.target.value)} placeholder="Sinopsis..." rows={2} className="input-field resize-none text-sm" />
              <textarea value={newTryhard} onChange={e => setNewTryhard(e.target.value)} placeholder="Info modo tryhard (guias, tips, recursos)..." rows={2} className="input-field resize-none text-sm" />
              <button onClick={() => { if (searchQuery) addGame({ name: searchQuery, cover_url: searchResults[0]?.cover_url, genres: searchResults[0]?.genres, steam_app_id: searchResults[0]?.steam_app_id }); }}
                disabled={!searchQuery} className="btn-primary text-sm disabled:opacity-40">
                <Send className="w-4 h-4 inline mr-2" /> Agregar
              </button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game cards */}
      <div className="grid grid-cols-1 gap-4">
        {allGames.map((game, i) => {
          const isExpanded = expanded === i;
          const isTryhard = tryhardMode === i;

          return (
            <motion.div key={game.name}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 120 }}>
              <div className="glass-card overflow-hidden group">
                {/* Main card */}
                <div className="relative">
                  {/* BG cover */}
                  {game.cover_url && (
                    <div className="absolute inset-0 opacity-[0.08] group-hover:opacity-[0.14] transition-opacity duration-500">
                      <img src={game.cover_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="relative p-5 flex items-center gap-5">
                    {/* Cover art */}
                    {game.cover_url && (
                      <img src={game.cover_url} alt="" className="w-36 h-[68px] rounded-xl object-cover flex-shrink-0 shadow-glass" />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white/90 text-lg group-hover:text-medieval-gold transition-colors">{game.name}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {game.genres?.map(g => (
                          <span key={g} className="px-2 py-0.5 rounded-full text-[9px] bg-medieval-gold/8 text-medieval-gold/50">{g}</span>
                        ))}
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Tryhard mode */}
                      {game.tryhard && (
                        <motion.button
                          onClick={() => setTryhardMode(isTryhard ? null : i)}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isTryhard
                              ? 'bg-medieval-crimson/20 text-medieval-crimson-light border border-medieval-crimson/30 shadow-crimson'
                              : 'bg-white/[0.03] text-white/30 hover:text-medieval-crimson-light hover:bg-medieval-crimson/10 border border-transparent'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          {isTryhard ? 'TRYHARD ON' : 'Tryhard'}
                        </motion.button>
                      )}

                      {/* Expand synopsis */}
                      <button
                        onClick={() => setExpanded(isExpanded ? null : i)}
                        className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-medieval-gold/10 text-medieval-gold' : 'bg-white/[0.03] text-white/20 hover:text-white/50'}`}
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Steam link */}
                      {game.steam_app_id && (
                        <a href={`https://store.steampowered.com/app/${game.steam_app_id}`} target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-white/[0.03] text-white/20 hover:text-white/50 transition-all">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded: synopsis */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 pt-0">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <p className="text-xs text-white/30 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3" /> Sinopsis
                          </p>
                          <p className="text-sm text-white/50 leading-relaxed">{game.synopsis || 'Sin sinopsis todavia.'}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tryhard mode panel */}
                <AnimatePresence>
                  {isTryhard && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-0">
                        <div className="p-4 rounded-xl bg-medieval-crimson/5 border border-medieval-crimson/15 relative overflow-hidden">
                          {/* Glow */}
                          <div className="absolute top-0 left-0 w-32 h-32 bg-medieval-crimson/10 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2" />
                          <div className="relative">
                            <p className="text-xs text-medieval-crimson-light/60 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-semibold">
                              <Zap className="w-3 h-3" /> Modo Tryhard
                            </p>
                            <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line">{game.tryhard}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
