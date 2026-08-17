CREATE TABLE IF NOT EXISTS course_progress (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  step_index INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked',
  messages TEXT DEFAULT '[]',
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id, step_index)
);
