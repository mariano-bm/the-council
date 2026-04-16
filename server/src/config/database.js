import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', '..', 'council.db');

let db;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON');
  return db;
}

// Save DB to disk periodically
function save() {
  if (db) {
    const data = db.export();
    writeFileSync(DB_PATH, Buffer.from(data));
  }
}

// Auto-save every 5 seconds
setInterval(save, 5000);
process.on('exit', save);
process.on('SIGINT', () => { save(); process.exit(); });

export function query(text, params = []) {
  if (!db) throw new Error('DB not initialized. Call initDatabase() first.');

  // Convert $1 $2 style to ? style
  let sql = text;
  let idx = 1;
  while (sql.includes(`$${idx}`)) {
    sql = sql.replace(`$${idx}`, '?');
    idx++;
  }
  sql = sql.trim();

  const isSelect = /^\s*(SELECT|WITH)/i.test(sql);

  try {
    if (isSelect) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      // Parse JSON fields
      return { rows: rows.map(parseJsonFields) };
    } else {
      db.run(sql, params);
      const changes = db.getRowsModified();
      // For INSERT, get last id
      const lastId = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0];
      return { rows: [], changes, lastInsertRowid: lastId };
    }
  } catch (err) {
    if (err.message?.includes('UNIQUE constraint')) {
      err.code = '23505';
    }
    throw err;
  }
}

export async function initDatabase() {
  await getDb();

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id TEXT UNIQUE NOT NULL,
    discord_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'member',
    council_rank TEXT DEFAULT 'plebeius',
    override_rank TEXT DEFAULT NULL,
    reputation INTEGER DEFAULT 0,
    objectivity_score REAL DEFAULT 50.0,
    recommender_points INTEGER DEFAULT 0,
    last_active TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS games (
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
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS months (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    phase TEXT DEFAULT 'nomination',
    nomination_start TEXT, nomination_end TEXT,
    voting_start TEXT, voting_end TEXT,
    review_start TEXT, review_end TEXT,
    winning_game_id INTEGER REFERENCES games(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(year, month)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS nominations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month_id INTEGER NOT NULL REFERENCES months(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    game_id INTEGER NOT NULL REFERENCES games(id),
    pitch TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(month_id, user_id, game_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month_id INTEGER NOT NULL REFERENCES months(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    game_id INTEGER NOT NULL REFERENCES games(id),
    rank_position INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(month_id, user_id, game_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month_id INTEGER NOT NULL REFERENCES months(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    game_id INTEGER NOT NULL REFERENCES games(id),
    gameplay REAL NOT NULL, story REAL NOT NULL, graphics REAL NOT NULL,
    replayability REAL NOT NULL, group_fun REAL NOT NULL,
    comment TEXT, hours_played REAL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(month_id, user_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    badge_type TEXT NOT NULL, badge_name TEXT NOT NULL, badge_description TEXT,
    month_id INTEGER, game_id INTEGER,
    earned_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, action TEXT NOT NULL,
    details TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS objectivity_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL, month_id INTEGER NOT NULL,
    score REAL NOT NULL, voted_against INTEGER DEFAULT 0,
    review_score REAL, group_avg REAL, deviation REAL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, month_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS game_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL, month_id INTEGER NOT NULL,
    avg_gameplay REAL, avg_story REAL, avg_graphics REAL,
    avg_replayability REAL, avg_group_fun REAL, total_avg REAL,
    vote_count INTEGER DEFAULT 0, review_count INTEGER DEFAULT 0,
    variance REAL, genres_tags TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(game_id, month_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL, reward_type TEXT NOT NULL,
    reward_name TEXT NOT NULL, reward_data TEXT DEFAULT '{}',
    granted_by INTEGER, granted_at TEXT DEFAULT (datetime('now'))
  )`);

  // Seed admin if empty
  const users = db.exec('SELECT COUNT(*) FROM users');
  if (users[0]?.values[0][0] === 0) {
    db.run(`INSERT INTO users (discord_id, discord_name, role, recommender_points) VALUES ('000000000000000001', 'El Viejo', 'admin', 42)`);
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth() + 1;
    const ms = String(m).padStart(2, '0');
    db.run(`INSERT INTO months (year, month, phase, nomination_start, nomination_end, voting_start, voting_end) VALUES (${y}, ${m}, 'nomination', '${y}-${ms}-01', '${y}-${ms}-10', '${y}-${ms}-11', '${y}-${ms}-15')`);
    db.run(`INSERT INTO activity_log (user_id, action, details) VALUES (1, 'user_joined', '{"discord_name":"El Viejo"}')`);
    db.run(`INSERT INTO activity_log (user_id, action, details) VALUES (1, 'month_created', '{"year":${y},"month":${m}}')`);
    console.log('Seeded admin + current month');
    save();
  }
}

function parseJsonFields(row) {
  if (!row) return row;
  const parsed = { ...row };
  for (const [key, val] of Object.entries(parsed)) {
    if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
      try { parsed[key] = JSON.parse(val); } catch {}
    }
  }
  return parsed;
}

export default db;
