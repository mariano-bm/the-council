import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', '..', 'council.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id TEXT UNIQUE NOT NULL,
    discord_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    council_rank TEXT DEFAULT 'plebeius',
    override_rank TEXT DEFAULT NULL,
    reputation INTEGER DEFAULT 0,
    objectivity_score REAL DEFAULT 50.0,
    recommender_points INTEGER DEFAULT 0,
    last_active TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    steam_app_id INTEGER,
    rawg_slug TEXT,
    cover_url TEXT,
    genres TEXT DEFAULT '[]',
    platforms TEXT DEFAULT '[]',
    metacritic INTEGER,
    description TEXT,
    release_date TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS months (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    phase TEXT DEFAULT 'nomination' CHECK (phase IN ('nomination', 'voting', 'playing', 'review', 'completed')),
    nomination_start TEXT,
    nomination_end TEXT,
    voting_start TEXT,
    voting_end TEXT,
    review_start TEXT,
    review_end TEXT,
    winning_game_id INTEGER REFERENCES games(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(year, month)
  );

  CREATE TABLE IF NOT EXISTS nominations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    pitch TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(month_id, user_id, game_id)
  );

  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    rank_position INTEGER NOT NULL CHECK (rank_position >= 1),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(month_id, user_id, game_id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    gameplay REAL NOT NULL CHECK (gameplay >= 1 AND gameplay <= 10),
    story REAL NOT NULL CHECK (story >= 1 AND story <= 10),
    graphics REAL NOT NULL CHECK (graphics >= 1 AND graphics <= 10),
    replayability REAL NOT NULL CHECK (replayability >= 1 AND replayability <= 10),
    group_fun REAL NOT NULL CHECK (group_fun >= 1 AND group_fun <= 10),
    comment TEXT,
    hours_played REAL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(month_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_description TEXT,
    month_id INTEGER REFERENCES months(id),
    game_id INTEGER REFERENCES games(id),
    earned_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS objectivity_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
    score REAL NOT NULL,
    voted_against INTEGER DEFAULT 0,
    review_score REAL,
    group_avg REAL,
    deviation REAL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, month_id)
  );

  CREATE TABLE IF NOT EXISTS game_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
    avg_gameplay REAL,
    avg_story REAL,
    avg_graphics REAL,
    avg_replayability REAL,
    avg_group_fun REAL,
    total_avg REAL,
    vote_count INTEGER DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    variance REAL,
    genres_tags TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(game_id, month_id)
  );

  CREATE TABLE IF NOT EXISTS rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_type TEXT NOT NULL,
    reward_name TEXT NOT NULL,
    reward_data TEXT DEFAULT '{}',
    granted_by INTEGER REFERENCES users(id),
    granted_at TEXT DEFAULT (datetime('now'))
  );
`);

console.log('Database initialized at', DB_PATH);

// Seed: create admin user "El Viejo" if doesn't exist
const existing = db.prepare('SELECT id FROM users WHERE discord_id = ?').get('000000000000000001');
if (!existing) {
  db.prepare(`
    INSERT INTO users (discord_id, discord_name, avatar_url, role, recommender_points)
    VALUES (?, ?, ?, ?, ?)
  `).run('000000000000000001', 'El Viejo', null, 'admin', 42);

  // Seed current month
  const now = new Date();
  db.prepare(`
    INSERT INTO months (year, month, phase, nomination_start, nomination_end, voting_start, voting_end)
    VALUES (?, ?, 'nomination', ?, ?, ?, ?)
  `).run(
    now.getFullYear(), now.getMonth() + 1,
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-10`,
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-11`,
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`
  );

  // Seed activity
  db.prepare(`INSERT INTO activity_log (user_id, action, details) VALUES (1, 'user_joined', '{"discord_name":"El Viejo"}')`).run();
  db.prepare(`INSERT INTO activity_log (user_id, action, details) VALUES (1, 'month_created', '{"year":${now.getFullYear()},"month":${now.getMonth() + 1}}')`).run();

  console.log('Seeded admin user + current month');
}

db.close();
