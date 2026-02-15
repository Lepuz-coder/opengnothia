ALTER TABLE sessions ADD COLUMN total_input_tokens INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN total_output_tokens INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN total_cost REAL DEFAULT 0;
ALTER TABLE sessions ADD COLUMN model_used TEXT;
