import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import GlassCard from '../components/ui/GlassCard';
import Avatar from '../components/ui/Avatar';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import {
  Swords, Trophy, Eye, EyeOff, Save, RefreshCw, Plus, Trash2, X,
  Users, Shield, ExternalLink, Tv, Crown, ChevronUp, ChevronDown, Copy
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

function PlayerCard({ slot, label, color, state, roster, legends, onChange }) {
  const player = state.players[slot] || {};
  const isP1 = slot.startsWith('p1');
  const accentClass = isP1 ? 'border-l-medieval-royal-light/40' : 'border-l-medieval-crimson/40';

  function update(field, value) {
    onChange({ players: { [slot]: { [field]: value } } });
  }

  function loadFromRoster(brawlhallaId) {
    if (!brawlhallaId) return;
    const r = roster?.players?.find(p => String(p.brawlhalla_id) === String(brawlhallaId));
    if (!r) return;
    onChange({
      players: {
        [slot]: {
          brawlhalla_id: r.brawlhalla_id,
          display_name: r.name,
          country_code: r.country_code || 'ar',
          country: r.country_code?.toUpperCase() || '',
        },
      },
    });
  }

  function changeScore(delta) {
    update('score', Math.max(0, (player.score || 0) + delta));
  }

  return (
    <GlassCard className={`border-l-4 ${accentClass}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isP1 ? 'bg-medieval-royal-light' : 'bg-medieval-crimson-light'}`} />
          <h3 className="font-bold text-white/80 medieval-text">{label}</h3>
          <span className="text-[9px] font-mono text-medieval-gold/30 uppercase tracking-wider">{slot.toUpperCase()}</span>
        </div>

        {/* Score controls — only for main slots */}
        {(slot === 'p1' || slot === 'p2') && (
          <div className="flex items-center gap-2">
            <button onClick={() => changeScore(-1)} className="p-1.5 rounded-lg bg-white/[0.03] text-white/30 hover:text-medieval-crimson-light hover:bg-medieval-crimson/10 transition-colors">
              <ChevronDown className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold text-2xl text-medieval-gold w-8 text-center">{player.score || 0}</span>
            <button onClick={() => changeScore(1)} className="p-1.5 rounded-lg bg-white/[0.03] text-white/30 hover:text-medieval-forest-light hover:bg-medieval-forest-light/10 transition-colors">
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Roster picker */}
      <div className="mb-3">
        <label className="text-[10px] text-medieval-gold/30 uppercase tracking-wider mb-1 block font-mono">Cargar desde Registro</label>
        <select onChange={e => loadFromRoster(e.target.value)} className="input-field text-xs" value="">
          <option value="">— elegir guardado —</option>
          {roster?.players?.map(p => (
            <option key={p.brawlhalla_id} value={p.brawlhalla_id}>
              {p.name} · {p.brawlhalla_id}{p.discord_name ? ` · ${p.discord_name}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">Nombre</label>
          <input value={player.display_name || ''} onChange={e => update('display_name', e.target.value)}
            placeholder="Player name" className="input-field text-sm" />
        </div>
        <div>
          <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">Brawlhalla ID</label>
          <input type="number" value={player.brawlhalla_id || ''} onChange={e => update('brawlhalla_id', Number(e.target.value))}
            placeholder="89467590" className="input-field text-sm font-mono" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">País (código)</label>
          <input value={player.country_code || ''} onChange={e => { update('country_code', e.target.value.toLowerCase()); update('country', e.target.value.toUpperCase()); }}
            placeholder="ar" maxLength={2} className="input-field text-sm uppercase" />
        </div>
        <div>
          <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">Leyenda</label>
          <input value={player.legend || ''} onChange={e => update('legend', e.target.value)}
            list={`legends-${slot}`} placeholder="ej: Bödvar" className="input-field text-sm" />
          <datalist id={`legends-${slot}`}>
            {legends?.map(l => <option key={l.legend_id} value={l.bio_name || l.legend_name} />)}
          </datalist>
        </div>
      </div>

      {/* Preview row */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-medieval-gold/[0.06] text-xs text-white/40">
        {player.country_code && (
          <img src={`https://flagcdn.com/w20/${player.country_code}.png`} alt="" className="h-3 rounded-sm" />
        )}
        <span className="font-mono">{player.display_name || '—'}</span>
        {player.legend && <span className="text-medieval-gold/40">· {player.legend}</span>}
      </div>
    </GlassCard>
  );
}

function RosterManager({ roster, onUpdate, toast }) {
  const [name, setName] = useState('');
  const [bhId, setBhId] = useState('');
  const [flag, setFlag] = useState('ar');
  const [submitting, setSubmitting] = useState(false);

  async function addRoster() {
    if (!name || !bhId) return;
    setSubmitting(true);
    try {
      await fetch(`${API_URL}/api/brawlhalla/roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('council_token')}` },
        body: JSON.stringify({ name, brawlhalla_id: Number(bhId), country_code: flag }),
      });
      setName(''); setBhId(''); setFlag('ar');
      onUpdate();
      toast?.success('Combatiente inscripto', { title: 'Pugil' });
    } catch (e) { toast?.error(e.message); }
    finally { setSubmitting(false); }
  }

  async function removeRoster(brawlhallaId) {
    await fetch(`${API_URL}/api/brawlhalla/roster/${brawlhallaId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('council_token')}` },
    });
    onUpdate();
  }

  return (
    <GlassCard>
      <h3 className="font-semibold text-white/80 flex items-center gap-2 mb-1 medieval-text">
        <Users className="w-4 h-4 text-medieval-gold" />
        Registro de Combatientes
      </h3>
      <p className="text-[9px] font-mono text-medieval-gold/25 uppercase tracking-[0.2em] mb-4">REGISTRUM PUGILUM</p>

      {/* Add form */}
      <div className="grid grid-cols-12 gap-2 mb-4">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre"
          className="input-field text-sm col-span-4" />
        <input type="number" value={bhId} onChange={e => setBhId(e.target.value)} placeholder="Brawlhalla ID"
          className="input-field text-sm col-span-4 font-mono" />
        <input value={flag} onChange={e => setFlag(e.target.value.toLowerCase())} placeholder="ar" maxLength={2}
          className="input-field text-sm col-span-2 uppercase" />
        <button onClick={addRoster} disabled={!name || !bhId || submitting}
          className="btn-primary col-span-2 text-sm disabled:opacity-40 flex items-center justify-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* List */}
      <div className="space-y-1.5">
        {(roster?.players || []).map(p => (
          <motion.div key={p.brawlhalla_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            {p.country_code && <img src={`https://flagcdn.com/w20/${p.country_code}.png`} alt="" className="h-3 rounded-sm" />}
            <span className="text-sm font-medium text-white/80 flex-1">{p.name}</span>
            {p.discord_name && (
              <span className="text-[9px] text-medieval-royal-light/50 flex items-center gap-1">
                <Avatar src={p.avatar_url} name={p.discord_name} size="sm" /> {p.discord_name}
              </span>
            )}
            <span className="text-[10px] text-white/25 font-mono">ID {p.brawlhalla_id}</span>
            <button onClick={() => removeRoster(p.brawlhalla_id)}
              className="p-1.5 rounded-lg text-white/15 hover:text-medieval-crimson-light hover:bg-medieval-crimson/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
        {(!roster?.players || roster.players.length === 0) && (
          <p className="text-xs text-white/15 text-center py-4">Sin combatientes registrados</p>
        )}
      </div>
    </GlassCard>
  );
}

export default function BrawlhallaControlPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState(null);
  const [roster, setRoster] = useState(null);
  const [legends, setLegends] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedNow, setSavedNow] = useState(false);
  const [esConnected, setEsConnected] = useState(false);

  // Load initial data
  useEffect(() => {
    loadState();
    loadRoster();
    loadLegends();

    // Subscribe to SSE for real-time sync
    const es = new EventSource(`${API_URL}/api/brawlhalla/events`);
    es.onmessage = (ev) => {
      try {
        const newState = JSON.parse(ev.data);
        setState(newState);
      } catch {}
    };
    es.onopen = () => setEsConnected(true);
    es.onerror = () => setEsConnected(false);
    return () => es.close();
  }, []);

  async function loadState() {
    try {
      const r = await fetch(`${API_URL}/api/brawlhalla/state`);
      const s = await r.json();
      setState(s);
    } catch {}
  }

  async function loadRoster() {
    try {
      const r = await fetch(`${API_URL}/api/brawlhalla/roster`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('council_token')}` },
      });
      const data = await r.json();
      setRoster(data);
    } catch {}
  }

  async function loadLegends() {
    try {
      const r = await fetch(`${API_URL}/api/brawlhalla/legends`);
      const data = await r.json();
      setLegends(data);
    } catch {}
  }

  // Optimistic update — apply locally first, then debounce server save
  const pendingUpdate = useRef({});
  const saveTimer = useRef(null);

  const updateState = useCallback((partial) => {
    // Optimistic update for instant UI feedback
    setState(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      if (partial.tournament) next.tournament = { ...prev.tournament, ...partial.tournament };
      if (partial.mode) next.mode = partial.mode;
      if (typeof partial.match_visible === 'boolean') next.match_visible = partial.match_visible;
      if (typeof partial.stats_visible === 'boolean') next.stats_visible = partial.stats_visible;
      if (typeof partial.postgame_visible === 'boolean') next.postgame_visible = partial.postgame_visible;
      if (partial.players) {
        next.players = { ...prev.players };
        for (const slot of ['p1', 'p1b', 'p2', 'p2b']) {
          if (partial.players[slot]) {
            next.players[slot] = { ...prev.players[slot], ...partial.players[slot] };
          }
        }
      }
      return next;
    });

    // Merge partial into pending
    pendingUpdate.current = mergePartial(pendingUpdate.current, partial);

    // Debounce server save
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const toSend = pendingUpdate.current;
      pendingUpdate.current = {};
      setSaving(true);
      try {
        await fetch(`${API_URL}/api/brawlhalla/state`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('council_token')}` },
          body: JSON.stringify(toSend),
        });
        setSavedNow(true);
        setTimeout(() => setSavedNow(false), 1500);
      } catch (e) { console.error(e); }
      finally { setSaving(false); }
    }, 300);
  }, []);

  function mergePartial(a, b) {
    const out = { ...a };
    if (b.tournament) out.tournament = { ...(a.tournament || {}), ...b.tournament };
    if (b.mode) out.mode = b.mode;
    if (typeof b.match_visible === 'boolean') out.match_visible = b.match_visible;
    if (typeof b.stats_visible === 'boolean') out.stats_visible = b.stats_visible;
    if (typeof b.postgame_visible === 'boolean') out.postgame_visible = b.postgame_visible;
    if (b.players) {
      out.players = { ...(a.players || {}) };
      for (const slot of ['p1', 'p1b', 'p2', 'p2b']) {
        if (b.players[slot]) out.players[slot] = { ...(a.players?.[slot] || {}), ...b.players[slot] };
      }
    }
    return out;
  }

  async function resetState() {
    if (!confirm('Reset al estado por defecto?')) return;
    await fetch(`${API_URL}/api/brawlhalla/state/reset`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('council_token')}` },
    });
    loadState();
  }

  if (!state || !state.tournament || !state.players) {
    return <div className="flex items-center justify-center py-20 text-white/30"><RefreshCw className="w-6 h-6 animate-spin" /></div>;
  }

  // Ensure all player slots exist (defensive)
  state.players.p1 = state.players.p1 || { score: 0, display_name: '', brawlhalla_id: 0, country_code: 'ar', country: 'ARG', legend: '' };
  state.players.p1b = state.players.p1b || { score: 0, display_name: '', brawlhalla_id: 0, country_code: '', country: '', legend: '' };
  state.players.p2 = state.players.p2 || { score: 0, display_name: '', brawlhalla_id: 0, country_code: 'ar', country: 'ARG', legend: '' };
  state.players.p2b = state.players.p2b || { score: 0, display_name: '', brawlhalla_id: 0, country_code: '', country: '', legend: '' };

  const overlayUrl = `${window.location.origin}/overlay/brawlhalla/`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Swords className="w-6 h-6 text-medieval-gold" />
            Torneos de Brawlhalla
          </h1>
          <p className="text-[10px] font-mono text-medieval-gold/30 uppercase tracking-[0.2em] mt-1">CERTAMINUM REGIMEN — PUGNATORUM ARENA</p>
        </div>
        <div className="flex items-center gap-2">
          {savedNow && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-[10px] text-medieval-forest-light font-mono uppercase tracking-wider">Guardado</motion.span>
          )}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider ${esConnected ? 'bg-medieval-forest-light/10 text-medieval-forest-light' : 'bg-medieval-crimson/10 text-medieval-crimson-light'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${esConnected ? 'bg-medieval-forest-light animate-pulse' : 'bg-medieval-crimson-light'}`} />
            {esConnected ? 'Sincronizado' : 'Desconectado'}
          </div>
        </div>
      </div>

      {/* Overlay URLs banner */}
      <GlassCard className="border-medieval-gold/20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-medieval-gold/10 flex items-center justify-center">
            <Tv className="w-5 h-5 text-medieval-gold" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-medieval-gold/50 uppercase tracking-wider font-mono mb-1">URL para OBS Browser Source</p>
            <div className="flex items-center gap-2">
              <code className="text-xs text-white/80 font-mono bg-white/[0.03] px-2 py-1 rounded">{overlayUrl}</code>
              <button onClick={() => navigator.clipboard.writeText(overlayUrl)}
                className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-medieval-gold transition-colors" title="Copiar">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <a href={overlayUrl} target="_blank" rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-medieval-gold transition-colors" title="Abrir">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Tournament info */}
      <GlassCard>
        <h3 className="font-semibold text-white/80 flex items-center gap-2 mb-1 medieval-text">
          <Trophy className="w-4 h-4 text-medieval-gold" />
          Torneo
        </h3>
        <p className="text-[9px] font-mono text-medieval-gold/25 uppercase tracking-[0.2em] mb-4">CERTAMEN</p>

        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">Nombre</label>
            <input value={state.tournament.name} onChange={e => updateState({ tournament: { name: e.target.value } })}
              className="input-field text-sm" />
          </div>
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">Ronda</label>
            <input value={state.tournament.round} onChange={e => updateState({ tournament: { round: e.target.value } })}
              className="input-field text-sm" />
          </div>
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">Best of</label>
            <select value={state.tournament.best_of} onChange={e => updateState({ tournament: { best_of: Number(e.target.value) } })}
              className="input-field text-sm">
              {[1, 3, 5, 7, 9].map(n => <option key={n} value={n}>Bo{n}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Modo</span>
          <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03]">
            {['1v1', '2v2'].map(m => (
              <button key={m} onClick={() => updateState({ mode: m })}
                className={`px-4 py-1 rounded text-xs font-medium transition-all ${
                  state.mode === m ? 'bg-medieval-gold/15 text-medieval-gold' : 'text-white/30 hover:text-white/50'
                }`}>{m}</button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Visibility toggles */}
          <button onClick={() => updateState({ match_visible: !state.match_visible })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
              state.match_visible ? 'bg-medieval-forest-light/10 text-medieval-forest-light' : 'bg-white/5 text-white/30'
            }`}>
            {state.match_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Overlay {state.match_visible ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => updateState({ postgame_visible: !state.postgame_visible })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
              state.postgame_visible ? 'bg-medieval-crimson/10 text-medieval-crimson-light' : 'bg-white/5 text-white/30'
            }`}>
            {state.postgame_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Stats {state.postgame_visible ? 'ON' : 'OFF'}
          </button>
          <button onClick={resetState}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/[0.03] text-white/30 hover:text-medieval-crimson-light hover:bg-medieval-crimson/10 transition-all">
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </GlassCard>

      {/* Player cards */}
      <div className="grid grid-cols-2 gap-4">
        <PlayerCard slot="p1" label="Jugador 1" state={state} roster={roster} legends={legends} onChange={updateState} />
        <PlayerCard slot="p2" label="Jugador 2" state={state} roster={roster} legends={legends} onChange={updateState} />
        {state.mode === '2v2' && (
          <>
            <PlayerCard slot="p1b" label="Compañero P1" state={state} roster={roster} legends={legends} onChange={updateState} />
            <PlayerCard slot="p2b" label="Compañero P2" state={state} roster={roster} legends={legends} onChange={updateState} />
          </>
        )}
      </div>

      {/* Roster */}
      <RosterManager roster={roster} onUpdate={loadRoster} toast={toast} />

      {/* Latin footer */}
      <div className="text-center py-4">
        <div className="ornament-divider"><Swords className="w-4 h-4 text-medieval-gold/20" /></div>
        <p className="text-[9px] text-white/[0.06] font-mono uppercase tracking-[0.2em]">"Audaces fortuna iuvat"</p>
        <p className="text-[8px] text-white/[0.04] mt-0.5">A los valientes les sonríe la fortuna</p>
      </div>
    </div>
  );
}
