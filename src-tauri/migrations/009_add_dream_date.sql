ALTER TABLE dreams ADD COLUMN date TEXT;
UPDATE dreams SET date = substr(created_at, 1, 10) WHERE date IS NULL;
