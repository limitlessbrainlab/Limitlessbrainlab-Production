-- =====================================================
-- Care Program Progress Table Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Create care_program_progress table
CREATE TABLE IF NOT EXISTS care_program_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_email VARCHAR(255) UNIQUE NOT NULL,

    -- Program progress
    current_week INTEGER DEFAULT 1 CHECK (current_week >= 1 AND current_week <= 8),
    start_date TIMESTAMP WITH TIME ZONE,

    -- Checked items stored as JSONB (e.g., {"cognition-kpis": true, "stress-breathing": true})
    checked_items JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_care_progress_patient_email ON care_program_progress(patient_email);
CREATE INDEX IF NOT EXISTS idx_care_progress_current_week ON care_program_progress(current_week);

-- Enable Row Level Security
ALTER TABLE care_program_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert care_program_progress" ON care_program_progress
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view care_program_progress" ON care_program_progress
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update care_program_progress" ON care_program_progress
    FOR UPDATE USING (true);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_care_program_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_care_program_updated_at ON care_program_progress;
CREATE TRIGGER trigger_care_program_updated_at
    BEFORE UPDATE ON care_program_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_care_program_updated_at();

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get progress for a patient
-- SELECT * FROM care_program_progress WHERE patient_email = 'patient@email.com';

-- Get all patients in a specific week
-- SELECT patient_email, current_week, start_date FROM care_program_progress WHERE current_week = 3;

-- Count completed items for a patient
-- SELECT patient_email,
--   (SELECT COUNT(*) FROM jsonb_object_keys(checked_items) WHERE checked_items->>jsonb_object_keys(checked_items) = 'true') as completed_count
-- FROM care_program_progress;
