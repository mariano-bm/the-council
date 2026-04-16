import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import Avatar from '../components/ui/Avatar';
import RankBadge from '../components/ui/RankBadge';
import { Settings, Shield, Users, Calendar, Crown, Skull, Save, Plus, Trash2, Edit3, Ban, Check, X, TrendingUp, TrendingDown, Clock, Gavel } from 'lucide-react';
import { getUserRank, COUNCIL_RANKS, getMonthName } from '../utils/helpers';

export default function AdminPage() {
  const { user } = useAuth();
  const { data: users, refetch: refetchUsers } = useApi('/admin/users');
  const { data: month } = useApi('/months/current');

  const [editingUser, setEditingUser] = useState(null);
  const [pointsInput, setPointsInput] = useState('');
  const [repInput, setRepInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [banReason, setBanReason] = useState('');
  const [newMonthForm, setNewMonthForm] = useState(false);
  const [monthForm, setMonthForm] = useState({
    year: new Date().getFullYear(), month: new Date().getMonth() + 1,
    nomination_start: '', nomination_end: '', voting_start: '', voting_end: '', review_start: '', review_end: '',
  });

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-medieval-crimson-light/50">
        <Shield className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-lg">Acceso denegado</p>
        <p className="text-sm text-white/20 font-mono uppercase tracking-wider mt-1">NON HABES POTESTATEM</p>
      </div>
    );
  }

  async function setRole(userId, role) {
    await api.patch(`/admin/users/${userId}/role`, { role });
    refetchUsers();
  }

  async function setRank(userId, override_rank) {
    await api.patch(`/admin/users/${userId}/rank`, { override_rank: override_rank || null });
    refetchUsers();
  }

  async function modifyPoints(userId, amount, reason) {
    await api.patch(`/admin/users/${userId}/points`, { amount: parseInt(amount), reason });
    setPointsInput(''); setReasonInput('');
    refetchUsers();
  }

  async function setPoints(userId, points) {
    await api.patch(`/admin/users/${userId}/points/set`, { points: parseInt(points) });
    setPointsInput('');
    refetchUsers();
  }

  async function modifyRep(userId, amount, reason) {
    await api.patch(`/admin/users/${userId}/reputation`, { amount: parseInt(amount), reason });
    setRepInput(''); setReasonInput('');
    refetchUsers();
  }

  async function banUser(userId) {
    await api.patch(`/admin/users/${userId}/ban`, { reason: banReason || 'Baneado por admin' });
    setBanReason(''); setEditingUser(null);
    refetchUsers();
  }

  async function unbanUser(userId) {
    await api.patch(`/admin/users/${userId}/unban`);
    refetchUsers();
  }

  async function deleteUser(userId) {
    await api.delete(`/admin/users/${userId}`);
    setEditingUser(null);
    refetchUsers();
  }

  async function changePhase(phase) {
    if (!month?.id) return;
    await api.patch(`/admin/months/${month.id}/phase`, { phase });
  }

  async function createMonth() {
    await api.post('/admin/months', monthForm);
    setNewMonthForm(false);
  }

  const allUsers = users || [];
  const isBanned = (u) => u.reputation <= -999;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-medieval-gold to-medieval-gold-dark flex items-center justify-center shadow-neon-gold">
          <Settings className="w-6 h-6 text-council-darker" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Panel del Administrador</h1>
          <p className="text-[10px] font-mono text-medieval-gold/40 uppercase tracking-[0.2em]">IMPERIUM ADMINISTRATORIS</p>
        </div>
      </div>

      {/* Gestión de Usuarios — FULL */}
      <GlassCard>
        <h2 className="text-lg font-semibold text-white/80 flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-medieval-gold" />
          Miembros del Consejo ({allUsers.length})
        </h2>

        <div className="space-y-2">
          {allUsers.map((u, i) => {
            const rank = getUserRank(u.recommender_points || 0, u.override_rank);
            const banned = isBanned(u);
            const isEditing = editingUser === u.id;

            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                {/* User row */}
                <div className={`glass-panel p-4 ${banned ? 'border-medieval-crimson/30 bg-medieval-crimson/5' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`relative ${banned ? 'grayscale opacity-50' : ''}`}>
                      <Avatar src={u.avatar_url} name={u.discord_name} size="md" />
                      {banned && <Ban className="absolute -bottom-1 -right-1 w-4 h-4 text-medieval-crimson-light" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${banned ? 'line-through text-white/30' : 'text-white/80'}`}>
                          {u.discord_name}
                        </p>
                        {u.role === 'admin' && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-medieval-gold/20 text-medieval-gold font-bold uppercase">Admin</span>
                        )}
                        {banned && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-medieval-crimson/20 text-medieval-crimson-light font-bold uppercase">Baneado</span>
                        )}
                      </div>
                      <p className="text-[9px] font-mono text-medieval-gold/25 uppercase tracking-wider">{rank.latin}</p>
                    </div>

                    {/* Quick stats */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-center">
                        <p className="font-mono font-bold text-medieval-gold">{u.recommender_points || 0}</p>
                        <p className="text-[8px] text-white/20">PTS</p>
                      </div>
                      <div className="text-center">
                        <p className={`font-mono font-bold ${u.reputation < 0 ? 'text-medieval-crimson-light' : 'text-medieval-forest-light'}`}>{u.reputation || 0}</p>
                        <p className="text-[8px] text-white/20">REP</p>
                      </div>
                      <div className="text-center">
                        <p className="font-mono font-bold text-white/40">{parseFloat(u.objectivity_score || 50).toFixed(0)}</p>
                        <p className="text-[8px] text-white/20">OBJ</p>
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-1">
                      {/* Role toggle */}
                      <button
                        onClick={() => setRole(u.id, u.role === 'admin' ? 'member' : 'admin')}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${u.role === 'admin' ? 'bg-medieval-gold/10 text-medieval-gold' : 'bg-white/5 text-white/30 hover:text-medieval-gold'}`}
                        title={u.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                      >
                        <Crown className="w-3.5 h-3.5" />
                      </button>

                      {/* Ban/Unban */}
                      {banned ? (
                        <button onClick={() => unbanUser(u.id)} className="p-1.5 rounded-lg bg-medieval-forest-light/10 text-medieval-forest-light hover:bg-medieval-forest-light/20 transition-colors" title="Desbanear">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button onClick={() => { setEditingUser(u.id); setBanReason(''); }} className="p-1.5 rounded-lg bg-white/5 text-white/20 hover:text-medieval-crimson-light hover:bg-medieval-crimson/10 transition-colors" title="Banear">
                          <Gavel className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Expand */}
                      <button
                        onClick={() => setEditingUser(isEditing ? null : u.id)}
                        className={`p-1.5 rounded-lg transition-colors ${isEditing ? 'bg-medieval-gold/10 text-medieval-gold' : 'bg-white/5 text-white/20 hover:text-white/50'}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded edit panel */}
                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-white/[0.05] space-y-4"
                    >
                      <div className="grid grid-cols-3 gap-4">
                        {/* Puntos */}
                        <div className="space-y-2">
                          <label className="text-xs text-white/40 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Puntos ({u.recommender_points || 0})
                          </label>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              value={pointsInput}
                              onChange={e => setPointsInput(e.target.value)}
                              placeholder="ej: 10"
                              className="input-field text-xs flex-1"
                            />
                            <button onClick={() => modifyPoints(u.id, pointsInput, reasonInput)} className="px-2 py-1 rounded-lg bg-medieval-forest-light/10 text-medieval-forest-light text-xs hover:bg-medieval-forest-light/20">
                              <TrendingUp className="w-3 h-3" />
                            </button>
                            <button onClick={() => modifyPoints(u.id, -Math.abs(parseInt(pointsInput) || 0), reasonInput)} className="px-2 py-1 rounded-lg bg-medieval-crimson/10 text-medieval-crimson-light text-xs hover:bg-medieval-crimson/20">
                              <TrendingDown className="w-3 h-3" />
                            </button>
                          </div>
                          <button onClick={() => setPoints(u.id, pointsInput)} className="text-[10px] text-white/20 hover:text-white/40">
                            Setear exacto a {pointsInput || '0'}
                          </button>
                        </div>

                        {/* Reputacion */}
                        <div className="space-y-2">
                          <label className="text-xs text-white/40">Reputacion ({u.reputation || 0})</label>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              value={repInput}
                              onChange={e => setRepInput(e.target.value)}
                              placeholder="ej: 5"
                              className="input-field text-xs flex-1"
                            />
                            <button onClick={() => modifyRep(u.id, repInput, reasonInput)} className="px-2 py-1 rounded-lg bg-medieval-forest-light/10 text-medieval-forest-light text-xs">
                              <TrendingUp className="w-3 h-3" />
                            </button>
                            <button onClick={() => modifyRep(u.id, -Math.abs(parseInt(repInput) || 0), reasonInput)} className="px-2 py-1 rounded-lg bg-medieval-crimson/10 text-medieval-crimson-light text-xs">
                              <TrendingDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Rango override */}
                        <div className="space-y-2">
                          <label className="text-xs text-white/40">Rango</label>
                          <select
                            value={u.override_rank || ''}
                            onChange={e => setRank(u.id, e.target.value)}
                            className="input-field text-xs"
                          >
                            <option value="">Auto (por puntos)</option>
                            {COUNCIL_RANKS.map(r => (
                              <option key={r.id} value={r.id}>{r.emoji} {r.title} — {r.latin}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Razon */}
                      <input
                        value={reasonInput}
                        onChange={e => setReasonInput(e.target.value)}
                        placeholder="Razon (opcional, queda en el log)"
                        className="input-field text-xs"
                      />

                      {/* Ban / Delete zone */}
                      <div className="flex items-center justify-between pt-2 border-t border-medieval-crimson/10">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            value={banReason}
                            onChange={e => setBanReason(e.target.value)}
                            placeholder="Razon del ban..."
                            className="input-field text-xs flex-1 max-w-xs"
                          />
                          <button
                            onClick={() => banUser(u.id)}
                            className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1"
                          >
                            <Gavel className="w-3 h-3" /> Banear
                          </button>
                        </div>
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="text-xs text-white/15 hover:text-medieval-crimson-light transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Eliminar cuenta
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {allUsers.length === 0 && (
            <p className="text-white/20 text-sm text-center py-6">Sin miembros todavia</p>
          )}
        </div>
      </GlassCard>

      {/* Control de Fases */}
      <div className="grid grid-cols-2 gap-6">
        <GlassCard>
          <h2 className="text-lg font-semibold text-white/80 flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-medieval-gold" />
            Control de Fases
          </h2>

          {month ? (
            <div className="space-y-4">
              <div className="glass-panel p-4 text-center">
                <p className="text-xs text-white/30 mb-1">Mes actual</p>
                <p className="text-lg font-bold text-white/80">{getMonthName(month.month)} {month.year}</p>
                <p className="text-xs text-medieval-gold/50 mt-1">Fase: {month.phase}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['nomination', 'voting', 'playing', 'review', 'completed'].map(phase => (
                  <button
                    key={phase}
                    onClick={() => changePhase(phase)}
                    className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                      month.phase === phase
                        ? 'bg-medieval-gold/20 text-medieval-gold ring-1 ring-medieval-gold/30'
                        : 'bg-white/[0.03] text-white/40 hover:bg-white/[0.06]'
                    }`}
                  >
                    {phase === 'nomination' ? 'Nominacion' : phase === 'voting' ? 'Votacion' : phase === 'playing' ? 'Jugando' : phase === 'review' ? 'Review' : 'Completado'}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-white/30 text-sm mb-4">No hay mes activo</p>
              <button onClick={() => setNewMonthForm(true)} className="btn-primary text-xs">Crear Mes</button>
            </div>
          )}

          {newMonthForm && (
            <div className="mt-4 space-y-3 p-4 rounded-xl bg-white/[0.02] border border-medieval-gold/10">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/30 block mb-1">Anio</label>
                  <input type="number" value={monthForm.year} onChange={e => setMonthForm(p => ({ ...p, year: +e.target.value }))} className="input-field text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 block mb-1">Mes</label>
                  <input type="number" min="1" max="12" value={monthForm.month} onChange={e => setMonthForm(p => ({ ...p, month: +e.target.value }))} className="input-field text-xs" />
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
                <Save className="w-3 h-3" /> Crear
              </button>
            </div>
          )}
        </GlassCard>

        {/* Hoyo de la Vergüenza control */}
        <GlassCard>
          <h2 className="text-lg font-semibold text-medieval-crimson-light/80 flex items-center gap-2 mb-4">
            <Skull className="w-5 h-5 text-medieval-crimson-light" />
            Hoyo de la Verguenza
          </h2>
          <p className="text-xs text-white/30 mb-4">Usuarios baneados o con reputacion negativa:</p>
          <div className="space-y-2">
            {allUsers.filter(u => isBanned(u) || u.reputation < -10).map(u => (
              <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg bg-medieval-crimson/5 border border-medieval-crimson/15">
                <Avatar src={u.avatar_url} name={u.discord_name} size="sm" />
                <div className="flex-1">
                  <p className="text-sm text-white/50 line-through">{u.discord_name}</p>
                  <p className="text-[9px] text-medieval-crimson-light/50">Rep: {u.reputation}</p>
                </div>
                <button onClick={() => unbanUser(u.id)} className="text-[10px] text-medieval-forest-light/50 hover:text-medieval-forest-light">
                  Restaurar
                </button>
              </div>
            ))}
            {allUsers.filter(u => isBanned(u) || u.reputation < -10).length === 0 && (
              <p className="text-xs text-white/15 text-center py-4">Nadie en el hoyo</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
