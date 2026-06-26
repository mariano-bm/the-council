import { motion } from 'framer-motion';
import { Crown, Swords } from 'lucide-react';

// Nombre de ronda según cuántas quedan hasta la final
function roundLabel(round, totalRounds) {
  const fromFinal = totalRounds - round; // 0 = final
  if (fromFinal === 0) return 'Final';
  if (fromFinal === 1) return 'Semifinal';
  if (fromFinal === 2) return 'Cuartos';
  if (fromFinal === 3) return 'Octavos';
  return `Ronda ${round}`;
}

function ParticipantRow({ pid, name, score, isWinner, isBye, accent }) {
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 transition-colors ${
      isWinner ? 'bg-medieval-gold/10' : ''
    }`}>
      <span className={`flex-1 truncate text-xs font-medium ${
        isWinner ? 'text-medieval-gold' : pid ? 'text-white/70' : 'text-white/20 italic'
      }`}>
        {name || (isBye ? 'bye' : '—')}
      </span>
      {pid && (
        <span className={`font-mono text-xs font-bold w-5 text-center ${isWinner ? 'text-medieval-gold' : 'text-white/40'}`}>
          {score ?? 0}
        </span>
      )}
    </div>
  );
}

/**
 * Bracket single-elimination.
 * Props: matches[], participants[], onMatchClick(match) (admin), isAdmin
 */
export default function Bracket({ matches, participants, onMatchClick, isAdmin }) {
  if (!matches?.length) {
    return (
      <div className="text-center py-16 text-white/25">
        <Swords className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>El bracket todavía no fue generado</p>
        <p className="text-[10px] font-mono text-medieval-gold/20 mt-1 uppercase tracking-wider">NONDUM ORDINATUM</p>
      </div>
    );
  }

  const pById = Object.fromEntries((participants || []).map(p => [p.id, p]));
  const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);
  const totalRounds = Math.max(...rounds);
  const byRound = rounds.map(r => matches.filter(m => m.round === r).sort((a, b) => a.position - b.position));

  const champion = matches.find(m => m.round === totalRounds)?.winner_participant_id;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-min">
        {byRound.map((roundMatches, ri) => {
          const round = rounds[ri];
          const isFinal = round === totalRounds;
          return (
            <div key={round} className="flex flex-col justify-around gap-4 min-w-[200px]">
              <p className={`text-[10px] font-mono uppercase tracking-[0.2em] text-center mb-1 ${
                isFinal ? 'text-medieval-gold/60' : 'text-white/25'
              }`}>
                {roundLabel(round, totalRounds)}
              </p>
              {roundMatches.map((m, mi) => {
                const p1 = m.p1_participant_id ? pById[m.p1_participant_id] : null;
                const p2 = m.p2_participant_id ? pById[m.p2_participant_id] : null;
                const w = m.winner_participant_id;
                const clickable = isAdmin && p1 && p2 && m.status !== 'done';
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (ri * 0.06) + (mi * 0.03) }}
                    onClick={clickable ? () => onMatchClick(m) : undefined}
                    className={`rounded-lg overflow-hidden border transition-all relative ${
                      isFinal ? 'border-medieval-gold/40 shadow-neon-gold' : 'border-medieval-gold/10'
                    } ${clickable ? 'cursor-pointer hover:border-medieval-gold/40' : ''} bg-council-darker/60 backdrop-blur-sm divide-y divide-white/[0.04]`}
                  >
                    {isFinal && champion && (
                      <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 text-medieval-gold z-10"
                        style={{ filter: 'drop-shadow(0 0 6px rgba(212,168,71,0.6))' }} />
                    )}
                    <ParticipantRow pid={m.p1_participant_id} name={p1?.display_name} score={m.p1_score} isWinner={w === m.p1_participant_id} isBye={!m.p1_participant_id} />
                    <ParticipantRow pid={m.p2_participant_id} name={p2?.display_name} score={m.p2_score} isWinner={w === m.p2_participant_id} isBye={!m.p2_participant_id} />
                    {clickable && (
                      <div className="px-2 py-1 bg-medieval-gold/5 text-center">
                        <span className="text-[8px] font-mono text-medieval-gold/50 uppercase tracking-wider">click para reportar</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
