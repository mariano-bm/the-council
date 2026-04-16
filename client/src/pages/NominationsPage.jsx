import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import Avatar from '../components/ui/Avatar';
import { Swords, Plus, X, Send, Sparkles, Gamepad2, Film, Users, Dices, Trophy, Check, UserPlus, UserMinus, Lock, Clock, Search } from 'lucide-react';

const ACTIVITY_TAGS = [
  { id: 'game', icon: Gamepad2, label: 'Juego' },
  { id: 'movie', icon: Film, label: 'Peli / Serie' },
  { id: 'tournament', icon: Trophy, label: 'Torneo' },
  { id: 'hangout', icon: Users, label: 'Juntada' },
  { id: 'challenge', icon: Dices, label: 'Desafio' },
  { id: 'other', icon: Sparkles, label: 'Otro' },
];

const TAG_STYLES = {
  game: 'text-medieval-gold bg-medieval-gold/10',
  movie: 'text-neon-cyan bg-neon-cyan/10',
  tournament: 'text-medieval-crimson-light bg-medieval-crimson/10',
  hangout: 'text-medieval-forest-light bg-medieval-forest-light/10',
  challenge: 'text-neon-violet bg-neon-violet/10',
  other: 'text-white/50 bg-white/5',
};

export default function NominationsPage() {
  const { user } = useAuth();
  const { data: activities, refetch } = useApi('/activities');
  const { data: deals } = useApi('/games/deals');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'game', description: '', cover_url: '' });
  const [submitting, setSubmitting] = useState(false);
  const [gameSearch, setGameSearch] = useState('');
  const [gameResults, setGameResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const allActivities = activities || [];
  const openActivities = allActivities.filter(a => a.status === 'open');
  const closedActivities = allActivities.filter(a => a.status !== 'open');

  async function searchGames() {
    if (gameSearch.length < 2) return;
    setSearching(true);
    try {
      const results = await api.get(`/games/search?q=${encodeURIComponent(gameSearch)}`);
      setGameResults(results);
    } catch { setGameResults([]); }
    finally { setSearching(false); }
  }

  function selectGame(game) {
    setForm(f => ({ ...f, name: game.name, cover_url: game.cover_url || '', description: game.description || '' }));
    setGameResults([]);
    setGameSearch('');
  }

  async function createActivity() {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/activities', { ...form });
      setForm({ name: '', type: 'game', description: '', cover_url: '' });
      setShowForm(false);
      refetch();
    } catch (err) { alert(err.message); }
    finally { setSubmitting(false); }
  }

  async function joinActivity(id) {
    try { const r = await api.post(`/activities/${id}/join`); alert(r.message); refetch(); }
    catch (err) { alert(err.message); }
  }
  async function leaveActivity(id) {
    try { const r = await api.post(`/activities/${id}/leave`); alert(r.message); refetch(); }
    catch (err) { alert(err.message); }
  }
  async function closeActivity(id) {
    try { const r = await api.post(`/activities/${id}/close`); alert(r.message); refetch(); }
    catch (err) { alert(err.message); }
  }
  async function deleteActivity(id) {
    try { await api.delete(`/activities/${id}`); refetch(); }
    catch (err) { alert(err.message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Swords className="w-6 h-6 text-medieval-gold" />
            Actividades
          </h1>
          <p className="text-white/40 text-sm mt-1">{openActivities.length} abiertas</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Actividad
        </button>
      </div>

      {/* ===== CREATE FORM ===== */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard className="space-y-5">
              <h3 className="font-semibold text-white/80 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-medieval-gold" />
                Crear Actividad
              </h3>

              {/* Game search — always visible */}
              <div className="space-y-2">
                <label className="text-xs text-white/40">Buscar juego</label>
                <div className="flex gap-2">
                  <input value={gameSearch} onChange={e => setGameSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchGames()}
                    placeholder="Buscar juego..."
                    className="input-field flex-1" />
                  <button onClick={searchGames} disabled={searching || gameSearch.length < 2}
                    className="btn-secondary disabled:opacity-30">
                    {searching ? <Clock className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                </div>

                {/* Search results */}
                {gameResults.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="max-h-64 overflow-y-auto space-y-1 rounded-xl bg-council-darker/80 backdrop-blur-md border border-medieval-gold/10 p-2">
                    {gameResults.map((game, i) => (
                      <motion.button key={`${game.name}-${i}`} onClick={() => selectGame(game)}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-medieval-gold/5 transition-all text-left group">
                        {game.cover_url && <img src={game.cover_url} alt="" className="w-24 h-11 rounded-lg object-cover flex-shrink-0 group-hover:scale-105 transition-transform" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/90 truncate group-hover:text-medieval-gold transition-colors">{game.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {game.genres?.slice(0, 2).map(g => (
                              <span key={g} className="text-[8px] px-1.5 py-0.5 rounded-full bg-medieval-gold/5 text-medieval-gold/40">{g}</span>
                            ))}
                            {game.metacritic && <span className="text-[8px] text-medieval-forest-light/50">MC:{game.metacritic}</span>}
                            {game.price && <span className="text-[8px] text-white/20">{game.price}</span>}
                            <span className="text-[7px] text-white/10 uppercase">{game.source}</span>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* Deal suggestions when not searching */}
                {!gameSearch && deals?.length > 0 && gameResults.length === 0 && (
                  <div>
                    <p className="text-[10px] text-medieval-gold/30 uppercase tracking-wider mb-2">Ofertas en Steam ahora</p>
                    <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                      {deals.slice(0, 6).map((deal, i) => (
                        <motion.button key={i} onClick={() => selectGame({ name: deal.name, cover_url: deal.cover_url, steam_app_id: deal.steam_app_id })}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-medieval-gold/5 transition-all text-left">
                          {deal.cover_url && <img src={deal.cover_url} alt="" className="w-14 h-6 rounded object-cover flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-white/70 truncate">{deal.name}</p>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-medieval-forest-light font-mono">{deal.sale_price}</span>
                              {deal.discount > 0 && <span className="text-[7px] px-1 rounded bg-medieval-forest-light/10 text-medieval-forest-light">-{deal.discount}%</span>}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Activity name */}
              <div>
                <label className="text-xs text-white/40">Nombre de la actividad</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nombre..." className="input-field mt-1" />
              </div>

              {/* Preview selected cover */}
              {form.cover_url && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-medieval-gold/5 border border-medieval-gold/15">
                  <img src={form.cover_url} alt="" className="w-28 h-13 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="font-semibold text-white/90">{form.name}</p>
                    {form.description && <p className="text-[10px] text-white/30 line-clamp-2 mt-0.5">{form.description}</p>}
                  </div>
                  <button onClick={() => setForm(f => ({ ...f, cover_url: '', name: '', description: '' }))}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/30"><X className="w-3.5 h-3.5" /></button>
                </motion.div>
              )}

              {/* Tags — optional */}
              <div>
                <label className="text-xs text-white/40">Etiqueta (opcional)</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {ACTIVITY_TAGS.map(tag => {
                    const Icon = tag.icon;
                    const active = form.type === tag.id;
                    return (
                      <button key={tag.id} onClick={() => setForm(f => ({ ...f, type: f.type === tag.id ? '' : tag.id }))}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                          active ? `${TAG_STYLES[tag.id]} border border-current/20` : 'bg-white/[0.03] text-white/25 border border-transparent hover:text-white/40'
                        }`}>
                        <Icon className="w-3 h-3" /> {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descripcion (opcional)..." rows={2} className="input-field resize-none text-sm" />

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => { setShowForm(false); setGameResults([]); }} className="btn-secondary text-sm">Cancelar</button>
                <button onClick={createActivity} disabled={!form.name.trim() || submitting}
                  className="btn-primary flex items-center gap-2 text-sm disabled:opacity-40">
                  <Send className="w-4 h-4" /> {submitting ? 'Creando...' : 'Crear Actividad'}
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== ACTIVITY CARDS ===== */}
      <div className="grid grid-cols-2 gap-4">
        {openActivities.map((act, i) => {
          const tag = ACTIVITY_TAGS.find(t => t.id === act.type) || ACTIVITY_TAGS[5];
          const TagIcon = tag.icon;
          const isSignedUp = act.signups?.some(s => s.user_id === user?.id);
          const signupCount = act.signups?.length || 0;

          return (
            <motion.div key={act.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, type: 'spring', stiffness: 120 }}>
              <div className="glass-card p-5 relative overflow-hidden group">
                {/* BG image */}
                {act.cover_url && (
                  <div className="absolute inset-0 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500">
                    <img src={act.cover_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="relative">
                  {/* Tag + participants */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider ${TAG_STYLES[act.type] || TAG_STYLES.other}`}>
                      <TagIcon className="w-3 h-3" /> {tag.label}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-white/25 font-mono">
                      <Users className="w-3 h-3" /> {signupCount}{act.max_participants ? `/${act.max_participants}` : ''}
                    </span>
                  </div>

                  {/* Title + description */}
                  <h3 className="font-bold text-white/90 text-lg mb-1 group-hover:text-medieval-gold transition-colors">{act.name}</h3>
                  {act.description && <p className="text-sm text-white/35 mb-3 line-clamp-2">{act.description}</p>}

                  {/* Points */}
                  <div className="flex items-center gap-3 mb-4 text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-medieval-forest-light/10 text-medieval-forest-light">+{act.points_join} pts</span>
                    <span className="px-2 py-0.5 rounded-full bg-medieval-crimson/10 text-medieval-crimson-light">{act.points_skip} pts si no te anotas</span>
                  </div>

                  {/* Signups */}
                  {signupCount > 0 && (
                    <div className="flex items-center gap-1 mb-4">
                      <div className="flex -space-x-2">
                        {act.signups.slice(0, 6).map(s => (
                          <div key={s.user_id} className="ring-2 ring-council-dark rounded-full">
                            <Avatar src={s.avatar_url} name={s.discord_name} size="sm" />
                          </div>
                        ))}
                      </div>
                      {signupCount > 6 && <span className="text-[10px] text-white/20 ml-1">+{signupCount - 6}</span>}
                    </div>
                  )}

                  {/* Action button */}
                  <div className="flex items-center gap-2">
                    {isSignedUp ? (
                      <>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-medieval-forest-light/10 border border-medieval-forest-light/20 text-medieval-forest-light text-sm font-semibold">
                          <Check className="w-4 h-4" /> Anotado
                        </motion.div>
                        <button onClick={() => leaveActivity(act.id)}
                          className="p-2.5 rounded-xl bg-white/[0.03] text-white/20 hover:text-medieval-crimson-light hover:bg-medieval-crimson/10 transition-all" title="Salir">
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <motion.button onClick={() => joinActivity(act.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm py-2.5">
                        <UserPlus className="w-4 h-4" /> Anotarme
                      </motion.button>
                    )}

                    {user?.role === 'admin' && (
                      <>
                        <button onClick={() => closeActivity(act.id)}
                          className="p-2.5 rounded-xl bg-white/[0.03] text-white/15 hover:text-neon-amber hover:bg-neon-amber/5 transition-all" title="Cerrar">
                          <Lock className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteActivity(act.id)}
                          className="p-2.5 rounded-xl bg-white/[0.03] text-white/15 hover:text-medieval-crimson-light hover:bg-medieval-crimson/5 transition-all" title="Eliminar">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Creator */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                    <Avatar src={act.creator_avatar} name={act.creator_name} size="sm" />
                    <span className="text-[10px] text-white/20">{act.creator_name}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {openActivities.length === 0 && !showForm && (
        <div className="text-center py-16 text-white/30">
          <Swords className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No hay actividades abiertas</p>
          <p className="text-xs text-white/15 mt-1">Crea la primera actividad del Council</p>
        </div>
      )}

      {/* Closed activities */}
      {closedActivities.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-white/20 flex items-center gap-2 mb-3 uppercase tracking-wider">
            <Clock className="w-3 h-3" /> Cerradas
          </h2>
          <div className="space-y-1.5">
            {closedActivities.map(act => {
              const tag = ACTIVITY_TAGS.find(t => t.id === act.type) || ACTIVITY_TAGS[5];
              return (
                <div key={act.id} className="glass-panel p-3 flex items-center gap-3 opacity-40">
                  <tag.icon className={`w-4 h-4 ${TAG_STYLES[act.type]?.split(' ')[0] || 'text-white/30'}`} />
                  <span className="text-sm text-white/50 flex-1">{act.name}</span>
                  <span className="text-[10px] text-white/20 font-mono">{act.signup_count || 0} participaron</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
