-- Some SQLite adapters do not enable foreign-key enforcement on every pooled
-- connection. Keep group deletion atomic even there: this trigger runs inside
-- the same statement that deletes the parent row.
CREATE TRIGGER IF NOT EXISTS delete_insights_with_group
BEFORE DELETE ON insight_groups
FOR EACH ROW
BEGIN
  DELETE FROM insights WHERE group_id = OLD.id;
END;
