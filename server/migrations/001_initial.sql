-- The Council - Schema Inicial
-- ==========================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  discord_id VARCHAR(32) UNIQUE NOT NULL,
  discord_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  council_rank VARCHAR(30) DEFAULT 'plebeius',
  override_rank VARCHAR(30) DEFAULT NULL,
  reputation INTEGER DEFAULT 0,
  objectivity_score DECIMAL(5,2) DEFAULT 50.00,
  recommender_points INTEGER DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  steam_app_id INTEGER,
  rawg_slug VARCHAR(255),
  cover_url TEXT,
  genres TEXT[] DEFAULT '{}',
  platforms TEXT[] DEFAULT '{}',
  metacritic INTEGER,
  description TEXT,
  release_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS months (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  phase VARCHAR(20) DEFAULT 'nomination' CHECK (phase IN ('nomination', 'voting', 'playing', 'review', 'completed')),
  nomination_start DATE,
  nomination_end DATE,
  voting_start DATE,
  voting_end DATE,
  review_start DATE,
  review_end DATE,
  winning_game_id INTEGER REFERENCES games(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, month)
);

CREATE TABLE IF NOT EXISTS nominations (
  id SERIAL PRIMARY KEY,
  month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  pitch TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(month_id, user_id, game_id)
);

CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  rank_position INTEGER NOT NULL CHECK (rank_position >= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(month_id, user_id, game_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  gameplay DECIMAL(3,1) NOT NULL CHECK (gameplay >= 1 AND gameplay <= 10),
  story DECIMAL(3,1) NOT NULL CHECK (story >= 1 AND story <= 10),
  graphics DECIMAL(3,1) NOT NULL CHECK (graphics >= 1 AND graphics <= 10),
  replayability DECIMAL(3,1) NOT NULL CHECK (replayability >= 1 AND replayability <= 10),
  group_fun DECIMAL(3,1) NOT NULL CHECK (group_fun >= 1 AND group_fun <= 10),
  comment TEXT,
  hours_played DECIMAL(5,1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(month_id, user_id)
);

CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  badge_description TEXT,
  month_id INTEGER REFERENCES months(id),
  game_id INTEGER REFERENCES games(id),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS objectivity_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  voted_against BOOLEAN DEFAULT FALSE,
  review_score DECIMAL(3,1),
  group_avg DECIMAL(3,1),
  deviation DECIMAL(3,1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month_id)
);

-- Tabla para futuro sistema de IA
CREATE TABLE IF NOT EXISTS game_analytics (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  avg_gameplay DECIMAL(3,1),
  avg_story DECIMAL(3,1),
  avg_graphics DECIMAL(3,1),
  avg_replayability DECIMAL(3,1),
  avg_group_fun DECIMAL(3,1),
  total_avg DECIMAL(3,1),
  vote_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  variance DECIMAL(5,2),
  genres_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, month_id)
);

-- Sessions table para express-session
CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (sid)
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON session (expire);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_nominations_month ON nominations(month_id);
CREATE INDEX IF NOT EXISTS idx_votes_month ON votes(month_id);
CREATE INDEX IF NOT EXISTS idx_reviews_month ON reviews(month_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id);
CREATE INDEX IF NOT EXISTS idx_objectivity_user ON objectivity_history(user_id);
CREATE INDEX IF NOT EXISTS idx_games_steam ON games(steam_app_id);
