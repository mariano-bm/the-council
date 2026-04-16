import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import Avatar from '../components/ui/Avatar';
import RankBadge from '../components/ui/RankBadge';
import { Settings, Shield, Users, Calendar, Crown, Skull, Save, Plus, Trash2, Edit3, Clock, ThumbsDown } from 'lucide-react';
import { getUserRank, COUNCIL_RANKS, getMonthName, getRankById } from '../utils/helpers';

// Roles custom editables por admin
const DEFAULT_CUSTOM_ROLES = [
  { id: 'rex', name: 'Rex Supremus', latin: 'REX SUPREMUS', emoji: '♚', color: 'from-yellow-300 to-amber-600', perms: ['all'] },
  { id: 'consul', name: 'Consul', latin: 'CONSUL MAGNUS', emoji: '⚜', color: 'from-purple-400 to-violet-700', perms: ['manage_months', 'manage_votes'] },
  { id: 'praetor', name: 'Praetor', latin: 'PRAETOR IUDEX', emoji: '🏛', color: 'from-indigo-400 to-blue-700', perms: ['manage_reviews'] },
  { id: 'legatus', name: 'Legatus', latin: 'LEGATUS LEGIONIS', emoji: '⚔', color: 'from-red-500 to-rose-800', perms: ['moderate'] },
  { id: 'plebeius', name: 'Plebeius', latin: 'PLEBEIUS VULGARIS', emoji: '📜', color: 'from-zinc-400 to-zinc-600', perms: [] },
];

export default function AdminPage() {
  const { user } = useAuth();
  const { data: users } = useApi('/users');
  const { data: month } = useApi('/months/current');

  const [customRoles, setCustomRoles] = useState(DEFAULT_CUSTOM_ROLES);
  const [editingRole, setEditingRole] = useState(null);
  const [newMonthForm, setNewMonthForm] = useState(false);
  const [monthForm, setMonthForm] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    nomination_start: '', nomination_end: '',
    voting_start: '', voting_end: '',
    review_start: '', review_end: '',
  });

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-medieval-crimson-light/50">
        <Shield className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-lg medieval-text">Acceso denegado</p>
        <p className="text-sm text-white/20 font-mono uppercase tracking-wider mt-1">NON HABES POTESTATEM</p>
      </div>
    );
  }

  function updateRole(roleId, field, value) {
    setCustomRoles(prev => prev.map(r =>
      r.id === roleId ? { ...r, [field]: value } : r
    ));
  }

  function addRole() {
    setCustomRoles(prev => [...prev, {
      id: `role_${Date.now()}`,
      name: 'Nuevo Rol',
      latin: 'NOVUS GRADUS',
      emoji: '🔰',
      color: 'from-gray-400 to-gray-600',
      perms: [],
    }]);
  }

  function removeRole(roleId) {
    setCustomRoles(prev => prev.filter(r => r.id !== roleId));
  }

  async function createMonth() {
    try {
      await api.post('/months', monthForm);
      setNewMonthForm(false);
    } catch (err) {
      alert(err.message);
    }
  }

  async function changePhase(phase) {
    if (!month?.id) return;
    try {
      await api.patch(`/months/${month.id}/phase`, { phase });
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-royal flex items-center justify-center shadow-neon-violet">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white medieval-text">Panel del Administrador</h1>
          <p className="text-[10px] font-mono text-medieval-royal-light/40 uppercase tracking-[0.2em]">IMPERIUM ADMINISTRATORIS</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Gestión de Roles */}
        <GlassCard className="col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white/80 flex items-center gap-2 medieval-text">
              <Crown className="w-5 h-5 text-medieval-gold" />
              Roles del Consejo
            </h2>
            <button onClick={addRole} className="btn-secondary flex items-center gap-2 text-xs">
              <Plus className="w-3 h-3" />
              Nuevo Rol
            </button>
          </div>

          <div className="space-y-3">
            {customRoles.map((role, i) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-panel p-4"
              >
                {editingRole === role.id ? (
                  // Modo edición
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] text-white/30 block mb-1">Emoji</label>
                        <input
                          value={role.emoji}
                          onChange={e => updateRole(role.id, 'emoji', e.target.value)}
                          className="input-field text-center text-2xl"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/30 block mb-1">Nombre</label>
                        <input
                          value={role.name}
                          onChange={e => updateRole(role.id, 'name', e.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/30 block mb-1">Latin</label>
                        <input
                          value={role.latin}
                          onChange={e => updateRole(role.id, 'latin', e.target.value.toUpperCase())}
                          className="input-field font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/30 block mb-1">Color (Tailwind)</label>
                        <input
                          value={role.color}
                          onChange={e => updateRole(role.id, 'color', e.target.value)}
                          className="input-field text-xs"
                          placeholder="from-x-400 to-x-600"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingRole(null)} className="btn-secondary text-xs py-1.5 px-3">
                        Listo
                      </button>
                    </div>
                  </div>
                ) : (
                  // Modo vista
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center text-2xl shimmer-badge`}>
                      {role.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white/80 medieval-text">{role.name}</p>
                      <p className="text-[9px] font-mono text-medieval-gold/30 uppercase tracking-[0.2em]">{role.latin}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingRole(role.id)}
                        className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-medieval-gold transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeRole(role.id)}
                        className="p-2 rounded-lg hover:bg-medieval-crimson/10 text-white/20 hover:text-medieval-crimson-light transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* Gestión de Usuarios */}
        <GlassCard>
          <h2 className="text-lg font-semibold text-white/80 flex items-center gap-2 mb-4 medieval-text">
            <Users className="w-5 h-5 text-medieval-gold" />
            Miembros del Consejo
          </h2>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {(users || []).map(u => {
              const rank = getUserRank(u.recommender_points || 0, u.override_rank);
              return (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <Avatar src={u.avatar_url} name={u.discord_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">{u.discord_name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-medieval-gold/25 uppercase tracking-wider">{rank.latin}</span>
                      <span className="text-[9px] text-white/15">{u.recommender_points || 0} pts</span>
                    </div>
                  </div>
                  {/* Selector de rango */}
                  <select
                    defaultValue={u.override_rank || ''}
                    onChange={async (e) => {
                      try { await api.patch(`/users/${u.id}/role`, { role: u.role, override_rank: e.target.value || null }); }
                      catch { /* ignore in demo */ }
                    }}
                    className="bg-white/5 border border-medieval-gold/10 rounded-lg px-2 py-1 text-[10px] text-white/60 outline-none w-[130px]"
                  >
                    <option value="">Auto (por puntos)</option>
                    {COUNCIL_RANKS.map(r => (
                      <option key={r.id} value={r.id}>{r.emoji} {r.title}</option>
                    ))}
                  </select>
                  {/* Selector admin/member */}
                  <select
                    defaultValue={u.role}
                    onChange={async (e) => {
                      try { await api.patch(`/users/${u.id}/role`, { role: e.target.value }); }
                      catch { /* ignore in demo */ }
                    }}
                    className="bg-white/5 border border-medieval-gold/10 rounded-lg px-2 py-1 text-[10px] text-white/60 outline-none w-[80px]"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              );
            })}
            {(!users || users.length === 0) && (
              <p className="text-white/20 text-sm text-center py-6">Conecta el backend para ver miembros</p>
            )}
          </div>
        </GlassCard>

        {/* Gestión de Meses */}
        <GlassCard>
          <h2 className="text-lg font-semibold text-white/80 flex items-center gap-2 mb-4 medieval-text">
            <Calendar className="w-5 h-5 text-medieval-gold" />
            Control de Fases
          </h2>

          {month ? (
            <div className="space-y-4">
              <div className="glass-panel p-4 text-center">
                <p className="text-xs text-white/30 mb-1">Mes actual</p>
                <p className="text-lg font-bold text-white/80 medieval-text">
                  {getMonthName(month.month)} {month.year}
                </p>
                <p className="text-xs text-medieval-gold/50 mt-1">Fase: {month.phase}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {['nomination', 'voting', 'playing', 'review', 'completed'].map(phase => (
                  <button
                    key={phase}
                    onClick={() => changePhase(phase)}
                    className={`p-2 rounded-xl text-xs font-semibold transition-all medieval-text ${
                      month.phase === phase
                        ? 'bg-medieval-gold/20 text-medieval-gold ring-1 ring-medieval-gold/30'
                        : 'bg-white/[0.03] text-white/40 hover:bg-white/[0.06]'
                    }`}
                  >
                    {phase === 'nomination' ? 'Nominacion' :
                     phase === 'voting' ? 'Votacion' :
                     phase === 'playing' ? 'Jugando' :
                     phase === 'review' ? 'Review' : 'Completado'}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-white/30 text-sm mb-4">No hay mes activo</p>
              <button onClick={() => setNewMonthForm(true)} className="btn-primary text-xs">
                Crear Nuevo Mes
              </button>
            </div>
          )}

          {newMonthForm && (
            <div className="mt-4 space-y-3 p-4 rounded-xl bg-white/[0.02] border border-medieval-gold/10">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/30 block mb-1">Anio</label>
                  <input type="number" value={monthForm.year} onChange={e => setMonthForm(p => ({ ...p, year: +e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 block mb-1">Mes</label>
                  <input type="number" min="1" max="12" value={monthForm.month} onChange={e => setMonthForm(p => ({ ...p, month: +e.target.value }))} className="input-field" />
                </div>
              </div>
              {['nomination', 'voting', 'review'].map(phase => (
                <div key={phase} className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-white/30 block mb-1">{phase} inicio</label>
                    <input type="date" onChange={e => setMonthForm(p => ({ ...p, [`${phase}_start`]: e.target.value }))} className="input-field text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/30 block mb-1">{phase} fin</label>
                    <input type="date" onChange={e => setMonthForm(p => ({ ...p, [`${phase}_end`]: e.target.value }))} className="input-field text-xs" />
                  </div>
                </div>
              ))}
              <button onClick={createMonth} className="btn-primary w-full flex items-center justify-center gap-2 text-xs">
                <Save className="w-3 h-3" />
                Crear
              </button>
            </div>
          )}
        </GlassCard>

        {/* Hoyo de la Vergüenza - Control */}
        <GlassCard className="col-span-2">
          <h2 className="text-lg font-semibold text-medieval-crimson-light/80 flex items-center gap-2 mb-4 medieval-text">
            <Skull className="w-5 h-5 text-medieval-crimson-light" />
            Control del Hoyo de la Verguenza
          </h2>
          <p className="text-sm text-white/30 mb-4">
            Los usuarios entran automaticamente al Hoyo cuando:
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Sin conexion', desc: 'Mas de 30 dias sin actividad', icon: Clock },
              { label: 'Reputacion negativa', desc: 'Score de reputacion menor a -10', icon: ThumbsDown },
              { label: 'No participa', desc: 'No vota ni reviewea en 3+ meses', icon: Skull },
            ].map(({ label, desc, icon: Icon }) => (
              <div key={label} className="glass-panel p-4">
                <Icon className="w-5 h-5 text-medieval-crimson-light/50 mb-2" />
                <p className="text-sm font-medium text-white/70 medieval-text">{label}</p>
                <p className="text-[10px] text-white/30 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
