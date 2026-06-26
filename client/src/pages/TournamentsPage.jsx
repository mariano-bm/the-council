import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import Avatar from '../components/ui/Avatar';
import { Swords, Plus, Send, Trophy, Users, Crown, ArrowRight, Tv, X } from 'lucide-react';

const STATUS_INFO = {
  open:     { label: 'Inscripciones abiertas', latin: 'PORTAE APERTAE', color: 'text-medieval-forest-light bg-medieval-forest-light/10' },
  seeding:  { label: 'Armando bracket', latin: 'ORDINATIO', color: 'text-neon-amber bg-neon-amber/10' },
  live:     { label: 'En juego', latin: 'IN CERTAMINE', color: 'text-medieval-gold bg-medieval-gold/10' },
  finished: { label: 'Finalizado', latin: 'PERACTUM', color: 'text-white/40 bg-white/5' },
};

export default function TournamentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: tournaments, refetch } = useApi('/tournaments');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', mode: '1v1', best_of: 3, prize_1: '', prize_2: '', prize_3: '' });
  const [submitting, setSubmitting] = useState(false);

  const list = tournaments || [];

  async function createTournament() {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const t = await api.post('/tournaments', form);
      toast.success('Torneo convocado', { title: 'Certamen Novum' });
      setShowForm(false);
      setForm({ name: '', description: '', mode: '1v1', best_of: 3, prize_1: '', prize_2: '', prize_3: '' });
      refetch();
      navigate(`/torneos/${t.id}`);
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-6 h-6 text-medieval-gold" />
            Torneos del Consejo
          </h1>
          <p className="text-[10px] font-mono text-medieval-gold/30 uppercase tracking-[0.2em] mt-1">CERTAMINA · ARENA DEL CONSEJO</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Crear Torneo
          </button>
        )}
      </div>

      {/* Crear torneo */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard className="space-y-4">
              <p className="text-[10px] text-medieval-gold/30 font-mono uppercase tracking-wider">CONVOCATIO CERTAMINIS</p>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre del torneo..." className="input-field" />
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripcion (opcional)..." rows={2} className="input-field resize-none text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">Modo</label>
                  <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03]">
                    {['1v1', '2v2'].map(m => (
                      <button key={m} onClick={() => setForm(f => ({ ...f, mode: m }))}
                        className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${form.mode === m ? 'bg-medieval-gold/15 text-medieval-gold' : 'text-white/30'}`}>{m}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">Best of</label>
                  <select value={form.best_of} onChange={e => setForm(f => ({ ...f, best_of: Number(e.target.value) }))} className="input-field text-sm">
                    {[1,3,5,7].map(n => <option key={n} value={n}>Bo{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-medieval-gold/50 uppercase tracking-wider mb-1 block">🏆 1er premio</label>
                  <input value={form.prize_1} onChange={e => setForm(f => ({ ...f, prize_1: e.target.value }))} placeholder="ej: Key de Steam" className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">🥈 2do</label>
                  <input value={form.prize_2} onChange={e => setForm(f => ({ ...f, prize_2: e.target.value }))} placeholder="opcional" className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">🥉 3ro</label>
                  <input value={form.prize_3} onChange={e => setForm(f => ({ ...f, prize_3: e.target.value }))} placeholder="opcional" className="input-field text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancelar</button>
                <button onClick={createTournament} disabled={!form.name.trim() || submitting} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-40">
                  <Send className="w-4 h-4" /> {submitting ? 'Creando...' : 'Convocar'}
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista */}
      <div className="grid grid-cols-2 gap-4">
        {list.map((t, i) => {
          const st = STATUS_INFO[t.status] || STATUS_INFO.open;
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, type: 'spring', stiffness: 120 }}>
              <button onClick={() => navigate(`/torneos/${t.id}`)} className="w-full text-left glass-card p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider ${st.color}`}>{st.label}</span>
                  <span className="text-[9px] font-mono text-white/20 uppercase">{t.mode} · Bo{t.best_of}</span>
                </div>
                <h3 className="font-bold text-white/90 text-lg group-hover:text-medieval-gold transition-colors">{t.name}</h3>
                {t.description && <p className="text-xs text-white/35 mt-1 line-clamp-2">{t.description}</p>}

                {t.status === 'finished' && t.champion_name && (
                  <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-medieval-gold/8 border border-medieval-gold/15">
                    <Crown className="w-4 h-4 text-medieval-gold" />
                    <span className="text-xs text-white/60">Campeón:</span>
                    <span className="text-xs font-bold text-medieval-gold">{t.champion_name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
                  <span className="flex items-center gap-1.5 text-[10px] text-white/30">
                    <Users className="w-3 h-3" /> {t.participant_count || 0} inscriptos
                  </span>
                  {t.prize_1 && <span className="flex items-center gap-1 text-[10px] text-medieval-gold/50"><Trophy className="w-3 h-3" /> {t.prize_1}</span>}
                  <ArrowRight className="w-4 h-4 text-white/15 group-hover:text-medieval-gold/50 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {list.length === 0 && !showForm && (
        <div className="text-center py-16 text-white/30">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No hay torneos todavía</p>
          <p className="text-[10px] font-mono text-medieval-gold/20 mt-1 uppercase tracking-wider">NULLA CERTAMINA</p>
        </div>
      )}

      {/* Acceso al overlay control */}
      {user?.role === 'admin' && (
        <div className="text-center pt-4">
          <button onClick={() => navigate('/torneos/overlay')} className="btn-secondary inline-flex items-center gap-2 text-sm">
            <Tv className="w-4 h-4 text-medieval-gold" /> Control del Overlay (OBS)
          </button>
        </div>
      )}
    </div>
  );
}
