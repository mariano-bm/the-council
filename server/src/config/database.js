import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('DB pool error', err);
});

export function query(text, params = []) {
  return pool.query(text, params).then(res => ({
    rows: res.rows,
    changes: res.rowCount,
  }));
}

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        discord_id TEXT UNIQUE NOT NULL,
        discord_name TEXT NOT NULL,
        avatar_url TEXT,
        role TEXT DEFAULT 'member',
        council_rank TEXT DEFAULT 'plebeius',
        override_rank TEXT,
        reputation INTEGER DEFAULT 0,
        objectivity_score REAL DEFAULT 50.0,
        recommender_points INTEGER DEFAULT 0,
        last_active TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        steam_app_id INTEGER,
        rawg_slug TEXT,
        cover_url TEXT,
        genres TEXT DEFAULT '[]',
        platforms TEXT DEFAULT '[]',
        metacritic INTEGER,
        description TEXT,
        release_date TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS months (
        id SERIAL PRIMARY KEY,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        phase TEXT DEFAULT 'nomination',
        nomination_start TEXT, nomination_end TEXT,
        voting_start TEXT, voting_end TEXT,
        review_start TEXT, review_end TEXT,
        winning_game_id INTEGER REFERENCES games(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(year, month)
      );

      CREATE TABLE IF NOT EXISTS nominations (
        id SERIAL PRIMARY KEY,
        month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        pitch TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(month_id, user_id, game_id)
      );

      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        rank_position INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(month_id, user_id, game_id)
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        gameplay REAL NOT NULL, story REAL NOT NULL, graphics REAL NOT NULL,
        replayability REAL NOT NULL, group_fun REAL NOT NULL,
        comment TEXT, hours_played REAL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(month_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS badges (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        badge_type TEXT NOT NULL, badge_name TEXT NOT NULL, badge_description TEXT,
        month_id INTEGER, game_id INTEGER,
        earned_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER, action TEXT NOT NULL,
        details TEXT DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS objectivity_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL, month_id INTEGER NOT NULL,
        score REAL NOT NULL, voted_against BOOLEAN DEFAULT FALSE,
        review_score REAL, group_avg REAL, deviation REAL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, month_id)
      );

      CREATE TABLE IF NOT EXISTS game_analytics (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL, month_id INTEGER NOT NULL,
        avg_gameplay REAL, avg_story REAL, avg_graphics REAL,
        avg_replayability REAL, avg_group_fun REAL, total_avg REAL,
        vote_count INTEGER DEFAULT 0, review_count INTEGER DEFAULT 0,
        variance REAL, genres_tags TEXT DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(game_id, month_id)
      );

      CREATE TABLE IF NOT EXISTS rewards (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL, reward_type TEXT NOT NULL,
        reward_name TEXT NOT NULL, reward_data TEXT DEFAULT '{}',
        granted_by INTEGER, granted_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'game',
        description TEXT,
        cover_url TEXT,
        status TEXT DEFAULT 'open',
        points_join INTEGER DEFAULT 5,
        points_skip INTEGER DEFAULT -3,
        max_participants INTEGER,
        created_by INTEGER REFERENCES users(id),
        month_id INTEGER REFERENCES months(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS council_games (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        steam_app_id INTEGER,
        cover_url TEXT,
        genres TEXT DEFAULT '[]',
        synopsis TEXT,
        tryhard_info TEXT,
        added_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS game_guides (
        id SERIAL PRIMARY KEY,
        council_game_id INTEGER NOT NULL REFERENCES council_games(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        upvotes INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS guide_votes (
        id SERIAL PRIMARY KEY,
        guide_id INTEGER NOT NULL REFERENCES game_guides(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vote INTEGER DEFAULT 1,
        UNIQUE(guide_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS activity_signups (
        id SERIAL PRIMARY KEY,
        activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(activity_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS roulette_games (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        cover_url TEXT,
        steam_app_id INTEGER,
        added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS roulette_bets (
        id SERIAL PRIMARY KEY,
        roulette_game_id INTEGER NOT NULL REFERENCES roulette_games(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        points INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tournaments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        mode TEXT DEFAULT '1v1',
        best_of INTEGER DEFAULT 3,
        cover_url TEXT,
        prize_1 TEXT, prize_2 TEXT, prize_3 TEXT,
        status TEXT DEFAULT 'open',
        champion_participant_id INTEGER,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tournament_participants (
        id SERIAL PRIMARY KEY,
        tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        display_name TEXT NOT NULL,
        brawlhalla_id INTEGER,
        country_code TEXT DEFAULT 'ar',
        avatar_url TEXT,
        seed INTEGER,
        eliminated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tournament_matches (
        id SERIAL PRIMARY KEY,
        tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        round INTEGER NOT NULL,
        position INTEGER NOT NULL,
        p1_participant_id INTEGER,
        p2_participant_id INTEGER,
        p1_score INTEGER DEFAULT 0,
        p2_score INTEGER DEFAULT 0,
        winner_participant_id INTEGER,
        next_match_id INTEGER,
        next_slot INTEGER,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS trophies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tournament_id INTEGER,
        tournament_name TEXT,
        placement INTEGER,
        label TEXT,
        emoji TEXT,
        earned_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Seed admin if empty
    const users = await client.query('SELECT COUNT(*) as count FROM users');
    if (parseInt(users.rows[0].count) === 0) {
      await client.query(`INSERT INTO users (discord_id, discord_name, role, recommender_points) VALUES ('000000000000000001', 'El Viejo', 'admin', 42)`);
      const now = new Date();
      const y = now.getFullYear(), m = now.getMonth() + 1;
      const ms = String(m).padStart(2, '0');
      await client.query(`INSERT INTO months (year, month, phase, nomination_start, nomination_end, voting_start, voting_end) VALUES ($1, $2, 'nomination', $3, $4, $5, $6)`,
        [y, m, `${y}-${ms}-01`, `${y}-${ms}-10`, `${y}-${ms}-11`, `${y}-${ms}-15`]);
      await client.query(`INSERT INTO activity_log (user_id, action, details) VALUES (1, 'user_joined', '{"discord_name":"El Viejo"}')`);
      console.log('Seeded admin + current month');
    }

    console.log('Database initialized (Neon PostgreSQL)');
  } finally {
    client.release();
  }
}

export default pool;
