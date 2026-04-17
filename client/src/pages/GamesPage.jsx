import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import { Gamepad2, Plus, Search, Send, Zap, ScrollText, ArrowRight, Swords } from 'lucide-react';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';

const SEED_GAMES = [
  { name: 'Warframe', steam_app_id: 230410, cover_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/230410/header.jpg', genres: ['Action', 'F2P', 'RPG'], synopsis: 'Shooter cooperativo free-to-play con parkour ninja. Frames con habilidades unicas, armas infinitas, y el grind mas satisfactorio del gaming.', tryhard_info: 'Wiki: warframe.fandom.com\nMods esenciales: Serration, Hornet Strike, Multishot\nMarket: warframe.market para tradear plata\nOverframe.gg para builds' },
  { name: 'Brawlhalla', steam_app_id: 291550, cover_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/291550/header.jpg', genres: ['Fighting', 'F2P'], synopsis: 'Plataforma de pelea estilo Smash Bros. Free to play con leyendas rotativas y ranked.', tryhard_info: 'Gravity cancel + dodge reads = win\nCombo training mode\nCosolix y Boomie en YouTube\nBrawlhalla wiki para frame data' },
  { name: 'Rainbow Six Siege', steam_app_id: 359550, cover_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/359550/header.jpg', genres: ['FPS', 'Tactical'], synopsis: 'FPS tactico 5v5 con destruccion de entorno. Operadores unicos. Intel y comunicacion son todo.', tryhard_info: 'R6Tracker para stats\nCallouts de cada mapa obligatorio\nDrone SIEMPRE antes de pushear\nVertical play es meta\nCoconut Brah para trucos' },
  { name: 'Age of Empires II: DE', steam_app_id: 813780, cover_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/813780/header.jpg', genres: ['Strategy', 'RTS'], synopsis: 'RTS clasico remasterizado. Civilizaciones, economia, guerra medieval.', tryhard_info: 'Cicero build order guide (mod Steam)\nFast Castle = basico\naoe2.net para ELO y meta\nSpirit of the Law para stats\nHera en YouTube para pro plays' },
  { name: 'League of Legends', steam_app_id: null, cover_url: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg', genres: ['MOBA', 'Competitive'], synopsis: 'MOBA 5v5 donde tu salud mental va a morir. Campeon, farmeo, teamfight, /ff a los 15.', tryhard_info: 'op.gg para builds y counters\nOne-trick > jugar todo\nCS > kills\nMira tus replays\nWARD. WARD. WARD.' },
];

export default function GamesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: dbGames, refetch } = useApi('/council-games');
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [newGame, setNewGame] = useState({ name: '', cover_url: '', synopsis: '', tryhard_info: '', genres: [] });

  const dbNames = new Set((dbGames || []).map(g => g.name.toLowerCase()));
  const allGames = [
    ...(dbGames || []),
    ...SEED_GAMES.filter(g => !dbNames.has(g.name.toLowerCase())),
  ];

  async function searchSteam() {
    if (searchQuery.length < 2) return;
    setSearching(true);
    try {
      const results = await api.get(`/games/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(results);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }

  async function addGame() {
    if (!newGame.name) return;
    await api.post('/council-games', newGame);
    setShowAdd(false);
    setNewGame({ name: '', cover_url: '', synopsis: '', tryhard_info: '', genres: [] });
    setSearchResults([]);
    setSearchQuery('');
    refetch();
  }

  async function goToGame(game) {
    if (game.id) {
      navigate(`/juegos/${game.id}`);
    } else {
      // Seed game not in DB yet, create it first
      try {
        const created = await api.post('/council-games', game);
        refetch();
        navigate(`/juegos/${created.id}`);
      } catch {
        // Already exists maybe, refetch and try again
        refetch();
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Gamepad2 className="w-6 h-6 text-medieval-gold" />
            Juegos del Council
          </h1>
          <p className="text-[10px] font-mono text-medieval-gold/25 uppercase tracking-[0.2em] mt-1">ARMAMENTARIUM DIGITALE</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Inscribir Juego
          </button>
        )}
      </div>

      {/* Add game */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard className="space-y-3">
              <p className="text-[10px] text-medieval-gold/30 font-mono uppercase tracking-wider">INSCRIPTIO IN REGISTRUM</p>
              <div className="flex gap-2">
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchSteam()}
                  placeholder="Buscar en Steam..." className="input-field flex-1" />
                <button onClick={searchSteam} disabled={searching} className="btn-secondary"><Search className="w-4 h-4" /></button>
              </div>
              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {searchResults.map((g, i) => (
                    <button key={i} onClick={() => { setNewGame(p => ({ ...p, name: g.name, cover_url: g.cover_url, genres: g.genres || [], steam_app_id: g.steam_app_id })); setSearchResults([]); setSearchQuery(g.name); }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-medieval-gold/5 text-left">
                      {g.cover_url && <img src={g.cover_url} alt="" className="w-20 h-9 rounded object-cover" />}
                      <span className="text-sm text-white/80">{g.name}</span>
                    </button>
                  ))}
                </div>
              )}
              <input value={newGame.name} onChange={e => setNewGame(g => ({ ...g, name: e.target.value }))} placeholder="Nombre..." className="input-field" />
              <textarea value={newGame.synopsis} onChange={e => setNewGame(g => ({ ...g, synopsis: e.target.value }))} placeholder="Sinopsis..." rows={2} className="input-field resize-none text-sm" />
              <textarea value={newGame.tryhard_info} onChange={e => setNewGame(g => ({ ...g, tryhard_info: e.target.value }))} placeholder="Info tryhard..." rows={2} className="input-field resize-none text-sm" />
              <button onClick={addGame} disabled={!newGame.name} className="btn-primary text-sm disabled:opacity-40"><Send className="w-4 h-4 inline mr-2" /> Inscribir</button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4">
        {allGames.map((game, i) => {
          const genres = typeof game.genres === 'string' ? JSON.parse(game.genres) : game.genres || [];
          const guideCount = game.guide_count || 0;

          return (
            <motion.div key={game.name}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 120 }}>
              <button onClick={() => goToGame(game)} className="w-full text-left glass-card overflow-hidden group cursor-pointer">
                <div className="relative">
                  {game.cover_url && (
                    <div className="absolute inset-0 opacity-[0.08] group-hover:opacity-[0.18] transition-opacity duration-500">
                      <img src={game.cover_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="relative p-5">
                    {/* Cover */}
                    {game.cover_url && (
                      <img src={game.cover_url} alt="" className="w-full h-28 rounded-xl object-cover mb-4 shadow-glass group-hover:scale-[1.02] transition-transform duration-300" />
                    )}

                    <h3 className="font-bold text-white/90 text-lg group-hover:text-medieval-gold transition-colors mb-1">{game.name}</h3>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {genres.slice(0, 3).map(g => (
                        <span key={g} className="px-2 py-0.5 rounded-full text-[9px] bg-medieval-gold/8 text-medieval-gold/50">{g}</span>
                      ))}
                    </div>

                    {game.synopsis && (
                      <p className="text-xs text-white/30 line-clamp-2 mb-3">{game.synopsis}</p>
                    )}

                    {/* Bottom bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        {guideCount > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-medieval-gold/40">
                            <ScrollText className="w-3 h-3" /> {guideCount} pergaminos
                          </span>
                        )}
                        {game.tryhard_info && (
                          <span className="flex items-center gap-1 text-[10px] text-medieval-crimson-light/40">
                            <Zap className="w-3 h-3" /> Tryhard
                          </span>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/15 group-hover:text-medieval-gold/50 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <div className="ornament-divider"><Swords className="w-4 h-4 text-medieval-gold/20" /></div>
        <p className="text-[9px] text-white/[0.06] font-mono uppercase tracking-[0.2em]">"Ludus sine scientia, mors sine gloria"</p>
      </div>
    </div>
  );
}
