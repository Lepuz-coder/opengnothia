CREATE TABLE IF NOT EXISTS user_profile (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name TEXT,
  goals TEXT, -- JSON array of strings
  approach TEXT DEFAULT 'balanced', -- 'practical' | 'depth' | 'balanced'
  preferred_session_time TEXT DEFAULT '20:00',
  session_duration_minutes INTEGER DEFAULT 50,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  mood_before INTEGER,
  mood_after INTEGER,
  messages TEXT NOT NULL DEFAULT '[]', -- JSON array of messages
  summary TEXT, -- JSON: themes, defenses, insights, homework
  status TEXT DEFAULT 'active', -- 'active' | 'completed' | 'abandoned'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  mood INTEGER NOT NULL,
  energy INTEGER NOT NULL,
  sleep INTEGER NOT NULL,
  had_dream INTEGER DEFAULT 0,
  dream_note TEXT,
  tags TEXT DEFAULT '[]', -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date)
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  content TEXT NOT NULL,
  mood INTEGER,
  tags TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS theme_tracking (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  theme TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
);
