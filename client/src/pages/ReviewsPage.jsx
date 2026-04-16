import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import ScoreBadge from '../components/ui/ScoreBadge';
import Avatar from '../components/ui/Avatar';
import RadarChart from '../components/ui/RadarChart';
import { Star, Send, MessageSquare } from 'lucide-react';
import { getScoreColor } from '../utils/helpers';

const CATEGORIES = [
  { key: 'gameplay', label: 'Gameplay', icon: '🎮' },
  { key: 'story', label: 'Historia / Narrativa', icon: '📖' },
  { key: 'graphics', label: 'Gráficos / Arte', icon: '🎨' },
  { key: 'replayability', label: 'Rejugabilidad', icon: '🔄' },
  { key: 'group_fun', label: 'Diversión Grupal', icon: '🎉' },
];

export default function ReviewsPage() {
  const { data, loading, refetch } = useApi('/reviews/current');
  const [scores, setScores] = useState({
    gameplay: 7, story: 7, graphics: 7, replayability: 7, group_fun: 7,
  });
  const [comment, setComment] = useState('');
  const [hoursPlayed, setHoursPlayed] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reviews = data?.reviews || [];
  const month = data?.month;
  const myReview = data?.myReview;
  const averages = data?.averages;

  function setScore(key, val) {
    setScores(prev => ({ ...prev, [key]: Math.max(1, Math.min(10, val)) }));
  }

  async function submitReview() {
    setSubmitting(true);
    try {
      await api.post('/reviews', {
        ...scores,
        comment: comment.trim() || null,
        hours_played: hoursPlayed ? parseFloat(hoursPlayed) : null,
      });
      refetch();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!month) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/40">
        <Star className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-lg">No hay fase de review activa</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Star className="w-6 h-6 text-neon-amber" />
          Reviews — {month.game_name}
        </h1>
        <p className="text-white/40 text-sm mt-1">{reviews.length} reviews enviadas</p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Review form / my review */}
        <div className="col-span-2 space-y-4">
          <GlassCard>
            <h3 className="font-semibold text-white/80 mb-4">
              {myReview ? 'Tu Review' : 'Puntuar Juego'}
            </h3>

            <div className="space-y-4">
              {CATEGORIES.map(({ key, label, icon }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-white/60">
                      {icon} {label}
                    </span>
                    <span className={`font-mono font-bold text-lg ${getScoreColor(scores[key])}`}>
                      {scores[key].toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={myReview ? parseFloat(myReview[key]) : scores[key]}
                    onChange={e => setScore(key, parseFloat(e.target.value))}
                    disabled={!!myReview}
                    className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                               [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                               [&::-webkit-slider-thumb]:bg-neon-violet [&::-webkit-slider-thumb]:cursor-pointer
                               [&::-webkit-slider-thumb]:shadow-neon-violet"
                  />
                </div>
              ))}
            </div>

            {!myReview && (
              <>
                <div className="mt-4">
                  <label className="text-sm text-white/40 mb-1 block">Horas jugadas (opcional)</label>
                  <input
                    type="number"
                    value={hoursPlayed}
                    onChange={e => setHoursPlayed(e.target.value)}
                    placeholder="ej: 12"
                    className="input-field"
                  />
                </div>
                <div className="mt-4">
                  <label className="text-sm text-white/40 mb-1 block">Comentario (opcional)</label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="¿Qué te pareció el juego?"
                    rows={3}
                    className="input-field resize-none"
                  />
                </div>
                <button
                  onClick={submitReview}
                  disabled={submitting}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Enviando...' : 'Enviar Review'}
                </button>
              </>
            )}
          </GlassCard>
        </div>

        {/* Group results */}
        <div className="col-span-3 space-y-4">
          {/* Radar chart */}
          {reviews.length > 0 && (
            <GlassCard>
              <h3 className="font-semibold text-white/80 mb-2">Radar de Puntajes</h3>
              <RadarChart reviews={reviews} averages={averages} />
            </GlassCard>
          )}

          {/* Group averages */}
          {averages && (
            <GlassCard>
              <h3 className="font-semibold text-white/80 mb-4">Puntaje Grupal</h3>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-neon flex items-center justify-center">
                  <span className="font-mono font-black text-3xl text-white">
                    {averages.total}
                  </span>
                </div>
              </div>
              <div className="flex justify-center gap-4">
                {CATEGORIES.map(({ key, label, icon }) => (
                  <ScoreBadge key={key} score={averages[key]} label={icon} />
                ))}
              </div>
            </GlassCard>
          )}

          {/* Individual reviews */}
          <div className="space-y-3">
            {reviews.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-panel p-4 flex items-start gap-3"
              >
                <Avatar src={r.avatar_url} name={r.discord_name} size="md" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white/80">{r.discord_name}</span>
                    <div className="flex gap-1.5">
                      {CATEGORIES.map(({ key }) => (
                        <ScoreBadge key={key} score={r[key]} size="sm" />
                      ))}
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-white/40 mt-2 flex items-start gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      {r.comment}
                    </p>
                  )}
                  {r.hours_played && (
                    <span className="text-[10px] text-white/20 mt-1 block">
                      {r.hours_played}h jugadas
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
