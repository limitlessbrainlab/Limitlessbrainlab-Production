-- =====================================================
-- Nootropics Eligibility & Saved Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Create nootropics_eligibility table
CREATE TABLE IF NOT EXISTS nootropics_eligibility (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_email VARCHAR(255) UNIQUE NOT NULL,
    is_eligible BOOLEAN DEFAULT false,
    eligibility_checks JSONB DEFAULT '{}', -- Stores which checks were confirmed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nootropics_elig_email ON nootropics_eligibility(patient_email);

-- Enable Row Level Security
ALTER TABLE nootropics_eligibility ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert nootropics_eligibility" ON nootropics_eligibility
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view nootropics_eligibility" ON nootropics_eligibility
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update nootropics_eligibility" ON nootropics_eligibility
    FOR UPDATE USING (true);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_nootropics_elig_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_nootropics_elig_updated_at ON nootropics_eligibility;
CREATE TRIGGER trigger_nootropics_elig_updated_at
    BEFORE UPDATE ON nootropics_eligibility
    FOR EACH ROW
    EXECUTE FUNCTION update_nootropics_elig_updated_at();

-- =====================================================
-- Nootropics Saved Table (for saving supplements)
-- =====================================================

CREATE TABLE IF NOT EXISTS nootropics_saved (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_email VARCHAR(255) NOT NULL,
    supplement_id VARCHAR(100) NOT NULL, -- e.g., 'ashwagandha', 'lions-mane', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint to prevent duplicates
    UNIQUE(patient_email, supplement_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nootropics_saved_email ON nootropics_saved(patient_email);
CREATE INDEX IF NOT EXISTS idx_nootropics_saved_supplement ON nootropics_saved(supplement_id);

-- Enable Row Level Security
ALTER TABLE nootropics_saved ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert nootropics_saved" ON nootropics_saved
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view nootropics_saved" ON nootropics_saved
    FOR SELECT USING (true);

CREATE POLICY "Anyone can delete nootropics_saved" ON nootropics_saved
    FOR DELETE USING (true);

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Check if patient is eligible
-- SELECT is_eligible FROM nootropics_eligibility WHERE patient_email = 'patient@email.com';

-- Get saved supplements for a patient
-- SELECT supplement_id FROM nootropics_saved WHERE patient_email = 'patient@email.com';

-- Count saved supplements per patient
-- SELECT patient_email, COUNT(*) as saved_count
-- FROM nootropics_saved
-- GROUP BY patient_email;

-- Get most saved supplements (for analytics)
-- SELECT supplement_id, COUNT(*) as save_count
-- FROM nootropics_saved
-- GROUP BY supplement_id
-- ORDER BY save_count DESC;
