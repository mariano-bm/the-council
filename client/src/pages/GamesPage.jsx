import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import Avatar from '../components/ui/Avatar';
import { Gamepad2, ChevronDown, Zap, ExternalLink, Plus, X, Search, Send, BookOpen, ScrollText, ThumbsUp, Trash2, Feather, Shield, Swords } from 'lucide-react';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';

const GUIDE_CATEGORIES = [
  { id: 'general', label: 'General', latin: 'SCIENTIA', icon: '📜' },
  { id: 'beginner', label: 'Principiante', latin: 'INITIUM', icon: '🌱' },
  { id: 'advanced', label: 'Avanzado', latin: 'MAGISTERIUM', icon: '⚔' },
  { id: 'economy', label: 'Economia', latin: 'AURUM', icon: '💰' },
  { id: 'builds', label: 'Builds / Meta', latin: 'ARCHITECTURA', icon: '🏗' },
  { id: 'pvp', label: 'PvP / Ranked', latin: 'ARENA', icon: '🏟' },
  { id: 'memes', label: 'Memes / Fun', latin: 'RISUS', icon: '🤡' },
];

// Juegos default del grupo
const SEED_GAMES = [
  { name: 'Warframe', steam_app_id: 230410, cover_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/230410/header.jpg', genres: ['Action', 'F2P', 'RPG'], synopsis: 'Shooter cooperativo free-to-play con parkour ninja. Frames con habilidades unicas, armas infinitas, y el grind mas satisfactorio del gaming.', tryhard_info: 'Wiki: warframe.fandom.com\nMods esenciales: Serration, Hornet Strike, Multishot\nMarket: warframe.market para tradear plata\nOverframe.gg para builds' },
  { name: 'Brawlhalla', steam_app_id: 291550, cover_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/291550/header.jpg', genres: ['Fighting', 'F2P'], synopsis: 'Plataforma de pelea estilo Smash Bros. Free to play con leyendas rotativas y ranked.', tryhard_info: 'Gravity cancel + dodge reads = win\nCombo training mode\nCosolix y Boomie en YouTube\nBrawlhalla wiki para frame data' },
  { name: 'Rainbow Six Siege', steam_app_id: 359550, cover_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/359550/header.jpg', genres: ['FPS', 'Tactical'], synopsis: 'FPS tactico 5v5 con destruccion de entorno. Operadores unicos. Intel y comunicacion son todo.', tryhard_info: 'R6Tracker para stats\nCallouts de cada mapa obligatorio\nDrone SIEMPRE antes de pushear\nVertical play es meta\nCoconut Brah para trucos' },
  { name: 'Age of Empires II: DE', steam_app_id: 813780, cover_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/813780/header.jpg', genres: ['Strategy', 'RTS'], synopsis: 'RTS clasico remasterizado. Civilizaciones, economia, guerra medieval.', tryhard_info: 'Cicero build order guide (mod Steam)\nFast Castle = basico\naoe2.net para ELO y meta\nSpirit of the Law para stats\nHera en YouTube para pro plays' },
  { name: 'League of Legends', steam_app_id: null, cover_url: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg', genres: ['MOBA', 'Competitive'], synopsis: 'MOBA 5v5 donde tu salud mental va a morir. Campeon, farmeo, teamfight, /ff a los 15.', tryhard_info: 'op.gg para builds y counters\nOne-trick > jugar todo\nCS > kills\nMira tus replays\nWARD. WARD. WARD.' },
];

export default function GamesPage() {
  const { user } = useAuth();
  const { data: dbGames, refetch } = useApi('/council-games');
  const [expandedGame, setExpandedGame] = useState(null);
  const [tryhardMode, setTryhardMode] = useState(null);
  const [guideView, setGuideView] = useState(null);
  const [gameDetail, setGameDetail] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showGuideForm, setShowGuideForm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [newGame, setNewGame] = useState({ name: '', cover_url: '', synopsis: '', tryhard_info: '', genres: [] });
  const [newGuide, setNewGuide] = useState({ title: '', content: '', category: 'general' });

  // Merge seed games with DB games, prefer DB
  const dbNames = new Set((dbGames || []).map(g => g.name.toLowerCase()));
  const allGames = [
    ...(dbGames || []),
    ...SEED_GAMES.filter(g => !dbNames.has(g.name.toLowerCase())),
  ];

  async function seedGameToDb(game) {
    try {
      const created = await api.post('/council-games', game);
      refetch();
      return created;
    } catch { return null; }
  }

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

  async function openGuides(game) {
    setGuideView(game.id || game.name);
    if (game.id) {
      try {
        const detail = await api.get(`/council-games/${game.id}`);
        setGameDetail(detail);
      } catch { setGameDetail(null); }
    } else {
      // Seed game — need to create in DB first
      const created = await seedGameToDb(game);
      if (created?.id) {
        const detail = await api.get(`/council-games/${created.id}`);
        setGameDetail(detail);
        refetch();
      }
    }
  }

  async function submitGuide() {
    if (!newGuide.title || !newGuide.content || !gameDetail?.id) return;
    await api.post(`/council-games/${gameDetail.id}/guides`, newGuide);
    const detail = await api.get(`/council-games/${gameDetail.id}`);
    setGameDetail(detail);
    setNewGuide({ title: '', content: '', category: 'general' });
    setShowGuideForm(null);
  }

  async function voteGuide(guideId) {
    await api.post(`/council-games/guides/${guideId}/vote`);
    if (gameDetail?.id) {
      const detail = await api.get(`/council-games/${gameDetail.id}`);
      setGameDetail(detail);
    }
  }

  async function deleteGuide(guideId) {
    await api.delete(`/council-games/guides/${guideId}`);
    if (gameDetail?.id) {
      const detail = await api.get(`/council-games/${gameDetail.id}`);
      setGameDetail(detail);
    }
  }

  // Guide view (when you click into a game)
  if (guideView && gameDetail) {
    const guides = gameDetail.guides || [];
    return (
      <div className="space-y-6">
        {/* Back + header */}
        <div className="flex items-center gap-4">
          <button onClick={() => { setGuideView(null); setGameDetail(null); }}
            className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white/70 transition-colors">
            <X className="w-5 h-5" />
          </button>
          {gameDetail.cover_url && <img src={gameDetail.cover_url} alt="" className="w-28 h-[52px] rounded-xl object-cover" />}
          <div>
            <h1 className="text-2xl font-bold text-white">{gameDetail.name}</h1>
            <p className="text-[10px] font-mono text-medieval-gold/30 uppercase tracking-[0.2em]">LIBER SAPIENTIAE — CODEX LUDORUM</p>
          </div>
        </div>

        {/* Synopsis + Tryhard */}
        <div className="grid grid-cols-2 gap-4">
          {gameDetail.synopsis && (
            <GlassCard>
              <p className="text-xs text-medieval-gold/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" /> Synopsis — <span className="font-mono text-[9px]">NARRATIO</span>
              </p>
              <p className="text-sm text-white/50 leading-relaxed">{gameDetail.synopsis}</p>
            </GlassCard>
          )}
          {gameDetail.tryhard_info && (
            <GlassCard className="border-medieval-crimson/10">
              <p className="text-xs text-medieval-crimson-light/60 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-semibold">
                <Zap className="w-3 h-3" /> Modo Tryhard — <span className="font-mono text-[9px]">VIA VICTORIAE</span>
              </p>
              <p className="text-sm text-white/50 leading-relaxed whitespace-pre-line">{gameDetail.tryhard_info}</p>
            </GlassCard>
          )}
        </div>

        {/* Guides section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white/80 flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-medieval-gold" />
              Pergaminos del Council
              <span className="text-[9px] font-mono text-medieval-gold/25 uppercase tracking-[0.15em]">SCRIPTA CONSILII</span>
            </h2>
            <button onClick={() => setShowGuideForm(showGuideForm ? null : gameDetail.id)}
              className="btn-primary flex items-center gap-2 text-sm">
              <Feather className="w-4 h-4" /> Escribir Guia
            </button>
          </div>

          {/* Write guide form */}
          <AnimatePresence>
            {showGuideForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <GlassCard className="space-y-3 mb-4">
                  <p className="text-xs text-medieval-gold/40 flex items-center gap-1.5">
                    <Feather className="w-3 h-3" /> Nuevo Pergamino — <span className="font-mono text-[9px]">SCRIBE SAPIENTIAM TUAM</span>
                  </p>
                  <input value={newGuide.title} onChange={e => setNewGuide(g => ({ ...g, title: e.target.value }))}
                    placeholder="Titulo de la guia..." className="input-field" />

                  {/* Category */}
                  <div className="flex flex-wrap gap-1.5">
                    {GUIDE_CATEGORIES.map(cat => (
                      <button key={cat.id} onClick={() => setNewGuide(g => ({ ...g, category: cat.id }))}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                          newGuide.category === cat.id ? 'bg-medieval-gold/10 text-medieval-gold border border-medieval-gold/20' : 'bg-white/[0.03] text-white/25 border border-transparent'
                        }`}>
                        <span>{cat.icon}</span> {cat.label}
                      </button>
                    ))}
                  </div>

                  <textarea value={newGuide.content} onChange={e => setNewGuide(g => ({ ...g, content: e.target.value }))}
                    placeholder="Comparti tu sabiduria con el Council... tips, builds, estrategias, links..."
                    rows={5} className="input-field resize-none text-sm" />

                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowGuideForm(null)} className="btn-secondary text-sm">Cancelar</button>
                    <button onClick={submitGuide} disabled={!newGuide.title || !newGuide.content}
                      className="btn-primary flex items-center gap-2 text-sm disabled:opacity-40">
                      <Send className="w-4 h-4" /> Publicar (+2 pts)
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Guides list */}
          <div className="space-y-3">
            {guides.map((guide, i) => {
              const cat = GUIDE_CATEGORIES.find(c => c.id === guide.category) || GUIDE_CATEGORIES[0];
              return (
                <motion.div key={guide.id}
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="glass-card p-5">
                    <div className="flex items-start gap-4">
                      {/* Upvote */}
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <button onClick={() => voteGuide(guide.id)}
                          className="p-1.5 rounded-lg hover:bg-medieval-gold/10 text-white/20 hover:text-medieval-gold transition-all">
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <span className="font-mono text-sm font-bold text-medieval-gold/60">{guide.upvotes || 0}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">{cat.icon}</span>
                          <span className="text-[9px] font-mono text-medieval-gold/25 uppercase tracking-wider">{cat.latin}</span>
                          <span className="text-[9px] text-white/15">•</span>
                          <Avatar src={guide.avatar_url} name={guide.discord_name} size="sm" />
                          <span className="text-xs text-white/40">{guide.discord_name}</span>
                        </div>

                        <h3 className="font-bold text-white/90 text-base mb-2">{guide.title}</h3>
                        <p className="text-sm text-white/45 leading-relaxed whitespace-pre-line">{guide.content}</p>
                      </div>

                      {/* Delete */}
                      {(guide.user_id === user?.id || user?.role === 'admin') && (
                        <button onClick={() => deleteGuide(guide.id)}
                          className="p-1.5 rounded-lg text-white/10 hover:text-medieval-crimson-light hover:bg-medieval-crimson/10 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {guides.length === 0 && (
              <div className="text-center py-12 text-white/20">
                <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>Nadie escribio pergaminos todavia</p>
                <p className="text-[10px] font-mono text-medieval-gold/15 mt-1 uppercase tracking-wider">NULLA SCRIPTA INVENTA</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main games list
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Gamepad2 className="w-6 h-6 text-medieval-gold" />
            Juegos del Council
          </h1>
          <p className="text-[10px] font-mono text-medieval-gold/25 uppercase tracking-[0.2em] mt-1">LUDOTHECA CONSILII — ARMAMENTARIUM DIGITALE</p>
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
              <p className="text-xs text-medieval-gold/40 flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> Inscribir Juego al Registro — <span className="font-mono text-[9px]">INSCRIPTIO IN REGISTRUM</span>
              </p>
              <div className="flex gap-2">
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchSteam()}
                  placeholder="Buscar juego en Steam..." className="input-field flex-1" />
                <button onClick={searchSteam} disabled={searching} className="btn-secondary">
                  <Search className="w-4 h-4" />
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {searchResults.map((g, i) => (
                    <button key={i} onClick={() => { setNewGame(prev => ({ ...prev, name: g.name, cover_url: g.cover_url, genres: g.genres || [], steam_app_id: g.steam_app_id })); setSearchResults([]); setSearchQuery(g.name); }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-medieval-gold/5 transition-all text-left">
                      {g.cover_url && <img src={g.cover_url} alt="" className="w-20 h-9 rounded object-cover" />}
                      <span className="text-sm text-white/80">{g.name}</span>
                    </button>
                  ))}
                </div>
              )}
              <input value={newGame.name} onChange={e => setNewGame(g => ({ ...g, name: e.target.value }))} placeholder="Nombre..." className="input-field" />
              <textarea value={newGame.synopsis} onChange={e => setNewGame(g => ({ ...g, synopsis: e.target.value }))} placeholder="Sinopsis..." rows={2} className="input-field resize-none text-sm" />
              <textarea value={newGame.tryhard_info} onChange={e => setNewGame(g => ({ ...g, tryhard_info: e.target.value }))} placeholder="Info tryhard (guias, tips, recursos)..." rows={2} className="input-field resize-none text-sm" />
              <button onClick={addGame} disabled={!newGame.name} className="btn-primary text-sm disabled:opacity-40">
                <Send className="w-4 h-4 inline mr-2" /> Inscribir
              </button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game cards */}
      <div className="grid grid-cols-1 gap-3">
        {allGames.map((game, i) => {
          const isExpanded = expandedGame === i;
          const isTryhard = tryhardMode === i;
          const guideCount = game.guide_count || 0;
          const tryhardInfo = game.tryhard_info || game.tryhard;

          return (
            <motion.div key={game.name}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 130 }}>
              <div className="glass-card overflow-hidden group">
                <div className="relative">
                  {game.cover_url && (
                    <div className="absolute inset-0 opacity-[0.07] group-hover:opacity-[0.13] transition-opacity duration-500">
                      <img src={game.cover_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="relative p-5 flex items-center gap-5">
                    {game.cover_url && (
                      <img src={game.cover_url} alt="" className="w-36 h-[68px] rounded-xl object-cover flex-shrink-0 shadow-glass" />
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white/90 text-lg group-hover:text-medieval-gold transition-colors">{game.name}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {(typeof game.genres === 'string' ? JSON.parse(game.genres) : game.genres || []).map(g => (
                          <span key={g} className="px-2 py-0.5 rounded-full text-[9px] bg-medieval-gold/8 text-medieval-gold/50">{g}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Enter game (guides) */}
                      <motion.button onClick={() => openGuides(game)}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-medieval-gold/10 text-medieval-gold border border-medieval-gold/20 hover:bg-medieval-gold/15 transition-all">
                        <ScrollText className="w-3.5 h-3.5" />
                        Pergaminos {guideCount > 0 && <span className="font-mono">({guideCount})</span>}
                      </motion.button>

                      {tryhardInfo && (
                        <motion.button onClick={() => setTryhardMode(isTryhard ? null : i)}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isTryhard ? 'bg-medieval-crimson/20 text-medieval-crimson-light border border-medieval-crimson/30' : 'bg-white/[0.03] text-white/30 hover:text-medieval-crimson-light hover:bg-medieval-crimson/10 border border-transparent'
                          }`}>
                          <Zap className="w-3.5 h-3.5" />
                        </motion.button>
                      )}

                      <button onClick={() => setExpandedGame(isExpanded ? null : i)}
                        className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-medieval-gold/10 text-medieval-gold' : 'bg-white/[0.03] text-white/20 hover:text-white/50'}`}>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {game.steam_app_id && (
                        <a href={`https://store.steampowered.com/app/${game.steam_app_id}`} target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-white/[0.03] text-white/20 hover:text-white/50 transition-all">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Synopsis */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-4">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <p className="text-xs text-medieval-gold/30 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3" /> Narratio
                          </p>
                          <p className="text-sm text-white/45 leading-relaxed">{game.synopsis || 'Nullum scriptum.'}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tryhard */}
                <AnimatePresence>
                  {isTryhard && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5">
                        <div className="p-4 rounded-xl bg-medieval-crimson/5 border border-medieval-crimson/15 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-32 h-32 bg-medieval-crimson/10 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2" />
                          <div className="relative">
                            <p className="text-xs text-medieval-crimson-light/50 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-semibold">
                              <Zap className="w-3 h-3" /> Via Victoriae
                            </p>
                            <p className="text-sm text-white/50 leading-relaxed whitespace-pre-line">{tryhardInfo}</p>
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

      {/* Footer */}
      <div className="text-center py-4">
        <div className="ornament-divider">
          <Swords className="w-4 h-4 text-medieval-gold/20" />
        </div>
        <p className="text-[9px] text-white/[0.06] font-mono uppercase tracking-[0.2em]">
          "Ludus sine scientia, mors sine gloria"
        </p>
        <p className="text-[8px] text-white/[0.04] mt-0.5">Jugar sin conocimiento es morir sin gloria</p>
      </div>
    </div>
  );
}
