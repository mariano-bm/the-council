import { Router } from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

// ============================================
// LISTA + DETALLE
// ============================================

router.get('/', isAuthenticated, async (req, res) => {
  try {
    const r = await query(`
      SELECT t.*, u.discord_name as creator_name,
             (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as participant_count,
             cp.display_name as champion_name, cp.avatar_url as champion_avatar
      FROM tournaments t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN tournament_participants cp ON t.champion_participant_id = cp.id
      ORDER BY t.created_at DESC
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const t = await query('SELECT * FROM tournaments WHERE id = $1', [req.params.id]);
    if (!t.rows.length) return res.status(404).json({ error: 'Torneo no encontrado' });

    const participants = await query(`
      SELECT p.*, u.discord_name, u.role
      FROM tournament_participants p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.tournament_id = $1
      ORDER BY p.seed NULLS LAST, p.created_at
    `, [req.params.id]);

    const matches = await query(`
      SELECT * FROM tournament_matches WHERE tournament_id = $1
      ORDER BY round, position
    `, [req.params.id]);

    res.json({ ...t.rows[0], participants: participants.rows, matches: matches.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================
// CRUD (admin)
// ============================================

router.post('/', isAdmin, async (req, res) => {
  try {
    const { name, description, mode, best_of, cover_url, prize_1, prize_2, prize_3 } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre obligatorio' });
    await query(`INSERT INTO tournaments (name, description, mode, best_of, cover_url, prize_1, prize_2, prize_3, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [name, description || null, mode || '1v1', best_of || 3, cover_url || null, prize_1 || null, prize_2 || null, prize_3 || null, req.user.id]);
    const created = await query('SELECT * FROM tournaments ORDER BY id DESC LIMIT 1');
    await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'tournament_created', $2)`,
      [req.user.id, JSON.stringify({ name })]);
    res.status(201).json(created.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', isAdmin, async (req, res) => {
  try {
    const fields = ['name','description','mode','best_of','cover_url','prize_1','prize_2','prize_3','status'];
    const updates = [], values = [];
    let idx = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) { updates.push(`${f} = $${idx++}`); values.push(req.body[f]); }
    }
    if (!updates.length) return res.json({ ok: true });
    values.push(req.params.id);
    await query(`UPDATE tournaments SET ${updates.join(', ')} WHERE id = $${idx}`, values);
    const updated = await query('SELECT * FROM tournaments WHERE id = $1', [req.params.id]);
    res.json(updated.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', isAdmin, async (req, res) => {
  try {
    await query('DELETE FROM tournaments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Torneo eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================
// INSCRIPCIÓN (con Discord)
// ============================================

// Anotarse a sí mismo (user logueado)
router.post('/:id/join', isAuthenticated, async (req, res) => {
  try {
    const t = await query('SELECT * FROM tournaments WHERE id = $1', [req.params.id]);
    if (!t.rows.length) return res.status(404).json({ error: 'Torneo no encontrado' });
    if (t.rows[0].status !== 'open') return res.status(400).json({ error: 'Las inscripciones estan cerradas' });

    const exists = await query('SELECT id FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (exists.rows.length) return res.status(409).json({ error: 'Ya estas anotado' });

    // Buscar su brawlhalla_id en el roster si existe
    const roster = await query('SELECT brawlhalla_id, country_code FROM brawlhalla_roster WHERE user_id = $1', [req.user.id]);
    const bh = roster.rows[0] || {};

    await query(`INSERT INTO tournament_participants (tournament_id, user_id, display_name, brawlhalla_id, country_code, avatar_url)
      VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.params.id, req.user.id, req.user.discord_name, bh.brawlhalla_id || null, bh.country_code || 'ar', req.user.avatar_url || null]);

    res.json({ message: 'Te inscribiste al torneo!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/leave', isAuthenticated, async (req, res) => {
  try {
    await query('DELETE FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Te bajaste del torneo' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin agrega participante manual (del roster o custom)
router.post('/:id/participants', isAdmin, async (req, res) => {
  try {
    const { display_name, brawlhalla_id, country_code, user_id, avatar_url } = req.body;
    if (!display_name) return res.status(400).json({ error: 'Nombre obligatorio' });
    await query(`INSERT INTO tournament_participants (tournament_id, user_id, display_name, brawlhalla_id, country_code, avatar_url)
      VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.params.id, user_id || null, display_name, brawlhalla_id || null, country_code || 'ar', avatar_url || null]);
    const r = await query('SELECT * FROM tournament_participants WHERE tournament_id = $1 ORDER BY created_at', [req.params.id]);
    res.status(201).json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/participants/:pid', isAdmin, async (req, res) => {
  try {
    await query('DELETE FROM tournament_participants WHERE id = $1 AND tournament_id = $2', [req.params.pid, req.params.id]);
    res.json({ message: 'Participante eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================
// ARMADOR DE BRACKET (single elimination)
// ============================================

router.post('/:id/generate-bracket', isAdmin, async (req, res) => {
  try {
    const tid = req.params.id;
    const { shuffle = true } = req.body;

    const pRes = await query('SELECT * FROM tournament_participants WHERE tournament_id = $1', [tid]);
    let participants = pRes.rows;
    if (participants.length < 2) return res.status(400).json({ error: 'Necesitas al menos 2 participantes' });

    // Limpiar bracket anterior
    await query('DELETE FROM tournament_matches WHERE tournament_id = $1', [tid]);

    // Seed
    if (shuffle) {
      for (let i = participants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [participants[i], participants[j]] = [participants[j], participants[i]];
      }
    }
    // Guardar seeds
    for (let i = 0; i < participants.length; i++) {
      await query('UPDATE tournament_participants SET seed = $1, eliminated = FALSE WHERE id = $2', [i + 1, participants[i].id]);
    }

    // Bracket size = próxima potencia de 2
    const n = participants.length;
    const size = Math.pow(2, Math.ceil(Math.log2(n)));
    const rounds = Math.log2(size);

    // Slots con byes: rellenar hasta 'size' con nulls distribuidos
    const slots = participants.map(p => p.id);
    while (slots.length < size) slots.push(null);

    // Crear matches por ronda (de la final hacia atrás para tener los ids)
    // Estructura: round 1 = size/2 matches, round 2 = size/4, ... final = 1
    const matchIdByRoundPos = {}; // `${round}_${pos}` -> id

    // Crear de la última ronda (final) a la primera, para poder linkear next_match_id
    for (let round = rounds; round >= 1; round--) {
      const matchesInRound = size / Math.pow(2, round); // round rounds(final)=1
      // OJO: definimos round 1 = primera ronda (más matches). Recalculamos:
    }

    // Rehacemos con convención clara: round 1 = primera (size/2 matches) ... round=rounds = final (1 match)
    // Creamos final primero
    const created = []; // {round, position, id}
    for (let round = rounds; round >= 1; round--) {
      const count = size / Math.pow(2, round); // round=rounds → size/2^rounds = 1 (final). round=1 → size/2
      for (let pos = 0; pos < count; pos++) {
        // next match: el de la ronda siguiente (round+1), posición floor(pos/2), slot pos%2
        let nextId = null, nextSlot = null;
        if (round < rounds) {
          const np = Math.floor(pos / 2);
          nextId = matchIdByRoundPos[`${round + 1}_${np}`];
          nextSlot = pos % 2; // 0 = p1, 1 = p2
        }
        const ins = await query(`INSERT INTO tournament_matches (tournament_id, round, position, next_match_id, next_slot, status)
          VALUES ($1,$2,$3,$4,$5,'pending') RETURNING id`,
          [tid, round, pos, nextId, nextSlot]);
        const mid = ins.rows[0].id;
        matchIdByRoundPos[`${round}_${pos}`] = mid;
        created.push({ round, position: pos, id: mid });
      }
    }

    // Asignar participantes a la ronda 1
    for (let pos = 0; pos < size / 2; pos++) {
      const a = slots[pos * 2];
      const b = slots[pos * 2 + 1];
      const mid = matchIdByRoundPos[`1_${pos}`];
      await query('UPDATE tournament_matches SET p1_participant_id = $1, p2_participant_id = $2 WHERE id = $3', [a, b, mid]);

      // Resolver byes automáticamente: si un slot es null, el otro avanza solo
      if (a && !b) await advanceWinner(mid, a);
      else if (b && !a) await advanceWinner(mid, b);
    }

    await query(`UPDATE tournaments SET status = 'live' WHERE id = $1`, [tid]);
    await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'bracket_generated', $2)`,
      [req.user.id, JSON.stringify({ tournament_id: tid, participants: n })]);

    const matches = await query('SELECT * FROM tournament_matches WHERE tournament_id = $1 ORDER BY round, position', [tid]);
    res.json({ matches: matches.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Helper: marca ganador y lo propaga al siguiente match
async function advanceWinner(matchId, winnerPid) {
  const m = await query('SELECT * FROM tournament_matches WHERE id = $1', [matchId]);
  if (!m.rows.length) return;
  const match = m.rows[0];
  await query('UPDATE tournament_matches SET winner_participant_id = $1, status = $2 WHERE id = $3', [winnerPid, 'done', matchId]);

  // Marcar al perdedor como eliminado
  const loser = match.p1_participant_id === winnerPid ? match.p2_participant_id : match.p1_participant_id;
  if (loser) await query('UPDATE tournament_participants SET eliminated = TRUE WHERE id = $1', [loser]);

  // Propagar al siguiente
  if (match.next_match_id) {
    const slotCol = match.next_slot === 1 ? 'p2_participant_id' : 'p1_participant_id';
    await query(`UPDATE tournament_matches SET ${slotCol} = $1 WHERE id = $2`, [winnerPid, match.next_match_id]);
  }
}

// ============================================
// AVANZAR MATCHES (admin reporta resultado)
// ============================================

router.patch('/:id/matches/:mid', isAdmin, async (req, res) => {
  try {
    const { p1_score, p2_score, winner_participant_id, status } = req.body;
    const mid = req.params.mid;

    if (p1_score !== undefined) await query('UPDATE tournament_matches SET p1_score = $1 WHERE id = $2', [p1_score, mid]);
    if (p2_score !== undefined) await query('UPDATE tournament_matches SET p2_score = $1 WHERE id = $2', [p2_score, mid]);
    if (status) await query('UPDATE tournament_matches SET status = $1 WHERE id = $2', [status, mid]);

    if (winner_participant_id) {
      await advanceWinner(mid, winner_participant_id);
    }

    const matches = await query('SELECT * FROM tournament_matches WHERE tournament_id = $1 ORDER BY round, position', [req.params.id]);
    res.json({ matches: matches.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================
// FINALIZAR — campeón + trofeos
// ============================================

router.post('/:id/finish', isAdmin, async (req, res) => {
  try {
    const tid = req.params.id;
    const t = await query('SELECT * FROM tournaments WHERE id = $1', [tid]);
    if (!t.rows.length) return res.status(404).json({ error: 'Torneo no encontrado' });

    // El campeón = ganador del match final (round más alto)
    const finalM = await query('SELECT * FROM tournament_matches WHERE tournament_id = $1 ORDER BY round DESC, position LIMIT 1', [tid]);
    const champPid = finalM.rows[0]?.winner_participant_id;
    if (!champPid) return res.status(400).json({ error: 'El torneo todavia no tiene campeon (falta la final)' });

    await query('UPDATE tournaments SET status = $1, champion_participant_id = $2 WHERE id = $3', ['finished', champPid, tid]);

    // Otorgar trofeos: campeón (1), finalista (2), semifinalistas (3)
    const champ = await query('SELECT * FROM tournament_participants WHERE id = $1', [champPid]);
    const finalist = finalM.rows[0].p1_participant_id === champPid ? finalM.rows[0].p2_participant_id : finalM.rows[0].p1_participant_id;

    const TROPHIES = [
      { pid: champPid, placement: 1, label: 'Campeón', emoji: '🏆' },
      { pid: finalist, placement: 2, label: 'Finalista', emoji: '🥈' },
    ];
    for (const tr of TROPHIES) {
      if (!tr.pid) continue;
      const p = await query('SELECT user_id FROM tournament_participants WHERE id = $1', [tr.pid]);
      const uid = p.rows[0]?.user_id;
      if (uid) {
        await query(`INSERT INTO trophies (user_id, tournament_id, tournament_name, placement, label, emoji)
          VALUES ($1,$2,$3,$4,$5,$6)`, [uid, tid, t.rows[0].name, tr.placement, tr.label, tr.emoji]);
        // Bonus de puntos al campeón
        if (tr.placement === 1) {
          await query('UPDATE users SET recommender_points = recommender_points + 20 WHERE id = $1', [uid]);
        }
      }
    }

    await query(`INSERT INTO activity_log (user_id, action, details) VALUES ($1, 'tournament_finished', $2)`,
      [req.user.id, JSON.stringify({ tournament: t.rows[0].name, champion: champ.rows[0]?.display_name })]);

    res.json({ champion: champ.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Trofeos de un usuario
router.get('/trophies/user/:userId', isAuthenticated, async (req, res) => {
  try {
    const r = await query('SELECT * FROM trophies WHERE user_id = $1 ORDER BY earned_at DESC', [req.params.userId]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
