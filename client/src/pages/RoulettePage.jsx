import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import Avatar from '../components/ui/Avatar';
import { Dices, Plus, X, RotateCw, Search, Coins, TrendingUp, Sparkles } from 'lucide-react';
import { api } from '../services/api';

const SEG_COLORS = ['#d4a847','#8b1a1a','#4c1d95','#1a4d2e','#c42b2b','#7c3aed','#2d8a4e','#b08d57','#8b6f2e','#6d28d9','#0891b2','#a16207'];

export default function RoulettePage() {
  const { toast } = useToast();
  const { user, checkAuth } = useAuth();
  const [data, setData] = useState({ games: [], points_per_weight: 5 });
  const [input, setInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [betFor, setBetFor] = useState(null); // game id en modo apuesta
  const [betAmount, setBetAmount] = useState(10);
  const [myPoints, setMyPoints] = useState(user?.recommender_points || 0);

  const games = data.games || [];

  const load = useCallback(async () => {
    try { setData(await api.get('/roulette')); } catch (e) { /* */ }
    try { const me = await api.get('/auth/me'); setMyPoints(me.user?.recommender_points || 0); } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);

  async function searchSteam() {
    if (input.length < 2) return;
    setSearching(true);
    try { setSearchResults((await api.get(`/games/search?q=${encodeURIComponent(input)}`)).slice(0, 5)); }
    catch { setSearchResults([]); }
    finally { setSearching(false); }
  }
  async function addGame(name, cover, steamId) {
    try {
      await api.post('/roulette/games', { name: name.trim(), cover_url: cover || null, steam_app_id: steamId || null });
      setInput(''); setSearchResults([]); load();
      toast.success('Juego sumado a la ruleta');
    } catch (e) { toast.error(e.message); }
  }
  async function removeGame(id) {
    try { await api.delete(`/roulette/games/${id}`); load(); } catch (e) { toast.error(e.message); }
  }
  async function placeBet(gameId) {
    try {
      const r = await api.post(`/roulette/games/${gameId}/bet`, { points: betAmount });
      toast.success(r.message, { title: 'Apuesta hecha' });
      setBetFor(null); load();
    } catch (e) { toast.error(e.message); }
  }

  async function spin() {
    if (games.length < 2 || spinning) return;
    setSpinning(true); setShowWinner(false); setWinner(null);
    try {
      const res = await api.post('/roulette/spin');
      // Encontrar el segmento del ganador por id (robusto ante reordenamientos)
      const winIdx = games.findIndex(g => g.id === res.winner.id);
      const idx = winIdx >= 0 ? winIdx : res.winner_index;

      // Ángulo del centro del segmento ganador (segmentos proporcionales al peso)
      const total = games.reduce((s, g) => s + g.weight, 0);
      let acc = 0;
      for (let i = 0; i < idx; i++) acc += (games[i].weight / total) * 360;
      const segAngle = (games[idx].weight / total) * 360;
      const targetCenter = acc + segAngle / 2;

      const spins = 6 + Math.floor(Math.random() * 3);
      setRotation(prev => prev + spins * 360 + (360 - (targetCenter % 360)) - (prev % 360));

      setTimeout(() => {
        setWinner(res.winner);
        setSpinning(false);
        setShowWinner(true);
        fireConfetti();
      }, 4800);
    } catch (e) { toast.error(e.message); setSpinning(false); }
  }

  function fireConfetti() {
    const GOLD = ['#d4a847','#f0d078','#8b6f2e','#c42b2b','#f5e6c8'];
    confetti({ particleCount: 130, spread: 100, startVelocity: 45, origin: { y: 0.4 }, colors: GOLD, scalar: 1.2 });
    setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 70, origin: { x: 0 }, colors: GOLD }), 200);
    setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 70, origin: { x: 1 }, colors: GOLD }), 200);
  }

  // Geometría de la rueda con segmentos proporcionales al peso
  const size = 400, cx = size/2, cy = size/2, r = size/2 - 4;
  const totalWeight = games.reduce((s, g) => s + g.weight, 0) || 1;
  let angleAcc = 0;
  const segs = games.map((g, i) => {
    const start = angleAcc;
    const sweep = (g.weight / totalWeight) * 360;
    angleAcc += sweep;
    const a0 = (start - 90) * Math.PI / 180;
    const a1 = (start + sweep - 90) * Math.PI / 180;
    const mid = (start + sweep / 2 - 90) * Math.PI / 180;
    const x0 = cx + r*Math.cos(a0), y0 = cy + r*Math.sin(a0);
    const x1 = cx + r*Math.cos(a1), y1 = cy + r*Math.sin(a1);
    const large = sweep > 180 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
    const cImg = { x: cx + r*0.55*Math.cos(mid), y: cy + r*0.55*Math.sin(mid) };
    const cLbl = { x: cx + r*0.78*Math.cos(mid), y: cy + r*0.78*Math.sin(mid), deg: start + sweep/2 };
    return { g, i, path, color: SEG_COLORS[i % SEG_COLORS.length], cImg, cLbl, sweep };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Dices className="w-6 h-6 text-medieval-gold" /> Ruleta del Destino
          </h1>
          <p className="text-[10px] font-mono text-medieval-gold/30 uppercase tracking-[0.2em] mt-1">ROTA FORTUNAE · QUÉ JUGAMOS HOY</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-medieval-gold/10 border border-medieval-gold/20">
          <Coins className="w-4 h-4 text-medieval-gold" />
          <span className="font-mono font-bold text-medieval-gold">{myPoints}</span>
          <span className="text-[10px] text-white/40">tus puntos</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Rueda */}
        <div className="col-span-3">
          <GlassCard className="flex flex-col items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-medieval-gold/[0.03] rounded-full blur-[100px]" />
            {games.length < 2 ? (
              <div className="py-24 text-center text-white/30">
                <Dices className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Agregá al menos 2 juegos para girar</p>
                <p className="text-[10px] font-mono text-medieval-gold/20 mt-1 uppercase tracking-wider">FORTUNA AUDACES IUVAT</p>
              </div>
            ) : (
              <div className="relative" style={{ width: size, height: size + 30 }}>
                <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ top: -2 }}>
                  <div style={{ width:0, height:0, borderLeft:'16px solid transparent', borderRight:'16px solid transparent', borderTop:'26px solid #d4a847', filter:'drop-shadow(0 2px 6px rgba(212,168,71,0.5))' }} />
                </div>
                <motion.svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
                  animate={{ rotate: rotation }} transition={{ duration: 4.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{ marginTop: 24, filter: 'drop-shadow(0 0 24px rgba(212,168,71,0.15))' }}>
                  <defs>
                    {segs.map(s => (
                      <clipPath key={s.i} id={`clip-${s.i}`}><path d={s.path} /></clipPath>
                    ))}
                  </defs>
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="#d4a847" strokeWidth="4" opacity="0.6" />
                  {segs.map(s => (
                    <g key={s.i}>
                      {/* Fondo color */}
                      <path d={s.path} fill={s.color} opacity="0.9" stroke="#06050a" strokeWidth="2" />
                      {/* Cover del juego clipeada al gajo */}
                      {s.g.cover_url && (
                        <image href={s.g.cover_url} x={s.cImg.x - r*0.55} y={s.cImg.y - r*0.4}
                          width={r*1.1} height={r*0.8} preserveAspectRatio="xMidYMid slice"
                          clipPath={`url(#clip-${s.i})`} opacity="0.85" />
                      )}
                      <path d={s.path} fill={s.color} opacity={s.g.cover_url ? 0.28 : 0} stroke="#06050a" strokeWidth="2" />
                      {/* Nombre */}
                      <text x={s.cLbl.x} y={s.cLbl.y} fill="#fff" fontSize={s.sweep < 25 ? 9 : 12} fontWeight="700"
                        textAnchor="middle" dominantBaseline="middle"
                        transform={`rotate(${s.cLbl.deg}, ${s.cLbl.x}, ${s.cLbl.y})`}
                        style={{ pointerEvents:'none', textShadow:'0 1px 4px rgba(0,0,0,0.95)' }}>
                        {s.g.name.length > 14 ? s.g.name.slice(0,13)+'…' : s.g.name}
                      </text>
                    </g>
                  ))}
                  <circle cx={cx} cy={cy} r="26" fill="#06050a" stroke="#d4a847" strokeWidth="3" />
                  <circle cx={cx} cy={cy} r="8" fill="#d4a847" />
                </motion.svg>
              </div>
            )}
            {games.length >= 2 && (
              <motion.button onClick={spin} disabled={spinning}
                whileHover={!spinning ? { scale: 1.05 } : {}} whileTap={!spinning ? { scale: 0.96 } : {}}
                className="btn-primary flex items-center gap-2 mt-6 text-base px-8 py-3 disabled:opacity-50">
                <RotateCw className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} />
                {spinning ? 'Girando...' : 'GIRAR'}
              </motion.button>
            )}
          </GlassCard>
        </div>

        {/* Lista + apuestas */}
        <div className="col-span-2 space-y-4">
          <GlassCard>
            <h3 className="font-semibold text-white/80 flex items-center gap-2 mb-3 medieval-text">
              <Sparkles className="w-4 h-4 text-medieval-gold" /> Juegos
            </h3>
            <div className="flex gap-2 mb-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && searchSteam()}
                placeholder="Buscar juego en Steam..." className="input-field flex-1 text-sm" />
              <button onClick={searchSteam} disabled={searching || input.length<2} className="btn-secondary disabled:opacity-30"><Search className="w-4 h-4" /></button>
              <button onClick={() => addGame(input)} disabled={!input.trim()} className="btn-primary disabled:opacity-30"><Plus className="w-4 h-4" /></button>
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-1 mb-3 max-h-40 overflow-y-auto">
                {searchResults.map((g, i) => (
                  <button key={i} onClick={() => addGame(g.name, g.cover_url, g.steam_app_id)}
                    className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-medieval-gold/5 text-left">
                    {g.cover_url && <img src={g.cover_url} alt="" className="w-16 h-7 rounded object-cover" />}
                    <span className="text-xs text-white/70 flex-1 truncate">{g.name}</span>
                    <Plus className="w-3 h-3 text-medieval-gold/50" />
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {segs.map(s => (
                <div key={s.g.id} className="rounded-lg bg-white/[0.02] overflow-hidden">
                  <div className="flex items-center gap-2 p-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    {s.g.cover_url && <img src={s.g.cover_url} alt="" className="w-12 h-6 rounded object-cover" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/75 truncate">{s.g.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-medieval-gold">{s.g.chance}%</span>
                        {s.g.total_bet > 0 && <span className="text-[9px] text-white/30">{s.g.total_bet} pts apostados</span>}
                      </div>
                    </div>
                    <button onClick={() => { setBetFor(betFor === s.g.id ? null : s.g.id); setBetAmount(10); }}
                      className="px-2 py-1 rounded-lg bg-medieval-gold/10 text-medieval-gold text-[10px] font-semibold hover:bg-medieval-gold/20 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Apostar
                    </button>
                    <button onClick={() => removeGame(s.g.id)} className="text-white/15 hover:text-medieval-crimson-light"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  {/* Panel de apuesta */}
                  <AnimatePresence>
                    {betFor === s.g.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="px-2 pb-2 overflow-hidden">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-medieval-gold/5">
                          <input type="range" min="1" max={Math.max(1, myPoints)} value={betAmount}
                            onChange={e => setBetAmount(Number(e.target.value))} className="flex-1 accent-medieval-gold" />
                          <span className="font-mono text-sm text-medieval-gold w-10 text-center">{betAmount}</span>
                          <button onClick={() => placeBet(s.g.id)} disabled={myPoints < 1}
                            className="btn-primary text-[10px] py-1 px-2 disabled:opacity-30">Apostar</button>
                        </div>
                        <p className="text-[9px] text-white/30 mt-1 px-1">Cada {data.points_per_weight} pts = más chance. Los puntos se gastan.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              {games.length === 0 && <p className="text-xs text-white/20 text-center py-4">Vacía. Buscá juegos arriba.</p>}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Modal ganador */}
      <AnimatePresence>
        {showWinner && winner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowWinner(false)}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-council-darker/85 backdrop-blur-md">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-medieval-gold/10 rounded-full blur-[120px]" />
            <motion.div initial={{ scale: 0.6, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 140, damping: 16 }} onClick={e => e.stopPropagation()}
              className="relative max-w-sm w-full mx-6 rounded-2xl overflow-hidden border-2 border-medieval-gold/40 shadow-neon-gold animate-fire-glow">
              {winner.cover_url && (
                <div className="absolute inset-0">
                  <img src={winner.cover_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-council-darker via-council-darker/85 to-council-darker/40" />
                </div>
              )}
              <div className="absolute inset-0 shimmer-badge opacity-50 pointer-events-none" />
              <motion.div animate={{ y: [0,-8,0] }} transition={{ duration: 2.5, repeat: Infinity }} className="absolute -top-7 left-1/2 -translate-x-1/2 z-10">
                <Dices className="w-12 h-12 text-medieval-gold" style={{ filter: 'drop-shadow(0 0 14px rgba(212,168,71,0.6))' }} />
              </motion.div>
              <div className="relative p-8 pt-12 text-center">
                <p className="text-[10px] font-mono text-medieval-gold/60 uppercase tracking-[0.3em] mb-3">La Fortuna decidió</p>
                {winner.cover_url && <img src={winner.cover_url} alt="" className="w-full h-32 object-cover rounded-xl mb-4 ring-1 ring-medieval-gold/30" />}
                <h2 className="text-3xl font-black neon-text font-display leading-tight">{winner.name}</h2>
                <p className="text-[10px] font-mono text-medieval-gold/30 uppercase tracking-[0.25em] mt-5">"ALEA IACTA EST"</p>
                <button onClick={() => setShowWinner(false)} className="btn-secondary text-sm mt-5">Cerrar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
