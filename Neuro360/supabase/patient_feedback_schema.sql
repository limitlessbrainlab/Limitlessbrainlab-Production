-- =====================================================
-- Patient Feedback Table Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Create patient_feedback table
CREATE TABLE IF NOT EXISTS patient_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id VARCHAR(100), -- Patient UID from patients table
    patient_email VARCHAR(255),
    patient_name VARCHAR(255),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating
    category VARCHAR(50) DEFAULT 'general', -- general, feature, bug, support, suggestion
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new', -- new, reviewed, resolved
    admin_notes TEXT, -- For admin to add notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_patient_feedback_patient_id ON patient_feedback(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_feedback_email ON patient_feedback(patient_email);
CREATE INDEX IF NOT EXISTS idx_patient_feedback_category ON patient_feedback(category);
CREATE INDEX IF NOT EXISTS idx_patient_feedback_status ON patient_feedback(status);
CREATE INDEX IF NOT EXISTS idx_patient_feedback_created ON patient_feedback(created_at DESC);

-- Enable Row Level Security
ALTER TABLE patient_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert feedback
CREATE POLICY "Anyone can insert feedback" ON patient_feedback
    FOR INSERT WITH CHECK (true);

-- Policy: Anyone can view all feedback (for simplicity)
-- You can restrict this later based on your auth setup
CREATE POLICY "Anyone can view feedback" ON patient_feedback
    FOR SELECT USING (true);

-- Policy: Anyone can update feedback (for admin use)
CREATE POLICY "Anyone can update feedback" ON patient_feedback
    FOR UPDATE USING (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_patient_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_patient_feedback_updated_at ON patient_feedback;
CREATE TRIGGER trigger_update_patient_feedback_updated_at
    BEFORE UPDATE ON patient_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_feedback_updated_at();

-- =====================================================
-- SAMPLE QUERIES FOR ADMIN DASHBOARD
-- =====================================================

-- View all feedback (for admin)
-- SELECT * FROM patient_feedback ORDER BY created_at DESC;

-- View feedback by category
-- SELECT * FROM patient_feedback WHERE category = 'bug' ORDER BY created_at DESC;

-- View unreviewed feedback
-- SELECT * FROM patient_feedback WHERE status = 'new' ORDER BY created_at DESC;

-- Get feedback statistics
-- SELECT
--     category,
--     COUNT(*) as count,
--     AVG(rating) as avg_rating
-- FROM patient_feedback
-- GROUP BY category;

-- Update feedback status (for admin)
-- UPDATE patient_feedback
-- SET status = 'reviewed', admin_notes = 'Looking into this issue'
-- WHERE id = 'feedback-uuid-here';
