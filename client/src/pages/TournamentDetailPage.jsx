import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import Avatar from '../components/ui/Avatar';
import Bracket from '../components/ui/Bracket';
import {
  ArrowLeft, Trophy, Crown, Users, Swords, UserPlus, UserMinus, X,
  Shuffle, Flag, Medal, Clock, Shield, Sparkles
} from 'lucide-react';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchModal, setMatchModal] = useState(null); // match en edición
  const [confettiChamp, setConfettiChamp] = useState(false);

  const load = useCallback(async () => {
    try { setData(await api.get(`/tournaments/${id}`)); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) {
    return <div className="flex items-center justify-center py-20 text-white/30"><Clock className="w-6 h-6 animate-spin" /></div>;
  }

  const participants = data.participants || [];
  const matches = data.matches || [];
  const isEnrolled = participants.some(p => p.user_id === user?.id);
  const champ = data.champion_participant_id ? participants.find(p => p.id === data.champion_participant_id) : null;

  async function join() {
    try { const r = await api.post(`/tournaments/${id}/join`); toast.success(r.message, { title: 'Inscripto' }); load(); }
    catch (e) { toast.error(e.message); }
  }
  async function leave() {
    try { await api.post(`/tournaments/${id}/leave`); toast.warning('Te bajaste del torneo'); load(); }
    catch (e) { toast.error(e.message); }
  }
  async function removeParticipant(pid) {
    try { await api.delete(`/tournaments/${id}/participants/${pid}`); load(); }
    catch (e) { toast.error(e.message); }
  }
  async function generateBracket() {
    try { await api.post(`/tournaments/${id}/generate-bracket`, { shuffle: true }); toast.success('Bracket sorteado!', { title: 'Sors Iacta Est' }); load(); }
    catch (e) { toast.error(e.message); }
  }
  async function reportMatch(winnerPid, p1s, p2s) {
    try {
      await api.patch(`/tournaments/${id}/matches/${matchModal.id}`, { winner_participant_id: winnerPid, p1_score: p1s, p2_score: p2s });
      setMatchModal(null);
      load();
    } catch (e) { toast.error(e.message); }
  }
  async function finish() {
    try {
      const r = await api.post(`/tournaments/${id}/finish`);
      toast.success(`Campeón: ${r.champion?.display_name}`, { title: 'Victoria!' });
      setConfettiChamp(true);
      load();
    } catch (e) { toast.error(e.message); }
  }

  const STATUS = { open: 'Inscripciones abiertas', seeding: 'Armando', live: 'En juego', finished: 'Finalizado' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/torneos')} className="flex items-center gap-2 text-white/40 hover:text-medieval-gold transition-colors mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a Torneos
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-white medieval-display">{data.name}</h1>
            <p className="text-[10px] font-mono text-medieval-gold/30 uppercase tracking-[0.2em] mt-1">
              {data.mode} · Bo{data.best_of} · {STATUS[data.status]}
            </p>
            {data.description && <p className="text-sm text-white/40 mt-2 max-w-xl">{data.description}</p>}
          </div>

          {/* Inscripción */}
          {data.status === 'open' && !isAdmin && (
            isEnrolled ? (
              <button onClick={leave} className="btn-secondary flex items-center gap-2"><UserMinus className="w-4 h-4" /> Bajarme</button>
            ) : (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={join} className="btn-primary flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Anotarme con Discord
              </motion.button>
            )
          )}
          {data.status === 'open' && isAdmin && (
            isEnrolled
              ? <button onClick={leave} className="btn-secondary flex items-center gap-2 text-sm"><UserMinus className="w-4 h-4" /> Bajarme</button>
              : <button onClick={join} className="btn-secondary flex items-center gap-2 text-sm"><UserPlus className="w-4 h-4" /> Anotarme</button>
          )}
        </div>
      </div>

      {/* Campeón (finalizado) */}
      {champ && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <GlassCard className="border-medieval-gold/40 shadow-neon-gold relative overflow-hidden">
            <div className="absolute inset-0 shimmer-badge opacity-30" />
            <div className="relative flex items-center gap-4">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
                <Crown className="w-12 h-12 text-medieval-gold" style={{ filter: 'drop-shadow(0 0 12px rgba(212,168,71,0.6))' }} />
              </motion.div>
              <Avatar src={champ.avatar_url} name={champ.display_name} size="lg" ring />
              <div>
                <p className="text-[10px] font-mono text-medieval-gold/60 uppercase tracking-[0.25em]">Campeón · Victor Ludorum</p>
                <h2 className="text-2xl font-black neon-text">{champ.display_name}</h2>
                {data.prize_1 && <p className="text-sm text-white/50 mt-1">Premio: <span className="text-medieval-gold">{data.prize_1}</span></p>}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Premios */}
      {(data.prize_1 || data.prize_2 || data.prize_3) && (
        <div className="grid grid-cols-3 gap-3">
          {[{ p: data.prize_1, e: '🏆', l: 'Campeón', c: 'border-medieval-gold/30 text-medieval-gold' },
            { p: data.prize_2, e: '🥈', l: 'Finalista', c: 'border-white/15 text-white/60' },
            { p: data.prize_3, e: '🥉', l: 'Tercero', c: 'border-amber-700/30 text-amber-600/80' }].map((pr, i) => pr.p && (
            <div key={i} className={`glass-panel p-4 border ${pr.c} text-center`}>
              <div className="text-2xl mb-1">{pr.e}</div>
              <p className="text-[9px] uppercase tracking-wider text-white/30">{pr.l}</p>
              <p className="text-sm font-semibold mt-0.5">{pr.p}</p>
            </div>
          ))}
        </div>
      )}

      {/* Controles admin */}
      {isAdmin && data.status !== 'finished' && (
        <GlassCard className="border-medieval-royal-light/20">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-medieval-royal-light/70 font-mono uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" /> Panel del organizador
            </span>
            <div className="flex items-center gap-2">
              <button onClick={generateBracket} disabled={participants.length < 2}
                className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-40">
                <Shuffle className="w-4 h-4" /> {matches.length ? 'Re-sortear bracket' : 'Sortear bracket'}
              </button>
              {matches.length > 0 && (
                <button onClick={finish} className="btn-primary flex items-center gap-2 text-sm">
                  <Flag className="w-4 h-4" /> Finalizar
                </button>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Bracket */}
      <GlassCard>
        <h3 className="font-semibold text-white/80 flex items-center gap-2 mb-4 medieval-text">
          <Swords className="w-5 h-5 text-medieval-gold" /> Bracket
          <span className="text-[9px] font-mono text-medieval-gold/25 uppercase tracking-[0.15em]">ARBOR CERTAMINIS</span>
        </h3>
        <Bracket matches={matches} participants={participants} isAdmin={isAdmin && data.status === 'live'} onMatchClick={setMatchModal} />
      </GlassCard>

      {/* Participantes */}
      <GlassCard>
        <h3 className="font-semibold text-white/80 flex items-center gap-2 mb-4 medieval-text">
          <Users className="w-5 h-5 text-medieval-gold" /> Combatientes ({participants.length})
          <span className="text-[9px] font-mono text-medieval-gold/25 uppercase tracking-[0.15em]">PUGILES</span>
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {participants.map(p => (
            <div key={p.id} className={`flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] ${p.eliminated ? 'opacity-40' : ''}`}>
              {p.seed && <span className="text-[10px] font-mono text-medieval-gold/40 w-5 text-center">#{p.seed}</span>}
              {p.country_code && <img src={`https://flagcdn.com/w20/${p.country_code}.png`} alt="" className="h-3 rounded-sm" />}
              <Avatar src={p.avatar_url} name={p.display_name} size="sm" />
              <span className={`text-sm flex-1 truncate ${p.eliminated ? 'line-through text-white/40' : 'text-white/70'}`}>{p.display_name}</span>
              {isAdmin && data.status === 'open' && (
                <button onClick={() => removeParticipant(p.id)} className="text-white/15 hover:text-medieval-crimson-light"><X className="w-3 h-3" /></button>
              )}
            </div>
          ))}
          {participants.length === 0 && <p className="col-span-3 text-center text-white/20 text-sm py-4">Nadie inscripto todavía</p>}
        </div>
      </GlassCard>

      {/* Modal reportar match */}
      <AnimatePresence>
        {matchModal && (
          <MatchModal match={matchModal} participants={participants} bestOf={data.best_of}
            onClose={() => setMatchModal(null)} onReport={reportMatch} />
        )}
      </AnimatePresence>
    </div>
  );
}

function MatchModal({ match, participants, bestOf, onClose, onReport }) {
  const pById = Object.fromEntries(participants.map(p => [p.id, p]));
  const p1 = pById[match.p1_participant_id];
  const p2 = pById[match.p2_participant_id];
  const [s1, setS1] = useState(match.p1_score || 0);
  const [s2, setS2] = useState(match.p2_score || 0);
  const toWin = Math.ceil(bestOf / 2);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} className="fixed inset-0 z-[120] flex items-center justify-center bg-council-darker/85 backdrop-blur-md p-6">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()}
        className="glass-card p-6 max-w-md w-full">
        <h3 className="font-bold text-white/90 text-center mb-1 medieval-text">Reportar resultado</h3>
        <p className="text-[10px] font-mono text-medieval-gold/30 uppercase tracking-wider text-center mb-5">Bo{bestOf} · primero a {toWin}</p>

        {[{ p: p1, s: s1, setS: setS1, other: s2 }, { p: p2, s: s2, setS: setS2, other: s1 }].map((row, i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <Avatar src={row.p?.avatar_url} name={row.p?.display_name} size="md" />
            <span className="flex-1 font-medium text-white/80">{row.p?.display_name || '—'}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => row.setS(Math.max(0, row.s - 1))} className="w-7 h-7 rounded-lg bg-white/5 text-white/40 hover:text-white">−</button>
              <span className="font-mono font-bold text-xl text-medieval-gold w-6 text-center">{row.s}</span>
              <button onClick={() => row.setS(row.s + 1)} className="w-7 h-7 rounded-lg bg-white/5 text-white/40 hover:text-white">+</button>
            </div>
          </div>
        ))}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancelar</button>
          <button
            onClick={() => onReport(s1 > s2 ? match.p1_participant_id : match.p2_participant_id, s1, s2)}
            disabled={s1 === s2}
            className="btn-primary flex-1 text-sm disabled:opacity-40 flex items-center justify-center gap-2">
            <Trophy className="w-4 h-4" /> Confirmar ganador
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
