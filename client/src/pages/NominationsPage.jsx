import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import Avatar from '../components/ui/Avatar';
import { Swords, Plus, X, Send, Sparkles, Gamepad2, Film, Users, Dices, Trophy, Check, UserPlus, UserMinus, Lock, Clock } from 'lucide-react';

const ACTIVITY_TYPES = [
  { id: 'game', icon: Gamepad2, label: 'Juego del Mes', color: 'text-medieval-gold', bg: 'bg-medieval-gold/10' },
  { id: 'movie', icon: Film, label: 'Peli / Serie', color: 'text-neon-cyan', bg: 'bg-neon-cyan/10' },
  { id: 'tournament', icon: Trophy, label: 'Torneo', color: 'text-medieval-crimson-light', bg: 'bg-medieval-crimson/10' },
  { id: 'hangout', icon: Users, label: 'Juntada', color: 'text-medieval-forest-light', bg: 'bg-medieval-forest-light/10' },
  { id: 'challenge', icon: Dices, label: 'Desafio', color: 'text-neon-violet', bg: 'bg-neon-violet/10' },
  { id: 'other', icon: Sparkles, label: 'Otro', color: 'text-white/50', bg: 'bg-white/5' },
];

export default function NominationsPage() {
  const { user } = useAuth();
  const { data: activities, refetch } = useApi('/activities');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'game', description: '', cover_url: '', points_join: 5, points_skip: -3, max_participants: '' });
  const [submitting, setSubmitting] = useState(false);

  const allActivities = activities || [];
  const openActivities = allActivities.filter(a => a.status === 'open');
  const closedActivities = allActivities.filter(a => a.status !== 'open');

  async function createActivity() {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/activities', {
        ...form,
        points_join: parseInt(form.points_join) || 5,
        points_skip: parseInt(form.points_skip) || -3,
        max_participants: form.max_participants ? parseInt(form.max_participants) : null,
      });
      setForm({ name: '', type: 'game', description: '', cover_url: '', points_join: 5, points_skip: -3, max_participants: '' });
      setShowForm(false);
      refetch();
    } catch (err) { alert(err.message); }
    finally { setSubmitting(false); }
  }

  async function joinActivity(id) {
    try {
      const res = await api.post(`/activities/${id}/join`);
      alert(res.message);
      refetch();
    } catch (err) { alert(err.message); }
  }

  async function leaveActivity(id) {
    try {
      const res = await api.post(`/activities/${id}/leave`);
      alert(res.message);
      refetch();
    } catch (err) { alert(err.message); }
  }

  async function closeActivity(id) {
    try {
      const res = await api.post(`/activities/${id}/close`);
      alert(res.message);
      refetch();
    } catch (err) { alert(err.message); }
  }

  async function deleteActivity(id) {
    try {
      await api.delete(`/activities/${id}`);
      refetch();
    } catch (err) { alert(err.message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Swords className="w-6 h-6 text-medieval-gold" />
            Actividades
          </h1>
          <p className="text-white/40 text-sm mt-1">{openActivities.length} actividades abiertas</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Actividad
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard className="space-y-4">
              <h3 className="font-semibold text-white/80 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-medieval-gold" />
                Crear Actividad
              </h3>

              {/* Type selector */}
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <button key={type.id} onClick={() => setForm(f => ({ ...f, type: type.id }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        form.type === type.id ? `${type.bg} ${type.color} border border-current/30` : 'bg-white/5 text-white/40 border border-transparent'
                      }`}>
                      <Icon className="w-3.5 h-3.5" /> {type.label}
                    </button>
                  );
                })}
              </div>

              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nombre de la actividad..." className="input-field" />

              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descripcion (opcional)..." rows={2} className="input-field resize-none" />

              <input value={form.cover_url} onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))}
                placeholder="URL de imagen (opcional)" className="input-field text-xs" />

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-white/30 block mb-1">Puntos por anotarse</label>
                  <input type="number" value={form.points_join} onChange={e => setForm(f => ({ ...f, points_join: e.target.value }))}
                    className="input-field text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 block mb-1">Penalizacion por no anotarse</label>
                  <input type="number" value={form.points_skip} onChange={e => setForm(f => ({ ...f, points_skip: e.target.value }))}
                    className="input-field text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 block mb-1">Max participantes (vacio = sin limite)</label>
                  <input type="number" value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: e.target.value }))}
                    placeholder="∞" className="input-field text-xs" />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
                <button onClick={createActivity} disabled={!form.name.trim() || submitting}
                  className="btn-primary flex items-center gap-2 disabled:opacity-40">
                  <Send className="w-4 h-4" /> {submitting ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Open activities */}
      <div className="grid grid-cols-2 gap-4">
        {openActivities.map((act, i) => {
          const type = ACTIVITY_TYPES.find(t => t.id === act.type) || ACTIVITY_TYPES[5];
          const TypeIcon = type.icon;
          const isSignedUp = act.signups?.some(s => s.user_id === user?.id);
          const signupCount = act.signups?.length || 0;

          return (
            <GlassCard key={act.id} delay={i * 0.05} className="relative overflow-hidden">
              {act.cover_url && (
                <div className="absolute inset-0 opacity-[0.06]">
                  <img src={act.cover_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${type.bg} flex items-center justify-center`}>
                      <TypeIcon className={`w-4 h-4 ${type.color}`} />
                    </div>
                    <span className={`text-[9px] uppercase tracking-wider ${type.color}`}>{type.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/30">
                    <Users className="w-3 h-3" />
                    <span className="font-mono">{signupCount}{act.max_participants ? `/${act.max_participants}` : ''}</span>
                  </div>
                </div>

                <h3 className="font-bold text-white/90 text-lg mb-1">{act.name}</h3>
                {act.description && <p className="text-sm text-white/40 mb-3">{act.description}</p>}

                {/* Points info */}
                <div className="flex items-center gap-4 mb-4 text-xs">
                  <span className="text-medieval-forest-light">+{act.points_join} pts por anotarte</span>
                  <span className="text-medieval-crimson-light">{act.points_skip} pts si no te anotas</span>
                </div>

                {/* Signups avatars */}
                {act.signups?.length > 0 && (
                  <div className="flex items-center gap-1 mb-4">
                    {act.signups.slice(0, 8).map(s => (
                      <Avatar key={s.user_id} src={s.avatar_url} name={s.discord_name} size="sm" />
                    ))}
                    {act.signups.length > 8 && (
                      <span className="text-xs text-white/30 ml-1">+{act.signups.length - 8}</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {isSignedUp ? (
                    <>
                      <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-medieval-forest-light/10 text-medieval-forest-light text-sm">
                        <Check className="w-4 h-4" /> Anotado
                      </div>
                      <button onClick={() => leaveActivity(act.id)}
                        className="p-2 rounded-xl bg-white/5 text-white/30 hover:text-medieval-crimson-light hover:bg-medieval-crimson/10 transition-colors"
                        title="Salir">
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => joinActivity(act.id)}
                      className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm">
                      <UserPlus className="w-4 h-4" /> Anotarme (+{act.points_join} pts)
                    </button>
                  )}

                  {/* Admin actions */}
                  {user?.role === 'admin' && (
                    <>
                      <button onClick={() => closeActivity(act.id)}
                        className="p-2 rounded-xl bg-white/5 text-white/20 hover:text-neon-amber transition-colors" title="Cerrar y penalizar">
                        <Lock className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteActivity(act.id)}
                        className="p-2 rounded-xl bg-white/5 text-white/20 hover:text-medieval-crimson-light transition-colors" title="Eliminar">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Creator */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                  <Avatar src={act.creator_avatar} name={act.creator_name} size="sm" />
                  <span className="text-[10px] text-white/25">Creado por {act.creator_name}</span>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {openActivities.length === 0 && !showForm && (
        <div className="text-center py-16 text-white/30">
          <Swords className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay actividades abiertas</p>
          <p className="text-xs text-white/15 mt-1">Crea una nueva actividad para el Council</p>
        </div>
      )}

      {/* Closed activities */}
      {closedActivities.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white/30 flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" /> Actividades cerradas
          </h2>
          <div className="space-y-2">
            {closedActivities.map(act => {
              const type = ACTIVITY_TYPES.find(t => t.id === act.type) || ACTIVITY_TYPES[5];
              return (
                <div key={act.id} className="glass-panel p-3 flex items-center gap-3 opacity-50">
                  <type.icon className={`w-4 h-4 ${type.color}`} />
                  <span className="text-sm text-white/50 flex-1">{act.name}</span>
                  <span className="text-xs text-white/20 font-mono">{act.signup_count || 0} participaron</span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-white/20 uppercase">{act.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
