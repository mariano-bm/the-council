import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import Avatar from '../components/ui/Avatar';
import { Gamepad2, Search, Plus, X, Send, Sparkles } from 'lucide-react';

export default function NominationsPage() {
  const { user } = useAuth();
  const { data, loading, refetch } = useApi('/nominations/current');
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [pitch, setPitch] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const nominations = data?.nominations || [];
  const month = data?.month;
  const myNominations = nominations.filter(n => n.nominator_id === user?.id);

  const searchGames = useCallback(async () => {
    if (searchQuery.length < 2) return;
    setSearching(true);
    try {
      const results = await api.get(`/games/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(results);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }, [searchQuery]);

  async function selectGame(game) {
    // Create/find game in our DB
    const created = await api.post('/games', {
      name: game.name,
      steam_app_id: game.steam_app_id || null,
      rawg_slug: game.rawg_slug || null,
      cover_url: game.cover_url,
      genres: game.genres || [],
      platforms: game.platforms || [],
      metacritic: game.metacritic,
      release_date: game.release_date || null,
    });
    setSelectedGame(created);
    setSearchResults([]);
    setSearchQuery('');
  }

  async function submitNomination() {
    if (!selectedGame || !pitch.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/nominations', { game_id: selectedGame.id, pitch: pitch.trim() });
      setSelectedGame(null);
      setPitch('');
      setShowForm(false);
      refetch();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteNomination(id) {
    await api.delete(`/nominations/${id}`);
    refetch();
  }

  if (!month) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/40">
        <Gamepad2 className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-lg">No hay fase de nominación activa</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Gamepad2 className="w-6 h-6 text-neon-cyan" />
            Nominaciones
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {myNominations.length}/3 nominaciones usadas
          </p>
        </div>
        {myNominations.length < 3 && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nominar Juego
          </button>
        )}
      </div>

      {/* Nomination form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard className="space-y-4">
              <h3 className="font-semibold text-white/80 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-neon-violet" />
                Nueva Nominación
              </h3>

              {!selectedGame ? (
                <>
                  <div className="flex gap-2">
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchGames()}
                      placeholder="Buscar juego (Steam/RAWG)..."
                      className="input-field flex-1"
                    />
                    <button onClick={searchGames} disabled={searching} className="btn-secondary">
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {searchResults.map((game, i) => (
                        <button
                          key={`${game.name}-${i}`}
                          onClick={() => selectGame(game)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-left"
                        >
                          {game.cover_url && (
                            <img src={game.cover_url} alt="" className="w-12 h-16 rounded-lg object-cover" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white/90 truncate">{game.name}</p>
                            <p className="text-xs text-white/40">
                              {game.genres?.join(', ') || game.source}
                              {game.metacritic && ` — Metacritic: ${game.metacritic}`}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-neon-violet/5 border border-neon-violet/20">
                  {selectedGame.cover_url && (
                    <img src={selectedGame.cover_url} alt="" className="w-12 h-16 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-white/90">{selectedGame.name}</p>
                    <p className="text-xs text-white/40">{selectedGame.genres?.join(', ')}</p>
                  </div>
                  <button onClick={() => setSelectedGame(null)} className="p-1 hover:bg-white/10 rounded-lg">
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                </div>
              )}

              <textarea
                value={pitch}
                onChange={e => setPitch(e.target.value)}
                placeholder="¿Por qué lo recomendás? Tu pitch para convencer al Council..."
                rows={3}
                className="input-field resize-none"
              />

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button
                  onClick={submitNomination}
                  disabled={!selectedGame || !pitch.trim() || submitting}
                  className="btn-primary flex items-center gap-2 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Enviando...' : 'Nominar'}
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nominations grid */}
      <div className="grid grid-cols-2 gap-4">
        {nominations.map((nom, i) => (
          <GlassCard key={nom.id} delay={i * 0.05} className="relative overflow-hidden">
            {nom.cover_url && (
              <div className="absolute inset-0 opacity-[0.04]">
                <img src={nom.cover_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="relative flex gap-4">
              {nom.cover_url && (
                <img src={nom.cover_url} alt="" className="w-20 h-28 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white/90 text-lg mb-1">{nom.game_name}</h3>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {nom.genres?.slice(0, 3).map(g => (
                    <span key={g} className="px-2 py-0.5 rounded-full text-[10px] bg-neon-cyan/10 text-neon-cyan/70">
                      {g}
                    </span>
                  ))}
                  {nom.metacritic && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-neon-emerald/10 text-neon-emerald/70">
                      MC: {nom.metacritic}
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/50 line-clamp-2 italic">"{nom.pitch}"</p>
                <div className="flex items-center gap-2 mt-3">
                  <Avatar src={nom.avatar_url} name={nom.discord_name} size="sm" />
                  <span className="text-xs text-white/40">{nom.discord_name}</span>
                </div>
              </div>
              {nom.nominator_id === user?.id && (
                <button
                  onClick={() => deleteNomination(nom.id)}
                  className="absolute top-0 right-0 p-1.5 rounded-lg hover:bg-neon-red/10 text-white/20 hover:text-neon-red transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {nominations.length === 0 && (
        <div className="text-center py-16 text-white/30">
          <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Todavía no hay nominaciones. ¡Sé el primero!</p>
        </div>
      )}
    </div>
  );
}
