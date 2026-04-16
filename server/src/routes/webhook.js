import { Router } from 'express';
import { isAdmin } from '../middleware/auth.js';
import { sendDiscordNotification } from '../services/discord.js';

const router = Router();

// Enviar notificación al canal de Discord
router.post('/notify', isAdmin, async (req, res) => {
  try {
    const { message, embed } = req.body;
    await sendDiscordNotification(message, embed);
    res.json({ message: 'Notificación enviada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
