import { Router } from 'express';
import { query } from '../config/database.js';

const router = Router();

const DISCORD_API = 'https://discord.com/api/v10';
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const CALLBACK_URL = process.env.DISCORD_CALLBACK_URL || 'http://localhost:3001/api/auth/discord/callback';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5174';

// Step 1: Redirect to Discord
router.get('/discord', (req, res) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    response_type: 'code',
    scope: 'identify',
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

// Step 2: Discord callback — exchange code for token, get user, create session
router.get('/discord/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect(`${CLIENT_URL}?error=no_code`);

  try {
    // Exchange code for token
    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: CALLBACK_URL,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('Discord token error:', tokenData);
      return res.redirect(`${CLIENT_URL}?error=token_failed`);
    }

    // Get user info
    const userRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const discordUser = await userRes.json();
    if (!discordUser.id) {
      return res.redirect(`${CLIENT_URL}?error=user_failed`);
    }

    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : null;

    // Check if user exists
    const existing = query('SELECT * FROM users WHERE discord_id = ?', [discordUser.id]);

    let userId;
    if (existing.rows.length > 0) {
      // Update name and avatar
      query('UPDATE users SET discord_name = ?, avatar_url = ?, last_active = datetime("now"), updated_at = datetime("now") WHERE discord_id = ?',
        [discordUser.username, avatarUrl, discordUser.id]);
      userId = existing.rows[0].id;
    } else {
      // Create new user
      query('INSERT INTO users (discord_id, discord_name, avatar_url) VALUES (?, ?, ?)',
        [discordUser.id, discordUser.username, avatarUrl]);
      const created = query('SELECT * FROM users WHERE discord_id = ?', [discordUser.id]);
      userId = created.rows[0].id;

      query(`INSERT INTO activity_log (user_id, action, details) VALUES (?, 'user_joined', ?)`,
        [userId, JSON.stringify({ discord_name: discordUser.username })]);
    }

    // Set session
    req.session.userId = userId;
    res.redirect(CLIENT_URL);

  } catch (err) {
    console.error('Discord auth error:', err);
    res.redirect(`${CLIENT_URL}?error=auth_failed`);
  }
});

// Current user
router.get('/me', (req, res) => {
  if (req.session.userId) {
    const result = query('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    if (result.rows.length) return res.json({ user: result.rows[0] });
  }
  res.json({ user: null });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Sesion cerrada' });
});

export default router;
