CREATE TABLE IF NOT EXISTS patient_intake_form (
  id INTEGER PRIMARY KEY DEFAULT 1,
  reason_for_seeking TEXT,
  current_concerns TEXT,
  previous_therapy TEXT,
  current_medications TEXT,
  family_relationships TEXT,
  significant_life_events TEXT,
  sleep_patterns TEXT,
  physical_health TEXT,
  strengths_support TEXT,
  therapy_expectations TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
