import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import GlassCard from '../components/ui/GlassCard';
import { api } from '../services/api';
import {
  ArrowLeft, Zap, ExternalLink, ScrollText, BookOpen, Feather,
  ThumbsUp, Trash2, Send, Tag, DollarSign, TrendingDown, Clock,
  Monitor, Apple, Terminal, Star, Users, ShoppingCart
} from 'lucide-react';

const GUIDE_CATEGORIES = [
  { id: 'general', label: 'General', latin: 'SCIENTIA', icon: '📜' },
  { id: 'beginner', label: 'Principiante', latin: 'INITIUM', icon: '🌱' },
  { id: 'advanced', label: 'Avanzado', latin: 'MAGISTERIUM', icon: '⚔' },
  { id: 'economy', label: 'Economia', latin: 'AURUM', icon: '💰' },
  { id: 'builds', label: 'Builds / Meta', latin: 'ARCHITECTURA', icon: '🏗' },
  { id: 'pvp', label: 'PvP / Ranked', latin: 'ARENA', icon: '🏟' },
  { id: 'memes', label: 'Memes / Fun', latin: 'RISUS', icon: '🤡' },
];

export default function GameDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [game, setGame] = useState(null);
  const [steamData, setSteamData] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [showGuideForm, setShowGuideForm] = useState(false);
  const [newGuide, setNewGuide] = useState({ title: '', content: '', category: 'general' });

  useEffect(() => {
    loadGame();
  }, [id]);

  async function loadGame() {
    setLoading(true);
    try {
      const detail = await api.get(`/council-games/${id}`);
      setGame(detail);

      // Fetch Steam data if has steam_app_id
      if (detail.steam_app_id) {
        fetchSteamData(detail.steam_app_id);
        fetchDeals(detail.name);
      }
    } catch {}
    finally { setLoading(false); }
  }

  async function fetchSteamData(appId) {
    try {
      const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=spanish&cc=AR`);
      const data = await res.json();
      if (data[appId]?.success) setSteamData(data[appId].data);
    } catch {}
  }

  async function fetchDeals(name) {
    try {
      const res = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(name)}&limit=1&exact=0`);
      const data = await res.json();
      if (data?.[0]?.gameID) {
        const dealRes = await fetch(`https://www.cheapshark.com/api/1.0/games?id=${data[0].gameID}`);
        const dealData = await dealRes.json();
        setDeals(dealData?.deals || []);
      }
    } catch {}
  }

  async function submitGuide() {
    if (!newGuide.title || !newGuide.content) return;
    await api.post(`/council-games/${id}/guides`, newGuide);
    setNewGuide({ title: '', content: '', category: 'general' });
    setShowGuideForm(false);
    loadGame();
  }

  async function voteGuide(guideId) {
    await api.post(`/council-games/guides/${guideId}/vote`);
    loadGame();
  }

  async function deleteGuide(guideId) {
    await api.delete(`/council-games/guides/${guideId}`);
    loadGame();
  }

  if (loading || !game) {
    return <div className="flex items-center justify-center py-20 text-white/30"><Clock className="w-6 h-6 animate-spin" /></div>;
  }

  const guides = game.guides || [];
  const genres = typeof game.genres === 'string' ? JSON.parse(game.genres) : game.genres || [];
  const steamPrice = steamData?.price_overview;
  const isFree = steamData?.is_free;
  const screenshots = steamData?.screenshots?.slice(0, 6) || [];

  const TABS = [
    { id: 'overview', label: 'Vista General', latin: 'CONSPECTUS' },
    { id: 'guides', label: `Pergaminos (${guides.length})`, latin: 'SCRIPTA' },
    { id: 'prices', label: 'Precios', latin: 'PRETIUM' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* BG image */}
        {game.cover_url && (
          <div className="absolute inset-0">
            <img src={game.cover_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-council-dark via-council-dark/90 to-council-dark/40" />
          </div>
        )}

        <div className="relative p-8 pt-6">
          {/* Back button */}
          <button onClick={() => navigate('/juegos')}
            className="flex items-center gap-2 text-white/40 hover:text-medieval-gold transition-colors mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver al Armamentarium
          </button>

          <div className="flex items-end gap-6">
            {game.cover_url && (
              <img src={game.cover_url} alt="" className="w-52 h-24 rounded-xl object-cover shadow-glass ring-1 ring-white/10" />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-black text-white mb-1">{game.name}</h1>
              <p className="text-[10px] font-mono text-medieval-gold/30 uppercase tracking-[0.2em] mb-3">CODEX LUDORUM — LIBER {game.name.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 8)}</p>
              <div className="flex flex-wrap gap-1.5">
                {genres.map(g => (
                  <span key={g} className="px-2.5 py-0.5 rounded-full text-[10px] bg-medieval-gold/10 text-medieval-gold/60 border border-medieval-gold/10">{g}</span>
                ))}
                {steamData?.metacritic?.score && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-medieval-forest-light/10 text-medieval-forest-light border border-medieval-forest-light/10">
                    Metacritic: {steamData.metacritic.score}
                  </span>
                )}
              </div>
            </div>

            {/* Price badge */}
            <div className="text-right flex-shrink-0">
              {isFree && (
                <div className="px-4 py-2 rounded-xl bg-medieval-forest-light/15 text-medieval-forest-light font-bold text-lg border border-medieval-forest-light/20">
                  GRATIS
                </div>
              )}
              {steamPrice && !isFree && (
                <div className="text-right">
                  {steamPrice.discount_percent > 0 && (
                    <span className="px-2 py-0.5 rounded bg-medieval-forest-light/20 text-medieval-forest-light text-xs font-bold mr-2">
                      -{steamPrice.discount_percent}%
                    </span>
                  )}
                  {steamPrice.discount_percent > 0 && (
                    <span className="text-white/30 line-through text-sm">{steamPrice.initial_formatted}</span>
                  )}
                  <p className="text-2xl font-bold text-medieval-gold mt-0.5">{steamPrice.final_formatted}</p>
                  <p className="text-[9px] text-white/20">Steam Argentina</p>
                </div>
              )}
              {game.steam_app_id && (
                <a href={`https://store.steampowered.com/app/${game.steam_app_id}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] text-white/25 hover:text-medieval-gold mt-2 transition-colors">
                  <ExternalLink className="w-3 h-3" /> Ver en Steam
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-medieval-gold/[0.06] w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-medieval-gold/10 text-medieval-gold shadow-sm' : 'text-white/30 hover:text-white/50'
            }`}>
            {t.label}
            <span className="text-[8px] font-mono text-current/40 uppercase hidden lg:inline">{t.latin}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

        {/* ===== OVERVIEW ===== */}
        {tab === 'overview' && (
          <div className="grid grid-cols-3 gap-5">
            {/* Synopsis */}
            <div className="col-span-2 space-y-5">
              {game.synopsis && (
                <GlassCard>
                  <p className="text-xs text-medieval-gold/30 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" /> Narratio
                  </p>
                  <p className="text-sm text-white/50 leading-relaxed">{game.synopsis}</p>
                </GlassCard>
              )}

              {/* Steam description */}
              {steamData?.short_description && (
                <GlassCard>
                  <p className="text-xs text-white/20 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Monitor className="w-3 h-3" /> Descriptio Officialis
                  </p>
                  <p className="text-sm text-white/40 leading-relaxed">{steamData.short_description}</p>
                </GlassCard>
              )}

              {/* Screenshots */}
              {screenshots.length > 0 && (
                <div>
                  <p className="text-xs text-white/20 uppercase tracking-wider mb-3 font-mono">IMAGINES</p>
                  <div className="grid grid-cols-3 gap-2">
                    {screenshots.map((ss, i) => (
                      <motion.a key={i} href={ss.path_full} target="_blank" rel="noopener noreferrer"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}
                        className="rounded-xl overflow-hidden hover:ring-1 hover:ring-medieval-gold/30 transition-all">
                        <img src={ss.path_thumbnail} alt="" className="w-full h-24 object-cover" />
                      </motion.a>
                    ))}
                  </div>
                </div>
              )}

              {/* Tryhard */}
              {game.tryhard_info && (
                <div className="p-5 rounded-2xl bg-medieval-crimson/5 border border-medieval-crimson/15 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-40 h-40 bg-medieval-crimson/8 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
                  <div className="relative">
                    <p className="text-xs text-medieval-crimson-light/50 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-semibold">
                      <Zap className="w-3.5 h-3.5" /> Via Victoriae — Modo Tryhard
                    </p>
                    <p className="text-sm text-white/50 leading-relaxed whitespace-pre-line">{game.tryhard_info}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar info */}
            <div className="space-y-4">
              {/* Quick stats */}
              {steamData && (
                <GlassCard>
                  <p className="text-xs text-medieval-gold/30 uppercase tracking-wider mb-3 font-mono">INFORMATIONES</p>
                  <div className="space-y-3 text-sm">
                    {steamData.developers?.[0] && (
                      <div className="flex justify-between"><span className="text-white/30">Developer</span><span className="text-white/60">{steamData.developers[0]}</span></div>
                    )}
                    {steamData.publishers?.[0] && (
                      <div className="flex justify-between"><span className="text-white/30">Publisher</span><span className="text-white/60">{steamData.publishers[0]}</span></div>
                    )}
                    {steamData.release_date?.date && (
                      <div className="flex justify-between"><span className="text-white/30">Lanzamiento</span><span className="text-white/60">{steamData.release_date.date}</span></div>
                    )}
                    {steamData.recommendations?.total && (
                      <div className="flex justify-between"><span className="text-white/30">Reviews</span><span className="text-medieval-forest-light">{steamData.recommendations.total.toLocaleString()}</span></div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-white/30">Plataformas</span>
                      <div className="flex gap-1.5">
                        {steamData.platforms?.windows && <Monitor className="w-3.5 h-3.5 text-white/40" />}
                        {steamData.platforms?.mac && <Apple className="w-3.5 h-3.5 text-white/40" />}
                        {steamData.platforms?.linux && <Terminal className="w-3.5 h-3.5 text-white/40" />}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* Council stats */}
              <GlassCard>
                <p className="text-xs text-medieval-gold/30 uppercase tracking-wider mb-3 font-mono">CONSILIUM</p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-white/30">Pergaminos</span><span className="text-medieval-gold font-mono">{guides.length}</span></div>
                  {game.added_by_name && (
                    <div className="flex justify-between"><span className="text-white/30">Agregado por</span><span className="text-white/50">{game.added_by_name}</span></div>
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* ===== GUIDES ===== */}
        {tab === 'guides' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white/80 flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-medieval-gold" />
                Pergaminos
                <span className="text-[9px] font-mono text-medieval-gold/20 uppercase tracking-[0.15em]">SCRIPTA CONSILII</span>
              </h2>
              <button onClick={() => setShowGuideForm(!showGuideForm)} className="btn-primary flex items-center gap-2 text-sm">
                <Feather className="w-4 h-4" /> Escribir
              </button>
            </div>

            {/* Guide form */}
            <AnimatePresence>
              {showGuideForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <GlassCard className="space-y-3">
                    <p className="text-[10px] text-medieval-gold/30 font-mono uppercase tracking-wider">SCRIBE SAPIENTIAM TUAM</p>
                    <input value={newGuide.title} onChange={e => setNewGuide(g => ({ ...g, title: e.target.value }))}
                      placeholder="Titulo del pergamino..." className="input-field" />
                    <div className="flex flex-wrap gap-1.5">
                      {GUIDE_CATEGORIES.map(cat => (
                        <button key={cat.id} onClick={() => setNewGuide(g => ({ ...g, category: cat.id }))}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                            newGuide.category === cat.id ? 'bg-medieval-gold/10 text-medieval-gold border border-medieval-gold/20' : 'bg-white/[0.03] text-white/25 border border-transparent'
                          }`}>
                          {cat.icon} {cat.label}
                        </button>
                      ))}
                    </div>
                    <textarea value={newGuide.content} onChange={e => setNewGuide(g => ({ ...g, content: e.target.value }))}
                      placeholder="Comparti tu sabiduria..." rows={5} className="input-field resize-none text-sm" />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setShowGuideForm(false)} className="btn-secondary text-sm">Cancelar</button>
                      <button onClick={submitGuide} disabled={!newGuide.title || !newGuide.content}
                        className="btn-primary flex items-center gap-2 text-sm disabled:opacity-40">
                        <Send className="w-4 h-4" /> Publicar (+2 pts)
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Guide list */}
            {guides.map((guide, i) => {
              const cat = GUIDE_CATEGORIES.find(c => c.id === guide.category) || GUIDE_CATEGORIES[0];
              return (
                <motion.div key={guide.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="glass-card p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <button onClick={() => voteGuide(guide.id)}
                          className="p-1.5 rounded-lg hover:bg-medieval-gold/10 text-white/20 hover:text-medieval-gold transition-all">
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <span className="font-mono text-sm font-bold text-medieval-gold/60">{guide.vote_score || guide.upvotes || 0}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-sm">{cat.icon}</span>
                          <span className="text-[9px] font-mono text-medieval-gold/20 uppercase tracking-wider">{cat.latin}</span>
                          <span className="text-[9px] text-white/10">•</span>
                          <Avatar src={guide.avatar_url} name={guide.discord_name} size="sm" />
                          <span className="text-xs text-white/40">{guide.discord_name}</span>
                        </div>
                        <h3 className="font-bold text-white/90 mb-2">{guide.title}</h3>
                        <p className="text-sm text-white/45 leading-relaxed whitespace-pre-line">{guide.content}</p>
                      </div>
                      {(guide.user_id === user?.id || user?.role === 'admin') && (
                        <button onClick={() => deleteGuide(guide.id)}
                          className="p-1.5 rounded-lg text-white/10 hover:text-medieval-crimson-light transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {guides.length === 0 && !showGuideForm && (
              <div className="text-center py-12 text-white/20">
                <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>Nulla scripta inventa</p>
                <p className="text-[10px] text-white/10 mt-1">Ningun miembro escribio pergaminos todavia</p>
              </div>
            )}
          </div>
        )}

        {/* ===== PRICES ===== */}
        {tab === 'prices' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white/80 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-medieval-gold" />
              Comparador de Precios
              <span className="text-[9px] font-mono text-medieval-gold/20 uppercase tracking-[0.15em]">FORUM MERCATORUM</span>
            </h2>

            {/* Steam price */}
            {(steamPrice || isFree) && (
              <GlassCard>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#1b2838] flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🎮</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white/80">Steam</p>
                    <p className="text-[10px] text-white/25">Tienda oficial</p>
                  </div>
                  <div className="text-right">
                    {isFree ? (
                      <span className="text-medieval-forest-light font-bold text-lg">GRATIS</span>
                    ) : (
                      <div>
                        {steamPrice.discount_percent > 0 && (
                          <div className="flex items-center gap-2 justify-end mb-0.5">
                            <span className="px-1.5 py-0.5 rounded bg-medieval-forest-light/20 text-medieval-forest-light text-[10px] font-bold">-{steamPrice.discount_percent}%</span>
                            <span className="text-white/25 line-through text-xs">{steamPrice.initial_formatted}</span>
                          </div>
                        )}
                        <span className="text-medieval-gold font-bold text-lg">{steamPrice.final_formatted}</span>
                      </div>
                    )}
                  </div>
                  <a href={`https://store.steampowered.com/app/${game.steam_app_id}`} target="_blank" rel="noopener noreferrer"
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3" /> Ir
                  </a>
                </div>
              </GlassCard>
            )}

            {/* CheapShark deals */}
            {deals.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-white/25 uppercase tracking-wider font-mono">OTRAS TIENDAS</p>
                {deals.slice(0, 8).map((deal, i) => {
                  const STORES = { '1': 'Steam', '2': 'GamersGate', '3': 'GreenManGaming', '7': 'GOG', '8': 'Origin', '11': 'Humble Bundle', '13': 'Uplay', '15': 'Fanatical', '21': 'WinGameStore', '23': 'GameBillet', '24': 'Voidu', '25': 'Epic Games', '27': 'Games Planet', '28': 'Gamesload', '29': 'Square Enix', '30': 'IndieGala', '31': 'Blizzard', '33': 'DLGamer', '34': 'Noctre', '35': 'DreamGame' };
                  const storeName = STORES[deal.storeID] || `Tienda #${deal.storeID}`;
                  const discount = Math.round((1 - deal.price / deal.retailPrice) * 100);

                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                      <div className="glass-panel p-4 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30 flex-shrink-0">
                          <ShoppingCart className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white/70">{storeName}</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          {discount > 0 && (
                            <>
                              <span className="px-1.5 py-0.5 rounded bg-medieval-forest-light/15 text-medieval-forest-light text-[10px] font-bold">-{discount}%</span>
                              <span className="text-white/20 line-through text-xs">${deal.retailPrice}</span>
                            </>
                          )}
                          <span className="text-medieval-gold font-bold">${deal.price}</span>
                        </div>
                        <a href={`https://www.cheapshark.com/redirect?dealID=${deal.dealID}`} target="_blank" rel="noopener noreferrer"
                          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> Ir
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {!steamPrice && !isFree && deals.length === 0 && (
              <div className="text-center py-12 text-white/20">
                <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>Nulla pretia inventa</p>
                <p className="text-[10px] text-white/10 mt-1">No se encontraron precios para este juego</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
