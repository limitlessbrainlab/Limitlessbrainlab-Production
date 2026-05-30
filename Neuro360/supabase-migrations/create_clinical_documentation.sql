-- ================================================
-- Clinical Documentation Table
-- Run this in Supabase SQL Editor
-- ================================================

-- Create the table
CREATE TABLE IF NOT EXISTS clinical_documentation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID,
    clinic_id UUID,
    patient_name TEXT,

    -- Examination Notes (per document type)
    examination_notes JSONB DEFAULT '{}',

    -- Recording Protocol fields
    recording_date DATE,
    duration TEXT,
    eyes_open BOOLEAN DEFAULT FALSE,
    eyes_closed BOOLEAN DEFAULT FALSE,
    both_conditions BOOLEAN DEFAULT FALSE,
    hyperventilation BOOLEAN DEFAULT FALSE,
    photic_stimulation BOOLEAN DEFAULT FALSE,
    cognitive_task BOOLEAN DEFAULT FALSE,
    cognitive_task_details TEXT,
    other_task BOOLEAN DEFAULT FALSE,
    other_task_details TEXT,
    electrode_system TEXT,

    -- Administrative Details fields
    reporting_clinician TEXT,
    date_of_report DATE,
    institution_name TEXT,
    partner_platform TEXT,
    unique_report_id TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    contact_address TEXT,

    -- File URLs (JSONB to store multiple file references)
    file_urls JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clinical_documentation_patient_id ON clinical_documentation(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documentation_clinic_id ON clinical_documentation(clinic_id);

-- Disable RLS for easier access (you can enable later with proper policies)
ALTER TABLE clinical_documentation DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON clinical_documentation TO authenticated;
GRANT ALL ON clinical_documentation TO anon;
GRANT ALL ON clinical_documentation TO service_role;

-- Success message
SELECT 'clinical_documentation table created successfully!' as result;
