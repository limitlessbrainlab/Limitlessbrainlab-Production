-- Add occupation, handedness, and referred_by columns to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS occupation VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS handedness VARCHAR(20);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS referred_by VARCHAR(255);
