import passport from 'passport';
import DiscordStrategy from 'passport-discord';
import { query } from './database.js';

const scopes = ['identify', 'guilds'];

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || null);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_CALLBACK_URL,
      scope: scopes,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        const existing = await query(
          'SELECT * FROM users WHERE discord_id = $1',
          [profile.id]
        );

        if (existing.rows.length > 0) {
          // Update avatar and name
          const updated = await query(
            `UPDATE users SET discord_name = $1, avatar_url = $2, updated_at = NOW()
             WHERE discord_id = $3 RETURNING *`,
            [
              profile.username,
              `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
              profile.id,
            ]
          );
          return done(null, updated.rows[0]);
        }

        // Create new user
        const newUser = await query(
          `INSERT INTO users (discord_id, discord_name, avatar_url, role)
           VALUES ($1, $2, $3, 'member') RETURNING *`,
          [
            profile.id,
            profile.username,
            `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
          ]
        );

        // Log activity
        await query(
          `INSERT INTO activity_log (user_id, action, details)
           VALUES ($1, 'user_joined', $2)`,
          [newUser.rows[0].id, JSON.stringify({ discord_name: profile.username })]
        );

        return done(null, newUser.rows[0]);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;
