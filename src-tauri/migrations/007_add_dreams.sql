CREATE TABLE IF NOT EXISTS dreams (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  analysis TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_dreams_created ON dreams(created_at);
